# Fantasy League Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the fantasy league scoring feel alive with animated scores, celebrations on W/L flips, a dedicated matchup details page, game day push notifications, and a weekly recap.

**Architecture:** Five features layered on existing infrastructure — `useMatchupData` hook (scoring), `Celebrations/` (confetti/haptics), `notifications.js` (push), and `fantasy_matchups` table (history). New hook `useScoreAnimation` for animated numbers, new page `MatchupDetails` at `/league/matchup`, W/L flip detection added to `useMatchupData`, new Edge Function `send-weekly-recap` for Monday morning pushes.

**Tech Stack:** React 18, Supabase (Edge Functions, PostgreSQL), Web Push API, canvas-confetti, CSS transitions, requestAnimationFrame

**Design doc:** `docs/plans/2026-02-17-fantasy-league-enhancements-design.md`

---

## Task 1: Animated Score Numbers — `useScoreAnimation` Hook

**Files:**
- Create: `src/hooks/useScoreAnimation.js`

**Step 1: Create the hook**

This hook takes a scores object and returns animated values that count up/down over 600ms when the source changes. Uses requestAnimationFrame with ease-out cubic for smooth number counting.

```javascript
// src/hooks/useScoreAnimation.js
import { useState, useEffect, useRef } from 'react'

/**
 * useScoreAnimation — Animates number transitions over 600ms
 * when source scores change. Uses requestAnimationFrame for smooth counting.
 *
 * @param {Object} scores - { [key]: number } raw scores
 * @param {number} duration - animation duration in ms (default 600)
 * @returns {Object} { [key]: number } animated scores (same shape as input)
 */
export function useScoreAnimation(scores, duration = 600) {
  const [animated, setAnimated] = useState(scores || {})
  const prevRef = useRef(scores || {})
  const rafRef = useRef(null)

  useEffect(() => {
    if (!scores) return

    const prev = prevRef.current
    const keys = Object.keys(scores)

    // Check if anything actually changed
    const hasChange = keys.some(k => (prev[k] || 0) !== (scores[k] || 0))
    if (!hasChange) {
      prevRef.current = scores
      setAnimated(scores)
      return
    }

    const startTime = performance.now()
    const startValues = { ...prev }

    const tick = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)

      const frame = {}
      for (const key of keys) {
        const from = startValues[key] || 0
        const to = scores[key] || 0
        frame[key] = Math.round(from + (to - from) * eased)
      }
      setAnimated(frame)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    prevRef.current = scores

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [scores, duration])

  return animated
}
```

**Step 2: Verify build**

Run: `npm run build 2>&1 | tail -3`
Expected: `✓ built in ...`

**Step 3: Commit**

```
feat: add useScoreAnimation hook for animated number transitions
```

---

## Task 2: Wire Animated Scores into ChallengeHeader

**Files:**
- Modify: `src/components/ChallengeHeader.jsx`

**Step 1: Import and use the hook**

At the top of `ChallengeHeader.jsx`, add the import:

```javascript
import { useScoreAnimation } from '../hooks/useScoreAnimation'
```

Inside the component, before the `bars` computation, add:

```javascript
const animatedCategoryScores = useScoreAnimation(categoryScores)
const animatedWeeklyPoints = useScoreAnimation({ pts: weeklyPoints })
```

**Step 2: Animate displayed numbers (not bar widths)**

Bar widths should snap to correct position (CSS handles the transition). Only the *displayed number* should animate via the hook.

In the matchup mode block (~line 57-71), add `displayScore`:
```javascript
if (matchCat) {
  const total = matchCat.score + matchCat.oppScore
  const pct = total > 0 ? Math.round((matchCat.score / total) * 100) : 50
  const tied = matchCat.score === matchCat.oppScore
  const displayScore = animatedCategoryScores?.[key] ?? matchCat.score
  return {
    key,
    icon: cat.icon,
    score: displayScore,       // animated for display
    pct,                       // raw for bar width
    colorClass: tied ? '' : matchCat.winning ? 'win' : 'lose',
    colorStyle: tied ? cat.color : null,
    textColor: tied ? CATEGORY_TEXT_COLORS[key] : null,
  }
}
```

In the solo mode block (~line 73-87), split score vs displayScore:
```javascript
const score = categoryScores?.[key] || 0
const displayScore = animatedCategoryScores?.[key] || 0
// ...
return {
  key,
  icon: cat.icon,
  score: displayScore,       // animated for display
  pct: Math.round((score / maxScore) * 100),  // raw for bar width
  colorClass: `cat-${key}`,
  colorStyle: null,
  textColor: CATEGORY_TEXT_COLORS[key],
}
```

In the JSX total points row, change:
```jsx
<span className="challenge-total-value">{animatedWeeklyPoints.pts ?? weeklyPoints}</span>
```

