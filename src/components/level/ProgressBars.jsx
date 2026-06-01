/**
 * ProgressBars.jsx
 *
 * 2 progress bars: Level Quests (includes Tune Days), Play-List Tasks.
 *
 * Created: 2026-03-27
 */

export default function ProgressBars({
  levelQuests,
  courageCount,
  courageDone,
  questsCompleted,
}) {
  const totalQuests = levelQuests.length
  return (
    <div className="level-progress">
      <h3 className="level-section-title">Progress</h3>

      {/* Bar 1: Level Quests */}
      <div className="level-bar-section">
        <div className="level-bar-label">
          <span>Level Quests</span>
          <span>{questsCompleted}/{totalQuests}</span>
        </div>
        <div className="level-bar-track">
          <div
            className="level-bar-fill purple"
            style={{ width: `${totalQuests > 0 ? (questsCompleted / totalQuests) * 100 : 0}%` }}
          />
        </div>
        <div className="level-bar-items">
          {levelQuests.map((q, i) => (
            <span key={i} className={`level-bar-item ${q.done ? 'done' : ''}`}>
              {q.done ? '\u2713' : '\u25CB'} {q.label}
            </span>
          ))}
        </div>
      </div>

      {/* Tune Days now tracked in levelQuests checklist above — no separate bar needed */}

      {/* Bar 3: Play-list Courage (hidden if 0) */}
      {courageCount > 0 && (
        <div className="level-bar-section">
          <div className="level-bar-label">
            <span>Wahoo Tasks</span>
            <span>{courageDone}/{courageCount}</span>
          </div>
          <div className="level-bar-dots">
            {Array.from({ length: courageCount }).map((_, i) => (
              <div key={i} className={`level-bar-dot ${i < courageDone ? 'filled' : ''}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
