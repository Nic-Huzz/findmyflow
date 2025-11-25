-- Check if notification tables exist and have data
SELECT 'push_subscriptions' as table_name, COUNT(*) as count FROM push_subscriptions
UNION ALL
SELECT 'notification_preferences' as table_name, COUNT(*) as count FROM notification_preferences;