**Step 3: Verify build**

Run: `npm run build 2>&1 | tail -3`
Expected: `✓ built in ...`

**Step 4: Commit**

```
feat: wire animated score counting into challenge header bars
```

---

## Task 3: W/L Flip Detection + Celebrations

**Files:**
- Modify: `src/hooks/useMatchupData.js`

**Step 1: Add flip detection**

Add imports at top:
```javascript
import { triggerSideCannons } from '../components/Celebrations'
import { hapticSuccess, hapticError } from '../lib/haptics'
```

Add refs after the existing refs (line ~25):
```javascript
const prevWinningRef = useRef(null) // { [categoryKey]: boolean }
```

**Step 2: Add flip detection + celebration logic after setMatchupData**

Inside `fetchOpponentData`, immediately after `setMatchupData({...})` (line ~117), add:

```javascript
      // ─── W/L flip detection ───
      if (prevWinningRef.current) {
        const flippedWin = []
        let lostFlip = false
        for (const cat of categories) {
          const wasWinning = prevWinningRef.current[cat.key]
          if (wasWinning === undefined) continue
          if (!wasWinning && cat.winning) flippedWin.push(cat)
          if (wasWinning && !cat.winning && cat.oppScore > cat.score) lostFlip = true
        }
        if (flippedWin.length > 0) {
          triggerSideCannons()
          hapticSuccess()
          setFlipEvent({
            type: 'win',
            categories: flippedWin.map(c => c.label),
            myWins,
            oppWins,
          })
        } else if (lostFlip) {
          hapticError()
          setFlipEvent({ type: 'loss' })
        }
      }
      prevWinningRef.current = Object.fromEntries(
        categories.map(c => [c.key, c.winning])
      )
```

**Step 3: Expose flip events (not UI state)**

The hook should return *events*, not toast strings. The consuming component decides how to render them.

Add state after existing useState calls:
```javascript
const [flipEvent, setFlipEvent] = useState(null)
```

Add to return:
```javascript
return {
  categoryScores,
  matchupData,
  matchupLoading,
  refreshMatchup: fetchOpponentData,
  flipEvent,
  clearFlipEvent: () => setFlipEvent(null),
}
```

**Step 4: Verify build**

Run: `npm run build 2>&1 | tail -3`
Expected: `✓ built in ...`

**Step 5: Commit**

```
feat: add W/L flip detection with confetti + haptic celebrations
```

---

## Task 4: Show Flip Toast in Challenge.jsx

**Files:**
- Modify: `src/Challenge.jsx`

**Step 1: Destructure flipEvent and render MicroToast**

Update the `useMatchupData` destructure:
```javascript
const { categoryScores, matchupData, matchupLoading, flipEvent, clearFlipEvent } = useMatchupData({
```

Add import for MicroToast (near other Celebrations imports):
```javascript
import { MicroToast } from './components/Celebrations'
```

**Step 2: Render the toast from the event**

After `<ChallengeHeader />` (around line 1464):
```jsx
      {/* W/L flip toast */}
      {flipEvent?.type === 'win' && (
        <MicroToast
          message={`You overtook them in ${flipEvent.categories.join(' & ')}!`}
          duration={3000}
          onComplete={clearFlipEvent}
        />
      )}
```

The component renders the string. The hook only provides the event data.

**Step 3: Verify build**

Run: `npm run build 2>&1 | tail -3`
Expected: `✓ built in ...`

**Step 4: Commit**

```
feat: show toast notification when category W/L flips
```

---

## Task 5: Matchup Details Page — Component + CSS

**Files:**
- Create: `src/pages/league/MatchupDetails.jsx`
- Create: `src/pages/league/MatchupDetails.css`

This task creates the component and styles only. Route + navigation wiring is Task 6.

**Step 1: Create the page component**

Key data flow: Uses `useChallengeData` for `completions`, `useLeagueData` for league/team data, and `useMatchupData` for live scoring. Head-to-head history reads from `matchups` array (all weeks loaded by `useLeagueData`).

Roster display: Shows member names from `memberNames` map (already provided by `useLeagueData`). No per-member point sorting — we don't have individual scores in scope without an extra fetch. Just list members with a "You" badge.

