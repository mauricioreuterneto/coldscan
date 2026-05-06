import { Compartment, Shelf } from '../types/unified';

export interface PhotoAnalysisResult {
  compartments: DetectedCompartment[];
  confidence: number;
  processingTime: number;
  metadata: {
    imageDimensions: { width: number; height: number };
    detectedFeatures: string[];
    quality: 'high' | 'medium' | 'low';
  };
}

export interface DetectedCompartment {
  id: string;
  name: string;
  type: 'fridge' | 'freezer' | 'door' | 'drawer' | 'crisper' | 'deli_drawer' | 'unknown';
  position: { x: number; y: number; width: number; height: number };
  confidence: number;
  estimatedCapacity?: number;
  detectedShelves?: number;
  features: string[];
}

export interface ManualAnalysisResult {
  extractedLayout: Compartment[];
  specifications: {
    totalCapacity: number;
    dimensions: { height: number; width: number; depth: number };
    energyClass: string;
    frostType: string;
    features: string[];
  };
  confidence: number;
  source: 'manual_pdf' | 'specification_sheet' | 'user_manual';
}

class PhotoAnalysisService {
  private readonly API_ENDPOINT = 'https://api.vision.ai/analyze'; // Placeholder
  private readonly TESSERACT_ENDPOINT = 'https://api.ocr.text/extract'; // Placeholder

  // Analisar foto da geladeira para detectar compartimentos
  async analyzeFridgePhoto(imageFile: File): Promise<PhotoAnalysisResult> {
    const startTime = Date.now();

    try {
      // 1. Pré-processamento da imagem
      const processedImage = await this.preprocessImage(imageFile);
      
      // 2. Detecção de objetos usando Computer Vision
      const detectedObjects = await this.detectObjects(processedImage);
      
      // 3. Análise de layout
      const compartments = await this.analyzeLayoutFromObjects(detectedObjects);
      
      // 4. Estimativa de capacidades
      const compartmentsWithCapacity = await this.estimateCapacities(compartments, processedImage);
      
      const processingTime = Date.now() - startTime;
      
      return {
        compartments: compartmentsWithCapacity,
        confidence: this.calculateOverallConfidence(compartmentsWithCapacity),
        processingTime,
        metadata: {
          imageDimensions: { width: processedImage.width, height: processedImage.height },
          detectedFeatures: this.extractDetectedFeatures(compartmentsWithCapacity),
          quality: this.assessImageQuality(processedImage)
        }
      };
    } catch (error) {
      console.error('Erro na análise de foto:', error);
      throw new Error('Falha ao analisar foto da geladeira');
    }
  }

  // Analisar manual PDF/specifications
  async analyzeManualDocument(documentFile: File): Promise<ManualAnalysisResult> {
    try {
      // 1. Extrair texto do documento
      const extractedText = await this.extractTextFromDocument(documentFile);
      
      // 2. Identificar especificações técnicas
      const specifications = this.extractSpecifications(extractedText);
      
      // 3. Detectar descrição de layout
      const layoutDescription = this.extractLayoutDescription(extractedText);
      
      // 4. Converter para compartimentos
      const compartments = this.convertDescriptionToCompartments(layoutDescription, specifications);
      
      return {
        extractedLayout: compartments,
        specifications,
        confidence: this.calculateManualConfidence(extractedText),
        source: this.detectDocumentType(documentFile, extractedText)
      };
    } catch (error) {
      console.error('Erro na análise de manual:', error);
      throw new Error('Falha ao analisar documento do manual');
    }
  }

  // Pré-processamento de imagem
  private async preprocessImage(imageFile: File): Promise<ImageData> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Redimensionar para tamanho padrão
        const maxSize = 1024;
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Aplicar filtros para melhorar detecção
        ctx.filter = 'contrast(1.2) brightness(1.1)';
        ctx.drawImage(img, 0, 0, width, height);
        
