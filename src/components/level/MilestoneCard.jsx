/**
 * MilestoneCard.jsx
 *
 * 3-state milestone card:
 * 1. No commitment — "Set Your Challenge" button
 * 2. Committed — shows commitment text + "I Did It" button
 * 3. Completed — done badge
 */

export default function MilestoneCard({ milestone, isCompleted, commitment, onCommit, onDidIt }) {
  if (!milestone) return null

  return (
    <div className={`level-milestone ${isCompleted ? 'completed' : ''}`}>
      <div className="level-milestone-icon">{isCompleted ? '\uD83C\uDFC6' : '\uD83C\uDFAF'}</div>
      <div className="level-milestone-info">
        <div className="level-milestone-label">Stage Milestone</div>
        <div className="level-milestone-text">{milestone.text}</div>
        {commitment && !isCompleted && (
          <div className="level-milestone-commitment">{commitment}</div>
        )}
      </div>
      {isCompleted ? (
        <span className="level-dd-status done">Done</span>
      ) : commitment ? (
        <button type="button" className="level-milestone-btn" onClick={onDidIt}>
          I Did It
        </button>
      ) : (
        <button type="button" className="level-milestone-btn" onClick={onCommit}>
          Set Challenge
        </button>
      )}
    </div>
  )
}
