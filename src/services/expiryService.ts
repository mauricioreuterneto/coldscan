import { Product } from '../types/unified';
import { supabase } from '../lib/supabase';

/**
 * Serviço de validade inteligente
 * Gerencia diferentes datas de validade para produtos abertos vs fechados
 */

export class ExpiryService {
  // Regras padrão de validade por categoria
  private static defaultExpiryRules: Record<string, { sealed: number; opened: number }> = {
    'Laticínios': { sealed: 7, opened: 3 },
    'Carnes': { sealed: 3, opened: 1 },
    'Vegetais': { sealed: 5, opened: 2 },
    'Frutas': { sealed: 7, opened: 3 },
    'Grãos': { sealed: 30, opened: 7 },
    'Bebidas': { sealed: 90, opened: 7 },
    'Congelados': { sealed: 180, opened: 30 },
    'Padaria': { sealed: 3, opened: 1 },
    'Snacks': { sealed: 60, opened: 30 },
    'Condimentos': { sealed: 365, opened: 180 },
    'Limpeza': { sealed: 365, opened: 365 },
    'Higiene': { sealed: 365, opened: 365 }
  };

  /**
   * Calcula datas de validade para um produto
   */
  static async calculateExpiryDates(
    productName: string, 
    category: string, 
    purchaseDate?: Date,
    isCustomRule: boolean = false
  ): Promise<{
    sealedExpiryDate?: Date;
    openedExpiryDate?: Date;
    bestBeforeDate?: Date;
    freezeByDate?: Date;
    rules: { sealed: number; opened: number };
  }> {
    const rules = await this.getExpiryRules(category, productName, isCustomRule);
    const baseDate = purchaseDate || new Date();

    return {
      sealedExpiryDate: new Date(baseDate.getTime() + rules.sealed * 24 * 60 * 60 * 1000),
      openedExpiryDate: new Date(baseDate.getTime() + rules.opened * 24 * 60 * 60 * 1000),
      bestBeforeDate: new Date(baseDate.getTime() + (rules.sealed + 7) * 24 * 60 * 60 * 1000),
      freezeByDate: new Date(baseDate.getTime() + rules.sealed * 24 * 60 * 60 * 1000),
      rules
    };
  }

  /**
   * Obtém regras de validade para uma categoria/produto
   */
  static async getExpiryRules(
    category: string, 
    productName?: string, 
    isCustomRule: boolean = false
  ): Promise<{ sealed: number; opened: number }> {
    try {
      // Buscar regras personalizadas no banco
      if (isCustomRule && productName) {
        const { data } = await supabase
          .from('product_categories')
          .select('default_expiry_rules')
          .eq('name', category)
          .single();

        if (data?.default_expiry_rules) {
          const rules = data.default_expiry_rules as any;
          return {
            sealed: rules.sealed_days || this.defaultExpiryRules[category]?.sealed || 7,
            opened: rules.opened_days || this.defaultExpiryRules[category]?.opened || 3
          };
        }
      }

      // Retornar regras padrão
      return this.defaultExpiryRules[category] || { sealed: 7, opened: 3 };
    } catch (error) {
      console.error('Erro ao obter regras de validade:', error);
      return { sealed: 7, opened: 3 };
    }
  }

  /**
   * Atualiza estado do produto quando aberto
   */
  static async openProduct(productId: string): Promise<void> {
    try {
      const { data: product } = await supabase
        .from('products')
        .select('current_state, sealed_expiry_date, category')
        .eq('id', productId)
        .single();

      if (!product) throw new Error('Produto não encontrado');

      const rules = await this.getExpiryRules(product.category);
      const now = new Date();
      
      // Calcular nova data de validade para produto aberto
      const openedExpiryDate = new Date(now.getTime() + rules.opened * 24 * 60 * 60 * 1000);

      // Atualizar produto
      await supabase
        .from('products')
        .update({
          current_state: {
            ...product.current_state,
            status: 'opened',
            openedAt: now.toISOString(),
            condition: 'fresh'
          },
          opened_expiry_date: openedExpiryDate.toISOString(),
          expiry_metadata: {
            days_until_opened_expiry: rules.opened,
            is_expiring_soon: rules.opened <= 3,
            is_expired: false,
            was_opened_at: now.toISOString()
          }
        })
        .eq('id', productId);

      // Registrar consumo
      await this.recordConsumption(productId, 0, 'consumption', 'Produto aberto');

    } catch (error) {
      console.error('Erro ao abrir produto:', error);
      throw error;
    }
  }

