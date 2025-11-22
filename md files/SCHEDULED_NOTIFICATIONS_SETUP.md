# Scheduled Notifications Setup Guide

This guide will help you set up automated daily notifications that send at specific times.

## Notification Schedule

- **7:00 AM** - 🌅 Morning Reconnect: "Remember Your Daily Reconnect Quests To Start Your Day on a High"
- **9:00 AM** - ✨ Embrace Your Essence: "Reminder to Embrace Your Essence Today"
- **12:00 PM** - 🎯 Midday Check-In: "How can we make this afternoon a 'Hell Yea'?"
- **5:00 PM** - 📅 Evening Goals: "What weekly quests can we get done this evening?"
- **8:00 PM** - 📝 Daily Reflection: "Reminder to enter your quests for the day!"

## Step 1: Deploy the Scheduled Notifications Edge Function

Run this command in your terminal:

```bash
cd /Users/nichurrell/Findmyflow
npx supabase functions deploy scheduled-notifications
```

This deploys the Edge Function that will handle sending scheduled notifications.

## Step 2: Enable pg_cron in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv
2. Navigate to **Database** → **Extensions**
3. Search for **pg_cron**
4. Click **Enable** if it's not already enabled

## Step 3: Set Up the Scheduled Jobs

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Copy the entire contents of `/Sql commands/setup_scheduled_notifications.sql`
4. Paste into the SQL Editor
5. Click **Run** (or press Cmd+Enter)

This will create 1 hourly cron job that checks users' timezones and sends notifications accordingly.

## Step 4: Verify Jobs Are Running

In the SQL Editor, run this query to see all scheduled jobs:

```sql
SELECT * FROM cron.job;
```

You should see **1 job**:
- `timezone-based-notifications-hourly` (runs every hour: `0 * * * *`)

This single job checks all users' timezones and sends the appropriate notifications based on their local time.

## Step 5: Test a Notification (Optional)

To manually trigger the timezone check (simulates the hourly cron run), run this in SQL Editor:

```sql
SELECT
  net.http_post(
    url := 'https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/scheduled-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
```

This will check all users and send notifications to anyone whose current local time matches 7am, 9am, 12pm, 5pm, or 8pm.

## How It Works

1. **pg_cron** runs on Supabase's PostgreSQL database
2. At the scheduled time, it makes an HTTP POST request to the Edge Function
3. The Edge Function queries all users with active push subscriptions
4. It filters based on notification preferences (users who have notifications enabled)
5. Sends the notification to all eligible users via Web Push
6. Automatically removes invalid/expired subscriptions

## Important Notes

### Timezone
- **All times are in UTC** by default
- To adjust for your timezone, modify the cron schedule
- Example: If you want 7 AM PST (UTC-8), use `15 7` instead of `0 7` for 7 AM UTC

### Notification Preferences
- Users can control notifications at `/settings/notifications`
- The system respects user preferences - if they've disabled notifications, they won't receive scheduled ones
- Currently sends to all users who have ANY notification type enabled
- You can add more granular filtering in the Edge Function code

### Monitoring

**View job run history:**
```sql
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

**View Edge Function logs:**
```bash
npx supabase functions logs scheduled-notifications
```

Or in Supabase Dashboard:
https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv/logs/edge-functions

## Managing Scheduled Jobs

### Unschedule a job:
```sql
SELECT cron.unschedule('morning-reconnect-7am');
```

### Update a job schedule:
```sql
-- First unschedule the old one
SELECT cron.unschedule('morning-reconnect-7am');

-- Then create a new one with updated time
SELECT cron.schedule(
  'morning-reconnect-7am',
  '0 8 * * *',  -- Changed to 8 AM
  $$ ... $$
);
```

### Disable all scheduled notifications:
```sql
SELECT cron.unschedule('morning-reconnect-7am');
SELECT cron.unschedule('embrace-essence-9am');
SELECT cron.unschedule('midday-checkin-12pm');
SELECT cron.unschedule('evening-quests-5pm');
SELECT cron.unschedule('daily-reflection-8pm');
```

## Customizing Notifications

To change notification messages, edit:
`/supabase/functions/scheduled-notifications/index.ts`

The `NOTIFICATIONS` object at the top contains all notification content:

```typescript
const NOTIFICATIONS = {
  '07:00': {
    title: '🌅 Morning Reconnect',
    body: 'Your custom message here',
    url: '/7-day-challenge',
    tag: 'morning-reconnect'
  },
  // ... other notifications
}
```

After editing, redeploy:
```bash
npx supabase functions deploy scheduled-notifications
```

## Troubleshooting

### Notifications not sending?

1. **Check if jobs are scheduled:**
   ```sql
   SELECT * FROM cron.job WHERE jobname LIKE '%am' OR jobname LIKE '%pm';
   ```

2. **Check job run history:**
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname LIKE '%notification%')
   ORDER BY start_time DESC;
   ```

3. **Check Edge Function logs:**
   ```bash
   npx supabase functions logs scheduled-notifications
   ```

4. **Verify VAPID secrets are set:**
   ```bash
   npx supabase secrets list
   ```

5. **Test the function manually** using the test query in Step 5

### Wrong timezone?

Update the cron schedule. Cron format: `minute hour * * *`

Examples:
- 7 AM UTC: `0 7 * * *`
- 7 AM EST (UTC-5): `0 12 * * *`
- 7 AM PST (UTC-8): `0 15 * * *`
- 7 AM AEST (UTC+10): `0 21 * * *` (previous day)

## Production Checklist

- [ ] Edge Function deployed: `scheduled-notifications`
- [ ] pg_cron extension enabled in Supabase
- [ ] All 5 cron jobs created and scheduled
- [ ] VAPID secrets configured
- [ ] Tested one notification manually
- [ ] Verified jobs appear in `cron.job`
- [ ] Checked timezone settings
- [ ] Monitored first scheduled run in logs
