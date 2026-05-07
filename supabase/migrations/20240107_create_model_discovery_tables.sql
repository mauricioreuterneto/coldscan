-- Model Discovery Workflow Tables

-- Tabela de modelos processados e aprovados
CREATE TABLE IF NOT EXISTS fridge_models_processed (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  image_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('fridge', 'frigobar', 'freezer', 'wine-cooler')),
  total_capacity INTEGER NOT NULL,
  energy JSONB NOT NULL,
  dimensions JSONB NOT NULL,
  compartments JSONB NOT NULL,
  processing_metadata JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de modelos aguardando revisão do admin
CREATE TABLE IF NOT EXISTS fridge_models_pending_review (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  image_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('fridge', 'frigobar', 'freezer', 'wine-cooler')),
  total_capacity INTEGER NOT NULL,
  energy JSONB NOT NULL,
  dimensions JSONB NOT NULL,
  compartments JSONB NOT NULL,
  processing_metadata JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'needs_info')),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT,
  rejection_reason TEXT,
  requested_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de customizações de usuários (crowd-sourcing)
CREATE TABLE IF NOT EXISTS user_fridge_customizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  base_model_id TEXT NOT NULL REFERENCES fridge_models_processed(id) ON DELETE CASCADE,
  customizations JSONB NOT NULL,
  appliance_age INTEGER NOT NULL,
  photos TEXT[],
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  consolidated BOOLEAN DEFAULT FALSE,
  consolidated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de consentimentos de usuários
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('crowd_sourcing', 'photo_upload', 'data_processing')),
  consented_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  version TEXT NOT NULL DEFAULT '1.0',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de fotos de usuários
CREATE TABLE IF NOT EXISTS user_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('model_discovery', 'customization')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  encryption_used BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de aceitação de termos de uso
CREATE TABLE IF NOT EXISTS user_terms_acceptance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  terms_version TEXT NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de fontes de dados de modelos
CREATE TABLE IF NOT EXISTS model_data_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id TEXT NOT NULL REFERENCES fridge_models_processed(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  attribution_required BOOLEAN DEFAULT FALSE,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  commercial_use BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de solicitações de deleção de dados
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de log de auditoria
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_fridge_models_processed_brand_model ON fridge_models_processed(brand, model);
CREATE INDEX IF NOT EXISTS idx_fridge_models_processed_type ON fridge_models_processed(type);
CREATE INDEX IF NOT EXISTS idx_fridge_models_pending_review_status ON fridge_models_pending_review(status);
CREATE INDEX IF NOT EXISTS idx_user_fridge_customizations_user_id ON user_fridge_customizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_fridge_customizations_base_model_id ON user_fridge_customizations(base_model_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_photos_user_id ON user_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_photos_expires_at ON user_photos(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);

-- Row Level Security (RLS)
ALTER TABLE fridge_models_processed ENABLE ROW LEVEL SECURITY;
ALTER TABLE fridge_models_pending_review ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fridge_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_terms_acceptance ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (ajustar conforme necessário)
-- fridge_models_processed: todos podem ler, usuários autenticados podem escrever
CREATE POLICY "Todos podem ler modelos processados" ON fridge_models_processed FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados podem inserir modelos" ON fridge_models_processed FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Apenas admin pode atualizar modelos" ON fridge_models_processed FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- user_fridge_customizations: usuário pode ler suas próprias, inserir suas próprias
CREATE POLICY "Usuário pode ler suas customizações" ON user_fridge_customizations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuário pode inserir suas customizações" ON user_fridge_customizations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário pode atualizar suas customizações" ON user_fridge_customizations FOR UPDATE USING (auth.uid() = user_id);

-- user_photos: usuário pode ler suas próprias, inserir suas próprias
CREATE POLICY "Usuário pode ler suas fotos" ON user_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuário pode inserir suas fotos" ON user_photos FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_consents: usuário pode ler suas próprias, inserir suas próprias
CREATE POLICY "Usuário pode ler seus consentimentos" ON user_consents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuário pode inserir seus consentimentos" ON user_consents FOR INSERT WITH CHECK (auth.uid() = user_id);

-- audit_log: apenas admin pode ler, sistema pode inserir
CREATE POLICY "Apenas admin pode ler audit log" ON audit_log FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Sistema pode inserir audit log" ON audit_log FOR INSERT WITH CHECK (true);
