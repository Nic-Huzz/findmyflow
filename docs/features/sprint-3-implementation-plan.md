# Sprint 3: Implementation Plan (Revised)

**Created:** 2026-07-13 (rewrite — original had 3 design flaws)
**Branch:** `light-portal`
**Depends on:** Sprint 2 (committed + deployed), Zarlo Brief running
**Spec doc:** `docs/features/octalysis-alignment-implementation-notes.md`

---

## Why This Rewrite

The original Sprint 3 had three problems:

1. **Proactive triggers were overengineered.** Most users have null Brief data. 6 trigger types for data that doesn't exist yet is premature. Trimmed to 2 that will actually fire.

2. **Graduation celebrations had no trigger logic.** Nothing in the app actually SETS `current_journey_level`. Building celebrations without triggers = dead code.

3. **Insight Drops competed with proactive triggers.** Both read the Brief, both surface patterns. No ownership boundary.

---

## Revised Sprint 3: What to Build

| Item | What It Does | Effort | Priority |
|---|---|---|---|
| **3A** Hero stage graduation triggers | Logic that detects graduation conditions and increments `current_journey_level` | 2-3 days | HIGHEST — everything else depends on this |
| **3B** Graduation celebrations | Visual + copy when a stage transition fires | 1-2 days | After 3A |
| **3C** Insight Drops V1 | Styled self-knowledge cards (identity reflections only, no behavioural nudges) | 2 days | Independent |
| **3D** Proactive Zarlo (trimmed) | 2 Brief-based triggers: streak milestone + voice readiness | 1 day | After Brief has data |

**Total estimated effort:** 6-8 days

### Ownership Boundary: Zarlo Proactive vs Insight Drops

| | Zarlo Proactive Triggers | Insight Drops |
|---|---|---|
| **Purpose** | Things to DO | Things to NOTICE about yourself |
| **Tone** | Behavioural nudge | Identity reflection |
| **Example** | "You're close to a 21-day streak. Keep going." | "80% of your wahoos are Connection. Your courage lives in relationships." |
| **Delivery** | Bubble above Zarlo FAB, tap to chat | Card slides up from bottom, dismiss or explore |
| **Frequency** | 1/day max | 1 per app session max |
| **Data source** | Brief thresholds + contradictions | Brief patterns + quest_completions |

**Rule:** An insight should never appear as BOTH a Zarlo bubble AND an Insight Drop. Each insight type is assigned to one system.

| Insight Type | Owned By |
|---|---|
| Streak milestone approaching | Zarlo Proactive |
| Voice readiness (1 from graduation) | Zarlo Proactive |
| Contradiction (safe but pressure) | Zarlo Proactive (future, when data exists) |
| Day-of-week pattern | Zarlo Proactive (future, when data exists) |
| Category/visibility dominance | Insight Drops |
| First visibility layer unlocked | Insight Drops |
| Voice emerging (count = 3) | Insight Drops |
| Streak milestone reached (hit, not approaching) | Insight Drops |
| Identity statement language shift | Insight Drops (V2) |

---

## 3A: Hero Stage Graduation Triggers

### Why This Is First

Without graduation triggers, the hero stage never changes. The Journey tab always shows Stage 0. Celebrations never fire. Insight Drops about "voice emerging" never trigger because the system doesn't know the user is at Stage 6. Everything downstream depends on accurate hero stage tracking.

### Graduation Conditions (from measurement framework)

| Transition | Condition | How to Check |
|---|---|---|
| **→2** (Earthquake) | Account created + first NS check-in | `user_stage_progress` exists + `nervous_system_checkins` count >= 1 |
| **2→3** (Head Full of Dreams) | Life Paths exercise complete + 1+ courage challenge identified | `quests` count >= 1 with status 'active' |
| **3→4** (Mirror/Mentor) | Essence Mirror complete + avatar generated | `user_stage_progress.essence_mirror_completed = true` |
| **4→5** (First Vibe Rise) | First wahoo with classification = Vibe Rise | `quest_completions` with `reflection_text` JSON containing `wahoo_classification: 'vibe'` |
| **5→6** (Daily Loop) | 2nd wahoo completed | `quest_completions` with `quest_category = 'Groans'` count >= 2 |
| **6→7** (Pattern Revealed) | Protective voice identified 5x | `healing_intentions` voice count >= 5 (Sprint 1C already computes this) |