        resolve(ctx.getImageData(0, 0, width, height));
      };
      img.src = URL.createObjectURL(imageFile);
    });
  }

  // Detecção de objetos usando Computer Vision
  private async detectObjects(imageData: ImageData): Promise<any[]> {
    // Simulação de API de Computer Vision
    // Em produção, usaria TensorFlow.js, OpenCV.js ou API externa
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simular detecção de compartimentos
        const mockObjects = [
          {
            type: 'compartment',
            bbox: { x: 10, y: 10, width: 80, height: 60 },
            confidence: 0.85,
            features: ['shelves_visible', 'door_handle']
          },
          {
            type: 'compartment',
            bbox: { x: 10, y: 70, width: 80, height: 25 },
            confidence: 0.90,
            features: ['freezer_compartment', 'ice_tray']
          },
          {
            type: 'door',
            bbox: { x: 5, y: 10, width: 10, height: 85 },
            confidence: 0.75,
            features: ['door_shelves', 'handle']
          }
        ];
        resolve(mockObjects);
      }, 1000);
    });
  }

  // Análise de layout a partir dos objetos detectados
  private async analyzeLayoutFromObjects(objects: any[]): Promise<DetectedCompartment[]> {
    const compartments: DetectedCompartment[] = [];

    objects.forEach((obj, index) => {
      const compartment: DetectedCompartment = {
        id: `detected-${index}`,
        name: this.generateCompartmentName(obj),
        type: this.classifyCompartmentType(obj),
        position: {
          x: obj.bbox.x,
          y: obj.bbox.y,
          width: obj.bbox.width,
          height: obj.bbox.height
        },
        confidence: obj.confidence,
        detectedShelves: this.countShelves(obj.features),
        features: obj.features
      };

      compartments.push(compartment);
    });

    return compartments;
  }

  // Estimar capacidades baseado na análise visual
  private async estimateCapacities(
    compartments: DetectedCompartment[], 
    imageData: ImageData
  ): Promise<DetectedCompartment[]> {
    const totalArea = imageData.width * imageData.height;
    
    return compartments.map(comp => {
      const compartmentArea = comp.position.width * comp.position.height;
      const areaRatio = compartmentArea / totalArea;
      
      // Estimativa baseada em área média e tipo
      let estimatedCapacity: number;
      
      switch (comp.type) {
        case 'fridge':
          estimatedCapacity = Math.round(areaRatio * 400); // até 400L para geladeira
          break;
        case 'freezer':
          estimatedCapacity = Math.round(areaRatio * 150); // até 150L para freezer
          break;
        case 'door':
          estimatedCapacity = Math.round(areaRatio * 40); // até 40L para porta
          break;
        case 'drawer':
        case 'crisper':
          estimatedCapacity = Math.round(areaRatio * 60); // até 60L para gavetas
          break;
        default:
          estimatedCapacity = Math.round(areaRatio * 100);
      }

      return {
        ...comp,
        estimatedCapacity
      };
    });
  }

  // Extrair texto de documento (PDF, imagem)
  private async extractTextFromDocument(documentFile: File): Promise<string> {
    // Simulação de OCR
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockText = `
          CAPACIDADE TOTAL: 450L
          DIMENSÕES: 180 x 60 x 65 cm
          CLASSE ENERGÉTICA: A
          SISTEMA DE DEGELO: Frost Free
          
          ESPECIFICAÇÕES:
          - Geladeira: 320L com 3 prateleiras ajustáveis
          - Freezer: 130L com 2 gavetas
          - Porta: 4 compartimentos na porta
          - Gaveta de legumes: 25L
          - Gaveta de frios: 15L
          
          FUNCIONALIDADES:
          - Distribuidor de água e gelo
          - Controle de temperatura digital
          - Iluminação LED
        `;
        resolve(mockText);
      }, 1500);
    });
  }

  // Extrair especificações do texto
  private extractSpecifications(text: string): ManualAnalysisResult['specifications'] {
    const specs = {
      totalCapacity: 0,
      dimensions: { height: 0, width: 0, depth: 0 },
      energyClass: 'A',
      frostType: 'frost_free',
      features: [] as string[]
    };

    // Extrair capacidade
    const capacityMatch = text.match(/CAPACIDADE.*?(\d+)\s*L/i);
    if (capacityMatch) {
      specs.totalCapacity = parseInt(capacityMatch[1]);
    }

    // Extrair dimensões
    const dimensionsMatch = text.match(/DIMENSÕES.*?(\d+)\s*x\s*(\d+)\s*x\s*(\d+)/i);
    if (dimensionsMatch) {
      specs.dimensions = {
        height: parseInt(dimensionsMatch[1]),
        width: parseInt(dimensionsMatch[2]),
        depth: parseInt(dimensionsMatch[3])
      };
    }

    // Extrair classe energética
    const energyMatch = text.match(/CLASSE ENERGÉTICA.*?([A-Z]+)/i);
    if (energyMatch) {
      specs.energyClass = energyMatch[1];
    }

    // Extrair sistema de degelo
    const frostMatch = text.match(/DEGELO.*?(\w+)/i);
    if (frostMatch) {
      specs.frostType = frostMatch[1].toLowerCase();
    }

    // Extrair funcionalidades
    const featuresSection = text.match(/FUNCIONALIDADES.*?(?:\n\n|$)/is);
    if (featuresSection) {
      const features = featuresSection[0].split('\n')
        .map(line => line.replace(/^[-*]\s*/, '').trim())
        .filter(line => line.length > 0);
      specs.features = features;
    }

    return specs;
  }

  // Extrair descrição de layout
  private extractLayoutDescription(text: string): string {
    const layoutSection = text.match(/ESPECIFICAÇÕES.*?(?:FUNCIONALIDADES|$)/is);
    return layoutSection ? layoutSection[0] : '';
  }

  // Converter descrição para compartimentos
  private convertDescriptionToCompartments(description: string, specs: ManualAnalysisResult['specifications']): Compartment[] {
    const compartments: Compartment[] = [];
    
    // Geladeira
    const fridgeMatch = description.match(/Geladeira:\s*(\d+)L.*?(\d+)\s*prateleiras/);
    if (fridgeMatch) {
      const capacity = parseInt(fridgeMatch[1]);
      const shelfCount = parseInt(fridgeMatch[2]);
      
      const shelves: Shelf[] = [];
      for (let i = 1; i <= shelfCount; i++) {
        shelves.push({
          id: `fridge-shelf-${i}`,
          name: `Prateleira ${i}`,
          type: 'shelf',
          position: { x: 0, y: i * 10, width: 100, height: 10 },
          capacity: Math.floor(capacity / shelfCount),
          products: []
        });
      }

      compartments.push({
        id: 'main-fridge',
        name: 'Geladeira Principal',
        type: 'fridge',
        capacity,
        position: { x: 0, y: 0, width: 100, height: 70 },
        shelves
      });
    }

    // Freezer
    const freezerMatch = description.match(/Freezer:\s*(\d+)L.*?(\d+)\s*gavetas/);
    if (freezerMatch) {
      const capacity = parseInt(freezerMatch[1]);
      const drawerCount = parseInt(freezerMatch[2]);
      
      const shelves: Shelf[] = [];
      for (let i = 1; i <= drawerCount; i++) {
        shelves.push({
          id: `freezer-drawer-${i}`,
          name: `Gaveta ${i}`,
          type: 'drawer',
          position: { x: 0, y: i * 10, width: 100, height: 10 },
          capacity: Math.floor(capacity / drawerCount),
          products: []
        });
      }

      compartments.push({
        id: 'main-freezer',
        name: 'Freezer',
        type: 'freezer',
        capacity,
        position: { x: 0, y: 70, width: 100, height: 30 },
        shelves
      });
    }

    // Porta
    const doorMatch = description.match(/Porta:\s*(\d+)\s*compartimentos/);
    if (doorMatch) {
      const compartmentCount = parseInt(doorMatch[1]);
      const capacity = Math.floor(specs.totalCapacity * 0.08); // 8% do total
      
      const shelves: Shelf[] = [];
      for (let i = 1; i <= compartmentCount; i++) {
        shelves.push({
          id: `door-shelf-${i}`,
          name: `Prateleira Porta ${i}`,
          type: 'shelf',
          position: { x: 0, y: i * 10, width: 100, height: 10 },
          capacity: Math.floor(capacity / compartmentCount),
          products: []
        });
      }

      compartments.push({
        id: 'door-compartment',
        name: 'Porta',
        type: 'door',
        capacity,
        position: { x: 0, y: 0, width: 15, height: 100 },
        shelves
      });
    }

    // Gaveta de legumes
    const crisperMatch = description.match(/Gaveta de legumes:\s*(\d+)L/);
    if (crisperMatch) {
      compartments.push({
        id: 'crisper-drawer',
        name: 'Gaveta de Legumes',
        type: 'fridge' as any,
        capacity: parseInt(crisperMatch[1]),
        position: { x: 0, y: 60, width: 100, height: 10 },
        shelves: [{
          id: 'crisper-shelf',
          name: 'Gaveta de Legumes',
          type: 'drawer',
          position: { x: 0, y: 5, width: 100, height: 10 },
          capacity: parseInt(crisperMatch[1]),
          products: []
        }]
      });
    }

    return compartments;
  }

  // Métodos auxiliares
  private generateCompartmentName(obj: any): string {
    if (obj.features.includes('freezer_compartment')) return 'Freezer';
    if (obj.features.includes('shelves_visible')) return 'Geladeira';
    if (obj.type === 'door') return 'Porta';
    return 'Compartimento';
  }

  private classifyCompartmentType(obj: any): DetectedCompartment['type'] {
    if (obj.features.includes('freezer_compartment')) return 'freezer';
    if (obj.type === 'door') return 'door';
    if (obj.features.includes('drawer_bottom')) return 'drawer';
    if (obj.features.includes('vegetable_drawer')) return 'crisper';
    return 'fridge';
  }

  private countShelves(features: string[]): number {
    return features.filter(f => f.includes('shelf')).length || 3; // padrão 3 se não detectado
  }

  private calculateOverallConfidence(compartments: DetectedCompartment[]): number {
    const totalConfidence = compartments.reduce((sum, comp) => sum + comp.confidence, 0);
    return totalConfidence / compartments.length;
  }

  private calculateManualConfidence(extractedText: string): number {
    // Baseado na quantidade e qualidade das informações extraídas
    const hasCapacity = /\d+L/.test(extractedText);
    const hasDimensions = /\d+\s*x\s*\d+\s*x\s*\d+/.test(extractedText);
    const hasLayout = /prateleiras|gavetas|compartimentos/.test(extractedText);
    
    let confidence = 0.5;
    if (hasCapacity) confidence += 0.2;
    if (hasDimensions) confidence += 0.2;
    if (hasLayout) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private detectDocumentType(file: File, text: string): ManualAnalysisResult['source'] {
    if (file.type === 'application/pdf') return 'manual_pdf';
    if (text.includes('ESPECIFICAÇÕES') || text.includes('FUNCIONALIDADES')) return 'specification_sheet';
    return 'user_manual';
  }

  private extractDetectedFeatures(compartments: DetectedCompartment[]): string[] {
    const allFeatures = compartments.flatMap(comp => comp.features);
    return Array.from(new Set(allFeatures));
  }

  private assessImageQuality(imageData: ImageData): 'high' | 'medium' | 'low' {
    // Análise simples de qualidade baseada em resolução e contraste
    const resolution = imageData.width * imageData.height;
    
    if (resolution > 500000) return 'high';
    if (resolution > 200000) return 'medium';
    return 'low';
  }
}

export const photoAnalysisService = new PhotoAnalysisService();
