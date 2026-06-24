# Timezone-Based Scheduled Notifications - Implementation Summary

## ✅ What's Been Implemented

Your scheduled notifications system now sends notifications based on **each user's timezone**! Users will receive notifications at their local time, not a fixed global time.

### Notification Schedule (Local Time)
- **7:00 AM** - 🌅 Morning Reconnect: "Remember Your Daily Reconnect Quests To Start Your Day on a High"
- **9:00 AM** - ✨ Embrace Your Essence: "Reminder to Embrace Your Essence Today"
- **12:00 PM** - 🎯 Midday Check-In: "How can we make this afternoon a 'Hell Yea'?"
- **5:00 PM** - 📅 Evening Goals: "What weekly quests can we get done this evening?"
- **8:00 PM** - 📝 Daily Reflection: "Reminder to enter your quests for the day!"

## 📁 Files Created/Modified

### New Files:
1. **`/supabase/functions/scheduled-notifications/index.ts`**
   - Edge Function that checks user timezones hourly
   - Determines who should receive notifications based on their local time
   - Sends appropriate notifications via Web Push

2. **`/Sql commands/add_timezone_to_preferences.sql`**
   - Adds timezone column to notification_preferences table

3. **`/Sql commands/setup_scheduled_notifications.sql`**
   - Creates hourly cron job that triggers the Edge Function

4. **`/md files/SCHEDULED_NOTIFICATIONS_SETUP.md`**
   - Complete setup guide with troubleshooting

5. **`/md files/TIMEZONE_NOTIFICATIONS_SUMMARY.md`**
   - This file!

### Modified Files:
1. **`/src/components/NotificationSettings.jsx`**
   - Added timezone selector dropdown
   - Auto-detects user's timezone
   - Saves timezone preference to database
   - Loads existing preferences from database

2. **`/src/components/NotificationSettings.css`**
   - Added styling for timezone selector

## 🌍 How It Works

### 1. User Side:
- User enables notifications at `/settings/notifications`
- Their timezone is auto-detected (e.g., "America/New_York")
- They can change their timezone from a dropdown menu
- Timezone is saved to the database

### 2. Server Side:
- A cron job runs **every hour** (e.g., at 1:00 PM UTC, 2:00 PM UTC, etc.)
- The Edge Function checks ALL users with active subscriptions
- For each user, it calculates: "What time is it in their timezone right now?"
- If it's 7am, 9am, 12pm, 5pm, or 8pm in their timezone, they get the corresponding notification
- Notifications are sent via Web Push

### Example:
- **User A** in New York (EST, UTC-5): Gets 7am notification at 12:00 PM UTC
- **User B** in London (GMT, UTC+0): Gets 7am notification at 7:00 AM UTC
- **User C** in Sydney (AEST, UTC+11): Gets 7am notification at 8:00 PM UTC (previous day)

All three users receive their notification at **7am their local time**.

## 🚀 Deployment Steps

### Step 1: Add Timezone Column to Database

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv
2. Navigate to **SQL Editor**
3. Copy contents of `/Sql commands/add_timezone_to_preferences.sql`
4. Run the SQL

### Step 2: Deploy the Edge Function

```bash
cd /Users/nichurrell/Findmyflow
npx supabase functions deploy scheduled-notifications
```

### Step 3: Set Up the Hourly Cron Job

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy contents of `/Sql commands/setup_scheduled_notifications.sql`
3. Run the SQL

This creates a single cron job that runs every hour.

### Step 4: Verify Setup

Check that the cron job was created:
```sql
SELECT * FROM cron.job WHERE jobname = 'timezone-based-notifications-hourly';
```

You should see one job scheduled to run `0 * * * *` (every hour at minute 0).

## 🧪 Testing

### Test Timezone Detection:
1. Go to `/settings/notifications`
2. Enable notifications
3. Check the timezone dropdown - it should show your detected timezone
4. Try changing it to a different timezone and save

### Test Notification Sending:
To manually trigger the function (simulates the hourly check):

```sql
SELECT
  net.http_post(
    url := 'https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/scheduled-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
```

This will check all users and send notifications to anyone whose local time matches one of the notification hours.

## 📊 Monitoring

### View Cron Job Runs:
```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'timezone-based-notifications-hourly')
ORDER BY start_time DESC
LIMIT 10;
```

### View Edge Function Logs:
```bash
npx supabase functions logs scheduled-notifications --tail
```

Or in Supabase Dashboard:
https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv/logs/edge-functions

### Check What Notifications Were Sent:
Look for log entries like:
```
Found 5 notifications to send
Notifications sent: 5 successful, 0 failed
```

## ⚙️ Configuration

### Supported Timezones:
The UI includes common timezones:
- **North America**: Eastern, Central, Mountain, Pacific, Alaska, Hawaii
- **Europe**: London, Paris, Berlin, Rome, Madrid, Athens
- **Asia**: Tokyo, Shanghai, Hong Kong, Singapore, Dubai, India
- **Australia & Pacific**: Sydney, Melbourne, Brisbane, Perth, Auckland
- **Other**: UTC

All use IANA timezone identifiers (e.g., "America/New_York").

### Changing Notification Times:
Edit `/supabase/functions/scheduled-notifications/index.ts`:

```typescript
const NOTIFICATIONS = {
  7: { ... },  // 7am notification
  9: { ... },  // 9am notification
  // Add more hours here
  15: {  // 3pm notification (new!)
    title: 'Afternoon Break',
    body: 'Time for a quick reflection',
    url: '/7-day-challenge',
    tag: 'afternoon-break'
  }
}
```

Then redeploy:
```bash
npx supabase functions deploy scheduled-notifications
```

## 🔐 Privacy & Performance

- **User timezone is stored locally** in their preferences
- **No external timezone API calls** - uses browser's `Intl.DateTimeFormat`
- **Efficient**: Only runs once per hour, not once per user
- **Scalable**: Can handle thousands of users across all timezones
- **Smart filtering**: Only sends to users with notifications enabled

## ❓ FAQs

**Q: What if a user travels to a different timezone?**
A: They can manually update their timezone in `/settings/notifications`. Future enhancement: auto-update based on browser timezone on each login.

**Q: What if I want to stop sending notifications?**
A: Unschedule the cron job:
```sql
SELECT cron.unschedule('timezone-based-notifications-hourly');
```

**Q: Can I send different notifications to different timezones?**
A: Yes! Edit the Edge Function to add conditional logic based on timezone.

**Q: What about daylight saving time?**
A: IANA timezones (e.g., "America/New_York") automatically handle DST. The system uses the current time in that timezone, which adjusts for DST.

## 🎯 Next Steps

1. Run the SQL migrations (Steps 1 & 3)
2. Deploy the Edge Function (Step 2)
3. Test with your own account
4. Monitor the first few hourly runs
5. Check Edge Function logs for any errors

---

**Need help?** Check the logs or refer to `/md files/SCHEDULED_NOTIFICATIONS_SETUP.md` for detailed troubleshooting.
