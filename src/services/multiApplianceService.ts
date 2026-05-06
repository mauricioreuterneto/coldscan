import { 
  Household, 
  Appliance, 
  ApplianceType, 
  ApplianceLocation,
  FridgeModel 
} from '../types/unified';
import { SupabaseService } from './supabaseService';
import { supabase } from '../lib/supabase';

export interface ApplianceSummary {
  totalAppliances: number;
  activeAppliances: number;
  totalCapacity: number;
  byCategory: Record<string, number>;
  byLocation: Record<string, number>;
}

export interface ApplianceSuggestion {
  type: ApplianceType;
  suggestedName: string;
  suggestedLocation: ApplianceLocation;
  reason: string;
}

export class MultiApplianceService {
  private STORAGE_KEY = 'multi_appliance_data';
  private household: Household | null = null;
  private applianceTypes: ApplianceType[] = [];
  private defaultLocations: ApplianceLocation[] = [];

  constructor() {
    this.initializeApplianceTypes();
    this.initializeDefaultLocations();
  }

  private initializeApplianceTypes() {
    this.applianceTypes = [
      {
        id: 'fridge',
        name: 'Geladeira',
        category: 'fridge',
        description: 'Geladeira tradicional',
        icon: '🧊',
        defaultCompartments: ['fridge', 'freezer', 'door']
      },
      {
        id: 'freezer',
        name: 'Freezer',
        category: 'freezer',
        description: 'Freezer vertical ou horizontal',
        icon: '❄️',
        defaultCompartments: ['freezer', 'drawer', 'shelf']
      },
      {
        id: 'mini_fridge',
        name: 'Frigobar',
        category: 'mini_fridge',
        description: 'Geladeira compacta para quartos ou escritórios',
        icon: '🥤',
        defaultCompartments: ['fridge', 'door', 'freezer_compartment']
      },
      {
        id: 'wine_cooler',
        name: 'Adega Climatizada',
        category: 'wine_cooler',
        description: 'Adega para vinhos e bebidas finas',
        icon: '🍷',
        defaultCompartments: ['wine_rack', 'temperature_zone', 'door']
      },
      {
        id: 'beverage_cooler',
        name: 'Refrigerador de Bebidas',
        category: 'beverage_cooler',
        description: 'Refrigerador exclusivo para bebidas',
        icon: '🍺',
        defaultCompartments: ['beverage_shelf', 'can_holder', 'door']
      }
    ];
  }

  private initializeDefaultLocations() {
    this.defaultLocations = [
      {
        id: 'kitchen',
        name: 'Cozinha',
        type: 'room',
        description: 'Área principal de preparo de alimentos',
        subLocations: [
          {
            id: 'kitchen_main',
            name: 'Área Principal',
            type: 'area',
            parentLocationId: 'kitchen',
            description: 'Área central da cozinha'
          },
          {
            id: 'kitchen_pantry',
            name: 'Despensa',
            type: 'area',
            parentLocationId: 'kitchen',
            description: 'Área de armazenamento de alimentos'
          },
          {
            id: 'kitchen_bar',
            name: 'Bar/Adega',
            type: 'area',
            parentLocationId: 'kitchen',
            description: 'Área de bebidas e social'
          }
        ]
      },
      {
        id: 'garage',
        name: 'Garagem',
        type: 'room',
        description: 'Área de estacionamento e armazenamento',
        subLocations: [
          {
            id: 'garage_main',
            name: 'Área Principal',
            type: 'area',
            parentLocationId: 'garage',
            description: 'Área de estacionamento'
          },
          {
            id: 'garage_storage',
            name: 'Área de Armazenamento',
            type: 'area',
            parentLocationId: 'garage',
            description: 'Área para freezer e estoque'
          }
        ]
      },
      {
        id: 'living_room',
        name: 'Sala de Estar',
        type: 'room',
        description: 'Área de socialização',
        subLocations: [
          {
            id: 'living_bar',
            name: 'Bar da Sala',
            type: 'area',
            parentLocationId: 'living_room',
            description: 'Pequeno bar para bebidas'
          }
        ]
      },
      {
        id: 'bedroom',
        name: 'Quartos',
        type: 'room',
        description: 'Áreas de descanso',
        subLocations: [
          {
            id: 'master_bedroom',
            name: 'Suíte Principal',
            type: 'area',
            parentLocationId: 'bedroom',
            description: 'Quarto principal'
          },
          {
            id: 'guest_bedroom',
            name: 'Quarto de Visitas',
            type: 'area',
            parentLocationId: 'bedroom',
            description: 'Quarto para visitantes'
          },
          {
            id: 'office',
            name: 'Escritório/Sala',
            type: 'area',
            parentLocationId: 'bedroom',
            description: 'Área de trabalho ou estudo'
          }
        ]
      },
      {
        id: 'outdoor',
        name: 'Área Externa',
        type: 'room',
        description: 'Áreas externas da casa',
        subLocations: [
          {
            id: 'backyard',
            name: 'Quintal/Área de Lazer',
            type: 'area',
            parentLocationId: 'outdoor',
            description: 'Área de churrasqueira e lazer'
          },
          {
            id: 'pool_area',
            name: 'Área da Piscina',
            type: 'area',
            parentLocationId: 'outdoor',
            description: 'Próximo à piscina'
          }
        ]
      }
    ];
  }

