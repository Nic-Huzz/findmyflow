# Magic Link Redirect Fix

## Issue
Magic links are redirecting to `findmyflow.nichuzz.com` which has an old deployment with the old flow.

## Current Behavior
The code uses `window.location.origin` which means:
- If you access the flow from `localhost` → redirects to `localhost/me`
- If you access from `findmyflow.nichuzz.com` → redirects to `findmyflow.nichuzz.com/me`
- The deployed version needs to be updated

## Solutions

### Option 1: Hardcode Redirect URL (Recommended)
Update `AuthProvider.jsx` to use a specific production domain:

```javascript
emailRedirectTo: import.meta.env.VITE_MAGIC_LINK_REDIRECT || `${window.location.origin}/me`
```

Then set environment variable in Vercel:
- `VITE_MAGIC_LINK_REDIRECT=https://your-production-domain.com/me`

### Option 2: Deploy Latest Code
Push your current code to update the `findmyflow.nichuzz.com` deployment:
```bash
git push
# Vercel will auto-deploy if connected
```

### Option 3: Supabase Redirect URLs
Also need to whitelist redirect URLs in Supabase Dashboard:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add `https://findmyflow.nichuzz.com/me` to "Redirect URLs"
3. Add any other production domains you use

## Next Steps
1. Decide which production domain should receive magic links
2. Update code with hardcoded URL or environment variable
3. Deploy latest code to that domain
4. Update Supabase redirect URL whitelist

