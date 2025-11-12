-- ============================================================================
-- Nikigai Supabase Schema Setup
-- Version: 1.0
-- Description: Complete schema for Nikigai AI chat tool with Library of Answers
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- nikigai_sessions: Track user journeys through the Nikigai flow
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nikigai_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session metadata
  flow_version TEXT NOT NULL DEFAULT 'v2.2',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_step_id TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed, abandoned
  completion_percentage INTEGER DEFAULT 0,

  -- Path chosen
  nikigai_path TEXT, -- 'career', 'entrepreneurial', 'both'

  -- Raw data (full flexibility)
  life_map_data JSONB DEFAULT '{}',
  tag_weights JSONB DEFAULT '{}',
  session_metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  CONSTRAINT valid_path CHECK (nikigai_path IS NULL OR nikigai_path IN ('career', 'entrepreneurial', 'both')),
  CONSTRAINT valid_completion CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

-- ----------------------------------------------------------------------------
-- nikigai_clusters: Store all generated clusters (skills, problems, people, market)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nikigai_clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES nikigai_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Cluster identification
  cluster_type TEXT NOT NULL, -- 'skills', 'problems', 'people', 'market'
  cluster_stage TEXT NOT NULL, -- 'preview', 'intermediate', 'final'
  cluster_label TEXT NOT NULL,
  archetype TEXT, -- Role archetype name (if applicable)

  -- Cluster contents
  items JSONB NOT NULL DEFAULT '[]',
  -- Example item structure:
  -- { "text": "...", "tags": {...}, "source_step": "2.0", "bullet_score": 0.85 }

  -- Quality metrics
  score DECIMAL(3,2), -- Overall cluster score (0-1)
  coherence_score DECIMAL(3,2),
  quality_grade TEXT, -- A, B, C, D, F

  -- User modifications
  user_modified BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  merged_from UUID[], -- IDs of clusters that were merged into this one
  merged_into UUID, -- ID of cluster this was merged into
  split_from UUID, -- ID of cluster this was split from
  split_into UUID[], -- IDs of clusters this was split into

  -- Source tracking
  source_responses JSONB DEFAULT '[]', -- Which questions contributed to this cluster
  source_tags TEXT[], -- Which tag types were used

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_cluster_type CHECK (cluster_type IN ('skills', 'problems', 'people', 'market')),
  CONSTRAINT valid_cluster_stage CHECK (cluster_stage IN ('preview', 'intermediate', 'final')),
  CONSTRAINT valid_quality_grade CHECK (quality_grade IS NULL OR quality_grade IN ('A', 'B', 'C', 'D', 'F')),
  CONSTRAINT valid_score CHECK (score IS NULL OR (score >= 0 AND score <= 1)),
  CONSTRAINT valid_coherence CHECK (coherence_score IS NULL OR (coherence_score >= 0 AND coherence_score <= 1))
);

-- ----------------------------------------------------------------------------
-- nikigai_key_outcomes: Flattened table with key outcomes for Library of Answers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nikigai_key_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES nikigai_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Skills Lens Outcomes
  top_skill_clusters JSONB DEFAULT '[]',
  -- [{ label, archetype, items_count, example_skills: [] }]

  suggested_job_titles JSONB DEFAULT '[]',
  -- [{ title, industry, level, match_score }]

  core_skills TEXT[], -- Flat array for easy filtering
  skill_domains TEXT[], -- Flat array of domains

  -- Problems Lens Outcomes
  top_problem_clusters JSONB DEFAULT '[]',
  -- [{ label, items_count, change_statement, example_problems: [] }]

  change_statements TEXT[], -- Flat array of 1-sentence change statements
  industries_aligned TEXT[], -- Industries related to problems

  -- People Lens Outcomes
  empathy_snapshot JSONB,
  -- { who_they_are, what_they_struggle_with, what_they_crave, your_connection }

  target_personas TEXT[], -- Flat array of persona descriptions

  -- Market Lens Outcomes
  solution_categories TEXT[], -- coaching, education, digital-products, etc.
  opportunity_space JSONB DEFAULT '[]',
  -- [{ category, description, match_score }]

  -- Integration Outcomes
  opportunity_statements JSONB DEFAULT '[]',
  -- [{ statement, confidence_score }]

  mission_statement TEXT,
  vision_in_action TEXT,

  -- Life Story Summary
  life_story_one_sentence TEXT,
  top_3_future_pulls TEXT[],
  role_models JSONB DEFAULT '[]',

  -- Timestamps
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: One outcome record per session
  CONSTRAINT unique_session_outcome UNIQUE (session_id)
);

