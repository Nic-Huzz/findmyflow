-- ============================================================================
-- Creator Assessments (4-Layer Product Suite Self-Assessment)
-- Tracks attraction/core/scale/continuity status over time.
-- Multiple rows per user to show progress on group calls.
-- ============================================================================

CREATE TABLE IF NOT EXISTS creator_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Per-layer: status + free-text detail
  attraction_status TEXT NOT NULL DEFAULT 'missing',
  attraction_detail TEXT,
  core_status TEXT NOT NULL DEFAULT 'missing',
  core_detail TEXT,
  scale_status TEXT NOT NULL DEFAULT 'missing',
  scale_detail TEXT,
  continuity_status TEXT NOT NULL DEFAULT 'missing',
  continuity_detail TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT ca_attraction_check CHECK (attraction_status IN ('have', 'inconsistent', 'missing')),
  CONSTRAINT ca_core_check CHECK (core_status IN ('have', 'inconsistent', 'missing')),
  CONSTRAINT ca_scale_check CHECK (scale_status IN ('have', 'inconsistent', 'missing')),
  CONSTRAINT ca_continuity_check CHECK (continuity_status IN ('have', 'inconsistent', 'missing'))
);

CREATE INDEX IF NOT EXISTS idx_creator_assessments_user
  ON creator_assessments(user_id, created_at DESC);

-- RLS
ALTER TABLE creator_assessments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Users can view own assessments"
  ON creator_assessments FOR SELECT
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "Users can insert own assessments"
  ON creator_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "Users can update own assessments"
  ON creator_assessments FOR UPDATE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
