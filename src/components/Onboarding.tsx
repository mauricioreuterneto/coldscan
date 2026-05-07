import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, ArrowRight, Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  userId: string;
  email: string;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, userId, email }) => {
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          full_name: fullName,
          name: fullName,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) throw error;

      onComplete();
    } catch (error) {
      console.error('Erro ao criar profile:', error);
      alert('Erro ao criar profile. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && fullName.trim()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Bem-vindo ao Fridge Scanner!</h1>
          <p className="text-gray-600 mt-2">Vamos configurar seu perfil</p>
        </div>

        {/* Progress steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <div className={`w-12 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              {step > 2 ? <Check className="w-5 h-5" /> : '2'}
            </div>
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite seu nome"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!fullName.trim()}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continuar
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="text-center py-4">
                <p className="text-gray-600">
                  Seu perfil será criado com o nome: <strong>{fullName}</strong>
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Salvando...' : 'Concluir'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
