-- Add 'daily' to checkin_type CHECK constraint for proactive daily check-ins.

ALTER TABLE nervous_system_checkins
  DROP CONSTRAINT IF EXISTS nervous_system_checkins_checkin_type_check;

ALTER TABLE nervous_system_checkins
  ADD CONSTRAINT nervous_system_checkins_checkin_type_check
  CHECK (checkin_type IN ('playlist', 'healing', 'daily'));

-- Daily check-ins only have before_state (no after_state), so relax NOT NULL on after_state
-- (it's already nullable in the original schema)
