-- ESQUEMA SUPABASE REDESIGNADO - VERSÃO COMPATÍVEL COM ESTRUTURA EXISTENTE
-- Usa a estrutura existente e adiciona funcionalidades críticas

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
      ALTER TABLE products ADD COLUMN current_state JSONB DEFAULT '{"status": "sealed", "condition": "fresh"}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'consumption') THEN
      ALTER TABLE products ADD COLUMN consumption JSONB DEFAULT '{"original_quantity": 0, "current_quantity": 0}';
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
  END IF;
END $$;

-- =====================================================
-- ATUALIZAR TABELA PROFILES
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Adicionar household_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'household_id') THEN
      ALTER TABLE profiles ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
    END IF;
    
    -- Adicionar preferences se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferences') THEN
      ALTER TABLE profiles ADD COLUMN preferences JSONB DEFAULT '{"notifications": {"expiryWarnings": true, "lowStockAlerts": true}}';
    END IF;
    
    -- Adicionar onboarding_completed se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
      ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
    END IF;
    
    -- Adicionar name se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'name') THEN
      ALTER TABLE profiles ADD COLUMN name TEXT;
    END IF;
  END IF;
END $$;

-- =====================================================
-- ATUALIZAR TABELA SHOPPING_LISTS
-- =====================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shopping_lists') THEN
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
    
    -- Adicionar store_info se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopping_lists' AND column_name = 'store_info') THEN
      ALTER TABLE shopping_lists ADD COLUMN store_info JSONB DEFAULT '{}';
    END IF;
  END IF;
END $$;

-- =====================================================
-- NOVAS TABELAS ESSENCIAIS
-- =====================================================

-- Categorias de produtos com regras de validade
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  default_expiry_rules JSONB DEFAULT '{}',
  storage_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locais de armazenamento (usar tabela existente appliance_locations)
CREATE TABLE IF NOT EXISTS storage_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fridge', 'freezer', 'pantry', 'cabinet', 'counter', 'other')),
  description TEXT,
  icon TEXT,
  default_temperature JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lojas favoritas
CREATE TABLE IF NOT EXISTS stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sugestões de compras inteligentes
CREATE TABLE IF NOT EXISTS shopping_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
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
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  reason TEXT CHECK (reason IN ('expired', 'spoiled', 'forgotten', 'overbought')),
  estimated_value NUMERIC,
  waste_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_product_categories_name ON product_categories(name);
