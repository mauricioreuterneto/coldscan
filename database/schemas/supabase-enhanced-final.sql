-- ESQUEMA SUPABASE REDESIGNADO - VERSÃO FINAL COMPATÍVEL
-- Adiciona funcionalidades críticas mantendo compatibilidade com tabelas existentes

-- =====================================================
-- ATUALIZAR TABELAS EXISTENTES
-- =====================================================

-- Adicionar colunas à tabela profiles existente
DO $$
BEGIN
  -- Verificar se a tabela profiles existe e adicionar colunas faltantes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Adicionar household_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'household_id') THEN
      ALTER TABLE profiles ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
    END IF;
    
    -- Adicionar preferences se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferences') THEN
      ALTER TABLE profiles ADD COLUMN preferences JSONB DEFAULT '{}';
    END IF;
    
    -- Adicionar onboarding_completed se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
      ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    END IF;
    
    -- Adicionar updated_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
      ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- Atualizar tabela shopping_lists existente
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shopping_lists') THEN
    -- Adicionar household_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopping_lists' AND column_name = 'household_id') THEN
      ALTER TABLE shopping_lists ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
    END IF;
    
    -- Adicionar created_by se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopping_lists' AND column_name = 'created_by') THEN
      ALTER TABLE shopping_lists ADD COLUMN created_by UUID REFERENCES profiles(id);
    END IF;
    
    -- Adicionar status se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopping_lists' AND column_name = 'status') THEN
      ALTER TABLE shopping_lists ADD COLUMN status TEXT CHECK (status IN ('draft', 'active', 'shopping', 'completed')) DEFAULT 'draft';
    END IF;
    
    -- Adicionar budget se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopping_lists' AND column_name = 'budget') THEN
      ALTER TABLE shopping_lists ADD COLUMN budget NUMERIC;
    END IF;
    
    -- Adicionar planned_for se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopping_lists' AND column_name = 'planned_for') THEN
      ALTER TABLE shopping_lists ADD COLUMN planned_for DATE;
    END IF;
    
    -- Adicionar completed_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopping_lists' AND column_name = 'completed_at') THEN
      ALTER TABLE shopping_lists ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
    END IF;
  END IF;
END $$;

-- =====================================================
-- NOVAS TABELAS CRÍTICAS
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

-- Locais de armazenamento (usar tabela existente appliance_locations se possível)
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

-- Zones dentro dos locais
CREATE TABLE IF NOT EXISTS storage_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID REFERENCES storage_locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  position JSONB DEFAULT '{}',
  preferred_categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
-- ATUALIZAR TABELA PRODUCTS COM CAMPOS CRÍTICOS
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    -- Adicionar campos de validade inteligente
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sealed_expiry_date') THEN
      ALTER TABLE products ADD COLUMN sealed_expiry_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'opened_expiry_date') THEN
      ALTER TABLE products ADD COLUMN opened_expiry_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'best_before_date') THEN
      ALTER TABLE products ADD COLUMN best_before_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'freeze_by_date') THEN
      ALTER TABLE products ADD COLUMN freeze_by_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'expiry_metadata') THEN
      ALTER TABLE products ADD COLUMN expiry_metadata JSONB DEFAULT '{}';
    END IF;
    
    -- Adicionar campos de estado e consumo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'current_state') THEN
      ALTER TABLE products ADD COLUMN current_state JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'consumption') THEN
      ALTER TABLE products ADD COLUMN consumption JSONB DEFAULT '{}';
    END IF;
    
    -- Adicionar campos de compra
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'purchase_info') THEN
      ALTER TABLE products ADD COLUMN purchase_info JSONB DEFAULT '{}';
    END IF;
    
    -- Adicionar campos adicionais
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'brand') THEN
      ALTER TABLE products ADD COLUMN brand TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'tags') THEN
      ALTER TABLE products ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'nutritional_info') THEN
      ALTER TABLE products ADD COLUMN nutritional_info JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'household_id') THEN
      ALTER TABLE products ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_product_categories_name ON product_categories(name);
