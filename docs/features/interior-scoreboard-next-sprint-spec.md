# Interior Scoreboard — Next Sprint Implementation Spec

*Created: July 18, 2026. Status: Ready to build.*

Builds on Sprints 2-6 shipped July 18. See `docs/session-handoff-2026-07-18-interior-scoreboard-sprint2.md` for context.

---

## Sprint 7: NS State Swap (replaces 1-4 dots)

### What
Replace abstract 1-4 rating dots with the same 4 nervous system states used across the entire app. One language everywhere.

### Cluster-specific labels
| State | Label | Color | Action |
|-------|-------|-------|--------|
| vibe_rise | "I would absolutely love this" | Gold #E9A23B | Keep, strong signal |
| fun | "Yeah, sounds fun" | Green #10b981 | Keep, moderate |
| stressed | "I could do it but feels stressful" | Red #ef4444 | Keep, flag it |
| bored | "I could but it doesn't excite me" | Grey #6b7280 | Auto-remove |

### Clarity formula change
```
Old: average of kept ratings (3-4) × 25
New: (vibe_rise_count × 2 + fun_count × 1) / (total_kept × 2) × 100
     All vibe_rise = 100%, all fun = 50%, mix = between
```

Or simpler: `(vibe_rise_count + fun_count) / total_clusters × 100` (binary: it fits or it doesn't, weight doesn't matter since stressed clusters are flagged not counted).

**Decision needed**: which formula feels right?

### DB changes
- `nikigai_clusters.resonance_rating` currently stores integer 1-4. Change to store text state: `'vibe_rise'`, `'fun'`, `'stressed'`, `'bored'`. Or add new column `resonance_state text` and deprecate `resonance_rating`.
- Recommend: add `resonance_state text` column, keep `resonance_rating` for backwards compat. Migration:
```sql
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS resonance_state text;
-- Backfill existing ratings
UPDATE nikigai_clusters SET resonance_state = CASE
  WHEN resonance_rating = 4 THEN 'vibe_rise'
  WHEN resonance_rating = 3 THEN 'fun'
  WHEN resonance_rating <= 2 AND is_removed = true THEN 'bored'
  ELSE NULL
END WHERE resonance_rating IS NOT NULL;
```

### Files to change
| File | Change |
|------|--------|
| `src/pages/MirrorPage.jsx` | Replace 4 dot buttons with 4 state buttons (emoji + label). Auto-remove on `bored`. Flag `stressed` with warning icon. Update Clarity calc. |
| `src/pages/MirrorPage.css` | State button styles matching existing NS state pills in Challenge.css |
| `src/flows/LifeMapFlow.jsx` | rate_mirror screen: same 4 state buttons instead of dots. Line ~1244. |
| `src/flows/LifeMapFlow.css` | State button styles for rate_mirror |
| `src/components/JourneyTab.jsx` | Clarity calc at line ~175: change from `avg * 25` to new formula using `resonance_state` |

### UI sketch (MirrorPage cluster card)
Horizontal pill row (compact, not stacked buttons). Same pattern as state pills in Challenge.css.
```jsx
<div className="mp-cluster-card">
  <div className="mp-cluster-label">{cluster.cluster_label}</div>
  <div className="mp-state-pills">
    <button className={`mp-state-pill vibe ${state === 'vibe_rise' ? 'active' : ''}`}
      onClick={() => handleRate(cluster.id, 'vibe_rise')}>🔥</button>
    <button className={`mp-state-pill fun ${state === 'fun' ? 'active' : ''}`}
      onClick={() => handleRate(cluster.id, 'fun')}>😌</button>
    <button className={`mp-state-pill stressed ${state === 'stressed' ? 'active' : ''}`}
      onClick={() => handleRate(cluster.id, 'stressed')}>😰</button>
    <button className={`mp-state-pill bored ${state === 'bored' ? 'active' : ''}`}
      onClick={() => handleRate(cluster.id, 'bored')}>😶</button>
  </div>
</div>
```

### Rating index update
Replace the dots legend with state descriptions. Same 4 rows, just using state labels + emojis instead of ●●●● notation.

---

## Sprint 8: Cluster Re-generation Edge Function

### What
When `behavioral_evidence >= 5` on a cluster, AI takes the original cluster + recent courage data and returns an evolved version. User re-rates.

