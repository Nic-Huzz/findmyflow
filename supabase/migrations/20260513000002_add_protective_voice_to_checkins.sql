-- Track which protective voice showed up during a stall
ALTER TABLE nervous_system_checkins ADD COLUMN IF NOT EXISTS protective_voice TEXT;
