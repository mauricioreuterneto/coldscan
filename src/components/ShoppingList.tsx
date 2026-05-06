import React, { useState, useMemo } from 'react';
import { Product } from '../types/unified';
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  AlertTriangle,
  Calendar,
  Package,
  Search
} from 'lucide-react';
import {
  getExpiredProducts,
  getProductsExpiringSoon,
  getLowStockProducts,
  getCategories,
  getProductCategoryName,
  getProductQuantity,
  getProductUnit
} from '../utils';

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  checked: boolean;
  suggestedProducts?: string[];
}

interface ShoppingListProps {
  products: Product[];
  onUpdateProduct: (productId: string, updates: Partial<Product>) => void;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({
  products,
  onUpdateProduct,
}) => {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSuggestions, setShowSuggestions] = useState(true);

  const expiredProducts = getExpiredProducts(products);
  const expiringSoonProducts = getProductsExpiringSoon(products);
  const lowStockProducts = getLowStockProducts(products);
  const categories = getCategories(products);

  // Gerar sugestões automáticas baseadas nos produtos existentes
  const suggestions = useMemo(() => {
    const items: ShoppingItem[] = [];

    // Produtos vencidos - precisam ser repostos
    expiredProducts.forEach(product => {
      items.push({
        id: `expired-${product.id}`,
        name: product.name,
        category: getProductCategoryName(product),
        quantity: getProductQuantity(product),
        unit: getProductUnit(product),
        priority: 'high',
        reason: 'Produto vencido - precisa ser reposto',
        checked: false,
        suggestedProducts: [product.name]
      });
    });

    // Produtos vencendo em breve
    expiringSoonProducts.forEach(product => {
      items.push({
        id: `expiring-${product.id}`,
        name: product.name,
        category: getProductCategoryName(product),
        quantity: Math.max(getProductQuantity(product), 1),
        unit: getProductUnit(product),
        priority: 'high',
        reason: 'Vence em breve - compre antes que acabe',
        checked: false,
        suggestedProducts: [product.name]
      });
    });

    // Produtos com estoque baixo
    lowStockProducts.forEach(product => {
      const currentQuantity = getProductQuantity(product);
      const suggestedQuantity = currentQuantity <= 1 ? 3 : currentQuantity * 2;
      items.push({
        id: `lowstock-${product.id}`,
        name: product.name,
        category: getProductCategoryName(product),
        quantity: suggestedQuantity,
        unit: getProductUnit(product),
        priority: 'medium',
        reason: 'Estoque baixo - sugestão de reposição',
        checked: false,
        suggestedProducts: [product.name]
      });
    });

    // Sugestões baseadas em histórico (simulação)
    const commonProducts = [
      { name: 'Leite', category: 'Laticínios', quantity: 2, unit: 'Litros' },
      { name: 'Pão', category: 'Padaria', quantity: 1, unit: 'Pacote' },
      { name: 'Ovos', category: 'Ovos', quantity: 12, unit: 'Unidades' },
      { name: 'Arroz', category: 'Grãos', quantity: 1, unit: 'Pacote' },
      { name: 'Feijão', category: 'Grãos', quantity: 1, unit: 'Pacote' },
    ];

    commonProducts.forEach(product => {
      const hasProduct = products.some(p => 
        p.name.toLowerCase().includes(product.name.toLowerCase())
      );
      
      if (hasProduct) {
        items.push({
          id: `common-${product.name}`,
          name: product.name,
          category: product.category,
          quantity: product.quantity,
          unit: product.unit,
          priority: 'low',
          reason: 'Produto comum - verifique se precisa',
          checked: false,
          suggestedProducts: [product.name]
        });
      }
    });

    return items;
  }, [products, expiredProducts, expiringSoonProducts, lowStockProducts]);

  // Inicializar lista de compras com sugestões
  React.useEffect(() => {
    if (shoppingItems.length === 0 && suggestions.length > 0) {
      setShoppingItems(suggestions);
    }
  }, [suggestions, shoppingItems.length]);

