# Fantasy League Enhancements — Design Doc

**Date**: 2026-02-17
**Status**: Approved

---

## Overview

Five features that make the fantasy league scoring system feel alive, social, and addictive:

1. **Animated score updates** — bars slide, numbers count up on quest completion
2. **W/L flip celebrations** — haptic + confetti when you overtake an opponent in a category
3. **Matchup details page** — `/league/matchup` with head-to-head comparison, history, rosters
4. **Game day notifications** — push notification when opponent activity flips a category W/L
5. **Weekly recap** — Monday morning push + in-app card summarizing last week + this week's opponent

---

## Feature 1: Animated Score Updates

### How it works

`useMatchupData` already returns `categoryScores` and `matchupData`. When these change (quest completion → completions reload → useMemo recomputes), we diff against previous values.

### New hook: `useScoreAnimation`

Wraps raw scores and exposes `animatedScores`. Each value transitions from old to new over 600ms using requestAnimationFrame incrementing.

Bar fills already have `transition: width 0.6s ease` in CSS — they slide automatically. The hook makes the *number* count up in sync.

### Integration

```
ChallengeHeader receives categoryScores → useScoreAnimation wraps them → renders animatedScores
```

No changes to data layer. Pure presentation hook.

---

## Feature 2: W/L Flip Celebrations

### Detection

In `useMatchupData`, track the previous `matchupData.categories[n].winning` state via a ref. After each opponent fetch resolves, compare old vs new per category.

### Responses

| Event | Visual | Haptic | Toast |
|-------|--------|--------|-------|
| **Win flip** (was losing/tied → now winning) | `triggerSideCannons()` | `hapticSuccess()` | "You overtook [opponent] in [Category]!" |
| **Loss flip** (was winning → now losing) | Red flash on bar | `hapticError()` | None (don't rub it in) |
| **First render** (no previous data) | None | None | None |

### Existing infrastructure used

- `triggerSideCannons()` from `src/components/Celebrations/`
- `hapticSuccess()` / `hapticError()` from `src/lib/haptics.js`
- `MicroToast` from `src/components/Celebrations/`

---

## Feature 3: Matchup Details Page

### Route

`/league/matchup` — new page component.

### Navigation

- Challenge header matchup banner taps → `/league/matchup` (currently goes to `/league`)
- `/league` page gets a "View Matchup" card linking to `/league/matchup`
- Back button returns to previous page

### Layout

```
┌─────────────────────────────────┐
│  ← Back to Challenge            │
│                                 │
│  Your Team          Flow Warriors│
│     3        vs        2        │
│  ┌──────────────────────────┐   │
│  │ 💼  38 ▓▓▓▓▓▓░░░ 25     │   │
│  │ 🎮  25 ▓▓▓░░░░░░ 40     │   │
│  │ 💚  30 ▓▓▓▓▓░░░░ 22     │   │
│  │ 🎭  20 ▓▓░░░░░░░ 35     │   │
│  │ ⭐  14 ▓▓▓▓░░░░░ 10     │   │
│  └──────────────────────────┘   │
│                                 │
│  ── Head-to-Head History ──     │
│  Week 3: W 4-1 vs Flow Warriors│
│  Week 1: L 2-3 vs Flow Warriors│
│                                 │
│  ── Team Rosters ──             │
│  Your Team        Flow Warriors │
│  • You (62 pts)   • Alex (55)  │
│  • Sam (45 pts)   • Jordan (42)│
│  • Pat (20 pts)   • Riley (35) │
└─────────────────────────────────┘
```

### Bars

Full-width bars (wider than header version). Your score on left, opponent on right. Bar fill shows ratio. Green/red/neutral coloring same rules as header.

### Head-to-head history

Reads past `fantasy_matchups` rows where these two teams faced each other. Shows W/L and category count per previous week.

### Team rosters

Each member's individual point contribution this week. From `fetchLiveTeamScores` which returns `.members`. Sorted by points descending.

### No matchup state

If user has no active matchup (no league, no team, bye week), redirect to `/league`.

### Data sources

All existing — `useMatchupData`, `useLeagueData`, `fantasy_matchups` table. No new DB queries beyond what's already built.

---

## Feature 4: Game Day Notifications

### Trigger

Client-side, on quest completion. When the completing user's `useMatchupData` W/L flip detection fires (same code as Feature 2's confetti), and the flip is a *win* for the completing user, we notify the opponent team.