Stages 7→8 through 11→12 require human-facilitated actions (session booking, Flow Statement, life changes). Those are manual/self-reported transitions for a future sprint.

### Implementation: `src/lib/heroStageChecker.js` (NEW)

```javascript
import { supabase } from './supabaseClient'

/**
 * Checks if a user qualifies for a hero stage graduation.
 * Returns the new stage number if graduated, or null if no change.
 * 
 * Call this after key actions:
 * - After daily check-in (could trigger →2)
 * - After quest creation (could trigger 2→3)
 * - After Essence Mirror completion (could trigger 3→4)
 * - After wahoo completion (could trigger 4→5, 5→6)
 * - After healing flow completion (could trigger 6→7)
 */
export async function checkHeroGraduation(userId) {
  // 1. Get current stage
  const { data: stageData } = await supabase
    .from('user_stage_progress')
    .select('current_journey_level, essence_mirror_completed, essence_archetype, essence_name')
    .eq('user_id', userId)
    .maybeSingle()

  const currentStage = stageData?.current_journey_level || 0

  // 2. Check graduation condition for current stage
  let newStage = null

  if (currentStage < 2) {
    // →2: Account exists + first NS check-in
    const { count } = await supabase
      .from('nervous_system_checkins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (count > 0) newStage = 2
  }

  if (currentStage === 2) {
    // 2→3: At least one active quest (life path)
    const { count } = await supabase
      .from('quests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active')
    if (count > 0) newStage = 3
  }

  if (currentStage === 3) {
    // 3→4: Essence Mirror completed
    if (stageData?.essence_mirror_completed && stageData?.essence_archetype) {
      newStage = 4
    }
  }

  if (currentStage === 4) {
    // 4→5: First wahoo classified as Vibe Rise
    const { data: completions } = await supabase
      .from('quest_completions')
      .select('reflection_text')
      .eq('user_id', userId)
      .eq('quest_category', 'Groans')
      .not('reflection_text', 'is', null)
    
    const hasVibeRise = completions?.some(c => {
      try {
        const parsed = JSON.parse(c.reflection_text)
        return parsed.wahoo_classification === 'vibe'
      } catch { return false }
    })
    if (hasVibeRise) newStage = 5
  }

  if (currentStage === 5) {
    // 5→6: 2+ wahoos completed
    const { count } = await supabase
      .from('quest_completions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('quest_category', 'Groans')
    if (count >= 2) newStage = 6
  }

  if (currentStage === 6) {
    // 6→7: Protective voice identified 5+ times
    const { data: voiceData } = await supabase
      .from('healing_intentions')
      .select('protective_voice')
      .eq('user_id', userId)
      .not('protective_voice', 'is', null)

    const counts = {}
    voiceData?.forEach(row => {
      if (row.protective_voice)
        counts[row.protective_voice] = (counts[row.protective_voice] || 0) + 1
    })
    const maxCount = Math.max(0, ...Object.values(counts))
    if (maxCount >= 5) newStage = 7
  }

  // 3. If graduated, update the stage (UPSERT — row may not exist for new users)
  if (newStage !== null && newStage > currentStage) {
    await supabase
      .from('user_stage_progress')
      .upsert({
        user_id: userId,
        current_journey_level: newStage,
      }, { onConflict: 'user_id' })

    return { from: currentStage, to: newStage, stageData }
  }

  return null
}
```

### Where to Call It

The checker should run after actions that could trigger a transition:

| Action | File(s) | Possible Graduation |
|---|---|---|
| Daily check-in completed | `DailyCheckin.jsx` (after NS insert) | →2 |
| Quest created | `QuestSelector.jsx:34`, `LevelTab.jsx:125`, `WahooDiscoveryFlow.jsx:113`, `LifePathWidgetTest.jsx:968` (4 creation points) | 2→3 |
| Essence Mirror saved | `EssenceMirrorFlow.jsx` (final save step) | 3→4 |
| Wahoo completed | `GroanCompletionModal.jsx` (after save) | 4→5, 5→6 |
| Healing flow completed | `HealingFlowModal.jsx` (after save) | 6→7 |

