-- Healing Compass V2: Needs-based assessment with splinter visualization
-- Adds new columns to healing_compass_responses and creates healing_checkins table

-- ============================================
-- 1. Add V2 columns to healing_compass_responses
-- ============================================

ALTER TABLE healing_compass_responses
  ADD COLUMN IF NOT EXISTS need_ratings JSONB,
  ADD COLUMN IF NOT EXISTS primary_need TEXT,
  ADD COLUMN IF NOT EXISTS action_text TEXT,
  ADD COLUMN IF NOT EXISTS protective_pattern TEXT,
  ADD COLUMN IF NOT EXISTS splinter_location TEXT,
  ADD COLUMN IF NOT EXISTS splinter_shape TEXT,
  ADD COLUMN IF NOT EXISTS splinter_size TEXT,
  ADD COLUMN IF NOT EXISTS splinter_color TEXT,
  ADD COLUMN IF NOT EXISTS splinter_texture TEXT,
  ADD COLUMN IF NOT EXISTS splinter_movement TEXT,
  ADD COLUMN IF NOT EXISTS flow_version INTEGER DEFAULT 1;

-- CHECK constraints for known values
ALTER TABLE healing_compass_responses
  ADD CONSTRAINT chk_protective_pattern
    CHECK (protective_pattern IS NULL OR protective_pattern IN (
      'ghost', 'performer', 'controller', 'perfectionist', 'people_pleaser'
    ));

ALTER TABLE healing_compass_responses
  ADD CONSTRAINT chk_primary_need
    CHECK (primary_need IS NULL OR primary_need IN (
      'life_design', 'connection', 'mastery', 'meaning'
    ));

-- ============================================
-- 2. Create healing_checkins table
-- ============================================

CREATE TABLE IF NOT EXISTS healing_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  healing_compass_id UUID NOT NULL REFERENCES healing_compass_responses(id) ON DELETE CASCADE,
  need_intensity INTEGER CHECK (need_intensity >= 1 AND need_intensity <= 10),
  splinter_location TEXT,
  splinter_shape TEXT,
  splinter_size TEXT,
  splinter_color TEXT,
  splinter_texture TEXT,
  splinter_movement TEXT,
  quest_id TEXT,
  quest_completion_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_healing_checkins_user_id ON healing_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_healing_checkins_compass_id ON healing_checkins(healing_compass_id);
CREATE INDEX IF NOT EXISTS idx_healing_checkins_created_at ON healing_checkins(created_at);

-- ============================================
-- 3. RLS Policies for healing_checkins
-- ============================================

ALTER TABLE healing_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own healing checkins"
  ON healing_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own healing checkins"
  ON healing_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own healing checkins"
  ON healing_checkins FOR UPDATE
  USING (auth.uid() = user_id);