CREATE INDEX IF NOT EXISTS idx_storage_locations_household_id ON storage_locations(household_id);
CREATE INDEX IF NOT EXISTS idx_storage_zones_location_id ON storage_zones(location_id);
CREATE INDEX IF NOT EXISTS idx_stores_household_id ON stores(household_id);
CREATE INDEX IF NOT EXISTS idx_shopping_suggestions_household_id ON shopping_suggestions(household_id);
CREATE INDEX IF NOT EXISTS idx_shopping_sessions_list_id ON shopping_sessions(list_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_consumption_history_product_id ON consumption_history(product_id);
CREATE INDEX IF NOT EXISTS idx_consumption_history_date ON consumption_history(date);
CREATE INDEX IF NOT EXISTS idx_wasted_items_household_id ON wasted_items(household_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);

-- Índices para produtos
CREATE INDEX IF NOT EXISTS idx_products_sealed_expiry_date ON products(sealed_expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_opened_expiry_date ON products(opened_expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_household_id ON products(household_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

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

-- Aplicar triggers onde existir updated_at
DO $$
BEGIN
    -- Verificar se a tabela tem a coluna updated_at antes de criar o trigger
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
        CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'storage_locations' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_storage_locations_updated_at ON storage_locations;
        CREATE TRIGGER update_storage_locations_updated_at BEFORE UPDATE ON storage_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_products_updated_at ON products;
        CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopping_lists' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_shopping_lists_updated_at ON shopping_lists;
        CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON shopping_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_progress' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON onboarding_progress;
        CREATE TRIGGER update_onboarding_progress_updated_at BEFORE UPDATE ON onboarding_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

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

-- Criar household padrão se não existir
INSERT INTO households (id, name) 
SELECT gen_random_uuid(), 'Minha Casa'
WHERE NOT EXISTS (SELECT 1 FROM households);

-- Criar locais de armazenamento padrão
INSERT INTO storage_locations (household_id, name, type, description)
SELECT h.id, 'Geladeira Principal', 'fridge', 'Geladeira principal da cozinha'
FROM households h
WHERE NOT EXISTS (SELECT 1 FROM storage_locations WHERE name = 'Geladeira Principal');

INSERT INTO storage_locations (household_id, name, type, description)
SELECT h.id, 'Freezer Principal', 'freezer', 'Freezer principal'
FROM households h
WHERE NOT EXISTS (SELECT 1 FROM storage_locations WHERE name = 'Freezer Principal');

INSERT INTO storage_locations (household_id, name, type, description)
SELECT h.id, 'Despensa', 'pantry', 'Armário de despensa'
FROM households h
WHERE NOT EXISTS (SELECT 1 FROM storage_locations WHERE name = 'Despensa');

-- =====================================================
-- RLS E POLÍTICAS DE SEGURANÇA
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wasted_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Políticas para novas tabelas
DROP POLICY IF EXISTS "Anyone can view product categories" ON product_categories;
CREATE POLICY "Anyone can view product categories" ON product_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own storage_locations" ON storage_locations;
CREATE POLICY "Users can view own storage_locations" ON storage_locations FOR SELECT USING (
  household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage own storage_locations" ON storage_locations;
CREATE POLICY "Users can manage own storage_locations" ON storage_locations FOR ALL USING (
  household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own shopping_sessions" ON shopping_sessions;
CREATE POLICY "Users can view own shopping_sessions" ON shopping_sessions FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own shopping_sessions" ON shopping_sessions;
CREATE POLICY "Users can manage own shopping_sessions" ON shopping_sessions FOR ALL USING (user_id = auth.uid());

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
  RAISE NOTICE '=== SUPABASE ENHANCED SCHEMA ATUALIZADO ===';
  RAISE NOTICE 'Tabelas existentes atualizadas: profiles, shopping_lists, products';
  RAISE NOTICE 'Novas tabelas criadas: product_categories, storage_locations, notifications';
  RAISE NOTICE 'Sistema de validade inteligente: products (sealed/opened expiry)';
  RAISE NOTICE 'Lista de compras: shopping_suggestions, shopping_sessions';
  RAISE NOTICE 'Notificações: notifications com tipos específicos';
  RAISE NOTICE 'Insights: consumption_history, wasted_items';
  RAISE NOTICE 'Onboarding: onboarding_progress';
  RAISE NOTICE 'Categorias: % criadas', (SELECT COUNT(*) FROM product_categories);
  RAISE NOTICE 'Storage locations: % criados', (SELECT COUNT(*) FROM storage_locations);
  RAISE NOTICE '==========================================';
END $$;
