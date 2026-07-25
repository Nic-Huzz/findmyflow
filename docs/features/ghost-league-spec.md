# Ghost Self League — Scope + Implementation Plan

> Replace PvP Fantasy League with solo "Ghost Self" competition. Users race their own performance from the previous week, day by day. Like a ghost car in Mario Kart.

## Why This Change

| Problem with PvP | How Ghost Solves It |
|---|---|
| Needs minimum players + admin to create matchups | Works solo from day 1, zero admin |
| Opponent doesn't show up = boring week | Ghost always shows up (it's your data) |
| Cheating/fake completions hurt opponents | Cheating only raises YOUR ghost next week |
| Social dependency (CD5) was the bottleneck | Removes the dependency entirely |
| Complex DB (5 tables, triggers, RLS, cron) | 2 tables, lazy init, no cron needed |

## Octalysis Core Drive Analysis

| Core Drive | Impact | Why |
|---|---|---|
| CD1 (Epic Meaning) | Stronger | "Become better than you were" aligns with Vibe Rise's growth philosophy |
| CD2 (Accomplishment) | Stronger | Wins are always attributable to YOUR effort, not opponent weakness |
| CD3 (Empowerment) | Neutral | Strategy shifts to "which categories did I underperform last week?" |
| CD4 (Ownership) | Stronger | The ghost IS your data. Streaks and PBs are personal achievements |
| CD5 (Social) | Weaker but unblocked | PvP excitement lost, but no longer blocked by empty leagues. Mitigate with opt-in streak sharing |
| CD6 (Scarcity) | Stronger | "Only 2 days left to catch up" creates natural daily urgency |
| CD7 (Unpredictability) | Stronger | Ghost scores for future days are hidden until that day arrives. "What did I score by Wednesday?" is a genuine daily reveal |
| CD8 (Avoidance) | Carefully neutral | Ghost decay prevents unbeatable spirals. Losing to past-self = motivation, not shame |

## Core Mechanics

1. **Ghost scoring**: Each day, ghost score = what you had scored by that same day last week (cumulative)
2. **Three categories**: Tune, Courage, Community (same as existing `FANTASY_CATEGORIES`)
3. **Daily granularity**: Mon-Sun comparison, current day highlighted. Future days' ghost scores are hidden (locked) until that day arrives, creating a daily reveal
4. **Win condition**: Beat your ghost in 2 of 3 categories. Ties (both scores equal, including both-zero) count as neither a win nor a loss for that category. Draw = 1 user win, 1 ghost win, 1 tie
5. **Week 1 bootstrap**: Ghost = 0 (easy first win to build momentum)
6. **Streak tracking**: Consecutive weeks of beating your ghost
7. **Personal bests**: Highest weekly score ever per category, updated unconditionally on week finalization (not only on wins)
8. **Perpetual**: No seasons. Every week is a fresh matchup. Streaks provide long-term progression
9. **Ghost presence**: ChallengeHeader shows a live delta mid-week ("You're 14 points ahead of last week's you") so the ghost feels alive outside `/league`

## Architecture: Client-Side Compute

The ghost is a **single-user** feature. All data comes from one user's `quest_completions`, which Challenge.jsx already has in memory via the `completions` prop. There is no opponent to fetch.

**Design principle**: Compute live scores entirely client-side. Store only finalized week results server-side. No cron job. No JSONB update loop. No two-phase merge complexity.

### How It Works

1. **`useGhostMatchup` hook** receives the same `completions` prop that `useMatchupData` uses today. Important: `completions` contains ALL historical quest_completions (no date filter in useChallengeData) — the hook MUST filter by week using `getWeekStartLocal()`
2. On mount, it fetches the user's `ghost_weekly_results` row for this week + `ghost_content_submissions` for this week (two DB reads, parallelized)
3. The ghost's daily scores for last week are stored in that row as JSONB
4. The hook computes THIS week's Tune + Courage from in-memory `completions` using the same `FANTASY_CATEGORIES` mapping. Community comes from the `ghost_content_submissions` query
5. **Last week's ghost is computed client-side on first visit**: filter `completions` by last week's date range + query last week's `ghost_content_submissions`. No backfill migration needed — users see their real ghost immediately
6. It compares current vs ghost through today's day-of-week to produce live category W/L
7. **Week finalization**: On first visit after the week ends, the hook calls `finalize-ghost-week` edge function once. This writes the result, updates streaks, and seeds next week's ghost. Lazy, not cron

