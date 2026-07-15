# Fantasy League Overall Score Implementation Plan (v2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change Fantasy League scoring from 3-category system (Tune/Wahoos/Healing, win 2 of 3) to head-to-head overall score (single total RP, higher total wins).

**Architecture:** Two tasks. Task 1 updates the scoring engine + edge function (backend). Task 2 updates the UI (ChallengeHeader + matchup pages). Each task produces a working app.

**Tech Stack:** React 18 + Supabase (PostgreSQL, Edge Functions) + Vite

## Global Constraints

- Light theme (#f5f5f0 background, #5e17eb purple, #E9A23B gold)
- Branch: `light-portal`
- Keep `FANTASY_CATEGORIES` config object — `getCategoryEmoji`/`getCategoryColor` are used by other code. Just change how scoring uses them.
- The `fantasy_matchups` DB table has columns: `team_a_categories_won`, `team_b_categories_won`, `team_a_match_points`, `team_b_match_points`, `category_results` (JSONB). Keep writing to all of them for backwards compat. `categories_won` becomes 1 (won overall) or 0 (lost/drew). `category_results` still stores per-category breakdown.
- The `get_league_scores` Supabase RPC returns per-category totals grouped by user_id. Still works — we sum them client-side.
- `scoringCategories.js` is NOT part of the league scoring (it's used for the old scoring display). Leave it untouched.

## Current vs New Scoring

| | Current | New |
|---|---|---|
| **Model** | Win 2 of 3 categories = WIN | Higher total RP = WIN |
| **Match points** | WIN=3, DRAW=1, LOSS=0 | Same values, different trigger |
| **Category display** | 3 pills (Tune/Wahoos/Healing) in header | Single total RP |
| **Matchup display** | Per-category W/L bars | Total vs total |
| **categories_won DB field** | 0-3 (how many categories won) | 0 or 1 (won overall or not) |

---

### Task 1: Scoring Engine + Edge Function

**Files:**
- Modify: `src/lib/league/leagueConfig.js`
- Modify: `src/lib/league/leagueScoring.js`
- Modify: `supabase/functions/score-league-matchups/index.ts`

**Interfaces:**
- Consumes: `get_league_scores` RPC, `quest_completions` table (both unchanged)
- Produces: `calculateMatchupResult` returns `{ totalA, totalB, teamAMatchPoints, teamBMatchPoints, categoryResults }`. The `teamACategoriesWon` / `teamBCategoriesWon` fields become 1/0 (won overall or not).

- [ ] **Step 1: Update leagueConfig.js comment**

In `src/lib/league/leagueConfig.js`, update the MATCH_POINTS comment (line ~107):

```javascript
// BEFORE:
// Match point awards (3 categories: win 2+ = WIN, 1-1 = DRAW)
export const MATCH_POINTS = {
  WIN: 3,   // Win 2+ of 3 categories
  DRAW: 1,  // 1-1 split (with 1 tied)
  LOSS: 0,  // Win 0 categories
}

// AFTER:
// Match point awards (head-to-head total RP)
export const MATCH_POINTS = {
  WIN: 3,   // Higher total RP
  DRAW: 1,  // Equal total RP
  LOSS: 0,  // Lower total RP
}
```

- [ ] **Step 2: Update calculateUserCategoryScores — add total**

In `src/lib/league/leagueScoring.js`, function `calculateUserCategoryScores` (line ~24). After the scoring loop (line ~47), add total before return:

```javascript
// BEFORE (line ~47):
  return scores

// AFTER:
  scores.total = CATEGORY_KEYS.reduce((sum, k) => sum + scores[k], 0)
  return scores
```

- [ ] **Step 3: Update calculateTeamScores — add total**

In `src/lib/league/leagueScoring.js`, function `calculateTeamScores` (line ~64). After the scoring loop (line ~94), add totals:

```javascript
// BEFORE (line ~94):
  return { ...teamTotals, members: memberScores }

// AFTER:
  teamTotals.total = CATEGORY_KEYS.reduce((sum, k) => sum + teamTotals[k], 0)
  Object.keys(memberScores).forEach(id => {
    memberScores[id].total = CATEGORY_KEYS.reduce((sum, k) => sum + memberScores[id][k], 0)
  })
  return { ...teamTotals, members: memberScores }
```

- [ ] **Step 4: Rewrite calculateMatchupResult — compare totals**

In `src/lib/league/leagueScoring.js`, replace the entire `calculateMatchupResult` function (lines ~108-150):

```javascript
export function calculateMatchupResult(teamAScores, teamBScores) {
  // Calculate totals (use .total if available, otherwise sum categories)
  const totalA = teamAScores.total ?? CATEGORY_KEYS.reduce((sum, k) => sum + (teamAScores[k] || 0), 0)
  const totalB = teamBScores.total ?? CATEGORY_KEYS.reduce((sum, k) => sum + (teamBScores[k] || 0), 0)

  // Head-to-head: higher total wins
  let teamAMatchPoints = MATCH_POINTS.LOSS
  let teamBMatchPoints = MATCH_POINTS.LOSS
  let teamACategoriesWon = 0  // 1 = won overall, 0 = lost/drew (backwards compat with DB)
  let teamBCategoriesWon = 0

  if (totalA > totalB) {
    teamAMatchPoints = MATCH_POINTS.WIN
    teamACategoriesWon = 1
  } else if (totalB > totalA) {
    teamBMatchPoints = MATCH_POINTS.WIN
    teamBCategoriesWon = 1
  } else {
    teamAMatchPoints = MATCH_POINTS.DRAW
    teamBMatchPoints = MATCH_POINTS.DRAW
  }

  // Per-category breakdown (kept for optional display)
  const categoryResults = CATEGORY_KEYS.map(key => ({
    category: key,
    label: FANTASY_CATEGORIES[key].label,
    teamAScore: teamAScores[key] || 0,
    teamBScore: teamBScores[key] || 0,
    winner: (teamAScores[key] || 0) > (teamBScores[key] || 0) ? 'a'
      : (teamBScores[key] || 0) > (teamAScores[key] || 0) ? 'b' : null,
  }))

  return {
    totalA,
    totalB,
    teamACategoriesWon,
    teamBCategoriesWon,
    teamAMatchPoints,
    teamBMatchPoints,
    categoryResults,
  }
}
```

- [ ] **Step 5: Update leagueScoring.js — getTeamStandings**

The `getTeamStandings` function (find it by searching for `getTeamStandings`) reads `category_results` from matchup records to compute raw points. It also reads `team_a_categories_won`. Verify it still works with the new shape. The `totalA`/`totalB` aren't stored in DB — they're derived from `category_results` sum. Check:

Search for `rawPointsFor` and verify the loop that sums `category_results` still works:
```javascript
;(m.category_results || []).forEach(cr => {
  rawPointsFor += cr.teamAScore || 0  // or teamBScore depending on side
})
```
This still works because `categoryResults` still has `teamAScore`/`teamBScore` per category. No change needed here.

- [ ] **Step 6: Update edge function — calculateMatchupResult**

In `supabase/functions/score-league-matchups/index.ts`, replace the `calculateMatchupResult` function (lines 274-318):

```typescript
function calculateMatchupResult(teamAScores: Record<string, number>, teamBScores: Record<string, number>) {
  // Calculate totals
  const totalA = CATEGORY_KEYS.reduce((sum, k) => sum + (teamAScores[k] || 0), 0)
  const totalB = CATEGORY_KEYS.reduce((sum, k) => sum + (teamBScores[k] || 0), 0)

  // Head-to-head: higher total wins
  let teamAMatchPoints = MATCH_POINTS.LOSS
  let teamBMatchPoints = MATCH_POINTS.LOSS
  let teamACategoriesWon = 0
  let teamBCategoriesWon = 0

  if (totalA > totalB) {
    teamAMatchPoints = MATCH_POINTS.WIN
    teamACategoriesWon = 1
  } else if (totalB > totalA) {
    teamBMatchPoints = MATCH_POINTS.WIN
    teamBCategoriesWon = 1
  } else {
    teamAMatchPoints = MATCH_POINTS.DRAW
    teamBMatchPoints = MATCH_POINTS.DRAW
  }

  // Per-category breakdown (kept for DB storage + optional display)
  const categoryResults = CATEGORY_KEYS.map(key => {
    const config = FANTASY_CATEGORIES[key]
    const a = teamAScores[key] || 0
    const b = teamBScores[key] || 0
    return {
      category: key,
      label: config.label,
      teamAScore: a,
      teamBScore: b,
      winner: a > b ? 'a' : b > a ? 'b' : null,
    }
  })

  return { teamACategoriesWon, teamBCategoriesWon, teamAMatchPoints, teamBMatchPoints, categoryResults }
}
```

The DB update at line 188-198 still writes `team_a_categories_won`, `team_b_categories_won`, etc. — these fields still exist in the return, just with different semantics (0/1 instead of 0-3).

- [ ] **Step 7: Verify build**

Run: `npm run build`

- [ ] **Step 8: Deploy edge function**

```bash
npx supabase functions deploy score-league-matchups --project-ref qlwfcfypnoptsocdpxuv
```

- [ ] **Step 9: Commit**

```bash
git add src/lib/league/leagueConfig.js src/lib/league/leagueScoring.js supabase/functions/score-league-matchups/index.ts
git commit -m "feat: Fantasy League — head-to-head overall RP score (replaces 3-category system)"
```

---

### Task 2: UI — ChallengeHeader + Matchup Pages

**Files:**
- Modify: `src/components/ChallengeHeader.jsx`
- Modify: `src/hooks/useMatchupData.js`
- Modify: `src/Challenge.css` (ChallengeHeader styles)

**IMPORTANT:** Read each file fully before modifying. The ChallengeHeader currently shows:
1. Team matchup banner (W-L indicator) — KEEP but simplify
2. "Vibe Rise" title — KEEP
3. Score block: total left + 3 category pills right — CHANGE: remove pills, keep total
4. Level bar — KEEP
5. Bottom row (streak, leaderboard, community, settings) — KEEP

- [ ] **Step 1: ChallengeHeader — remove category pills**

In `src/components/ChallengeHeader.jsx`:

Remove the `DISPLAY_KEYS`, `bars` computation, and `CATEGORY_TEXT_COLORS` constant (lines 26-28 and 96-113). These drive the 3 pills.

Remove the category pills JSX (lines 150-158):
```jsx
// DELETE this entire block:
<div className="challenge-divider" />
<div className="challenge-category-pills">
  {bars.map(bar => (
    <div key={bar.key} className="challenge-pill" style={bar.textColor ? { color: bar.textColor } : undefined}>
      <span className="challenge-pill-icon">{bar.icon}</span>
      <span className="challenge-pill-score">{bar.score}</span>
      <span className="challenge-pill-label">{bar.label}</span>
    </div>
  ))}
</div>
```

Update the total display to be more prominent (lines 143-148). Change `'total pts'` / `'weekly pts'` label:

```jsx
<div className="challenge-total">
  <span className="challenge-total-value">{animatedWeeklyPoints.pts ?? weeklyPoints}</span>
  <span className="challenge-total-label">RP this week</span>
</div>
```

Remove the `challenge-divider` from the score block since pills are gone. The score block becomes just the total.

Remove the `FANTASY_CATEGORIES` import if no longer used in this file (check — it's used by `bars` which we removed). The `useScoreAnimation` for `categoryScores` can also be removed.

Clean up:
```javascript
// REMOVE these lines:
const animatedCategoryScores = useScoreAnimation(categoryScores)
const DISPLAY_KEYS = ['tune', 'play_list', 'healing']
const bars = DISPLAY_KEYS.map(key => { ... })

// KEEP:
const animatedWeeklyPoints = useScoreAnimation({ pts: weeklyPoints })
```

Also remove the `CATEGORY_TEXT_COLORS` constant at the top of the file (lines ~26-30).

- [ ] **Step 2: ChallengeHeader — simplify matchup banner**

The matchup banner currently shows `myWins - oppWins` (category wins). Change to total RP comparison:

```jsx
{/* BEFORE: */}
<span className="challenge-matchup-pill">
  <span className={matchupData.myWins > matchupData.oppWins ? 'winning' : ...}>
    {matchupData.myWins}
  </span>
  -
  <span className={...}>{matchupData.oppWins}</span>
</span>

{/* AFTER: */}
<span className="challenge-matchup-pill">
  <span className={matchupData.myTotal > matchupData.oppTotal ? 'winning' : matchupData.myTotal < matchupData.oppTotal ? 'losing' : ''}>
    {matchupData.myTotal}
  </span>
  <span className="challenge-matchup-vs">vs</span>
  <span className={matchupData.oppTotal > matchupData.myTotal ? 'winning' : matchupData.oppTotal < matchupData.myTotal ? 'losing' : ''}>
    {matchupData.oppTotal}
  </span>
</span>
```

- [ ] **Step 3: useMatchupData — expose totals instead of category wins**

In `src/hooks/useMatchupData.js`, the Phase 2 fetch (line ~89) builds per-category comparison. Change to compute totals:

After the existing `categories` array computation (keep it for optional breakdown), add:

```javascript
const myTotal = CATEGORY_KEYS.reduce((sum, k) => sum + (categoryScores[k] || 0), 0)
const oppTotal = CATEGORY_KEYS.reduce((sum, k) => sum + (oppScores[k] || 0), 0)
```

Update the `setMatchupData` call (line ~106):

```javascript
// BEFORE:
setMatchupData({
  opponentName: oppTeam.name,
  myWins,
  oppWins,
  categories,
})

// AFTER:
setMatchupData({
  opponentName: oppTeam.name,
  myTotal,
  oppTotal,
  myWins,      // kept for optional per-category display
  oppWins,     // kept for optional per-category display
  categories,  // kept for optional breakdown
})
```

Update the W/L flip detection (lines ~114-131). Change from per-category flip to total flip:

```javascript
// BEFORE: flips per category
// AFTER: flip based on total lead change
const wasWinning = prevWinningRef.current?.overall
const nowWinning = myTotal > oppTotal
if (wasWinning !== undefined) {
  if (!wasWinning && nowWinning) {
    triggerSideCannons()
    hapticSuccess()
    setFlipEvent({ type: 'win', myTotal, oppTotal })
    // ... push notification logic stays
  } else if (wasWinning && !nowWinning) {
    hapticError()
    setFlipEvent({ type: 'loss', myTotal, oppTotal })
  }
}
prevWinningRef.current = { overall: nowWinning }
```

- [ ] **Step 4: Clean up CSS**

In `src/Challenge.css`, find and remove (or comment out) the styles for:
- `.challenge-category-pills`
- `.challenge-pill`
- `.challenge-pill-icon`
- `.challenge-pill-score`
- `.challenge-pill-label`
- `.challenge-divider`

Search for these class names and remove their rule blocks. The `.challenge-total` and `.challenge-score-block` styles stay.

Make `.challenge-score-block` center the total since pills are gone:

```css
.challenge-score-block {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 16px;
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`

- [ ] **Step 6: Manual test**

- `/7-day-challenge` header shows single total RP (no category pills)
- Matchup banner shows "45 vs 32" (totals, not category wins)
- Level bar still shows correctly
- Streak + leaderboard + community buttons still work
- If in an active matchup, the W/L flip animation fires on total lead change

- [ ] **Step 7: Commit**

```bash
git add src/components/ChallengeHeader.jsx src/hooks/useMatchupData.js src/Challenge.css
git commit -m "feat: ChallengeHeader — single total RP, matchup shows total vs total"
```

---

## NOT in scope (future work)

These pages still show per-category breakdowns. They work with the new data (categoryResults is still stored) but could be simplified later:

- `src/pages/league/MatchupDetails.jsx` — shows per-category comparison bars
- `src/pages/league/WeekMatchups.jsx` — shows per-week results
- `src/components/league/LeagueLeaderboard.jsx` — shows standings
- `src/components/WeeklyRecapCard.jsx` — shows weekly recap
- `src/flows/LeagueGuide.jsx` — explains the league format

These all read `categoryResults` from the matchup data and display breakdowns. The data shape hasn't changed (categoryResults still has per-category scores), so they still work. The semantics of `categoriesWon` changed (0/1 instead of 0-3) but these pages mostly use `matchPoints` (WIN/DRAW/LOSS) which is unchanged.

Leave these for a cleanup pass after the core scoring + header changes are validated.
