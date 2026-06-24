# Email Authentication Troubleshooting

## Issue
Getting "something went wrong. please try again" error when trying to send magic link/verification code on mobile device.

## Common Causes & Solutions

### 1. Supabase Email Provider Not Configured

**Check if email provider is set up:**
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Go to Supabase Dashboard → Project Settings → Authentication
3. Ensure **"Enable email provider"** is turned ON
4. Check that **SMTP settings** are configured

**Default Configuration:**
- Supabase provides a default email service for development
- Limited to 3-4 emails per hour for free tier
- For production, you need to configure your own SMTP provider

**To Configure Custom SMTP:**
1. Dashboard → Project Settings → Authentication → SMTP Settings
2. Add your SMTP credentials (Gmail, SendGrid, AWS SES, etc.)
3. Test email delivery

### 2. Email Rate Limiting

Supabase has rate limits on authentication emails:
- **Development (default):** 3-4 emails per hour
- **Custom SMTP:** Based on your provider

**Solution:**
- Wait an hour and try again
- Configure custom SMTP for higher limits
- Use different email addresses for testing

### 3. Network/CORS Issues (Mobile Testing)

When accessing from phone via `http://192.168.1.2:5174/`:
- CORS might block requests
- Network firewall might interfere
- Dev server might not be accessible

**Solution:**
Check Supabase URL configuration allows your local IP:
1. Dashboard → Project Settings → API
2. Add `http://192.168.1.2:5174` to allowed redirect URLs
3. Restart dev server

### 4. Missing Environment Variables

The app needs these environment variables:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Check:**
```bash
grep VITE_SUPABASE .env.local
```

If missing, copy from `.env.example` and fill in your values.

### 5. Email Confirm Emails Setting

Supabase has a setting that requires email confirmation:

1. Dashboard → Authentication → Providers → Email
2. Check **"Confirm email"** setting
3. If enabled, users must click link before signing in
4. For magic links, this should be **disabled** or set to optional

### 6. Redirect URL Configuration

Magic links need proper redirect URLs configured:

1. Dashboard → Authentication → URL Configuration
2. Add these redirect URLs:
   - `http://localhost:5174/me` (local development)
   - `http://192.168.1.2:5174/me` (mobile testing)
   - Your production domain (when deployed)

## Testing Steps

### 1. Check Browser Console
When error occurs, open browser console (on phone or desktop) and look for:
```
❌ Supabase error: [error details]
❌ Magic link error: [error details]
```

### 2. Test on Desktop First
1. Open `http://localhost:5174/` on your computer
2. Try the email flow
3. Check browser console for errors
4. If it works on desktop but not mobile, it's a network/CORS issue

### 3. Check Supabase Logs
1. Supabase Dashboard → Logs → API Logs
2. Look for failed authentication attempts
3. Check error messages

### 4. Verify Email Settings
Run this in Supabase SQL Editor:
```sql
SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 10;
```
This shows recent user signups and their email status.

## Enhanced Error Display

Updated error handling in `App.jsx` (line 522) to show detailed error:
```javascript
const errorMessage = err?.message || err?.error_description || 'Unknown error'
text: `Something went wrong. Please try again.\n\nError: ${errorMessage}`
```

Now when you test again, the actual error message will be displayed.

## Quick Fixes to Try

### Fix 1: Enable Email Provider
```
Supabase Dashboard → Authentication → Providers → Email → Enable
```

### Fix 2: Add Redirect URLs
```
Supabase Dashboard → Authentication → URL Configuration
Add: http://192.168.1.2:5174/me
```

### Fix 3: Disable "Confirm Email"
```
Supabase Dashboard → Authentication → Providers → Email
Set "Confirm email" to OFF or Optional
```

### Fix 4: Test with cURL
Test if Supabase API is reachable from your phone's network:
```bash
curl -X POST 'https://qlwfcfypnoptsocdpxuv.supabase.co/auth/v1/otp' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## What to Try Next

1. **Test the app again** and note the exact error message shown
2. **Check Supabase Dashboard** → Authentication → Providers → Email (make sure it's enabled)
3. **Add redirect URLs** for your local network IP
4. **Try on desktop browser first** to isolate mobile-specific issues
5. **Check rate limits** - wait an hour if you've sent many test emails

## Expected Behavior

When working correctly, you should see:
1. Enter email → "Please confirm your email"
2. Click confirm → Console logs: `📧 Sending magic link to: email@example.com`
3. Success message: `I've sent a magic link to email@example.com...`
4. Email received within 1-2 minutes

## Files Modified
- `src/App.jsx` (line 522) - Enhanced error message display
