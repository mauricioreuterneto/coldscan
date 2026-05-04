import { useState, useEffect } from 'react';
import { supabaseService } from '../lib/supabase';
import { useSupabaseAuth } from './useSupabaseAuth';

interface Product {
  id: string;
  user_id: string;
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
  created_at: string;
  updated_at: string;
}

export function useSupabaseProducts() {
  const { user } = useSupabaseAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await supabaseService.getProducts(user.id);
      setProducts(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produtos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (productData: any) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    setLoading(true);
    setError(null);
    
    try {
      const newProduct = await supabaseService.createProduct({
        ...productData,
        user_id: user.id,
      });
      setProducts(prev => [newProduct, ...prev]);
      return { success: true, product: newProduct };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar produto';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: string, updates: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedProduct = await supabaseService.updateProduct(id, updates);
      setProducts(prev => 
        prev.map(product => 
          product.id === id ? { ...product, ...updatedProduct } : product
        )
      );
      return { success: true, product: updatedProduct };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar produto';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await supabaseService.deleteProduct(id);
      setProducts(prev => prev.filter(product => product.id !== id));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar produto';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const uploadProductImage = async (file: File) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      const imageUrl = await supabaseService.uploadImage(file, user.id);
      return { success: true, imageUrl };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer upload da imagem';
      return { success: false, error: errorMessage };
    }
  };

  return {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    uploadProductImage,
    refreshProducts: loadProducts,
  };
}
