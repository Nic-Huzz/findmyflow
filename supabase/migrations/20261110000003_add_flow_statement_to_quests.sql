-- Add flow statement columns to quests table (per-quest category)
ALTER TABLE quests
  ADD COLUMN IF NOT EXISTS flow_statement TEXT,
  ADD COLUMN IF NOT EXISTS flow_themes TEXT[],
  ADD COLUMN IF NOT EXISTS flow_sharpening JSONB;

-- Drop unused global category_statement from user_stage_progress
ALTER TABLE user_stage_progress DROP COLUMN IF EXISTS category_statement;
