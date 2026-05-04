import { supabase } from '../lib/supabase';
import { ExpiryService } from './expiryService';

/**
 * Serviço de lista de compras inteligente
 * Gerencia listas, sugestões e modo mercado
 */

export interface ShoppingItem {
  id: string;
  productId?: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_cart' | 'purchased' | 'not_found';
  price?: number;
  estimatedPrice?: number;
  notes?: string;
  alternatives?: string[];
  barcode?: string;
  addedAt: Date;
  purchasedAt?: Date;
  purchasedQuantity?: number;
  purchasedPrice?: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  householdId: string;
  createdBy: string;
  status: 'draft' | 'active' | 'shopping' | 'completed';
  storeId?: string;
  storeName?: string;
  budget?: number;
  currency?: string;
  items: ShoppingItem[];
  createdAt: Date;
  updatedAt: Date;
  plannedFor?: Date;
  completedAt?: Date;
}

export interface ShoppingSession {
  id: string;
  listId: string;
  userId: string;
  storeId?: string;
  startTime: Date;
  endTime?: Date;
  estimatedBudget?: number;
  currentSpent: number;
  itemsChecked: number;
  totalItems: number;
  voiceMode: boolean;
  barcodeScanning: boolean;
  status: 'active' | 'paused' | 'completed';
}