**IMPORTANT:** Quest creation happens in 4 different files. All must call `checkHeroGraduation`. The cleanest approach: create a shared `createQuest()` utility that wraps the Supabase insert + graduation check, then call it from all 4 locations. But for Sprint 3, calling the checker inline after each insert is acceptable.

**Integration pattern (same in each file):**

```javascript
import { checkHeroGraduation } from '../lib/heroStageChecker'

// After the relevant action completes:
const graduation = await checkHeroGraduation(userId)
if (graduation) {
  // Fire celebration (Sprint 3B)
  celebrateStageGraduation(graduation.from, graduation.to, {
    essenceName: graduation.stageData?.essence_name,
  })
}
```

### Edge Cases

- **`user_stage_progress` row doesn't exist:** Uses UPSERT with `onConflict: 'user_id'`. If no row, creates one with just `current_journey_level` set. Other columns get DB defaults. This handles new users who bypass PersonaAssessment.
- **User at Stage 0 with lots of existing data:** First check-in could cascade through →2, 2→3, 3→4 etc. The checker only advances ONE stage per call. Subsequent calls on later actions will catch up. No need to cascade in a single call.
- **Existing users who already qualify for Stage 5+ but are at Stage 0:** Run the backfill script (below) after deploying. They'll also graduate naturally on their next action.
- **Race condition on rapid taps:** The checker reads-then-writes. Two simultaneous calls could both read Stage 4 and both try to write Stage 5. The UPSERT is idempotent. No harm.
- **Stage 4→5 JSON parsing:** Uses try/catch per row. Malformed `reflection_text` is silently skipped, not crash-inducing.

---

## 3B: Graduation Celebrations

### Depends On: 3A (graduation triggers must exist)

### File: `src/hooks/useCelebrations.js`

Add `celebrateStageGraduation`:

```javascript
import confetti from 'canvas-confetti'
import { triggerSideCannons } from '../components/Celebrations'

const celebrateStageGraduation = useCallback((fromStage, toStage, context = {}) => {
  const CELEBRATIONS = {
    '0-2': {
      confetti: 'gentle_purple',
      message: "Something just shifted. Welcome.",
      emoji: '🌱',
    },
    '2-3': {
      confetti: 'gentle_purple',
      message: "You can see the paths now. That's the first step.",
      emoji: '🗺️',
    },
    '3-4': {
      confetti: 'side_cannons',
      message: context.essenceName
        ? `You've been called this your whole life without knowing it. ${context.essenceName}.`
        : 'Your archetype has been revealed.',
      emoji: '🪞',
    },
    '4-5': {
      confetti: 'gold',
      message: 'There it is. You felt it. Remember this next time the voice gets loud.',
      emoji: '🔥',
    },
    '5-6': {
      confetti: 'gentle_purple',
      message: "You're ready for the arena. Time to train with others.",
      emoji: '⚔️',
    },
    '6-7': {
      confetti: null, // No confetti. Reverent.
      message: context.voiceName
        ? `The ${context.voiceName}. Five times. It's been running your show. You're ready to face the root.`
        : "The pattern is clear now. You're ready to face the root.",
      emoji: '👁️',
    },
  }

  const key = `${fromStage}-${toStage}`
  const celebration = CELEBRATIONS[key]
  if (!celebration) return

  // Visual
  if (celebration.confetti === 'side_cannons') {
    triggerSideCannons()
  } else if (celebration.confetti === 'gold') {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#E9A23B', '#f5c55a', '#fbbf24'] })
    setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors: ['#E9A23B', '#f5c55a'] }), 300)
  } else if (celebration.confetti === 'gentle_purple') {
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 }, colors: ['#5e17eb', '#8b5cf6', '#c4b5fd'] })
  }

  // Modal
  setShowLevelUp({
    name: celebration.message,
    emoji: celebration.emoji,
    description: '',
    isGraduation: true,
  })
  setLevelUpKey(k => k + 1)

  // Haptic
  if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200])
}, [])
```

### LevelUpModal Adaptation

**File:** `src/components/Celebrations/LevelUpModal.jsx`

When `level.isGraduation === true`:
- Auto-dismiss after 10s (not 8s)
- Show `level.name` as the primary copy (it's the Figurine message, not a level name)
- Hide `level.description` (empty for graduations)
- Use slightly larger text for the message

---

## 3C: Insight Drops V1

### Ownership: Identity Reflections Only

Insight Drops answer "What should I NOTICE about myself?" NOT "What should I DO?"

| Insight Drops (identity) | NOT Insight Drops (goes to Zarlo Proactive) |
|---|---|
| "80% of your wahoos are Connection" | "You're close to a 21-day streak" |
| "First time you went Live" | "The Perfectionist is one away from 5" |
| "Voice emerging: The Perfectionist at 3" | "Your healing tab visits are dropping" |
| "14-day streak reached" (past tense) | "Your streak is approaching 14" (future) |

**Key distinction:** Insight Drops are BACKWARD-looking (what happened). Proactive triggers are FORWARD-looking (what to do next).

### Components

Same as original plan — `InsightDrop.jsx`, `InsightDrop.css`, `useInsightDrops.js`. No changes to the component spec. The hook's `checkInsights` function stays the same but only surfaces backward-looking identity insights:

**V1 insight types (4 total):**

1. **Category dominance** (Common) — after 5+ wahoos, if 60%+ are one visibility layer
2. **Streak milestone reached** (Common) — at 7/14/21/30/60/100 days (past tense: "you hit 14 days")
3. **First visibility layer** (Uncommon) — first time a new layer has count = 1
4. **Voice emerging** (Uncommon) — dominant protective voice count hits 3

### Integration in Challenge.jsx

```javascript
import { useInsightDrops } from './hooks/useInsightDrops'
import InsightDrop from './components/InsightDrop'

