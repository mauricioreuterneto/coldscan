import { Compartment, Shelf } from '../types';

export interface FridgeType {
  id: string;
  name: string;
  category: 'standard' | 'inverse' | 'side_by_side' | 'french_door' | 'compact' | 'wine_cooler' | 'commercial';
  description: string;
  typicalFeatures: string[];
  defaultStructure: CompartmentTemplate[];
}

export interface CompartmentTemplate {
  type: 'fridge' | 'freezer' | 'door' | 'drawer' | 'crisper' | 'deli_drawer' | 'ice_maker' | 'water_dispenser';
  name: string;
  position: { x: number; y: number; width: number; height: number };
  adjustable: boolean;
  removable: boolean;
  typicalCapacity: { min: number; max: number };
  shelfTypes: ShelfTemplate[];
  specialFeatures?: string[];
}

export interface ShelfTemplate {
  type: 'fixed' | 'adjustable' | 'glass' | 'wire' | 'spill_proof' | 'divided' | 'crisper' | 'deli_drawer' | 'drawer' | 'ice_maker' | 'water_dispenser';
  defaultPosition: number;
  adjustableRange?: { min: number; max: number };
  capacity: number;
}

export interface AdvancedLayoutConfig {
  fridgeType: FridgeType;
  customCompartments: Compartment[];
  dimensions: {
    totalHeight: number;
    totalWidth: number;
    totalDepth: number;
  };
  specialFeatures: string[];
  energyClass: string;
  frostType: 'frost_free' | 'manual_defrost' | 'auto_defrost';
  doorConfiguration: 'single' | 'double' | 'french' | 'quad';
}

class AdvancedLayoutService {
  private fridgeTypes: FridgeType[] = [];
  private compartmentLibrary: CompartmentTemplate[] = [];

  constructor() {
    this.initializeFridgeTypes();
    this.initializeCompartmentLibrary();
  }

