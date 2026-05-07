import { ProcessedFridgeModel, UserFridgeCustomization } from '../types/fridgeDiscovery';
import { supabase } from '../lib/supabase';

// Admin Review Workflow - revisão e aprovação de modelos por administradores
class AdminReviewWorkflow {
  async submitForReview(model: ProcessedFridgeModel): Promise<void> {
    try {
      const { error } = await supabase
        .from('fridge_models_pending_review')
        .insert({
          ...model,
          submittedAt: new Date().toISOString(),
          status: 'pending',
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error submitting model for review:', error);
      throw error;
    }
  }

  async getPendingReviews(): Promise<ProcessedFridgeModel[]> {
    try {
      const { data, error } = await supabase
        .from('fridge_models_pending_review')
        .select('*')
        .eq('status', 'pending')
        .order('submittedAt', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting pending reviews:', error);
      return [];
    }
  }

  async approveModel(modelId: string, adminId: string): Promise<void> {
    try {
      // Buscar modelo pendente
      const { data: pendingModel, error: fetchError } = await supabase
        .from('fridge_models_pending_review')
        .select('*')
        .eq('id', modelId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!pendingModel) throw new Error('Modelo não encontrado');

      // Atualizar modelo pendente
      const { error: updateError } = await supabase
        .from('fridge_models_pending_review')
        .update({
          status: 'approved',
          reviewedAt: new Date().toISOString(),
          reviewedBy: adminId,
        })
        .eq('id', modelId);

      if (updateError) throw updateError;

      // Inserir no banco de modelos aprovados
      const approvedModel: ProcessedFridgeModel = {
        ...pendingModel,
        processingMetadata: {
          ...pendingModel.processingMetadata,
          adminApproved: true,
          approvedAt: new Date().toISOString(),
        },
      };

      const { error: insertError } = await supabase
        .from('fridge_models_processed')
        .insert(approvedModel);

      if (insertError) throw insertError;
    } catch (error) {
      console.error('Error approving model:', error);
      throw error;
    }
  }

  async rejectModel(modelId: string, adminId: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('fridge_models_pending_review')
        .update({
          status: 'rejected',
          reviewedAt: new Date().toISOString(),
          reviewedBy: adminId,
          rejectionReason: reason,
        })
        .eq('id', modelId);

      if (error) throw error;
    } catch (error) {
      console.error('Error rejecting model:', error);
      throw error;
    }
  }

  async requestMoreInfo(modelId: string, adminId: string, questions: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('fridge_models_pending_review')
        .update({
          status: 'needs_info',
          reviewedAt: new Date().toISOString(),
          reviewedBy: adminId,
          requestedInfo: questions,
        })
        .eq('id', modelId);

      if (error) throw error;
    } catch (error) {
      console.error('Error requesting more info:', error);
      throw error;
    }
  }

  async getCrowdsourcedSuggestions(baseModelId: string): Promise<UserFridgeCustomization[]> {
    try {
      const { data, error } = await supabase
        .from('user_fridge_customizations')
        .select('*')
        .eq('base_modelId', baseModelId)
        .order('submittedAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting crowdsourced suggestions:', error);
      return [];
    }
  }

  async consolidateCrowdsourcedData(baseModelId: string, adminId: string): Promise<void> {
    try {
      const customizations = await this.getCrowdsourcedSuggestions(baseModelId);

      if (customizations.length < 5) {
        throw new Error('Precisa de pelo menos 5 customizações para consolidar');
      }

      // Analisar customizações para encontrar padrões
      const consolidated = this.analyzeCustomizations(customizations);

      // Atualizar modelo base com dados consolidados
      const { error } = await supabase
        .from('fridge_models_processed')
        .update({
          compartments: consolidated.compartments,
          processingMetadata: {
            sources: ['crowd-sourced'],
            normalizedAt: new Date().toISOString(),
            fallbacksApplied: [],
            validatedAt: new Date().toISOString(),
            crowdSourced: true,
            completeness: 0.9,
            adminApproved: true,
            approvedAt: new Date().toISOString(),
          },
        })
        .eq('id', baseModelId);

      if (error) throw error;

      // Marcar customizações como consolidadas
      const { error: updateError } = await supabase
        .from('user_fridge_customizations')
        .update({ consolidated: true, consolidatedAt: new Date().toISOString() })
        .eq('base_modelId', baseModelId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error consolidating crowdsourced data:', error);
      throw error;
    }
  }

  private analyzeCustomizations(customizations: UserFridgeCustomization[]): any {
    // Analisar padrões nas customizações
    const layoutCounts = new Map<string, number>();

    customizations.forEach(custom => {
      const layoutKey = JSON.stringify(custom.customizations.layout);
      layoutCounts.set(layoutKey, (layoutCounts.get(layoutKey) || 0) + 1);
    });

    // Encontrar layout mais comum
    let maxCount = 0;
    let mostCommonLayout: any = null;

    layoutCounts.forEach((count, layoutKey) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonLayout = JSON.parse(layoutKey);
      }
    });

    return {
      compartments: mostCommonLayout,
      consensus: maxCount / customizations.length,
    };
  }

  async getModelStatistics(): Promise<{
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  }> {
    try {
      const [totalResult, approvedResult, pendingResult, rejectedResult] = await Promise.all([
        supabase.from('fridge_models_processed').select('id', { count: 'exact' }),
        supabase.from('fridge_models_processed').select('id', { count: 'exact' }).eq('processingMetadata->>adminApproved', true),
        supabase.from('fridge_models_pending_review').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('fridge_models_pending_review').select('id', { count: 'exact' }).eq('status', 'rejected'),
      ]);

      return {
        total: totalResult.count || 0,
        approved: approvedResult.count || 0,
        pending: pendingResult.count || 0,
        rejected: rejectedResult.count || 0,
      };
    } catch (error) {
      console.error('Error getting model statistics:', error);
      return { total: 0, approved: 0, pending: 0, rejected: 0 };
    }
  }
}

export const adminReviewWorkflow = new AdminReviewWorkflow();
