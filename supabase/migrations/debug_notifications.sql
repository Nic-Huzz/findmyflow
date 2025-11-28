-- 1. Check the actual column names in notification_preferences
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'notification_preferences'
ORDER BY ordinal_position;

-- 2. Check active push subscriptions count
SELECT COUNT(*) as total_subscriptions FROM push_subscriptions;

-- 3. Check your specific user data
SELECT * FROM notification_preferences WHERE user_id = 'e1e50c38-94d4-4ce7-b763-b439e49f48f3';

-- 4. Check if you have a push subscription
SELECT user_id, endpoint, created_at FROM push_subscriptions WHERE user_id = 'e1e50c38-94d4-4ce7-b763-b439e49f48f3';