export class ShoppingService {
  /**
   * Cria nova lista de compras
   */
  static async createShoppingList(
    name: string,
    householdId: string,
    userId: string,
    storeId?: string
  ): Promise<ShoppingList> {
    try {
      const { data } = await supabase
        .from('shopping_lists')
        .insert({
          name,
          household_id: householdId,
          created_by: userId,
          store_id: storeId,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      return this.formatShoppingList(data);
    } catch (error) {
      console.error('Erro ao criar lista de compras:', error);
      throw error;
    }
  }

  /**
   * Gera sugestões inteligentes de compras
   */
  static async generateShoppingSuggestions(householdId: string): Promise<any[]> {
    try {
      const suggestions = [];

      // 1. Produtos com baixo estoque
      const lowStockSuggestions = await this.generateLowStockSuggestions(householdId);
      suggestions.push(...lowStockSuggestions);

      // 2. Produtos vencendo em breve
      const expirySuggestions = await ExpiryService.generateExpiryBasedSuggestions(householdId);
      suggestions.push(...expirySuggestions);

      // 3. Produtos habituais (baseado em histórico)
      const habitualSuggestions = await this.generateHabitualSuggestions(householdId);
      suggestions.push(...habitualSuggestions);

      // Remover duplicatas e ordenar por prioridade
      const uniqueSuggestions = this.deduplicateSuggestions(suggestions);
      return uniqueSuggestions.sort((a, b) => b.priority - a.priority);
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      return [];
    }
  }

  /**
   * Gera sugestões baseadas em baixo estoque
   */
  private static async generateLowStockSuggestions(householdId: string): Promise<any[]> {
    try {
      // Buscar produtos com baixo estoque
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('household_id', householdId)
        .not('consumption->>current_quantity', 'is', null);

      const suggestions = [];

      for (const product of products || []) {
        const currentQuantity = (product.consumption as any)?.current_quantity || 0;
        const originalQuantity = (product.consumption as any)?.original_quantity || 1;
        const stockPercentage = currentQuantity / originalQuantity;

        if (stockPercentage <= 0.3) {
          const priority = stockPercentage === 0 ? 10 : stockPercentage <= 0.1 ? 8 : 5;

          suggestions.push({
            household_id: householdId,
            product_id: product.id,
            product_name: product.name,
            reason_type: 'low_stock',
            reason_description: `Estoque baixo: ${Math.round(stockPercentage * 100)}% disponível`,
            priority,
            confidence: 0.8,
            estimated_price: this.estimateProductPrice(product.name, product.category),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Erro ao gerar sugestões de baixo estoque:', error);
      return [];
    }
  }

  /**
   * Gera sugestões baseadas em hábitos
   */
  private static async generateHabitualSuggestions(householdId: string): Promise<any[]> {
    try {
      // Buscar histórico de consumo dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: consumptionHistory } = await supabase
        .from('consumption_history')
        .select(`
          quantity_consumed,
          date,
          products!inner(name, category)
        `)
        .gte('date', thirtyDaysAgo.toISOString())
        .eq('reason', 'consumption');

      if (!consumptionHistory) return [];

      // Agrupar por produto e calcular frequência
      const productFrequency = new Map();

      for (const record of consumptionHistory) {
        const productName = (record.products as any).name;
        const current = productFrequency.get(productName) || { count: 0, totalQuantity: 0, category: (record.products as any).category };
        
        productFrequency.set(productName, {
          count: current.count + 1,
          totalQuantity: current.totalQuantity + record.quantity_consumed,
          category: current.category
        });
      }

      // Gerar sugestões para produtos consumidos frequentemente
      const suggestions = [];

      for (const [productName, data] of Array.from(productFrequency.entries())) {
        // Se consumido mais de 2 vezes por semana em média
        if (data.count >= 4) {
          suggestions.push({
            household_id: householdId,
            product_name: productName,
            reason_type: 'habitual',
            reason_description: `Consumido ${data.count} vezes nos últimos 30 dias`,
            priority: 3,
            confidence: 0.6,
            estimated_price: this.estimateProductPrice(productName, data.category),
            expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Erro ao gerar sugestões habituais:', error);
      return [];
    }
  }

  /**
   * Remove sugestões duplicadas
   */
  private static deduplicateSuggestions(suggestions: any[]): any[] {
    const seen = new Set();
    return suggestions.filter(suggestion => {
      const key = `${suggestion.product_name}-${suggestion.reason_type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Estima preço de produto
   */
  private static estimateProductPrice(productName: string, category: string): number {
    // Preços médios por categoria (em BRL)
    const categoryPrices: Record<string, number> = {
      'Laticínios': 8,
      'Carnes': 25,
      'Vegetais': 6,
      'Frutas': 8,
      'Grãos': 15,
      'Bebidas': 12,
      'Congelados': 20,
      'Padaria': 10,
      'Snacks': 12,
      'Condimentos': 15,
      'Limpeza': 18,
      'Higiene': 22
    };

    return categoryPrices[category] || 10;
  }

  /**
   * Adiciona item à lista de compras
   */
  static async addItemToList(
    listId: string,
    item: Omit<ShoppingItem, 'id' | 'addedAt'>
  ): Promise<ShoppingItem> {
    try {
      const { data } = await supabase
        .from('shopping_list_items')
        .insert({
          list_id: listId,
          product_id: item.productId,
          name: item.name,
          category_id: item.category,
          quantity: item.quantity,
          unit: item.unit,
          priority: item.priority,
          status: item.status,
          price: item.price,
          estimated_price: item.estimatedPrice,
          notes: item.notes,
          alternatives: item.alternatives,
          barcode: item.barcode,
          added_at: new Date().toISOString()
        })
        .select()
        .single();

      return this.formatShoppingItem(data);
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      throw error;
    }
  }

  /**
   * Atualiza status do item na lista
   */
  static async updateItemStatus(
    itemId: string,
    status: ShoppingItem['status'],
    purchasedQuantity?: number,
    purchasedPrice?: number
  ): Promise<void> {
    try {
      const updateData: any = { status };

      if (status === 'purchased') {
        updateData.purchased_at = new Date().toISOString();
        if (purchasedQuantity !== undefined) updateData.purchased_quantity = purchasedQuantity;
        if (purchasedPrice !== undefined) updateData.purchased_price = purchasedPrice;
      }

      await supabase
        .from('shopping_list_items')
        .update(updateData)
        .eq('id', itemId);
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      throw error;
    }
  }

  /**
   * Inicia sessão de compras no mercado
   */
  static async startShoppingSession(
    listId: string,
    userId: string,
    storeId?: string,
    estimatedBudget?: number
  ): Promise<ShoppingSession> {
    try {
      // Atualizar status da lista para 'shopping'
      await supabase
        .from('shopping_lists')
        .update({ status: 'shopping' })
        .eq('id', listId);

      // Obter total de itens
      const { data: items } = await supabase
        .from('shopping_list_items')
        .select('id')
        .eq('list_id', listId);

      // Criar sessão
      const { data } = await supabase
        .from('shopping_sessions')
        .insert({
          list_id: listId,
          user_id: userId,
          store_id: storeId,
          start_time: new Date().toISOString(),
          estimated_budget: estimatedBudget,
          current_spent: 0,
          items_checked: 0,
          total_items: items?.length || 0,
          voice_mode: false,
          barcode_scanning: true,
          status: 'active'
        })
        .select()
        .single();

      return this.formatShoppingSession(data);
    } catch (error) {
      console.error('Erro ao iniciar sessão:', error);
      throw error;
    }
  }

  /**
   * Finaliza sessão de compras
   */
  static async completeShoppingSession(sessionId: string): Promise<void> {
    try {
      const endTime = new Date().toISOString();

      await supabase
        .from('shopping_sessions')
        .update({
          end_time: endTime,
          status: 'completed'
        })
        .eq('id', sessionId);

      // Obter listId da sessão
      const { data: session } = await supabase
        .from('shopping_sessions')
        .select('list_id')
        .eq('id', sessionId)
        .single();

      // Atualizar status da lista para 'completed'
      if (session) {
        await supabase
          .from('shopping_lists')
          .update({
            status: 'completed',
            completed_at: endTime
          })
          .eq('id', session.list_id);
      }
    } catch (error) {
      console.error('Erro ao finalizar sessão:', error);
      throw error;
    }
  }

  /**
   * Atualiza progresso da sessão
   */
  static async updateSessionProgress(
    sessionId: string,
    itemsChecked: number,
    currentSpent: number
  ): Promise<void> {
    try {
      await supabase
        .from('shopping_sessions')
        .update({
          items_checked: itemsChecked,
          current_spent: currentSpent
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      throw error;
    }
  }

  /**
   * Busca lista de compras com itens
   */
  static async getShoppingList(listId: string): Promise<ShoppingList | null> {
    try {
      const { data: list } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('id', listId)
        .single();

      if (!list) return null;

      const { data: items } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('list_id', listId)
        .order('added_at', { ascending: true });

      return {
        ...this.formatShoppingList(list),
        items: items?.map(item => this.formatShoppingItem(item)) || []
      };
    } catch (error) {
      console.error('Erro ao buscar lista:', error);
      return null;
    }
  }

  /**
   * Busca listas de compras do usuário
   */
  static async getUserShoppingLists(userId: string): Promise<ShoppingList[]> {
    try {
      const { data: lists } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('created_by', userId)
        .order('updated_at', { ascending: false });

      return lists?.map(list => this.formatShoppingList(list)) || [];
    } catch (error) {
      console.error('Erro ao buscar listas:', error);
      return [];
    }
  }

  /**
   * Formata dados da lista
   */
  private static formatShoppingList(data: any): ShoppingList {
    return {
      id: data.id,
      name: data.name,
      householdId: data.household_id,
      createdBy: data.created_by,
      status: data.status,
      storeId: data.store_id,
      storeName: data.store_info?.name,
      budget: data.budget,
      currency: data.currency || 'BRL',
      items: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      plannedFor: data.planned_for ? new Date(data.planned_for) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined
    };
  }

  /**
   * Formata dados do item
   */
  private static formatShoppingItem(data: any): ShoppingItem {
    return {
      id: data.id,
      productId: data.product_id,
      name: data.name,
      category: data.category_id,
      quantity: data.quantity,
      unit: data.unit,
      priority: data.priority,
      status: data.status,
      price: data.price,
      estimatedPrice: data.estimated_price,
      notes: data.notes,
      alternatives: data.alternatives,
      barcode: data.barcode,
      addedAt: new Date(data.added_at),
      purchasedAt: data.purchased_at ? new Date(data.purchased_at) : undefined,
      purchasedQuantity: data.purchased_quantity,
      purchasedPrice: data.purchased_price
    };
  }

  /**
   * Formata dados da sessão
   */
  private static formatShoppingSession(data: any): ShoppingSession {
    return {
      id: data.id,
      listId: data.list_id,
      userId: data.user_id,
      storeId: data.store_id,
      startTime: new Date(data.start_time),
      endTime: data.end_time ? new Date(data.end_time) : undefined,
      estimatedBudget: data.estimated_budget,
      currentSpent: data.current_spent,
      itemsChecked: data.items_checked,
      totalItems: data.total_items,
      voiceMode: data.voice_mode,
      barcodeScanning: data.barcode_scanning,
      status: data.status
    };
  }

  /**
   * Calcula estatísticas da lista
   */
  static calculateListStats(list: ShoppingList): {
    totalItems: number;
    checkedItems: number;
    purchasedItems: number;
    notFoundItems: number;
    totalEstimated: number;
    totalSpent: number;
    completionPercentage: number;
  } {
    const totalItems = list.items.length;
    const checkedItems = list.items.filter(item => item.status === 'in_cart').length;
    const purchasedItems = list.items.filter(item => item.status === 'purchased').length;
    const notFoundItems = list.items.filter(item => item.status === 'not_found').length;
    
    const totalEstimated = list.items.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
    const totalSpent = list.items.reduce((sum, item) => sum + (item.purchasedPrice || 0), 0);
    
    const completionPercentage = totalItems > 0 ? (purchasedItems / totalItems) * 100 : 0;

    return {
      totalItems,
      checkedItems,
      purchasedItems,
      notFoundItems,
      totalEstimated,
      totalSpent,
      completionPercentage
    };
  }

  /**
   * Busca lojas favoritas
   */
  static async getFavoriteStores(userId: string): Promise<any[]> {
    try {
      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', userId)
        .eq('is_favorite', true)
        .order('name');

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
      return [];
    }
  }

  /**
   * Adiciona loja favorita
   */
  static async addFavoriteStore(
    userId: string,
    name: string,
    address?: string
  ): Promise<void> {
    try {
      await supabase
        .from('stores')
        .insert({
          user_id: userId,
          name,
          address,
          is_favorite: true,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erro ao adicionar loja:', error);
      throw error;
    }
  }
}
