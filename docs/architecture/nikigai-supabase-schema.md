# Nikigai Supabase Schema Design
## Optimized for Library of Answers

## Overview

This schema is designed to:
1. **Store complete data** in JSONB for flexibility
2. **Extract key outcomes** into flattened tables for easy querying
3. **Enable Library of Answers** page with simple queries
4. **Support analytics** and insights

**Design Philosophy:** Hybrid approach — raw JSONB + denormalized views for performance

---

## Core Tables

### 1. `nikigai_sessions`

**Purpose:** Track user journeys through the Nikigai flow

```sql
CREATE TABLE nikigai_sessions (
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

  -- Indexes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nikigai_sessions_user ON nikigai_sessions(user_id);
CREATE INDEX idx_nikigai_sessions_status ON nikigai_sessions(status);
CREATE INDEX idx_nikigai_sessions_completed ON nikigai_sessions(completed_at) WHERE completed_at IS NOT NULL;
```

---

### 2. `nikigai_clusters`

**Purpose:** Store all generated clusters (skills, problems, people, market)

```sql
CREATE TABLE nikigai_clusters (
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

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clusters_session ON nikigai_clusters(session_id);
CREATE INDEX idx_clusters_user ON nikigai_clusters(user_id);
CREATE INDEX idx_clusters_type ON nikigai_clusters(cluster_type);
CREATE INDEX idx_clusters_final ON nikigai_clusters(cluster_stage) WHERE cluster_stage = 'final';
CREATE INDEX idx_clusters_active ON nikigai_clusters(session_id, archived) WHERE archived = FALSE;
```

---

### 3. `nikigai_key_outcomes`

**Purpose:** Flattened table with key outcomes for Library of Answers (EASY EXTRACTION!)

```sql
CREATE TABLE nikigai_key_outcomes (
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

  -- Metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outcomes_user ON nikigai_key_outcomes(user_id);
CREATE INDEX idx_outcomes_session ON nikigai_key_outcomes(session_id);
CREATE INDEX idx_outcomes_skills ON nikigai_key_outcomes USING GIN(core_skills);
CREATE INDEX idx_outcomes_industries ON nikigai_key_outcomes USING GIN(industries_aligned);
```

---

### 4. `nikigai_responses`

**Purpose:** Store raw user responses for each step

```sql
CREATE TABLE nikigai_responses (
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_responses_session ON nikigai_responses(session_id);
CREATE INDEX idx_responses_user ON nikigai_responses(user_id);
CREATE INDEX idx_responses_step ON nikigai_responses(step_id);
```

---

### 5. `library_display_cache`

**Purpose:** Pre-computed views for Library of Answers page (ULTRA-FAST QUERIES!)

```sql
CREATE TABLE library_display_cache (
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

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_library_cache_user ON library_display_cache(user_id);
CREATE INDEX idx_library_cache_stale ON library_display_cache(is_stale) WHERE is_stale = FALSE;
```

---

## Supporting Tables

### 6. `clustering_metrics`

**Purpose:** Track clustering quality over time

```sql
CREATE TABLE clustering_metrics (
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

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clustering_metrics_session ON clustering_metrics(session_id);
```

---

### 7. `analytics_events`

