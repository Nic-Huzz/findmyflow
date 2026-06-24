# Supabase Edge Function Deployment Guide

## Prerequisites
- Supabase CLI installed globally
- Active Supabase project (qlwfcfypnoptsocdpxuv)

## Step 1: Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

## Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window for authentication.

## Step 3: Link Your Project

```bash
cd /Users/nichurrell/Findmyflow
supabase link --project-ref qlwfcfypnoptsocdpxuv
```

When prompted, enter your database password.

## Step 4: Deploy the Edge Function

```bash
supabase functions deploy send-push-notification
```

## Step 5: Set Environment Secrets

The Edge Function needs VAPID keys to send push notifications. Set them as secrets:

```bash
# Set VAPID Private Key (from your .env.local)
supabase secrets set VAPID_PRIVATE_KEY=3ecvdg4xSEKqtuMbDP0OI6bRWR-HVn41ibyb8QhLBQ8

# Set VAPID Public Key (from your .env.local)
supabase secrets set VAPID_PUBLIC_KEY=BMXOxrjOV7PCYOfy0aF2prFg1c8Lm_Unywj1twFHfGvxEgCvLsuS2pyXe_jwi0kEZrGMd_27zhL-7-W_bTqoyEQ

# Set VAPID Email (from your .env.local)
supabase secrets set VAPID_EMAIL=mailto:nichurrell@gmail.com
```

## Step 6: Verify Deployment

After deployment, you should see output like:
```
Deployed Function send-push-notification
Function URL: https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/send-push-notification
```

## Step 7: Test the Function

You can test the function using curl:

```bash
curl -i --location --request POST 'https://qlwfcfypnoptsocdpxuv.supabase.co/functions/v1/send-push-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "userId": "test-user-id",
    "title": "Test Notification",
    "body": "This is a test notification",
    "url": "/",
    "tag": "test"
  }'
```

Replace `YOUR_ANON_KEY` with your actual Supabase anon key from `.env.local`.

## Troubleshooting

### Error: "Project not found"
- Make sure you're using the correct project ref: `qlwfcfypnoptsocdpxuv`
- Verify you're logged in with the correct Supabase account

### Error: "web-push module not found"
- The Edge Function automatically imports web-push from esm.sh
- Make sure you have internet connectivity during deployment

### Error: "VAPID keys not configured"
- Ensure you've set all three secrets (VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_EMAIL)
- Check that the keys match your `.env.local` file

### Error: "Subscription is invalid"
- The function automatically removes invalid/expired subscriptions (410/404 errors)
- This is normal for users who have uninstalled the app or cleared browser data

## Updating the Function

If you make changes to the Edge Function code, redeploy with:

```bash
supabase functions deploy send-push-notification
```

## Viewing Logs

To see function logs in real-time:

```bash
supabase functions logs send-push-notification
```

Or view logs in the Supabase Dashboard:
https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv/logs/edge-functions
