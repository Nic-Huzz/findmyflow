/**
 * GhostRecapCard — Dismissible recap of last week's ghost matchup result.
 * Sports-scoreboard style: result headline, 3-row category breakdown, inline CTA.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function GhostRecapCard({ recapData }) {
  const navigate = useNavigate()
  const dismissKey = recapData ? `ghost_recap_dismissed_${recapData.weekStart}` : ''
  const [dismissed, setDismissed] = useState(() =>
    recapData ? localStorage.getItem(`ghost_recap_dismissed_${recapData.weekStart}`) === 'true' : true
  )

  if (!recapData || dismissed) return null

  const { result, categoriesWon, categoriesLost, streak, isFirstWeek } = recapData

  const resultLabel = result === 'win' ? 'You won' : result === 'loss' ? 'Ghost won' : 'Draw'
  const resultClass = result === 'win' ? 'grc-win' : result === 'loss' ? 'grc-loss' : 'grc-draw'

  const categories = [
    { label: 'Tune', icon: '☀️', current: recapData.currentTune, ghost: recapData.ghostTune },
    { label: 'Courage', icon: '🔥', current: recapData.currentCourage, ghost: recapData.ghostCourage },
    { label: 'Community', icon: '📣', current: recapData.currentCommunity, ghost: recapData.ghostCommunity },
  ]

  const dismiss = () => {
    localStorage.setItem(dismissKey, 'true')
    setDismissed(true)
  }

  return (
    <div className="grc-card" onClick={() => navigate('/league')}>
      <button className="grc-dismiss" onClick={e => { e.stopPropagation(); dismiss() }} aria-label="Dismiss">×</button>

      {/* Result headline */}
      <div className={`grc-headline ${resultClass}`}>
        <span className="grc-result-label">Last week · {resultLabel}</span>
        <span className="grc-score-big">{categoriesWon} – {categoriesLost}</span>
      </div>

      {/* Category scoreboard rows */}
      {!isFirstWeek && (
        <div className="grc-scoreboard">
          <div className="grc-board-header">
            <span></span>
            <span className="grc-col-label">You</span>
            <span className="grc-col-label">Ghost</span>
          </div>
          {categories.map(cat => {
            const won = cat.current > cat.ghost
            const lost = cat.current < cat.ghost
            return (
              <div key={cat.label} className="grc-row">
                <span className="grc-row-label">{cat.icon} {cat.label}</span>
                <span className={`grc-row-score ${won ? 'grc-win-text' : ''}`}>{cat.current}</span>
                <span className={`grc-row-score ${lost ? 'grc-loss-text' : ''}`}>{cat.ghost}</span>
                <span className={`grc-row-marker ${won ? 'grc-marker-win' : lost ? 'grc-marker-loss' : 'grc-marker-tied'}`}>
                  {won ? 'W' : lost ? 'L' : 'T'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {isFirstWeek && result === 'win' && (
        <p className="grc-first-week">
          Nice work! Your scores this week become next week's ghost to beat.
        </p>
      )}

      {/* Footer: streak + inline CTA */}
      <div className="grc-footer">
        {streak > 1 && <span className="grc-streak">🔥 {streak}w streak</span>}
        <span className="grc-details-link">View Details →</span>
      </div>
    </div>
  )
}
