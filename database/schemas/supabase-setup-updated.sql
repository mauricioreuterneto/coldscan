-- Atualização completa do Supabase para suportar múltiplos aparelhos
-- Execute este script no Supabase SQL Editor para atualizar o esquema

-- =====================================================
-- 1. NOVAS TABELAS PARA MÚLTIPLOS APARELHOS
-- =====================================================

-- Tabela de Households (casas/domicílios)
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

-- Tabela de Locations (locais/cômodos)
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

-- Tabela de Appliance Types (tipos de aparelhos)
CREATE TABLE IF NOT EXISTS appliance_types (
  id TEXT PRIMARY KEY, -- 'fridge', 'freezer', 'mini_fridge', etc.
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fridge', 'freezer', 'mini_fridge', 'wine_cooler', 'beverage_cooler', 'commercial')),
  description TEXT,
  icon TEXT,
  default_compartments TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela principal de Refrigeration Appliances
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
-- 2. ATUALIZAR TABELAS EXISTENTES
-- =====================================================

-- Atualizar tabela products para incluir appliance_id
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS appliance_id UUID REFERENCES refrigeration_appliances(id) ON DELETE CASCADE;

-- Atualizar coluna location para incluir appliance_id
ALTER TABLE products 
ALTER COLUMN location SET DEFAULT '{"applianceId": null, "compartmentId": "", "shelfId": ""}'::jsonb;

-- Atualizar tabela fridge_models para incluir campos adicionais
ALTER TABLE fridge_models 
ADD COLUMN IF NOT EXISTS energy_efficiency TEXT,
ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS type TEXT;

-- =====================================================
-- 3. MIGRAR DADOS EXISTENTES
-- =====================================================

-- Inserir tipos de aparelhos padrão
INSERT INTO appliance_types (id, name, category, description, icon, default_compartments) VALUES
('fridge', 'Geladeira', 'fridge', 'Refrigerador doméstico padrão', 'ice_cream', ARRAY['fridge', 'freezer', 'door']),
('freezer', 'Freezer', 'freezer', 'Congelador vertical ou horizontal', 'ice_cube', ARRAY['freezer']),
('mini_fridge', 'Frigobar', 'mini_fridge', 'Mini refrigerador compacto', 'beer', ARRAY['fridge', 'door']),
('wine_cooler', 'Adega Climatizada', 'wine_cooler', 'Refrigerador para vinhos', 'wine', ARRAY['fridge']),
('beverage_cooler', 'Refrigerador de Bebidas', 'beverage_cooler', 'Refrigerador para bebidas', 'beer', ARRAY['fridge']),
('commercial', 'Equipamento Comercial', 'commercial', 'Equipamento comercial', 'store', ARRAY['fridge', 'freezer'])
ON CONFLICT (id) DO NOTHING;

-- Criar household padrão para usuários existentes
INSERT INTO households (user_id, name)
SELECT id, 'Minha Casa'
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM households h WHERE h.user_id = p.id
);

-- Criar locations padrão para households existentes
INSERT INTO appliance_locations (household_id, name, type, description)
SELECT h.id, 'Cozinha', 'room', 'Local principal para geladeiras'
FROM households h
WHERE NOT EXISTS (
  SELECT 1 FROM appliance_locations al WHERE al.household_id = h.id AND al.name = 'Cozinha'
);

-- Migrar fridge_models existentes para refrigeration_appliances
INSERT INTO refrigeration_appliances (household_id, location_id, appliance_type_id, name, model_id, is_primary)
SELECT 
  h.id,
  al.id,
  'fridge',
  'Geladeira Principal',
  fm.id,
  true
FROM fridge_models fm
JOIN profiles p ON fm.user_id = p.id
JOIN households h ON h.user_id = p.id
JOIN appliance_locations al ON al.household_id = h.id AND al.name = 'Cozinha'
WHERE NOT EXISTS (
  SELECT 1 FROM refrigeration_appliances ra WHERE ra.model_id = fm.id
);

-- Atualizar products para referenciar appliances
UPDATE products 
SET appliance_id = (
  SELECT ra.id 
  FROM refrigeration_appliances ra 
  JOIN households h ON ra.household_id = h.id 
  JOIN profiles p ON h.user_id = p.id 
  WHERE p.id = products.user_id 
  LIMIT 1
)
WHERE appliance_id IS NULL;

-- =====================================================
-- 4. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para tabelas novas
CREATE INDEX IF NOT EXISTS idx_households_user_id ON households(user_id);
CREATE INDEX IF NOT EXISTS idx_appliance_locations_household_id ON appliance_locations(household_id);
CREATE INDEX IF NOT EXISTS idx_refrigeration_appliances_household_id ON refrigeration_appliances(household_id);
CREATE INDEX IF NOT EXISTS idx_refrigeration_appliances_location_id ON refrigeration_appliances(location_id);
CREATE INDEX IF NOT EXISTS idx_refrigeration_appliances_model_id ON refrigeration_appliances(model_id);
CREATE INDEX IF NOT EXISTS idx_refrigeration_appliances_is_active ON refrigeration_appliances(is_active);
CREATE INDEX IF NOT EXISTS idx_refrigeration_appliances_is_primary ON refrigeration_appliances(is_primary);

