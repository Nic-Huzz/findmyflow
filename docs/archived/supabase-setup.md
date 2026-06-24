# Supabase Connection & Database Setup

This document explains how to connect to the FindMyFlow Supabase database and manage migrations.

---

## Connection Details

| Setting | Value |
|---------|-------|
| **Project Ref** | `qlwfcfypnoptsocdpxuv` |
| **Region** | `ap-southeast-2` (Sydney) |
| **Supabase URL** | `https://qlwfcfypnoptsocdpxuv.supabase.co` |
| **Dashboard** | https://supabase.com/dashboard/project/qlwfcfypnoptsocdpxuv |

---

## Why REST API Instead of psql

Direct PostgreSQL connections (`psql`) have DNS resolution issues with Supabase's pooler hostnames. Instead, we use Supabase's **REST API** which works reliably.

**What didn't work:**
```bash
# These fail with DNS/connection errors
psql "postgresql://postgres.qlwfcfypnoptsocdpxuv@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres"
psql -h db.qlwfcfypnoptsocdpxuv.supabase.co -U postgres
```

**What works:**
```bash
# REST API via curl (using service_role key to bypass RLS)
./scripts/db-query.sh <table> [columns] [filters]
```

---

## Querying the Database

### Using the Helper Script

```bash
./scripts/db-query.sh <table> [columns] [filters]
```

**Examples:**

```bash
# Get all users' stage progress
./scripts/db-query.sh user_stage_progress

# Get specific columns
./scripts/db-query.sh user_stage_progress "id,current_stage,persona"

# Filter results
./scripts/db-query.sh flow_sessions "id,flow_type,status" "status=eq.completed&limit=10"

# Order by date
./scripts/db-query.sh milestone_completions "*" "order=created_at.desc&limit=5"

# Filter by user
./scripts/db-query.sh challenge_instances "*" "user_id=eq.YOUR_USER_ID"
```

### Filter Syntax (PostgREST)

| Operation | Syntax | Example |
|-----------|--------|---------|
| Equals | `eq.` | `status=eq.completed` |
| Not equals | `neq.` | `status=neq.abandoned` |
| Greater than | `gt.` | `points=gt.100` |
| Less than | `lt.` | `points=lt.50` |
| In list | `in.()` | `persona=in.(vibe_seeker,vibe_riser)` |
| Is null | `is.null` | `completed_at=is.null` |
| Order | `order=` | `order=created_at.desc` |
| Limit | `limit=` | `limit=10` |

Combine filters with `&`:
```bash
./scripts/db-query.sh flow_sessions "*" "status=eq.completed&flow_type=eq.100m_offer&limit=5"
```

### Direct curl (if needed)

```bash
curl -s "https://qlwfcfypnoptsocdpxuv.supabase.co/rest/v1/TABLE_NAME?select=*&limit=10" \
  -H "apikey: SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY"
```

---

## API Keys

| Key | Purpose | Location |
|-----|---------|----------|
| **Anon Key** | Client-side (respects RLS) | `.env.local` as `VITE_SUPABASE_ANON_KEY` |
| **Service Role Key** | Server-side (bypasses RLS) | `scripts/db-query.sh` (hardcoded) |

**To get keys:**
Supabase Dashboard → Settings → API

**Important:** Never expose the service_role key in client-side code.

---

## Supabase CLI

### Setup (Already Done)

```bash
# Link project (one-time)
supabase link --project-ref qlwfcfypnoptsocdpxuv
```

### Check Status

```bash
supabase status
```

---

## Database Migrations

### Migration File Format

Files must follow this naming pattern:
```
YYYYMMDDHHMMSS_description.sql
```

Examples:
- `20251204070000_rename_to_flow_sessions.sql`
- `20251211120000_add_nervous_system_fields.sql`

### View Pending Migrations

```bash
supabase db push --dry-run
```

### Apply Migrations

```bash
npm run db:push
# or
supabase db push
```

### Create a New Migration

```bash
# Generate migration from schema changes
npm run db:diff my_change_name

# Or manually create file
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_my_change.sql
```

### Migration Best Practices

**Make migrations idempotent** (safe to re-run):

```sql
-- Good: Won't fail if already exists
CREATE TABLE IF NOT EXISTS my_table (...);
ALTER TABLE my_table ADD COLUMN IF NOT EXISTS new_column TEXT;
CREATE INDEX IF NOT EXISTS idx_name ON my_table(column);
DROP POLICY IF EXISTS "policy_name" ON my_table;
CREATE POLICY "policy_name" ON my_table ...;

-- Bad: Will fail on re-run
CREATE TABLE my_table (...);  -- Error if exists
ALTER TABLE my_table ADD COLUMN new_column TEXT;  -- Error if exists
```

### Fix Migration Issues

If migrations get out of sync:

```bash
# Mark a version as reverted (removes from history)
supabase migration repair --status reverted VERSION_NUMBER

# List migration history
supabase migration list
```

---

## Edge Functions

### Deploy All Functions

```bash
npm run functions:deploy:all
# or
supabase functions deploy
```

### Deploy Single Function

```bash
supabase functions deploy graduation-check
```

### List Deployed Functions

```bash
supabase functions list
```

### Current Edge Functions

| Function | Purpose |
|----------|---------|
| `graduation-check` | Checks if user meets graduation requirements |
| `nikigai-conversation` | Handles AI chat in flows |
| `nervous-system-mirror` | AI analysis for nervous system flow |
| `flow-extract-tags` | Extracts tags from flow entries |
| `generate-cluster-label` | AI generates cluster labels |
| `send-push-notification` | Sends web push notifications |
| `scheduled-notifications` | Cron job for reminders |
| `check-leaderboard-changes` | Monitors leaderboard updates |

---

## GitHub Actions (CI/CD)

On push to `main`:
1. Builds the app (catches errors)
2. Deploys all edge functions automatically

### Required Secrets

Set these in GitHub repo → Settings → Secrets → Actions:

| Secret | Value |
|--------|-------|
| `SUPABASE_PROJECT_REF` | `qlwfcfypnoptsocdpxuv` |
| `SUPABASE_ACCESS_TOKEN` | Generate at https://supabase.com/dashboard/account/tokens |
| `VITE_SUPABASE_URL` | `https://qlwfcfypnoptsocdpxuv.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | From `.env.local` |

---

## NPM Scripts

| Command | What it does |
|---------|--------------|
| `npm run db:push` | Apply migrations to remote |
| `npm run db:pull` | Pull remote schema locally |
| `npm run db:diff` | Generate migration from changes |
| `npm run db:connect` | Attempt psql connection (may not work) |
| `npm run functions:deploy` | Deploy edge functions |
| `npm run functions:serve` | Run functions locally |
| `npm run supabase:status` | Check CLI status |

---

## Troubleshooting

### "Remote migration versions not found"

Migration file was renamed but remote has old version:
```bash
supabase migration repair --status reverted OLD_VERSION
```

### "Tenant or user not found" (psql)

This is the DNS issue. Use REST API instead:
```bash
./scripts/db-query.sh table_name
```

### "Policy already exists"

Make migrations idempotent:
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ON table_name ...;
```

### Edge function not deploying

Check you're logged in:
```bash
supabase login
supabase link --project-ref qlwfcfypnoptsocdpxuv
```

---

## Quick Reference

```bash
# Query data
./scripts/db-query.sh user_stage_progress

# Apply migrations
npm run db:push

# Deploy functions
npm run functions:deploy:all

# Check what's pending
supabase db push --dry-run

# View migration history
supabase migration list
```
