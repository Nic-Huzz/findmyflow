# Sprint 3: Implementation Plan

**Created:** 2026-07-13
**Branch:** `light-portal`
**Depends on:** Sprint 2 (committed `135b5cc`), Zarlo Brief deployed + running
**Spec doc:** `docs/features/octalysis-alignment-implementation-notes.md` (Sections 6, 9)

---

## What Sprint 3 Builds

Sprint 1 changed how failure feels. Sprint 2 gave the AI eyes (Zarlo Brief). Sprint 3 makes the app REACT to what it sees: proactive pattern surfacing, Insight Drops, and the Zarlo Brief flowing into the daily experience.

| Item | What It Does | Effort |
|---|---|---|
| **3A** Expanded Zarlo proactive triggers | Use Brief data for 6 trigger types (not just voice counts) | 1-2 days |
| **3B** Insight Drops V1 | Styled cards for self-knowledge reveals (Common + Uncommon) | 2 days |
| **3C** Graduation celebrations (Stages 3→4, 4→5, 5→6) | Visual + mechanical changes at first 3 achievable transitions | 2 days |
| **3D** Stuck detection (Journey tab) | Surface "stuck" state on Journey tab, offer Figurine unstick prompt | 1 day |

**Total estimated effort:** 6-7 days

---

## 3A: Expanded Zarlo Proactive Triggers

### What Changes

Sprint 1C added voice count detection to `ZarloWidget.jsx`. Now the Zarlo Brief generates daily pattern data (contradictions, day-of-week patterns, thresholds, visibility gaps). Sprint 3A uses this Brief data for richer proactive messages.

### Current State

`ZarloWidget.jsx` has `checkVoicePatterns()` which queries `healing_intentions` directly. This should be REPLACED with Brief-based checks that cover all trigger types.

### File: `src/components/Zarlo/ZarloWidget.jsx`

Replace `checkVoicePatterns` with a broader `checkProactiveInsights`:

