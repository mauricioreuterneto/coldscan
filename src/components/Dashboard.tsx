import React, { useState } from 'react';
import { FridgeModel, Product } from '../types';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  User, 
  LogOut, 
  Bell,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
  Refrigerator
} from 'lucide-react';
import { getExpiredProducts, getProductsExpiringSoon, getLowStockProducts, getCategories } from '../utils';

interface DashboardProps {
  fridgeModel: FridgeModel;
  products: Product[];
  user: any;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  onSignOut: () => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onCompartmentClick: (compartment: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  fridgeModel,
  products,
  user,
  currentPage,
  setCurrentPage,
  onSignOut,
  onAddProduct,
  onEditProduct,
  onCompartmentClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const expiredProducts = getExpiredProducts(products);
  const expiringSoonProducts = getProductsExpiringSoon(products);
  const lowStockProducts = getLowStockProducts(products);
  const categories = getCategories(products);

  const totalAlerts = expiredProducts.length + expiringSoonProducts.length + lowStockProducts.length;

  const menuItems = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'fridge', label: 'Minha Geladeira', icon: Refrigerator },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'shopping', label: 'Lista de Compras', icon: ShoppingCart },
    { id: 'analytics', label: 'Análises', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const renderSidebar = () => (
    <div className="w-64 bg-white shadow-lg h-full">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Refrigerator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Fridge Scanner</h1>
            <p className="text-xs text-gray-500">Gestão Inteligente</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.id === 'home' && totalAlerts > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {totalAlerts}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-gray-900">{user.email}</p>
            <p className="text-xs text-gray-500">Conta Premium</p>
          </div>
        </button>

        {showUserMenu && (
          <div className="absolute bottom-full left-6 right-6 mb-2 bg-white rounded-lg shadow-lg border">
            <button className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors">
              <User className="w-4 h-4 inline mr-2" />
              Perfil
            </button>
            <button
              onClick={onSignOut}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-red-600"
            >
              <LogOut className="w-4 h-4 inline mr-2" />
              Sair
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderHeader = () => (
    <div className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {totalAlerts}
              </span>
            )}
          </button>

          <button
            onClick={onAddProduct}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Produto
          </button>
        </div>
      </div>

      {showNotifications && (
        <div className="absolute right-6 top-16 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Notificações</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {expiredProducts.length > 0 && (
              <div className="p-4 border-b bg-red-50">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Produtos Vencidos</span>
                </div>
                <p className="text-sm text-gray-600">{expiredProducts.length} produto(s) vencido(s)</p>
              </div>
            )}
            {expiringSoonProducts.length > 0 && (
              <div className="p-4 border-b bg-yellow-50">
                <div className="flex items-center gap-2 text-yellow-600 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Vencendo em Breve</span>
                </div>
                <p className="text-sm text-gray-600">{expiringSoonProducts.length} produto(s) vencendo em breve</p>
              </div>
            )}
            {lowStockProducts.length > 0 && (
              <div className="p-4 bg-blue-50">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-medium">Estoque Baixo</span>
                </div>
                <p className="text-sm text-gray-600">{lowStockProducts.length} produto(s) com estoque baixo</p>
              </div>
            )}
            {totalAlerts === 0 && (
              <div className="p-4 text-center text-gray-500">
                <p>Nenhuma notificação</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">Total de Produtos</h3>
          <Package className="w-5 h-5 text-blue-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{products.length}</p>
        <p className="text-xs text-gray-500 mt-1">Na geladeira</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">Categorias</h3>
          <BarChart3 className="w-5 h-5 text-green-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
        <p className="text-xs text-gray-500 mt-1">Tipos diferentes</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">Capacidade Usada</h3>
          <Refrigerator className="w-5 h-5 text-purple-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {fridgeModel ? Math.round((products.reduce((acc, p) => acc + p.quantity, 0) / fridgeModel.capacity) * 100) : 0}%
        </p>
        <p className="text-xs text-gray-500 mt-1">Do espaço total</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-600">Alertas Ativos</h3>
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <p className="text-2xl font-bold text-gray-900">{totalAlerts}</p>
        <p className="text-xs text-gray-500 mt-1">Precisam atenção</p>
      </div>
    </div>
  );

  const renderQuickActions = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <button
        onClick={onAddProduct}
        className="bg-blue-600 text-white rounded-lg p-6 hover:bg-blue-700 transition-colors text-left"
      >
        <Plus className="w-8 h-8 mb-3" />
        <h3 className="font-semibold mb-1">Adicionar Produto</h3>
        <p className="text-sm opacity-90">Cadastre novos itens na sua geladeira</p>
      </button>

      <button
        onClick={() => setCurrentPage('shopping')}
        className="bg-green-600 text-white rounded-lg p-6 hover:bg-green-700 transition-colors text-left"
      >
        <ShoppingCart className="w-8 h-8 mb-3" />
        <h3 className="font-semibold mb-1">Lista de Compras</h3>
        <p className="text-sm opacity-90">Gerencie suas compras</p>
      </button>

      <button
        onClick={() => setCurrentPage('analytics')}
        className="bg-purple-600 text-white rounded-lg p-6 hover:bg-purple-700 transition-colors text-left"
      >
        <BarChart3 className="w-8 h-8 mb-3" />
        <h3 className="font-semibold mb-1">Ver Análises</h3>
        <p className="text-sm opacity-90">Estatísticas detalhadas</p>
      </button>
    </div>
  );

  const renderRecentProducts = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold">Produtos Recentes</h3>
      </div>
      <div className="divide-y">
        {products.slice(0, 5).map((product) => (
          <div
            key={product.id}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => onEditProduct(product)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h4 className="font-medium">{product.name}</h4>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{product.quantity} {product.unit}</p>
                {product.expiryDate && (
                  <p className="text-sm text-gray-500">
                    {new Date(product.expiryDate).toLocaleDateString('pt-BR')}
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
              onClick={onAddProduct}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Adicionar primeiro produto
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-gray-50">
      {renderSidebar()}
      
      <div className="flex-1 flex flex-col">
        {renderHeader()}
        
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Bem-vindo de volta, {user.email?.split('@')[0]}!
              </h2>
              <p className="text-gray-600">
                Aqui está o resumo da sua geladeira {fridgeModel?.brand} {fridgeModel?.model}
              </p>
            </div>

            {renderStatsCards()}
            {renderQuickActions()}
            {renderRecentProducts()}
          </div>
        </div>
      </div>
    </div>
  );
};
