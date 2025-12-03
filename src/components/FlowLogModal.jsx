import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import FlowCompass from './FlowCompass'
import { getDirectionColor, getDirectionLabel, getDirectionFullLabel, validateFlowEntry } from '../lib/flowCompass'

/**
 * FlowLogModal - Modal for logging a flow entry
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - projectId: uuid (optional)
 * - challengeInstanceId: uuid (optional)
 * - onSuccess: (entryId) => void (optional callback after successful log)
 */

const FlowLogModal = ({
  isOpen,
  onClose,
  projectId = null,
  challengeInstanceId = null,
  onSuccess
}) => {
  const { user } = useAuth()
  const [step, setStep] = useState(1) // 1: compass, 2: reasoning
  const [direction, setDirection] = useState(null)
  const [internalState, setInternalState] = useState(null)
  const [externalState, setExternalState] = useState(null)
  const [reasoning, setReasoning] = useState('')
  const [activityDescription, setActivityDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Reset state when modal closes
  const handleClose = () => {
    setStep(1)
    setDirection(null)
    setInternalState(null)
    setExternalState(null)
    setReasoning('')
    setActivityDescription('')
    setError(null)
    onClose()
  }

  const handleCompassSelect = (dir, internal, external) => {
    setDirection(dir)
    setInternalState(internal)
    setExternalState(external)
    setStep(2)
  }

  const handleSubmit = async () => {
    if (!user?.id) {
      setError('Please sign in to log flow')
      return
    }

    // Validate entry
    const entryData = {
      direction,
      internal_state: internalState,
      external_state: externalState,
      reasoning
    }

    const validation = validateFlowEntry(entryData)
    if (!validation.valid) {
      setError(validation.errors[0])
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Insert flow entry
      const { data: newEntry, error: insertError } = await supabase
        .from('flow_entries')
        .insert({
          user_id: user.id,
          project_id: projectId,
          direction,
          internal_state: internalState,
          external_state: externalState,
          reasoning,
          activity_description: activityDescription || null,
          challenge_instance_id: challengeInstanceId
        })
        .select()
        .single()

      if (insertError) throw insertError

      console.log('✅ Flow entry logged:', newEntry.id)

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(newEntry.id)
      }

      // Close modal
      handleClose()
    } catch (err) {
      console.error('Error logging flow entry:', err)
      setError(err.message || 'Failed to log flow entry')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content flow-log-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="modal-close" onClick={handleClose} aria-label="Close">
          ×
        </button>

        {/* Step 1: Compass Selection */}
        {step === 1 && (
          <div className="flow-log-step">
            <h3>How did things flow?</h3>
            <p className="step-description">
              Select the direction that matches your experience
            </p>

            <FlowCompass
              onSelect={handleCompassSelect}
              selectedDirection={direction}
              size="large"
            />

            <div className="compass-help">
              <p><strong>How to choose:</strong></p>
              <ul>
                <li><strong>Excited + Ease (North)</strong> → Things are flowing, keep going!</li>
                <li><strong>Excited + Resistance (East)</strong> → You love it but it's hard, try a new approach</li>
                <li><strong>Tired + Resistance (South)</strong> → Time to rest or reconsider</li>
                <li><strong>Tired + Ease (West)</strong> → Something new appeared, explore it</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: Reasoning Input */}
        {step === 2 && (
          <div className="flow-log-step">
            <div
              className="selected-direction-badge"
              style={{ backgroundColor: getDirectionColor(direction) }}
            >
              <span className="badge-label">{getDirectionFullLabel(direction)}</span>
            </div>

            <div className="form-group">
              <label htmlFor="activity">What were you doing?</label>
              <input
                id="activity"
                type="text"
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                placeholder="e.g., Customer call, Writing content, Coding..."
                className="form-input"
              />
              <span className="form-hint">Optional - helps track patterns</span>
            </div>

            <div className="form-group">
              <label htmlFor="reasoning">What happened? Why this direction? *</label>
              <textarea
                id="reasoning"
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="e.g., The conversation went great and they asked about pricing. I felt excited and it flowed naturally..."
                rows={5}
                required
                className="form-input"
              />
              <span className="form-hint">
                {reasoning.length}/10 characters minimum
              </span>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="modal-actions">
              <button
                onClick={() => setStep(1)}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reasoning || reasoning.trim().length < 10 || isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? 'Logging...' : 'Log Flow'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FlowLogModal
