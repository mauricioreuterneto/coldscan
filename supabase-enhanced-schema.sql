-- ESQUEMA SUPABASE REDESIGNADO PARA EXPERIÊNCIA REAL DO USUÁRIO
-- Foco em gestão de alimentos, validade inteligente e compras otimizadas

-- =====================================================
-- TABELAS PRINCIPAIS DE USUÁRIOS E DOMICÍLIOS
-- =====================================================

-- Perfis de usuário com preferências avançadas
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Domicílios (casas/apartamentos)
CREATE TABLE IF NOT EXISTS households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Minha Casa',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SISTEMA DE ARMAZENAMENTO REDESIGNADO
-- =====================================================

-- Locais de armazenamento (geladeira, freezer, despensa, etc)
CREATE TABLE IF NOT EXISTS storage_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fridge', 'freezer', 'pantry', 'cabinet', 'counter', 'other')),
  description TEXT,
  temperature JSONB DEFAULT '{}',
  parent_id UUID REFERENCES storage_locations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Zones dentro dos locais (prateleiras, gavetas, etc)
CREATE TABLE IF NOT EXISTS storage_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES storage_locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  position JSONB DEFAULT '{}',
  preferred_categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aparelhos (geladeiras, freezers, etc)
CREATE TABLE IF NOT EXISTS appliances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  location_id UUID REFERENCES storage_locations(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('refrigerator', 'freezer', 'wine_cooler', 'beverage_cooler')),
  model_id UUID REFERENCES appliance_models(id),
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modelos de aparelhos
CREATE TABLE IF NOT EXISTS appliance_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  capacity INTEGER,
  dimensions JSONB DEFAULT '{}',
  energy_rating TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CATEGORIAS E PRODUTOS REDESIGNADOS
-- =====================================================

-- Categorias de produtos com regras de validade
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  parent_id UUID REFERENCES product_categories(id),
  default_expiry_rules JSONB DEFAULT '{}',
  storage_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Produtos (o coração do sistema)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  category_id UUID REFERENCES product_categories(id),
  image TEXT,
  
  -- Estado e consumo
  current_state JSONB DEFAULT '{}',
  consumption JSONB DEFAULT '{}',
  
  -- Localização
  location_id UUID REFERENCES storage_locations(id),
  zone_id UUID REFERENCES storage_zones(id),
  position_details JSONB DEFAULT '{}',
  
  -- Validade (CRÍTICO)
  sealed_expiry_date TIMESTAMP WITH TIME ZONE,
  opened_expiry_date TIMESTAMP WITH TIME ZONE,
  best_before_date TIMESTAMP WITH TIME ZONE,
  freeze_by_date TIMESTAMP WITH TIME ZONE,
  expiry_metadata JSONB DEFAULT '{}',
  
  -- Compra
  purchase_info JSONB DEFAULT '{}',
  
  -- Metadados
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  nutritional_info JSONB DEFAULT '{}',
  
  -- Sistema
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Histórico de consumo
CREATE TABLE IF NOT EXISTS consumption_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  quantity_consumed NUMERIC NOT NULL,
  reason TEXT CHECK (reason IN ('consumption', 'waste', 'donation', 'other')),
  notes TEXT,
  user_id UUID REFERENCES profiles(id)
);

-- =====================================================
-- LISTA DE COMPRAS INTELIGENTE
-- =====================================================

-- Listas de compras
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'active', 'shopping', 'completed')) DEFAULT 'draft',
  store_id UUID REFERENCES stores(id),
  budget NUMERIC,
  currency TEXT DEFAULT 'BRL',
  planned_for DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Itens da lista de compras
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  name TEXT NOT NULL,
  category_id UUID REFERENCES product_categories(id),
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'in_cart', 'purchased', 'not_found')) DEFAULT 'pending',
  price NUMERIC,
  estimated_price NUMERIC,
  notes TEXT,
  alternatives TEXT[] DEFAULT '{}',
  barcode TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  purchased_at TIMESTAMP WITH TIME ZONE,
  purchased_quantity NUMERIC,
  purchased_price NUMERIC
);

-- Sugestões de compras inteligentes
CREATE TABLE IF NOT EXISTS shopping_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  reason_type TEXT CHECK (reason_type IN ('low_stock', 'expiring_soon', 'habitual', 'seasonal', 'recipe')),
  reason_description TEXT,
  priority NUMERIC DEFAULT 0,
  estimated_price NUMERIC,
  confidence NUMERIC DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Lojas favoritas
CREATE TABLE IF NOT EXISTS stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MODO MERCADO (MOBILE-FIRST)
-- =====================================================