// Inside Challenge:
const { insight, dismissInsight } = useInsightDrops(user?.id)

// In JSX (after tab content, before Zarlo widget):
{insight && <InsightDrop insight={insight} onDismiss={dismissInsight} />}
```

**Frequency:** Max 1 per app session. The hook checks on mount. If an insight is dismissed, no new one appears until next session (page reload / re-mount).

---

## 3D: Proactive Zarlo (Trimmed)

### Only 2 Triggers (rest added when Brief data is richer)

**File:** `src/components/Zarlo/ZarloWidget.jsx`

Replace the current `checkVoicePatterns` + `checkProactiveInsights` with a simpler check that reads the Brief for just 2 things:

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
      // Fallback: run Sprint 1C voice-only check
      checkVoicePatterns()
      return
    }

    const brief = briefRow.brief
    let message = null

    // 1. Voice readiness (1 away from Stage 7 graduation)
    if (brief.thresholds?.voice_count_to_graduate === 1) {
      const voice = brief.patterns?.dominant_voice
      if (voice && !localStorage.getItem(`zarlo_readiness_voice_${voice.name}`)) {
        const label = voice.name.charAt(0).toUpperCase() + voice.name.slice(1).replace(/_/g, ' ')
        message = `One more pattern and something becomes clear. The ${label} is almost fully visible.`
        localStorage.setItem(`zarlo_readiness_voice_${voice.name}`, 'true')
      }
    }

    // 2. Streak milestone approaching
    if (!message && brief.thresholds?.streak_milestone_approaching) {
      const milestone = brief.thresholds.streak_milestone_approaching.replace('_', '-')
      const key = `zarlo_streak_approaching_${milestone}`
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
  } catch (e) {
    // Silent fail
  }
}, [checkVoicePatterns])
```

**Future triggers (Sprint 4+, when Brief has 4+ weeks of data):**
- Contradiction detection
- Day-of-week patterns
- Visibility gap nudges
- Return-after-absence

---

## Build Sequence

