/**
 * LeadScoreBadge - Compact lead temperature indicator for deal cards
 */
import './LeadScoreBadge.css'

export default function LeadScoreBadge({ totalScore, temperature, compact = false }) {
  // Calculate temperature if not provided
  const temp = temperature || (totalScore >= 32 ? 'hot' : totalScore >= 24 ? 'warm' : 'cold')
  const score = totalScore || 0

  // If no score yet, show unscored state
  if (score === 0 && !temperature) {
    return (
      <span className="lead-score-badge unscored">
        <span className="badge-emoji">📊</span>
        {!compact && <span className="badge-text">Unscored</span>}
      </span>
    )
  }

  return (
    <span className={`lead-score-badge ${temp} ${compact ? 'compact' : ''}`}>
      <span className="badge-emoji">
        {temp === 'hot' && '🔥'}
        {temp === 'warm' && '🌤️'}
        {temp === 'cold' && '❄️'}
      </span>
      {!compact && (
        <>
          <span className="badge-text">{temp.toUpperCase()}</span>
          <span className="badge-score">{score}/40</span>
        </>
      )}
      {compact && <span className="badge-score-compact">{score}</span>}
    </span>
  )
}
