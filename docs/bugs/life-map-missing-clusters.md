# Bug: Life Map nikigai screen shows 0 skills for huzz@nichuzz.com

*Created: July 18 2026. Updated: July 18 (investigation complete). Priority: HIGH — blocks Sprint 7 (NS state swap on rate_mirror).*

## What's happening

At `/life-map`, the nikigai screen ("Skills, Problems, Personas") may show 0 clusters despite having 22 clusters in the database across 2 sessions.

## Investigation results (July 18)

User ID: `ebe69854-2ebd-4236-a437-3a362f5e1af4`

### Two completed Life Map sessions
| Session | Date | Skills | Problems | Personas | Stage |
|---------|------|--------|----------|----------|-------|
| `7f137fb4` (most recent) | Jun 15 | 4 | 3 | 5 | **final** |
| `d1209615` (older) | Apr 19 | 4 | 3 | 3 | **final** |

**Problem**: BOTH sessions have `cluster_stage = 'final'`. The archiving code (LifeMapFlow.jsx:511-517) should have set the older session's clusters to `'archived'` when the Jun 15 run completed. It didn't.

### Session data is complete
The most recent session (7f137fb4) has `response_data` with narrative, chamber, and responses. No data corruption.

### Return flow code path
`handleReturnView()` (line 589) queries clusters WHERE `session_id = savedSession.id`. `savedSession` is set to the most recent completed session (7f137fb4). That session has 12 clusters, all `final`. So the return flow SHOULD show them.

### Possible causes (updated)

**1. Session created but not used for clusters (HIGH)**
If the user started a fresh run (handleReturnFresh or handleReturnAdd), a new session was created via `createSession()`. If processing completed but the new session's ID was used for the insert (not the old one), and `checkPreviousCompletion` picks up the new session as `savedSession`, but the clusters were saved under a different session ID, the query returns empty.

**2. Archiving ran but was undone (MEDIUM)**
Both sessions having `final` clusters suggests archiving either (a) never ran, or (b) ran but was reverted. Could happen if the processing function hit an error AFTER archiving but BEFORE inserting, and the user retried — the retry archives nothing (already archived), inserts clusters under a new session, but the old archived ones stay archived. Then on a third attempt or manual fix, the old ones got un-archived.

**3. The bug only manifests on fresh runs (MEDIUM)**
On fresh runs, nikigai reads from STATE (set during processing). If the AI returned empty skills, state would be empty. But DB shows 4 skills for the most recent session, so either the AI returned them correctly and the state was set, or someone manually inserted them.

## Fix

### Immediate: archive old session clusters
```sql
UPDATE nikigai_clusters
SET cluster_stage = 'archived'
WHERE session_id = 'd1209615-185a-4e7a-a710-f36d6f781ee2'
AND cluster_stage = 'final';
```

### Code: resilient fallback in handleReturnView
If the session-scoped query returns 0 clusters, fall back to loading ALL final clusters (most recent first):

```javascript
// In handleReturnView(), after the session-scoped query:
if (!clusters?.length) {
  // Fallback: load all final Life Map clusters regardless of session
  const { data: fallback } = await supabase
    .from('nikigai_clusters')
    .select('*')
    .eq('user_id', user.id)
    .eq('cluster_stage', 'final')
    .in('cluster_type', ['skills', 'problems', 'persona'])
    .is('step_id', null)
    .order('created_at', { ascending: false })
  clusters = fallback
}
```

This ensures clusters always show even if session IDs get mismatched.

### Code: deduplicate on load
When multiple sessions have `final` clusters, only use the most recent:
```javascript
if (clusters?.length) {
  const sessions = [...new Set(clusters.map(c => c.session_id))]
  if (sessions.length > 1) {
    // Keep only most recent session's clusters
    const mostRecent = clusters.sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    )[0].session_id
    clusters = clusters.filter(c => c.session_id === mostRecent)
  }
}
```

## Key files

- `src/flows/LifeMapFlow.jsx` — line 589-610 (handleReturnView), line 511-517 (archiving), line 1043+ (nikigai render)
- `nikigai_clusters` table — session_id, cluster_type, cluster_stage, step_id

## Reproduction
1. Log in as huzz@nichuzz.com
2. Navigate to /life-map
3. Tap "View my results"
4. Navigate to nikigai screen
5. Check console for errors, check network tab for nikigai_clusters response