### New edge function: `regenerate-cluster`

**Input:**
```json
{
  "cluster_id": "uuid",
  "cluster_label": "Experience Architect & Joy Catalyst",
  "cluster_type": "skills",
  "original_items": ["item1", "item2"],
  "challenge_outcomes": [
    { "title": "Retreat Disco + Breathwork", "classification": "vibe", "identity_statement": "takes risk to follow passions" },
    { "title": "Published an app", "classification": "vibe", "identity_statement": "posts content that educates" }
  ]
}
```

**Prompt:**
```
You are updating a self-knowledge cluster based on new behavioral evidence.

ORIGINAL CLUSTER:
Name: {cluster_label}
Items that created it: {original_items}

RECENT EVIDENCE (courage challenges completed since this cluster was created):
{challenge_outcomes formatted}

The user has completed {count} challenges that overlap with the skills in this cluster.
Based on this evidence, the cluster may need refining.

Return JSON:
{
  "evolved_label": "Updated cluster name that reflects who they're BECOMING, not just who they were",
  "evolved_insight": "Updated insight paragraph reflecting the growth evidence",
  "evolution_reason": "One sentence explaining what the challenges revealed",
  "confidence": 0.0-1.0
}

Rules:
- Only change the label if the evidence genuinely shifts the meaning
- If confidence < 0.6, return the original label and insight unchanged
- The new label should feel like growth, not correction
- The insight should reference specific challenge evidence
```

**Output:**
```json
{
  "evolved_label": "Experience Architect & Community Catalyst",
  "evolved_insight": "You started designing solo experiences but your challenges reveal a pattern: the ones that lit you up most involved bringing people together. Retreat Disco, published apps, breathwork sessions. The common thread isn't the modality, it's the gathering.",
  "evolution_reason": "Your recent challenges show you're moving from solo creation to building shared experiences",
  "confidence": 0.85
}
```

### Client-side flow
1. User opens `/mirror`
2. Banner shows: "X clusters have new evidence"
3. Cluster card shows a "Review" button (gold accent) when `behavioral_evidence >= 5`
4. Tap Review → loading state → call `regenerate-cluster`
5. If `confidence >= 0.6`: show comparison card:
   ```
   ┌──────────────────────────────────┐
   │ Was: Experience Architect &      │
   │      Joy Catalyst                │
   │                                  │
   │ Now: Experience Architect &      │
   │      Community Catalyst          │
   │                                  │
   │ "Your recent challenges show     │
   │  you're moving from solo         │
   │  creation to building shared     │
   │  experiences"                    │
   │                                  │
   │  [Accept]        [Keep original] │
   └──────────────────────────────────┘
   ```
6. If accepted: update `cluster_label` + `insight`, reset `behavioral_evidence` to 0, set `regen_attempted_at` to now, prompt re-rate
7. If kept: reset `behavioral_evidence` to 0, set `regen_attempted_at` to now
8. If AI returns confidence < 0.6: show "No significant evolution detected" message, set `regen_attempted_at` to now, suppress banner for 30 days
9. Banner logic: show "Review" button only when `behavioral_evidence >= 5 AND (regen_attempted_at IS NULL OR regen_attempted_at < 30 days ago)`

### DB changes
```sql
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS regen_attempted_at timestamptz;
```

### Files to change
| File | Change |
|------|--------|
| `supabase/functions/regenerate-cluster/index.ts` | NEW edge function |
| `src/pages/MirrorPage.jsx` | Add re-gen flow: tap cluster with evidence → call edge function → show old vs new → accept/reject → re-rate |

### DB changes
None needed. `behavioral_evidence` and `cluster_label` already exist.

---

## Sprint 9: Zarlo/Figurine Guidance Integration

### What
Feed Clarity score + courage patterns into Zarlo and Figurine prompt systems so they reference the user's interior scoreboard.

### Changes to `src/lib/zarlo/zarloEngine.js`

Add a new section to `buildZarloPrompt` (after `actionsSection`, around line 917):

