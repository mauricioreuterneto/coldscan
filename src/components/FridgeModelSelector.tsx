import React, { useState } from 'react';
import { FridgeModel } from '../types';
import { Camera, Search } from 'lucide-react';

interface FridgeModelSelectorProps {
  availableModels: FridgeModel[];
  onSelectModel: (model: FridgeModel) => void;
  selectedModel?: FridgeModel | null;
}

export const FridgeModelSelector: React.FC<FridgeModelSelectorProps> = ({
  availableModels,
  onSelectModel,
  selectedModel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const filteredModels = availableModels.filter(model =>
    model.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleScanResult = (result: any) => {
    // Simulação - em um app real, o scanner identificaria o modelo
    setShowScanner(false);
    // Aqui você faria o lookup do modelo baseado no código escaneado
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Selecione o Modelo da sua Geladeira
        </h2>

        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por marca ou modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowScanner(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Escanear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map((model) => (
            <div
              key={model.id}
              onClick={() => onSelectModel(model)}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedModel?.id === model.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg">{model.brand}</h3>
              <p className="text-gray-600">{model.model}</p>
              <div className="mt-2 flex justify-between text-sm text-gray-500">
                <span>{model.capacity}L</span>
                <span>{model.year}</span>
              </div>
              <div className="mt-2">
                <div className="text-xs text-gray-500">
                  {model.compartments.length} compartimentos
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredModels.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">Nenhum modelo encontrado</p>
          </div>
        )}

        {selectedModel && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-green-800">Modelo Selecionado</h4>
                <p className="text-green-700">
                  {selectedModel.brand} {selectedModel.model} - {selectedModel.capacity}L
                </p>
              </div>
              <button
                onClick={() => onSelectModel(selectedModel)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        )}
      </div>

      {showScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Escanear Etiqueta da Geladeira</h3>
            <p className="text-gray-600 mb-4">
              Posicione a etiqueta do produto na câmera para identificar automaticamente o modelo
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowScanner(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Simulação de scan
                  handleScanResult({ barcode: '123456789' });
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Simular Scan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
