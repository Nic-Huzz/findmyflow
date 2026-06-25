-- Schedule welcome email sequence processing every 15 minutes
-- Requires pg_cron and pg_net extensions (already enabled)
-- Run this manually in Supabase SQL Editor

-- Schedule the cron job
SELECT cron.schedule(
  'process-email-sequences-every-15min',
  '*/15 * * * *',  -- Every 15 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/process-scheduled-emails',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Verify the job was created
SELECT * FROM cron.job WHERE jobname = 'process-email-sequences-every-15min';

-- To unschedule (if needed):
-- SELECT cron.unschedule('process-email-sequences-every-15min');

-- To check recent runs:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-email-sequences-every-15min') ORDER BY start_time DESC LIMIT 10;
