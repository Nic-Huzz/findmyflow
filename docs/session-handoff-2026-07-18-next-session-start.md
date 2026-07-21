# Next Session Start Guide (July 18, 2026)

*Branch: `feature/interior-scoreboard-sprint2` — 38 commits ahead of main.*

Start the next session by reading this doc. Two quick wins (1 hour total), then Sprint 15.

---

## Quick Win 1: Wire Zarlo Brief with Scoreboard Data (30 min)

### The problem
The Zarlo system prompt has Interior Scoreboard rules (Sprint 9) but the brief data doesn't include clarityPct, actionScore, topIdentity, or zoneOfExcellenceQuests. Zarlo will never reference your scores until the brief feeds them.

### The fix

**File**: `supabase/functions/generate-zarlo-brief/index.ts`

**Step 1**: Add 2 new queries to the existing Promise.all (line 234-312). After query 10 (groan_streaks), add:

```typescript
// 11. nikigai_clusters — for Clarity score
supabase
  .from('nikigai_clusters')
  .select('resonance_state, resonance_rating')
  .eq('user_id', userId)
  .in('cluster_type', ['skills', 'problems', 'persona'])
  .is('step_id', null)
  .eq('cluster_stage', 'final')
  .eq('is_removed', false),

// 12. quest_tasks — for Action Score (task signals in last 7 days)
supabase
  .from('quest_tasks')
  .select('task_signal, completed_at')
  .eq('user_id', userId)
  .not('task_signal', 'is', null)
  .gte('completed_at', new Date(Date.now() - 7 * 86400000).toISOString()),
```

Update the destructuring (line 234-312) to include `clustersRes, taskSignalsRes`.

**Step 2**: After the existing pattern computation (around line 326), add scoreboard calculations:

```typescript
// ─── Interior Scoreboard ───

// Clarity: % of clusters rated vibe_rise or fun
const allClusters = clustersRes.data || []
let clarityPct: number | null = null
if (allClusters.length > 0) {
  const aligned = allClusters.filter((c: any) => {
    const state = c.resonance_state || (c.resonance_rating >= 4 ? 'vibe_rise' : c.resonance_rating >= 3 ? 'fun' : null)
    return state === 'vibe_rise' || state === 'fun'
  })
  clarityPct = Math.round((aligned.length / allClusters.length) * 100)
}

// Action Score: aligned / total over last 7 days
const sevenDaysAgo = Date.now() - 7 * 86400000
let actionAligned = 0, actionTotal = 0

// Courage outcomes (from completions already fetched in query 4)
completions.filter((c: any) => {
  const d = new Date(c.created_at || c.completed_at)
  return d.getTime() >= sevenDaysAgo && c.quest_category === 'Groans'
}).forEach((row: any) => {
  try {
    const parsed = JSON.parse(row.reflection_text)
    if (parsed.wahoo_classification) {
      actionTotal++
      if (['vibe', 'wahoo', 'peace'].includes(parsed.wahoo_classification)) actionAligned++
    }
  } catch {}
})

// Task signals (from query 12)
;(taskSignalsRes.data || []).forEach((t: any) => {
  actionTotal++
  if (t.task_signal === 'lit_me_up') actionAligned++
})

// Daily checkins (from checkins already fetched in query 1)
checkins.filter((c: any) => {
  const d = new Date(c.created_at)
  return d.getTime() >= sevenDaysAgo && c.checkin_type === 'daily'
}).forEach((c: any) => {
  actionTotal++
  if (['vibe_rise', 'ventral'].includes(c.before_state)) actionAligned++
})

const actionScore = actionTotal >= 5 ? Math.round((actionAligned / actionTotal) * 100) : null

// Top identity statement
const identityCounts: Record<string, number> = {}
completions.filter((c: any) => c.quest_category === 'Groans').forEach((row: any) => {
  try {
    const parsed = JSON.parse(row.reflection_text)
    if (parsed.identity_statement) {
      const s = parsed.identity_statement.trim().toLowerCase()
      if (s) identityCounts[s] = (identityCounts[s] || 0) + 1
    }
  } catch {}
})
const topIdentityEntries = Object.entries(identityCounts).sort((a, b) => b[1] - a[1])
const topIdentity = topIdentityEntries.length > 0
  ? { text: topIdentityEntries[0][0], count: topIdentityEntries[0][1] }
  : null

// Zone of excellence: quests with 3+ consecutive pressure outcomes
const zoneOfExcellenceQuests: string[] = []
for (const quest of quests) {
  const questCompletions = completions
    .filter((c: any) => {
      try { return JSON.parse(c.reflection_text).source_label === quest.label } catch { return false }
    })
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)
  if (questCompletions.length >= 3 && questCompletions.every((c: any) => {
    try { return JSON.parse(c.reflection_text).wahoo_classification === 'anxious' } catch { return false }
  })) {
    zoneOfExcellenceQuests.push(quest.label)
  }
}
```

