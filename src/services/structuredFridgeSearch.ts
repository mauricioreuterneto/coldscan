import { FridgeModelSpec, FridgeModelSearchService, FRIDGE_MODELS_DATABASE } from '../data/fridgeModelsDatabase';
import { FridgeModelInfo } from '../types/unified';

// Serviço de busca estruturada que elimina duplicatas e otimiza tokens
export class StructuredFridgeSearchService {
  private static instance: StructuredFridgeSearchService;
  private cache = new Map<string, FridgeModelInfo[]>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  static getInstance(): StructuredFridgeSearchService {
    if (!StructuredFridgeSearchService.instance) {
      StructuredFridgeSearchService.instance = new StructuredFridgeSearchService();
    }
    return StructuredFridgeSearchService.instance;
  }

  // Busca principal otimizada
  async searchFridgeModels(query: string): Promise<FridgeModelInfo[]> {
    // Verificar cache primeiro
    const cacheKey = query.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Busca estruturada (sem consumo de tokens)
    let results = this.performStructuredSearch(query);

    // Se não encontrar resultados, tentar busca online (com limite de tokens)
    if (results.length === 0) {
      results = await this.performLimitedOnlineSearch(query);
    }

    // Converter para formato FridgeModelInfo e remover duplicatas
    const uniqueResults = this.removeDuplicates(results);

    // Armazenar em cache
    this.cache.set(cacheKey, uniqueResults);
    
    // Limpar cache antigo
    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, this.CACHE_TTL);

    return uniqueResults;
  }

  private performStructuredSearch(query: string): FridgeModelInfo[] {
    const results = FridgeModelSearchService.smartSearch(query);
    return results.map(model => this.convertToInfo(model));
  }

  private async performLimitedOnlineSearch(query: string): Promise<FridgeModelInfo[]> {
    // Busca online limitada (só se necessário e com controle de tokens)
    try {
      // Importação dinâmica para evitar carregamento desnecessário
      const { apiService } = await import('./apiService');
      const onlineResults = await apiService.searchFridgeModels(query);
      
      // Limitar a 10 resultados para economizar tokens
      return onlineResults.slice(0, 10);
    } catch (error) {
      console.warn('Busca online falhou, usando apenas dados estruturados:', error);
      return [];
    }
  }

  private removeDuplicates(results: FridgeModelInfo[]): FridgeModelInfo[] {
    const unique = new Map<string, FridgeModelInfo>();
    
    results.forEach(result => {
      const key = `${result.brand}-${result.model}-${result.capacity}`;
      if (!unique.has(key)) {
        unique.set(key, result);
      }
    });

    return Array.from(unique.values());
  }

  private convertToInfo(model: FridgeModelSpec): FridgeModelInfo {
    return {
      id: model.id,
      brand: model.brand,
      model: model.model,
      capacity: model.capacity,
      year: model.year,
      energy_efficiency: model.energy_efficiency,
      dimensions: model.dimensions,
      features: model.features,
      image: model.image || (model as any).image_url
    };
  }

  // Métodos de busca específicos
  async searchByBrand(brand: string): Promise<FridgeModelInfo[]> {
    const results = FridgeModelSearchService.searchByBrand(brand);
    return results.map(model => this.convertToInfo(model));
  }

  async searchByModel(model: string): Promise<FridgeModelInfo[]> {
    const results = FridgeModelSearchService.searchByModel(model);
    return results.map(model => this.convertToInfo(model));
  }

  async searchByCapacity(min: number, max: number): Promise<FridgeModelInfo[]> {
    const results = FRIDGE_MODELS_DATABASE.filter((model: FridgeModelSpec) => 
      model.capacity >= min && model.capacity <= max
    );
    return results.map((model: FridgeModelSpec) => this.convertToInfo(model));
  }

  async searchByType(type: string): Promise<FridgeModelInfo[]> {
    const results = FridgeModelSearchService.searchByType(
      type as 'duplex' | 'frost_free' | 'inverse' | 'compact'
    );
    return results.map(model => this.convertToInfo(model));
  }

  // Sugestões inteligentes
  async getSuggestions(query: string): Promise<string[]> {
    const suggestions = new Set<string>();
    const normalizedQuery = query.toLowerCase().trim();

    // Sugestões de marcas
    const brands = FridgeModelSearchService.getUniqueBrands();
    brands.forEach((brand: string) => {
      if (brand.toLowerCase().startsWith(normalizedQuery)) {
        suggestions.add(brand);
      }
    });

    // Sugestões de modelos
    FRIDGE_MODELS_DATABASE.forEach((model: FridgeModelSpec) => {
      if (model.model.toLowerCase().includes(normalizedQuery)) {
        suggestions.add(`${model.brand} ${model.model}`);
      }
    });

    // Limitar a 5 sugestões
    return Array.from(suggestions).slice(0, 5);
  }

  // Estatísticas de busca
  getSearchStats() {
    return {
      totalModels: FRIDGE_MODELS_DATABASE.length,
      uniqueBrands: FridgeModelSearchService.getUniqueBrands().length,
      uniqueTypes: FridgeModelSearchService.getUniqueTypes().length,
      cacheSize: this.cache.size,
      capacityRanges: FridgeModelSearchService.getCapacityRanges()
    };
  }

  // Limpar cache
  clearCache(): void {
    this.cache.clear();
  }
}
