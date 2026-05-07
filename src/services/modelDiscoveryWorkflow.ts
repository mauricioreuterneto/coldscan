import { 
  ModelIdentifier, 
  DiscoveryWorkflow, 
  ProcessedFridgeModel, 
  FridgeModelUserFocused
} from '../types/fridgeDiscovery';
import { ocrService } from './ocrService';
import { apiSearchService } from './apiSearchService';
import { dataNormalizer } from './dataNormalizer';
import { consistencyValidator } from './consistencyValidator';
import { fallbackSystem } from './fallbackSystem';
import { crowdSourcingService } from './crowdSourcingService';
import { supabase } from '../lib/supabase';

// Main Model Discovery Workflow
class ModelDiscoveryWorkflow {
  async discoverModel(identifier: ModelIdentifier, inputMethod: 'text' | 'photo'): Promise<DiscoveryWorkflow> {
    const workflow: DiscoveryWorkflow = {
      modelIdentifier: identifier,
      currentStep: 'user_input',
      progress: 0,
      data: {},
      sources: [],
      errors: [],
      warnings: [],
    };

    try {
      // Step 1: User input (already provided)
      workflow.currentStep = 'user_input';
      workflow.progress = 10;

      // Step 2: OCR attempt (if photo input)
      if (inputMethod === 'photo') {
        workflow.currentStep = 'ocr_attempt';
        workflow.progress = 20;
        // OCR would be called here with the photo file
        // For now, we proceed with the text input
      }

      // Step 3: API search
      workflow.currentStep = 'api_search';
      workflow.progress = 30;
      const sources = await apiSearchService.searchModel(identifier);
      workflow.sources = sources;
      console.log('[modelDiscoveryWorkflow] API search returned sources:', sources.length, sources.map(s => s.source));

      if (sources.length === 0) {
        workflow.errors.push('Modelo não encontrado em nenhuma fonte de dados');
        workflow.currentStep = 'failed';
        return workflow;
      }

      // Step 4: Normalize
      workflow.currentStep = 'normalize';
      workflow.progress = 50;
      const normalizedData = dataNormalizer.mergeMultipleSources(sources);
      // Use the original identifier for brand and model if not extracted
      if (!normalizedData.brand && identifier.brand) {
        normalizedData.brand = identifier.brand;
      }
      if (!normalizedData.model && identifier.model) {
        normalizedData.model = identifier.model;
      }
      if (!normalizedData.year && identifier.year) {
        normalizedData.year = identifier.year;
      }
      workflow.data = normalizedData;
      console.log('[modelDiscoveryWorkflow] Normalized data:', normalizedData);

      // Step 5: Apply fallbacks
      workflow.currentStep = 'validate';
      workflow.progress = 60;
      const withFallbacks = fallbackSystem.applyFallbacks(normalizedData);
      workflow.data = withFallbacks;
      workflow.warnings.push(...fallbackSystem.getAppliedFallbacks().map(f => `Fallback aplicado: ${f}`));
      console.log('[modelDiscoveryWorkflow] Data with fallbacks:', withFallbacks);

      // Step 6: Validate consistency
      const validation = consistencyValidator.validate(withFallbacks);
      console.log('[modelDiscoveryWorkflow] Validation result:', validation);
      console.log('[modelDiscoveryWorkflow] Validation errors:', validation.errors);
      if (!validation.isValid) {
        workflow.errors.push(...validation.errors);
        workflow.warnings.push(...validation.warnings);
        workflow.currentStep = 'failed';
        return workflow;
      }
      workflow.warnings.push(...validation.warnings);

      // Step 7: Check if crowd-sourcing validation is needed
      workflow.currentStep = 'crowd_source';
      workflow.progress = 70;
      const needsValidation = await crowdSourcingService.needsValidation({
        ...withFallbacks,
        processingMetadata: {
          sources: sources.map(s => s.source),
          normalizedAt: new Date().toISOString(),
          fallbacksApplied: fallbackSystem.getAppliedFallbacks(),
          validatedAt: new Date().toISOString(),
          crowdSourced: false,
          completeness: validation.completeness,
          adminApproved: false,
        }
      });

      if (needsValidation) {
        workflow.warnings.push('Validação do usuário necessária devido a dados incompletos');
        // In a real implementation, this would show a UI for user validation
        // For now, we proceed with admin review
      }

      // Step 8: Admin review (in a real system, this would be async)
      workflow.currentStep = 'admin_review';
      workflow.progress = 90;
      // For now, auto-approve for demonstration
      const adminApproved = true;

      if (!adminApproved) {
        workflow.errors.push('Modelo aguardando aprovação do administrador');
        workflow.currentStep = 'failed';
        return workflow;
      }

      // Step 9: Insert into database
      workflow.currentStep = 'insert_database';
      workflow.progress = 95;
      const processedModel: ProcessedFridgeModel = {
        ...withFallbacks as FridgeModelUserFocused,
        id: `${identifier.brand}-${identifier.model}-${identifier.year || 'unknown'}`,
        processingMetadata: {
          sources: sources.map(s => s.source),
          normalizedAt: new Date().toISOString(),
          fallbacksApplied: fallbackSystem.getAppliedFallbacks(),
          validatedAt: new Date().toISOString(),
          crowdSourced: needsValidation,
          completeness: validation.completeness,
          adminApproved: true,
          approvedAt: new Date().toISOString(),
        }
      };

      await this.insertModelIntoDatabase(processedModel);

      // Step 10: Completed
      workflow.currentStep = 'completed';
      workflow.progress = 100;
      workflow.data = processedModel;

      return workflow;
    } catch (error) {
      workflow.currentStep = 'failed';
      workflow.errors.push(error instanceof Error ? error.message : 'Erro desconhecido');
      return workflow;
    }
  }