  /**
   * Atualiza estado do produto quando consumido parcialmente
   */
  static async consumeProduct(
    productId: string, 
    quantityConsumed: number, 
    notes?: string
  ): Promise<void> {
    try {
      const { data: product } = await supabase
        .from('products')
        .select('consumption, current_state')
        .eq('id', productId)
        .single();

      if (!product) throw new Error('Produto não encontrado');

      const currentQuantity = (product.consumption as any)?.current_quantity || 0;
      const newQuantity = Math.max(0, currentQuantity - quantityConsumed);

      const newState = newQuantity === 0 ? 'finished' : 
                      newQuantity < (product.consumption as any)?.original_quantity * 0.2 ? 'partially_consumed' : 
                      (product.current_state as any)?.status || 'sealed';

      await supabase
        .from('products')
        .update({
          consumption: {
            ...(product.consumption as any),
            current_quantity: newQuantity,
            last_consumed_at: new Date().toISOString()
          },
          current_state: {
            ...(product.current_state as any),
            status: newState,
            lastConsumedAt: new Date().toISOString(),
            remainingPercentage: newQuantity > 0 ? (newQuantity / (product.consumption as any)?.original_quantity) * 100 : 0
          }
        })
        .eq('id', productId);

      await this.recordConsumption(productId, quantityConsumed, 'consumption', notes);

    } catch (error) {
      console.error('Erro ao consumir produto:', error);
      throw error;
    }
  }

