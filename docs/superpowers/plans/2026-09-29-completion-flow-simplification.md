# Completion Flow Simplification — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 11-step courage challenge completion modal with a 3-screen tap-and-go flow, add a dome growth animation reward, and move reflective captures to interactive expandable cards on the Progress tab.

**Architecture:** GroanCompletionModal's step state machine gets gutted to 3 screens (wahoo, aftertaste, voice). Save logic is extracted into `src/lib/challengeCompletionService.js` so both the completion modal and the reflection cards can share RP/level-up/evidence mechanics. A new DomeGrowthOverlay uses requestAnimationFrame to animate SVG polygon points. ProgressTab's evidence feed cards gain an expandable "Reflect deeper" section with 7 interactive inline forms. No schema changes.

**Tech Stack:** React 18, Supabase, requestAnimationFrame for SVG animation, existing DomeOfSafety/useSafetyDome for dome data.

**Spec:** `docs/superpowers/specs/2026-09-29-completion-flow-simplification-design.md`

## Global Constraints

- Light theme throughout. Never dark backgrounds. Match `#f5f5f0` or white.
- Brand purple (#5e17eb) and gold (#E9A23B) for accents.
- CSS scoped to parent class (e.g., `.gcm-modal .gcm-screen { }`)
- No em dashes in user-facing copy.
- User-facing copy readable by a 12-year-old.
- Auto-advance timing: 300ms after tap (matches ZoneCalCheckin pattern).
- Fixed bottom buttons: `left: 50%; transform: translateX(-50%); max-width: 480px; padding-bottom: env(safe-area-inset-bottom)`.
- Import dome dimensions from `src/data/domeDimensions.js`, never redefine inline.

---

### Task 1: Extract Shared Save Logic into challengeCompletionService

**Files:**
- Create: `src/lib/challengeCompletionService.js`

**Interfaces:**
- Consumes: Supabase client, userId, challengeId, wahooClassification, afterState, aftertaste, voice, sourceQuestId, challenge metadata
- Produces: Two exported functions:
  - `saveChallengeCompletion({ supabase, userId, challenge, wahooClassification, afterState, aftertaste, voice, sourceQuestId })` — the full completion save (RP, NS checkin, level-up, mystery boxes, quest task sync, behavioral evidence, skill XP, pattern detection). Returns `{ rpAwarded, leveledUp }`.
  - `saveReflection({ supabase, userId, challengeId, field, value })` — saves a single reflection field to groan_challenges or quest_completions and awards 1 RP. Returns `{ success }`.

- [ ] **Step 1: Create challengeCompletionService.js**

Extract the save logic that currently lives in GroanCompletionModal.jsx `handleCompleteReflection` (lines 171-450) into a standalone module. This is not new logic — it's the existing save code moved to a shared location.

```js
/**
 * challengeCompletionService.js — Shared save logic for courage challenge completion.
 *
 * Used by: GroanCompletionModal (3-screen flow) and ProgressTab (reflection cards).
 * Extracted to avoid duplicating RP/level-up/evidence logic.
 */

import { supabase } from './supabaseClient'
import { completeGroanChallenge } from './crm/groanChallengeService'
import { getScoringCategory } from './scoringCategories'
import { getWeekStartLocal } from './dateUtils'
import { getLevel, getLevelNumber } from './crm/statsService'
import { postFeedEvent } from './communityFeed'
import { earnMysteryBox, checkNewCategoryBox } from './mysteryBoxes'
import { trackGroanCompleted as trackWahooCompleted } from './analytics'
import { awardMovementXP } from './movementXP'

const WAHOO_RP = {
  vibe: 10, wahoo: 10,
  peace: 7,
  anxious: 10,
  shutdown: 9,
}

/**
 * Full save for completing a courage challenge.
 * Called from GroanCompletionModal after the 3-screen flow.
 */
export async function saveChallengeCompletion({
  userId, challenge, wahooClassification, afterState, aftertaste, voice, sourceQuestId,
}) {
  const rpAwarded = WAHOO_RP[wahooClassification] || 7
  const questId = `play_list_challenge_${challenge.id}`

  // 1. Mark groan challenge as completed
  const { error: groanError } = await completeGroanChallenge(challenge.id, { reflectionText: null })
  if (groanError) throw groanError

  // 1b. Save voice
  if (voice) {
    await supabase.from('groan_challenges')
      .update({ gap_voice: voice })
      .eq('id', challenge.id)
      .catch(e => console.warn('Voice save error:', e))
  }

  // 2. Upsert quest_completions (delete old to prevent RP farming)
  try {
    await supabase.from('quest_completions').delete()
      .eq('user_id', userId).eq('quest_id', questId)
  } catch {}

  const { error: questError } = await supabase.from('quest_completions').insert({
    user_id: userId,
    challenge_instance_id: null,
    quest_id: questId,
    quest_category: 'Groans',
    quest_type: 'Rewire',
    points_earned: rpAwarded,
    challenge_day: 0,
    project_id: null,
    reflection_text: JSON.stringify({
      challenge_id: challenge.id,
      source_label: challenge.source_label,
      after_state: afterState,
      wahoo_classification: wahooClassification,
      aftertaste,
      gap_voice: voice,
    }),
    aftertaste,
  })
  if (questError) throw questError

  // 3. NS check-in
  await supabase.from('nervous_system_checkins').insert({
    user_id: userId,
    before_state: null,
    after_state: afterState,
    checkin_type: 'playlist',
    source_quest_id: questId,
    source_challenge_id: challenge.id,
  }).catch(e => console.warn('NS check-in error:', e))

  // 4. Award RP
  await supabase.rpc('increment_scores', {
    p_user_id: userId, p_project_id: null,
    p_category: getScoringCategory('Groans'),
    p_points: rpAwarded,
    p_week_start: getWeekStartLocal(),
  }).catch(e => console.warn('Score increment error:', e))

  // 4a. Level-up detection
  let leveledUp = false
  try {
    const { data: freshScores } = await supabase
      .from('user_lifetime_scores')
      .select('lifetime_total_score')
      .eq('user_id', userId).is('project_id', null).maybeSingle()
    const freshXP = freshScores?.lifetime_total_score || 0
    const priorXP = freshXP - rpAwarded
    if (getLevelNumber(freshXP) > getLevelNumber(priorXP)) {
      leveledUp = true
      postFeedEvent(userId, 'level_up', `Reached ${getLevel(freshXP)?.name || 'a new level'}`)
    }
  } catch {}

  // 4b. First wahoo + mystery boxes
  try {
    const { count } = await supabase
      .from('quest_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId).eq('quest_category', 'Groans')
    if (count === 1) {
      postFeedEvent(userId, 'first_wahoo', 'Completed their first wahoo')
      earnMysteryBox(userId, 'first_wahoo', 'bronze')
    }
  } catch {}
  if (wahooClassification === 'vibe') {
    postFeedEvent(userId, 'first_vibe_rise', 'Reached Vibe Rise for the first time')
  }
  checkNewCategoryBox(userId, challenge.visibility_layer).catch(() => {})
  trackWahooCompleted({ challengeId: challenge.id })
  if (challenge.challenge_source === 'strike') {
    awardMovementXP(userId, 'strike_complete', challenge.title)
  }

  // 5. Sync quest_tasks
  const isSafe = ['vibe', 'peace'].includes(wahooClassification)
  await supabase.from('quest_tasks')
    .update({ done: true, completed_at: new Date().toISOString(), safety_status: isSafe ? 'safe' : 'not_safe' })
    .eq('groan_challenge_id', challenge.id)
    .eq('user_id', userId)
    .catch(e => console.warn('Quest task sync error:', e))

  // 6. Level progress
  try {
    const { data: stage } = await supabase
      .from('user_stage_progress')
      .select('current_journey_level')
      .eq('user_id', userId).maybeSingle()
    const currentLevel = stage?.current_journey_level ?? 0
    if (currentLevel > 0) {
      const { data: progress } = await supabase
        .from('user_level_progress')
        .select('courage_challenge_ids')
        .eq('user_id', userId).eq('current_level', currentLevel).maybeSingle()
      const existing = progress?.courage_challenge_ids || []
      if (!existing.includes(challenge.id)) {
        await supabase.from('user_level_progress').upsert({
          user_id: userId, current_level: currentLevel,
          courage_challenge_ids: [...existing, challenge.id],
        }, { onConflict: 'user_id,current_level' })
      }
    }
  } catch {}

  // 7. Behavioral evidence + skill XP
  if (sourceQuestId) {
    try {
      const { data: quest } = await supabase.from('quests')
        .select('skill_tags').eq('id', sourceQuestId).maybeSingle()
      if (quest?.skill_tags?.length) {
        const { data: clusters } = await supabase
          .from('nikigai_clusters')
          .select('id, skill_tags')
          .eq('user_id', userId).eq('cluster_stage', 'final')
          .is('step_id', null).eq('is_removed', false)
          .in('cluster_type', ['skills', 'problems', 'persona'])
          .not('skill_tags', 'is', null)
        if (clusters) {
          for (const c of clusters.filter(c => c.skill_tags?.some(t => quest.skill_tags.includes(t)))) {
            await supabase.rpc('increment_behavioral_evidence', { p_cluster_id: c.id }).catch(() => {})
          }
        }
        import('./skillProgress').then(m => m.awardSkillXP(userId, quest.skill_tags))
      }
    } catch {}
  }

  // 8. Voice pattern detection (silent — surfaces on Progress tab)
  if (voice) {
    import('./voicePatternDetector').then(({ detectNewPattern, markPatternShown }) => {
      detectNewPattern(userId, voice, challenge.dimension_values)
        .then(pattern => { if (pattern) markPatternShown(userId, pattern.voice, pattern.primaryDimensions) })
        .catch(() => {})
    })
  }

  return { rpAwarded, leveledUp }
}

/**
 * Save a single post-completion reflection.
 * Called from ProgressTab reflection cards.
 * Awards 1 RP per reflection.
 */
export async function saveReflection({ userId, challengeId, field, value }) {
  const questId = `play_list_challenge_${challengeId}`

  // Save to appropriate table based on field
  const groanFields = ['preaction_difficulty', 'experienced_difficulty', 'gap_rescript', 'universe_response', 'universe_response_note']
  if (groanFields.includes(field)) {
    await supabase.from('groan_challenges').update({ [field]: value }).eq('id', challengeId)
  } else {
    // Save to quest_completions.reflection_text (merge into existing JSON)
    const { data: existing } = await supabase
      .from('quest_completions')
      .select('reflection_text')
      .eq('user_id', userId).eq('quest_id', questId)
      .maybeSingle()
    let parsed = {}
    try { parsed = JSON.parse(existing?.reflection_text || '{}') } catch {}
    parsed[field] = value
    await supabase.from('quest_completions')
      .update({ reflection_text: JSON.stringify(parsed) })
      .eq('user_id', userId).eq('quest_id', questId)
  }

  // Award 1 RP
  await supabase.rpc('increment_scores', {
    p_user_id: userId, p_project_id: null,
    p_category: getScoringCategory('Groans'),
    p_points: 1,
    p_week_start: getWeekStartLocal(),
  }).catch(() => {})

  return { success: true }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds (file is created but not imported anywhere yet).

- [ ] **Step 3: Commit**

```bash
git add src/lib/challengeCompletionService.js
git commit -m "refactor: extract shared challenge save logic into challengeCompletionService"
```

---

### Task 2: Simplify GroanCompletionModal to 3 Screens

**Files:**
- Modify: `src/components/GroanCompletionModal.jsx`
- Modify: `src/components/GroanCompletionModal.css`

**Interfaces:**
- Consumes: `challenge` prop (`.id`, `.title`, `.source_label`, `.dimension_values`, `.predicted_difficulty`), `userId`, `onComplete`, `onClose`. Uses `saveChallengeCompletion` from Task 1.
- Produces: `onComplete` callback passes `{ dimensionValues, wahooClassification, afterState, rpAwarded }` (feeds DomeGrowthOverlay in Task 3).

- [ ] **Step 1: Read GroanCompletionModal.jsx in full**

Read `src/components/GroanCompletionModal.jsx`. Map every state variable and which screen used it. The implementing agent needs this context before deleting anything.

- [ ] **Step 2: Gut the state and imports**

Remove these state variables:
- `beforeState, setBeforeState` (was state_checkin)
- `preactionDifficulty, setPreactionDifficulty` (was gap_check)
- `experiencedDifficulty, setExperiencedDifficulty` (was gap_check)
- `gapRescript, setGapRescript` (was pattern interrupt)
- `checkingPattern, setCheckingPattern` (was gap_check)
- `patternDiscovered, setPatternDiscovered` (was pattern_discovered)
- `showPatternHealing, setShowPatternHealing` (was pattern_discovered)
- `patternQuestTaskId, setPatternQuestTaskId` (was pattern_discovered)
- `expectationResult, setExpectationResult` (was expectation)
- `selectedCrossQuests, setSelectedCrossQuests` (was cross_pollination)
- `crossQuests, setCrossQuests` (was cross_pollination, also used in handleShareDone)
- `reflection, setReflection` (was three_percent)
- `lifeFuel, setLifeFuel` (was life_fuel)
- `universeResponse, setUniverseResponse` (was universe_response)
- `universeResponseNote, setUniverseResponseNote` (was universe_response)
- `identityStatement, setIdentityStatement` (was inline with wahoo_check)
- `previousStatements, setPreviousStatements` (was inline with wahoo_check)
- `shiftData, setShiftData, shiftDataRef` (was shift detection)
- `essenceName, setEssenceName` + its useEffect at line 66

Remove these imports:
- `PatternInterruptFlow`
- `HealingFlowModal` (from this file only)
- `ShareWinStep`
- `NervousSystemCheckin`
- `LIFE_FUEL_CHANNELS, CHANNEL_IDS` from channelMapping
- `detectShift` from shiftDetection
- `detectNewPattern, markPatternShown, buildPatternMessage` from voicePatternDetector
- `WAHOO_RP` constant (now in challengeCompletionService)

Add import:
```jsx
import { saveChallengeCompletion } from '../lib/challengeCompletionService'
```

Keep: `wahooClassification`, `afterState`, `aftertaste`, `gapVoice`, `saving`, `error`, `savedRef`, `sourceQuestId`.

- [ ] **Step 3: Replace step state machine with screen counter**

```jsx
const [screen, setScreen] = useState(1) // 1=wahoo, 2=aftertaste, 3=voice
const advanceTimer = useRef(null)

function advanceTo(next) {
  advanceTimer.current = setTimeout(() => setScreen(next), 300)
}

useEffect(() => () => clearTimeout(advanceTimer.current), [])
```

- [ ] **Step 4: Build Screen 1 — "How did it feel?"**

```jsx
{screen === 1 && (
  <>
    <h2 className="gcm-title">I Did It!</h2>
    <p className="gcm-subtitle">{challenge.title || challenge.source_label}</p>
    <h3 className="gcm-question">How did it feel?</h3>
    <div className="gcm-wahoo-options">
      <button className={`gcm-wahoo-btn gcm-wahoo-hell-yes ${wahooClassification === 'vibe' ? 'selected' : ''}`}
        onClick={() => { hapticLight(); setWahooClassification('vibe'); setAfterState('vibe_rise'); advanceTo(2) }}>
        <span className="gcm-wahoo-emoji">🔥</span><span className="gcm-wahoo-label">Vibe Rise</span>
      </button>
      <button className={`gcm-wahoo-btn gcm-wahoo-alive ${wahooClassification === 'peace' ? 'selected' : ''}`}
        onClick={() => { hapticLight(); setWahooClassification('peace'); setAfterState('ventral'); advanceTo(2) }}>
        <span className="gcm-wahoo-emoji">☺️</span><span className="gcm-wahoo-label">Fun</span>
      </button>
      <button className={`gcm-wahoo-btn ${wahooClassification === 'anxious' ? 'selected' : ''}`}
        onClick={() => { hapticLight(); setWahooClassification('anxious'); setAfterState('sympathetic'); advanceTo(2) }}
        style={wahooClassification === 'anxious' ? { borderColor: '#ef4444', background: 'rgba(239,68,68,0.06)', color: '#ef4444' } : undefined}>
        <span className="gcm-wahoo-emoji">😰</span><span className="gcm-wahoo-label">Stressful</span>
      </button>
      <button className={`gcm-wahoo-btn ${wahooClassification === 'shutdown' ? 'selected' : ''}`}
        onClick={() => { hapticLight(); setWahooClassification('shutdown'); setAfterState('dorsal'); advanceTo(2) }}
        style={wahooClassification === 'shutdown' ? { borderColor: '#6b7280', background: 'rgba(107,114,128,0.06)', color: '#6b7280' } : undefined}>
        <span className="gcm-wahoo-emoji">😶</span><span className="gcm-wahoo-label">Bored</span>
      </button>
    </div>
  </>
)}
```

No per-state identity statement or objection capture. Tap-and-go.

- [ ] **Step 5: Build Screen 2 — "Do that again?"**

```jsx
{screen === 2 && (
  <>
    <button className="gcm-back-btn" onClick={() => { clearTimeout(advanceTimer.current); setScreen(1) }}>←</button>
    <h2 className="gcm-title">Do you want to do that again?</h2>
    <div className="gcm-wahoo-options">
      <button className={`gcm-wahoo-btn ${aftertaste === 'yes' ? 'selected' : ''}`}
        onClick={() => { hapticLight(); setAftertaste('yes'); advanceTo(3) }}
        style={aftertaste === 'yes' ? { borderColor: '#E9A23B', background: 'rgba(233,162,59,0.06)', color: '#E9A23B' } : undefined}>
        <span className="gcm-wahoo-emoji">🔥</span><span className="gcm-wahoo-label">Yes</span>
      </button>
      <button className={`gcm-wahoo-btn ${aftertaste === 'not_sure' ? 'selected' : ''}`}
        onClick={() => { hapticLight(); setAftertaste('not_sure'); advanceTo(3) }}
        style={aftertaste === 'not_sure' ? { borderColor: '#5e17eb', background: 'rgba(94,23,235,0.06)', color: '#5e17eb' } : undefined}>
        <span className="gcm-wahoo-emoji">🤔</span><span className="gcm-wahoo-label">Not sure</span>
      </button>
      <button className={`gcm-wahoo-btn ${aftertaste === 'no' ? 'selected' : ''}`}
        onClick={() => { hapticLight(); setAftertaste('no'); advanceTo(3) }}
        style={aftertaste === 'no' ? { borderColor: '#6b7280', background: 'rgba(107,114,128,0.06)', color: '#6b7280' } : undefined}>
        <span className="gcm-wahoo-emoji">😶</span><span className="gcm-wahoo-label">No</span>
      </button>
    </div>
  </>
)}
```

- [ ] **Step 6: Build Screen 3 — "Voice check" + save trigger**

```jsx
{screen === 3 && (() => {
  const voices = [
    { id: 'ghost', icon: '👻', label: 'Ghost' },
    { id: 'perfectionist', icon: '🎯', label: 'Perfectionist' },
    { id: 'people_pleaser', icon: '🪞', label: 'People Pleaser' },
    { id: 'controller', icon: '🎮', label: 'Controller' },
    { id: 'auto_pilot', icon: '🛋️', label: 'Auto-Pilot' },
  ]
  return (
    <>
      <button className="gcm-back-btn" onClick={() => { clearTimeout(advanceTimer.current); setScreen(2) }}>←</button>
      <h2 className="gcm-title">Did a protective voice show up before or during?</h2>
      <div className="gcm-wahoo-options gcm-voice-grid">
        {voices.map(v => (
          <button key={v.id} className={`gcm-wahoo-btn ${gapVoice === v.id ? 'selected' : ''}`}
            onClick={() => { hapticLight(); setGapVoice(v.id); handleSave(v.id) }}
            style={gapVoice === v.id ? { borderColor: '#5e17eb', background: 'rgba(94,23,235,0.06)', color: '#5e17eb' } : undefined}>
            <span className="gcm-wahoo-emoji">{v.icon}</span><span className="gcm-wahoo-label">{v.label}</span>
          </button>
        ))}
        <button className={`gcm-wahoo-btn ${gapVoice === 'none' ? 'selected' : ''}`}
          onClick={() => { hapticLight(); setGapVoice(null); handleSave(null) }}
          style={gapVoice === 'none' ? { borderColor: '#16a34a', background: 'rgba(22,163,74,0.06)', color: '#16a34a' } : undefined}>
          <span className="gcm-wahoo-emoji">✅</span><span className="gcm-wahoo-label">Nope</span>
        </button>
      </div>
      {saving && <p className="gcm-saving">Saving...</p>}
      {error && <p className="gcm-error">{error}</p>}
    </>
  )
})()}
```

- [ ] **Step 7: Write the handleSave function**

This is now thin — it calls the extracted service and fires confetti:

```jsx
const handleSave = async (selectedVoice) => {
  if (savedRef.current || saving) return
  setSaving(true)
  setError(null)
  try {
    const { rpAwarded } = await saveChallengeCompletion({
      userId, challenge, wahooClassification, afterState, aftertaste,
      voice: selectedVoice, sourceQuestId,
    })

    // Confetti
    if (wahooClassification === 'vibe') {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#E9A23B', '#f5c55a', '#fbbf24'] })
      setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors: ['#E9A23B', '#f5c55a'] }), 300)
    } else if (wahooClassification === 'peace') {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 }, colors: ['#5e17eb', '#8b5cf6', '#c4b5fd'] })
    }

    savedRef.current = true
    onComplete({
      dimensionValues: challenge.dimension_values,
      wahooClassification, afterState, rpAwarded,
    })
  } catch (err) {
    console.error('Save error:', err)
    setError('Something went wrong. Try again.')
    setSaving(false)
  }
}
```

- [ ] **Step 8: Delete all old step JSX and handleCompleteReflection**

Delete: all JSX blocks for `state_checkin`, `wahoo_check` (old version), `aftertaste` (old version), `gap_check`, `pattern_discovered`, `expectation`, `cross_pollination`, `three_percent`, `life_fuel`, `universe_response`, `share`. Delete `handleCompleteReflection`, `handleShareDone`. Delete the `HealingFlowModal` render at the bottom.

- [ ] **Step 9: Add CSS**

```css
.gcm-back-btn {
  position: absolute; top: 16px; left: 16px;
  background: none; border: none; font-size: 20px;
  color: #6b7280; cursor: pointer; padding: 4px 8px; z-index: 2;
}
.gcm-question {
  font-size: 18px; font-weight: 600; margin: 16px 0 12px; color: #1a1a2e;
}
.gcm-voice-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
}
.gcm-saving {
  text-align: center; color: #6b7280; font-size: 14px; margin-top: 12px;
}
```

- [ ] **Step 10: Verify build**

Run: `npm run build`

- [ ] **Step 11: Commit**

```bash
git add src/components/GroanCompletionModal.jsx src/components/GroanCompletionModal.css
git commit -m "feat: simplify completion flow to 3 tap-and-go screens (from 11)"
```

---

### Task 3: Build DomeGrowthOverlay with JS-Animated Radar

**Files:**
- Create: `src/components/DomeGrowthOverlay.jsx`
- Create: `src/components/DomeGrowthOverlay.css`

**Interfaces:**
- Consumes: `{ dimensionValues, wahooClassification, afterState, rpAwarded, onDismiss }` props
- Produces: Full-screen overlay with animated SVG dome radar. Calls `onDismiss` after 2.5s or on tap.

- [ ] **Step 1: Create DomeGrowthOverlay.jsx with requestAnimationFrame animation**

The SVG polygon `points` attribute cannot be CSS-transitioned. Use `requestAnimationFrame` to interpolate each dimension's level from 0 to target over 800ms with an ease-out curve.

```jsx
/**
 * DomeGrowthOverlay — Celebrates dome growth after courage challenge completion.
 * Uses requestAnimationFrame to animate SVG polygon points (CSS can't transition SVG points).
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { DOME_DIMENSIONS } from '../data/domeDimensions'
import './DomeGrowthOverlay.css'

const INTEGRATED = new Set(['vibe_rise', 'ventral'])
const ANIM_MS = 800

function easeOut(t) { return 1 - Math.pow(1 - t, 3) }

export default function DomeGrowthOverlay({ dimensionValues, wahooClassification, afterState, rpAwarded, onDismiss }) {
  const svgRef = useRef(null)
  const polyRef = useRef(null)
  const [exiting, setExiting] = useState(false)
  const dismissed = useRef(false)

  const isIntegrated = INTEGRATED.has(afterState)
  const cx = 120, cy = 120, maxR = 90
  const angleStep = (2 * Math.PI) / DOME_DIMENSIONS.length

  const getPoint = useCallback((dimIndex, level) => {
    const angle = (dimIndex * angleStep) - Math.PI / 2
    const r = (level / 5) * maxR
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
  }, [angleStep])

  const buildPoints = useCallback((progress) => {
    return DOME_DIMENSIONS.map((d, i) => {
      const target = dimensionValues?.[d.id] ?? 0
      const current = target * progress
      return getPoint(i, current)
    }).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  }, [dimensionValues, getPoint])

  // Animate polygon points from 0 to target over ANIM_MS
  useEffect(() => {
    if (!polyRef.current || !dimensionValues) return
    const start = performance.now()

    function tick(now) {
      const elapsed = now - start
      const t = Math.min(elapsed / ANIM_MS, 1)
      const progress = easeOut(t)
      if (polyRef.current) {
        polyRef.current.setAttribute('points', buildPoints(progress))
      }
      if (t < 1) requestAnimationFrame(tick)
    }

    // Start from zero
    polyRef.current.setAttribute('points', buildPoints(0))
    requestAnimationFrame(tick)
  }, [buildPoints, dimensionValues])

  // Auto-dismiss
  useEffect(() => {
    const timer = setTimeout(() => dismiss(), 2500)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    if (dismissed.current) return
    dismissed.current = true
    setExiting(true)
    setTimeout(() => onDismiss?.(), 300)
  }

  if (!dimensionValues) {
    return (
      <div className={`dgo-overlay ${exiting ? 'dgo-exit' : ''}`} onClick={dismiss}>
        <div className="dgo-rp-only"><span className="dgo-rp-badge">+{rpAwarded} RP</span></div>
      </div>
    )
  }

  const dims = DOME_DIMENSIONS.filter(d => dimensionValues[d.id] != null)

  return (
    <div className={`dgo-overlay ${exiting ? 'dgo-exit' : ''}`} onClick={dismiss}>
      <div className="dgo-content" onClick={e => e.stopPropagation()}>
        <div className="dgo-title">
          {isIntegrated ? 'Your comfort zone grew' : 'You pushed your edge'}
        </div>
        <svg className="dgo-radar" viewBox="0 0 240 240" width="200" height="200">
          {[1, 2, 3, 4, 5].map(ring => (
            <circle key={ring} cx={cx} cy={cy} r={(ring / 5) * maxR}
              fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
          ))}
          {DOME_DIMENSIONS.map((d, i) => {
            const [x2, y2] = getPoint(i, 5)
            return <line key={d.id} x1={cx} y1={cy} x2={x2} y2={y2} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
          })}
          <polygon ref={polyRef} points={buildPoints(0)}
            fill={isIntegrated ? 'rgba(94,23,235,0.15)' : 'rgba(233,162,59,0.15)'}
            stroke={isIntegrated ? '#5e17eb' : '#E9A23B'}
            strokeWidth="2"
            strokeDasharray={isIntegrated ? 'none' : '6 4'} />
          {DOME_DIMENSIONS.map((d, i) => {
            const [lx, ly] = getPoint(i, 6.2)
            const grew = dimensionValues[d.id] != null
            return (
              <text key={d.id} x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
                fontSize="10" fill={grew ? (isIntegrated ? '#5e17eb' : '#E9A23B') : '#9ca3af'}
                fontWeight={grew ? '600' : '400'}>
                {d.icon}
              </text>
            )
          })}
        </svg>
        <div className="dgo-chips">
          {dims.map(d => (
            <span key={d.id} className="dgo-chip" style={{ color: isIntegrated ? '#5e17eb' : '#E9A23B' }}>
              {d.icon} {d.shortLabel || d.label} → {dimensionValues[d.id]}
            </span>
          ))}
        </div>
        <span className="dgo-rp-badge">+{rpAwarded} RP</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create DomeGrowthOverlay.css**

```css
.dgo-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  animation: dgoFadeIn 0.3s ease;
}
.dgo-overlay.dgo-exit { animation: dgoFadeOut 0.3s ease forwards; }
.dgo-content {
  background: #fafaf7; border-radius: 20px;
  padding: 28px 24px; text-align: center;
  max-width: 320px; width: 90%;
  animation: dgoSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1);
}
.dgo-title { font-weight: 700; font-size: 18px; color: #1a1a2e; margin-bottom: 16px; }
.dgo-radar { display: block; margin: 0 auto 16px; }
.dgo-chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-bottom: 12px; }
.dgo-chip { font-size: 12px; font-weight: 600; background: rgba(94,23,235,0.06); padding: 4px 10px; border-radius: 6px; }
.dgo-rp-badge {
  display: inline-block; font-weight: 800; font-size: 20px; color: #E9A23B;
  animation: dgoFloat 0.6s ease 0.4s both;
}
.dgo-rp-only { animation: dgoSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes dgoFadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes dgoFadeOut { from { opacity: 1 } to { opacity: 0 } }
@keyframes dgoSlideUp { from { opacity: 0; transform: translateY(40px) scale(0.9) } to { opacity: 1; transform: translateY(0) scale(1) } }
@keyframes dgoFloat { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
```

- [ ] **Step 3: Verify build + commit**

```bash
npm run build && git add src/components/DomeGrowthOverlay.* && git commit -m "feat: add DomeGrowthOverlay with rAF-animated radar"
```

---

### Task 4: Wire DomeGrowthOverlay into QuestBoardCard + PlayListTab

**Files:**
- Modify: `src/components/QuestBoardCard.jsx`
- Modify: `src/components/PlayListTab.jsx`

**Interfaces:**
- Consumes: `DomeGrowthOverlay` from Task 3. `onComplete` data from Task 2.
- Produces: DomeGrowthOverlay renders after completion modal closes.

- [ ] **Step 1: Update QuestBoardCard.jsx**

Add import and state:
```jsx
import DomeGrowthOverlay from './DomeGrowthOverlay'
const [domeGrowthData, setDomeGrowthData] = useState(null)
```

Update GroanCompletionModal's `onComplete`:
```jsx
<GroanCompletionModal
  challenge={groanModalChallenge}
  userId={userId}
  onComplete={(data) => { setGroanModalChallenge(null); setDomeGrowthData(data); onUpdate?.() }}
  onClose={() => setGroanModalChallenge(null)}
/>
{domeGrowthData && (
  <DomeGrowthOverlay {...domeGrowthData} onDismiss={() => setDomeGrowthData(null)} />
)}
```

- [ ] **Step 2: Update PlayListTab.jsx**

Same pattern. Find GroanCompletionModal render, add `domeGrowthData` state, wire `onComplete` and `DomeGrowthOverlay`.

- [ ] **Step 3: Verify build + commit**

```bash
npm run build && git add src/components/QuestBoardCard.jsx src/components/PlayListTab.jsx && git commit -m "feat: wire DomeGrowthOverlay after challenge completion"
```

---

### Task 5: Add Interactive Reflection Cards to Progress Tab

**Files:**
- Modify: `src/components/ProgressTab.jsx`
- Modify: `src/components/ProgressTab.css`

**Interfaces:**
- Consumes: `evidenceFeed` array (each `.id` = groan_challenges.id). `saveReflection` from Task 1. Supabase for loading existing reflection data.
- Produces: Expandable "Reflect deeper" section on each evidence card with 7 interactive inline forms.

- [ ] **Step 1: Add reflection state**

```jsx
import { saveReflection } from '../lib/challengeCompletionService'

const [expandedId, setExpandedId] = useState(null)
const [reflections, setReflections] = useState({}) // { [challengeId]: { loaded, fields } }
```

- [ ] **Step 2: Add loadReflections function**

```jsx
const loadReflections = async (challengeId) => {
  if (reflections[challengeId]?.loaded) return

  const { data: ch } = await supabase.from('groan_challenges')
    .select('preaction_difficulty, experienced_difficulty, gap_rescript, universe_response, universe_response_note, gap_voice, predicted_difficulty, quest_id')
    .eq('id', challengeId).maybeSingle()

  const questId = `play_list_challenge_${challengeId}`
  const { data: comp } = await supabase.from('quest_completions')
    .select('reflection_text').eq('user_id', userId).eq('quest_id', questId).maybeSingle()

  let parsed = {}
  try { parsed = JSON.parse(comp?.reflection_text || '{}') } catch {}

  setReflections(prev => ({ ...prev, [challengeId]: {
    loaded: true,
    wahoo: parsed.wahoo_classification,
    title: parsed.source_label,
    gap_done: ch?.preaction_difficulty != null,
    identity_done: parsed.identity_statement != null || parsed.voice_objection != null,
    universe_done: ch?.universe_response != null,
    three_percent_done: parsed.reflection != null && parsed.reflection !== '',
    life_fuel_done: parsed.life_fuel != null,
    predicted_difficulty: ch?.predicted_difficulty,
    gap_voice: ch?.gap_voice,
    source_quest_id: ch?.quest_id,
  }}))
}
```

- [ ] **Step 3: Add reflection form components inline**

Each of the 7 reflections is a small inline form. When the user taps an uncompleted item, it expands to show the question and input. On submit, it calls `saveReflection` and marks itself done.

Inside the evidence card map, after the existing chips div, add:

```jsx
{expandedId === item.id && reflections[item.id]?.loaded && (() => {
  const r = reflections[item.id]
  const items = [
    { key: 'gap', done: r.gap_done, label: 'Gap Check', desc: 'Was it scarier than expected?' },
    { key: 'identity', done: r.identity_done, label: 'Identity', desc: "I've proven I'm someone who..." },
    { key: 'universe', done: r.universe_done, label: 'Universe', desc: 'Did the universe speak back?' },
    { key: 'cross', done: false, label: 'Cross-pollinate', desc: 'Did this feed another path?' },
    { key: 'three_percent', done: r.three_percent_done, label: '3% Better', desc: 'How to improve next time?' },
    { key: 'life_fuel', done: r.life_fuel_done, label: 'Life Fuel', desc: 'Choice / Connection / Mastery / Meaning' },
    { key: 'share', done: false, label: 'Share', desc: 'Share your win' },
  ]
  const doneCount = items.filter(i => i.done).length
  return (
    <div className="pt-reflect-section">
      <div className="pt-reflect-header">Reflect deeper ({doneCount} of {items.length})</div>
      <div className="pt-reflect-list">
        {items.map(ri => (
          <ReflectionItem key={ri.key} item={ri} challengeId={item.id} userId={userId}
            reflectionData={r}
            onSaved={(field, value) => {
              setReflections(prev => ({
                ...prev, [item.id]: { ...prev[item.id], [`${field}_done`]: true }
              }))
            }}
          />
        ))}
      </div>
    </div>
  )
})()}
```

- [ ] **Step 4: Build the ReflectionItem component (inline in ProgressTab)**

Each item is a collapsible row. Tapping opens the question form. Submitting saves and collapses.

```jsx
function ReflectionItem({ item, challengeId, userId, reflectionData, onSaved }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  if (item.done) {
    return (
      <div className="pt-reflect-item done">
        <span className="pt-reflect-check">☑</span>
        <span className="pt-reflect-label">{item.label}</span>
      </div>
    )
  }

  async function handleSave(field, val) {
    setSaving(true)
    await saveReflection({ userId, challengeId, field, value: val })
    onSaved(item.key, val)
    setSaving(false)
    setOpen(false)
  }

  return (
    <div className="pt-reflect-item">
      <span className="pt-reflect-check" onClick={() => setOpen(!open)}>☐</span>
      <div className="pt-reflect-text" onClick={() => setOpen(!open)}>
        <span className="pt-reflect-label">{item.label}</span>
        {!open && <span className="pt-reflect-desc">{item.desc}</span>}
      </div>
      {open && (
        <div className="pt-reflect-form">
          {item.key === 'gap' && (
            <GapCheckReflection challengeId={challengeId} userId={userId}
              predictedDifficulty={reflectionData.predicted_difficulty}
              onSaved={() => onSaved('gap', true)} />
          )}
          {item.key === 'identity' && (
            <>
              <label className="pt-reflect-q">
                {reflectionData.wahoo === 'anxious'
                  ? 'What did the voice say before you did it?'
                  : "I've proven I'm someone who..."}
              </label>
              <input type="text" className="pt-reflect-input" value={value}
                onChange={e => setValue(e.target.value)} placeholder="..." maxLength={100} />
              <button className="pt-reflect-save" disabled={!value.trim() || saving}
                onClick={() => handleSave(
                  reflectionData.wahoo === 'anxious' ? 'voice_objection' : 'identity_statement',
                  value.trim()
                )}>{saving ? 'Saving...' : 'Save'}</button>
            </>
          )}
          {item.key === 'universe' && (
            <>
              <label className="pt-reflect-q">Did the universe speak back?</label>
              <div className="pt-reflect-pills">
                {[{ v: 'compliment', l: '💬 Compliment' }, { v: 'opportunity', l: '🚪 Opportunity' },
                  { v: 'both', l: '✨ Both' }, { v: 'not_sure', l: '🤔 Not sure' }, { v: 'none', l: '😶 Not this time' }
                ].map(o => (
                  <button key={o.v} className={`pt-reflect-pill ${value === o.v ? 'selected' : ''}`}
                    onClick={() => setValue(o.v)}>{o.l}</button>
                ))}
              </div>
              <button className="pt-reflect-save" disabled={!value || saving}
                onClick={() => handleSave('universe_response', value)}>
                {saving ? 'Saving...' : 'Save'}</button>
            </>
          )}
          {item.key === 'cross' && (
            <CrossPollinationReflection challengeId={challengeId} userId={userId}
              sourceQuestId={reflectionData.source_quest_id}
              onSaved={() => onSaved('cross', true)} />
          )}
          {item.key === 'three_percent' && (
            <>
              <label className="pt-reflect-q">How can you make this 3% better next time?</label>
              <input type="text" className="pt-reflect-input" value={value}
                onChange={e => setValue(e.target.value)} placeholder="..." maxLength={200} />
              <button className="pt-reflect-save" disabled={!value.trim() || saving}
                onClick={() => handleSave('reflection', value.trim())}>
                {saving ? 'Saving...' : 'Save'}</button>
            </>
          )}
          {item.key === 'life_fuel' && (
            <LifeFuelReflection challengeId={challengeId} userId={userId}
              onSaved={() => onSaved('life_fuel', true)} />
          )}
          {item.key === 'share' && (
            <ShareReflection challengeId={challengeId} userId={userId}
              challengeTitle={reflectionData.title}
              wahoo={reflectionData.wahoo}
              onSaved={() => onSaved('share', true)} />
          )}
        </div>
      )}
    </div>
  )
}
```

The following sub-components are used by `ReflectionItem` and must be defined in the same file (or extracted to `src/components/reflections/`). Each is a proper React component with its own hooks:

```jsx
function GapCheckReflection({ challengeId, userId, predictedDifficulty, onSaved }) {
  const [preaction, setPreaction] = useState(null)
  const [experienced, setExperienced] = useState(null)
  const [saving, setSaving] = useState(false)
  const labels = ['Relaxed', 'Alert', 'Butterflies', 'Racing', 'Frozen']

  async function handleSave() {
    setSaving(true)
    await saveReflection({ userId, challengeId, field: 'preaction_difficulty', value: preaction })
    await saveReflection({ userId, challengeId, field: 'experienced_difficulty', value: experienced })
    onSaved()
  }

  return (
    <>
      <label className="pt-reflect-q">Right before you did it, what was your body doing?</label>
      <div className="pt-reflect-pills">
        {labels.map((s, i) => (
          <button key={s} className={`pt-reflect-pill ${preaction === i + 1 ? 'selected' : ''}`}
            onClick={() => setPreaction(i + 1)}>{s}</button>
        ))}
      </div>
      <label className="pt-reflect-q">And while you were doing it?</label>
      <div className="pt-reflect-pills">
        {labels.map((s, i) => (
          <button key={s} className={`pt-reflect-pill ${experienced === i + 1 ? 'selected' : ''}`}
            onClick={() => setExperienced(i + 1)}>{s}</button>
        ))}
      </div>
      {predictedDifficulty && preaction && experienced && (
        <p className="pt-reflect-desc" style={{ marginBottom: 8 }}>
          {experienced < predictedDifficulty
            ? 'Less scary than you expected. Your body learned something.'
            : experienced > predictedDifficulty
            ? 'Scarier than expected. That takes guts.'
            : 'Exactly what you predicted. Your self-awareness is sharp.'}
        </p>
      )}
      <button className="pt-reflect-save" disabled={!preaction || !experienced || saving}
        onClick={handleSave}>{saving ? 'Saving...' : 'Save'}</button>
    </>
  )
}

function LifeFuelReflection({ challengeId, userId, onSaved }) {
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)
  const fuels = ['choice', 'connection', 'mastery', 'meaning']
  const labels = { choice: '🔓 Choice', connection: '🤝 Connection', mastery: '📈 Mastery', meaning: '✨ Meaning' }

  async function handleSave() {
    setSaving(true)
    await saveReflection({ userId, challengeId, field: 'life_fuel', value: selected })
    onSaved()
  }

  return (
    <>
      <label className="pt-reflect-q">Which were true during this?</label>
      <div className="pt-reflect-pills">
        {fuels.map(f => (
          <button key={f} className={`pt-reflect-pill ${selected.includes(f) ? 'selected' : ''}`}
            onClick={() => setSelected(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])}>
            {labels[f]}
          </button>
        ))}
      </div>
      <button className="pt-reflect-save" disabled={selected.length === 0 || saving}
        onClick={handleSave}>{saving ? 'Saving...' : 'Save'}</button>
    </>
  )
}

function CrossPollinationReflection({ challengeId, userId, sourceQuestId, onSaved }) {
  const [quests, setQuests] = useState([])
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    supabase.from('quests').select('id, label')
      .eq('user_id', userId).eq('status', 'active')
      .neq('label', 'Healing Work')
      .then(({ data }) => {
        setQuests((data || []).filter(q => q.id !== sourceQuestId))
        setLoaded(true)
      })
  }, [userId, sourceQuestId])

  async function handleSave() {
    setSaving(true)
    if (selected.length > 0 && sourceQuestId) {
      const rows = selected.map(targetId => ({
        user_id: userId, source_quest_id: sourceQuestId,
        target_quest_id: targetId, groan_challenge_id: challengeId,
      }))
      await supabase.from('quest_cross_pollination').insert(rows).catch(() => {})
    }
    await saveReflection({ userId, challengeId, field: 'cross_pollination', value: selected })
    onSaved()
  }

  if (!loaded) return <p className="pt-reflect-desc">Loading paths...</p>
  if (quests.length === 0) return <p className="pt-reflect-desc">No other paths to cross-pollinate with yet.</p>

  return (
    <>
      <label className="pt-reflect-q">Did this also feed another path?</label>
      <div className="pt-reflect-pills">
        {quests.map(q => (
          <button key={q.id} className={`pt-reflect-pill ${selected.includes(q.id) ? 'selected' : ''}`}
            onClick={() => setSelected(prev => prev.includes(q.id) ? prev.filter(x => x !== q.id) : [...prev, q.id])}>
            {q.label}
          </button>
        ))}
      </div>
      <button className="pt-reflect-save" disabled={saving}
        onClick={handleSave}>{saving ? 'Saving...' : selected.length ? 'Save' : 'None'}</button>
    </>
  )
}

function ShareReflection({ challengeId, userId, challengeTitle, wahoo, onSaved }) {
  const [saving, setSaving] = useState(false)

  async function handleShare() {
    setSaving(true)
    const emoji = { vibe: '🔥', peace: '☺️', anxious: '😰', shutdown: '😶' }[wahoo] || '⚡'
    await import('../lib/communityFeed').then(m =>
      m.postFeedEvent(userId, 'courage_share', `${emoji} ${challengeTitle || 'Completed a courage challenge'}`)
    ).catch(() => {})
    await saveReflection({ userId, challengeId, field: 'shared', value: true })
    onSaved()
  }

  return (
    <>
      <label className="pt-reflect-q">Share this win with the community?</label>
      <button className="pt-reflect-save" disabled={saving}
        onClick={handleShare}>{saving ? 'Sharing...' : 'Share your win'}</button>
    </>
  )
}
```

- [ ] **Step 5: Add CSS for reflection forms**

```css
.pt-evidence-card { cursor: pointer; }
.pt-reflect-section { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.06); }
.pt-reflect-header { font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px; }
.pt-reflect-list { display: flex; flex-direction: column; gap: 4px; }
.pt-reflect-item { display: flex; align-items: flex-start; gap: 8px; padding: 6px 0; cursor: pointer; }
.pt-reflect-item.done { opacity: 0.5; cursor: default; }
.pt-reflect-check { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
.pt-reflect-text { flex: 1; }
.pt-reflect-label { display: block; font-size: 13px; font-weight: 600; color: #1a1a2e; }
.pt-reflect-desc { display: block; font-size: 11px; color: #6b7280; margin-top: 1px; }
.pt-reflect-form { width: 100%; margin-top: 8px; }
.pt-reflect-q { display: block; font-size: 13px; font-weight: 500; color: #1a1a2e; margin-bottom: 8px; }
.pt-reflect-input {
  width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 8px;
  font-size: 14px; margin-bottom: 8px; background: white;
}
.pt-reflect-input:focus { outline: none; border-color: #5e17eb; }
.pt-reflect-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.pt-reflect-pill {
  padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 8px;
  background: white; font-size: 12px; cursor: pointer;
}
.pt-reflect-pill.selected { border-color: #5e17eb; background: rgba(94,23,235,0.06); color: #5e17eb; font-weight: 600; }
.pt-reflect-save {
  padding: 8px 20px; background: #5e17eb; color: white; border: none;
  border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
}
.pt-reflect-save:disabled { opacity: 0.5; cursor: default; }
```

- [ ] **Step 6: Verify build + commit**

```bash
npm run build && git add src/components/ProgressTab.jsx src/components/ProgressTab.css && git commit -m "feat: add interactive reflection cards to evidence feed"
```

---

### Task 6: End-to-End Verification

**Files:** None (verification only)

- [ ] **Step 1: Full build**

Run: `npm run build` — must pass clean.

- [ ] **Step 2: Manual test checklist**

Run `npm run dev` and verify:

1. Complete a courage challenge → 3 screens appear (How? / Again? / Voice?)
2. Each screen auto-advances 300ms after tap
3. Back button works on screens 2 and 3
4. After screen 3 tap → confetti + DomeGrowthOverlay with animated radar
5. Dome polygon grows from center outward over ~800ms
6. Overlay auto-dismisses after 2.5s or on tap
7. Progress tab → evidence card shows the completed challenge
8. Tap evidence card → "Reflect deeper (0 of 7)" expands
9. Tap "Identity" → input form appears inline
10. Type and save → checkbox marks done, RP increments
11. Collapse and reopen → saved state persists

- [ ] **Step 3: Grep for orphaned references**

```bash
grep -n 'state_checkin\|three_percent\|cross_pollination\|handleCompleteReflection\|handleShareDone' src/components/GroanCompletionModal.jsx
```

Expected: No matches except comments.

- [ ] **Step 4: Final commit if fixes needed**

```bash
git add -A && git commit -m "fix: cleanup from e2e verification"
```
