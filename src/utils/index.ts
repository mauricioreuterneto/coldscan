import { v4 as uuidv4 } from 'uuid';
import { Product, FridgeModel, Compartment } from '../types/unified';

export const generateId = (): string => uuidv4();

export const getProductCategoryName = (product: Product): string => product.category || 'Outros';

export const getProductQuantity = (product: Product): number => {
  const consumption = product.consumption as Product['consumption'] & {
    current_quantity?: number;
    original_quantity?: number;
  };

  return consumption?.currentQuantity ?? consumption?.current_quantity ?? 0;
};

export const getProductOriginalQuantity = (product: Product): number => {
  const consumption = product.consumption as Product['consumption'] & {
    current_quantity?: number;
    original_quantity?: number;
  };

  return consumption?.originalQuantity ?? consumption?.original_quantity ?? getProductQuantity(product) ?? 1;
};

export const getProductUnit = (product: Product): string => {
  const consumption = product.consumption as Product['consumption'] & { unit?: string };
  return consumption?.unit || product.purchase?.unit || 'unidade';
};

export const getProductLocationId = (product: Product): string | undefined =>
  product.location?.locationId ||
  product.location?.applianceId ||
  product.location?.compartmentId ||
  product.location?.zoneId;

export const getProductZoneId = (product: Product): string | undefined =>
  product.location?.zoneId || product.location?.compartmentId;

export const getProductShelfId = (product: Product): string | undefined =>
  product.location?.position?.shelf || product.location?.shelfId;

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatDateWithTime = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const isExpiringSoon = (expiryDate: Date, warningDays: number = 3): boolean => {
  const today = new Date();
  const warningDate = new Date(today.getTime() + (warningDays * 24 * 60 * 60 * 1000));
  return expiryDate <= warningDate;
};

export const isExpired = (expiryDate: Date): boolean => {
  const today = new Date();
  return expiryDate < today;
};

