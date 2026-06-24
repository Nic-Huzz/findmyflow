# Priority Tab: Graduation, Recommendations & Story Intro

**Date:** 2026-03-07
**Scope:** Weekly layer graduation check-in, tab locking, recommendation engine overhaul, first-visit story intro

---

## 1. Bug Fixes (Priority Onboarding)

### Missing CSS class
- `PriorityOnboardingCard.jsx` line 121 used `.pt-onboarding-step-content` but the class didn't exist
- **Fix:** Added the class to `PriorityTab.css`

### localStorage alignment not triggering recompute
- `onboardingStatus` useMemo in `usePriorityTab.js` read localStorage values but had no dependency to track changes
- **Fix:** Added `alignmentVersion` counter state + `onAlignmentChange` callback. `PriorityOnboardingCard` calls `onAlignmentChange?.()` in `handleAlign` after setting localStorage.

### hasAcceptedChallenge never refreshing
- After accepting a Play-list challenge on the Play-list tab, the Priority tab's `hasAcceptedChallenge` state never updated
- **Fix:** Added `refreshAcceptedChallenge` callback in `usePriorityTab.js` + useEffect on mount in `PriorityTab.jsx`

---

## 2. Tab Locking

Healing, Play-list, and Bonus tabs are now locked until Priority onboarding is complete.

**File:** `src/Challenge.jsx`

- `isPriorityOnboardingComplete` computed from: all 5 `ONBOARDING_QUEST_IDS` completed + 3 localStorage alignment flags + `hasAcceptedGroanChallenge` DB check
- Auto-redirect useEffect: if user is on a locked tab, force redirect to Priority
- Tab rendering: locked tabs get visual lock indicator

---

## 3. Weekly Layer Graduation Check-in

### Concept
Two-tier graduation: feeling-based assessment for initial placement, action-based question for weekly graduation gate.

### State Machine Update
`src/hooks/usePriorityTab.js` — new `layer_checkin` state inserted between `assessment` and `picker`:

```
loading → onboarding → assessment → layer_checkin → picker → quest_list
```

**Skip check-in when:**
- First ever week (no prior weekly picks)
- User is on the Value layer (terminal layer)
- Already answered this week (Edit Week does NOT re-trigger)

### New Component: PriorityLayerCheckin.jsx

Self-contained 3-phase component (~147 lines):

| Phase | What happens |
|-------|-------------|
| Gate | Action question per layer (e.g. "This week, did you do something publicly that felt scary?") with Yes / Not yet buttons |
| Reassess | If Yes: shows all 4 tension questions inline (loaded from `/tension-assessment.json`), pre-filled with current scores |
| Celebration | If layer changed: shows new layer emoji + "You've graduated to [layer]!" + "Plan My Week" button |

**Gate questions per layer:**

| Layer | Question |
|-------|----------|
| Discover | "This week, did you explain what you do to someone, and it felt true?" |
| Regulate | "This week, were you able to notice fear without it stopping you from acting?" |
| Reveal | "This week, did you do something publicly that felt scary?" |
| Value | Never shown (Value users skip check-in entirely) |

### Nudge Banner
When user answers "Not yet", a dismissible nudge banner shows at the top of the picker with layer-specific encouragement.

### Database
New table `priority_layer_checkins` (migration: `supabase/migrations/20260306000000_layer_checkin_history.sql`):
- Tracks weekly check-in answers, layer changes, previous/new layer
- UNIQUE constraint on `(user_id, week_start_date)`
- RLS policies for read/insert

### Celebration Timing Fix
`completeCheckin` only sets `checkinDoneThisWeek = true` when layer did NOT change. If layer changed, the celebration phase needs to render first. `finalizeCheckin()` is called from `onCelebrationDone` to mark check-in complete after the user dismisses the celebration.

---

## 4. Recommendation Engine Overhaul

### Before
`LAYER_RECOMMENDATIONS` was a flat array of section keys (e.g. `discover: ['play_profile']`). Every layer just highlighted a picker section.

### After
`LAYER_RECOMMENDATIONS` is now a typed config per layer with two strategies:

**Quest-based (Discover & Regulate):** Recommend specific flows in sequence. System finds the first uncompleted quest and surfaces it.

