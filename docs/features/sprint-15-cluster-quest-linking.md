# Sprint 15: Cluster → Quest Linking + Filtered Life Path Recommendations

*Created: July 18, 2026. Status: Specced, ready to build.*

## Overview (explain it like I'm 12)

Right now the app knows what you're good at (clusters) and what you're pursuing (quests) but they're not connected. A cluster called "Experience Architect" should point to your "Travel Experience Host" quest, but it doesn't. This sprint connects them so the app can say "this skill feeds THIS path" and only recommend life paths from skills that actually excite you.

---

## Part A: Filter life path recommendations by NS state

### The problem
`/life-paths` asks the AI to suggest careers based on ALL Life Map clusters. But some clusters are tagged Stressed or Bored (or removed). The AI shouldn't recommend careers from skills the user doesn't enjoy.

### The fix

**Step 1: Update the client-side query** (`src/pages/LifePathWidgetTest.jsx` lines 172-176)

Current:
```javascript
supabase.from('nikigai_clusters').select('cluster_label')
  .eq('user_id', user.id).eq('cluster_type', 'skills').eq('cluster_stage', 'final'),
supabase.from('nikigai_clusters').select('cluster_label')
  .eq('user_id', user.id).eq('cluster_type', 'problems').eq('cluster_stage', 'final'),
```

New:
```javascript
supabase.from('nikigai_clusters').select('cluster_label, resonance_state')
  .eq('user_id', user.id).eq('cluster_type', 'skills').eq('cluster_stage', 'final').eq('is_removed', false),
supabase.from('nikigai_clusters').select('cluster_label, resonance_state')
  .eq('user_id', user.id).eq('cluster_type', 'problems').eq('cluster_stage', 'final').eq('is_removed', false),
```

**Step 2: Filter before sending to the AI** (lines 188-191)

```javascript
// Only send clusters the user is excited about (Vibe Rise / Fun)
// Fallback: if none are rated, use all (backwards compat for pre-Mirror users)
const filterByState = (data) => {
  const rated = (data || []).filter(c => ['vibe_rise', 'fun'].includes(c.resonance_state))
  return rated.length > 0 ? rated : data || []
}

const { data, error } = await supabase.functions.invoke('suggest-life-paths', {
  body: {
    curiosityClusters: clusters || [],
    skills: filterByState(skillsData).map(s => s.cluster_label),
    problems: filterByState(problemsData).map(p => p.cluster_label),
  },
})
```

**Step 3: Optionally tell the AI about the NS states** (edge function prompt enhancement)

Add to the prompt in `supabase/functions/suggest-life-paths/index.ts`:
```
NOTE: These skills and problems have been filtered to only include ones the person
is excited about (rated "Vibe Rise" or "Fun"). Stressed or boring clusters have been
excluded. Your suggestions should lean into what lights them up.
```

### Files to change
| File | Change |
|------|--------|
| `src/pages/LifePathWidgetTest.jsx` | Lines 172-191: add resonance_state to select, filter before sending to AI |
| `supabase/functions/suggest-life-paths/index.ts` | Add note to prompt about filtered data (optional, improves quality) |

### DB changes
None.

