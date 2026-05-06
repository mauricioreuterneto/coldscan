// Banco de dados estruturado de modelos de geladeira reais
// Elimina duplicatas, ambiguidade e otimiza consumo de tokens

export interface FridgeModelSpec {
  id: string;
  brand: string;
  model: string;
  capacity: number;
  type: 'duplex' | 'frost_free' | 'inverse' | 'compact';
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  compartments: {
    id: string;
    name: string;
    type: 'fridge' | 'freezer' | 'crisper' | 'door';
    capacity: number;
    position: { x: number; y: number; width: number; height: number };
    shelves: Array<{
      id: string;
      name: string;
      position: number;
      capacity: number;
      type: 'glass' | 'wire' | 'drawer';
    }>;
  }[];
  features: string[];
  energy_efficiency: string;
  year: number;
  image?: string;
}

export const FRIDGE_MODELS_DATABASE: FridgeModelSpec[] = [
  // BRASTEMP - Modelos Populares
  {
    id: 'brastemp-bre80ak',
    brand: 'Brastemp',
    model: 'BRE80AK',
    capacity: 375,
    type: 'frost_free',
    dimensions: { width: 60, height: 185, depth: 68 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 280,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 60, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio Superior', position: 2, capacity: 70, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Meio Inferior', position: 3, capacity: 70, type: 'glass' },
          { id: 'shelf-4', name: 'Prateleira Inferior', position: 4, capacity: 80, type: 'glass' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer',
        type: 'freezer',
        capacity: 95,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Gaveta Superior', position: 1, capacity: 50, type: 'drawer' },
          { id: 'freezer-shelf-2', name: 'Gaveta Inferior', position: 2, capacity: 45, type: 'drawer' }
        ]
      }
    ],
    features: ['Frost Free', 'Turbo Congelamento', 'LED Interior', 'Controle Digital'],
    energy_efficiency: 'A',
    year: 2023,
    image: 'https://images-submarino.b2w.io/produtos/01/00/item/133529/3/133529314_1GG.jpg'
  },
  {
    id: 'brastemp-bre57ab',
    brand: 'Brastemp',
    model: 'BRE57AB',
    capacity: 454,
    type: 'inverse',
    dimensions: { width: 75, height: 189, depth: 75 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 340,
        position: { x: 0, y: 30, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 80, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 85, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 90, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 85, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer Inferior',
        type: 'freezer',
        capacity: 114,
        position: { x: 0, y: 0, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-drawer-1', name: 'Gaveta Superior', position: 1, capacity: 57, type: 'drawer' },
          { id: 'freezer-drawer-2', name: 'Gaveta Inferior', position: 2, capacity: 57, type: 'drawer' }
        ]
      }
    ],
    features: ['Inverse', 'Frost Free', 'Turbo Congelamento', 'LED Interior', 'Smart Cool'],
    energy_efficiency: 'A+',
    year: 2023,
    image: 'https://images-americanas.b2w.io/produtos/01/00/item/133529/2/133529287_1GG.jpg'
  },
  {
    id: 'brastemp-brew44ak',
    brand: 'Brastemp',
    model: 'BREW44AK',
    capacity: 344,
    type: 'frost_free',
    dimensions: { width: 58, height: 174, depth: 64 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 260,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 65, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 65, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 65, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 65, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer',
        type: 'freezer',
        capacity: 84,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Gaveta Superior', position: 1, capacity: 50, type: 'drawer' },
          { id: 'freezer-shelf-2', name: 'Gaveta Inferior', position: 2, capacity: 34, type: 'drawer' }
        ]
      }
    ],
    features: ['Frost Free', 'Turbo Congelamento', 'LED Interior', 'Controle Digital'],
    energy_efficiency: 'A',
    year: 2022,
    image: 'https://images-americanas.b2w.io/produtos/01/00/item/132780/5/132780534_1GG.jpg'
  },
  {
    id: 'brastemp-brew50ak',
    brand: 'Brastemp',
    model: 'BREW50AK',
    capacity: 475,
    type: 'frost_free',
    dimensions: { width: 70, height: 185, depth: 70 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 350,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 85, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio Superior', position: 2, capacity: 85, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Meio Inferior', position: 3, capacity: 85, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 95, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer',
        type: 'freezer',
        capacity: 125,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Gaveta Superior', position: 1, capacity: 65, type: 'drawer' },
          { id: 'freezer-shelf-2', name: 'Gaveta Inferior', position: 2, capacity: 60, type: 'drawer' }
        ]
      }
    ],
    features: ['Frost Free', 'Turbo Congelamento', 'LED Interior', 'Controle Eletrônico'],
    energy_efficiency: 'A',
    year: 2023,
    image: 'https://images-submarino.b2w.io/produtos/01/00/item/133529/8/133529876_1GG.jpg'
  },
  {
    id: 'brastemp-bre45ab',
    brand: 'Brastemp',
    model: 'BRE45AB',
    capacity: 339,
    type: 'duplex',
    dimensions: { width: 58, height: 174, depth: 64 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 255,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 65, type: 'wire' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 65, type: 'wire' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 65, type: 'wire' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 60, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer Superior',
        type: 'freezer',
        capacity: 84,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Prateleira do Freezer', position: 1, capacity: 84, type: 'wire' }
        ]
      }
    ],
    features: ['Degelo Automático', 'Economia de Energia', 'Prateleiras Removíveis'],
    energy_efficiency: 'A',
    year: 2022,
    image: 'https://images-americanas.b2w.io/produtos/01/00/item/132780/6/132780645_1GG.jpg'
  },
  {
    id: 'brastemp-bre57ab',
    brand: 'Brastemp',
    model: 'BRE57AB',
    capacity: 454,
    type: 'inverse',
    dimensions: { width: 75, height: 189, depth: 75 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 340,
        position: { x: 0, y: 30, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 80, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 85, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 90, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 85, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer Inferior',
        type: 'freezer',
        capacity: 114,
        position: { x: 0, y: 0, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-drawer-1', name: 'Gaveta Superior', position: 1, capacity: 57, type: 'drawer' },
          { id: 'freezer-drawer-2', name: 'Gaveta Inferior', position: 2, capacity: 57, type: 'drawer' }
        ]
      }
    ],
    features: ['Inverse', 'Frost Free', 'Turbo Congelamento', 'LED Interior', 'Smart Cool'],
    energy_efficiency: 'A+',
    year: 2023,
    image: 'https://images-americanas.b2w.io/produtos/01/00/item/133529/2/133529287_1GG.jpg'
  },

  // CONSUL - Modelos Populares
  {
    id: 'consul-crm44ab',
    brand: 'Consul',
    model: 'CRM44AB',
    capacity: 344,
    type: 'duplex',
    dimensions: { width: 58, height: 174, depth: 64 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 260,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 65, type: 'wire' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 65, type: 'wire' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 65, type: 'wire' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 65, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer Superior',
        type: 'freezer',
        capacity: 84,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Prateleira do Freezer', position: 1, capacity: 84, type: 'wire' }
        ]
      }
    ],
    features: ['Degelo Automático', 'Economia de Energia', 'Prateleiras Removíveis'],
    energy_efficiency: 'A',
    year: 2022,
    image: 'https://images-americanas.b2w.io/produtos/01/00/item/132780/0/132780062_1GG.jpg'
  },
  {
    id: 'consul-crb53ak',
    brand: 'Consul',
    model: 'CRB53AK',
    capacity: 475,
    type: 'frost_free',
    dimensions: { width: 70, height: 185, depth: 70 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 350,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 85, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio Superior', position: 2, capacity: 85, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Meio Inferior', position: 3, capacity: 85, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 95, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer',
        type: 'freezer',
        capacity: 125,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Gaveta Superior', position: 1, capacity: 65, type: 'drawer' },
          { id: 'freezer-shelf-2', name: 'Gaveta Inferior', position: 2, capacity: 60, type: 'drawer' }
        ]
      }
    ],
    features: ['Frost Free', 'Turbo Congelamento', 'LED Interior', 'Controle Eletrônico'],
    energy_efficiency: 'A',
    year: 2023,
    image: 'https://images-submarino.b2w.io/produtos/01/00/item/133529/8/133529876_1GG.jpg'
  },
  {
    id: 'consul-crm40nb',
    brand: 'Consul',
    model: 'CRM40NB',
    capacity: 312,
    type: 'duplex',
    dimensions: { width: 55, height: 170, depth: 60 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 235,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 60, type: 'wire' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 60, type: 'wire' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 60, type: 'wire' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 55, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer Superior',
        type: 'freezer',
        capacity: 77,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Prateleira do Freezer', position: 1, capacity: 77, type: 'wire' }
        ]
      }
    ],
    features: ['Degelo Automático', 'Economia de Energia', 'Prateleiras Removíveis'],
    energy_efficiency: 'A',
    year: 2022,
    image: 'https://images-americanas.b2w.io/produtos/01/00/item/132780/1/132780113_1GG.jpg'
  },
  {
    id: 'consul-crb39bk',
    brand: 'Consul',
    model: 'CRB39BK',
    capacity: 348,
    type: 'frost_free',
    dimensions: { width: 60, height: 175, depth: 65 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 255,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 65, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 65, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 65, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 60, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer',
        type: 'freezer',
        capacity: 93,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Gaveta Superior', position: 1, capacity: 50, type: 'drawer' },
          { id: 'freezer-shelf-2', name: 'Gaveta Inferior', position: 2, capacity: 43, type: 'drawer' }
        ]
      }
    ],
    features: ['Frost Free', 'Turbo Congelamento', 'LED Interior', 'Controle Eletrônico'],
    energy_efficiency: 'A',
    year: 2023,
    image: 'https://images-americanas.b2w.io/produtos/01/00/item/132780/2/132780127_1GG.jpg'
  },
  {
    id: 'consul-crm53ak',
    brand: 'Consul',
    model: 'CRM53AK',
    capacity: 420,
    type: 'duplex',
    dimensions: { width: 65, height: 180, depth: 70 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 315,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 80, type: 'wire' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 80, type: 'wire' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 80, type: 'wire' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 75, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer Superior',
        type: 'freezer',
        capacity: 105,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Prateleira do Freezer', position: 1, capacity: 105, type: 'wire' }
        ]
      }
    ],
    features: ['Degelo Automático', 'Economia de Energia', 'Prateleiras Removíveis'],
    energy_efficiency: 'A',
    year: 2022,
    image: 'https://images-americanas.b2w.io/produtos/01/00/item/132780/3/132780138_1GG.jpg'
  },
  {
    id: 'consul-crb53ak',
    brand: 'Consul',
    model: 'CRB53AK',
    capacity: 475,
    type: 'frost_free',
    dimensions: { width: 70, height: 185, depth: 70 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 350,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 85, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio Superior', position: 2, capacity: 85, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Meio Inferior', position: 3, capacity: 85, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 95, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer',
        type: 'freezer',
        capacity: 125,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Gaveta Superior', position: 1, capacity: 65, type: 'drawer' },
          { id: 'freezer-shelf-2', name: 'Gaveta Inferior', position: 2, capacity: 60, type: 'drawer' }
        ]
      }
    ],
    features: ['Frost Free', 'Turbo Congelamento', 'LED Interior', 'Controle Eletrônico'],
    energy_efficiency: 'A',
    year: 2023,
    image: 'https://images-submarino.b2w.io/produtos/01/00/item/133529/8/133529876_1GG.jpg'
  },
  {
    id: 'consul-cre44b',
    brand: 'Consul',
    model: 'CRE44B',
    capacity: 397,
    type: 'inverse',
    dimensions: { width: 65, height: 185, depth: 73 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 295,
        position: { x: 0, y: 30, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 75, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 75, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 75, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 70, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer Inferior',
        type: 'freezer',
        capacity: 102,
        position: { x: 0, y: 0, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-drawer-1', name: 'Gaveta Superior', position: 1, capacity: 51, type: 'drawer' },
          { id: 'freezer-drawer-2', name: 'Gaveta Inferior', position: 2, capacity: 51, type: 'drawer' }
        ]
      }
    ],
    features: ['Inverse', 'Duplex', 'Evox Technology', 'Turbo Congelamento', 'LED Interior', 'Controle Digital'],
    energy_efficiency: 'A+',
    year: 2023,
    image: 'https://images-americanas.b2w.io/produtos/01/00/item/132780/4/132780456_1GG.jpg'
  },

  // SAMSUNG - Modelos Populares
  {
    id: 'samsung-rt38k5532s8',
    brand: 'Samsung',
    model: 'RT38K5532S8',
    capacity: 375,
    type: 'frost_free',
    dimensions: { width: 60, height: 185, depth: 67 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 280,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 70, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 70, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 70, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 70, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer',
        type: 'freezer',
        capacity: 95,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Gaveta Superior', position: 1, capacity: 50, type: 'drawer' },
          { id: 'freezer-shelf-2', name: 'Gaveta Inferior', position: 2, capacity: 45, type: 'drawer' }
        ]
      }
    ],
    features: ['Frost Free', 'Digital Inverter', 'Cooling Zone', 'LED Interior', 'SmartThings'],
    energy_efficiency: 'A+',
    year: 2023,
    image: 'https://images.samsung.com/is/image/samsung/br-refrigerators-rt38k5532s8-rt38k5532s8-dk-001-front-black?$720_576_PNG$'
  },
  {
    id: 'samsung-rb38t676fb1',
    brand: 'Samsung',
    model: 'RB38T676FB1',
    capacity: 384,
    type: 'inverse',
    dimensions: { width: 72, height: 185, depth: 72 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 285,
        position: { x: 0, y: 30, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 75, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 75, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 75, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 60, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer Inferior',
        type: 'freezer',
        capacity: 99,
        position: { x: 0, y: 0, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-drawer-1', name: 'Gaveta Superior', position: 1, capacity: 50, type: 'drawer' },
          { id: 'freezer-drawer-2', name: 'Gaveta Inferior', position: 2, capacity: 49, type: 'drawer' }
        ]
      }
    ],
    features: ['Inverse', 'Frost Free', 'Digital Inverter', 'SpaceMax', 'SmartThings'],
    energy_efficiency: 'A++',
    year: 2023,
    image: 'https://images.samsung.com/is/image/samsung/br-refrigerators-rb38t676fb1-rb38t676fb1-dk-001-front-black?$720_576_PNG$'
  },
  {
    id: 'samsung-rt32k5532sl',
    brand: 'Samsung',
    model: 'RT32K5532SL',
    capacity: 314,
    type: 'frost_free',
    dimensions: { width: 60, height: 178, depth: 65 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 235,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 60, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 60, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 60, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 55, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer',
        type: 'freezer',
        capacity: 79,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Gaveta Superior', position: 1, capacity: 40, type: 'drawer' },
          { id: 'freezer-shelf-2', name: 'Gaveta Inferior', position: 2, capacity: 39, type: 'drawer' }
        ]
      }
    ],
    features: ['Frost Free', 'Digital Inverter', 'Cooling Zone', 'LED Interior'],
    energy_efficiency: 'A+',
    year: 2022,
    image: 'https://images.samsung.com/is/image/samsung/br-refrigerators-rt32k5532sl-rt32k5532sl-dk-001-front-silver?$720_576_PNG$'
  },
  {
    id: 'samsung-rt42k5532s8',
    brand: 'Samsung',
    model: 'RT42K5532S8',
    capacity: 415,
    type: 'frost_free',
    dimensions: { width: 70, height: 185, depth: 67 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 310,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 80, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 80, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 80, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 70, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer',
        type: 'freezer',
        capacity: 105,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Gaveta Superior', position: 1, capacity: 55, type: 'drawer' },
          { id: 'freezer-shelf-2', name: 'Gaveta Inferior', position: 2, capacity: 50, type: 'drawer' }
        ]
      }
    ],
    features: ['Frost Free', 'Digital Inverter', 'Cooling Zone', 'LED Interior', 'SmartThings'],
    energy_efficiency: 'A+',
    year: 2023,
    image: 'https://images.samsung.com/is/image/samsung/br-refrigerators-rt42k5532s8-rt42k5532s8-dk-001-front-black?$720_576_PNG$'
  },
  {
    id: 'samsung-rb29t3132s8',
    brand: 'Samsung',
    model: 'RB29T3132S8',
    capacity: 290,
    type: 'inverse',
    dimensions: { width: 60, height: 178, depth: 67 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 215,
        position: { x: 0, y: 30, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 55, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 55, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 55, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 50, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer Inferior',
        type: 'freezer',
        capacity: 75,
        position: { x: 0, y: 0, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-drawer-1', name: 'Gaveta Superior', position: 1, capacity: 38, type: 'drawer' },
          { id: 'freezer-drawer-2', name: 'Gaveta Inferior', position: 2, capacity: 37, type: 'drawer' }
        ]
      }
    ],
    features: ['Inverse', 'Frost Free', 'Digital Inverter', 'SpaceMax'],
    energy_efficiency: 'A+',
    year: 2022,
    image: 'https://images.samsung.com/is/image/samsung/br-refrigerators-rb29t3132s8-rb29t3132s8-dk-001-front-silver?$720_576_PNG$'
  },
  {
    id: 'samsung-rb38t676fb1',
    brand: 'Samsung',
    model: 'RB38T676FB1',
    capacity: 384,
    type: 'inverse',
    dimensions: { width: 72, height: 185, depth: 72 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 285,
        position: { x: 0, y: 30, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 75, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 75, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 75, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 60, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer Inferior',
        type: 'freezer',
        capacity: 99,
        position: { x: 0, y: 0, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-drawer-1', name: 'Gaveta Superior', position: 1, capacity: 50, type: 'drawer' },
          { id: 'freezer-drawer-2', name: 'Gaveta Inferior', position: 2, capacity: 49, type: 'drawer' }
        ]
      }
    ],
    features: ['Inverse', 'Frost Free', 'Digital Inverter', 'SpaceMax', 'SmartThings'],
    energy_efficiency: 'A++',
    year: 2023,
    image: 'https://images.samsung.com/is/image/samsung/br-refrigerators-rb38t676fb1-rb38t676fb1-dk-001-front-black?$720_576_PNG$'
  },

  // LG - Modelos Populares
  {
    id: 'lg-gc-b459sluv',
    brand: 'LG',
    model: 'GC-B459SLUV',
    capacity: 433,
    type: 'frost_free',
    dimensions: { width: 70, height: 185, depth: 73 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 320,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 80, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 80, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 80, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 80, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer',
        type: 'freezer',
        capacity: 113,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Gaveta Superior', position: 1, capacity: 60, type: 'drawer' },
          { id: 'freezer-shelf-2', name: 'Gaveta Inferior', position: 2, capacity: 53, type: 'drawer' }
        ]
      }
    ],
    features: ['Frost Free', 'Smart Cooling', 'LED Interior', 'Door Cooling+', 'SmartThinQ'],
    energy_efficiency: 'A+',
    year: 2023,
    image: 'https://www.lg.com/br/images/refrigeradores/md07535123/gallery/medium01.jpg'
  },
  {
    id: 'lg-gc-b489sbuv',
    brand: 'LG',
    model: 'GC-B489SBUV',
    capacity: 481,
    type: 'inverse',
    dimensions: { width: 83, height: 190, depth: 78 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 360,
        position: { x: 0, y: 30, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 90, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 90, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 90, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 90, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer Inferior',
        type: 'freezer',
        capacity: 121,
        position: { x: 0, y: 0, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-drawer-1', name: 'Gaveta Superior', position: 1, capacity: 60, type: 'drawer' },
          { id: 'freezer-drawer-2', name: 'Gaveta Inferior', position: 2, capacity: 61, type: 'drawer' }
        ]
      }
    ],
    features: ['Inverse', 'Frost Free', 'Smart Cooling', 'InstaView', 'SmartThinQ'],
    energy_efficiency: 'A++',
    year: 2023,
    image: 'https://www.lg.com/br/images/refrigeradores/md07535124/gallery/medium01.jpg'
  },
  {
    id: 'lg-gc-b389sbuv',
    brand: 'LG',
    model: 'GC-B389SBUV',
    capacity: 389,
    type: 'frost_free',
    dimensions: { width: 70, height: 185, depth: 73 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 290,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 75, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 75, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 75, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 65, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer',
        type: 'freezer',
        capacity: 99,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Gaveta Superior', position: 1, capacity: 50, type: 'drawer' },
          { id: 'freezer-shelf-2', name: 'Gaveta Inferior', position: 2, capacity: 49, type: 'drawer' }
        ]
      }
    ],
    features: ['Frost Free', 'Smart Cooling', 'LED Interior', 'Door Cooling+', 'SmartThinQ'],
    energy_efficiency: 'A+',
    year: 2022,
    image: 'https://www.lg.com/br/images/refrigeradores/md07535125/gallery/medium01.jpg'
  },
  {
    id: 'lg-gc-b339sluv',
    brand: 'LG',
    model: 'GC-B339SLUV',
    capacity: 339,
    type: 'frost_free',
    dimensions: { width: 60, height: 185, depth: 68 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 250,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 65, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 65, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 65, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 55, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer',
        type: 'freezer',
        capacity: 89,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Gaveta Superior', position: 1, capacity: 45, type: 'drawer' },
          { id: 'freezer-shelf-2', name: 'Gaveta Inferior', position: 2, capacity: 44, type: 'drawer' }
        ]
      }
    ],
    features: ['Frost Free', 'Smart Cooling', 'LED Interior', 'Door Cooling+'],
    energy_efficiency: 'A+',
    year: 2022,
    image: 'https://www.lg.com/br/images/refrigeradores/md07535126/gallery/medium01.jpg'
  },
  {
    id: 'lg-gc-b429sbuv',
    brand: 'LG',
    model: 'GC-B429SBUV',
    capacity: 429,
    type: 'inverse',
    dimensions: { width: 75, height: 185, depth: 75 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 320,
        position: { x: 0, y: 30, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 85, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 85, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 85, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 65, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer Inferior',
        type: 'freezer',
        capacity: 109,
        position: { x: 0, y: 0, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-drawer-1', name: 'Gaveta Superior', position: 1, capacity: 55, type: 'drawer' },
          { id: 'freezer-drawer-2', name: 'Gaveta Inferior', position: 2, capacity: 54, type: 'drawer' }
        ]
      }
    ],
    features: ['Inverse', 'Frost Free', 'Smart Cooling', 'SmartThinQ'],
    energy_efficiency: 'A+',
    year: 2023,
    image: 'https://www.lg.com/br/images/refrigeradores/md07535127/gallery/medium01.jpg'
  },
  {
    id: 'lg-gc-b489sbuv',
    brand: 'LG',
    model: 'GC-B489SBUV',
    capacity: 481,
    type: 'inverse',
    dimensions: { width: 83, height: 190, depth: 78 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 360,
        position: { x: 0, y: 30, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 90, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 90, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 90, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 90, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer Inferior',
        type: 'freezer',
        capacity: 121,
        position: { x: 0, y: 0, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-drawer-1', name: 'Gaveta Superior', position: 1, capacity: 60, type: 'drawer' },
          { id: 'freezer-drawer-2', name: 'Gaveta Inferior', position: 2, capacity: 61, type: 'drawer' }
        ]
      }
    ],
    features: ['Inverse', 'Frost Free', 'Smart Cooling', 'InstaView', 'SmartThinQ'],
    energy_efficiency: 'A++',
    year: 2023,
    image: 'https://www.lg.com/br/images/refrigeradores/md07535124/gallery/medium01.jpg'
  },

  // ELECTROLUX - Modelos Populares
  {
    id: 'electrolux-df48t',
    brand: 'Electrolux',
    model: 'DF48T',
    capacity: 433,
    type: 'duplex',
    dimensions: { width: 75, height: 188, depth: 75 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 330,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 85, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 85, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 85, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 75, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer Superior',
        type: 'freezer',
        capacity: 103,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Prateleira do Freezer', position: 1, capacity: 103, type: 'wire' }
        ]
      }
    ],
    features: ['Degelo Automático', 'Turbo Congelamento', 'Controle Eletrônico', 'LED Interior'],
    energy_efficiency: 'A',
    year: 2022,
    image: 'https://images-americanas.b2w.io/produtos/01/00/item/132780/1/132780113_1GG.jpg'
  },
  {
    id: 'electrolux-df54x',
    brand: 'Electrolux',
    model: 'DF54X',
    capacity: 540,
    type: 'frost_free',
    dimensions: { width: 83, height: 190, depth: 78 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 400,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 100, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 100, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 100, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 100, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer',
        type: 'freezer',
        capacity: 140,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Gaveta Superior', position: 1, capacity: 70, type: 'drawer' },
          { id: 'freezer-shelf-2', name: 'Gaveta Inferior', position: 2, capacity: 70, type: 'drawer' }
        ]
      }
    ],
    features: ['Frost Free', 'Turbo Congelamento', 'LED Interior', 'Smart Control'],
    energy_efficiency: 'A+',
    year: 2023,
    image: 'https://images-americanas.b2w.io/produtos/01/00/item/132780/2/132780127_1GG.jpg'
  },

  // PANASONIC - Modelos Populares
  {
    id: 'panasonic-wb450s',
    brand: 'Panasonic',
    model: 'WB450S',
    capacity: 432,
    type: 'frost_free',
    dimensions: { width: 75, height: 185, depth: 75 },
    compartments: [
      {
        id: 'fridge-main',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity: 320,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves: [
          { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 80, type: 'glass' },
          { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 80, type: 'glass' },
          { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 80, type: 'glass' },
          { id: 'crisper-1', name: 'Gaveta de Legumes', position: 4, capacity: 80, type: 'drawer' }
        ]
      },
      {
        id: 'freezer-main',
        name: 'Freezer',
        type: 'freezer',
        capacity: 112,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves: [
          { id: 'freezer-shelf-1', name: 'Gaveta Superior', position: 1, capacity: 60, type: 'drawer' },
          { id: 'freezer-shelf-2', name: 'Gaveta Inferior', position: 2, capacity: 52, type: 'drawer' }
        ]
      }
    ],
    features: ['Frost Free', 'ECONAVI', 'Ag Clean', 'LED Interior'],
    energy_efficiency: 'A+',
    year: 2023,
    image: 'https://images-americanas.b2w.io/produtos/01/00/item/132780/3/132780138_1GG.jpg'
  }
];