  private initializeFridgeTypes() {
    this.fridgeTypes = [
      // Standard Top Freezer
      {
        id: 'standard_top_freezer',
        name: 'Geladeira Padrão (Freezer Acima)',
        category: 'standard',
        description: 'Modelo tradicional com freezer na parte superior',
        typicalFeatures: ['freezer_top', 'crisper_drawers', 'door_shelves'],
        defaultStructure: [
          {
            type: 'freezer',
            name: 'Freezer Superior',
            position: { x: 0, y: 0, width: 100, height: 25 },
            adjustable: false,
            removable: false,
            typicalCapacity: { min: 60, max: 120 },
            shelfTypes: [
              { type: 'wire', defaultPosition: 1, capacity: 30 },
              { type: 'wire', defaultPosition: 2, capacity: 30 }
            ]
          },
          {
            type: 'fridge',
            name: 'Geladeira Principal',
            position: { x: 0, y: 25, width: 100, height: 75 },
            adjustable: false,
            removable: false,
            typicalCapacity: { min: 200, max: 400 },
            shelfTypes: [
              { type: 'glass', defaultPosition: 1, capacity: 80, adjustableRange: { min: 1, max: 4 } },
              { type: 'glass', defaultPosition: 2, capacity: 80, adjustableRange: { min: 1, max: 4 } },
              { type: 'glass', defaultPosition: 3, capacity: 60, adjustableRange: { min: 1, max: 4 } },
              { type: 'crisper', defaultPosition: 4, capacity: 40 }
            ]
          },
          {
            type: 'door',
            name: 'Porta da Geladeira',
            position: { x: 0, y: 25, width: 15, height: 75 },
            adjustable: false,
            removable: false,
            typicalCapacity: { min: 20, max: 40 },
            shelfTypes: [
              { type: 'fixed', defaultPosition: 1, capacity: 8 },
              { type: 'fixed', defaultPosition: 2, capacity: 8 },
              { type: 'fixed', defaultPosition: 3, capacity: 8 },
              { type: 'fixed', defaultPosition: 4, capacity: 6 }
            ]
          }
        ]
      },

      // Bottom Freezer (Inverse)
      {
        id: 'bottom_freezer',
        name: 'Geladeira Inverse (Freezer Abaixo)',
        category: 'inverse',
        description: 'Freezer na parte inferior, geladeira acima',
        typicalFeatures: ['pull_out_freezer', 'eye_level_fridge', 'french_door_option'],
        defaultStructure: [
          {
            type: 'fridge',
            name: 'Geladeira Superior',
            position: { x: 0, y: 0, width: 100, height: 70 },
            adjustable: false,
            removable: false,
            typicalCapacity: { min: 250, max: 450 },
            shelfTypes: [
              { type: 'spill_proof', defaultPosition: 1, capacity: 90, adjustableRange: { min: 1, max: 4 } },
              { type: 'spill_proof', defaultPosition: 2, capacity: 90, adjustableRange: { min: 1, max: 4 } },
              { type: 'spill_proof', defaultPosition: 3, capacity: 70, adjustableRange: { min: 1, max: 4 } },
              { type: 'crisper', defaultPosition: 4, capacity: 50 },
              { type: 'deli_drawer', defaultPosition: 5, capacity: 40 }
            ]
          },
          {
            type: 'freezer',
            name: 'Freezer Inferior (Gavetão)',
            position: { x: 0, y: 70, width: 100, height: 30 },
            adjustable: false,
            removable: false,
            typicalCapacity: { min: 80, max: 150 },
            shelfTypes: [
              { type: 'drawer', defaultPosition: 1, capacity: 75 },
              { type: 'drawer', defaultPosition: 2, capacity: 75 }
            ]
          },
          {
            type: 'door',
            name: 'Porta da Geladeira',
            position: { x: 0, y: 0, width: 15, height: 70 },
            adjustable: false,
            removable: false,
            typicalCapacity: { min: 25, max: 45 },
            shelfTypes: [
              { type: 'fixed', defaultPosition: 1, capacity: 10 },
              { type: 'adjustable', defaultPosition: 2, capacity: 10, adjustableRange: { min: 2, max: 5 } },
              { type: 'adjustable', defaultPosition: 3, capacity: 10, adjustableRange: { min: 2, max: 5 } },
              { type: 'fixed', defaultPosition: 4, capacity: 8 },
              { type: 'fixed', defaultPosition: 5, capacity: 7 }
            ]
          }
        ]
      },

      // Side by Side
      {
        id: 'side_by_side',
        name: 'Geladeira Side by Side',
        category: 'side_by_side',
        description: 'Duas portas verticais lado a lado',
        typicalFeatures: ['water_dispenser', 'ice_maker', 'tall_items_storage'],
        defaultStructure: [
          {
            type: 'fridge',
            name: 'Lado da Geladeira',
            position: { x: 0, y: 0, width: 50, height: 100 },
            adjustable: false,
            removable: false,
            typicalCapacity: { min: 300, max: 500 },
            shelfTypes: [
              { type: 'glass', defaultPosition: 1, capacity: 100, adjustableRange: { min: 1, max: 6 } },
              { type: 'glass', defaultPosition: 2, capacity: 100, adjustableRange: { min: 1, max: 6 } },
              { type: 'glass', defaultPosition: 3, capacity: 80, adjustableRange: { min: 1, max: 6 } },
              { type: 'crisper', defaultPosition: 4, capacity: 60 },
              { type: 'deli_drawer', defaultPosition: 5, capacity: 40 }
            ]
          },
          {
            type: 'freezer',
            name: 'Lado do Freezer',
            position: { x: 50, y: 0, width: 50, height: 100 },
            adjustable: false,
            removable: false,
            typicalCapacity: { min: 200, max: 350 },
            shelfTypes: [
              { type: 'wire', defaultPosition: 1, capacity: 80, adjustableRange: { min: 1, max: 4 } },
              { type: 'wire', defaultPosition: 2, capacity: 80, adjustableRange: { min: 1, max: 4 } },
              { type: 'wire', defaultPosition: 3, capacity: 60, adjustableRange: { min: 1, max: 4 } },
              { type: 'drawer', defaultPosition: 4, capacity: 70 },
              { type: 'drawer', defaultPosition: 5, capacity: 60 }
            ]
          },
          {
            type: 'door',
            name: 'Porta da Geladeira',
            position: { x: 0, y: 0, width: 15, height: 100 },
            adjustable: false,
            removable: false,
            typicalCapacity: { min: 30, max: 50 },
            shelfTypes: [
              { type: 'adjustable', defaultPosition: 1, capacity: 12, adjustableRange: { min: 1, max: 6 } },
              { type: 'adjustable', defaultPosition: 2, capacity: 12, adjustableRange: { min: 1, max: 6 } },
              { type: 'fixed', defaultPosition: 3, capacity: 10 },
              { type: 'fixed', defaultPosition: 4, capacity: 8 },
              { type: 'fixed', defaultPosition: 5, capacity: 8 }
            ]
          },
          {
            type: 'door',
            name: 'Porta do Freezer',
            position: { x: 50, y: 0, width: 15, height: 100 },
            adjustable: false,
            removable: false,
            typicalCapacity: { min: 20, max: 35 },
            shelfTypes: [
              { type: 'fixed', defaultPosition: 1, capacity: 8 },
              { type: 'fixed', defaultPosition: 2, capacity: 8 },
              { type: 'drawer', defaultPosition: 3, capacity: 10 },
              { type: 'ice_maker', defaultPosition: 4, capacity: 5 }
            ]
          }
        ]
      },

      // French Door
      {
        id: 'french_door',
        name: 'Geladeira French Door',
        category: 'french_door',
        description: 'Duas portas na parte superior, freezer gavetão abaixo',
        typicalFeatures: ['wide_opening', 'pull_out_freezer', 'water_ice_dispenser'],
        defaultStructure: [
          {
            type: 'fridge',
            name: 'Geladeira Superior',
            position: { x: 0, y: 0, width: 100, height: 65 },
            adjustable: false,
            removable: false,
            typicalCapacity: { min: 400, max: 600 },
            shelfTypes: [
              { type: 'spill_proof', defaultPosition: 1, capacity: 120, adjustableRange: { min: 1, max: 4 } },
              { type: 'spill_proof', defaultPosition: 2, capacity: 120, adjustableRange: { min: 1, max: 4 } },
              { type: 'spill_proof', defaultPosition: 3, capacity: 100, adjustableRange: { min: 1, max: 4 } },
              { type: 'crisper', defaultPosition: 4, capacity: 60 },
              { type: 'deli_drawer', defaultPosition: 5, capacity: 50 }
            ]
          },
          {
            type: 'freezer',
            name: 'Freezer Inferior',
            position: { x: 0, y: 65, width: 100, height: 35 },
            adjustable: false,
            removable: false,
            typicalCapacity: { min: 150, max: 250 },
            shelfTypes: [
              { type: 'drawer', defaultPosition: 1, capacity: 80 },
              { type: 'drawer', defaultPosition: 2, capacity: 80 },
              { type: 'drawer', defaultPosition: 3, capacity: 40 }
            ]
          },
          {
            type: 'door',
            name: 'Porta Esquerda',
            position: { x: 0, y: 0, width: 12, height: 65 },
            adjustable: false,
            removable: false,
            typicalCapacity: { min: 15, max: 25 },
            shelfTypes: [
              { type: 'adjustable', defaultPosition: 1, capacity: 8, adjustableRange: { min: 1, max: 4 } },
              { type: 'adjustable', defaultPosition: 2, capacity: 8, adjustableRange: { min: 1, max: 4 } },
              { type: 'fixed', defaultPosition: 3, capacity: 7 }
            ]
          },
          {
            type: 'door',
            name: 'Porta Direita',
            position: { x: 88, y: 0, width: 12, height: 65 },
            adjustable: false,
            removable: false,
            typicalCapacity: { min: 15, max: 25 },
            shelfTypes: [
              { type: 'adjustable', defaultPosition: 1, capacity: 8, adjustableRange: { min: 1, max: 4 } },
              { type: 'adjustable', defaultPosition: 2, capacity: 8, adjustableRange: { min: 1, max: 4 } },
              { type: 'fixed', defaultPosition: 3, capacity: 7 }
            ]
          }
        ]
      },

      // Compact
      {
        id: 'compact',
        name: 'Geladeira Compacta',
        category: 'compact',
        description: 'Modelo pequeno para espaços reduzidos',
        typicalFeatures: ['small_footprint', 'basic_features'],
        defaultStructure: [
          {
            type: 'fridge',
            name: 'Geladeira Compacta',
            position: { x: 0, y: 0, width: 100, height: 80 },
            adjustable: false,
            removable: false,
            typicalCapacity: { min: 80, max: 150 },
            shelfTypes: [
              { type: 'wire', defaultPosition: 1, capacity: 40 },
              { type: 'wire', defaultPosition: 2, capacity: 35 },
              { type: 'crisper', defaultPosition: 3, capacity: 25 }
            ]
          },
          {
            type: 'freezer',
            name: 'Freezer Interno',
            position: { x: 0, y: 80, width: 100, height: 20 },
            adjustable: false,
            removable: false,
            typicalCapacity: { min: 15, max: 30 },
            shelfTypes: [
              { type: 'fixed', defaultPosition: 1, capacity: 20 }
            ]
          },
          {
            type: 'door',
            name: 'Porta Compacta',
            position: { x: 0, y: 0, width: 12, height: 80 },
            adjustable: false,
            removable: false,
            typicalCapacity: { min: 8, max: 15 },
            shelfTypes: [
              { type: 'fixed', defaultPosition: 1, capacity: 5 },
              { type: 'fixed', defaultPosition: 2, capacity: 5 }
            ]
          }
        ]
      }
    ];
  }