```
Day 1-2: Graduation triggers (3A) — CRITICAL PATH
  - Create heroStageChecker.js
  - Wire into DailyCheckin, GroanCompletionModal, EssenceMirrorFlow,
    HealingFlowModal, WahooCreator/QuestBoardCard
  - Test: verify stage increments correctly after each trigger action
  - Backfill: run checker once for existing users to set correct stages

Day 3-4: Graduation celebrations (3B)
  - Add celebrateStageGraduation to useCelebrations
  - Adapt LevelUpModal for graduation variant
  - Wire celebration into the graduation check callback
  - Test: trigger each stage transition, verify correct confetti + copy

Day 5-6: Insight Drops (3C)
  - Create InsightDrop component + CSS
  - Create useInsightDrops hook (4 insight types)
  - Wire into Challenge.jsx
  - Test: verify each insight type with real/mocked Brief data

Day 7: Trimmed proactive (3D)
  - Replace ZarloWidget triggers with Brief-based 2-trigger check
  - Keep Sprint 1C voice check as fallback
  - Test: verify streak + readiness triggers fire correctly
```

---

## Backfill: Existing Users

After 3A is built, many existing users will be at Stage 0 despite having completed actions that qualify them for higher stages. Run a one-time backfill:

```javascript
// Run once (can be an Edge Function or manual script)
// For each user, run checkHeroGraduation repeatedly until no more graduations
async function backfillHeroStages() {
  const { data: users } = await supabase
    .from('user_stage_progress')
    .select('user_id')

  for (const { user_id } of users) {
    let graduated = true
    while (graduated) {
      const result = await checkHeroGraduation(user_id)
      graduated = result !== null
    }
  }
}
```

This cascades: a user at Stage 0 who has completed everything through Stage 6 will graduate 0→2→3→4→5→6 across 6 calls. No celebrations fire during backfill (only fires when called from UI components).

---

## Success Metrics

| Metric | How to Measure |
|---|---|
| Hero stages accurately reflect user progress | Query: `SELECT current_journey_level, COUNT(*) FROM user_stage_progress GROUP BY 1` — distribution should match expected user progression |
| Graduation celebrations fire | Manual: complete qualifying action, verify celebration |
| Insight Drops appear at right moments | Manual: user with 5+ wahoos sees category dominance card |
| No overlap between Zarlo proactive and Insight Drops | Review: no insight type appears in both systems |

**North star:** % of life paths trending toward Vibe Rise state.

---

## Testing Checklist

### 3A: Graduation Triggers
- [ ] New user: first check-in → stage becomes 2
- [ ] Stage 2 user: creates first quest → stage becomes 3
- [ ] Stage 3 user: completes Essence Mirror → stage becomes 4
- [ ] Stage 4 user: completes wahoo with Vibe Rise classification → stage becomes 5
- [ ] Stage 5 user: completes 2nd wahoo → stage becomes 6
- [ ] Stage 6 user: 5th protective voice identification → stage becomes 7
- [ ] Backfill script advances existing users to correct stages
- [ ] Journey tab shows updated stage after graduation

### 3B: Graduation Celebrations
- [ ] Stage 0→2: gentle purple confetti + "Something just shifted"
- [ ] Stage 3→4: side cannons + essence name callout
- [ ] Stage 4→5: gold confetti + "There it is. You felt it."
- [ ] Stage 5→6: purple confetti + "Ready for the arena"
- [ ] Stage 6→7: no confetti + reverent voice message
- [ ] LevelUpModal shows longer text + 10s auto-dismiss for graduations
- [ ] Celebration fires only once per transition

### 3C: Insight Drops
- [ ] Category dominance card after 5+ wahoos (Common, purple border)
- [ ] Streak milestone card at 7/14/21/30 (Common)
- [ ] First visibility layer card (Uncommon, gold accent)
- [ ] Voice emerging at count 3 (Uncommon)
- [ ] Max 1 per session
- [ ] Dismissed cards don't reappear
- [ ] No overlap with Zarlo proactive messages

### 3D: Proactive Zarlo (Trimmed)
- [ ] Voice readiness message at count 4
- [ ] Streak approaching message within 3 days of milestone
- [ ] Falls back to Sprint 1C check if no Brief
- [ ] Max 1/day
- [ ] Same message doesn't repeat

---

*Depends on: Sprint 2 (committed + deployed). Zarlo Brief running.*
*Next: Sprint 4 (Figurine Unstick Flow, Social V1, expanded proactive triggers when data exists)*
