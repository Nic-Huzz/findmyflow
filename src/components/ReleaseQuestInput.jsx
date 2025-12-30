/**
 * ReleaseQuestInput - Multi-step slider UI for Release quests (Healing tab)
 *
 * Handles 3 Release quest types with structured data capture:
 * - release_daily_challenge (Daily Release Challenge)
 * - release_negative_charge (Processing Your Emotions)
 * - release_weekly_big (Big Release)
 */

import { useState } from 'react'
import './ReleaseQuestInput.css'

// Release quest IDs
const RELEASE_QUEST_IDS = [
  'release_daily_challenge',
  'release_negative_charge',
  'release_weekly_big'
]

// Emotions for processing
const EMOTIONS = [
  { id: 'anger', label: 'Anger', icon: '😤', description: 'Frustration, irritation, rage' },
  { id: 'fear', label: 'Fear', icon: '😰', description: 'Anxiety, worry, dread' },
  { id: 'shame', label: 'Shame', icon: '😔', description: 'Feeling fundamentally flawed' },
  { id: 'guilt', label: 'Guilt', icon: '😞', description: 'Regret over actions' },
  { id: 'grief', label: 'Grief', icon: '😢', description: 'Loss, sadness, mourning' },
  { id: 'frustration', label: 'Frustration', icon: '😫', description: 'Stuck, blocked, helpless' }
]

// Release methods (90-second practices)
const RELEASE_METHODS = [
  { id: 'journaling', label: 'Journaling', icon: '📝' },
  { id: 'breathwork', label: 'Breathwork', icon: '🌬️' },
  { id: 'movement', label: 'Movement', icon: '🏃' },
  { id: 'crying', label: 'Crying', icon: '😭' },
  { id: 'shaking', label: 'Shaking', icon: '🫨' },
  { id: 'screaming', label: 'Screaming', icon: '😱' }
]

// Triggers
const TRIGGERS = [
  { id: 'work', label: 'Work', icon: '💼' },
  { id: 'relationship', label: 'Relationship', icon: '💔' },
  { id: 'self', label: 'Self', icon: '🪞' },
  { id: 'money', label: 'Money', icon: '💰' },
  { id: 'health', label: 'Health', icon: '🏥' },
  { id: 'other', label: 'Other', icon: '❓' }
]

// Body locations
const BODY_LOCATIONS = [
  { id: 'head', label: 'Head', icon: '🧠' },
  { id: 'throat', label: 'Throat', icon: '🗣️' },
  { id: 'chest', label: 'Chest', icon: '💗' },
  { id: 'stomach', label: 'Stomach', icon: '🫃' },
  { id: 'whole_body', label: 'Whole Body', icon: '🧍' }
]

// Big Release practice types
const BIG_RELEASE_TYPES = [
  { id: 'holotropic', label: 'Holotropic Breathwork', icon: '🌀' },
  { id: 'rage_ritual', label: 'Rage Ritual', icon: '🔥' },
  { id: 'somatic', label: 'Somatic Release', icon: '💆' },
  { id: 'ecstatic_dance', label: 'Ecstatic Dance', icon: '💃' },
  { id: 'tre', label: 'TRE (Tremoring)', icon: '🫨' },
  { id: 'guided', label: 'Guided Release', icon: '🎧' }
]

// Duration options for big release
const BIG_RELEASE_DURATIONS = [
  { id: '30-45', label: '30-45 min' },
  { id: '45-60', label: '45-60 min' },
  { id: '60-90', label: '60-90 min' },
  { id: '90+', label: '90+ min' }
]

// Depth levels
const DEPTH_LEVELS = [
  { id: 1, label: 'Surface', emoji: '🌊' },
  { id: 2, label: 'Medium', emoji: '🌀' },
  { id: 3, label: 'Deep', emoji: '🕳️' },
  { id: 4, label: 'Cathartic', emoji: '🌋' }
]

// Outcome feelings for big release
const RELEASE_OUTCOMES = [
  { id: 'lighter', label: 'Lighter', icon: '✨' },
  { id: 'raw', label: 'Raw', icon: '🫀' },
  { id: 'processing', label: 'Processing', icon: '🌊' },
  { id: 'transformed', label: 'Transformed', icon: '🦋' }
]