  private initializeCompartmentLibrary() {
    this.compartmentLibrary = [
      // Tipos especiais de compartimentos
      {
        type: 'crisper',
        name: 'Gaveta de Legumes',
        position: { x: 0, y: 0, width: 100, height: 15 },
        adjustable: false,
        removable: true,
        typicalCapacity: { min: 20, max: 50 },
        shelfTypes: [
          { type: 'crisper', defaultPosition: 1, capacity: 30 }
        ],
        specialFeatures: ['humidity_control', 'transparent_drawer']
      },
      {
        type: 'deli_drawer',
        name: 'Gaveta Frios',
        position: { x: 0, y: 0, width: 100, height: 10 },
        adjustable: false,
        removable: true,
        typicalCapacity: { min: 15, max: 40 },
        shelfTypes: [
          { type: 'deli_drawer', defaultPosition: 1, capacity: 25 }
        ],
        specialFeatures: ['temperature_control', 'ideal_for_meats_cheese']
      },
      {
        type: 'ice_maker',
        name: 'Fabricador de Gelo',
        position: { x: 0, y: 0, width: 20, height: 15 },
        adjustable: false,
        removable: false,
        typicalCapacity: { min: 5, max: 15 },
        shelfTypes: [
          { type: 'ice_maker', defaultPosition: 1, capacity: 10 }
        ],
        specialFeatures: ['automatic_ice', 'cubed_crushed_ice']
      },
      {
        type: 'water_dispenser',
        name: 'Distribuidor de Água',
        position: { x: 0, y: 0, width: 15, height: 20 },
        adjustable: false,
        removable: false,
        typicalCapacity: { min: 3, max: 8 },
        shelfTypes: [
          { type: 'water_dispenser', defaultPosition: 1, capacity: 5 }
        ],
        specialFeatures: ['filtered_water', 'cold_water']
      }
    ];
  }

