# Business Page + Nav Restructure — Design

**Date:** 2026-03-03
**Status:** Approved
**Mockup:** `docs/mockups/business-page-v2.html`

---

## Motivation

- Business is an upsell product, no longer part of the game portal
- Flow Compass is underused and doesn't justify a main nav slot
- Business deserves top-level navigation prominence
- A new "Priority" tab in the challenge page will replace Business (Phase 2)

## Changes

### 1. Bottom Toolbar

**Before:** Home | Let's Play | Compass | Profile
**After:** Home | Let's Play | **Business** | Profile

- Replace Compass icon (🧭 `/flow-compass`) with Business icon (💼 `/business`)
- File: `src/components/BottomToolbar.jsx`
- Flow Compass page remains accessible at `/flow-compass` via direct URL

### 2. 7-Day Challenge Tabs

**Before:** Play-List | Healing | Business | Bonus
**After:** Play-List | Healing | **Priority** | Bonus

- Remove "Business" from `categories` array in `useChallengeData.js`
- Add "Priority" category
- Priority tab shows placeholder state for Phase 2
- Remove all `activeCategory === 'Business'` rendering blocks from `Challenge.jsx`
- File: `src/Challenge.jsx`, `src/hooks/useChallengeData.js`

### 3. New `/business` Route + Page

**Route:** `/business` (protected via AuthGate)
**File:** `src/pages/BusinessPage.jsx` + `src/pages/BusinessPage.css`

#### Layout (top to bottom)

1. **Purple Gradient Hero**
   - Project name (italic, 50% opacity)
   - Stage name + number (e.g. "Stage 2: Product") — bold white
   - Stage description — 50% opacity
   - "Switch Project ▾" button (glass morphism)
   - SVG circular progress ring (gold, right-aligned)

2. **Stage Dots Card** (overlaps hero with negative margin)
   - Horizontal row of stage circles
   - States: done (green ✓), current (purple, glow ring), locked (gray)
   - Labels below each dot
   - Tappable — changes viewed stage

3. **Gold "Up Next" Card**
   - Gold border (2px solid #E9A23B)
   - "UP NEXT" eyebrow badge
   - Quest name + emoji
   - Meta (type, free/paid, estimated time)
   - Gold CTA button "Start Quest →"

4. **Quest List Card**
   - "Stage N Quests" title
   - Rows: icon | name + meta | action button
   - Completed: green icon, strikethrough italic name, gray "Done" button
   - Remaining: purple icon bg, normal name, gold "Start" button

#### Data Requirements

Reuses existing data from the Business tab in Challenge.jsx:
- `user_projects` — selected project, current stage
- `quest_completions` — completion status
- `stageConfig` — stage names, colors, descriptions
- `useSubscription` — payment gating for paid quests
- `graduationChecker` — stage completion logic

### 4. What Doesn't Change

- All business quest logic, stage graduation, payment gating
- Flow Compass page (`/flow-compass`) — just delinked from nav
- CRM toolbar (separate nav set, untouched)
- Quest completion flow (reflections, compass check-in, confetti)

## Phase 2 (Separate Work)

- **Priority tab content** — populated by:
  1. New 4-step onboarding process (identifies best tasks for user)
  2. Weekly intention slides (user-chosen tasks)
- Priority tab shows a placeholder/empty state until these are built

## Design Tokens

| Token | Value |
|-------|-------|
| Hero gradient | `linear-gradient(150deg, #7c3aed 0%, #5e17eb 35%, #4c1d95 100%)` |
| Ring stroke | `#E9A23B` |
| Done dot | `#34d399` |
| Current dot | `#5e17eb` with `box-shadow: 0 0 0 4px rgba(94,23,235,0.18)` |
| Locked dot | `#eef0f3` bg, `#dde0e5` border |
| Gold border | `2px solid #E9A23B` |
| Gold CTA | `linear-gradient(135deg, #E9A23B 0%, #f0b94e 60%, #e6c45a 100%)` |
| Card radius | `22px` |
| Card shadow | `0 2px 16px rgba(0,0,0,0.06)` |
| Page background | `#f2f2f7` |