  async discoverModelFromPhoto(photo: File): Promise<DiscoveryWorkflow> {
    try {
      // Step 1: OCR attempt
      const ocrResult = await ocrService.extractFromImage(photo);

      if (!ocrResult.success || !ocrResult.identifier) {
        // OCR failed, fallback to manual input
        return {
          modelIdentifier: { brand: '', model: '' },
          currentStep: 'manual_input',
          progress: 0,
          data: {},
          sources: [],
          errors: ['OCR falhou, entrada manual necessária'],
          warnings: [],
        };
      }

      // Proceed with discovery using OCR result
      return await this.discoverModel(ocrResult.identifier, 'photo');
    } catch (error) {
      return {
        modelIdentifier: { brand: '', model: '' },
        currentStep: 'failed',
        progress: 0,
        data: {},
        sources: [],
        errors: [error instanceof Error ? error.message : 'Erro no OCR'],
        warnings: [],
      };
    }
  }

  async discoverModelFromText(text: string): Promise<DiscoveryWorkflow> {
    try {
      const identifier = await ocrService.extractFromText(text);

      if (!identifier) {
        return {
          modelIdentifier: { brand: '', model: '' },
          currentStep: 'manual_input',
          progress: 0,
          data: {},
          sources: [],
          errors: ['Não foi possível extrair marca/modelo do texto'],
          warnings: [],
        };
      }

      return await this.discoverModel(identifier, 'text');
    } catch (error) {
      return {
        modelIdentifier: { brand: '', model: '' },
        currentStep: 'failed',
        progress: 0,
        data: {},
        sources: [],
        errors: [error instanceof Error ? error.message : 'Erro no processamento'],
        warnings: [],
      };
    }
  }

