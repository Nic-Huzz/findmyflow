/**
 * WeeklyRecapCard — Dismissible recap of last week's matchup result.
 * Shows on Challenge page on Mondays (or any day until dismissed).
 */
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
