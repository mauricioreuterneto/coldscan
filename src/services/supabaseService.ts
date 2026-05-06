import { supabase } from '../lib/supabase';
import { 
  Household, 
  Appliance, 
  ApplianceLocation, 
  ApplianceType,
  FridgeModel,
  Product 
} from '../types/unified';
import { mapProductRow, toProductRow } from './productMapper';

// Serviço para integração com Supabase
export class SupabaseService {
  // =====================================================
  // HOUSEHOLD OPERATIONS
  // =====================================================

  static async getHousehold(userId: string): Promise<Household | null> {
    try {
      const { data, error } = await supabase
        .from('households')
        .select(`
          *,
          locations:appliance_locations(*),
          appliances:refrigeration_appliances(*)
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      if (!data) return null;

      // Transformar para o formato esperado
      return {
        id: data.id,
        name: data.name,
        members: [], // TODO: carregar membros separadamente
        locations: data.locations || [],
        appliances: data.appliances || [],
        settings: data.settings || { sharedShopping: false, sharedInventory: false, allowanceNotifications: false },
        createdAt: data.created_at ? new Date(data.created_at) : new Date(),
        updatedAt: data.updated_at ? new Date(data.updated_at) : new Date()
      };
    } catch (error) {
      console.error('Erro ao buscar household:', error);
      return null;
    }
  }

  static async createHousehold(userId: string, name: string): Promise<Household> {
    try {
      const { data, error } = await supabase
        .from('households')
        .insert({
          user_id: userId,
          name,
          settings: {
            defaultAlerts: true,
            temperatureUnit: 'celsius',
            inventoryTracking: true
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Criar location padrão (Cozinha)
      await this.createLocation(data.id, 'Cozinha', 'room', 'Local principal para geladeiras');

      return await this.getHousehold(userId) as Household;
    } catch (error) {
      console.error('Erro ao criar household:', error);
      throw error;
    }
  }

  // =====================================================
  // LOCATION OPERATIONS
  // =====================================================

  static async createLocation(
    householdId: string, 
    name: string, 
    type: 'room' | 'area' | 'zone',
    description?: string,
    parentLocationId?: string
  ): Promise<ApplianceLocation> {
    try {
      const { data, error } = await supabase
        .from('appliance_locations')
        .insert({
          household_id: householdId,
          name,
          type,
          description,
          parent_location_id: parentLocationId
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        type: data.type,
        description: data.description,
        parentLocationId: data.parent_location_id,
        subLocations: []
      };
    } catch (error) {
      console.error('Erro ao criar location:', error);
      throw error;
    }
  }

  static async getLocations(householdId: string): Promise<ApplianceLocation[]> {
    try {
      const { data, error } = await supabase
        .from('appliance_locations')
        .select('*')
        .eq('household_id', householdId)
        .order('name');

      if (error) throw error;

      return data.map(location => ({
        id: location.id,
        name: location.name,
        type: location.type,
        description: location.description,
        parentLocationId: location.parent_location_id,
        subLocations: []
      }));
    } catch (error) {
      console.error('Erro ao buscar locations:', error);
      return [];
    }
  }

  // =====================================================
  // APPLIANCE OPERATIONS
  // =====================================================

  static async getAppliances(householdId: string): Promise<Appliance[]> {
    try {
      const { data, error } = await supabase
        .from('appliance_details')
        .select('*')
        .eq('owner_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at');

      if (error) throw error;

      return data.map(appliance => ({
        id: appliance.id,
        name: appliance.name,
        type: {
          id: appliance.appliance_category,
          name: appliance.appliance_type_name,
          category: appliance.appliance_category as any,
          defaultZones: [],
          icon: appliance.appliance_icon
        },
        model: appliance.model_brand ? {
          id: appliance.model_id || appliance.id,
          name: `${appliance.model_brand || 'Modelo'} ${appliance.model_name || ''}`.trim(),
          brand: appliance.model_brand,
          model: appliance.model_name,
          year: appliance.model_year,
          category: appliance.appliance_category as any,
          description: appliance.model_description || '',
          image: appliance.model_image_url,
          compartments: [],
          capacity: appliance.model_capacity,
          dimensions: {
            width: appliance.model_width || 60,
            height: appliance.model_height || 170,
            depth: appliance.model_depth || 65
          },
          features: []
        } : undefined,
        locationId: appliance.location_id || appliance.id,
        zones: [],
        settings: {
          targetTemperature: appliance.target_temperature,
          alertsEnabled: appliance.alerts_enabled !== false,
          maintenanceReminder: appliance.maintenance_reminder ? new Date(appliance.maintenance_reminder) : undefined,
          ecoMode: appliance.eco_mode || false
        },
        isActive: appliance.is_active,
        isPrimary: appliance.is_primary
      }));
    } catch (error) {
      console.error('Erro ao buscar appliances:', error);
      return [];
    }
  }

  static async createAppliance(
    householdId: string,
    applianceData: {
      name: string;
      designation?: string;
      applianceType: ApplianceType;
      model: FridgeModel;
      location: ApplianceLocation;
      positionDescription?: string;
    }
  ): Promise<Appliance> {
    try {
      // Primeiro, salvar o modelo se não existir
      let modelId = await this.findOrCreateModel(applianceData.model);

      // Criar o appliance
      const { data, error } = await supabase
        .from('refrigeration_appliances')
        .insert({
          household_id: householdId,
          location_id: applianceData.location.id,
          appliance_type_id: applianceData.applianceType.id,
          name: applianceData.name,
          designation: applianceData.designation,
          model_id: modelId,
          position_description: applianceData.positionDescription,
          is_primary: false
        })
        .select()
        .single();

      if (error) throw error;

      // Buscar o appliance completo
      const appliances = await this.getAppliances(householdId);
      const newAppliance = appliances.find(a => a.id === data.id);
      
      if (!newAppliance) throw new Error('Appliance não encontrado após criação');
      
      return newAppliance;
    } catch (error) {
      console.error('Erro ao criar appliance:', error);
      throw error;
    }
  }

  static async updateAppliance(
    applianceId: string, 
    updates: Partial<Appliance>
  ): Promise<Appliance> {
    try {
      const { data, error } = await supabase
        .from('refrigeration_appliances')
        .update({
          name: updates.name,
          designation: updates.designation,
          position_description: updates.positionDescription,
          is_active: updates.isActive,
          custom_settings: updates.customSettings
        })
        .eq('id', applianceId)
        .select()
        .single();

      if (error) throw error;

      // Buscar o appliance completo atualizado
      const appliances = await this.getAppliances(''); // Isso precisa ser ajustado
      const updatedAppliance = appliances.find(a => a.id === applianceId);
      
      if (!updatedAppliance) throw new Error('Appliance não encontrado após atualização');
      
      return updatedAppliance;
    } catch (error) {
      console.error('Erro ao atualizar appliance:', error);
      throw error;
    }
  }

  static async deleteAppliance(applianceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('refrigeration_appliances')
        .delete()
        .eq('id', applianceId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar appliance:', error);
      throw error;
    }
  }

  static async setPrimaryAppliance(applianceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('refrigeration_appliances')
        .update({ is_primary: true })
        .eq('id', applianceId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao definir appliance principal:', error);
      throw error;
    }
  }

  // =====================================================
  // MODEL OPERATIONS
  // =====================================================

  static async findOrCreateModel(model: FridgeModel): Promise<string> {
    try {
      // Tentar encontrar modelo existente
      const { data: existingModel } = await supabase
        .from('fridge_models')
        .select('id')
        .eq('brand', model.brand)
        .eq('model', model.model)
        .eq('capacity', model.capacity)
        .single();

      if (existingModel) {
        return existingModel.id;
      }

      // Criar novo modelo
      const { data: newModel, error } = await supabase
        .from('fridge_models')
        .insert({
          brand: model.brand,
          model: model.model,
          year: model.year,
          capacity: model.capacity,
          compartments: model.compartments,
          image_url: model.image
        })
        .select('id')
        .single();

      if (error) throw error;
      return newModel.id;
    } catch (error) {
      console.error('Erro ao buscar/criar modelo:', error);
      throw error;
    }
  }

  // =====================================================
  // PRODUCT OPERATIONS
  // =====================================================

  static async getProducts(applianceId?: string): Promise<Product[]> {
    try {
      let query = supabase
        .from('product_details')
        .select('*')
        .eq('owner_id', (await supabase.auth.getUser()).data.user?.id);

      if (applianceId) {
        query = query.eq('appliance_name', applianceId); // Ajustar isso
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(mapProductRow);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }
  }

  static async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...toProductRow(product),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return mapProductRow(data);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      throw error;
    }
  }

  // =====================================================
  // APPLIANCE TYPES
  // =====================================================

  static async getApplianceTypes(): Promise<ApplianceType[]> {
    try {
      const { data, error } = await supabase
        .from('appliance_types')
        .select('*')
        .order('name');

      if (error) throw error;

      return data.map(type => ({
        id: type.id,
        name: type.name,
        category: type.category as any,
        description: type.description || '',
        icon: type.icon || '',
        defaultCompartments: type.default_compartments || []
      }));
    } catch (error) {
      console.error('Erro ao buscar appliance types:', error);
      return [];
    }
  }
}
