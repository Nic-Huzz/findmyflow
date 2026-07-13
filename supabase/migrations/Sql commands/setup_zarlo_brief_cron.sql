-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions to use pg_cron
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule daily Zarlo Brief generation at 4am UTC
-- Runs once per day, processes all active users (had checkin in last 14 days)
SELECT cron.schedule(
  'generate-zarlo-briefs',
  '0 4 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/generate-zarlo-brief',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- View all scheduled jobs
SELECT * FROM cron.job;

-- To unschedule (if needed):
-- SELECT cron.unschedule('generate-zarlo-briefs');

-- To view job run history:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'generate-zarlo-briefs') ORDER BY start_time DESC LIMIT 10;
