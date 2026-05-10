-- Fix: before_state CHECK must allow NULL for Tune/Healing after-only check-ins
ALTER TABLE nervous_system_checkins
  DROP CONSTRAINT IF EXISTS nervous_system_checkins_before_state_check;

ALTER TABLE nervous_system_checkins
  ADD CONSTRAINT nervous_system_checkins_before_state_check
  CHECK (before_state IS NULL OR before_state IN ('vibe_rise', 'ventral', 'sympathetic', 'dorsal'));
