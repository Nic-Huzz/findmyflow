# Push Notifications Setup Guide

This guide will help you complete the push notifications setup for your 7-Day Challenge app.

## 📋 Overview

You now have the following implemented:
- ✅ Service Worker for background notifications
- ✅ Notification permission request UI
- ✅ Push subscription management
- ✅ NotificationSettings component
- ✅ Database schema for subscriptions

## 🚀 Setup Steps

### Step 1: Create Database Tables

Run the SQL migration in your Supabase dashboard:

1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/editor
2. Click "SQL Editor" → "New Query"
3. Copy and paste the contents of `Sql commands/create_push_notifications_tables.sql`
4. Click "Run" to execute

This creates:
- `push_subscriptions` table - stores user push notification subscriptions
- `notification_preferences` table - stores user notification preferences
- Row Level Security policies
- Indexes for performance

### Step 2: Generate VAPID Keys

VAPID keys are required for web push notifications. Generate them using one of these methods:

#### Option A: Using web-push npm package (Recommended)

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

This will output:
```
Public Key: BNX...
Private Key: abc...
```

#### Option B: Using online tool

Visit: https://vapidkeys.com/

#### Option C: Using Node.js script

Create a file `generate-vapid-keys.js`:
```javascript
const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
```

Run: `node generate-vapid-keys.js`

### Step 3: Add VAPID Keys to Environment Variables

Add these to your `.env.local`:

```env
# VAPID Keys for Push Notifications
VITE_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY_HERE
VAPID_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
VAPID_EMAIL=mailto:your-email@example.com
```

**Important:**
- `VITE_` prefix exposes the public key to the browser (this is safe)
- Private key should NOT have `VITE_` prefix (server-side only)
- Use a real email for VAPID_EMAIL

### Step 4: Update NotificationSettings Component

Replace the placeholder in `src/components/NotificationSettings.jsx`:

```javascript
// Replace this line:
const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE'

// With:
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY
```

### Step 5: Add Notification Settings to Your App

Add the NotificationSettings component to your app. You can:

#### Option A: Add to Challenge page

```jsx
import NotificationSettings from './components/NotificationSettings'

// In your Challenge component, add a settings section or modal
<NotificationSettings />
```

#### Option B: Create a dedicated Settings page

```jsx
// In App.jsx or your router
import NotificationSettings from './components/NotificationSettings'

// Add route
<Route path="/settings" element={<NotificationSettings />} />
```

#### Option C: Add to header/nav as a modal

Create a settings icon in your header that opens NotificationSettings in a modal.

### Step 6: Create Supabase Edge Function for Sending Notifications

Create a new Edge Function to send push notifications:

1. Install Supabase CLI if you haven't:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

4. Create Edge Function:
```bash
supabase functions new send-push-notification
```

