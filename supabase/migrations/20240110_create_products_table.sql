-- Criar tabela products
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  storage_location_id UUID,
  name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  category TEXT,
  quantity NUMERIC,
  unit TEXT,
  image_url TEXT,
  location JSONB DEFAULT '{}',
  current_state JSONB DEFAULT '{}',
  consumption JSONB DEFAULT '{}',
  sealed_expiry_date TIMESTAMP WITH TIME ZONE,
  purchase_info JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna household_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'household_id'
    ) THEN
        ALTER TABLE products ADD COLUMN household_id UUID;
    END IF;
END $$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_products_household_id ON products(household_id);
CREATE INDEX IF NOT EXISTS idx_products_storage_location_id ON products(storage_location_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Usuários podem ver products" ON products;
DROP POLICY IF EXISTS "Usuários podem criar products" ON products;
DROP POLICY IF EXISTS "Usuários podem atualizar products" ON products;

-- Allow authenticated users to read products
CREATE POLICY "Usuários podem ver products" ON products FOR SELECT USING (
  auth.uid() IS NOT NULL
);

-- Allow authenticated users to insert products
CREATE POLICY "Usuários podem criar products" ON products FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Allow authenticated users to update products
CREATE POLICY "Usuários podem atualizar products" ON products FOR UPDATE USING (
  auth.uid() IS NOT NULL
);
