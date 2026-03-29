/**
 * MilestoneCard.jsx
 *
 * Displays the stage milestone with completion toggle.
 *
 * Created: 2026-03-27
 */

export default function MilestoneCard({ milestone, isCompleted, onComplete }) {
  if (!milestone) return null
  return (
    <div className={`level-milestone ${isCompleted ? 'completed' : ''}`}>
      <div className="level-milestone-icon">{isCompleted ? '\uD83C\uDFC6' : '\uD83C\uDFAF'}</div>
      <div className="level-milestone-info">
        <div className="level-milestone-label">Stage Milestone</div>
        <div className="level-milestone-text">{milestone.text}</div>
      </div>
      {isCompleted ? (
        <span className="level-dd-status done">Done</span>
      ) : (
        <button type="button" className="level-milestone-btn" onClick={onComplete}>
          Mark Complete
        </button>
      )}
    </div>
  )
}