**Purpose:** Track user behavior and system events

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES nikigai_sessions(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL,
  -- sparse_response_detected, cluster_refinement, validation_check, etc.

  event_data JSONB DEFAULT '{}',

  -- Timing
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_time ON analytics_events(occurred_at);
```

---

## Database Functions

### Function: Generate Key Outcomes

```sql
CREATE OR REPLACE FUNCTION generate_key_outcomes(p_session_id UUID)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_outcome_id UUID;
  v_top_skills JSONB;
  v_top_problems JSONB;
  v_core_skills TEXT[];
  v_change_statements TEXT[];
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

  -- Insert or update key outcomes
  INSERT INTO nikigai_key_outcomes (
    session_id,
    user_id,
    top_skill_clusters,
    top_problem_clusters,
    core_skills
  )
  VALUES (
    p_session_id,
    v_user_id,
    v_top_skills,
    v_top_problems,
    v_core_skills
  )
  ON CONFLICT (session_id) DO UPDATE SET
    top_skill_clusters = EXCLUDED.top_skill_clusters,
    top_problem_clusters = EXCLUDED.top_problem_clusters,
    core_skills = EXCLUDED.core_skills,
    updated_at = NOW()
  RETURNING id INTO v_outcome_id;

  RETURN v_outcome_id;
END;
$$ LANGUAGE plpgsql;
```

---

### Function: Refresh Library Cache

```sql
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
        'clusters', jsonb_agg(
          jsonb_build_object(
            'label', cluster_label,
            'archetype', archetype,
            'items', items,
            'score', score
          ) ORDER BY score DESC
        ),
        'job_titles', outcomes.suggested_job_titles,
        'core_skills', outcomes.core_skills
      )
      FROM nikigai_clusters
      LEFT JOIN nikigai_key_outcomes outcomes ON outcomes.session_id = nikigai_clusters.session_id
      WHERE nikigai_clusters.session_id = v_session_id
        AND cluster_type = 'skills'
        AND cluster_stage = 'final'
        AND archived = FALSE
    ),
    'problems', (
      SELECT jsonb_build_object(
        'clusters', jsonb_agg(
          jsonb_build_object(
            'label', cluster_label,
            'items', items,
            'score', score
          ) ORDER BY score DESC
        ),
        'change_statements', outcomes.change_statements,
        'industries', outcomes.industries_aligned
      )
      FROM nikigai_clusters
      LEFT JOIN nikigai_key_outcomes outcomes ON outcomes.session_id = nikigai_clusters.session_id
      WHERE nikigai_clusters.session_id = v_session_id
        AND cluster_type = 'problems'
        AND cluster_stage = 'final'
        AND archived = FALSE
    ),
    'people', (
      SELECT jsonb_build_object(
        'empathy_snapshot', empathy_snapshot,
        'target_personas', target_personas
      )
      FROM nikigai_key_outcomes
      WHERE session_id = v_session_id
    ),
    'market', (
      SELECT jsonb_build_object(
        'solution_categories', solution_categories,
        'opportunity_space', opportunity_space
      )
      FROM nikigai_key_outcomes
      WHERE session_id = v_session_id
    ),
    'integration', (
      SELECT jsonb_build_object(
        'opportunity_statements', opportunity_statements,
        'mission_statement', mission_statement,
        'vision_in_action', vision_in_action
      )
      FROM nikigai_key_outcomes
      WHERE session_id = v_session_id
    ),
    'life_story', (
      SELECT jsonb_build_object(
        'one_sentence', life_story_one_sentence,
        'future_pulls', top_3_future_pulls,
        'role_models', role_models
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
```

---

## Simple Queries for Library of Answers

### Get All Key Outcomes for a User

```sql
SELECT * FROM library_display_cache
WHERE user_id = $1
  AND is_stale = FALSE;
```

**Returns:** Complete structured data ready to display!

---

### Get Skills Summary

```sql
SELECT
  top_skill_clusters,
  suggested_job_titles,
  core_skills
FROM nikigai_key_outcomes
WHERE user_id = $1
ORDER BY updated_at DESC
LIMIT 1;
```

---

### Get Problem/Change Themes

```sql
SELECT
  top_problem_clusters,
  change_statements,
  industries_aligned
FROM nikigai_key_outcomes
WHERE user_id = $1
ORDER BY updated_at DESC
LIMIT 1;
```

---

### Get Complete Nikigai Picture

```sql
SELECT
  outcomes.top_skill_clusters,
  outcomes.top_problem_clusters,
  outcomes.empathy_snapshot,
  outcomes.opportunity_statements,
  outcomes.mission_statement,
  outcomes.life_story_one_sentence,
  sessions.nikigai_path
FROM nikigai_key_outcomes outcomes
JOIN nikigai_sessions sessions ON sessions.id = outcomes.session_id
WHERE outcomes.user_id = $1
  AND sessions.status = 'completed'
ORDER BY sessions.completed_at DESC
LIMIT 1;
```

---

## Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE nikigai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nikigai_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE nikigai_key_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nikigai_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_display_cache ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see their own data
CREATE POLICY "Users can view own sessions"
  ON nikigai_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON nikigai_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON nikigai_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Repeat for all other tables...
CREATE POLICY "Users can view own clusters"
  ON nikigai_clusters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own outcomes"
  ON nikigai_key_outcomes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cache"
  ON library_display_cache FOR SELECT
  USING (auth.uid() = user_id);
```

---

## Triggers for Auto-Update

```sql
-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON nikigai_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clusters_updated_at
  BEFORE UPDATE ON nikigai_clusters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outcomes_updated_at
  BEFORE UPDATE ON nikigai_key_outcomes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

```sql
-- Invalidate cache when clusters change
CREATE OR REPLACE FUNCTION invalidate_library_cache()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE library_display_cache
  SET is_stale = TRUE
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invalidate_cache_on_cluster_change
  AFTER INSERT OR UPDATE OR DELETE ON nikigai_clusters
  FOR EACH ROW EXECUTE FUNCTION invalidate_library_cache();
```

---

## Usage Examples

### 1. Store New Response

```javascript
const { data, error } = await supabase
  .from('nikigai_responses')
  .insert({
    session_id: sessionId,
    user_id: userId,
    step_id: '2.0',
    question_text: 'What did you love doing most?',
    response_raw: userResponse,
    bullet_count: 5,
    tags_extracted: extractedTags,
    tag_weights: calculatedWeights
  })
```

### 2. Create Cluster

```javascript
const { data, error } = await supabase
  .from('nikigai_clusters')
  .insert({
    session_id: sessionId,
    user_id: userId,
    cluster_type: 'skills',
    cluster_stage: 'preview',
    cluster_label: 'Creative Expression',
    archetype: 'The Creator',
    items: clusterItems,
    score: 0.85,
    coherence_score: 0.78,
    quality_grade: 'B',
    source_responses: ['2.0', '2.1', '2.2'],
    source_tags: ['skill_verb', 'domain_topic']
  })
```

### 3. Get Library of Answers Data (ONE QUERY!)

```javascript
const { data, error } = await supabase
  .from('library_display_cache')
  .select('display_data')
  .eq('user_id', userId)
  .eq('is_stale', false)
  .single()

// data.display_data contains EVERYTHING ready to display:
// - skills.clusters
// - skills.job_titles
// - problems.clusters
// - problems.change_statements
// - people.empathy_snapshot
// - market.opportunity_space
// - integration.mission_statement
// - life_story.one_sentence
```

### 4. Refresh Cache After Changes

```javascript
await supabase.rpc('refresh_library_cache', {
  p_user_id: userId
})
```

---

## Performance Optimization

### Materialized View for Common Queries

```sql
CREATE MATERIALIZED VIEW mv_user_nikigai_summary AS
SELECT
  sessions.user_id,
  sessions.id as session_id,
  sessions.nikigai_path,
  sessions.completed_at,
  outcomes.mission_statement,
  outcomes.core_skills,
  outcomes.change_statements,
  jsonb_array_length(outcomes.top_skill_clusters) as skill_cluster_count,
  jsonb_array_length(outcomes.top_problem_clusters) as problem_cluster_count
FROM nikigai_sessions sessions
LEFT JOIN nikigai_key_outcomes outcomes ON outcomes.session_id = sessions.id
WHERE sessions.status = 'completed';

CREATE INDEX idx_mv_user_nikigai_user ON mv_user_nikigai_summary(user_id);

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_nikigai_summary;
```

---

## Migration Script

```sql
-- Run this to set up the complete schema

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create all tables (see definitions above)
-- 3. Create all indexes
-- 4. Create all functions
-- 5. Create all triggers
-- 6. Enable RLS and create policies

-- 7. Initial data population (if migrating existing data)
-- INSERT INTO nikigai_sessions ... FROM old_table ...
```

---

## Summary

**For Library of Answers, you have TWO options:**

### Option A: Ultra-Fast (Recommended)
```javascript
// Single query gets everything
const library = await supabase
  .from('library_display_cache')
  .select('display_data')
  .eq('user_id', userId)
  .single()

// Display directly - no processing needed!
```

### Option B: Granular Control
```javascript
// Separate queries for each section
const skills = await supabase
  .from('nikigai_key_outcomes')
  .select('top_skill_clusters, suggested_job_titles')
  .eq('user_id', userId)

const problems = await supabase
  .from('nikigai_key_outcomes')
  .select('top_problem_clusters, change_statements')
  .eq('user_id', userId)
// etc...
```

**Both are optimized for simple extraction!**

---

**Status:** Ready for implementation
**Priority:** Critical (required for Library of Answers feature)
**Estimated effort:** 2 days schema setup + 1 day migration/testing
