import { OCRResult, ModelIdentifier } from '../types/fridgeDiscovery';

// OCR Service usando Tesseract.js (100% gratuito, client-side)
class OCRService {
  private tesseractWorker: any = null;

  async initializeWorker(): Promise<void> {
    if (!this.tesseractWorker) {
      const Tesseract = await import('tesseract.js');
      this.tesseractWorker = await Tesseract.createWorker('por', 1);
    }
  }

  async extractFromImage(image: File): Promise<OCRResult> {
    try {
      await this.initializeWorker();

      const { data: { text, confidence } } = await this.tesseractWorker.recognize(image);

      const identifier = this.parseOCRText(text);

      return {
        success: true,
        identifier,
        confidence: confidence / 100,
        text,
      };
    } catch (error) {
      console.error('OCR error:', error);
      return {
        success: false,
        identifier: null,
        confidence: 0,
        text: '',
        errors: [error instanceof Error ? error.message : 'Unknown OCR error'],
      };
    }
  }

  async extractFromText(text: string): Promise<ModelIdentifier | null> {
    return this.parseOCRText(text);
  }

  private parseOCRText(text: string): ModelIdentifier | null {
    // Padrões comuns de etiquetas de geladeira
    const patterns = [
      // Consul CRE44AB 2023
      /(\w+)\s+([A-Z]{2}\d{2,3}[A-Z]?)\s*(\d{4})?/i,
      // Brastemp BRE59
      /(\w+)\s+([A-Z]{3}\d{2,3})/i,
      // Samsung RB...
      /(\w+)\s+([A-Z]{2}\d{3,4}[A-Z]?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const [, brand, model, year] = match;
        return {
          brand: brand.trim(),
          model: model.trim().toUpperCase(),
          year: year ? parseInt(year, 10) : undefined,
        };
      }
    }

    // Tentar extrair marca e modelo separadamente
    const words = text.toUpperCase().split(/\s+/);
    const brands = ['CONSUL', 'BRASTEMP', 'ELECTROLUX', 'SAMSUNG', 'LG', 'MIDEA', 'PANASONIC'];
    
    const brand = words.find(word => brands.includes(word));
    if (brand) {
      const model = words.find(word => /[A-Z]{2,}\d{2,}/.test(word));
      if (model) {
        return {
          brand,
          model,
        };
      }
    }

    return null;
  }

  async terminateWorker(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
    }
  }
}

export const ocrService = new OCRService();