-- Sessões de compras no mercado
CREATE TABLE IF NOT EXISTS shopping_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES shopping_lists(id),
  user_id UUID REFERENCES profiles(id),
  store_id UUID REFERENCES stores(id),
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  estimated_budget NUMERIC,
  current_spent NUMERIC DEFAULT 0,
  items_checked INTEGER DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  voice_mode BOOLEAN DEFAULT false,
  barcode_scanning BOOLEAN DEFAULT true,
  status TEXT CHECK (status IN ('active', 'paused', 'completed')) DEFAULT 'active'
);

-- =====================================================
-- NOTIFICAÇÕES INTELIGENTES
-- =====================================================

-- Notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Preferências de notificação
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  expiry_warnings BOOLEAN DEFAULT true,
  low_stock_alerts BOOLEAN DEFAULT true,
  shopping_reminders BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT false,
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening')) DEFAULT 'morning',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INSIGHTS E ANÁLISES
-- =====================================================

-- Relatórios de desperdício
CREATE TABLE IF NOT EXISTS waste_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  period TEXT CHECK (period IN ('week', 'month', 'quarter', 'year')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_waste_value NUMERIC DEFAULT 0,
  waste_by_category JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '{}',
  trend TEXT CHECK (trend IN ('improving', 'stable', 'worsening')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Itens desperdiçados
CREATE TABLE IF NOT EXISTS wasted_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  reason TEXT CHECK (reason IN ('expired', 'spoiled', 'forgotten', 'overbought')),
  estimated_value NUMERIC,
  waste_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id)
);

-- =====================================================
-- ONBOARDING E FIRST RUN
-- =====================================================