| Layer | Quest sequence |
|-------|---------------|
| Discover | `flow_finder_skills` → `flow_finder_problems` → `flow_finder_persona` → `recognise_nervous_system` |
| Regulate | `recognise_nervous_system` → `recognise_limiting_belief_rewire` + `release_weekly_big` (always, weekly) |

**Playlist-layer-based (Reveal & Value):** Recommend specific visibility layers in the Play-list picker.

| Layer | Recommended layers |
|-------|-------------------|
| Reveal | Screen, Live, Money |
| Value | Vulnerable, Authority |

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/usePriorityTab.js` | `LAYER_RECOMMENDATIONS` restructured. New `recommendations` memo computes next quest or recommended layers. |
| `src/components/PriorityTab.jsx` | Added `RecommendedQuestCard` component for Discover/Regulate. Updated all `recommendations.includes()` → `recommendations.sections?.includes()`. |
| `src/components/PriorityRecommendedCard.jsx` | Accepts `recommendations` prop. Shows contextual focus text per quest or layer. |
| `src/components/PriorityWeekPicker.jsx` | Visibility layer rows get gold "Recommended" badge when matching priority layer config. Updated `isRecommended()`. |

### Data Shape
The `recommendations` object returned by the hook:
```js
// Quest-based (Discover/Regulate)
{ type: 'quests', nextQuest: 'flow_finder_skills', allQuests: [...], alwaysRecommend: [], sections: [] }

// Playlist-layer-based (Reveal/Value)
{ type: 'playlist_layers', layers: ['screen', 'live', 'money'], sections: ['groan'] }
```

---

## 5. First-Visit Story Intro

### Concept
3-slide mandatory animated narrative shown once when a user first lands on `/7-day-challenge`. Sets context for why the game exists before onboarding begins.

### Slide Content

| # | Heading | Body | Duration |
|---|---------|------|----------|
| 1 | "You were built to play." | "Somewhere along the way, you were told to be serious, be safe, be realistic." | 7s auto |
| 2 | "This game changes that." | "Every quest is designed to reconnect you with your curiosity, remove the fear blocking your path, and get you paid to do what you love." | 8s auto |
| 3 | "Ready to turn life into a game?" | Gold "Let's Go" button | Waits for tap |

### Technical Details

**New files:**
- `src/components/ChallengeIntro.jsx` (~90 lines) — 3-slide component with auto-advance + manual tap
- `src/components/ChallengeIntro.css` (~115 lines) — full-screen purple gradient overlay with crossfade animations

**Modified:**
- `src/Challenge.jsx` — `showIntro` state from localStorage, renders `<ChallengeIntro>` as early return before onboarding

**Persistence:** `localStorage.setItem('hasSeenChallengeIntro', 'true')` on completion

**Animation approach:** Uses fixed overlay pattern (same as GraduationModal) which is safe for iOS PWA. Text crossfades between slides via opacity transition. `prefers-reduced-motion` disables all animations.

**Bug prevention:** `fading` guard on `advanceSlide` prevents double-tap from skipping slides. `Math.min` clamp prevents going past last slide.

---

## All Files Modified

| File | Type | Description |
|------|------|-------------|
| `src/hooks/usePriorityTab.js` | Modified | State machine, check-in logic, recommendation engine, alignment tracking |
| `src/components/PriorityTab.jsx` | Modified | Check-in wiring, nudge banner, recommended quest cards, tab locking |
| `src/components/PriorityTab.css` | Modified | Check-in styles, nudge banner styles, missing onboarding class |
| `src/components/PriorityLayerCheckin.jsx` | New | 3-phase weekly graduation check-in |
| `src/components/PriorityRecommendedCard.jsx` | Modified | Dynamic focus text from recommendations object |
| `src/components/PriorityOnboardingCard.jsx` | Modified | `onAlignmentChange` prop for localStorage reactivity |
| `src/components/PriorityWeekPicker.jsx` | Modified | Visibility layer badges, updated `isRecommended()` |
| `src/components/ChallengeIntro.jsx` | New | First-visit story intro overlay |
| `src/components/ChallengeIntro.css` | New | Story intro styles + animations |
| `src/Challenge.jsx` | Modified | Tab locking, intro overlay, groan challenge check |
| `supabase/migrations/20260306000000_layer_checkin_history.sql` | New | Check-in history table + RLS |
