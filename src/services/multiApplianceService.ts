import { 
  Household, 
  RefrigerationAppliance, 
  ApplianceType, 
  ApplianceLocation,
  FridgeModel 
} from '../types';
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

class MultiApplianceService {
  private readonly STORAGE_KEY = 'household_appliances';
  private readonly APPLIANCE_TYPES_KEY = 'appliance_types';
  private readonly LOCATIONS_KEY = 'appliance_locations';

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
        description: 'Geladeira residencial padrão com freezer',
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
      },
      {
        id: 'commercial',
        name: 'Refrigerador Comercial',
        category: 'commercial',
        description: 'Equipamento comercial de grande porte',
        icon: '🏪',
        defaultCompartments: ['commercial_shelf', 'display_area', 'storage']
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
        description: 'Área de estacionamento e oficina',
        subLocations: [
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
            name: 'Quarto Principal',
            type: 'area',
            parentLocationId: 'bedroom',
            description: 'Quarto do casal'
          },
          {
            id: 'guest_bedroom',
            name: 'Quarto de Hóspedes',
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
      household = await SupabaseService.createHousehold(user.id, 'Minha Casa');
          inventoryTracking: true
        }
      };

      await this.saveHousehold(defaultHousehold);
      return defaultHousehold;
    } catch (error) {
      console.error('Erro ao carregar household:', error);
      throw new Error('Falha ao carregar dados da residência');
    }
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
    designation: string | undefined,
    applianceType: ApplianceType,
    model: FridgeModel,
    location: ApplianceLocation,
    positionDescription?: string
  ): Promise<RefrigerationAppliance> {
    const household = await this.getHousehold();
    
    const appliance: RefrigerationAppliance = {
      id: `appliance-${Date.now()}`,
      name,
      designation,
      applianceType,
      model,
      location,
      position: {
        description: positionDescription || ''
      },
      isActive: true,
      isPrimary: household.appliances.length === 0, // Primeiro aparelho é o principal
      customSettings: {
        alertsEnabled: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    household.appliances.push(appliance);
    
    // Se for o primeiro aparelho ou não tiver principal, definir como principal
    if (!household.primaryApplianceId || appliance.isPrimary) {
      household.primaryApplianceId = appliance.id;
    }

    await this.saveHousehold(household);
    return appliance;
  }

  async updateAppliance(applianceId: string, updates: Partial<RefrigerationAppliance>): Promise<RefrigerationAppliance> {
    const household = await this.getHousehold();
    const applianceIndex = household.appliances.findIndex(a => a.id === applianceId);
    
    if (applianceIndex === -1) {
      throw new Error('Aparelho não encontrado');
    }

    const appliance = household.appliances[applianceIndex];
    const updatedAppliance = {
      ...appliance,
      ...updates,
      updatedAt: new Date()
    };

    household.appliances[applianceIndex] = updatedAppliance;
    await this.saveHousehold(household);
    
    return updatedAppliance;
  }

  async removeAppliance(applianceId: string): Promise<void> {
    const household = await this.getHousehold();
    const applianceIndex = household.appliances.findIndex(a => a.id === applianceId);
    
    if (applianceIndex === -1) {
      throw new Error('Aparelho não encontrado');
    }

    household.appliances.splice(applianceIndex, 1);

    // Se era o aparelho principal, definir outro como principal
    if (household.primaryApplianceId === applianceId && household.appliances.length > 0) {
      household.primaryApplianceId = household.appliances[0].id;
    } else if (household.appliances.length === 0) {
      household.primaryApplianceId = undefined;
    }

    await this.saveHousehold(household);
  }

  async setPrimaryAppliance(applianceId: string): Promise<void> {
    const household = await this.getHousehold();
    const appliance = household.appliances.find(a => a.id === applianceId);
    
    if (!appliance) {
      throw new Error('Aparelho não encontrado');
    }

    // Remover primary status de todos
    household.appliances.forEach(a => a.isPrimary = false);
    
    // Definir novo primary
    appliance.isPrimary = true;
    household.primaryApplianceId = applianceId;
    appliance.updatedAt = new Date();

    await this.saveHousehold(household);
  }

  async getAppliance(applianceId: string): Promise<RefrigerationAppliance | null> {
    const household = await this.getHousehold();
    return household.appliances.find(a => a.id === applianceId) || null;
  }

  async getAllAppliances(): Promise<RefrigerationAppliance[]> {
    const household = await this.getHousehold();
    return household.appliances;
  }

  async getActiveAppliances(): Promise<RefrigerationAppliance[]> {
    const household = await this.getHousehold();
    return household.appliances.filter(a => a.isActive);
  }

  async getPrimaryAppliance(): Promise<RefrigerationAppliance | null> {
    const household = await this.getHousehold();
    
    if (household.primaryApplianceId) {
      return household.appliances.find(a => a.id === household.primaryApplianceId) || null;
    }
    
    // Fallback: primeiro aparelho ativo
    return household.appliances.find(a => a.isActive) || null;
  }

  // Gerenciar Localizações
  async addLocation(location: Omit<ApplianceLocation, 'id'>): Promise<ApplianceLocation> {
    const household = await this.getHousehold();
    
    const newLocation: ApplianceLocation = {
      id: `location-${Date.now()}`,
      ...location
    };

    if (location.parentLocationId) {
      // Adicionar como sub-localização
      const parentLocation = this.findLocationById(household.locations, location.parentLocationId);
      if (parentLocation) {
        if (!parentLocation.subLocations) {
          parentLocation.subLocations = [];
        }
        parentLocation.subLocations.push(newLocation);
      }
    } else {
      // Adicionar como localização principal
      household.locations.push(newLocation);
    }

    await this.saveHousehold(household);
    return newLocation;
  }

  async updateLocation(locationId: string, updates: Partial<ApplianceLocation>): Promise<ApplianceLocation> {
    const household = await this.getHousehold();
    const location = this.findLocationById(household.locations, locationId);
    
    if (!location) {
      throw new Error('Localização não encontrada');
    }

    Object.assign(location, updates);
    await this.saveHousehold(household);
    
    return location;
  }

  async removeLocation(locationId: string): Promise<void> {
    const household = await this.getHousehold();
    
    // Verificar se há aparelhos nesta localização
    const appliancesInLocation = household.appliances.filter(a => a.location.id === locationId);
    if (appliancesInLocation.length > 0) {
      throw new Error('Não é possível remover localização com aparelhos associados');
    }

    // Remover localização
    this.removeLocationById(household.locations, locationId);
    await this.saveHousehold(household);
  }

  // Métodos utilitários
  private findLocationById(locations: ApplianceLocation[], id: string): ApplianceLocation | null {
    for (const location of locations) {
      if (location.id === id) return location;
      if (location.subLocations) {
        const found = this.findLocationById(location.subLocations, id);
        if (found) return found;
      }
    }
    return null;
  }

  private removeLocationById(locations: ApplianceLocation[], id: string): boolean {
    for (let i = 0; i < locations.length; i++) {
      if (locations[i].id === id) {
        locations.splice(i, 1);
        return true;
      }
      if (locations[i].subLocations) {
        if (this.removeLocationById(locations[i].subLocations!, id)) {
          return true;
        }
      }
    }
    return false;
  }

  // Análise e Sugestões
  async getApplianceSummary(): Promise<ApplianceSummary> {
    const appliances = await this.getAllAppliances();
    const activeAppliances = appliances.filter(a => a.isActive);

    const summary: ApplianceSummary = {
      totalAppliances: appliances.length,
      activeAppliances: activeAppliances.length,
      totalCapacity: activeAppliances.reduce((sum, a) => sum + a.model.capacity, 0),
      byCategory: {},
      byLocation: {}
    };

    // Agrupar por categoria
    activeAppliances.forEach(appliance => {
      const category = appliance.applianceType.category;
      summary.byCategory[category] = (summary.byCategory[category] || 0) + 1;
    });

    // Agrupar por localização
    activeAppliances.forEach(appliance => {
      const location = appliance.location.name;
      summary.byLocation[location] = (summary.byLocation[location] || 0) + 1;
    });

    return summary;
  }

  async getApplianceSuggestions(): Promise<ApplianceSuggestion[]> {
    const household = await this.getHousehold();
    const suggestions: ApplianceSuggestion[] = [];

    // Analisar padrões e sugerir melhorias
    const hasKitchenFridge = household.appliances.some(a => 
      a.location.id === 'kitchen' && a.applianceType.category === 'fridge'
    );

    const hasGarageFreezer = household.appliances.some(a => 
      a.location.id === 'garage' && a.applianceType.category === 'freezer'
    );

    const hasBarCooler = household.appliances.some(a => 
      a.location.id.includes('bar') && a.applianceType.category === 'beverage_cooler'
    );

    // Sugerir freezer na garagem se não tiver
    if (!hasGarageFreezer && household.appliances.length > 0) {
      suggestions.push({
        type: this.applianceTypes.find(t => t.id === 'freezer')!,
        suggestedName: 'Freezer da Garagem',
        suggestedLocation: this.findLocationById(this.defaultLocations, 'garage_storage')!,
        reason: 'Ideal para estoque de carne e alimentos em grande quantidade'
      });
    }

    // Sugerir refrigerador de bebidas se tiver área de bar
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

  // Métodos de acesso
  getApplianceTypes(): ApplianceType[] {
    return this.applianceTypes;
  }

  getDefaultLocations(): ApplianceLocation[] {
    return this.defaultLocations;
  }

  async getAppliancesByLocation(locationId: string): Promise<RefrigerationAppliance[]> {
    const household = await this.getHousehold();
    return household.appliances.filter(a => a.location.id === locationId);
  }

  async getAppliancesByCategory(category: string): Promise<RefrigerationAppliance[]> {
    const household = await this.getHousehold();
    return household.appliances.filter(a => a.applianceType.category === category);
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
}

export const multiApplianceService = new MultiApplianceService();
