# Sprint 15: Cluster → Quest Linking + Filtered Life Path Recommendations

*Created: July 18, 2026. Updated: July 18 (v2, all self-review issues fixed). Status: Specced, ready to build.*

## Overview (explain it like I'm 12)

Right now the app knows what you're good at (clusters) and what you're pursuing (quests) but they're not connected. A cluster called "Experience Architect" should point to your "Travel Experience Host" quest, but it doesn't. This sprint connects them so the app can say "this skill feeds THIS path" and only recommend life paths from skills that actually excite you.

---

## Pre-requisite: Cluster taxonomy tagging must work

The auto-linking depends on clusters having `skill_tags`. Currently only 8 of Huzz's skill clusters were manually backfilled. New users' clusters have empty `skill_tags`. **Before building Part B, ensure the `classify-cluster-tags` flow works:**

1. After Life Map clusters are saved to DB (LifeMapFlow.jsx line ~530), call `classify-quest-skills` (or a similar classifier) for each cluster to populate `skill_tags`
2. This is the same pattern as quest auto-tagging but for clusters
3. Without this, auto-linking silently does nothing for new users

**Implementation**: Add a non-blocking call after cluster insert in LifeMapFlow.jsx:
```javascript
// After clusters are inserted to DB (line ~530)
if (inserted?.length) {
  for (const row of inserted) {
    import('../lib/questSkillTagger').then(m =>
      supabase.functions.invoke('classify-quest-skills', {
        body: { label: row.cluster_label }
      }).then(({ data }) => {
        if (data?.skill_tags?.length) {
          supabase.from('nikigai_clusters')
            .update({ skill_tags: data.skill_tags })
            .eq('id', row.id).then(() => {})
        }
      })
    )
  }
}
```

For problem and persona clusters, `skill_tags` won't always map cleanly. The linking for non-skill clusters uses a different approach: **label similarity matching via the edge function** rather than skill_tags overlap. The `classify-quest-skills` prompt can handle any label (not just quest names).

---

## Part A: Filter life path recommendations by NS state

### The problem
`/life-paths` asks the AI to suggest careers based on ALL Life Map clusters. But some clusters are tagged Stressed or Bored (or removed). The AI shouldn't recommend careers from skills the user doesn't enjoy.

### The fix

**Step 1: Update the client-side queries** (`src/pages/LifePathWidgetTest.jsx` lines 172-176)

```javascript
// Add resonance_state + is_removed filter
supabase.from('nikigai_clusters')
  .select('cluster_label, resonance_state')
  .eq('user_id', user.id).eq('cluster_type', 'skills')
  .eq('cluster_stage', 'final').eq('is_removed', false),
supabase.from('nikigai_clusters')
  .select('cluster_label, resonance_state')
  .eq('user_id', user.id).eq('cluster_type', 'problems')
  .eq('cluster_stage', 'final').eq('is_removed', false),
```

**Step 2: Filter before sending to the AI** (lines 188-191)

```javascript
// Only send clusters the user is excited about
// Fallback: if none rated or ALL are stressed/bored, use all (no empty input)
const filterByState = (data) => {
  const rated = (data || []).filter(c => ['vibe_rise', 'fun'].includes(c.resonance_state))
  return rated.length > 0 ? rated : data || []
}

const { data, error } = await supabase.functions.invoke('suggest-life-paths', {
  body: {
    curiosityClusters: clusters || [],
    skills: filterByState(skillsData).map(s => s.cluster_label),
    problems: filterByState(problemsData).map(p => p.cluster_label),
    isFiltered: filterByState(skillsData).length < (skillsData || []).length,
  },
})
```

**Step 3: Update the edge function prompt** (`supabase/functions/suggest-life-paths/index.ts`)

NOT optional. The AI needs to know why the data might be smaller:

Add after the `problemsSection` (line ~33):
```javascript
const filterNote = body.isFiltered
  ? `\nIMPORTANT: These skills and problems have been filtered to only include ones this person is genuinely excited about. Stressed or boring clusters were excluded. Lean into what lights them up.\n`
  : ''
```

Insert `${filterNote}` before `GUIDELINES:` in the prompt.

**Step 4: Curiosity clusters (separate table, no NS state)**

Curiosity clusters come from `curiosity_clusters` table which has no `resonance_state`. Two options:
- **Option A (recommended)**: Don't filter curiosity clusters. They represent what the user is drawn to (books, podcasts), which is inherently interest-driven. No need to filter.
- **Option B**: Cross-reference curiosity cluster branches with rated cluster branches. If a curiosity cluster's branch matches a Stressed/Bored skill cluster's branch, deprioritize it. Over-engineered for now.

