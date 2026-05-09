-- Tune tab schema changes:
-- 1. Add 'tune' to checkin_type CHECK constraint on nervous_system_checkins
-- 2. Make before_state nullable (needed for Tune after-only + simplified Healing after-only)
-- 3. Add 'Tune' to quest_category CHECK constraint on quest_completions

ALTER TABLE nervous_system_checkins
  DROP CONSTRAINT IF EXISTS nervous_system_checkins_checkin_type_check;

ALTER TABLE nervous_system_checkins
  ADD CONSTRAINT nervous_system_checkins_checkin_type_check
  CHECK (checkin_type IN ('playlist', 'healing', 'daily', 'tune'));

ALTER TABLE nervous_system_checkins
  ALTER COLUMN before_state DROP NOT NULL;

-- Add 'Tune' to quest_completions category constraint
ALTER TABLE quest_completions
  DROP CONSTRAINT IF EXISTS check_quest_category;

ALTER TABLE quest_completions
  ADD CONSTRAINT check_quest_category
  CHECK (quest_category IN (
    'Recognise', 'Release', 'Rewire', 'Reconnect',
    'Groans', 'Healing', 'Business', 'Voices',
    'Bonus', 'Daily', 'Weekly', 'Tracker', 'Flow Finder', 'Tune'
  ));
