import React, { useState } from 'react';
import { FridgeModelSelector } from './components/FridgeModelSelector';
import { FridgeViewer } from './components/FridgeViewer';
import { ProductForm } from './components/ProductForm';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { ProductManager } from './components/ProductManager';
import { ShoppingList } from './components/ShoppingList';
import { Analytics } from './components/Analytics';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useSupabaseFridgeModel } from './hooks/useSupabaseFridgeModel';
import { useSupabaseProducts } from './hooks/useSupabaseProducts';
import { FridgeModel, Product, Compartment } from './types';
import { Plus } from 'lucide-react';
import { getExpiredProducts, getProductsExpiringSoon } from './utils';

type Page = 'setup' | 'home' | 'fridge' | 'products' | 'shopping' | 'analytics' | 'settings';

function App() {
  const { user, signOut } = useSupabaseAuth();
  const { fridgeModel, saveFridgeModel } = useSupabaseFridgeModel();
  const { products, addProduct, updateProduct } = useSupabaseProducts();
  const [currentPage, setCurrentPage] = useState<Page>('setup');
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  // Não usar mais modelos hardcoded - apenas busca online

  React.useEffect(() => {
    if (fridgeModel) {
      setCurrentPage('home');
    }
  }, [fridgeModel]);

  // Se não estiver autenticado, mostrar tela de login
  if (!user) {
    return <Auth />;
  }

  const handleModelSelect = async (model: FridgeModel) => {
    await saveFridgeModel(model);
  };

  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    await addProduct(productData);
    setShowProductForm(false);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductForm(true);
  };

  const handleUpdateProduct = async (productData: Omit<Product, 'id'>) => {
    if (selectedProduct) {
      await updateProduct(selectedProduct.id, productData);
      setShowProductForm(false);
      setSelectedProduct(undefined);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    // Implementar deleteProduct no hook useSupabaseProducts
    console.log('Delete product:', product);
  };

  const handleCompartmentClick = (compartment: Compartment) => {
    const compartmentProducts = products.filter(p => p.location.compartmentId === compartment.id);
    console.log('Compartment clicked:', compartment.name, compartmentProducts);
  };

  const handleProductClick = (product: Product) => {
    handleEditProduct(product);
  };

  const expiredProducts = getExpiredProducts(products);
  const expiringSoonProducts = getProductsExpiringSoon(products);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Dashboard
            fridgeModel={fridgeModel!}
            products={products}
            user={user!}
            currentPage={currentPage}
            setCurrentPage={(page: string) => setCurrentPage(page as Page)}
            onSignOut={signOut}
            onAddProduct={() => {
              setSelectedProduct(undefined);
              setShowProductForm(true);
            }}
            onEditProduct={handleEditProduct}
            onCompartmentClick={handleCompartmentClick}
          />
        );
      
      case 'fridge':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <FridgeViewer
              fridgeModel={fridgeModel!}
              products={products}
              onCompartmentClick={handleCompartmentClick}
              onProductClick={handleProductClick}
            />
            <button
              onClick={() => {
                setSelectedProduct(undefined);
                setShowProductForm(true);
              }}
              className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        );
      
      case 'products':
        return (
          <ProductManager
            products={products}
            compartments={fridgeModel!.compartments}
            onAddProduct={() => {
              setSelectedProduct(undefined);
              setShowProductForm(true);
            }}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        );
      
      case 'shopping':
        return (
          <ShoppingList
            products={products}
            onUpdateProduct={updateProduct}
          />
        );
      
      case 'analytics':
        return (
          <Analytics
            products={products}
            fridgeModel={fridgeModel!}
          />
        );
      
      case 'settings':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-2xl font-bold mb-6">Configurações</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Modelo da Geladeira</h3>
                  {fridgeModel ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium">{fridgeModel.brand} {fridgeModel.model}</p>
                      <p className="text-sm text-gray-600">{fridgeModel.capacity}L</p>
                      <button
                        onClick={() => setCurrentPage('setup')}
                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Alterar modelo
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCurrentPage('setup')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Configurar Modelo
                    </button>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Estatísticas</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{products.length}</p>
                      <p className="text-sm text-gray-600">Total de Produtos</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{expiredProducts.length}</p>
                      <p className="text-sm text-gray-600">Vencidos</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{expiringSoonProducts.length}</p>
                      <p className="text-sm text-gray-600">Vencendo em breve</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Conta</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-gray-600">{user?.email}</p>
                    </div>
                    <button
                      onClick={signOut}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Sair da Conta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!fridgeModel) {
    return <FridgeModelSelector
      onSelectModel={handleModelSelect}
    />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentPage()}

      {showProductForm && (
        <ProductForm
          compartments={fridgeModel.compartments}
          onSubmit={selectedProduct ? handleUpdateProduct : handleAddProduct}
          onCancel={() => {
            setShowProductForm(false);
            setSelectedProduct(undefined);
          }}
          initialProduct={selectedProduct}
        />
      )}
    </div>
  );
}

export default App;
