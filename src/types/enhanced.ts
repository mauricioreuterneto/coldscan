// TIPOS REDESIGNADOS PARA EXPERIÊNCIA REAL DO USUÁRIO

export interface User {
  id: string;
  email: string;
  name: string;
  householdId: string;
  preferences: UserPreferences;
  onboardingCompleted: boolean;
  createdAt: Date;
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  shopping: ShoppingPreferences;
  expiry: ExpiryPreferences;
  units: 'metric' | 'imperial';
  language: 'pt-BR' | 'en';
}

export interface NotificationPreferences {
  expiryWarnings: boolean;
  lowStockAlerts: boolean;
  shoppingReminders: boolean;
  weeklyDigest: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
}

export interface ShoppingPreferences {
  autoSuggest: boolean;
  favoriteStores: Store[];
  budgetAlerts: boolean;
  monthlyBudget?: number;
}

export interface ExpiryPreferences {
  defaultDays: {
    sealed: number;
    opened: number;
  };
  customRules: ExpiryRule[];
}

export interface ExpiryRule {
  categoryId: string;
  productName?: string;
  sealedDays: number;
  openedDays: number;
}

export interface Store {
  id: string;
  name: string;
  address?: string;
  isFavorite: boolean;
}

export interface Household {
  id: string;
  name: string;
  members: User[];
  locations: StorageLocation[];
  appliances: Appliance[];
  settings: HouseholdSettings;
}

export interface HouseholdSettings {
  sharedShopping: boolean;
  sharedInventory: boolean;
  allowanceNotifications: boolean;
}

export interface StorageLocation {
  id: string;
  name: string;
  type: 'fridge' | 'freezer' | 'pantry' | 'cabinet' | 'counter' | 'other';
  description?: string;
  temperature?: {
    min: number;
    max: number;
    unit: 'C' | 'F';
  };
  zones?: StorageZone[];
  parentId?: string;
}

export interface StorageZone {
  id: string;
  name: string;
  description?: string;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  preferredCategories: string[];
}

export interface Appliance {
  id: string;
  name: string;
  type: ApplianceType;
  model?: ApplianceModel;
  locationId: string;
  zones?: StorageZone[];
  settings: ApplianceSettings;
  isActive: boolean;
  isPrimary: boolean;
}

export interface ApplianceType {
  id: string;
  name: string;
  category: 'refrigerator' | 'freezer' | 'wine_cooler' | 'beverage_cooler';
  defaultZones: StorageZone[];
  icon: string;
}

export interface ApplianceModel {
  id: string;
  brand: string;
  model: string;
  year?: number;
  capacity: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  energyRating?: string;
  imageUrl?: string;
}

export interface ApplianceSettings {
  targetTemperature?: number;
  alertsEnabled: boolean;
  maintenanceReminder?: Date;
  ecoMode: boolean;
}

// PRODUTO REDESIGNADO - O CORAÇÃO DO SISTEMA
export interface Product {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  category: ProductCategory;
  image?: string;
  
  // ESTADO E CONSUMO
  currentState: ProductState;
  consumption: ConsumptionTracking;
  
  // LOCALIZAÇÃO
  location: ProductLocation;
  
  // VALIDADE
  expiry: ExpiryInfo;
  
  // COMPRA
  purchase: PurchaseInfo;
  
  // METADADOS
  tags: string[];
  notes?: string;
  nutritionalInfo?: NutritionalInfo;
  
  // SISTEMA
  createdAt: Date;
  updatedAt: Date;
  householdId: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  parentCategoryId?: string;
  defaultExpiryRules: ExpiryRule;
  storagePreferences: StoragePreference[];
}

export interface StoragePreference {
  locationType: StorageLocation['type'];
  temperature?: {
    min: number;
    max: number;
  };
  humidity?: 'low' | 'medium' | 'high';
  lightSensitive: boolean;
}

export interface ProductState {
  status: 'sealed' | 'opened' | 'partially_consumed' | 'finished';
  openedAt?: Date;
  lastConsumedAt?: Date;
  remainingPercentage?: number;
  condition: 'fresh' | 'starting_to_expire' | 'expiring_soon' | 'expired';
}

export interface ConsumptionTracking {
  originalQuantity: number;
  currentQuantity: number;
  unit: string;
  consumptionHistory: ConsumptionRecord[];
  averageConsumptionPerDay?: number;
  estimatedDepletionDate?: Date;
}

export interface ConsumptionRecord {
  date: Date;
  quantityConsumed: number;
  reason: 'consumption' | 'waste' | 'donation' | 'other';
  notes?: string;
}

export interface ProductLocation {
  locationId: string;
  locationName: string;
  zoneId?: string;
  zoneName?: string;
  position?: {
    shelf?: string;
    section?: string;
    coordinates?: { x: number; y: number };
  };
}

