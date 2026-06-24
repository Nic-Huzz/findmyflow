# Profile Loading Debug Guide

## Issue: "Failed to load profile" after magic link

### Possible Causes:

1. **Email Mismatch**
   - The email saved during flow might not match the authenticated user's email
   - Check browser console for: `🔍 Loading user profile for: [email]`
   - Compare with email in Supabase `lead_flow_profiles` table

2. **No Profile Saved**
   - Profile might not have saved during flow
   - Check Supabase table for your email
   - Verify the flow completed the email step successfully

3. **Authentication Timing**
   - Profile tries to load before user is authenticated
   - Fixed: Now waits for `user` to be available

4. **Supabase Query Error**
   - Check browser console for detailed error messages
   - Verify table name is `lead_flow_profiles`
   - Check RLS (Row Level Security) policies in Supabase

## How to Debug:

### Step 1: Check Browser Console
Open browser DevTools → Console, look for:
- `🔍 Loading user profile for: [your-email]`
- Any error messages from Supabase

### Step 2: Check Supabase Database
1. Go to Supabase Dashboard
2. Table Editor → `lead_flow_profiles`
3. Check if your email exists in the table
4. Verify email matches exactly (case-sensitive)

### Step 3: Check Email During Flow
When you complete the flow and enter email:
- Check console for: `📤 Sending to Supabase:`
- Verify email matches what you use for magic link

### Step 4: Verify Authentication
After clicking magic link:
- Check console for: `🔐 Auth state changed:`
- Verify `user.email` matches saved email

## Fixed Issues:

✅ Now waits for user authentication before loading
✅ Better error messages (shows actual error)
✅ Handles empty results gracefully
✅ More detailed console logging