```javascript
// Interior scoreboard context
let scoreboardSection = ''
if (userContext?.clarityPct != null) {
  scoreboardSection += `\nCLARITY SCORE: ${userContext.clarityPct}%`
  if (userContext.clarityPct < 60) {
    scoreboardSection += ` (LOW — suggest exploring a new curiosity or completing Life Map)`
  }
}
if (userContext?.topIdentity) {
  scoreboardSection += `\nTOP IDENTITY: "I am someone who ${userContext.topIdentity.text}" (reinforced ${userContext.topIdentity.count} times)`
  if (userContext.topIdentity.count >= 5) {
    scoreboardSection += ` — this is becoming part of who they are, acknowledge it`
  }
}
if (userContext?.zoneOfExcellenceQuests?.length > 0) {
  scoreboardSection += `\nZONE OF EXCELLENCE WARNING: Quests with 3+ "Pressure" outcomes: ${userContext.zoneOfExcellenceQuests.join(', ')}. They're skilled here but it doesn't light them up.`
}
```

Add to the system prompt:
```
INTERIOR SCOREBOARD RULES:
- If Clarity is low, gently suggest "Have you tried the curiosity map?" or "Your Life Map might need updating"
- If an identity statement has been reinforced 5+ times, acknowledge it: "You keep proving you're someone who [X]"
- If zone of excellence warning exists, name it: "You're good at [quest] but your body keeps telling you it's not the thing"
- If Clarity increased recently, celebrate: "Your mirror just got sharper"
- Never lecture about scores. Mention them naturally, like a friend who noticed something.
```

### Data strategy: cache in Zarlo brief, NOT live queries
The Zarlo brief (`zarlo_briefs` table) is computed by the `generate-zarlo-brief` edge function. Add scoreboard fields to the brief payload rather than querying live on every chat message. Zero new queries at chat time.

Add to `supabase/functions/generate-zarlo-brief/index.ts`:
- `clarityPct`: use shared `calculateClarityScore` logic (query nikigai_clusters, compute %)
- `topIdentity`: parse `quest_completions` reflection_text, find most frequent identity statement
- `zoneOfExcellenceQuests`: find quests where last 3 wahoo classifications are all "anxious"
- `actionScore`: use shared `calculateActionScore` logic (7-day rolling window)

The `buildZarloPrompt` function reads these from `userContext.zarloBrief` which is already loaded at chat init.

### Files to change
| File | Change |
|------|--------|
| `supabase/functions/generate-zarlo-brief/index.ts` | Add clarityPct, topIdentity, zoneOfExcellenceQuests, actionScore to brief payload |
| `src/lib/zarlo/zarloEngine.js` | Add scoreboard section to `buildZarloPrompt` (~line 917), reading from `zarloBrief`. Add scoreboard rules to system prompt (~line 931). |
| `src/hooks/useFigurine.js` | Same pattern: read scoreboard from brief, add to figurine prompt context |

---

## Sprint 10: Weekly Review Redesign

### What
Replace 7 questions with 3. Keep 15 RP reward + 5 for sharing.

### New questions
1. **"Old me would have ___. Instead I ___."** (narrative_revision, text, required)
   - Feeds Identity Statement Library (extract "Instead I ___" as identity statement)
2. **"Did procrastination stop you from doing something this week?"** (yes/no + what)
   - Maps to existing `identity_did` (bool) + `identity_text` (text) columns
   - Rename in UI only. DB column stays `identity_did` for backwards compat.
3. **"What's the one brave thing you're most proud of?"** (text, required)
   - Maps to existing `compounding_text` column (reuse, rename in UI only)

### Validation
`isValid = narrativeRevision.trim().length > 0 && compoundingText.trim().length > 0`
(2 of 3 required, procrastination question is optional)

### Files to change
| File | Change |
|------|--------|
| `src/components/WeeklyReview.jsx` | Replace 7-question form with 3. Remove `environment`, `networkText`, `betSizingText`, `learningText`, `attentionHours` state. Keep `narrativeRevision`, `identityDid`, `identityText`, `compoundingText`. Update validation. Update insert to only send used columns (others as null). |
| `src/components/WeeklyReview.css` | Simplify layout for 3 questions |
| `src/components/WeeklyReviewCard.jsx` | Update shareable card to show 3 answers |

### DB changes
None. Existing columns reused, unused ones get null. No migration needed.

