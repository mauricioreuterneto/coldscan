-- Schema simplificado para múltiplos aparelhos - Ordem correta

-- 1. Criar appliance_types (sem dependências)
CREATE TABLE IF NOT EXISTS appliance_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fridge', 'freezer', 'mini_fridge', 'wine_cooler', 'beverage_cooler', 'commercial')),
  description TEXT,
  icon TEXT,
  default_compartments TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar households (depende de profiles)
CREATE TABLE IF NOT EXISTS households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Minha Casa',
  settings JSONB NOT NULL DEFAULT '{"defaultAlerts": true, "temperatureUnit": "celsius", "inventoryTracking": true}'::jsonb,
  primary_appliance_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar appliance_locations (depende de households)
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

-- 4. Criar refrigeration_appliances (depende de households, locations, appliance_types, fridge_models)
CREATE TABLE IF NOT EXISTS refrigeration_appliances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  location_id UUID REFERENCES appliance_locations(id) ON DELETE CASCADE,
  appliance_type_id TEXT REFERENCES appliance_types(id),
  name TEXT NOT NULL,
  designation TEXT,
  model_id UUID REFERENCES fridge_models(id),
  position_description TEXT,
  position_coordinates JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  custom_settings JSONB DEFAULT '{"temperatureTarget": null, "alertsEnabled": true, "maintenanceReminder": null}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Adicionar appliance_id à products (agora refrigeration_appliances existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'appliance_id'
  ) THEN
    ALTER TABLE products ADD COLUMN appliance_id UUID REFERENCES refrigeration_appliances(id) ON DELETE CASCADE;
    RAISE NOTICE 'Coluna appliance_id adicionada';
  END IF;
END $$;

-- 6. Inserir dados básicos
INSERT INTO appliance_types (id, name, category, description, icon, default_compartments) VALUES
('fridge', 'Geladeira', 'fridge', 'Refrigerador doméstico padrão', 'ice_cream', ARRAY['fridge', 'freezer', 'door']),
('freezer', 'Freezer', 'freezer', 'Congelador vertical ou horizontal', 'ice_cube', ARRAY['freezer']),
('mini_fridge', 'Frigobar', 'mini_fridge', 'Mini refrigerador compacto', 'beer', ARRAY['fridge', 'door']),
('wine_cooler', 'Adega Climatizada', 'wine_cooler', 'Refrigerador para vinhos', 'wine', ARRAY['fridge']),
('beverage_cooler', 'Refrigerador de Bebidas', 'beverage_cooler', 'Refrigerador para bebidas', 'beer', ARRAY['fridge']),
('commercial', 'Equipamento Comercial', 'commercial', 'Equipamento comercial', 'store', ARRAY['fridge', 'freezer'])
ON CONFLICT (id) DO NOTHING;

-- 7. Criar índices
CREATE INDEX IF NOT EXISTS idx_households_user_id ON households(user_id);
CREATE INDEX IF NOT EXISTS idx_appliance_locations_household_id ON appliance_locations(household_id);
CREATE INDEX IF NOT EXISTS idx_refrigeration_appliances_household_id ON refrigeration_appliances(household_id);
CREATE INDEX IF NOT EXISTS idx_refrigeration_appliances_location_id ON refrigeration_appliances(location_id);
CREATE INDEX IF NOT EXISTS idx_refrigeration_appliances_model_id ON refrigeration_appliances(model_id);
CREATE INDEX IF NOT EXISTS idx_refrigeration_appliances_is_active ON refrigeration_appliances(is_active);
CREATE INDEX IF NOT EXISTS idx_refrigeration_appliances_is_primary ON refrigeration_appliances(is_primary);
CREATE INDEX IF NOT EXISTS idx_products_appliance_id ON products(appliance_id);

-- 8. Habilitar RLS
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE refrigeration_appliances ENABLE ROW LEVEL SECURITY;

-- 9. Criar políticas (sem IF NOT EXISTS)
DROP POLICY IF EXISTS "Users can view own household" ON households;
CREATE POLICY "Users can view own household" ON households FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own household" ON households;
CREATE POLICY "Users can update own household" ON households FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own household" ON households;
CREATE POLICY "Users can insert own household" ON households FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view appliance types" ON appliance_types;
CREATE POLICY "Anyone can view appliance types" ON appliance_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own appliances" ON refrigeration_appliances;
CREATE POLICY "Users can view own appliances" ON refrigeration_appliances FOR SELECT USING (
  EXISTS (SELECT 1 FROM households h WHERE h.id = household_id AND h.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage own appliances" ON refrigeration_appliances;
CREATE POLICY "Users can manage own appliances" ON refrigeration_appliances FOR ALL USING (
  EXISTS (SELECT 1 FROM households h WHERE h.id = household_id AND h.user_id = auth.uid())
);

-- 10. Verificação
DO $$
BEGIN
  RAISE NOTICE '=== SUPABASE ATUALIZADO ===';
  RAISE NOTICE 'Tabelas: appliance_types, households, appliance_locations, refrigeration_appliances';
  RAISE NOTICE 'Products: appliance_id adicionado';
  RAISE NOTICE 'Appliance Types: %', (SELECT COUNT(*) FROM appliance_types);
END $$;
