# Match Card Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Match Card step to courage challenge creation (framing challenges as Character vs Voice rivalries) and replace the Paths tab WeeklyFocus radio picker with swipeable Match Cards.

**Architecture:** New `MatchCard.jsx` component renders a single courage challenge as a wrestling-style match card showing archetype vs voice, dimensions, win count, grandkids test, and stakes line. Used in two places: (1) WahooCreator Step 5 (pre-submit preview with grandkids test), (2) Paths tab replacing WeeklyFocus with a swipeable carousel. Shared voice definitions extracted to `src/data/voiceDefinitions.js`. Data layer adds `grandkids_test` column to `groan_challenges` and a win-count query helper.

**Key design decision:** MatchCard is a PRE-SUBMIT step (Step 5), not a post-submit success screen replacement. This means `grandkids_test` is saved with the initial `createGroanChallenge()` call (no separate UPDATE needed), and all 4 existing WahooCreator call sites work unchanged (no callback timing changes).

**Tech Stack:** React 18, Supabase (PostgreSQL), CSS (no animation library), touch swipe via CSS scroll-snap.

**Spec:** Conversation-defined spec from Sep 14 WWE Character Engine session + Sep 26 refinements. Obsidian reference: `Frameworks/WWE Character Engine.md` section 3 (The Match Card).

## Global Constraints

- Light theme only. Never dark backgrounds. Match `#f5f5f0` or white. Brand purple (#5e17eb) / gold (#E9A23B) for accents.
- CSS scoped to parent prefix: `.mc-` for MatchCard, `.mcc-` for MatchCardCarousel.
- Write so a 12-year-old would understand. No jargon.
- Never use em dashes in user-facing copy.
- Always import dimensions from `src/data/domeDimensions.js`, never redefine inline.
- Fixed bottom buttons: `left: 50%; transform: translateX(-50%); max-width: 480px; padding-bottom: env(safe-area-inset-bottom)`.
- Use `src/styles/flow-base.css` patterns before inventing new styles.

---

### Task 1: Database Migration + Shared Data + Utilities

**Files:**
- Create: `supabase/migrations/20260926000002_add_grandkids_test.sql`
- Create: `src/data/voiceDefinitions.js`
- Create: `src/lib/matchCardUtils.js`
- Modify: `src/components/WahooCreator.jsx` (import voices from shared source)

**Interfaces:**
- Consumes: `DOME_DIMENSIONS` from `src/data/domeDimensions.js`
- Produces:
  - `VOICES` map from `src/data/voiceDefinitions.js` — `{ ghost: { id, icon, name, lie }, ... }`
  - `VOICE_LIST` array from `src/data/voiceDefinitions.js` — ordered array for UI rendering
  - `getStakesLine(title, dimensionValues)` → `string`
  - `getTopDimension(dimensionValues)` → `string|null`
  - `fetchVoiceWinCounts(userId)` → `Promise<{ [voice]: number, _total: number }>` (batched win counts for ALL voices + total)
  - DB column: `groan_challenges.grandkids_test boolean default null`

- [ ] **Step 1: Write the migration**

```sql
-- 20260926000002_add_grandkids_test.sql
-- Add grandkids_test boolean to groan_challenges for Match Card narrative layer
ALTER TABLE groan_challenges ADD COLUMN IF NOT EXISTS grandkids_test boolean DEFAULT null;
```

- [ ] **Step 2: Apply the migration**

Run: `npx supabase migration up` or apply via Supabase MCP `apply_migration`.

- [ ] **Step 3: Write voiceDefinitions.js**

```javascript
// src/data/voiceDefinitions.js
/**
 * Single source of truth for protective voice definitions.
 * Used by WahooCreator (creation), MatchCard (display), GroanCompletionModal (completion).
 */

export const VOICES = {
  ghost: { id: 'ghost', icon: '👻', name: 'Ghost', lie: "I want to disappear. Hide. Go quiet." },
  perfectionist: { id: 'perfectionist', icon: '🎭', name: 'Perfectionist', lie: "It's not good enough yet. I need more time." },
  people_pleaser: { id: 'people_pleaser', icon: '🪞', name: 'People Pleaser', lie: "I'd rather say yes than deal with their reaction." },
  controller: { id: 'controller', icon: '🎮', name: 'Controller', lie: "I want to know how this ends before I do it." },
  auto_pilot: { id: 'auto_pilot', icon: '🛋️', name: 'Auto-Pilot', lie: "I'm going through the motions. I've checked out." },
}

export const COMFORT_ZONE = { id: '_comfort_zone', icon: '🛡️', name: 'Comfort Zone', lie: "Stay where it's safe. You don't need to do this." }

// Ordered array for rendering in UI (WahooCreator Step 4)
export const VOICE_LIST = Object.values(VOICES)

/**
 * Get voice definition by ID, falling back to COMFORT_ZONE if not found.
 */
export function getVoice(voiceId) {
  return VOICES[voiceId] || COMFORT_ZONE
}
```

- [ ] **Step 4: Write matchCardUtils.js**

```javascript
// src/lib/matchCardUtils.js
import { DOME_DIMENSIONS } from '../data/domeDimensions'
import { supabase } from './supabaseClient'

const STAKES_TEMPLATES = {
  people: (title, value) =>
    `80-year-old you tells your grandkids about the night you ${title} in front of ${value} people.`,
  money: (title) =>
    `80-year-old you tells your grandkids about the night you ${title} and backed yourself with real money.`,
  vulnerability: (title) =>
    `80-year-old you tells your grandkids about the night you ${title} when every part of you wanted to hide.`,
  stakes: (title) =>
    `80-year-old you tells your grandkids about the night you ${title} with everything on the line.`,
  rarity: (title) =>
    `80-year-old you tells your grandkids about the night you ${title} when nobody else would.`,
  identity: (title) =>
    `80-year-old you tells your grandkids about the night you ${title} as someone you never thought you'd become.`,
  context: (title) =>
    `80-year-old you tells your grandkids about the night you ${title} in a world you'd never been in before.`,
  business_commitment: (title) =>
    `80-year-old you tells your grandkids about the night you ${title} betting everything on something you built.`,
}

