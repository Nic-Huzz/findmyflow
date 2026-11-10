-- Money Map: financial security path tracking on quests
-- All columns nullable, no breaking changes to existing data.

ALTER TABLE quests ADD COLUMN IF NOT EXISTS path_type text;
COMMENT ON COLUMN quests.path_type IS 'passion = dream path, financial_security = funds the dream, both = covers both';

ALTER TABLE quests ADD COLUMN IF NOT EXISTS financial_stage text;
COMMENT ON COLUMN quests.financial_stage IS 'Courage challenge ladder stage for financial security paths';

ALTER TABLE quests ADD COLUMN IF NOT EXISTS acquisition_method text;
COMMENT ON COLUMN quests.acquisition_method IS 'How user plans to find work: employment, free_work, warm_outreach, content, cold_outreach, paid_ads, both';

-- Track Money Map flow completion
ALTER TABLE user_stage_progress ADD COLUMN IF NOT EXISTS money_map_completed boolean DEFAULT false;
