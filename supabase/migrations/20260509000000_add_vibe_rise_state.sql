-- Add 'vibe_rise' as 4th nervous system state (the goal state: activated safety)
-- Updates CHECK constraints on before_state and after_state columns.

ALTER TABLE nervous_system_checkins
  DROP CONSTRAINT IF EXISTS nervous_system_checkins_before_state_check;

ALTER TABLE nervous_system_checkins
  ADD CONSTRAINT nervous_system_checkins_before_state_check
  CHECK (before_state IN ('vibe_rise', 'ventral', 'sympathetic', 'dorsal'));

ALTER TABLE nervous_system_checkins
  DROP CONSTRAINT IF EXISTS nervous_system_checkins_after_state_check;

ALTER TABLE nervous_system_checkins
  ADD CONSTRAINT nervous_system_checkins_after_state_check
  CHECK (after_state IN ('vibe_rise', 'ventral', 'sympathetic', 'dorsal'));
