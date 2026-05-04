import { v4 as uuidv4 } from 'uuid';
import { Product, FridgeModel, Compartment } from '../types';

export const generateId = (): string => uuidv4();

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
    product.category.toLowerCase().includes(normalizedSearch) ||
    product.notes?.toLowerCase().includes(normalizedSearch)
  );
};

export const filterProductsByCategory = (products: Product[], category: string): Product[] => {
  if (category === 'all') return products;
  return products.filter(product => product.category === category);
};

export const getCategories = (products: Product[]): string[] => {
  const categories = products.map(product => product.category);
  return Array.from(new Set(categories)).sort();
};

export const getProductsExpiringSoon = (products: Product[], warningDays: number = 3): Product[] => {
  return products.filter(product => 
    product.expiryDate && isExpiringSoon(product.expiryDate, warningDays)
  );
};

export const getExpiredProducts = (products: Product[]): Product[] => {
  return products.filter(product => 
    product.expiryDate && isExpired(product.expiryDate)
  );
};

export const getLowStockProducts = (products: Product[], threshold: number = 2): Product[] => {
  return products.filter(product => product.quantity <= threshold);
};

export const calculateCompartmentUsage = (products: Product[], compartment: Compartment): number => {
  const compartmentProducts = products.filter(
    product => product.location.compartmentId === compartment.id
  );
  return compartmentProducts.reduce((total, product) => total + product.quantity, 0);
};

export const getFridgeModels = (): FridgeModel[] => {
  return [
    {
      id: '1',
      brand: 'Brastemp',
      model: 'BRE80AK',
      year: 2023,
      capacity: 375,
      compartments: [
        {
          id: 'fridge-main',
          name: 'Geladeira Principal',
          type: 'fridge',
          capacity: 280,
          position: { x: 0, y: 0, width: 100, height: 70 },
          shelves: [
            { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 100 },
            { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 100 },
            { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 80 }
          ]
        },
        {
          id: 'door-main',
          name: 'Porta Geladeira',
          type: 'door',
          capacity: 45,
          position: { x: 0, y: 0, width: 30, height: 100 },
          shelves: [
            { id: 'door-shelf-1', name: 'Prateleira Porta 1', position: 1, capacity: 15 },
            { id: 'door-shelf-2', name: 'Prateleira Porta 2', position: 2, capacity: 15 },
            { id: 'door-shelf-3', name: 'Prateleira Porta 3', position: 3, capacity: 15 }
          ]
        },
        {
          id: 'freezer-main',
          name: 'Freezer',
          type: 'freezer',
          capacity: 50,
          position: { x: 0, y: 70, width: 100, height: 30 },
          shelves: [
            { id: 'freezer-shelf-1', name: 'Prateleira Freezer', position: 1, capacity: 50 }
          ]
        }
      ]
    },
    {
      id: '2',
      brand: 'Consul',
      model: 'CRM40NB',
      year: 2023,
      capacity: 340,
      compartments: [
        {
          id: 'fridge-main',
          name: 'Geladeira Principal',
          type: 'fridge',
          capacity: 260,
          position: { x: 0, y: 0, width: 100, height: 70 },
          shelves: [
            { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 90 },
            { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 90 },
            { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 80 }
          ]
        },
        {
          id: 'door-main',
          name: 'Porta Geladeira',
          type: 'door',
          capacity: 30,
          position: { x: 0, y: 0, width: 30, height: 100 },
          shelves: [
            { id: 'door-shelf-1', name: 'Prateleira Porta 1', position: 1, capacity: 10 },
            { id: 'door-shelf-2', name: 'Prateleira Porta 2', position: 2, capacity: 10 },
            { id: 'door-shelf-3', name: 'Prateleira Porta 3', position: 3, capacity: 10 }
          ]
        },
        {
          id: 'freezer-main',
          name: 'Freezer',
          type: 'freezer',
          capacity: 50,
          position: { x: 0, y: 70, width: 100, height: 30 },
          shelves: [
            { id: 'freezer-shelf-1', name: 'Prateleira Freezer', position: 1, capacity: 50 }
          ]
        }
      ]
    },
    {
      id: '3',
      brand: 'Samsung',
      model: 'RB38T6761S9',
      year: 2023,
      capacity: 408,
      compartments: [
        {
          id: 'fridge-main',
          name: 'Geladeira Principal',
          type: 'fridge',
          capacity: 323,
          position: { x: 0, y: 0, width: 100, height: 70 },
          shelves: [
            { id: 'shelf-1', name: 'Prateleira Superior', position: 1, capacity: 110 },
            { id: 'shelf-2', name: 'Prateleira Meio', position: 2, capacity: 110 },
            { id: 'shelf-3', name: 'Prateleira Inferior', position: 3, capacity: 103 }
          ]
        },
        {
          id: 'door-main',
          name: 'Porta Geladeira',
          type: 'door',
          capacity: 35,
          position: { x: 0, y: 0, width: 30, height: 100 },
          shelves: [
            { id: 'door-shelf-1', name: 'Prateleira Porta 1', position: 1, capacity: 12 },
            { id: 'door-shelf-2', name: 'Prateleira Porta 2', position: 2, capacity: 12 },
            { id: 'door-shelf-3', name: 'Prateleira Porta 3', position: 3, capacity: 11 }
          ]
        },
        {
          id: 'freezer-main',
          name: 'Freezer',
          type: 'freezer',
          capacity: 85,
          position: { x: 0, y: 70, width: 100, height: 30 },
          shelves: [
            { id: 'freezer-shelf-1', name: 'Prateleira Freezer 1', position: 1, capacity: 42 },
            { id: 'freezer-shelf-2', name: 'Prateleira Freezer 2', position: 2, capacity: 43 }
          ]
        }
      ]
    }
  ];
};
