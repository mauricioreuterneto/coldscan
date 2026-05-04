-- ATUALIZAÇÃO DIRETA DO SUPABASE - PROJETO: wcuozglfynltyafwivqj
-- Script otimizado para execução via Node.js

-- =====================================================
-- VERIFICAR E ATUALIZAR TABELA EXISTENTE products
-- =====================================================

-- Adicionar coluna appliance_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'appliance_id'
  ) THEN
    ALTER TABLE products ADD COLUMN appliance_id UUID REFERENCES refrigeration_appliances(id) ON DELETE CASCADE;
    RAISE NOTICE 'Coluna appliance_id adicionada à tabela products';
  END IF;
END $$;

-- =====================================================
-- CRIAR TABELAS NOVAS PARA MÚLTIPLOS APARELHOS
-- =====================================================

-- Tabela de appliance_types (tipos de aparelhos)
CREATE TABLE IF NOT EXISTS appliance_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fridge', 'freezer', 'mini_fridge', 'wine_cooler', 'beverage_cooler', 'commercial')),
  description TEXT,
  icon TEXT,
  default_compartments TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de households
CREATE TABLE IF NOT EXISTS households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Minha Casa',
  settings JSONB NOT NULL DEFAULT '{
    "defaultAlerts": true,
    "temperatureUnit": "celsius",
    "inventoryTracking": true
  }'::jsonb,
  primary_appliance_id UUID REFERENCES refrigeration_appliances(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de appliance_locations
CREATE TABLE IF NOT EXISTS appliance_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('room', 'area', 'zone')),
  description TEXT,
  parent_location_id UUID REFERENCES appliance_locations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela principal de refrigeration_appliances
CREATE TABLE IF NOT EXISTS refrigeration_appliances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  location_id UUID REFERENCES appliance_locations(id),
  appliance_type_id TEXT REFERENCES appliance_types(id),
  name TEXT NOT NULL,
  designation TEXT,
  model_id UUID REFERENCES fridge_models(id),
  position_description TEXT,
  position_coordinates JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  custom_settings JSONB DEFAULT '{
    "temperatureTarget": null,
    "alertsEnabled": true,
    "maintenanceReminder": null
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ATUALIZAR fridge_models COM CAMPOS ADICIONAIS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fridge_models' 
    AND column_name = 'energy_efficiency'
  ) THEN
    ALTER TABLE fridge_models ADD COLUMN energy_efficiency TEXT;
    RAISE NOTICE 'Coluna energy_efficiency adicionada à fridge_models';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fridge_models' 
    AND column_name = 'dimensions'
  ) THEN
    ALTER TABLE fridge_models ADD COLUMN dimensions JSONB DEFAULT '{}';
    RAISE NOTICE 'Coluna dimensions adicionada à fridge_models';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fridge_models' 
    AND column_name = 'features'
  ) THEN
    ALTER TABLE fridge_models ADD COLUMN features TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Coluna features adicionada à fridge_models';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fridge_models' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE fridge_models ADD COLUMN type TEXT;
    RAISE NOTICE 'Coluna type adicionada à fridge_models';
  END IF;
END $$;

-- =====================================================
-- INSERIR DADOS INICIAIS
-- =====================================================

-- Tipos de aparelhos padrão
INSERT INTO appliance_types (id, name, category, description, icon, default_compartments) VALUES
('fridge', 'Geladeira', 'fridge', 'Refrigerador doméstico padrão', 'ice_cream', ARRAY['fridge', 'freezer', 'door']),
('freezer', 'Freezer', 'freezer', 'Congelador vertical ou horizontal', 'ice_cube', ARRAY['freezer']),
('mini_fridge', 'Frigobar', 'mini_fridge', 'Mini refrigerador compacto', 'beer', ARRAY['fridge', 'door']),
('wine_cooler', 'Adega Climatizada', 'wine_cooler', 'Refrigerador para vinhos', 'wine', ARRAY['fridge']),
('beverage_cooler', 'Refrigerador de Bebidas', 'beverage_cooler', 'Refrigerador para bebidas', 'beer', ARRAY['fridge']),
('commercial', 'Equipamento Comercial', 'commercial', 'Equipamento comercial', 'store', ARRAY['fridge', 'freezer'])
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- MIGRAR DADOS EXISTENTES
-- =====================================================

-- Criar households para usuários existentes
INSERT INTO households (user_id, name)
SELECT DISTINCT user_id, 'Minha Casa'
FROM fridge_models fm
WHERE NOT EXISTS (
  SELECT 1 FROM households h WHERE h.user_id = fm.user_id
);

-- Criar locations padrão
INSERT INTO appliance_locations (household_id, name, type, description)
SELECT h.id, 'Cozinha', 'room', 'Local principal para geladeiras'
FROM households h
WHERE NOT EXISTS (
  SELECT 1 FROM appliance_locations al 
  WHERE al.household_id = h.id AND al.name = 'Cozinha'
);

-- Migrar fridge_models para refrigeration_appliances
INSERT INTO refrigeration_appliances (household_id, location_id, appliance_type_id, name, model_id, is_primary)
SELECT 
  h.id,
  al.id,
  'fridge',
  CASE 
    WHEN fm.brand = 'Brastemp' THEN 'Geladeira Brastemp'
    WHEN fm.brand = 'Consul' THEN 'Geladeira Consul'
    WHEN fm.brand = 'Samsung' THEN 'Geladeira Samsung'
    ELSE 'Geladeira Principal'
  END,
  fm.id,
  true
