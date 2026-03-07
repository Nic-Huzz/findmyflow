# Playlist & Priority UI Updates

**Date:** 2026-03-07
**Branch:** `feat/playlist-priority-ui-updates`

---

## Summary

Redesigned the Play-list tab, mobile playlist picker, Play Profile past challenges, /me page quest section, and challenge header to use a consistent Priority-tab-inspired card design throughout.

---

## Changes

### 1. Play-list Tab: Active Challenges Card (`PlayListTab.jsx`)

- Added an "Active Challenges" section card at the top of the Play-list sub-tab
- Sources data from `priority_weekly_picks` (same as Priority tab), filtered to `pick_type = 'groan'` for the current week
- Each row shows the pick's display name with a gold "Complete" button
- Clicking "Complete" fetches the full `groan_challenges` record then opens `GroanCompletionModal`
- After completion, re-fetches picks and refreshes via `groanMatrixKey`

**Files:** `src/components/PlayListTab.jsx`, `src/Challenge.css`

### 2. Mobile Playlist Picker Redesign (`MobilePlaylistPicker.jsx`)

Replaced the flat button list with Priority-tab-style section cards for all steps:

- **Skills step:** White card with header (icon, title, count badge), item rows with chevron arrows
- **Layer step:** Same card design with an "Explainer" button in the header
- **Explainer modal:** Full-screen overlay listing all 5 visibility layers (Screen, Live, Money, Vulnerable, Authority) with icon, name, fear description, and explanation
- **Day picker step (NEW):** After choosing a visibility layer, users now pick a day of the week (Monday-Sunday) before generating a challenge. Flow is now: Skill > Layer > Day > Generate
- **Generate step:** Title now includes the selected day (e.g. "Experience Design x LIVE -- Saturday")

Removed the gold left border from the section card per user request.

**Files:** `src/components/MobilePlaylistPicker.jsx`, `src/components/MobilePlaylistPicker.css`

### 3. Play Profile Past Challenges (`PlayProfileDashboard.jsx`)

Restyled the "Past Challenges" section from a plain list into a section card:

- White card with 22px border-radius, header with trophy icon and purple count badge
- Each completed session is an item row with:
  - Green checkmark circle
  - Challenge name in gold
  - Stuck point name + type badge pill (DO IT / CUT IT / THINK IT / MAKE IT)
  - Date in grey
  - Voice/compass emoji badges on the right

**Files:** `src/components/PlayProfile/PlayProfileDashboard.jsx`, `src/components/PlayProfile/PlayProfile.css`

### 4. /me Page Quest Section (`MePage.jsx`)

Replaced the static "Today's Quest" section with a dynamic 3-state display:

**State 1: Onboarding incomplete**
- Shows the current onboarding step (1 of 7) with name, description, and progress dots
- CTA links directly to the step's flow route (steps 1-5) or to the challenge page (steps 6-7)
- Onboarding steps: Mind Space, What is Healing, Healing Compass, Play-List Finder, Map Your Nervous System, Check Alignment, Set Play-list Task

**State 2: Onboarding complete + has priority layer (tension scores)**
- Shows "Recommended Challenges" based on the user's priority layer
- Discover/Regulate layers: lists recommended quests with checkmarks for completed ones
- Reveal layer: lists recommended Play-list visibility layers (Screen, Live, Money)
- Value layer: lists recommended layers (Vulnerable, Authority)
- Shows the layer emoji, name, river description, and app feature

**State 3: Onboarding complete + no tension scores**
- Shows "Set Your Priority" prompting the user to complete the tension assessment

**Files:** `src/pages/MePage.jsx`, `src/pages/MePage.css`

### 5. Challenge Header (`ChallengeHeader.jsx`)

- Removed the "Gamify Your Ambitions" h1 heading

**Files:** `src/components/ChallengeHeader.jsx`

---

## Bug Fixes

### MePage step 7 detection
- **Bug:** Originally used `localStorage.getItem('priority_has_accepted_challenge')` which was never set anywhere in the codebase
- **Fix:** Added a proper DB query against `groan_challenges` (checking for any record with `accepted_at` set), matching the same approach used in `usePriorityTab.js`

### Priority layer null check
- **Bug:** Had `!stageProgress?.tension_discover == null` (negation applied to wrong operand)
- **Fix:** Changed to `stageProgress?.tension_discover == null`

---

## New CSS Classes

### `.playlist-tab .plt-*` (Challenge.css)
Section card styles for the Play-list tab's active challenges: `plt-section-card`, `plt-section-header`, `plt-item-row`, `plt-item-action`, etc.

### `.mpp-section-*`, `.mpp-item-*`, `.mpp-explainer-*`, `.mpp-overlay-*` (MobilePlaylistPicker.css)
Section card, item row, explainer button, and overlay modal styles for the mobile picker.

### `.pp-history-*` (PlayProfile.css)
Section card styles for past challenges: `pp-history-card`, `pp-history-row`, `pp-history-check`, etc.

### `.me-picks-list`, `.me-pick-row` (MePage.css)
Recommendation list styles for the /me page quest section.

---

## Data Flow

```
priority_weekly_picks (DB)
  |
  +-- PlayListTab: fetches pick_type='groan' for current week
  |     |-- displays as section card rows
  |     +-- on Complete: fetches full groan_challenges record -> GroanCompletionModal
  |
  +-- PriorityTab: same source (existing, unchanged)

user_stage_progress.tension_* (DB)
  |
  +-- MePage: computes priorityLayer via computePriorityLayer()
        |-- maps to LAYER_RECOMMENDATIONS config
        +-- renders quest list or visibility layer list

groan_challenges (DB)
  |
  +-- MePage: checks accepted_at for onboarding step 7

quest_completions (DB)
  |
  +-- MePage: checks ONBOARDING_QUEST_IDS for steps 1-5
  +-- MePage: checks recommended quest completion status
```
