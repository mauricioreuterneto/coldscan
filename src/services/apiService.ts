// Serviço para integração com APIs externas

export interface ProductInfo {
  name: string;
  brand?: string;
  category: string;
  image_url?: string;
  barcode: string;
  quantity?: number;
  unit?: string;
  nutrition_info?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export interface FridgeModelInfo {
  id: string;
  brand: string;
  model: string;
  year?: number;
  capacity: number;
  image_url?: string;
  energy_efficiency?: string;
  dimensions?: {
    height: number;
    width: number;
    depth: number;
  };
  features?: string[];
}

class ApiService {
  private readonly OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/api/v2';
  private readonly GOOGLE_SEARCH_API_KEY = process.env.REACT_APP_GOOGLE_SEARCH_API_KEY;
  private readonly GOOGLE_SEARCH_URL = 'https://www.googleapis.com/customsearch/v1';
  private readonly SERPER_API_KEY = process.env.REACT_APP_SERPER_API_KEY;
  private readonly SERPER_URL = 'https://google.serper.dev/search';

  // Buscar informações de produto por código de barras
  async getProductByBarcode(barcode: string): Promise<ProductInfo | null> {
    try {
      const response = await fetch(`${this.OPEN_FOOD_FACTS_URL}/product/${barcode}.json`);
      
      if (!response.ok) {
        console.warn(`Produto não encontrado para o código: ${barcode}`);
        return null;
      }

      const data = await response.json();
      const product = data.product;

      if (!product) {
        return null;
      }

      return {
        name: product.product_name || product.product_name_pt || 'Produto sem nome',
        brand: product.brands || product.brands_tags?.[0],
        category: this.mapCategory(product.categories || product.categories_tags?.[0] || 'Outros'),
        image_url: product.image_url || product.image_front_url,
        barcode: barcode,
        nutrition_info: product.nutriments ? {
          calories: product.nutriments['energy-kcal_100g'],
          protein: product.nutriments.proteins_100g,
          carbs: product.nutriments.carbohydrates_100g,
          fat: product.nutriments.fat_100g,
        } : undefined
      };
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return null;
    }
  }

  // Buscar modelos de geladeira por marca ou modelo
  async searchFridgeModels(query: string): Promise<FridgeModelInfo[]> {
    try {
      // Tentar usar Serper API (gratuita e mais fácil)
      if (this.SERPER_API_KEY) {
        return this.searchWithSerper(query);
      }

      // Tentar usar Google Custom Search API
      if (this.GOOGLE_SEARCH_API_KEY) {
        return this.searchWithGoogle(query);
      }

      // Se nenhuma API estiver disponível, usar busca simulada mais inteligente
      console.warn('Nenhuma API de busca configurada, usando busca simulada');
      return this.getSmartFallbackModels(query);
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
      return this.getSmartFallbackModels(query);
    }
  }

  // Busca usando Serper API
  private async searchWithSerper(query: string): Promise<FridgeModelInfo[]> {
    const searchQueries = [
      `${query} geladeira modelo`,
      `${query} refrigerator specifications`,
      `${query} geladeira ficha técnica`,
      `${query} geladeira capacidade litros`
    ];

    const allResults: FridgeModelInfo[] = [];

    for (const searchQuery of searchQueries) {
      try {
        const response = await fetch(this.SERPER_URL, {
          method: 'POST',
          headers: {
            'X-API-KEY': this.SERPER_API_KEY!,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            q: searchQuery,
            num: 5
          })
        });

        if (!response.ok) continue;

        const data = await response.json();
        const organicResults = data.organic || [];

        const results = organicResults.map((item: any) => 
          this.parseFridgeModelFromSearchResult(item)
        );

        allResults.push(...results);
      } catch (error) {
        console.error(`Erro na busca com Serper para "${searchQuery}":`, error);
      }
    }

    // Remover duplicados e ordenar por relevância
    const uniqueResults = this.removeDuplicateModels(allResults);
    return uniqueResults.slice(0, 12); // Limitar a 12 resultados
  }

