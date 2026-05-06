import { FridgeModelInfo, Compartment } from '../types/unified';

export interface UserLayout {
  id: string;
  fridgeModelId: string; // ID base do modelo (brand-model-capacity)
  brand: string;
  model: string;
  capacity: number;
  compartments: Compartment[];
  userId?: string;
  userName?: string;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  verificationCount: number;
  reports: number;
  source: 'user_edit' | 'crowdsourced' | 'verified';
  metadata?: {
    originalTemplate?: string;
    editReason?: string;
    confidence?: number;
    images?: string[];
  };
}

export interface LayoutSearchKey {
  brand: string;
  model: string;
  capacity: number;
}

class LayoutPersistenceService {
  private readonly STORAGE_KEY = 'fridge_layouts_user_contributions';
  private readonly CACHE_KEY = 'fridge_layouts_cache';
  private readonly VERIFIED_KEY = 'fridge_layouts_verified';

  // Salvar layout editado pelo usuário
  async saveUserLayout(
    modelInfo: FridgeModelInfo,
    compartments: Compartment[],
    userId?: string,
    userName?: string,
    editReason?: string
  ): Promise<UserLayout> {
    const layout: UserLayout = {
      id: this.generateLayoutId(modelInfo),
      fridgeModelId: this.generateModelKey(modelInfo),
      brand: modelInfo.brand,
      model: modelInfo.model,
      capacity: modelInfo.capacity,
      compartments,
      userId,
      userName: userName || 'Anônimo',
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: false,
      verificationCount: 0,
      reports: 0,
      source: 'user_edit',
      metadata: {
        editReason,
        confidence: this.calculateLayoutConfidence(compartments, modelInfo.capacity)
      }
    };

    // Salvar localmente
    await this.saveLayoutLocal(layout);
    
    // Tentar sincronizar com backend (se disponível)
    try {
      await this.syncLayoutToBackend(layout);
    } catch (error) {
      console.warn('Falha ao sincronizar layout com backend, mantendo apenas local:', error);
    }

    return layout;
  }

  // Buscar layouts para um modelo específico
  async getLayoutsForModel(modelInfo: FridgeModelInfo): Promise<UserLayout[]> {
    const modelKey = this.generateModelKey(modelInfo);
    
    // 1. Buscar layouts verificados primeiro
    const verifiedLayouts = await this.getVerifiedLayouts(modelKey);
    
    // 2. Buscar layouts crowdsourcing
    const crowdsourcedLayouts = await this.getCrowdsourcedLayouts(modelKey);
    
    // 3. Buscar layouts locais
    const localLayouts = await this.getLocalLayouts(modelKey);

    // Combinar e ordenar por relevância
    const allLayouts = [...verifiedLayouts, ...crowdsourcedLayouts, ...localLayouts];
    
    return this.sortLayoutsByRelevance(allLayouts, modelInfo);
  }

  // Verificar layout (usuário confirma que está correto)
  async verifyLayout(layoutId: string, userId?: string): Promise<void> {
    const layouts = await this.getAllLayouts();
    const layout = layouts.find(l => l.id === layoutId);
    
    if (layout) {
      layout.verificationCount++;
      layout.updatedAt = new Date();
      
      // Se tiver muitas verificações, marca como verificado
      if (layout.verificationCount >= 5 && !layout.isVerified) {
        layout.isVerified = true;
        layout.source = 'verified';
      }
      
      await this.saveAllLayouts(layouts);
    }
  }

  // Reportar layout incorreto
  async reportLayout(layoutId: string, reason?: string): Promise<void> {
    const layouts = await this.getAllLayouts();
    const layout = layouts.find(l => l.id === layoutId);
    
    if (layout) {
      layout.reports++;
      layout.updatedAt = new Date();
      
      // Se tiver muitos reports, remove ou marca como não verificado
      if (layout.reports >= 3) {
        layout.isVerified = false;
      }
      
      await this.saveAllLayouts(layouts);
    }
  }

  // Gerar chave única para o modelo
  private generateModelKey(modelInfo: FridgeModelInfo): string {
    return `${modelInfo.brand.toLowerCase()}-${modelInfo.model.toLowerCase()}-${modelInfo.capacity}`;
  }

  private generateLayoutId(modelInfo: FridgeModelInfo): string {
    return `${this.generateModelKey(modelInfo)}-${Date.now()}`;
  }

  // Calcular confiança do layout baseado na distribuição de capacidade
  private calculateLayoutConfidence(compartments: Compartment[], totalCapacity: number): number {
    const totalCompCapacity = compartments.reduce((sum, comp) => sum + comp.capacity, 0);
    const capacityRatio = totalCompCapacity / totalCapacity;
    
    // Layout é mais confiável se a capacidade total dos compartimentos
    // está próxima da capacidade total da geladeira (80-120%)
    let confidence = 0.5;
    
    if (capacityRatio >= 0.8 && capacityRatio <= 1.2) {
      confidence += 0.3;
    }
    
    // Bônus para layouts com múltiplos tipos de compartimento
    const uniqueTypes = new Set(compartments.map(c => c.type)).size;
    confidence += (uniqueTypes - 1) * 0.1;
    
    // Bônus para layouts com prateleiras bem distribuídas
    const totalShelves = compartments.reduce((sum, comp) => sum + (comp.shelves?.length || 0), 0);
    if (totalShelves >= 3 && totalShelves <= 8) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }

