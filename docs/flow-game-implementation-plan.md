# Flow Game — Implementation Plan

> **Context:** This plan comes from a design review of "The Flow Game System" (a 6-tier skill tree model) against the existing Vibe Rise app. The user approved building T0 features immediately and designing T1a/T4. This doc captures everything the implementing agent needs.
>
> **Source doc:** `/Users/nichuzz/Downloads/fantasy/the-flow-game-system.md`
> **Obsidian notes:** `Frameworks/The Flow Game System.md`, `Decisions/2026-06-09 Flow Game Tier Assessment.md`, `Product/Prediction Log Design.md`
> **Psychological safety research (saved to Obsidian):** `Concepts/Psychological Safety & the Nervous System.md`

---

## Build Order

| Priority | Feature | Tier | Status |
|----------|---------|------|--------|
| **1** | Exercise suggestions after drain/stall logging | T0 | **Ready to build** |
| **2** | "Recovered?" button + recovery tracking | T0 | **Ready to build** |
| **3** | Prediction Log in daily check-in | T1a | Designed, not started |
| **4** | Weekly Review (T4 multipliers) | T4 | Designed, not started |
| **5** | Shareable metric card | T1b | Concept only |

---

## Feature 1: Exercise Suggestions After Drain/Stall Save (T0)

### What
After a user logs a drain or stall in TuneTab, show a RegulationCard overlay with state-appropriate exercises. Same UX as the daily check-in's regulation step.

### Why
Currently drains/stalls are logged and forgotten. The daily check-in already shows regulation exercises for dysregulated states — this extends that pattern to the moment of logging, when the user actually needs help.

### Key Files
- `src/components/TuneTab.jsx` — Main file to modify
- `src/components/RegulationCard.jsx` — Existing component, reuse as-is
- `src/lib/nervousSystemConstants.js` — Has `REGULATION_EXERCISES` by state
- `src/components/DailyCheckin.jsx` — Reference for the UX pattern

### Implementation

**1. Add imports to TuneTab.jsx:**
```javascript
import RegulationCard from './RegulationCard'
import { REGULATION_EXERCISES } from '../lib/nervousSystemConstants'
```

**2. Add state variable:**
```javascript
const [regulationState, setRegulationState] = useState(null)
```

**3. Modify `handleSaveDrain` (line ~482):**
Capture the drain state before resetting form, then show RegulationCard:
```javascript
const handleSaveDrain = async () => {
    if (!drainCategory || !drainState || savingDrain) return
    setSavingDrain(true)
    const savedState = drainState  // ← capture before reset

    try {
      // ... existing insert code stays the same ...

      hapticSuccess()
      setCapacityRefresh(n => n + 1)
      setDrainCategory(null)
      setDrainNote('')
      setDrainState(null)
      setShowDrainForm(false)
      setRegulationState(savedState)  // ← show regulation overlay

      // ... existing refresh code stays the same ...
```

**4. Modify `handleSaveStall` (line ~525) — same pattern:**
```javascript
const handleSaveStall = async () => {
    if (!stallCategory || !stallState || !stallVoice || savingStall) return
    setSavingStall(true)
    const savedState = stallState  // ← capture before reset

    try {
      // ... existing insert code ...

      hapticSuccess()
      setCapacityRefresh(n => n + 1)
      setStallCategory(null)
      setStallNote('')
      setStallState(null)
      setStallVoice(null)
      setShowStallForm(false)
      setRegulationState(savedState)  // ← show regulation overlay

      // ... existing refresh code ...
```

**5. Add overlay render (before closing `</div>` of tune-tab, around line 1101):**
```jsx
{/* Regulation overlay after drain/stall save */}
{regulationState && (
  <div className="tt-info-overlay" onClick={() => setRegulationState(null)}>
    <div className="tt-info-modal tt-regulation-modal" onClick={e => e.stopPropagation()}>
      <RegulationCard
        state={regulationState}
        onDone={() => setRegulationState(null)}
        onSkip={() => setRegulationState(null)}
      />
    </div>
  </div>
)}
```

**6. Add CSS to TuneTab.css:**
```css
/* Regulation overlay — reuses tt-info-overlay + tt-info-modal */
.tt-regulation-modal {
  padding: 0;
  max-width: 380px;
}

.tt-regulation-modal .regulation-card {
  padding: 24px;
}
```

