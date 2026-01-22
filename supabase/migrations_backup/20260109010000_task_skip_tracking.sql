-- Task Skip Tracking - Nervous System Pattern Recognition
-- Captures why users don't complete marketing tasks to understand resistance patterns

-- Skip reason categories
-- External = practical blockers (time, forgot, technical)
-- Internal = nervous system resistance (fear, doubt, overwhelm)

CREATE TABLE IF NOT EXISTS task_skip_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- What was skipped
  task_type TEXT NOT NULL, -- 'marketing_task', 'content_post', 'daily_priority'
  task_id UUID, -- Optional: link to specific task
  task_description TEXT, -- What the task was
  scheduled_date DATE DEFAULT CURRENT_DATE,

  -- Reason category
  reason_category TEXT NOT NULL CHECK (reason_category IN ('external', 'internal')),

  -- External reasons (practical blockers)
  external_reason TEXT CHECK (external_reason IN (
    'no_time', 'forgot', 'technical_issue', 'other_priorities',
    'waiting_on_something', 'not_relevant', 'other'
  )),

  -- Internal reasons (nervous system resistance)
  internal_reason TEXT CHECK (internal_reason IN (
    'fear_of_judgment', 'not_good_enough', 'fear_of_failure',
    'fear_of_success', 'perfectionism', 'overwhelm',
    'imposter_syndrome', 'visibility_fear', 'rejection_fear', 'other'
  )),

  -- Additional context
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10), -- How strong was the resistance? 1-10
  notes TEXT, -- Optional free-form notes

  -- What they chose to do instead (if anything)
  alternative_action TEXT,

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX idx_task_skip_user ON task_skip_reasons(user_id);
CREATE INDEX idx_task_skip_category ON task_skip_reasons(reason_category);
CREATE INDEX idx_task_skip_internal ON task_skip_reasons(internal_reason) WHERE internal_reason IS NOT NULL;
CREATE INDEX idx_task_skip_date ON task_skip_reasons(scheduled_date);

-- Enable RLS
ALTER TABLE task_skip_reasons ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own skip reasons" ON task_skip_reasons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skip reasons" ON task_skip_reasons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skip reasons" ON task_skip_reasons
  FOR UPDATE USING (auth.uid() = user_id);

-- Aggregation view for patterns
CREATE OR REPLACE VIEW user_skip_patterns AS
SELECT
  user_id,
  reason_category,
  COALESCE(external_reason, internal_reason) as reason,
  COUNT(*) as occurrence_count,
  AVG(intensity) as avg_intensity,
  MAX(created_at) as last_occurrence
FROM task_skip_reasons
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id, reason_category, COALESCE(external_reason, internal_reason);

-- Comments for documentation
COMMENT ON TABLE task_skip_reasons IS 'Tracks why users skip marketing tasks - external blockers vs internal resistance';
COMMENT ON COLUMN task_skip_reasons.reason_category IS 'external = practical blockers, internal = nervous system resistance';
COMMENT ON COLUMN task_skip_reasons.internal_reason IS 'Specific fear/resistance pattern: judgment, not_good_enough, failure, etc.';
COMMENT ON COLUMN task_skip_reasons.intensity IS 'How strong the resistance felt, 1-10 scale';
