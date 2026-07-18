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
```jsx
<div className="mp-cluster-card">
  <div className="mp-cluster-label">{cluster.cluster_label}</div>
  <div className="mp-state-btns">
    <button className={`mp-state-btn vibe ${state === 'vibe_rise' ? 'active' : ''}`}
      onClick={() => handleRate(cluster.id, 'vibe_rise')}>
      🔥 I would absolutely love this
    </button>
    <button className={`mp-state-btn fun ${state === 'fun' ? 'active' : ''}`}
      onClick={() => handleRate(cluster.id, 'fun')}>
      😌 Yeah, sounds fun
    </button>
    <button className={`mp-state-btn stressed ${state === 'stressed' ? 'active' : ''}`}
      onClick={() => handleRate(cluster.id, 'stressed')}>
      😰 I could do it but feels stressful
    </button>
    <button className={`mp-state-btn bored ${state === 'bored' ? 'active' : ''}`}
      onClick={() => handleRate(cluster.id, 'bored')}>
      😶 I could but it doesn't excite me
    </button>
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
  "evolution_reason": "One sentence explaining what the challenges revealed",
  "confidence": 0.0-1.0
}

Rules:
- Only change the label if the evidence genuinely shifts the meaning
- If confidence < 0.6, return the original label unchanged
- The new label should feel like growth, not correction
```

**Output:**
```json
{
  "evolved_label": "Experience Architect & Community Catalyst",
  "evolution_reason": "Your recent challenges show you're moving from solo creation to building shared experiences",
  "confidence": 0.85
}
```

