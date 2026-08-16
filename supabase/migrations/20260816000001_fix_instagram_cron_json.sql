-- Fix: Instagram daily cron had broken JSON string concatenation (60/60 runs failed).
-- Replace string concat with jsonb_build_object to avoid escaping issues.

SELECT cron.unschedule('fetch-instagram-daily');

SELECT cron.schedule(
  'fetch-instagram-daily',
  '0 7 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/fetch-instagram',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{"initial_sync": false}'::jsonb
    ) as request_id;
  $$
);
