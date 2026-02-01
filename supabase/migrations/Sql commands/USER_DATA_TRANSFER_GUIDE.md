# User Data Transfer Guide

This guide helps you audit and transfer data from `nichurrell@icloud.com` to `huzz@nichuzz.com`.

## Overview

You have 4 SQL scripts available:

1. **audit_user_data.sql** - Shows row counts for all tables (summary)
2. **detailed_user_data_report.sql** - Shows actual records and details
3. **transfer_validation_flow_ownership.sql** - Transfers ONLY validation flows
4. **transfer_all_user_data.sql** - Transfers ALL user data

## Step-by-Step Process

### Step 1: Audit the Data

First, see what data exists for `nichurrell@icloud.com`:

#### Quick Summary (Row Counts)
```sql
-- Run: audit_user_data.sql
```
This shows counts for each table. Example output:
```
--- CORE TABLES ---
user_stage_progress: 1 rows
user_projects: 3 rows
flow_sessions: 12 rows
...
--- VALIDATION SYSTEM ---
validation_flows: 1 rows
validation_sessions: 5 rows
validation_responses: 25 rows
```

#### Detailed View (Actual Records)
```sql
-- Run: detailed_user_data_report.sql
```
This shows the actual data in each table, not just counts.

### Step 2: Choose Transfer Type

You have two options:

#### Option A: Transfer ONLY Validation Flows
Use this if you only want to transfer the validation form and responses:
```sql
-- Run: transfer_validation_flow_ownership.sql
```
**Transfers:**
- validation_flows (creator ownership)
- validation_analysis (AI analysis)
- validation_sessions (automatically follows the flow)
- validation_responses (automatically follows the flow)

#### Option B: Transfer ALL User Data
Use this if you want to move everything from one account to the other:
```sql
-- Run: transfer_all_user_data.sql
```
**Transfers:** Everything - 40+ tables including:
- Core tables (projects, stages, progress)
- Flow data (nikigai, persona, assessments)
- CRM data (contacts, pages, sequences)
- Groan matrix (challenges, proof, outcomes)
- Validation system (flows, sessions, responses)
- And more...

### Step 3: Execute the Transfer

**IMPORTANT:** All transfer scripts have safety measures:
- Step 1 is always a preview (shows what will be transferred)
- Step 2 is commented out by default
- You must manually uncomment Step 2 to execute the transfer

#### How to Run:

1. **Go to Supabase SQL Editor:**
   https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv/sql/new

2. **Copy the SQL script contents** (either validation-only or all-data)

3. **Run Step 1** (preview) - This is safe, read-only
   - Review the output
   - Verify the counts look correct

4. **Uncomment Step 2** in the SQL editor
   - Remove the `/*` and `*/` around the DO block
   - This enables the transfer

5. **Run Step 2** (execute transfer)
   - This actually moves the data
   - Watch the output for confirmation

6. **Run Step 3** (verification)
   - Confirms old user has no data left
   - Confirms new user has the data

### Step 4: Verify the Transfer

After running the transfer, verify it worked:

```sql
-- Check old user (should be empty)
SELECT COUNT(*) FROM validation_flows
WHERE creator_user_id IN (
  SELECT id FROM auth.users WHERE email = 'nichurrell@icloud.com'
);
-- Expected: 0

-- Check new user (should have the data)
SELECT COUNT(*) FROM validation_flows
WHERE creator_user_id IN (
  SELECT id FROM auth.users WHERE email = 'huzz@nichuzz.com'
);
-- Expected: 1 (or however many flows existed)
```

## Files Reference

| File | Purpose | Safe to Run? |
|------|---------|--------------|
| `audit_user_data.sql` | Row count summary | ✅ Yes (read-only) |
| `detailed_user_data_report.sql` | Show actual records | ✅ Yes (read-only) |
| `transfer_validation_flow_ownership.sql` | Transfer validation flows only | ⚠️ Step 2 requires uncommenting |
| `transfer_all_user_data.sql` | Transfer everything | ⚠️ Step 2 requires uncommenting |

## Quick Start Commands

### Just want to see what's there?
```bash
# Open Supabase SQL Editor
open "https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv/sql/new"

# Then paste: supabase/migrations/Sql commands/audit_user_data.sql
```

### Ready to transfer validation flows only?
```bash
# 1. Run audit first
# 2. Then paste: supabase/migrations/Sql commands/transfer_validation_flow_ownership.sql
# 3. Run Step 1 (preview)
# 4. Uncomment Step 2 and run
# 5. Run Step 3 (verify)
```

### Need to transfer everything?
```bash
# 1. Run audit first
# 2. Then paste: supabase/migrations/Sql commands/transfer_all_user_data.sql
# 3. Run Step 1 (preview)
# 4. Uncomment Step 2 and run
# 5. Run Step 3 (verify)
```

## Safety Notes

- ✅ All audit scripts are read-only and safe
- ⚠️ Transfer scripts modify data (Step 2)
- 🔒 Step 2 is commented out by default
- 📋 Always run Step 1 (preview) first
- ✓ Always run Step 3 (verify) after

## Need Help?

If you encounter any errors:
1. Check the error message in the SQL output
2. Some tables may not exist yet (this is normal for new features)
3. The scripts handle missing tables gracefully
4. Contact support if you see "Transfer failed" errors

## What Gets Transferred

### Validation Flows Only (Option A)
- ✅ validation_flows
- ✅ validation_sessions (automatically, via flow_id reference)
- ✅ validation_responses (automatically, via flow_id reference)
- ✅ validation_analysis

### All User Data (Option B)
Everything from Option A, plus:
- User projects and stage progress
- All flow sessions and entries
- Nikigai clusters, responses, and outcomes
- Persona profiles and assessments
- Nervous system and healing compass data
- All offer assessments (attraction, upsell, downsell, etc.)
- CRM data (pages, contacts, sequences, leads)
- Groan matrix (challenges, proof, outcomes, streaks)
- Zarlo conversations
- Quest and milestone completions
- And more...
