-- Add 'boost' to checkin_type CHECK constraint for Vibe Rise source tracking
ALTER TABLE nervous_system_checkins DROP CONSTRAINT IF EXISTS nervous_system_checkins_checkin_type_check;
ALTER TABLE nervous_system_checkins ADD CONSTRAINT nervous_system_checkins_checkin_type_check
  CHECK (checkin_type = ANY (ARRAY['playlist','healing','daily','tune','drain','stall','boost']));
