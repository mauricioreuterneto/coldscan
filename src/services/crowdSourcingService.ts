import { FridgeModelUserFocused, UserValidation, UserFridgeCustomization, ProcessedFridgeModel } from '../types/fridgeDiscovery';
import { supabase } from '../lib/supabase';

// Crowd-sourcing Service - validação de dados por usuários
class CrowdSourcingService {
  async needsValidation(data: Partial<ProcessedFridgeModel>): Promise<boolean> {
    // Precisa de validação se:
    // - Completude < 80%
    // - Houve fallbacks aplicados
    // - Dados inconsistentes

    const hasFallbacks = (data.processingMetadata?.fallbacksApplied?.length || 0) > 0;
    const completeness = data.processingMetadata?.completeness || 0;

    return hasFallbacks || completeness < 0.8;
  }

  async presentValidationUI(data: Partial<FridgeModelUserFocused>): Promise<UserValidation> {
    // Em uma implementação real, isso mostraria um modal React
    // Por enquanto, retorna um objeto simulado
    return {
      userId: 'current-user-id',
      confirmed: false, // padrão, usuário precisa confirmar
      timestamp: new Date().toISOString(),
    };
  }

  async applyUserValidation(
    data: Partial<FridgeModelUserFocused>,
    validation: UserValidation
  ): Promise<Partial<FridgeModelUserFocused>> {
    if (!validation.confirmed) {
      throw new Error('Usuário não confirmou os dados');
    }

    // Aplicar correções se fornecidas
    if (validation.corrections) {
      return { ...data, ...validation.corrections };
    }

    return data;
  }

  async saveUserCustomization(customization: UserFridgeCustomization): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_fridge_customizations')
        .insert(customization);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving user customization:', error);
      throw error;
    }
  }

  async getUserCustomization(userId: string, baseModelId: string): Promise<UserFridgeCustomization | null> {
    try {
      const { data, error } = await supabase
        .from('user_fridge_customizations')
        .select('*')
        .eq('user_id', userId)
        .eq('base_model_id', baseModelId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user customization:', error);
      return null;
    }
  }

  async getCustomizationsForModel(baseModelId: string): Promise<UserFridgeCustomization[]> {
    try {
      const { data, error } = await supabase
        .from('user_fridge_customizations')
        .select('*')
        .eq('base_model_id', baseModelId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting customizations for model:', error);
      return [];
    }
  }

  // Verifica se há customizações suficientes para sugerir atualização do modelo base
  async shouldUpdateBaseModel(baseModelId: string): Promise<boolean> {
    const customizations = await this.getCustomizationsForModel(baseModelId);
    
    // Se 5+ usuários fizeram a mesma customização, sugerir atualização
    if (customizations.length >= 5) {
      // Verificar se as customizações são consistentes
      const firstCustomization = customizations[0];
      const similarCustomizations = customizations.filter(c => 
        JSON.stringify(c.customizations) === JSON.stringify(firstCustomization.customizations)
      );

      return similarCustomizations.length >= 5;
    }

    return false;
  }
}

export const crowdSourcingService = new CrowdSourcingService();
