/**
 * DeepDiveCard.jsx
 *
 * Links to a healing flow as the level's deep dive quest.
 * Shows status (start / done / coming soon).
 *
 * Created: 2026-03-27
 */

export default function DeepDiveCard({ deepDive, isCompleted, onNavigate }) {
  if (!deepDive) return null

  const handleClick = () => {
    if (deepDive.route?.startsWith('#') && onNavigate) {
      const tab = deepDive.route.slice(1)
      onNavigate(tab === 'playlist' ? 'Wahoo' : tab)
    }
  }

  return (
    <div className={`level-deep-dive ${isCompleted ? 'completed' : ''}`}>
      <div className="level-dd-icon">{isCompleted ? '\u2705' : (deepDive.lockedUntil && !deepDive.route ? '🔒' : (deepDive.icon || '\uD83D\uDD2E'))}</div>
      <div className="level-dd-info">
        <div className="level-dd-name">{deepDive.name}</div>
        <div className="level-dd-narrative">{deepDive.narrative}</div>
      </div>
      {isCompleted ? (
        <span className="level-dd-status done">Done</span>
      ) : deepDive.route?.startsWith('#') ? (
        <button className="level-dd-status start" onClick={handleClick} style={{ cursor: 'pointer' }}>Start</button>
      ) : deepDive.route ? (
        <a href={deepDive.route} className="level-dd-status start">Start</a>
      ) : deepDive.lockedUntil ? (
        <span className="level-dd-status locked">Locked</span>
      ) : (
        <span className="level-dd-status locked">Coming Soon</span>
      )}
    </div>
  )
}
