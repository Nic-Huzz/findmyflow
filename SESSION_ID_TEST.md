# How to Check Session ID in Console

## Method 1: Check localStorage (Easiest)

1. Open your browser dev tools (F12 or Cmd+Option+I on Mac)
2. Go to **Console** tab
3. Type this and press Enter:

```javascript
localStorage.getItem('fmf_session_id')
```

**Expected Result:**
- ✅ Should be a UUID format: `"550e8400-e29b-41d4-a716-446655440000"`
- ❌ NOT old format: `"sess_1234567890_abc123def"`

## Method 2: Check in Application tab

1. Open dev tools (F12)
2. Go to **Application** tab (or **Storage** tab in Firefox)
3. Expand **Local Storage** in left sidebar
4. Click on `http://localhost:5173`
5. Find key: `fmf_session_id`

**Expected Value:** UUID format (32 hex chars with dashes)

## Method 3: Check database

Run in Supabase SQL Editor:

```sql
-- Check lead_flow_profiles
SELECT session_id
FROM lead_flow_profiles
ORDER BY created_at DESC
LIMIT 5;

-- Check challenge_progress
SELECT session_id
FROM challenge_progress
ORDER BY created_at DESC
LIMIT 5;
```

**Expected:** UUIDs, not Math.random format

## What Old vs New Looks Like

**❌ OLD (Insecure):**
- `session_1700000000000_abc123def`
- `sess_1700000000000_xyz789ghi`

**✅ NEW (Secure):**
- `550e8400-e29b-41d4-a716-446655440000`
- `f47ac10b-58cc-4372-a567-0e02b2c3d479`