```javascript
const checkProactiveInsights = useCallback(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load pre-computed Brief (generated daily by Edge Function)
    const { data: briefRow } = await supabase
      .from('zarlo_briefs')
      .select('brief')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!briefRow?.brief) return
    const brief = briefRow.brief

    // Priority order: Readiness > Contradiction > Pattern > Streak > Return
    // Only show ONE proactive message (1/day max)
    const today = new Date().toISOString().slice(0, 10)
    if (localStorage.getItem(`zarlo_proactive_${today}`)) return

    let message = null

    // 1. Readiness: approaching graduation threshold
    if (brief.thresholds?.voice_count_to_graduate === 1) {
      const voice = brief.patterns?.dominant_voice
      if (voice && !localStorage.getItem(`zarlo_readiness_voice_${voice.name}`)) {
        const label = voice.name.charAt(0).toUpperCase() + voice.name.slice(1).replace(/_/g, ' ')
        message = `One more pattern and something becomes clear. The ${label} is almost fully visible.`
        localStorage.setItem(`zarlo_readiness_voice_${voice.name}`, 'true')
      }
    }

    // 2. Contradiction: self-report doesn't match behaviour
    if (!message && brief.contradictions?.length > 0) {
      const contradiction = brief.contradictions[0]
      const key = `zarlo_contradiction_${contradiction.slice(0, 20).replace(/\s/g, '_')}`
      if (!localStorage.getItem(key)) {
        if (contradiction.includes('Safe but Pressure')) {
          message = "You've been checking in as Safe, but your wahoos keep coming back Pressure. Both can be true. Which one matters more right now?"
        } else if (contradiction.includes('Healing declining')) {
          message = "Your healing tab visits are dropping, but the protective voice count is rising. Something's being avoided."
        }
        if (message) localStorage.setItem(key, 'true')
      }
    }

    // 3. Day-of-week pattern
    if (!message && brief.patterns?.day_of_week) {
      const days = Object.entries(brief.patterns.day_of_week)
      const today_day = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date().getDay()]
      const todayPattern = days.find(([day]) => day === today_day)
      if (todayPattern) {
        const [day, data] = todayPattern
        const key = `zarlo_daypattern_${day}`
        if (!localStorage.getItem(key)) {
          const state = Object.keys(data)[0]?.replace('_pct', '')
          const pct = Object.values(data)[0]
          const dayLabel = day.charAt(0).toUpperCase() + day.slice(1)
          if (state === 'sympathetic' || state === 'dorsal') {
            message = `${dayLabel}s tend to be ${state === 'sympathetic' ? 'Activated' : 'Shutdown'} for you (${pct}% of the time). What happens on ${dayLabel}s?`
          }
          if (message) localStorage.setItem(key, 'true')
        }
      }
    }

    // 4. Streak milestone approaching
    if (!message && brief.thresholds?.streak_milestone_approaching) {
      const milestone = brief.thresholds.streak_milestone_approaching.replace('_', '-')
      const key = `zarlo_streak_${milestone}`
      if (!localStorage.getItem(key)) {
        message = `You're close to a ${milestone} streak. That's not luck. That's you showing up.`
        localStorage.setItem(key, 'true')
      }
    }

    // 5. Visibility gap (from patterns)
    if (!message && brief.patterns?.visibility_layers) {
      const layers = brief.patterns.visibility_layers
      const total = Object.values(layers).reduce((a, b) => a + b, 0)
      if (total >= 10) {
        const gaps = Object.entries(layers).filter(([, count]) => count === 0)
        if (gaps.length > 0 && gaps.length <= 3) {
          const gapName = gaps[0][0].charAt(0).toUpperCase() + gaps[0][0].slice(1)
          const key = `zarlo_visgap_${gaps[0][0]}`
          if (!localStorage.getItem(key)) {
            message = `${total} wahoos completed. None of them ${gapName}. That's not an accident.`
            localStorage.setItem(key, 'true')
          }
        }
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
}, [])
```

Also keep the existing voice count check as a FALLBACK for users who don't have a Brief yet (new users, Brief not generated). Run both:

```javascript
useEffect(() => {
  checkProactiveInsights()  // Brief-based (preferred)
  checkVoicePatterns()       // Direct query fallback (Sprint 1C)
}, [checkProactiveInsights, checkVoicePatterns])
```

### Priority Logic

Only ONE proactive message per day. Priority order (highest first):
1. **Readiness** — one step from graduation (most actionable)
2. **Contradiction** — self-report vs behaviour mismatch (most surprising)
3. **Day-of-week pattern** — only shown ON the relevant day (most timely)
4. **Streak milestone** — approaching 7/14/21/30 etc (most motivating)
5. **Visibility gap** — only after 10+ wahoos (needs enough data)

### Testing

- [ ] User with Brief containing contradiction: message appears
- [ ] User with Brief containing day-of-week pattern on the correct day: message appears
- [ ] User with Brief approaching voice graduation: readiness message appears
- [ ] Only 1 message per day (localStorage key `zarlo_proactive_YYYY-MM-DD`)
- [ ] Same message doesn't repeat (per-insight localStorage keys)
- [ ] User without Brief: falls back to Sprint 1C voice-only check

---

## 3B: Insight Drops V1

### What It Is

Styled cards that present self-knowledge as a REVEAL, not a notification. When the app detects a pattern worth surfacing, it presents it as an "Insight Drop" — a card that slides up, feels like an unlock, and can be dismissed or explored.

### Rarity Tiers (V1 = Common + Uncommon only)

| Tier | Trigger | Example | Visual |
|---|---|---|---|
| **Common** | Category patterns, practice counts, basic streaks | "80% of your wahoos are Connection. Your courage lives in relationships." | Subtle card, purple border |
| **Uncommon** | Visibility firsts, trend shifts, day-of-week patterns | "You just went Live for the first time. The Ghost didn't want you here." | Brighter card, gold accent, subtle glow |

Rare + Legendary are V2 (need Figurine).

### Component: `src/components/InsightDrop.jsx`

```jsx
import { useState, useEffect } from 'react'
import './InsightDrop.css'

