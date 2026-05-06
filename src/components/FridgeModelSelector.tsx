import React, { useState, useEffect, useCallback } from 'react';
import { FridgeModel } from '../types/unified';
import { Camera, Search, Loader2, Check } from 'lucide-react';
import { apiService } from '../services/apiService';
import { FridgeModelInfo } from '../types';
import { StructuredFridgeSearch } from './StructuredFridgeSearch';
import { LayoutConfirmation } from './LayoutConfirmation';

// Função debounce para evitar múltiplas chamadas API
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface FridgeModelSelectorProps {
  availableModels?: FridgeModel[];
  onSelectModel: (model: FridgeModel) => void;
  selectedModel?: FridgeModel | null;
}

export const FridgeModelSelector: React.FC<FridgeModelSelectorProps> = ({
  availableModels,
  onSelectModel,
  selectedModel,
}) => {
  const [useStructuredSearch, setUseStructuredSearch] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FridgeModelInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState<FridgeModelInfo | null>(null);
  const [showLayoutConfirmation, setShowLayoutConfirmation] = useState(false);

  // Debounce para busca online
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim().length >= 2) {
        searchOnlineModels(query);
      } else {
        setSearchResults([]);
        setSelectedSearchResult(null);
      }
    }, 800),
    []
  );

  useEffect(() => {
    if (!useStructuredSearch) {
      debouncedSearch(searchTerm);
    }
  }, [searchTerm, debouncedSearch, useStructuredSearch]);

  const searchOnlineModels = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await apiService.searchFridgeModels(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Erro na busca online:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleScanResult = (result: any) => {
    setShowScanner(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Alternador de modo de busca */}
      <div className="mb-4 flex justify-center">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setUseStructuredSearch(true)}
            className={`px-4 py-2 rounded-md transition-colors ${
              useStructuredSearch
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Busca Estruturada
          </button>
          <button
            onClick={() => setUseStructuredSearch(false)}
            className={`px-4 py-2 rounded-md transition-colors ${
              !useStructuredSearch
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Busca Online
          </button>
        </div>
      </div>

      {/* Renderizar busca estruturada ou tradicional */}
      {useStructuredSearch ? (
        <StructuredFridgeSearch onSelectModel={onSelectModel} selectedModel={selectedModel} />
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Busca Online de Modelos
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
              {searchResults.map((model) => (
                <div
                  key={model.id}
                  onClick={() => setSelectedSearchResult(model)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedSearchResult?.id === model.id 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-green-200 hover:border-green-300'
                  }`}
                >
                  {model.image_url && (
                    <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      <img 
                        src={model.image_url} 
                        alt={`${model.brand} ${model.model}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <svg className="w-16 h-16 text-gray-400 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                  )}
                  <h3 className="font-semibold text-lg">{model.brand}</h3>
                  <p className="text-gray-600">{model.model}</p>
                  <div className="mt-2 flex justify-between text-sm text-gray-500">
                    <span>{model.capacity}L</span>
                    <span>{model.year}</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-green-600">
                      🌐 Dados da internet
                    </div>
                    {model.energy_efficiency && (
                      <div className="text-xs text-gray-500">
                        Eficiência: {model.energy_efficiency}
                      </div>
                    )}
                    {model.features && model.features.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {model.features.slice(0, 2).join(', ')}
                        {model.features.length > 2 && '...'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Loading indicator */}
            {isSearching && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Buscando modelos online...</span>
                </div>
              </div>
            )}

            {searchResults.length === 0 && !isSearching && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">
                  {searchTerm.length > 1 ? 'Nenhum modelo encontrado. Tente uma busca mais ampla.' : 'Digite pelo menos 2 caracteres para buscar modelos de geladeira'}
                </p>
                <div className="mt-4 text-sm text-gray-400">
                  <p className="font-medium mb-2">Dicas de busca:</p>
                  <p>• Por marca: "Samsung", "Brastemp", "Consul", "LG", "Electrolux"</p>
                  <p>• Por modelo: "RT38", "BRE80AK", "CRM40NB", "DF48"</p>
                  <p>• Por capacidade: "380", "450", "500"</p>
                  <p className="mt-2 text-xs">Busca ilimitada na internet com 100+ resultados por consulta!</p>
                </div>
              </div>
            )}

            {selectedSearchResult && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-blue-800">Modelo Selecionado</h4>
                    <p className="text-blue-700">
                      {selectedSearchResult.brand} {selectedSearchResult.model} - {selectedSearchResult.capacity}L
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowLayoutConfirmation(true);
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Selecionar e Continuar
                  </button>
                </div>
              </div>
            )}

            {selectedModel && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-800">Modelo Confirmado</h4>
                    <p className="text-green-700">
                      {selectedModel.brand} {selectedModel.model} - {selectedModel.capacity}L
                    </p>
                  </div>
                  <div className="text-green-600">
                    <Check className="w-6 h-6" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {showLayoutConfirmation && selectedSearchResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <LayoutConfirmation
              modelInfo={selectedSearchResult}
              onLayoutConfirmed={(fridgeModel) => {
                onSelectModel(fridgeModel);
                setShowLayoutConfirmation(false);
              }}
              onBack={() => setShowLayoutConfirmation(false)}
            />
          </div>
        </div>
      )}

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