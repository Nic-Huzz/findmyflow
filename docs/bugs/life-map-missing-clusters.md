# Bug: Life Map nikigai screen shows 0 skills for huzz@nichuzz.com

*Created: July 18 2026. Priority: HIGH — blocks Sprint 2 (cluster resonance rating).*

## What's happening

At `/life-map`, the nikigai screen ("Skills, Problems, Personas") shows:
- Skills: 0 clusters
- Problems: 1 cluster ("Transforming Fear into Freedom & Aliveness")
- Personas: likely 1 cluster

Screenshot confirmed on localhost:5180 for huzz@nichuzz.com.

## What the DB actually has

User ID: `ebe69854-2ebd-4236-a437-3a362f5e1af4`

From Supabase queries, `nikigai_clusters` contains (step_id IS NULL, cluster_stage = 'final'):
- 8 skills clusters (Movement & Presence Leader, Experience Architect & Joy Catalyst, Transformation Guide, etc.)
- 6 problems clusters (Shame & Judgment, Lost in Someone Else's Vision, Transforming Fear, etc.)
- 8 personas clusters (Seekers in Limbo, Wounded Corporate Soul, Healers & Creators, etc.)

The data EXISTS. The screen isn't showing it.

## Likely cause

`LifeMapFlow.jsx` line 592 filters clusters by session_id:

```javascript
const { data: clusters } = await supabase
  .from('nikigai_clusters')
  .select('*')
  .eq('user_id', user.id)
  .eq('cluster_stage', 'final')
  .eq('session_id', savedSession.id)  // ← THIS FILTER
  .in('cluster_type', ['skills', 'problems', 'persona'])
```

The user completed Life Map TWICE (2 flow_sessions rows). The most recent session likely produced only partial clusters (1 problem, 1 persona, 0 skills), while the full cluster set belongs to the earlier session.

## How to investigate

```sql
-- 1. Check flow_sessions for life_map
SELECT id, status, completed_at, created_at
FROM flow_sessions
WHERE user_id = 'ebe69854-2ebd-4236-a437-3a362f5e1af4'
  AND flow_type = 'life_map'
ORDER BY created_at DESC;

-- 2. Check which session_ids the clusters belong to
SELECT session_id, cluster_type, COUNT(*) as cluster_count
FROM nikigai_clusters
WHERE user_id = 'ebe69854-2ebd-4236-a437-3a362f5e1af4'
  AND cluster_stage = 'final'
  AND step_id IS NULL
GROUP BY session_id, cluster_type
ORDER BY session_id;

-- 3. Compare: does the latest flow_session.id match the session with full clusters?
```

## Fix options

1. **If latest session has partial clusters**: delete the partial flow_session + its clusters. The earlier complete session becomes the latest, and the screen will load full clusters.

2. **If session_id mismatch**: update the full clusters to point to the latest session_id.

3. **If the screen is loading wrong session**: fix the query in `LifeMapFlow.jsx` `handleReturnView()` (line 575) — it loads `savedSession` which may be the wrong one.

4. **Longer-term**: the nikigai screen should handle multiple runs gracefully — either show the BEST run (most clusters) or merge results across runs.

## Key files

- `src/flows/LifeMapFlow.jsx` — line 587-606 (handleReturnView cluster loading), line 1030+ (nikigai screen render)
- `nikigai_clusters` table — session_id, cluster_type, cluster_stage, step_id columns

## Why this blocks Sprint 2

Sprint 2 adds a `rate_mirror` screen AFTER the nikigai screen where users rate each cluster 1-5. If the nikigai screen shows 0 skills clusters, the rating screen has nothing to rate. Fix this first.
