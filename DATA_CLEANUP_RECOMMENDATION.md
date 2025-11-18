# Data Cleanup Recommendation - Before First Real Users

## Current Situation

You have test data in Supabase from development and testing. Tomorrow you'll have real users (friends) testing the application.

## Recommendation: **CLEAN THE DATABASE** ✅

### Why Clean Now?

1. **Data Integrity**
   - Test data has old session ID formats (insecure `Math.random()`)
   - Some test data created before RLS fixes
   - Mixed test accounts vs real accounts

2. **User Experience**
   - Friends might see test data in leaderboards/groups
   - Challenge groups might have dummy data
   - Cleaner slate = better first impression

3. **Analytics Clarity**
   - Clear separation between test phase and real users
   - Easier to track real user metrics
   - No confusion about which data is real

4. **Privacy & Security**
   - Remove any test emails/PII
   - Fresh start with all security fixes in place
   - All new data will have secure session IDs

## What Data to Keep vs Delete

### ❌ DELETE (Test Data):
- `lead_flow_profiles` - All test lead magnet entries
- `challenge_progress` - Test challenge attempts
- `quest_completions` - Test quest completions
- `challenge_groups` - Test group challenges
- `challenge_participants` - Test group memberships
- `healing_compass_responses` - Test healing compass conversations
- `nervous_system_profiles` - Test nervous system assessments
- `flow_completions` - Test flow completion records
- **auth.users** - Test user accounts (if you don't need them)

### ✅ KEEP (System Data):
- Database schema/structure
- RLS policies
- Indexes
- Functions/triggers (if any)
- Migration history

## How to Clean the Database

### Option 1: Clean Via Supabase SQL Editor (Recommended)

Run these queries in **Supabase Dashboard → SQL Editor**:

```sql
-- BACKUP FIRST (optional but recommended)
-- Download table data via Table Editor before running

-- 1. Delete all user-generated data
DELETE FROM quest_completions;
DELETE FROM flow_completions;
DELETE FROM challenge_participants;
DELETE FROM challenge_groups;
DELETE FROM challenge_progress;
DELETE FROM healing_compass_responses;
DELETE FROM nervous_system_profiles;
DELETE FROM lead_flow_profiles;

-- 2. Reset sequences (so IDs start from 1)
-- Only if tables have auto-increment IDs
-- ALTER SEQUENCE IF EXISTS challenge_groups_id_seq RESTART WITH 1;

-- 3. Verify tables are empty
SELECT 'lead_flow_profiles' as table, COUNT(*) as rows FROM lead_flow_profiles
UNION ALL
SELECT 'challenge_progress', COUNT(*) FROM challenge_progress
UNION ALL
SELECT 'quest_completions', COUNT(*) FROM quest_completions
UNION ALL
SELECT 'challenge_groups', COUNT(*) FROM challenge_groups
UNION ALL
SELECT 'healing_compass_responses', COUNT(*) FROM healing_compass_responses
UNION ALL
SELECT 'nervous_system_profiles', COUNT(*) FROM nervous_system_profiles;

-- Expected: All tables should show 0 rows
```

### Option 2: Delete Test Users (Optional)

If you want to remove test user accounts:

```sql
-- ⚠️ WARNING: This will permanently delete user accounts
-- List users first to see what you have
SELECT id, email, created_at FROM auth.users ORDER BY created_at;

-- Delete specific test users (replace with actual test emails)
DELETE FROM auth.users WHERE email IN (
  'test@example.com',
  'test2@example.com'
  -- Add your test emails here
);

-- Or delete ALL users (nuclear option - only if all are test accounts)
-- DELETE FROM auth.users;
```

## Before You Clean - Take a Backup

### Quick Backup Steps:

1. Go to **Supabase Dashboard → Table Editor**
2. For each table:
   - Click table name
   - Click "..." menu → "Download as CSV"
   - Save locally (just in case)

Tables to backup:
- [ ] lead_flow_profiles
- [ ] challenge_progress
- [ ] quest_completions
- [ ] healing_compass_responses
- [ ] challenge_groups

## Recommended Cleanup Script

Copy this into **Supabase SQL Editor** and run:

```sql
-- ========================================
-- PRODUCTION CLEANUP - RUN BEFORE LAUNCH
-- ========================================
-- This will DELETE ALL USER DATA
-- Make sure you've backed up anything important!

BEGIN;

-- Count records before deletion
SELECT 'BEFORE CLEANUP' as status;
SELECT 'lead_flow_profiles' as table, COUNT(*) as rows FROM lead_flow_profiles
UNION ALL SELECT 'challenge_progress', COUNT(*) FROM challenge_progress
UNION ALL SELECT 'quest_completions', COUNT(*) FROM quest_completions
UNION ALL SELECT 'challenge_groups', COUNT(*) FROM challenge_groups
UNION ALL SELECT 'challenge_participants', COUNT(*) FROM challenge_participants
UNION ALL SELECT 'healing_compass_responses', COUNT(*) FROM healing_compass_responses
UNION ALL SELECT 'nervous_system_profiles', COUNT(*) FROM nervous_system_profiles
UNION ALL SELECT 'flow_completions', COUNT(*) FROM flow_completions;

-- Delete in correct order (respecting foreign keys)
DELETE FROM quest_completions;
DELETE FROM flow_completions;
DELETE FROM challenge_participants;
DELETE FROM challenge_progress;
DELETE FROM challenge_groups;
DELETE FROM healing_compass_responses;
DELETE FROM nervous_system_profiles;
DELETE FROM lead_flow_profiles;

-- Count records after deletion
SELECT 'AFTER CLEANUP' as status;
SELECT 'lead_flow_profiles' as table, COUNT(*) as rows FROM lead_flow_profiles
UNION ALL SELECT 'challenge_progress', COUNT(*) FROM challenge_progress
UNION ALL SELECT 'quest_completions', COUNT(*) FROM quest_completions
UNION ALL SELECT 'challenge_groups', COUNT(*) FROM challenge_groups
UNION ALL SELECT 'challenge_participants', COUNT(*) FROM challenge_participants
UNION ALL SELECT 'healing_compass_responses', COUNT(*) FROM healing_compass_responses
UNION ALL SELECT 'nervous_system_profiles', COUNT(*) FROM nervous_system_profiles
UNION ALL SELECT 'flow_completions', COUNT(*) FROM flow_completions;

-- If everything looks good, commit the changes
COMMIT;

-- If something went wrong, you can ROLLBACK instead:
-- ROLLBACK;
```

## After Cleanup Verification

### Test These Flows:

1. **Lead Magnet** (http://localhost:5173)
   - Complete archetype selection
   - Enter email
   - Verify magic link works

2. **Healing Compass** (http://localhost:5173/healing-compass)
   - Sign in as new user
   - Start healing compass flow
   - Verify data saves with user_id

3. **Challenge** (http://localhost:5173/7-day-challenge)
   - Start new challenge
   - Complete a quest
   - Verify progress saves

4. **Database Check**
   ```sql
   -- Verify new data is being created properly
   SELECT * FROM lead_flow_profiles ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM healing_compass_responses ORDER BY created_at DESC LIMIT 5;
   ```

## Alternative: Keep Test Data Separate

If you want to keep test data for reference:

### Option: Mark Test Data Instead of Deleting

```sql
-- Add test flag to tables (optional)
ALTER TABLE lead_flow_profiles ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

-- Mark existing data as test
UPDATE lead_flow_profiles SET is_test = TRUE;
UPDATE challenge_progress SET is_test = TRUE WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%test%'
);

-- Later, filter out test data in queries
SELECT * FROM lead_flow_profiles WHERE is_test = FALSE;
```

## My Recommendation

**Do the clean sweep:**

1. ✅ **Backup data** (5 minutes) - Just in case
2. ✅ **Run cleanup SQL** (1 minute) - Delete all user data
3. ✅ **Delete test auth users** (optional) - Clean user list
4. ✅ **Test all flows** (10 minutes) - Verify everything works
5. ✅ **Ready for real users!** - Fresh, clean database

## Why This Is Safe

- ✅ All schema/structure remains intact
- ✅ All security fixes (RLS, FK constraints) are in place
- ✅ All code changes are deployed
- ✅ New data will be clean and secure
- ✅ Easy to recreate test data if needed

## Post-Cleanup Checklist

Before your friends arrive tomorrow:

- [ ] Database cleaned
- [ ] Test user flow works (lead magnet → profile)
- [ ] Test healing compass works (AI chat)
- [ ] Test challenge works (create + complete quest)
- [ ] Verify data saves correctly in Supabase
- [ ] All routes working: `/`, `/me`, `/healing-compass`, `/7-day-challenge`
- [ ] Error boundary tested (it won't show up in normal use)
- [ ] Service role key added to Vercel (for API auth)

## Summary

**Yes, clean the database before tomorrow.** You want:
- Fresh start for real users
- No test data pollution
- All security fixes in place
- Clean analytics

Takes ~15 minutes total. Worth it for peace of mind! 🚀
