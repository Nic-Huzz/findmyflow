-- Drain Audit: add drain_note column + 'drain' to checkin_type constraint

ALTER TABLE nervous_system_checkins
  ADD COLUMN IF NOT EXISTS drain_note TEXT;

-- Update checkin_type constraint to include 'drain'
ALTER TABLE nervous_system_checkins
  DROP CONSTRAINT IF EXISTS nervous_system_checkins_checkin_type_check;

ALTER TABLE nervous_system_checkins
  ADD CONSTRAINT nervous_system_checkins_checkin_type_check
  CHECK (checkin_type IN ('playlist', 'healing', 'daily', 'tune', 'drain'));
