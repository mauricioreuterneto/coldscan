import { FridgeModelInfo, Compartment } from '../types';

export interface FridgeLayoutTemplate {
  id: string;
  name: string;
  brandPatterns: string[];
  capacityRange: { min: number; max: number };
  type: 'frost_free' | 'cycle' | 'inverse' | 'duplex' | 'compact';
  compartments: Compartment[];
  confidence: number; // 0-1, quão confiante é este template
}

export interface LayoutSearchResult {
  template: FridgeLayoutTemplate;
  confidence: number;
  matchReason: string;
}

class FridgeLayoutService {
  private layoutDatabase: FridgeLayoutTemplate[] = [];

  constructor() {
    this.initializeLayoutDatabase();
  }

  private initializeLayoutDatabase() {
    this.layoutDatabase = [
      // Brastemp - Frost Free Duplex
      {
        id: 'brastemp-frost-free-duplex',
        name: 'Brastemp Frost Free Duplex',
        brandPatterns: ['brastemp'],
        capacityRange: { min: 300, max: 600 },
        type: 'duplex',
        confidence: 0.9,
        compartments: [
          {
            id: 'fridge-upper',
            name: 'Geladeira Superior',
            type: 'fridge',
            capacity: 0.4,
            position: { x: 0, y: 0, width: 100, height: 35 },
            shelves: [
              { id: 'shelf-1', name: 'Prateleira 1', position: 1, capacity: 0.15 },
              { id: 'shelf-2', name: 'Prateleira 2', position: 2, capacity: 0.15 },
              { id: 'shelf-3', name: 'Prateleira 3', position: 3, capacity: 0.1 }
            ]
          },
          {
            id: 'fridge-lower',
            name: 'Geladeira Inferior',
            type: 'fridge',
            capacity: 0.3,
            position: { x: 0, y: 35, width: 100, height: 35 },
            shelves: [
              { id: 'drawer-1', name: 'Gavetão 1', position: 1, capacity: 0.2 },
              { id: 'drawer-2', name: 'Gavetão 2', position: 2, capacity: 0.1 }
            ]
          },
          {
            id: 'freezer',
            name: 'Freezer',
            type: 'freezer',
            capacity: 0.3,
            position: { x: 0, y: 70, width: 100, height: 30 },
            shelves: [
              { id: 'freezer-shelf-1', name: 'Prateleira Freezer', position: 1, capacity: 0.15 },
              { id: 'freezer-drawer-1', name: 'Gaveta Freezer', position: 2, capacity: 0.15 }
            ]
          }
        ]
      },
      
      // Consul - Cycle Simples
      {
        id: 'consul-cycle-simple',
        name: 'Consul Cycle Simples',
        brandPatterns: ['consul'],
        capacityRange: { min: 200, max: 400 },
        type: 'cycle',
        confidence: 0.85,
        compartments: [
          {
            id: 'fridge-main',
            name: 'Geladeira',
            type: 'fridge',
            capacity: 0.75,
            position: { x: 0, y: 0, width: 100, height: 75 },
            shelves: [
              { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 0.25 },
              { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 0.25 },
              { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 0.15 },
              { id: 'legumeira', name: 'Legumeira', position: 4, capacity: 0.1 }
            ]
          },
          {
            id: 'freezer-small',
            name: 'Freezer Interno',
            type: 'freezer',
            capacity: 0.25,
            position: { x: 0, y: 75, width: 100, height: 25 },
            shelves: [
              { id: 'freezer-shelf', name: 'Prateleira Freezer', position: 1, capacity: 0.25 }
            ]
          }
        ]
      },

      // Samsung - Inverse
      {
        id: 'samsung-inverse',
        name: 'Samsung Inverse',
        brandPatterns: ['samsung'],
        capacityRange: { min: 400, max: 600 },
        type: 'inverse',
        confidence: 0.95,
        compartments: [
          {
            id: 'freezer-top',
            name: 'Freezer Superior',
            type: 'freezer',
            capacity: 0.35,
            position: { x: 0, y: 0, width: 100, height: 35 },
            shelves: [
              { id: 'freezer-shelf-1', name: 'Prateleira 1', position: 1, capacity: 0.2 },
              { id: 'freezer-drawer-1', name: 'Gaveta 1', position: 2, capacity: 0.15 }
            ]
          },
          {
            id: 'fridge-bottom',
            name: 'Geladeira Inferior',
            type: 'fridge',
            capacity: 0.65,
            position: { x: 0, y: 35, width: 100, height: 65 },
            shelves: [
              { id: 'shelf-1', name: 'Prateleira 1', position: 1, capacity: 0.2 },
              { id: 'shelf-2', name: 'Prateleira 2', position: 2, capacity: 0.2 },
              { id: 'drawer-1', name: 'Gavetão', position: 3, capacity: 0.15 },
              { id: 'drawer-2', name: 'Gavetão 2', position: 4, capacity: 0.1 }
            ]
          }
        ]
      },

      // LG - Inverse com Door-in-Door
      {
        id: 'lg-inverse-door',
        name: 'LG Inverse Door-in-Door',
        brandPatterns: ['lg'],
        capacityRange: { min: 500, max: 700 },
        type: 'inverse',
        confidence: 0.9,
        compartments: [
          {
            id: 'freezer-top',
            name: 'Freezer Superior',
            type: 'freezer',
            capacity: 0.3,
            position: { x: 0, y: 0, width: 100, height: 30 },
            shelves: [
              { id: 'freezer-shelf-1', name: 'Prateleira Freezer', position: 1, capacity: 0.15 },
              { id: 'freezer-drawer-1', name: 'Gaveta Freezer', position: 2, capacity: 0.15 }
            ]
          },
          {
            id: 'door-compartment',
            name: 'Compartimento Porta',
            type: 'door',
            capacity: 0.1,
            position: { x: 0, y: 30, width: 100, height: 10 },
            shelves: [
              { id: 'door-shelf-1', name: 'Prateleira Porta', position: 1, capacity: 0.1 }
            ]
          },
          {
            id: 'fridge-main',
            name: 'Geladeira Principal',
            type: 'fridge',
            capacity: 0.6,
            position: { x: 0, y: 40, width: 100, height: 60 },
            shelves: [
              { id: 'shelf-1', name: 'Prateleira 1', position: 1, capacity: 0.2 },
              { id: 'shelf-2', name: 'Prateleira 2', position: 2, capacity: 0.2 },
              { id: 'drawer-1', name: 'Gavetão', position: 3, capacity: 0.15 },
              { id: 'drawer-2', name: 'Gaveta 2', position: 4, capacity: 0.05 }
            ]
          }
        ]
      },

      // Compactos (até 300L)
      {
        id: 'compact-single',
        name: 'Compacto Simples',
        brandPatterns: [], // Qualquer marca
        capacityRange: { min: 100, max: 300 },
        type: 'compact',
        confidence: 0.7,
        compartments: [
          {
            id: 'fridge-compact',
            name: 'Geladeira Compacta',
            type: 'fridge',
            capacity: 0.8,
            position: { x: 0, y: 0, width: 100, height: 80 },
            shelves: [
              { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 0.3 },
              { id: 'shelf-2', name: 'Prateleira Inferior', position: 2, capacity: 0.3 },
              { id: 'legumeira', name: 'Legumeira', position: 3, capacity: 0.2 }
            ]
          },
          {
            id: 'freezer-compact',
            name: 'Freezer Compacto',
            type: 'freezer',
            capacity: 0.2,
            position: { x: 0, y: 80, width: 100, height: 20 },
            shelves: [
              { id: 'freezer-shelf', name: 'Prateleira Freezer', position: 1, capacity: 0.2 }
            ]
          }
        ]
      }
    ];
  }

