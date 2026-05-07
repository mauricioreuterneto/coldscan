import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Home, 
  Refrigerator, 
  ShoppingCart, 
  Settings, 
  Sparkles,
  Plus,
  Camera,
  AlertCircle,
  Target
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User, OnboardingProgress } from '../types/enhanced';

interface OnboardingFlowProps {
  user: User;
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ user, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [householdName, setHouseholdName] = useState('Minha Casa');
  const [selectedLocations, setSelectedLocations] = useState<string[]>(['Geladeira Principal', 'Despensa']);
  const [firstProducts, setFirstProducts] = useState<string[]>([]);
  const [preferences, setPreferences] = useState({
    notifications: true,
    expiryWarnings: true,
    shoppingReminders: true
  });

  const totalSteps = 5;

  const loadProgress = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setCurrentStep(data.current_step);
      }
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
    }
  }, [user.id]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const saveProgress = async (step: number, completedSteps: string[] = []) => {
    try {
      const isCompleted = step >= totalSteps;

      const { data } = await supabase
        .from('onboarding_progress')
        .upsert({
          user_id: user.id,
          current_step: step,
          total_steps: totalSteps,
          completed_steps: completedSteps,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (isCompleted) {
        await completeOnboarding();
      }
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  };

  const completeOnboarding = async () => {
    try {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      onComplete();
    } catch (error) {
      console.error('Erro ao completar onboarding:', error);
    }
  };

  const createHousehold = async () => {
    setLoading(true);
    try {
      // Criar household
      const { data: household } = await supabase
        .from('households')
        .insert({
          name: householdName,
          settings: {
            sharedShopping: false,
            sharedInventory: true,
            allowanceNotifications: true
          }
        })
        .select()
        .single();

      // Atualizar perfil do usuário
      await supabase
        .from('profiles')
        .update({ 
          household_id: household.id,
          name: user.name || user.email.split('@')[0]
        })
        .eq('id', user.id);

      // Criar locais de armazenamento selecionados
      const locationTypes = {
        'Geladeira Principal': 'fridge',
        'Freezer': 'freezer', 
        'Despensa': 'pantry',
        'Armário de Cozinha': 'cabinet',
        'Balcão': 'counter'
      };

      for (const locationName of selectedLocations) {
        await supabase
          .from('storage_locations')
          .insert({
            household_id: household.id,
            name: locationName,
            type: locationTypes[locationName as keyof typeof locationTypes] || 'other',
            description: `Local principal para ${locationName.toLowerCase()}`
          });
      }

      await saveProgress(2, ['household_setup']);
      setCurrentStep(3);
    } catch (error) {
      console.error('Erro ao criar household:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFirstProducts = async () => {
    setLoading(true);
    try {
      const { data: household } = await supabase
        .from('profiles')
        .select('household_id')
        .eq('id', user.id)
        .single();

      const { data: locations } = await supabase
        .from('storage_locations')
        .select('id, name')
        .eq('household_id', household?.household_id);

      const fridgeLocation = locations?.find(l => l.name === 'Geladeira Principal');

      // Adicionar produtos comuns
      const commonProducts = [
        { name: 'Leite', category: 'Laticínios', quantity: 1, unit: 'L' },
        { name: 'Ovos', category: 'Laticínios', quantity: 12, unit: 'unidades' },
        { name: 'Pão', category: 'Padaria', quantity: 1, unit: 'pacote' },
        { name: 'Manteiga', category: 'Laticínios', quantity: 1, unit: 'unidade' },
        { name: 'Queijo', category: 'Laticínios', quantity: 500, unit: 'g' }
      ];

      for (const product of commonProducts) {
        await supabase
          .from('products')
          .insert({
            user_id: user.id,
            household_id: household?.household_id,
            name: product.name,
            category: product.category,
            quantity: product.quantity,
            unit: product.unit,
            location: {
              applianceId: fridgeLocation?.id || '',
              compartmentId: 'default',
              shelfId: 'default'
            },
            current_state: {
              status: 'sealed',
              condition: 'fresh',
              openedAt: null,
              lastConsumedAt: null
            },
            consumption: {
              original_quantity: product.quantity,
              current_quantity: product.quantity,
              unit: product.unit
            },
            sealed_expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
            purchase_info: {
              purchaseDate: new Date().toISOString(),
              quantity: product.quantity,
              unit: product.unit
            }
          });
      }

      await saveProgress(4, ['household_setup', 'first_products']);
      setCurrentStep(5);
    } catch (error) {
      console.error('Erro ao adicionar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          expiry_warnings: preferences.expiryWarnings,
          low_stock_alerts: true,
          shopping_reminders: preferences.shoppingReminders,
          weekly_digest: false,
          time_of_day: 'morning'
        });

      await saveProgress(5, ['household_setup', 'first_products', 'preferences']);
      setCurrentStep(6);
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      createHousehold();
    } else if (currentStep === 3) {
      addFirstProducts();
    } else if (currentStep === 5) {
      savePreferences();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep householdName={householdName} setHouseholdName={setHouseholdName} />;
      case 2:
        return <HouseholdSetupStep selectedLocations={selectedLocations} setSelectedLocations={setSelectedLocations} />;
      case 3:
        return <ApplianceSetupStep />;
      case 4:
        return <FirstProductsStep firstProducts={firstProducts} setFirstProducts={setFirstProducts} />;
      case 5:
        return <PreferencesStep preferences={preferences} setPreferences={setPreferences} />;
      case 6:
        return <CompletionStep />;
      default:
        return <WelcomeStep householdName={householdName} setHouseholdName={setHouseholdName} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Bem-vindo ao Fridge Scanner
            </h1>
            <div className="text-sm opacity-90">
              Passo {currentStep} de {totalSteps}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1 || loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          <button
            onClick={nextStep}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processando...
              </>
            ) : currentStep === totalSteps ? (
              <>
                <Check className="w-4 h-4" />
                Começar
              </>
            ) : (
              <>
                Próximo
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Step Components
const WelcomeStep = ({ householdName, setHouseholdName }: any) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Home className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Vamos organinar sua cozinha!</h2>
      <p className="text-gray-600">
        Nunca mais deixe alimentos estragar. Tenha controle total do que você tem em casa.
      </p>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-900 mb-1">Como funciona?</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Cadastre seus alimentos e datas de validade</li>
            <li>• Receba alertas antes que vencam</li>
            <li>• Crie listas de compras inteligentes</li>
            <li>• Acompanhe seu consumo e reduza desperdício</li>
          </ul>
        </div>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Como você quer chamar sua casa?
      </label>
      <input
        type="text"
        value={householdName}
        onChange={(e) => setHouseholdName(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Ex: Minha Casa, Casa da Família, etc."
      />
    </div>
  </div>
);

const HouseholdSetupStep = ({ selectedLocations, setSelectedLocations }: any) => {
  const locations = [
    { id: 'Geladeira Principal', name: 'Geladeira Principal', icon: '🧊', description: 'Refrigerador principal' },
    { id: 'Freezer', name: 'Freezer', icon: '❄️', description: 'Congelador' },
    { id: 'Despensa', name: 'Despensa', icon: '🗄️', description: 'Armário seco' },
    { id: 'Armário de Cozinha', name: 'Armário de Cozinha', icon: '🗃️', description: 'Armários da cozinha' },
    { id: 'Balcão', name: 'Balcão', icon: '🏠', description: 'Superfície da cozinha' }
  ];

  const toggleLocation = (locationId: string) => {
    setSelectedLocations((prev: string[]) => 
      prev.includes(locationId) 
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Refrigerator className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Onde você armazena seus alimentos?</h2>
        <p className="text-gray-600">
          Selecione todos os locais onde você guarda alimentos em casa.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {locations.map(location => (
          <button
            key={location.id}
            onClick={() => toggleLocation(location.id)}
            className={`p-4 border-2 rounded-lg transition-all ${
              selectedLocations.includes(location.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{location.icon}</span>
                <div className="text-left">
                  <div className="font-medium text-gray-800">{location.name}</div>
                  <div className="text-sm text-gray-600">{location.description}</div>
                </div>
              </div>
              {selectedLocations.includes(location.id) && (
                <Check className="w-5 h-5 text-blue-600" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const ApplianceSetupStep = () => (
  <div className="space-y-6">
    <div className="text-center">
      <Camera className="w-16 h-16 text-green-600 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Configure seus aparelhos</h2>
      <p className="text-gray-600">
        Você pode adicionar geladeiras, freezers e outros aparelhos mais tarde.
      </p>
    </div>

    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <Check className="w-5 h-5 text-green-600" />
        <div>
          <h3 className="font-semibold text-green-900">Configuração básica concluída!</h3>
          <p className="text-sm text-green-800">
            Seus locais de armazenamento já foram configurados. Você pode adicionar aparelhos específicos a qualquer momento nas configurações.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const FirstProductsStep = ({ firstProducts, setFirstProducts }: any) => (
  <div className="space-y-6">
    <div className="text-center">
      <Plus className="w-16 h-16 text-purple-600 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Adicione seus primeiros produtos</h2>
      <p className="text-gray-600">
        Vamos adicionar alguns alimentos comuns para você começar.
      </p>
    </div>

    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <div>
          <h3 className="font-semibold text-purple-900">Sugestão automática</h3>
          <p className="text-sm text-purple-800">
            Podemos adicionar itens como leite, ovos, pão e manteiga com datas de validade padrão.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const PreferencesStep = ({ preferences, setPreferences }: any) => (
  <div className="space-y-6">
    <div className="text-center">
      <Settings className="w-16 h-16 text-orange-600 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Configure suas preferências</h2>
      <p className="text-gray-600">
        Personalize como você quer receber alertas e lembretes.
      </p>
    </div>

    <div className="space-y-4">
      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-gray-600" />
          <div>
            <div className="font-medium text-gray-800">Alertas de validade</div>
            <div className="text-sm text-gray-600">Seja avisado antes que alimentos vencam</div>
          </div>
        </div>
        <input
          type="checkbox"
          checked={preferences.expiryWarnings}
          onChange={(e) => setPreferences({...preferences, expiryWarnings: e.target.checked})}
          className="w-5 h-5 text-blue-600 rounded"
        />
      </label>

      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-5 h-5 text-gray-600" />
          <div>
            <div className="font-medium text-gray-800">Lembretes de compras</div>
            <div className="text-sm text-gray-600">Receba sugestões de compras baseadas no seu estoque</div>
          </div>
        </div>
        <input
          type="checkbox"
          checked={preferences.shoppingReminders}
          onChange={(e) => setPreferences({...preferences, shoppingReminders: e.target.checked})}
          className="w-5 h-5 text-blue-600 rounded"
        />
      </label>
    </div>
  </div>
);

const CompletionStep = () => (
  <div className="space-y-6 text-center">
    <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
      <Check className="w-10 h-10 text-white" />
    </div>
    
    <h2 className="text-3xl font-bold text-gray-800 mb-2">Tudo pronto!</h2>
    <p className="text-gray-600 mb-6">
      Sua cozinha digital está configurada. Vamos começar a organizar seus alimentos?
    </p>

    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-green-800">
          <Check className="w-4 h-4" />
          <span className="font-medium">Household configurado</span>
        </div>
        <div className="flex items-center gap-2 text-green-800">
          <Check className="w-4 h-4" />
          <span className="font-medium">Locais de armazenamento criados</span>
        </div>
        <div className="flex items-center gap-2 text-green-800">
          <Check className="w-4 h-4" />
          <span className="font-medium">Produtos iniciais adicionados</span>
        </div>
        <div className="flex items-center gap-2 text-green-800">
          <Check className="w-4 h-4" />
          <span className="font-medium">Preferências configuradas</span>
        </div>
      </div>
    </div>

    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
      <Target className="w-4 h-4" />
      <span>Dica: Use a câmera para adicionar produtos rapidamente!</span>
    </div>
  </div>
);
