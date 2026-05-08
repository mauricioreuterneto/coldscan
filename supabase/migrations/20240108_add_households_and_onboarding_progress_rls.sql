-- Enable RLS and add policies for storage_locations table
ALTER TABLE storage_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Usuários podem ver storage_locations" ON storage_locations;
DROP POLICY IF EXISTS "Usuários podem criar storage_locations" ON storage_locations;
DROP POLICY IF EXISTS "Usuários podem atualizar storage_locations" ON storage_locations;

-- Allow authenticated users to read storage locations from their household
CREATE POLICY "Usuários podem ver storage_locations" ON storage_locations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND household_id = storage_locations.household_id
  )
);

-- Allow authenticated users to insert storage locations for their household
CREATE POLICY "Usuários podem criar storage_locations" ON storage_locations FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND household_id = storage_locations.household_id
  )
);

-- Allow authenticated users to update storage locations in their household
CREATE POLICY "Usuários podem atualizar storage_locations" ON storage_locations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND household_id = storage_locations.household_id
  )
);

-- Add unique constraint to onboarding_progress for upsert to work
ALTER TABLE onboarding_progress ADD CONSTRAINT IF NOT EXISTS onboarding_progress_user_id_key UNIQUE (user_id);

-- Enable RLS and add policies for households table
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Usuários podem ver households" ON households;
DROP POLICY IF EXISTS "Usuários podem criar households" ON households;
DROP POLICY IF EXISTS "Usuários podem atualizar households" ON households;

-- Allow authenticated users to read their own households
CREATE POLICY "Usuários podem ver households" ON households FOR SELECT USING (
  auth.uid() IS NOT NULL
);

-- Allow authenticated users to insert households
CREATE POLICY "Usuários podem criar households" ON households FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Allow authenticated users to update their own households
CREATE POLICY "Usuários podem atualizar households" ON households FOR UPDATE USING (
  auth.uid() IS NOT NULL
);

-- Enable RLS and add policies for onboarding_progress table
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Usuários podem ver onboarding_progress" ON onboarding_progress;
DROP POLICY IF EXISTS "Usuários podem criar onboarding_progress" ON onboarding_progress;
DROP POLICY IF EXISTS "Usuários podem atualizar onboarding_progress" ON onboarding_progress;

-- Allow authenticated users to read their own progress
CREATE POLICY "Usuários podem ver onboarding_progress" ON onboarding_progress FOR SELECT USING (
  auth.uid() = user_id
);

-- Allow authenticated users to insert their progress
CREATE POLICY "Usuários podem criar onboarding_progress" ON onboarding_progress FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- Allow authenticated users to update their own progress
CREATE POLICY "Usuários podem atualizar onboarding_progress" ON onboarding_progress FOR UPDATE USING (
  auth.uid() = user_id
);
