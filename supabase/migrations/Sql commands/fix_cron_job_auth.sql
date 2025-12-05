-- ============================================
-- FIX: Cron Job Authentication Issue
-- ============================================
-- Problem: The cron job is using the JWT token VALUE as the secret NAME
-- Solution: Change it to look up 'SUPABASE_SERVICE_ROLE_KEY' from vault
-- ============================================

-- First, unschedule the broken cron job
SELECT cron.unschedule('timezone-based-notifications-hourly');

-- Now create it correctly with proper vault secret lookup
SELECT cron.schedule(
  'timezone-based-notifications-hourly',
  '0 * * * *', -- Every hour at minute 0
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

-- Verify the fix
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'timezone-based-notifications-hourly';