-- ----------------------------------------------------------------------------
-- nikigai_responses: Store raw user responses for each step
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nikigai_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES nikigai_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Step identification
  step_id TEXT NOT NULL,
  step_order_index INTEGER,
  question_text TEXT NOT NULL,

  -- User response
  response_raw TEXT NOT NULL,
  response_structured JSONB, -- If object_list or other structured format
  bullet_count INTEGER,

  -- Extracted tags
  tags_extracted JSONB DEFAULT '{}',
  -- { skill_verb: [], domain_topic: [], value: [], ... }

  tag_weights JSONB DEFAULT '{}',
  -- { joy_weight, meaning_weight, direction_weight, bullet_score }

  -- Quality metrics
  quality_score DECIMAL(3,2),
  sparsity_flag BOOLEAN DEFAULT FALSE,

  -- Timing
  time_to_respond_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_quality_score CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 1)),
  CONSTRAINT valid_bullet_count CHECK (bullet_count IS NULL OR bullet_count >= 0),
  CONSTRAINT valid_response_time CHECK (time_to_respond_seconds IS NULL OR time_to_respond_seconds >= 0)
);

-- ----------------------------------------------------------------------------
-- library_display_cache: Pre-computed views for Library of Answers page
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS library_display_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What to display in Library of Answers
  display_data JSONB NOT NULL,
  -- Entire structured output ready for frontend

  -- Cache metadata
  last_computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cache_version TEXT NOT NULL DEFAULT 'v1',
  is_stale BOOLEAN DEFAULT FALSE,

  -- Foreign keys
  session_id UUID REFERENCES nikigai_sessions(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: One cache per user
  CONSTRAINT unique_user_cache UNIQUE (user_id)
);

-- ----------------------------------------------------------------------------
-- clustering_metrics: Track clustering quality over time
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clustering_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES nikigai_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  step_id TEXT NOT NULL,

  -- Metrics
  cluster_count INTEGER NOT NULL,
  overall_score DECIMAL(3,2),
  coherence DECIMAL(3,2),
  distinctness DECIMAL(3,2),
  silhouette DECIMAL(3,2),
  balance DECIMAL(3,2),
  interpretability DECIMAL(3,2),
  grade TEXT, -- A, B, C, D, F

  -- Recommendation
  recommendation TEXT, -- present_as_is, suggest_review, recommend_refinement

  -- User action
  user_refined BOOLEAN DEFAULT FALSE,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_cluster_count CHECK (cluster_count > 0),
  CONSTRAINT valid_metrics_grade CHECK (grade IS NULL OR grade IN ('A', 'B', 'C', 'D', 'F')),
  CONSTRAINT valid_recommendation CHECK (recommendation IS NULL OR recommendation IN ('present_as_is', 'suggest_review', 'recommend_refinement'))
);

