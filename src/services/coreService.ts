// Serviço Central Unificado
// Este arquivo consolida todas as operações principais do sistema

import { supabase } from '../lib/supabase';
import type {
  User,
  Household,
  Product,
  ShoppingList,
  Notification,
  Appliance,
  ServiceResponse,
  SearchFilters
} from '../types/unified';
import { mapProductRow, toProductRow, toProductUpdateRow } from './productMapper';

export class CoreService {
  private static instance: CoreService;

  static getInstance(): CoreService {
    if (!CoreService.instance) {
      CoreService.instance = new CoreService();
    }
    return CoreService.instance;
  }

  // ===== AUTENTICAÇÃO =====

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;

      if (!user) return null;

      // Retornar usuário do auth sem buscar na tabela users (que não existe)
      return {
        id: user.id,
        email: user.email!,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error);
      return null;
    }
  }

  async signIn(email: string, password: string): Promise<ServiceResponse<User>> {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const user = await this.getCurrentUser();
      if (!user) throw new Error('Falha ao buscar dados do usuário');

      return {
        success: true,
        data: user,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha no login',
        timestamp: new Date()
      };
    }
  }

  async signUp(email: string, password: string, name?: string): Promise<ServiceResponse<User>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      if (error) throw error;

      const user = await this.getCurrentUser();
      if (!user) throw new Error('Falha ao criar usuário');

      return {
        success: true,
        data: user,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha no cadastro',
        timestamp: new Date()
      };
    }
  }

  async signOut(): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return {
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao sair',
        timestamp: new Date()
      };
    }
  }

  // ===== GESTÃO DE HOUSEHOLD =====

  async getHousehold(householdId?: string): Promise<Household | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const targetHouseholdId = householdId || user.householdId;
      if (!targetHouseholdId) return null;

      const { data, error } = await supabase
        .from('households')
        .select(`
          *,
          locations (*),
          appliances (*)
        `)
        .eq('id', targetHouseholdId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar household:', error);
      return null;
    }
  }

  async createHousehold(name: string): Promise<ServiceResponse<Household>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('households')
        .insert({
          name,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const household = await this.getHousehold(data.id);
      if (!household) throw new Error('Falha ao buscar household criado');

      return {
        success: true,
        data: household,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao criar household',
        timestamp: new Date()
      };
    }
  }

  // ===== GESTÃO DE PRODUTOS =====

  async getProducts(filters?: SearchFilters): Promise<ServiceResponse<Product[]>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      let query = supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);

      // Aplicar filtros
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.expiryStatus) {
        switch (filters.expiryStatus) {
          case 'expired':
            query = query.lt('sealed_expiry_date', new Date().toISOString());
            break;
          case 'expiring_soon':
            const soonDate = new Date();
            soonDate.setDate(soonDate.getDate() + 7);
            query = query.gte('sealed_expiry_date', new Date().toISOString())
                      .lte('sealed_expiry_date', soonDate.toISOString());
            break;
          case 'fresh':
            query = query.gt('sealed_expiry_date', new Date().toISOString());
            break;
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: (data || []).map(mapProductRow),
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao buscar produtos',
        timestamp: new Date()
      };
    }
  }

  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<Product>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const normalizedProduct = {
        ...productData,
        householdId: productData.householdId || user.householdId || ''
      };

      const { data, error } = await supabase
        .from('products')
        .insert({
          ...toProductRow(normalizedProduct, user.id),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: mapProductRow(data),
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao criar produto',
        timestamp: new Date()
      };
    }
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<ServiceResponse<Product>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('products')
        .update(toProductUpdateRow(updates))
        .eq('id', productId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: mapProductRow(data),
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao atualizar produto',
        timestamp: new Date()
      };
    }
  }

  async deleteProduct(productId: string): Promise<ServiceResponse<void>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('user_id', user.id);

      if (error) throw error;

      return {
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao deletar produto',
        timestamp: new Date()
      };
    }
  }

  // ===== GESTÃO DE LISTAS DE COMPRAS =====

  async getShoppingLists(): Promise<ServiceResponse<ShoppingList[]>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('shopping_lists')
        .select(`
          *,
          items (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao buscar listas de compras',
        timestamp: new Date()
      };
    }
  }

  async createShoppingList(listData: Omit<ShoppingList, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<ShoppingList>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('shopping_lists')
        .insert({
          user_id: user.id,
          household_id: listData.householdId || user.householdId,
          created_by: listData.createdBy || user.id,
          name: listData.name,
          status: listData.status,
          budget: listData.budget,
          currency: listData.currency,
          planned_for: listData.plannedFor?.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao criar lista de compras',
        timestamp: new Date()
      };
    }
  }

  // ===== GESTÃO DE NOTIFICAÇÕES =====

  async getNotifications(): Promise<ServiceResponse<Notification[]>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao buscar notificações',
        timestamp: new Date()
      };
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<ServiceResponse<void>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      return {
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao marcar notificação como lida',
        timestamp: new Date()
      };
    }
  }

  // ===== GESTÃO DE APARELHOS =====

  async getAppliances(): Promise<ServiceResponse<Appliance[]>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('appliances')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao buscar aparelhos',
        timestamp: new Date()
      };
    }
  }

  async createAppliance(applianceData: Omit<Appliance, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResponse<Appliance>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('appliances')
        .insert({
          user_id: user.id,
          name: applianceData.name,
          appliance_type: applianceData.applianceType,
          location: applianceData.location,
          model: applianceData.model,
          is_active: applianceData.isActive,
          position_description: applianceData.positionDescription,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao criar aparelho',
        timestamp: new Date()
      };
    }
  }

  // ===== UTILITÁRIOS =====

  async searchProducts(query: string, filters?: SearchFilters): Promise<ServiceResponse<Product[]>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      let supabaseQuery = supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .ilike('name', `%${query}%`);

      // Aplicar filtros adicionais
      if (filters?.category) {
        supabaseQuery = supabaseQuery.eq('category', filters.category);
      }

      const { data, error } = await supabaseQuery.order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha na busca de produtos',
        timestamp: new Date()
      };
    }
  }

  async getDashboardStats(): Promise<ServiceResponse<any>> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar estatísticas básicas
      const [
        productsResult,
        expiringResult,
        expiredResult
      ] = await Promise.all([
        supabase.from('products').select('id').eq('user_id', user.id),
        supabase.from('products').select('id').eq('user_id', user.id).gte('sealed_expiry_date', new Date().toISOString()).lte('sealed_expiry_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('products').select('id').eq('user_id', user.id).lt('sealed_expiry_date', new Date().toISOString())
      ]);

      const stats = {
        totalProducts: productsResult.data?.length || 0,
        expiringSoon: expiringResult.data?.length || 0,
        expired: expiredResult.data?.length || 0
      };

      return {
        success: true,
        data: stats,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha ao buscar estatísticas',
        timestamp: new Date()
      };
    }
  }
}

// Exportar instância única
export const coreService = CoreService.getInstance();