export interface ExpiryInfo {
  sealedExpiryDate?: Date;
  openedExpiryDate?: Date;
  bestBeforeDate?: Date;
  freezeByDate?: Date;
  daysUntilExpiry: number;
  expiryType: 'sealed' | 'opened' | 'best_before' | 'freeze_by';
  isExpiringSoon: boolean;
  isExpired: boolean;
  customExpiryRule?: ExpiryRule;
}

export interface PurchaseInfo {
  storeId?: string;
  storeName?: string;
  purchaseDate: Date;
  price?: number;
  currency?: string;
  quantity: number;
  unit: string;
  receiptImage?: string;
  warrantyInfo?: WarrantyInfo;
}

export interface WarrantyInfo {
  startDate: Date;
  endDate: Date;
  type: 'manufacturer' | 'store' | 'extended';
  coverage: string[];
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  servingSize: string;
  allergens: string[];
}

// LISTA DE COMPRAS INTELIGENTE
export interface ShoppingList {
  id: string;
  name: string;
  householdId: string;
  createdBy: string;
  status: 'draft' | 'active' | 'shopping' | 'completed';
  storeId?: string;
  budget?: number;
  currency?: string;
  items: ShoppingItem[];
  suggestions: ShoppingSuggestion[];
  createdAt: Date;
  updatedAt: Date;
  plannedFor?: Date;
  completedAt?: Date;
}

export interface ShoppingItem {
  id: string;
  productId?: string;
  name: string;
  category: ProductCategory;
  quantity: number;
  unit: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_cart' | 'purchased' | 'not_found';
  price?: number;
  estimatedPrice?: number;
  notes?: string;
  alternatives?: string[];
  barcode?: string;
  addedAt: Date;
  purchasedAt?: Date;
  purchasedQuantity?: number;
  purchasedPrice?: number;
}

export interface ShoppingSuggestion {
  productId: string;
  productName: string;
  reason: SuggestionReason;
  priority: number;
  estimatedPrice?: number;
  confidence: number;
}

export interface SuggestionReason {
  type: 'low_stock' | 'expiring_soon' | 'habitual' | 'seasonal' | 'recipe';
  description: string;
  metadata?: any;
}

// MODO MERCADO (MOBILE-FIRST)
export interface ShoppingMode {
  isActive: boolean;
  listId: string;
  storeId?: string;
  startTime: Date;
  estimatedBudget?: number;
  currentSpent: number;
  itemsChecked: number;
  totalItems: number;
  voiceMode: boolean;
  barcodeScanning: boolean;
}

// NOTIFICAÇÕES INTELIGENTES
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  actionUrl?: string;
  metadata?: any;
}

export type NotificationType = 
  | 'product_expiring'
  | 'product_expired'
  | 'low_stock'
  | 'shopping_reminder'
  | 'price_alert'
  | 'warranty_expiring'
  | 'maintenance_reminder'
  | 'weekly_digest'
  | 'recipe_suggestion';

// INSIGHTS E ANÁLISES
export interface FoodWasteReport {
  period: 'week' | 'month' | 'quarter' | 'year';
  wastedItems: WasteItem[];
  totalWasteValue: number;
  wasteByCategory: CategoryWaste[];
  recommendations: WasteReductionTip[];
  trend: 'improving' | 'stable' | 'worsening';
}

export interface WasteItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  reason: 'expired' | 'spoiled' | 'forgotten' | 'overbought';
  estimatedValue: number;
  wasteDate: Date;
}

export interface CategoryWaste {
  categoryId: string;
  categoryName: string;
  wastePercentage: number;
  totalValue: number;
  itemsCount: number;
}

export interface WasteReductionTip {
  type: 'storage' | 'quantity' | 'shopping' | 'consumption';
  title: string;
  description: string;
  potentialSavings: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

// ONBOARDING E FIRST RUN
export interface OnboardingStep {
  id: string;
  type: 'welcome' | 'household_setup' | 'appliance_setup' | 'first_products' | 'preferences';
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  completedAt?: Date;
}

export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  isCompleted: boolean;
  completedAt?: Date;
}

// ESTADOS DA APLICAÇÃO
export interface AppState {
  user: User | null;
  household: Household | null;
  currentLocation: StorageLocation | null;
  shoppingMode: ShoppingMode;
  notifications: Notification[];
  onboarding: OnboardingProgress;
  lastSync: Date;
  isOnline: boolean;
}

// UTILITÁRIOS
export interface SearchFilters {
  categories: string[];
  locations: string[];
  status: ProductState['status'][];
  expiryRange: {
    min: number;
    max: number;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  tags: string[];
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  type: 'primary' | 'secondary';
  requiresAuth?: boolean;
}
