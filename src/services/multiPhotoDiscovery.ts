import { PhotoDiscoveryRequest, PhotoDiscoveryResult, ModelIdentifier } from '../types/fridgeDiscovery';
import { ocrService } from './ocrService';

// Multi-photo Discovery System - descobre modelo usando múltiplas fotos
class MultiPhotoDiscovery {
  async discoverFromPhotos(request: PhotoDiscoveryRequest): Promise<PhotoDiscoveryResult> {
    const results: PhotoDiscoveryResult[] = [];

    // Step 1: Tentar etiqueta
    if (request.labelPhoto) {
      const labelResult = await this.tryLabelPhoto(request.labelPhoto);
      if (labelResult) {
        results.push(labelResult);
        if (labelResult.confidence > 0.8) {
          return labelResult; // Confiança alta, retorna imediatamente
        }
      }
    }

    // Step 2: Tentar foto frontal completa
    if (request.fullFrontPhoto) {
      const frontResult = await this.tryFullFrontPhoto(request.fullFrontPhoto);
      if (frontResult) {
        results.push(frontResult);
        if (frontResult.confidence > 0.7) {
          return frontResult;
        }
      }
    }

    // Step 3: Tentar foto lateral
    if (request.fullSidePhoto) {
      const sideResult = await this.tryFullSidePhoto(request.fullSidePhoto);
      if (sideResult) {
        results.push(sideResult);
        if (sideResult.confidence > 0.7) {
          return sideResult;
        }
      }
    }

    // Step 4: Tentar foto do número do modelo
    if (request.modelNumberPhoto) {
      const modelResult = await this.tryModelNumberPhoto(request.modelNumberPhoto);
      if (modelResult) {
        results.push(modelResult);
        if (modelResult.confidence > 0.8) {
          return modelResult;
        }
      }
    }

    // Step 5: Combinar resultados
    if (results.length > 0) {
      return this.combineResults(results);
    }

    // Step 6: Falha total
    return {
      confidence: 0,
      method: 'manual',
    };
  }

  private async tryLabelPhoto(photo: File): Promise<PhotoDiscoveryResult | null> {
    try {
      const ocrResult = await ocrService.extractFromImage(photo);

      if (ocrResult.success && ocrResult.identifier) {
        return {
          identifier: ocrResult.identifier,
          confidence: ocrResult.confidence,
          method: 'label',
        };
      }

      return null;
    } catch (error) {
      console.error('Error processing label photo:', error);
      return null;
    }
  }

  private async tryFullFrontPhoto(photo: File): Promise<PhotoDiscoveryResult | null> {
    try {
      // OCR na foto frontal pode capturar logo/brand
      const ocrResult = await ocrService.extractFromImage(photo);

      if (ocrResult.success && ocrResult.identifier) {
        return {
          identifier: ocrResult.identifier,
          confidence: ocrResult.confidence * 0.8, // Reduz confiança para foto frontal
          method: 'full_front',
        };
      }

      return null;
    } catch (error) {
      console.error('Error processing front photo:', error);
      return null;
    }
  }

  private async tryFullSidePhoto(photo: File): Promise<PhotoDiscoveryResult | null> {
    try {
      // Foto lateral pode ter informações de modelo
      const ocrResult = await ocrService.extractFromImage(photo);

      if (ocrResult.success && ocrResult.identifier) {
        return {
          identifier: ocrResult.identifier,
          confidence: ocrResult.confidence * 0.7, // Reduz confiança para foto lateral
          method: 'full_side',
        };
      }

      return null;
    } catch (error) {
      console.error('Error processing side photo:', error);
      return null;
    }
  }

  private async tryModelNumberPhoto(photo: File): Promise<PhotoDiscoveryResult | null> {
    try {
      // Foto específica do número do modelo deve ter alta confiança
      const ocrResult = await ocrService.extractFromImage(photo);

      if (ocrResult.success && ocrResult.identifier) {
        return {
          identifier: ocrResult.identifier,
          confidence: ocrResult.confidence * 0.9,
          method: 'model_number',
        };
      }

      return null;
    } catch (error) {
      console.error('Error processing model number photo:', error);
      return null;
    }
  }

  private combineResults(results: PhotoDiscoveryResult[]): PhotoDiscoveryResult {
    // Combinar resultados usando o identificador mais comum
    const identifiers = results.filter(r => r.identifier).map(r => r.identifier!);
    
    if (identifiers.length === 0) {
      return {
        confidence: 0,
        method: 'manual',
      };
    }

    // Contar ocorrências de cada identificador
    const counts = new Map<string, number>();
    identifiers.forEach(id => {
      const key = `${id.brand}-${id.model}-${id.year || ''}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    // Encontrar o mais comum
    let maxCount = 0;
    let mostCommon: ModelIdentifier | null = null;

    counts.forEach((count, key) => {
      if (count > maxCount) {
        maxCount = count;
        const [brand, model, year] = key.split('-');
        mostCommon = {
          brand,
          model,
          year: year ? parseInt(year, 10) : undefined,
        };
      }
    });

    // Calcular confiança média
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    return {
      identifier: mostCommon!,
      confidence: avgConfidence * (maxCount / results.length), // Aumenta confiança se múltiplas fotos concordam
      method: 'combined' as const,
    };
  }

  async discoverWithFallback(photo: File): Promise<PhotoDiscoveryResult> {
    // Tenta etiqueta primeiro
    const labelResult = await this.tryLabelPhoto(photo);
    if (labelResult && labelResult.confidence > 0.7) {
      return labelResult;
    }

    // Se confiança baixa, pede mais fotos
    return {
      confidence: 0,
      method: 'manual',
      needsMorePhotos: true,
    };
  }
}

export const multiPhotoDiscovery = new MultiPhotoDiscovery();