### UX Flow
1. User fills drain/stall form → taps "Log Drain" / "Log Stall"
2. Form saves, resets, closes
3. RegulationCard overlay appears (same component as daily check-in)
4. User picks an exercise or skips
5. Overlay dismisses

### Consistency Note
Drains logged via DailyCheckin already flow into a RegulationCard inside that overlay (DailyCheckin.jsx step 3). This feature makes TuneTab-logged drains behave the same way, so the two entry points are now consistent. Do NOT add a second RegulationCard for check-in drains.

`REGULATION_EXERCISES` shape (verified in `nervousSystemConstants.js`): `{ [state]: { label, subtitle, exercises: [{ id, name, instruction, duration }] } }`. The accessor `REGULATION_EXERCISES[state]?.exercises` is correct.

---

## Feature 2: "Recovered?" Button + Recovery Tracking (T0)

### What
On each drain/stall tile in the recent list, show a "Recovered?" button. Tapping opens a popup showing elapsed time + exercise picker. Saves recovery timestamp and activities used.

### Why
The Flow Game spec says T0's best signal is "how fast you return to baseline after a hit, not how calm you are when nothing's wrong." This captures recovery time automatically.

### Database Migration

Create `supabase/migrations/20260611065850_recovery_tracking.sql` (DONE — applied to remote; local filename matches the remote-recorded version so `db push` skips it):
```sql
-- Add recovery tracking to nervous system checkins
ALTER TABLE nervous_system_checkins
ADD COLUMN IF NOT EXISTS recovered_at timestamptz,
ADD COLUMN IF NOT EXISTS recovery_activities text[];

-- Index for querying unrecovered checkins
CREATE INDEX IF NOT EXISTS idx_nsc_unrecovered
ON nervous_system_checkins (user_id, checkin_type, recovered_at)
WHERE recovered_at IS NULL AND checkin_type IN ('drain', 'stall');

-- CRITICAL: the table only has INSERT + SELECT policies
-- (see 20260429200000_nervous_system_checkins.sql). Recovery is the first
-- client-side UPDATE on this table. Without this policy the update
-- silently affects 0 rows and no error is returned.
CREATE POLICY "Users can update own checkins"
  ON nervous_system_checkins FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Key Files
- `src/components/TuneTab.jsx` — Main modifications
- `src/components/TuneTab.css` — New styles
- `src/lib/nervousSystemConstants.js` — REGULATION_EXERCISES for the activity picker

### Implementation

**1. Update data fetch queries in TuneTab.jsx (inside Promise.all, line ~145):**

Drain query — add `id` and `recovered_at`:
```javascript
.select('id, source_quest_id, after_state, drain_note, created_at, recovered_at')
```

Stall query — add `id` and `recovered_at`:
```javascript
.select('id, source_quest_id, after_state, drain_note, protective_voice, created_at, recovered_at')
```

**2. Add state variables:**
```javascript
// Recovery tracking
const [recoveryItem, setRecoveryItem] = useState(null)
const [recoveryActivities, setRecoveryActivities] = useState([])
const [recoveryOther, setRecoveryOther] = useState('') // free-text "what else helped?"
const [savingRecovery, setSavingRecovery] = useState(false)
```

**3. Add helper functions:**
```javascript
const formatElapsed = (createdAt) => {
  const mins = Math.round((Date.now() - new Date(createdAt).getTime()) / 60000)
  if (mins < 60) return `${mins}min`
  const hrs = Math.floor(mins / 60)
  const remainMins = mins % 60
  return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`
}

const formatRecoveryTime = (createdAt, recoveredAt) => {
  const mins = Math.round((new Date(recoveredAt).getTime() - new Date(createdAt).getTime()) / 60000)
  if (mins < 60) return `${mins}min`
  const hrs = Math.floor(mins / 60)
  const remainMins = mins % 60
  return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`
}