  // Busca inteligente de layout baseado no modelo
  async findBestLayout(modelInfo: FridgeModelInfo): Promise<LayoutSearchResult[]> {
    const results: LayoutSearchResult[] = [];

    // 1. Busca exata por marca + capacidade
    const exactMatches = this.layoutDatabase.filter(template => 
      template.brandPatterns.some(pattern => 
        modelInfo.brand.toLowerCase().includes(pattern.toLowerCase())
      ) &&
      modelInfo.capacity >= template.capacityRange.min &&
      modelInfo.capacity <= template.capacityRange.max
    );

    if (exactMatches.length > 0) {
      exactMatches.forEach(template => {
        results.push({
          template,
          confidence: template.confidence,
          matchReason: `Marca ${modelInfo.brand} e capacidade ${modelInfo.capacity}L correspondem ao template ${template.name}`
        });
      });
    }

    // 2. Busca por capacidade (fallback)
    const capacityMatches = this.layoutDatabase.filter(template =>
      modelInfo.capacity >= template.capacityRange.min &&
      modelInfo.capacity <= template.capacityRange.max
    );

    capacityMatches.forEach(template => {
      if (!exactMatches.includes(template)) {
        results.push({
          template,
          confidence: template.confidence * 0.7, // Reduz confiança para match apenas por capacidade
          matchReason: `Capacidade ${modelInfo.capacity}L corresponde ao range do template ${template.name}`
        });
      }
    });

    // 3. Busca online por layout específico (se APIs disponíveis)
    try {
      const onlineLayout = await this.searchOnlineLayout(modelInfo);
      if (onlineLayout) {
        results.push(onlineLayout);
      }
    } catch (error) {
      console.warn('Busca online de layout falhou, usando templates locais');
    }

    // Ordenar por confiança
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  // Busca online por diagramas/especificações
  private async searchOnlineLayout(modelInfo: FridgeModelInfo): Promise<LayoutSearchResult | null> {
    // Queries para busca online (implementação futura)
    const searchQueries = [
      `${modelInfo.brand} ${modelInfo.model} layout interno diagrama`,
      `${modelInfo.brand} ${modelInfo.model} compartimentos esquema`,
      `${modelInfo.brand} ${modelInfo.model} manual pdf compartimentos`,
      `${modelInfo.brand} ${modelInfo.model} frost free duplex diagram`
    ];

    // Implementar busca usando APIs (similar ao apiService)
    // Por ora, retorna null para usar templates locais
    return null;
  }

  // Gera layout personalizado baseado em características
  generateAdaptiveLayout(modelInfo: FridgeModelInfo): Compartment[] {
    const { capacity, brand, model } = modelInfo;
    
    // Inferir tipo baseado em padrões de nomenclatura
    const isInverse = model.toLowerCase().includes('inverse') || 
                     model.toLowerCase().includes('inverter') ||
                     brand.toLowerCase() === 'samsung';
    
    const isDuplex = model.toLowerCase().includes('duplex') ||
                    model.toLowerCase().includes('duplo') ||
                    brand.toLowerCase() === 'brastemp';

    const isCompact = capacity < 300;

    if (isInverse) {
      return this.generateInverseLayout(capacity);
    } else if (isDuplex) {
      return this.generateDuplexLayout(capacity);
    } else if (isCompact) {
      return this.generateCompactLayout(capacity);
    } else {
      return this.generateStandardLayout(capacity);
    }
  }

  private generateInverseLayout(capacity: number): Compartment[] {
    return [
      {
        id: 'freezer-top',
        name: 'Freezer Superior',
        type: 'freezer',
        capacity: Math.floor(capacity * 0.35),
        position: { x: 0, y: 0, width: 100, height: 35 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Prateleira Freezer', position: 1, capacity: Math.floor(capacity * 0.2) },
          { id: 'freezer-drawer-1', name: 'Gaveta Freezer', position: 2, capacity: Math.floor(capacity * 0.15) }
        ]
      },
      {
        id: 'fridge-bottom',
        name: 'Geladeira Inferior',
        type: 'fridge',
        capacity: Math.floor(capacity * 0.65),
        position: { x: 0, y: 35, width: 100, height: 65 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira 1', position: 1, capacity: Math.floor(capacity * 0.25) },
          { id: 'shelf-2', name: 'Prateleira 2', position: 2, capacity: Math.floor(capacity * 0.25) },
          { id: 'drawer-1', name: 'Gavetão', position: 3, capacity: Math.floor(capacity * 0.15) }
        ]
      }
    ];
  }

  private generateDuplexLayout(capacity: number): Compartment[] {
    return [
      {
        id: 'fridge-upper',
        name: 'Geladeira Superior',
        type: 'fridge',
        capacity: Math.floor(capacity * 0.4),
        position: { x: 0, y: 0, width: 100, height: 40 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira 1', position: 1, capacity: Math.floor(capacity * 0.2) },
          { id: 'shelf-2', name: 'Prateleira 2', position: 2, capacity: Math.floor(capacity * 0.2) }
        ]
      },
      {
        id: 'fridge-lower',
        name: 'Geladeira Inferior',
        type: 'fridge',
        capacity: Math.floor(capacity * 0.3),
        position: { x: 0, y: 40, width: 100, height: 30 },
        shelves: [
          { id: 'drawer-1', name: 'Gavetão 1', position: 1, capacity: Math.floor(capacity * 0.2) },
          { id: 'drawer-2', name: 'Gavetão 2', position: 2, capacity: Math.floor(capacity * 0.1) }
        ]
      },
      {
        id: 'freezer',
        name: 'Freezer',
        type: 'freezer',
        capacity: Math.floor(capacity * 0.3),
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Prateleira Freezer', position: 1, capacity: Math.floor(capacity * 0.3) }
        ]
      }
    ];
  }

