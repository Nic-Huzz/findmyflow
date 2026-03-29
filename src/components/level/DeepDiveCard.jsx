/**
 * DeepDiveCard.jsx
 *
 * Links to a healing flow as the level's deep dive quest.
 * Shows status (start / done / coming soon).
 *
 * Created: 2026-03-27
 */

export default function DeepDiveCard({ deepDive, isCompleted }) {
  if (!deepDive) return null
  return (
    <div className={`level-deep-dive ${isCompleted ? 'completed' : ''}`}>
      <div className="level-dd-icon">{isCompleted ? '\u2705' : '\uD83D\uDD2E'}</div>
      <div className="level-dd-info">
        <div className="level-dd-name">{deepDive.name}</div>
        <div className="level-dd-narrative">{deepDive.narrative}</div>
      </div>
      {isCompleted ? (
        <span className="level-dd-status done">Done</span>
      ) : deepDive.route ? (
        <a href={deepDive.route} className="level-dd-status start">Start</a>
      ) : (
        <span className="level-dd-status locked">Coming Soon</span>
      )}
    </div>
  )
}
