import React, { useState } from 'react';
import { FridgeModelSelector } from './components/FridgeModelSelector';
import { FridgeViewer } from './components/FridgeViewer';
import { ProductForm } from './components/ProductForm';
import { useFridgeModel } from './hooks/useFridgeModel';
import { useProducts } from './hooks/useProducts';
import { FridgeModel, Product, Compartment } from './types';
import { Plus, Search, AlertCircle, Package, Settings, Home } from 'lucide-react';
import { getExpiredProducts, getProductsExpiringSoon, getLowStockProducts } from './utils';

type Page = 'setup' | 'home' | 'products' | 'settings';

function App() {
  const { fridgeModel, availableModels, selectModel } = useFridgeModel();
  const { products, addProduct, updateProduct } = useProducts();
  const [currentPage, setCurrentPage] = useState<Page>('setup');
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();

  React.useEffect(() => {
    if (fridgeModel) {
      setCurrentPage('home');
    }
  }, [fridgeModel]);

  const handleModelSelect = (model: FridgeModel) => {
    selectModel(model);
  };

  const handleAddProduct = (productData: Omit<Product, 'id'>) => {
    addProduct(productData);
    setShowProductForm(false);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductForm(true);
  };

  const handleUpdateProduct = (productData: Omit<Product, 'id'>) => {
    if (selectedProduct) {
      updateProduct(selectedProduct.id, productData);
      setShowProductForm(false);
      setSelectedProduct(undefined);
    }
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
  const lowStockProducts = getLowStockProducts(products);

  const renderNavigation = () => (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Fridge Scanner</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentPage('home')}
              className={`p-2 rounded-lg ${currentPage === 'home' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentPage('products')}
              className={`p-2 rounded-lg ${currentPage === 'products' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Package className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentPage('settings')}
              className={`p-2 rounded-lg ${currentPage === 'settings' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );

  const renderHomePage = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Alertas */}
      {(expiredProducts.length > 0 || expiringSoonProducts.length > 0 || lowStockProducts.length > 0) && (
        <div className="mb-6 space-y-4">
          {expiredProducts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="font-medium text-red-800">
                  {expiredProducts.length} produto(s) vencido(s)
                </span>
              </div>
            </div>
          )}
          {expiringSoonProducts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-800">
                  {expiringSoonProducts.length} produto(s) vencendo em breve
                </span>
              </div>
            </div>
          )}
          {lowStockProducts.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-800">
                  {lowStockProducts.length} produto(s) com estoque baixo
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visualizador da Geladeira */}
      {fridgeModel && (
        <FridgeViewer
          fridgeModel={fridgeModel}
          products={products}
          onCompartmentClick={handleCompartmentClick}
          onProductClick={handleProductClick}
        />
      )}

      {/* Botão Flutuante */}
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

  const renderProductsPage = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Todos os Produtos</h2>
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          <div className="divide-y">
            {products.map(product => (
              <div key={product.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleEditProduct(product)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div>
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{product.quantity} {product.unit}</p>
                    {product.expiryDate && (
                      <p className="text-sm text-gray-500">
                        Validade: {product.expiryDate.toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum produto cadastrado</p>
                <button
                  onClick={() => {
                    setSelectedProduct(undefined);
                    setShowProductForm(true);
                  }}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Adicionar Primeiro Produto
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsPage = () => (
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
        </div>
      </div>
    </div>
  );

  if (!fridgeModel) {
    return <FridgeModelSelector 
      availableModels={availableModels} 
      onSelectModel={handleModelSelect}
    />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {renderNavigation()}
      
      {currentPage === 'home' && renderHomePage()}
      {currentPage === 'products' && renderProductsPage()}
      {currentPage === 'settings' && renderSettingsPage()}

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