  // Detectar tipo de geladeira baseado em características
  detectFridgeType(capacity: number, features: string[], brand: string, model: string): FridgeType {
    // Análise por capacidade e características
    if (capacity < 200) {
      return this.fridgeTypes.find(t => t.id === 'compact')!;
    }

    if (capacity > 600) {
      return this.fridgeTypes.find(t => t.category === 'side_by_side' || t.category === 'french_door')!;
    }

    // Análise por nome do modelo
    const modelLower = model.toLowerCase();
    const brandLower = brand.toLowerCase();

    if (modelLower.includes('inverse') || modelLower.includes('bottom freezer')) {
      return this.fridgeTypes.find(t => t.id === 'bottom_freezer')!;
    }

    if (modelLower.includes('side') || modelLower.includes('lado a lado')) {
      return this.fridgeTypes.find(t => t.id === 'side_by_side')!;
    }

    if (modelLower.includes('french') || modelLower.includes('dupla')) {
      return this.fridgeTypes.find(t => t.id === 'french_door')!;
    }

    // Análise por características
    if (features.includes('water_dispenser') || features.includes('ice_maker')) {
      return this.fridgeTypes.find(t => t.category === 'side_by_side' || t.category === 'french_door')!;
    }

    // Padrão: standard top freezer
    return this.fridgeTypes.find(t => t.id === 'standard_top_freezer')!;
  }

