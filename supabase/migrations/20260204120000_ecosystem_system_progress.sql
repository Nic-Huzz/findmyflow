-- Ecosystem System Progress
-- Tracks which business systems users have set up (Business Flywheel)
CREATE TABLE IF NOT EXISTS ecosystem_system_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phase TEXT NOT NULL,
  system_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, phase, system_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ecosystem_progress_user ON ecosystem_system_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_ecosystem_progress_phase ON ecosystem_system_progress(user_id, phase);

-- RLS
ALTER TABLE ecosystem_system_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ecosystem progress"
  ON ecosystem_system_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ecosystem progress"
  ON ecosystem_system_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ecosystem progress"
  ON ecosystem_system_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE TRIGGER update_ecosystem_progress_updated_at
  BEFORE UPDATE ON ecosystem_system_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
