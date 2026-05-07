import { FridgeModelUserFocused, APISource } from '../types/fridgeDiscovery';

// Data Normalizer - normaliza dados de múltiplas fontes
class DataNormalizer {
  normalize(rawData: any, source: string): Partial<FridgeModelUserFocused> {
    switch (source) {
      case 'serper':
        return this.normalizeSerperData(rawData);
      case 'google-shopping':
        return this.normalizeGoogleShoppingData(rawData);
      case 'manufacturer-site':
        return this.normalizeManufacturerData(rawData);
      case 'comparison-site':
        return this.normalizeComparisonData(rawData);
      case 'manual':
        return this.normalizeManualData(rawData);
      default:
        return {};
    }
  }

  mergeMultipleSources(sources: APISource[]): Partial<FridgeModelUserFocused> {
    console.log('[dataNormalizer] Merging sources:', sources.map(s => s.source));
    const normalizedData = sources.map(source => 
      this.normalize(source.rawData, source.source)
    );
    console.log('[dataNormalizer] Normalized data:', normalizedData);

    const merged: Partial<FridgeModelUserFocused> = {
      id: this.generateId(),
      brand: this.getMostCommonValue(normalizedData.map(d => d.brand)),
      model: this.getMostCommonValue(normalizedData.map(d => d.model)),
      year: this.getMostCommonValue(normalizedData.map(d => d.year)),
      type: this.getMostCommonValue(normalizedData.map(d => d.type)),
      totalCapacity: this.getAverageValue(normalizedData.map(d => d.totalCapacity)),
      energy: this.mergeEnergyData(normalizedData.map(d => d.energy)),
      dimensions: this.mergeDimensionsData(normalizedData.map(d => d.dimensions)),
      compartments: this.mergeCompartmentsData(normalizedData.map(d => d.compartments)),
    };

    return merged;
  }