// Step configurations for each quest type
const STEP_CONFIG = {
  release_daily_challenge: {
    totalSteps: 4,
    stepTitles: ['Release Type', 'Emotion & Body', 'Intensity', 'Review']
  },
  release_negative_charge: {
    totalSteps: 3,
    stepTitles: ['What Triggered You', 'How You Released', 'Review']
  },
  release_weekly_big: {
    totalSteps: 3,
    stepTitles: ['Your Practice', 'What Surfaced', 'Review']
  }
}

function ReleaseQuestInput({ quest, onComplete, safetyContracts = [] }) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  // Form state
  const [formData, setFormData] = useState({
    // Shared
    emotion: null,
    emotions: [], // for multi-select
    beforeState: null,
    afterState: null,
    notes: '',

    // Daily Challenge
    releaseType: null,
    bodyLocation: null,
    safetyContract: null, // Which safety contract they're releasing

    // Processing Emotions
    trigger: null,
    releaseMethod: null,

    // Big Release
    practiceType: null,
    duration: null,
    depth: null,
    outcome: null
  })

  const config = STEP_CONFIG[quest.id] || { totalSteps: 2, stepTitles: ['Input', 'Review'] }
  const totalSteps = config.totalSteps

  const handleEmotionToggle = (emotionId) => {
    setFormData(prev => ({
      ...prev,
      emotions: prev.emotions.includes(emotionId)
        ? prev.emotions.filter(e => e !== emotionId)
        : [...prev.emotions, emotionId]
    }))
  }

  const handleSubmit = () => {
    setLoading(true)

    let structuredData = {}

    switch (quest.id) {
      case 'release_daily_challenge':
        structuredData = {
          quest_type: 'daily_release',
          release_type: formData.releaseType,
          emotion: formData.emotion,
          body_location: formData.bodyLocation,
          safety_contract: formData.safetyContract,
          before_state: formData.beforeState,
          after_state: formData.afterState,
          shift: formData.beforeState - formData.afterState, // Lower is better for release
          notes: formData.notes
        }
        break

      case 'release_negative_charge':
        structuredData = {
          quest_type: 'process_emotions',
          trigger: formData.trigger,
          emotion: formData.emotion,
          release_method: formData.releaseMethod,
          before_state: formData.beforeState,
          after_state: formData.afterState,
          shift: formData.beforeState - formData.afterState,
          notes: formData.notes
        }
        break

      case 'release_weekly_big':
        structuredData = {
          quest_type: 'big_release',
          practice_type: formData.practiceType,
          duration: formData.duration,
          emotions_surfaced: formData.emotions,
          depth: formData.depth,
          outcome: formData.outcome,
          notes: formData.notes
        }
        break
    }

    onComplete(quest, structuredData)
    setLoading(false)
  }

  // Check if current step is valid
  const canContinue = () => {
    switch (quest.id) {
      case 'release_daily_challenge':
        const needsContract = safetyContracts && safetyContracts.length > 0
        if (step === 1) return formData.releaseType && (!needsContract || formData.safetyContract)
        if (step === 2) return formData.emotion && formData.bodyLocation
        if (step === 3) return formData.beforeState && formData.afterState
        return true

      case 'release_negative_charge':
        if (step === 1) return formData.trigger && formData.emotion
        if (step === 2) return formData.releaseMethod && formData.beforeState && formData.afterState
        return true

      case 'release_weekly_big':
        if (step === 1) return formData.practiceType && formData.duration
        if (step === 2) return formData.emotions.length > 0 && formData.depth && formData.outcome
        return true

      default:
        return true
    }
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

  // Render step content based on quest type and current step
  const renderStepContent = () => {
    switch (quest.id) {
      case 'release_daily_challenge':
        return renderDailyChallengeSteps()
      case 'release_negative_charge':
        return renderProcessingEmotionsSteps()
      case 'release_weekly_big':
        return renderBigReleaseSteps()
      default:
        return null
    }
  }

  // Daily Release Challenge Steps
  const renderDailyChallengeSteps = () => {
    const needsContract = safetyContracts && safetyContracts.length > 0

    if (step === 1) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">🌊</span>
            <h4>Your Release</h4>
          </div>

          {needsContract && (
            <div className="release-section">
              <label className="release-label">Which safety contract are you releasing?</label>
              <p className="release-hint">Select the limiting belief you're working on</p>
              <select
                className="release-select"
                value={formData.safetyContract || ''}
                onChange={(e) => setFormData({ ...formData, safetyContract: e.target.value })}
              >
                <option value="">Select a safety contract...</option>
                {safetyContracts.map((contract, index) => (
                  <option key={index} value={contract}>
                    {contract}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="release-section">
            <label className="release-label">What type of release?</label>
            <div className="release-method-grid">
              {RELEASE_METHODS.map(method => (
                <button
                  key={method.id}
                  type="button"
                  className={`release-method-option ${formData.releaseType === method.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, releaseType: method.id })}
                >
                  <span className="release-method-icon">{method.icon}</span>
                  <span className="release-method-label">{method.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (step === 2) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">💫</span>
            <h4>What You Released</h4>
          </div>

          <div className="release-section">
            <label className="release-label">What emotion did you release?</label>
            <div className="emotion-grid">
              {EMOTIONS.map(emotion => (
                <button
                  key={emotion.id}
                  type="button"
                  className={`emotion-option ${formData.emotion === emotion.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, emotion: emotion.id })}
                >
                  <span className="emotion-icon">{emotion.icon}</span>
                  <span className="emotion-label">{emotion.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="release-section">
            <label className="release-label">Where did you feel it in your body?</label>
            <div className="body-location-grid">
              {BODY_LOCATIONS.map(loc => (
                <button
                  key={loc.id}
                  type="button"
                  className={`body-location-option ${formData.bodyLocation === loc.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, bodyLocation: loc.id })}
                >
                  <span className="body-location-icon">{loc.icon}</span>
                  <span className="body-location-label">{loc.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (step === 3) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">📊</span>
            <h4>Intensity Shift</h4>
          </div>

          {renderIntensityScale()}

          <div className="release-section">
            <label className="release-label">Any notes? (optional)</label>
            <textarea
              className="release-textarea"
              placeholder="What came up for you?"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      )
    }

    // Review step
    return renderDailyChallengeReview()
  }

  const renderDailyChallengeReview = () => (
    <div className="step-content">
      <div className="step-header">
        <span className="step-icon">🎯</span>
        <h4>Review Your Release</h4>
      </div>
      <div className="selection-summary">
        {formData.safetyContract && (
          <div className="summary-item">
            <span className="summary-label">Safety Contract</span>
            <span className="summary-value">{formData.safetyContract}</span>
          </div>
        )}
        <div className="summary-item">
          <span className="summary-label">Release Type</span>
          <span className="summary-value">
            {RELEASE_METHODS.find(m => m.id === formData.releaseType)?.icon} {RELEASE_METHODS.find(m => m.id === formData.releaseType)?.label || '-'}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Emotion</span>
          <span className="summary-value">
            {EMOTIONS.find(e => e.id === formData.emotion)?.icon} {EMOTIONS.find(e => e.id === formData.emotion)?.label || '-'}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Body Location</span>
          <span className="summary-value">
            {BODY_LOCATIONS.find(b => b.id === formData.bodyLocation)?.icon} {BODY_LOCATIONS.find(b => b.id === formData.bodyLocation)?.label || '-'}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Intensity Shift</span>
          <span className="summary-value">
            {formData.beforeState} → {formData.afterState}
            ({formData.beforeState - formData.afterState > 0 ? '-' : '+'}{Math.abs(formData.beforeState - formData.afterState)} intensity)
          </span>
        </div>
      </div>
    </div>
  )

  // Processing Your Emotions Steps
  const renderProcessingEmotionsSteps = () => {
    if (step === 1) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">⚡</span>
            <h4>What Triggered You</h4>
          </div>

          <div className="release-section">
            <label className="release-label">What triggered this emotion?</label>
            <div className="trigger-grid">
              {TRIGGERS.map(trigger => (
                <button
                  key={trigger.id}
                  type="button"
                  className={`trigger-option ${formData.trigger === trigger.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, trigger: trigger.id })}
                >
                  <span className="trigger-icon">{trigger.icon}</span>
                  <span className="trigger-label">{trigger.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="release-section">
            <label className="release-label">What emotion were you feeling?</label>
            <div className="emotion-grid">
              {EMOTIONS.map(emotion => (
                <button
                  key={emotion.id}
                  type="button"
                  className={`emotion-option ${formData.emotion === emotion.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, emotion: emotion.id })}
                >
                  <span className="emotion-icon">{emotion.icon}</span>
                  <span className="emotion-label">{emotion.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (step === 2) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">🌊</span>
            <h4>How You Released</h4>
          </div>

          <div className="release-section">
            <label className="release-label">How did you release it?</label>
            <p className="release-hint">90 seconds is often enough for the emotion to pass</p>
            <div className="release-method-grid">
              {RELEASE_METHODS.map(method => (
                <button
                  key={method.id}
                  type="button"
                  className={`release-method-option ${formData.releaseMethod === method.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, releaseMethod: method.id })}
                >
                  <span className="release-method-icon">{method.icon}</span>
                  <span className="release-method-label">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {renderIntensityScale()}
        </div>
      )
    }

    // Review step
    return (
      <div className="step-content">
        <div className="step-header">
          <span className="step-icon">🎯</span>
          <h4>Review</h4>
        </div>
        <div className="selection-summary">
          <div className="summary-item">
            <span className="summary-label">Trigger</span>
            <span className="summary-value">
              {TRIGGERS.find(t => t.id === formData.trigger)?.icon} {TRIGGERS.find(t => t.id === formData.trigger)?.label || '-'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Emotion</span>
            <span className="summary-value">
              {EMOTIONS.find(e => e.id === formData.emotion)?.icon} {EMOTIONS.find(e => e.id === formData.emotion)?.label || '-'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Release Method</span>
            <span className="summary-value">
              {RELEASE_METHODS.find(m => m.id === formData.releaseMethod)?.icon} {RELEASE_METHODS.find(m => m.id === formData.releaseMethod)?.label || '-'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Intensity Shift</span>
            <span className="summary-value">
              {formData.beforeState} → {formData.afterState}
              ({formData.beforeState - formData.afterState > 0 ? '-' : '+'}{Math.abs(formData.beforeState - formData.afterState)} intensity)
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Big Release Steps
  const renderBigReleaseSteps = () => {
    if (step === 1) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">🌋</span>
            <h4>Your Practice</h4>
          </div>

          <div className="release-section">
            <label className="release-label">What type of release practice?</label>
            <div className="big-release-grid">
              {BIG_RELEASE_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  className={`big-release-option ${formData.practiceType === type.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, practiceType: type.id })}
                >
                  <span className="big-release-icon">{type.icon}</span>
                  <span className="big-release-label">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="release-section">
            <label className="release-label">How long was your session?</label>
            <div className="duration-grid">
              {BIG_RELEASE_DURATIONS.map(d => (
                <button
                  key={d.id}
                  type="button"
                  className={`duration-option ${formData.duration === d.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, duration: d.id })}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (step === 2) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">💫</span>
            <h4>What Surfaced</h4>
          </div>

          <div className="release-section">
            <label className="release-label">What emotions surfaced? (select all)</label>
            <div className="emotion-grid">
              {EMOTIONS.map(emotion => (
                <button
                  key={emotion.id}
                  type="button"
                  className={`emotion-option ${formData.emotions.includes(emotion.id) ? 'selected' : ''}`}
                  onClick={() => handleEmotionToggle(emotion.id)}
                >
                  <span className="emotion-icon">{emotion.icon}</span>
                  <span className="emotion-label">{emotion.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="release-section">
            <label className="release-label">How deep did you go?</label>
            <div className="depth-grid">
              {DEPTH_LEVELS.map(level => (
                <button
                  key={level.id}
                  type="button"
                  className={`depth-option ${formData.depth === level.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, depth: level.id })}
                >
                  <span className="depth-emoji">{level.emoji}</span>
                  <span className="depth-label">{level.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="release-section">
            <label className="release-label">How do you feel now?</label>
            <div className="outcome-grid">
              {RELEASE_OUTCOMES.map(outcome => (
                <button
                  key={outcome.id}
                  type="button"
                  className={`outcome-option ${formData.outcome === outcome.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, outcome: outcome.id })}
                >
                  <span className="outcome-icon">{outcome.icon}</span>
                  <span className="outcome-label">{outcome.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    }

    // Review step
    return (
      <div className="step-content">
        <div className="step-header">
          <span className="step-icon">🎯</span>
          <h4>Review Your Session</h4>
        </div>
        <div className="selection-summary">
          <div className="summary-item">
            <span className="summary-label">Practice Type</span>
            <span className="summary-value">
              {BIG_RELEASE_TYPES.find(t => t.id === formData.practiceType)?.icon} {BIG_RELEASE_TYPES.find(t => t.id === formData.practiceType)?.label || '-'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Duration</span>
            <span className="summary-value">
              {BIG_RELEASE_DURATIONS.find(d => d.id === formData.duration)?.label || '-'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Emotions Surfaced</span>
            <span className="summary-value">
              {formData.emotions.map(id => EMOTIONS.find(e => e.id === id)?.icon).join(' ') || '-'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Depth</span>
            <span className="summary-value">
              {DEPTH_LEVELS.find(d => d.id === formData.depth)?.emoji} {DEPTH_LEVELS.find(d => d.id === formData.depth)?.label || '-'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Outcome</span>
            <span className="summary-value">
              {RELEASE_OUTCOMES.find(o => o.id === formData.outcome)?.icon} {RELEASE_OUTCOMES.find(o => o.id === formData.outcome)?.label || '-'}
            </span>
          </div>
        </div>

        <div className="release-section">
          <label className="release-label">What came up? (optional)</label>
          <textarea
            className="release-textarea"
            placeholder="Describe what you processed and released..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>
      </div>
    )
  }

  // Shared intensity scale (before/after)
  const renderIntensityScale = () => (
    <>
      <div className="release-section">
        <label className="release-label">Intensity before releasing</label>
        <div className="intensity-scale">
          <span className="intensity-end">😌</span>
          <div className="intensity-buttons">
            {[1, 2, 3, 4, 5].map(level => (
              <button
                key={level}
                type="button"
                className={`intensity-btn ${formData.beforeState === level ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, beforeState: level })}
              >
                {level}
              </button>
            ))}
          </div>
          <span className="intensity-end">😰</span>
        </div>
      </div>

      <div className="release-section">
        <label className="release-label">Intensity after releasing</label>
        <div className="intensity-scale">
          <span className="intensity-end">😌</span>
          <div className="intensity-buttons">
            {[1, 2, 3, 4, 5].map(level => (
              <button
                key={level}
                type="button"
                className={`intensity-btn ${formData.afterState === level ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, afterState: level })}
              >
                {level}
              </button>
            ))}
          </div>
          <span className="intensity-end">😰</span>
        </div>
      </div>

      {formData.beforeState && formData.afterState && (
        <div className="shift-display">
          <span className="shift-label">Shift:</span>
          <span className={`shift-value ${formData.beforeState - formData.afterState > 0 ? 'positive' : formData.beforeState - formData.afterState < 0 ? 'negative' : 'neutral'}`}>
            {formData.beforeState - formData.afterState > 0 ? '-' : '+'}
            {Math.abs(formData.beforeState - formData.afterState)} intensity
          </span>
        </div>
      )}
    </>
  )

  const isReviewStep = step === totalSteps

  return (
    <div className="release-input stepped">
      {/* Progress indicator */}
      <div className="step-progress">
        <span className="progress-text">
          Step {step} of {totalSteps}: {config.stepTitles[step - 1]}
        </span>
      </div>

      {renderStepContent()}

      {/* Navigation */}
      <div className="step-navigation">
        {step > 1 && (
          <button className="nav-btn back" onClick={handleBack}>
            Back
          </button>
        )}

        {!isReviewStep ? (
          <button
            className="nav-btn next"
            onClick={handleNext}
            disabled={!canContinue()}
          >
            Continue
          </button>
        ) : (
          <button
            className="nav-btn complete"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Complete Quest'}
          </button>
        )}
      </div>
    </div>
  )
}

export { RELEASE_QUEST_IDS }
export default ReleaseQuestInput