### Why Not Cron

| Cron Approach | Client-Side Approach |
|---|---|
| New edge function + pg_cron schedule | No cron, no scheduled jobs |
| JSONB updated every 15 min for every user | Scores computed from `completions` already in memory |
| Two-phase merge (in-memory today + DB past days) | Single source: `completions` prop |
| Grace period logic for week boundary | Lazy finalization on next visit |
| Timezone conversion on server | `getWeekStartLocal()` already handles this client-side |
| Processes users who haven't opened the app | Only runs when user is active |

## Data Model

### New Tables (3, replacing 5+)

```sql
-- One row per user per week (created lazily on first visit)
CREATE TABLE ghost_weekly_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  week_start DATE NOT NULL,  -- Monday (ISO week, from getWeekStartLocal)

  -- Ghost = previous week's finalized daily scores (may be decayed)
  -- Keys are ISO dates. Values are cumulative {tune, courage, community} through that day
  ghost_daily_scores JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- User's actual daily scores for THIS week (un-decayed truth, written at finalization)
  -- Used for History tab display. Never modified after write.
  user_daily_scores JSONB DEFAULT '{}'::jsonb,

  -- Final totals (set by finalize-ghost-week edge function)
  current_tune INT DEFAULT 0,
  current_courage INT DEFAULT 0,
  current_community INT DEFAULT 0,
  ghost_tune INT DEFAULT 0,
  ghost_courage INT DEFAULT 0,
  ghost_community INT DEFAULT 0,

  -- Result
  categories_won INT DEFAULT 0,
  categories_lost INT DEFAULT 0,
  result TEXT NOT NULL DEFAULT 'pending'
    CHECK (result IN ('pending', 'win', 'loss', 'draw')),

  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE ghost_weekly_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ghost_results_select" ON ghost_weekly_results
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ghost_results_insert" ON ghost_weekly_results
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Streak + personal bests (one row per user, upserted)
CREATE TABLE ghost_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  consecutive_losses INT NOT NULL DEFAULT 0,
  total_wins INT NOT NULL DEFAULT 0,
  total_losses INT NOT NULL DEFAULT 0,
  total_draws INT NOT NULL DEFAULT 0,
  last_result TEXT,
  last_result_at DATE,
  pb_tune INT DEFAULT 0,
  pb_courage INT DEFAULT 0,
  pb_community INT DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE ghost_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ghost_streaks_select" ON ghost_streaks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ghost_streaks_insert" ON ghost_streaks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Community content submissions (decoupled from league infrastructure)
-- The old league_content_submissions table has NOT NULL FKs to fantasy_leagues
-- and fantasy_teams, making it unusable without an active league. This table
-- stores the same data without league dependencies.
-- If reverting to PvP leagues, keep this table — content submitted here can
-- be queried alongside league_content_submissions by unioning on user_id + week.
CREATE TABLE ghost_content_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  week_start DATE NOT NULL,           -- Monday (ISO week, matches ghost_weekly_results)
  content_type TEXT NOT NULL,          -- key from CONTENT_POINT_VALUES (auto-approve types only)
  points_value INT NOT NULL DEFAULT 0, -- copied from CONTENT_POINT_VALUES at submission time
  link_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ghost_content_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ghost_content_select" ON ghost_content_submissions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ghost_content_insert" ON ghost_content_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
```

### Why a New Table for Community (not altering `league_content_submissions`)

