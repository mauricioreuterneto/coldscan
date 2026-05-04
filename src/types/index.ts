export interface FridgeModel {
  id: string;
  brand: string;
  model: string;
  year?: number;
  capacity: number;
  compartments: Compartment[];
  imageUrl?: string;
}

export interface Compartment {
  id: string;
  name: string;
  type: 'fridge' | 'freezer' | 'door' | 'drawer' | 'crisper' | 'deli_drawer' | 'ice_maker' | 'water_dispenser';
  capacity: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  shelves?: Shelf[];
}

// Re-adicionar FridgeModelInfo para compatibilidade
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
  compartments?: Compartment[]; // Adicionar para compatibilidade
  type?: string; // Adicionar para compatibilidade
}

// Novos tipos para múltiplos aparelhos
export interface ApplianceType {
  id: string;
  name: string;
  category: 'fridge' | 'freezer' | 'mini_fridge' | 'wine_cooler' | 'beverage_cooler' | 'commercial';
  description: string;
  icon: string;
  defaultCompartments: string[];
}

export interface ApplianceLocation {
  id: string;
  name: string;
  type: 'room' | 'area' | 'zone';
  description?: string;
  parentLocationId?: string;
  subLocations?: ApplianceLocation[];
}

export interface RefrigerationAppliance {
  id: string;
  name: string; // Nome personalizado (ex: "Geladeira da Cozinha")
  designation?: string; // Designação específica (ex: "Geladeira Principal", "Bebidas")
  applianceType: ApplianceType;
  model: FridgeModel;
  location: ApplianceLocation;
  position?: {
    description: string; // ex: "Ao lado da janela", "Embaixo da bancada"
    coordinates?: { x: number; y: number }; // Para layout visual
  };
  isActive: boolean;
  isPrimary: boolean; // Aparelho principal para notificações
  customSettings?: {
    temperatureTarget?: number;
    alertsEnabled: boolean;
    maintenanceReminder?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Household {
  id: string;
  name: string;
  locations: ApplianceLocation[];
  appliances: RefrigerationAppliance[];
  primaryApplianceId?: string;
  settings: {
    defaultAlerts: boolean;
    temperatureUnit: 'celsius' | 'fahrenheit';
    inventoryTracking: boolean;
  };
}

export interface Shelf {
  id: string;
  name: string;
  position: number;
  capacity: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate?: Date;
  purchaseDate?: Date;
  imageUrl?: string;
  barcode?: string;
  location: {
    applianceId: string; // ID do aparelho específico
    compartmentId: string;
    shelfId?: string;
    position?: {
      x: number;
      y: number;
    };
  };
  notes?: string;
}

export interface ShoppingListItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  unit: string;
  purchased: boolean;
}

export interface NotificationSettings {
  expiryWarnings: boolean;
  warningDays: number;
  lowStockWarnings: boolean;
  lowStockThreshold: number;
}

export interface AppSettings {
  fridgeModel: FridgeModel | null;
  notifications: NotificationSettings;
  theme: 'light' | 'dark';
}

export interface ScanResult {
  barcode: string;
  productInfo?: {
    name: string;
    category: string;
    description?: string;
  };
}
