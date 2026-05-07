// Model Discovery Workflow Types

export interface ModelIdentifier {
  brand: string;
  model: string;
  year?: number;
}

export interface FridgeModelUserFocused {
  // Identificação
  id: string;
  brand: string;
  model: string;
  year?: number;
  imageUrl?: string;
  
  // Dados técnicos úteis
  type: 'fridge' | 'frigobar' | 'freezer' | 'wine-cooler';
  totalCapacity: number; // litros
  
  // Consumo elétrico
  energy: {
    monthlyKwh: number;
    efficiency: 'A' | 'B' | 'C' | 'D' | 'E';
    voltage: '110V' | '220V' | 'bivolt';
  };
  
  // Dimensões externas (para saber se cabe na cozinha)
  dimensions: {
    width: number;   // mm
    height: number;  // mm
    depth: number;   // mm
    weight: number;  // kg
  };
  
  // Layout interno (para saber onde colocar cada alimento)
  compartments: Compartment[];
}

export interface Compartment {
  id: string;
  name: string;
  type: 'fridge' | 'freezer' | 'door-compartment';
  capacity: number; // litros
  temperature: { min: number; max: number; unit: 'C' };
  idealFor: string[]; // ['legumes', 'bebidas', 'carnes', etc]
  
  // Para visualização 3D
  shelves: Shelf[];
  drawers: Drawer[];
  doorCompartments: DoorCompartment[];
}

export interface Shelf {
  id: string;
  height: number; // mm do chão
  capacity: number; // litros
}

export interface Drawer {
  id: string;
  height: number; // mm do chão
  capacity: number; // litros
  transparent?: boolean;
}

export interface DoorCompartment {
  id: string;
  height: number; // mm do topo
  capacity: number; // litros
}

export interface ProcessedFridgeModel extends FridgeModelUserFocused {
  processingMetadata: ProcessingMetadata;
}

export interface ProcessingMetadata {
  sources: string[];
  normalizedAt: string;
  fallbacksApplied: string[];
  validatedAt: string;
  crowdSourced: boolean;
  completeness: number; // 0-1
  adminApproved: boolean;
  approvedAt?: string;
}

// Discovery Workflow Steps
export type DiscoveryStep = 
  | 'user_input'
  | 'ocr_attempt'
  | 'multi_photo_discovery'
  | 'manual_input'
  | 'api_search'
  | 'normalize'
  | 'validate'
  | 'crowd_source'
  | 'admin_review'
  | 'insert_database'
  | 'completed'
  | 'failed';

export interface DiscoveryWorkflow {
  modelIdentifier: ModelIdentifier;
  currentStep: DiscoveryStep;
  progress: number; // 0-100
  data: Partial<FridgeModelUserFocused>;
  sources: APISource[];
  errors: string[];
  warnings: string[];
  photos?: string[];
  userValidations?: UserValidation;
}

export interface APISource {
  source: string; // 'manufacturer-api', 'scraping', 'google-shopping', 'manual'
  rawData: any;
  confidence: number; // 0-1, confiança na fonte
  timestamp: string;
}

export interface UserValidation {
  userId: string;
  confirmed: boolean;
  corrections?: Partial<FridgeModelUserFocused>;
  photos?: string[];
  timestamp: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completeness: number; // 0-1
}

// Crowd-sourcing - Validação restrita ao usuário
export interface UserFridgeCustomization {
  userId: string;
  baseModelId: string; // modelo original do fabricante
  customizations: {
    layout: CompartmentLayout[];
    removedShelves: string[];
    addedShelves: CustomShelf[];
    spacingAdjustments: ShelfSpacing[];
  };
  applianceAge: number; // anos
  photos?: string[];
  submittedAt: string;
}

export interface CompartmentLayout {
  compartmentId: string;
  shelfCount: number;
  drawerCount: number;
  doorCompartmentCount: number;
}

export interface CustomShelf {
  id: string;
  compartmentId: string;
  height: number;
  capacity: number;
}

export interface ShelfSpacing {
  shelfId: string;
  newHeight: number;
}

// OCR Result
export interface OCRResult {
  success: boolean;
  identifier: ModelIdentifier | null;
  confidence: number;
  text: string;
  errors?: string[];
}

// Multi-photo Discovery
export interface PhotoDiscoveryRequest {
  labelPhoto?: File;
  fullFrontPhoto?: File;
  fullSidePhoto?: File;
  modelNumberPhoto?: File;
}

export interface PhotoDiscoveryResult {
  identifier?: ModelIdentifier;
  confidence: number;
  method: 'label' | 'full_front' | 'full_side' | 'model_number' | 'manual' | 'combined';
  needsMorePhotos?: boolean;
}
