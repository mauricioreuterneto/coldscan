-- Update RLS policies to allow authenticated users to insert models

-- Drop old policy
DROP POLICY IF EXISTS "Apenas admin pode inserir modelos" ON fridge_models_processed;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir modelos" ON fridge_models_processed;

-- Create new policy allowing authenticated users to insert
CREATE POLICY "Usuários autenticados podem inserir modelos" ON fridge_models_processed FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