// Funções de busca estruturada
export class FridgeModelSearchService {
  static searchByBrand(brand: string): FridgeModelSpec[] {
    const normalizedBrand = brand.toLowerCase().trim();
    return FRIDGE_MODELS_DATABASE.filter(model => 
      model.brand.toLowerCase().includes(normalizedBrand)
    );
  }

  static searchByModel(model: string): FridgeModelSpec[] {
    const normalizedModel = model.toLowerCase().trim();
    return FRIDGE_MODELS_DATABASE.filter(model => 
      model.model.toLowerCase().includes(normalizedModel)
    );
  }

  static searchByCapacity(capacity: number, tolerance: number = 20): FridgeModelSpec[] {
    return FRIDGE_MODELS_DATABASE.filter(model => 
      Math.abs(model.capacity - capacity) <= tolerance
    );
  }

  static searchByType(type: 'duplex' | 'frost_free' | 'inverse' | 'compact'): FridgeModelSpec[] {
    return FRIDGE_MODELS_DATABASE.filter(model => model.type === type);
  }

  static searchComprehensive(query: string): FridgeModelSpec[] {
    const normalizedQuery = query.toLowerCase().trim();
    const results = new Set<FridgeModelSpec>();

    // Busca por marca (exata ou parcial)
    FRIDGE_MODELS_DATABASE.forEach(model => {
      if (model.brand.toLowerCase().includes(normalizedQuery)) {
        results.add(model);
      }
    });

    // Busca por modelo (exata ou parcial)
    FRIDGE_MODELS_DATABASE.forEach(model => {
      if (model.model.toLowerCase().includes(normalizedQuery)) {
        results.add(model);
      }
    });

    // Busca por capacidade (se query contém números)
    const capacityMatch = normalizedQuery.match(/\d+/);
    if (capacityMatch) {
      const capacity = parseInt(capacityMatch[0]);
      const capacityResults = this.searchByCapacity(capacity, 50);
      capacityResults.forEach(model => results.add(model));
    }

    return Array.from(results);
  }

