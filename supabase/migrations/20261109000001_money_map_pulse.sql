-- Money Map: weekly pulse check for bills coverage on quests
-- Track when user last confirmed bills are covered for a week

ALTER TABLE quests ADD COLUMN IF NOT EXISTS bills_pulse_week text;
COMMENT ON COLUMN quests.bills_pulse_week IS 'Monday date (YYYY-MM-DD) of last week user confirmed bills are covered. Used for weekly pulse check.';