/**
 * InsightDrop — self-knowledge reveal card
 * Slides up from bottom, dismissible, tap to expand
 * 
 * Props:
 *  - insight: { title, body, rarity: 'common'|'uncommon', icon }
 *  - onDismiss: () => void
 *  - onExplore: () => void (optional — opens Zarlo chat with context)
 */
export default function InsightDrop({ insight, onDismiss, onExplore }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Slide in after mount
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(onDismiss, 300) // Wait for slide-out animation
  }

  return (
    <div className={`id-overlay ${visible ? 'id-visible' : ''}`}>
      <div className={`id-card id-${insight.rarity || 'common'}`}>
        <button className="id-dismiss" onClick={handleDismiss}>&times;</button>
        <div className="id-header">
          <span className="id-icon">{insight.icon || '💡'}</span>
          <span className="id-rarity-label">
            {insight.rarity === 'uncommon' ? 'Insight Unlocked' : 'Pattern Spotted'}
          </span>
        </div>
        <h3 className="id-title">{insight.title}</h3>
        <p className="id-body">{insight.body}</p>
        {onExplore && (
          <button className="id-explore" onClick={() => { handleDismiss(); onExplore() }}>
            Ask Zarlo about this
          </button>
        )}
      </div>
    </div>
  )
}
```

### CSS: `src/components/InsightDrop.css`

```css
/* InsightDrop — self-knowledge reveal card */
.id-overlay {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%) translateY(120%);
  z-index: 1150;
  transition: transform 0.3s ease;
  max-width: 380px;
  width: calc(100% - 32px);
}

.id-overlay.id-visible {
  transform: translateX(-50%) translateY(0);
}

.id-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  position: relative;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
}

.id-common {
  border: 1px solid #e5e7eb;
  border-left: 4px solid #5e17eb;
}

.id-uncommon {
  border: 1px solid #E9A23B;
  border-left: 4px solid #E9A23B;
  box-shadow: 0 4px 24px rgba(233, 162, 59, 0.15);
}

.id-dismiss {
  position: absolute;
  top: 12px;
  right: 14px;
  background: none;
  border: none;
  font-size: 20px;
  color: #9ca3af;
  cursor: pointer;
}

.id-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.id-icon { font-size: 20px; }

.id-rarity-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
  color: #5e17eb;
}

.id-uncommon .id-rarity-label {
  color: #E9A23B;
}

.id-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 6px;
  padding-right: 24px;
}

.id-body {
  font-size: 0.9rem;
  color: #4b5563;
  line-height: 1.5;
  margin: 0;
}

.id-explore {
  margin-top: 14px;
  background: none;
  border: 1px solid #5e17eb;
  color: #5e17eb;
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
}
```

### Trigger Logic: `src/hooks/useInsightDrops.js`

```javascript
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Checks for insightable patterns from the Zarlo Brief.
 * Returns one insight at a time (highest priority unseen).
 * Marks seen insights in localStorage.
 */
export function useInsightDrops(userId) {
  const [insight, setInsight] = useState(null)

  useEffect(() => {
    if (!userId) return
    checkInsights(userId).then(setInsight)
  }, [userId])

  const dismiss = () => {
    if (insight?.key) {
      localStorage.setItem(`insight_seen_${insight.key}`, 'true')
    }
    setInsight(null)
  }

  return { insight, dismissInsight: dismiss }
}

