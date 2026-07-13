# Sprint 3: Implementation Plan (Final)

**Created:** 2026-07-13
**Branch:** `light-portal`
**Depends on:** Sprint 2 (committed + deployed), Zarlo Brief running
**Spec doc:** `docs/features/octalysis-alignment-implementation-notes.md`

---

## Architecture: Mount-Check Pattern

Previous versions wired `checkHeroGraduation` into 8+ files. This was fragile (miss one = silent failure) and had a scope problem (celebration hook only lives in Challenge.jsx).

**Revised: ONE integration point.**

```
User does action (creates quest, completes wahoo, etc.)
  ↓
Component saves to database
  ↓
Challenge.jsx re-renders (or user navigates back to /7-day-challenge)
  ↓
useEffect on mount runs checkHeroGraduation()
  ↓
If graduated: celebrateStageGraduation() ← direct access to useCelebrations
  ↓
Store lastKnownStage in localStorage
```

**Why this works:**
- All actions that trigger graduations happen INSIDE Challenge.jsx's component tree (QuestSelector, GroanCompletionModal, HealingFlowModal, LevelTab) or on pages users navigate FROM back to `/7-day-challenge` (EssenceMirrorFlow, LifePathWidgetTest)
- The mount check catches ANY stage change regardless of source
- Celebration hook is in scope (Challenge.jsx already imports `useCelebrations`)
- Queries are cheap (~50ms total, indexed lookups)
- No risk of missing a trigger point

---

## What Sprint 3 Builds

| Item | What It Does | Effort |
|---|---|---|
| **3A** Hero stage graduation checker | `heroStageChecker.js` + mount-check in Challenge.jsx | 2 days |
| **3B** Graduation celebrations | Visual + copy per stage transition, using existing celebration system | 1 day |
| **3C** Insight Drops V1 | Styled self-knowledge cards (4 types, Common + Uncommon) | 2 days |
| **3D** Proactive Zarlo (trimmed) | 2 Brief-based triggers replacing Sprint 1C voice-only check | 1 day |

**Total: 6 days**

---

## Ownership Boundary: Zarlo Proactive vs Insight Drops

| | Zarlo Proactive | Insight Drops |
|---|---|---|
| **Purpose** | Things to DO (forward-looking) | Things to NOTICE (backward-looking) |
| **Example** | "You're close to a 21-day streak" | "80% of your wahoos are Connection" |
| **Delivery** | Bubble above FAB | Card slides up from bottom |
| **Max frequency** | 1/day | 1/session |

No insight appears in both systems.

---

## 3A: Hero Stage Graduation Checker

### Create: `src/lib/heroStageChecker.js`

