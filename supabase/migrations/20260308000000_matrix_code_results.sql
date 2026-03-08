-- Matrix Code Results — stores in-app deep dive quiz results
-- Public quiz saves to lead_flow_profiles; this table is for authenticated users

CREATE TABLE IF NOT EXISTS matrix_code_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_matrix_codes text[] NOT NULL,
  protective_archetype text NOT NULL,
  behavior_responses jsonb DEFAULT '{}'::jsonb,
  archetype_votes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index for user lookups
CREATE INDEX idx_matrix_code_results_user_id ON matrix_code_results(user_id);

-- RLS
ALTER TABLE matrix_code_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own matrix code results"
  ON matrix_code_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own matrix code results"
  ON matrix_code_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);
