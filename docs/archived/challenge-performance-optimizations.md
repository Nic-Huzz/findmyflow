# 7-Day Challenge Performance Optimizations

**Date:** 2026-02-04
**Files changed:** `src/hooks/useChallengeData.js`, `src/components/QuestCard.jsx`, `src/components/GroanMatrix.jsx`

## Problem

The 7-day challenge page (`/7-day-challenge`) was loading slowly. The root cause was a combination of sequential (waterfall) database queries during initial load and unnecessary re-renders/reloads during use.

## Summary of Changes

### Round 1: Parallelizing Data Fetches

#### 1. `loadChallengeData` - Parallel JSON fetches
**File:** `useChallengeData.js`

Two static JSON files (`challengeQuestsUpdate.json` and `dailyReleaseChallenges.json`) were fetched sequentially. Now fetched in parallel via `Promise.all`.

```js
// Before
const response = await fetch('/challengeQuestsUpdate.json')
const data = await response.json()
const response2 = await fetch('/dailyReleaseChallenges.json')
const data2 = await response2.json()

// After
const [response, response2] = await Promise.all([
  fetch('/challengeQuestsUpdate.json'),
  fetch('/dailyReleaseChallenges.json')
])
```

**Impact:** Saves ~1 network round-trip on every page load.

---

#### 2. `loadUserProgress` (no active challenge path) - Parallel queries
**File:** `useChallengeData.js`

When a user has no active challenge, two independent Supabase queries ran sequentially:
- Fetch user-level quest completions
- Check for any previous challenge history

Now wrapped in `Promise.all`.

**Impact:** Halves the wait time for first-time/returning users without an active challenge.

---

#### 3. `loadUserProgress` (active challenge path) - Parallel batches
**File:** `useChallengeData.js`

This was the **biggest bottleneck** - it controlled the loading spinner. Previously 5 sequential DB calls:

1. Fetch challenge progress
2. Fetch project data (if project_id exists)
3. Check streak break
4. Fetch challenge-specific completions
5. Fetch user-level completions

Now restructured into parallel batches:
- **Batch 1:** Project data + streak check run in parallel
- **Batch 2:** Both completion queries run in parallel

**Impact:** Reduced from ~5 sequential DB round-trips to ~3 steps (initial query, then 2 parallel batches). This is what the user sees as "loading time."

---

#### 4. `loadUserScores` - Parallel score queries
**File:** `useChallengeData.js`

Weekly scores and lifetime scores were fetched sequentially from two different tables. Now fetched in parallel.

**Impact:** Saves ~1 DB round-trip.

---

#### 5. Main `useEffect` - Explicit `Promise.all`
**File:** `useChallengeData.js`

The 10 data-loading functions called on user load were already non-blocking (no `await`), but wrapping in `Promise.all` makes the concurrency explicit and properly catches unhandled rejections.

---

### Round 2: Rendering & Subscription Optimizations

#### 6. QuestCard wrapped in `React.memo`
**File:** `QuestCard.jsx`

QuestCard was a plain function component with no memoization. Every state change in the parent Challenge.jsx (typing in an input field, toggling a menu, expanding learn-more) caused ALL quest cards to re-render, even those whose props hadn't changed.

Wrapping in `React.memo` ensures each card only re-renders when its own props change.

**Impact:** With 10-20+ quest cards on screen, this prevents potentially hundreds of unnecessary DOM reconciliations per interaction.

---

#### 7. GroanMatrix `loadData` parallelized
**File:** `GroanMatrix.jsx`

After the initial flow-finder completion check, three independent data fetches ran sequentially:
- `fetchFlowFinderData`
- `getGroanStats`
- `groan_challenges` query

Now all three run in parallel via `Promise.all`.

**Impact:** GroanMatrix loads ~3x faster when the Groans tab or Groans stage is active.

---

#### 8. Removed `progress` from leaderboard useEffect dependencies
**File:** `useChallengeData.js`

The leaderboard reload was triggered by changes to both `leaderboardView` and `progress`. Since `progress` updates on every quest completion (points change), this meant every single quest completion triggered a heavy leaderboard query (3+ sequential DB calls).

Removed `progress` from the dependency array so leaderboard only reloads when the user toggles the weekly/all-time view.

**Impact:** Eliminates an expensive multi-query reload on every quest completion.

---

#### 9. Debounced real-time leaderboard subscription
**File:** `useChallengeData.js`

The Supabase realtime subscription on the `challenge_progress` table was unthrottled - every change from any user triggered an immediate `loadLeaderboard()` call. When multiple users are active, this could fire many times per second.

Added a 2-second debounce so it waits for activity to settle before reloading.

```js
// Before
() => { loadLeaderboard() }

// After
() => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => loadLeaderboard(), 2000)
}
```

**Impact:** Prevents rapid-fire leaderboard reloads during periods of high activity.

---

#### 10. `currentWeeklyPoints` memoized with `useMemo`
**File:** `useChallengeData.js`

This value was calculated via an IIFE on every render - iterating all completions, creating `Date` objects, and filtering/reducing. Replaced with `useMemo` keyed on `completions`.

**Impact:** Only recalculates when completions actually change, not on every unrelated state update.

---

## Before vs After

| Metric | Before | After |
|--------|--------|-------|
| Sequential DB calls on load (active challenge) | ~5 | ~3 (2 parallel batches) |
| Sequential DB calls on load (no challenge) | ~2 | ~1 (parallel) |
| JSON fetches | Sequential (2) | Parallel (1 batch) |
| GroanMatrix data fetches | Sequential (3) | Parallel (1 batch) |
| Quest card re-renders per interaction | All cards | Only changed cards |
| Leaderboard reloads per quest completion | 1 (expensive) | 0 |
| Realtime subscription throttling | None | 2s debounce |
| Weekly points recalculation | Every render | Only when completions change |

## Risk Assessment

All changes are **safe and non-breaking**:
- `Promise.all` preserves the same data flow, just runs queries concurrently
- `React.memo` is a pure optimization - same behavior, fewer renders
- `useMemo` produces the same value, just cached
- Removing `progress` from leaderboard deps means leaderboard data may be slightly stale until the user toggles the view or the realtime subscription fires - acceptable tradeoff
- Debouncing the subscription means leaderboard updates lag by up to 2s - imperceptible to users