-- Progresso de onboarding
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER DEFAULT 5,
  completed_steps TEXT[] DEFAULT '{}',
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices principais
CREATE INDEX IF NOT EXISTS idx_profiles_household_id ON profiles(household_id);
CREATE INDEX IF NOT EXISTS idx_households_id ON households(id);
CREATE INDEX IF NOT EXISTS idx_storage_locations_household_id ON storage_locations(household_id);
CREATE INDEX IF NOT EXISTS idx_storage_zones_location_id ON storage_zones(location_id);
CREATE INDEX IF NOT EXISTS idx_appliances_household_id ON appliances(household_id);
CREATE INDEX IF NOT EXISTS idx_products_household_id ON products(household_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_location_id ON products(location_id);
CREATE INDEX IF NOT EXISTS idx_products_sealed_expiry_date ON products(sealed_expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_opened_expiry_date ON products(opened_expiry_date);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_household_id ON shopping_lists(hh_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list_id ON shopping_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_consumption_history_product_id ON consumption_history(product_id);
CREATE INDEX IF NOT EXISTS idx_consumption_history_date ON consumption_history(date);

-- Índices compostos para consultas comuns
CREATE INDEX IF NOT EXISTS idx_products_household_location ON products(household_id, location_id);
CREATE INDEX IF NOT EXISTS idx_products_expiry_status ON products(household_id, sealed_expiry_date, opened_expiry_date);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_status_household ON shopping_lists(status, household_id);

-- =====================================================
-- TRIGGERS E FUNÇÕES
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
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_storage_locations_updated_at BEFORE UPDATE ON storage_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appliances_updated_at BEFORE UPDATE ON appliances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON shopping_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_progress_updated_at BEFORE UPDATE ON onboarding_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular validade automática
CREATE OR REPLACE FUNCTION calculate_product_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular dias até vencimento
    IF NEW.sealed_expiry_date IS NOT NULL THEN
        NEW.expiry_metadata = jsonb_set(
            COALESCE(NEW.expiry_metadata, '{}'),
            '{days_until_sealed_expiry}',
            to_jsonb(EXTRACT(DAYS FROM (NEW.sealed_expiry_date - NOW())))
        );
    END IF;
    
    IF NEW.opened_expiry_date IS NOT NULL THEN
        NEW.expiry_metadata = jsonb_set(
            COALESCE(NEW.expiry_metadata, '{}'),
            '{days_until_opened_expiry}',
            to_jsonb(EXTRACT(DAYS FROM (NEW.opened_expiry_date - NOW())))
        );
    END IF;
    
    -- Definir status de expiração
    NEW.expiry_metadata = jsonb_set(
        COALESCE(NEW.expiry_metadata, '{}'),
        '{is_expiring_soon}',
        to_jsonb(
            (NEW.sealed_expiry_date <= NOW() + INTERVAL '3 days' OR 
             NEW.opened_expiry_date <= NOW() + INTERVAL '3 days')
        )
    );
    
    NEW.expiry_metadata = jsonb_set(
        COALESCE(NEW.expiry_metadata, '{}'),
        '{is_expired}',
        to_jsonb(
            (NEW.sealed_expiry_date < NOW() OR 
             NEW.opened_expiry_date < NOW())
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_product_expiry_trigger
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION calculate_product_expiry();

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View de produtos com validade crítica
CREATE OR REPLACE VIEW products_expiring_soon AS
SELECT 
    p.*,
    CASE 
        WHEN p.sealed_expiry_date <= NOW() THEN 'expired'
        WHEN p.sealed_expiry_date <= NOW() + INTERVAL '1 day' THEN 'expires_today'
        WHEN p.sealed_expiry_date <= NOW() + INTERVAL '3 days' THEN 'expires_soon'
        ELSE 'safe'
    END as expiry_status,
    EXTRACT(DAYS FROM (p.sealed_expiry_date - NOW())) as days_until_expiry
FROM products p
WHERE p.sealed_expiry_date IS NOT NULL
ORDER BY p.sealed_expiry_date ASC;

-- View de produtos com baixo estoque
CREATE OR REPLACE VIEW products_low_stock AS
SELECT 
    p.*,
    (p.consumption->>'current_quantity')::numeric as current_quantity,
    (p.consumption->>'original_quantity')::numeric as original_quantity,
    CASE 
        WHEN (p.consumption->>'current_quantity')::numeric / (p.consumption->>'original_quantity')::numeric <= 0.2 THEN 'critical'
        WHEN (p.consumption->>'current_quantity')::numeric / (p.consumption->>'original_quantity')::numeric <= 0.5 THEN 'low'
        ELSE 'normal'
    END as stock_status
FROM products p
WHERE p.consumption->>'current_quantity' IS NOT NULL
ORDER BY (p.consumption->>'current_quantity')::numeric ASC;

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Categorias básicas
INSERT INTO product_categories (name, icon, color, default_expiry_rules) VALUES
('Laticínios', 'milk', '#4CAF50', '{"sealed_days": 7, "opened_days": 3}'),
('Carnes', 'beef', '#F44336', '{"sealed_days": 3, "opened_days": 1}'),
('Vegetais', 'carrot', '#8BC34A', '{"sealed_days": 5, "opened_days": 2}'),
('Frutas', 'apple', '#FF9800', '{"sealed_days": 7, "opened_days": 3}'),
('Grãos', 'wheat', '#795548', '{"sealed_days": 30, "opened_days": 7}'),
('Bebidas', 'coffee', '#2196F3', '{"sealed_days": 90, "opened_days": 7}'),
('Congelados', 'snowflake', '#00BCD4', '{"sealed_days": 180, "opened_days": 30}'),
('Padaria', 'bread', '#FFC107', '{"sealed_days": 3, "opened_days": 1}'),
('Snacks', 'cookie', '#E91E63', '{"sealed_days": 60, "opened_days": 30}'),
('Condimentos', 'shaker', '#9C27B0', '{"sealed_days": 365, "opened_days": 180}')
ON CONFLICT DO NOTHING;

-- =====================================================
-- RLS E POLÍTICAS DE SEGURANÇA
-- =====================================================

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE appliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view household" ON households FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.household_id = households.id AND p.id = auth.uid())
);

CREATE POLICY "Users can manage household" ON households FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.household_id = households.id AND p.id = auth.uid())
);

-- Políticas similares para outras tabelas...
CREATE POLICY "Users can view own products" ON products FOR SELECT USING (
  household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can manage own products" ON products FOR ALL USING (
  household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
);

-- =====================================================
-- STORAGE
-- =====================================================

-- Buckets para imagens
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('product-images', 'product-images', true),
  ('receipt-images', 'receipt-images', false),
  ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=== SUPABASE ENHANCED SCHEMA CRIADO ===';
  RAISE NOTICE 'Tabelas principais: profiles, households, storage_locations, products';
  RAISE NOTICE 'Sistema de validade inteligente: products (sealed/opened expiry)';
  RAISE NOTICE 'Lista de compras: shopping_lists, shopping_list_items, shopping_suggestions';
  RAISE NOTICE 'Modo mercado: shopping_sessions';
  RAISE NOTICE 'Notificações: notifications com tipos específicos';
  RAISE NOTICE 'Insights: waste_reports, wasted_items';
  RAISE NOTICE 'Onboarding: onboarding_progress';
  RAISE NOTICE 'Categorias: % criadas', (SELECT COUNT(*) FROM product_categories);
  RAISE NOTICE '==========================================';
END $$;
