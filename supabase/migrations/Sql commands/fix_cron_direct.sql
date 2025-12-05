-- Direct fix without dollar quoting issues
SELECT cron.unschedule('timezone-based-notifications-hourly');

SELECT cron.schedule(
  'timezone-based-notifications-hourly',
  '0 * * * *',
  'SELECT net.http_post(url := ''https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/scheduled-notifications'', headers := jsonb_build_object(''Content-Type'', ''application/json'', ''Authorization'', ''Bearer '' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = ''SUPABASE_SERVICE_ROLE_KEY'')), body := ''{}''::jsonb) as request_id;'
);

SELECT jobname, schedule, command FROM cron.job WHERE jobname = 'timezone-based-notifications-hourly';
