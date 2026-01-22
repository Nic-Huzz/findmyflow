-- Content Copilot Schema
-- Unified content marketing system: Strategy → Generate → Execute

-- ============================================
-- 1. Content Strategies Table
-- ============================================
-- Stores user's marketing strategy preferences
-- Users can update weekly or continue with existing strategy

CREATE TABLE IF NOT EXISTS content_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- From Lead Strategy Assessment (pulled automatically if exists)
  lead_strategy TEXT NOT NULL DEFAULT 'post_free_content',
  -- Options: 'warm_outreach', 'cold_outreach', 'post_free_content', 'run_paid_ads'
  lead_strategy_assessment_id UUID,

  -- Platform Preferences
  primary_platform TEXT NOT NULL DEFAULT 'linkedin',
  -- Options: 'linkedin', 'instagram', 'twitter', 'tiktok', 'facebook'
  secondary_platform TEXT,

  -- Time & Frequency
  days_per_week INTEGER NOT NULL DEFAULT 5,
  -- Options: 3, 4, 5, 6, 7
  minutes_per_day INTEGER NOT NULL DEFAULT 60,
  -- Options: 30, 60, 120, 180

  -- Content Preferences (array of selected types)
  content_types TEXT[] NOT NULL DEFAULT ARRAY['text_post', 'carousel'],
  -- Options: 'text_post', 'carousel', 'short_video', 'long_video', 'stories', 'threads', 'newsletter'

  -- Generated Schedule Template (JSON structure for the week)
  weekly_template JSONB,

  -- Weekly update tracking
  last_updated_week DATE, -- Week start date when last modified
  weeks_unchanged INTEGER DEFAULT 0, -- How many weeks using same strategy

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_strategy UNIQUE(user_id)
);

-- Index for fast lookups
CREATE INDEX idx_content_strategies_user ON content_strategies(user_id);

-- RLS Policies
ALTER TABLE content_strategies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Users can view own strategy"
  ON content_strategies FOR SELECT
  USING (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can insert own strategy"
  ON content_strategies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can update own strategy"
  ON content_strategies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
CREATE POLICY "Users can delete own strategy"
  ON content_strategies FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================
-- 2. Modify marketing_tasks Table
-- ============================================
-- Add columns to link tasks to generated content

ALTER TABLE marketing_tasks
ADD COLUMN IF NOT EXISTS content_id UUID REFERENCES content_history(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS slot_number INTEGER,
ADD COLUMN IF NOT EXISTS task_category TEXT DEFAULT 'content';
-- Categories: 'content', 'engagement', 'outreach', 'analytics', 'planning'

-- Index for finding tasks with/without content
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_content ON marketing_tasks(content_id);
CREATE INDEX IF NOT EXISTS idx_marketing_tasks_category ON marketing_tasks(task_category);


-- ============================================
-- 3. Modify content_history Table
-- ============================================
-- Add columns to link content back to tasks and scheduling

ALTER TABLE content_history
ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES marketing_tasks(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS week_start_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_day TEXT,
ADD COLUMN IF NOT EXISTS scheduled_slot INTEGER;

-- Index for finding content by week
CREATE INDEX IF NOT EXISTS idx_content_history_week ON content_history(week_start_date);
CREATE INDEX IF NOT EXISTS idx_content_history_task ON content_history(task_id);


-- ============================================
-- 4. Fix marketing_tasks INSERT policy
-- ============================================
-- The INSERT policy was missing WITH CHECK

DROP POLICY IF EXISTS "Users can insert own marketing tasks" ON marketing_tasks;
DO $$ BEGIN
CREATE POLICY "Users can insert own marketing tasks"
  ON marketing_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ============================================
-- 5. Update trigger for content_strategies
-- ============================================
-- Auto-update the updated_at timestamp

CREATE OR REPLACE FUNCTION update_content_strategy_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS content_strategy_updated ON content_strategies;
CREATE TRIGGER content_strategy_updated
  BEFORE UPDATE ON content_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_content_strategy_timestamp();
