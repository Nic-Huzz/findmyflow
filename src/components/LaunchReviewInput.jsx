/**
 * LaunchReviewInput.jsx
 *
 * Multi-step post-launch review form with slides for each question.
 * Steps:
 *   1. What was a win? (text)
 *   2. What was a key learning? (text)
 *   3. What surprised you? (text)
 *   4. What would you do differently next time? (text)
 *   5. Overall satisfaction? (slider)
 */

import { useState } from 'react'
import './LaunchReviewInput.css'

const REVIEW_STEPS = [
  {
    id: 'win',
    question: 'What was a win?',
    description: 'Celebrate something that went well during your launch, no matter how small.',
    placeholder: 'Describe something that went well during your launch...',
    icon: '🎉',
    inputType: 'text'
  },
  {
    id: 'key_learning',
    question: 'What was a key learning?',
    description: 'What insight will you carry forward to your next launch?',
    placeholder: "What's the most important thing you learned?",
    icon: '💡',
    inputType: 'text'
  },
  {
    id: 'surprise',
    question: 'What surprised you?',
    description: 'Something unexpected—good or bad—that you didn\'t anticipate.',
    placeholder: 'What happened that you didn\'t expect?',
    icon: '😮',
    inputType: 'text'
  },
  {
    id: 'do_differently',
    question: 'What would you do differently?',
    description: 'If you could go back, what one thing would you change?',
    placeholder: 'If you could go back, what would you change?',
    icon: '🔄',
    inputType: 'text'
  },
  {
    id: 'overall_satisfaction',
    question: 'Overall satisfaction?',
    description: 'How satisfied are you with how the launch went?',
    icon: '⭐',
    inputType: 'slider',
    lowLabel: 'Disappointed',
    highLabel: 'Thrilled'
  }
]

function LaunchReviewInput({ quest, onComplete, projectId, challengeInstanceId }) {
  const [step, setStep] = useState(1)
  const [responses, setResponses] = useState({
    win: '',
    key_learning: '',
    surprise: '',
    do_differently: '',
    overall_satisfaction: 5
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalSteps = REVIEW_STEPS.length
  const currentStep = REVIEW_STEPS[step - 1]

  const canContinue = () => {
    const stepData = REVIEW_STEPS[step - 1]
    if (stepData.inputType === 'slider') {
      return true // Slider always has a value
    }
    return responses[stepData.id]?.trim().length >= 5
  }

  const handleTextChange = (value) => {
    setResponses(prev => ({
      ...prev,
      [currentStep.id]: value
    }))
  }

  const handleSliderChange = (value) => {
    setResponses(prev => ({
      ...prev,
      [currentStep.id]: parseInt(value)
    }))
  }

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const reviewData = {
        ...responses,
        project_id: projectId || null,
        challenge_instance_id: challengeInstanceId || null,
        quest_category: quest.category,
        completed_at: new Date().toISOString()
      }

      await onComplete(quest, reviewData)
    } catch (error) {
      console.error('Error submitting launch review:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSatisfactionEmoji = (value) => {
    if (value <= 2) return '😔'
    if (value <= 4) return '😐'
    if (value <= 6) return '🙂'
    if (value <= 8) return '😊'
    return '🤩'
  }

  return (
    <div className="launch-review-input">
      {/* Progress indicator */}
      <div className="launch-review-progress">
        <div className="progress-dots">
          {REVIEW_STEPS.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${index + 1 === step ? 'active' : ''} ${index + 1 < step ? 'completed' : ''}`}
            />
          ))}
        </div>
        <span className="progress-text">Step {step} of {totalSteps}</span>
      </div>

      {/* Current step content */}
      <div className="launch-review-step">
        <div className="step-header">
          <span className="step-icon">{currentStep.icon}</span>
          <h4>{currentStep.question}</h4>
        </div>
        <p className="step-description">{currentStep.description}</p>

        {currentStep.inputType === 'text' ? (
          <div className="text-input-wrapper">
            <textarea
              className="launch-review-textarea"
              value={responses[currentStep.id]}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={currentStep.placeholder}
              rows={4}
              autoFocus
            />
            <div className="char-hint">
              {responses[currentStep.id].length < 5
                ? `${5 - responses[currentStep.id].length} more characters needed`
                : '✓ Ready to continue'}
            </div>
          </div>
        ) : (
          <div className="slider-input-wrapper">
            <div className="satisfaction-display">
              <span className="satisfaction-emoji">{getSatisfactionEmoji(responses.overall_satisfaction)}</span>
              <span className="satisfaction-value">{responses.overall_satisfaction}/10</span>
            </div>
            <div className="slider-container">
              <span className="slider-label low">{currentStep.lowLabel}</span>
              <input
                type="range"
                min="1"
                max="10"
                value={responses.overall_satisfaction}
                onChange={(e) => handleSliderChange(e.target.value)}
                className="satisfaction-slider"
              />
              <span className="slider-label high">{currentStep.highLabel}</span>
            </div>
          </div>
        )}
      </div>

      {/* Summary on last step */}
      {step === totalSteps && (
        <div className="review-summary">
          <h5>Your Launch Review</h5>
          <div className="summary-items">
            <div className="summary-item">
              <span className="summary-icon">🎉</span>
              <span className="summary-text">{responses.win}</span>
            </div>
            <div className="summary-item">
              <span className="summary-icon">💡</span>
              <span className="summary-text">{responses.key_learning}</span>
            </div>
            <div className="summary-item">
              <span className="summary-icon">😮</span>
              <span className="summary-text">{responses.surprise}</span>
            </div>
            <div className="summary-item">
              <span className="summary-icon">🔄</span>
              <span className="summary-text">{responses.do_differently}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="launch-review-navigation">
        {step > 1 && (
          <button className="nav-btn back" onClick={handleBack}>
            ← Back
          </button>
        )}

        {step < totalSteps ? (
          <button
            className="nav-btn next"
            onClick={handleNext}
            disabled={!canContinue()}
          >
            Continue →
          </button>
        ) : (
          <button
            className="nav-btn complete"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : `Complete Review (+${quest.points} pts)`}
          </button>
        )}
      </div>

      {/* Encouragement message */}
      {step === totalSteps && (
        <p className="launch-review-encouragement">
          Every launch teaches you something. This reflection will help you grow.
        </p>
      )}
    </div>
  )
}

export default LaunchReviewInput