### Code sketch
```jsx
<div className="wr-question">
  <h3>Old me would have ___. Instead I ___.</h3>
  <textarea value={narrativeRevision} onChange={e => setNarrativeRevision(e.target.value)}
    placeholder="Old me would have stayed quiet. Instead I spoke up in the meeting." />
</div>

<div className="wr-question">
  <h3>Did procrastination stop you from doing something?</h3>
  <div className="wr-yesno">
    <button className={identityDid === true ? 'active' : ''} onClick={() => setIdentityDid(true)}>Yes</button>
    <button className={identityDid === false ? 'active' : ''} onClick={() => setIdentityDid(false)}>No</button>
  </div>
  {identityDid && (
    <textarea value={identityText} onChange={e => setIdentityText(e.target.value)}
      placeholder="What did you put off?" />
  )}
</div>

<div className="wr-question">
  <h3>What's the one brave thing you're most proud of?</h3>
  <textarea value={compoundingText} onChange={e => setCompoundingText(e.target.value)}
    placeholder="I finally..." />
</div>
```

---

## Sprint 11: Action Score

### What
Rolling 7-day action alignment score. Shows on the Quests tab with a matrix graph plotting Action × Clarity. This is the Y-axis for Zone Calibration.

### Scope
**Rolling 7 days** (trailing window, not Mon-Sun). Always has recent data, no Monday morning reset to zero.

**Minimum volume**: Matrix graph only shows a zone label after 5+ actions in the window. Below 5, shows "Keep going" instead of a quadrant name. Prevents 1/1 aligned = "Self-Actualisation" from a single action.

### Formula
```
Action Score = aligned_actions / total_actions × 100
(only meaningful when total_actions >= 5)

aligned_actions (Vibe Rise/Fun outcomes in last 7 days):
  courage_challenges with vibe/peace classification
  + tasks with task_signal = 'lit_me_up'
  + daily check-ins with vibe_rise/ventral state

total_actions (ALL outcomes in last 7 days):
  all courage_challenges (any classification)
  + all tasks with any task_signal
  + all daily check-ins

Stressed/Bored are NOT penalized — they just don't count as aligned.
```

### Implementation
Shared utility: `src/lib/scoreUtilities.js` (contains BOTH Action Score and Clarity Score)

```javascript
import { supabase } from './supabaseClient'

const MINIMUM_ACTIONS = 5

/**
 * Calculate Action Score (rolling 7-day alignment rate).
 * Returns { score: 0-100 | null, total: number, aligned: number }
 * score is null when total < MINIMUM_ACTIONS
 */
export async function calculateActionScore(userId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [courageRes, taskRes, checkinRes] = await Promise.all([
    supabase.from('quest_completions')
      .select('reflection_text')
      .eq('user_id', userId).eq('quest_category', 'Groans')
      .gte('created_at', sevenDaysAgo)
      .not('reflection_text', 'is', null),
    supabase.from('quest_tasks')
      .select('task_signal')
      .eq('user_id', userId)
      .not('task_signal', 'is', null)
      .gte('completed_at', sevenDaysAgo),
    supabase.from('nervous_system_checkins')
      .select('after_state')
      .eq('user_id', userId).eq('checkin_type', 'daily')
      .gte('created_at', sevenDaysAgo),
  ])

  let aligned = 0
  let total = 0

  ;(courageRes.data || []).forEach(row => {
    try {
      const { wahoo_classification } = JSON.parse(row.reflection_text)
      if (wahoo_classification) {
        total++
        if (['vibe', 'wahoo', 'peace'].includes(wahoo_classification)) aligned++
      }
    } catch {}
  })

  ;(taskRes.data || []).forEach(t => {
    total++
    if (t.task_signal === 'lit_me_up') aligned++
  })

  ;(checkinRes.data || []).forEach(c => {
    total++
    if (['vibe_rise', 'ventral'].includes(c.after_state)) aligned++
  })

  return {
    score: total >= MINIMUM_ACTIONS ? Math.round((aligned / total) * 100) : null,
    total,
    aligned,
  }
}

/**
 * Calculate Clarity Score from cluster resonance states.
 * Single source of truth — used by JourneyTab, MirrorPage, LevelTab matrix.
 * Returns number (0-100) or null if no rated clusters.
 *
 * After Sprint 7 (NS state swap), this changes to count
 * vibe_rise + fun clusters vs total. For now uses resonance_rating × 25.
 */
export async function calculateClarityScore(userId) {
  const { data } = await supabase
    .from('nikigai_clusters')
    .select('resonance_rating')
    .eq('user_id', userId)
    .in('cluster_type', ['skills', 'problems', 'persona'])
    .is('step_id', null)
    .eq('cluster_stage', 'final')
    .eq('is_removed', false)
    .not('resonance_rating', 'is', null)

  const rated = data || []
  if (rated.length === 0) return null
  const avg = rated.reduce((sum, c) => sum + c.resonance_rating, 0) / rated.length
  return Math.round(avg * 25)
}

/**
 * Determine zone from Action Score + Clarity.
 * Returns zone name or null if insufficient data.
 */
export function getZone(actionScore, clarityPct) {
  if (actionScore == null || clarityPct == null) return null
  if (actionScore > 60 && clarityPct > 60) return 'Self-Actualisation'
  if (actionScore <= 60 && clarityPct > 60) return 'Head Full of Dreams'
  if (actionScore > 60 && clarityPct <= 60) return 'Misguided Zone'
  return 'Unfulfilment'
}
```

