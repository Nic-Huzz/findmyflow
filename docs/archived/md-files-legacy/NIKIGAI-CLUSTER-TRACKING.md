# Nikigai Cluster Tracking Fix

## Issue
Clusters were being created at unexpected steps during the Nikigai Skills flow. While clusters should only be created at steps `2.3` and `2.4`, there was no way to verify which step actually triggered cluster creation in the database.

## Root Cause
The `nikigai_clusters` table was missing a `step_id` field to track which step in the flow triggered cluster creation. This made it impossible to debug when clusters were being created incorrectly.

## Solution
Added `step_id` tracking to the cluster creation process:

### 1. Database Schema Update
Added `step_id` column to `nikigai_clusters` table:

**Migration:** `20251205_01_add_step_id_to_nikigai_clusters.sql`

```sql
ALTER TABLE nikigai_clusters
ADD COLUMN IF NOT EXISTS step_id TEXT;

CREATE INDEX IF NOT EXISTS idx_nikigai_clusters_step_id ON nikigai_clusters(step_id);

COMMENT ON COLUMN nikigai_clusters.step_id IS 'The step ID that triggered this cluster creation (e.g., 2.3, 2.4)';
```

### 2. Frontend Code Update
Updated `NikigaiTest.jsx` to save `step_id` when inserting clusters:

**File:** `src/NikigaiTest.jsx` (line 566)

```javascript
for (const cluster of aiResponse.clusters) {
  await supabase.from('nikigai_clusters').insert({
    session_id: sessionId,
    user_id: user.id,
    step_id: nextStepData.id, // Track which step created these clusters
    cluster_type: clusterType,
    cluster_stage: clusterStage,
    cluster_label: cluster.label,
    items: cluster.items || [],
    insight: cluster.insight || cluster.summary || null,
    source_responses: clusterSources,
    archived: false
  })
}
```

### 3. Enhanced Logging
Updated console logs to show which step created clusters:

```javascript
console.log('✅ Clusters saved to database:', aiResponse.clusters.length, 'at step:', nextStepData.id, 'as cluster_stage:', clusterStage)
```

## Expected Behavior

### Skills Flow (nikigai-flow-1-skills.json)
Clusters should ONLY be created at these steps:

| Step ID | Step Index | Cluster Type | Cluster Stage | Purpose |
|---------|------------|--------------|---------------|---------|
| `2.3` | 5 | `skills` | `preview` | Preview clusters from hobbies only |
| `2.4` | 8 | `roles` | `final` | Final role clusters from all responses |

### When Clustering is Triggered
The frontend checks if the **next step** has `assistant_postprocess.cluster`:

```javascript
const shouldCluster = nextStepData?.assistant_postprocess?.cluster !== undefined
```

- User completes step `2.2` → advances to `2.3` → clustering triggered
- User completes step `5.0` → advances to `2.4` → clustering triggered

### Step 2.3 Special Case
Step `2.3` has NO `assistant_prompt` - it's a clustering-only step:
- User answers step `2.2`
- Code advances to step `2.3`
- Clustering happens immediately (no question asked)
- Clusters displayed
- User confirms "Clusters look good!"
- Code advances to step `4.0`

This is why clusters appear when reaching step `4.0`, but they're correctly created at step `2.3`.

## Verification

### Check Clusters in Database
```sql
SELECT
  step_id,
  cluster_type,
  cluster_stage,
  COUNT(*) as cluster_count
FROM nikigai_clusters
WHERE flow_type = 'skills'
GROUP BY step_id, cluster_type, cluster_stage
ORDER BY step_id;
```

Expected results:
- `step_id = '2.3'` with `cluster_type = 'skills'`, `cluster_stage = 'preview'`
- `step_id = '2.4'` with `cluster_type = 'roles'`, `cluster_stage = 'final'`
- NO clusters with `step_id = '4.0'`

### Console Logs
When testing the Skills flow, you should see:
```
🔍 Clustering/Generation Debug: { shouldCluster: true, clusterType: 'skills', ... }
✅ Clusters saved to database: 3 at step: 2.3 as cluster_stage: preview

🔍 Clustering/Generation Debug: { shouldCluster: true, clusterType: 'roles', ... }
✅ Clusters saved to database: 4 at step: 2.4 as cluster_stage: final
```

## Files Changed
1. `supabase/migrations/20251205_01_add_step_id_to_nikigai_clusters.sql` - Added migration
2. `src/NikigaiTest.jsx` - Updated cluster insertion logic (line 566) and logging (line 576)

## Testing
✅ Tested on 2025-12-05
- Migration applied successfully
- Clusters created only at steps `2.3` and `2.4`
- No clusters created at step `4.0`
- `step_id` correctly tracked in database

## Future Improvements
- Add validation to prevent clustering at unexpected steps
- Add database constraint to ensure `step_id` is always set
- Create monitoring query to alert if clusters created at invalid steps
