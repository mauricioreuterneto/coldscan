import React, { useState, useEffect } from 'react';
import { 
  RefrigerationAppliance, 
  ApplianceType, 
  ApplianceLocation, 
  Household,
  FridgeModel 
} from '../types';
import { multiApplianceService } from '../services/multiApplianceService';
import { 
  Plus, 
  MapPin, 
  Settings, 
  Trash2, 
  Star, 
  Power, 
  Edit3,
  Home,
  Car,
  Sofa,
  TreePine,
  Wine,
  Beer,
  IceCream,
  Store,
  Utensils
} from 'lucide-react';

interface ApplianceManagerProps {
  onApplianceSelect?: (appliance: RefrigerationAppliance) => void;
  onAddNewAppliance?: () => void;
}

export const ApplianceManager: React.FC<ApplianceManagerProps> = ({
  onApplianceSelect,
  onAddNewAppliance
}) => {
  const [household, setHousehold] = useState<Household | null>(null);
  const [appliances, setAppliances] = useState<RefrigerationAppliance[]>([]);
  const [selectedAppliance, setSelectedAppliance] = useState<RefrigerationAppliance | null>(null);
  const [isAddingAppliance, setIsAddingAppliance] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState<RefrigerationAppliance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadHouseholdData();
  }, []);

  const loadHouseholdData = async () => {
    try {
      setIsLoading(true);
      const householdData = await multiApplianceService.getHousehold();
      const appliancesData = await multiApplianceService.getAllAppliances();
      
      setHousehold(householdData);
      setAppliances(appliancesData);
      
      // Selecionar aparelho principal por padrão
      const primaryAppliance = await multiApplianceService.getPrimaryAppliance();
      if (primaryAppliance) {
        setSelectedAppliance(primaryAppliance);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAppliance = async (applianceData: {
    name: string;
    designation: string;
    applianceType: ApplianceType;
    model: FridgeModel;
    location: ApplianceLocation;
    positionDescription: string;
  }) => {
    try {
      const newAppliance = await multiApplianceService.addAppliance(
        applianceData.name,
        applianceData.designation,
        applianceData.applianceType,
        applianceData.model,
        applianceData.location,
        applianceData.positionDescription
      );

      setAppliances(prev => [...prev, newAppliance]);
      setShowAddForm(false);
      
      // Se for o primeiro aparelho, selecionar automaticamente
      if (appliances.length === 0) {
        setSelectedAppliance(newAppliance);
      }

      onApplianceSelect?.(newAppliance);
    } catch (error) {
      console.error('Erro ao adicionar aparelho:', error);
      alert('Erro ao adicionar aparelho. Tente novamente.');
    }
  };

  const handleUpdateAppliance = async (applianceId: string, updates: Partial<RefrigerationAppliance>) => {
    try {
      const updatedAppliance = await multiApplianceService.updateAppliance(applianceId, updates);
      
      setAppliances(prev => prev.map(a => a.id === applianceId ? updatedAppliance : a));
      
      if (selectedAppliance?.id === applianceId) {
        setSelectedAppliance(updatedAppliance);
      }
      
      setEditingAppliance(null);
    } catch (error) {
      console.error('Erro ao atualizar aparelho:', error);
      alert('Erro ao atualizar aparelho. Tente novamente.');
    }
  };

  const handleRemoveAppliance = async (applianceId: string) => {
    if (!confirm('Tem certeza que deseja remover este aparelho? Todos os produtos associados serão perdidos.')) {
      return;
    }

    try {
      await multiApplianceService.removeAppliance(applianceId);
      
      setAppliances(prev => prev.filter(a => a.id !== applianceId));
      
      if (selectedAppliance?.id === applianceId) {
        const remaining = appliances.filter(a => a.id !== applianceId);
        setSelectedAppliance(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (error) {
      console.error('Erro ao remover aparelho:', error);
      alert('Erro ao remover aparelho. Tente novamente.');
    }
  };

  const handleSetPrimary = async (applianceId: string) => {
    try {
      await multiApplianceService.setPrimaryAppliance(applianceId);
      
      setAppliances(prev => prev.map(a => ({
        ...a,
        isPrimary: a.id === applianceId
      })));
      
      const appliance = appliances.find(a => a.id === applianceId);
      if (appliance) {
        setSelectedAppliance(appliance);
      }
    } catch (error) {
      console.error('Erro ao definir aparelho principal:', error);
    }
  };

  const handleToggleActive = async (applianceId: string) => {
    const appliance = appliances.find(a => a.id === applianceId);
    if (!appliance) return;

    try {
      await multiApplianceService.updateAppliance(applianceId, { isActive: !appliance.isActive });
      
      setAppliances(prev => prev.map(a => 
        a.id === applianceId ? { ...a, isActive: !a.isActive } : a
      ));
    } catch (error) {
      console.error('Erro ao alternar status do aparelho:', error);
    }
  };

  const getApplianceIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'fridge': <IceCream className="w-5 h-5" />,
      'freezer': <IceCream className="w-5 h-5 text-cyan-500" />,
      'mini_fridge': <Beer className="w-5 h-5 text-green-500" />,
      'wine_cooler': <Wine className="w-5 h-5 text-purple-500" />,
      'beverage_cooler': <Beer className="w-5 h-5 text-blue-500" />,
      'commercial': <Store className="w-5 h-5 text-orange-500" />
    };
    return icons[category] || <IceCream className="w-5 h-5" />;
  };

  const getLocationIcon = (locationType: string) => {
    const icons: Record<string, React.ReactNode> = {
      'kitchen': <Utensils className="w-4 h-4" />,
      'garage': <Car className="w-4 h-4" />,
      'living_room': <Sofa className="w-4 h-4" />,
      'bedroom': <Home className="w-4 h-4" />,
      'outdoor': <TreePine className="w-4 h-4" />
    };
    return icons[locationType] || <MapPin className="w-4 h-4" />;
  };

  const renderApplianceCard = (appliance: RefrigerationAppliance) => (
    <div
      key={appliance.id}
      className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
        selectedAppliance?.id === appliance.id 
          ? 'border-blue-500 shadow-lg' 
          : 'border-gray-200 hover:border-gray-300'
      } ${!appliance.isActive ? 'opacity-60' : ''}`}
      onClick={() => {
        setSelectedAppliance(appliance);
        onApplianceSelect?.(appliance);
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            {getApplianceIcon(appliance.applianceType.category)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{appliance.name}</h3>
            {appliance.designation && (
              <p className="text-sm text-gray-600">{appliance.designation}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{appliance.model.brand} {appliance.model.model}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">{appliance.model.capacity}L</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {appliance.isPrimary && (
            <div className="p-1 bg-yellow-100 rounded" title="Aparelho Principal">
              <Star className="w-4 h-4 text-yellow-600" />
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(appliance.id);
            }}
            className={`p-1 rounded ${appliance.isActive ? 'bg-green-100' : 'bg-gray-100'}`}
            title={appliance.isActive ? 'Desativar' : 'Ativar'}
          >
            <Power className={`w-4 h-4 ${appliance.isActive ? 'text-green-600' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          {getLocationIcon(appliance.location.type)}
          <span>{appliance.location.name}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!appliance.isPrimary) {
                handleSetPrimary(appliance.id);
              }
            }}
            disabled={appliance.isPrimary}
            className={`px-2 py-1 text-xs rounded ${
              appliance.isPrimary 
                ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {appliance.isPrimary ? 'Principal' : 'Definir Principal'}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingAppliance(appliance);
            }}
            className="p-1 text-gray-500 hover:text-gray-700"
            title="Editar"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveAppliance(appliance.id);
            }}
            className="p-1 text-red-500 hover:text-red-700"
            title="Remover"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {appliance.position?.description && (
        <div className="mt-2 text-xs text-gray-500 italic">
          📍 {appliance.position.description}
        </div>
      )}
    </div>
  );

  const renderAddApplianceForm = () => (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Adicionar Novo Aparelho</h3>
      
      <AddApplianceForm
        onSubmit={handleAddAppliance}
        onCancel={() => setShowAddForm(false)}
        household={household!}
      />
    </div>
  );

  const renderEditApplianceModal = () => {
    if (!editingAppliance) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Editar Aparelho</h3>
          
          <EditApplianceForm
            appliance={editingAppliance}
            onSubmit={(updates) => handleUpdateAppliance(editingAppliance.id, updates)}
            onCancel={() => setEditingAppliance(null)}
            household={household!}
          />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-600">Carregando aparelhos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Meus Aparelhos</h2>
          <p className="text-sm text-gray-600">
            {appliances.filter(a => a.isActive).length} de {appliances.length} aparelhos ativos
          </p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Aparelho
        </button>
      </div>

      {/* Appliance List */}
      {appliances.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-500 mb-4">
            <IceCream className="w-12 h-12 mx-auto mb-2" />
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum aparelho cadastrado</h3>
          <p className="text-gray-600 mb-4">
            Adicione sua primeira geladeira, freezer ou frigobar para começar a organizar seus alimentos.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Adicionar Primeiro Aparelho
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {appliances.map(renderApplianceCard)}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && renderAddApplianceForm()}

      {/* Edit Modal */}
      {renderEditApplianceModal()}

      {/* Selected Appliance Info */}
      {selectedAppliance && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-800">Aparelho Selecionado</h4>
              <p className="text-blue-700">
                {selectedAppliance.name} - {selectedAppliance.model.capacity}L
              </p>
            </div>
            <div className="text-sm text-blue-600">
              {selectedAppliance.model.compartments.length} compartimentos
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Form Component for Adding Appliance
const AddApplianceForm: React.FC<{
  onSubmit: (data: any) => void;
  onCancel: () => void;
  household: Household;
}> = ({ onSubmit, onCancel, household }) => {
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    applianceType: '',
    location: '',
    positionDescription: ''
  });

  const applianceTypes = multiApplianceService.getApplianceTypes();
  const locations = household.locations;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const applianceType = applianceTypes.find(t => t.id === formData.applianceType);
    const location = locations.find(l => l.id === formData.location);
    
    if (!applianceType || !location) {
      alert('Selecione tipo de aparelho e localização');
      return;
    }

    // Criar modelo básico (depois será substituído pelo fluxo normal)
    const basicModel: FridgeModel = {
      id: `model-${Date.now()}`,
      brand: 'Genérico',
      model: 'Modelo Básico',
      capacity: 300,
      compartments: []
    };

    onSubmit({
      name: formData.name,
      designation: formData.designation || undefined,
      applianceType,
      model: basicModel,
      location,
      positionDescription: formData.positionDescription
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Aparelho *</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Geladeira da Cozinha"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Designação (opcional)</label>
        <input
          type="text"
          value={formData.designation}
          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
          placeholder="Ex: Geladeira Principal, Bebidas, Emergência"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Aparelho *</label>
        <select
          required
          value={formData.applianceType}
          onChange={(e) => setFormData({ ...formData, applianceType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Selecione...</option>
          {applianceTypes.map(type => (
            <option key={type.id} value={type.id}>
              {type.icon} {type.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Localização *</label>
        <select
          required
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Selecione...</option>
          {locations.map(location => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Posição Específica (opcional)</label>
        <input
          type="text"
          value={formData.positionDescription}
          onChange={(e) => setFormData({ ...formData, positionDescription: e.target.value })}
          placeholder="Ex: Ao lado da janela, Embaixo da bancada"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Adicionar Aparelho
        </button>
      </div>
    </form>
  );
};

// Form Component for Editing Appliance
const EditApplianceForm: React.FC<{
  appliance: RefrigerationAppliance;
  onSubmit: (updates: any) => void;
  onCancel: () => void;
  household: Household;
}> = ({ appliance, onSubmit, onCancel, household }) => {
  const [formData, setFormData] = useState({
    name: appliance.name,
    designation: appliance.designation || '',
    positionDescription: appliance.position?.description || '',
    isActive: appliance.isActive,
    alertsEnabled: appliance.customSettings?.alertsEnabled ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      name: formData.name,
      designation: formData.designation || undefined,
      position: {
        ...appliance.position,
        description: formData.positionDescription
      },
      isActive: formData.isActive,
      customSettings: {
        ...appliance.customSettings,
        alertsEnabled: formData.alertsEnabled
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Aparelho</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Designação</label>
        <input
          type="text"
          value={formData.designation}
          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
          placeholder="Ex: Geladeira Principal, Bebidas, Emergência"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Posição Específica</label>
        <input
          type="text"
          value={formData.positionDescription}
          onChange={(e) => setFormData({ ...formData, positionDescription: e.target.value })}
          placeholder="Ex: Ao lado da janela, Embaixo da bancada"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Aparelho Ativo</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.alertsEnabled}
            onChange={(e) => setFormData({ ...formData, alertsEnabled: e.target.checked })}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Alertas Habilitados</span>
        </label>
      </div>

      <div className="bg-gray-50 p-3 rounded">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Informações do Modelo</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Tipo:</strong> {appliance.applianceType.name}</p>
          <p><strong>Modelo:</strong> {appliance.model.brand} {appliance.model.model}</p>
          <p><strong>Capacidade:</strong> {appliance.model.capacity}L</p>
          <p><strong>Local:</strong> {appliance.location.name}</p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Salvar Alterações
        </button>
      </div>
    </form>
  );
};