/**
 * Find which dimension has the highest level relative to its max.
 * For numeric dims, converts to tier first.
 * Returns the dimension ID, or null if no dimensions.
 */
export function getTopDimension(dimensionValues) {
  if (!dimensionValues || Object.keys(dimensionValues).length === 0) return null

  let best = null
  let bestRatio = -1

  for (const [dimId, value] of Object.entries(dimensionValues)) {
    const dim = DOME_DIMENSIONS.find(d => d.id === dimId)
    if (!dim || value == null) continue

    let level = value
    if (dim.type === 'numeric') {
      level = 0
      for (let i = dim.tiers.length - 1; i >= 0; i--) {
        if (value >= dim.tiers[i]) { level = i + 1; break }
      }
    }

    const ratio = level / dim.maxLevel
    if (ratio > bestRatio) {
      bestRatio = ratio
      best = dimId
    }
  }

  return best
}

/**
 * Generate a stakes line for the grandkids test.
 * Uses the top dimension to pick the sentence template.
 * Falls back to a generic line if no dimensions selected.
 */
export function getStakesLine(title, dimensionValues) {
  const topDim = getTopDimension(dimensionValues)
  const cleanTitle = (title || '').toLowerCase().replace(/\.$/, '')

  if (!topDim) {
    return `80-year-old you tells your grandkids about the night you ${cleanTitle}.`
  }

  const template = STAKES_TEMPLATES[topDim]
  if (!template) {
    return `80-year-old you tells your grandkids about the night you ${cleanTitle}.`
  }

  if (topDim === 'people') {
    return template(cleanTitle, dimensionValues.people)
  }

  return template(cleanTitle)
}

/**
 * Batch-fetch win counts for ALL voices in one query.
 * Returns { ghost: 3, perfectionist: 1, ..., _total: 12 }
 * Used by MatchCardCarousel to avoid N+1 queries.
 */
export async function fetchVoiceWinCounts(userId) {
  if (!userId) return { _total: 0 }

  const { data, error } = await supabase
    .from('groan_challenges')
    .select('predicted_voice')
    .eq('user_id', userId)
    .eq('status', 'completed')

  if (error) {
    console.warn('fetchVoiceWinCounts error:', error)
    return { _total: 0 }
  }

  const counts = { _total: data?.length || 0 }
  ;(data || []).forEach(row => {
    const v = row.predicted_voice
    if (v) counts[v] = (counts[v] || 0) + 1
  })
  return counts
}
```

- [ ] **Step 5: Update WahooCreator to use shared voice definitions**

In `src/components/WahooCreator.jsx`, replace the inline VOICE_LIES array (lines 19-25):

```jsx
// OLD (remove):
const VOICE_LIES = [
  { voice: 'ghost', icon: '👻', lie: "I want to disappear. Hide. Go quiet." },
  { voice: 'perfectionist', icon: '🎭', lie: "It's not good enough yet. I need more time." },
  { voice: 'people_pleaser', icon: '🪞', lie: "I'd rather say yes than deal with their reaction." },
  { voice: 'controller', icon: '🎮', lie: "I want to know how this ends before I do it." },
  { voice: 'auto_pilot', icon: '🛋️', lie: "I'm going through the motions. I've checked out." },
]
```

Add import at top:
```jsx
import { VOICE_LIST } from '../data/voiceDefinitions'
```

Then find-and-replace `VOICE_LIES` → `VOICE_LIST` in the component. The VOICE_LIST entries use `{ id, icon, name, lie }` shape instead of `{ voice, icon, lie }`. Update the voice selection rendering (around line 669) to use `v.id` instead of `v.voice`:

```jsx
// In the voice selection buttons, change:
//   VOICE_LIES.map(v => ...v.voice...)
// to:
//   VOICE_LIST.map(v => ...v.id...)
```

Specifically, the `onClick` handler that sets `setProtectiveVoice(v.voice)` becomes `setProtectiveVoice(v.id)`, and the active check `protectiveVoice === v.voice` becomes `protectiveVoice === v.id`.

- [ ] **Step 6: Verify WahooCreator still works**

Run `npm run dev`, create a courage challenge. Voice selection should look and work identically.

- [ ] **Step 7: Commit**

```bash
git add supabase/migrations/20260926000002_add_grandkids_test.sql src/data/voiceDefinitions.js src/lib/matchCardUtils.js src/components/WahooCreator.jsx
git commit -m "feat: add grandkids_test column, shared voice definitions, match card utilities"
```

---

### Task 2: MatchCard Component

**Files:**
- Create: `src/components/MatchCard.jsx`
- Create: `src/components/MatchCard.css`

**Interfaces:**
- Consumes:
  - `getStakesLine(title, dimensionValues)` from `src/lib/matchCardUtils.js`
  - `getDimensionById` from `src/data/domeDimensions.js`
  - `getVoice, COMFORT_ZONE` from `src/data/voiceDefinitions.js`
- Produces:
  - `<MatchCard>` component with three modes:
    - `mode="creation"` — shows grandkids test buttons, calls `onGrandkidsAnswer(bool)`
    - `mode="paths"` — shows "I did it!" button + stakes line if grandkids=true, calls `onDidIt()`, `onHealingClick()`
    - `mode="carousel"` — card content only, no CTA buttons (used in swipeable picker)
  - Props: `{ challenge, questLabel, archetypeName, voiceWins, mode, onGrandkidsAnswer, onDidIt, onHealingClick }`
  - Note: `voiceWins` is a NUMBER passed in by the parent (not fetched internally). This avoids N+1 queries in carousel.

- [ ] **Step 1: Write MatchCard.jsx**

```jsx
// src/components/MatchCard.jsx
/**
 * MatchCard — frames a courage challenge as Character vs Voice.
 *
 * Three modes:
 *   mode="creation"  — pre-submit preview with grandkids test
 *   mode="paths"     — focused card with "I did it!" CTA
 *   mode="carousel"  — card content only, no CTA (for swipeable picker)
 *
 * voiceWins is passed in by parent to avoid per-card DB queries.
 *
 * CSS prefix: mc-
 */