Go with Option A. Curiosity clusters are already interest-filtered by nature.

### Files to change
| File | Change |
|------|--------|
| `src/pages/LifePathWidgetTest.jsx` | Lines 172-191: add resonance_state to select, filter before AI call, pass isFiltered flag |
| `supabase/functions/suggest-life-paths/index.ts` | Add filter note to prompt when isFiltered is true |

### DB changes
None.

### Edge cases
- **No rated clusters**: fallback to all clusters (pre-Mirror users)
- **All clusters Stressed/Bored**: fallback to all clusters
- **Only problems rated but not skills**: each filters independently

---

## Part B: Auto-link clusters to quests on Mirror page

### The problem
Clusters and quests are siblings (both from Life Map data) but never explicitly connected. Users can't see which skills feed which paths.

### DB change
```sql
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS quest_ids uuid[];
```

### Matching strategy

**For skill clusters**: Use `skill_tags` overlap (cluster.skill_tags ∩ quest.skill_tags). This is reliable because both are tagged from the same taxonomy.

**For problem/persona clusters**: Use `classify-quest-skills` edge function to get skill_tags for the cluster label, then match against quest skill_tags. Same approach as quest tagging, just applied to cluster labels. This handles "Making Transformation Joyful & Accessible" → tags as `coaching, teaching` → matches quests with those tags.

### Implementation

**Step 1: Fetch quests on Mirror page load**

Add to existing Promise.all in MirrorPage.jsx:
```javascript
supabase.from('quests')
  .select('id, label, skill_tags, status')
  .eq('user_id', userId)
  .eq('status', 'active'),
```

State: `const [userQuests, setUserQuests] = useState([])`
State: `const [clusterQuests, setClusterQuests] = useState({})` // { clusterId: [questId, ...] }

Pre-populate from loaded clusters:
```javascript
const questMap = {}
allClusters.forEach(c => { if (c.quest_ids?.length) questMap[c.id] = c.quest_ids })
setClusterQuests(questMap)
```

**Step 2: Auto-link function (shared, used by Mirror + quest creation)**

New utility: `src/lib/clusterQuestLinker.js`
```javascript
import { supabase } from './supabaseClient'

/**
 * Find quests that match a cluster's skill_tags.
 * Returns array of quest IDs.
 */
export function findMatchingQuests(cluster, quests) {
  if (!cluster.skill_tags?.length || !quests?.length) return []
  return quests
    .filter(q => q.skill_tags?.some(tag => cluster.skill_tags.includes(tag)))
    .map(q => q.id)
}

/**
 * Auto-link a cluster to matching quests and save.
 * Called from Mirror page (on rate) and quest creation (reverse direction).
 */
export async function autoLinkClusterQuests(clusterId, matchingQuestIds) {
  if (!matchingQuestIds.length) return
  await supabase.from('nikigai_clusters')
    .update({ quest_ids: matchingQuestIds })
    .eq('id', clusterId)
}

/**
 * Reverse link: when a new quest is created, find and update all matching clusters.
 * Called from quest creation paths.
 */
export async function linkNewQuestToClusters(userId, questId, questSkillTags) {
  if (!questSkillTags?.length) return
  const { data: clusters } = await supabase
    .from('nikigai_clusters')
    .select('id, skill_tags, quest_ids')
    .eq('user_id', userId)
    .eq('cluster_stage', 'final')
    .eq('is_removed', false)
    .not('skill_tags', 'is', null)

  if (!clusters) return
  for (const c of clusters) {
    if (c.skill_tags?.some(tag => questSkillTags.includes(tag))) {
      const existing = c.quest_ids || []
      if (!existing.includes(questId)) {
        await supabase.from('nikigai_clusters')
          .update({ quest_ids: [...existing, questId] })
          .eq('id', c.id)
      }
    }
  }
}
```

**Step 3: Call auto-link on Mirror rating (debounced, not on every tap)**

Don't link on every pill tap. Instead, link once when the cluster gets its first rating:

