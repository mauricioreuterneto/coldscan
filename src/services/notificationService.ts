import { supabase } from '../lib/supabase';
import { ExpiryService } from './expiryService';

/**
 * Serviço de notificações inteligentes
 * Gerencia alertas, lembretes e comunicação com o usuário
 */

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  actionUrl?: string;
  metadata?: any;
  createdAt: Date;
}

export type NotificationType = 
  | 'product_expiring'
  | 'product_expired'
  | 'low_stock'
  | 'shopping_reminder'
  | 'price_alert'
  | 'warranty_expiring'
  | 'maintenance_reminder'
  | 'weekly_digest'
  | 'recipe_suggestion'
  | 'waste_prevention';

export interface NotificationPreferences {
  expiryWarnings: boolean;
  lowStockAlerts: boolean;
  shoppingReminders: boolean;
  weeklyDigest: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
}

export class NotificationService {
  /**
   * Cria notificação
   */
  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    scheduledFor?: Date,
    actionUrl?: string,
    metadata?: any
  ): Promise<Notification> {
    try {
      const { data } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          priority,
          scheduled_for: scheduledFor?.toISOString(),
          action_url: actionUrl,
          metadata: metadata || {},
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      return this.formatNotification(data);
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  /**
   * Gera notificações de produtos vencendo
   */
  static async generateExpiryNotifications(householdId: string): Promise<void> {
    try {
      // Obter usuários do household
      const { data: users } = await supabase
        .from('profiles')
        .select('id, preferences')
        .eq('household_id', householdId);

      if (!users) return;

      // Obter produtos vencendo em breve
      const expiringSoon = await ExpiryService.getExpiringSoonProducts(householdId, 3);
      const expired = await ExpiryService.getExpiredProducts(householdId);

      for (const user of users) {
        const preferences = user.preferences as NotificationPreferences;
        
        if (!preferences.expiryWarnings) continue;

        // Notificações de produtos vencendo hoje
        const expiringToday = expiringSoon.filter(product => {
          const status = ExpiryService.getExpiryStatus(product);
          return status.daysUntilExpiry === 0;
        });

        if (expiringToday.length > 0) {
          await this.createNotification(
            user.id,
            'product_expiring',
            'Produtos vencendo hoje!',
            `Você tem ${expiringToday.length} produto(s) vencendo hoje. Verifique antes que percam a validade.`,
            'high',
            undefined,
            '/storage',
            { productIds: expiringToday.map(p => p.id) }
          );
        }

        // Notificações de produtos vencidos
        if (expired.length > 0) {
          await this.createNotification(
            user.id,
            'product_expired',
            'Atenção: Produtos vencidos!',
            `Você tem ${expired.length} produto(s) vencidos. Considere descartar ou congelar se possível.`,
            'urgent',
            undefined,
            '/storage',
            { productIds: expired.map(p => p.id) }
          );
        }

        // Notificações de produtos vencendo em 3 dias
        const expiringIn3Days = expiringSoon.filter(product => {
          const status = ExpiryService.getExpiryStatus(product);
          return status.daysUntilExpiry > 0 && status.daysUntilExpiry <= 3;
        });

        if (expiringIn3Days.length > 0) {
          await this.createNotification(
            user.id,
            'product_expiring',
            'Produtos vencendo em breve',
            `Você tem ${expiringIn3Days.length} produto(s) vencendo nos próximos 3 dias.`,
            'medium',
            undefined,
            '/storage',
            { productIds: expiringIn3Days.map(p => p.id) }
          );
        }
      }
    } catch (error) {
      console.error('Erro ao gerar notificações de validade:', error);
    }
  }

  /**
   * Gera notificações de baixo estoque
   */
  static async generateLowStockNotifications(householdId: string): Promise<void> {
    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, preferences')
        .eq('household_id', householdId);

      if (!users) return;

      // Buscar produtos com baixo estoque
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('household_id', householdId)
        .not('consumption->>current_quantity', 'is', null);

      if (!products) return;

      for (const user of users) {
        const preferences = user.preferences as NotificationPreferences;
        
        if (!preferences.lowStockAlerts) continue;

        const lowStockProducts = products.filter(product => {
          const currentQuantity = (product.consumption as any)?.current_quantity || 0;
          const originalQuantity = (product.consumption as any)?.original_quantity || 1;
          const stockPercentage = originalQuantity > 0 ? (currentQuantity / originalQuantity) * 100 : 0;
          return stockPercentage <= 20 && currentQuantity > 0;
        });

        const emptyProducts = products.filter(product => {
          const currentQuantity = (product.consumption as any)?.current_quantity || 0;
          return currentQuantity === 0;
        });

        if (lowStockProducts.length > 0) {
          await this.createNotification(
            user.id,
            'low_stock',
            'Estoque baixo',
            `Você tem ${lowStockProducts.length} produto(s) com estoque baixo. Hora de fazer compras!`,
            'medium',
            undefined,
            '/shopping',
            { productIds: lowStockProducts.map(p => p.id) }
          );
        }

        if (emptyProducts.length > 0) {
          await this.createNotification(
            user.id,
            'low_stock',
            'Produtos esgotados',
            `Você tem ${emptyProducts.length} produto(s) esgotados. Adicione à sua lista de compras.`,
            'high',
            undefined,
            '/shopping',
            { productIds: emptyProducts.map(p => p.id) }
          );
        }
      }
    } catch (error) {
      console.error('Erro ao gerar notificações de baixo estoque:', error);
    }
  }

  /**
   * Gera lembretes de compras
   */
  static async generateShoppingReminders(householdId: string): Promise<void> {
    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, preferences')
        .eq('household_id', householdId);

      if (!users) return;

      for (const user of users) {
        const preferences = user.preferences as NotificationPreferences;
        
        if (!preferences.shoppingReminders) continue;

        // Verificar se há listas de compras ativas
        const { data: activeLists } = await supabase
          .from('shopping_lists')
          .select('*')
          .eq('household_id', householdId)
          .in('status', ['draft', 'active']);

        if (activeLists && activeLists.length > 0) {
          await this.createNotification(
            user.id,
            'shopping_reminder',
            'Lista de compras pendente',
            `Você tem ${activeLists.length} lista(s) de compras aguardando. Finalize suas compras!`,
            'medium',
            undefined,
            '/shopping',
            { listIds: activeLists.map(l => l.id) }
          );
        }
      }
    } catch (error) {
      console.error('Erro ao gerar lembretes de compras:', error);
    }
  }

  /**
   * Gera digest semanal
   */
  static async generateWeeklyDigest(householdId: string): Promise<void> {
    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, preferences')
        .eq('household_id', householdId);

      if (!users) return;

      // Obter estatísticas da semana
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: consumedItems } = await supabase
        .from('consumption_history')
        .select('quantity_consumed, reason, date')
        .eq('household_id', householdId)
        .gte('date', weekAgo.toISOString());

      const { data: wastedItems } = await supabase
        .from('wasted_items')
        .select('quantity, reason, estimated_value')
        .eq('household_id', householdId)
        .gte('waste_date', weekAgo.toISOString());

      for (const user of users) {
        const preferences = user.preferences as NotificationPreferences;
        
        if (!preferences.weeklyDigest) continue;

        const totalConsumed = consumedItems?.reduce((sum, item) => sum + item.quantity_consumed, 0) || 0;
        const totalWasted = wastedItems?.reduce((sum, item) => sum + (item.estimated_value || 0), 0) || 0;
        const wasteCount = wastedItems?.length || 0;

        await this.createNotification(
          user.id,
          'weekly_digest',
          'Resumo semanal da cozinha',
          `Esta semana você consumiu ${totalConsumed} itens e desperdiçou ${wasteCount} produtos (R$ ${totalWasted.toFixed(2)}).`,
          'low',
          undefined,
          '/analytics',
          {
            consumed: totalConsumed,
            wasted: wasteCount,
            wasteValue: totalWasted
          }
        );
      }
    } catch (error) {
      console.error('Erro ao gerar digest semanal:', error);
    }
  }

  /**
   * Gera notificações de prevenção de desperdício
   */
  static async generateWastePreventionNotifications(householdId: string): Promise<void> {
    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, preferences')
        .eq('household_id', householdId);

      if (!users) return;

      // Produtos próximos de vencer que estão abertos
      const urgentProducts = await ExpiryService.getUrgentConsumptionAlerts(householdId);

      for (const user of users) {
        const preferences = user.preferences as NotificationPreferences;
        
        if (!preferences.expiryWarnings) continue;

        if (urgentProducts.length > 0) {
          const productNames = urgentProducts.slice(0, 3).map(p => p.name).join(', ');
          const additionalCount = urgentProducts.length > 3 ? ` e mais ${urgentProducts.length - 3}` : '';

          await this.createNotification(
            user.id,
            'waste_prevention',
            'Consuma urgentemente!',
            `Produtos abertos vencendo hoje: ${productNames}${additionalCount}. Consuma agora ou congele!`,
            'urgent',
            undefined,
            '/storage',
            { productIds: urgentProducts.map(p => p.id) }
          );
        }
      }
    } catch (error) {
      console.error('Erro ao gerar notificações de prevenção:', error);
    }
  }

  /**
   * Busca notificações do usuário
   */
  static async getUserNotifications(
    userId: string,
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.is('read_at', null);
      }

      const { data } = await query;
      return data?.map(notification => this.formatNotification(notification)) || [];
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }
  }

  /**
   * Marca notificação como lida
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  /**
   * Marca todas as notificações como lidas
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      throw error;
    }
  }

  /**
   * Exclui notificação
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      throw error;
    }
  }

  /**
   * Obtém preferências de notificação do usuário
   */
  static async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data) {
        return {
          expiryWarnings: data.expiry_warnings,
          lowStockAlerts: data.low_stock_alerts,
          shoppingReminders: data.shopping_reminders,
          weeklyDigest: data.weekly_digest,
          timeOfDay: data.time_of_day
        };
      }

      // Retornar preferências padrão
      return {
        expiryWarnings: true,
        lowStockAlerts: true,
        shoppingReminders: true,
        weeklyDigest: false,
        timeOfDay: 'morning'
      };
    } catch (error) {
      console.error('Erro ao buscar preferências:', error);
      return {
        expiryWarnings: true,
        lowStockAlerts: true,
        shoppingReminders: true,
        weeklyDigest: false,
        timeOfDay: 'morning'
      };
    }
  }

  /**
   * Atualiza preferências de notificação
   */
  static async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          expiry_warnings: preferences.expiryWarnings,
          low_stock_alerts: preferences.lowStockAlerts,
          shopping_reminders: preferences.shoppingReminders,
          weekly_digest: preferences.weeklyDigest,
          time_of_day: preferences.timeOfDay,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      throw error;
    }
  }

  /**
   * Obtém contagem de notificações não lidas
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .is('read_at', null);

      return data?.length || 0;
    } catch (error) {
      console.error('Erro ao contar notificações:', error);
      return 0;
    }
  }

  /**
   * Agenda notificações recorrentes
   */
  static async scheduleRecurringNotifications(): Promise<void> {
    try {
      // Obter todos os usuários com preferências
      const { data: users } = await supabase
        .from('profiles')
        .select('id, household_id, preferences');

      if (!users) return;

      for (const user of users || []) {
        const preferences = user.preferences as NotificationPreferences;
        const householdId = user.household_id;

        if (!householdId) continue;

        // Agendar notificações baseadas no horário preferido
        const now = new Date();
        const scheduledTime = this.calculateNextNotificationTime(now, preferences.timeOfDay);

        // Gerar diferentes tipos de notificações
        if (preferences.expiryWarnings) {
          await this.generateExpiryNotifications(householdId);
        }

        if (preferences.lowStockAlerts) {
          await this.generateLowStockNotifications(householdId);
        }

        if (preferences.shoppingReminders) {
          await this.generateShoppingReminders(householdId);
        }

        // Digest semanal (todo domingo)
        if (preferences.weeklyDigest && now.getDay() === 0) {
          await this.generateWeeklyDigest(householdId);
        }

        // Prevenção de desperdício (todo dia)
        await this.generateWastePreventionNotifications(householdId);
      }
    } catch (error) {
      console.error('Erro ao agendar notificações:', error);
    }
  }

  /**
   * Calcula próximo horário de notificação baseado na preferência
   */
  private static calculateNextNotificationTime(
    now: Date,
    timeOfDay: 'morning' | 'afternoon' | 'evening'
  ): Date {
    const nextTime = new Date(now);
    
    switch (timeOfDay) {
      case 'morning':
        nextTime.setHours(9, 0, 0, 0);
        break;
      case 'afternoon':
        nextTime.setHours(14, 0, 0, 0);
        break;
      case 'evening':
        nextTime.setHours(18, 0, 0, 0);
        break;
    }

    // Se já passou do horário hoje, agendar para amanhã
    if (nextTime <= now) {
      nextTime.setDate(nextTime.getDate() + 1);
    }

    return nextTime;
  }

  /**
   * Formata dados da notificação
   */
  private static formatNotification(data: any): Notification {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority,
      scheduledFor: data.scheduled_for ? new Date(data.scheduled_for) : undefined,
      sentAt: data.sent_at ? new Date(data.sent_at) : undefined,
      readAt: data.read_at ? new Date(data.read_at) : undefined,
      actionUrl: data.action_url,
      metadata: data.metadata,
      createdAt: new Date(data.created_at)
    };
  }

  /**
   * Limpa notificações antigas
   */
  static async cleanupOldNotifications(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .not('read_at', null); // Apenas exclui notificações lidas
    } catch (error) {
      console.error('Erro ao limpar notificações antigas:', error);
    }
  }

  /**
   * Obtém estatísticas de notificações
   */
  static async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    thisWeek: number;
    byType: Record<NotificationType, number>;
  }> {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: allNotifications } = await supabase
        .from('notifications')
        .select('type, created_at, read_at')
        .eq('user_id', userId);

      const { data: unreadNotifications } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .is('read_at', null);

      const thisWeekNotifications = allNotifications?.filter(n => 
        new Date(n.created_at) >= weekAgo
      ) || [];

      const byType = allNotifications?.reduce((acc, notification) => {
        acc[notification.type as NotificationType] = 
          (acc[notification.type as NotificationType] || 0) + 1;
        return acc;
      }, {} as Record<NotificationType, number>) || {} as Record<NotificationType, number>;

      return {
        total: allNotifications?.length || 0,
        unread: unreadNotifications?.length || 0,
        thisWeek: thisWeekNotifications.length,
        byType
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        total: 0,
        unread: 0,
        thisWeek: 0,
        byType: {} as Record<NotificationType, number>
      };
    }
  }
}