  // Busca estruturada por critérios específicos
  static searchByCriteria(criteria: {
    brand?: string;
    model?: string;
    capacity?: number;
    type?: string;
    minCapacity?: number;
    maxCapacity?: number;
  }): FridgeModelSpec[] {
    let results = FRIDGE_MODELS_DATABASE;

    // Filtrar por marca
    if (criteria.brand) {
      const normalizedBrand = criteria.brand.toLowerCase().trim();
      results = results.filter(model => 
        model.brand.toLowerCase().includes(normalizedBrand)
      );
    }

    // Filtrar por modelo
    if (criteria.model) {
      const normalizedModel = criteria.model.toLowerCase().trim();
      results = results.filter(model => 
        model.model.toLowerCase().includes(normalizedModel)
      );
    }

    // Filtrar por capacidade exata
    if (criteria.capacity) {
      results = results.filter(model => 
        Math.abs(model.capacity - criteria.capacity!) <= 20
      );
    }

    // Filtrar por faixa de capacidade
    if (criteria.minCapacity !== undefined || criteria.maxCapacity !== undefined) {
      const min = criteria.minCapacity || 0;
      const max = criteria.maxCapacity || 9999;
      results = results.filter(model => 
        model.capacity >= min && model.capacity <= max
      );
    }

    // Filtrar por tipo
    if (criteria.type) {
      results = results.filter(model => model.type === criteria.type);
    }

    return results;
  }

