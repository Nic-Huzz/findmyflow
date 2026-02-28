-- Founder DNA Quiz results
-- Stores user's quiz answers and matched founder profile
CREATE TABLE IF NOT EXISTS founder_dna_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  selected_games JSONB NOT NULL,
  slider_values JSONB NOT NULL,
  dna_code TEXT NOT NULL,
  archetype TEXT NOT NULL,
  matched_founder TEXT NOT NULL,
  matched_founder_company TEXT,
  match_distance NUMERIC,
  stuck_point_id INTEGER,
  stuck_point_name TEXT,
  follow_up_answers JSONB,
  open_text TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE founder_dna_results ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'founder_dna_results' AND policyname = 'Users can read own results') THEN
    CREATE POLICY "Users can read own results" ON founder_dna_results FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'founder_dna_results' AND policyname = 'Users can insert own results') THEN
    CREATE POLICY "Users can insert own results" ON founder_dna_results FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'founder_dna_results' AND policyname = 'Users can update own results') THEN
    CREATE POLICY "Users can update own results" ON founder_dna_results FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;
