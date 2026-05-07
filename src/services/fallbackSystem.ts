import { FridgeModelUserFocused, Compartment, Shelf, DoorCompartment } from '../types/fridgeDiscovery';

// Fallback System - aplica valores padrão inteligentes para dados faltantes
class FallbackSystem {
  appliedFallbacks: string[] = [];

  applyFallbacks(data: Partial<FridgeModelUserFocused>): Partial<FridgeModelUserFocused> {
    this.appliedFallbacks = [];

    const result = { ...data };

    // Fallback para tipo
    if (!result.type) {
      result.type = 'fridge';
      this.appliedFallbacks.push('type_default_fridge');
    }

    // Fallback para ano
    if (!result.year) {
      result.year = new Date().getFullYear();
      this.appliedFallbacks.push('year_current');
    }

    // Fallback para dimensões (se não tiver, estimar baseado na capacidade)
    if (!result.dimensions && result.totalCapacity) {
      result.dimensions = this.estimateDimensionsFromCapacity(result.totalCapacity);
      this.appliedFallbacks.push('dimensions_estimated');
    }

    // Fallback para capacidade (se não tiver, estimar baseado nas dimensões)
    if (!result.totalCapacity && result.dimensions) {
      result.totalCapacity = this.estimateCapacityFromDimensions(result.dimensions);
      this.appliedFallbacks.push('capacity_estimated');
    }

    // Fallback para consumo energético
    if (!result.energy && result.totalCapacity) {
      result.energy = this.estimateEnergyFromCapacity(result.totalCapacity, result.type || 'fridge');
      this.appliedFallbacks.push('energy_estimated');
    }

    // Fallback para compartimentos
    if (!result.compartments || result.compartments.length === 0) {
      result.compartments = this.estimateInternalLayout(result.type || 'fridge', result.totalCapacity || 300);
      this.appliedFallbacks.push('compartments_estimated');
    }

    return result;
  }

  estimateDimensionsFromCapacity(capacity: number): { width: number; height: number; depth: number; weight: number } {
    // Estimativa baseada em capacidade média
    const baseVolume = capacity * 1000; // cm³
    
    // Assumindo proporção típica de geladeira
    const height = Math.cbrt(baseVolume * 1.5);
    const width = height * 0.6;
    const depth = height * 0.7;

    return {
      width: Math.round(width),
      height: Math.round(height),
      depth: Math.round(depth),
      weight: Math.round(capacity * 0.8), // ~0.8kg por litro
    };
  }

  estimateCapacityFromDimensions(dimensions: { width: number; height: number; depth: number }): number {
    const volumeCm3 = dimensions.width * dimensions.height * dimensions.depth;
    // Capacidade interna é geralmente 70-80% do volume externo
    const internalVolume = volumeCm3 * 0.75;
    return Math.round(internalVolume / 1000); // converter para litros
  }

  estimateEnergyFromCapacity(capacity: number, type: string): { monthlyKwh: number; efficiency: 'A' | 'B' | 'C' | 'D' | 'E'; voltage: '110V' | '220V' | 'bivolt' } {
    // Estimativa: 0.05-0.15 kWh por litro por mês
    const baseKwh = capacity * 0.1;

    // Ajuste por tipo
    let multiplier = 1;
    if (type === 'frigobar') multiplier = 0.5;
    if (type === 'freezer') multiplier = 1.2;
    if (type === 'wine-cooler') multiplier = 0.8;

    const monthlyKwh = Math.round(baseKwh * multiplier);

    // Estimar eficiência baseado no consumo
    let efficiency: 'A' | 'B' | 'C' | 'D' | 'E' = 'C';
    if (monthlyKwh < capacity * 0.06) efficiency = 'A';
    else if (monthlyKwh < capacity * 0.08) efficiency = 'B';
    else if (monthlyKwh < capacity * 0.12) efficiency = 'C';
    else if (monthlyKwh < capacity * 0.15) efficiency = 'D';
    else efficiency = 'E';

    return {
      monthlyKwh,
      efficiency,
      voltage: 'bivolt',
    };
  }

