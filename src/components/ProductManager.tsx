import React, { useState, useMemo } from 'react';
import { Product, Compartment } from '../types/unified';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  AlertTriangle,
  TrendingUp,
  Package,
  X
} from 'lucide-react';
import {
  getExpiredProducts,
  getProductsExpiringSoon,
  getLowStockProducts,
  getCategories,
  searchProducts,
  filterProductsByCategory,
  getProductCategoryName,
  getProductQuantity,
  getProductUnit,
  getProductShelfId,
  getProductZoneId
} from '../utils';

interface ProductManagerProps {
  products: Product[];
  compartments: Compartment[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}

export const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  compartments,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCompartment, setSelectedCompartment] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');

  const categories = getCategories(products);
  const expiredProducts = getExpiredProducts(products);
  const expiringSoonProducts = getProductsExpiringSoon(products);
  const lowStockProducts = getLowStockProducts(products);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Busca por texto
    if (searchQuery) {
      filtered = searchProducts(filtered, searchQuery);
    }

    // Filtro por categoria
    if (selectedCategory !== 'all') {
      filtered = filterProductsByCategory(filtered, selectedCategory);
    }

    // Filtro por status
    if (selectedStatus !== 'all') {
      switch (selectedStatus) {
        case 'expired':
          filtered = expiredProducts;
          break;
        case 'expiring':
          filtered = expiringSoonProducts;
          break;
        case 'lowStock':
          filtered = lowStockProducts;
          break;
      }
    }

    // Filtro por compartimento
    if (selectedCompartment !== 'all') {
      filtered = filtered.filter(p => getProductZoneId(p) === selectedCompartment);
    }

    // Ordenação
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'expiryDate':
          const aExpiry = a.expiry?.sealedExpiryDate;
          const bExpiry = b.expiry?.sealedExpiryDate;
          if (!aExpiry) return 1;
          if (!bExpiry) return -1;
          return new Date(aExpiry).getTime() - new Date(bExpiry).getTime();
        case 'quantity':
          return getProductQuantity(b) - getProductQuantity(a);
        case 'category':
          return getProductCategoryName(a).localeCompare(getProductCategoryName(b));
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchQuery, selectedCategory, selectedStatus, selectedCompartment, sortBy, expiredProducts, expiringSoonProducts, lowStockProducts]);

  const getProductStatus = (product: Product) => {
    const expiryDate = product.expiry?.sealedExpiryDate;
    if (expiryDate) {
      const today = new Date();
      const daysUntilExpiry = Math.ceil((new Date(expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) return { status: 'expired', color: 'red', label: 'Vencido' };
      if (daysUntilExpiry <= 3) return { status: 'expiring', color: 'yellow', label: 'Vencendo em breve' };
    }
    
    if (getProductQuantity(product) <= 2) return { status: 'lowStock', color: 'blue', label: 'Estoque baixo' };
    return { status: 'good', color: 'green', label: 'OK' };
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedCompartment('all');
    setSortBy('name');
  };

  const activeFilters = [
    searchQuery && 'Busca',
    selectedCategory !== 'all' && 'Categoria',
    selectedStatus !== 'all' && 'Status',
    selectedCompartment !== 'all' && 'Compartimento',
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Produtos</h2>
            <p className="text-gray-600">
              {filteredProducts.length} de {products.length} produtos encontrados
            </p>
          </div>
          <button
            onClick={onAddProduct}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Produto
          </button>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                activeFilters > 0 
                  ? 'border-blue-500 bg-blue-50 text-blue-600' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {activeFilters > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {activeFilters}
                </span>
              )}
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Ordenar por Nome</option>
              <option value="category">Ordenar por Categoria</option>
              <option value="expiryDate">Ordenar por Validade</option>
              <option value="quantity">Ordenar por Quantidade</option>
            </select>
          </div>

          {/* Filtros Expandidos */}
          {showFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todas as categorias</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos os status</option>
                    <option value="expired">Vencidos</option>
                    <option value="expiring">Vencendo em breve</option>
                    <option value="lowStock">Estoque baixo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compartimento
                  </label>
                  <select
                    value={selectedCompartment}
                    onChange={(e) => setSelectedCompartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos os compartimentos</option>
                    {compartments.map(comp => (
                      <option key={comp.id} value={comp.id}>{comp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {activeFilters > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total</h3>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
          <p className="text-xs text-gray-500 mt-1">Produtos cadastrados</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Vencidos</h3>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{expiredProducts.length}</p>
          <p className="text-xs text-gray-500 mt-1">Precisam ser descartados</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Vencendo</h3>
            <Calendar className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{expiringSoonProducts.length}</p>
          <p className="text-xs text-gray-500 mt-1">Nos próximos 3 dias</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Estoque Baixo</h3>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{lowStockProducts.length}</p>
          <p className="text-xs text-gray-500 mt-1">Comprar em breve</p>
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localização
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const status = getProductStatus(product);
                const compartment = compartments.find(c => c.id === getProductZoneId(product));
                const shelfId = getProductShelfId(product);
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          {product.barcode && (
                            <div className="text-xs text-gray-500">{product.barcode}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {getProductCategoryName(product)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getProductQuantity(product)} {getProductUnit(product)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.expiry?.sealedExpiryDate ? (
                        <div className="text-sm">
                          <div className={status.color === 'red' ? 'text-red-600 font-medium' : 'text-gray-900'}>
                            {new Date(product.expiry.sealedExpiryDate).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {Math.ceil((new Date(product.expiry.sealedExpiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {compartment?.name || 'Não definido'}
                      </div>
                      {shelfId && (
                        <div className="text-xs text-gray-500">
                          {compartment?.shelves?.find(s => s.id === shelfId)?.name || shelfId}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        status.color === 'red' ? 'bg-red-100 text-red-800' :
                        status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        status.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditProduct(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(product)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || selectedCompartment !== 'all'
                ? 'Tente ajustar seus filtros ou busca'
                : 'Comece adicionando seu primeiro produto'
              }
            </p>
            <button
              onClick={onAddProduct}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Adicionar Produto
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
