-- Execute System Tables Migration
-- Creates all tables needed for the Execute tab features (20% + 100%)
-- Run after existing CRM tables migration

-- ============================================
-- EXECUTE TASKS TABLE
-- Daily/weekly tasks for the Execute system
-- ============================================
CREATE TABLE IF NOT EXISTS execute_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES user_projects(id) ON DELETE CASCADE NOT NULL,

  -- Task details
  title TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('build', 'launch', 'deliver', 'recap')),
  category TEXT, -- 'content', 'outreach', 'admin', 'improvement', etc.
  points INTEGER DEFAULT 10,

  -- Scheduling
  scheduled_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  -- Optional photo evidence
  completion_photo_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_execute_tasks_user_date ON execute_tasks(user_id, scheduled_date);
CREATE INDEX idx_execute_tasks_user_pending ON execute_tasks(user_id) WHERE completed = false;
CREATE INDEX idx_execute_tasks_project ON execute_tasks(project_id, scheduled_date);

ALTER TABLE execute_tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage own tasks" ON execute_tasks
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- IMPROVEMENTS TABLE
-- Baseline -> hypothesis -> outcome tracking
-- ============================================
CREATE TABLE IF NOT EXISTS improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,

  -- What we're improving
  funnel_stage TEXT NOT NULL, -- matches funnel_metrics stages
  hypothesis TEXT NOT NULL,

  -- Baseline measurement
  baseline_value INTEGER,
  baseline_date DATE,

  -- Outcome measurement
  outcome_value INTEGER,
  outcome_date DATE,
  outcome_positive BOOLEAN,
  outcome_logged BOOLEAN DEFAULT false,

  -- Evidence
  evidence_urls TEXT[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_improvements_user ON improvements(user_id);
CREATE INDEX idx_improvements_pending ON improvements(user_id) WHERE outcome_logged = false;

ALTER TABLE improvements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage own improvements" ON improvements
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- EXECUTE TASK TEMPLATES TABLE
-- Save and reuse task combinations
-- ============================================
CREATE TABLE IF NOT EXISTS execute_task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  description TEXT,

  -- Template data (array of task definitions)
  tasks JSONB NOT NULL,

  -- Usage tracking
  use_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_templates_user ON execute_task_templates(user_id);

ALTER TABLE execute_task_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage own templates" ON execute_task_templates
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- PROGRESS PHOTOS TABLE
-- Visual evidence for tasks/improvements
-- ============================================
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- What it's attached to
  reference_type TEXT NOT NULL CHECK (reference_type IN ('improvement', 'task', 'milestone')),
  reference_id UUID NOT NULL,

  -- Photo data
  storage_path TEXT NOT NULL,
  caption TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_progress_photos_reference ON progress_photos(reference_type, reference_id);
CREATE INDEX idx_progress_photos_user ON progress_photos(user_id);

ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage own photos" ON progress_photos
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- SCHEDULED NOTIFICATIONS TABLE
-- For daily digest and other scheduled notifications
-- ============================================
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  notification_type TEXT NOT NULL, -- 'daily_digest', 'week_planning', 'nudge', etc.
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  payload JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_notifications_pending
  ON scheduled_notifications(scheduled_for)
  WHERE sent_at IS NULL;

ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage own notifications" ON scheduled_notifications
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- COACH NUDGES TABLE
-- Context-aware micro-coaching interventions
-- ============================================
CREATE TABLE IF NOT EXISTS coach_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Nudge content
  trigger_type TEXT NOT NULL,
  message TEXT NOT NULL,
  action_type TEXT, -- 'break_down_task', 'start_improvement', 'log_outcome', etc.
  action_data JSONB DEFAULT '{}',

  -- Status tracking
  shown_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  acted_on_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nudges_user_pending
  ON coach_nudges(user_id, created_at DESC)
  WHERE shown_at IS NULL;

CREATE INDEX idx_nudges_user_recent
  ON coach_nudges(user_id, trigger_type, created_at DESC);

ALTER TABLE coach_nudges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage own nudges" ON coach_nudges
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- AGGREGATED IMPROVEMENTS TABLE
-- Anonymized improvement outcomes for suggestions
-- ============================================
CREATE TABLE IF NOT EXISTS aggregated_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Segmentation (anonymized - no user reference)
  offer_type TEXT NOT NULL,
  audience_bucket TEXT NOT NULL CHECK (audience_bucket IN ('tiny', 'small', 'medium', 'large')),
  funnel_stage TEXT NOT NULL,
  niche_category TEXT, -- broad category, not user-specific

  -- Improvement details
  improvement_type TEXT NOT NULL, -- 'add_testimonials', 'video_intro', 'urgency_copy', etc.
  improvement_description TEXT NOT NULL,

  -- Aggregate outcomes
  times_tried INTEGER DEFAULT 0,
  times_positive_outcome INTEGER DEFAULT 0,
  avg_lift_percentage DECIMAL(5,2),

  -- Confidence (based on sample size)
  confidence_score DECIMAL(3,2),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agg_improvements_segment
  ON aggregated_improvements(offer_type, audience_bucket, funnel_stage);

ALTER TABLE aggregated_improvements ENABLE ROW LEVEL SECURITY;

-- Aggregated data is read-only for all authenticated users
DO $$ BEGIN
  CREATE POLICY "Authenticated users can read aggregated data" ON aggregated_improvements
    FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only service role can insert/update (via backend aggregation job)
DO $$ BEGIN
  CREATE POLICY "Service role can manage aggregated data" ON aggregated_improvements
    FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- PREDICTIONS TABLE
-- ML-powered predictions for outcomes
-- ============================================
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Prediction details
  prediction_type TEXT NOT NULL, -- 'week_completion', 'month_revenue', 'streak_risk', etc.
  prediction_value JSONB NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,

  -- Context (what data was used)
  input_data JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Accuracy tracking (filled in later)
  actual_value JSONB,
  accuracy_logged_at TIMESTAMPTZ
);