```javascript
// src/pages/league/MatchupDetails.jsx
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { useLeagueData } from '../../hooks/useLeagueData'
import { useMatchupData } from '../../hooks/useMatchupData'
import { useChallengeData } from '../../hooks/useChallengeData'
import { FANTASY_CATEGORIES } from '../../lib/league/leagueConfig'
import './MatchupDetails.css'

export default function MatchupDetails() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { completions } = useChallengeData()
  const {
    loading, league, teams, userTeam, matchups,
    isOnTeam, leagueExists, getCurrentWeek, getWeekMatchups,
    fetchLiveTeamScores, memberNames,
  } = useLeagueData()

  const { categoryScores, matchupData, matchupLoading } = useMatchupData({
    completions,
    userTeam, league, teams,
    getCurrentWeek, getWeekMatchups, fetchLiveTeamScores,
  })

  const currentWeek = getCurrentWeek?.() || 0

  // No active matchup → empty state
  if (!loading && (!leagueExists || !isOnTeam || !matchupData)) {
    return (
      <div className="matchup-details-page">
        <div className="matchup-details-header">
          <button className="matchup-back-btn" onClick={() => navigate(-1)}>← Back</button>
        </div>
        <div className="matchup-empty">
          <p>No active matchup this week.</p>
          <button className="matchup-cta" onClick={() => navigate('/league')}>Go to League →</button>
        </div>
      </div>
    )
  }

  // Find opponent team
  const currentMatchups = getWeekMatchups?.(currentWeek) || []
  const matchup = currentMatchups.find(
    m => m.team_a_id === userTeam?.id || m.team_b_id === userTeam?.id
  )
  const oppTeamId = matchup
    ? (matchup.team_a_id === userTeam?.id ? matchup.team_b_id : matchup.team_a_id)
    : null
  const oppTeam = oppTeamId ? teams.find(t => t.id === oppTeamId) : null

  // Head-to-head history from past matchups between these two teams
  const h2hHistory = (matchups || [])
    .filter(m =>
      m.calculated_at && (
        (m.team_a_id === userTeam?.id && m.team_b_id === oppTeamId) ||
        (m.team_b_id === userTeam?.id && m.team_a_id === oppTeamId)
      )
    )
    .sort((a, b) => b.week_number - a.week_number)
    .map(m => {
      const isTeamA = m.team_a_id === userTeam?.id
      const myW = isTeamA ? m.team_a_categories_won : m.team_b_categories_won
      const oppW = isTeamA ? m.team_b_categories_won : m.team_a_categories_won
      return {
        week: m.week_number,
        result: myW > oppW ? 'W' : myW < oppW ? 'L' : 'D',
        myWins: myW,
        oppWins: oppW,
      }
    })

  return (
    <div className="matchup-details-page">
      {/* Header */}
      <div className="matchup-details-header">
        <button className="matchup-back-btn" onClick={() => navigate(-1)}>← Back</button>
        <span className="matchup-week-label">Week {currentWeek}</span>
      </div>

      {/* Scoreboard */}
      {matchupData && (
        <div className="matchup-scoreboard">
          <div className="matchup-team">
            <span className="matchup-team-name">{userTeam?.name || 'Your Team'}</span>
            <span className={`matchup-team-score ${matchupData.myWins > matchupData.oppWins ? 'winning' : ''}`}>
              {matchupData.myWins}
            </span>
          </div>
          <span className="matchup-vs-label">vs</span>
          <div className="matchup-team">
            <span className={`matchup-team-score ${matchupData.oppWins > matchupData.myWins ? 'winning' : ''}`}>
              {matchupData.oppWins}
            </span>
            <span className="matchup-team-name">{matchupData.opponentName}</span>
          </div>
        </div>
      )}

      {/* Category bars — full width, score on each side */}
      <div className={`matchup-categories${matchupLoading ? ' loading' : ''}`}>
        {matchupData?.categories?.map(cat => {
          const total = cat.score + cat.oppScore
          const myPct = total > 0 ? Math.round((cat.score / total) * 100) : 50
          const oppPct = 100 - myPct
          const tied = cat.score === cat.oppScore
          const myClass = tied ? '' : cat.winning ? 'win' : 'lose'
          const oppClass = tied ? '' : cat.winning ? 'lose' : 'win'

          return (
            <div key={cat.key} className="matchup-cat-row">
              <span className={`matchup-cat-score ${myClass}`}>{cat.score}</span>
              <div className="matchup-cat-bar-container">
                <span className="matchup-cat-label">{cat.icon} {cat.label}</span>
                <div className="matchup-cat-bar-track">
                  <div
                    className={`matchup-cat-bar-fill-left ${myClass}`}
                    style={{
                      width: `${myPct}%`,
                      ...(tied ? { background: FANTASY_CATEGORIES[cat.key]?.color } : {}),
                    }}
                  />
                  <div
                    className={`matchup-cat-bar-fill-right ${oppClass}`}
                    style={{
                      width: `${oppPct}%`,
                      ...(tied ? { background: FANTASY_CATEGORIES[cat.key]?.color, opacity: 0.4 } : {}),
                    }}
                  />
                </div>
              </div>
              <span className={`matchup-cat-score ${oppClass}`}>{cat.oppScore}</span>
            </div>
          )
        })}
      </div>

      {/* Head-to-Head History */}
      {h2hHistory.length > 0 && (
        <div className="matchup-section">
          <h3>Head-to-Head History</h3>
          {h2hHistory.map(h => (
            <div key={h.week} className={`matchup-h2h-row ${h.result.toLowerCase()}`}>
              <span className="matchup-h2h-week">Week {h.week}</span>
              <span className={`matchup-h2h-result ${h.result.toLowerCase()}`}>{h.result}</span>
              <span className="matchup-h2h-score">{h.myWins}-{h.oppWins}</span>
            </div>
          ))}
        </div>
      )}

      {/* Team Rosters — names only, no individual scores */}
      <div className="matchup-rosters">
        <div className="matchup-roster">
          <h3>{userTeam?.name || 'Your Team'}</h3>
          {(userTeam?.fantasy_team_members || []).map(m => (
            <div key={m.user_id} className="matchup-roster-member">
              <span>{memberNames?.[m.user_id] || 'Member'}</span>
              {m.user_id === user?.id && <span className="matchup-you-badge">You</span>}
            </div>
          ))}
        </div>
        {oppTeam && (
          <div className="matchup-roster">
            <h3>{oppTeam.name}</h3>
            {(oppTeam.fantasy_team_members || []).map(m => (
              <div key={m.user_id} className="matchup-roster-member">
                <span>{memberNames?.[m.user_id] || 'Member'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Create the CSS**

```css
/* src/pages/league/MatchupDetails.css */