import { useState } from 'react'
import { getDimensionById } from '../data/domeDimensions'
import { getVoice, COMFORT_ZONE } from '../data/voiceDefinitions'
import { getStakesLine } from '../lib/matchCardUtils'
import './MatchCard.css'

export default function MatchCard({
  challenge,       // { title, predicted_voice, dimension_values, expansion_dimensions, grandkids_test }
  questLabel,
  archetypeName,   // e.g. "Playful Alchemist"
  voiceWins,       // number — win count for this voice (or total if no voice)
  mode = 'creation', // 'creation' | 'paths' | 'carousel'
  onGrandkidsAnswer, // (bool) => void — creation mode only
  onDidIt,           // () => void — paths mode only
  onHealingClick,    // () => void — paths mode only
}) {
  const [showStakes, setShowStakes] = useState(false)

  const voice = challenge?.predicted_voice
  const opponent = voice ? getVoice(voice) : COMFORT_ZONE
  const title = challenge?.title || challenge?.challenge_text || ''
  const dimValues = challenge?.dimension_values || {}
  const dimIds = challenge?.expansion_dimensions || Object.keys(dimValues)

  const stakesLine = getStakesLine(title, dimValues)

  // Grandkids answer handler (creation mode)
  const handleGrandkids = (answer) => {
    if (answer) {
      setShowStakes(true)
      setTimeout(() => onGrandkidsAnswer?.(answer), 1200)
    } else {
      onGrandkidsAnswer?.(answer)
    }
  }

  // Dimension pills
  const dimPills = dimIds.map(id => {
    const dim = getDimensionById(id)
    if (!dim) return null
    const val = dimValues[id]
    let label = ''
    if (dim.type === 'numeric') {
      label = val != null ? val.toLocaleString() : ''
    } else {
      const lvl = dim.levels?.find(l => l.level === val)
      label = lvl?.label || ''
    }
    return { icon: dim.icon, label: dim.label, value: label }
  }).filter(Boolean)

  return (
    <div className={`mc-card ${challenge?.grandkids_test ? 'mc-grandkids' : ''}`}>
      {/* VS Header */}
      <div className="mc-vs-section">
        <div className="mc-character">
          <span className="mc-character-icon">🧪</span>
          <span className="mc-character-name">{archetypeName || 'You'}</span>
        </div>
        <div className="mc-vs">vs</div>
        <div className="mc-opponent">
          <span className="mc-opponent-icon">{opponent.icon}</span>
          <span className="mc-opponent-name">{opponent.name}</span>
        </div>
      </div>

      {/* Voice lie */}
      <div className="mc-lie">"{opponent.lie}"</div>

      {/* Challenge title */}
      <div className="mc-title">{title}</div>

      {/* Quest label */}
      {questLabel && <div className="mc-quest">{questLabel}</div>}

      {/* Dimension pills */}
      {dimPills.length > 0 && (
        <div className="mc-dims">
          {dimPills.map((d, i) => (
            <span key={i} className="mc-dim-pill">
              {d.icon} {d.value || d.label}
            </span>
          ))}
        </div>
      )}

      {/* Win count */}
      {voiceWins != null && (
        <div className="mc-record">
          <span className="mc-record-wins">
            Your wins{voice ? ` vs ${opponent.name}` : ''}: {voiceWins} {voiceWins > 0 ? '🔥' : ''}
          </span>
        </div>
      )}

      {/* Stakes line (shown after grandkids=yes in creation, or if saved grandkids_test=true in paths/carousel) */}
      {(showStakes || ((mode === 'paths' || mode === 'carousel') && challenge?.grandkids_test)) && (
        <div className="mc-stakes">{stakesLine}</div>
      )}

      {/* CTA area — hidden in carousel mode */}
      {mode === 'creation' && !showStakes && (
        <div className="mc-cta-section">
          <div className="mc-grandkids-q">Would you tell your grandkids about this?</div>
          <div className="mc-grandkids-btns">
            <button className="mc-btn mc-btn-yes" onClick={() => handleGrandkids(true)}>
              Hell yes
            </button>
            <button className="mc-btn mc-btn-no" onClick={() => handleGrandkids(false)}>
              Not this one
            </button>
          </div>
        </div>
      )}

      {mode === 'paths' && (
        <div className="mc-cta-section">
          <button className="mc-btn mc-btn-did-it" onClick={onDidIt}>
            I did it!
          </button>
          <button className="mc-healing-link" onClick={onHealingClick}>
            Feeling stuck? Explore what's blocking you
          </button>
        </div>
      )}

      {/* mode="carousel" renders no CTA — card content only, tap handled by parent */}
    </div>
  )
}
```

- [ ] **Step 2: Write MatchCard.css**

```css
/* MatchCard.css — Character vs Voice courage card */

.mc-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 22px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.mc-card.mc-grandkids {
  border-color: #E9A23B;
}

/* ── VS Header ── */
.mc-vs-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 14px;
}

