import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { FridgeModelInfo } from '../types';
import { StructuredFridgeSearchService } from '../services/structuredFridgeSearch';
import { FridgeModel } from '../types';

interface StructuredFridgeSearchProps {
  onSelectModel: (model: FridgeModel) => void;
  selectedModel?: FridgeModel | null;
}

export const StructuredFridgeSearch: React.FC<StructuredFridgeSearchProps> = ({
  onSelectModel,
  selectedModel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<FridgeModelInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState<FridgeModelInfo | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({
    brand: '',
    type: '',
    minCapacity: 0,
    maxCapacity: 1000,
  });
  const [showFilters, setShowFilters] = useState(false);

  const searchService = StructuredFridgeSearchService.getInstance();

  // Debounce para busca
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchService.searchFridgeModels(query);
          setSearchResults(results);
          
          // Obter sugestões
          const searchSuggestions = await searchService.getSuggestions(query);
          setSuggestions(searchSuggestions);
          setShowSuggestions(searchSuggestions.length > 0);
        } catch (error) {
          console.error('Erro na busca:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 600),
    []
  );

  // Busca quando o usuário digita
  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  // Função debounce
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

  // Busca com filtros
  const handleFilterSearch = async () => {
    setIsSearching(true);
    try {
      let results: FridgeModelInfo[] = [];

      if (filters.brand) {
        const brandResults = await searchService.searchByBrand(filters.brand);
        results = brandResults;
      }

      if (filters.type) {
        const typeResults = await searchService.searchByType(filters.type);
        results = results.length > 0 
          ? results.filter(r => typeResults.some(t => t.id === r.id))
          : typeResults;
      }

      if (filters.minCapacity > 0 || filters.maxCapacity < 1000) {
        const capacityResults = await searchService.searchByCapacity(filters.minCapacity, filters.maxCapacity);
        results = results.length > 0
          ? results.filter(r => capacityResults.some(c => c.id === r.id))
          : capacityResults;
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Erro na busca com filtros:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      brand: '',
      type: '',
      minCapacity: 0,
      maxCapacity: 1000,
    });
  };

  // Selecionar modelo
  const handleSelectModel = (model: FridgeModelInfo) => {
    setSelectedSearchResult(model);
    setShowSuggestions(false);
  };

  // Confirmar seleção
  const handleConfirmSelection = () => {
    if (selectedSearchResult) {
      const fridgeModel: FridgeModel = {
        id: selectedSearchResult.id,
        brand: selectedSearchResult.brand,
        model: selectedSearchResult.model,
        year: selectedSearchResult.year || new Date().getFullYear(),
        capacity: selectedSearchResult.capacity,
        compartments: [], // Será preenchido posteriormente pelo LayoutConfirmation
      };
      onSelectModel(fridgeModel);
    }
  };

  // Formatar capacidade
  const formatCapacity = (capacity: number) => `${capacity}L`;

  // Obter tipos disponíveis
  const getAvailableTypes = () => [
    { value: 'duplex', label: 'Duplex' },
    { value: 'frost_free', label: 'Frost Free' },
    { value: 'inverse', label: 'Inverse' },
    { value: 'compact', label: 'Compact' },
  ];

  // Obter marcas disponíveis
  const getAvailableBrands = () => [
    'Brastemp', 'Consul', 'Samsung', 'LG', 'Electrolux', 'Panasonic'
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Encontre sua Geladeira Ideal
        </h2>

        {/* Campo de busca principal */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por marca, modelo ou capacidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowSuggestions(suggestions.length > 0)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Sugestões */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchTerm(suggestion);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Botão de filtros */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtros Avançados
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Painel de filtros */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Filtro de marca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca
                </label>
                <select
                  value={filters.brand}
                  onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas</option>
                  {getAvailableBrands().map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              {/* Filtro de tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  {getAvailableTypes().map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Filtro de capacidade mínima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidade Mínima
                </label>
                <select
                  value={filters.minCapacity}
                  onChange={(e) => setFilters({ ...filters, minCapacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="0">Qualquer</option>
                  <option value="300">300L+</option>
                  <option value="400">400L+</option>
                  <option value="500">500L+</option>
                </select>
              </div>

              {/* Filtro de capacidade máxima */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidade Máxima
                </label>
                <select
                  value={filters.maxCapacity}
                  onChange={(e) => setFilters({ ...filters, maxCapacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1000">Qualquer</option>
                  <option value="400">Até 400L</option>
                  <option value="500">Até 500L</option>
                  <option value="600">Até 600L</option>
                </select>
              </div>
            </div>

            {/* Botões de ação dos filtros */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleFilterSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Aplicar Filtros
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isSearching && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Buscando modelos...</span>
            </div>
          </div>
        )}

        {/* Resultados da busca */}
        {!isSearching && searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((model) => (
              <div
                key={model.id}
                onClick={() => handleSelectModel(model)}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedSearchResult?.id === model.id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Imagem */}
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
                    <div className="w-16 h-16 text-gray-400 hidden">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Informações */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">{model.brand}</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      STANDARD
                    </span>
                  </div>
                  <p className="text-gray-600 font-medium">{model.model}</p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span className="font-medium text-blue-600">{formatCapacity(model.capacity)}</span>
                    <span>{model.year}</span>
                  </div>
                  {model.energy_efficiency && (
                    <div className="text-xs text-gray-500">
                      Eficiência: <span className="font-medium">{model.energy_efficiency}</span>
                    </div>
                  )}
                  {model.dimensions && (
                    <div className="text-xs text-gray-500">
                      Dimensões: <span className="font-medium">{`${model.dimensions.height}x${model.dimensions.width}x${model.dimensions.depth} cm`}</span>
                    </div>
                  )}
                  {model.features && model.features.length > 0 && (
                    <div className="text-xs text-gray-600">
                      <div className="font-medium mb-1">Características:</div>
                      <div className="flex flex-wrap gap-1">
                        {model.features.slice(0, 3).map((feature, index) => (
                          <span key={index} className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                            {feature}
                          </span>
                        ))}
                        {model.features.length > 3 && (
                          <span className="text-gray-400">+{model.features.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Nenhum resultado */}
        {!isSearching && searchResults.length === 0 && searchTerm.length >= 2 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">Nenhum modelo encontrado para "{searchTerm}"</p>
            <div className="text-sm text-gray-400">
              <p className="font-medium mb-2">Dicas de busca:</p>
              <p>• Tente buscar por marca: "Samsung", "Brastemp", "Consul"</p>
              <p>• Ou por modelo: "RT38", "BRE80AK", "CRM44AB"</p>
              <p>• Ou por capacidade: "380", "450", "500"</p>
            </div>
          </div>
        )}

        {/* Mensagem inicial */}
        {!isSearching && searchResults.length === 0 && searchTerm.length < 2 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">Digite pelo menos 2 caracteres para buscar modelos</p>
            <div className="text-sm text-gray-400">
              <p className="font-medium mb-2">Nossas marcas disponíveis:</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {getAvailableBrands().map(brand => (
                  <span key={brand} className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modelo selecionado */}
        {selectedSearchResult && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-800">Modelo Selecionado</h4>
                <p className="text-blue-700">
                  {selectedSearchResult.brand} {selectedSearchResult.model} - {formatCapacity(selectedSearchResult.capacity)}
                </p>
              </div>
              <button
                onClick={handleConfirmSelection}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Confirmar Seleção
              </button>
            </div>
          </div>
        )}

        {/* Modelo confirmado */}
        {selectedModel && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-green-800">Modelo Confirmado</h4>
                <p className="text-green-700">
                  {selectedModel.brand} {selectedModel.model} - {formatCapacity(selectedModel.capacity)}
                </p>
              </div>
              <div className="text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
