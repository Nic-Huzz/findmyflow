/**
 * ResponseCounterInput - Shows live response counter for validation/feedback forms
 *
 * Features:
 * - Live counter showing X/target responses
 * - Progress bar visualization
 * - Points earned per response display
 * - Link to create/manage forms
 * - Auto-completes when target is reached
 * - POST-ACTION reflection modal on completion
 *
 * Test Mode: Add ?testPostAction=true to URL to show test button
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import CompassCheck from './CompassCheck'
import { createCompassEntry } from '../lib/compassEntryHelper'
import './ResponseCounterInput.css'

function ResponseCounterInput({
  quest,
  responseCount = 0,
  onComplete
}) {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const testMode = searchParams.get('testPostAction') === 'true'

  const target = quest.target_responses || 3
  const pointsPerResponse = quest.points_per_response || 8
  const pointsEarned = Math.min(responseCount, target) * pointsPerResponse
  const isComplete = responseCount >= target
  const progressPercent = Math.min((responseCount / target) * 100, 100)

  // POST-ACTION state
  const [showPostAction, setShowPostAction] = useState(false)
  const [postFeeling, setPostFeeling] = useState(null)
  const [threePercent, setThreePercent] = useState('')
  const [compassStep, setCompassStep] = useState(false)

  // Handle opening POST-ACTION modal
  const handleCompleteClick = () => {
    setShowPostAction(true)
  }

  // Handle POST-ACTION feeling selection
  const handleFeelingSelect = (feeling) => {
    setPostFeeling(feeling)
  }

  // Transition to compass step after feeling/reflection
  const handleContinueToCompass = () => {
    setCompassStep(true)
  }

  // Handle final completion with POST-ACTION data + compass
  const doFinalComplete = async (compass) => {
    // Create compass entry if data available
    if (compass && user?.id) {
      await createCompassEntry({
        userId: user.id,
        projectId: null,
        internalState: compass.internalState,
        externalState: compass.externalState,
        activityDescription: 'Validation Complete',
        reasoning: threePercent.trim() || 'Validation reflection'
      })
    }

    const postActionData = {
      responseCount,
      pointsEarned,
      post_action: {
        post_feeling: postFeeling,
        three_percent_reflection: threePercent.trim() || null,
        compass_direction: compass?.direction || null,
        timestamp: new Date().toISOString()
      }
    }

    setShowPostAction(false)
    setCompassStep(false)
    onComplete(quest, postActionData)
  }

  // Feeling options
  const feelingOptions = [
    { id: 'easier_than_expected', emoji: '😌', label: 'Easier than expected' },
    { id: 'as_expected', emoji: '😐', label: 'As expected' },
    { id: 'harder_than_expected', emoji: '😰', label: 'Harder than expected' },
    { id: 'didnt_finish', emoji: '❌', label: 'Didn\'t finish' }
  ]

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

      {/* Action link - uses plain <a> to avoid React Router startTransition
         which silently prevents lazy-loaded pages from rendering */}
      {quest.actionLink && (
        <a href={quest.actionLink} className="response-action-link">
          Create / View Form
        </a>
      )}

      {/* Complete button - shown when target reached but not yet marked complete */}
      {isComplete && (
        <button
          className="quest-complete-btn"
          onClick={handleCompleteClick}
        >
          Complete Quest (+{quest.points} pts)
        </button>
      )}

      {/* Test mode button - only shows with ?testPostAction=true */}
      {testMode && !isComplete && (
        <button
          className="quest-complete-btn test-mode-btn"
          onClick={handleCompleteClick}
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            marginTop: '8px'
          }}
        >
          🧪 Test POST-ACTION Modal
        </button>
      )}

      {/* POST-ACTION Modal - Rendered via Portal to escape stacking context */}
      {showPostAction && createPortal(
        <div className="post-action-overlay rc-post-action" onClick={() => setShowPostAction(false)}>
          <div className="post-action-modal rc-post-action" onClick={(e) => e.stopPropagation()}>
            <div className="post-action-header">
              <div className="post-action-icon">✅</div>
              <h3 className="post-action-title">Validation Complete!</h3>
              <p className="post-action-subtitle">
                You collected {responseCount} responses for your validation survey.
              </p>
            </div>

            <div className="post-action-divider"></div>

            {/* Feeling Question */}
            <div className="post-action-section">
              <h4 className="post-action-question">How was the validation process overall?</h4>
              <div className="post-action-feelings">
                {feelingOptions.map(option => (
                  <button
                    key={option.id}
                    className={`post-action-feeling ${postFeeling === option.id ? 'selected' : ''}`}
                    onClick={() => handleFeelingSelect(option.id)}
                  >
                    <span className="feeling-emoji">{option.emoji}</span>
                    <span className="feeling-label">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="post-action-divider"></div>

            {/* 3% Reflection */}
            <div className="post-action-section">
              <h4 className="post-action-question">
                What would make the validation process 3% better next time?
              </h4>
              <textarea
                className="post-action-textarea"
                placeholder="e.g., Ask about their budget earlier in the form..."
                value={threePercent}
                onChange={(e) => setThreePercent(e.target.value)}
                rows={3}
              />
              <p className="post-action-hint">Optional — your insights compound over time</p>
            </div>

            {/* Compass Check or Complete Button */}
            {compassStep ? (
              <div className="post-action-section">
                <CompassCheck
                  onComplete={(data) => {
                    doFinalComplete(data)
                  }}
                  onSkip={() => doFinalComplete(null)}
                />
              </div>
            ) : (
              <button
                className="post-action-complete-btn"
                onClick={handleContinueToCompass}
                disabled={!postFeeling}
              >
                Continue →
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default ResponseCounterInput
