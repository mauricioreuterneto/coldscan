import React, { useState, useEffect } from 'react';
import { OnboardingFlow } from './components/OnboardingFlow';
import { StorageOverview } from './components/StorageOverview';
import { ShoppingMode } from './components/ShoppingMode';
import { ProductForm } from './components/ProductForm';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { ProductManager } from './components/ProductManager';
import { ShoppingList } from './components/ShoppingList';
import { Analytics } from './components/Analytics';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useSupabaseProducts } from './hooks/useSupabaseProducts';
import { NotificationService } from './services/notificationService';
import { ExpiryService } from './services/expiryService';
import { ShoppingService } from './services/shoppingService';
import { supabase } from './lib/supabase';
import { Product } from './types/enhanced';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  User, 
  LogOut, 
  Bell,
  Plus,
  AlertTriangle,
  X,
  Menu
} from 'lucide-react';

type Page = 'onboarding' | 'home' | 'storage' | 'products' | 'shopping' | 'shopping-mode' | 'analytics' | 'settings';

function App() {
  const { user, signOut } = useSupabaseAuth();
  const { products, addProduct, updateProduct } = useSupabaseProducts();
  const [currentPage, setCurrentPage] = useState<Page>('onboarding');
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>();
  const [selectedListId, setSelectedListId] = useState<string | undefined>();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // Verificar se o usuário completou onboarding
  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
      loadNotifications();
      setupNotificationScheduler();
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, household_id')
        .eq('id', user?.id)
        .single();

      if (profile?.onboarding_completed) {
        setOnboardingCompleted(true);
        setCurrentPage('home');
      } else {
        setCurrentPage('onboarding');
      }
    } catch (error) {
      console.error('Erro ao verificar onboarding:', error);
      setCurrentPage('onboarding');
    }
  };

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      const userNotifications = await NotificationService.getUserNotifications(user.id, 10);
      setNotifications(userNotifications);
      
      const unread = await NotificationService.getUnreadCount(user.id);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const setupNotificationScheduler = () => {
    // Configurar verificação periódica de notificações
    const interval = setInterval(async () => {
      if (user) {
        await NotificationService.scheduleRecurringNotifications();
        await loadNotifications();
      }
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  };

  const handleOnboardingComplete = () => {
    setOnboardingCompleted(true);
    setCurrentPage('home');
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowProductForm(true);
  };

  const handleAddProduct = (locationId?: string) => {
    setSelectedProduct(undefined);
    setSelectedLocationId(locationId);
    setShowProductForm(true);
  };

  const handleProductSubmit = async (productData: Omit<Product, 'id'>) => {
    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, productData);
      } else {
        await addProduct(productData);
      }
      setShowProductForm(false);
      setSelectedProduct(undefined);
      setSelectedLocationId(undefined);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  };

  const handleStartShoppingMode = (listId: string) => {
    setSelectedListId(listId);
    setCurrentPage('shopping-mode');
  };

  const handleShoppingModeComplete = () => {
    setSelectedListId(undefined);
    setCurrentPage('shopping');
  };

  const handleShoppingModeExit = () => {
    setSelectedListId(undefined);
    setCurrentPage('shopping');
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!user) return;
    
    try {
      await NotificationService.markAllAsRead(user.id);
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  // Se não estiver autenticado, mostrar tela de login
  if (!user) {
    return <Auth />;
  }

  // Se está em onboarding
  if (!onboardingCompleted) {
    return <OnboardingFlow user={user} onComplete={handleOnboardingComplete} />;
  }

  // Renderizar página atual
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Dashboard
            products={products}
            user={user}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            onSignOut={signOut}
            onAddProduct={handleAddProduct}
            onEditProduct={handleProductClick}
            onCompartmentClick={handleProductClick}
          />
        );
      
      case 'storage':
        return (
          <StorageOverview
            householdId={user.household_id || ''}
            onProductClick={handleProductClick}
            onAddProduct={handleAddProduct}
          />
        );
      
      case 'products':
        return (
          <ProductManager
            products={products}
            onUpdateProduct={updateProduct}
            onAddProduct={handleAddProduct}
          />
        );
      
      case 'shopping':
        return (
          <ShoppingList
            products={products}
            onUpdateProduct={updateProduct}
            onStartShoppingMode={handleStartShoppingMode}
          />
        );
      
      case 'shopping-mode':
        return selectedListId ? (
          <ShoppingMode
            listId={selectedListId}
            userId={user.id}
            onComplete={handleShoppingModeComplete}
            onExit={handleShoppingModeExit}
          />
        ) : null;
      
      case 'analytics':
        return <Analytics />;
      
      case 'settings':
        return <div>Configurações (em desenvolvimento)</div>;
      
      default:
        return <div>Página não encontrada</div>;
    }
  };

  const navigationItems = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'storage', label: 'Minha Cozinha', icon: Package },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'shopping', label: 'Compras', icon: ShoppingCart },
    { id: 'analytics', label: 'Análises', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              <h1 className="text-xl font-bold text-gray-800">Fridge Scanner</h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Notificações */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-600 hover:text-gray-800 relative"
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown de notificações */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800">Notificações</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllNotificationsAsRead}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            Marcar todas como lidas
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Nenhuma notificação
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <div
                            key={notification.id}
                            className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                              !notification.readAt ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleMarkNotificationAsRead(notification.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800 text-sm">{notification.title}</h4>
                                <p className="text-gray-600 text-xs mt-1">{notification.message}</p>
                                <p className="text-gray-400 text-xs mt-1">
                                  {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              {!notification.readAt && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Menu do usuário */}
              <div className="relative">
                <button className="p-2 text-gray-600 hover:text-gray-800">
                  <User className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="bg-white w-64 h-full">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <nav className="p-4">
              {navigationItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id as Page);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
              
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-4"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <aside className="fixed left-0 top-16 h-full w-64 bg-white border-r border-gray-200">
          <nav className="p-4">
            {navigationItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as Page)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-1 ${
                  currentPage === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
            
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-4"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </nav>
        </aside>
      </div>

      {/* Main Content */}
      <main className="lg:ml-64">
        <div className="min-h-screen">
          {renderCurrentPage()}
        </div>
      </main>

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedProduct ? 'Editar Produto' : 'Adicionar Produto'}
                </h3>
                <button
                  onClick={() => {
                    setShowProductForm(false);
                    setSelectedProduct(undefined);
                    setSelectedLocationId(undefined);
                  }}
                  className="p-2 text-gray-600 hover:text-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <ProductForm
                product={selectedProduct}
                onSubmit={handleProductSubmit}
                onCancel={() => {
                  setShowProductForm(false);
                  setSelectedProduct(undefined);
                  setSelectedLocationId(undefined);
                }}
                defaultLocationId={selectedLocationId}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={handleAddProduct}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-30"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}

export default App;