  // Busca por marca específica
  static searchByBrandExact(brand: string): FridgeModelSpec[] {
    const normalizedBrand = brand.toLowerCase().trim();
    return FRIDGE_MODELS_DATABASE.filter(model => 
      model.brand.toLowerCase() === normalizedBrand
    );
  }

  // Busca por modelo específico
  static searchByModelExact(model: string): FridgeModelSpec[] {
    const normalizedModel = model.toLowerCase().trim();
    return FRIDGE_MODELS_DATABASE.filter(model => 
      model.model.toLowerCase() === normalizedModel
    );
  }

  // Obter modelos populares por marca
  static getPopularModelsByBrand(brand: string, limit: number = 5): FridgeModelSpec[] {
    const brandModels = this.searchByBrandExact(brand);
    // Ordenar por capacidade (mais populares geralmente são os maiores)
    return brandModels
      .sort((a, b) => b.capacity - a.capacity)
      .slice(0, limit);
  }

  // Obter modelos por faixa de capacidade
  static getModelsByCapacityRange(min: number, max: number): FridgeModelSpec[] {
    return FRIDGE_MODELS_DATABASE.filter(model => 
      model.capacity >= min && model.capacity <= max
    ).sort((a, b) => a.capacity - b.capacity);
  }

  // Busca inteligente que só retorna resultados relevantes
  static smartSearch(query: string): FridgeModelSpec[] {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Se a busca for muito curta, não retornar nada
    if (normalizedQuery.length < 2) {
      return [];
    }

    // Verificar se é uma marca conhecida
    const brands = this.getUniqueBrands();
    const exactBrandMatch = brands.find(brand => 
      brand.toLowerCase() === normalizedQuery
    );
    
    if (exactBrandMatch) {
      return this.getPopularModelsByBrand(exactBrandMatch, 8);
    }

    // Verificar se é um modelo conhecido
    const exactModelMatch = FRIDGE_MODELS_DATABASE.find(model => 
      model.model.toLowerCase() === normalizedQuery
    );
    
    if (exactModelMatch) {
      return [exactModelMatch];
    }

    // Verificar se é uma capacidade
    const capacityMatch = normalizedQuery.match(/^\d+$/);
    if (capacityMatch) {
      const capacity = parseInt(capacityMatch[0]);
      return this.getModelsByCapacityRange(capacity - 50, capacity + 50).slice(0, 10);
    }

    // Busca parcial só se tiver pelo menos 3 caracteres
    if (normalizedQuery.length >= 3) {
      return this.searchComprehensive(normalizedQuery).slice(0, 15);
    }

    return [];
  }

  static getUniqueBrands(): string[] {
    return Array.from(new Set(FRIDGE_MODELS_DATABASE.map(model => model.brand))).sort();
  }

  static getUniqueTypes(): Array<{ value: string; label: string }> {
    const types = Array.from(new Set(FRIDGE_MODELS_DATABASE.map(model => model.type)));
    return types.map(type => ({
      value: type,
      label: type.replace('_', ' ').split(' ').map((word: string) => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    }));
  }

  static getCapacityRanges(): Array<{ min: number; max: number; label: string }> {
    return [
      { min: 0, max: 300, label: 'Até 300L' },
      { min: 301, max: 400, label: '301L - 400L' },
      { min: 401, max: 500, label: '401L - 500L' },
      { min: 501, max: 1000, label: 'Acima de 500L' }
    ];
  }

  static getModelById(id: string): FridgeModelSpec | null {
    return FRIDGE_MODELS_DATABASE.find(model => model.id === id) || null;
  }
}
