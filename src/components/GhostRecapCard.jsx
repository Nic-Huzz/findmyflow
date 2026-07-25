/**
 * GhostRecapCard — Dismissible recap of last week's ghost matchup result.
 * Week 1: special message explaining the mechanic + early win celebration.
 * Week 2+: category breakdown, streak count.
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
  const resultEmoji = result === 'win' ? '🎉' : result === 'loss' ? '😤' : '🤝'
  const resultLabel = result === 'win' ? 'You beat your Ghost' : result === 'loss' ? 'Ghost won' : 'Draw'

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
    <div className="ghost-recap-card">
      <div className="ghost-recap-header">
        <span className="ghost-recap-title">Last Week {resultEmoji}</span>
        <button className="ghost-recap-dismiss" onClick={dismiss}>×</button>
      </div>

      <div className="ghost-recap-result">
        {resultLabel} {categoriesWon}-{categoriesLost}
      </div>

      {!isFirstWeek && (
        <div className="ghost-recap-cats">
          {categories.map(cat => {
            const won = cat.current > cat.ghost
            return (
              <span key={cat.label} className={`ghost-recap-pill ${won ? 'won' : cat.current < cat.ghost ? 'lost' : 'tied'}`}>
                {cat.icon} {cat.current}-{cat.ghost}
              </span>
            )
          })}
        </div>
      )}

      {isFirstWeek && result === 'win' && (
        <p className="ghost-recap-first-week">
          Nice work! Your scores this week become next week's ghost to beat.
        </p>
      )}

      {streak > 1 && (
        <div className="ghost-recap-streak">🔥 {streak} week streak</div>
      )}

      <button className="ghost-recap-cta" onClick={() => navigate('/league')}>
        View Details
      </button>
    </div>
  )
}