  // Criar layout totalmente personalizável
  createCustomLayout(fridgeType: FridgeType, totalCapacity: number): AdvancedLayoutConfig {
    const baseCompartments = fridgeType.defaultStructure.map(template => 
      this.convertTemplateToCompartment(template, totalCapacity)
    );

    return {
      fridgeType,
      customCompartments: baseCompartments,
      dimensions: this.calculateDimensions(fridgeType, totalCapacity),
      specialFeatures: fridgeType.typicalFeatures,
      energyClass: 'A',
      frostType: 'frost_free',
      doorConfiguration: this.inferDoorConfiguration(fridgeType)
    };
  }

  // Converter template para compartimento real
  private convertTemplateToCompartment(template: CompartmentTemplate, totalCapacity: number): Compartment {
    const capacity = Math.floor(
      totalCapacity * (template.typicalCapacity.max / 500) // Ajuste proporcional
    );

    const shelves: Shelf[] = template.shelfTypes.map(shelfTemplate => ({
      id: `shelf-${template.type}-${shelfTemplate.defaultPosition}`,
      name: this.generateShelfName(shelfTemplate.type, shelfTemplate.defaultPosition),
      position: shelfTemplate.defaultPosition,
      capacity: Math.floor(capacity * (shelfTemplate.capacity / template.typicalCapacity.max))
    }));

    return {
      id: `compartment-${template.type}-${Date.now()}`,
      name: template.name,
      type: template.type as any,
      capacity,
      position: template.position,
      shelves
    };
  }

  private generateShelfName(shelfType: string, position: number): string {
    const names: Record<string, string> = {
      'fixed': `Prateleira Fixa ${position}`,
      'adjustable': `Prateleira Ajustável ${position}`,
      'glass': `Prateleira de Vidro ${position}`,
      'wire': `Prateleira de Arame ${position}`,
      'spill_proof': `Prateleira Anti-Derrame ${position}`,
      'crisper': 'Gaveta de Legumes',
      'deli_drawer': 'Gaveta Frios',
      'drawer': `Gavetão ${position}`,
      'ice_maker': 'Fabricador de Gelo',
      'water_dispenser': 'Distribuidor de Água'
    };

    return names[shelfType] || `Prateleira ${position}`;
  }

  private calculateDimensions(fridgeType: FridgeType, capacity: number): {
    totalHeight: number;
    totalWidth: number;
    totalDepth: number;
  } {
    // Fórmulas baseadas em padrões de mercado
    const baseHeight = 170; // cm
    const baseWidth = 60;   // cm
    const baseDepth = 65;   // cm

    const capacityRatio = capacity / 300; // 300L como base

    return {
      totalHeight: Math.floor(baseHeight + (capacityRatio * 20)),
      totalWidth: Math.floor(baseWidth + (capacityRatio * 15)),
      totalDepth: Math.floor(baseDepth + (capacityRatio * 10))
    };
  }

