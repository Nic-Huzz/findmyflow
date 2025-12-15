-- Final fix for cron job authentication
-- First, remove the broken job completely
SELECT cron.unschedule('timezone-based-notifications-hourly');

-- Wait a moment and recreate with correct vault lookup
SELECT cron.schedule(
  'timezone-based-notifications-hourly',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/scheduled-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Verify the fix was applied
SELECT
  jobname,
  schedule,
  active,
  CASE
    WHEN command LIKE '%SUPABASE_SERVICE_ROLE_KEY%' THEN 'CORRECT - Using vault secret name'
    ELSE 'WRONG - Still has hardcoded JWT'
  END as auth_check,
  command
FROM cron.job
WHERE jobname = 'timezone-based-notifications-hourly';
