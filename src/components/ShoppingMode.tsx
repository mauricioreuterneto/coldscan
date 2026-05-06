import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  ShoppingCart, 
  Check, 
  X, 
  Plus, 
  Camera, 
  Mic, 
  MicOff,
  Search,
  DollarSign,
  Clock,
  MapPin,
  ChevronRight,
  Package,
  AlertCircle
} from 'lucide-react';
import { ShoppingService, ShoppingList, ShoppingItem, ShoppingSession } from '../services/shoppingService';

interface ShoppingModeProps {
  listId: string;
  userId: string;
  onComplete: () => void;
  onExit: () => void;
}

export const ShoppingMode: React.FC<ShoppingModeProps> = ({
  listId,
  userId,
  onComplete,
  onExit
}) => {
  const [list, setList] = useState<ShoppingList | null>(null);
  const [session, setSession] = useState<ShoppingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [voiceMode, setVoiceMode] = useState(false);
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unit: 'un',
    category: 'Outros',
    notes: ''
  });

  useEffect(() => {
    loadShoppingData();
  }, [listId]);

  const loadShoppingData = async () => {
    try {
      setLoading(true);
      
      // Carregar lista
      const shoppingList = await ShoppingService.getShoppingList(listId);
      if (!shoppingList) {
        throw new Error('Lista não encontrada');
      }
      setList(shoppingList);

      // Iniciar ou retomar sessão
      const existingSession = await getActiveSession();
      if (existingSession) {
        setSession(existingSession);
      } else {
        const newSession = await ShoppingService.startShoppingSession(
          listId,
          userId,
          shoppingList.storeId,
          shoppingList.budget
        );
        setSession(newSession);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActiveSession = async (): Promise<ShoppingSession | null> => {
    try {
      const { data } = await supabase
        .from('shopping_sessions')
        .select('*')
        .eq('list_id', listId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      return data ? (ShoppingService as any).formatShoppingSession(data) : null;
    } catch {
      return null;
    }
  };

  const updateItemStatus = async (itemId: string, status: ShoppingItem['status']) => {
    if (!list) return;

    try {
      await ShoppingService.updateItemStatus(itemId, status);
      
      // Atualizar estado local
      const updatedItems = list.items.map(item =>
        item.id === itemId ? { ...item, status } : item
      );
      setList({ ...list, items: updatedItems });

      // Atualizar progresso da sessão
      if (session) {
        const checkedItems = updatedItems.filter(item => 
          item.status === 'in_cart' || item.status === 'purchased'
        ).length;
        
        const totalSpent = updatedItems
          .filter(item => item.status === 'purchased')
          .reduce((sum, item) => sum + (item.purchasedPrice || 0), 0);

        await ShoppingService.updateSessionProgress(
          session.id,
          checkedItems,
          totalSpent
        );

        setSession({
          ...session,
          itemsChecked: checkedItems,
          currentSpent: totalSpent
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
    }
  };

  const completeShopping = async () => {
    if (!session) return;

    try {
      await ShoppingService.completeShoppingSession(session.id);
      onComplete();
    } catch (error) {
      console.error('Erro ao finalizar compras:', error);
    }
  };

  const addNewItem = async () => {
    if (!list || !newItem.name.trim()) return;

    try {
      await ShoppingService.addItemToList(listId, {
        name: newItem.name,
        category: newItem.category,
        quantity: newItem.quantity,
        unit: newItem.unit,
        priority: 'medium',
        status: 'pending',
        notes: newItem.notes
      });

      // Recarregar lista
      const updatedList = await ShoppingService.getShoppingList(listId);
      if (updatedList) {
        setList(updatedList);
      }

      // Reset form
      setNewItem({
        name: '',
        quantity: 1,
        unit: 'un',
        category: 'Outros',
        notes: ''
      });
      setShowAddItem(false);
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
    }
  };

  const filteredItems = list?.items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const stats = list ? ShoppingService.calculateListStats(list) : null;
  const progressPercentage = session ? (session.itemsChecked / session.totalItems) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando lista de compras...</p>
        </div>
      </div>
    );
  }

  if (!list || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Erro ao carregar lista de compras</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-gray-800">{list.name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                {list.storeName || 'Loja não especificada'}
              </div>
            </div>
            <button
              onClick={onExit}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{session.itemsChecked} de {session.totalItems} itens</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 rounded-full h-2 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-blue-50 rounded-lg p-2">
                <div className="text-xs text-blue-600">Estimado</div>
                <div className="text-sm font-bold text-blue-800">
                  R$ {stats.totalEstimated.toFixed(2)}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <div className="text-xs text-green-600">Gasto</div>
                <div className="text-sm font-bold text-green-800">
                  R$ {stats.totalSpent.toFixed(2)}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-2">
                <div className="text-xs text-purple-600">Tempo</div>
                <div className="text-sm font-bold text-purple-800">
                  {Math.floor((Date.now() - session.startTime.getTime()) / 60000)}min
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setVoiceMode(!voiceMode)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              voiceMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {voiceMode ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            {voiceMode ? 'Voz ON' : 'Voz OFF'}
          </button>
          
          <button
            onClick={() => setBarcodeScanning(!barcodeScanning)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              barcodeScanning 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            {barcodeScanning ? 'Scanner ON' : 'Scanner OFF'}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar item..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-2">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                {searchQuery ? 'Nenhum item encontrado' : 'Nenhum item na lista'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map(item => (
                <ShoppingItemCard
                  key={item.id}
                  item={item}
                  onStatusChange={updateItemStatus}
                  voiceMode={voiceMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddItem(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Item
          </button>
          
          <button
            onClick={completeShopping}
            disabled={stats?.completionPercentage !== 100}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4" />
            Finalizar
          </button>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Adicionar Item</h3>
                <button
                  onClick={() => setShowAddItem(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do item
                  </label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Leite integral"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidade
                    </label>
                    <select
                      value={newItem.unit}
                      onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="un">Unidades</option>
                      <option value="kg">Quilos</option>
                      <option value="g">Gramas</option>
                      <option value="L">Litros</option>
                      <option value="ml">Mililitros</option>
                      <option value="pacote">Pacotes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Laticínios">Laticínios</option>
                    <option value="Carnes">Carnes</option>
                    <option value="Vegetais">Vegetais</option>
                    <option value="Frutas">Frutas</option>
                    <option value="Grãos">Grãos</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Padaria">Padaria</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Condimentos">Condimentos</option>
                    <option value="Limpeza">Limpeza</option>
                    <option value="Higiene">Higiene</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={newItem.notes}
                    onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Ex: Marca preferida, tamanho específico..."
                  />
                </div>

                <button
                  onClick={addNewItem}
                  disabled={!newItem.name.trim()}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Adicionar à Lista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Shopping Item Card Component
interface ShoppingItemCardProps {
  item: ShoppingItem;
  onStatusChange: (itemId: string, status: ShoppingItem['status']) => void;
  voiceMode: boolean;
}

const ShoppingItemCard: React.FC<ShoppingItemCardProps> = ({
  item,
  onStatusChange,
  voiceMode
}) => {
  const getStatusColor = (status: ShoppingItem['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'in_cart': return 'bg-blue-100 text-blue-700';
      case 'purchased': return 'bg-green-100 text-green-700';
      case 'not_found': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: ShoppingItem['status']) => {
    switch (status) {
      case 'pending': return <div className="w-4 h-4 border-2 border-gray-400 rounded-full" />;
      case 'in_cart': return <ShoppingCart className="w-4 h-4" />;
      case 'purchased': return <Check className="w-4 h-4" />;
      case 'not_found': return <X className="w-4 h-4" />;
      default: return <div className="w-4 h-4 border-2 border-gray-400 rounded-full" />;
    }
  };

  const nextStatus = () => {
    switch (item.status) {
      case 'pending': return 'in_cart';
      case 'in_cart': return 'purchased';
      case 'purchased': return 'pending';
      case 'not_found': return 'pending';
      default: return 'pending';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-800">{item.name}</h4>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <span>{item.quantity} {item.unit}</span>
              {item.estimatedPrice && (
                <span>• R$ {item.estimatedPrice.toFixed(2)}</span>
              )}
            </div>
            {item.notes && (
              <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
            )}
          </div>
          
          <button
            onClick={() => onStatusChange(item.id, nextStatus())}
            className={`p-2 rounded-lg transition-colors ${getStatusColor(item.status)}`}
          >
            {getStatusIcon(item.status)}
          </button>
        </div>

        {voiceMode && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <Mic className="w-3 h-3" />
              <span>Diga "comprar {item.name}" para adicionar ao carrinho</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