FROM fridge_models fm
JOIN households h ON h.user_id = fm.user_id
JOIN appliance_locations al ON al.household_id = h.id AND al.name = 'Cozinha'
WHERE NOT EXISTS (
  SELECT 1 FROM refrigeration_appliances ra WHERE ra.model_id = fm.id
);

-- Atualizar products com appliance_id
UPDATE products 
SET appliance_id = ra.id
FROM refrigeration_appliances ra
JOIN households h ON ra.household_id = h.id
WHERE products.user_id = h.user_id AND products.appliance_id IS NULL;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_households_user_id ON households(user_id);
CREATE INDEX IF NOT EXISTS idx_appliance_locations_household_id ON appliance_locations(household_id);
CREATE INDEX IF NOT EXISTS idx_refrigeration_appliances_household_id ON refrigeration_appliances(household_id);
CREATE INDEX IF NOT EXISTS idx_refrigeration_appliances_location_id ON refrigeration_appliances(location_id);
CREATE INDEX IF NOT EXISTS idx_refrigeration_appliances_model_id ON refrigeration_appliances(model_id);
CREATE INDEX IF NOT EXISTS idx_refrigeration_appliances_is_active ON refrigeration_appliances(is_active);
CREATE INDEX IF NOT EXISTS idx_refrigeration_appliances_is_primary ON refrigeration_appliances(is_primary);
CREATE INDEX IF NOT EXISTS idx_products_appliance_id ON products(appliance_id);

-- =====================================================
-- RLS E POLÍTICAS DE SEGURANÇA
-- =====================================================

-- Habilitar RLS
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE refrigeration_appliances ENABLE ROW LEVEL SECURITY;

-- Políticas para households
CREATE POLICY IF NOT EXISTS "Users can view own household" ON households FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update own household" ON households FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert own household" ON households FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para appliance_locations
CREATE POLICY IF NOT EXISTS "Users can view own locations" ON appliance_locations FOR SELECT USING (
  EXISTS (SELECT 1 FROM households h WHERE h.id = household_id AND h.user_id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "Users can manage own locations" ON appliance_locations FOR ALL USING (
  EXISTS (SELECT 1 FROM households h WHERE h.id = household_id AND h.user_id = auth.uid())
);

-- Políticas para appliance_types (leitura pública)
CREATE POLICY IF NOT EXISTS "Anyone can view appliance types" ON appliance_types FOR SELECT USING (true);

-- Políticas para refrigeration_appliances
CREATE POLICY IF NOT EXISTS "Users can view own appliances" ON refrigeration_appliances FOR SELECT USING (
  EXISTS (SELECT 1 FROM households h WHERE h.id = household_id AND h.user_id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "Users can manage own appliances" ON refrigeration_appliances FOR ALL USING (
  EXISTS (SELECT 1 FROM households h WHERE h.id = household_id AND h.user_id = auth.uid())
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Função para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar triggers
DROP TRIGGER IF EXISTS update_households_updated_at ON households;
CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appliance_locations_updated_at ON appliance_locations;
CREATE TRIGGER update_appliance_locations_updated_at BEFORE UPDATE ON appliance_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_refrigeration_appliances_updated_at ON refrigeration_appliances;
CREATE TRIGGER update_refrigeration_appliances_updated_at BEFORE UPDATE ON refrigeration_appliances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para garantir único primary appliance
CREATE OR REPLACE FUNCTION ensure_single_primary_appliance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE refrigeration_appliances 
    SET is_primary = false 
    WHERE household_id = NEW.household_id 
    AND id != NEW.id 
    AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_primary_appliance_trigger ON refrigeration_appliances;
CREATE TRIGGER ensure_single_primary_appliance_trigger
BEFORE INSERT OR UPDATE ON refrigeration_appliances
FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_appliance();

-- =====================================================
-- STORAGE
-- =====================================================

-- Bucket para appliance images
INSERT INTO storage.buckets (id, name, public)
VALUES ('appliance-images', 'appliance-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para appliance images
CREATE POLICY IF NOT EXISTS "Users can upload appliance images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'appliance-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Users can view own appliance images" ON storage.objects FOR SELECT USING (
  bucket_id = 'appliance-images' AND 
  auth.role() = 'authenticated'
);

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=== SUPABASE ATUALIZADO COM SUCESSO ===';
  RAISE NOTICE 'Tabelas criadas: appliance_types, households, appliance_locations, refrigeration_appliances';
  RAISE NOTICE 'Tabelas atualizadas: products, fridge_models';
  RAISE NOTICE 'Dados migrados automaticamente';
  RAISE NOTICE 'RLS e políticas configuradas';
  RAISE NOTICE 'Triggers e índices criados';
  RAISE NOTICE 'Storage bucket: appliance-images';
  RAISE NOTICE '==========================================';
  
  -- Verificar contagem
  RAISE NOTICE 'Registros criados:';
  RAISE NOTICE '  - Appliance Types: %', (SELECT COUNT(*) FROM appliance_types);
  RAISE NOTICE '  - Households: %', (SELECT COUNT(*) FROM households);
  RAISE NOTICE '  - Locations: %', (SELECT COUNT(*) FROM appliance_locations);
  RAISE NOTICE '  - Appliances: %', (SELECT COUNT(*) FROM refrigeration_appliances);
  RAISE NOTICE '  - Products com appliance_id: %', (SELECT COUNT(*) FROM products WHERE appliance_id IS NOT NULL);
END $$;
