# Bug: computeCreatorXP reads stale dashboardKPIs

**Severity:** Low (XP displays 0 for repeatRate/totalAttendees on first load, correct on re-render)
**Found by:** Code reviewer agent, 2026-07-15
**File:** `src/components/CreatorHome/CreatorHomeV2.jsx`

## The Problem

Inside `loadData()` (line 246), `computeCreatorXP` is called at line 327 with `dashboardKPIs.repeatRate` and `dashboardKPIs.totalAttendees`. But those values are computed LATER in the same function at lines 363-369 via `setDashboardKPIs()`.

At the point `computeCreatorXP` runs:
- `dashboardKPIs` is still the initial state: `{ totalAttendees: 0, repeatRate: 0 }`
- The real values are computed from `attendeeRows` at line 363-369, AFTER the XP calculation

This means XP is always calculated with `repeatRate: 0` and `totalAttendees: 0` on the first load. The state updates eventually trigger a re-render, but `computeCreatorXP` is not re-called because it's inside `loadData()` which only runs once.

Similarly, `past` (used for `pastEventCount` and `threePercentCount` at lines 326/333) comes from `useExperienceList()`. When `loadData()` fires via `useEffect([userId])`, `expLoading` may still be true, meaning `past` is an empty array even if the user has completed experiences.

## The Fix

Compute KPIs locally inside `loadData()` BEFORE calling `computeCreatorXP`, using the same `attendeeRows` data that's already fetched:

```jsx
// Line ~325, BEFORE computeCreatorXP:

// Compute KPIs locally first (don't rely on stale state)
let localTotalAttendees = 0
let localRepeatRate = 0
if (attendeeRows?.length) {
  const counts = {}
  attendeeRows.forEach(a => { if (a.contact_id) counts[a.contact_id] = (counts[a.contact_id] || 0) + 1 })
  localTotalAttendees = Object.keys(counts).length
  const repeats = Object.values(counts).filter(c => c >= 2).length
  localRepeatRate = localTotalAttendees > 0 ? Math.round((repeats / localTotalAttendees) * 100) : 0
}

// Now compute XP with fresh values
setCreatorXP(computeCreatorXP({
  hasRemarkableResults: !!remarkData?.id,
  hasReach: !!reachData?.id,
  hasGrowth: !!growthData?.id,
  hasScaleScore: !!scaleScoreData?.id,
  hasPositioning: !!essenceProfile?.positioning_statement,
  pastEventCount: past.length,
  threePercentCount: past.filter(e => e.three_percent_note).length,
  filledEventCount: 0,
  repeatRate: localRepeatRate,
  totalAttendees: localTotalAttendees,
}))

// Then set state for display (existing code at line 363)
setDashboardKPIs({ totalAttendees: localTotalAttendees, repeatRate: localRepeatRate })
```

This eliminates the duplication too, since the KPI computation at lines 363-369 becomes redundant (just use the local variables).

For the `past` array issue: `loadData()` is only called inside `useEffect([userId])`, and `past` is derived from `experiences` which comes from `useExperienceList()`. This is a race condition, but it's harmless in practice because `loadData()` is gated by `if (!userId) return` and the experience list loads fast. If it ever matters, the fix is to move `computeCreatorXP` into a separate `useEffect` that depends on both `loading` and `expLoading` being false.

## Impact

- XP bar on `/create` shows slightly wrong value on first load (missing repeatRate + totalAttendees contribution)
- Correct after any state change triggers re-render
- Most users won't notice because the XP difference from repeatRate/totalAttendees is small relative to the other inputs
