# Push Notifications - Remaining Setup Steps

## ✅ Completed Steps

1. ✅ **Service Worker Created** - `/public/service-worker.js`
2. ✅ **Notification Library Created** - `/src/lib/notifications.js`
3. ✅ **Notification Settings UI** - `/src/components/NotificationSettings.jsx`
4. ✅ **Notification Prompt Banner** - `/src/components/NotificationPrompt.jsx`
5. ✅ **Settings Route Added** - `/settings/notifications` in AppRouter.jsx
6. ✅ **VAPID Keys Generated** - Added to `.env.local`
7. ✅ **Notification Triggers Added** - Day unlock notification in Challenge.jsx
8. ✅ **Edge Function Code Created** - `/supabase/functions/send-push-notification/index.ts`
9. ✅ **SQL Migration Ready** - `/Sql commands/create_push_notifications_tables.sql`
10. ✅ **Documentation Created** - Setup guides and deployment docs

## 🔄 Remaining Steps

### Step 1: Run SQL Migration in Supabase

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `/Sql commands/create_push_notifications_tables.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd+Enter)
7. Verify tables created:
   - `push_subscriptions`
   - `notification_preferences`

### Step 2: Deploy Supabase Edge Function

Follow the guide in `SUPABASE_EDGE_FUNCTION_DEPLOYMENT.md`:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
cd /Users/nichurrell/Findmyflow
supabase link --project-ref qlwfcfypnoptsocdpxuv

# Deploy the Edge Function
supabase functions deploy send-push-notification

# Set environment secrets
supabase secrets set VAPID_PRIVATE_KEY=3ecvdg4xSEKqtuMbDP0OI6bRWR-HVn41ibyb8QhLBQ8
supabase secrets set VAPID_PUBLIC_KEY=BMXOxrjOV7PCYOfy0aF2prFg1c8Lm_Unywj1twFHfGvxEgCvLsuS2pyXe_jwi0kEZrGMd_27zhL-7-W_bTqoyEQ
supabase secrets set VAPID_EMAIL=mailto:nichurrell@gmail.com
```

### Step 3: Create Notification Icons

Follow the guide in `NOTIFICATION_ICONS_GUIDE.md`:

**Quick Option - Use a Favicon Generator:**
1. Go to https://realfavicongenerator.net/
2. Upload your FindMyFlow logo
3. Generate icons
4. Download `icon-192x192.png` and `badge-72x72.png`
5. Place them in `/public` folder

**Or create temporary placeholders for testing:**
- Any 192x192 PNG for the icon
- Any 72x72 PNG for the badge

### Step 4: Restart Development Server

Since we added new environment variables (VAPID keys), you need to restart the dev server:

```bash
# Stop the current dev server (Ctrl+C if running in terminal)
# Or kill the process

# Start it again
npm run dev
```

### Step 5: Test Notifications Locally

1. Open the app in your browser: http://localhost:5173
2. Login to your account
3. Navigate to `/settings/notifications`
4. Click **Enable Notifications**
5. Grant permission when prompted
6. Click **Send Test Notification**
7. You should see a notification appear!

### Step 6: Test Day Unlock Notification

1. Go to `/7-day-challenge`
2. If you're on Day 0, click **Start Day 1**
3. You should receive a notification: "Day 1 Unlocked! 🎉"
4. Check that it works correctly

### Step 7: Add More Notification Triggers (Optional)

You can add notifications for other events:

**Leaderboard rank change:**
```javascript
// In Challenge.jsx, after updating leaderboard
if (newRank < oldRank) {
  await sendNotification(user.id, {
    title: '🏆 Rank Up!',
    body: `You moved up to #${newRank} on the leaderboard!`,
    url: '/7-day-challenge',
    tag: 'leaderboard'
  })
}
```

**Artifact unlock:**
```javascript
// When unlocking an artifact
await sendNotification(user.id, {
  title: '✨ Artifact Unlocked!',
  body: `You unlocked a new artifact: ${artifactName}`,
  url: '/artifacts',
  tag: 'artifact-unlock'
})
```

**Group member join:**
```javascript
// When someone joins using your group code
await sendNotification(user.id, {
  title: '👥 New Group Member!',
  body: `${memberName} joined your group`,
  url: '/7-day-challenge',
  tag: 'group-activity'
})
```

### Step 8: Production Deployment (Vercel)

When deploying to production:

1. **Add Environment Variables to Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add:
     - `VITE_VAPID_PUBLIC_KEY` = `BMXOxrjOV7PCYOfy0aF2prFg1c8Lm_Unywj1twFHfGvxEgCvLsuS2pyXe_jwi0kEZrGMd_27zhL-7-W_bTqoyEQ`
     - `VAPID_PRIVATE_KEY` = `3ecvdg4xSEKqtuMbDP0OI6bRWR-HVn41ibyb8QhLBQ8`
     - `VAPID_EMAIL` = `mailto:nichurrell@gmail.com`

2. **Redeploy your app** to pick up the new environment variables

3. **The Supabase Edge Function** is already deployed to production (same for dev and prod)

4. **Test on production** with a real device/browser

## 📋 Checklist

- [ ] Run SQL migration in Supabase Dashboard
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Login to Supabase: `supabase login`
- [ ] Link project: `supabase link --project-ref qlwfcfypnoptsocdpxuv`
- [ ] Deploy Edge Function: `supabase functions deploy send-push-notification`
- [ ] Set VAPID secrets in Supabase
- [ ] Create notification icons (192x192 and 72x72)
- [ ] Restart dev server
- [ ] Test notifications at `/settings/notifications`
- [ ] Test day unlock notification
- [ ] Add to Vercel environment variables
- [ ] Deploy to production

## 🐛 Troubleshooting

**"Service Worker registration failed"**
- Make sure `/public/service-worker.js` exists
- Check browser console for errors
- Try clearing browser cache and reloading

**"Notification permission denied"**
- Clear browser site data
- Try in incognito/private mode
- Check browser settings → Site settings → Notifications

**"Failed to send notification" (in Edge Function)**
- Check Supabase logs: `supabase functions logs send-push-notification`
- Verify VAPID secrets are set correctly
- Ensure subscription was saved to database

**Icons not showing**
- Verify icon files exist in `/public`
- Check file names: `icon-192x192.png` and `badge-72x72.png`
- Clear service worker cache
- Re-register service worker

## 📖 Documentation References

- Full setup guide: `PUSH_NOTIFICATIONS_SETUP.md`
- Edge Function deployment: `SUPABASE_EDGE_FUNCTION_DEPLOYMENT.md`
- Icon creation guide: `NOTIFICATION_ICONS_GUIDE.md`
- Service Worker code: `/public/service-worker.js`
- Notification utilities: `/src/lib/notifications.js`

## 🎯 Next Features to Consider

Once basic notifications are working, you could add:

1. **Scheduled Notifications** - Daily reminders at specific times
2. **Notification History** - Track sent notifications
3. **Rich Notifications** - Add images, actions, progress bars
4. **Notification Groups** - Group related notifications
5. **Do Not Disturb** - Quiet hours settings
6. **Notification Analytics** - Track open rates, engagement