  // Métodos de persistência local
  private async saveLayoutLocal(layout: UserLayout): Promise<void> {
    try {
      const layouts = await this.getAllLayouts();
      const existingIndex = layouts.findIndex(l => l.id === layout.id);
      
      if (existingIndex >= 0) {
        layouts[existingIndex] = layout;
      } else {
        layouts.push(layout);
      }
      
      await this.saveAllLayouts(layouts);
    } catch (error) {
      console.error('Erro ao salvar layout localmente:', error);
    }
  }

  private async getAllLayouts(): Promise<UserLayout[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Erro ao carregar layouts:', error);
      return [];
    }
  }

  private async saveAllLayouts(layouts: UserLayout[]): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(layouts));
    } catch (error) {
      console.error('Erro ao salvar layouts:', error);
    }
  }

  private async getLocalLayouts(modelKey: string): Promise<UserLayout[]> {
    const layouts = await this.getAllLayouts();
    return layouts.filter(l => 
      l.fridgeModelId === modelKey && 
      l.source === 'user_edit'
    );
  }

  private async getVerifiedLayouts(modelKey: string): Promise<UserLayout[]> {
    try {
      const verified = localStorage.getItem(this.VERIFIED_KEY);
      const verifiedLayouts: UserLayout[] = verified ? JSON.parse(verified) : [];
      return verifiedLayouts.filter(l => l.fridgeModelId === modelKey);
    } catch (error) {
      console.error('Erro ao carregar layouts verificados:', error);
      return [];
    }
  }

  private async getCrowdsourcedLayouts(modelKey: string): Promise<UserLayout[]> {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      const crowdsourced: UserLayout[] = cached ? JSON.parse(cached) : [];
      return crowdsourced.filter(l => l.fridgeModelId === modelKey);
    } catch (error) {
      console.error('Erro ao carregar layouts crowdsourcing:', error);
      return [];
    }
  }

  // Ordenar layouts por relevância
  private sortLayoutsByRelevance(layouts: UserLayout[], modelInfo: FridgeModelInfo): UserLayout[] {
    return layouts.sort((a, b) => {
      // 1. Layouts verificados primeiro
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      
      // 2. Mais verificações
      if (a.verificationCount > b.verificationCount) return -1;
      if (a.verificationCount < b.verificationCount) return 1;
      
      // 3. Menos reports
      if (a.reports < b.reports) return -1;
      if (a.reports > b.reports) return 1;
      
      // 4. Maior confiança
      const aConfidence = a.metadata?.confidence || 0;
      const bConfidence = b.metadata?.confidence || 0;
      if (aConfidence > bConfidence) return -1;
      if (aConfidence < bConfidence) return 1;
      
      // 5. Mais recente
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  // Sincronização com backend (placeholder para implementação futura)
  private async syncLayoutToBackend(layout: UserLayout): Promise<void> {
    // TODO: Implementar sincronização com backend/SUPABASE
    // Por ora, apenas simula o sucesso
    console.log('Layout sincronizado com backend:', layout.id);
  }

  // Buscar layouts do backend (placeholder para implementação futura)
  private async fetchLayoutsFromBackend(modelKey: string): Promise<UserLayout[]> {
    // TODO: Implementar busca do backend/SUPABASE
    // Por ora, retorna array vazio
    return [];
  }

  // Limpar caches antigos
  async cleanupOldLayouts(): Promise<void> {
    const layouts = await this.getAllLayouts();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const filteredLayouts = layouts.filter(layout => {
      // Manter layouts verificados ou recentes
      return layout.isVerified || new Date(layout.updatedAt) > thirtyDaysAgo;
    });
    
    if (filteredLayouts.length !== layouts.length) {
      await this.saveAllLayouts(filteredLayouts);
      console.log(`Limpos ${layouts.length - filteredLayouts.length} layouts antigos`);
    }
  }

  // Exportar layouts para backup
  async exportLayouts(): Promise<string> {
    const layouts = await this.getAllLayouts();
    return JSON.stringify(layouts, null, 2);
  }

  // Importar layouts de backup
  async importLayouts(layoutsJson: string): Promise<number> {
    try {
      const importedLayouts: UserLayout[] = JSON.parse(layoutsJson);
      const existingLayouts = await this.getAllLayouts();
      
      // Mesclar layouts, evitando duplicatas
      const mergedLayouts = [...existingLayouts];
      
      for (const imported of importedLayouts) {
        if (!mergedLayouts.find(l => l.id === imported.id)) {
          mergedLayouts.push(imported);
        }
      }
      
      await this.saveAllLayouts(mergedLayouts);
      return importedLayouts.length;
    } catch (error) {
      console.error('Erro ao importar layouts:', error);
      throw new Error('Formato de layouts inválido');
    }
  }
}

export const layoutPersistenceService = new LayoutPersistenceService();