```javascript
const handleRate = (clusterId, state) => {
  hapticLight()
  if (state === 'bored') { handleRemove(clusterId); return }

  const hadPreviousRating = !!ratings[clusterId]
  setRatings(prev => ({ ...prev, [clusterId]: state }))

  // Auto-save state
  supabase.from('nikigai_clusters').update({
    resonance_state: state,
    resonance_rating: state === 'vibe_rise' ? 4 : state === 'fun' ? 3 : state === 'stressed' ? 2 : 1,
    resonance_updated_at: new Date().toISOString(),
  }).eq('id', clusterId).then(() => {})

  // Auto-link quests on FIRST rating only (not every re-rate)
  if (!hadPreviousRating && userQuests.length > 0) {
    const cluster = clusters.find(c => c.id === clusterId)
    if (cluster?.skill_tags?.length) {
      import('../lib/clusterQuestLinker').then(m => {
        const matchingIds = m.findMatchingQuests(cluster, userQuests)
        if (matchingIds.length) {
          m.autoLinkClusterQuests(clusterId, matchingIds)
          setClusterQuests(prev => ({ ...prev, [clusterId]: matchingIds }))
        }
      })
    }
  }
}
```

**Step 4: Reverse link on quest creation**

In all 4 quest creation paths, after `tagQuestSkills` returns, also link to clusters:

```javascript
// After tagQuestSkills returns skill_tags (e.g., in LevelTab.jsx)
import('../../lib/questSkillTagger').then(async (m) => {
  const tags = await m.tagQuestSkills(newQuest.id, newQuest.label)
  if (tags?.length) {
    setSkillLevelPicker({ questId: newQuest.id, skills: tags })
    // Reverse link: update matching clusters
    import('../../lib/clusterQuestLinker').then(linker =>
      linker.linkNewQuestToClusters(userId, newQuest.id, tags)
    )
  }
})
```

**Step 5: Display quest pills on cluster cards**

Below the NS state pills:
```jsx
{(clusterQuests[cluster.id] || []).length > 0 && (
  <div className="mp-quest-pills">
    {(clusterQuests[cluster.id] || []).map(qId => {
      const quest = userQuests.find(q => q.id === qId)
      if (!quest) return null // stale reference, skip
      return (
        <span key={qId} className="mp-quest-pill">
          {quest.label}
          <button className="mp-quest-pill-x"
            onClick={(e) => { e.stopPropagation(); handleUnlinkQuest(cluster.id, qId) }}>x</button>
        </span>
      )
    })}
    <button className="mp-quest-pill-add"
      onClick={() => setLinkingClusterId(cluster.id)}>+</button>
  </div>
)}
```

**Step 6: Manual override**

Remove:
```javascript
const handleUnlinkQuest = (clusterId, questId) => {
  const updated = (clusterQuests[clusterId] || []).filter(id => id !== questId)
  setClusterQuests(prev => ({ ...prev, [clusterId]: updated }))
  supabase.from('nikigai_clusters').update({ quest_ids: updated }).eq('id', clusterId).then(() => {})
}
```

Add (bottom sheet picker, not inline dropdown — better on mobile):
```javascript
const [linkingClusterId, setLinkingClusterId] = useState(null)

const handleLinkQuest = (clusterId, questId) => {
  const existing = clusterQuests[clusterId] || []
  const updated = [...existing, questId]
  setClusterQuests(prev => ({ ...prev, [clusterId]: updated }))
  supabase.from('nikigai_clusters').update({ quest_ids: updated }).eq('id', clusterId).then(() => {})
  setLinkingClusterId(null)
}

// Render as overlay, not inline
{linkingClusterId && (
  <div className="mp-link-overlay" onClick={() => setLinkingClusterId(null)}>
    <div className="mp-link-sheet" onClick={e => e.stopPropagation()}>
      <div className="mp-link-title">Link to a life path</div>
      {userQuests
        .filter(q => !(clusterQuests[linkingClusterId] || []).includes(q.id))
        .map(q => (
          <button key={q.id} className="mp-link-option"
            onClick={() => handleLinkQuest(linkingClusterId, q.id)}>
            {q.label}
          </button>
        ))}
      {userQuests.filter(q => !(clusterQuests[linkingClusterId] || []).includes(q.id)).length === 0 && (
        <p className="mp-link-empty">All quests already linked</p>
      )}
    </div>
  </div>
)}
```

**Step 7: Handle stale quest_ids**

When rendering quest pills, skip IDs that don't match any active quest (the `if (!quest) return null` in Step 5). Optionally, clean up on page load:

```javascript
// After loading clusters + quests, clean stale quest_ids
const activeQuestIds = new Set(userQuests.map(q => q.id))
allClusters.forEach(c => {
  if (c.quest_ids?.length) {
    const cleaned = c.quest_ids.filter(id => activeQuestIds.has(id))
    if (cleaned.length !== c.quest_ids.length) {
      supabase.from('nikigai_clusters').update({ quest_ids: cleaned }).eq('id', c.id).then(() => {})
    }
  }
})
```