// Recovery is only trackable same-day. Sleep is the natural reset, so an
// unrecovered item from a previous day shows neither button nor badge
// (recovered_at stays NULL = "unknown", excluded from averages).
// This also solves stale "Recovered?" buttons on week-old items.
const isToday = (createdAt) => {
  const d = new Date(createdAt)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
}
```

**4. Add recovery save handler:**
```javascript
const handleSaveRecovery = async () => {
  if (!recoveryItem || savingRecovery) return
  setSavingRecovery(true)
  const recoveredAt = new Date().toISOString() // single timestamp for DB + local state
  const activities = [
    ...recoveryActivities,
    ...(recoveryOther.trim() ? [`other:${recoveryOther.trim()}`] : []),
  ]
  try {
    const { error } = await supabase
      .from('nervous_system_checkins')
      .update({
        recovered_at: recoveredAt,
        recovery_activities: activities.length > 0 ? activities : null,
      })
      .eq('id', recoveryItem.id)
    if (error) throw error
    hapticSuccess()
    const updater = (list) => list.map(item =>
      item.id === recoveryItem.id ? { ...item, recovered_at: recoveredAt } : item
    )
    // Only update the list the item belongs to
    if (recoveryItem.type === 'drain') setRecentDrains(updater)
    else setRecentStalls(updater)
    setRecoveryItem(null)
    setRecoveryActivities([])
    setRecoveryOther('')
  } catch (err) {
    console.error('Recovery save error:', err)
  } finally {
    setSavingRecovery(false)
  }
}
```

**5. Modify drain tile rendering (line ~916):**

Keep the existing state emoji (at-a-glance Activated vs Shutdown info) and ADD the recovery element after it. Do not replace the emoji:
```jsx
{recentDrains.slice(0, 5).map((drain, i) => {
  const cat = DRAIN_CATEGORIES.find(c => c.id === drain.source_quest_id)
  return (
    <div key={drain.id || i} className="tt-drain-item">
      <span className="tt-drain-item-icon">{cat?.icon || '⚡'}</span>
      <div className="tt-drain-item-body">
        <span className="tt-drain-item-cat">{cat?.label || 'Drain'}</span>
        {drain.drain_note && <span className="tt-drain-item-note">{drain.drain_note}</span>}
      </div>
      <span className="tt-drain-item-state">{drain.after_state === 'dorsal' ? '😶' : '😬'}</span>
      {drain.recovered_at ? (
        <span className="tt-recovered-badge">✓ {formatRecoveryTime(drain.created_at, drain.recovered_at)}</span>
      ) : isToday(drain.created_at) ? (
        <button
          className="tt-recover-btn"
          onClick={() => { hapticLight(); setRecoveryItem({ ...drain, type: 'drain' }) }}
        >
          Recovered?
        </button>
      ) : null}
    </div>
  )
})}
```
Note: match the actual existing tile markup when editing. If the current tile already renders the state emoji with a different class, keep that class and just insert the recovery element alongside it.

**6. Modify stall tile rendering (line ~1040) — same pattern:**
```jsx
{recentStalls.slice(0, 5).map((stall, i) => {
  const cat = STALL_CATEGORIES.find(c => c.id === stall.source_quest_id)
  return (
    <div key={stall.id || i} className="tt-drain-item">
      <span className="tt-drain-item-icon">{cat?.icon || '🧊'}</span>
      <div className="tt-drain-item-body">
        <span className="tt-drain-item-cat">{cat?.label || 'Stall'}{stall.protective_voice ? ` · ${stall.protective_voice}` : ''}</span>
        {stall.drain_note && <span className="tt-drain-item-note">{stall.drain_note}</span>}
      </div>
      <span className="tt-drain-item-state">{stall.after_state === 'dorsal' ? '😶' : '😬'}</span>
      {stall.recovered_at ? (
        <span className="tt-recovered-badge">✓ {formatRecoveryTime(stall.created_at, stall.recovered_at)}</span>
      ) : isToday(stall.created_at) ? (
        <button
          className="tt-recover-btn"
          onClick={() => { hapticLight(); setRecoveryItem({ ...stall, type: 'stall' }) }}
        >
          Recovered?
        </button>
      ) : null}
    </div>
  )
})}
```

**7. Add recovery popup render (before closing `</div>`, after regulation overlay):**
```jsx
{/* Recovery tracking popup */}
{recoveryItem && (
  <div className="tt-info-overlay" onClick={() => { setRecoveryItem(null); setRecoveryActivities([]); setRecoveryOther('') }}>
    <div className="tt-info-modal tt-recovery-modal" onClick={e => e.stopPropagation()}>
      <span className="tt-recovery-emoji">
        {recoveryItem.after_state === 'dorsal' ? '😶' : '😬'}
      </span>
      <h3 className="tt-recovery-title">Back to baseline?</h3>
      <p className="tt-recovery-time">⏱ {formatElapsed(recoveryItem.created_at)} since logged</p>
      <p className="tt-recovery-sub">What brought you back?</p>
      <div className="tt-recovery-activities">
        {(REGULATION_EXERCISES[recoveryItem.after_state]?.exercises || []).map(ex => (
          <button
            key={ex.id}
            type="button"
            className={`tt-recovery-activity ${recoveryActivities.includes(ex.id) ? 'selected' : ''}`}
            onClick={() => setRecoveryActivities(prev =>
              prev.includes(ex.id) ? prev.filter(a => a !== ex.id) : [...prev, ex.id]
            )}
          >
            {ex.name}
          </button>
        ))}
      </div>
      <input
        type="text"
        className="tt-recovery-other"
        placeholder="Something else? (walk, friend, food...)"
        value={recoveryOther}
        onChange={e => setRecoveryOther(e.target.value)}
        maxLength={80}
      />
      <button
        type="button"
        className="tt-recovery-save"
        disabled={savingRecovery}
        onClick={handleSaveRecovery}
      >
        {savingRecovery ? 'Saving...' : "I'm back ✓"}
      </button>
    </div>
  </div>
)}
```

Real-world activities matter as much as app exercises (a walk, a call, food). The free-text input captures these as `other:<text>` in `recovery_activities`. Activities are optional — "I'm back ✓" works with nothing selected.

**7b. Payoff surface — average recovery time (the whole point of this feature):**

The Flow Game spec calls recovery time "T0's best signal." Capturing it without displaying it is half a feature. Add a small stat next to the Drains section count (line ~833):

```jsx
{(() => {
  const recovered = [...recentDrains, ...recentStalls].filter(d => d.recovered_at)
  if (recovered.length === 0) return null
  const avgMins = Math.round(recovered.reduce((sum, d) =>
    sum + (new Date(d.recovered_at) - new Date(d.created_at)) / 60000, 0) / recovered.length)
  const label = avgMins < 60 ? `${avgMins}min` : `${Math.floor(avgMins / 60)}h ${avgMins % 60}m`
  return <span className="tt-section-count tt-recovery-avg">⏱ {label} avg recovery</span>
})()}
```

Extract to a memoized value if preferred. Future iteration: weekly trend on CapacityCard ("Recovery: 42min avg, ↓12min vs last week") — out of scope for this build but the data now exists.

**8. CSS additions for TuneTab.css:**
```css
/* === REGULATION OVERLAY (post drain/stall) === */
.tt-regulation-modal {
  padding: 0;
  max-width: 380px;
}