```javascript
import { supabase } from './supabaseClient'

/**
 * Checks if a user qualifies for a hero stage graduation.
 * Returns { from, to, stageData } if graduated, or null if no change.
 * 
 * Designed to be called on Challenge.jsx mount. Cheap queries (~50ms).
 * Only advances ONE stage per call — subsequent mounts catch further graduations.
 */
export async function checkHeroGraduation(userId) {
  const { data: stageData } = await supabase
    .from('user_stage_progress')
    .select('current_journey_level, essence_mirror_completed, essence_archetype, essence_name')
    .eq('user_id', userId)
    .maybeSingle()

  const currentStage = stageData?.current_journey_level || 0
  let newStage = null
  let voiceData = null // Declared at function scope (used by 6→7 check AND return)

  // →2: Account exists + first NS check-in
  if (currentStage < 2) {
    const { count } = await supabase
      .from('nervous_system_checkins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (count > 0) newStage = 2
  }

  // 2→3: At least one active quest
  if (currentStage === 2) {
    const { count } = await supabase
      .from('quests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active')
    if (count > 0) newStage = 3
  }

  // 3→4: Essence Mirror completed
  if (currentStage === 3) {
    if (stageData?.essence_mirror_completed && stageData?.essence_archetype) {
      newStage = 4
    }
  }

  // 4→5: First wahoo classified as Vibe Rise
  if (currentStage === 4) {
    const { count } = await supabase
      .from('quest_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('quest_category', 'Groans')
      .like('reflection_text', '%"wahoo_classification":"vibe",%')
    if (count > 0) newStage = 5
  }

  // 5→6: 2+ wahoos completed
  if (currentStage === 5) {
    const { count } = await supabase
      .from('quest_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('quest_category', 'Groans')
    if (count >= 2) newStage = 6
  }

  // 6→7: Protective voice identified 5+ times
  if (currentStage === 6) {
    const { data: vd } = await supabase
      .from('healing_intentions')
      .select('protective_voice')
      .eq('user_id', userId)
      .not('protective_voice', 'is', null)

    voiceData = vd // Assign to function-scoped variable for return
    const counts = {}
    voiceData?.forEach(row => {
      if (row.protective_voice)
        counts[row.protective_voice] = (counts[row.protective_voice] || 0) + 1
    })
    const maxCount = Math.max(0, ...Object.values(counts))
    if (maxCount >= 5) newStage = 7
  }

  // If graduated, update the stage
  // Use UPDATE (not UPSERT) — row should always exist from PersonaAssessment.
  // If UPDATE affects 0 rows (edge case: missing row), fall back to INSERT.
  if (newStage !== null && newStage > currentStage) {
    const { count } = await supabase
      .from('user_stage_progress')
      .update({ current_journey_level: newStage })
      .eq('user_id', userId)

    // Fallback: if no row existed, create minimal one
    if (count === 0) {
      await supabase
        .from('user_stage_progress')
        .insert({ user_id: userId, current_journey_level: newStage, conversations_logged: 0 })
        .catch(() => {}) // Silent — if INSERT also fails (constraint), stage just doesn't advance
    }

    return {
      from: currentStage,
      to: newStage,
      stageData,
      dominantVoice: currentStage === 6 ? getDominantVoice(voiceData) : null,
    }
  }

  return null
}

function getDominantVoice(voiceData) {
  const counts = {}
  voiceData?.forEach(row => {
    if (row.protective_voice)
      counts[row.protective_voice] = (counts[row.protective_voice] || 0) + 1
  })
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return sorted[0] ? sorted[0][0] : null
}
```

**Key fix from previous version:** Stage 4→5 uses `LIKE` filter on `reflection_text` instead of fetching all rows and parsing JSON client-side. Postgres handles the filter server-side. Much faster for users with many completions.

### Integration: `src/Challenge.jsx`

Wire into the EXISTING `current_journey_level` load (line ~286).

**CRITICAL: Do NOT replace the existing useEffect. EXTEND it.** The existing useEffect at ~line 286 loads `current_journey_level` AND handles tab unlocking (Courage tab unlock at lines ~296-309). All of that logic MUST be preserved.