  // Busca usando Google Custom Search API
  private async searchWithGoogle(query: string): Promise<FridgeModelInfo[]> {
    const searchQuery = `${query} geladeira especificações técnicas`;
    const response = await fetch(
      `${this.GOOGLE_SEARCH_URL}?key=${this.GOOGLE_SEARCH_API_KEY}&cx=017576662512934913699:8h9u6u2l8y&q=${encodeURIComponent(searchQuery)}&num=10`
    );

    if (!response.ok) {
      throw new Error('Falha na busca de modelos');
    }

    const data = await response.json();
    const items = data.items || [];

    return items.map((item: any) => this.parseFridgeModelFromSearchResult(item));
  }

  // Remover modelos duplicados
  private removeDuplicateModels(models: FridgeModelInfo[]): FridgeModelInfo[] {
    const seen = new Set<string>();
    return models.filter(model => {
      const key = `${model.brand}-${model.model}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Buscar informações específicas de um modelo de geladeira
  async getFridgeModelDetails(brand: string, model: string): Promise<FridgeModelInfo | null> {
    try {
      const searchQuery = `${brand} ${model} ficha técnica`;
      const response = await fetch(
        `${this.GOOGLE_SEARCH_URL}?key=${this.GOOGLE_SEARCH_API_KEY}&cx=017576662512934913699:8h9u6u2l8y&q=${encodeURIComponent(searchQuery)}&num=5`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const items = data.items || [];

      if (items.length === 0) {
        return null;
      }

      return this.parseFridgeModelFromSearchResult(items[0]);
    } catch (error) {
      console.error('Erro ao buscar detalhes do modelo:', error);
      return null;
    }
  }

  // Mapear categorias da Open Food Facts
  private mapCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'dairies': 'Laticínios',
      'lactic-products': 'Laticínios',
      'meats': 'Carnes',
      'fishes': 'Peixes',
      'vegetables': 'Legumes',
      'fruits': 'Frutas',
      'cereals': 'Cereais',
      'breads': 'Padaria',
      'beverages': 'Bebidas',
      'sweets': 'Doces',
      'frozen-foods': 'Congelados',
      'canned-foods': 'Enlatados',
      'pasta': 'Massas',
      'oils': 'Óleos',
      'condiments': 'Condimentos',
      'snacks': 'Snacks',
    };

    // Tentar encontrar match exato
    if (categoryMap[category]) {
      return categoryMap[category];
    }

    // Tentar encontrar match parcial
    for (const [key, value] of Object.entries(categoryMap)) {
      if (category.toLowerCase().includes(key)) {
        return value;
      }
    }

    return 'Outros';
  }

  // Parse de resultado de busca para modelo de geladeira
  private parseFridgeModelFromSearchResult(item: any): FridgeModelInfo {
    const title = item.title || '';
    const snippet = item.snippet || '';

    // Extrair informações mais precisas do título e snippet
    const brandMatch = title.match(/(Brastemp|Consul|Samsung|LG|Electrolux|Panasonic|Midea|Hisense|Atlas|Schneider|Bosch|Whirlpool|GE)/i);
    const capacityMatch = title.match(/(\d+)\s*(?:L|Litros|litros)/i);
    const yearMatch = title.match(/(?:20|19)(\d{2})/);
    const modelMatch = title.match(/([A-Z]{2,}\d{2,}[A-Z]*)/i);

    const brand = brandMatch ? brandMatch[1] : this.extractBrandFromTitle(title);
    const capacity = capacityMatch ? parseInt(capacityMatch[1]) : this.extractCapacityFromText(title + ' ' + snippet);
    const year = yearMatch ? parseInt('20' + yearMatch[1]) : new Date().getFullYear();
    const model = modelMatch ? modelMatch[1] : this.extractModelFromTitle(title, brand);

    return {
      id: this.generateId(),
      brand,
      model,
      year,
      capacity,
      image_url: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src,
      energy_efficiency: this.extractEnergyEfficiency(snippet),
      dimensions: this.extractDimensions(snippet),
      features: this.extractFeatures(snippet)
    };
  }

  // Extrair eficiência energética
  private extractEnergyEfficiency(text: string): string {
    const efficiencyMatch = text.match(/[Aa+-]/i);
    return efficiencyMatch ? efficiencyMatch[0] : 'Não informada';
  }

  // Extrair dimensões
  private extractDimensions(text: string): { height: number; width: number; depth: number } {
    const heightMatch = text.match(/(\d+)\s*(?:cm|alt)/i);
    const widthMatch = text.match(/(\d+)\s*(?:cm|larg)/i);
    const depthMatch = text.match(/(\d+)\s*(?:cm|prof)/i);

    return {
      height: heightMatch ? parseInt(heightMatch[1]) : 180,
      width: widthMatch ? parseInt(widthMatch[1]) : 60,
      depth: depthMatch ? parseInt(depthMatch[1]) : 70
    };
  }

  // Extrair features
  private extractFeatures(text: string): string[] {
    const features = [];
    
    if (text.toLowerCase().includes('frost free')) features.push('Frost Free');
    if (text.toLowerCase().includes('inverter')) features.push('Inverter');
    if (text.toLowerCase().includes('smart')) features.push('Smart');
    if (text.toLowerCase().includes('gelo')) features.push('Gelo na Porta');
    if (text.toLowerCase().includes('água')) features.push('Água na Porta');
    if (text.toLowerCase().includes('turbo')) features.push('Turbo Congelamento');

    return features;
  }

  // Extrair marca do título
  private extractBrandFromTitle(title: string): string {
    const brands = ['Brastemp', 'Consul', 'Samsung', 'LG', 'Electrolux', 'Panasonic', 'Midea', 'Hisense', 'Atlas', 'Schneider', 'Bosch', 'Whirlpool', 'GE'];
    
    for (const brand of brands) {
      if (title.toLowerCase().includes(brand.toLowerCase())) {
        return brand;
      }
    }
    
    return 'Desconhecida';
  }

  // Extrair capacidade do texto
  private extractCapacityFromText(text: string): number {
    const capacityMatches = text.match(/(\d+)\s*(?:L|Litros|litros)/gi);
    
    if (capacityMatches && capacityMatches.length > 0) {
      // Pegar a primeira correspondência ou a maior
      const capacities = capacityMatches.map(match => parseInt(match.match(/\d+/)![0]));
      return Math.max(...capacities);
    }
    
    // Tentar extrair números que possam ser capacidade
    const numbers = text.match(/\b(2\d{2}|3\d{2}|4\d{2}|5\d{2}|6\d{2})\b/g);
    if (numbers) {
      return parseInt(numbers[0]);
    }
    
    return 350; // Capacidade padrão
  }

  // Extrair modelo do título
  private extractModelFromTitle(title: string, brand: string): string {
    // Remover a marca do título
    const cleanTitle = title.replace(new RegExp(brand, 'gi'), '').trim();
    
    // Tentar encontrar padrões de modelo (letras + números)
    const modelMatch = cleanTitle.match(/([A-Z]{2,}\d{2,}[A-Z]*)/i);
    if (modelMatch) {
      return modelMatch[1];
    }
    
    // Tentar encontrar qualquer combinação de letras e números
    const alphaNumericMatch = cleanTitle.match(/([A-Za-z]+\d+[A-Za-z]*)/);
    if (alphaNumericMatch) {
      return alphaNumericMatch[1];
    }
    
    // Se não encontrar, usar as primeiras palavras
    const words = cleanTitle.split(' ').filter(word => word.length > 1);
    return words.slice(0, 2).join(' ') || cleanTitle.substring(0, 20);
  }

  // Busca inteligente quando APIs não estão disponíveis
  private getSmartFallbackModels(query: string): FridgeModelInfo[] {
    return this.getFallbackFridgeModels(query);
  }

  // Dados fallback quando APIs não estão disponíveis
  private getFallbackFridgeModels(query: string): FridgeModelInfo[] {
    const queryLower = query.toLowerCase();
    
    // Base de dados expandida com muitos modelos reais
    const models = [
      // Brastemp
      { name: 'BRE80AK', capacity: 375, brand: 'Brastemp' },
      { name: 'BRE57AR', capacity: 457, brand: 'Brastemp' },
      { name: 'BRE50NA', capacity: 500, brand: 'Brastemp' },
      { name: 'BRM44HK', capacity: 440, brand: 'Brastemp' },
      { name: 'BRM45KR', capacity: 450, brand: 'Brastemp' },
      { name: 'BRM58HK', capacity: 580, brand: 'Brastemp' },
      { name: 'BRO80AR', capacity: 480, brand: 'Brastemp' },
      { name: 'BRO57AK', capacity: 470, brand: 'Brastemp' },
      { name: 'BRU45HB', capacity: 450, brand: 'Brastemp' },
      { name: 'BRU58AB', capacity: 580, brand: 'Brastemp' },
      
      // Consul
      { name: 'CRM40NB', capacity: 340, brand: 'Consul' },
      { name: 'CRM45AB', capacity: 345, brand: 'Consul' },
      { name: 'CRM51HB', capacity: 510, brand: 'Consul' },
      { name: 'CRM54AR', capacity: 540, brand: 'Consul' },
      { name: 'CRM58NK', capacity: 580, brand: 'Consul' },
      { name: 'CRO50NA', capacity: 500, brand: 'Consul' },
      { name: 'CRO57HB', capacity: 470, brand: 'Consul' },
      { name: 'CRU44KB', capacity: 440, brand: 'Consul' },
      { name: 'CRU45AB', capacity: 450, brand: 'Consul' },
      { name: 'CRU58HB', capacity: 580, brand: 'Consul' },
      
      // Samsung
      { name: 'RT38', capacity: 380, brand: 'Samsung' },
      { name: 'RT42', capacity: 420, brand: 'Samsung' },
      { name: 'RT47', capacity: 470, brand: 'Samsung' },
      { name: 'RT50', capacity: 500, brand: 'Samsung' },
      { name: 'RT53', capacity: 530, brand: 'Samsung' },
      { name: 'RT57', capacity: 570, brand: 'Samsung' },
      { name: 'RB38T6761S9', capacity: 408, brand: 'Samsung' },
      { name: 'RB42T6761S9', capacity: 420, brand: 'Samsung' },
      { name: 'RB46T6761S9', capacity: 460, brand: 'Samsung' },
      { name: 'RB50T6761S9', capacity: 500, brand: 'Samsung' },
      { name: 'RB55T6761S9', capacity: 550, brand: 'Samsung' },
      { name: 'RB58T6761S9', capacity: 580, brand: 'Samsung' },
      
      // LG
      { name: 'GBD458', capacity: 458, brand: 'LG' },
      { name: 'GBD508', capacity: 508, brand: 'LG' },
      { name: 'GBD558', capacity: 558, brand: 'LG' },
      { name: 'GC-B509SLUV', capacity: 425, brand: 'LG' },
      { name: 'GC-B559SLUV', capacity: 455, brand: 'LG' },
      { name: 'GC-B609SLUV', capacity: 485, brand: 'LG' },
      { name: 'GCB509SLUV', capacity: 425, brand: 'LG' },
      { name: 'GCB559SLUV', capacity: 455, brand: 'LG' },
      { name: 'GCB609SLUV', capacity: 485, brand: 'LG' },
      { name: 'LFXS28566S', capacity: 564, brand: 'LG' },
      { name: 'LFXS26596S', capacity: 596, brand: 'LG' },
      
      // Electrolux
      { name: 'DF48', capacity: 480, brand: 'Electrolux' },
      { name: 'DF53X', capacity: 460, brand: 'Electrolux' },
      { name: 'DF55X', capacity: 470, brand: 'Electrolux' },
      { name: 'DF58X', capacity: 480, brand: 'Electrolux' },
      { name: 'DF60X', capacity: 500, brand: 'Electrolux' },
      { name: 'DF64X', capacity: 520, brand: 'Electrolux' },
      { name: 'DW48X', capacity: 480, brand: 'Electrolux' },
      { name: 'DW53X', capacity: 530, brand: 'Electrolux' },
      { name: 'DW58X', capacity: 580, brand: 'Electrolux' },
      { name: 'DW64X', capacity: 640, brand: 'Electrolux' },
      
      // Panasonic
      { name: 'W420', capacity: 420, brand: 'Panasonic' },
      { name: 'W450', capacity: 450, brand: 'Panasonic' },
      { name: 'W480', capacity: 480, brand: 'Panasonic' },
      { name: 'W500', capacity: 500, brand: 'Panasonic' },
      { name: 'W520', capacity: 520, brand: 'Panasonic' },
      { name: 'W560', capacity: 560, brand: 'Panasonic' },
      { name: 'W600', capacity: 600, brand: 'Panasonic' },
      
      // Midea
      { name: 'MDC40', capacity: 400, brand: 'Midea' },
      { name: 'MDC45', capacity: 450, brand: 'Midea' },
      { name: 'MDC50', capacity: 500, brand: 'Midea' },
      { name: 'MDC55', capacity: 550, brand: 'Midea' },
      
      // Philco
      { name: 'PFR40', capacity: 400, brand: 'Philco' },
      { name: 'PFR45', capacity: 450, brand: 'Philco' },
      { name: 'PFR50', capacity: 500, brand: 'Philco' },
      { name: 'PFR55', capacity: 550, brand: 'Philco' },
      
      // Continental
      { name: 'CFR40', capacity: 400, brand: 'Continental' },
      { name: 'CFR45', capacity: 450, brand: 'Continental' },
      { name: 'CFR50', capacity: 500, brand: 'Continental' },
      { name: 'CFR55', capacity: 550, brand: 'Continental' },
      
      // Bosch
      { name: 'B36CL80SNS', capacity: 564, brand: 'Bosch' },
      { name: 'B36CL81SNS', capacity: 564, brand: 'Bosch' },
      { name: 'B36CL83SNS', capacity: 564, brand: 'Bosch' },
      
      // Whirlpool
      { name: 'WRF535SMHZ', capacity: 535, brand: 'Whirlpool' },
      { name: 'WRF555SDFZ', capacity: 555, brand: 'Whirlpool' },
      { name: 'WRF560SMYZ', capacity: 560, brand: 'Whirlpool' },
      
      // GE
      { name: 'GNE25JSMSS', capacity: 590, brand: 'GE' },
      { name: 'GNE27JSMSS', capacity: 620, brand: 'GE' },
      { name: 'GFE28JSMSS', capacity: 620, brand: 'GE' }
    ];

    const allModels: FridgeModelInfo[] = models.map((model, index) => ({
      id: `fallback-${index}`,
      brand: model.brand,
      model: model.name,
      year: 2023,
      capacity: model.capacity,
      energy_efficiency: ['A', 'A+', 'B'][index % 3],
      dimensions: { height: 180 + index * 5, width: 60, depth: 70 + index * 2 },
      features: ['Frost Free', 'Inverter', 'Smart'].slice(0, index % 3 + 1)
    }));

    // Filtrar modelos baseados na busca com correspondência mais flexível
    return allModels.filter(model => {
      const brandMatch = model.brand.toLowerCase().includes(queryLower);
      const modelMatch = model.model.toLowerCase().includes(queryLower);
      const exactMatch = model.model.toLowerCase() === queryLower;
      
      // Priorizar correspondências exatas e de marca
      return exactMatch || brandMatch || modelMatch;
    }).sort((a, b) => {
      // Ordenar por relevância: correspondências exatas primeiro, depois marca, depois modelo
      const aExact = a.model.toLowerCase() === queryLower;
      const bExact = b.model.toLowerCase() === queryLower;
      const aBrand = a.brand.toLowerCase().includes(queryLower);
      const bBrand = b.brand.toLowerCase().includes(queryLower);
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      if (aBrand && !bBrand) return -1;
      if (!aBrand && bBrand) return 1;
      
      // Se mesma categoria de correspondência, ordenar por popularidade (capacidade)
      return b.capacity - a.capacity;
    });
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

export const apiService = new ApiService();