CREATE INDEX IF NOT EXISTS idx_storage_types_type ON storage_types(type);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_suggestions_user_id ON shopping_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_sessions_list_id ON shopping_sessions(list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_sessions_user_id ON shopping_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_consumption_history_product_id ON consumption_history(product_id);
CREATE INDEX IF NOT EXISTS idx_consumption_history_date ON consumption_history(date);
CREATE INDEX IF NOT EXISTS idx_wasted_items_user_id ON wasted_items(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);

-- Índices para produtos (campos novos)
CREATE INDEX IF NOT EXISTS idx_products_sealed_expiry_date ON products(sealed_expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_opened_expiry_date ON products(opened_expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_current_state ON products USING GIN ((current_state));

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para calcular validade automaticamente
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

-- Aplicar trigger para produtos
DROP TRIGGER IF EXISTS calculate_product_expiry_trigger ON products;
CREATE TRIGGER calculate_product_expiry_trigger
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION calculate_product_expiry();

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
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'onboarding_progress' AND column_name = 'updated_at') THEN
        DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON onboarding_progress;
        CREATE TRIGGER update_onboarding_progress_updated_at BEFORE UPDATE ON onboarding_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

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
        WHEN p.opened_expiry_date <= NOW() THEN 'expired_opened'
        WHEN p.opened_expiry_date <= NOW() + INTERVAL '1 day' THEN 'expires_today_opened'
        WHEN p.opened_expiry_date <= NOW() + INTERVAL '3 days' THEN 'expires_soon_opened'
        ELSE 'safe'
    END as expiry_status,
    COALESCE(EXTRACT(DAYS FROM (p.sealed_expiry_date - NOW())), 999) as days_until_sealed_expiry,
    COALESCE(EXTRACT(DAYS FROM (p.opened_expiry_date - NOW())), 999) as days_until_opened_expiry
FROM products p
WHERE (p.sealed_expiry_date IS NOT NULL OR p.opened_expiry_date IS NOT NULL)
ORDER BY 
    CASE 
        WHEN p.sealed_expiry_date <= NOW() THEN 0
        WHEN p.opened_expiry_date <= NOW() THEN 1
        WHEN p.sealed_expiry_date <= NOW() + INTERVAL '1 day' THEN 2
        WHEN p.opened_expiry_date <= NOW() + INTERVAL '1 day' THEN 3
        ELSE 4
    END,
    LEAST(p.sealed_expiry_date, p.opened_expiry_date) ASC;

-- View de produtos com baixo estoque
CREATE OR REPLACE VIEW products_low_stock AS
SELECT 
    p.*,
    (p.consumption->>'current_quantity')::numeric as current_quantity,
    (p.consumption->>'original_quantity')::numeric as original_quantity,
    CASE 
        WHEN (p.consumption->>'current_quantity')::numeric = 0 THEN 'empty'
        WHEN (p.consumption->>'current_quantity')::numeric / (p.consumption->>'original_quantity')::numeric <= 0.2 THEN 'critical'
        WHEN (p.consumption->>'current_quantity')::numeric / (p.consumption->>'original_quantity')::numeric <= 0.5 THEN 'low'
        ELSE 'normal'
    END as stock_status
FROM products p
WHERE p.consumption->>'current_quantity' IS NOT NULL
  AND (p.consumption->>'original_quantity')::numeric > 0
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
('Condimentos', 'shaker', '#9C27B0', '{"sealed_days": 365, "opened_days": 180}'),
('Limpeza', 'spray', '#607D8B', '{"sealed_days": 365, "opened_days": 365}'),
('Higiene', 'soap', '#9E9E9E', '{"sealed_days": 365, "opened_days": 365}')
ON CONFLICT DO NOTHING;

-- Tipos de armazenamento
INSERT INTO storage_types (name, type, description, icon) VALUES
('Geladeira', 'fridge', 'Refrigerador doméstico', 'refrigerator'),
('Freezer', 'freezer', 'Congelador', 'snowflake'),
('Despensa', 'pantry', 'Armário seco', 'archive'),
('Armário', 'cabinet', 'Armário de cozinha', 'package'),
('Balcão', 'counter', 'Superfície da cozinha', 'grid'),
('Outro', 'other', 'Outro local', 'more-horizontal')
ON CONFLICT DO NOTHING;

-- =====================================================
-- RLS E POLÍTICAS DE SEGURANÇA
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wasted_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Políticas para novas tabelas
DROP POLICY IF EXISTS "Anyone can view product_categories" ON product_categories;
CREATE POLICY "Anyone can view product_categories" ON product_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view storage_types" ON storage_types;
CREATE POLICY "Anyone can view storage_types" ON storage_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own stores" ON stores;
CREATE POLICY "Users can view own stores" ON stores FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own stores" ON stores;
CREATE POLICY "Users can manage own stores" ON stores FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own shopping_suggestions" ON shopping_suggestions;
CREATE POLICY "Users can view own shopping_suggestions" ON shopping_suggestions FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own shopping_suggestions" ON shopping_suggestions;
CREATE POLICY "Users can manage own shopping_suggestions" ON shopping_suggestions FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own shopping_sessions" ON shopping_sessions;
CREATE POLICY "Users can view own shopping_sessions" ON shopping_sessions FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own shopping_sessions" ON shopping_sessions;
CREATE POLICY "Users can manage own shopping_sessions" ON shopping_sessions FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own consumption_history" ON consumption_history;
CREATE POLICY "Users can view own consumption_history" ON consumption_history FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own consumption_history" ON consumption_history;
CREATE POLICY "Users can manage own consumption_history" ON consumption_history FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own wasted_items" ON wasted_items;
CREATE POLICY "Users can view own wasted_items" ON wasted_items FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own wasted_items" ON wasted_items;
CREATE POLICY "Users can manage own wasted_items" ON wasted_items FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own onboarding_progress" ON onboarding_progress;
CREATE POLICY "Users can view own onboarding_progress" ON onboarding_progress FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own onboarding_progress" ON onboarding_progress;
CREATE POLICY "Users can manage own onboarding_progress" ON onboarding_progress FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=== SUPABASE ENHANCED SCHEMA COMPATÍVEL CRIADO ===';
  RAISE NOTICE 'Tabelas existentes atualizadas: profiles, shopping_lists, products';
  RAISE NOTICE 'Novas funcionalidades em products: validade inteligente, estado, consumo';
  RAISE NOTICE 'Novas tabelas: product_categories, storage_types, notifications';
  RAISE NOTICE 'Lista de compras: shopping_suggestions, shopping_sessions';
  RAISE NOTICE 'Notificações: notifications com tipos específicos';
  RAISE NOTICE 'Insights: consumption_history, wasted_items';
  RAISE NOTICE 'Onboarding: onboarding_progress';
  RAISE NOTICE 'Categorias: % criadas', (SELECT COUNT(*) FROM product_categories);
  RAISE NOTICE 'Storage types: % criados', (SELECT COUNT(*) FROM storage_types);
  RAISE NOTICE 'Views criadas: products_expiring_soon, products_low_stock';
  RAISE NOTICE '==========================================';
END $$;
