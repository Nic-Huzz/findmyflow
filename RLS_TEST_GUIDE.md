# How to Test Row Level Security (RLS)

## Test: Users Cannot See Other Users' Healing Compass Data

### Setup (Need 2 Users)

**User A (You):**
1. Sign in with your email
2. Complete Healing Compass flow
3. Note your user_id (see below)

**User B (Test account):**
1. Sign out (or use incognito window)
2. Sign in with different email (create new account)
3. Complete Healing Compass flow (different data)
4. Note their user_id

### Get User IDs

Run in Supabase SQL Editor:

```sql
-- See all healing compass responses with user emails
SELECT
  hc.id,
  hc.user_id,
  u.email,
  hc.stuck_gap_description,
  hc.created_at
FROM healing_compass_responses hc
JOIN auth.users u ON u.id = hc.user_id
ORDER BY hc.created_at DESC;
```

You should see 2 rows (User A and User B with different emails)

### Method 1: Try to Query Other User's Data (Browser Console)

**As User A (signed in):**

1. Open browser console (F12)
2. Paste this code (replace USER_B_ID with actual UUID from above):

```javascript
// Try to fetch User B's data
const { data, error } = await window.supabase
  .from('healing_compass_responses')
  .select('*')
  .eq('user_id', 'USER_B_ID_HERE'); // Replace with User B's UUID

console.log('Data:', data);
console.log('Error:', error);
```

**Expected Result:**
- `data: []` (empty array - RLS blocked it)
- OR `error: null` but empty results

**Should NOT see:** User B's healing compass data

### Method 2: Try Direct ID Access

```javascript
// Get the ID of User B's healing compass response from SQL query above
const userBResponseId = 'RESPONSE_ID_HERE'; // UUID from SQL

const { data, error } = await window.supabase
  .from('healing_compass_responses')
  .select('*')
  .eq('id', userBResponseId);

console.log('Attempted to access User B response:', data);
```

**Expected Result:**
- `data: []` (empty - RLS blocked)
- You should ONLY see your own data

### Method 3: Verify You CAN See Your Own Data

```javascript
// This SHOULD work
const { data, error } = await window.supabase
  .from('healing_compass_responses')
  .select('*');

console.log('My own data:', data);
```

**Expected Result:**
- `data: [{ user_id: 'YOUR_UUID', stuck_gap_description: '...' }]`
- Should only see 1 row (your own)

### Quick Test Without Second User

If you don't want to create a second account:

```sql
-- Run in Supabase SQL Editor (as admin)
-- This bypasses RLS and shows ALL data

SELECT
  user_id,
  email,
  stuck_gap_description
FROM healing_compass_responses hc
JOIN auth.users u ON u.id = hc.user_id;
```

Then in your browser (as User A):

```javascript
// Try to see ALL records (should only see yours)
const { data } = await window.supabase
  .from('healing_compass_responses')
  .select('*');

console.log('Total records I can see:', data.length);
// Should be 1 (only yours), even if database has multiple
```

## What RLS Does

**Without RLS (OLD - BROKEN):**
```sql
-- Old policy: ANY authenticated user sees ALL data
SELECT * FROM healing_compass_responses;
-- Returns: ALL users' data (privacy breach!)
```

**With RLS (NEW - FIXED):**
```sql
-- New policy: Users only see their own data
SELECT * FROM healing_compass_responses;
-- Returns: Only YOUR data (filtered by user_id = auth.uid())
```

## Success Criteria

✅ **RLS is working if:**
- You can see your own healing compass responses
- You CANNOT see other users' responses (empty array)
- Attempts to access specific IDs of other users fail
- Browser console shows `data: []` when querying other user_ids

❌ **RLS is broken if:**
- You can see multiple users' data
- Querying by another user_id returns their data
- Database shows 5 responses but you see all 5 in browser

## Alternative: Test with Supabase Auth Context

In Supabase SQL Editor:

```sql
-- Test as specific user (uses RLS)
SET request.jwt.claim.sub = 'YOUR_USER_ID_HERE';

SELECT * FROM healing_compass_responses;
-- Should only return rows where user_id = YOUR_USER_ID

-- Reset
RESET request.jwt.claim.sub;
```