  private inferDoorConfiguration(fridgeType: FridgeType): 'single' | 'double' | 'french' | 'quad' {
    switch (fridgeType.category) {
      case 'french_door': return 'french';
      case 'side_by_side': return 'double';
      case 'compact': return 'single';
      default: return 'single';
    }
  }

  // Adicionar compartimento personalizado
  addCustomCompartment(
    layout: AdvancedLayoutConfig,
    type: CompartmentTemplate['type'],
    customName?: string,
    customCapacity?: number
  ): AdvancedLayoutConfig {
    const template = this.compartmentLibrary.find(t => t.type === type) || 
                    this.createBasicTemplate(type);

    const newCompartment = this.convertTemplateToCompartment(template, 300); // Capacidade base
    
    if (customName) newCompartment.name = customName;
    if (customCapacity) newCompartment.capacity = customCapacity;

    return {
      ...layout,
      customCompartments: [...layout.customCompartments, newCompartment]
    };
  }

  private createBasicTemplate(type: CompartmentTemplate['type']): CompartmentTemplate {
    return {
      type,
      name: `Compartimento ${type}`,
      position: { x: 0, y: 0, width: 100, height: 20 },
      adjustable: true,
      removable: true,
      typicalCapacity: { min: 20, max: 80 },
      shelfTypes: [
        { type: 'fixed', defaultPosition: 1, capacity: 40 }
      ]
    };
  }

  // Validar layout completo
  validateLayout(layout: AdvancedLayoutConfig): {
    isValid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Verificar capacidade total
    const totalCapacity = layout.customCompartments.reduce((sum, comp) => sum + comp.capacity, 0);
    const expectedCapacity = this.calculateExpectedCapacity(layout.fridgeType.category);

    if (Math.abs(totalCapacity - expectedCapacity) > expectedCapacity * 0.3) {
      warnings.push(`Capacidade total (${totalCapacity}L) muito diferente do esperado (${expectedCapacity}L)`);
    }

    // Verificar sobreposição de posições
    for (let i = 0; i < layout.customCompartments.length; i++) {
      for (let j = i + 1; j < layout.customCompartments.length; j++) {
        const comp1 = layout.customCompartments[i];
        const comp2 = layout.customCompartments[j];

        if (this.compartmentsOverlap(comp1.position, comp2.position)) {
          issues.push(`Sobreposição: ${comp1.name} e ${comp2.name}`);
        }
      }
    }

    // Verificar tipos obrigatórios
    const hasFridge = layout.customCompartments.some(c => c.type === 'fridge');
    const hasFreezer = layout.customCompartments.some(c => c.type === 'freezer');

    if (!hasFridge) {
      issues.push('Layout deve incluir pelo menos um compartimento de geladeira');
    }

    if (!hasFreezer && layout.fridgeType.category !== 'compact') {
      warnings.push('Layout sem freezer - incomum para este tipo de geladeira');
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }

  private compartmentsOverlap(pos1: any, pos2: any): boolean {
    return !(pos1.x + pos1.width <= pos2.x || 
             pos2.x + pos2.width <= pos1.x || 
             pos1.y + pos1.height <= pos2.y || 
             pos2.y + pos2.height <= pos1.y);
  }

  private calculateExpectedCapacity(category: FridgeType['category']): number {
    const capacities: Record<FridgeType['category'], number> = {
      'standard': 350,
      'inverse': 400,
      'side_by_side': 600,
      'french_door': 650,
      'compact': 120,
      'wine_cooler': 150,
      'commercial': 1000
    };

    return capacities[category] || 350;
  }

  // Obter todos os tipos de geladeira disponíveis
  getAvailableFridgeTypes(): FridgeType[] {
    return this.fridgeTypes;
  }

  // Obter biblioteca de compartimentos
  getCompartmentLibrary(): CompartmentTemplate[] {
    return this.compartmentLibrary;
  }
}

export const advancedLayoutService = new AdvancedLayoutService();
