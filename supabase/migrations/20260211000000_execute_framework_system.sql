-- Execute Framework System Migration
-- Adds framework tracking columns to execute_tasks and user_crm_stats

-- 1. Framework tasks are user-level, not project-specific
ALTER TABLE execute_tasks ALTER COLUMN project_id DROP NOT NULL;

-- 2. Track which framework a task represents
ALTER TABLE execute_tasks ADD COLUMN IF NOT EXISTS framework_key TEXT;
ALTER TABLE execute_tasks ADD COLUMN IF NOT EXISTS target_count INTEGER;
ALTER TABLE execute_tasks ADD COLUMN IF NOT EXISTS is_framework BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_execute_tasks_framework
  ON execute_tasks(user_id, framework_key, scheduled_date)
  WHERE framework_key IS NOT NULL;

-- 3. User preferences for framework customization
ALTER TABLE user_crm_stats ADD COLUMN IF NOT EXISTS framework_preferences JSONB DEFAULT '{}';
