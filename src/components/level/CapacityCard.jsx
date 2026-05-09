/**
 * CapacityCard.jsx
 *
 * Compact card showing the weekly Capacity Score.
 * Renders at the top of the Level tab.
 *
 * Score: 0-100 normalized from state check-in data.
 * Shows: score number, fill bar, trend arrow vs last week.
 *
 * CSS prefix: cc- (scoped under .level-tab)
 * Created: 2026-05-09
 */

import useCapacityScore from '../../hooks/useCapacityScore'

export default function CapacityCard({ userId, refreshTrigger = 0 }) {
  const { score, trend, stateDistribution, dataPoints, loading } = useCapacityScore(userId, refreshTrigger)

  if (loading) return null
  if (score === null || dataPoints === 0) {
    return (
      <div className="cc-card cc-empty">
        <div className="cc-header">
          <span className="cc-label">Capacity Score</span>
        </div>
        <p className="cc-empty-text">Complete a daily check-in to start tracking</p>
      </div>
    )
  }

  const trendText = trend > 0 ? `+${trend}` : trend < 0 ? `${trend}` : '—'
  const trendClass = trend > 0 ? 'cc-trend-up' : trend < 0 ? 'cc-trend-down' : 'cc-trend-flat'

  return (
    <div className="cc-card">
      <div className="cc-header">
        <span className="cc-label">Capacity Score</span>
        <span className={`cc-trend ${trendClass}`}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : ''} {trendText}
        </span>
      </div>
      <div className="cc-score-row">
        <span className="cc-score">{score}</span>
        <div className="cc-bar-track">
          <div
            className="cc-bar-fill"
            style={{ width: `${Math.min(100, score)}%` }}
          />
        </div>
      </div>
      {stateDistribution && (
        <div className="cc-distribution">
          {stateDistribution.vibe_rise > 0 && (
            <span className="cc-dist-item cc-dist-vibe">⚡ {stateDistribution.vibe_rise}%</span>
          )}
          {stateDistribution.ventral > 0 && (
            <span className="cc-dist-item cc-dist-safe">😊 {stateDistribution.ventral}%</span>
          )}
          {stateDistribution.sympathetic > 0 && (
            <span className="cc-dist-item cc-dist-activated">😬 {stateDistribution.sympathetic}%</span>
          )}
          {stateDistribution.dorsal > 0 && (
            <span className="cc-dist-item cc-dist-shutdown">😶 {stateDistribution.dorsal}%</span>
          )}
        </div>
      )}
    </div>
  )
}
