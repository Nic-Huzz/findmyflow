-- Diagnostic queries to run in Supabase SQL Editor

-- Query 1: Check if you have any challenge_progress data
SELECT * FROM challenge_progress LIMIT 5;

-- Query 2: Check if you have lead_flow_profiles data
SELECT email, user_name, session_id FROM lead_flow_profiles LIMIT 5;

-- Query 3: Try the leaderboard query that's failing
SELECT
  cp.*,
  lfp.user_name
FROM challenge_progress cp
LEFT JOIN lead_flow_profiles lfp ON cp.session_id = lfp.session_id
ORDER BY cp.total_points DESC
LIMIT 10;

-- Query 4: Check if there's a user_id column in lead_flow_profiles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'lead_flow_profiles';
