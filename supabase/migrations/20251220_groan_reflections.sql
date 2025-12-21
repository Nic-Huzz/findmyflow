-- ============================================================================
-- Groan Reflections Table
-- Captures protective voices and fears when completing external/visibility quests
-- Feeds into: Nervous System flow, Healing Compass, AI personalization
-- ============================================================================

-- Create enum for protective archetypes (from Lead Magnet flow)
CREATE TYPE protective_archetype AS ENUM (
  'ghost',
  'people_pleaser',
  'perfectionist',
  'performer',
  'controller'
);

-- Create enum for fear types
CREATE TYPE fear_type AS ENUM (
  'rejection',
  'judgment',
  'not_good_enough',
  'failure',
  'visibility',
  'success',
  'other'
);

-- Create enum for flow direction (external action flow tracker)
-- Note: If this enum already exists from flow_entries, skip this
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flow_direction') THEN
    CREATE TYPE flow_direction AS ENUM ('north', 'east', 'south', 'west');
  END IF;
END $$;

-- Create the groan_reflections table
CREATE TABLE groan_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_completion_id UUID REFERENCES quest_completions(id) ON DELETE SET NULL,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,
  challenge_instance_id UUID,  -- Links to challenge_progress.challenge_instance_id (no FK due to compound key)

  -- Reflection data
  protective_archetype protective_archetype,
  fear_type fear_type,
  flow_direction flow_direction,  -- External action flow: how did the process feel?
  reflection_note TEXT,

  -- Context
  quest_category TEXT,  -- Copied from quest for easier querying
  stage INTEGER,        -- Stage when this was captured

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure we can easily query by user and project
  CONSTRAINT groan_reflections_user_project_idx UNIQUE (id, user_id)
);

-- ============================================================================
-- Indexes for common query patterns
-- ============================================================================

-- Query all reflections for a user
CREATE INDEX idx_groan_reflections_user ON groan_reflections(user_id);

-- Query reflections by project
CREATE INDEX idx_groan_reflections_project ON groan_reflections(project_id);

-- Query reflections by challenge instance
CREATE INDEX idx_groan_reflections_challenge ON groan_reflections(challenge_instance_id);

-- Query fear patterns
CREATE INDEX idx_groan_reflections_fear ON groan_reflections(user_id, fear_type);

-- Query archetype patterns
CREATE INDEX idx_groan_reflections_archetype ON groan_reflections(user_id, protective_archetype);

-- Query by stage for progression analysis
CREATE INDEX idx_groan_reflections_stage ON groan_reflections(user_id, stage);

-- Time-based queries for trend analysis
CREATE INDEX idx_groan_reflections_created ON groan_reflections(user_id, created_at DESC);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE groan_reflections ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reflections
CREATE POLICY "Users can view own groan reflections"
  ON groan_reflections FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own reflections
CREATE POLICY "Users can insert own groan reflections"
  ON groan_reflections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reflections
CREATE POLICY "Users can update own groan reflections"
  ON groan_reflections FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own reflections
CREATE POLICY "Users can delete own groan reflections"
  ON groan_reflections FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Helper Views for AI/Analytics
-- ============================================================================

-- View: Fear patterns by user
CREATE OR REPLACE VIEW user_fear_patterns AS
SELECT
  user_id,
  fear_type,
  COUNT(*) as occurrence_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as last_30_days,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7_days,
  MAX(created_at) as last_occurred
FROM groan_reflections
WHERE fear_type IS NOT NULL
GROUP BY user_id, fear_type;

-- View: Archetype patterns by user
CREATE OR REPLACE VIEW user_archetype_patterns AS
SELECT
  user_id,
  protective_archetype,
  COUNT(*) as occurrence_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as last_30_days,
  MAX(created_at) as last_occurred
FROM groan_reflections
WHERE protective_archetype IS NOT NULL
GROUP BY user_id, protective_archetype;

-- View: External action flow patterns (how visibility work feels)
CREATE OR REPLACE VIEW user_visibility_flow_patterns AS
SELECT
  user_id,
  flow_direction,
  COUNT(*) as occurrence_count,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER (PARTITION BY user_id) * 100, 1) as percentage
FROM groan_reflections
WHERE flow_direction IS NOT NULL
GROUP BY user_id, flow_direction;

-- View: Stage progression - do fears decrease over stages?
CREATE OR REPLACE VIEW user_fear_progression AS
SELECT
  user_id,
  stage,
  fear_type,
  COUNT(*) as fear_count
FROM groan_reflections
WHERE fear_type IS NOT NULL AND stage IS NOT NULL
GROUP BY user_id, stage, fear_type
ORDER BY user_id, stage;

-- ============================================================================
-- Grant access to views
-- ============================================================================

GRANT SELECT ON user_fear_patterns TO authenticated;
GRANT SELECT ON user_archetype_patterns TO authenticated;
GRANT SELECT ON user_visibility_flow_patterns TO authenticated;
GRANT SELECT ON user_fear_progression TO authenticated;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE groan_reflections IS 'Captures protective voices and fears when completing external/visibility quests. Used for AI personalization and healing journey tracking.';
COMMENT ON COLUMN groan_reflections.protective_archetype IS 'Which of the 5 protective archetypes showed up: Ghost, People Pleaser, Perfectionist, Performer, Controller';
COMMENT ON COLUMN groan_reflections.fear_type IS 'What fear emerged during the visibility action';
COMMENT ON COLUMN groan_reflections.flow_direction IS 'How did the external action process feel? (N=ease+excited, E=resistance+excited, S=resistance+tired, W=ease+tired)';
COMMENT ON COLUMN groan_reflections.reflection_note IS 'Optional free-text reflection from the user';