  // Buscar household do Supabase
  static async getHousehold(): Promise<Household> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');
    
    let household = await SupabaseService.getHousehold(user.id);
    
    if (!household) {
      const defaultHousehold: Household = {
        id: user.id,
        name: 'Minha Casa',
        members: [],
        locations: [],
        appliances: [],
        settings: {
          sharedShopping: false,
          sharedInventory: true,
          allowanceNotifications: true,
          defaultAlerts: true,
          temperatureUnit: 'celsius',
          inventoryTracking: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await SupabaseService.createHousehold(user.id, 'Minha Casa');
      return defaultHousehold;
    }
    
    return household;
  }

  async getHousehold(): Promise<Household> {
    return MultiApplianceService.getHousehold();
  }

  async saveHousehold(household: Household): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(household));
    } catch (error) {
      console.error('Erro ao salvar household:', error);
      throw new Error('Falha ao salvar dados da residência');
    }
  }

  // Gerenciar Aparelhos
  async addAppliance(
    name: string,
    applianceType: ApplianceType,
    location: ApplianceLocation,
    model?: FridgeModel
  ): Promise<Appliance> {
    try {
      const household = await this.getHousehold();
      
      const newAppliance: Appliance = {
        id: `appliance_${Date.now()}`,
        name,
        type: applianceType,
        applianceType,
        locationId: location.id,
        location,
        model,
        settings: {
          alertsEnabled: true,
          ecoMode: false
        },
        isActive: true,
        isPrimary: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      household.appliances.push(newAppliance);
      await this.saveHousehold(household);
      
      return newAppliance;
    } catch (error) {
      console.error('Erro ao adicionar aparelho:', error);
      throw new Error('Falha ao adicionar aparelho');
    }
  }

  async updateAppliance(applianceId: string, updates: Partial<Appliance>): Promise<Appliance> {
    try {
      const household = await this.getHousehold();
      const applianceIndex = household.appliances.findIndex(a => a.id === applianceId);
      
      if (applianceIndex === -1) {
        throw new Error('Aparelho não encontrado');
      }

      household.appliances[applianceIndex] = {
        ...household.appliances[applianceIndex],
        ...updates,
        updatedAt: new Date()
      };

      await this.saveHousehold(household);
      return household.appliances[applianceIndex];
    } catch (error) {
      console.error('Erro ao atualizar aparelho:', error);
      throw new Error('Falha ao atualizar aparelho');
    }
  }

  async removeAppliance(applianceId: string): Promise<void> {
    try {
      const household = await this.getHousehold();
      household.appliances = household.appliances.filter(a => a.id !== applianceId);
      await this.saveHousehold(household);
    } catch (error) {
      console.error('Erro ao remover aparelho:', error);
      throw new Error('Falha ao remover aparelho');
    }
  }

  async getAllAppliances(): Promise<Appliance[]> {
    try {
      const household = await this.getHousehold();
      return household.appliances;
    } catch (error) {
      console.error('Erro ao buscar aparelhos:', error);
      return [];
    }
  }

  async getPrimaryAppliance(): Promise<Appliance | null> {
    try {
      const household = await this.getHousehold();
      return household.appliances.find(a => a.isActive) || null;
    } catch (error) {
      console.error('Erro ao buscar aparelho principal:', error);
      return null;
    }
  }

  async setPrimaryAppliance(applianceId: string): Promise<void> {
    try {
      const household = await this.getHousehold();
      
      // Desativar todos os aparelhos
      household.appliances = household.appliances.map(a => ({
        ...a,
        isActive: a.id === applianceId
      }));

      await this.saveHousehold(household);
    } catch (error) {
      console.error('Erro ao definir aparelho principal:', error);
      throw new Error('Falha ao definir aparelho principal');
    }
  }

  // Métodos de acesso
  getApplianceTypes(): ApplianceType[] {
    return this.applianceTypes;
  }

  getDefaultLocations(): ApplianceLocation[] {
    return this.defaultLocations;
  }

  async getAppliancesByLocation(locationId: string): Promise<Appliance[]> {
    const household = await this.getHousehold();
    return household.appliances.filter(a => (a.location?.id || a.locationId) === locationId);
  }

  async getAppliancesByCategory(category: string): Promise<Appliance[]> {
    const household = await this.getHousehold();
    return household.appliances.filter(a => (a.applianceType || a.type).category === category);
  }

  // Backup e Exportação
  async exportHouseholdData(): Promise<string> {
    const household = await this.getHousehold();
    return JSON.stringify(household, null, 2);
  }

  async importHouseholdData(data: string): Promise<void> {
    try {
      const household: Household = JSON.parse(data);
      await this.saveHousehold(household);
    } catch (error) {
      throw new Error('Formato de dados inválido');
    }
  }

  // Análises e Sugestões
  async getApplianceSummary(): Promise<ApplianceSummary> {
    const household = await this.getHousehold();
    const appliances = household.appliances;

    const summary: ApplianceSummary = {
      totalAppliances: appliances.length,
      activeAppliances: appliances.filter(a => a.isActive).length,
      totalCapacity: 0, // Calcular baseado nos modelos
      byCategory: {},
      byLocation: {}
    };

    appliances.forEach(appliance => {
      // Agrupar por categoria
      const category = (appliance.applianceType || appliance.type).category;
      summary.byCategory[category] = (summary.byCategory[category] || 0) + 1;

      // Agrupar por localização
      const location = appliance.location?.name || appliance.locationId || 'Sem local';
      summary.byLocation[location] = (summary.byLocation[location] || 0) + 1;
    });

    return summary;
  }

  async getApplianceSuggestions(): Promise<ApplianceSuggestion[]> {
    const household = await this.getHousehold();
    const suggestions: ApplianceSuggestion[] = [];

    // Verificar se tem geladeira principal
    const hasMainFridge = household.appliances.some(a => 
      (a.applianceType || a.type).category === 'fridge' && a.isActive
    );

    if (!hasMainFridge) {
      suggestions.push({
        type: this.applianceTypes.find(t => t.id === 'fridge')!,
        suggestedName: 'Geladeira Principal',
        suggestedLocation: this.findLocationById(this.defaultLocations, 'kitchen_main')!,
        reason: 'Toda cozinha precisa de uma geladeira principal'
      });
    }

    // Sugerir freezer na garagem se não tiver
    const hasGarageFreezer = household.appliances.some(a => 
      (a.applianceType || a.type).category === 'freezer' && 
      (a.location?.id || a.locationId).includes('garage')
    );

    if (!hasGarageFreezer && household.appliances.length > 0) {
      suggestions.push({
        type: this.applianceTypes.find(t => t.id === 'freezer')!,
        suggestedName: 'Freezer da Garagem',
        suggestedLocation: this.findLocationById(this.defaultLocations, 'garage_storage')!,
        reason: 'Ideal para estoque de carne e alimentos em grande quantidade'
      });
    }

    // Sugerir refrigerador de bebidas se tiver área de bar
    const hasBarCooler = household.appliances.some(a => 
      (a.applianceType || a.type).category === 'beverage_cooler'
    );

    if (!hasBarCooler && this.hasBarArea(household.locations)) {
      suggestions.push({
        type: this.applianceTypes.find(t => t.id === 'beverage_cooler')!,
        suggestedName: 'Refrigerador de Bebidas',
        suggestedLocation: this.findLocationById(this.defaultLocations, 'living_bar')!,
        reason: 'Perfeito para manter bebidas geladas para visitas'
      });
    }

    return suggestions;
  }

  private hasBarArea(locations: ApplianceLocation[]): boolean {
    return locations.some(loc => 
      loc.name.includes('bar') || loc.name.includes('adega') ||
      loc.subLocations?.some(sub => sub.name.includes('bar') || sub.name.includes('adega'))
    );
  }

  private findLocationById(locations: ApplianceLocation[], id: string): ApplianceLocation | undefined {
    for (const location of locations) {
      if (location.id === id) return location;
      if (location.subLocations) {
        const found = this.findLocationById(location.subLocations, id);
        if (found) return found;
      }
    }
    return undefined;
  }
}

export const multiApplianceService = new MultiApplianceService();
