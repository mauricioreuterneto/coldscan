import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Refrigerator, 
  Package, 
  AlertTriangle, 
  Plus,
  Search,
  Filter,
  ChevronRight,
  MapPin,
  Thermometer,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';
import { ExpiryService } from '../services/expiryService';
import { supabase } from '../lib/supabase';

interface StorageLocation {
  id: string;
  name: string;
  type: 'fridge' | 'freezer' | 'pantry' | 'cabinet' | 'counter' | 'other';
  description?: string;
  temperature?: { min: number; max: number; unit: 'C' | 'F' };
  itemCount: number;
  expiringItems: number;
  expiredItems: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  sealed_expiry_date?: string;
  opened_expiry_date?: string;
  current_state: any;
  consumption: any;
  location?: {
    applianceId?: string;
    compartmentId?: string;
    shelfId?: string;
  };
  image_url?: string;
  tags: string[];
  notes?: string;
}

interface StorageOverviewProps {
  householdId: string;
  onProductClick: (product: Product) => void;
  onAddProduct: (locationId?: string) => void;
}

export const StorageOverview: React.FC<StorageOverviewProps> = ({
  householdId,
  onProductClick,
  onAddProduct
}) => {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as string[],
    expiryStatus: 'all' as 'all' | 'safe' | 'expiring' | 'expired',
    showOnlyInStock: false
  });

  useEffect(() => {
    loadData();
  }, [householdId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar locais de armazenamento
      const { data: storageLocations } = await supabase
        .from('storage_locations')
        .select('*')
        .eq('household_id', householdId)
        .order('name');

      // Carregar produtos
      const { data: allProducts } = await supabase
        .from('products')
        .select('*')
        .eq('household_id', householdId);

      // Processar dados
      const processedLocations = await processStorageLocations(storageLocations || [], allProducts || []);
      setLocations(processedLocations);
      setProducts(allProducts || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const processStorageLocations = async (locations: any[], products: any[]): Promise<StorageLocation[]> => {
    const processed = locations.map(location => {
      const locationProducts = products.filter(product => 
        product.location?.applianceId === location.id ||
        product.location?.compartmentId === location.id ||
        product.location?.shelfId === location.id
      );

      const expiringItems = locationProducts.filter(product => {
        const status = ExpiryService.getExpiryStatus(product);
        return status.isExpiringSoon || status.isExpired;
      }).length;

      const expiredItems = locationProducts.filter(product => {
        const status = ExpiryService.getExpiryStatus(product);
        return status.isExpired;
      }).length;

      return {
        id: location.id,
        name: location.name,
        type: location.type,
        description: location.description,
        temperature: location.temperature,
        itemCount: locationProducts.length,
        expiringItems,
        expiredItems
      };
    });

    // Adicionar local "Fora da Geladeira" para produtos não categorizados
    const uncategorizedProducts = products.filter(product => !product.location?.applianceId);
    if (uncategorizedProducts.length > 0) {
      const uncategorizedExpiring = uncategorizedProducts.filter(product => {
        const status = ExpiryService.getExpiryStatus(product);
        return status.isExpiringSoon || status.isExpired;
      }).length;

      const uncategorizedExpired = uncategorizedProducts.filter(product => {
        const status = ExpiryService.getExpiryStatus(product);
        return status.isExpired;
      }).length;

      processed.push({
        id: 'uncategorized',
        name: 'Fora da Geladeira',
        type: 'other',
        description: 'Produtos sem localização específica',
        itemCount: uncategorizedProducts.length,
        expiringItems: uncategorizedExpiring,
        expiredItems: uncategorizedExpired
      });
    }

    return processed;
  };

  const getLocationIcon = (type: StorageLocation['type']) => {
    switch (type) {
      case 'fridge': return <Refrigerator className="w-6 h-6 text-blue-600" />;
      case 'freezer': return <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">❄️</div>;
      case 'pantry': return <Package className="w-6 h-6 text-green-600" />;
      case 'cabinet': return <Home className="w-6 h-6 text-yellow-600" />;
      case 'counter': return <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">🏠</div>;
      default: return <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">📦</div>;
    }
  };

  const getLocationColor = (type: StorageLocation['type']) => {
    switch (type) {
      case 'fridge': return 'border-blue-200 bg-blue-50';
      case 'freezer': return 'border-cyan-200 bg-cyan-50';
      case 'pantry': return 'border-green-200 bg-green-50';
      case 'cabinet': return 'border-yellow-200 bg-yellow-50';
      case 'counter': return 'border-gray-200 bg-gray-50';
      default: return 'border-purple-200 bg-purple-50';
    }
  };

  const getFilteredProducts = () => {
    let filtered = products;

    // Filtrar por local selecionado
    if (selectedLocation && selectedLocation !== 'uncategorized') {
      filtered = filtered.filter(product => 
        product.location?.applianceId === selectedLocation ||
        product.location?.compartmentId === selectedLocation ||
        product.location?.shelfId === selectedLocation
      );
    } else if (selectedLocation === 'uncategorized') {
      filtered = filtered.filter(product => !product.location?.applianceId);
    }

    // Filtrar por busca
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filtrar por categoria
    if (filterOptions.categories.length > 0) {
      filtered = filtered.filter(product =>
        filterOptions.categories.includes(product.category)
      );
    }

    // Filtrar por status de validade
    if (filterOptions.expiryStatus !== 'all') {
      filtered = filtered.filter(product => {
        const status = ExpiryService.getExpiryStatus(product);
        switch (filterOptions.expiryStatus) {
          case 'safe': return !status.isExpiringSoon && !status.isExpired;
          case 'expiring': return status.isExpiringSoon && !status.isExpired;
          case 'expired': return status.isExpired;
          default: return true;
        }
      });
    }

    // Filtrar apenas em estoque
    if (filterOptions.showOnlyInStock) {
      filtered = filtered.filter(product => {
        const currentQuantity = (product.consumption as any)?.current_quantity || 0;
        return currentQuantity > 0;
      });
    }

    return filtered;
  };

  const getCategories = () => {
    const categories = new Set(products.map(p => p.category));
    return Array.from(categories).sort();
  };

  const getExpiryStats = () => {
    const stats = products.reduce((acc, product) => {
      const status = ExpiryService.getExpiryStatus(product);
      
      if (status.isExpired) acc.expired++;
      else if (status.isExpiringSoon) acc.expiring++;
      else acc.safe++;
      
      return acc;
    }, { safe: 0, expiring: 0, expired: 0 });

    return stats;
  };

  const filteredProducts = getFilteredProducts();
  const categories = getCategories();
  const expiryStats = getExpiryStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando seus produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Minha Cozinha</h1>
            <button
              onClick={() => onAddProduct()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Produto
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-800">{products.length}</div>
                  <div className="text-xs text-blue-600">Total de produtos</div>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-800">{expiryStats.safe}</div>
                  <div className="text-xs text-green-600">Seguros</div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-yellow-800">{expiryStats.expiring}</div>
                  <div className="text-xs text-yellow-600">Vencendo</div>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-800">{expiryStats.expired}</div>
                  <div className="text-xs text-red-600">Vencidos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Locations */}
      <div className="px-4 py-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Locais de Armazenamento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map(location => (
            <LocationCard
              key={location.id}
              location={location}
              isSelected={selectedLocation === location.id}
              onClick={() => setSelectedLocation(selectedLocation === location.id ? null : location.id)}
              onAddProduct={() => onAddProduct(location.id)}
            />
          ))}
        </div>
      </div>

      {/* Products Section */}
      {(selectedLocation || searchQuery || filterOptions.categories.length > 0) && (
        <div className="px-4 py-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedLocation ? 
                locations.find(l => l.id === selectedLocation)?.name || 'Produtos' : 
                'Todos os Produtos'
              }
              <span className="text-sm text-gray-600 ml-2">({filteredProducts.length})</span>
            </h2>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 text-gray-600 hover:text-gray-800"
              >
                {viewMode === 'grid' ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded ${showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar produtos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <div className="space-y-4">
                {/* Categories Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categorias</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => {
                          setFilterOptions(prev => ({
                            ...prev,
                            categories: prev.categories.includes(category)
                              ? prev.categories.filter(c => c !== category)
                              : [...prev.categories, category]
                          }));
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          filterOptions.categories.includes(category)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expiry Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status de Validade</label>
                  <select
                    value={filterOptions.expiryStatus}
                    onChange={(e) => setFilterOptions(prev => ({ ...prev, expiryStatus: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos</option>
                    <option value="safe">Seguros</option>
                    <option value="expiring">Vencendo em breve</option>
                    <option value="expired">Vencidos</option>
                  </select>
                </div>

                {/* In Stock Filter */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filterOptions.showOnlyInStock}
                    onChange={(e) => setFilterOptions(prev => ({ ...prev, showOnlyInStock: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Apenas produtos em estoque</span>
                </label>
              </div>
            </div>
          )}

          {/* Products Grid/List */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Nenhum produto encontrado</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => onProductClick(product)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map(product => (
                <ProductListItem
                  key={product.id}
                  product={product}
                  onClick={() => onProductClick(product)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Location Card Component
interface LocationCardProps {
  location: StorageLocation;
  isSelected: boolean;
  onClick: () => void;
  onAddProduct: () => void;
}

const LocationCard: React.FC<LocationCardProps> = ({
  location,
  isSelected,
  onClick,
  onAddProduct
}) => {
  const hasAlerts = location.expiredItems > 0 || location.expiringItems > 0;

  return (
    <div
      onClick={onClick}
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : getLocationColor(location.type)
      } ${hasAlerts ? 'ring-2 ring-red-300' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        {getLocationIcon(location.type)}
        <div className={`w-3 h-3 rounded-full ${
          location.expiredItems > 0 ? 'bg-red-500' : 
          location.expiringItems > 0 ? 'bg-yellow-500' : 'bg-green-500'
        }`} />
      </div>
      
      <h3 className="font-semibold text-gray-800 mb-1">{location.name}</h3>
      <p className="text-sm text-gray-600 mb-3">{location.description}</p>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{location.itemCount} itens</span>
        {hasAlerts && (
          <span className="text-red-600 font-medium">
            {location.expiredItems > 0 && `${location.expiredItems} vencido${location.expiredItems > 1 ? 's' : ''}`}
            {location.expiredItems > 0 && location.expiringItems > 0 && ' • '}
            {location.expiringItems > 0 && `${location.expiringItems} vencendo`}
          </span>
        )}
      </div>

      {location.temperature && (
        <div className="flex items-center gap-1 text-xs text-gray-600 mt-2">
          <Thermometer className="w-3 h-3" />
          <span>{location.temperature.min}°{location.temperature.unit} - {location.temperature.max}°{location.temperature.unit}</span>
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddProduct();
        }}
        className="w-full mt-3 py-1 bg-white border border-gray-200 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Adicionar aqui
      </button>
    </div>
  );
};

// Product Card Component
interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const expiryStatus = ExpiryService.getExpiryStatus(product);
  const currentQuantity = (product.consumption as any)?.current_quantity || 0;
  const originalQuantity = (product.consumption as any)?.original_quantity || 1;
  const stockPercentage = originalQuantity > 0 ? (currentQuantity / originalQuantity) * 100 : 0;

  const getStatusColor = () => {
    if (expiryStatus.isExpired) return 'border-red-200 bg-red-50';
    if (expiryStatus.isExpiringSoon) return 'border-yellow-200 bg-yellow-50';
    return 'border-gray-200 bg-white';
  };

  return (
    <div
      onClick={onClick}
      className={`border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all ${getStatusColor()}`}
    >
      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-24 object-cover rounded mb-2"
        />
      )}
      
      <h4 className="font-medium text-gray-800 text-sm mb-1 truncate">{product.name}</h4>
      <p className="text-xs text-gray-600 mb-2">{product.category}</p>
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-700">
          {currentQuantity} {product.unit}
        </span>
        {expiryStatus.isExpiringSoon || expiryStatus.isExpired ? (
          <span className={`font-medium ${
            expiryStatus.isExpired ? 'text-red-600' : 'text-yellow-600'
          }`}>
            {expiryStatus.isExpired ? 'Vencido' : `${expiryStatus.daysUntilExpiry}d`}
          </span>
        ) : null}
      </div>

      {/* Stock Progress */}
      {originalQuantity > 0 && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className={`h-1 rounded-full ${
                stockPercentage <= 20 ? 'bg-red-500' : 
                stockPercentage <= 50 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${stockPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Product List Item Component
const ProductListItem: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const expiryStatus = ExpiryService.getExpiryStatus(product);
  const currentQuantity = (product.consumption as any)?.current_quantity || 0;
  const originalQuantity = (product.consumption as any)?.original_quantity || 1;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-12 h-12 object-cover rounded"
              />
            )}
            <div>
              <h4 className="font-medium text-gray-800">{product.name}</h4>
              <p className="text-sm text-gray-600">{product.category}</p>
              <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                <span>Quantidade: {currentQuantity} {product.unit}</span>
                {expiryStatus.isExpiringSoon || expiryStatus.isExpired ? (
                  <span className={`font-medium ${
                    expiryStatus.isExpired ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {expiryStatus.isExpired ? 'Vencido' : `Vence em ${expiryStatus.daysUntilExpiry} dias`}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
};