.matchup-details-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding-bottom: calc(60px + env(safe-area-inset-bottom, 0) + 2rem);
}

.matchup-details-header {
  background: linear-gradient(135deg, #5e17eb 0%, #8b5cf6 100%);
  color: white;
  padding: 1.5rem 1.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-radius: 0 0 24px 24px;
}

.matchup-back-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.matchup-back-btn:hover { background: rgba(255, 255, 255, 0.25); }

.matchup-week-label {
  font-size: 1rem;
  font-weight: 700;
  opacity: 0.9;
}

/* Scoreboard */
.matchup-scoreboard {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 1.5rem 1rem;
}

.matchup-team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.matchup-team-name { font-size: 0.85rem; font-weight: 700; color: #374151; }
.matchup-team-score { font-size: 2.5rem; font-weight: 900; color: #6b7280; }
.matchup-team-score.winning { color: #10b981; }
.matchup-vs-label { font-size: 0.85rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; }

/* Category bars */
.matchup-categories { padding: 0 1rem; margin-bottom: 1.5rem; }
.matchup-categories.loading { opacity: 0.6; animation: barsPulse 1.5s ease-in-out infinite; }

.matchup-cat-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.matchup-cat-score { font-size: 0.9rem; font-weight: 800; min-width: 2rem; text-align: center; color: #6b7280; }
.matchup-cat-score.win { color: #10b981; }
.matchup-cat-score.lose { color: #ef4444; }

.matchup-cat-bar-container { flex: 1; display: flex; flex-direction: column; gap: 0.15rem; }
.matchup-cat-label { font-size: 0.7rem; font-weight: 600; color: #6b7280; text-align: center; }

.matchup-cat-bar-track {
  display: flex;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  background: #e5e7eb;
}

.matchup-cat-bar-fill-left, .matchup-cat-bar-fill-right {
  height: 100%;
  transition: width 0.6s ease;
}

.matchup-cat-bar-fill-left.win { background: #10b981; }
.matchup-cat-bar-fill-left.lose { background: #ef4444; }
.matchup-cat-bar-fill-right.win { background: #10b981; opacity: 0.5; }
.matchup-cat-bar-fill-right.lose { background: #ef4444; opacity: 0.5; }

/* Sections (H2H, etc.) */
.matchup-section { padding: 0 1rem; margin-bottom: 1.5rem; }
.matchup-section h3 { font-size: 0.9rem; font-weight: 700; color: #374151; margin: 0 0 0.75rem; }

.matchup-h2h-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border-radius: 10px;
  margin-bottom: 0.4rem;
  border-left: 3px solid #e5e7eb;
}

.matchup-h2h-row.w { border-left-color: #10b981; }
.matchup-h2h-row.l { border-left-color: #ef4444; }
.matchup-h2h-row.d { border-left-color: #f59e0b; }

.matchup-h2h-week { font-size: 0.8rem; color: #6b7280; flex: 1; }
.matchup-h2h-result { font-size: 0.85rem; font-weight: 800; }
.matchup-h2h-result.w { color: #10b981; }
.matchup-h2h-result.l { color: #ef4444; }
.matchup-h2h-result.d { color: #f59e0b; }
.matchup-h2h-score { font-size: 0.8rem; font-weight: 600; color: #6b7280; }

/* Rosters */
.matchup-rosters { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 0 1rem; }
.matchup-roster h3 { font-size: 0.85rem; font-weight: 700; color: #374151; margin: 0 0 0.5rem; }
.matchup-roster-member { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: #6b7280; padding: 0.25rem 0; }
.matchup-you-badge { background: #5e17eb; color: white; font-size: 0.6rem; font-weight: 700; padding: 1px 6px; border-radius: 4px; }

/* Empty state */
.matchup-empty { text-align: center; padding: 3rem 1rem; color: #6b7280; }
.matchup-cta {
  background: linear-gradient(135deg, #5e17eb, #E9A23B);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 1rem;
}
```

**Step 3: Verify build**

Run: `npm run build 2>&1 | tail -3`
Expected: `✓ built in ...`

**Step 4: Commit**

```
feat: create MatchupDetails page component and styles
```

---

## Task 6: Matchup Details — Route + Navigation Wiring

**Files:**
- Modify: `src/AppRouter.jsx`
- Modify: `src/components/ChallengeHeader.jsx`
- Modify: `src/pages/league/LeagueOverview.jsx`

**Step 1: Add route to AppRouter.jsx**

Add lazy import near other league imports (~line 222):
```javascript
const MatchupDetails = lazyRetry(() => import('./pages/league/MatchupDetails'))
```

Add CSS import near other league CSS imports (~line 288):
```javascript
import './pages/league/MatchupDetails.css'
```

Add route after existing `/league` route (~line 957). **Must come before** the catch-all `/league` route to avoid route conflicts:
```jsx
            <Route path="/league/matchup" element={
              <AuthGate>
                <MatchupDetails />
              </AuthGate>
            } />
```

**Step 2: Update matchup banner navigation in ChallengeHeader**

In `src/components/ChallengeHeader.jsx`, **only** the matchup banner changes. The "Leaderboard" badge in the bottom row stays pointing to `/league` via `onLeaderboardClick`.

Change the matchup banner onClick (line ~97):
```jsx
// BEFORE:
          onClick={onLeaderboardClick}
// AFTER:
          onClick={() => navigate('/league/matchup')}
```

Do NOT change the leaderboard badge onClick — it correctly stays as `onLeaderboardClick`.

**Step 3: Add "View Matchup" card in LeagueOverview**

In `src/pages/league/LeagueOverview.jsx`, find where the main content renders after the loading check, before the tabs. Add:

```jsx
{isOnTeam && currentWeek > 0 && (
  <div
    className="league-matchup-card"
    onClick={() => { hapticLight(); navigate('/league/matchup') }}
    style={{
      background: 'linear-gradient(135deg, rgba(94,23,235,0.06), rgba(233,162,59,0.06))',
      border: '1px solid rgba(94,23,235,0.12)',
      borderRadius: '14px', padding: '14px 18px',
      marginBottom: '16px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      transition: 'all 0.2s',
    }}
  >
    <span style={{ fontWeight: 700, color: '#5e17eb', fontSize: '0.9rem' }}>
      ⚔️ View This Week's Matchup
    </span>
    <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>→</span>
  </div>
)}
```

**Step 4: Verify build**

Run: `npm run build 2>&1 | tail -3`
Expected: `✓ built in ...`

**Step 5: Commit**

```
feat: add /league/matchup route and wire navigation from header + league page
```

---

## Task 7: Game Day Notifications — On W/L Flip

**Files:**
- Modify: `src/hooks/useMatchupData.js`

**Step 1: Add notification imports and rate-limit ref**

Add imports:
```javascript
import { sendNotification } from '../lib/notifications'
import { supabase } from '../lib/supabaseClient'
```

Add ref after existing refs:
```javascript
const lastNotifyRef = useRef(0) // rate limit: max 1 notify per 15min
```

**Step 2: Add notification send inside the existing flip detection block**

The flip detection (from Task 3) runs inside `fetchOpponentData` where `oppMemberIds`, `myWins`, `oppWins`, and `userTeam` are all local variables already in scope. No ref needed — just use them directly.

In the `if (flippedWin.length > 0)` block, after the confetti/haptic/toast code, add:

```javascript
        // Game day push to opponent team (rate-limited)
        const now = Date.now()
        if (now - lastNotifyRef.current > 15 * 60 * 1000) {
          lastNotifyRef.current = now
          ;(async () => {
            try {
              const { data: prefs } = await supabase
                .from('notification_preferences')
                .select('user_id, matchup_alerts')
                .in('user_id', oppMemberIds)
              const enabledIds = (prefs || [])
                .filter(p => p.matchup_alerts !== false)
                .map(p => p.user_id)
              for (const uid of enabledIds) {
                sendNotification(uid, {
                  title: `🏆 ${userTeam.name} just overtook you!`,
                  body: `You're now trailing ${myWins}-${oppWins}. Time to fight back!`,
                  url: '/league/matchup',
                  tag: 'matchup-flip',
                }).catch(() => {})
              }
            } catch (err) {
              console.warn('Game day notify error:', err)
            }
          })()
        }
```

**Step 3: Verify build**

Run: `npm run build 2>&1 | tail -3`
Expected: `✓ built in ...`

**Step 4: Commit**

```
feat: send game day push notifications to opponents on W/L flip
```

---

## Task 8: Database Migration — matchup_alerts

**Files:**
- Create: `supabase/migrations/20260217120000_add_matchup_alerts.sql`

**Step 1: Create migration**

```sql
-- Add matchup_alerts preference for game day notifications
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS matchup_alerts boolean DEFAULT true;
```

**Step 2: Apply via Supabase MCP or push**

Apply the migration to the live database.

**Step 3: Commit**

```
feat: add matchup_alerts column to notification_preferences
```

---

## Task 9: Weekly Recap — In-App Card + Data Hook

**Files:**
- Create: `src/components/WeeklyRecapCard.jsx`
- Modify: `src/hooks/useMatchupData.js` (add recap data derivation)
- Modify: `src/Challenge.jsx`
- Modify: `src/Challenge.css`

**Step 1: Add recap data to useMatchupData**

Instead of inline IIFEs in Challenge.jsx, derive recap data in the hook where all the matchup/team data already lives. Add after the existing return values:

In `useMatchupData`, add a `useMemo` for recap data:

```javascript
  // ─── Weekly recap data (last week's result) ───
  const recapData = useMemo(() => {
    if (!userTeam || !league || !getWeekMatchups) return null
    const weekNum = getCurrentWeek?.() || 0
    if (weekNum < 2) return null

    const lastWeekMatchups = getWeekMatchups(weekNum - 1) || []
    const lastMatch = lastWeekMatchups.find(
      m => (m.team_a_id === userTeam.id || m.team_b_id === userTeam.id) && m.calculated_at
    )
    if (!lastMatch) return null

    const isTeamA = lastMatch.team_a_id === userTeam.id
    const oppTeamId = isTeamA ? lastMatch.team_b_id : lastMatch.team_a_id
    const oppName = teams?.find(t => t.id === oppTeamId)?.name || 'Opponent'

    return {
      matchup: lastMatch,
      userTeamId: userTeam.id,
      opponentName: oppName,
      lastWeek: weekNum - 1,
    }
  }, [userTeam, league, teams, getCurrentWeek, getWeekMatchups])
```

Add `recapData` to the return object.

**Step 2: Create WeeklyRecapCard component**

```javascript
// src/components/WeeklyRecapCard.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FANTASY_CATEGORIES, CATEGORY_KEYS } from '../lib/league/leagueConfig'

export default function WeeklyRecapCard({
  lastWeekMatchup,
  userTeamId,
  opponentName,
  currentOpponentName,
  currentWeek,
}) {
  const navigate = useNavigate()
  const lastWeek = (currentWeek || 1) - 1
  const dismissKey = `recap_dismissed_week_${lastWeek}`
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem(dismissKey) === 'true'
  )

  if (dismissed || !lastWeekMatchup || lastWeek < 1) return null

  const isTeamA = lastWeekMatchup.team_a_id === userTeamId
  const myWins = isTeamA ? lastWeekMatchup.team_a_categories_won : lastWeekMatchup.team_b_categories_won
  const oppWins = isTeamA ? lastWeekMatchup.team_b_categories_won : lastWeekMatchup.team_a_categories_won
  const result = myWins > oppWins ? 'W' : myWins < oppWins ? 'L' : 'D'
  const resultEmoji = result === 'W' ? '🎉' : result === 'L' ? '😤' : '🤝'
  const resultLabel = result === 'W' ? 'You won' : result === 'L' ? 'You lost' : 'Draw'

  const catResults = lastWeekMatchup.category_results || []

  // Best category: highest score diff in user's favor
  let bestCatConfig = null
  let bestDiff = -Infinity
  catResults.forEach(cr => {
    const myScore = isTeamA ? (cr.teamAScore || 0) : (cr.teamBScore || 0)
    const oppScore = isTeamA ? (cr.teamBScore || 0) : (cr.teamAScore || 0)
    if (myScore - oppScore > bestDiff) {
      bestDiff = myScore - oppScore
      bestCatConfig = FANTASY_CATEGORIES[cr.key || cr.category]
    }
  })

  return (
    <div className="weekly-recap-card">
      <div className="recap-header">
        <span className="recap-title">📊 Week {lastWeek} Recap</span>
        <button className="recap-dismiss" onClick={() => {
          localStorage.setItem(dismissKey, 'true')
          setDismissed(true)
        }}>×</button>
      </div>

      <div className="recap-result">
        <span className="recap-result-text">
          {resultLabel} vs {opponentName} {myWins}-{oppWins} {resultEmoji}
        </span>
      </div>

      <div className="recap-cats">
        {catResults.map((cr, i) => {
          const key = cr.key || cr.category || CATEGORY_KEYS[i]
          const cat = FANTASY_CATEGORIES[key]
          if (!cat) return null
          const myScore = isTeamA ? (cr.teamAScore || 0) : (cr.teamBScore || 0)
          const oppScore = isTeamA ? (cr.teamBScore || 0) : (cr.teamAScore || 0)
          const won = myScore > oppScore
          return (
            <span key={key} className={`recap-cat-pill ${won ? 'won' : 'lost'}`}>
              {cat.icon} {myScore}-{oppScore} {won ? '✅' : '❌'}
            </span>
          )
        })}
      </div>

      {bestCatConfig && <div className="recap-best">Best: {bestCatConfig.icon} {bestCatConfig.label}</div>}
      {currentOpponentName && <div className="recap-next">This week: vs {currentOpponentName}</div>}

      <button className="recap-cta" onClick={() => navigate('/league/matchup')}>View Matchup</button>
    </div>
  )
}
```

**Step 3: Add recap CSS to Challenge.css**

Append to `src/Challenge.css`:

```css
/* ─── Weekly Recap Card ─── */
.weekly-recap-card {
  background: white;
  border-radius: 14px;
  padding: 1rem;
  margin-bottom: 12px;
  border: 1px solid rgba(94, 23, 235, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.recap-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.recap-title { font-size: 0.85rem; font-weight: 700; color: #374151; }
.recap-dismiss { background: none; border: none; font-size: 1.2rem; color: #9ca3af; cursor: pointer; padding: 0 4px; line-height: 1; }
.recap-result-text { font-size: 0.9rem; font-weight: 700; color: #1f2937; }
.recap-cats { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.5rem 0; }
.recap-cat-pill { font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 6px; background: #f3f4f6; }
.recap-cat-pill.won { color: #10b981; }
.recap-cat-pill.lost { color: #ef4444; }
.recap-best { font-size: 0.8rem; color: #6b7280; margin-bottom: 0.25rem; }
.recap-next { font-size: 0.8rem; font-weight: 600; color: #5e17eb; margin-bottom: 0.5rem; }
.recap-cta {
  background: linear-gradient(135deg, #5e17eb, #8b5cf6);
  color: white; border: none; padding: 0.5rem 1rem;
  border-radius: 10px; font-weight: 700; font-size: 0.8rem; cursor: pointer; width: 100%;
}
```

**Step 4: Wire into Challenge.jsx**

Import:
```javascript
import WeeklyRecapCard from './components/WeeklyRecapCard'
```

Update useMatchupData destructure to include `recapData`:
```javascript
const { categoryScores, matchupData, matchupLoading, flipEvent, clearFlipEvent, recapData } = useMatchupData({
```

Add JSX after the flip toast, before the league nudge banner:
```jsx
      {/* Weekly recap card */}
      {recapData && isOnTeam && (
        <WeeklyRecapCard
          lastWeekMatchup={recapData.matchup}
          userTeamId={recapData.userTeamId}
          opponentName={recapData.opponentName}
          currentOpponentName={matchupData?.opponentName}
          currentWeek={(getCurrentWeek?.() || 0)}
        />
      )}
```

**Step 5: Verify build**

Run: `npm run build 2>&1 | tail -3`
Expected: `✓ built in ...`

**Step 6: Commit**

```
feat: add weekly recap card with last week's matchup results
```

---

## Task 10: Weekly Recap — Push Notification Edge Function

**Files:**
- Create: `supabase/functions/send-weekly-recap/index.ts`

**Step 1: Create the Edge Function**

Batches all member IDs and queries push_subscriptions once per league instead of per-user (fixing the N+1 problem).

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Service role auth guard
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (token !== supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Service role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: leagues } = await supabase
      .from('fantasy_leagues').select('id, current_week').eq('status', 'active')
    if (!leagues?.length) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
    const vapidEmail = Deno.env.get('VAPID_EMAIL')!
    webpush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublicKey, vapidPrivateKey)

    let totalSent = 0

    for (const league of leagues) {
      const lastWeek = (league.current_week || 1) - 1
      if (lastWeek < 1) continue

      const { data: matchups } = await supabase
        .from('fantasy_matchups').select('*')
        .eq('league_id', league.id).eq('week_number', lastWeek)
        .not('calculated_at', 'is', null)
      if (!matchups?.length) continue

      const { data: teams } = await supabase
        .from('fantasy_teams')
        .select('id, name, fantasy_team_members(user_id)')
        .eq('league_id', league.id)
      if (!teams) continue
      const teamMap = Object.fromEntries(teams.map((t: any) => [t.id, t]))

      // Collect ALL member IDs for this league for batch queries
      const allMemberIds = teams.flatMap(
        (t: any) => (t.fantasy_team_members || []).map((m: any) => m.user_id)
      )

      // Batch: notification prefs for all members
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('user_id, matchup_alerts')
        .in('user_id', allMemberIds)
      const prefsMap = Object.fromEntries((prefs || []).map((p: any) => [p.user_id, p]))

      // Batch: push subscriptions for all members
      const { data: allSubs } = await supabase
        .from('push_subscriptions').select('*').in('user_id', allMemberIds)
      const subsMap: Record<string, any[]> = {}
      for (const sub of (allSubs || [])) {
        if (!subsMap[sub.user_id]) subsMap[sub.user_id] = []
        subsMap[sub.user_id].push(sub)
      }

      for (const m of matchups) {
        for (const side of ['a', 'b'] as const) {
          const myTeamId = side === 'a' ? m.team_a_id : m.team_b_id
          const oppTeamId = side === 'a' ? m.team_b_id : m.team_a_id
          const myWins = side === 'a' ? m.team_a_categories_won : m.team_b_categories_won
          const oppWins = side === 'a' ? m.team_b_categories_won : m.team_a_categories_won

          const myTeam = teamMap[myTeamId]
          const oppTeam = teamMap[oppTeamId]
          if (!myTeam || !oppTeam) continue

          const result = myWins > oppWins ? 'W' : myWins < oppWins ? 'L' : 'D'
          const emoji = result === 'W' ? '🎉' : result === 'L' ? '💪' : '🤝'
          const resultText = result === 'W'
            ? `You beat ${oppTeam.name} ${myWins}-${oppWins}`
            : result === 'L'
            ? `You lost to ${oppTeam.name} ${myWins}-${oppWins}`
            : `You drew with ${oppTeam.name} ${myWins}-${oppWins}`

          const memberIds = (myTeam.fantasy_team_members || []).map((mem: any) => mem.user_id)
          const payload = JSON.stringify({
            title: `Week ${lastWeek} Recap ${emoji}`,
            body: resultText,
            url: '/league/matchup',
            tag: 'weekly-recap',
          })

          for (const uid of memberIds) {
            const pref = prefsMap[uid]
            if (pref && pref.matchup_alerts === false) continue

            const subs = subsMap[uid]
            if (!subs?.length) continue

            for (const sub of subs) {
              try {
                await webpush.sendNotification({
                  endpoint: sub.endpoint,
                  keys: { p256dh: sub.p256dh, auth: sub.auth },
                }, payload)
                totalSent++
              } catch (err) {
                if ((err as any).statusCode === 410) {
                  await supabase.from('push_subscriptions').delete().eq('id', sub.id)
                }
              }
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ sent: totalSent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Weekly recap error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

**Step 2: Commit**

```
feat: add send-weekly-recap edge function with batched queries
```

---

## Task 11: Final Verification

**Step 1: Full build**

Run: `npm run build 2>&1 | tail -5`
Expected: Clean build.

**Step 2: Manual smoke test checklist**

- [ ] `/7-day-challenge` — header bars render (solo mode if no league)
- [ ] Complete a quest — number counts up with animation, bar slides
- [ ] `/league/matchup` — shows H2H or redirects if no matchup
- [ ] Tap matchup banner in header → goes to `/league/matchup`
- [ ] Tap "Leaderboard" badge → goes to `/league` (NOT matchup)
- [ ] `/league` — "View Matchup" card visible if on a team
- [ ] Weekly recap card shows if previous week's matchup calculated

**Step 3: Commit any final fixes, then done.**

---

## Files Summary

| File | Action | Task |
|------|--------|------|
| `src/hooks/useScoreAnimation.js` | CREATE | 1 |
| `src/components/ChallengeHeader.jsx` | MODIFY | 2, 6 |
| `src/hooks/useMatchupData.js` | MODIFY | 3, 7, 9 |
| `src/Challenge.jsx` | MODIFY | 4, 9 |
| `src/pages/league/MatchupDetails.jsx` | CREATE | 5 |
| `src/pages/league/MatchupDetails.css` | CREATE | 5 |
| `src/AppRouter.jsx` | MODIFY | 6 |
| `src/pages/league/LeagueOverview.jsx` | MODIFY | 6 |
| `supabase/migrations/20260217120000_add_matchup_alerts.sql` | CREATE | 8 |
| `src/components/WeeklyRecapCard.jsx` | CREATE | 9 |
| `src/Challenge.css` | MODIFY | 9 |
| `supabase/functions/send-weekly-recap/index.ts` | CREATE | 10 |