.tt-regulation-modal .regulation-card {
  padding: 24px;
}

/* === RECOVERY TRACKING === */
.tt-recover-btn {
  padding: 4px 10px;
  background: transparent;
  border: 1.5px solid #e9ecef;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #6c757d;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  flex-shrink: 0;
}

.tt-recover-btn:hover {
  border-color: #10b981;
  color: #10b981;
  background: rgba(16, 185, 129, 0.04);
}

.tt-recovered-badge {
  font-size: 11px;
  font-weight: 700;
  color: #10b981;
  flex-shrink: 0;
}

.tt-recovery-modal {
  text-align: center;
}

.tt-recovery-emoji {
  font-size: 2rem;
  display: block;
  margin-bottom: 8px;
}

.tt-recovery-title {
  font-size: 18px;
  font-weight: 800;
  color: #1a1a2e;
  margin: 0 0 4px;
}

.tt-recovery-time {
  font-size: 14px;
  color: #6c757d;
  margin: 0 0 12px;
}

.tt-recovery-sub {
  font-size: 13px;
  font-weight: 700;
  color: #495057;
  margin: 0 0 10px;
}

.tt-recovery-activities {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}

.tt-recovery-activity {
  padding: 8px 14px;
  border-radius: 100px;
  border: 2px solid #e9ecef;
  background: #ffffff;
  font-size: 13px;
  font-weight: 700;
  color: #6c757d;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.tt-recovery-activity.selected {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.06);
  color: #10b981;
}

.tt-recovery-other {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 13px;
  font-family: inherit;
  color: #1a1a2e;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.tt-recovery-other:focus {
  outline: none;
  border-color: #10b981;
}

.tt-recovery-avg {
  color: #10b981;
}

