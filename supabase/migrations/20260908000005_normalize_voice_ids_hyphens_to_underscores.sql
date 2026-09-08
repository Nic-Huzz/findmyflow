-- One-time migration: normalize hyphenated voice IDs to underscores
-- people-pleaser → people_pleaser, auto-pilot → auto_pilot
-- Affects: groan_challenges, quests, nervous_system_checkins, healing_intentions, weekly_reviews

-- groan_challenges: predicted_voice and gap_voice
UPDATE groan_challenges
SET predicted_voice = REPLACE(predicted_voice, '-', '_')
WHERE predicted_voice IN ('people-pleaser', 'auto-pilot');

UPDATE groan_challenges
SET gap_voice = REPLACE(gap_voice, '-', '_')
WHERE gap_voice IN ('people-pleaser', 'auto-pilot');

-- quests: protective_voice
UPDATE quests
SET protective_voice = REPLACE(protective_voice, '-', '_')
WHERE protective_voice IN ('people-pleaser', 'auto-pilot');

-- nervous_system_checkins: protective_voice (from TuneTab stall logs)
UPDATE nervous_system_checkins
SET protective_voice = REPLACE(protective_voice, '-', '_')
WHERE protective_voice IN ('people-pleaser', 'auto-pilot');

-- healing_intentions: pattern and protective_voice
UPDATE healing_intentions
SET pattern = REPLACE(pattern, '-', '_')
WHERE pattern IN ('people-pleaser', 'auto-pilot');

UPDATE healing_intentions
SET protective_voice = REPLACE(protective_voice, '-', '_')
WHERE protective_voice IN ('people-pleaser', 'auto-pilot');

-- voice_pattern_prompts: voice
UPDATE voice_pattern_prompts
SET voice = REPLACE(voice, '-', '_')
WHERE voice IN ('people-pleaser', 'auto-pilot');

-- pattern_healing_responses: voice
UPDATE pattern_healing_responses
SET voice = REPLACE(voice, '-', '_')
WHERE voice IN ('people-pleaser', 'auto-pilot');

-- weekly_reviews: identity_text starts with "people-pleaser:" or "auto-pilot:"
UPDATE weekly_reviews
SET identity_text = REPLACE(identity_text, 'people-pleaser:', 'people_pleaser:')
WHERE identity_text LIKE 'people-pleaser:%';

UPDATE weekly_reviews
SET identity_text = REPLACE(identity_text, 'auto-pilot:', 'auto_pilot:')
WHERE identity_text LIKE 'auto-pilot:%';
