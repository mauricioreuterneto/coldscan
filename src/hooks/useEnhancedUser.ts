import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Household, NotificationPreferences } from '../types/unified';

interface EnhancedUser extends User {
  household?: Household;
  notificationPreferences?: NotificationPreferences;
}

export const useEnhancedUser = () => {
  const [user, setUser] = useState<EnhancedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
    
    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserData();
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Carregar perfil completo do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          *,
          households:household_id (
            id,
            name,
            settings,
            locations:storage_locations(id, name, type, description),
            appliances:appliances(id, name, type, is_primary)
          )
        `)
        .eq('id', authUser.id)
        .single();

      if (!profile) {
        throw new Error('Perfil não encontrado');
      }

      // Carregar preferências de notificação
      const { data: notificationPrefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      const enhancedUser: EnhancedUser = {
        id: authUser.id,
        email: authUser.email || '',
        name: profile.name || authUser.email?.split('@')[0] || '',
        householdId: profile.household_id,
        preferences: profile.preferences || {},
        onboardingCompleted: profile.onboarding_completed || false,
        createdAt: new Date(profile.created_at),
        household: profile.households,
        notificationPreferences: notificationPrefs ? {
          expiryWarnings: notificationPrefs.expiry_warnings,
          lowStockAlerts: notificationPrefs.low_stock_alerts,
          shoppingReminders: notificationPrefs.shopping_reminders,
          weeklyDigest: notificationPrefs.weekly_digest,
          wastePrevention: notificationPrefs.waste_prevention ?? true,
          timeOfDay: notificationPrefs.time_of_day
        } : {
          expiryWarnings: true,
          lowStockAlerts: true,
          shoppingReminders: true,
          weeklyDigest: false,
          wastePrevention: true,
          timeOfDay: 'morning'
        }
      };

      setUser(enhancedUser);
    } catch (err) {
      console.error('Erro ao carregar dados do usuário:', err);
      setError('Erro ao carregar dados do usuário');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<EnhancedUser>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          preferences: updates.preferences,
          onboarding_completed: updates.onboardingCompleted
        })
        .eq('id', user.id);

      if (error) throw error;

      // Atualizar estado local
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  const updateNotificationPreferences = async (preferences: Partial<NotificationPreferences>) => {
    if (!user) return;

    try {
      await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          expiry_warnings: preferences.expiryWarnings,
          low_stock_alerts: preferences.lowStockAlerts,
          shopping_reminders: preferences.shoppingReminders,
          weekly_digest: preferences.weeklyDigest,
          waste_prevention: preferences.wastePrevention,
          time_of_day: preferences.timeOfDay,
          updated_at: new Date().toISOString()
        });

      // Atualizar estado local
      setUser(prev => prev ? {
        ...prev,
        notificationPreferences: {
          ...prev.notificationPreferences!,
          ...preferences
        }
      } : null);
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
  };

  const refreshUserData = async () => {
    await loadUserData();
  };

  return {
    user,
    loading,
    error,
    updateProfile,
    updateNotificationPreferences,
    signOut,
    refreshUserData
  };
};
