-- Pay The Bills: bridge job tracking columns on quests
ALTER TABLE quests ADD COLUMN IF NOT EXISTS is_bridge_job boolean DEFAULT false;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS job_relationship text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS bridge_status text;

COMMENT ON COLUMN quests.is_bridge_job IS 'True if this quest is a bridge job (paying bills while flow grows)';
COMMENT ON COLUMN quests.job_relationship IS 'grow_this | pay_bills | keen_to_quit | bridge_found';
COMMENT ON COLUMN quests.bridge_status IS 'active | searching | completed | null';