### CSS additions (MirrorPage.css)
```css
/* Quest pills */
.mp-quest-pills { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
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
  background: none; font-size: 11px; color: #adb5bd; cursor: pointer; font-family: inherit;
}

/* Link picker overlay */
.mp-link-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.3);
  display: flex; align-items: flex-end; justify-content: center; z-index: 100;
}
.mp-link-sheet {
  background: #fff; border-radius: 20px 20px 0 0; padding: 20px 16px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
  max-width: 480px; width: 100%;
}
.mp-link-title { font-size: 15px; font-weight: 700; color: #1a1a2e; margin-bottom: 12px; }
.mp-link-option {
  display: block; width: 100%; text-align: left; padding: 12px;
  border: 1px solid #f2f3f5; border-radius: 10px; margin-bottom: 6px;
  background: #fff; font-size: 14px; cursor: pointer; font-family: inherit;
}
.mp-link-option:hover { background: rgba(94,23,235,0.03); border-color: #5e17eb; }
.mp-link-empty { font-size: 13px; color: #6b7280; text-align: center; padding: 16px; }
```

### Files to change
| File | Change |
|------|--------|
| `src/pages/LifePathWidgetTest.jsx` | Lines 172-191: add resonance_state to select, filter, pass isFiltered |
| `supabase/functions/suggest-life-paths/index.ts` | Add filter note to prompt |
| `src/lib/clusterQuestLinker.js` | NEW shared utility (findMatchingQuests, autoLinkClusterQuests, linkNewQuestToClusters) |
| `src/pages/MirrorPage.jsx` | Add userQuests + clusterQuests state, quest pills UI, link overlay, handleUnlinkQuest, handleLinkQuest, stale cleanup |
| `src/pages/MirrorPage.css` | Quest pill + link overlay styles |
| `src/components/level/LevelTab.jsx` | After tagQuestSkills, call linkNewQuestToClusters |
| `src/components/QuestSelector.jsx` | Same reverse link call |
| `src/components/WahooDiscoveryFlow.jsx` | Same reverse link call |
| `src/pages/LifePathWidgetTest.jsx` | Same reverse link call (quest creation section) |
| `src/flows/LifeMapFlow.jsx` | After cluster insert (~line 530), call classify-quest-skills for each cluster to populate skill_tags |

### DB changes
```sql
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS quest_ids uuid[];
```

---

## Build order

```
0. Pre-req: cluster taxonomy tagging in LifeMapFlow (30 min)
   — ensures new users' clusters get skill_tags
1. Part A: filter life paths (30 min)
   — client filter + edge function prompt update
2. Migration: quest_ids column (1 min)
3. Part B utility: clusterQuestLinker.js (30 min)
4. Part B Mirror: quest fetch + auto-link on first rate (45 min)
5. Part B Mirror: quest pills UI + link overlay (45 min)
6. Part B reverse: wire linkNewQuestToClusters into 4 quest creation paths (30 min)
7. Part B cleanup: stale quest_ids on page load (15 min)
8. Test end-to-end (30 min)
```

Total: ~4 hours.

---

## Verification checklist
- [ ] `/life-paths`: AI only recommends from Vibe Rise/Fun clusters
- [ ] `/life-paths`: fallback works when no clusters rated (uses all)
- [ ] `/life-paths`: fallback works when ALL clusters are Stressed/Bored (uses all)
- [ ] `/mirror`: rating a cluster for the first time auto-shows matching quest pills
- [ ] `/mirror`: re-rating doesn't duplicate quest links
- [ ] `/mirror`: tapping x on a quest pill removes the link
- [ ] `/mirror`: tapping + opens bottom sheet with remaining quests
- [ ] `/mirror`: quest links persist across page refresh
- [ ] `/mirror`: clusters with no skill_tags show no quest pills (no crash)
- [ ] `/mirror`: stale quest_ids (deleted quests) are cleaned up on load
- [ ] Quest creation: new quest auto-links to matching clusters (reverse direction)
- [ ] New Life Map run: clusters get skill_tags auto-tagged after generation
- [ ] Problem/persona clusters: get skill_tags via classify-quest-skills (label-based)

---

## What this enables (future, not this sprint)

1. **Quest cards "powered by"**: show which clusters feed a quest
2. **Per-quest zone**: each quest shows its own zone based on linked cluster states
3. **Opportunity suggestions**: "Your 🔥 clusters don't have a quest yet. Consider..."
4. **Convergence detection**: quests linked to the SAME cluster = convergence (replaces Sprint 12)
