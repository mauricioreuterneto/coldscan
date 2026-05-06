import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../lib/supabase';
import { useSupabaseAuth } from './useSupabaseAuth';
import { FridgeModel } from '../types/unified';

export function useSupabaseFridgeModel() {
  const { user } = useSupabaseAuth();
  const [fridgeModel, setFridgeModel] = useState<FridgeModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFridgeModel = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await supabaseService.getFridgeModel(user.id);
      setFridgeModel(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar modelo da geladeira';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFridgeModel();
    }
  }, [user, loadFridgeModel]);

  const saveFridgeModel = async (modelData: Omit<FridgeModel, 'id'>) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    setError(null);
    
    try {
      const savedModel = await supabaseService.saveFridgeModel({
        ...modelData,
        user_id: user.id,
        image_url: modelData.image,
      });
      setFridgeModel(savedModel);
      return { success: true, model: savedModel };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar modelo da geladeira';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const clearFridgeModel = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Aqui você poderia implementar a deleção do modelo se necessário
      setFridgeModel(null);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao limpar modelo da geladeira';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    fridgeModel,
    loading,
    error,
    saveFridgeModel,
    clearFridgeModel,
    refreshFridgeModel: loadFridgeModel,
  };
}
