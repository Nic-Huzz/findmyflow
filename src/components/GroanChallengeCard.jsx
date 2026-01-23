/**
 * GroanChallengeCard.jsx
 * Individual challenge display card
 *
 * Shows challenge details including:
 * - Title and description
 * - Visibility layer badge
 * - Scary/Wahoo scores
 * - Essence zone indicator
 * - Completion criteria
 * - Actions (accept, skip, complete, regenerate)
 */

import { useState } from 'react'
import { getVisibilityLayer } from '../lib/stageConfig'
import './GroanChallengeCard.css'

function GroanChallengeCard({
  challenge,
  onAccept,
  onSkip,
  onComplete,
  onRegenerate,
  compact = false,
  showSource = true,
  showAlternative = true
}) {
  const [showAlt, setShowAlt] = useState(false)

  if (!challenge) return null

  const layer = getVisibilityLayer(challenge.visibility_layer)
  const isEssenceZone = challenge.essence_zone === 'essence'
  const status = challenge.status

  // Format source type for display
  const formatSourceType = (type) => {
    switch (type) {
      case 'skill': return 'Skill'
      case 'problem': return 'Problem'
      case 'persona': return 'Persona'
      default: return type
    }
  }

  return (
    <div
      className={`groan-challenge-card ${isEssenceZone ? 'essence-zone' : ''} ${
        status === 'completed' ? 'completed' : ''
      } ${compact ? 'compact' : ''}`}
      style={{ '--layer-color': layer?.color || '#fff' }}
    >
      {/* Header */}
      <div className="groan-card-header">
        {layer && (
          <span className="groan-layer-badge">
            <span className="groan-layer-badge-icon">{layer.icon}</span>
            {layer.label}
          </span>
        )}

        {isEssenceZone && (
          <span className="groan-essence-indicator">
            <span>✨</span> Essence Zone
          </span>
        )}
      </div>

      {/* Status badge (if accepted/completed/skipped) */}
      {status && status !== 'generated' && (
        <div className={`groan-card-status ${status}`}>
          {status === 'accepted' && (
            <>⏳ In Progress</>
          )}
          {status === 'completed' && (
            <>✓ Completed</>
          )}
          {status === 'skipped' && (
            <>⊘ Skipped</>
          )}
        </div>
      )}

      {/* Title */}
      <h3 className="groan-card-title">{challenge.title}</h3>

      {/* Description */}
      <p className="groan-card-description">{challenge.description}</p>

      {/* Source context */}
      {showSource && challenge.source_label && (
        <div className="groan-card-source">
          <span className="groan-card-source-type">
            {formatSourceType(challenge.source_type)}:
          </span>
          <span className="groan-card-source-label">
            {challenge.source_label}
          </span>
        </div>
      )}

      {/* Scores */}
      {challenge.scary_score && challenge.wahoo_score && (
        <div className="groan-card-scores">
          <div className="groan-score-item">
            <span className="groan-score-label">Fear Level</span>
            <span className="groan-score-value scary">
              <span className="groan-score-emoji">😰</span>
              {challenge.scary_score}/10
            </span>
          </div>
          <div className="groan-score-item">
            <span className="groan-score-label">Excitement</span>
            <span className="groan-score-value wahoo">
              <span className="groan-score-emoji">🎉</span>
              {challenge.wahoo_score}/10
            </span>
          </div>
        </div>
      )}

      {/* Essence zone insight */}
      {isEssenceZone && challenge.essence_insight && (
        <div className="groan-essence-insight">
          <div className="groan-essence-insight-title">Why This Matters</div>
          <p className="groan-essence-insight-text">{challenge.essence_insight}</p>
        </div>
      )}

      {/* Completion criteria */}
      {challenge.completion_criteria && !compact && (
        <div className="groan-card-criteria">
          <div className="groan-card-criteria-label">Done when:</div>
          <div className="groan-card-criteria-text">
            <span className="groan-card-criteria-icon">✓</span>
            {challenge.completion_criteria}
          </div>
        </div>
      )}

      {/* Why this matters (non-essence zone) */}
      {!isEssenceZone && challenge.why_this_matters && !compact && (
        <p className="groan-card-why">{challenge.why_this_matters}</p>
      )}

      {/* Alternative version */}
      {showAlternative && challenge.alternative_version && !compact && (
        <div className="groan-card-alternative">
          <div
            className="groan-card-alternative-header"
            onClick={() => setShowAlt(!showAlt)}
            style={{ cursor: 'pointer' }}
          >
            <span>🌱</span>
            <span>Feeling overwhelmed? {showAlt ? 'Hide' : 'See'} gentler version</span>
          </div>
          {showAlt && (
            <p className="groan-card-alternative-text">
              {challenge.alternative_version}
            </p>
          )}
        </div>
      )}

      {/* Reflection (if completed) */}
      {status === 'completed' && challenge.reflection_text && (
        <div className="groan-card-reflection">
          <div className="groan-card-reflection-label">Your Reflection</div>
          <p className="groan-card-reflection-text">{challenge.reflection_text}</p>
        </div>
      )}

      {/* Post-completion scores */}
      {status === 'completed' && challenge.scary_score_after && (
        <div className="groan-card-scores" style={{ marginTop: '1rem' }}>
          <div className="groan-score-item">
            <span className="groan-score-label">Fear After</span>
            <span className="groan-score-value scary">
              <span className="groan-score-emoji">😰</span>
              {challenge.scary_score_after}/10
            </span>
          </div>
          <div className="groan-score-item">
            <span className="groan-score-label">Excitement After</span>
            <span className="groan-score-value wahoo">
              <span className="groan-score-emoji">🎉</span>
              {challenge.wahoo_score_after}/10
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="groan-card-actions">
        {/* Generated: Accept or Skip */}
        {status === 'generated' && (
          <>
            <button
              className="groan-card-btn groan-card-btn-accept"
              onClick={() => onAccept && onAccept(challenge)}
            >
              <span>💪</span> Accept Challenge
            </button>
            <button
              className="groan-card-btn groan-card-btn-skip"
              onClick={() => onSkip && onSkip(challenge)}
            >
              Skip
            </button>
          </>
        )}

        {/* Accepted: Complete or Regenerate */}
        {status === 'accepted' && (
          <>
            <button
              className="groan-card-btn groan-card-btn-complete"
              onClick={() => onComplete && onComplete(challenge)}
            >
              <span>✓</span> Mark Complete
            </button>
            <button
              className="groan-card-btn groan-card-btn-skip"
              onClick={() => onSkip && onSkip(challenge)}
            >
              Can't do it
            </button>
          </>
        )}

        {/* Completed: Regenerate option */}
        {status === 'completed' && onRegenerate && (
          <button
            className="groan-card-btn groan-card-btn-regenerate"
            onClick={() => onRegenerate(challenge)}
          >
            <span>🔄</span> New Challenge
          </button>
        )}

        {/* Skipped: Regenerate */}
        {status === 'skipped' && onRegenerate && (
          <button
            className="groan-card-btn groan-card-btn-regenerate"
            onClick={() => onRegenerate(challenge)}
          >
            <span>🔄</span> Try Different Challenge
          </button>
        )}
      </div>
    </div>
  )
}

export default GroanChallengeCard