.mc-character,
.mc-opponent {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.mc-character-icon,
.mc-opponent-icon {
  font-size: 28px;
  line-height: 1;
}

.mc-character-name {
  font-size: 12px;
  font-weight: 800;
  color: #5e17eb;
  text-align: center;
  max-width: 100px;
}

.mc-opponent-name {
  font-size: 12px;
  font-weight: 800;
  color: #6c757d;
  text-align: center;
  max-width: 100px;
}

.mc-vs {
  font-size: 11px;
  font-weight: 900;
  color: #d1d5db;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* ── Voice lie ── */
.mc-lie {
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
  text-align: center;
  margin-bottom: 14px;
  line-height: 1.4;
}

/* ── Challenge title ── */
.mc-title {
  font-size: 16px;
  font-weight: 800;
  color: #1a0b3d;
  text-align: center;
  line-height: 1.3;
  margin-bottom: 4px;
}

/* ── Quest label ── */
.mc-quest {
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
  text-align: center;
  margin-bottom: 12px;
}

/* ── Dimension pills ── */
.mc-dims {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-bottom: 12px;
}

.mc-dim-pill {
  font-size: 11px;
  font-weight: 600;
  color: #5e17eb;
  background: rgba(94, 23, 235, 0.06);
  padding: 4px 10px;
  border-radius: 20px;
  white-space: nowrap;
}

/* ── Win record ── */
.mc-record {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 12px;
  font-weight: 600;
}

.mc-record-wins {
  color: #E9A23B;
  font-weight: 800;
}

/* ── Stakes line ── */
.mc-stakes {
  font-size: 13px;
  color: #1a0b3d;
  font-weight: 600;
  font-style: italic;
  text-align: center;
  line-height: 1.4;
  padding: 12px 8px;
  margin-bottom: 10px;
  background: rgba(233, 162, 59, 0.06);
  border-radius: 12px;
}

/* ── CTA section ── */
.mc-cta-section {
  margin-top: 6px;
}

.mc-grandkids-q {
  font-size: 14px;
  font-weight: 700;
  color: #1a0b3d;
  text-align: center;
  margin-bottom: 10px;
}

.mc-grandkids-btns {
  display: flex;
  gap: 10px;
}

.mc-btn {
  flex: 1;
  padding: 13px 14px;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.12s, box-shadow 0.12s;
}

.mc-btn:active {
  transform: scale(0.97);
}

.mc-btn-yes {
  background: linear-gradient(135deg, #5e17eb 0%, #E9A23B 160%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(94, 23, 235, 0.18);
}

.mc-btn-no {
  background: #f5f5f0;
  color: #6c757d;
}

.mc-btn-did-it {
  width: 100%;
  background: linear-gradient(135deg, #5e17eb 0%, #E9A23B 160%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(94, 23, 235, 0.18);
}

.mc-healing-link {
  display: block;
  width: 100%;
  margin-top: 10px;
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 0;
  text-align: center;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
}

.mc-healing-link:active {
  color: #5e17eb;
}
```

- [ ] **Step 3: Verify component renders**

Add a temporary render in any visible page with mock data. Confirm: VS header, lie quote, title, quest label, dim pills, win count ("Your wins vs Ghost: 4 🔥"), grandkids question with two buttons. Test all three modes. Remove temp render after.

- [ ] **Step 4: Commit**

```bash
git add src/components/MatchCard.jsx src/components/MatchCard.css
git commit -m "feat: add MatchCard component with creation, paths, and carousel modes"
```

---

### Task 3: Wire MatchCard into WahooCreator as Step 5 (Pre-Submit)

**Files:**
- Modify: `src/components/WahooCreator.jsx`

**Interfaces:**
- Consumes:
  - `<MatchCard>` from `src/components/MatchCard.jsx`
  - `getEssenceDisplayName(profile)` from `src/lib/essencePreferences.js`
  - `fetchVoiceWinCounts(userId)` from `src/lib/matchCardUtils.js`
  - `supabase` for fetching archetype name
- Produces: WahooCreator now has a 5th step showing the MatchCard preview before submit. User answers grandkids test → submit fires automatically → normal success screen → `onWahooAccepted` and `onClose` fire as before. No changes to callback timing. `grandkids_test` is passed into `createGroanChallenge()` with the rest of the data.

- [ ] **Step 1: Add imports and state**

At the top of `WahooCreator.jsx`, add to imports:

```jsx
import MatchCard from './MatchCard'
import { getEssenceDisplayName } from '../lib/essencePreferences'
import { fetchVoiceWinCounts } from '../lib/matchCardUtils'
```

Update the STEPS array (line 68):

```jsx
// OLD:
const STEPS = ['freetext', 'dimensions', 'body', 'voice']

// NEW:
const STEPS = ['freetext', 'dimensions', 'body', 'voice', 'matchcard']
```

Inside the component function (after `const successTimerRef = useRef(null)` at line 99), add:

```jsx
const [archetypeName, setArchetypeName] = useState(null)
const [grandkidsTest, setGrandkidsTest] = useState(null) // null | true | false
const [voiceWinCounts, setVoiceWinCounts] = useState({})
const [resolvedQuestLabel, setResolvedQuestLabel] = useState(initialSourceLabel || '')
const [submitError, setSubmitError] = useState(false) // for retry on matchcard step
```

- [ ] **Step 2: Fetch archetype name and voice win counts on mount**

After the existing `useEffect` that loads quest dimension gaps (after line 143), add:

```jsx
// Fetch user's archetype name for Match Card
useEffect(() => {
  if (!userId) return
  supabase
    .from('lead_flow_profiles')
    .select('custom_essence_name, essence_archetype')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .then(({ data }) => {
      if (data?.[0]) setArchetypeName(getEssenceDisplayName(data[0]))
    })
}, [userId])

// Batch-fetch voice win counts for Match Card
useEffect(() => {
  if (!userId) return
  fetchVoiceWinCounts(userId).then(setVoiceWinCounts)
}, [userId])
```

- [ ] **Step 2b: Resolve quest label when linkedQuestId changes**

The existing `useEffect` at lines 146-168 already fetches quest data when `linkedQuestId` changes. Piggyback on it to also resolve the label. Find the `.then(({ data })` callback for the quests query and add:

```jsx
// Inside the existing useEffect that fetches quest dimensions (line 148-153):
// After the .then that sets questDims, add the label query:
if (!initialSourceLabel) {
  supabase.from('quests').select('label').eq('id', linkedQuestId).maybeSingle()
    .then(({ data: q }) => {
      if (q?.label) setResolvedQuestLabel(q.label)
    })
}
```

This ensures `resolvedQuestLabel` is set by the time the user reaches Step 5, even when `initialSourceLabel` is null (e.g., PlayListTab, WahooDiscoveryFlow).

- [ ] **Step 3: Update goBack to handle matchcard step**

In the `goBack` callback (around line 180), add the matchcard case:

```jsx
// Add before the voice case:
else if (step === 'matchcard') setStep('voice')
```

- [ ] **Step 4: Pass grandkids_test into handleSubmit**

In `handleSubmit()` (line 229), find the `createGroanChallenge` call (around line 242-256). Add `grandkidsTest` to the call:

```jsx
const { data: dbRecord, error: saveError } = await createGroanChallenge({
  userId,
  title: freeText.trim(),
  description: freeText.trim(),
  visibilityLayer: 'screen',
  sourceType: 'skill',
  sourceLabel: sourceLabel || 'Courage',
  depthLevel: null,
  visibilityLayers: [],
  questId: linkedQuestId || null,
  expansionDimensions: expansionDims,
  dimensionValues,
  predictedDifficulty,
  predictedVoice: protectiveVoice || null,
  grandkidsTest: grandkidsTest,
})
```

Note: `createGroanChallenge` in `src/lib/crm/groanChallengeService.js` will need `grandkids_test` added to its insert object. Check the function and add:

```javascript
grandkids_test: params.grandkidsTest ?? null,
```

to the Supabase `.insert()` call.

- [ ] **Step 5: Add MatchCard step rendering**

Before the main flow `return` (before the `// ── Main flow ──` comment around line 390), add the matchcard step. Find where the voice step ends and the submit button is rendered. The voice step currently has the submit button at the bottom (around line 706-712). Change the voice step's "next" button to advance to matchcard instead of submitting:

In the voice step (Step 4), replace the submit button:

```jsx
// OLD:
<button
  className="wc-next wc-submit"
  disabled={generating || (protectiveVoice && wantsHealing == null)}
  onClick={handleSubmit}
>
  {generating ? 'Saving...' : 'Add courage challenge 🔥'}
</button>

// NEW:
<button
  className="wc-next"
  disabled={protectiveVoice && wantsHealing == null}
  onClick={() => setStep('matchcard')}
>
  Preview your match →
</button>
```

Then add the matchcard step rendering (after the voice step block, before the closing tags):

```jsx
{/* ═══ STEP 5: Match Card Preview ═══ */}
{step === 'matchcard' && (
  <div className="wc-step-screen" key="matchcard">
    <MatchCard
      challenge={{
        title: freeText.trim(),
        predicted_voice: protectiveVoice,
        dimension_values: dimensionValues,
        expansion_dimensions: expansionDims,
      }}
      questLabel={resolvedQuestLabel}
      archetypeName={archetypeName}
      voiceWins={protectiveVoice ? (voiceWinCounts[protectiveVoice] || 0) : (voiceWinCounts._total || 0)}
      mode="creation"
      onGrandkidsAnswer={(answer) => {
        setGrandkidsTest(answer)
        setSubmitError(false)
        if (answer) {
          setTimeout(() => handleSubmit(), 1200)
        } else {
          handleSubmit()
        }
      }}
    />
    {/* Error + retry if submit fails after grandkids answer */}
    {submitError && (
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <p className="wc-error">Failed to save. Try again.</p>
        <button className="wc-next" onClick={() => { setSubmitError(false); handleSubmit() }}>
          Try again
        </button>
      </div>
    )}
  </div>
)}
```

Also update `handleSubmit`'s `catch` block (around line 312-315) to set `submitError` when on the matchcard step:

```jsx
// In the catch block, after setError('Failed to save. Try again.'):
if (step === 'matchcard') setSubmitError(true)
```

This ensures the user has a retry path if the submit fails after they've already answered the grandkids test.

- [ ] **Step 6: Keep existing success screen as brief confirmation**

The existing success screen (lines 321-331) stays exactly as-is. After the matchcard step auto-submits, the normal success → `onWahooAccepted` → `onClose` flow fires. No changes needed.

- [ ] **Step 7: Add grandkids_test to groanChallengeService**

Read `src/lib/crm/groanChallengeService.js` and find the `createGroanChallenge` function. Add `grandkids_test: params.grandkidsTest ?? null` to the insert object, alongside the existing fields like `predicted_voice`, `predicted_difficulty`, etc.

- [ ] **Step 8: Verify end-to-end**

Run: `npm run dev`

1. Create a new courage challenge from Paths tab
2. Fill steps 1-4 (freetext, dimensions, body, voice)
3. Step 4 now shows "Preview your match →" instead of "Add courage challenge 🔥"
4. Step 5: MatchCard appears with VS header, voice lie, dimensions, win count, grandkids question
5. Tap "Hell yes" → stakes line appears for 1.2s → auto-submit → "🔥 Challenge accepted!" → modal closes
6. Tap "Not this one" on another test → auto-submit immediately → success → close
7. Check Supabase: `groan_challenges` row has `grandkids_test = true` or `false`
8. Test from QuestBoardCard and PlayListTab too — verify callbacks fire normally

- [ ] **Step 9: Commit**

```bash
git add src/components/WahooCreator.jsx src/lib/crm/groanChallengeService.js
git commit -m "feat: add MatchCard as Step 5 in WahooCreator with grandkids test"
```

---

### Task 4: MatchCardCarousel Component (Swipeable Picker)

**Files:**
- Create: `src/components/level/MatchCardCarousel.jsx`
- Create: `src/components/level/MatchCardCarousel.css`

**Interfaces:**
- Consumes:
  - `<MatchCard>` from `src/components/MatchCard.jsx`
  - `getEssenceDisplayName(profile)` from `src/lib/essencePreferences.js`
  - `fetchVoiceWinCounts(userId)` from `src/lib/matchCardUtils.js`
  - `supabase` for fetching archetype + groan challenge data
  - `GroanCompletionModal` from `src/components/GroanCompletionModal`
  - `HealingFlowModal` from `src/components/HealingFlowModal`
  - `WahooCreator` from `src/components/WahooCreator`
- Produces:
  - `<MatchCardCarousel>` component with same props as `WeeklyFocus`:
    `{ quests, questTasks, userId, courageCount, onCompleteCourage, onAddChallenge }`
  - Three states: carousel (swiping/picking), focused (one card pinned), empty (no challenges)
  - **Single card auto-focus**: If only 1 challenge exists, skip carousel and go straight to focused state

- [ ] **Step 1: Write MatchCardCarousel.jsx**

```jsx
// src/components/level/MatchCardCarousel.jsx
/**
 * MatchCardCarousel — swipeable Match Cards replacing WeeklyFocus.
 *
 * States:
 *   1. Carousel: horizontal swipe through all active challenges. Tap = select as weekly focus.
 *   2. Focused: selected card pinned at top. "I did it!" + "Change challenge" available.
 *   3. Empty: no active challenges. Shows add prompt.
 *
 * Single card: if only 1 active challenge, auto-focuses it (no carousel of one).
 * Win counts: batch-fetched once, passed to all MatchCards as props (no N+1 queries).
 *
 * CSS prefix: mcc-
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { getWeekStartLocal } from '../../lib/dateUtils'
import { getEssenceDisplayName } from '../../lib/essencePreferences'
import { fetchVoiceWinCounts } from '../../lib/matchCardUtils'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import MatchCard from '../MatchCard'
import GroanCompletionModal from '../GroanCompletionModal'
import HealingFlowModal from '../HealingFlowModal'
import WahooCreator from '../WahooCreator'
import './MatchCardCarousel.css'

const WEEK_KEY_PREFIX = 'weekly_focus_challenge_'
function getWeekKey() { return WEEK_KEY_PREFIX + getWeekStartLocal() }

export default function MatchCardCarousel({ quests, questTasks, userId, courageCount = 0, onCompleteCourage, onAddChallenge }) {
  const [focusId, setFocusId] = useState(null)
  const [picking, setPicking] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [groanChallenge, setGroanChallenge] = useState(null)
  const [healingOpen, setHealingOpen] = useState(false)
  const [wahooQuestId, setWahooQuestId] = useState(null)
  const [wahooQuestLabel, setWahooQuestLabel] = useState('')
  const [completing, setCompleting] = useState(false)
  const [archetypeName, setArchetypeName] = useState(null)
  const [challengeDetails, setChallengeDetails] = useState({})
  const [voiceWins, setVoiceWins] = useState({})
  const scrollRef = useRef(null)

  // Load focus from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(getWeekKey())
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setFocusId(parsed.taskId)
        setCompleted(!!parsed.completed)
      } catch { /* ignore */ }
    }
  }, [])

  // Fetch archetype name
  useEffect(() => {
    if (!userId) return
    supabase
      .from('lead_flow_profiles')
      .select('custom_essence_name, essence_archetype')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) setArchetypeName(getEssenceDisplayName(data[0]))
      })
  }, [userId])

  // Batch-fetch voice win counts (one query for all cards)
  useEffect(() => {
    if (!userId) return
    fetchVoiceWinCounts(userId).then(setVoiceWins)
  }, [userId])

  // All active courage challenges (flat list with quest info)
  const allChallenges = useMemo(() => {
    const result = []
    const activeQuests = quests.filter(q => q.status === 'active' && q.label !== 'Healing Work')
    activeQuests.forEach(q => {
      const tasks = (questTasks[q.id] || []).filter(t => t.is_courage_challenge && !t.done)
      tasks.forEach(t => result.push({ task: t, quest: q }))
    })
    return result
  }, [quests, questTasks])

  // Fetch groan_challenge details for all active challenges (for dimension data)
  useEffect(() => {
    const gcIds = allChallenges
      .map(c => c.task.groan_challenge_id)
      .filter(Boolean)
    if (gcIds.length === 0) return

    supabase
      .from('groan_challenges')
      .select('id, title, challenge_text, predicted_voice, dimension_values, expansion_dimensions, grandkids_test')
      .in('id', gcIds)
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach(gc => { map[gc.id] = gc })
        setChallengeDetails(map)
      })
  }, [allChallenges.length])

  // Auto-focus if only 1 challenge and no focus set yet
  useEffect(() => {
    if (allChallenges.length === 1 && !focusId) {
      saveFocus(allChallenges[0].task.id)
    }
  }, [allChallenges.length, focusId])

  // Active quests for "add new"
  const activeQuests = useMemo(() =>
    quests.filter(q => q.status === 'active' && q.label !== 'Healing Work'),
  [quests])

  // Find focused challenge
  const focusedEntry = useMemo(() => {
    if (!focusId) return null
    const found = allChallenges.find(c => c.task.id === focusId)
    if (found) return found
    for (const q of quests) {
      const task = (questTasks[q.id] || []).find(t => t.id === focusId)
      if (task) return { task, quest: q }
    }
    return null
  }, [focusId, allChallenges, quests, questTasks])

  // Sync completed state
  useEffect(() => {
    if (focusedEntry?.task?.done && !completed) {
      localStorage.setItem(getWeekKey(), JSON.stringify({ taskId: focusId, completed: true }))
      setCompleted(true)
    }
  }, [focusedEntry?.task?.done, completed, focusId])

  const saveFocus = useCallback((taskId) => {
    localStorage.setItem(getWeekKey(), JSON.stringify({ taskId, completed: false }))
    setFocusId(taskId)
    setCompleted(false)
    setPicking(false)
    hapticLight()
  }, [])

  const handleDidIt = useCallback(async () => {
    if (!focusedEntry || completing) return
    setCompleting(true)
    const task = focusedEntry.task

    if (!task.groan_challenge_id) {
      await supabase.from('quest_tasks')
        .update({ done: true, completed_at: new Date().toISOString() })
        .eq('id', task.id)
      handleCompletionDone()
      return
    }

    try {
      const { data: gc } = await supabase
        .from('groan_challenges').select('*')
        .eq('id', task.groan_challenge_id).single()
      if (gc && gc.status !== 'completed') setGroanChallenge(gc)
    } catch (e) {
      console.warn('MatchCardCarousel: error fetching groan challenge:', e)
    }
  }, [focusedEntry, completing])

  const handleCompletionDone = useCallback(() => {
    setGroanChallenge(null)
    setCompleting(false)
    localStorage.setItem(getWeekKey(), JSON.stringify({ taskId: focusId, completed: true }))
    setCompleted(true)
    hapticSuccess()
    onCompleteCourage?.(focusedEntry?.task, focusedEntry?.quest)
  }, [focusId, focusedEntry, onCompleteCourage])

  // Helper: get win count for a specific challenge's voice
  const getWinsForChallenge = useCallback((gc) => {
    const voice = gc?.predicted_voice
    if (voice) return voiceWins[voice] || 0
    return voiceWins._total || 0
  }, [voiceWins])

  // No quests at all
  if (activeQuests.length === 0) return null

  // ── STATE: Focused (card pinned) ──
  if (focusId && focusedEntry && !picking) {
    const gc = challengeDetails[focusedEntry.task.groan_challenge_id] || {}
    return (
      <div className="mcc-container">
        <div className="mcc-header">
          <span className="mcc-label">This week's match</span>
          {allChallenges.length > 1 && (
            <button className="mcc-change" onClick={() => setPicking(true)}>
              Change challenge
            </button>
          )}
        </div>

        {completed ? (
          <div className="mcc-completed-card">
            <div className="mcc-done-icon">🏆</div>
            <div className="mcc-done-text">Match won!</div>
            <button className="mcc-btn-secondary" onClick={() => setPicking(true)}>
              Pick next match
            </button>
          </div>
        ) : (
          <MatchCard
            challenge={{ ...gc, title: gc.title || focusedEntry.task.text }}
            questLabel={focusedEntry.quest.label}
            archetypeName={archetypeName}
            voiceWins={getWinsForChallenge(gc)}
            mode="paths"
            onDidIt={handleDidIt}
            onHealingClick={() => setHealingOpen(true)}
          />
        )}

        {courageCount > 0 && (
          <div className="mcc-counter">
            <span className="mcc-counter-num">{courageCount}</span> matches won
          </div>
        )}

        {groanChallenge && (
          <GroanCompletionModal
            challenge={groanChallenge}
            userId={userId}
            onComplete={handleCompletionDone}
            onClose={() => { setGroanChallenge(null); setCompleting(false) }}
          />
        )}

        {healingOpen && (
          <HealingFlowModal
            taskText={focusedEntry.task.text}
            userId={userId}
            questTaskId={focusedEntry.task.id}
            existingData={null}
            onComplete={() => setHealingOpen(false)}
            onClose={() => setHealingOpen(false)}
          />
        )}
      </div>
    )
  }

  // ── STATE: Carousel (picking / no focus set) ──
  return (
    <div className="mcc-container">
      <div className="mcc-header">
        <span className="mcc-label">Pick your match</span>
      </div>

      {allChallenges.length === 0 ? (
        <div className="mcc-empty">
          {courageCount > 0
            ? "All matches won! Add a new courage challenge."
            : "No courage challenges yet. Add one to get started."}
        </div>
      ) : (
        <div className="mcc-carousel" ref={scrollRef}>
          {allChallenges.map(({ task, quest }) => {
            const gc = challengeDetails[task.groan_challenge_id] || {}
            return (
              <div
                key={task.id}
                className="mcc-carousel-item"
                onClick={() => saveFocus(task.id)}
              >
                <MatchCard
                  challenge={{ ...gc, title: gc.title || task.text }}
                  questLabel={quest.label}
                  archetypeName={archetypeName}
                  voiceWins={getWinsForChallenge(gc)}
                  mode="carousel"
                />
                <div className="mcc-tap-hint">Tap to select</div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mcc-add-section">
        {activeQuests.map(quest => (
          <button
            key={quest.id}
            className="mcc-add-btn"
            onClick={() => { setWahooQuestId(quest.id); setWahooQuestLabel(quest.label) }}
          >
            + Add to {quest.label}
          </button>
        ))}
      </div>

      {picking && (
        <button className="mcc-cancel" onClick={() => setPicking(false)}>Cancel</button>
      )}

      {courageCount > 0 && (
        <div className="mcc-counter">
          <span className="mcc-counter-num">{courageCount}</span> matches won
        </div>
      )}

      {wahooQuestId && (
        <div className="wc-modal-overlay" onClick={() => setWahooQuestId(null)}>
          <div className="wc-modal" onClick={e => e.stopPropagation()}>
            <button className="wc-modal-close" onClick={() => setWahooQuestId(null)}>&times;</button>
            <WahooCreator
              userId={userId}
              initialQuestId={wahooQuestId}
              initialSourceLabel={wahooQuestLabel}
              onWahooAccepted={() => {
                setWahooQuestId(null)
                onAddChallenge?.()
              }}
              onClose={() => setWahooQuestId(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write MatchCardCarousel.css**

```css
/* MatchCardCarousel — swipeable Match Card picker for Paths tab */

.mcc-container {
  margin-bottom: 10px;
}

.mcc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px;
}

.mcc-label {
  font-size: 14px;
  font-weight: 800;
  color: #1a0b3d;
  letter-spacing: -0.01em;
}

.mcc-change {
  background: none;
  border: none;
  color: #5e17eb;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 10px;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}

.mcc-change:active {
  background: rgba(94, 23, 235, 0.06);
}

/* ── Carousel (horizontal scroll-snap) ── */
.mcc-carousel {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding: 4px 0 12px;
  scrollbar-width: none;
}

.mcc-carousel::-webkit-scrollbar {
  display: none;
}

.mcc-carousel-item {
  flex: 0 0 85%;
  scroll-snap-align: center;
  cursor: pointer;
  position: relative;
  transition: transform 0.15s;
}

.mcc-carousel-item:active {
  transform: scale(0.98);
}

.mcc-tap-hint {
  text-align: center;
  font-size: 11px;
  color: #9ca3af;
  font-weight: 600;
  margin-top: 6px;
  letter-spacing: 0.02em;
}

/* ── Empty state ── */
.mcc-empty {
  font-size: 13px;
  color: #6c757d;
  text-align: center;
  padding: 20px 0;
  line-height: 1.4;
}

/* ── Completed state ── */
.mcc-completed-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 30px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  text-align: center;
  border: 2px solid #E9A23B;
}

.mcc-done-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.mcc-done-text {
  font-size: 16px;
  font-weight: 800;
  color: #E9A23B;
  margin-bottom: 14px;
}

.mcc-btn-secondary {
  background: transparent;
  color: #5e17eb;
  border: 2px dashed rgba(94, 23, 235, 0.2);
  border-radius: 14px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
}

.mcc-btn-secondary:active {
  background: rgba(94, 23, 235, 0.04);
  border-style: solid;
}

/* ── Add new ── */
.mcc-add-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.mcc-add-btn {
  display: block;
  width: 100%;
  background: none;
  border: 1.5px dashed rgba(94, 23, 235, 0.12);
  border-radius: 12px;
  padding: 10px 14px;
  color: #5e17eb;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}

.mcc-add-btn:active {
  background: rgba(94, 23, 235, 0.04);
}

.mcc-cancel {
  display: block;
  width: 100%;
  margin-top: 10px;
  background: none;
  border: none;
  color: #6c757d;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
}

/* ── Counter ── */
.mcc-counter {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
  padding-top: 14px;
  margin-top: 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.mcc-counter-num {
  font-weight: 900;
  color: #E9A23B;
  font-size: 14px;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/level/MatchCardCarousel.jsx src/components/level/MatchCardCarousel.css
git commit -m "feat: add MatchCardCarousel with scroll-snap swipe and single-card auto-focus"
```

---

### Task 5: Wire MatchCardCarousel into Paths Tab (Replace WeeklyFocus)

**Files:**
- Modify: `src/components/level/LevelTab.jsx` (lines 482-494)

**Interfaces:**
- Consumes: `<MatchCardCarousel>` from `src/components/level/MatchCardCarousel.jsx`
- Produces: Paths tab now shows swipeable Match Cards instead of the WeeklyFocus radio picker. Same props, same callbacks.

- [ ] **Step 1: Swap the import**

In `LevelTab.jsx`, find the `WeeklyFocus` import and replace:

```jsx
// OLD:
import WeeklyFocus from './WeeklyFocus'

// NEW:
import MatchCardCarousel from './MatchCardCarousel'
```

- [ ] **Step 2: Swap the component render**

At lines 482-494, replace `<WeeklyFocus>` with `<MatchCardCarousel>`:

```jsx
// OLD:
<WeeklyFocus
  quests={quests}
  questTasks={questTasks}
  userId={userId}
  courageCount={courageCount}
  onCompleteCourage={() => {
    loadQuests()
    onRefreshPoints?.()
  }}
  onAddChallenge={() => {
    loadQuests()
  }}
/>

// NEW:
<MatchCardCarousel
  quests={quests}
  questTasks={questTasks}
  userId={userId}
  courageCount={courageCount}
  onCompleteCourage={() => {
    loadQuests()
    onRefreshPoints?.()
  }}
  onAddChallenge={() => {
    loadQuests()
  }}
/>
```

- [ ] **Step 3: Verify end-to-end on Paths tab**

Run: `npm run dev`

Test these scenarios:

1. **1 active challenge**: Auto-focuses. No carousel. Card pinned with "This week's match" header. No "Change challenge" button (only 1 card).
2. **2+ challenges, no focus set**: Horizontal carousel of Match Cards. Swipe left/right. Cards snap at 85% width. Each shows VS header, dimensions, win count. "Tap to select" hint below each.
3. **Tap a card**: Card becomes weekly focus. Pinned at top. "This week's match" header. "I did it!" button visible. "Change challenge" button visible.
4. **Tap "I did it!"**: GroanCompletionModal opens with full completion flow.
5. **After completion**: "🏆 Match won!" card with "Pick next match" button.
6. **Tap "Change challenge"**: Returns to carousel.
7. **Tap "Feeling stuck?"**: HealingFlowModal opens.
8. **No challenges exist**: "No courage challenges yet" message + "Add to [quest]" buttons.
9. **Tap "+ Add to [quest]"**: WahooCreator opens with MatchCard Step 5. After creating, carousel refreshes with new card.
10. **Creation flow from WahooCreator**: Steps 1-4 → Step 5 MatchCard preview → grandkids test → submit → success → close.

- [ ] **Step 4: Commit**

```bash
git add src/components/level/LevelTab.jsx
git commit -m "feat: replace WeeklyFocus with MatchCardCarousel on Paths tab"
```

---

## Post-Build Verification

After all 5 tasks, confirm:

1. **Creation flow**: New wahoo → 4 steps → Step 5 MatchCard → grandkids test → stakes line (if yes) → auto-submit → success → closes
2. **Paths tab (1 card)**: Auto-focused, no carousel, "I did it!" button → full completion flow
3. **Paths tab (2+ cards)**: Carousel → tap to focus → "I did it!" → full completion flow → "Match won!"
4. **Data integrity**: `grandkids_test` saved correctly on `groan_challenges` (at creation time, not separate update)
5. **No voice selected**: Card shows "vs Comfort Zone" with shield icon
6. **Archetype name**: Pulls from `lead_flow_profiles.custom_essence_name`
7. **Win count**: Batch-fetched, accurate per voice. No N+1 queries.
8. **All 4 WahooCreator call sites**: WeeklyFocus (now MatchCardCarousel), QuestBoardCard, PlayListTab, WahooDiscoveryFlow — all work unchanged
9. **localStorage**: Weekly focus persists across page reloads, resets Mondays
10. **iOS safe area**: Bottom buttons respect `env(safe-area-inset-bottom)`
