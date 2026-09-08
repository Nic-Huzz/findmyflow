-- Add career vector and format picks to quests table
-- Stores deep dive selections from /choose-quests bridge flow
-- career_vector: do_it | guide_it | build_around (hobby excluded, those don't create quests)
-- format_picks: array of format labels the user selected (e.g. ['Silent disco', 'Morning sober dance'])

ALTER TABLE quests ADD COLUMN IF NOT EXISTS career_vector text;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS format_picks text[];