```javascript
import { checkHeroGraduation } from './lib/heroStageChecker'

// EXTEND the existing useEffect at ~line 286. Add graduation check
// AFTER the existing stage load, BEFORE the existing tab unlock logic.
// 
// The existing code structure is:
//   useEffect(() => {
//     supabase.from('user_stage_progress').select('current_journey_level')...
//       .then(({ data }) => {
//         const level = data?.current_journey_level || 0
//         setCurrentJourneyLevel(level)
//         // ... tab unlock logic ...
//       })
//   }, [user?.id])
//
// Refactor to async and insert graduation check:

useEffect(() => {
  if (!user?.id) return

  const loadStageAndCheckGraduation = async () => {
    // 1. Check for graduation FIRST (may update the stage in DB)
    const graduation = await checkHeroGraduation(user.id)

    // 2. Load current stage (may have just been updated by graduation check)
    const { data } = await supabase
      .from('user_stage_progress')
      .select('current_journey_level')
      .eq('user_id', user.id)
      .maybeSingle()

    const level = data?.current_journey_level || 0
    setCurrentJourneyLevel(level)

    // 3. Celebrate graduation if detected
    if (graduation) {
      const lastKnown = parseInt(localStorage.getItem('last_hero_stage') || '0')
      localStorage.setItem('last_hero_stage', String(graduation.to))

      // Only celebrate if user has visited before (not first load ever)
      if (lastKnown > 0) {
        celebrateStageGraduation(graduation.from, graduation.to, {
          essenceName: graduation.stageData?.essence_name,
          voiceName: graduation.dominantVoice,
        })
      }
    } else {
      const lastKnown = parseInt(localStorage.getItem('last_hero_stage') || '0')
      if (lastKnown === 0 && level > 0) {
        localStorage.setItem('last_hero_stage', String(level))
      }
    }

    // 4. PRESERVE ALL EXISTING TAB UNLOCK LOGIC BELOW THIS LINE
    // (Courage tab unlock, etc. — do not delete!)
    if (level === 0) {
      // ... existing tab unlock code stays here unchanged ...
    }
  }

  loadStageAndCheckGraduation()
}, [user?.id])
```
```

**That's the ENTIRE integration. One file. One useEffect. No changes to any other component.**

---

## 3B: Graduation Celebrations

### File: `src/hooks/useCelebrations.js`

Add to existing imports:

```javascript
import confetti from 'canvas-confetti'
import { triggerSideCannons } from '../components/Celebrations'
```

Add function (inside the hook, before the return):

```javascript
const celebrateStageGraduation = useCallback((fromStage, toStage, context = {}) => {
  const CELEBRATIONS = {
    '0-2': { confetti: 'purple', emoji: '🌱',
      message: 'Something just shifted. Welcome.' },
    '2-3': { confetti: 'purple', emoji: '🗺️',
      message: 'You can see the paths now. That\'s the first step.' },
    '3-4': { confetti: 'side_cannons', emoji: '🪞',
      message: context.essenceName
        ? `You've been called this your whole life without knowing it. ${context.essenceName}.`
        : 'Your archetype has been revealed.' },
    '4-5': { confetti: 'gold', emoji: '🔥',
      message: 'There it is. You felt it. Remember this next time the voice gets loud.' },
    '5-6': { confetti: 'purple', emoji: '⚔️',
      message: 'You\'re ready for the arena. Time to train with others.' },
    '6-7': { confetti: null, emoji: '👁️',
      message: context.voiceName
        ? `The ${context.voiceName.charAt(0).toUpperCase() + context.voiceName.slice(1).replace(/_/g, ' ')}. Five times. You're ready to face the root.`
        : 'The pattern is clear now. You\'re ready to face the root.' },
  }

  const key = `${fromStage}-${toStage}`
  const c = CELEBRATIONS[key]
  if (!c) return

  if (c.confetti === 'side_cannons') triggerSideCannons()
  else if (c.confetti === 'gold') {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#E9A23B', '#f5c55a', '#fbbf24'] })
    setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors: ['#E9A23B', '#f5c55a'] }), 300)
  } else if (c.confetti === 'purple') {
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 }, colors: ['#5e17eb', '#8b5cf6', '#c4b5fd'] })
  }
  // 6→7: no confetti (reverent)

  setShowLevelUp({ name: c.message, emoji: c.emoji, description: '', isGraduation: true })
  setLevelUpKey(k => k + 1)
  if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200])
}, [])
```

Add `celebrateStageGraduation` to the hook's return object.

### File: `src/components/Celebrations/LevelUpModal.jsx`

Add graduation variant handling:

```javascript
// In the component, detect graduation:
const isGraduation = level?.isGraduation

// Adjust auto-dismiss timer:
const dismissTime = isGraduation ? 10000 : 8000

// For graduation, show level.name as body text (it's the Figurine message):
// Existing: <h2>{level.name}</h2> — this already works since we pass the message as name
// Just increase font size slightly for graduations and use 10s timer
```

---

## 3C: Insight Drops V1

### Create: `src/hooks/useInsightDrops.js`

```javascript
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useInsightDrops(userId) {
  const [insight, setInsight] = useState(null)

  useEffect(() => {
    if (!userId) return
    // Only check once per mount (1 per session)
    checkInsights(userId).then(setInsight)
  }, [userId])

  const dismiss = () => {
    if (insight?.key) localStorage.setItem(`insight_seen_${insight.key}`, 'true')
    setInsight(null)
  }

  return { insight, dismissInsight: dismiss }
}

