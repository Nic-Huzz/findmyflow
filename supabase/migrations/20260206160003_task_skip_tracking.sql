-- Task Skip Tracking - Nervous System Pattern Recognition

CREATE TABLE IF NOT EXISTS task_skip_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  task_type TEXT NOT NULL,
  task_id UUID,
  task_description TEXT,
  scheduled_date DATE DEFAULT CURRENT_DATE,
  reason_category TEXT NOT NULL CHECK (reason_category IN ('external', 'internal')),
  external_reason TEXT CHECK (external_reason IN (
    'no_time', 'forgot', 'technical_issue', 'other_priorities',
    'waiting_on_something', 'not_relevant', 'other'
  )),
  internal_reason TEXT CHECK (internal_reason IN (
    'fear_of_judgment', 'not_good_enough', 'fear_of_failure',
    'fear_of_success', 'perfectionism', 'overwhelm',
    'imposter_syndrome', 'visibility_fear', 'rejection_fear', 'other'
  )),
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10),
  notes TEXT,
  alternative_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_skip_user ON task_skip_reasons(user_id);
CREATE INDEX IF NOT EXISTS idx_task_skip_category ON task_skip_reasons(reason_category);
CREATE INDEX IF NOT EXISTS idx_task_skip_internal ON task_skip_reasons(internal_reason) WHERE internal_reason IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_skip_date ON task_skip_reasons(scheduled_date);

ALTER TABLE task_skip_reasons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "Users can view own skip reasons" ON task_skip_reasons
  FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Users can insert own skip reasons" ON task_skip_reasons
  FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "Users can update own skip reasons" ON task_skip_reasons
  FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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
