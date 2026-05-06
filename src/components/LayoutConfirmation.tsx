import React, { useState } from 'react';
import { FridgeModel, Compartment, FridgeModelInfo } from '../types/unified';
import { fridgeLayoutService, LayoutSearchResult } from '../services/fridgeLayoutService';
import { layoutPersistenceService, UserLayout } from '../services/layoutPersistenceService';
import { Check, Edit3, AlertTriangle, RefreshCw, Users, Star, Flag, Save } from 'lucide-react';

interface LayoutConfirmationProps {
  modelInfo: FridgeModelInfo;
  onLayoutConfirmed: (fridgeModel: FridgeModel) => void;
  onBack: () => void;
}

export const LayoutConfirmation: React.FC<LayoutConfirmationProps> = ({
  modelInfo,
  onLayoutConfirmed,
  onBack
}) => {
  const [layoutResults, setLayoutResults] = useState<LayoutSearchResult[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<LayoutSearchResult | null>(null);
  const [userLayouts, setUserLayouts] = useState<UserLayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [customCompartments, setCustomCompartments] = useState<Compartment[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveReason, setSaveReason] = useState('');
  const [userName, setUserName] = useState('');
  const [showThanksMessage, setShowThanksMessage] = useState(false);

  React.useEffect(() => {
    loadLayouts();
  }, [modelInfo]);

  const loadLayouts = async () => {
    setIsLoading(true);
    try {
      // 1. Carregar layouts da comunidade
      const communityLayouts = await layoutPersistenceService.getLayoutsForModel(modelInfo);
      setUserLayouts(communityLayouts);
      
      // 2. Carregar templates do sistema
      const results = await fridgeLayoutService.findBestLayout(modelInfo);
      setLayoutResults(results);
      
      // 3. Selecionar melhor layout (prioridade: comunidade verificado > template > adaptativo)
      if (communityLayouts.length > 0) {
        const bestCommunityLayout = communityLayouts[0];
        setCustomCompartments(bestCommunityLayout.compartments);
        setSelectedLayout(null); // Indica que é layout da comunidade
      } else if (results.length > 0) {
        setSelectedLayout(results[0]);
        setCustomCompartments(results[0].template.compartments);
      } else {
        // Fallback para layout adaptativo
        const adaptiveLayout = fridgeLayoutService.generateAdaptiveLayout(modelInfo);
        setCustomCompartments(adaptiveLayout);
      }
    } catch (error) {
      console.error('Erro ao carregar layouts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmLayout = () => {
    const fridgeModel: FridgeModel = {
      id: modelInfo.id,
      name: `${modelInfo.brand} ${modelInfo.model}`,
      brand: modelInfo.brand,
      model: modelInfo.model,
      year: modelInfo.year || new Date().getFullYear(),
      category: 'standard',
      description: 'Modelo configurado pelo usuário',
      capacity: modelInfo.capacity,
      image: modelInfo.image,
      compartments: customCompartments,
      dimensions: modelInfo.dimensions || { width: 60, height: 170, depth: 65 },
      features: modelInfo.features || []
    };
    onLayoutConfirmed(fridgeModel);
  };

  const handleSaveLayout = async () => {
    if (!saveReason.trim()) {
      alert('Por favor, explique por que este layout é melhor que os existentes.');
      return;
    }

    try {
      await layoutPersistenceService.saveUserLayout(
        modelInfo,
        customCompartments,
        undefined, // userId (implementar autenticação depois)
        userName || 'Anônimo',
        saveReason
      );
      
      setShowSaveDialog(false);
      setShowThanksMessage(true);
      setSaveReason('');
      
      // Recarregar layouts para incluir o novo
      await loadLayouts();
      
      // Esconder mensagem após 3 segundos
      setTimeout(() => setShowThanksMessage(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar layout:', error);
      alert('Erro ao salvar layout. Tente novamente.');
    }
  };

  const handleVerifyLayout = async (layoutId: string) => {
    try {
      await layoutPersistenceService.verifyLayout(layoutId);
      await loadLayouts(); // Recarregar para atualizar contadores
    } catch (error) {
      console.error('Erro ao verificar layout:', error);
    }
  };

  const handleReportLayout = async (layoutId: string) => {
    const shouldReport = window.confirm('Este layout está incorreto? Isso ajudará a melhorar a qualidade para outros usuários.');
    if (shouldReport) {
      try {
        await layoutPersistenceService.reportLayout(layoutId);
        await loadLayouts(); // Recarregar para atualizar
      } catch (error) {
        console.error('Erro ao reportar layout:', error);
      }
    }
  };

  const handleSelectLayout = (layout: LayoutSearchResult) => {
    setSelectedLayout(layout);
    setCustomCompartments(layout.template.compartments);
    setIsEditing(false);
  };

  const handleEditCompartment = (compartmentId: string, field: keyof Compartment, value: any) => {
    setCustomCompartments(prev => 
      prev.map(comp => 
        comp.id === compartmentId 
          ? { ...comp, [field]: value }
          : comp
      )
    );
  };

  const renderCompartment = (compartment: Compartment, index: number) => {
    const isSelected = selectedLayout?.template.compartments.some(c => c.id === compartment.id);
    
    return (
      <div
        key={compartment.id}
        className={`border rounded-lg p-4 mb-3 ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-semibold text-gray-800">{compartment.name}</h4>
            <p className="text-sm text-gray-600">
              Tipo: {compartment.type} | Capacidade: {compartment.capacity}L
            </p>
          </div>
          {isEditing && (
            <button
              onClick={() => {/* TODO: Remove compartment */}}
              className="text-red-500 hover:text-red-700"
            >
              Remover
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-gray-700 mb-1">Nome:</label>
                <input
                  type="text"
                  value={compartment.name}
                  onChange={(e) => handleEditCompartment(compartment.id, 'name', e.target.value)}
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Capacidade (L):</label>
                <input
                  type="number"
                  value={compartment.capacity}
                  onChange={(e) => handleEditCompartment(compartment.id, 'capacity', parseInt(e.target.value))}
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Tipo:</label>
              <select
                value={compartment.type}
                onChange={(e) => handleEditCompartment(compartment.id, 'type', e.target.value)}
                className="w-full px-2 py-1 border rounded"
              >
                <option value="fridge">Geladeira</option>
                <option value="freezer">Freezer</option>
                <option value="door">Porta</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            <p>Posição: X:{compartment.position.x}, Y:{compartment.position.y}</p>
            <p>Tamanho: {compartment.position.width}x{compartment.position.height}</p>
            {compartment.shelves && (
              <p>Prateleiras: {compartment.shelves.length}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Analisando layout ideal para sua geladeira...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Layout Interno Sugerido
        </h3>
        <p className="text-gray-600">
          Baseado no modelo {modelInfo.brand} {modelInfo.model} ({modelInfo.capacity}L)
        </p>
      </div>

      {/* Community Layouts */}
      {userLayouts.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Users className="w-5 h-5 text-purple-600 mr-2" />
            <h4 className="font-semibold text-purple-800">Layouts da Comunidade</h4>
          </div>
          <div className="space-y-2">
            {userLayouts.map((userLayout, index) => (
              <div
                key={userLayout.id}
                className={`p-3 rounded border transition-colors ${
                  selectedLayout === null && customCompartments === userLayout.compartments
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-purple-300 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedLayout(null);
                        setCustomCompartments(userLayout.compartments);
                        setIsEditing(false);
                      }}
                      className="text-left flex-1"
                    >
                      <div>
                        <p className="font-medium text-purple-800">
                          {userLayout.userName} 
                          {userLayout.isVerified && <Star className="w-4 h-4 text-yellow-500 inline ml-1" />}
                        </p>
                        <p className="text-sm text-gray-600">
                          {userLayout.compartments.length} compartimentos
                          {userLayout.metadata?.confidence && 
                            ` • ${Math.round(userLayout.metadata.confidence * 100)}% confiança`
                          }
                        </p>
                        {userLayout.metadata?.editReason && (
                          <p className="text-xs text-gray-500 mt-1">
                            "{userLayout.metadata.editReason}"
                          </p>
                        )}
                      </div>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-700">
                        ✓{userLayout.verificationCount}
                      </div>
                      {userLayout.reports > 0 && (
                        <div className="text-xs text-red-500">
                          ⚠{userLayout.reports}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleVerifyLayout(userLayout.id)}
                        className="p-1 text-green-600 hover:text-green-700"
                        title="Confirmar que este layout está correto"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReportLayout(userLayout.id)}
                        className="p-1 text-red-600 hover:text-red-700"
                        title="Reportar layout incorreto"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Layout Options */}
      {layoutResults.length > 1 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <h4 className="font-semibold text-yellow-800">Múltiplos layouts encontrados</h4>
          </div>
          <div className="space-y-2">
            {layoutResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelectLayout(result)}
                className={`w-full text-left p-3 rounded border transition-colors ${
                  selectedLayout === result
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{result.template.name}</p>
                    <p className="text-sm text-gray-600">{result.matchReason}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-700">
                      {Math.round(result.confidence * 100)}% confiança
                    </div>
                    <div className="text-xs text-gray-500">
                      {result.template.compartments.length} compartimentos
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Layout */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-800">
            {selectedLayout ? selectedLayout.template.name : 'Layout Adaptativo'}
          </h4>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${
              isEditing
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isEditing ? (
              <>
                <Check className="w-4 h-4" />
                Salvar
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                Editar
              </>
            )}
          </button>
        </div>

        <div className="space-y-3">
          {customCompartments.map((compartment, index) => renderCompartment(compartment, index))}
        </div>

        {isEditing && (
          <>
            <button
              onClick={() => {
                // TODO: Add new compartment
                const newCompartment: Compartment = {
                  id: `compartment-${Date.now()}`,
                  name: 'Novo Compartimento',
                  type: 'fridge',
                  capacity: 50,
                  position: { x: 0, y: 0, width: 100, height: 20 },
                  shelves: []
                };
                setCustomCompartments(prev => [...prev, newCompartment]);
              }}
              className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
            >
              + Adicionar Compartimento
            </button>
            
            <button
              onClick={() => setShowSaveDialog(true)}
              className="mt-3 w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Layout para a Comunidade
            </button>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
        <button
          onClick={handleConfirmLayout}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Confirmar Layout
        </button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Compartilhar Layout</h3>
            <p className="text-gray-600 mb-4">
              Ajude outros usuários com a mesma geladeira compartilhando seu layout personalizado.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seu nome (opcional)
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Anônimo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Por que este layout é melhor? *
                </label>
                <textarea
                  value={saveReason}
                  onChange={(e) => setSaveReason(e.target.value)}
                  placeholder="Ex: 'Adicionei mais prateleiras na porta porque meu modelo tem 4 compartimentos'"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLayout}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Compartilhar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thanks Message */}
      {showThanksMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>Obrigado! Seu layout foi salvo e ajudará outros usuários.</span>
          </div>
        </div>
      )}
    </div>
  );
};