### Client-side flow
1. User opens `/mirror` or rate_mirror screen
2. Banner shows: "X clusters have new evidence"
3. User taps a cluster with `behavioral_evidence >= 5`
4. Show loading state, call `regenerate-cluster`
5. If `confidence >= 0.6`: show old vs new label with "Accept" / "Keep original"
6. If accepted: update `cluster_label`, reset `behavioral_evidence` to 0, prompt re-rate
7. If kept: reset `behavioral_evidence` to 0 (don't re-prompt)

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

### Data to pass into userContext
Need to fetch and pass to `buildZarloPrompt`:
- `clarityPct`: query `nikigai_clusters` (same as JourneyTab)
- `topIdentity`: query `quest_completions` reflection_text, parse identity statements, find most frequent
- `zoneOfExcellenceQuests`: query quest cards with 3+ consecutive "anxious" wahoo classifications

### Files to change
| File | Change |
|------|--------|
| `src/lib/zarlo/zarloEngine.js` | Add scoreboard section to `buildZarloPrompt` (~line 917). Add scoreboard rules to system prompt (~line 931). |
| `src/lib/zarlo/zarloEngine.js` | In `loadUserContext` (~line 400): add queries for clarityPct, topIdentity, zoneOfExcellenceQuests |
| `src/hooks/useFigurine.js` | Same pattern: add scoreboard data to figurine prompt context |

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
Aggregate existing action data into a rolling 30-day score. This is the Y-axis for Zone Calibration.

### Formula
```
Action Score = positive_actions - negative_actions

positive_actions =
  courage_challenges with vibe/peace classification (×2)
  + tasks with task_signal = 'lit_me_up' (×1)
  + daily_checkins with vibe_rise/ventral state (×0.5)

negative_actions =
  courage_challenges with anxious/shutdown classification (×1)
  + tasks with task_signal = 'bored' (×0.5)

Normalize to 0-100 scale: min(max(score, 0), 100)
```

### Implementation
New utility: `src/lib/actionScore.js`
```javascript
export async function calculateActionScore(userId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

  const [courageRes, taskRes, checkinRes] = await Promise.all([
    supabase.from('quest_completions')
      .select('reflection_text')
      .eq('user_id', userId).eq('quest_category', 'Groans')
      .gte('created_at', thirtyDaysAgo)
      .not('reflection_text', 'is', null),
    supabase.from('quest_tasks')
      .select('task_signal')
      .eq('user_id', userId)
      .not('task_signal', 'is', null)
      .gte('completed_at', thirtyDaysAgo),
    supabase.from('nervous_system_checkins')
      .select('after_state')
      .eq('user_id', userId).eq('checkin_type', 'daily')
      .gte('created_at', thirtyDaysAgo),
  ])

  let score = 0

  // Courage outcomes
  ;(courageRes.data || []).forEach(row => {
    try {
      const { wahoo_classification } = JSON.parse(row.reflection_text)
      if (['vibe', 'wahoo', 'peace'].includes(wahoo_classification)) score += 2
      else if (['anxious', 'shutdown'].includes(wahoo_classification)) score -= 1
    } catch {}
  })

  // Task signals
  ;(taskRes.data || []).forEach(t => {
    if (t.task_signal === 'lit_me_up') score += 1
    else if (t.task_signal === 'bored') score -= 0.5
  })

  // Daily check-ins
  ;(checkinRes.data || []).forEach(c => {
    if (['vibe_rise', 'ventral'].includes(c.after_state)) score += 0.5
  })

  // Normalize 0-100 (cap at 50 raw points = 100%)
  return Math.min(Math.max(Math.round((score / 50) * 100), 0), 100)
}
```

### Display
Add to JourneyTab alongside Clarity %:
```jsx
<div className="jt-scores-row">
  <div className="jt-score-card">
    <div className="jt-score-number">{actionScore}</div>
    <div className="jt-score-label">Action</div>
  </div>
  <div className="jt-score-card">
    <div className="jt-score-number">{clarityPct}%</div>
    <div className="jt-score-label">Clarity</div>
  </div>
</div>
```

### Files to change
| File | Change |
|------|--------|
| `src/lib/actionScore.js` | NEW utility |
| `src/components/JourneyTab.jsx` | Calculate + display Action Score alongside Clarity |

### DB changes
None. All data already exists.

---

## Sprint 12: Cross-pollination to Clarity

### What
Convergence signal (quests feeding each other) as a Clarity multiplier.

### Formula
```
convergence_bonus = unique_cross_pollination_pairs / total_active_quests
// 3 pairs across 3 quests = 1.0
// 1 pair across 5 quests = 0.2

Clarity (adjusted) = base_clarity × (1 + convergence_bonus × 0.1)
// Max 10% boost from convergence
```

### Implementation
Add to Clarity calculation in JourneyTab and MirrorPage:
```javascript
// After base clarity calc
const { data: crossPoll } = await supabase
  .from('quest_cross_pollination')
  .select('source_quest_id, target_quest_id')
  .eq('user_id', userId)
const uniquePairs = new Set(
  (crossPoll || []).map(cp => [cp.source_quest_id, cp.target_quest_id].sort().join('-'))
)
const convergenceBonus = activeQuestCount > 0
  ? Math.min(uniquePairs.size / activeQuestCount, 1)
  : 0
const adjustedClarity = Math.min(Math.round(baseClarity * (1 + convergenceBonus * 0.1)), 100)
```

### Files to change
| File | Change |
|------|--------|
| `src/components/JourneyTab.jsx` | Add cross-poll query to batch, apply convergence to Clarity |
| `src/pages/MirrorPage.jsx` | Same adjustment |

### DB changes
None.

---

## Sprint 13: Skill Tree UI on /mirror

### What
Visual display of skill progress (L0-L4) on the Mirror page. Data already collecting via `user_skill_progress` table.

### UI design
Below clusters, above Clarity hero:
```jsx
<div className="mp-section">
  <h3 className="mp-section-title" style={{ color: '#5e17eb' }}>Your Skills</h3>
  {skillProgress.map(skill => (
    <div className="mp-skill-row">
      <span className="mp-skill-name">{SKILL_LABELS[skill.skill_id]}</span>
      <div className="mp-skill-track">
        <div className="mp-skill-fill" style={{ width: `${(skill.xp / 25) * 100}%` }} />
      </div>
      <span className="mp-skill-level">{skill.level}</span>
    </div>
  ))}
</div>
```

XP thresholds displayed as markers on the progress bar: L1 at 3, L2 at 8, L3 at 15, L4 at 25.

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
const { data: justHit5 } = await supabase
  .from('nikigai_clusters')
  .select('id')
  .eq('user_id', userId)
  .eq('behavioral_evidence', 5)
  .eq('is_removed', false)
  .limit(1)

if (justHit5?.length > 0) {
  // Send push notification
  import('../lib/pushNotifications').then(m =>
    m.sendLocalNotification(userId, {
      title: 'Your mirror has new evidence',
      body: 'Your challenges are showing who you're becoming. Check in.',
      url: '/mirror',
    })
  )
}
```

### Files to change
| File | Change |
|------|--------|
| `src/components/GroanCompletionModal.jsx` | After behavioral_evidence increment (~line 315), check for threshold hit, send notification |

### DB changes
None.

---

## Build order

```
Sprint 7  (NS state swap)     — do FIRST, everything downstream uses this
Sprint 10 (Weekly review)     — independent, quick win
Sprint 8  (Re-gen edge func)  — needs Sprint 7 for re-rate UI
Sprint 9  (Zarlo/Figurine)    — needs Sprint 7 for Clarity data
Sprint 11 (Action Score)      — independent, enables Zone Detection later
Sprint 12 (Cross-pollination) — small, independent
Sprint 13 (Skill tree UI)     — independent
Sprint 14 (Push notification) — needs Sprint 8
```

Sprints 10, 11, 12, 13 can run in parallel.
Sprint 7 must be first. Sprint 8 depends on 7. Sprint 14 depends on 8.