CREATE INDEX idx_predictions_user_type
  ON predictions(user_id, prediction_type, generated_at DESC);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage own predictions" ON predictions
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- WEEKLY PLANS TABLE ENHANCEMENTS
-- Add AI planning columns to existing table
-- ============================================

-- Add columns for AI-generated plans (table already exists from 20251230120000)
ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS plan_data JSONB;

ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS context_snapshot JSONB;

ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS accepted BOOLEAN DEFAULT false;

ALTER TABLE weekly_plans
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- Index already exists from original migration, no need to recreate
-- RLS already enabled from original migration

-- ============================================
-- ADD EXECUTION_RATE TO USER_CRM_STATS
-- ============================================
ALTER TABLE user_crm_stats
ADD COLUMN IF NOT EXISTS execution_rate DECIMAL(5,2) DEFAULT 0;

ALTER TABLE user_crm_stats
ADD COLUMN IF NOT EXISTS tasks_completed_this_week INTEGER DEFAULT 0;

ALTER TABLE user_crm_stats
ADD COLUMN IF NOT EXISTS tasks_planned_this_week INTEGER DEFAULT 0;

-- ============================================
-- STORAGE BUCKET FOR PROGRESS PHOTOS
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'progress-photos',
  'progress-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (with duplicate handling)
DO $$ BEGIN
  CREATE POLICY "Users can upload own progress photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'progress-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public can view progress photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'progress-photos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete own progress photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'progress-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- HELPER FUNCTION: Calculate execution rate
-- ============================================
CREATE OR REPLACE FUNCTION calculate_execution_rate(p_user_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  completed_count INTEGER;
  total_count INTEGER;
  week_start DATE;
BEGIN
  -- Get start of current week (Monday)
  week_start := date_trunc('week', CURRENT_DATE)::DATE;

  -- Count tasks for this week
  SELECT
    COUNT(*) FILTER (WHERE completed = true),
    COUNT(*)
  INTO completed_count, total_count
  FROM execute_tasks
  WHERE user_id = p_user_id
    AND scheduled_date >= week_start
    AND scheduled_date < week_start + INTERVAL '7 days';

  -- Return rate (avoid division by zero)
  IF total_count = 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND((completed_count::DECIMAL / total_count) * 100, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION calculate_execution_rate(UUID) TO authenticated;

-- ============================================
-- HELPER FUNCTION: Get week start date
-- ============================================
CREATE OR REPLACE FUNCTION get_week_start(p_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
  -- Return Monday of the week containing p_date
  RETURN date_trunc('week', p_date)::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

GRANT EXECUTE ON FUNCTION get_week_start(DATE) TO authenticated;
