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
      // Usar Google Custom Search API para buscar modelos de geladeira
      if (!this.GOOGLE_SEARCH_API_KEY) {
        console.warn('Google Search API key não configurada, usando dados fallback');
        return this.getFallbackFridgeModels(query);
      }

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
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
      return this.getFallbackFridgeModels(query);
    }
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

    // Extrair informações básicas do título e snippet
    const brandMatch = title.match(/(Brastemp|Consul|Samsung|LG|Electrolux|Panasonic|Midea|Hisense|Atlas|Schneider)/i);
    const capacityMatch = title.match(/(\d+)\s*(?:L|Litros)/i);
    const yearMatch = title.match(/(\d{4})/);

    const brand = brandMatch ? brandMatch[1] : 'Desconhecida';
    const capacity = capacityMatch ? parseInt(capacityMatch[1]) : 300;
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

    return {
      id: this.generateId(),
      brand,
      model: title.replace(brand, '').trim() || 'Modelo não identificado',
      year,
      capacity,
      image_url: item.pagemap?.cse_image?.[0] || item.pagemap?.cse_thumbnail?.[0],
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

  // Dados fallback quando APIs não estão disponíveis
  private getFallbackFridgeModels(query: string): FridgeModelInfo[] {
    const queryLower = query.toLowerCase();
    
    // Criar modelos dinâmicos baseados na busca
    const models = [
      { name: 'BRE80AK', capacity: 375, brand: 'Brastemp' },
      { name: 'CRM40NB', capacity: 340, brand: 'Consul' },
      { name: 'RT38', capacity: 380, brand: 'Samsung' },
      { name: 'GBD458', capacity: 458, brand: 'LG' },
      { name: 'DF48', capacity: 480, brand: 'Electrolux' },
      { name: 'W420', capacity: 420, brand: 'Panasonic' }
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

    // Filtrar modelos baseados na busca
    return allModels.filter(model => 
      model.brand.toLowerCase().includes(queryLower) ||
      model.model.toLowerCase().includes(queryLower)
    );
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

export const apiService = new ApiService();
