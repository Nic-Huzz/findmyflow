-- ============================================================================
-- Experience Blueprints (Shift Architecture)
-- Stores the design of a reconsolidation container before it becomes
-- a live experience with a checklist.
-- ============================================================================

CREATE TABLE IF NOT EXISTS experience_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Step 1: Your Experience
  experience_name TEXT NOT NULL,
  experience_description TEXT,
  source_placemakes JSONB DEFAULT '[]',

  -- Step 2: The Encoding
  target_pattern TEXT,
  target_prediction TEXT,
  target_implicit_belief TEXT,

  -- Step 3: The Arc (6 Shift Architecture phases)
  arc_phases JSONB DEFAULT '[]',

  -- Step 4: Type + Repetition
  experience_type TEXT DEFAULT 'workshop',
  repetition_challenges JSONB DEFAULT '[]',

  -- Link to experience (created on save)
  experience_id UUID REFERENCES experiences(id) ON DELETE SET NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft',
  current_step INT DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT eb_status_check CHECK (status IN ('draft', 'complete'))
);

CREATE INDEX IF NOT EXISTS idx_experience_blueprints_user
  ON experience_blueprints(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_blueprints_user_status
  ON experience_blueprints(user_id, status);

-- Add experience_type to existing experiences table
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS
  experience_type TEXT DEFAULT 'workshop';

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE experience_blueprints ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Users can view own blueprints"
  ON experience_blueprints FOR SELECT
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "Users can insert own blueprints"
  ON experience_blueprints FOR INSERT
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "Users can update own blueprints"
  ON experience_blueprints FOR UPDATE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "Users can delete own blueprints"
  ON experience_blueprints FOR DELETE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_experience_blueprints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_experience_blueprints_updated_at ON experience_blueprints;
CREATE TRIGGER trg_experience_blueprints_updated_at
  BEFORE UPDATE ON experience_blueprints
  FOR EACH ROW
  EXECUTE FUNCTION update_experience_blueprints_updated_at();