async function checkInsights(userId) {
  const seen = (key) => localStorage.getItem(`insight_seen_${key}`)

  // Try Brief first for pattern-based insights
  const { data: briefRow } = await supabase
    .from('zarlo_briefs')
    .select('brief')
    .eq('user_id', userId)
    .maybeSingle()

  const brief = briefRow?.brief

  // 1. Common: Visibility layer dominance (needs 5+ wahoos)
  if (brief?.patterns?.visibility_layers) {
    const layers = brief.patterns.visibility_layers
    const total = Object.values(layers).reduce((a, b) => a + b, 0)
    if (total >= 5) {
      const top = Object.entries(layers).sort((a, b) => b[1] - a[1])[0]
      if (top && top[1] / total >= 0.6) {
        const key = `category_${top[0]}`
        if (!seen(key)) {
          return {
            key, rarity: 'common', icon: '🎯',
            title: `Your courage lives in ${cap(top[0])}`,
            body: `${Math.round(top[1] / total * 100)}% of your wahoos are ${cap(top[0])} challenges.`,
          }
        }
      }
    }
  }

  // 2. Common: Streak milestone REACHED (direct query, not Brief — avoids staleness)
  const { data: streakData } = await supabase
    .from('groan_streaks')
    .select('current_streak')
    .eq('user_id', userId)
    .maybeSingle()

  const streak = streakData?.current_streak || 0
  for (const m of [7, 14, 21, 30, 60, 100]) {
    if (streak >= m && !seen(`streak_reached_${m}`)) {
      return {
        key: `streak_reached_${m}`, rarity: 'common', icon: '🔥',
        title: `${m} days`,
        body: `${m} days of showing up. Your nervous system is learning something new about you.`,
      }
    }
  }

  // 3. Uncommon: First visibility layer unlocked
  if (brief?.patterns?.visibility_layers) {
    for (const [layer, count] of Object.entries(brief.patterns.visibility_layers)) {
      if (count === 1 && !seen(`first_${layer}`)) {
        return {
          key: `first_${layer}`, rarity: 'uncommon', icon: '✨',
          title: `New territory: ${cap(layer)}`,
          body: `You just went ${cap(layer)} for the first time. The voice didn't want you here.`,
        }
      }
    }
  }

  // 4. Uncommon: Protective voice emerging (count = 3)
  const voice = brief?.patterns?.dominant_voice
  if (voice?.count === 3 && !seen(`voice_emerging_${voice.name}`)) {
    return {
      key: `voice_emerging_${voice.name}`, rarity: 'uncommon', icon: '🔮',
      title: `Voice identified: The ${cap(voice.name)}`,
      body: `The ${cap(voice.name)} is your most frequent block. It shows up when you're about to do something that matters.`,
    }
  }

  return null
}

function cap(str) {
  return str?.charAt(0).toUpperCase() + str?.slice(1).replace(/_/g, ' ')
}
```

**Key fix:** Streak milestone uses DIRECT query to `groan_streaks` instead of Brief data. Avoids staleness issue (Brief generated at 4am, streak changes throughout the day).

### Create: `src/components/InsightDrop.jsx` + `src/components/InsightDrop.css`

Component and CSS as specified in original plan (slide-up card, dismiss button, rarity styling). No changes from previous version — that spec was correct.

### Integration: `src/Challenge.jsx`

```javascript
import { useInsightDrops } from './hooks/useInsightDrops'
import InsightDrop from './components/InsightDrop'

// Inside Challenge function:
const { insight, dismissInsight } = useInsightDrops(user?.id)

// In JSX (after tab content, before closing divs):
{insight && <InsightDrop insight={insight} onDismiss={dismissInsight} />}
```

---

## 3D: Proactive Zarlo (Trimmed — 2 triggers)

### File: `src/components/Zarlo/ZarloWidget.jsx`

Replace `checkVoicePatterns` with Brief-based check. Keep voice-only as fallback:

```javascript
const checkProactiveInsights = useCallback(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().slice(0, 10)
    if (localStorage.getItem(`zarlo_proactive_${today}`)) return

    const { data: briefRow } = await supabase
      .from('zarlo_briefs')
      .select('brief')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!briefRow?.brief) {
      checkVoicePatterns() // Sprint 1C fallback
      return
    }

    const brief = briefRow.brief
    let message = null

    // 1. Voice readiness (1 away from Stage 7)
    if (brief.thresholds?.voice_count_to_graduate === 1) {
      const voice = brief.patterns?.dominant_voice
      if (voice && !localStorage.getItem(`zarlo_readiness_${voice.name}`)) {
        message = `One more pattern and something becomes clear. The ${cap(voice.name)} is almost fully visible.`
        localStorage.setItem(`zarlo_readiness_${voice.name}`, 'true')
      }
    }

    // 2. Streak milestone approaching
    if (!message && brief.thresholds?.streak_milestone_approaching) {
      const milestone = brief.thresholds.streak_milestone_approaching.replace('_', '-')
      const key = `zarlo_streak_${milestone}`
      if (!localStorage.getItem(key)) {
        message = `You're close to a ${milestone} streak. That's not luck. That's you showing up.`
        localStorage.setItem(key, 'true')
      }
    }

    if (message) {
      setProactiveMessage(message)
      setHasNotification(true)
      localStorage.setItem(`zarlo_proactive_${today}`, 'true')
    }
  } catch (e) { /* silent */ }
}, [checkVoicePatterns])

