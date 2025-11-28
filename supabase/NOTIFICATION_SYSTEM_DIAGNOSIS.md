# Comprehensive Notification System Diagnosis

## Executive Summary
After a complete audit of the notification system, I've identified **3 critical issues** that must ALL be fixed for notifications to work.

---

## Issue #1: Cron Job Authentication ❌ CRITICAL

### Current State (from CSV data):
The cron job command is attempting to retrieve the service role key from vault using:
```sql
WHERE name = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' -- This is the JWT TOKEN VALUE
```

### Problem:
This is searching for a vault secret **named** with the JWT token itself, which doesn't exist. It should search by the secret NAME:
```sql
WHERE name = 'SUPABASE_SERVICE_ROLE_KEY'  -- This is the correct NAME
```

### Impact:
The cron job runs successfully every hour, but it sends requests with an INVALID authorization header (likely empty or malformed), causing the edge function to fail silently or return early.

### Fix Required:
Run corrected SQL to update cron job with proper vault lookup.

---

## Issue #2: Column Name Mismatch ⚠️ POTENTIAL

### From Database Schema CSV:
```
column_name: group_activity (singular)
column_name: artifact_unlocks (plural)
```

### From Edge Function Code (line 109):
```typescript
if (!prefs || !(prefs.daily_quests || prefs.leaderboard_updates || prefs.group_activity || prefs.artifact_unlocks)) {
```

### Status:
✅ **MATCHES** - No issue here (assuming CSV is correct)

However, you previously reported the database had:
- `group_activities` (plural)
- `artifact_unlocked` (singular)

### Action Required:
Run the comprehensive audit SQL to verify the ACTUAL current column names in the database.

---

## Issue #3: VAPID Keys Missing in Edge Function ❓ UNKNOWN

### Edge Function Check (lines 160-170):
```typescript
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
const vapidEmail = Deno.env.get('VAPID_EMAIL')

if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
  console.error('VAPID keys not configured')
  return new Response(
    JSON.stringify({ error: 'Server configuration error' }),
    { status: 500 }
  )
}
```

### Problem:
If VAPID keys are not set in the edge function environment variables, notifications will fail with "Server configuration error".

### Action Required:
Check if VAPID keys are configured in Supabase Edge Function secrets.

---

## Issue #4: 7-Day Challenge Logic 🆕 POTENTIALLY BLOCKING YOU

### New Code (lines 113-129):
```typescript
const { data: challenge } = await supabaseClient
  .from('challenge_instances')
  .select('start_date')
  .eq('user_id', sub.user_id)
  .order('start_date', { ascending: false })
  .limit(1)
  .single()

if (challenge && challenge.start_date) {
  const daysSinceStart = Math.floor((Date.now() - new Date(challenge.start_date).getTime()) / (1000 * 60 * 60 * 24))
  if (daysSinceStart >= 7) {
    console.log(`Skipping user ${sub.user_id}: Challenge completed ${daysSinceStart} days ago`)
    continue
  }
}
```

### Problem:
If your challenge started more than 7 days ago, you'll be skipped! This is the feature you requested, but it may be why you're not getting notifications now.

### Action Required:
Check when YOUR challenge started in the audit SQL results.

---

## Data Flow Analysis

### Complete Notification Flow:
1. **Cron Job** (every hour at :00)
   - ✅ Runs successfully (confirmed from CSV)
   - ❌ Uses wrong vault key lookup (sends with bad auth)

2. **Edge Function** (`scheduled-notifications`)
   - ⚠️ Receives request (possibly with bad auth)
   - ❓ May fail early if auth is checked
   - ❓ May fail if VAPID keys missing
   - ⚠️ May skip users if challenge > 7 days old
   - ⚠️ May fail if column names don't match

3. **Database Query**
   - Fetches push_subscriptions with INNER JOIN to notification_preferences
   - ✅ You have 4 push subscriptions (confirmed from CSV)
   - ✅ You have notification preferences set (confirmed earlier)

4. **Notification Sending**
   - ❓ May fail if VAPID keys are missing/wrong
   - ❓ May fail if push subscriptions are expired

---

## Critical Questions to Answer

Run the `comprehensive_notification_audit.sql` to get answers to:

1. **Database Schema**: Are column names `group_activity` + `artifact_unlocks` OR `group_activities` + `artifact_unlocked`?

2. **Your Challenge**: When did you start? If >7 days ago, the new logic is blocking you!

3. **Cron Job**: Does it actually use the correct vault lookup? (Check the `command` field)

4. **VAPID Secrets**: Are they configured in the edge function environment?

5. **RLS Policies**: Could RLS be blocking the edge function from querying your data?

---

## Recommended Action Plan

### Step 1: Run Comprehensive Audit SQL
This will give us the ground truth about the current system state.

### Step 2: Fix Cron Job Auth (if needed)
Run the corrected `fix_cron_job_auth_corrected.sql` with proper vault lookup.

### Step 3: Verify VAPID Keys
Check Supabase Dashboard → Edge Functions → scheduled-notifications → Secrets

### Step 4: Test Manually
Manually trigger the edge function to see what error it returns:
```bash
curl -X POST \
  'https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/scheduled-notifications' \
  -H 'Authorization: Bearer [SERVICE_ROLE_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### Step 5: Check Edge Function Logs
Go to Supabase Dashboard → Edge Functions → scheduled-notifications → Logs to see actual errors.

---

## Why Previous "Fixes" Didn't Work

1. **Column Name Fix**: We kept fixing code but never verified what's actually in the database
2. **Vault Lookup**: The SQL file kept getting the wrong syntax (JWT in WHERE clause)
3. **Missing Diagnostics**: We never checked edge function logs or manually tested the endpoint
4. **7-Day Logic**: Just added this, which may now be blocking you if your challenge is old

---

## Next Steps

**BEFORE making any more changes**, please:

1. ✅ Run `comprehensive_notification_audit.sql`
2. ✅ Share ALL results
3. ✅ Check Supabase Edge Function logs for errors
4. ✅ Verify VAPID keys are set in edge function secrets

This will give us the complete picture to create ONE definitive fix.
