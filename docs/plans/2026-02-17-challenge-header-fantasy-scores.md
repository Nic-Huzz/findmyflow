# Challenge Header Redesign — Fantasy Score Structure

**Date**: 2026-02-17
**Status**: Approved mockup, ready to implement
**Mockup**: `preview-challenge-header.html`

---

## Design Decision

**Option A — Mini Progress Bars** with green/red W/L coloring.

- 5 horizontal bars in a 2x2+1 grid (Bonus centered on last row)
- Bar fill + score value colored **green (#10b981)** when winning that category, **red (#ef4444)** when losing
- Falls back to **category colors** when user has no active league matchup
- Team matchup banner replaces the old rank display
- Streak kept as-is

### Layout (top to bottom)

```
┌─────────────────────────────────┐
│      Gamify Your Ambitions      │
│                                 │
│  Your Team  [3-2]  vs  Rivals   │  ← team matchup banner (or hidden)
│                                 │
│          127 total pts          │  ← weekly total
│                                 │
│  ┌─────────────────────────┐    │
│  │ 💼 ▓▓▓▓▓▓▓░░ 38  🎮 ▓▓▓░░ 25 │  ← 2-col bar grid
│  │ 💚 ▓▓▓▓▓░░░ 30  🎭 ▓▓░░░░ 20 │
│  │       ⭐ ▓▓░░░░░ 14        │  ← centered last row
│  └─────────────────────────┘    │
│                                 │
│  🔥5  🏆Leaderboard  ⚙️  🔥PUSH │  ← streak + actions
└─────────────────────────────────┘
```

### Color Rules

| State | Bar fill | Score text |
|-------|----------|------------|
| Winning category | `#10b981` (emerald) | `#34d399` |
| Losing category | `#ef4444` (red) | `#f87171` |
| No matchup / no league | Category's own color from `FANTASY_CATEGORIES` | Lighter variant of category color |

### Bar Width Scaling

Two modes depending on context:

- **Matchup mode** (green/red): `myScore / (myScore + oppScore) * 100` per category. This shows how you're doing *relative to opponent* — 50% means tied, >50% means winning. If both are 0, show 50% (neutral).
- **Solo mode** (category colors): `score / maxCategoryScore * 100` where max is the highest of the 5 scores. Shows relative effort across categories.

---

## Existing Infrastructure (no new DB work needed)

All scoring and matchup data is already built:

| What | Where | Key function |
|------|-------|-------------|
| Category definitions | `src/lib/league/leagueConfig.js` | `FANTASY_CATEGORIES` |
| User category scores | `src/lib/league/leagueScoring.js:24` | `calculateUserCategoryScores(userId, start, end)` |
| Team scores | `src/lib/league/leagueScoring.js:75` | `calculateTeamScores(memberIds, start, end)` |
| Matchup comparison | `src/lib/league/leagueScoring.js:106` | `calculateMatchupResult(teamA, teamB)` |
| League state hook | `src/hooks/useLeagueData.js` | `useLeagueData()` — returns `league`, `userTeam`, `teams`, `getCurrentWeek`, `getWeekMatchups`, `getWeekDateRange`, `fetchLiveTeamScores` |
| Challenge data flow | `src/Challenge.jsx:163-166` | Already imports `useLeagueData` |
| Header component | `src/components/ChallengeHeader.jsx` | Current props on lines 22-38 |

---

## Implementation Plan

### Step 1 — New hook: `useMatchupData`

**New file**: `src/hooks/useMatchupData.js`

Extracts all matchup logic out of Challenge.jsx (which is already huge) into a focused hook.

```javascript
useMatchupData({ userId, completions, userTeam, league, teams, getCurrentWeek, getWeekMatchups, getWeekDateRange, fetchLiveTeamScores })
```

**Returns**:
```javascript
{
  // Instantly available (derived from in-memory completions)
  categoryScores,      // { business_efficiency: 38, play_list: 25, ... }

  // Available after async fetch (null while loading)
  matchupData,         // { opponentName, myWins, oppWins, categories: [...] } | null
  matchupLoading,      // boolean

  // Refresh trigger
  refreshMatchup,      // () => void — call after quest completion
}
```

**Two-phase rendering strategy**:

1. **Immediate** (no extra queries): Derive user's own category scores from `completions` already in `useChallengeData` memory. Map each completion's `quest_category` through `FANTASY_CATEGORIES.dbFilter` to bucket into the 5 categories. Header renders instantly with category-colored bars.

2. **Async upgrade** (1 extra query): Fetch opponent team scores via `fetchLiveTeamScores`. Compare per-category. Once loaded, bars flip to green/red. Only the opponent fetch is async — we already have our own scores.

**Computing category scores from in-memory completions** (no DB query):
```javascript
const categoryScores = useMemo(() => {
  const weekStart = getWeekStart(completions) // reuse existing helper
  const weekCompletions = completions.filter(c => new Date(c.completed_at) >= weekStart)
  const scores = {}
  const businessQuestIds = new Set()

  for (const cat of Object.values(FANTASY_CATEGORIES)) {
    scores[cat.key] = 0
  }

  weekCompletions.forEach(c => {
    const catEntry = Object.values(FANTASY_CATEGORIES).find(f =>
      f.dbFilter.includes(c.quest_category)
    )
    if (!catEntry) return
    if (catEntry.scoringType === 'efficiency') {
      businessQuestIds.add(c.quest_id)
    }
    scores[catEntry.key] += (c.points_earned || 0)
  })

  // Apply efficiency scoring for business
  if (businessQuestIds.size > 0) {
    scores.business_efficiency = Math.round(scores.business_efficiency / businessQuestIds.size)
  }
  return scores
}, [completions])
```

**Fetching opponent scores** (single async query):
```javascript
useEffect(() => {
  if (!userTeam || !league || league.status !== 'active') return

  const weekNum = getCurrentWeek()
  const matchup = getWeekMatchups(weekNum)
    .find(m => m.team_a_id === userTeam.id || m.team_b_id === userTeam.id)
  if (!matchup) return

  const oppTeamId = matchup.team_a_id === userTeam.id
    ? matchup.team_b_id : matchup.team_a_id
  const oppTeam = teams.find(t => t.id === oppTeamId)
  if (!oppTeam) return

  const oppMemberIds = (oppTeam.fantasy_team_members || []).map(m => m.user_id)

  setMatchupLoading(true)
  fetchLiveTeamScores(oppMemberIds, weekNum).then(oppScores => {
    const categories = CATEGORY_KEYS.map(key => {
      const my = categoryScores[key] || 0
      const opp = oppScores[key] || 0
      return {
        key,
        label: FANTASY_CATEGORIES[key].label,
        icon: FANTASY_CATEGORIES[key].icon,
        color: FANTASY_CATEGORIES[key].color,
        score: my,
        oppScore: opp,
        winning: my > opp,
      }
    })
    const myWins = categories.filter(c => c.winning).length
    const oppWins = categories.filter(c => c.oppScore > c.score).length

    setMatchupData({
      opponentName: oppTeam.name,
      myWins,
      oppWins,
      categories,
    })
    setMatchupLoading(false)
  })
}, [userTeam, league, teams, categoryScores, getCurrentWeek])
```

### Step 2 — Wire into Challenge.jsx

**File**: `src/Challenge.jsx`

Minimal changes — just call the new hook and pass results down:

```javascript
const { categoryScores, matchupData, matchupLoading, refreshMatchup } = useMatchupData({
  userId: user?.id,
  completions,
  userTeam, league, teams,
  getCurrentWeek, getWeekMatchups, getWeekDateRange, fetchLiveTeamScores
})
```

New props to ChallengeHeader:
- `matchupData` (object | null)
- `categoryScores` (object)
- `matchupLoading` (boolean)

Remove: `userRank` prop (replaced by matchup banner).

Call `refreshMatchup()` wherever quest completion already triggers data reload.

### Step 3 — Update ChallengeHeader.jsx

**File**: `src/components/ChallengeHeader.jsx`

Replace the hero stats section (`challenge-hero-stats`) with:

1. **Team matchup banner** (conditional on `matchupData !== null`):
   - Shows team name, score pill (myWins-oppWins with green/red), "vs", opponent name
   - Clickable → navigates to `/league`

2. **Total points row** (keep `weeklyPoints`):
   - Large number + "total pts" / "weekly pts" label

3. **Category bars grid** (new):
   - 2-column CSS grid, last item (Bonus) centered
   - Each bar: icon → track with fill → score value
   - If `matchupData`: green/red coloring, width = `myScore / (myScore + oppScore) * 100`
   - If no matchup: category colors, width = `score / max(scores) * 100`
   - If `matchupLoading`: show pulse skeleton on bars (category-colored bars visible underneath)

4. **Bottom row** (unchanged): streak + leaderboard + settings + week type

### Step 4 — Add CSS

**File**: `src/Challenge.css`

New classes (directly from the approved mockup):
- `.challenge-matchup-banner` — flexbox row, glass morphism (`rgba(255,255,255,0.12)` + backdrop-filter)
- `.challenge-bars-grid` — 2-col grid, dark bg (`rgba(0,0,0,0.15)`), rounded
- `.challenge-bar-item`, `.challenge-bar-icon`, `.challenge-bar-track`, `.challenge-bar-fill`, `.challenge-bar-value`
- `.challenge-bar-fill.win`, `.challenge-bar-fill.lose` — green/red
- `.challenge-bar-value.win`, `.challenge-bar-value.lose` — green/red text
- `.challenge-bar-fill.cat-business`, etc. — category color fallbacks

Prefix all with `challenge-` to scope properly per project CSS conventions.

Remove: `.hero-rank`, `.hero-rank-trophy`, `.hero-rank-number`, `.hero-divider` (no longer used).

### Step 5 — Edge cases

| Scenario | Matchup banner | Bars | Bar colors |
|----------|---------------|------|------------|
| No league at all | Hidden | Show from `categoryScores` | Category colors |
| League exists, not on a team | Hidden | Show from `categoryScores` | Category colors |
| On team, bye week (no matchup) | Hidden | Show from `categoryScores` | Category colors |
| On team, active matchup, opponent loading | Hidden until loaded | Show from `categoryScores` | Category colors → green/red on load |
| On team, active matchup, loaded | Visible | Show from `matchupData.categories` | Green/red |
| All scores 0, no matchup | Hidden | Empty bars (0% width) | Category colors |
| All scores 0, active matchup | Visible (0-0 or similar) | 50% width bars (tied) | Green/red (all neutral) |
| Tied in a category (my == opp) | — | 50% width, green color | Winning includes ties? **No** — tied = category color (neutral). Only strictly greater = green. |

### Step 6 — Refresh strategy

Scores refresh when:
- **Quest completed**: `refreshMatchup()` called alongside existing `useChallengeData` reload. Category scores update instantly (derived from completions), opponent scores refetch async.
- **Tab visibility**: Add `visibilitychange` listener in `useMatchupData` — refetch opponent scores when tab becomes visible after being hidden >60s.
- **No polling**: Don't poll on interval — wasteful. The two triggers above are sufficient.

---

## Files Summary

| File | Action | What changes |
|------|--------|-------------|
| `src/hooks/useMatchupData.js` | **CREATE** | New hook — category score derivation + opponent fetch + comparison |
| `src/Challenge.jsx` | MODIFY | Call `useMatchupData`, pass 3 new props to header, call `refreshMatchup` on quest complete |
| `src/components/ChallengeHeader.jsx` | MODIFY | Replace hero-stats with matchup banner + bar grid, accept new props |
| `src/Challenge.css` | MODIFY | Add bar/matchup classes, remove old rank classes |

## Files NOT modified

- `leagueConfig.js`, `leagueScoring.js`, `useLeagueData.js` — used as-is
- No database migrations
- No new packages