async function checkInsights(userId) {
  const { data } = await supabase
    .from('zarlo_briefs')
    .select('brief')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data?.brief) return null
  const brief = data.brief
  const seen = (key) => localStorage.getItem(`insight_seen_${key}`)

  // Common: category dominance (after 5+ wahoos)
  const layers = brief.patterns?.visibility_layers || {}
  const totalWahoos = Object.values(layers).reduce((a, b) => a + b, 0)
  if (totalWahoos >= 5) {
    const maxLayer = Object.entries(layers).sort((a, b) => b[1] - a[1])[0]
    if (maxLayer && maxLayer[1] / totalWahoos >= 0.6) {
      const key = `category_dominance_${maxLayer[0]}`
      if (!seen(key)) {
        const label = maxLayer[0].charAt(0).toUpperCase() + maxLayer[0].slice(1)
        return {
          key,
          rarity: 'common',
          icon: '🎯',
          title: `Your courage lives in ${label}`,
          body: `${Math.round(maxLayer[1] / totalWahoos * 100)}% of your wahoos are ${label} challenges. That's where you push yourself most.`
        }
      }
    }
  }

  // Common: streak milestone reached
  const streak = brief.current_state?.streak_days || 0
  const MILESTONES = [7, 14, 21, 30, 60, 100]
  for (const m of MILESTONES) {
    if (streak >= m && !seen(`streak_${m}`)) {
      return {
        key: `streak_${m}`,
        rarity: 'common',
        icon: '🔥',
        title: `${m} days`,
        body: `${m} days of showing up. Your nervous system is learning something new about you.`
      }
    }
  }

  // Uncommon: first visibility layer unlocked
  for (const [layer, count] of Object.entries(layers)) {
    if (count === 1 && !seen(`first_${layer}`)) {
      const label = layer.charAt(0).toUpperCase() + layer.slice(1)
      return {
        key: `first_${layer}`,
        rarity: 'uncommon',
        icon: '✨',
        title: `New territory: ${label}`,
        body: `You just went ${label} for the first time. The voice didn't want you here. You came anyway.`
      }
    }
  }

  // Uncommon: protective voice emerging (count = 3)
  const voice = brief.patterns?.dominant_voice
  if (voice && voice.count === 3 && !seen(`voice_emerging_${voice.name}`)) {
    const label = voice.name.charAt(0).toUpperCase() + voice.name.slice(1).replace(/_/g, ' ')
    return {
      key: `voice_emerging_${voice.name}`,
      rarity: 'uncommon',
      icon: '🔮',
      title: `Voice identified: The ${label}`,
      body: `The ${label} is your most frequent block. It shows up when you're about to do something that matters.`
    }
  }

  return null
}
```

### Integration: `src/Challenge.jsx`

```javascript
import { useInsightDrops } from './hooks/useInsightDrops'
import InsightDrop from './components/InsightDrop'

// Inside Challenge function:
const { insight, dismissInsight } = useInsightDrops(user?.id)

// In JSX, after tab content:
{insight && (
  <InsightDrop
    insight={insight}
    onDismiss={dismissInsight}
  />
)}
```

---

## 3C: Graduation Celebrations (Stages 3→4, 4→5, 5→6)

### Why These Three First

These are the three earliest achievable transitions. Most active users are at Stages 0-6. Stages 7→8 and 8→9 require human-facilitated sessions and Flow Statement design (later sprints).

### What Changes

**File:** `src/hooks/useCelebrations.js`

Add a new function:

```javascript
/**
 * Celebrate a hero stage graduation (Figurine moment)
 * @param {number} fromStage
 * @param {number} toStage  
 * @param {object} context - { essenceName, protectiveVoice, etc }
 */
