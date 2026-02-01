# Push Notifications System

## Overview

FindMyFlow uses Web Push notifications to send scheduled reminders and achievement celebrations to users. The system is timezone-aware and sends notifications at 8am, 12pm, and 6pm in each user's local time.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Supabase Cron  │────▶│  Edge Function   │────▶│  Web Push API   │
│  (hourly)       │     │  (scheduled-     │     │  (FCM/Apple)    │
└─────────────────┘     │   notifications) │     └─────────────────┘
                        └──────────────────┘              │
                                                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Browser/PWA    │◀────│  Service Worker  │◀────│  Push Message   │
│                 │     │  (service-       │     │                 │
└─────────────────┘     │   worker.js)     │     └─────────────────┘
                        └──────────────────┘
```

## Components

### 1. Edge Functions

**`supabase/functions/scheduled-notifications/index.ts`**
- Runs hourly via cron job
- Checks each user's timezone to determine local hour
- Sends notifications at 8am, 12pm, 6pm local time
- Also sends groan day reminders at 8am
- Auto-creates notification preferences if missing

**`supabase/functions/send-push-notification/index.ts`**
- On-demand notification sending
- Called with `userId`, `title`, `body`, `url`, `tag`
- Sends to all devices registered for that user

### 2. Database Tables

**`push_subscriptions`**
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES auth.users(id)
endpoint TEXT NOT NULL          -- Push service URL (FCM/Apple)
keys JSONB NOT NULL             -- {p256dh, auth} encryption keys
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
UNIQUE(user_id, endpoint)
```

**`notification_preferences`**
```sql
id UUID PRIMARY KEY
user_id UUID UNIQUE REFERENCES auth.users(id)
quest_reminders BOOLEAN DEFAULT TRUE        -- 8am/12pm/6pm reminders
achievement_celebrations BOOLEAN DEFAULT TRUE -- Level ups, streaks
timezone TEXT DEFAULT 'UTC'                 -- User's IANA timezone
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

### 3. Frontend Components

**`src/lib/notifications.js`**
- `isNotificationSupported()` - Check browser support
- `getNotificationPermission()` - Get current permission status
- `requestNotificationPermission()` - Request permission from user
- `subscribeToPushNotifications(userId, vapidKey)` - Subscribe and save to DB
- `showLocalNotification(title, options)` - Show immediate notification
- `sendAchievementNotification({title, body})` - Send achievement notification
- Debug functions exposed on window:
  - `window.debugNotifications()` - Full diagnostic
  - `window.testNotification()` - Test local notification
  - `window.testPushNotification()` - Test server push

**`src/components/NotificationSettings.jsx`**
- Settings page for managing notifications
- Toggle quest reminders on/off
- Toggle achievement celebrations on/off
- Timezone selector
- Enable/disable notifications button

**`src/components/ChallengeOnboarding.jsx`**
- First-time onboarding flow
- PWA install instructions (iOS/Android)
- Notification enable screen
- Saves preferences with auto-detected timezone

**`public/service-worker.js`**
- Handles incoming push events
- Displays notifications
- Handles notification clicks (opens app to URL)

### 4. Cron Job

Set up in Supabase via pg_cron:

```sql
SELECT cron.schedule(
  'scheduled-notifications',
  '0 * * * *',  -- Every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/scheduled-notifications',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

To check cron jobs:
```sql
SELECT jobname, schedule, active FROM cron.job;
```

## Environment Variables

### Frontend (`.env.local`)
```
VITE_VAPID_PUBLIC_KEY=BMXOxrjOV7PCYOfy0aF2...
```

### Supabase Edge Functions (Dashboard → Edge Functions → Secrets)
```
VAPID_PUBLIC_KEY=BMXOxrjOV7PCYOfy0aF2...
VAPID_PRIVATE_KEY=<private key>
VAPID_EMAIL=your@email.com  (mailto: prefix added automatically)
```

## Notification Schedule

| Local Time | Notification | Tag |
|------------|--------------|-----|
| 8:00 AM | Morning Quest Check | `morning-quest` |
| 8:00 AM | Groan Day Reminder (if scheduled) | `weekly-groan-day` |
| 12:00 PM | Midday Check-In | `midday-checkin` |
| 6:00 PM | Evening Reflection | `evening-reflection` |

Achievement notifications are sent immediately when triggered (level ups, streak milestones).

## Testing

### 1. Debug Current State
```javascript
window.debugNotifications()
```
Shows: browser support, permission, service worker, subscription, VAPID key, DB entries

### 2. Test Local Notification
```javascript
window.testNotification()
```

### 3. Test Server Push
```javascript
window.testPushNotification()
```

### 4. Manual Edge Function Test
```bash
curl -X POST "https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/scheduled-notifications" \
  -H "Content-Type: application/json"
```

### 5. Check Function Logs
Supabase Dashboard → Edge Functions → scheduled-notifications → Logs

## Troubleshooting

### "No notifications to send"
- User's local time doesn't match 8am, 12pm, or 6pm
- No active challenge for user
- All notification types disabled in preferences

### "Invalid JWT" on curl
- Use browser console `testPushNotification()` instead
- Or get fresh token from authenticated session

### "Vapid subject is not a valid URL"
- VAPID_EMAIL needs `mailto:` prefix
- Edge functions auto-add this now, but verify in Supabase secrets

### Notifications not appearing
1. Check permission: `Notification.permission`
2. Check service worker: `navigator.serviceWorker.getRegistrations()`
3. Check subscription exists: `window.debugNotifications()`
4. Check DB has entries: Query `push_subscriptions` table

### Push subscription not saving
- Check RLS policies on `push_subscriptions` table
- Verify user is authenticated
- Check browser console for errors

## Generating VAPID Keys

If you need new VAPID keys:
```bash
npx web-push generate-vapid-keys
```

## Files Reference

```
src/
├── lib/
│   └── notifications.js          # Core notification library
├── components/
│   ├── NotificationSettings.jsx  # Settings UI
│   ├── NotificationSettings.css
│   ├── ChallengeOnboarding.jsx   # Onboarding flow
│   └── ChallengeOnboarding.css
├── hooks/
│   └── useCelebrations.js        # Achievement notifications

public/
└── service-worker.js             # Push event handler

supabase/
├── functions/
│   ├── scheduled-notifications/
│   │   └── index.ts              # Hourly cron handler
│   └── send-push-notification/
│       └── index.ts              # On-demand sender
└── migrations/
    └── Sql commands/
        └── fix_notification_setup.sql  # DB setup script
```