  private generateCompactLayout(capacity: number): Compartment[] {
    return [
      {
        id: 'fridge-main',
        name: 'Geladeira',
        type: 'fridge',
        capacity: Math.floor(capacity * 0.8),
        position: { x: 0, y: 0, width: 100, height: 80 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: Math.floor(capacity * 0.4) },
          { id: 'shelf-2', name: 'Prateleira Inferior', position: 2, capacity: Math.floor(capacity * 0.3) },
          { id: 'legumeira', name: 'Legumeira', position: 3, capacity: Math.floor(capacity * 0.1) }
        ]
      },
      {
        id: 'freezer-small',
        name: 'Freezer',
        type: 'freezer',
        capacity: Math.floor(capacity * 0.2),
        position: { x: 0, y: 80, width: 100, height: 20 },
        shelves: [
          { id: 'freezer-shelf', name: 'Prateleira Freezer', position: 1, capacity: Math.floor(capacity * 0.2) }
        ]
      }
    ];
  }

  private generateStandardLayout(capacity: number): Compartment[] {
    return [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: Math.floor(capacity * 0.7),
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: Math.floor(capacity * 0.25) },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: Math.floor(capacity * 0.25) },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: Math.floor(capacity * 0.15) },
          { id: 'legumeira', name: 'Legumeira', position: 4, capacity: Math.floor(capacity * 0.05) }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer',
        type: 'freezer',
        capacity: Math.floor(capacity * 0.3),
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Prateleira Freezer', position: 1, capacity: Math.floor(capacity * 0.3) }
        ]
      }
    ];
  }
}

export const fridgeLayoutService = new FridgeLayoutService();