const celebrateStageGraduation = useCallback((fromStage, toStage, context = {}) => {
  const CELEBRATIONS = {
    '3-4': {
      confettiType: 'side_cannons',
      colors: null, // archetype-specific, set dynamically
      message: context.essenceName
        ? `You've been called this your whole life without knowing it. ${context.essenceName}.`
        : 'Your archetype has been revealed.',
    },
    '4-5': {
      confettiType: 'gold',
      colors: ['#E9A23B', '#f5c55a', '#fbbf24'],
      message: 'There it is. You felt it. Remember this next time the voice gets loud.',
    },
    '5-6': {
      confettiType: 'purple',
      colors: ['#5e17eb', '#8b5cf6', '#c4b5fd'],
      message: "You're ready for the arena. Time to train with others.",
    },
  }

  const key = `${fromStage}-${toStage}`
  const celebration = CELEBRATIONS[key]
  if (!celebration) return

  // Visual celebration
  if (celebration.confettiType === 'side_cannons') {
    triggerSideCannons()
  } else if (celebration.confettiType === 'gold') {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: celebration.colors })
    setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors: celebration.colors }), 300)
  } else {
    confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 }, colors: celebration.colors })
  }

  // Show graduation modal with Figurine message
  setShowLevelUp({
    name: CELEBRATIONS[key].message,
    emoji: key === '3-4' ? '🪞' : key === '4-5' ? '🔥' : '⚔️',
    description: '',
    isGraduation: true,
  })
  setLevelUpKey(k => k + 1)

  // Haptic
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100, 50, 200])
  }
}, [])
```

Add `celebrateStageGraduation` to the returned object.

Also need `import confetti from 'canvas-confetti'` and `import { triggerSideCannons } from '../components/Celebrations'` at the top of the hook.

### Stage Transition Detection

**File:** `src/Challenge.jsx` (or a new `useStageTransitions.js` hook)

On load, check if the user's hero stage has changed since their last visit:

```javascript
useEffect(() => {
  if (!user?.id) return

  const checkGraduation = async () => {
    const { data } = await supabase
      .from('user_stage_progress')
      .select('current_journey_level')
      .eq('user_id', user.id)
      .maybeSingle()

    const currentStage = data?.current_journey_level || 0
    const lastKnownStage = parseInt(localStorage.getItem('last_hero_stage') || '0')

    if (currentStage > lastKnownStage && lastKnownStage > 0) {
      // Stage increased! Celebrate
      celebrateStageGraduation(lastKnownStage, currentStage, {
        essenceName: /* from user context */,
      })
    }

    localStorage.setItem('last_hero_stage', String(currentStage))
  }

  checkGraduation()
}, [user?.id])
```

**Note:** This only detects transitions. The actual TRIGGERING of stage changes (setting `current_journey_level` to a new value) is separate logic that depends on the graduation triggers defined in the measurement framework. For Sprint 3, we detect and celebrate; the trigger logic is a future sprint.

### LevelUpModal Adaptation

The existing `LevelUpModal` shows level emoji + name + description. For graduations, we pass `isGraduation: true` and the modal should:
- Use a different background treatment (darker for drama)
- Show the Figurine copy as the primary text (not just a title)
- Auto-dismiss after 10s (longer than the 8s default for RP level-ups)

**File:** `src/components/Celebrations/LevelUpModal.jsx`

Add graduation variant:

```jsx
// In the render, check isGraduation flag:
const isGraduation = level?.isGraduation
// If graduation: bigger text, different styling, longer auto-dismiss
```

---

## 3D: Stuck Detection on Journey Tab

### What Changes

The Zarlo Brief already computes `thresholds.stage_stuck_days`. The Journey tab (built in Sprint 2C) should show a gentle prompt when the user is stuck.

**File:** `src/components/JourneyTab.jsx`

Add after the stage card:

```jsx
{/* Stuck detection — gentle Figurine-style prompt */}
{brief?.thresholds?.stage_stuck_days > 0 && (
  <div className="jt-section jt-stuck-section">
    <p className="jt-stuck-message">
      {brief.thresholds.stage_stuck_days <= 14
        ? "You've been here a while. That's not wrong. The journey has its own pace."
        : "There's something you haven't tried yet. Want to figure out what's holding?"
      }
    </p>
    {brief.thresholds.stage_stuck_days > 14 && (
      <button className="jt-stuck-cta" onClick={() => {/* Future: open Unstick Flow */}}>
        Let's work through it
      </button>
    )}
  </div>
)}
```

The "Let's work through it" button is a placeholder for Sprint 4's Figurine Unstick Flow (3-step modal). For now it just shows the prompt without the full flow.

### CSS additions in `JourneyTab.css`:

```css
.jt-stuck-section {
  border-left: 3px solid #E9A23B;
}

.jt-stuck-message {
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
  font-style: italic;
}

