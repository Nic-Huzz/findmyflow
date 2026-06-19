-- Schedule daily Instagram data sync via pg_cron
-- Calls the fetch-instagram edge function once per day at 07:00 UTC
-- Requires pg_cron and pg_net extensions (already enabled)
-- Run this manually in Supabase SQL Editor

-- Schedule the cron job
SELECT cron.schedule(
  'fetch-instagram-daily',
  '0 7 * * *',  -- Daily at 07:00 UTC
  $$
  SELECT
    net.http_post(
      url := 'https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/fetch-instagram',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
      body := '{"initial_sync": false}'::jsonb
    ) as request_id;
  $$
);

-- Verify the job was created
SELECT * FROM cron.job WHERE jobname = 'fetch-instagram-daily';

-- To unschedule (if needed):
-- SELECT cron.unschedule('fetch-instagram-daily');

-- To check recent runs:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'fetch-instagram-daily') ORDER BY start_time DESC LIMIT 10;
