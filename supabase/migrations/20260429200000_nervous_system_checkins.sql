-- Nervous System Check-In table
-- Stores before/after polyvagal state data from Play-List and Healing challenge completions.
-- Designed for efficient graph queries (baseline trending, state shift tracking).

CREATE TABLE IF NOT EXISTS nervous_system_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  before_state TEXT NOT NULL CHECK (before_state IN ('ventral', 'sympathetic', 'dorsal')),
  after_state TEXT CHECK (after_state IN ('ventral', 'sympathetic', 'dorsal')),
  protective_archetype TEXT,
  checkin_type TEXT NOT NULL CHECK (checkin_type IN ('playlist', 'healing')),
  source_quest_id TEXT,
  source_challenge_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ns_checkins_user ON nervous_system_checkins(user_id, created_at DESC);

ALTER TABLE nervous_system_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own checkins"
  ON nervous_system_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own checkins"
  ON nervous_system_checkins FOR SELECT
  USING (auth.uid() = user_id);
