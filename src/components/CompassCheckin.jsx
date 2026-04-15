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
import './GroanCompletionModal.css'

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
    <div className="compass-checkin-modal">
      <h2 className="gcm-title">Compass Check-in</h2>
      <p className="gcm-subtitle">How are you feeling after that challenge?</p>

      <div className="gcm-form">
        {/* Energy Question */}
        <div>
          <label>Are you feeling excited or tired?</label>
          <div className="gcm-toggle-row" style={{ marginTop: 6 }}>
            <button
              className={`gcm-toggle ${selectedEnergy === 'excited' ? 'active yes' : ''}`}
              onClick={() => setSelectedEnergy('excited')}
            >
              🔥 Excited
            </button>
            <button
              className={`gcm-toggle ${selectedEnergy === 'tired' ? 'active no' : ''}`}
              onClick={() => setSelectedEnergy('tired')}
            >
              😴 Tired
            </button>
          </div>
        </div>

        {/* Flow Question */}
        <div>
          <label>How did it flow?</label>
          <div className="gcm-toggle-row" style={{ marginTop: 6 }}>
            <button
              className={`gcm-toggle ${selectedFlow === 'ease' ? 'active yes' : ''}`}
              onClick={() => setSelectedFlow('ease')}
            >
              ✨ Great
            </button>
            <button
              className={`gcm-toggle ${selectedFlow === 'resistance' ? 'active no' : ''}`}
              onClick={() => setSelectedFlow('resistance')}
            >
              🧗 Resistance
            </button>
          </div>
        </div>

        {/* Direction Preview */}
        {selectedEnergy && selectedFlow && (
          <div className="flow-compass-input" style={{ padding: 0, margin: 0 }}>
            <div className={`direction-preview direction-${getDirection()}`}>
              <span className="direction-emoji">{getDirectionEmoji()}</span>
              <span className="direction-label">{getDirectionLabel()}</span>
            </div>
          </div>
        )}

        {/* Optional Comment */}
        <div>
          <label>Reflection (optional)</label>
          <textarea
            className="gcm-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How did the challenge make you feel?"
            rows={2}
          />
        </div>
      </div>

      <button
        className="gcm-gold-btn"
        onClick={handleSubmit}
        disabled={!selectedEnergy || !selectedFlow}
      >
        Save Compass Check-in
      </button>
      <button className="gcm-skip-btn" onClick={onSkip}>
        Skip
      </button>
    </div>
  )
}
