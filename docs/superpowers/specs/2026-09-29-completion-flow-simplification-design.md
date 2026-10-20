# Completion Flow Simplification

**Date:** 2026-09-29
**Status:** Design approved, pending implementation plan

## Problem

The courage challenge completion flow (GroanCompletionModal) has 11 sequential screens. User testing revealed this causes drop-off after screen 3. The flow captures valuable data but buries the reward (dome growth) behind a survey.

## Design

### 1. Three Quick Screens (replaces 11-step modal)

Three fast-tap screens with instant swap (no transition animation). Each screen is a single decision. Total: 3 taps → dome grows.

**Screen 1: How did it feel?**
```
┌─────────────────────────────────────┐
│  I Did It!                          │
│  "Taught my first yoga class"       │
│                                     │
│  How did it feel?                   │
│  [🔥 Vibe Rise] [☺️ Fun]            │
│  [😰 Stressful] [😶 Bored]          │
│                                     │
│  ← auto-advances on tap            │
└─────────────────────────────────────┘
```

No per-state identity statement or objection capture inline. Those move to post-completion reflections. This screen is tap-and-go.

**Screen 2: Do that again?**
```
┌─────────────────────────────────────┐
│  Do you want to do that again?      │
│                                     │
│  [🔥 Yes]  [🤔 Not sure]  [😶 No]   │
│                                     │
│  ← auto-advances on tap            │
└─────────────────────────────────────┘
```

**Screen 3: Voice check**
```
┌─────────────────────────────────────┐
│  Did a protective voice show up     │
│  before or during?                  │
│                                     │
│  [👻 Ghost]  [🎯 Perfectionist]     │
│  [🪞 People Pleaser]  [🎮 Controller]│
│  [🛋️ Auto-Pilot]  [Nope]            │
│                                     │
│  ← auto-advances on tap            │
└─────────────────────────────────────┘
```

**On final tap:**
- Save NS During (wahoo classification + after_state)
- Save aftertaste
- Save protective voice (gap_voice) if selected
- Award RP (existing WAHOO_RP: vibe=10, peace=7, anxious=10, shutdown=9)
- **Immediately show dome growth animation** (the reward)

**Voice ID is always shown** (not gated behind gap check). Captures the voice whether the experience was positive or negative. The voice can scream right before and go quiet during — that's the insight.

### 2. Dome Growth Animation at Completion

Currently the dome updates silently in the database. The user has to navigate to the dome separately to see growth.

**Change:** After the 3-screen modal closes, show a dome growth animation overlay:
- The dome radar appears at its previous state
- Tagged dimensions animate outward to their new levels
- Purple fill expands (if NS = Vibe Rise/Fun)
- Gold edge expands (if NS = Stressful)
- "+10 RP" floats up
- Auto-dismisses after 2 seconds or on tap

**Implementation:** New `DomeGrowthOverlay` component receives before/after dimension values and animates the transition. Triggered by `handleCompleteReflection` after save succeeds.

**Pattern detection:** Voice pattern detection (3+ same voice on overlapping dimensions) runs on save. If a pattern IS discovered, it is NOT shown immediately — the celebration is kept clean. The pattern surfaces as an ObservationCard on the Progress tab next time the user visits, with "Explore why [Voice] keeps showing up →" linking to HealingFlowModal.

### 3. Post-Completion Reflection Cards (Progress Tab)

The remaining captures move to expandable cards on the Progress tab's existing "This Week" evidence feed.

**Current evidence card (unchanged):**
```
⚡ Yoga Quest
"Taught my first class"
👥 People → 3 | 🔥 Vibe Rise
```

**New expandable section (tap card to open):**
```
Reflect deeper (2 of 7)          [collapse ▴]
───────────────────────────────────
☑ Gap Check       "Less scary than expected"
☐ Identity        "I've proven I'm someone who..."
☐ Universe        "Did the universe speak back?"
☐ X-Pollinate     "Did this feed another path?"
☐ 3% Better       "How to improve next time?"
☐ Life Fuel       Choice / Connection / Mastery / Meaning
☐ Share           Share your win
```