  /**
   * Registra histórico de consumo
   */
  static async recordConsumption(
    productId: string, 
    quantity: number, 
    reason: 'consumption' | 'waste' | 'donation' | 'other',
    notes?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from('consumption_history')
        .insert({
          product_id: productId,
          quantity_consumed: quantity,
          reason,
          notes,
          user_id: user?.id,
          date: new Date().toISOString()
        });

    } catch (error) {
      console.error('Erro ao registrar consumo:', error);
    }
  }

  /**
   * Obtém produtos próximos do vencimento
   */
  static async getExpiringSoonProducts(householdId: string, days: number = 3): Promise<Product[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + days);

      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('household_id', householdId)
        .or(`sealed_expiry_date.lte.${cutoffDate.toISOString()},opened_expiry_date.lte.${cutoffDate.toISOString()}`)
        .order('sealed_expiry_date', { ascending: true });

      return data as Product[];
    } catch (error) {
      console.error('Erro ao buscar produtos vencendo:', error);
      return [];
    }
  }

  /**
   * Obtém produtos vencidos
   */
  static async getExpiredProducts(householdId: string): Promise<Product[]> {
    try {
      const now = new Date().toISOString();

      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('household_id', householdId)
        .or(`sealed_expiry_date.lt.${now},opened_expiry_date.lt.${now}`)
        .order('sealed_expiry_date', { ascending: true });

      return data as Product[];
    } catch (error) {
      console.error('Erro ao buscar produtos vencidos:', error);
      return [];
    }
  }

  /**
   * Calcula status de validade de um produto
   */
  static getExpiryStatus(product: any): {
    status: 'safe' | 'expiring_today' | 'expiring_soon' | 'expired';
    daysUntilExpiry: number;
    isExpiringSoon: boolean;
    isExpired: boolean;
    expiryType: 'sealed' | 'opened' | 'best_before' | 'freeze_by';
    nextExpiryDate?: Date;
  } {
    const now = new Date();
    const dates = [
      { type: 'sealed' as const, date: product.sealed_expiry_date ? new Date(product.sealed_expiry_date) : null },
      { type: 'opened' as const, date: product.opened_expiry_date ? new Date(product.opened_expiry_date) : null },
      { type: 'best_before' as const, date: product.best_before_date ? new Date(product.best_before_date) : null },
      { type: 'freeze_by' as const, date: product.freeze_by_date ? new Date(product.freeze_by_date) : null }
    ].filter(d => d.date);

    if (dates.length === 0) {
      return {
        status: 'safe',
        daysUntilExpiry: 999,
        isExpiringSoon: false,
        isExpired: false,
        expiryType: 'sealed',
        nextExpiryDate: undefined
      };
    }

    // Encontrar a próxima data de validade
    const nextExpiry = dates.reduce((earliest, current) => 
      current.date! < earliest.date! ? current : earliest
    );

    const daysUntil = Math.floor((nextExpiry.date!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    const isExpired = daysUntil < 0;
    const isExpiringSoon = daysUntil <= 3 && daysUntil >= 0;

    let status: 'safe' | 'expiring_today' | 'expiring_soon' | 'expired' = 'safe';
    if (isExpired) status = 'expired';
    else if (daysUntil === 0) status = 'expiring_today';
    else if (isExpiringSoon) status = 'expiring_soon';

    return {
      status,
      daysUntilExpiry: daysUntil,
      isExpiringSoon,
      isExpired,
      expiryType: nextExpiry.type,
      nextExpiryDate: nextExpiry.date || undefined
    };
  }

  /**
   * Gera sugestões de compras baseadas em produtos vencendo
   */
  static async generateExpiryBasedSuggestions(householdId: string): Promise<any[]> {
    try {
      const expiringSoon = await this.getExpiringSoonProducts(householdId, 7);
      const suggestions = [];

      for (const product of expiringSoon) {
        const status = this.getExpiryStatus(product);
        
        // Se vence em 3 dias ou menos, sugerir reposição
        if (status.daysUntilExpiry <= 3) {
          suggestions.push({
            household_id: householdId,
            product_id: product.id,
            product_name: product.name,
            reason_type: 'expiring_soon',
            reason_description: `Vence em ${status.daysUntilExpiry} dias`,
            priority: status.daysUntilExpiry <= 1 ? 10 : 5,
            confidence: 0.9,
            expires_at: (product as any).sealed_expiry_date
          });
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      return [];
    }
  }

  /**
   * Verifica se produto precisa ser consumido urgentemente
   */
  static async getUrgentConsumptionAlerts(householdId: string): Promise<Product[]> {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('household_id', householdId)
        .or(`sealed_expiry_date.lte.${tomorrow.toISOString()},opened_expiry_date.lte.${tomorrow.toISOString()}`)
        .eq('current_state->>status', 'opened')
        .order('sealed_expiry_date', { ascending: true });

      return data as Product[];
    } catch (error) {
      console.error('Erro ao buscar alertas urgentes:', error);
      return [];
    }
  }

  /**
   * Atualiza validade de produtos em lote
   */
  static async batchUpdateExpiryStatus(householdId: string): Promise<void> {
    try {
      const { data: products } = await supabase
        .from('products')
        .select('id, sealed_expiry_date, opened_expiry_date')
        .eq('household_id', householdId);

      if (!products) return;

      for (const product of products) {
        const status = this.getExpiryStatus(product as any);
        
        await supabase
          .from('products')
          .update({
            expiry_metadata: {
              days_until_sealed_expiry: product.sealed_expiry_date ? 
                Math.floor((product.sealed_expiry_date.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)) : null,
              days_until_opened_expiry: product.opened_expiry_date ? 
                Math.floor((product.opened_expiry_date.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)) : null,
              is_expiring_soon: status.isExpiringSoon,
              is_expired: status.isExpired,
              last_checked: new Date().toISOString()
            }
          })
          .eq('id', product.id);
      }
    } catch (error) {
      console.error('Erro ao atualizar validade em lote:', error);
    }
  }

  /**
   * Calcula data ideal para congelamento
   */
  static calculateFreezeDate(product: any): Date | null {
    if (!product.sealed_expiry_date) return null;

    // Regra geral: congelar 3 dias antes do vencimento
    const freezeDate = new Date(product.sealed_expiry_date);
    freezeDate.setDate(freezeDate.getDate() - 3);

    // Se já passou, não pode congelar
    if (freezeDate < new Date()) return null;

    return freezeDate;
  }

  /**
   * Verifica se produto pode ser congelado
   */
  static canFreeze(product: Product): boolean {
    const freezeDate = this.calculateFreezeDate(product);
    return freezeDate !== null && freezeDate > new Date();
  }

  /**
   * Obtém estatísticas de validade
   */
  static async getExpiryStats(householdId: string): Promise<{
    total: number;
    expiringToday: number;
    expiringThisWeek: number;
    expired: number;
    safe: number;
  }> {
    try {
      const now = new Date();
      const today = new Date(now);
      today.setHours(23, 59, 59, 999);
      
      const weekFromNow = new Date(now);
      weekFromNow.setDate(weekFromNow.getDate() + 7);

      const { data: products } = await supabase
        .from('products')
        .select('sealed_expiry_date, opened_expiry_date')
        .eq('household_id', householdId);

      if (!products) return { total: 0, expiringToday: 0, expiringThisWeek: 0, expired: 0, safe: 0 };

      let expiringToday = 0;
      let expiringThisWeek = 0;
      let expired = 0;
      let safe = 0;

      for (const product of products) {
        const status = this.getExpiryStatus(product as any);
        
        if (status.isExpired) expired++;
        else if (status.daysUntilExpiry === 0) expiringToday++;
        else if (status.daysUntilExpiry <= 7) expiringThisWeek++;
        else safe++;
      }

      return {
        total: products.length,
        expiringToday,
        expiringThisWeek,
        expired,
        safe
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { total: 0, expiringToday: 0, expiringThisWeek: 0, expired: 0, safe: 0 };
    }
  }
}
