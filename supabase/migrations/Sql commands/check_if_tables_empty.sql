-- Check if tables exist and have any data at all

-- Count total rows in each table
SELECT 'notification_preferences' as table_name, COUNT(*) as total_rows
FROM notification_preferences
UNION ALL
SELECT 'push_subscriptions', COUNT(*)
FROM push_subscriptions
UNION ALL
SELECT 'challenge_progress', COUNT(*)
FROM challenge_progress;

-- Check if YOUR user has ANY data
SELECT
  (SELECT COUNT(*) FROM notification_preferences WHERE user_id = 'e1e50c38-94d4-4ce7-b763-b439e49f48f3') as your_preferences,
  (SELECT COUNT(*) FROM push_subscriptions WHERE user_id = 'e1e50c38-94d4-4ce7-b763-b439e49f48f3') as your_subscriptions,
  (SELECT COUNT(*) FROM challenge_progress WHERE user_id = 'e1e50c38-94d4-4ce7-b763-b439e49f48f3') as your_challenges;