**Each reflection:**
- Tapping opens the question inline (same UI patterns as current modal steps but embedded)
- Completing a reflection awards +1 RP and marks the checkbox
- Progress indicator shows "2 of 7" on the collapsed card
- Reflections persist — user can come back anytime during the week

**Identity statement** (previously inline with NS During) moves here as a reflection card. For Vibe Rise/Fun: "Now that I [action], I've proven I'm someone who..." For Stressful: "What did the voice say before you did it?"

**Weekly Review integration:**
- Second Clock still follows up on "not sure" aftertaste (existing behavior, unchanged)
- Universe Response follow-up still triggers for "not sure" universe responses (existing behavior)
- Gap Check data feeds the voice pattern detection system regardless of when it's completed

### 4. Data Model Changes

**No new columns needed.** All existing columns on `groan_challenges` and `quest_completions` remain. Reflection completion is tracked by checking if the relevant column is null (e.g., `universe_response IS NULL` = not done). No `reflection_progress` column needed.

| Field | Currently saved | New timing |
|-------|----------------|------------|
| wahoo_classification | At completion | At completion (unchanged) |
| after_state | At completion | At completion (unchanged) |
| aftertaste | At completion | At completion (unchanged) |
| gap_voice | At completion (gap_check step) | At completion (voice screen) |
| identity_statement | At completion (wahoo_check step) | Post-completion card |
| before_state | At completion (state_checkin step) | Dropped (not essential) |
| preaction_difficulty | At completion (gap_check step) | Post-completion card (Gap Check) |
| experienced_difficulty | At completion (gap_check step) | Post-completion card (Gap Check) |
| gap_rescript | At completion (pattern interrupt) | Post-completion card (with Gap Check) |
| universe_response | At completion | Post-completion card |
| universe_response_note | At completion | Post-completion card |
| cross_pollination quests | At completion | Post-completion card |
| reflection (3%) | At completion | Post-completion card |
| life_fuel | At completion | Post-completion card |

**Gap Check keeps its own body-scale questions** on the post-completion card. No derivation from wahoo_classification — they measure different things (enjoyment vs body intensity).

### 5. Files to Modify

| File | Change |
|------|--------|
| `src/components/GroanCompletionModal.jsx` | Replace 11-step state machine with 3-screen flow |
| `src/components/GroanCompletionModal.css` | Simplified styles for 3 screens |
| `src/components/ProgressTab.jsx` | Add expandable reflection section to evidence cards |
| `src/components/ProgressTab.css` | Styles for reflection cards |
| New: `src/components/DomeGrowthOverlay.jsx` | Dome animation after completion |
| New: `src/components/DomeGrowthOverlay.css` | Styles for dome animation |
| `src/Challenge.jsx` | Wire DomeGrowthOverlay trigger after completion |

### 6. What Gets Removed from GroanCompletionModal

The following step states are removed from the modal's step machine:
- `state_checkin` (NS Before) → dropped
- `gap_check` → post-completion card
- `pattern_discovered` → ObservationCard on Progress tab
- `expectation` → dropped (redundant with aftertaste + gap check)
- `cross_pollination` → post-completion card
- `three_percent` → post-completion card
- `life_fuel` → post-completion card
- `universe_response` → post-completion card
- `share` → post-completion card

The following become the 3 screens:
- `wahoo_check` (NS During) → screen 1
- `aftertaste` → screen 2
- Voice ID (was inside `gap_check`) → screen 3

### 7. Edge Cases

- **Challenge without prediction:** Gap Check post-completion card still available. Shows body-scale questions. If no predicted_difficulty from creation, shows "Set a prediction next time for deeper insights" alongside the questions.
- **Shutdown state:** Same 3 screens. "Bored" selected, continues normally. The "This one didn't land" copy can appear as a brief inline note on screen 1, or on the post-completion identity card.
- **Pattern detection:** Runs on save. If pattern discovered, surfaces as ObservationCard on Progress tab — does NOT interrupt the dome celebration.
- **Existing data:** Old completions with full 11-step data are unaffected. Reflection cards show completed items as checked based on non-null column values.
- **Auto-advance timing:** Each screen auto-advances 300ms after tap (matches existing pattern in ZoneCalCheckin). Back button available on screens 2 and 3.
