/**
 * GroanSkipModal.jsx
 * Modal for capturing feedback when user skips a challenge
 *
 * Collects skip reason for protective pattern detection:
 * - too_scary: Fear is blocking them
 * - not_relevant: Challenge doesn't fit their situation
 * - already_do_this: Already past this comfort zone
 * - dont_understand: Challenge is unclear
 * - other: Custom reason
 */

import { useState } from 'react'
import { skipGroanChallenge } from '../lib/crm'
import { GROAN_SKIP_REASONS } from '../lib/stageConfig'
import './GroanSkipModal.css'

const SKIP_REASON_OPTIONS = [
  {
    id: 'too_scary',
    label: 'Too scary right now',
    emoji: '😰',
    description: 'The fear feels overwhelming'
  },
  {
    id: 'not_relevant',
    label: 'Not relevant to me',
    emoji: '🤷',
    description: "Doesn't fit my situation"
  },
  {
    id: 'already_do_this',
    label: 'Already do this',
    emoji: '✓',
    description: "I'm past this comfort zone"
  },
  {
    id: 'dont_understand',
    label: "Don't understand it",
    emoji: '❓',
    description: 'The challenge is unclear'
  },
  {
    id: 'other',
    label: 'Other reason',
    emoji: '💬',
    description: 'Something else...'
  }
]

function GroanSkipModal({ challenge, onSkip, onClose, onRegenerate }) {
  const [selectedReason, setSelectedReason] = useState(null)
  const [customFeedback, setCustomFeedback] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSkip = async () => {
    if (!selectedReason) return

    setSaving(true)

    try {
      await skipGroanChallenge(challenge.id, {
        skipReason: selectedReason,
        skipFeedback: selectedReason === 'other' ? customFeedback : null
      })

      if (onSkip) {
        onSkip({
          challengeId: challenge.id,
          reason: selectedReason,
          feedback: customFeedback
        })
      }

      onClose()
    } catch (error) {
      console.error('Error skipping challenge:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerate = async () => {
    // Skip with feedback then regenerate
    if (selectedReason) {
      await skipGroanChallenge(challenge.id, {
        skipReason: selectedReason,
        skipFeedback: selectedReason === 'other' ? customFeedback : null
      })
    }

    if (onRegenerate) {
      onRegenerate(challenge)
    }

    onClose()
  }

  return (
    <div className="groan-skip-overlay" onClick={onClose}>
      <div
        className="groan-skip-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="groan-skip-header">
          <h3 className="groan-skip-title">Skip this challenge?</h3>
          <p className="groan-skip-subtitle">
            Help us understand why so we can suggest better challenges
          </p>
        </div>

        <div className="groan-skip-body">
          <div className="groan-skip-options">
            {SKIP_REASON_OPTIONS.map(option => (
              <button
                key={option.id}
                className={`groan-skip-option ${selectedReason === option.id ? 'selected' : ''}`}
                onClick={() => setSelectedReason(option.id)}
              >
                <span className="groan-skip-option-emoji">{option.emoji}</span>
                <div className="groan-skip-option-content">
                  <span className="groan-skip-option-label">{option.label}</span>
                  <span className="groan-skip-option-desc">{option.description}</span>
                </div>
              </button>
            ))}
          </div>

          {selectedReason === 'other' && (
            <textarea
              className="groan-skip-feedback"
              value={customFeedback}
              onChange={(e) => setCustomFeedback(e.target.value)}
              placeholder="Tell us more..."
            />
          )}

          {/* Protective pattern insight for "too_scary" */}
          {selectedReason === 'too_scary' && (
            <div className="groan-skip-insight">
              <span className="groan-skip-insight-icon">💡</span>
              <p className="groan-skip-insight-text">
                Feeling overwhelmed by fear can be a sign your <strong>protective voice</strong> is
                speaking. Would you like a gentler version of this challenge, or something
                completely different?
              </p>
            </div>
          )}
        </div>

        <div className="groan-skip-actions">
          <button
            className="groan-skip-btn groan-skip-btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          {selectedReason === 'too_scary' && onRegenerate ? (
            <button
              className="groan-skip-btn groan-skip-btn-regenerate"
              onClick={handleRegenerate}
              disabled={saving}
            >
              Try Different Challenge
            </button>
          ) : (
            <button
              className="groan-skip-btn groan-skip-btn-skip"
              onClick={handleSkip}
              disabled={!selectedReason || saving}
            >
              {saving ? 'Skipping...' : 'Skip Challenge'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default GroanSkipModal
