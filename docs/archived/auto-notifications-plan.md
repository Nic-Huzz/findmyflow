# Auto-Notifications Implementation Plan

## Overview
Automated push notifications sent when users become inactive, using configurable rules with admin controls. Runs as a daily Supabase Edge Function.

## Why
Users who go inactive for 3-7 days rarely come back on their own. Automated inactivity-triggered push notifications re-engage them before they churn.

## Current Infrastructure (already built)
- `scheduled-notifications` Edge Function — runs on cron, sends 3x daily (8am/12pm/6pm) based on timezone (routine reminders)
- `send-push-notification` Edge Function — sends individual pushes
- `push_subscriptions` table — stores user endpoints
- `notification_preferences` table — has `quest_reminders`, `achievement_celebrations`, `timezone`
- `admin-data` Edge Function — handles admin actions (deployed)
- Service worker (`public/service-worker.js`) — handles push events and notification clicks
- Admin Dashboard (`/admin-dashboard`) — deployed with user table + nudge modal

## Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Separate vs extend scheduled-notifications | **Separate Edge Function** | Keeps concerns clean — time-based reminders vs inactivity triggers |
| nudge_templates table | **Skip — inline on rules table** | Only 3-4 templates needed. Avoids extra table + join for minimal benefit |
| User preference storage | **Add column to `notification_preferences`** | Table already exists with the right structure. No new `user_settings` table |
| Cron frequency | **Once daily at 10:00 UTC** | Inactivity is day-level, not hour-level. No need for hourly runs |

---

## Step 1: Database Migration

**File:** `supabase/migrations/20260211200000_auto_notifications.sql`

```sql
-- Notification log (tracks all auto-sent notifications)
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rule_id TEXT,
  trigger_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered BOOLEAN DEFAULT true,
  is_auto BOOLEAN DEFAULT true
);

CREATE INDEX idx_notif_log_user ON notification_log(user_id, sent_at DESC);
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own" ON notification_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service manages" ON notification_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Auto-notification rules (admin-configurable)
CREATE TABLE auto_notification_rules (
  id TEXT PRIMARY KEY,
  trigger_type TEXT NOT NULL,
  days_inactive INTEGER NOT NULL DEFAULT 3,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT DEFAULT '/7-day-challenge',
  enabled BOOLEAN DEFAULT true,
  cooldown_hours INTEGER DEFAULT 48,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE auto_notification_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service manages" ON auto_notification_rules FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed default rules
INSERT INTO auto_notification_rules (id, trigger_type, days_inactive, title, body, url, cooldown_hours) VALUES
  ('inactivity_3d', 'inactivity', 3,
   'We miss you, {name}!',
   'Your flow journey is right where you left it. Just 5 minutes to get back on track.',
   '/7-day-challenge', 72),
  ('inactivity_7d', 'inactivity', 7,
   'Your spot is still saved',
   '{name}, it''s been a week! Your quests are waiting - pick up where you left off.',
   '/me', 168),
  ('inactivity_14d', 'inactivity', 14,
   'Ready to restart?',
   '{name}, great things take time. When you''re ready, your entire journey is here.',
   '/me', 336);

-- Add inactivity reminder preference to existing table
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS inactivity_reminders BOOLEAN DEFAULT TRUE;
```

## Step 2: Edge Function — `send-auto-notifications`

**File:** `supabase/functions/send-auto-notifications/index.ts`

Follows the exact same pattern as `scheduled-notifications/index.ts`.

**Logic flow:**
1. Fetch all enabled rules from `auto_notification_rules` (ordered by `days_inactive` DESC so most urgent rule wins)
2. Fetch all users with push subscriptions (from `push_subscriptions`)
3. Batch-fetch supporting data for all subscriber user IDs:
   - `notification_preferences` (check `inactivity_reminders` opt-out)
   - `user_stage_progress` (get `updated_at` for last activity)
   - Latest `quest_completions` per user (get last quest date)
   - `lead_flow_profiles` (get `user_name` for `{name}` replacement)
   - Recent `notification_log` entries (check cooldowns)
4. For each user:
   a. Skip if `inactivity_reminders = false`
   b. Calculate days inactive = now - max(stage_progress.updated_at, last_quest.created_at, auth.last_sign_in_at)
   c. Skip if never active (no stage progress AND no quest completions)
   d. Find first matching rule where `days_inactive` threshold is met
   e. Check cooldown against `notification_log`
   f. If cooldown clear: send push, log to `notification_log`
   g. Max 1 notification per user per run
5. Return stats: `{ evaluated, sent, skipped }`

**Variable replacement:** `{name}` replaced with `lead_flow_profiles.user_name` (fallback: "there")

