/**
 * CompassCheckin.jsx
 *
 * Lightweight compass energy check-in, used after completing
 * a Play-list courage challenge. Same N/E/S/W model as FlowCompassInput
 * but simpler — no project check, just energy + flow + optional comment.
 *
 * Props:
 * - onComplete(data) — called with { direction, internal_state, external_state, activity_description, reasoning }
 * - onSkip() — called when user skips the check-in
 * - challengeTitle — optional, used for activity_description
 */

import { useState } from 'react'
import './FlowCompassInput.css'

export default function CompassCheckin({ onComplete, onSkip, challengeTitle }) {
  const [selectedEnergy, setSelectedEnergy] = useState(null)
  const [selectedFlow, setSelectedFlow] = useState(null)
  const [comment, setComment] = useState('')

  const getDirection = () => {
    if (selectedEnergy === 'excited' && selectedFlow === 'ease') return 'north'
    if (selectedEnergy === 'excited' && selectedFlow === 'resistance') return 'east'
    if (selectedEnergy === 'tired' && selectedFlow === 'resistance') return 'south'
    if (selectedEnergy === 'tired' && selectedFlow === 'ease') return 'west'
    return null
  }

  const getDirectionLabel = () => {
    const dir = getDirection()
    if (dir === 'north') return 'Flow'
    if (dir === 'east') return 'Redirect'
    if (dir === 'south') return 'Rest'
    if (dir === 'west') return 'Honour'
    return ''
  }

  const getDirectionEmoji = () => {
    const dir = getDirection()
    if (dir === 'north') return '🌊'
    if (dir === 'east') return '🔄'
    if (dir === 'south') return '🛏️'
    if (dir === 'west') return '🙏'
    return ''
  }

  const handleSubmit = () => {
    if (!selectedEnergy || !selectedFlow) return

    onComplete({
      direction: getDirection(),
      internal_state: selectedEnergy,
      external_state: selectedFlow,
      activity_description: challengeTitle ? `Play-list: ${challengeTitle}` : 'Play-list courage challenge',
      reasoning: comment.trim() || 'Post-challenge energy check'
    })
  }

  return (
    <div className="flow-compass-input compass-checkin-modal">
      <div className="groan-modal-header">
        <span className="groan-modal-layer groan-modal-layer-compass">ENERGY CHECK</span>
        <h2>How are you feeling after that challenge?</h2>
      </div>

      <div className="checkin-view">
        {/* Energy Question */}
        <div className="question-group">
          <h4 className="question-heading">Are you feeling excited or tired?</h4>
          <div className="button-row">
            <button
              className={`energy-btn energy-excited ${selectedEnergy === 'excited' ? 'selected' : ''}`}
              onClick={() => setSelectedEnergy('excited')}
            >
              <span className="option-emoji">🔥</span>
              <span>Excited</span>
            </button>
            <button
              className={`energy-btn energy-tired ${selectedEnergy === 'tired' ? 'selected' : ''}`}
              onClick={() => setSelectedEnergy('tired')}
            >
              <span className="option-emoji">😴</span>
              <span>Tired</span>
            </button>
          </div>
        </div>

        {/* Flow Question */}
        <div className="question-group">
          <h4 className="question-heading">How did it flow?</h4>
          <div className="button-row">
            <button
              className={`flow-btn flow-great ${selectedFlow === 'ease' ? 'selected' : ''}`}
              onClick={() => setSelectedFlow('ease')}
            >
              <span className="option-emoji">✨</span>
              <span>Great</span>
            </button>
            <button
              className={`flow-btn flow-resistance ${selectedFlow === 'resistance' ? 'selected' : ''}`}
              onClick={() => setSelectedFlow('resistance')}
            >
              <span className="option-emoji">🧗</span>
              <span>Resistance</span>
            </button>
          </div>
        </div>

        {/* Direction Preview */}
        {selectedEnergy && selectedFlow && (
          <div className={`direction-preview direction-${getDirection()}`}>
            <span className="direction-emoji">{getDirectionEmoji()}</span>
            <span className="direction-label">{getDirectionLabel()}</span>
          </div>
        )}

        {/* Optional Comment */}
        <div className="input-group">
          <label>Reflection (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How did the challenge make you feel?"
            rows="2"
            className="comment-textarea"
          />
        </div>

        {/* Actions */}
        <div className="compass-checkin-actions">
          <button
            className="groan-btn groan-btn-complete"
            onClick={handleSubmit}
            disabled={!selectedEnergy || !selectedFlow}
          >
            Save Compass Check-in
          </button>
          <button
            className="groan-btn groan-btn-skip"
            onClick={onSkip}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