-- ----------------------------------------------------------------------------
-- analytics_events: Track user behavior and system events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES nikigai_sessions(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL,
  -- sparse_response_detected, cluster_refinement, validation_check, etc.

  event_data JSONB DEFAULT '{}',

  -- Timestamp
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- nikigai_sessions indexes
CREATE INDEX IF NOT EXISTS idx_nikigai_sessions_user ON nikigai_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_nikigai_sessions_status ON nikigai_sessions(status);
CREATE INDEX IF NOT EXISTS idx_nikigai_sessions_completed ON nikigai_sessions(completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nikigai_sessions_active ON nikigai_sessions(last_active_at) WHERE status = 'in_progress';

-- nikigai_clusters indexes
CREATE INDEX IF NOT EXISTS idx_clusters_session ON nikigai_clusters(session_id);
CREATE INDEX IF NOT EXISTS idx_clusters_user ON nikigai_clusters(user_id);
CREATE INDEX IF NOT EXISTS idx_clusters_type ON nikigai_clusters(cluster_type);
CREATE INDEX IF NOT EXISTS idx_clusters_final ON nikigai_clusters(cluster_stage) WHERE cluster_stage = 'final';
CREATE INDEX IF NOT EXISTS idx_clusters_active ON nikigai_clusters(session_id, archived) WHERE archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_clusters_type_stage ON nikigai_clusters(cluster_type, cluster_stage, archived);

-- nikigai_key_outcomes indexes
CREATE INDEX IF NOT EXISTS idx_outcomes_user ON nikigai_key_outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_session ON nikigai_key_outcomes(session_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_skills ON nikigai_key_outcomes USING GIN(core_skills);
CREATE INDEX IF NOT EXISTS idx_outcomes_industries ON nikigai_key_outcomes USING GIN(industries_aligned);

-- nikigai_responses indexes
CREATE INDEX IF NOT EXISTS idx_responses_session ON nikigai_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_user ON nikigai_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_step ON nikigai_responses(step_id);
CREATE INDEX IF NOT EXISTS idx_responses_session_step ON nikigai_responses(session_id, step_id);

-- library_display_cache indexes
CREATE INDEX IF NOT EXISTS idx_library_cache_stale ON library_display_cache(is_stale) WHERE is_stale = FALSE;
CREATE INDEX IF NOT EXISTS idx_library_cache_session ON library_display_cache(session_id);

-- clustering_metrics indexes
CREATE INDEX IF NOT EXISTS idx_clustering_metrics_session ON clustering_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_clustering_metrics_user ON clustering_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_clustering_metrics_step ON clustering_metrics(step_id);

-- analytics_events indexes
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_time ON analytics_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_analytics_type_time ON analytics_events(event_type, occurred_at);

-- ============================================================================
-- 4. FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: update_updated_at_column
-- Purpose: Auto-update updated_at timestamps
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: invalidate_library_cache
-- Purpose: Mark cache as stale when clusters change
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION invalidate_library_cache()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE library_display_cache
  SET is_stale = TRUE
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: generate_key_outcomes
-- Purpose: Extract key outcomes from clusters and responses
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_key_outcomes(p_session_id UUID)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_outcome_id UUID;
  v_top_skills JSONB;
  v_top_problems JSONB;
  v_core_skills TEXT[];
  v_skill_domains TEXT[];
  v_change_statements TEXT[];
  v_life_story TEXT;
  v_future_pulls TEXT[];
  v_role_models JSONB;
BEGIN
  -- Get user_id
  SELECT user_id INTO v_user_id FROM nikigai_sessions WHERE id = p_session_id;

  -- Extract top skill clusters
  SELECT jsonb_agg(
    jsonb_build_object(
      'label', cluster_label,
      'archetype', archetype,
      'items_count', jsonb_array_length(items),
      'example_skills', (
        SELECT jsonb_agg(item->>'text')
        FROM jsonb_array_elements(items) item
        LIMIT 5
      )
    ) ORDER BY score DESC
  )
  INTO v_top_skills
  FROM nikigai_clusters
  WHERE session_id = p_session_id
    AND cluster_type = 'skills'
    AND cluster_stage = 'final'
    AND archived = FALSE
  LIMIT 6;

  -- Extract top problem clusters
  SELECT jsonb_agg(
    jsonb_build_object(
      'label', cluster_label,
      'items_count', jsonb_array_length(items),
      'example_problems', (
        SELECT jsonb_agg(item->>'text')
        FROM jsonb_array_elements(items) item
        LIMIT 5
      )
    ) ORDER BY score DESC
  )
  INTO v_top_problems
  FROM nikigai_clusters
  WHERE session_id = p_session_id
    AND cluster_type = 'problems'
    AND cluster_stage = 'final'
    AND archived = FALSE
  LIMIT 6;

  -- Extract core skills (flat array)
  SELECT array_agg(DISTINCT tag)
  INTO v_core_skills
  FROM (
    SELECT jsonb_array_elements_text(
      item->'tags'->'skill_verb'
    ) as tag
    FROM nikigai_clusters,
    LATERAL jsonb_array_elements(items) item
    WHERE session_id = p_session_id
      AND cluster_type = 'skills'
      AND cluster_stage = 'final'
      AND archived = FALSE
  ) skills;

  -- Extract skill domains (flat array)
  SELECT array_agg(DISTINCT tag)
  INTO v_skill_domains
  FROM (
    SELECT jsonb_array_elements_text(
      item->'tags'->'domain_topic'
    ) as tag
    FROM nikigai_clusters,
    LATERAL jsonb_array_elements(items) item
    WHERE session_id = p_session_id
      AND cluster_type = 'skills'
      AND cluster_stage = 'final'
      AND archived = FALSE
  ) domains;

  -- Extract change statements (from problem clusters)
  SELECT array_agg(cluster_label)
  INTO v_change_statements
  FROM nikigai_clusters
  WHERE session_id = p_session_id
    AND cluster_type = 'problems'
    AND cluster_stage = 'final'
    AND archived = FALSE;

  -- Extract life story one sentence
  SELECT response_raw INTO v_life_story
  FROM nikigai_responses
  WHERE session_id = p_session_id
    AND step_id = '9.0'
  LIMIT 1;

  -- Extract future pulls
  SELECT ARRAY(
    SELECT jsonb_array_elements_text(response_structured)
  ) INTO v_future_pulls
  FROM nikigai_responses
  WHERE session_id = p_session_id
    AND step_id = '8.1'
  LIMIT 1;

  -- Extract role models
  SELECT response_structured INTO v_role_models
  FROM nikigai_responses
  WHERE session_id = p_session_id
    AND step_id = '5.0'
  LIMIT 1;

  -- Insert or update key outcomes
  INSERT INTO nikigai_key_outcomes (
    session_id,
    user_id,
    top_skill_clusters,
    top_problem_clusters,
    core_skills,
    skill_domains,
    change_statements,
    life_story_one_sentence,
    top_3_future_pulls,
    role_models
  )
  VALUES (
    p_session_id,
    v_user_id,
    COALESCE(v_top_skills, '[]'::jsonb),
    COALESCE(v_top_problems, '[]'::jsonb),
    v_core_skills,
    v_skill_domains,
    v_change_statements,
    v_life_story,
    v_future_pulls,
    COALESCE(v_role_models, '[]'::jsonb)
  )
  ON CONFLICT (session_id) DO UPDATE SET
    top_skill_clusters = EXCLUDED.top_skill_clusters,
    top_problem_clusters = EXCLUDED.top_problem_clusters,
    core_skills = EXCLUDED.core_skills,
    skill_domains = EXCLUDED.skill_domains,
    change_statements = EXCLUDED.change_statements,
    life_story_one_sentence = EXCLUDED.life_story_one_sentence,
    top_3_future_pulls = EXCLUDED.top_3_future_pulls,
    role_models = EXCLUDED.role_models,
    updated_at = NOW()
  RETURNING id INTO v_outcome_id;

  RETURN v_outcome_id;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: refresh_library_cache
-- Purpose: Rebuild complete library display cache for a user
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_library_cache(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_session_id UUID;
  v_display_data JSONB;
BEGIN
  -- Get user's most recent completed session
  SELECT id INTO v_session_id
  FROM nikigai_sessions
  WHERE user_id = p_user_id
    AND status = 'completed'
  ORDER BY completed_at DESC
  LIMIT 1;

  IF v_session_id IS NULL THEN
    RETURN;
  END IF;

  -- Build complete display data
  SELECT jsonb_build_object(
    'skills', (
      SELECT jsonb_build_object(
        'clusters', COALESCE(
          (SELECT jsonb_agg(
            jsonb_build_object(
              'label', cluster_label,
              'archetype', archetype,
              'items', items,
              'score', score
            ) ORDER BY score DESC
          )
          FROM nikigai_clusters
          WHERE session_id = v_session_id
            AND cluster_type = 'skills'
            AND cluster_stage = 'final'
            AND archived = FALSE
          ), '[]'::jsonb
        ),
        'job_titles', COALESCE(outcomes.suggested_job_titles, '[]'::jsonb),
        'core_skills', COALESCE(outcomes.core_skills, ARRAY[]::TEXT[])
      )
      FROM nikigai_key_outcomes outcomes
      WHERE outcomes.session_id = v_session_id
    ),
    'problems', (
      SELECT jsonb_build_object(
        'clusters', COALESCE(
          (SELECT jsonb_agg(
            jsonb_build_object(
              'label', cluster_label,
              'items', items,
              'score', score
            ) ORDER BY score DESC
          )
          FROM nikigai_clusters
          WHERE session_id = v_session_id
            AND cluster_type = 'problems'
            AND cluster_stage = 'final'
            AND archived = FALSE
          ), '[]'::jsonb
        ),
        'change_statements', COALESCE(outcomes.change_statements, ARRAY[]::TEXT[]),
        'industries', COALESCE(outcomes.industries_aligned, ARRAY[]::TEXT[])
      )
      FROM nikigai_key_outcomes outcomes
      WHERE outcomes.session_id = v_session_id
    ),
    'people', (
      SELECT jsonb_build_object(
        'empathy_snapshot', empathy_snapshot,
        'target_personas', COALESCE(target_personas, ARRAY[]::TEXT[])
      )
      FROM nikigai_key_outcomes
      WHERE session_id = v_session_id
    ),
    'market', (
      SELECT jsonb_build_object(
        'solution_categories', COALESCE(solution_categories, ARRAY[]::TEXT[]),
        'opportunity_space', COALESCE(opportunity_space, '[]'::jsonb)
      )
      FROM nikigai_key_outcomes
      WHERE session_id = v_session_id
    ),
    'integration', (
      SELECT jsonb_build_object(
        'opportunity_statements', COALESCE(opportunity_statements, '[]'::jsonb),
        'mission_statement', mission_statement,
        'vision_in_action', vision_in_action
      )
      FROM nikigai_key_outcomes
      WHERE session_id = v_session_id
    ),
    'life_story', (
      SELECT jsonb_build_object(
        'one_sentence', life_story_one_sentence,
        'future_pulls', COALESCE(top_3_future_pulls, ARRAY[]::TEXT[]),
        'role_models', COALESCE(role_models, '[]'::jsonb)
      )
      FROM nikigai_key_outcomes
      WHERE session_id = v_session_id
    )
  ) INTO v_display_data;

  -- Insert or update cache
  INSERT INTO library_display_cache (user_id, session_id, display_data)
  VALUES (p_user_id, v_session_id, v_display_data)
  ON CONFLICT (user_id) DO UPDATE SET
    session_id = EXCLUDED.session_id,
    display_data = EXCLUDED.display_data,
    last_computed_at = NOW(),
    is_stale = FALSE,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamps
DROP TRIGGER IF EXISTS update_sessions_updated_at ON nikigai_sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON nikigai_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clusters_updated_at ON nikigai_clusters;
CREATE TRIGGER update_clusters_updated_at
  BEFORE UPDATE ON nikigai_clusters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_outcomes_updated_at ON nikigai_key_outcomes;
CREATE TRIGGER update_outcomes_updated_at
  BEFORE UPDATE ON nikigai_key_outcomes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cache_updated_at ON library_display_cache;
CREATE TRIGGER update_cache_updated_at
  BEFORE UPDATE ON library_display_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Invalidate cache when clusters change
DROP TRIGGER IF EXISTS invalidate_cache_on_cluster_change ON nikigai_clusters;
CREATE TRIGGER invalidate_cache_on_cluster_change
  AFTER INSERT OR UPDATE OR DELETE ON nikigai_clusters
  FOR EACH ROW EXECUTE FUNCTION invalidate_library_cache();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE nikigai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nikigai_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE nikigai_key_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nikigai_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_display_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE clustering_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own sessions" ON nikigai_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON nikigai_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON nikigai_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON nikigai_sessions;

DROP POLICY IF EXISTS "Users can view own clusters" ON nikigai_clusters;
DROP POLICY IF EXISTS "Users can insert own clusters" ON nikigai_clusters;
DROP POLICY IF EXISTS "Users can update own clusters" ON nikigai_clusters;
DROP POLICY IF EXISTS "Users can delete own clusters" ON nikigai_clusters;

DROP POLICY IF EXISTS "Users can view own outcomes" ON nikigai_key_outcomes;
DROP POLICY IF EXISTS "Users can insert own outcomes" ON nikigai_key_outcomes;
DROP POLICY IF EXISTS "Users can update own outcomes" ON nikigai_key_outcomes;
DROP POLICY IF EXISTS "Users can delete own outcomes" ON nikigai_key_outcomes;

DROP POLICY IF EXISTS "Users can view own responses" ON nikigai_responses;
DROP POLICY IF EXISTS "Users can insert own responses" ON nikigai_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON nikigai_responses;
DROP POLICY IF EXISTS "Users can delete own responses" ON nikigai_responses;

DROP POLICY IF EXISTS "Users can view own cache" ON library_display_cache;
DROP POLICY IF EXISTS "Users can insert own cache" ON library_display_cache;
DROP POLICY IF EXISTS "Users can update own cache" ON library_display_cache;
DROP POLICY IF EXISTS "Users can delete own cache" ON library_display_cache;

DROP POLICY IF EXISTS "Users can view own metrics" ON clustering_metrics;
DROP POLICY IF EXISTS "Users can insert own metrics" ON clustering_metrics;

DROP POLICY IF EXISTS "Users can view own events" ON analytics_events;
DROP POLICY IF EXISTS "Users can insert own events" ON analytics_events;

-- nikigai_sessions policies
CREATE POLICY "Users can view own sessions"
  ON nikigai_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON nikigai_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON nikigai_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON nikigai_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- nikigai_clusters policies
CREATE POLICY "Users can view own clusters"
  ON nikigai_clusters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clusters"
  ON nikigai_clusters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clusters"
  ON nikigai_clusters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clusters"
  ON nikigai_clusters FOR DELETE
  USING (auth.uid() = user_id);

-- nikigai_key_outcomes policies
CREATE POLICY "Users can view own outcomes"
  ON nikigai_key_outcomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outcomes"
  ON nikigai_key_outcomes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outcomes"
  ON nikigai_key_outcomes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own outcomes"
  ON nikigai_key_outcomes FOR DELETE
  USING (auth.uid() = user_id);

-- nikigai_responses policies
CREATE POLICY "Users can view own responses"
  ON nikigai_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses"
  ON nikigai_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own responses"
  ON nikigai_responses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own responses"
  ON nikigai_responses FOR DELETE
  USING (auth.uid() = user_id);

-- library_display_cache policies
CREATE POLICY "Users can view own cache"
  ON library_display_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cache"
  ON library_display_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cache"
  ON library_display_cache FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cache"
  ON library_display_cache FOR DELETE
  USING (auth.uid() = user_id);

-- clustering_metrics policies
CREATE POLICY "Users can view own metrics"
  ON clustering_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics"
  ON clustering_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- analytics_events policies
CREATE POLICY "Users can view own events"
  ON analytics_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- Verify tables created
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'nikigai_sessions',
      'nikigai_clusters',
      'nikigai_key_outcomes',
      'nikigai_responses',
      'library_display_cache',
      'clustering_metrics',
      'analytics_events'
    );

  RAISE NOTICE '✅ Created % out of 7 tables', table_count;

  IF table_count = 7 THEN
    RAISE NOTICE '✅ All Nikigai tables created successfully!';
    RAISE NOTICE '✅ All indexes created';
    RAISE NOTICE '✅ All functions created';
    RAISE NOTICE '✅ All triggers created';
    RAISE NOTICE '✅ Row Level Security enabled';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Nikigai schema setup complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test with: SELECT * FROM nikigai_sessions LIMIT 1;';
    RAISE NOTICE '2. Create your first session in your app';
    RAISE NOTICE '3. Use generate_key_outcomes(session_id) to extract outcomes';
    RAISE NOTICE '4. Use refresh_library_cache(user_id) for Library of Answers';
  ELSE
    RAISE WARNING '⚠️ Only % out of 7 tables created. Check for errors above.', table_count;
  END IF;
END $$;