### Display: Matrix graph on Quests tab
Shows at the top of the Quests tab (LevelTab.jsx), above the quest board. Compact 2x2 matrix with a dot showing where you are.

```
                    HIGH ACTION
                        │
     Misguided Zone     │     SELF-ACTUALISATION
     (doing without     │●    (both rising together)
      knowing)          │     
                        │
   ─────────────────────┼──────────────────────
                        │
     Unfulfilment       │     Head Full of Dreams
     (neither)          │     (knowing without doing)
                        │
                    LOW ACTION

   LOW CLARITY ─────────────── HIGH CLARITY
```

The dot position: `x = clarityPct / 100`, `y = actionScore / 100`.

**Below 5 actions**: dot shows but zone label says "Keep going" with `{total}/5 actions` counter. No quadrant name. Motivates completing more actions without false labelling.

**5+ actions**: zone name shows. Quadrant label highlights.

```jsx
<div className="lt-matrix">
  <div className="lt-matrix-title">Last 7 days</div>
  <div className="lt-matrix-grid">
    {/* 4 quadrant labels */}
    {actionResult.score != null && clarityPct != null && (
      <div className="lt-matrix-dot" style={{
        left: `${clarityPct}%`,
        bottom: `${actionResult.score}%`
      }} />
    )}
  </div>
  <div className="lt-matrix-zone">
    {actionResult.total < 5
      ? `Keep going (${actionResult.total}/5 actions)`
      : getZone(actionResult.score, clarityPct)
    }
  </div>
</div>
```

### Files to change
| File | Change |
|------|--------|
| `src/lib/scoreUtilities.js` | NEW shared utility (Action Score + Clarity Score + Zone detection) |
| `src/components/level/LevelTab.jsx` | Add matrix graph, import from scoreUtilities |
| `src/components/level/LevelTab.css` | Matrix graph styles |
| `src/components/JourneyTab.jsx` | Replace inline Clarity calc with `import { calculateClarityScore } from '../lib/scoreUtilities'` |
| `src/pages/MirrorPage.jsx` | Replace inline Clarity calc with shared utility |

### DB changes
None. All data already exists.

---

## ~~Sprint 12: Cross-pollination to Clarity~~ CUT

Data already captured in `quest_cross_pollination`. Visual already shows on QuestMap. Wiring convergence into Clarity formula is premature since Sprint 7 is about to rewrite the formula with NS states. Revisit after Sprint 7 settles.

### DB changes
None.

---

## Sprint 13: Skill Tree UI on /mirror

### What
Visual display of skill progress (L0-L4) on the Mirror page. Data already collecting via `user_skill_progress` table.

### UI design
Below clusters on Mirror page. 5 segments per skill (L0-L4), lit segments show completed levels. Simple, visual, no numbers.

```
Performing     [■][■][■][□][□]  L2
Coaching       [■][□][□][□][□]  L0
Building       [■][■][■][■][□]  L3
```

Each segment = a level. Lit (filled) = achieved. Dim = not yet. Current level shown as text label on the right.

