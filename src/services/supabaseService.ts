import { supabase } from '../lib/supabase';
import { 
  Household, 
  RefrigerationAppliance, 
  ApplianceLocation, 
  ApplianceType,
  FridgeModel,
  Product 
} from '../types';

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
        locations: data.locations || [],
        appliances: data.appliances || [],
        primaryApplianceId: data.primary_appliance_id,
        settings: data.settings
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

  static async getAppliances(householdId: string): Promise<RefrigerationAppliance[]> {
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
        designation: appliance.designation,
        applianceType: {
          id: appliance.appliance_category,
          name: appliance.appliance_type_name,
          category: appliance.appliance_category as any,
          description: '',
          icon: appliance.appliance_icon,
          defaultCompartments: []
        },
        model: {
          id: appliance.id, // Isso precisa ser ajustado
          brand: appliance.model_brand,
          model: appliance.model_name,
          capacity: appliance.model_capacity,
          compartments: [] // Isso precisa ser carregado separadamente
        },
        location: {
          id: appliance.id, // Isso precisa ser ajustado
          name: appliance.location_name,
          type: appliance.location_type as any,
          description: ''
        },
        position: appliance.position_description ? {
          description: appliance.position_description,
          coordinates: appliance.position_coordinates
        } : undefined,
        isActive: appliance.is_active,
        isPrimary: appliance.is_primary,
        customSettings: appliance.custom_settings,
        createdAt: appliance.created_at,
        updatedAt: appliance.updated_at
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
  ): Promise<RefrigerationAppliance> {
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
    updates: Partial<RefrigerationAppliance>
  ): Promise<RefrigerationAppliance> {
    try {
      const { data, error } = await supabase
        .from('refrigeration_appliances')
        .update({
          name: updates.name,
          designation: updates.designation,
          position_description: updates.position?.description,
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
          image_url: model.imageUrl
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

      return data.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        quantity: product.quantity,
        unit: product.unit,
        expiryDate: product.expiry_date ? new Date(product.expiry_date) : undefined,
        purchaseDate: product.purchase_date ? new Date(product.purchase_date) : undefined,
        imageUrl: product.image_url,
        barcode: product.barcode,
        location: product.location,
        notes: product.notes
      }));
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return [];
    }
  }

  static async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          category: product.category,
          quantity: product.quantity,
          unit: product.unit,
          expiry_date: product.expiryDate?.toISOString().split('T')[0],
          purchase_date: product.purchaseDate?.toISOString().split('T')[0],
          image_url: product.imageUrl,
          barcode: product.barcode,
          location: product.location,
          notes: product.notes
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        expiryDate: data.expiry_date ? new Date(data.expiry_date) : undefined,
        purchaseDate: data.purchase_date ? new Date(data.purchase_date) : undefined,
        imageUrl: data.image_url,
        barcode: data.barcode,
        location: data.location,
        notes: data.notes
      };
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