export const getDaysUntilExpiry = (expiryDate: Date): number => {
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getExpiryStatus = (expiryDate: Date): 'expired' | 'warning' | 'safe' => {
  if (isExpired(expiryDate)) return 'expired';
  if (isExpiringSoon(expiryDate)) return 'warning';
  return 'safe';
};

export const getExpiryStatusColor = (status: 'expired' | 'warning' | 'safe'): string => {
  switch (status) {
    case 'expired': return '#ef4444';
    case 'warning': return '#f59e0b';
    case 'safe': return '#10b981';
    default: return '#6b7280';
  }
};

export const searchProducts = (products: Product[], searchTerm: string): Product[] => {
  const normalizedSearch = searchTerm.toLowerCase();
  return products.filter(product =>
    product.name.toLowerCase().includes(normalizedSearch) ||
    getProductCategoryName(product).toLowerCase().includes(normalizedSearch) ||
    product.notes?.toLowerCase().includes(normalizedSearch)
  );
};

export const filterProductsByCategory = (products: Product[], category: string): Product[] => {
  if (category === 'all') return products;
  return products.filter(product => getProductCategoryName(product) === category);
};

export const getCategories = (products: Product[]): string[] => {
  const categories = products.map(product => getProductCategoryName(product));
  return Array.from(new Set(categories)).sort();
};

export const getProductsExpiringSoon = (products: Product[], warningDays: number = 3): Product[] => {
  return products.filter(product => {
    const expiryDate = product.expiry?.sealedExpiryDate;
    return expiryDate ? isExpiringSoon(new Date(expiryDate), warningDays) : false;
  });
};

export const getExpiredProducts = (products: Product[]): Product[] => {
  return products.filter(product => {
    const expiryDate = product.expiry?.sealedExpiryDate;
    return expiryDate ? isExpired(new Date(expiryDate)) : false;
  });
};

export const getLowStockProducts = (products: Product[], threshold: number = 2): Product[] => {
  return products.filter(product => getProductQuantity(product) <= threshold);
};

export const calculateCompartmentUsage = (products: Product[], compartment: Compartment): number => {
  const compartmentProducts = products.filter(
    product => getProductZoneId(product) === compartment.id
  );
  return compartmentProducts.reduce((total, product) => total + getProductQuantity(product), 0);
};

export const getFridgeModels = (): FridgeModel[] => {
  return [
    {
      id: '1',
      name: 'Brastemp BRE80AK',
      brand: 'Brastemp',
      model: 'BRE80AK',
      category: 'refrigerator',
      description: 'Geladeira Brastemp modelo BRE80AK com compartimentos integrados',
      year: 2023,
      capacity: 375,
      dimensions: {
        width: 60,
        height: 170,
        depth: 65
      },
      features: ['Frost Free', 'LED', 'Compartimento Extra Frio'],
      compartments: [
        {
          id: 'fridge-main',
          name: 'Geladeira Principal',
          type: 'fridge',
          capacity: 280,
          position: { x: 0, y: 0, width: 100, height: 70 },
          shelves: [
            { id: 'shelf-1', name: 'Prateleira Superior', type: 'shelf', position: { x: 0, y: 0, width: 100, height: 20 }, capacity: 100, products: [] },
            { id: 'shelf-2', name: 'Prateleira Meio', type: 'shelf', position: { x: 0, y: 20, width: 100, height: 20 }, capacity: 100, products: [] },
            { id: 'shelf-3', name: 'Prateleira Inferior', type: 'shelf', position: { x: 0, y: 40, width: 100, height: 20 }, capacity: 80, products: [] }
          ]
        },
        {
          id: 'door-main',
          name: 'Porta Geladeira',
          type: 'door',
          capacity: 45,
          position: { x: 0, y: 0, width: 30, height: 100 },
          shelves: [
            { id: 'door-shelf-1', name: 'Prateleira Porta 1', type: 'shelf', position: { x: 0, y: 0, width: 30, height: 24 }, capacity: 15, products: [] },
            { id: 'door-shelf-2', name: 'Prateleira Porta 2', type: 'shelf', position: { x: 0, y: 24, width: 30, height: 24 }, capacity: 15, products: [] },
            { id: 'door-shelf-3', name: 'Prateleira Porta 3', type: 'shelf', position: { x: 0, y: 48, width: 30, height: 24 }, capacity: 15, products: [] }
          ]
        },
        {
          id: 'freezer-main',
          name: 'Freezer',
          type: 'freezer',
          capacity: 50,
          position: { x: 0, y: 70, width: 100, height: 30 },
          shelves: [
            { id: 'freezer-shelf-1', name: 'Prateleira Freezer', type: 'shelf', position: { x: 0, y: 70, width: 100, height: 30 }, capacity: 50, products: [] }
          ]
        }
      ]
    },
    {
      id: '2',
      name: 'Consul CRM40NB',
      brand: 'Consul',
      model: 'CRM40NB',
      category: 'refrigerator',
      description: 'Geladeira Consul modelo CRM40NB com design moderno e espaçoso',
      year: 2023,
      capacity: 340,
      dimensions: {
        width: 58,
        height: 165,
        depth: 63
      },
      features: ['Frost Free', 'Prateleiras Dinâmicas', 'Compartimento Smart'],
      compartments: [
        {
          id: 'fridge-main',
          name: 'Geladeira Principal',
          type: 'fridge',
          capacity: 260,
          position: { x: 0, y: 0, width: 100, height: 70 },
          shelves: [
            { id: 'shelf-1', name: 'Prateleira Superior', type: 'shelf', position: { x: 0, y: 0, width: 100, height: 20 }, capacity: 90, products: [] },
            { id: 'shelf-2', name: 'Prateleira Meio', type: 'shelf', position: { x: 0, y: 20, width: 100, height: 20 }, capacity: 90, products: [] },
            { id: 'shelf-3', name: 'Prateleira Inferior', type: 'shelf', position: { x: 0, y: 40, width: 100, height: 20 }, capacity: 80, products: [] }
          ]
        },
        {
          id: 'door-main',
          name: 'Porta Geladeira',
          type: 'door',
          capacity: 30,
          position: { x: 0, y: 0, width: 30, height: 100 },
          shelves: [
            { id: 'door-shelf-1', name: 'Prateleira Porta 1', type: 'shelf', position: { x: 0, y: 0, width: 30, height: 24 }, capacity: 10, products: [] },
            { id: 'door-shelf-2', name: 'Prateleira Porta 2', type: 'shelf', position: { x: 0, y: 24, width: 30, height: 24 }, capacity: 10, products: [] },
            { id: 'door-shelf-3', name: 'Prateleira Porta 3', type: 'shelf', position: { x: 0, y: 48, width: 30, height: 24 }, capacity: 10, products: [] }
          ]
        },
        {
          id: 'freezer-main',
          name: 'Freezer',
          type: 'freezer',
          capacity: 50,
          position: { x: 0, y: 70, width: 100, height: 30 },
          shelves: [
            { id: 'freezer-shelf-1', name: 'Prateleira Freezer', type: 'shelf', position: { x: 0, y: 70, width: 100, height: 30 }, capacity: 50, products: [] }
          ]
        }
      ]
    },
    {
      id: '3',
      name: 'Samsung RB38T6761S9',
      brand: 'Samsung',
      model: 'RB38T6761S9',
      category: 'side-by-side',
      description: 'Geladeira Samsung premium modelo RB38T6761S9 com capacidade expandida',
      year: 2023,
      capacity: 408,
      dimensions: {
        width: 91,
        height: 175,
        depth: 70
      },
      features: ['Frost Free', 'Family Hub', 'SpaceMax', 'Inverter Compressor'],
      compartments: [
        {
          id: 'fridge-main',
          name: 'Geladeira Principal',
          type: 'fridge',
          capacity: 323,
          position: { x: 0, y: 0, width: 100, height: 70 },
          shelves: [
            { id: 'shelf-1', name: 'Prateleira Superior', type: 'shelf', position: { x: 0, y: 0, width: 100, height: 20 }, capacity: 110, products: [] },
            { id: 'shelf-2', name: 'Prateleira Meio', type: 'shelf', position: { x: 0, y: 20, width: 100, height: 20 }, capacity: 110, products: [] },
            { id: 'shelf-3', name: 'Prateleira Inferior', type: 'shelf', position: { x: 0, y: 40, width: 100, height: 20 }, capacity: 103, products: [] }
          ]
        },
        {
          id: 'door-main',
          name: 'Porta Geladeira',
          type: 'door',
          capacity: 35,
          position: { x: 0, y: 0, width: 30, height: 100 },
          shelves: [
            { id: 'door-shelf-1', name: 'Prateleira Porta 1', type: 'shelf', position: { x: 0, y: 0, width: 30, height: 24 }, capacity: 12, products: [] },
            { id: 'door-shelf-2', name: 'Prateleira Porta 2', type: 'shelf', position: { x: 0, y: 24, width: 30, height: 24 }, capacity: 12, products: [] },
            { id: 'door-shelf-3', name: 'Prateleira Porta 3', type: 'shelf', position: { x: 0, y: 48, width: 30, height: 24 }, capacity: 11, products: [] }
          ]
        },
        {
          id: 'freezer-main',
          name: 'Freezer',
          type: 'freezer',
          capacity: 85,
          position: { x: 0, y: 70, width: 100, height: 30 },
          shelves: [
            { id: 'freezer-shelf-1', name: 'Prateleira Freezer 1', type: 'shelf', position: { x: 0, y: 70, width: 100, height: 15 }, capacity: 42, products: [] },
            { id: 'freezer-shelf-2', name: 'Prateleira Freezer 2', type: 'shelf', position: { x: 0, y: 85, width: 100, height: 15 }, capacity: 43, products: [] }
          ]
        }
      ]
    }
  ];
};