### Edge cases
- **No rated clusters**: fallback to all clusters (pre-Mirror users)
- **All clusters Stressed/Bored**: fallback to all clusters (user hasn't found their thing yet, still needs recommendations)
- **Only problems rated but not skills**: skills section uses all, problems section uses filtered. Each filters independently.

---

## Part B: Auto-link clusters to quests on Mirror page

### The problem
Clusters and quests both have `skill_tags` but the user never sees the connection. After rating a cluster, the user should see which quests it feeds.

### DB change
```sql
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS quest_ids uuid[];
```

### Implementation

**Step 1: Fetch quests on Mirror page load** (add to existing Promise.all)

```javascript
// In MirrorPage.jsx useEffect, add to Promise.all:
supabase.from('quests')
  .select('id, label, skill_tags, status')
  .eq('user_id', userId)
  .eq('status', 'active'),
```

Store in state: `const [userQuests, setUserQuests] = useState([])`

**Step 2: Compute matches when rating a cluster**

In `handleRate`, after saving the state, compute matching quests:

```javascript
const handleRate = (clusterId, state) => {
  hapticLight()
  if (state === 'bored') { handleRemove(clusterId); return }
  setRatings(prev => ({ ...prev, [clusterId]: state }))

  // Auto-save state
  supabase.from('nikigai_clusters').update({
    resonance_state: state,
    resonance_rating: state === 'vibe_rise' ? 4 : state === 'fun' ? 3 : state === 'stressed' ? 2 : 1,
    resonance_updated_at: new Date().toISOString(),
  }).eq('id', clusterId).then(() => {})

  // Auto-link to matching quests (by skill_tags overlap)
  const cluster = clusters.find(c => c.id === clusterId)
  if (cluster?.skill_tags?.length && userQuests.length > 0) {
    const matchingIds = userQuests
      .filter(q => q.skill_tags?.some(tag => cluster.skill_tags.includes(tag)))
      .map(q => q.id)
    if (matchingIds.length > 0) {
      supabase.from('nikigai_clusters').update({ quest_ids: matchingIds }).eq('id', clusterId).then(() => {})
      setClusterQuests(prev => ({ ...prev, [clusterId]: matchingIds }))
    }
  }
}
```

**Step 3: Display quest pills on cluster cards**

Below the NS state pills, show linked quest names as small pills:

```jsx
{/* Quest links */}
{clusterQuestIds.length > 0 && (
  <div className="mp-quest-pills">
    {clusterQuestIds.map(qId => {
      const quest = userQuests.find(q => q.id === qId)
      if (!quest) return null
      return (
        <span key={qId} className="mp-quest-pill">
          {quest.label}
          <button className="mp-quest-pill-x"
            onClick={(e) => { e.stopPropagation(); handleUnlinkQuest(clusterId, qId) }}>
            x
          </button>
        </span>
      )
    })}
    <button className="mp-quest-pill-add"
      onClick={() => setLinkingClusterId(clusterId)}>+</button>
  </div>
)}
```

**Step 4: Manual override — remove + add quest links**

Remove: filter out the quest_id and save.
```javascript
const handleUnlinkQuest = (clusterId, questId) => {
  setClusterQuests(prev => ({
    ...prev,
    [clusterId]: (prev[clusterId] || []).filter(id => id !== questId)
  }))
  const updated = (clusterQuests[clusterId] || []).filter(id => id !== questId)
  supabase.from('nikigai_clusters').update({ quest_ids: updated }).eq('id', clusterId).then(() => {})
}
```

Add: show a dropdown of user's active quests not already linked.
```javascript
// When linkingClusterId is set, show a small picker
{linkingClusterId === cluster.id && (
  <div className="mp-quest-picker">
    {userQuests
      .filter(q => !(clusterQuests[cluster.id] || []).includes(q.id))
      .map(q => (
        <button key={q.id} className="mp-quest-picker-btn"
          onClick={() => handleLinkQuest(cluster.id, q.id)}>
          {q.label}
        </button>
      ))}
  </div>
)}
```

**Step 5: Pre-populate quest_ids on page load**

When loading clusters, also load their existing `quest_ids`:
```javascript
// Add quest_ids to the cluster select
.select('id, cluster_type, cluster_label, ..., quest_ids')

// Build clusterQuests state from loaded data
const questMap = {}
allClusters.forEach(c => {
  if (c.quest_ids?.length) questMap[c.id] = c.quest_ids
})
setClusterQuests(questMap)
```

### CSS additions (MirrorPage.css)
```css
.mp-quest-pills {
  display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;
}
.mp-quest-pill {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;
  background: rgba(94,23,235,0.06); color: #5e17eb;
}
.mp-quest-pill-x {
  background: none; border: none; color: #adb5bd; font-size: 10px;
  cursor: pointer; padding: 0 2px; font-family: inherit;
}
.mp-quest-pill-add {
  padding: 3px 8px; border-radius: 12px; border: 1px dashed #e9ecef;
  background: none; font-size: 11px; color: #adb5bd; cursor: pointer;
  font-family: inherit;
}
.mp-quest-picker {
  display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;
  padding: 8px; background: #fafafa; border-radius: 10px;
}
.mp-quest-picker-btn {
  padding: 4px 10px; border-radius: 8px; border: 1px solid #e9ecef;
  background: #fff; font-size: 11px; cursor: pointer; font-family: inherit;
}
```

### Files to change
| File | Change |
|------|--------|
| `src/pages/MirrorPage.jsx` | Add userQuests state + fetch, clusterQuests state, handleRate auto-linking, handleUnlinkQuest, handleLinkQuest, quest pills UI, quest picker UI |
| `src/pages/MirrorPage.css` | Quest pill + picker styles |

### DB changes
```sql
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS quest_ids uuid[];
```

---

## Build order

```
1. Part A (filter life paths) — 30 min, independent
2. Migration (quest_ids column) — 1 min
3. Part B step 1-2 (fetch quests + auto-link on rate) — 1 hour
4. Part B step 3-4 (quest pills UI + override) — 1 hour
5. Part B step 5 (pre-populate on load) — 15 min
6. Test end-to-end: rate cluster → see quest pills → override → go to /life-paths → confirm filtered recommendations
```

Total: ~3 hours.

---

## Verification checklist
- [ ] `/life-paths`: AI only recommends from Vibe Rise/Fun clusters
- [ ] `/life-paths`: fallback works when no clusters rated
- [ ] `/mirror`: rating a cluster auto-shows matching quest pills
- [ ] `/mirror`: tapping x on a quest pill removes the link
- [ ] `/mirror`: tapping + shows picker with remaining quests
- [ ] `/mirror`: quest links persist across page refresh
- [ ] `/mirror`: clusters with no skill_tags show no quest pills (no crash)
- [ ] Quest creation: new quest auto-links to matching clusters (via skill_tags)

---

## What this enables (future, not this sprint)

1. **Quest cards "powered by"**: show which clusters feed a quest on the quest card
2. **Per-quest zone**: instead of one global matrix, each quest could show its own zone (is this quest in your Vibe Rise or Stressed zone?)
3. **Opportunity suggestions**: "Your 🔥 clusters don't have a quest yet. Consider exploring..." — prompt based on unlinked Vibe Rise clusters
4. **Convergence detection**: quests linked to the SAME cluster = convergence signal (replaces cross-pollination Sprint 12)