-- Índices atualizados
CREATE INDEX IF NOT EXISTS idx_products_appliance_id ON products(appliance_id);
CREATE INDEX IF NOT EXISTS idx_products_user_appliance ON products(user_id, appliance_id);

-- =====================================================
-- 5. POLÍTICAS DE SEGURANÇA (RLS)
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE refrigeration_appliances ENABLE ROW LEVEL SECURITY;

-- Políticas para households
CREATE POLICY "Users can view own household" ON households FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own household" ON households FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own household" ON households FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own household" ON households FOR DELETE USING (auth.uid() = user_id);

-- Políticas para appliance_locations
CREATE POLICY "Users can view own locations" ON appliance_locations FOR SELECT USING (
  EXISTS (SELECT 1 FROM households h WHERE h.id = household_id AND h.user_id = auth.uid())
);
CREATE POLICY "Users can manage own locations" ON appliance_locations FOR ALL USING (
  EXISTS (SELECT 1 FROM households h WHERE h.id = household_id AND h.user_id = auth.uid())
);

-- Políticas para appliance_types (somente leitura pública)
CREATE POLICY "Anyone can view appliance types" ON appliance_types FOR SELECT USING (true);

-- Políticas para refrigeration_appliances
CREATE POLICY "Users can view own appliances" ON refrigeration_appliances FOR SELECT USING (
  EXISTS (SELECT 1 FROM households h WHERE h.id = household_id AND h.user_id = auth.uid())
);
CREATE POLICY "Users can manage own appliances" ON refrigeration_appliances FOR ALL USING (
  EXISTS (SELECT 1 FROM households h WHERE h.id = household_id AND h.user_id = auth.uid())
);

-- =====================================================
-- 6. TRIGGERS E FUNÇÕES
-- =====================================================

-- Aplicar triggers às novas tabelas
CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appliance_locations_updated_at BEFORE UPDATE ON appliance_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_refrigeration_appliances_updated_at BEFORE UPDATE ON refrigeration_appliances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para garantir apenas um aparelho primary por household
CREATE OR REPLACE FUNCTION ensure_single_primary_appliance()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está marcando como primary, desmarcar outros
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

-- Trigger para garantir único primary
CREATE TRIGGER ensure_single_primary_appliance_trigger
BEFORE INSERT OR UPDATE ON refrigeration_appliances
FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_appliance();

-- =====================================================
-- 7. VIEWS ÚTEIS
-- =====================================================

-- View para appliances com informações completas
CREATE OR REPLACE VIEW appliance_details AS
SELECT 
  ra.id,
  ra.name,
  ra.designation,
  ra.is_active,
  ra.is_primary,
  ra.position_description,
  ra.custom_settings,
  ra.created_at,
  ra.updated_at,
  at.name as appliance_type_name,
  at.category as appliance_category,
  at.icon as appliance_icon,
  fm.brand as model_brand,
  fm.model as model_name,
  fm.capacity as model_capacity,
  al.name as location_name,
  al.type as location_type,
  h.name as household_name,
  h.user_id as owner_id
FROM refrigeration_appliances ra
JOIN appliance_types at ON ra.appliance_type_id = at.id
JOIN fridge_models fm ON ra.model_id = fm.id
JOIN appliance_locations al ON ra.location_id = al.id
JOIN households h ON ra.household_id = h.id;

-- View para products com informações do appliance
CREATE OR REPLACE VIEW product_details AS
SELECT 
  p.id,
  p.name,
  p.category,
  p.quantity,
  p.unit,
  p.expiry_date,
  p.purchase_date,
  p.image_url,
  p.barcode,
  p.location,
  p.notes,
  p.created_at,
  p.updated_at,
  p.user_id,
  ra.name as appliance_name,
  ra.designation as appliance_designation,
  al.name as location_name,
  h.name as household_name
FROM products p
LEFT JOIN refrigeration_appliances ra ON p.appliance_id = ra.id
LEFT JOIN appliance_locations al ON ra.location_id = al.id
LEFT JOIN households h ON ra.household_id = h.id;

-- =====================================================
-- 8. STORAGE BUCKETS ADICIONAIS
-- =====================================================

-- Bucket para imagens de aparelhos
INSERT INTO storage.buckets (id, name, public)
VALUES ('appliance-images', 'appliance-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para appliance images
CREATE POLICY "Users can upload appliance images" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'appliance-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can view own appliance images" ON storage.objects FOR SELECT USING (
  bucket_id = 'appliance-images' AND 
  auth.role() = 'authenticated'
);

-- =====================================================
-- 9. FINALIZAÇÃO
-- =====================================================

-- Mensagem de conclusão
DO $$
BEGIN
  RAISE NOTICE '=== ESQUEMA SUPABASE ATUALIZADO COM SUCESSO ===';
  RAISE NOTICE 'Tabelas criadas: households, appliance_locations, appliance_types, refrigeration_appliances';
  RAISE NOTICE 'Tabelas atualizadas: products, fridge_models';
  RAISE NOTICE 'Views criadas: appliance_details, product_details';
  RAISE NOTICE 'Storage buckets: product-images, appliance-images';
  RAISE NOTICE 'RLS e políticas de segurança configuradas';
  RAISE NOTICE 'Triggers e índices criados';
  RAISE NOTICE '==============================================';
END $$;
