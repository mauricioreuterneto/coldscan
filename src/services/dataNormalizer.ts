import { FridgeModelUserFocused, APISource, ModelIdentifier } from '../types/fridgeDiscovery';

// Data Normalizer - normaliza dados de múltiplas fontes
class DataNormalizer {
  normalize(rawData: any, source: string): Partial<FridgeModelUserFocused> {
    switch (source) {
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
    const normalizedData = sources.map(source => 
      this.normalize(source.rawData, source.source)
    );

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

    const sum = validValues.reduce((acc, val) => acc + (val || 0), 0);
    return sum / validValues.length;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const dataNormalizer = new DataNormalizer();