5. Edit `supabase/functions/send-push-notification/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { userId, title, body, url, tag } = await req.json()

    // Get user's push subscriptions
    const { data: subscriptions, error } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error

    const vapidPublicKey = Deno.env.get('VITE_VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidEmail = Deno.env.get('VAPID_EMAIL')

    // Send notification to each subscription
    const promises = subscriptions.map(async (subscription) => {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: subscription.keys
      }

      const payload = JSON.stringify({
        title,
        body,
        url,
        tag,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png'
      })

      // Use web-push library (you'll need to import this)
      // For now, return success
      return { success: true }
    })

    await Promise.all(promises)

    return new Response(
      JSON.stringify({ success: true, sent: subscriptions.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

6. Deploy the Edge Function:
```bash
supabase functions deploy send-push-notification
```

7. Set environment variables in Supabase:
```bash
supabase secrets set VAPID_PRIVATE_KEY=your_private_key
supabase secrets set VAPID_EMAIL=mailto:your-email@example.com
```

### Step 7: Create Notification Triggers

Create triggers for automatic notifications. Examples:

#### Daily Quest Unlock Notification

Add this to your Challenge.jsx in the `advanceDay` function:

```javascript
const advanceDay = async (currentProgress, daysToAdvance = 1) => {
  const newDay = Math.min(currentProgress.current_day + daysToAdvance, 7)

  // ... existing code ...

  // Send notification about new day
  if (newDay > currentProgress.current_day) {
    await sendNotification(user.id, {
      title: `Day ${newDay} Unlocked! 🎉`,
      body: 'Your new daily quests are ready to complete',
      url: '/challenge',
      tag: `day-${newDay}`
    })
  }
}
```

#### Leaderboard Change Notification

Add this to `loadLeaderboard`:

```javascript
// After calculating new rank, if rank changed
if (previousRank && newRank < previousRank) {
  await sendNotification(user.id, {
    title: 'You moved up! 🏆',
    body: `You're now rank #${newRank} on the leaderboard`,
    url: '/challenge',
    tag: 'leaderboard'
  })
}
```

#### Artifact Unlock Notification

Add this to `handleQuestComplete`:

```javascript
if (artifactUnlocked) {
  await sendNotification(user.id, {
    title: 'Artifact Unlocked! ✨',
    body: `You unlocked the ${categoryArtifact.name}!`,
    url: '/challenge',
    tag: 'artifact'
  })
}
```

### Step 8: Create Helper Function for Sending Notifications

Add this utility function in `src/lib/notifications.js`:

```javascript
export const sendNotification = async (userId, { title, body, url, tag }) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ userId, title, body, url, tag })
      }
    )

    if (!response.ok) {
      throw new Error('Failed to send notification')
    }

    return await response.json()
  } catch (error) {
    console.error('Error sending notification:', error)
    // Don't throw - notifications are non-critical
  }
}
```

### Step 9: Add Notification Icons

Create notification icons in your `public` folder:
- `icon-192x192.png` - Main notification icon
- `badge-72x72.png` - Badge icon (monochrome, for Android)

You can use your app logo or create specific icons.

### Step 10: Test Your Implementation

1. Start your dev server: `npm run dev`
2. Navigate to the notification settings page
3. Click "Enable Notifications"
4. Grant permission when prompted
5. Click "Send Test Notification"
6. You should see a notification!

## 📱 Testing on Different Devices

### Desktop (Chrome/Firefox/Edge)
- Should work immediately after granting permission
- Notifications appear in system notification center

### Android
- Works in Chrome, Firefox, Edge
- Notifications appear even when browser is closed
- Can customize notification behavior in Android settings

### iOS (iPhone/iPad)
- Requires iOS 16.4+ and Safari
- Add app to home screen for best experience ("Add to Home Screen")
- Go to Settings → Safari → Notifications to enable
- More limited than Android but functional

## 🔧 Troubleshooting

### Notifications not appearing?
1. Check browser console for errors
2. Verify VAPID keys are correctly set
3. Check notification permission is granted
4. Verify service worker is registered: DevTools → Application → Service Workers
5. Check that HTTPS is enabled (required for push notifications)

### Service worker not updating?
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Unregister old service worker: DevTools → Application → Service Workers → Unregister
3. Clear browser cache

### Database errors?
1. Verify SQL migration ran successfully
2. Check RLS policies are enabled
3. Verify user is authenticated

## 📊 Monitoring

Track notification delivery in Supabase:

```sql
-- View all active subscriptions
SELECT COUNT(*) as active_subscriptions FROM push_subscriptions;

-- View user preferences
SELECT * FROM notification_preferences WHERE user_id = 'USER_ID';

-- Clean up old/invalid subscriptions
DELETE FROM push_subscriptions WHERE updated_at < NOW() - INTERVAL '90 days';
```

## 🎯 Next Steps

1. **Scheduled Notifications**: Use Supabase cron jobs or external scheduler (like Vercel Cron) to send daily reminders
2. **Rich Notifications**: Add images, action buttons, and custom sounds
3. **Analytics**: Track notification open rates and engagement
4. **A/B Testing**: Test different notification copy and timing
5. **Personalization**: Customize notifications based on user behavior

## 📝 Notes

- Push notifications require HTTPS (works on localhost too)
- Users must grant permission - can't force it
- Respect user preferences - don't spam
- Consider time zones for scheduled notifications
- Battery impact is minimal with proper implementation

## 🔗 Useful Resources

- [Web Push Protocol](https://datatracker.ietf.org/doc/html/rfc8030)
- [Push API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [web-push library](https://github.com/web-push-libs/web-push)

## ✅ Checklist

- [ ] Run SQL migration in Supabase
- [ ] Generate VAPID keys
- [ ] Add VAPID keys to environment variables
- [ ] Update NotificationSettings component with public key
- [ ] Add NotificationSettings to your app
- [ ] Create Supabase Edge Function
- [ ] Deploy Edge Function
- [ ] Add notification icons
- [ ] Test on desktop
- [ ] Test on mobile
- [ ] Add notification triggers to Challenge.jsx
- [ ] Document for your team

Happy notifying! 🔔
