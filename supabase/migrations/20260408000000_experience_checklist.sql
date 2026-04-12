-- ============================================================================
-- Experience Checklist System (Phase 1)
-- Pivot: /business becomes an OS for experience creators.
-- V1 scope: experiences + per-experience checklist items.
-- Deferred to Phase 2+: attendee upload (experience_attendees join), reflection.
-- ============================================================================

-- The spine: one row per event/experience the user is running
CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  experience_date DATE,
  status TEXT NOT NULL DEFAULT 'upcoming',

  -- Link back to the previous experience so its 3% note can surface
  previous_experience_id UUID REFERENCES experiences(id) ON DELETE SET NULL,

  -- Reflection fields (filled in Phase 2, post-event)
  wahoo_note TEXT,
  scary_note TEXT,
  three_percent_note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT experiences_status_check
    CHECK (status IN ('upcoming', 'completed', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_experiences_user_id
  ON experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_experiences_user_status
  ON experiences(user_id, status);
CREATE INDEX IF NOT EXISTS idx_experiences_user_date
  ON experiences(user_id, experience_date);

-- Per-experience checklist items (seeded from template on creation, then editable)
CREATE TABLE IF NOT EXISTS experience_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  phase TEXT NOT NULL,      -- 'pre' | 'post'
  section TEXT NOT NULL,    -- 'marketing' | 'organisation' | 'followup' | 'reflection'
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,

  is_custom BOOLEAN DEFAULT FALSE,  -- true = user-added, false = from template
  is_hidden BOOLEAN DEFAULT FALSE,  -- user skipped this seeded item
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT experience_checklist_items_phase_check
    CHECK (phase IN ('pre', 'post')),
  CONSTRAINT experience_checklist_items_section_check
    CHECK (section IN ('marketing', 'organisation', 'followup', 'reflection'))
);

CREATE INDEX IF NOT EXISTS idx_experience_checklist_items_experience
  ON experience_checklist_items(experience_id);
CREATE INDEX IF NOT EXISTS idx_experience_checklist_items_user
  ON experience_checklist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_checklist_items_phase_section
  ON experience_checklist_items(experience_id, phase, section, sort_order);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_checklist_items ENABLE ROW LEVEL SECURITY;

-- experiences policies
DO $$ BEGIN
CREATE POLICY "Users can view own experiences"
  ON experiences FOR SELECT
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "Users can insert own experiences"
  ON experiences FOR INSERT
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "Users can update own experiences"
  ON experiences FOR UPDATE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "Users can delete own experiences"
  ON experiences FOR DELETE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- experience_checklist_items policies
DO $$ BEGIN
CREATE POLICY "Users can view own checklist items"
  ON experience_checklist_items FOR SELECT
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "Users can insert own checklist items"
  ON experience_checklist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "Users can update own checklist items"
  ON experience_checklist_items FOR UPDATE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
CREATE POLICY "Users can delete own checklist items"
  ON experience_checklist_items FOR DELETE
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Auto-update updated_at on experiences
CREATE OR REPLACE FUNCTION update_experiences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_experiences_updated_at ON experiences;
CREATE TRIGGER trg_experiences_updated_at
  BEFORE UPDATE ON experiences
  FOR EACH ROW
  EXECUTE FUNCTION update_experiences_updated_at();
