-- ========================================
-- CORRECTED PRODUCTION CLEANUP SCRIPT
-- ========================================
-- Only deletes from tables that exist in your database
-- Run this in Supabase SQL Editor

BEGIN;

-- Show counts BEFORE cleanup
SELECT 'BEFORE CLEANUP' as status;

SELECT 'lead_flow_profiles' as table_name, COUNT(*) as rows FROM lead_flow_profiles
UNION ALL
SELECT 'challenge_progress', COUNT(*) FROM challenge_progress
UNION ALL
SELECT 'quest_completions', COUNT(*) FROM quest_completions
UNION ALL
SELECT 'challenge_groups', COUNT(*) FROM challenge_groups
UNION ALL
SELECT 'challenge_participants', COUNT(*) FROM challenge_participants
UNION ALL
SELECT 'healing_compass_responses', COUNT(*) FROM healing_compass_responses
UNION ALL
SELECT 'flow_completions', COUNT(*) FROM flow_completions;

-- Delete data (in correct order to respect foreign keys)
DELETE FROM quest_completions;
DELETE FROM flow_completions;
DELETE FROM challenge_participants;
DELETE FROM challenge_progress;
DELETE FROM challenge_groups;
DELETE FROM healing_compass_responses;
DELETE FROM lead_flow_profiles;

-- Show counts AFTER cleanup
SELECT 'AFTER CLEANUP' as status;

SELECT 'lead_flow_profiles' as table_name, COUNT(*) as rows FROM lead_flow_profiles
UNION ALL
SELECT 'challenge_progress', COUNT(*) FROM challenge_progress
UNION ALL
SELECT 'quest_completions', COUNT(*) FROM quest_completions
UNION ALL
SELECT 'challenge_groups', COUNT(*) FROM challenge_groups
UNION ALL
SELECT 'challenge_participants', COUNT(*) FROM challenge_participants
UNION ALL
SELECT 'healing_compass_responses', COUNT(*) FROM healing_compass_responses
UNION ALL
SELECT 'flow_completions', COUNT(*) FROM flow_completions;

-- Everything looks good? Commit the changes
COMMIT;

-- If something went wrong, run this instead:
-- ROLLBACK;
