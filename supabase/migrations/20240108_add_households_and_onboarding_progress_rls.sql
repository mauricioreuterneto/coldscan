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