  deduplicate(models: FridgeModelUserFocused[]): FridgeModelUserFocused[] {
    const seen = new Set<string>();
    return models.filter(model => {
      const key = `${model.brand}-${model.model}-${model.year || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private normalizeSerperData(rawData: any): Partial<FridgeModelUserFocused> {
    const data: Partial<FridgeModelUserFocused> = {};

    if (rawData.organic && rawData.organic.length > 0) {
      // Analisar os resultados orgânicos para extrair informações
      // Não extrair brand e model - usar identificador original do workflow
      for (const item of rawData.organic.slice(0, 5)) {
        const title = item.title || '';
        const snippet = item.snippet || '';
        const text = `${title} ${snippet}`;

        // Extrair capacidade
        const capacityMatch = text.match(/(\d+)\s*(?:litros|L)/i);
        if (capacityMatch && !data.totalCapacity) {
          data.totalCapacity = parseInt(capacityMatch[1], 10);
        }

        // Extrair dimensões (padrões: 60x180x70, 600x1800x700, etc.)
        const dimensionsMatch = text.match(/(\d{2,3})[xX](\d{3,4})[xX](\d{2,3})\s*(?:cm|mm)?/);
        if (dimensionsMatch && !data.dimensions) {
          const width = parseInt(dimensionsMatch[1], 10);
          const height = parseInt(dimensionsMatch[2], 10);
          const depth = parseInt(dimensionsMatch[3], 10);
          
          // Converter para mm se estiver em cm (valores < 100 são cm)
          const multiplier = width < 100 ? 10 : 1;
          
          data.dimensions = {
            width: width * multiplier,
            height: height * multiplier,
            depth: depth * multiplier,
            weight: data.totalCapacity ? Math.round(data.totalCapacity * 0.7) : 50, // estimativa baseada na capacidade
          };
        }

        // Extrair ano
        const yearMatch = text.match(/(20\d{2})/);
        if (yearMatch && !data.year) {
          data.year = parseInt(yearMatch[1], 10);
        }

        // Extrair voltagem
        if (text.includes('110V') || text.includes('bivolt')) {
          data.energy = { 
            monthlyKwh: data.energy?.monthlyKwh || 45,
            efficiency: data.energy?.efficiency || 'C',
            voltage: 'bivolt' 
          };
        } else if (text.includes('220V')) {
          data.energy = { 
            monthlyKwh: data.energy?.monthlyKwh || 45,
            efficiency: data.energy?.efficiency || 'C',
            voltage: '220V' 
          };
        }

        // Extrair eficiência energética
        if (text.includes('A+')) {
          data.energy = { 
            monthlyKwh: data.energy?.monthlyKwh || 45,
            efficiency: 'A',
            voltage: data.energy?.voltage || 'bivolt' 
          };
        } else if (text.includes('B+')) {
          data.energy = { 
            monthlyKwh: data.energy?.monthlyKwh || 45,
            efficiency: 'B',
            voltage: data.energy?.voltage || 'bivolt' 
          };
        } else if (text.includes('C+')) {
          data.energy = { 
            monthlyKwh: data.energy?.monthlyKwh || 45,
            efficiency: 'C',
            voltage: data.energy?.voltage || 'bivolt' 
          };
        }
      }

      // Extrair do peopleAlsoAsk se disponível
      if (rawData.peopleAlsoAsk && rawData.peopleAlsoAsk.length > 0) {
        for (const question of rawData.peopleAlsoAsk) {
          const answer = question.snippet || '';
          const capacityMatch = answer.match(/(\d+)\s*(?:litros|L)/i);
          if (capacityMatch && !data.totalCapacity) {
            data.totalCapacity = parseInt(capacityMatch[1], 10);
          }
          
          const dimensionsMatch = answer.match(/(\d{2,3})[xX](\d{3,4})[xX](\d{2,3})\s*(?:cm|mm)?/);
          if (dimensionsMatch && !data.dimensions) {
            const width = parseInt(dimensionsMatch[1], 10);
            const height = parseInt(dimensionsMatch[2], 10);
            const depth = parseInt(dimensionsMatch[3], 10);
            
            const multiplier = width < 100 ? 10 : 1;
            
            data.dimensions = {
              width: width * multiplier,
              height: height * multiplier,
              depth: depth * multiplier,
              weight: data.totalCapacity ? Math.round(data.totalCapacity * 0.7) : 50,
            };
          }
        }
      }
    }

    return data;
  }

  private normalizeGoogleShoppingData(rawData: any): Partial<FridgeModelUserFocused> {
    const data: Partial<FridgeModelUserFocused> = {};

    if (rawData.items && rawData.items.length > 0) {
      const firstItem = rawData.items[0];
      
      // Extrair informações do título/snippet
      const title = firstItem.title || '';
      const snippet = firstItem.snippet || '';

      // Tentar extrair marca e modelo
      const brandModelMatch = title.match(/(\w+)\s+([A-Z]{2,}\d{2,}[A-Z]?)/i);
      if (brandModelMatch) {
        data.brand = brandModelMatch[1];
        data.model = brandModelMatch[2];
      }

      // Extrair capacidade
      const capacityMatch = (title + ' ' + snippet).match(/(\d+)\s*(?:litros|L)/i);
      if (capacityMatch) {
        data.totalCapacity = parseInt(capacityMatch[1], 10);
      }

      data.type = 'fridge'; // padrão
    }

    return data;
  }

  private normalizeManufacturerData(rawData: any): Partial<FridgeModelUserFocused> {
    const data: Partial<FridgeModelUserFocused> = {};

    if (rawData.html) {
      // Extrair dados do HTML usando regex
      const html = rawData.html;

      // Extrair capacidade
      const capacityMatch = html.match(/(\d+)\s*(?:litros|L)/i);
      if (capacityMatch) {
        data.totalCapacity = parseInt(capacityMatch[1], 10);
      }

      // Extrair dimensões
      const dimensionsMatch = html.match(/(\d+)\s*[xX]\s*(\d+)\s*[xX]\s*(\d+)/);
      if (dimensionsMatch) {
        data.dimensions = {
          width: parseInt(dimensionsMatch[1], 10),
          height: parseInt(dimensionsMatch[2], 10),
          depth: parseInt(dimensionsMatch[3], 10),
          weight: 0,
        };
      }

      // Extrair consumo
      const energyMatch = html.match(/(\d+)\s*(?:kWh|kWh\/mês)/i);
      if (energyMatch) {
        data.energy = {
          monthlyKwh: parseInt(energyMatch[1], 10),
          efficiency: 'C',
          voltage: 'bivolt',
        };
      }
    }

    return data;
  }

  private normalizeComparisonData(rawData: any): Partial<FridgeModelUserFocused> {
    // Similar ao manufacturer data
    return this.normalizeManufacturerData(rawData);
  }

  private normalizeManualData(rawData: any): Partial<FridgeModelUserFocused> {
    // Dados inseridos manualmente pelo usuário
    return rawData;
  }

  private mergeEnergyData(energyData: any[]): any {
    const validData = energyData.filter(d => d);
    if (validData.length === 0) return undefined;

    return {
      monthlyKwh: this.getAverageValue(validData.map(d => d.monthlyKwh)),
      efficiency: this.getMostCommonValue(validData.map(d => d.efficiency)),
      voltage: this.getMostCommonValue(validData.map(d => d.voltage)),
    };
  }

  private mergeDimensionsData(dimensionsData: any[]): any {
    const validData = dimensionsData.filter(d => d);
    if (validData.length === 0) return undefined;

    return {
      width: this.getAverageValue(validData.map(d => d.width)),
      height: this.getAverageValue(validData.map(d => d.height)),
      depth: this.getAverageValue(validData.map(d => d.depth)),
      weight: this.getAverageValue(validData.map(d => d.weight)),
    };
  }

  private mergeCompartmentsData(compartmentsData: any[]): any[] {
    // Para compartimentos, usar a fonte com mais dados
    const validData = compartmentsData.filter(d => d && d.length > 0);
    if (validData.length === 0) return [];

    // Retornar o array de compartimentos mais completo
    return validData.reduce((longest, current) => 
      current.length > longest.length ? current : longest
    );
  }

  private getMostCommonValue<T>(values: (T | undefined)[]): T | undefined {
    const validValues = values.filter(v => v !== undefined);
    if (validValues.length === 0) return undefined;

    const counts = new Map<T, number>();
    validValues.forEach(value => {
      if (value !== undefined) {
        counts.set(value, (counts.get(value) || 0) + 1);
      }
    });

    let maxCount = 0;
    let mostCommon: T | undefined;

    counts.forEach((count, value) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = value;
      }
    });

    return mostCommon;
  }

  private getAverageValue(values: (number | undefined)[]): number | undefined {
    const validValues = values.filter(v => v !== undefined);
    if (validValues.length === 0) return undefined;

    const sum = validValues.reduce((acc: number, val) => acc + (val || 0), 0);
    return sum / validValues.length;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const dataNormalizer = new DataNormalizer();
