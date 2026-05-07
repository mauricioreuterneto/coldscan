import { ModelIdentifier, FridgeModelUserFocused, APISource } from '../types/fridgeDiscovery';

// API Search Service - busca informações de geladeiras em APIs públicas
class APISearchService {
  private readonly GOOGLE_CUSTOM_SEARCH_API_KEY = process.env.REACT_APP_GOOGLE_SEARCH_API_KEY;
  private readonly GOOGLE_SEARCH_ENGINE_ID = process.env.REACT_APP_GOOGLE_SEARCH_ENGINE_ID;
  private readonly SERPER_API_KEY = process.env.REACT_APP_SERPER_API_KEY;
  private readonly SERPER_URL = 'https://google.serper.dev/search';

  async searchModel(identifier: ModelIdentifier): Promise<APISource[]> {
    const sources: APISource[] = [];

    // Prioridade: Serper API (gratuita e sem CORS)
    const serperResults = await this.searchWithSerper(identifier);
    if (serperResults) {
      sources.push(serperResults);
    }

    // Se Serper funcionou, não precisa tentar outros métodos
    if (sources.length > 0) {
      return sources;
    }

    // Fallback: Google Shopping (se configurado)
    const googleResults = await this.searchGoogleShopping(identifier);
    if (googleResults) {
      sources.push(googleResults);
    }

    // Fallback: Scraping (vai falhar por CORS no browser, mas tenta)
    const manufacturerResults = await this.searchManufacturerSites(identifier);
    if (manufacturerResults) {
      sources.push(manufacturerResults);
    }

    const comparisonResults = await this.searchComparisonSites(identifier);
    if (comparisonResults) {
      sources.push(comparisonResults);
    }

    return sources;
  }

  private async searchWithSerper(identifier: ModelIdentifier): Promise<APISource | null> {
    if (!this.SERPER_API_KEY) {
      console.warn('Serper API key not configured');
      return null;
    }

    try {
      const query = `${identifier.brand} ${identifier.model} geladeira especificações técnicas capacidade`;
      console.log('Searching Serper with query:', query);

      const response = await fetch(this.SERPER_URL, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: query,
          num: 10,
        }),
      });

      if (!response.ok) {
        console.error('Serper API error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      console.log('Serper response:', data);

      if (data.items && data.items.length > 0) {
        return {
          source: 'serper',
          rawData: data,
          confidence: 0.85,
          timestamp: new Date().toISOString(),
        };
      }

      return null;
    } catch (error) {
      console.error('Serper search error:', error);
      return null;
    }
  }

  private async searchGoogleShopping(identifier: ModelIdentifier): Promise<APISource | null> {
    if (!this.GOOGLE_CUSTOM_SEARCH_API_KEY || !this.GOOGLE_SEARCH_ENGINE_ID) {
      console.warn('Google Search API credentials not configured');
      return null;
    }

    try {
      const query = `${identifier.brand} ${identifier.model} geladeira especificações técnicas`;
      const url = `https://www.googleapis.com/customsearch/v1?key=${this.GOOGLE_CUSTOM_SEARCH_API_KEY}&cx=${this.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=10`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.items && data.items.length > 0) {
        return {
          source: 'google-shopping',
          rawData: data,
          confidence: 0.8,
          timestamp: new Date().toISOString(),
        };
      }

      return null;
    } catch (error) {
      console.error('Google Shopping search error:', error);
      return null;
    }
  }

  private async searchManufacturerSites(identifier: ModelIdentifier): Promise<APISource | null> {
    // Lista de sites de fabricantes brasileiros
    const manufacturerSites = [
      'https://www.brastemp.com.br',
      'https://www.consul.com.br',
      'https://www.electrolux.com.br',
      'https://www.samsung.com/br',
      'https://www.lg.com/br',
    ];

    try {
      const searchQuery = `${identifier.brand} ${identifier.model}`;
      
      // Tentar buscar diretamente no site do fabricante correspondente
      const brandSite = manufacturerSites.find(site => 
        site.includes(identifier.brand.toLowerCase())
      );

      if (brandSite) {
        const url = `${brandSite}/busca?q=${encodeURIComponent(searchQuery)}`;
        
        try {
          const response = await fetch(url);
          const html = await response.text();
          
          return {
            source: 'manufacturer-site',
            rawData: { html, url },
            confidence: 0.9,
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          console.error(`Error fetching ${brandSite}:`, error);
        }
      }

      return null;
    } catch (error) {
      console.error('Manufacturer site search error:', error);
      return null;
    }
  }

  private async searchComparisonSites(identifier: ModelIdentifier): Promise<APISource | null> {
    const comparisonSites = [
      'https://www.buscape.com.br',
      'https://www.zoom.com.br',
    ];

    try {
      const searchQuery = `${identifier.brand} ${identifier.model} geladeira`;
      
      for (const site of comparisonSites) {
        try {
          const url = `${site}/search?q=${encodeURIComponent(searchQuery)}`;
          const response = await fetch(url);
          const html = await response.text();

          return {
            source: 'comparison-site',
            rawData: { html, url },
            confidence: 0.7,
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          console.error(`Error fetching ${site}:`, error);
        }
      }

      return null;
    } catch (error) {
      console.error('Comparison site search error:', error);
      return null;
    }
  }

  // Extrair dados de HTML (scraping simples)
  extractFromHTML(html: string, url: string): Partial<FridgeModelUserFocused> | null {
    try {
      // Padrões comuns para extrair dados de especificações
      const patterns = {
        capacity: /(\d+)\s*(?:litros|L)/i,
        dimensions: /(\d+)\s*[xX]\s*(\d+)\s*[xX]\s*(\d+)/,
        energy: /(\d+)\s*(?:kWh|kWh\/mês)/i,
      };

      const data: Partial<FridgeModelUserFocused> = {};

      // Extrair capacidade
      const capacityMatch = html.match(patterns.capacity);
      if (capacityMatch) {
        data.totalCapacity = parseInt(capacityMatch[1], 10);
      }

      // Extrair dimensões
      const dimensionsMatch = html.match(patterns.dimensions);
      if (dimensionsMatch) {
        data.dimensions = {
          width: parseInt(dimensionsMatch[1], 10),
          height: parseInt(dimensionsMatch[2], 10),
          depth: parseInt(dimensionsMatch[3], 10),
          weight: 0,
        };
      }

      // Extrair consumo energético
      const energyMatch = html.match(patterns.energy);
      if (energyMatch) {
        data.energy = {
          monthlyKwh: parseInt(energyMatch[1], 10),
          efficiency: 'C', // padrão se não especificado
          voltage: 'bivolt',
        };
      }

      return Object.keys(data).length > 0 ? data : null;
    } catch (error) {
      console.error('HTML extraction error:', error);
      return null;
    }
  }
}

export const apiSearchService = new APISearchService();