```jsx
const THRESHOLDS = [0, 3, 8, 15, 25]
const LEVEL_LABELS = ['L0', 'L1', 'L2', 'L3', 'L4']

function getLevelIndex(xp) {
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= THRESHOLDS[i]) return i
  }
  return 0
}

// In render:
<div className="mp-section">
  <h3 className="mp-section-title" style={{ color: '#5e17eb' }}>Your Skills</h3>
  {skillProgress.map(skill => {
    const levelIdx = getLevelIndex(skill.xp)
    return (
      <div className="mp-skill-row" key={skill.skill_id}>
        <span className="mp-skill-name">{SKILL_LABELS[skill.skill_id]}</span>
        <div className="mp-skill-segments">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={`mp-skill-seg ${i <= levelIdx ? 'lit' : ''}`} />
          ))}
        </div>
        <span className="mp-skill-level">{LEVEL_LABELS[levelIdx]}</span>
      </div>
    )
  })}
</div>
```

CSS: segments are small rectangles in a row. Lit segments use the purple→gold gradient. Dim segments are light grey. Compact, one line per skill.

### Data fetch
```javascript
supabase.from('user_skill_progress')
  .select('skill_id, xp, level')
  .eq('user_id', userId)
  .gt('xp', 0)
  .order('xp', { ascending: false })
```

### Files to change
| File | Change |
|------|--------|
| `src/pages/MirrorPage.jsx` | Add skill progress query + display section |
| `src/pages/MirrorPage.css` | Skill row + progress bar styles |

### DB changes
None. Table exists.

---

## Sprint 14: Push Notification for Re-gen

### What
"Your mirror has new evidence" push notification when `behavioral_evidence` hits 5.

### Trigger
In `GroanCompletionModal.jsx`, after incrementing behavioral_evidence, check if any cluster just hit 5:

```javascript
// After increment_behavioral_evidence RPC
const { data: justReady } = await supabase
  .from('nikigai_clusters')
  .select('id')
  .eq('user_id', userId)
  .gte('behavioral_evidence', 5)
  .eq('is_removed', false)
  .eq('regen_notified', false)  // only notify once per cycle
  .limit(1)

if (justReady?.length > 0) {
  // Use existing push infrastructure (send-push-notification edge function)
  supabase.functions.invoke('send-push-notification', {
    body: {
      user_id: userId,
      title: 'Your mirror has new evidence',
      body: "Your challenges are showing who you're becoming. Check in.",
      url: '/mirror',
    }
  }).catch(() => {})

  // Mark as notified (reset when user acts on re-gen in Sprint 8)
  await supabase.from('nikigai_clusters')
    .update({ regen_notified: true })
    .eq('id', justReady[0].id)
}
```

### Files to change
| File | Change |
|------|--------|
| `src/components/GroanCompletionModal.jsx` | After behavioral_evidence increment (~line 315), check threshold + notified flag, call `send-push-notification` |
| `supabase/functions/send-push-notification/index.ts` | Verify it accepts `url` param for click action |

### DB changes
```sql
ALTER TABLE nikigai_clusters ADD COLUMN IF NOT EXISTS regen_notified boolean DEFAULT false;
```
Reset to `false` when user completes a re-gen cycle (Sprint 8 accept/keep).

---

## Known bug: fix BEFORE starting Sprint 7

**Life Map shows 0 skill clusters on nikigai screen** despite having 8 in the database. Likely cause: session_id mismatch between `flow_sessions` and `nikigai_clusters` from multiple Life Map runs. The processing code archives old clusters by `cluster_stage = 'archived'` but the nikigai screen loads clusters scoped to the current `session_id`. If the session ID doesn't match, zero clusters show.

See `docs/bugs/life-map-missing-clusters.md` for investigation guide with SQL queries and fix options. Fix this before any Sprint 7 work since Sprint 7 changes the rating system on the rate_mirror screen which comes right after nikigai.

---

## Build order

```
Sprint 7  (NS state swap)       — do FIRST, everything downstream uses this
Sprint 10 (Weekly review)       — independent, quick win
Sprint 11 (Action Score + matrix) — independent, adds matrix graph to Quests tab
Sprint 8  (Re-gen edge func)    — needs Sprint 7 for re-rate UI
Sprint 9  (Zarlo/Figurine)      — needs Sprint 7 for Clarity data
Sprint 13 (Skill tree UI)       — independent, goes on /mirror
Sprint 14 (Push notification)   — needs Sprint 8
~Sprint 12~ CUT                 — revisit after Sprint 7
```

Sprints 10, 11, 12, 13 can run in parallel.
Sprint 7 must be first. Sprint 8 depends on 7. Sprint 14 depends on 8.
