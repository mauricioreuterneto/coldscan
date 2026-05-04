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
  type: 'fridge' | 'freezer' | 'door';
  capacity: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  shelves?: Shelf[];
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
