# Fantasy League Overall Score Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change Fantasy League scoring from 3-category system (Tune/Wahoos/Healing, win 2 of 3) to head-to-head overall score (single total RP, higher total wins).

**Architecture:** Three tasks. Task 1 updates the scoring engine + config. Task 2 updates the edge function. Task 3 updates all UI components. Each task produces a working app.

**Tech Stack:** React 18 + Supabase (PostgreSQL, Edge Functions) + Vite

## Global Constraints

- Light theme (#f5f5f0 background, #5e17eb purple, #E9A23B gold)
- Branch: `light-portal`
- The `get_league_scores` Supabase RPC still works and still returns per-category totals. We SUM them client-side.
- Keep `FANTASY_CATEGORIES` config for backwards compat (other code uses `getCategoryEmoji`/`getCategoryColor`). Just change how scoring USES them.
- The `quest_completions` table structure doesn't change. All categories (Groans, Healing, Tune, Daily, Weekly) still earn RP. We just score them as one total.

## Current State (what to change)

**Scoring model:** Win 2 of 3 categories = WIN (3pts), 1-1 = DRAW (1pt), 0 = LOSS (0pts).

**New model:** Higher total RP = WIN (3pts), equal = DRAW (1pt each), lower = LOSS (0pts).

## Files to Modify

```
MODIFY:
  src/lib/league/leagueConfig.js         — simplify MATCH_POINTS logic description
  src/lib/league/leagueScoring.js        — calculateMatchupResult uses total not categories
  supabase/functions/score-league-matchups/index.ts — server-side scoring matches client
  src/components/ChallengeHeader.jsx      — 3 category pills → single total RP display
  src/pages/league/MatchupDetails.jsx     — per-category bars → single total comparison
  src/pages/league/WeekMatchups.jsx       — category indicators → total score
  src/components/league/LeagueLeaderboard.jsx — category breakdowns → total
  src/components/WeeklyRecapCard.jsx      — category recap → total
  src/hooks/useMatchupData.js             — categoryScores → totalScore
  src/lib/scoringCategories.js            — may need updating if it drives category display
```

---

### Task 1: Scoring Engine + Config

**Files:**
- Modify: `src/lib/league/leagueConfig.js`
- Modify: `src/lib/league/leagueScoring.js`

**Interfaces:**
- Consumes: `get_league_scores` RPC (unchanged)
- Produces: `calculateUserCategoryScores` still returns per-category object (for potential breakdown display) BUT also returns a `total` key. `calculateMatchupResult` compares totals not categories.

**IMPORTANT:** Read both files fully before modifying. The `calculateMatchupResult` function (leagueScoring.js ~line 108) is the core logic to change.

- [ ] **Step 1: Update leagueConfig.js — simplify match points description**

Keep `FANTASY_CATEGORIES` and `MATCH_POINTS` as-is. Only update the comment:

```javascript
// Match point awards (head-to-head total score)
export const MATCH_POINTS = {
  WIN: 3,   // Higher total RP
  DRAW: 1,  // Equal total RP
  LOSS: 0,  // Lower total RP
}
```

- [ ] **Step 2: Update calculateUserCategoryScores — add total**

In `leagueScoring.js`, after the per-category scoring loop, add a total:

```javascript
// After the forEach loop that populates scores:
scores.total = Object.values(scores).reduce((sum, v) => sum + v, 0)
return scores
```

- [ ] **Step 3: Update calculateTeamScores — add total**

Same pattern: after populating `teamTotals`, add:

```javascript
teamTotals.total = CATEGORY_KEYS.reduce((sum, k) => sum + teamTotals[k], 0)
// Also add total per member:
Object.keys(memberScores).forEach(id => {
  memberScores[id].total = CATEGORY_KEYS.reduce((sum, k) => sum + memberScores[id][k], 0)
})
```

- [ ] **Step 4: Rewrite calculateMatchupResult — compare totals**

Replace the category-by-category comparison with total comparison:

```javascript
export function calculateMatchupResult(teamAScores, teamBScores) {
  const totalA = teamAScores.total ?? CATEGORY_KEYS.reduce((sum, k) => sum + (teamAScores[k] || 0), 0)
  const totalB = teamBScores.total ?? CATEGORY_KEYS.reduce((sum, k) => sum + (teamBScores[k] || 0), 0)

  let teamAMatchPoints = MATCH_POINTS.LOSS
  let teamBMatchPoints = MATCH_POINTS.LOSS

  if (totalA > totalB) {
    teamAMatchPoints = MATCH_POINTS.WIN
  } else if (totalB > totalA) {
    teamBMatchPoints = MATCH_POINTS.WIN
  } else {
    // Equal totals = draw
    teamAMatchPoints = MATCH_POINTS.DRAW
    teamBMatchPoints = MATCH_POINTS.DRAW
  }

  // Keep per-category breakdown for display (optional)
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
    teamAMatchPoints,
    teamBMatchPoints,
    categoryResults, // kept for optional breakdown display
  }
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`

- [ ] **Step 6: Commit**

```bash
git add src/lib/league/leagueConfig.js src/lib/league/leagueScoring.js
git commit -m "feat: Fantasy League — head-to-head overall score (replaces 3-category system)"
```

---

### Task 2: Edge Function Update

**Files:**
- Modify: `supabase/functions/score-league-matchups/index.ts`

**IMPORTANT:** Read the full edge function first. It runs every 15 min via cron. The scoring logic inside should mirror `calculateMatchupResult` from Task 1. Find the section that compares category wins and replace with total comparison.

- [ ] **Step 1: Read the edge function**

Read: `supabase/functions/score-league-matchups/index.ts`

Find the matchup scoring section. It will iterate over categories and count wins. Replace with total RP comparison.

- [ ] **Step 2: Update matchup result calculation**

The key change: instead of counting category wins (win 2 of 3), compare total scores:

```typescript
const totalA = Object.values(teamAScores).reduce((s, v) => s + v, 0)
const totalB = Object.values(teamBScores).reduce((s, v) => s + v, 0)

let teamAPoints = 0
let teamBPoints = 0

if (totalA > totalB) {
  teamAPoints = 3 // WIN
} else if (totalB > totalA) {
  teamBPoints = 3 // WIN
} else {
  teamAPoints = 1 // DRAW
  teamBPoints = 1 // DRAW
}
```

- [ ] **Step 3: Deploy**

```bash
npx supabase functions deploy score-league-matchups --project-ref qlwfcfypnoptsocdpxuv
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/score-league-matchups/
git commit -m "feat: score-league-matchups edge function — overall score instead of categories"
```

---

### Task 3: UI Updates

**Files:**
- Modify: `src/components/ChallengeHeader.jsx`
- Modify: `src/hooks/useMatchupData.js`
- Modify: `src/pages/league/MatchupDetails.jsx`
- Modify: `src/pages/league/WeekMatchups.jsx`
- Modify: `src/components/league/LeagueLeaderboard.jsx`
- Modify: `src/components/WeeklyRecapCard.jsx`

**IMPORTANT:** Read each file fully before modifying. The UI changes are:
1. ChallengeHeader: 3 score pills → 1 total RP number
2. MatchupDetails: per-category comparison bars → single total bar
3. WeekMatchups: category win/loss badges → total score + W/L indicator
4. LeagueLeaderboard: category columns → total column
5. WeeklyRecapCard: category recap → total recap

- [ ] **Step 1: ChallengeHeader — single total instead of 3 pills**

Read `src/components/ChallengeHeader.jsx`. Find the score pills section (3 pills showing Tune/Wahoos/Healing). Replace with single total RP display:

```jsx
{/* Before: 3 category pills */}
{/* After: single total */}
<div className="score-total">
  <span className="score-total-value">{weeklyPoints}</span>
  <span className="score-total-label">RP this week</span>
</div>
```

Remove the per-category score pill rendering. Keep the `categoryScores` data available if needed for matchup display.

- [ ] **Step 2: useMatchupData — expose totalScore**

Read `src/hooks/useMatchupData.js`. Ensure it exposes a `totalScore` (sum of all categories) alongside `categoryScores`. The hook should return:

```javascript
totalScore: Object.values(categoryScores).reduce((s, v) => sum + v, 0)
```

- [ ] **Step 3: MatchupDetails — total comparison**

Read `src/pages/league/MatchupDetails.jsx`. Replace per-category bars with a single total comparison:

Show: Team A total vs Team B total, with a clear W/L/D indicator. Optionally keep per-category breakdown below as a collapsible "Score breakdown" section.

- [ ] **Step 4: WeekMatchups — total scores on cards**

Read `src/pages/league/WeekMatchups.jsx`. Each matchup card currently shows 3 category win/loss indicators. Replace with total scores:

```
Team A: 45 RP  vs  Team B: 32 RP  →  W
```

- [ ] **Step 5: LeagueLeaderboard — total column**

Read `src/components/league/LeagueLeaderboard.jsx`. Replace category columns with single total RP column + W/D/L record.

- [ ] **Step 6: WeeklyRecapCard — total recap**

Read `src/components/WeeklyRecapCard.jsx`. Replace category-by-category recap with overall total + W/L result.

- [ ] **Step 7: Verify build**

Run: `npm run build`

- [ ] **Step 8: Manual test**

- `/7-day-challenge` header shows single total RP (not 3 pills)
- `/league/week` shows total scores per matchup
- `/league/matchup` shows total comparison
- `/league` overview shows totals

- [ ] **Step 9: Commit**

```bash
git add src/components/ChallengeHeader.jsx src/hooks/useMatchupData.js src/pages/league/MatchupDetails.jsx src/pages/league/WeekMatchups.jsx src/components/league/LeagueLeaderboard.jsx src/components/WeeklyRecapCard.jsx
git commit -m "feat: League UI — single total RP score, category pills removed"
```
