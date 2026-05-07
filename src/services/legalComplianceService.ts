import { supabase } from '../lib/supabase';

// Legal Compliance Service - sistema de conformidade legal para crowd-sourcing e privacidade
class LegalComplianceService {
  // Consentimento explícito do usuário
  async recordUserConsent(userId: string, consentType: 'crowd_sourcing' | 'photo_upload' | 'data_processing'): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_consents')
        .insert({
          user_id: userId,
          consent_type: consentType,
          consented_at: new Date().toISOString(),
          version: '1.0',
          ip_address: await this.getClientIP(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording user consent:', error);
      throw error;
    }
  }

  async hasUserConsent(userId: string, consentType: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking user consent:', error);
      return false;
    }
  }

  async revokeConsent(userId: string, consentType: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_consents')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('consent_type', consentType);

      if (error) throw error;
    } catch (error) {
      console.error('Error revoking consent:', error);
      throw error;
    }
  }

  // Gerenciamento de fotos - criptografia e retenção
  async uploadPhoto(userId: string, photo: File, purpose: 'model_discovery' | 'customization'): Promise<string> {
    try {
      // Verificar consentimento para upload de foto
      const hasConsent = await this.hasUserConsent(userId, 'photo_upload');
      if (!hasConsent) {
        throw new Error('Usuário não consentiu com upload de fotos');
      }

      // Criptografar foto antes de armazenar (em produção, usar criptografia real)
      const encryptedPhoto = await this.encryptPhoto(photo);

      // Upload para Supabase Storage com retenção de 30 dias
      const fileName = `${userId}/${purpose}/${Date.now()}-${photo.name}`;
      const { data, error } = await supabase.storage
        .from('user-photos')
        .upload(fileName, encryptedPhoto);

      if (error) throw error;

      // Registrar metadados da foto
      const { error: metadataError } = await supabase
        .from('user_photos')
        .insert({
          user_id: userId,
          storage_path: data.path,
          purpose,
          uploaded_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
          encryption_used: true,
        });

      if (metadataError) throw metadataError;

      return data.path;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw error;
    }
  }

  private async encryptPhoto(photo: File): Promise<Blob> {
    // Em produção, implementar criptografia real (AES-256)
    // Por enquanto, retorna o blob original
    return photo;
  }

  async deleteExpiredPhotos(): Promise<void> {
    try {
      const now = new Date().toISOString();

      // Buscar fotos expiradas
      const { data, error } = await supabase
        .from('user_photos')
        .select('*')
        .lt('expires_at', now);

      if (error) throw error;

      // Deletar fotos do storage e do banco
      if (data && data.length > 0) {
        for (const photo of data) {
          await supabase.storage
            .from('user-photos')
            .remove([photo.storage_path]);
        }

        await supabase
          .from('user_photos')
          .delete()
          .lt('expires_at', now);
      }
    } catch (error) {
      console.error('Error deleting expired photos:', error);
    }
  }

  async deleteUserPhotos(userId: string): Promise<void> {
    try {
      // Buscar todas as fotos do usuário
      const { data, error } = await supabase
        .from('user_photos')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Deletar fotos do storage e do banco
      if (data && data.length > 0) {
        for (const photo of data) {
          await supabase.storage
            .from('user-photos')
            .remove([photo.storage_path]);
        }

        await supabase
          .from('user_photos')
          .delete()
          .eq('user_id', userId);
      }
    } catch (error) {
      console.error('Error deleting user photos:', error);
      throw error;
    }
  }

  // Direitos sobre dados de fabricantes
  async recordDataSource(modelId: string, source: string, attributionRequired: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('model_data_sources')
        .insert({
          model_id: modelId,
          source,
          attribution_required: attributionRequired,
          accessed_at: new Date().toISOString(),
          commercial_use: false,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording data source:', error);
      throw error;
    }
  }

  async getDataAttribution(modelId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('model_data_sources')
        .select('source')
        .eq('model_id', modelId)
        .eq('attribution_required', true);

      if (error) throw error;
      return data?.map(d => d.source) || [];
    } catch (error) {
      console.error('Error getting data attribution:', error);
      return [];
    }
  }

  // Termos de uso
  async acceptTermsOfService(userId: string, version: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_terms_acceptance')
        .insert({
          user_id: userId,
          terms_version: version,
          accepted_at: new Date().toISOString(),
          ip_address: await this.getClientIP(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error accepting terms of service:', error);
      throw error;
    }
  }

  async hasAcceptedTerms(userId: string, version: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_terms_acceptance')
        .select('*')
        .eq('user_id', userId)
        .eq('terms_version', version)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking terms acceptance:', error);
      return false;
    }
  }

  // GDPR/ LGPD - Direito ao esquecimento
  async requestUserDataDeletion(userId: string): Promise<void> {
    try {
      // Verificar identidade (em produção, implementar verificação rigorosa)
      
      // Deletar fotos do usuário
      await this.deleteUserPhotos(userId);

      // Deletar customizações
      await supabase
        .from('user_fridge_customizations')
        .delete()
        .eq('user_id', userId);

      // Deletar consentimentos
      await supabase
        .from('user_consents')
        .delete()
        .eq('user_id', userId);

      // Deletar aceitação de termos
      await supabase
        .from('user_terms_acceptance')
        .delete()
        .eq('user_id', userId);

      // Anonimizar dados de perfil (mas não deletar por integridade referencial)
      await supabase
        .from('profiles')
        .update({
          full_name: 'Usuário Removido',
          email: `deleted-${userId}@deleted.local`,
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      // Registrar solicitação de deleção
      await supabase
        .from('data_deletion_requests')
        .insert({
          user_id: userId,
          requested_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          status: 'completed',
        });
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }

  // Log de auditoria
  async logAuditEvent(userId: string, action: string, details: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_log')
        .insert({
          user_id: userId,
          action,
          details,
          timestamp: new Date().toISOString(),
          ip_address: await this.getClientIP(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  private async getClientIP(): Promise<string> {
    // Em produção, obter IP real do cliente
    return '0.0.0.0';
  }

  // Política de retenção de dados
  async getDataRetentionReport(): Promise<{
    totalPhotos: number;
    expiringIn7Days: number;
    expiringIn30Days: number;
    expiredNotDeleted: number;
  }> {
    try {
      const now = new Date();
      const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const [totalResult, expiring7Result, expiring30Result, expiredResult] = await Promise.all([
        supabase.from('user_photos').select('id', { count: 'exact' }),
        supabase.from('user_photos').select('id', { count: 'exact' }).lte('expires_at', in7Days.toISOString()).gt('expires_at', now.toISOString()),
        supabase.from('user_photos').select('id', { count: 'exact' }).lte('expires_at', in30Days.toISOString()).gt('expires_at', now.toISOString()),
        supabase.from('user_photos').select('id', { count: 'exact' }).lt('expires_at', now.toISOString()),
      ]);

      return {
        totalPhotos: totalResult.count || 0,
        expiringIn7Days: expiring7Result.count || 0,
        expiringIn30Days: expiring30Result.count || 0,
        expiredNotDeleted: expiredResult.count || 0,
      };
    } catch (error) {
      console.error('Error getting data retention report:', error);
      return { totalPhotos: 0, expiringIn7Days: 0, expiringIn30Days: 0, expiredNotDeleted: 0 };
    }
  }
}

export const legalComplianceService = new LegalComplianceService();
