import { createClient } from '@supabase/supabase-js';
import type { Product } from '../types/unified';
import { mapProductRow, toProductRow, toProductUpdateRow } from '../services/productMapper';

// Configuração do Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('As variáveis de ambiente do Supabase não estão configuradas. Verifique REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para as tabelas do Supabase
export interface Database {
  public: {
    Tables: {
      appliance_locations: {
        Row: {
          id: string;
          household_id?: string;
          name: string;
          type: string;
          description?: string;
          parent_location_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['appliance_locations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['appliance_locations']['Insert']>;
      };
      appliance_types: {
        Row: {
          id: string;
          name: string;
          category: string;
          description?: string;
          icon?: string;
          default_compartments?: string[];
          created_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['appliance_types']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['appliance_types']['Insert']>;
      };
      consumption_history: {
        Row: {
          id: string;
          product_id?: string;
          date?: string;
          quantity_consumed: number;
          reason?: string;
          notes?: string;
          user_id?: string;
        };
        Insert: Omit<Database['public']['Tables']['consumption_history']['Row'], 'id' | 'date'>;
        Update: Partial<Database['public']['Tables']['consumption_history']['Insert']>;
      };
      fridge_models: {
        Row: {
          id: string;
          user_id?: string;
          brand: string;
          model: string;
          year?: number;
          capacity: number;
          compartments: any;
          image_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['fridge_models']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['fridge_models']['Insert']>;
      };
      households: {
        Row: {
          id: string;
          user_id?: string;
          name: string;
          settings: any;
          primary_appliance_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['households']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['households']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id?: string;
          type: string;
          title: string;
          message: string;
          priority?: string;
          scheduled_for?: string;
          sent_at?: string;
          read_at?: string;
          action_url?: string;
          metadata?: any;
          created_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      onboarding_progress: {
        Row: {
          id: string;
          user_id?: string;
          current_step?: number;
          total_steps?: number;
          completed_steps?: string[];
          is_completed?: boolean;
          completed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['onboarding_progress']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['onboarding_progress']['Insert']>;
      };
      product_categories: {
        Row: {
          id: string;
          name: string;
          icon?: string;
          color?: string;
          default_expiry_rules?: any;
          storage_preferences?: any;
          created_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['product_categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['product_categories']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          user_id?: string;
          name: string;
          category: string;
          quantity: number;
          unit: string;
          expiry_date?: string;
          purchase_date?: string;
          image_url?: string;
          barcode?: string;
          location: any;
          notes?: string;
          created_at?: string;
          updated_at?: string;
          appliance_id?: string;
          sealed_expiry_date?: string;
          opened_expiry_date?: string;
          best_before_date?: string;
          freeze_by_date?: string;
          expiry_metadata?: any;
          current_state?: any;
          consumption?: any;
          purchase_info?: any;
          brand?: string;
          tags?: string[];
          nutritional_info?: any;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      products_expiring_soon: {
        Row: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string;
          quantity?: number;
          unit?: string;
          expiry_date?: string;
        };
        Insert: Database['public']['Tables']['products_expiring_soon']['Row'];
        Update: Partial<Database['public']['Tables']['products_expiring_soon']['Row']>;
      };
      products_low_stock: {
        Row: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string;
          quantity?: number;
          unit?: string;
        };
        Insert: Database['public']['Tables']['products_low_stock']['Row'];
        Update: Partial<Database['public']['Tables']['products_low_stock']['Row']>;
      };
      profiles: {
        Row: {
          id: string;
          updated_at?: string;
          username?: string;
          full_name?: string;
          avatar_url?: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      refrigeration_appliances: {
        Row: {
          id: string;
          household_id?: string;
          appliance_type_id?: string;
          name: string;
          model?: string;
          location_id?: string;
          designation?: string;
          position_description?: string;
          settings?: any;
          is_active: boolean;
          is_primary: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['refrigeration_appliances']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['refrigeration_appliances']['Insert']>;
      };
      shopping_lists: {
        Row: {
          id: string;
          user_id?: string;
          name: string;
          items: any[];
          created_at?: string;
          updated_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['shopping_lists']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['shopping_lists']['Insert']>;
      };
      shopping_sessions: {
        Row: {
          id?: string;
          user_id?: string;
          store_id?: string;
          started_at?: string;
          completed_at?: string;
          total_spent?: number;
          items_purchased?: any[];
        };
        Insert: Database['public']['Tables']['shopping_sessions']['Row'];
        Update: Partial<Database['public']['Tables']['shopping_sessions']['Row']>;
      };
      shopping_suggestions: {
        Row: {
          id?: string;
          user_id?: string;
          product_id?: string;
          reason?: string;
          priority?: string;
          suggested_quantity?: number;
          confidence?: number;
        };
        Insert: Database['public']['Tables']['shopping_suggestions']['Row'];
        Update: Partial<Database['public']['Tables']['shopping_suggestions']['Row']>;
      };
      storage_types: {
        Row: {
          id?: string;
          name?: string;
          type?: string;
          description?: string;
        };
        Insert: Database['public']['Tables']['storage_types']['Row'];
        Update: Partial<Database['public']['Tables']['storage_types']['Row']>;
      };
      stores: {
        Row: {
          id?: string;
          name?: string;
          address?: string;
          is_favorite?: boolean;
        };
        Insert: Database['public']['Tables']['stores']['Row'];
        Update: Partial<Database['public']['Tables']['stores']['Row']>;
      };
      wasted_items: {
        Row: {
          id?: string;
          user_id?: string;
          product_id?: string;
          name?: string;
          category?: string;
          quantity_wasted?: number;
          estimated_value?: number;
          reason?: string;
          wasted_at?: string;
        };
        Insert: Database['public']['Tables']['wasted_items']['Row'];
        Update: Partial<Database['public']['Tables']['wasted_items']['Row']>;
      };
    };
  };
}

// Funções auxiliares para o Supabase
export const supabaseService = {
  // Produtos
  async getProducts(userId: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(mapProductRow);
  },

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { user_id?: string }) {
    const productRow = product.currentState
      ? {
          ...toProductRow(product, product.user_id),
          created_at: new Date().toISOString()
        }
      : product;

    const { data, error } = await supabase
      .from('products')
      .insert(productRow)
      .select()
      .single();
    
    if (error) throw error;
    return mapProductRow(data);
  },

  async updateProduct(id: string, updates: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .update(toProductUpdateRow(updates))
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return mapProductRow(data);
  },

  async deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Modelos de Geladeira
  async getFridgeModel(userId: string) {
    const { data, error } = await supabase
      .from('fridge_models')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar modelo de geladeira:', error);
      throw error;
    }
    return data;
  },

  async saveFridgeModel(model: Database['public']['Tables']['fridge_models']['Insert']) {
    // Primeiro verificar se já existe um modelo para este usuário
    const { data: existing } = await supabase
      .from('fridge_models')
      .select('id')
      .eq('user_id', model.user_id)
      .maybeSingle();

    if (existing) {
      // Atualizar se já existe
      const { data, error } = await supabase
        .from('fridge_models')
        .update(model)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // Criar novo se não existe
      const { data, error } = await supabase
        .from('fridge_models')
        .insert(model)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // Households
  async getHousehold(userId: string) {
    const { data, error } = await supabase
      .from('households')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar household:', error);
      throw error;
    }
    return data;
  },

  async createHousehold(household: Database['public']['Tables']['households']['Insert']) {
    const { data, error } = await supabase
      .from('households')
      .insert(household)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateHousehold(id: string, updates: Database['public']['Tables']['households']['Update']) {
    const { data, error } = await supabase
      .from('households')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Refrigeration Appliances
  async getAppliances(householdId: string) {
    const { data, error } = await supabase
      .from('refrigeration_appliances')
      .select('*')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createAppliance(appliance: Database['public']['Tables']['refrigeration_appliances']['Insert']) {
    const { data, error } = await supabase
      .from('refrigeration_appliances')
      .insert(appliance)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAppliance(id: string, updates: Database['public']['Tables']['refrigeration_appliances']['Update']) {
    const { data, error } = await supabase
      .from('refrigeration_appliances')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteAppliance(id: string) {
    const { error } = await supabase
      .from('refrigeration_appliances')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Notifications
  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createNotification(notification: Database['public']['Tables']['notifications']['Insert']) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async markNotificationAsRead(id: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Shopping Lists
  async getShoppingLists(userId: string) {
    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createShoppingList(list: Database['public']['Tables']['shopping_lists']['Insert']) {
    const { data, error } = await supabase
      .from('shopping_lists')
      .insert(list)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateShoppingList(id: string, updates: Database['public']['Tables']['shopping_lists']['Update']) {
    const { data, error } = await supabase
      .from('shopping_lists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteShoppingList(id: string) {
    const { error } = await supabase
      .from('shopping_lists')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Shopping Suggestions
  async getShoppingSuggestions(userId: string) {
    const { data, error } = await supabase
      .from('shopping_suggestions')
      .select('*')
      .eq('user_id', userId)
      .order('confidence', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createShoppingSuggestion(suggestion: Database['public']['Tables']['shopping_suggestions']['Insert']) {
    const { data, error } = await supabase
      .from('shopping_suggestions')
      .insert(suggestion)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Onboarding Progress
  async getOnboardingProgress(userId: string) {
    const { data, error } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar onboarding progress:', error);
      throw error;
    }
    return data;
  },

  async updateOnboardingProgress(userId: string, updates: Database['public']['Tables']['onboarding_progress']['Update']) {
    const { data, error } = await supabase
      .from('onboarding_progress')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Upload de imagens
  async uploadImage(file: File, userId: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  },

  // Autenticação
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Listener de autenticação
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
