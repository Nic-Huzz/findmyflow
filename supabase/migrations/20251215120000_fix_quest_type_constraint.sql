-- Fix quest_category and quest_type constraints to include all values used in the app
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv/sql

ALTER TABLE quest_completions
DROP CONSTRAINT IF EXISTS check_quest_category;

ALTER TABLE quest_completions
ADD CONSTRAINT check_quest_category
CHECK (quest_category IN ('Recognise', 'Release', 'Rewire', 'Reconnect', 'Bonus', 'Daily', 'Weekly', 'Tracker', 'Flow Finder'));

ALTER TABLE quest_completions
DROP CONSTRAINT IF EXISTS check_quest_type;

ALTER TABLE quest_completions
ADD CONSTRAINT check_quest_type
CHECK (quest_type IN ('daily', 'weekly', 'anytime', 'challenge', 'Daily', 'Weekly', 'flow', 'Movement Maker', 'Vibe Riser', 'Vibe Riser, Movement Maker', 'Recognise', 'Release', 'Rewire', 'Reconnect'));
