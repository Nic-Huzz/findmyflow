/**
 * CompassCheck - Reusable 2-tap compass check-in component
 *
 * Embeds in any modal/flow to capture emotional state.
 * Matches FlowCompassPage quick-log UI pattern.
 *
 * Props:
 * - onComplete({ internalState, externalState, direction }) - called when both tapped
 * - onSkip() - optional skip handler
 */

import { useState } from 'react'
import { deriveDirection, getDirectionLabel } from '../lib/compassEntryHelper'
import './CompassCheck.css'

function CompassCheck({ onComplete, onSkip }) {
  const [internalState, setInternalState] = useState(null) // 'excited' | 'tired'
  const [externalState, setExternalState] = useState(null) // 'ease' | 'resistance'

  const direction = (internalState && externalState)
    ? deriveDirection(internalState, externalState)
    : null

  const handleComplete = () => {
    if (direction) {
      onComplete({ internalState, externalState, direction })
    }
  }

  return (
    <div className="compass-check">
      <div className="compass-check-header">
        <span className="compass-check-icon">🧭</span>
        <h4 className="compass-check-title">Quick Compass Check</h4>
        <p className="compass-check-subtitle">How are you feeling right now?</p>
      </div>

      {/* Energy Question */}
      <div className="compass-check-question">
        <label className="compass-check-label">Are you feeling excited?</label>
        <div className="compass-check-options">
          <button
            className={`compass-check-btn ${internalState === 'excited' ? 'selected' : ''}`}
            onClick={() => setInternalState('excited')}
          >
            <span className="compass-check-emoji">🔥</span>
            <span>Excited</span>
          </button>
          <button
            className={`compass-check-btn ${internalState === 'tired' ? 'selected' : ''}`}
            onClick={() => setInternalState('tired')}
          >
            <span className="compass-check-emoji">😴</span>
            <span>Tired</span>
          </button>
        </div>
      </div>

      {/* Flow Question */}
      <div className="compass-check-question">
        <label className="compass-check-label">How is the business flowing?</label>
        <div className="compass-check-options">
          <button
            className={`compass-check-btn ${externalState === 'ease' ? 'selected' : ''}`}
            onClick={() => setExternalState('ease')}
          >
            <span className="compass-check-emoji">✨</span>
            <span>Great</span>
          </button>
          <button
            className={`compass-check-btn ${externalState === 'resistance' ? 'selected' : ''}`}
            onClick={() => setExternalState('resistance')}
          >
            <span className="compass-check-emoji">🧗</span>
            <span>Facing resistance</span>
          </button>
        </div>
      </div>

      {/* Direction Preview */}
      {direction && (
        <div className={`compass-check-preview direction-${direction}`}>
          <span className="compass-check-arrow">→</span>
          <span>{getDirectionLabel(direction)}</span>
        </div>
      )}

      {/* Actions */}
      <div className="compass-check-actions">
        {onSkip && (
          <button className="compass-check-skip" onClick={onSkip}>
            Skip
          </button>
        )}
        <button
          className="compass-check-complete"
          onClick={handleComplete}
          disabled={!direction}
        >
          Complete
        </button>
      </div>
    </div>
  )
}

export default CompassCheck
