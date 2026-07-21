# Session Handoff: Interior Scoreboard + Monopoly Engine (July 16-18 2026)

## What was done

### Shipped to main
- `9b63c11` — New onboarding slides (Ikigai hero's journey, 3 slides)
- `d478350` — 3% reflection fix: reverted to reflection_text (column exists, was incorrectly changed to response_data)
- `0c2723d` — Weekly focus intention persists across weeks (removed getWeekStartLocal scope on setup query)
- `9fca732` — Sprint 0 data integrity: quest_id on groan_challenges + FK constraint + code paths updated
- `0ec157a` — Monopoly Score calculation methodology with Huzz worked example
- `aa03018` — Implementation plan (7 sprints with 12yo explanations)
- `76631b0` — Per-completion experience design + data gaps doc
- `f78a1c7` — Sprint restructure (split S3, moved re-gen to S4, added guidance layer)
- CareerModels dataset: 292 → 299 (added Disney, Barnum, Jose Andres, Jesse Itzler, Tim Ferriss, Hormozi, Naval), cleaned 34 under-tagged profiles

### On feature branch `feature/interior-scoreboard-sprint1`
- `344c2b0` — Sprint 1: timeframe tags on quest_tasks + identity statement library dropdown on GroanCompletionModal
- `e46ab46` — Data gaps doc for agent review
- Migration applied: `add_timeframe_to_quest_tasks` (timeframe text DEFAULT 'week')
- Migration applied: `add_quest_id_to_groan_challenges_and_fk` (quest_id column + FK + backfill 116/138 records)

### Spec docs created
- `docs/features/interior-scoreboard-spec.md` — full spec: Capacity × Clarity, per-completion UX, design evolution appendix
- `docs/features/monopoly-engine-spec.md` — Collect → Connect → Your Flow spine, taxonomy, 299 dataset, behavioral scoring, Huzz worked example
- `docs/features/interior-scoreboard-implementation-plan.md` — 7 sprints, Sprint 0 done
- `docs/features/interior-scoreboard-data-gaps.md` — 3 gaps + 3 opportunities for agent review
- Obsidian: `Frameworks/Collect Connect Your Flow.md` — spine framework with hero journey mapping + Capacity × Clarity model

## Decisions made

1. **Two consumer metrics only**: Capacity (existing, Y axis) × Clarity (new, X axis) = Zone Calibration diagonal. Everything else is noise. Evolved through 5 iterations (5 metrics → 3 → 2).

2. **Scale app gets Monopoly + Alignment**: Personal monopoly score (taxonomy rarity vs 299 dataset) and income alignment moved to creator portal. Not relevant for consumer users still finding their path.

3. **Clarity = cluster resonance**: User rates Life Map clusters 1-5 ("This IS me" → "That's not me"). Average of kept clusters = Clarity %. Updates when AI re-generates clusters after 5 courage challenges on shared skill tags.

4. **Skills-only quest tagging**: Quests tagged with skills (10 taxonomy segments). Problems + personas stay at user level (Life Map clusters). The AI can confidently map "Dance Facilitator" → performing but can't guess personas.

5. **One underlying taxonomy for consumer**: skills (10) + problems (12) + personas (12) from wheel taxonomy. Branches (10) are Scale-only for market positioning. classify-curiosities edge function to be extended to output skills[] + problems[] alongside branch.

6. **Skill tree via L0-L4**: Track XP per taxonomy skill from courage challenges. User sets starting level. Display later. L0-L4 only makes sense for skills, not problems or personas.

7. **reflection_text EXISTS on quest_completions**: Column is TEXT type with 32 historical JSON entries. The earlier "fix" that moved writes to response_data was wrong. Reverted. Always verify DB schema with `information_schema.columns` before changing column references.

8. **Belief sliders dropped**: Vibe Rise wahoo classification already captures identity fit. "I'm getting good at this" slider is less relevant than the identity statement. Simplified to: 4-state classification + identity statement dropdown + 3% check.

9. **To-do "lit me up" signal for ALL to-dos**: Not just learning tasks. "Email 3 venues" → Bored is useful signal too. One optional tap.

10. **Huzz's monopoly**: performing + building + voice_taken = 0/299 matches. Tested with real data.

## In progress / next steps

### Sprint 2: Cluster resonance rating + Clarity score
**Status**: Scoped. LifeMapFlow.jsx read and understood. The resonance rating screen should be a new screen `rate_mirror` inserted after the `nikigai` screen (which shows clusters) in the SCREENS array at line 57-60.

**Exact code changes needed:**

### 1. SCREENS array (line 55-61 of LifeMapFlow.jsx)
```diff
  'nikigai', 'chamber_intro', 'chamber_reveal', 'gap_insight',
+ Insert 'rate_mirror' AFTER 'nikigai':
  'nikigai', 'rate_mirror', 'chamber_intro', 'chamber_reveal', 'gap_insight',
```

### 2. State to add (near line 59 of GroanCompletionModal pattern, around line 175 area)
```javascript
const [clusterRatings, setClusterRatings] = useState({}) // { clusterId: 1-5 }
const [removedClusters, setRemovedClusters] = useState(new Set())
```

### 3. Nikigai screen exit paths — BOTH need to route through rate_mirror
Line 1117: `goToScreen('chamber_intro')` → change to `goToScreen('rate_mirror')`
Line 1128: `goToScreen(essenceChamber ? 'chamber_intro' : 'complete')` → change to `goToScreen('rate_mirror')`

### 4. New rate_mirror screen block (insert between nikigai and chamber_intro renders, around line 1134)
```jsx
if (currentScreen === 'rate_mirror') {
  const allClusters = [
    ...skillsClusters.map(c => ({ ...c, type: 'skills' })),
    ...problemsClusters.map(c => ({ ...c, type: 'problems' })),
    ...personasClusters.map(c => ({ ...c, type: 'persona' })),
  ].filter(c => !removedClusters.has(c.id))

  const keptRatings = allClusters
    .map(c => clusterRatings[c.id])
    .filter(r => r != null)
  const clarityPct = keptRatings.length > 0
    ? Math.round((keptRatings.reduce((a, b) => a + b, 0) / keptRatings.length) * 20)
    : null

  const handleSaveRatings = async () => {
    // Save each rating to nikigai_clusters
    const updates = Object.entries(clusterRatings).map(([id, rating]) =>
      supabase.from('nikigai_clusters').update({
        resonance_rating: rating,
        resonance_updated_at: new Date().toISOString(),
      }).eq('id', id)
    )
    // Mark removed clusters
    const removes = [...removedClusters].map(id =>
      supabase.from('nikigai_clusters').update({
        is_removed: true,
        resonance_updated_at: new Date().toISOString(),
      }).eq('id', id)
    )
    await Promise.all([...updates, ...removes])
    goToScreen(essenceChamber ? 'chamber_intro' : 'complete')
  }

  return (
    <div className="life-map-app">
      <div className="lm-container">
        <div className="lm-reveal">
          <h2 className="lm-reveal-title lm-gold-text">Does this feel right?</h2>
          <p className="lm-reveal-subtitle">Rate how well each one describes you</p>
          {clarityPct != null && (
            <div className="lm-clarity-score">Clarity: {clarityPct}%</div>
          )}

          {/* Render each cluster with 1-5 dots + remove */}
          {allClusters.map(cluster => (
            <div key={cluster.id} className="lm-rate-card">
              <div className="lm-rate-label">{cluster.label}</div>
              <div className="lm-rate-dots">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n}
                    className={`lm-rate-dot ${(clusterRatings[cluster.id] || 0) >= n ? 'active' : ''}`}
                    onClick={() => setClusterRatings(prev => ({ ...prev, [cluster.id]: n }))}
                  />
                ))}
              </div>
              <button className="lm-rate-remove"
                onClick={() => setRemovedClusters(prev => new Set([...prev, cluster.id]))}
              >Remove</button>
            </div>
          ))}

          <button className="lm-cta-gold" onClick={handleSaveRatings}
            disabled={Object.keys(clusterRatings).length === 0}>
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 5. CSS needed (add to LifeMapFlow.css)
```css
.lm-clarity-score { text-align: center; font-size: 24px; font-weight: 800; color: #5e17eb; margin: 16px 0; }
.lm-rate-card { padding: 14px 0; border-bottom: 1px solid #f2f3f5; display: flex; align-items: center; gap: 12px; }
.lm-rate-label { flex: 1; font-size: 14px; font-weight: 600; color: #1a1a2e; }
.lm-rate-dots { display: flex; gap: 6px; }
.lm-rate-dot { width: 24px; height: 24px; border-radius: 50%; border: 2px solid #e9ecef; background: #fff; cursor: pointer; padding: 0; }
.lm-rate-dot.active { background: #5e17eb; border-color: #5e17eb; }
.lm-rate-remove { background: none; border: none; color: #adb5bd; font-size: 12px; cursor: pointer; font-family: inherit; }
```

### 6. Journey tab — display Clarity % (JourneyTab.jsx)
Query nikigai_clusters for user, filter `is_removed = false` and `resonance_rating IS NOT NULL`, average ratings × 20 = Clarity %. Display above "Your Skills" section.

### 7. Migration (apply before building)
```sql
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS resonance_rating integer;
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS resonance_updated_at timestamptz;
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS behavioral_evidence integer DEFAULT 0;
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS is_removed boolean DEFAULT false;
```

### Edge cases to handle
- **Duplicate clusters from multiple Life Map runs**: Filter by most recent `session_id` or by `step_id IS NULL` to avoid showing overlapping clusters
- **Return flow** (user already completed Life Map, comes back): `handleReturnView()` at line 575 goes to `life_map` screen. If they tap through to nikigai again, they'll hit rate_mirror. Their previous ratings should pre-populate from DB.
- **No clusters** (Life Map not completed): rate_mirror should auto-skip to next screen if allClusters is empty

**Open question from user**: The resonance rating + curiosity additions + life path updates should converge on a "Mirror page" — a living page users can return to. This may be a new route (/mirror) or an expansion of the /me page. Decide during Sprint 2 or defer to Sprint 4.

### Remaining sprints (all scoped in `docs/features/interior-scoreboard-implementation-plan.md`)
- Sprint 3: Quest skill tagging (2 days)
- Sprint 4: Mirror re-generation + Clarity that moves (2-3 days) 
- Sprint 5: Per-completion progress + guidance layer (3-4 days)
- Sprint 6: Skill tree background + curiosity extension (3-4 days)

### Feature branch
`feature/interior-scoreboard-sprint1` has Sprint 1 code + data gaps doc. Needs PR to main when ready.

## User answers to clarifying questions (shapes Sprint 2-6)

**Sprint 2 — Cluster resonance rating:**
- New STEP after Life Map results (not inline on results page) — less clutter, only titles without descriptions
- Clarity % displays on Journey tab, above "Your Skills" section
- Users can remove clusters (score 1-2) and add custom ones. Clarity = average of KEPT clusters only.
- Huzz rated all his clusters 4/5 → Clarity = 80%

**Sprint 4 — Mirror re-generation:**
- BOTH push notification AND in-app banner
- Opens to a "Mirror page" — a new convergence point where users can also update curiosity additions, re-rate clusters, see life path updates. This becomes the HOME for Clarity, the place all updates converge. Could be a new route (/mirror) or expansion of /me page — needs design decision.

**Sprint 5 — Guidance layer:**
- Shows INLINE on quest cards + journey page (not only in Zarlo chat)
- Zone of Excellence warning: shows on quest card when 3+ "Pressure" outcomes in a row

**Sprint 6 — Skill tree:**
- When quest is created → AI auto-tags skills → immediately asks "what level are you at with these?" L0-L4 picker per skill, right at quest creation
- Only shows skills that appear on the quest, not all 10

## How Clarity % is calculated

```
1. User completes Life Map → AI generates skill/problem/persona clusters (freeform names)
2. New "rate_mirror" screen: each cluster shown with title + items + 1-5 rating
   - 5 = "This IS me" (goosebumps)
   - 4 = "Yeah, that's right"
   - 3 = "Partly"
   - 2 = "Not quite"
   - 1 = "That's not me"
3. User can REMOVE clusters (is_removed = true) or ADD custom ones
4. Clarity % = average resonance of KEPT clusters × 20
   (e.g., all 4s = 4.0/5 = 80%)
5. Saves resonance_rating + resonance_updated_at on nikigai_clusters table
6. Later (Sprint 4): after 5 courage challenges on quests sharing skill tags,
   AI re-generates cluster → user re-rates ONE cluster → Clarity updates
```

DB fields needed (migration): `resonance_rating integer`, `resonance_updated_at timestamptz`, `behavioral_evidence integer DEFAULT 0`, `is_removed boolean DEFAULT false` — all on nikigai_clusters table.

## Pre-existing bugs found during code review (not from our changes)

1. **`gcm-wahoo-alive` CSS class missing** — `GroanCompletionModal.jsx:362` uses class `gcm-wahoo-alive` for the "Fun" button but `GroanCompletionModal.css` has no `.gcm-wahoo-alive.selected` definition. Fun button selected state looks identical to Pressure/Uninterested. Fix: add `.gcm-wahoo-alive.selected { border-color: #10b981; background: rgba(16, 185, 129, 0.06); }`

2. **Courage task with no groan_challenge_id gets silently done** — `QuestBoardCard.jsx:103` intercept only fires when BOTH `is_courage_challenge` AND `groan_challenge_id` are truthy. If groan_challenge_id is null (from HealingIntentionsList path), task gets checked off with no classification modal, no RP, no NS check-in. Pre-existing, documented in Sprint 0 investigation.

3. **Mystery box count check may read null** — `QuestBoardCard.jsx:199-205` chains `.then({ count })` on a Supabase query builder without proper await. Count could be null, preventing mystery box trigger on first quest achievement. Pre-existing.

## Gotchas discovered

1. **quest_tasks.groan_challenge_id has NO FK constraint** — we added one via migration. But HealingIntentionsList.jsx creates courage quest_tasks WITHOUT groan_challenges intentionally (healing tasks aren't wahoos). Don't "fix" those 8 records.

2. **groan_challenges link to quests via source_label (text matching), not a real join** — we added quest_id column and backfilled 116/138. 22 remain null (orphans from old flows). The source_label field only matches 9/108 records.

3. **LifeMapFlow.jsx is ~1400 lines** with complex screen flow. The SCREENS array defines order. Adding a screen requires: adding to array, adding the screen render block, and updating navigation (goToScreen calls + the CTA button on the previous screen).

4. **Multiple Life Map runs create duplicate clusters** — Huzz has overlapping skill clusters from 2 runs. The `step_id IS NULL` filter scopes to Life Map clusters, but within that scope there can be duplicates. The resonance rating needs to handle this (show deduplicated clusters or most recent run only).

5. **classify-curiosities edge function currently only outputs branch** — not skills or problems. Extension designed but not implemented. The prompt change is clear (add skill + problem definitions). Output schema adds `skills[]` and `problems[]` per cluster.

## Bug to investigate BEFORE Sprint 2

### huzz@nichuzz.com Life Map shows 0 skills, 1 problem on nikigai screen

**What's happening:** At `/life-map`, the nikigai screen ("Skills, Problems, Personas") shows "Skills 0 clusters", "Problems 1 cluster" (Transforming Fear into Freedom & Aliveness). Screenshot confirmed on localhost:5180.

**What the DB has:** huzz@nichuzz.com (user_id: `ebe69854-2ebd-4236-a437-3a362f5e1af4`) has 8 skills clusters, 6 problems clusters, 8 personas clusters in `nikigai_clusters` (step_id IS NULL, cluster_stage = 'final'). The data EXISTS.

**Likely cause:** LifeMapFlow.jsx nikigai screen filters clusters by `session_id` (line 592: `.eq('session_id', savedSession.id)`). If the most recent `flow_sessions` row has a different `id` than the clusters, or if the latest run produced partial results, the screen shows incomplete data.

**How to investigate:**
```sql
-- 1. Check flow_sessions for life_map
SELECT id, status, completed_at
FROM flow_sessions
WHERE user_id = 'ebe69854-2ebd-4236-a437-3a362f5e1af4'
  AND flow_type = 'life_map'
ORDER BY created_at DESC;

-- 2. Check which session_ids the clusters belong to
SELECT session_id, cluster_type, COUNT(*)
FROM nikigai_clusters
WHERE user_id = 'ebe69854-2ebd-4236-a437-3a362f5e1af4'
  AND cluster_stage = 'final' AND step_id IS NULL
GROUP BY session_id, cluster_type
ORDER BY session_id;
```

**Priority:** HIGH. Blocks Sprint 2 — cluster resonance rating has nothing to rate if clusters don't show.

## Recommendations

1. **Fix the Life Map cluster bug first** — Sprint 2 depends on clusters being visible.

2. **Merge Sprint 1 to main** — it's built, tested, build passes. Timeframe tags + identity library are user-facing improvements that don't depend on anything else.

3. **Start Sprint 2 with the `rate_mirror` screen** — after fixing the cluster bug. The code skeleton is above with exact line numbers.

4. **Test AI quest tagging before Sprint 3** — run the 7 Huzz quests through an AI prompt to validate accuracy. User needs to confirm tags before building the auto-tagger.

5. **Note: Sprint 5 is partially built by another agent** — QuestBoardCard.jsx and GroanCompletionModal.jsx have been modified by another agent with progress bar, courage trend, "lit me up" signal, and Zone of Excellence warning. Check `git diff main` on those files before rebuilding Sprint 5 features.

6. **Zone detection (not yet in any sprint)** — detecting which zone the user is in based on Capacity × Clarity (Head Full of Dreams, Misguided, Diagonal, etc.) is the most impactful missing piece. See `docs/features/interior-scoreboard-data-gaps.md`.
