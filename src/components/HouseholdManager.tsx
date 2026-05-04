import React, { useState, useEffect } from 'react';
import { RefrigerationAppliance, Household, FridgeModel } from '../types';
import { multiApplianceService } from '../services/multiApplianceService';
import { ApplianceManager } from './ApplianceManager';
import { FridgeModelSelector } from './FridgeModelSelector';
import { LayoutConfirmation } from './LayoutConfirmation';
import { AdvancedLayoutEditor } from './AdvancedLayoutEditor';

interface HouseholdManagerProps {
  onApplianceSelected?: (appliance: RefrigerationAppliance) => void;
}

export const HouseholdManager: React.FC<HouseholdManagerProps> = ({
  onApplianceSelected
}) => {
  const [household, setHousehold] = useState<Household | null>(null);
  const [selectedAppliance, setSelectedAppliance] = useState<RefrigerationAppliance | null>(null);
  const [currentView, setCurrentView] = useState<'appliances' | 'add-model' | 'layout-confirmation' | 'advanced-editor'>('appliances');
  const [pendingModel, setPendingModel] = useState<FridgeModel | null>(null);

  useEffect(() => {
    loadHousehold();
  }, []);

  const loadHousehold = async () => {
    try {
      const householdData = await multiApplianceService.getHousehold();
      setHousehold(householdData);
      
      const primaryAppliance = await multiApplianceService.getPrimaryAppliance();
      if (primaryAppliance) {
        setSelectedAppliance(primaryAppliance);
        onApplianceSelected?.(primaryAppliance);
      }
    } catch (error) {
      console.error('Erro ao carregar household:', error);
    }
  };

  const handleAddNewAppliance = () => {
    setCurrentView('add-model');
  };

  const handleModelSelected = (model: FridgeModel) => {
    setPendingModel(model);
    setCurrentView('layout-confirmation');
  };

  const handleLayoutConfirmed = (finalModel: FridgeModel) => {
    // Aqui vamos criar o aparelho com o modelo final
    // Por ora, vamos voltar para a view de appliances
    setCurrentView('appliances');
    loadHousehold(); // Recarregar para mostrar o novo aparelho
  };

  const handleApplianceSelect = (appliance: RefrigerationAppliance) => {
    setSelectedAppliance(appliance);
    onApplianceSelected?.(appliance);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'appliances':
        return (
          <ApplianceManager
            onApplianceSelect={handleApplianceSelect}
            onAddNewAppliance={handleAddNewAppliance}
          />
        );
      
      case 'add-model':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => setCurrentView('appliances')}
                className="text-blue-600 hover:text-blue-700 mb-4"
              >
                ← Voltar para Meus Aparelhos
              </button>
              <h2 className="text-2xl font-bold text-gray-800">Adicionar Novo Aparelho</h2>
              <p className="text-gray-600">Selecione o modelo do seu aparelho de refrigeração</p>
            </div>
            <FridgeModelSelector
              onSelectModel={handleModelSelected}
              availableModels={household?.appliances.map(a => a.model) || []}
            />
          </div>
        );
      
      case 'layout-confirmation':
        if (!pendingModel) return null;
        
        return (
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => setCurrentView('add-model')}
                className="text-blue-600 hover:text-blue-700 mb-4"
              >
                ← Voltar para Seleção de Modelo
              </button>
              <h2 className="text-2xl font-bold text-gray-800">Confirmar Layout do Aparelho</h2>
              <p className="text-gray-600">Verifique e ajuste o layout interno do seu aparelho</p>
            </div>
            <LayoutConfirmation
              modelInfo={{
                id: pendingModel.id,
                brand: pendingModel.brand,
                model: pendingModel.model,
                year: pendingModel.year,
                capacity: pendingModel.capacity,
                image_url: pendingModel.imageUrl
              }}
              onLayoutConfirmed={handleLayoutConfirmed}
              onBack={() => setCurrentView('add-model')}
            />
          </div>
        );
      
      case 'advanced-editor':
        return (
          <div className="h-screen">
            <AdvancedLayoutEditor
              initialLayout={{
                fridgeType: {
                  id: 'custom',
                  name: 'Layout Personalizado',
                  category: 'standard',
                  description: 'Layout editado pelo usuário',
                  typicalFeatures: [],
                  defaultStructure: []
                },
                customCompartments: selectedAppliance?.model.compartments || [],
                dimensions: {
                  totalHeight: 180,
                  totalWidth: 60,
                  totalDepth: 65
                },
                specialFeatures: [],
                energyClass: 'A',
                frostType: 'frost_free',
                doorConfiguration: 'single'
              }}
              onLayoutChange={() => {}} // Implementar se necessário
              onSave={() => setCurrentView('appliances')}
              onCancel={() => setCurrentView('appliances')}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!household) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Aparelhos</h1>
              <p className="text-gray-600">
                {household.name} • {household.appliances.length} aparelhos cadastrados
              </p>
            </div>
            
            {selectedAppliance && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-blue-800 font-medium">
                    {selectedAppliance.name}
                  </span>
                  <span className="text-blue-600 text-sm">
                    {selectedAppliance.model.capacity}L
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setCurrentView('appliances')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'appliances'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Meus Aparelhos
            </button>
            
            <button
              onClick={() => setCurrentView('advanced-editor')}
              disabled={!selectedAppliance}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'advanced-editor'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:text-gray-300 disabled:hover:border-transparent'
              }`}
            >
              Editor Avançado
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {renderCurrentView()}
      </div>
    </div>
  );
};
