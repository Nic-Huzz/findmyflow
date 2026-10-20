# Ghost Tune from Gaps

**Date:** 2026-09-26
**Status:** Draft

## Concept

The Ghost Self League currently replays last week's scores in all three categories. This changes **Tune only**: the Ghost's Tune score becomes what you DIDN'T do today (and each day this week), not what you did last week.

**Why this works:**
- Tune is daily habits. Binary, done-or-not-done, resets every day. Historical replay doesn't fit the rhythm.
- The Ghost literally IS your avoidance. One of the 5 protective voices in the app is called "The Ghost" (flight response). The weekly Ghost score being your skipped practices makes the metaphor real.
- "Don't repeat your avoidance" is a better game than "do more than last week." The Ghost shows you exactly what you skipped on each day this week.

**Category split:**
- **Tune**: Ghost = today's gaps (this spec)
- **Courage**: Ghost = last week's replay (unchanged)
- **Community**: Ghost = last week's replay (unchanged)

## Scoring Mechanics

### How it works

Each day has a set of available Tune practices (~55 RP total). The Ghost's Tune score for a day = the RP value of practices the user did NOT complete that day.

```
Ghost Tune (Monday) = Total possible RP - User's earned Tune RP on Monday
```

Example day (55 RP available):
- User completes sleep (3), exercise (3), meditation (5), style (3) = 14 RP
- Ghost gets 55 - 14 = 41 RP
- User needs to do MORE than half their practices to win Tune that day

Over the week, both sides accumulate cumulatively (same shape as existing system):
```
           Mon   Tue   Wed   Thu   Fri   Sat   Sun
User Tune:  14    28    40    52    58    70    82
Ghost Tune: 41    69    84    98   107   117   128  ← Ghost winning
```

To beat the Ghost in Tune, do more than you skip across the week. The crossover point is ~50% of available practices.

### Available practices per day

Source: `DAILY_PRACTICE_IDS` in TuneTab.jsx. Point values from challengeQuestsUpdate.json:

| Practice | RP | Notes |
|----------|---:|-------|
| practice_sleep | 3 | Binary |
| practice_exercise | 3 | Binary |
| practice_sunlight | 3 | Binary |
| practice_healthy_meal | 0-3 | 1 per meal (3 meals max) |
| reconnect_morning_meditation_breathwork | 5 | Binary |
| reconnect_daily_prayer | 4 | Binary |
| practice_connect_friend | 4 | Binary |
| safety_self_compassion | 4 | Binary |
| safety_savouring | 4 | Binary |
| safety_garbage_can | 4 | Binary |
| practice_own_style | 3 | Binary |
| practice_voice_work | 3 | Binary |
| practice_social_media | 4 | Binary |
| practice_triple_warmer | 5 | Binary |
| weekly_peak_state | 5 | Weekly (only counts once) |

**Daily total (excl. weekly):** ~52-55 RP (meal tracking is variable)
**Weekly item (peak_state):** 5 RP, counted on the day it's completed; Ghost gets it on days where it hasn't been done yet this week AND the week hasn't ended.

### Healthy meal edge case

Healthy meals are 0-3 per day (1 RP each). The Ghost's meal score = `3 - meals_logged_healthy`. If user logs 2 healthy meals, Ghost gets 1. If user hasn't opened meal tracking at all, Ghost gets 3.

### Weekly practice edge case

