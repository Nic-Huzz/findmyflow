# Leaderboard Overtake Notifications Setup

This guide explains how to set up automated notifications when users get overtaken on the leaderboard.

## How It Works

1. **Hourly Monitoring**: Every hour, the system checks the current leaderboard rankings
2. **Rank Comparison**: Compares current ranks with the last saved snapshot
3. **Overtake Detection**: If a user's rank got worse (number increased), they were overtaken
4. **Notification Sent**: Users with `leaderboard_updates` enabled get a push notification

## Setup Instructions

### 1. Create the Rank Tracking Table

Run this SQL in your Supabase SQL Editor:

```bash
# Execute from your terminal
cd "Sql commands"
cat create_leaderboard_tracking.sql
```

Or manually execute the SQL in Supabase Dashboard → SQL Editor

### 2. Deploy the Edge Function

```bash
# Deploy the check-leaderboard-changes function
npx supabase functions deploy check-leaderboard-changes --no-verify-jwt

# Or if using Supabase CLI with project linked:
supabase functions deploy check-leaderboard-changes
```

### 3. Set Up the Cron Job

**Option A: Using Supabase Dashboard**
1. Go to Database → Extensions
2. Enable `pg_cron` extension
3. Go to SQL Editor
4. Run the SQL from `setup_leaderboard_monitoring.sql`

**Option B: Using pg_cron directly**
Run the setup SQL which creates an hourly cron job.

### 4. Verify Setup

**Test the edge function manually:**
```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/check-leaderboard-changes \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**Check cron jobs:**
```sql
SELECT * FROM cron.job;
```

**View recent snapshots:**
```sql
SELECT * FROM leaderboard_snapshots
ORDER BY created_at DESC
LIMIT 10;
```

## Notification Logic

Users receive a notification when:
- ✅ They have an active challenge (`status = 'active'`)
- ✅ Their rank decreased (someone passed them)
- ✅ They have `leaderboard_updates = true` in notification preferences
- ✅ They have valid push subscriptions

Notification messages:
- **1 position lost**: "Someone just passed you on the leaderboard! Time to step it up!"
- **Multiple positions**: "You dropped {N} positions on the leaderboard!"

## Monitoring

**View who was overtaken recently:**
```sql
SELECT
  ls1.user_id,
  ls1.rank as current_rank,
  ls2.rank as previous_rank,
  (ls1.rank - ls2.rank) as positions_lost
FROM leaderboard_snapshots ls1
JOIN leaderboard_snapshots ls2 ON ls1.user_id = ls2.user_id
WHERE ls1.created_at > NOW() - INTERVAL '2 hours'
  AND ls2.created_at < ls1.created_at
  AND ls1.rank > ls2.rank
ORDER BY ls1.created_at DESC;
```

## Troubleshooting

**Notifications not sending?**
1. Check user has `leaderboard_updates = true`
2. Verify push subscriptions exist
3. Check VAPID keys are configured
4. Review edge function logs

**Cron job not running?**
1. Verify pg_cron extension is enabled
2. Check cron job exists: `SELECT * FROM cron.job;`
3. View cron run history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

**Duplicate notifications?**
- Snapshots should be saved after checking, preventing duplicates
- Each check compares only with the most recent previous snapshot

## Future Enhancements

- [ ] Add cooldown period (don't notify more than once per day)
- [ ] Different messages based on positions lost
- [ ] Group-specific overtake notifications
- [ ] Weekly summary of rank changes