  async discoverModelManual(identifier: ModelIdentifier, manualData: Partial<FridgeModelUserFocused>): Promise<DiscoveryWorkflow> {
    const workflow: DiscoveryWorkflow = {
      modelIdentifier: identifier,
      currentStep: 'manual_input',
      progress: 10,
      data: manualData,
      sources: [{
        source: 'manual',
        rawData: manualData,
        confidence: 1.0,
        timestamp: new Date().toISOString(),
      }],
      errors: [],
      warnings: [],
    };

    try {
      // Apply fallbacks for missing data
      workflow.currentStep = 'validate';
      workflow.progress = 40;
      const withFallbacks = fallbackSystem.applyFallbacks(manualData);
      workflow.data = withFallbacks;
      workflow.warnings.push(...fallbackSystem.getAppliedFallbacks().map(f => `Fallback aplicado: ${f}`));

      // Validate
      const validation = consistencyValidator.validate(withFallbacks);
      if (!validation.isValid) {
        workflow.errors.push(...validation.errors);
        workflow.warnings.push(...validation.warnings);
        workflow.currentStep = 'failed';
        return workflow;
      }
      workflow.warnings.push(...validation.warnings);

      // Check if validation needed
      workflow.currentStep = 'crowd_source';
      workflow.progress = 70;
      const needsValidation = await crowdSourcingService.needsValidation({
        ...withFallbacks,
        processingMetadata: {
          sources: ['manual'],
          normalizedAt: new Date().toISOString(),
          fallbacksApplied: fallbackSystem.getAppliedFallbacks(),
          validatedAt: new Date().toISOString(),
          crowdSourced: false,
          completeness: validation.completeness,
          adminApproved: false,
        }
      });

      // Admin review
      workflow.currentStep = 'admin_review';
      workflow.progress = 90;
      const adminApproved = true; // Auto-approve for demo

      if (!adminApproved) {
        workflow.errors.push('Modelo aguardando aprovação do administrador');
        workflow.currentStep = 'failed';
        return workflow;
      }

      // Insert into database
      workflow.currentStep = 'insert_database';
      workflow.progress = 95;
      const processedModel: ProcessedFridgeModel = {
        ...withFallbacks as FridgeModelUserFocused,
        id: `${identifier.brand}-${identifier.model}-${identifier.year || 'unknown'}`,
        processingMetadata: {
          sources: ['manual'],
          normalizedAt: new Date().toISOString(),
          fallbacksApplied: fallbackSystem.getAppliedFallbacks(),
          validatedAt: new Date().toISOString(),
          crowdSourced: needsValidation,
          completeness: validation.completeness,
          adminApproved: true,
          approvedAt: new Date().toISOString(),
        }
      };

      await this.insertModelIntoDatabase(processedModel);

      workflow.currentStep = 'completed';
      workflow.progress = 100;
      workflow.data = processedModel;

      return workflow;
    } catch (error) {
      workflow.currentStep = 'failed';
      workflow.errors.push(error instanceof Error ? error.message : 'Erro desconhecido');
      return workflow;
    }
  }

  private async insertModelIntoDatabase(model: ProcessedFridgeModel): Promise<void> {
    try {
      // Converter camelCase para snake_case para compatibilidade com Supabase
      const dbModel = {
        id: model.id,
        brand: model.brand,
        model: model.model,
        year: model.year,
        image_url: model.imageUrl,
        type: model.type,
        total_capacity: model.totalCapacity,
        energy: model.energy,
        dimensions: model.dimensions,
        compartments: model.compartments,
        processing_metadata: model.processingMetadata,
      };

      const { error } = await supabase
        .from('fridge_models_processed')
        .insert(dbModel);

      if (error) throw error;
    } catch (error) {
      console.error('Error inserting model into database:', error);
      throw error;
    }
  }

  async findModelInDatabase(identifier: ModelIdentifier): Promise<ProcessedFridgeModel | null> {
    try {
      const { data, error } = await supabase
        .from('fridge_models_processed')
        .select('*')
        .eq('brand', identifier.brand)
        .eq('model', identifier.model)
        .eq('year', identifier.year || null)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error finding model in database:', error);
      return null;
    }
  }

  async searchModels(query: string): Promise<ProcessedFridgeModel[]> {
    try {
      const { data, error } = await supabase
        .from('fridge_models_processed')
        .select('*')
        .or(`brand.ilike.%${query}%,model.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching models:', error);
      return [];
    }
  }
}

export const modelDiscoveryWorkflow = new ModelDiscoveryWorkflow();
