/**
 * ResponseCounterInput - Shows live response counter for validation/feedback forms
 *
 * Features:
 * - Live counter showing X/target responses
 * - Progress bar visualization
 * - Points earned per response display
 * - Link to create/manage forms
 * - Auto-completes when target is reached
 */

import { Link } from 'react-router-dom'
import './ResponseCounterInput.css'

function ResponseCounterInput({
  quest,
  responseCount = 0,
  onComplete
}) {
  const target = quest.target_responses || 3
  const pointsPerResponse = quest.points_per_response || 8
  const pointsEarned = Math.min(responseCount, target) * pointsPerResponse
  const isComplete = responseCount >= target
  const progressPercent = Math.min((responseCount / target) * 100, 100)

  // If complete, auto-trigger completion
  // (This would be handled by useChallengeData, but we show completed state)

  return (
    <div className="response-counter-input">
      {/* Progress section */}
      <div className="response-progress-section">
        <div className="response-counter-display">
          <span className="response-count">{responseCount}</span>
          <span className="response-separator">/</span>
          <span className="response-target">{target}</span>
          <span className="response-label">responses</span>
        </div>

        <div className="response-progress-bar">
          <div
            className="response-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {responseCount > 0 && responseCount < target && (
          <div className="response-points-earned">
            +{pointsEarned} pts earned · {target - responseCount} more to complete
          </div>
        )}

        {responseCount === 0 && (
          <div className="response-hint">
            Create a form and share the link to start collecting responses
          </div>
        )}
      </div>

      {/* Action link */}
      {quest.actionLink && (
        <Link to={quest.actionLink} className="response-action-link">
          {responseCount === 0 ? 'Create Form' : quest.actionLinkText || 'View Responses'}
        </Link>
      )}

      {/* Complete button - shown when target reached but not yet marked complete */}
      {isComplete && (
        <button
          className="quest-complete-btn"
          onClick={(e) => onComplete(quest, { responseCount, pointsEarned }, e)}
        >
          Complete Quest (+{quest.points} pts)
        </button>
      )}
    </div>
  )
}

export default ResponseCounterInput