function cap(str) {
  return str?.charAt(0).toUpperCase() + str?.slice(1).replace(/_/g, ' ')
}
```

Replace the useEffect:
```javascript
useEffect(() => {
  checkProactiveInsights()
}, [checkProactiveInsights])
```

---

## Backfill: Existing Users

### Create: `supabase/functions/backfill-hero-stages/index.ts`

```typescript
// One-time Edge Function to advance existing users to their correct hero stage.
// For each user, runs checkHeroGraduation in a loop (max 20 iterations)
// until no more graduations qualify.
// 
// Invoke manually: curl -X POST .../functions/v1/backfill-hero-stages
// Safe to re-run (idempotent — already-correct stages won't change)
```

The function:
1. Fetches all users from `user_stage_progress`
2. For each user, runs graduation checks in a loop (max 20 iterations guard)
3. Reports: `{ processed: N, graduated: M, errors: E }`

No celebrations fire during backfill (Edge Function, not UI).

---

## Build Sequence

```
Day 1-2: Graduation checker + mount integration (3A)
  - Create heroStageChecker.js
  - Wire into Challenge.jsx existing useEffect (~line 286)
  - Create backfill Edge Function
  - Test: manually trigger each graduation condition
  - Run backfill for existing users

Day 3: Graduation celebrations (3B)
  - Add celebrateStageGraduation to useCelebrations
  - Adapt LevelUpModal (isGraduation flag, 10s dismiss)
  - Test: graduation fires celebration on Challenge mount

Day 4-5: Insight Drops (3C)
  - Create InsightDrop component + CSS
  - Create useInsightDrops hook
  - Wire into Challenge.jsx
  - Test: each of 4 insight types with real data

Day 6: Proactive Zarlo trimmed (3D)
  - Replace voice-only check with Brief-based 2-trigger check
  - Keep fallback for users without Brief
  - Test: streak + readiness triggers
```

---

## Testing Checklist

### 3A: Graduation Triggers
- [ ] New user: first check-in → mount-check sets stage 2
- [ ] Stage 2 user creates quest → next mount sets stage 3
- [ ] Stage 3 user completes Essence Mirror → next mount sets stage 4
- [ ] Stage 4 user completes Vibe Rise wahoo → next mount sets stage 5
- [ ] Stage 5 user completes 2nd wahoo → next mount sets stage 6
- [ ] Stage 6 user gets 5th voice ID → next mount sets stage 7
- [ ] User with no `user_stage_progress` row → UPSERT creates row
- [ ] Backfill advances existing users correctly
- [ ] Journey tab shows updated stage after graduation
- [ ] Stage 4→5 LIKE query works (no JSON parsing client-side)

### 3B: Graduation Celebrations
- [ ] Each stage transition shows correct confetti + copy
- [ ] 6→7: no confetti (reverent), voice name in message
- [ ] LevelUpModal auto-dismisses at 10s for graduations
- [ ] First-ever load doesn't celebrate (lastKnownStage = 0)
- [ ] Celebration fires only on CHANGE (not every mount)

### 3C: Insight Drops
- [ ] Category dominance after 5+ wahoos (Common, purple)
- [ ] Streak reached at 7/14/21/30 (Common) — uses live query not Brief
- [ ] First visibility layer (Uncommon, gold)
- [ ] Voice emerging at count 3 (Uncommon)
- [ ] Max 1 per session, dismissed stay dismissed
- [ ] No overlap with Zarlo proactive messages

### 3D: Proactive Zarlo
- [ ] Voice readiness message (count 4, one from graduation)
- [ ] Streak approaching message (within 3 of milestone)
- [ ] Falls back to Sprint 1C if no Brief
- [ ] Max 1/day, same message doesn't repeat

---

*Depends on: Sprint 2 deployed + Brief generating data.*
*Next: Sprint 4 (Figurine Unstick Flow, Social V1, expanded proactive triggers)*