The old `league_content_submissions` has `league_id`, `team_id`, `week_number` as NOT NULL with FK constraints to `fantasy_leagues` and `fantasy_teams`. Making those nullable would risk breaking old code paths if we ever revert to PvP leagues. A separate `ghost_content_submissions` table:
- Works without any league/team infrastructure
- Preserves the old table untouched for potential PvP revert
- Uses `week_start DATE` (matching `ghost_weekly_results`) instead of `week_number INT` (which was relative to a league's start date)
- Only allows auto-approve content types (no admin review workflow)

### Daily Scores JSONB Structure

Keys are **ISO dates** (not weekday names), avoiding timezone ambiguity. Values are cumulative scores from start of week through that day:

```json
{
  "2026-07-20": {"tune": 12, "courage": 0, "community": 0},
  "2026-07-21": {"tune": 24, "courage": 7, "community": 2},
  "2026-07-22": {"tune": 36, "courage": 14, "community": 6},
  "2026-07-23": {"tune": 48, "courage": 14, "community": 6},
  "2026-07-24": {"tune": 60, "courage": 21, "community": 10},
  "2026-07-25": {"tune": 60, "courage": 28, "community": 10},
  "2026-07-26": {"tune": 72, "courage": 35, "community": 14}
}
```

The UI maps ISO dates to Mon-Sun display labels using `week_start`. Ghost scores for future days in the current week are **hidden in the UI** (greyed out / locked) to create the daily reveal mechanic.

### Tables to Deprecate (not drop)

`fantasy_leagues`, `fantasy_teams`, `fantasy_team_members`, `fantasy_matchups`, `league_content_submissions`, `league_content_reactions` — keep for historical data, remove RLS policies, triggers, and cron job.

## Scoring Algorithm

### Categories (unchanged from existing `FANTASY_CATEGORIES`)

- **Tune**: `quest_category = 'Tune'` — daily practices. Raw points from `quest_completions.points_earned`
- **Courage**: `quest_category IN ('Groans', 'Healing', 'Daily', 'Weekly')` — wahoos + healing. Raw points summed
- **Community**: Content submissions stored in `ghost_content_submissions` (new table, no league/team deps). Auto-approved types only, scored instantly. Same `CONTENT_POINT_VALUES` from `leagueConfig.js`. Hook sums `points_value` where `week_start` matches current week

### Client-Side Scoring Flow

`useGhostMatchup` hook (replaces `useMatchupData`):

```
1. On mount: fetch ghost_weekly_results for current week_start
   - If no row exists → lazy-create with ghost = previous week's scores (or zeros for week 1)
   - If previous week's row has result = 'pending' → call finalize-ghost-week first

2. Every render: compute THIS week's scores from completions prop
   - Same FANTASY_CATEGORIES mapping as existing useMatchupData Phase 1
   - Group by day (using completed_at in local time) to build daily cumulative totals
   - Community: sum auto-approved content submissions for current week

3. Compare: current daily scores vs ghost daily scores through today's date
   - Per-category: user total > ghost total through today = winning
   - 2-of-3 categories = overall winning/losing

4. Expose: { ghostRow, currentScores, ghostScores, dayComparison, categoryWins, streak, pbs }
```

### Week Finalization (lazy, not cron)

`finalize-ghost-week` edge function — called once, on first visit after week ends:

1. Query `quest_completions` (Tune + Courage) + `ghost_content_submissions` (Community) for the finalized week to build authoritative daily scores
2. Write `user_daily_scores` JSONB on the week's row (un-decayed truth, for History tab)
3. Compare final totals in each category: 2-of-3 wins
4. Set `result`, `categories_won`, `categories_lost`, `finalized_at` on the week's row
5. Update `ghost_streaks`: streak count, consecutive_losses, W/D/L, personal bests (unconditionally)
6. Create next week's `ghost_weekly_results` row with THIS week's daily scores as the ghost (applying decay if needed based on `consecutive_losses`)
7. Return the result to the client

Why edge function instead of client-side write? Because finalization needs `SECURITY DEFINER` to upsert `ghost_streaks` atomically and prevent double-finalization race conditions.

### Ghost Decay (Burnout Protection)

Prevents an exceptional week from making the ghost unbeatable. Uses `ghost_streaks.consecutive_losses` (reset to 0 on any win or draw, incremented on loss):

| Consecutive Losses | Ghost Reduction |
|---|---|
| 1 | 25% off all ghost scores |
| 2 | 50% off all ghost scores |
| 3+ | Full reset to zero |

### Draw Rules

- Per-category: user score > ghost = user wins category. user < ghost = ghost wins. Equal (including both 0) = tie
- Match result: 2+ category wins = win. 2+ category losses = loss. 1 win + 1 loss + 1 tie = draw. 3 ties = draw

## UI Screens

### `/league` — Ghost Dashboard (rewrite LeagueOverview)

- **Hero card**: User avatar vs translucent ghost avatar, "You vs Last Week's You"
- **Day-by-day timeline**: 7 dots (Mon-Sun), current day highlighted, green (ahead) / red (behind)
- **Category bars**: Three bars showing You vs Ghost cumulative scores through today
- **Streak badge**: Current win streak prominently displayed
- **Tabs**: History (past weeks) / Stats (PBs, W/D/L record) / Guide

### `/league/matchup` — Daily Breakdown (rewrite MatchupDetails)

- **Scoreboard**: "You: 2 | Ghost: 1" (live category wins)
- **Day-by-day table**: 7 rows, each showing your score vs ghost for that day, with cumulative totals. Future days greyed out. Per-category coloring
- **Category expansion**: Tap category to see which quests/completions contributed

### `/league/guide` — Ghost Guide (rewrite LeagueGuide)

5 slides: Welcome to Ghost Mode → How You Score → Your Ghost → Beat Your Ghost → Streaks & Records

### Keep (simplified)

- `/league/submit` (ContentSubmit) — rewrite to insert into `ghost_content_submissions` instead of `league_content_submissions`. Filter to auto-approve content types only. No league/team/admin dependencies. Community points earned here, same UX as before

### Remove Entirely

- `/league/week` (WeekMatchups) — no spectator matches
- `/league/admin` (LeagueAdmin) — zero admin
- `/fantasy` (FantasyLeagueLanding) — no signup funnel needed

### Update

- `ChallengeHeader.jsx` — opponent name → "Ghost". Show live delta mid-week: "You're 14 points ahead of last week's you" or "Ghost leads by 8". Makes ghost feel alive outside `/league`
- `WeeklyRecapCard.jsx` — "You beat your Ghost 2-1" language + streak count

## Implementation Sprints

### Sprint 1: Data + Ghost Hook (working ghost alongside existing league) — 3 days

**Goal**: Ghost system works end-to-end, feature-flagged, existing league untouched.

- Migration: `ghost_weekly_results` + `ghost_streaks` + `ghost_content_submissions` tables (with RLS)
- `ghostConfig.js`: reuse `FANTASY_CATEGORIES` + `CATEGORY_KEYS` from existing `leagueConfig.js`. Add ghost-specific constants (decay rates, PB tracking)
- `ghostScoring.js`: `buildDailyScores(completions, weekStart)` (pure function, groups completions by day + category), `compareCategories(currentTotals, ghostTotals)`, `applyDecay(ghostScores, consecutiveLosses)`
- `ghostService.js`: `getOrCreateCurrentWeek(userId, weekStart)` (lazy init), `getWeekHistory(userId, limit)`, `getGhostStreak(userId)`
- Edge function `finalize-ghost-week`: single-use finalization (query completions, write result, seed next week's ghost, update streaks). Called lazily, not by cron
- `useGhostMatchup.js`: receives `completions` prop, computes live scores, fetches ghost row, returns comparison data. Self-contained — does not depend on any league infrastructure
- Feature flag in Challenge.jsx: `const USE_GHOST = true`. When true, render ghost ChallengeHeader instead of league header. When false, existing league works as before

**End state**: Ghost header visible on challenge page (feature-flagged). League pages still work. No broken intermediate state.

### Sprint 2: Ghost UI Pages — 3 days

**Goal**: `/league` routes show ghost UI.

- Rewrite `LeagueOverview.jsx` as Ghost Dashboard (hero card, day timeline, category bars, streak, history/stats/guide tabs)
- Rewrite `MatchupDetails.jsx` for ghost day-by-day comparison
- Rewrite `LeagueGuide.jsx` with ghost-themed slides
- Update `WeeklyRecapCard.jsx` for ghost language
- Route `/league` conditionally renders ghost or PvP based on feature flag

**End state**: Full ghost UI on `/league`. Feature flag controls which system is active. Can demo both.

### Sprint 3: Cleanup + Ship — 2 days

**Goal**: Remove feature flag. Remove dead code.

- Remove feature flag, ghost is the default
- Remove dead routes: `/league/week`, `/league/admin`, `/fantasy`
- Remove dead files: `WeekMatchups.jsx`, `LeagueAdmin.jsx`, `FantasyLeagueLanding.jsx`, `NewsfeedPage.jsx`, `LeagueLeaderboard.jsx`
- Rewrite `ContentSubmit.jsx`: insert into `ghost_content_submissions` instead of `league_content_submissions`, auto-approve types only
- Remove old hooks: `useLeagueData.js`, `useMatchupData.js`
- Remove old services: `leagueService.js`, `leagueScoring.js`
- Deprecate old DB: remove cron job (`SELECT cron.unschedule('score-league-matchups-every-15min')`), remove RLS policies + triggers on old tables. Do NOT drop tables
- Remove league references from `PlayListTab.jsx`, `QuestCard.jsx`, `BottomToolbar.jsx`
- Update `Challenge.jsx` to use `useGhostMatchup` directly (no flag)

### Sprint 4 (Optional): Polish — 2 days

- Ghost avatar animation (translucent version of user's essence avatar)
- Streak milestone celebrations (via existing `useCelebrations`)
- PB notifications via Zarlo
- Share buttons for win streaks ("I've beaten my Ghost 5 weeks in a row")

## Edge Cases

| Case | Handling |
|---|---|
| **Week 1** | Ghost = all zeros. Easy win to build momentum |
| **Missed days** | Ghost leads on those days. Correct behavior — accountability |
| **Very high ghost** | Decay: 25% after 1 loss, 50% after 2, reset after 3 |
| **User returns after gap** | If last result >7 days old, ghost = zero (fresh start) |
| **Timezones** | `getWeekStartLocal()` (existing) handles week boundaries client-side. ISO date keys in JSONB avoid weekday-name ambiguity. Edge function receives `weekStart` from client |
| **Week-end finalization** | Lazy on next visit, not cron. If user doesn't visit for 2 weeks, finalize-ghost-week handles the gap (finalizes old week, creates new week with ghost=0) |
| **All 3 categories tied (0-0)** | Draw. Ghost wins nothing, user wins nothing |
| **Double finalization** | Edge function checks `result != 'pending'` and returns early. Atomic upsert on ghost_streaks |
| **Community without social** | Auto-approve content types only. If no community activity, category stays at 0 for both user and ghost (tie). Doesn't break the system — other 2 categories decide |

## Key Files

| File | Action |
|---|---|
| **New** | |
| `src/lib/ghost/ghostConfig.js` | Ghost constants, reuses FANTASY_CATEGORIES |
| `src/lib/ghost/ghostScoring.js` | Pure functions: buildDailyScores, compareCategories, applyDecay |
| `src/lib/ghost/ghostService.js` | DB operations: getOrCreateCurrentWeek, getWeekHistory, getGhostStreak |
| `src/hooks/useGhostMatchup.js` | Main hook: completions → live ghost comparison |
| `supabase/functions/finalize-ghost-week/index.ts` | One-shot week finalization |
| **Rewrite** | |
| `src/pages/league/LeagueOverview.jsx` (920 lines) | Ghost Dashboard |
| `src/pages/league/MatchupDetails.jsx` | Ghost day-by-day comparison |
| `src/flows/LeagueGuide.jsx` | Ghost-themed slides |
| **Update** | |
| `src/components/ChallengeHeader.jsx` | Ghost delta display |
| `src/components/WeeklyRecapCard.jsx` | Ghost result language |
| `src/Challenge.jsx` | Swap useLeagueData/useMatchupData → useGhostMatchup |
| **Remove (Sprint 3)** | |
| `src/pages/league/WeekMatchups.jsx` | Dead |
| `src/pages/league/LeagueAdmin.jsx` | Dead |
| `src/pages/league/ContentSubmit.jsx` | Rewrite: insert into `ghost_content_submissions`, auto-approve only |
| `src/pages/FantasyLeagueLanding.jsx` | Dead |
| `src/hooks/useLeagueData.js` | Replaced by useGhostMatchup |
| `src/hooks/useMatchupData.js` | Replaced by useGhostMatchup |
| `src/lib/league/leagueService.js` | Replaced by ghostService |
| `src/lib/league/leagueScoring.js` | Replaced by ghostScoring |
| `supabase/functions/score-league-matchups/` | Replaced by finalize-ghost-week |