  const filteredItems = useMemo(() => {
    let filtered = shoppingItems;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    return filtered.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [shoppingItems, searchQuery, selectedCategory]);

  const addNewItem = () => {
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: '',
      category: categories[0] || 'Outros',
      quantity: 1,
      unit: 'unidade',
      priority: 'medium',
      reason: 'Adicionado manualmente',
      checked: false
    };
    setShoppingItems([...shoppingItems, newItem]);
  };

  const updateItem = (id: string, updates: Partial<ShoppingItem>) => {
    setShoppingItems(items =>
      items.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  };

  const removeItem = (id: string) => {
    setShoppingItems(items => items.filter(item => item.id !== id));
  };

  const toggleItemChecked = (id: string) => {
    updateItem(id, { checked: !shoppingItems.find(item => item.id === id)?.checked });
  };

  const clearCheckedItems = () => {
    setShoppingItems(items => items.filter(item => !item.checked));
  };

  const acceptAllSuggestions = () => {
    setShoppingItems(suggestions.map(item => ({ ...item, checked: false })));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return 'Normal';
    }
  };

  const stats = {
    total: shoppingItems.length,
    checked: shoppingItems.filter(item => item.checked).length,
    highPriority: shoppingItems.filter(item => item.priority === 'high' && !item.checked).length,
    mediumPriority: shoppingItems.filter(item => item.priority === 'medium' && !item.checked).length,
    lowPriority: shoppingItems.filter(item => item.priority === 'low' && !item.checked).length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Lista de Compras Inteligente</h2>
        <p className="text-gray-600">
          Sugestões automáticas baseadas nos produtos da sua geladeira
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total</h3>
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Itens na lista</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Comprados</h3>
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.checked}</p>
          <p className="text-xs text-gray-500 mt-1">Itens marcados</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Alta Prioridade</h3>
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.highPriority}</p>
          <p className="text-xs text-gray-500 mt-1">Precisam urgentemente</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Média Prioridade</h3>
            <Calendar className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.mediumPriority}</p>
          <p className="text-xs text-gray-500 mt-1">Importantes</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Baixa Prioridade</h3>
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.lowPriority}</p>
          <p className="text-xs text-gray-500 mt-1">Se precisar</p>
        </div>
      </div>

      {/* Sugestões Automáticas */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Sugestões Automáticas</h3>
              <p className="text-blue-600">
                {suggestions.length} itens sugeridos baseados na sua geladeira
              </p>
            </div>
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-4">
            <button
              onClick={acceptAllSuggestions}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Aceitar Todas as Sugestões
            </button>
            <button
              onClick={() => setShowSuggestions(false)}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Ignorar Sugestões
            </button>
          </div>
        </div>
      )}

      {/* Busca e Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar itens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas as categorias</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button
            onClick={addNewItem}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Item
          </button>

          {stats.checked > 0 && (
            <button
              onClick={clearCheckedItems}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Limpar Comprados
            </button>
          )}
        </div>
      </div>

      {/* Lista de Compras */}
      <div className="bg-white rounded-lg shadow">
        <div className="divide-y divide-gray-200">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                item.checked ? 'bg-gray-50 opacity-75' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleItemChecked(item.id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    item.checked
                      ? 'bg-green-600 border-green-600'
                      : 'border-gray-300 hover:border-green-600'
                  }`}
                >
                  {item.checked && <Check className="w-4 h-4 text-white" />}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, { name: e.target.value })}
                      className={`font-medium bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 ${
                        item.checked ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}
                      placeholder="Nome do item"
                    />
                    <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(item.priority)}`}>
                      {getPriorityLabel(item.priority)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(item.id, { category: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                        className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="unidade">un</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="l">l</option>
                        <option value="ml">ml</option>
                        <option value="pacote">pacote</option>
                        <option value="caixa">caixa</option>
                        <option value="garrafa">garrafa</option>
                      </select>
                    </div>

                    <select
                      value={item.priority}
                      onChange={(e) => updateItem(item.id, { priority: e.target.value as 'high' | 'medium' | 'low' })}
                      className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="high">Alta</option>
                      <option value="medium">Média</option>
                      <option value="low">Baixa</option>
                    </select>
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {item.reason}
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum item na lista</h3>
            <p className="text-gray-500 mb-4">
              Adicione itens manualmente ou aceite as sugestões automáticas
            </p>
            <button
              onClick={addNewItem}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Adicionar Primeiro Item
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