.tt-drain-item-state {
  font-size: 14px;
  flex-shrink: 0;
}

.tt-recovery-save {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.tt-recovery-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.tt-recovery-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

---

## Feature 3: Prediction Log (T1a) — Design Only

### What
Extend the daily check-in with a before/after prediction mechanic. Morning: predict today (Flow/Neutral/Drain). Next morning: record yesterday's actual outcome. Calibration accuracy = self-knowledge score.

### Key Design Decisions
- Lives INSIDE the daily check-in (not a separate feature)
- One extra tap per day, skippable
- Ask "What's one thing today with the most flow potential?" not "How will today go?" (solves 9-5 auto-pilot problem)
- Calibration score surfaces on Level tab: "Self-Knowledge: 62% calibrated (↑4% this week)"
- Zarlo reads pattern data for blind spot insights

### Data Model
```sql
CREATE TABLE predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  activity_type text, -- 'wahoo' | 'practice' | 'healing' | 'social' | 'work' | 'custom'
  activity_description text,
  predicted_outcome text NOT NULL, -- 'flow' | 'neutral' | 'drain'
  confidence integer DEFAULT 75, -- 50-100
  actual_outcome text, -- filled next day
  calibration_hit boolean, -- computed: predicted == actual
  context_state text, -- user's NS state at prediction time
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_predictions_user_date ON predictions (user_id, date DESC);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own predictions"
  ON predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own predictions"
  ON predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own predictions"
  ON predictions FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- UPDATE needed: actual_outcome + calibration_hit are filled the next morning
```

### UX Flow
**Morning (after existing state check-in):**
1. "How are you feeling?" → 4-state tap (existing)
2. NEW: "What's your prediction for today?" → [Flow] [Neutral] [Drain]
3. (Optional) "What's the main thing today?" → free text

**Next morning (before today's check-in):**
1. NEW: "You predicted: Flow. How did it actually land?" → [Flow] [Neutral] [Drain]
2. Then normal check-in begins

### Files to Modify
- `src/components/DailyCheckin.jsx` — Add prediction steps
- `src/components/DailyCheckin.css` — Prediction step styles
- New migration for predictions table

---

## Feature 4: Weekly Review — T4 Multipliers

### What
8-question weekly review (~90 seconds) that produces a shareable card. Covers all T4 multipliers: Environment, Network, Bet-Sizing, Identity, Compounding, Learning, Attention, Runway.

### Key Design Decisions
- Triggers Sunday/Monday (prompt, not forced)
- 15 RP for completion, +5 RP for sharing
- Does NOT affect Capacity Score (RP only)
- Shareable card with visual layout

### Questions (approved)
1. **Environment** — "Was the right move the easy move this week?" [Yes/Mostly/No]
2. **Network** — "Name one person you helped or asked for help" [free text]
3. **Bet-Sizing** — "What did I ship or experiment with?" [free text]
4. **Identity** — "Did I do something 'not like me' on purpose?" [Yes/No] + what?
5. **Compounding** — "Did I stay consistent on the boring thing?" [Yes/No] + which?
6. **Learning** — "What can I do now that I couldn't last Monday?" [free text]
7. **Attention** — "Longest deep work block this week?" [number] hours
8. **Runway** — "Months of runway right now?" [number]

### Shareable Card Layout
```
┌─────────────────────────────────┐
│  WEEKLY MULTIPLIERS             │
│  Week of Jun 9                  │
│                                 │
│  🗺️ Environment    ████████░░  │
│  🤝 Network        shipped ask  │
│  🎲 Bet-Sizing     "launched    │
│                     waitlist"   │
│  🪞 Identity       new thing ✓  │
│  📈 Compounding    streak: 23   │
│  ⚡ Learning       Cursor (4d)  │
│  🎯 Attention      3.5hr block  │
│  🏦 Runway         8 months     │
│                                 │
│  Capacity: 78  ·  Vibe Rise    │
└─────────────────────────────────┘
```

### Files to Create
- `src/components/WeeklyReview.jsx` — Review wizard component
- `src/components/WeeklyReview.css` — Styles
- `src/components/WeeklyReviewCard.jsx` — Shareable card
- New migration for weekly_reviews table

### Data Model
```sql
CREATE TABLE weekly_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  week_start date NOT NULL,
  environment text, -- 'yes' | 'mostly' | 'no'
  network_text text,
  bet_sizing_text text,
  identity_did boolean,
  identity_text text,
  compounding_did boolean,
  compounding_text text,
  learning_text text,
  attention_hours numeric,
  runway_months numeric,
  points_earned integer DEFAULT 15,
  shared boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE weekly_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own weekly reviews"
  ON weekly_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own weekly reviews"
  ON weekly_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own weekly reviews"
  ON weekly_reviews FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- UPDATE needed: shared flag flips after the card is shared (+5 RP)
```

---

## Shareable Metric (T1b) — Concept

**Nike Run Club equivalent for Vibe Rise:**

| Nike Run Club | Vibe Rise |
|---|---|
| Total km | **Total Wahoos** (lifetime, across create/connection/appearance) |
| Pace (min/km) | **Capacity Score** (0-100) |
| Current streak | **Streak** (forgiving, already built) |
| Zone | **Zone** (Stuck/Wired/Grounded/Vibe Rise) |

Shareable card: **"247 Wahoos — Capacity 78 — Vibe Rise Zone — 23 day streak"**

Three Wahoo categories (create, connection, appearance) show as breakdown.

---

## Architecture Notes

### Existing Patterns to Follow
- **CSS scoping:** TuneTab uses `tt-` prefix, reuses `ht-` row styles from Challenge.css
- **Database saves:** Best-effort (non-blocking), refresh local state after save
- **Score increments:** Use `supabase.rpc('increment_scores', {...})` then `setCapacityRefresh(n => n + 1)`
- **Haptics:** `hapticLight()` on tap, `hapticSuccess()` on save
- **Celebrations:** `confetti({...})` on completions
- **Overlays:** Reuse `tt-info-overlay` + `tt-info-modal` pattern

### Key Constants
- `REGULATION_EXERCISES` in `src/lib/nervousSystemConstants.js` — exercises by state
- `NERVOUS_SYSTEM_STATES` — 4 states: vibe_rise, ventral, sympathetic, dorsal
- `DRAIN_CATEGORIES` / `STALL_CATEGORIES` — 5 categories each (work, people, environment, content, commitment)
- `VOICES_BY_STATE` — protective voices by NS state

### Capacity Score Formula (reference)
```
Safety = min(10, max(0, 3 + (safety_points - stalls) / 5))
Expression = min(10, max(0, 3 + (expression_points - drains) / 5))
Capacity = Safety × Expression × (0.5 + maintenancePct/100 × 0.5)
Zones: 0-25 Stuck, 25-50 Wired, 50-75 Grounded, 75-100 Vibe Rise
```

Capacity Score does NOT include T4 multiplier RP. Keep it pure as T0 health meter.

---

## Verification (Features 1 + 2)

Before considering the build done:

**Build check**
- [ ] `npm run build` passes with no errors
- [ ] Migration applies cleanly: `npm run db:push` (or `supabase db push`)

**Feature 1 — Regulation after drain/stall**
- [ ] Log a drain (Activated) → RegulationCard overlay appears with sympathetic exercises
- [ ] Log a drain (Shutdown) → dorsal exercises appear
- [ ] Log a stall → same behavior
- [ ] Tapping outside, "Done", and "Skip" all dismiss the overlay
- [ ] Drain still saves and capacity refreshes if the overlay is dismissed immediately
- [ ] Daily check-in drain flow is unchanged (it has its own RegulationCard)

**Feature 2 — Recovery tracking**
- [ ] Fresh drain tile shows "Recovered?" button (and keeps state emoji)
- [ ] Popup shows correct elapsed time + state-appropriate exercise chips
- [ ] Saving with no activities selected works
- [ ] Saving with chips + free-text works; check `recovery_activities` array in DB
- [ ] Tile flips to "✓ {time}" badge without page reload
- [ ] Recovery persists across reload (proves the UPDATE RLS policy works — this is the #1 silent-failure risk)
- [ ] Tapping "Recovered?" twice fast doesn't double-save (savingRecovery guard)
- [ ] Yesterday's unrecovered drain shows NO button and NO badge (same-day rule)
- [ ] Avg recovery stat appears next to Drains count once ≥1 item is recovered

**Edge cases**
- [ ] Drain logged via daily check-in appears in TuneTab list and is recoverable
- [ ] Stall recovery only updates the stalls list, drain recovery only the drains list
