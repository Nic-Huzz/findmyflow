-- ============================================================================
-- Phase 4A: Flow Tracker System
-- Daily flow logging with compass-based tracking
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: user_projects
-- Represents a project/offer the user is building
-- V1: Single project per user, auto-created from flow completion
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Project details
  name text NOT NULL,
  description text,

  -- Source tracking
  source_flow text, -- 'nikigai', '100m_offer', '100m_money_model'
  source_session_id uuid, -- Reference to nikigai_sessions

  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_projects_pkey PRIMARY KEY (id),
  -- Prevent duplicate projects from same flow session
  CONSTRAINT user_projects_user_source_unique UNIQUE (user_id, source_flow, source_session_id)
);

-- ----------------------------------------------------------------------------
-- Table: flow_entries
-- Individual flow tracking entries (daily logging)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flow_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.user_projects(id) ON DELETE SET NULL, -- Nullable for flexibility

  -- Compass direction (computed from internal + external state)
  direction text NOT NULL CHECK (direction IN ('north', 'east', 'south', 'west')),

  -- Raw inputs (stored for AI analysis)
  internal_state text NOT NULL CHECK (internal_state IN ('excited', 'tired')),
  external_state text NOT NULL CHECK (external_state IN ('ease', 'resistance')),

  -- Context
  activity_description text, -- What were they doing?
  reasoning text NOT NULL, -- Why this direction? (required for insights)

  -- Optional: Link to challenge system
  challenge_instance_id uuid REFERENCES public.challenge_progress(id) ON DELETE SET NULL,
  quest_completion_id uuid REFERENCES public.quest_completions(id) ON DELETE SET NULL,

  -- Timestamps
  logged_at timestamptz NOT NULL DEFAULT now(),
  activity_date date DEFAULT CURRENT_DATE, -- What day this refers to

  CONSTRAINT flow_entries_pkey PRIMARY KEY (id)
);

-- ----------------------------------------------------------------------------
-- Table: flow_patterns
-- AI-generated pattern analysis (computed periodically or on-demand)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flow_patterns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.user_projects(id) ON DELETE CASCADE,

  -- Analysis period
  analysis_period text NOT NULL, -- 'weekly', 'monthly', 'all_time'
  period_start date NOT NULL,
  period_end date NOT NULL,

  -- Pattern data (computed)
  dominant_direction text, -- Most common direction
  direction_distribution jsonb DEFAULT '{}', -- {"north": 5, "east": 3, "south": 2, "west": 1}
  consistency_score numeric, -- 0-1, how consistent are responses

  -- AI Insights (from Edge Function)
  reasoning_clusters jsonb DEFAULT '[]', -- Grouped themes from reasoning text
  key_patterns jsonb DEFAULT '[]', -- Array of identified patterns
  recommendations jsonb DEFAULT '[]', -- AI suggestions

  -- Summary
  summary_text text, -- Human-readable summary

  generated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT flow_patterns_pkey PRIMARY KEY (id),
  -- One pattern per period per project
  CONSTRAINT flow_patterns_unique UNIQUE (user_id, project_id, analysis_period, period_start)
);

-- ----------------------------------------------------------------------------
-- Table: flow_entry_tags
-- Tags extracted from reasoning text (for clustering and pattern detection)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flow_entry_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  flow_entry_id uuid NOT NULL REFERENCES public.flow_entries(id) ON DELETE CASCADE,

  tag text NOT NULL,
  tag_category text, -- 'activity', 'emotion', 'person', 'blocker', 'win', etc.
  confidence numeric DEFAULT 1.0, -- AI confidence score

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT flow_entry_tags_pkey PRIMARY KEY (id)
);

-- ----------------------------------------------------------------------------
-- Indexes for efficient queries
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_projects_user ON public.user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_source ON public.user_projects(source_flow, source_session_id);

CREATE INDEX IF NOT EXISTS idx_flow_entries_user_date ON public.flow_entries(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_flow_entries_direction ON public.flow_entries(user_id, direction);
CREATE INDEX IF NOT EXISTS idx_flow_entries_project ON public.flow_entries(project_id);

CREATE INDEX IF NOT EXISTS idx_flow_patterns_user ON public.flow_patterns(user_id, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_flow_entry_tags_entry ON public.flow_entry_tags(flow_entry_id);
CREATE INDEX IF NOT EXISTS idx_flow_entry_tags_category ON public.flow_entry_tags(tag_category);

-- ----------------------------------------------------------------------------
-- RLS Policies
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_entry_tags ENABLE ROW LEVEL SECURITY;

-- user_projects policies
CREATE POLICY "Users can view own projects" ON public.user_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON public.user_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.user_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.user_projects
  FOR DELETE USING (auth.uid() = user_id);

-- flow_entries policies
CREATE POLICY "Users can view own flow entries" ON public.flow_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flow entries" ON public.flow_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flow entries" ON public.flow_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flow entries" ON public.flow_entries
  FOR DELETE USING (auth.uid() = user_id);

-- flow_patterns policies (read-only for users, written by Edge Function)
CREATE POLICY "Users can view own patterns" ON public.flow_patterns
  FOR SELECT USING (auth.uid() = user_id);

-- flow_entry_tags policies (read-only for users, written by Edge Function)
CREATE POLICY "Users can view own tags" ON public.flow_entry_tags
  FOR SELECT USING (
    flow_entry_id IN (SELECT id FROM public.flow_entries WHERE user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- Add default_project_id to user_stage_progress (recommended change #1)
-- Links user's active project to their stage progress
-- ----------------------------------------------------------------------------
ALTER TABLE public.user_stage_progress
ADD COLUMN IF NOT EXISTS default_project_id uuid REFERENCES public.user_projects(id) ON DELETE SET NULL;

-- Index for efficient project lookups
CREATE INDEX IF NOT EXISTS idx_user_stage_progress_project ON public.user_stage_progress(default_project_id);

-- ----------------------------------------------------------------------------
-- Verification Queries
-- ----------------------------------------------------------------------------
-- Check tables were created
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_projects', 'flow_entries', 'flow_patterns', 'flow_entry_tags')
ORDER BY tablename;

-- Check RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('user_projects', 'flow_entries', 'flow_patterns', 'flow_entry_tags')
ORDER BY tablename, policyname;
