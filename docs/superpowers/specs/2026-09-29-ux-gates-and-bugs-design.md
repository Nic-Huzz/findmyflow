# UX Simplification — Eva Feedback Session

**Date:** 2026-09-29
**Status:** Shipped to main
**Commits:** `31ab4c0b` (main batch), `87fd7fbf` (checkin + toolbar)
**Source:** Eva's user testing feedback

## Problem

First-time users are overwhelmed. Too many cards, CTAs, slides, and navigation items compete for attention. The app feels difficult to navigate and "too much" at a glance. Specific pain points: too many slides before the Essence Mirror payoff, duplicate CTAs on home, full-page popups firing at wrong times, leaderboard/community/league features with no user base adding clutter, and the daily checkin flow being multi-step when a single tap would do.

## Shipped Changes

### 1. Home Page — Single CTA
**File:** `src/pages/MePage.jsx`
- Merged two welcome banner states (pre-essence / post-essence) into single "Let's Play" CTA routing to `/7-day-challenge`
- Removed Essence Mirror CTA from home (it lives in DiscoverTab)
- Hero Profile card hidden until essence identified (`archetypes?.essence?.name &&`)
- Changed icon from game controller to lightning bolt

### 2. Essence Mirror — 3 Slides Instead of 7
**File:** `src/flows/EssenceMirrorFlow.jsx`
- Cut hook slides from 7 to 3:
  1. "I believe you have a unique essence." [Tell me more]
  2. "School, work, and life taught you to suppress it." [tap]
  3. "This is designed to bring it back." [Let's find it]

### 3. ChallengeIntro — Tap Only, New Copy
**File:** `src/components/ChallengeIntro.jsx`
- Removed auto-timers (was 6s/8s), all slides tap-to-advance
- Updated steps:
  1. "Step 1. Discover experiences you love."
  2. "Step 2. Turn those experiences into life paths with projects and courage challenges."
  3. "Step 3. Watch your life transform as your comfort zone grows." [Begin Your Journey]

### 4. Progressive Step Banners
**Files:** `src/components/DiscoverTab.jsx`, `src/components/DiscoverTab.css`, `src/Challenge.jsx`
- Replaced "How it works" 3-step explainer card with contextual step banners
- Step 1 banner on Discover tab (auto-hides when choose-quests complete)
- Step 2 banner appears on Discover tab when bridge unlocks + first time on Paths tab
- Step 3 banner shows first time on Progress tab
- Each dismissible via localStorage-backed state

### 5. Discover Tab — Progressive Card Reveal
**File:** `src/components/DiscoverTab.jsx`
- Reordered: Experience Game first (quick win), Essence Mirror second
- Cards unlock progressively: Experience Game always visible, Essence Mirror after dome data, Current Job after essence done
- Reduced description copy (removed "Rate them with your nervous system", etc.)

### 6. Remove Clutter — Leaderboard, Community, League
**Files:** `src/components/ChallengeHeader.jsx`, `src/components/BottomToolbar.jsx`
- Removed Leaderboard + Community buttons from Challenge header
- Removed FestLeaderboard modal + import
- Removed League from bottom toolbar (4 items to 3: Home, Let's Play, Profile)
- Routes still work for direct navigation

### 7. Fix Native App — "Add to Home Screen"
**File:** `src/hooks/useChallengeData.js`
- Gate install-app screen behind `!isNative` check (Capacitor, standalone, display-mode)
- Auto-mark as seen for native users

### 8. Notification Prompts — Simplified
**Files:** `src/hooks/useChallengeData.js`, `src/Challenge.jsx`
- Full-page `enable-notifications` onboarding screen removed entirely
- Inline `NotificationPrompt` banner deferred to second visit (localStorage + useState pattern)

### 9. NS Daily Checkin — Gate + Single Click
**Files:** `src/Challenge.jsx`, `src/components/DailyCheckin.jsx`
- Gated behind choose-quests completion (no popup for brand new users)
- Simplified to single-click: tap a state, saves + closes immediately
- Removed drain/boost/regulation follow-up pages

### 10. Ghost Matchup — Hide for Week 1
**File:** `src/hooks/useGhostMatchup.js`
- Matchup scores hidden for week-1 users (no ghost data = null matchupData)
- Deep check: must have keys AND at least one non-zero score value
- Ghost intro banner auto-hidden (already gated by matchupData)

### 11. Let's Play — Visual Prominence
**Files:** `src/components/BottomToolbar.jsx`, `src/components/BottomToolbar.css`
- Icon changed from game controller to lightning bolt
- Purple background (#5e17eb) with white text, always stands out
- Added `toolbar-{id}` class pattern for per-item styling

## Files Modified

| File | Changes |
|------|---------|
| `src/pages/MePage.jsx` | Single CTA, hide Hero Profile, remove essenceMirrorDone state |
| `src/flows/EssenceMirrorFlow.jsx` | 7 hook slides to 3 |
| `src/components/ChallengeIntro.jsx` | Remove auto-timers, new step copy |
| `src/components/DiscoverTab.jsx` | Progressive reveal, reorder cards, step banners, remove How It Works |
| `src/components/DiscoverTab.css` | Step banner styles |
| `src/components/ChallengeHeader.jsx` | Remove Leaderboard/Community buttons + modal |
| `src/components/BottomToolbar.jsx` | Remove League, purple Let's Play, toolbar-{id} classes |
| `src/components/BottomToolbar.css` | Purple challenge button styles |
| `src/components/DailyCheckin.jsx` | Single-click checkin, remove drain/boost/regulation |
| `src/hooks/useChallengeData.js` | Native app install fix, remove full-page notification |
| `src/hooks/useGhostMatchup.js` | Week-1 ghost score gate |
| `src/Challenge.jsx` | NS checkin gate, notification defer, step banners on Paths/Progress |

## Outstanding (Not Shipped)

- **Custom icons replacing emojis** — Design task, needs style direction
- **Profile page redesign** — Basic, not engaging per feedback
- **Founder video intro** — Nic's story ("went from A to B, I want to do the same")
- **"Black Mirror social credit" feel** — Scoring/gamification feels surveillance-y
- **Post check-in text styling** — Black text doesn't feel right with the app
