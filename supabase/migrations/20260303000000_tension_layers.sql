-- Add tension layer columns to user_stage_progress
-- Stores the 4-question diagnostic results from onboarding

ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS tension_discover INTEGER;
ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS tension_regulate INTEGER;
ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS tension_reveal INTEGER;
ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS tension_value INTEGER;
ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS priority_layer TEXT;

-- Add default for persona so partial upserts don't fail on NOT NULL constraint
ALTER TABLE user_stage_progress ALTER COLUMN persona SET DEFAULT 'vibe_seeker';

-- Backfill: existing users who already onboarded (have persona set or
-- onboarding_completed = true) should NOT be forced through the new tension
-- onboarding. Set onboarding_v2_completed = true so they skip HomeFirstTime.
UPDATE user_stage_progress
SET onboarding_v2_completed = true
WHERE onboarding_v2_completed IS NOT TRUE
  AND (persona IS NOT NULL OR onboarding_completed = true);
