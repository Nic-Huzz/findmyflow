# Nikigai Supabase Migrations

## How to Run the Schema Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy and Paste the Migration**
   - Open `create_nikigai_schema.sql`
   - Copy the entire file contents
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait for completion (should take ~10-30 seconds)

5. **Verify Success**
   - Look for the success messages at the bottom
   - Should see: "✅ All Nikigai tables created successfully!"

### Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Make sure you're in the project root
cd /home/user/findmyflow

# Run the migration
supabase db push

# Or apply specific migration
supabase migration up
```

### Option 3: Direct PostgreSQL Connection

If you have direct database access:

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f supabase/migrations/create_nikigai_schema.sql
```

---

## What Gets Created

### 📊 Tables (7)

1. **`nikigai_sessions`** — User journey tracking
2. **`nikigai_clusters`** — All generated clusters (skills, problems, people, market)
3. **`nikigai_key_outcomes`** — Flattened key outcomes for Library of Answers
4. **`nikigai_responses`** — Raw user responses for each step
5. **`library_display_cache`** — Pre-computed display data (fast queries!)
6. **`clustering_metrics`** — Quality metrics tracking
7. **`analytics_events`** — User behavior and system events

### 🔍 Indexes (20+)

Optimized for:
- User lookups
- Session queries
- Cluster filtering
- Full-text search on skills/industries
- Time-based analytics

### ⚙️ Functions (3)

1. **`generate_key_outcomes(session_id)`** — Extract all key outcomes
2. **`refresh_library_cache(user_id)`** — Rebuild Library of Answers cache
3. **`update_updated_at_column()`** — Auto-update timestamps

### 🎯 Triggers (5)

- Auto-update `updated_at` on all main tables
- Auto-invalidate cache when clusters change

### 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Policies for SELECT, INSERT, UPDATE, DELETE

---

## Quick Test

After running the migration, test it works:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'nikigai%';

-- Should return 7 tables

-- Test functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('generate_key_outcomes', 'refresh_library_cache');

-- Should return 2 functions
```

---

## Usage Examples

### Create a New Session

```javascript
const { data: session, error } = await supabase
  .from('nikigai_sessions')
  .insert({
    user_id: userId,
    flow_version: 'v2.2',
    status: 'in_progress'
  })
  .select()
  .single()
```

### Store a Response

```javascript
const { data, error } = await supabase
  .from('nikigai_responses')
  .insert({
    session_id: sessionId,
    user_id: userId,
    step_id: '2.0',
    question_text: 'What did you love doing most?',
    response_raw: userInput,
    bullet_count: 5,
    tags_extracted: extractedTags
  })
```

### Create a Cluster

```javascript
const { data, error } = await supabase
  .from('nikigai_clusters')
  .insert({
    session_id: sessionId,
    user_id: userId,
    cluster_type: 'skills',
    cluster_stage: 'final',
    cluster_label: 'Creative Expression',
    archetype: 'The Creator',
    items: clusterItems,
    score: 0.85,
    quality_grade: 'B'
  })
```

### Generate Key Outcomes

```javascript
const { data, error } = await supabase
  .rpc('generate_key_outcomes', {
    p_session_id: sessionId
  })
```

### Get Library of Answers (ONE QUERY!)

```javascript
const { data, error } = await supabase
  .from('library_display_cache')
  .select('display_data')
  .eq('user_id', userId)
  .eq('is_stale', false)
  .single()

// data.display_data contains everything:
// - skills.clusters
// - skills.job_titles
// - problems.clusters
// - problems.change_statements
// - people.empathy_snapshot
// - market.opportunity_space
// - integration.mission_statement
// - life_story.one_sentence
```

### Refresh Library Cache

```javascript
await supabase.rpc('refresh_library_cache', {
  p_user_id: userId
})
```

---

## Troubleshooting

### "relation already exists" Error

If you see this error, tables already exist. You can either:

1. **Drop existing tables** (⚠️ DELETES ALL DATA):
   ```sql
   DROP TABLE IF EXISTS analytics_events CASCADE;
   DROP TABLE IF EXISTS clustering_metrics CASCADE;
   DROP TABLE IF EXISTS library_display_cache CASCADE;
   DROP TABLE IF EXISTS nikigai_responses CASCADE;
   DROP TABLE IF EXISTS nikigai_key_outcomes CASCADE;
   DROP TABLE IF EXISTS nikigai_clusters CASCADE;
   DROP TABLE IF EXISTS nikigai_sessions CASCADE;
   ```
   Then re-run the migration.

2. **Skip to later sections** if you just want to add functions/triggers

### "permission denied" Error

Make sure you're running this as a database owner or with sufficient privileges. In Supabase dashboard, you should have full access.

### RLS Blocking Queries

If queries return empty even though data exists:
- Make sure `auth.uid()` returns the correct user ID
- Check RLS policies are enabled: `SELECT * FROM pg_policies WHERE tablename LIKE 'nikigai%';`
- Temporarily disable RLS for testing: `ALTER TABLE nikigai_sessions DISABLE ROW LEVEL SECURITY;`

---

## Next Steps

After migration is complete:

1. ✅ Test with a sample session creation
2. ✅ Implement the Nikigai flow in your app
3. ✅ Wire up tag extraction and clustering
4. ✅ Build the Library of Answers page
5. ✅ Monitor with analytics queries

---

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard → Database → Logs
2. Verify all tables created: `\dt nikigai*` (if using psql)
3. Check the verification output at end of migration script
