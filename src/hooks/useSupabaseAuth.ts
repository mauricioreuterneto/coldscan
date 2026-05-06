import { useState, useEffect } from 'react';
import { supabaseService } from '../lib/supabase';

interface User {
  id: string;
  email?: string;
  user_metadata?: any;
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let loadingTimeout: NodeJS.Timeout;

    // Verificar usuário atual
    const getCurrentUser = async () => {
      try {
        const currentUser = await supabaseService.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar usuário');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getCurrentUser();

    // Timeout para garantir que loading nunca fique preso
    loadingTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    // Listener de mudanças de autenticação
    const { data: { subscription } } = supabaseService.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event);
        if (isMounted) {
          setUser(session?.user || null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { user } = await supabaseService.signIn(email, password);
      setUser(user);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await supabaseService.signUp(email, password);
      // Não fazer login automático após cadastro
      return { success: true, requiresEmailConfirmation: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar conta';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await supabaseService.signOut();
      setUser(null);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao sair';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };
}