  estimateInternalLayout(type: string, capacity: number): Compartment[] {
    const compartments: Compartment[] = [];

    if (type === 'fridge') {
      // Layout típico de geladeira duplex/inverse
      const fridgeCapacity = Math.round(capacity * 0.7);
      const freezerCapacity = Math.round(capacity * 0.3);

      // Compartimento refrigerador
      compartments.push({
        id: 'fridge-main',
        name: 'Refrigerador',
        type: 'fridge',
        capacity: fridgeCapacity,
        temperature: { min: 2, max: 8, unit: 'C' },
        idealFor: ['alimentos em geral', 'bebidas', 'sobremesas'],
        shelves: this.estimateShelves(fridgeCapacity, 4),
        drawers: [
          {
            id: 'crisper-1',
            height: 100,
            capacity: Math.round(fridgeCapacity * 0.2),
            transparent: true,
          },
        ],
        doorCompartments: this.estimateDoorCompartments(4),
      });

      // Compartimento freezer
      compartments.push({
        id: 'freezer-main',
        name: 'Freezer',
        type: 'freezer',
        capacity: freezerCapacity,
        temperature: { min: -18, max: -12, unit: 'C' },
        idealFor: ['carnes', 'sorvetes', 'congelados'],
        shelves: this.estimateShelves(freezerCapacity, 2),
        drawers: [
          {
            id: 'freezer-drawer-1',
            height: 80,
            capacity: Math.round(freezerCapacity * 0.5),
            transparent: true,
          },
        ],
        doorCompartments: this.estimateDoorCompartments(2),
      });
    } else if (type === 'frigobar') {
      compartments.push({
        id: 'frigobar-main',
        name: 'Frigobar',
        type: 'fridge',
        capacity: capacity,
        temperature: { min: 4, max: 10, unit: 'C' },
        idealFor: ['bebidas', 'laticínios'],
        shelves: this.estimateShelves(capacity, 2),
        drawers: [],
        doorCompartments: this.estimateDoorCompartments(2),
      });
    } else if (type === 'freezer') {
      compartments.push({
        id: 'freezer-main',
        name: 'Freezer',
        type: 'freezer',
        capacity: capacity,
        temperature: { min: -18, max: -12, unit: 'C' },
        idealFor: ['carnes', 'congelados'],
        shelves: this.estimateShelves(capacity, 3),
        drawers: [
          {
            id: 'freezer-drawer-1',
            height: 100,
            capacity: Math.round(capacity * 0.4),
            transparent: true,
          },
          {
            id: 'freezer-drawer-2',
            height: 100,
            capacity: Math.round(capacity * 0.4),
            transparent: true,
          },
        ],
        doorCompartments: this.estimateDoorCompartments(2),
      });
    } else if (type === 'wine-cooler') {
      compartments.push({
        id: 'wine-main',
        name: 'Adega Climatizada',
        type: 'fridge',
        capacity: capacity,
        temperature: { min: 8, max: 14, unit: 'C' },
        idealFor: ['vinhos'],
        shelves: this.estimateShelves(capacity, 5),
        drawers: [],
        doorCompartments: [],
      });
    }

    return compartments;
  }

  private estimateShelves(capacity: number, count: number): Shelf[] {
    const shelves: Shelf[] = [];
    const capacityPerShelf = Math.round(capacity / count);

    for (let i = 0; i < count; i++) {
      shelves.push({
        id: `shelf-${i + 1}`,
        height: 100 + (i * 80), // altura incremental
        capacity: capacityPerShelf,
      });
    }

    return shelves;
  }

  private estimateDoorCompartments(count: number): DoorCompartment[] {
    const compartments: DoorCompartment[] = [];
    const capacityPerCompartment = 5; // litros

    for (let i = 0; i < count; i++) {
      compartments.push({
        id: `door-comp-${i + 1}`,
        height: 50 + (i * 60),
        capacity: capacityPerCompartment,
      });
    }

    return compartments;
  }

  getAppliedFallbacks(): string[] {
    return [...this.appliedFallbacks];
  }
}

export const fallbackSystem = new FallbackSystem();