.jt-stuck-cta {
  margin-top: 12px;
  background: none;
  border: 1px solid #E9A23B;
  color: #E9A23B;
  border-radius: 10px;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
}
```

---

## Build Sequence

```
Day 1-2: Expanded proactive triggers (3A)
  - Replace checkVoicePatterns with Brief-based checkProactiveInsights
  - Keep voice check as fallback
  - Test each trigger type with real Brief data
  
Day 3-4: Insight Drops (3B)
  - Create InsightDrop component + CSS
  - Create useInsightDrops hook
  - Wire into Challenge.jsx
  - Test with real Brief data (category dominance, streak milestones, visibility firsts)
  
Day 5-6: Graduation celebrations (3C)
  - Add celebrateStageGraduation to useCelebrations
  - Add stage transition detection in Challenge.jsx
  - Adapt LevelUpModal for graduation variant
  - Test: manually set hero stage and verify celebration fires

Day 7: Stuck detection (3D)
  - Add stuck prompt to JourneyTab
  - Wire to Brief threshold data
  - Placeholder CTA for future Unstick Flow
```

---

## Success Metrics

| Metric | How to Measure |
|---|---|
| Proactive triggers fire correctly | Manual: verify each trigger type with test Brief data |
| Insight Drops appear at right moments | Manual: verify card slides up after qualifying actions |
| Graduation celebration fires on stage change | Manual: update hero stage in DB, reload app |
| Stuck detection shows at correct threshold | Manual: check users with high stage_stuck_days in Brief |
| 1/day proactive limit works | Verify localStorage key prevents duplicates |

**North star:** % of life paths trending toward Vibe Rise state.

---

## What Sprint 3 Does NOT Build (Sprint 4+)

| Item | Why Later |
|---|---|
| Figurine Unstick Flow (3-step modal) | Needs Figurine visual design session |
| Graduation celebrations Stages 6→7+ | Needs protective voice integration + Calendly |
| Insight Drops Rare/Legendary tier | Needs Figurine delivery + collection UI |
| Self-Knowledge Skills (V2) | Needs Zarlo Brief running for 30+ days of data |
| Social V1 (Kudos, counters) | Needs dedicated design session |

---

## Testing Checklist

### 3A: Proactive Triggers
- [ ] Contradiction message appears for user with "Safe but Pressure" in Brief
- [ ] Day-of-week pattern shows on the correct day only
- [ ] Readiness message at voice count 4 (one from graduation)
- [ ] Streak milestone approaching message
- [ ] Visibility gap message after 10+ wahoos
- [ ] Max 1 message per day
- [ ] Falls back to Sprint 1C voice check if no Brief exists

### 3B: Insight Drops
- [ ] Category dominance card after 5+ wahoos with 60%+ in one layer
- [ ] Streak milestone card at 7/14/21/30 days
- [ ] First visibility layer card (uncommon, gold accent)
- [ ] Voice emerging card at count 3 (uncommon)
- [ ] Card slides up from bottom, dismissible
- [ ] Dismissed cards don't reappear (localStorage)
- [ ] "Ask Zarlo about this" button opens chat (if wired)

### 3C: Graduation Celebrations
- [ ] Stage 3→4: side cannons confetti + "You've been called this..." message
- [ ] Stage 4→5: gold confetti + "There it is. You felt it."
- [ ] Stage 5→6: purple confetti + "Ready for the arena."
- [ ] Celebration only fires once per transition (localStorage check)
- [ ] LevelUpModal shows graduation variant (longer text, longer auto-dismiss)

### 3D: Stuck Detection
- [ ] Journey tab shows gentle message when stage_stuck_days > 0
- [ ] Different message at ≤14 days vs >14 days
- [ ] "Let's work through it" CTA appears at >14 days
- [ ] CTA is placeholder (no action yet — Sprint 4)
- [ ] No stuck message when stage_stuck_days = 0

---

*Depends on: Sprint 2 (committed + deployed). Zarlo Brief running.*
*Next: Sprint 4 (Figurine Unstick Flow, Social V1, Graduation 6→7+) — write plan after Sprint 3 learnings.*