### Flow

1. User completes quest → completions reload → `useMatchupData` recomputes
2. W/L flip detection compares old vs new `matchupData.categories[n].winning`
3. If any category flipped from losing/tied to winning:
   - Fire confetti + haptic locally (Feature 2)
   - Call `sendNotification()` for each opponent team member
4. Notification: **"🏆 [Your Team] just overtook you in [Category]! You're now trailing 2-3."**
5. Tap URL: `/league/matchup`

### No new Edge Function needed

Uses existing `sendNotification()` → `send-push-notification` Edge Function. The client does the send.

### Opt-in

New `matchup_alerts` boolean column on `notification_preferences` (default true). Respect this before sending.

### Rate limiting

Max 1 notification per opponent per 15 minutes. Track `lastNotifyTimestamp` in a ref within `useMatchupData`. If <15min since last send, skip.

### Migration

```sql
ALTER TABLE notification_preferences
ADD COLUMN matchup_alerts boolean DEFAULT true;
```

---

## Feature 5: Weekly Recap

### Push notification

New Edge Function `send-weekly-recap` runs Monday 8am per user's timezone (same scheduling pattern as `process-scheduled-newsletters`).

Reads previous week's `fantasy_matchups` row for user's team — `category_results` JSONB is already populated by `calculateWeekResults`.

**Content:**
> **"Last week: W 4-1 vs Flow Warriors 🎉"**
> "MVP: Business (62 pts). This week you face The Grounders."

Tap opens `/league/matchup`.

### In-app recap card

Dismissible card shown on the Challenge page on Monday, above quest list, below header.

```
┌─────────────────────────────────┐
│  📊 Week 3 Recap                │
│                                 │
│  You beat Flow Warriors 4-1     │
│  💼 38-25 ✅  🎮 25-40 ❌       │
│  💚 30-22 ✅  🎭 20-35 ❌       │
│  ⭐ 14-10 ✅                    │
│                                 │
│  Best category: 💼 Business     │
│  This week: vs The Grounders    │
│                                 │
│  [View Matchup]     [Dismiss ×] │
└─────────────────────────────────┘
```

### Data

All from `fantasy_matchups.category_results` (already written by `calculateWeekResults`). "This week's opponent" from `getWeekMatchups(currentWeek)`.

### Dismissal

`localStorage` key: `recap_dismissed_week_{N}`. Shows once per week until dismissed.

---

## New Files Summary

| File | Type | Purpose |
|------|------|---------|
| `src/hooks/useScoreAnimation.js` | Hook | Animated number counting for score values |
| `src/pages/league/MatchupDetails.jsx` | Page | `/league/matchup` head-to-head page |
| `src/pages/league/MatchupDetails.css` | Styles | Matchup page styling |
| `src/components/WeeklyRecapCard.jsx` | Component | Dismissible recap card for Challenge page |
| `supabase/functions/send-weekly-recap/index.ts` | Edge Function | Monday morning push notification |
| Migration: `matchup_alerts` column | SQL | Notification preference for game day alerts |

## Modified Files Summary

| File | What changes |
|------|-------------|
| `src/hooks/useMatchupData.js` | Add W/L flip detection via ref, fire celebrations + opponent notifications on flip |
| `src/components/ChallengeHeader.jsx` | Wire `useScoreAnimation` for animated numbers, change banner tap to `/league/matchup` |
| `src/Challenge.jsx` | Add `WeeklyRecapCard` below header, pass matchup data |
| `src/AppRouter.jsx` | Add `/league/matchup` route |
| `src/pages/league/LeagueOverview.jsx` | Add "View Matchup" card linking to `/league/matchup` |

## Files NOT Modified

- `leagueConfig.js`, `leagueScoring.js` — used as-is
- `haptics.js`, `Celebrations/` — used as-is, no changes
- `notifications.js` — used as-is
- `useChallengeData.js` — no changes needed
