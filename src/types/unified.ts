// Tipos unificados para o Fridge Scanner
// Este arquivo consolida todos os tipos necessários para o projeto

// ===== TIPOS BÁSICOS =====

export interface User {
  id: string;
  email: string;
  name?: string;
  householdId?: string;
  preferences?: UserPreferences;
  onboardingCompleted?: boolean;
  createdAt: Date;
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  shopping: ShoppingPreferences;
  expiry: ExpiryPreferences;
  units: 'metric' | 'imperial';
  language: 'pt-BR' | 'en';
  theme: 'light' | 'dark' | 'auto';
}

export interface NotificationPreferences {
  expiryWarnings: boolean;
  lowStockAlerts: boolean;
  shoppingReminders: boolean;
  weeklyDigest: boolean;
  wastePrevention: boolean;
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

// ===== TIPOS DE RESIDÊNCIA E APARELHOS =====

export interface Household {
  id: string;
  name: string;
  members: User[];
  locations: StorageLocation[];
  appliances: Appliance[];
  settings: HouseholdSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface HouseholdSettings {
  sharedShopping: boolean;
  sharedInventory: boolean;
  allowanceNotifications: boolean;
  defaultAlerts?: boolean;
  temperatureUnit?: 'celsius' | 'fahrenheit' | string;
  inventoryTracking?: boolean;
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
  applianceType?: ApplianceType;
  model?: ApplianceModel;
  locationId: string;
  location?: ApplianceLocation;
  designation?: string;
  positionDescription?: string;
  zones?: StorageZone[];
  settings: ApplianceSettings;
  customSettings?: ApplianceSettings;
  isActive: boolean;
  isPrimary: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApplianceLocation {
  id: string;
  name: string;
  type: 'kitchen' | 'bedroom' | 'garage' | 'dining_room' | 'office' | 'room' | 'area' | 'zone' | 'fridge' | 'freezer' | 'pantry' | 'cabinet' | 'counter' | 'other';
  description?: string;
  parentLocationId?: string;
  subLocations?: ApplianceLocation[];
}

export interface ApplianceType {
  id: string;
  name: string;
  category: 'refrigerator' | 'fridge' | 'freezer' | 'mini_fridge' | 'wine_cooler' | 'beverage_cooler';
  description?: string;
  defaultZones?: StorageZone[];
  defaultCompartments?: string[];
  icon: string;
}

export interface ApplianceModel {
  id: string;
  brand: string;
  model: string;
  year?: number;
  capacity: number;
  compartments?: Compartment[];
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

// ===== TIPOS DE MODELOS DE GELADEIRA =====

export interface FridgeModel {
  id: string;
  name: string;
  brand: string;
  model: string;
  year?: number;
  category: string;
  description: string;
  image?: string;
  compartments: Compartment[];
  capacity: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  features: string[];
}

// Informações básicas do modelo (para API externa)
export interface FridgeModelInfo {
  id: string;
  brand: string;
  model: string;
  year?: number;
  capacity: number;
  image?: string;
  image_url?: string;
  energy_efficiency?: string;
  dimensions?: {
    height: number;
    width: number;
    depth: number;
  };
  features?: string[];
}

export interface Compartment {
  id: string;
  name: string;
  type: CompartmentType;
  capacity: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  temperatureRange?: {
    min: number;
    max: number;
  };
  description?: string;
  shelves?: Shelf[];
}

export type CompartmentType = 
  | 'fridge' 
  | 'freezer' 
  | 'door' 
  | 'drawer' 
  | 'shelf' 
  | 'wine_rack' 
  | 'temperature_zone' 
  | 'beverage_shelf' 
  | 'can_holder' 
  | 'freezer_compartment';

export interface Shelf extends Compartment {
  products: Product[];
}

// ===== TIPOS DE PRODUTOS =====

export interface Product {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  category: string;
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
  status: 'closed' | 'opened' | 'sealed' | 'partially_consumed' | 'finished';
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
  applianceId?: string;
  compartmentId?: string;
  shelfId?: string;
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
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
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

// ===== TIPOS DE LISTA DE COMPRAS =====

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
  estimatedPrice?: number;
  actualPrice?: number;
  storeId?: string;
  notes?: string;
}

export interface ShoppingSuggestion {
  id: string;
  productId: string;
  reason: 'low_stock' | 'expiring_soon' | 'habit' | 'complementary';
  priority: 'low' | 'medium' | 'high';
  suggestedQuantity: number;
  confidence: number;
}

export interface ShoppingBudget {
  totalSpent: number;
  budget: number;
  notes?: string;
}

// ===== TIPOS DE NOTIFICAÇÕES =====

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data?: any;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  actionUrl?: string;
}

export type NotificationType = 
  | 'expiry_alert' 
  | 'low_stock' 
  | 'shopping_reminder' 
  | 'weekly_digest' 
  | 'waste_prevention' 
  | 'system_update';

// ===== TIPOS DE ONBOARDING =====

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'input' | 'selection' | 'confirmation';
  component?: string;
  required: boolean;
  data?: any;
}

export interface OnboardingProgress {
  userId: string;
  currentStep: number;
  completedSteps: string[];
  data: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
}

// ===== TIPOS DE ANÁLISES E INSIGHTS =====

export interface Analytics {
  householdId: string;
  period: AnalyticsPeriod;
  data: AnalyticsData;
}

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface AnalyticsData {
  consumption: ConsumptionAnalytics;
  waste: WasteAnalytics;
  shopping: ShoppingAnalytics;
  savings: SavingsAnalytics;
}

export interface ConsumptionAnalytics {
  totalProducts: number;
  categoriesConsumed: Record<string, number>;
  topConsumedProducts: ProductConsumption[];
  averageDailyConsumption: number;
}

export interface ProductConsumption {
  productId: string;
  productName: string;
  category: string;
  quantityConsumed: number;
  percentageOfTotal: number;
}

export interface WasteAnalytics {
  totalWasted: number;
  wasteByCategory: Record<string, number>;
  wasteValue: number;
  wasteReduction: number;
  topWastedProducts: ProductWaste[];
}

export interface ProductWaste {
  productId: string;
  productName: string;
  category: string;
  quantityWasted: number;
  estimatedValue: number;
  reason: string;
}

export interface ShoppingAnalytics {
  totalSpent: number;
  shoppingTrips: number;
  averageTripCost: number;
  budgetCompliance: number;
  categoriesPurchased: Record<string, number>;
}

export interface SavingsAnalytics {
  totalSavings: number;
  wasteReductionSavings: number;
  planningSavings: number;
  bulkPurchaseSavings: number;
}

// ===== TIPOS DE UTILITÁRIOS =====

export interface ScanResult {
  barcode?: string;
  productInfo?: {
    name?: string;
    category?: string;
    description?: string;
  };
  product?: Product;
  confidence?: number;
  source?: 'barcode' | 'image' | 'manual';
  timestamp?: Date;
}

export interface SearchFilters {
  category?: string;
  location?: string;
  expiryStatus?: 'fresh' | 'expiring_soon' | 'expired';
  quantityRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===== TIPOS DE API E SERVIÇOS =====

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ServiceResponse<T> extends ApiResponse<T> {
  timestamp: Date;
  requestId?: string;
}

// ===== TIPOS DE CONFIGURAÇÃO =====

export interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  features: {
    barcodeScanning: boolean;
    imageRecognition: boolean;
    notifications: boolean;
    analytics: boolean;
  };
  limits: {
    maxProductsPerUser: number;
    maxAppliancesPerHousehold: number;
    maxShoppingLists: number;
  };
}

// User type is exported via 'export interface User' at the top of this file