**Step 3**: Add to the return object (line 406-431), inside the existing structure:

```typescript
return {
  generated_at: new Date().toISOString(),
  current_state: {
    hero_stage: heroStage,
    streak_days: currentStreak,
    capacity_score: capacityScore,
    essence_archetype: stageData?.essence_archetype || null,
    essence_name: stageData?.hero_name || null,
    last_checkin_state: lastCheckinState,
  },
  // ADD THIS SECTION:
  scoreboard: {
    clarityPct,
    actionScore,
    topIdentity,
    zoneOfExcellenceQuests: zoneOfExcellenceQuests.length > 0 ? zoneOfExcellenceQuests : null,
  },
  patterns: { ... },
  // ... rest unchanged
}
```

**Step 4**: Update the Zarlo prompt reader in `src/lib/zarlo/zarloEngine.js` (line ~920) to read from `brief.scoreboard` instead of `brief` directly:

```javascript
// Change from:
const brief = userContext?.zarloBrief
if (brief?.clarityPct != null) {
// Change to:
const scoreboard = userContext?.zarloBrief?.scoreboard
if (scoreboard?.clarityPct != null) {
  scoreboardSection += `\nCLARITY SCORE: ${scoreboard.clarityPct}%`
  if (scoreboard.clarityPct < 60) scoreboardSection += ` (LOW)`
}
if (scoreboard?.topIdentity) {
  scoreboardSection += `\nTOP IDENTITY: "I am someone who ${scoreboard.topIdentity.text}" (reinforced ${scoreboard.topIdentity.count} times)`
}
// ... etc
```

**Step 5**: Deploy the updated edge function:
```bash
npx supabase functions deploy generate-zarlo-brief --project-ref qlwfcfypnoptsocdpxuv
```

### Verify
- Trigger the brief generation manually (call the edge function via curl or Supabase dashboard)
- Check `zarlo_briefs` table for the `scoreboard` field
- Open Zarlo chat, ask "how am I doing?" — should reference Clarity/Action scores

---

## Quick Win 2: Filter Life Path Recommendations (30 min)

See `docs/features/sprint-15-cluster-quest-linking.md` Part A for full implementation. Summary:

1. `src/pages/LifePathWidgetTest.jsx` lines 172-191: add `resonance_state` to cluster select, filter to Vibe Rise/Fun before sending to AI, fallback to all if none rated
2. `supabase/functions/suggest-life-paths/index.ts`: add filter note to prompt
3. Deploy: `npx supabase functions deploy suggest-life-paths --project-ref qlwfcfypnoptsocdpxuv`

---

## Then: Sprint 15 Part B (Cluster → Quest Linking)

Full plan at `docs/features/sprint-15-cluster-quest-linking.md`. ~3 hours. Build order:
1. Migration: `quest_ids uuid[]` on nikigai_clusters
2. New utility: `src/lib/clusterQuestLinker.js`
3. Mirror page: fetch quests + auto-link on first rate + quest pills UI + link overlay
4. Reverse link: wire into 4 quest creation paths
5. Stale cleanup on page load

---

## Key files for next session

| File | What to do |
|------|-----------|
| `supabase/functions/generate-zarlo-brief/index.ts` | Add 2 queries + scoreboard computation (Quick Win 1) |
| `src/lib/zarlo/zarloEngine.js` lines 920-940 | Update to read from `brief.scoreboard` (Quick Win 1) |
| `src/pages/LifePathWidgetTest.jsx` lines 172-191 | Filter clusters by NS state (Quick Win 2) |
| `supabase/functions/suggest-life-paths/index.ts` | Add filter note to prompt (Quick Win 2) |
| `docs/features/sprint-15-cluster-quest-linking.md` | Full Sprint 15 implementation plan |
| `docs/features/interior-scoreboard-next-sprint-spec.md` | Master spec (Sprints 7-15, build order) |
| `docs/session-handoff-2026-07-18-interior-scoreboard-sprint2.md` | Session handoff (decisions, what shipped) |
