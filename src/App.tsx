import React, { useState, useEffect } from 'react';
import { coreService } from './services/coreService';
import { supabase, supabaseService } from './lib/supabase';
import type { User, ShoppingList, Appliance, Product, FridgeModel } from './types/unified';
import { ProcessedFridgeModel } from './types/fridgeDiscovery';
import { Plus, Home, Package, ShoppingCart, BarChart3, Grid3X3, Menu, X } from 'lucide-react';

// Componentes existentes que vamos manter
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Fridge3DViewer } from './components/Fridge3DViewer';
import { ShoppingList as ShoppingListComponent } from './components/ShoppingList';
import { Analytics } from './components/Analytics';
import { ModelSelectionFlow } from './components/ModelSelectionFlow';
import { ProductForm } from './components/ProductForm';
import { StorageOverview } from './components/StorageOverview';
import { Onboarding } from './components/Onboarding';

type Page = 'setup' | 'onboarding' | 'home' | 'fridge' | 'products' | 'shopping' | 'analytics' | 'settings' | 'storage';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('setup');
  const [products, setProducts] = useState<Product[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [household, setHousehold] = useState<any>(null);
  const [fridgeModel, setFridgeModel] = useState<FridgeModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Listener de mudanças de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session?.user) {
            // Usar o usuário da sessão diretamente em vez de chamar getCurrentUser
            setUser(session.user as unknown as User);
          } else {
            setUser(null);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProducts([]);
          setShoppingLists([]);
          setAppliances([]);
          setHousehold(null);
          setFridgeModel(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carregar dados quando usuário muda
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Carregar appliances quando household muda
  useEffect(() => {
    if (household) {
      loadAppliances();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household]);

  // Timeout para garantir que loading nunca fique preso
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000); // 5 segundos de timeout

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Fluxo correto baseado em onboarding:
    // 1. Se onboarding não completo → vai para onboarding
    // 2. Se onboarding completo mas não tem fridgeModel → vai para setup (seleção)
    // 3. Se onboarding completo e tem fridgeModel → vai para home
    if (onboardingCompleted === false) {
      if (currentPage !== 'onboarding') {
        setCurrentPage('onboarding');
      }
    } else if (onboardingCompleted === true) {
      if (!fridgeModel && currentPage !== 'setup') {
        setCurrentPage('setup');
      } else if (fridgeModel && currentPage === 'setup') {
        setCurrentPage('home');
      }
    }
  }, [fridgeModel, currentPage, onboardingCompleted]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // Carregar dados do usuário
      await Promise.all([
        loadHousehold(),
        loadProducts(),
        loadShoppingLists(),
        loadAppliances(),
        loadFridgeModel()
      ]);
      // loadDashboardStats chamado separadamente para evitar loop
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFridgeModel = async () => {
    try {
      const fridgeModelData = await supabaseService.getFridgeModel(user?.id || '');
      if (fridgeModelData) {
        setFridgeModel(fridgeModelData as unknown as FridgeModel);
      }
    } catch (error) {
      console.error('Erro ao carregar fridge model:', error);
    }
  };

  const loadHousehold = async () => {
    try {
      // Verificar se profile existe
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id || '')
        .maybeSingle();

      if (!existingProfile) {
        // Redirecionar para onboarding se profile não existir
        setOnboardingCompleted(false);
        setCurrentPage('onboarding');
        return;
      }

      // Atualizar estado de onboardingCompleted
      if (existingProfile.onboarding_completed !== undefined) {
        setOnboardingCompleted(existingProfile.onboarding_completed);
      }

      const householdData = await supabaseService.getHousehold(user?.id || '');
      if (householdData) {
        setHousehold(householdData);
      }
    } catch (error) {
      console.error('Erro ao carregar household:', error);
    }
  };

  const loadProducts = async () => {
    const result = await coreService.getProducts();
    if (result.success && result.data) {
      setProducts(result.data);
    }
  };

  const loadShoppingLists = async () => {
    try {
      const lists = await supabaseService.getShoppingLists(user?.id || '');
      setShoppingLists(lists);
    } catch (error) {
      console.error('Erro ao carregar shopping lists:', error);
    }
  };

  const loadAppliances = async () => {
    try {
      // Carregar fridgeModel primeiro (independente de appliances)
      const fridgeModelData = await supabaseService.getFridgeModel(user?.id || '');
      if (fridgeModelData) {
        setFridgeModel(fridgeModelData as unknown as FridgeModel);
      }

      if (household) {
        const appliancesData = await supabaseService.getAppliances(household.id);
        setAppliances(appliancesData);
      }
    } catch (error) {
      console.error('Erro ao carregar appliances:', error);
    }
  };

  // Autenticação
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSignIn = async (email: string, password: string) => {
    const result = await coreService.signIn(email, password);
    return result;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSignUp = async (email: string, password: string, name?: string) => {
    const result = await coreService.signUp(email, password, name);
    return result;
  };

  const handleSignOut = async () => {
    await coreService.signOut();
    setUser(null);
    setProducts([]);
    setShoppingLists([]);
    setAppliances([]);
    setHousehold(null);
    setFridgeModel(null);
    setCurrentPage('setup');
  };

  const handleOnboardingComplete = async () => {
    try {
      setCurrentPage('setup');
    } catch (error) {
      console.error('Erro ao carregar profile após onboarding:', error);
    }
  };

  // Gestão de Produtos
  const handleAddProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await coreService.createProduct(productData);
    if (result.success) {
      await loadProducts();
      setShowProductModal(false);
    }
    return result;
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleUpdateProduct = async (productId: string, updates: Partial<Product>) => {
    const result = await coreService.updateProduct(productId, updates);
    if (result.success) {
      await loadProducts();
      setShowProductModal(false);
      setEditingProduct(null);
    }
    return result;
  };

  const handleDeleteProduct = async (productId: string) => {
    const result = await coreService.deleteProduct(productId);
    if (result.success) {
      await loadProducts();
    }
    return result;
  };

  // Gestão de Aparelhos
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAddAppliance = async (applianceData: Omit<Appliance, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await coreService.createAppliance(applianceData);
    if (result.success) {
      await loadAppliances();
    }
    return result;
  };

  // Gestão de Listas de Compras
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCreateShoppingList = async (listData: Omit<ShoppingList, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await coreService.createShoppingList(listData);
    if (result.success) {
      await loadShoppingLists();
    }
    return result;
  };

  // Cálculos para dashboard
  const getExpiredProducts = () => {
    const now = new Date();
    return products.filter(product => {
      const expiryDate = product.expiry?.sealedExpiryDate;
      return expiryDate && new Date(expiryDate) < now;
    });
  };

  const getProductsExpiringSoon = () => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return products.filter(product => {
      const expiryDate = product.expiry?.sealedExpiryDate;
      return expiryDate && new Date(expiryDate) >= now && new Date(expiryDate) <= sevenDaysFromNow;
    });
  };

  const getLowStockProducts = () => {
    return products.filter(product => {
      const consumption = product.consumption;
      if (!consumption || !consumption.estimatedDepletionDate) return false;
      const daysRemaining = Math.ceil((consumption.estimatedDepletionDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysRemaining <= 3;
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getCategories = () => {
    const categories = new Set(products.map(p => p.category));
    return Array.from(categories);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, mostrar tela de login
  if (!user) {
    return <Auth />;
  }

  const expiredProducts = getExpiredProducts();
  const expiringSoonProducts = getProductsExpiringSoon();
  const lowStockProducts = getLowStockProducts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <h1 className="text-lg md:text-xl font-bold text-gray-800">Fridge Scanner</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Alertas - Hidden on mobile, shown on tablet+ */}
              {(expiredProducts.length > 0 || expiringSoonProducts.length > 0 || lowStockProducts.length > 0) && (
                <div className="hidden sm:flex items-center gap-1 text-sm">
                  {expiredProducts.length > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">
                      {expiredProducts.length} vencido(s)
                    </span>
                  )}
                  {expiringSoonProducts.length > 0 && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                      {expiringSoonProducts.length} vencendo
                    </span>
                  )}
                  {lowStockProducts.length > 0 && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                      {lowStockProducts.length} acabando
                    </span>
                  )}
                </div>
              )}
              
              <button
                onClick={handleSignOut}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation - Desktop/Tablet */}
      <nav className="hidden md:block bg-white border-b">
        <div className="px-4 py-2">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setCurrentPage('home')}
              className={`px-3 py-1 rounded text-sm flex items-center gap-1 whitespace-nowrap ${
                currentPage === 'home' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className="w-4 h-4" />
              Início
            </button>
            <button
              onClick={() => setCurrentPage('fridge')}
              className={`px-3 py-1 rounded text-sm flex items-center gap-1 whitespace-nowrap ${
                currentPage === 'fridge' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Package className="w-4 h-4" />
              Geladeira
            </button>
            <button
              onClick={() => setCurrentPage('products')}
              className={`px-3 py-1 rounded text-sm flex items-center gap-1 whitespace-nowrap ${
                currentPage === 'products' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Package className="w-4 h-4" />
              Produtos
            </button>
            <button
              onClick={() => setCurrentPage('shopping')}
              className={`px-3 py-1 rounded text-sm flex items-center gap-1 whitespace-nowrap ${
                currentPage === 'shopping' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Compras
            </button>
            <button
              onClick={() => setCurrentPage('analytics')}
              className={`px-3 py-1 rounded text-sm flex items-center gap-1 whitespace-nowrap ${
                currentPage === 'analytics' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Análises
            </button>
            <button
              onClick={() => setCurrentPage('storage')}
              className={`px-3 py-1 rounded text-sm flex items-center gap-1 whitespace-nowrap ${
                currentPage === 'storage' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Armazenamento
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b shadow-lg">
          <div className="px-4 py-2 space-y-2">
            <button
              onClick={() => {
                setCurrentPage('home');
                setMobileMenuOpen(false);
              }}
              className={`w-full px-3 py-2 rounded text-sm flex items-center gap-2 ${
                currentPage === 'home' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Home className="w-4 h-4" />
              Início
            </button>
            <button
              onClick={() => {
                setCurrentPage('fridge');
                setMobileMenuOpen(false);
              }}
              className={`w-full px-3 py-2 rounded text-sm flex items-center gap-2 ${
                currentPage === 'fridge' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Package className="w-4 h-4" />
              Geladeira
            </button>
            <button
              onClick={() => {
                setCurrentPage('products');
                setMobileMenuOpen(false);
              }}
              className={`w-full px-3 py-2 rounded text-sm flex items-center gap-2 ${
                currentPage === 'products' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Package className="w-4 h-4" />
              Produtos
            </button>
            <button
              onClick={() => {
                setCurrentPage('shopping');
                setMobileMenuOpen(false);
              }}
              className={`w-full px-3 py-2 rounded text-sm flex items-center gap-2 ${
                currentPage === 'shopping' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Compras
            </button>
            <button
              onClick={() => {
                setCurrentPage('analytics');
                setMobileMenuOpen(false);
              }}
              className={`w-full px-3 py-2 rounded text-sm flex items-center gap-2 ${
                currentPage === 'analytics' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Análises
            </button>
            <button
              onClick={() => {
                setCurrentPage('storage');
                setMobileMenuOpen(false);
              }}
              className={`w-full px-3 py-2 rounded text-sm flex items-center gap-2 ${
                currentPage === 'storage' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
              Armazenamento
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="p-4 pb-20 md:pb-4">
        {currentPage === 'onboarding' && user && (
          <Onboarding
            userId={user.id}
            email={user.email}
            onComplete={handleOnboardingComplete}
          />
        )}

        {currentPage === 'setup' && (
          <ModelSelectionFlow
            onModelSelected={async (model: ProcessedFridgeModel) => {
              console.log('Modelo selecionado:', model);
              // O workflow já salvou o modelo em fridge_models_processed
              // Apenas atualizar o estado local e navegar
              setFridgeModel(model as unknown as FridgeModel);
              setCurrentPage('home');
            }}
            onCancel={() => {
              console.log('Seleção de modelo cancelada');
            }}
            userId={user?.id}
          />
        )}
        
        {currentPage === 'home' && fridgeModel && (
          <Dashboard
            fridgeModel={fridgeModel}
            products={products}
            user={user}
            currentPage={currentPage}
            setCurrentPage={(page: string) => setCurrentPage(page as Page)}
            onSignOut={handleSignOut}
            onAddProduct={handleOpenAddProduct}
            onEditProduct={handleOpenEditProduct}
            onCompartmentClick={(compartment) => console.log('Compartment clicked:', compartment)}
          />
        )}
        
        {currentPage === 'fridge' && fridgeModel && (
          <Fridge3DViewer
            fridgeModel={fridgeModel}
            products={products}
            onProductClick={handleOpenEditProduct}
            onCompartmentClick={(compartment) => console.log('Compartment clicked:', compartment)}
          />
        )}
        
        {currentPage === 'products' && (
          <div className="bg-white rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Gerenciamento de Produtos</h2>
              <div className="text-sm text-gray-600">
                Total: {products.length} produtos
              </div>
            </div>
            
            <div className="grid gap-4">
              {products.map(product => (
                <div key={product.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{product.name}</h3>
                      <div className="mt-1 space-y-1 text-sm text-gray-600">
                        <p>{`Quantidade: ${product.consumption?.currentQuantity || 0} ${product.consumption?.unit || product.purchase?.unit || ''}`}</p>
                        <p>{`Categoria: ${product.category}`}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateProduct(product.id, product)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {currentPage === 'shopping' && (
          <ShoppingListComponent
            products={products}
            onUpdateProduct={handleUpdateProduct}
          />
        )}
        
        {currentPage === 'analytics' && fridgeModel && (
          <Analytics
            products={products}
            fridgeModel={fridgeModel}
          />
        )}

        {currentPage === 'storage' && user && (
          <StorageOverview
            householdId={user.id}
            onAddProduct={handleOpenAddProduct}
            onProductClick={handleOpenEditProduct}
          />
        )}
      </main>

      {/* Floating Action Button */}
      {currentPage !== 'setup' && (
        <button
          onClick={handleOpenAddProduct}
          className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Product Modal */}
      {showProductModal && fridgeModel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-xl font-semibold">
                  {editingProduct ? 'Editar Produto' : 'Adicionar Produto'}
                </h2>
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setEditingProduct(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>
              <ProductForm
                compartments={fridgeModel.compartments || []}
                onSubmit={editingProduct 
                  ? (data) => handleUpdateProduct(editingProduct.id, data)
                  : handleAddProduct
                }
                onCancel={() => {
                  setShowProductModal(false);
                  setEditingProduct(null);
                }}
                initialProduct={editingProduct || undefined}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
