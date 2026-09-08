-- Add current job columns to quests (these exist in prod but had no migration file)
-- is_current_job: flags the quest as the user's current work (from /add-current-job flow)
-- life_fuel_baseline: which life fuels the current job provides { choice, connection, mastery, meaning }
-- current_dimensions: current dome dimension levels (jsonb)

ALTER TABLE quests
  ADD COLUMN IF NOT EXISTS is_current_job boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS life_fuel_baseline jsonb,
  ADD COLUMN IF NOT EXISTS current_dimensions jsonb DEFAULT '{}';
