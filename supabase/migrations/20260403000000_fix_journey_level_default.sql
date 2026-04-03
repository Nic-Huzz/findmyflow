-- Fix current_journey_level default to 0 (Level 0: Getting Set Up)
-- Previously defaulted to 1 which skipped Level 0
ALTER TABLE user_stage_progress ALTER COLUMN current_journey_level SET DEFAULT 0;

-- Update any existing users at level 1 who haven't completed Level 0 quests
-- (they were set to 1 by the old default)
-- This is safe: users who have genuinely graduated will have their level preserved
-- by the auto-graduation logic in LevelTab