**Push sending:** Same pattern as `scheduled-notifications/index.ts`:
- `webpush.setVapidDetails()` with VAPID keys from env
- `webpush.sendNotification()` with JSON payload (title, body, icon, badge, tag, url)
- Expired subscription cleanup on 410/404 errors
- `Promise.allSettled()` for parallel sending

## Step 3: Schedule the Cron

**Option A: pg_cron (preferred if enabled)**
```sql
SELECT cron.schedule(
  'auto-notifications-daily',
  '0 10 * * *',  -- 10:00 UTC daily
  $$SELECT net.http_post(
    url := 'https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/send-auto-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
    )
  )$$
);
```

**Option B: Supabase Dashboard** — Set up cron job in project settings

**Option C: GitHub Actions** — Workflow that calls the Edge Function daily

## Step 4: Extend Admin Dashboard

### Backend: `supabase/functions/admin-data/index.ts`

Add 3 new actions to the switch statement:

**`get_notification_rules`**
- `SELECT * FROM auto_notification_rules ORDER BY days_inactive`

**`toggle_notification_rule`**
- `UPDATE auto_notification_rules SET enabled = NOT enabled WHERE id = $ruleId`
- Returns updated rule

**`get_notification_log`**
- `SELECT notification_log.*, lead_flow_profiles.user_name FROM notification_log LEFT JOIN lead_flow_profiles ON notification_log.user_id = lead_flow_profiles.user_id ORDER BY sent_at DESC LIMIT 50`

### Frontend Service: `src/lib/adminService.js`

Add 3 new exports:
```javascript
export const fetchNotificationRules = () => adminFetch('get_notification_rules')
export const toggleNotificationRule = (ruleId) => adminFetch('toggle_notification_rule', { ruleId })
export const fetchNotificationLog = () => adminFetch('get_notification_log')
```

### Admin UI: `src/pages/AdminDashboard.jsx`

Add tab navigation: **Users** | **Notifications**

Notifications tab contains:
1. **Rules section** — Cards for each rule showing:
   - Title + body preview
   - "X days inactive" badge
   - "Cooldown: Xh" label
   - Toggle switch (enabled/disabled)
2. **Log section** — Table of recent auto-sent notifications:
   - User name | Title | Trigger | Sent time

## Step 5: User Preference Toggle

### `src/pages/UserSettings.jsx`

Add a third toggle after "Achievement Celebrations":

```jsx
<label className="settings-toggle">
  <input
    type="checkbox"
    checked={preferences.inactivityReminders}
    onChange={() => handlePreferenceChange('inactivityReminders')}
  />
  <div className="settings-toggle-info">
    <span className="settings-toggle-name">Comeback Reminders</span>
    <span className="settings-toggle-desc">Get a nudge if you've been away for a few days</span>
  </div>
</label>
```

Update `loadPreferences()` to read `inactivity_reminders` column.
Update `handlePreferenceChange()` to save `inactivity_reminders` column.

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `supabase/migrations/20260211200000_auto_notifications.sql` | notification_log, auto_notification_rules, seed rules, preference column |
| CREATE | `supabase/functions/send-auto-notifications/index.ts` | Daily inactivity check + push sender |
| MODIFY | `supabase/functions/admin-data/index.ts` | Add 3 new actions (rules, toggle, log) |
| MODIFY | `src/lib/adminService.js` | Add 3 new export functions |
| MODIFY | `src/pages/AdminDashboard.jsx` | Add Notifications tab with rules + log |
| MODIFY | `src/pages/AdminDashboard.css` | Tab styles, rule card styles, log table |
| MODIFY | `src/pages/UserSettings.jsx` | Add "Comeback Reminders" toggle |

## Safety Guardrails

- **Max 1 notification per user per Edge Function run**
- **Configurable cooldown per rule** — defaults: 72h (3d rule), 168h (7d rule), 336h (14d rule)
- **User opt-out** via `notification_preferences.inactivity_reminders`
- **Admin can disable any rule** via toggle in dashboard
- **Never-active users skipped** — only targets users who have at least one quest completion or stage progress update
- **Expired subscriptions auto-cleaned** — 410/404 responses trigger deletion from `push_subscriptions`

## Verification Checklist

- [ ] Migration applied — `notification_log`, `auto_notification_rules` tables exist, 3 rules seeded
- [ ] `notification_preferences` has `inactivity_reminders` column
- [ ] Edge Function deployed — `npx supabase functions deploy send-auto-notifications`
- [ ] Manual invoke returns stats — `{ evaluated: N, sent: N, skipped: N }`
- [ ] Admin Dashboard shows Notifications tab with 3 rules
- [ ] Toggle rule on/off works
- [ ] Notification log table shows entries after test run
- [ ] User Settings shows "Comeback Reminders" toggle
- [ ] Toggle persists on page reload
- [ ] `npm run build` passes
- [ ] Cron scheduled (pg_cron or dashboard)
