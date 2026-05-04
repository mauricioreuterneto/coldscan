import { useState } from 'react';
import { Product } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '../utils';

export function useProducts() {
  const [products, setProducts] = useLocalStorage<Product[]>('fridge-products', []);
  
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: generateId(),
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => 
      prev.map(product => 
        product.id === id ? { ...product, ...updates } : product
      )
    );
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const getProduct = (id: string): Product | undefined => {
    return products.find(product => product.id === id);
  };

  const getProductsByCompartment = (compartmentId: string): Product[] => {
    return products.filter(product => product.location.compartmentId === compartmentId);
  };

  const clearProducts = () => {
    setProducts([]);
  };

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    getProductsByCompartment,
    clearProducts,
  };
}
