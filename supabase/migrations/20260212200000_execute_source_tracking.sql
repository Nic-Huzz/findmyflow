-- Execute Source Tracking Migration
-- Adds source tracking columns so weekly plans and content plans
-- can sync tasks into the execute system automatically.

-- 1. Add source tracking columns
ALTER TABLE execute_tasks ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE execute_tasks ADD COLUMN IF NOT EXISTS source_ref TEXT;

-- 2. Index for efficient sync queries (delete + lookup by source)
CREATE INDEX IF NOT EXISTS idx_execute_tasks_source
  ON execute_tasks(user_id, source, scheduled_date);

-- 3. Backfill existing framework rows for consistency
UPDATE execute_tasks SET source = 'framework' WHERE is_framework = true AND source = 'manual';
