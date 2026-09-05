-- Path definition shift columns: life fuel contrast, fear outcome, identity declaration
-- Used in /choose-quests Screen 2a (framing) and 2b (commitment)

ALTER TABLE quests ADD COLUMN IF NOT EXISTS staying_fuels text[];
ALTER TABLE quests ADD COLUMN IF NOT EXISTS path_fuels text[];
ALTER TABLE quests ADD COLUMN IF NOT EXISTS fear_outcome text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS identity_declaration text;
