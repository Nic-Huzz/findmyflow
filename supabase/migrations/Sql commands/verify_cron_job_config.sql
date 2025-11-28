-- Check the full command of the new cron job to verify it's using vault
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'timezone-based-notifications-hourly';