`weekly_peak_state` (5 RP) only needs to be done once per week. Ghost gets 5 RP for it on each day until it's completed. Once completed on any day, Ghost gets 0 for it on all remaining days (it's resolved). On past days before completion, the Ghost already banked those points (they don't retroactively disappear).

## Architecture

### What changes

| File | Change |
|------|--------|
| `src/lib/ghost/ghostScoring.js` | New `buildGhostTuneFromGaps()` function |
| `src/lib/ghost/ghostConfig.js` | Export `TUNE_PRACTICE_POINTS` constant (max RP per practice per day) |
| `src/hooks/useGhostMatchup.js` | Use gap-based Ghost Tune instead of last-week replay for Tune category |
| `supabase/functions/finalize-ghost-week/index.ts` | Compute Ghost Tune from gaps at finalization |
| `src/pages/league/GhostDashboard.jsx` | No structural change (data shape stays the same) |

### What stays the same

- `ghost_weekly_results` table schema (no new columns)
- `ghost_daily_scores` JSONB shape: `{ "YYYY-MM-DD": { tune, courage, community } }`
- Courage and Community ghost scoring (last-week replay + decay)
- `compareCategories()`, `getFinalTotals()`, `getScoresThrough()` (all unchanged)
- GhostRecapCard (reads same data shape)
- Streak system, decay system (unchanged)

### New: `TUNE_PRACTICE_POINTS` constant

In `ghostConfig.js`, export a map of practice quest IDs to their max daily RP value. Derived from challengeQuestsUpdate.json. Used by `buildGhostTuneFromGaps()` to compute daily max.

```javascript
export const TUNE_PRACTICE_POINTS = {
  practice_sleep: 3,
  practice_exercise: 3,
  practice_sunlight: 3,
  practice_healthy_meal: 3,  // max (3 meals)
  reconnect_morning_meditation_breathwork: 5,
  reconnect_daily_prayer: 4,
  practice_connect_friend: 4,
  safety_self_compassion: 4,
  safety_savouring: 4,
  safety_garbage_can: 4,
  practice_own_style: 3,
  practice_voice_work: 3,
  practice_social_media: 4,
  practice_triple_warmer: 5,
  weekly_peak_state: 5,  // weekly — special handling
}
// DAILY_MAX_TUNE_RP = sum of all values = 57
```

### New: `buildGhostTuneFromGaps()`

```javascript
/**
 * Build Ghost Tune scores from daily gaps (what user didn't do).
 * @param {Array} completions - All quest completions for the week
 * @param {string} weekStart - YYYY-MM-DD Monday
 * @param {string} todayDate - YYYY-MM-DD today (for live day boundary)
 * @returns {Object} Per-day Ghost Tune values (NOT cumulative)
 */
function buildGhostTuneFromGaps(completions, weekStart, todayDate)
```

Logic:
1. For each day Mon-Sun (up to and including today):
   - Find which Tune practice quest_ids were completed that day
   - Ghost Tune for that day = sum of `TUNE_PRACTICE_POINTS` for uncompleted practices
   - Special: healthy_meal Ghost = `3 - healthy_meals_completed`
   - Special: weekly_peak_state Ghost = 5 if not yet completed this week (any day up to and including current day), 0 if already done
2. Future days (after today): no Ghost Tune value yet (null/undefined)

### Modified: `buildDailyScores()` 

Add optional parameter to inject Ghost Tune gaps:

```javascript
buildDailyScores(completions, weekStart, contentSubmissions = [], ghostTuneOverrides = null)
```

When `ghostTuneOverrides` is provided, the ghost's `tune` values use the overrides instead of the completion-based scoring. Courage and Community are unaffected.

Alternatively (simpler): keep `buildDailyScores` unchanged for user scoring. Build the ghost's `ghost_daily_scores` separately by:
1. Computing Courage + Community ghost from last week (existing logic)
2. Computing Tune ghost from this week's gaps (`buildGhostTuneFromGaps`)
3. Merging into the same `{ date: { tune, courage, community } }` shape

### Modified: `useGhostMatchup.js`

Current flow (on mount):
1. If ghost_daily_scores is empty, build ghost from last week's completions
2. Apply decay, translate dates, save

New flow:
1. If ghost_daily_scores is empty, build **Courage + Community** ghost from last week (existing logic)
2. Apply decay to Courage + Community only
3. Translate dates, save Courage + Community ghost scores
4. **On every render**: compute Ghost Tune from gaps using current completions (live)
5. Merge live Ghost Tune into the ghost totals for comparison

The Ghost Tune is NOT saved to `ghost_daily_scores` during the week (it's computed live from completions). It IS saved at finalization.

### Modified: `finalize-ghost-week` edge function

At finalization:
1. Build user's daily scores (unchanged)
2. Build Ghost Courage + Community from the ghost_daily_scores stored on the row (unchanged)
3. Build Ghost Tune from gaps: for each day, `max_daily_tune - user_tune_that_day`
4. Merge into final ghost totals for comparison
5. Store the merged ghost (including gap-based Tune) in `user_daily_scores` alongside user scores for history

### Ghost Tune for past weeks (history display)

Finalized weeks store both `user_daily_scores` and ghost totals. Once finalized, the gap-based Tune ghost is baked in. History display works unchanged.

### First week (no prior data)

First week has no ghost for Courage + Community (no last week to replay). Tune ghost still works from day 1 — it's based on today's gaps, not history. This means Tune is the only competitive category in week 1 (Courage + Community ghost = 0).

### Decay

Decay only applies to Courage + Community ghost (last-week replay). Tune ghost is computed fresh from this week's gaps — decay doesn't apply because the Ghost isn't replaying anything.

## UX Implications

- The Tune race is now **immediately actionable**. At 8am the Ghost is winning Tune heavily. By 10pm you've either caught up or you haven't.
- Courage + Community still build over the week (strategic). Tune is daily (tactical).
- The category comparison (2-of-3 wins) now has a natural tension: Tune requires daily discipline, the other two require weekly effort. Different types of engagement.
- The Ghost Dashboard day-by-day table shows the same data shape. No UI restructuring needed.

## What this does NOT change

- RP leveling system (user still earns RP from completing practices)
- Capacity Score / Vibe Rise score
- TuneTab UI (checkboxes, practices, drains, stalls)
- Quest completions data model
- Weekly Review
- Any other feature outside the Ghost Self League
