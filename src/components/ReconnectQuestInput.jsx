/**
 * ReconnectQuestInput - Multi-step slider UI for Reconnect quests
 *
 * Handles 7 Reconnect quest types with structured data capture for AI co-founder
 *
 * Refactored to use shared useSteppedForm hook and StepProgress component.
 */

import { useCallback } from 'react'
import { useSteppedForm } from '../hooks/useSteppedForm'
import { StepProgress } from './QuestInputShared'
import './ReconnectQuestInput.css'

// Reconnect quest IDs
const RECONNECT_QUEST_IDS = [
  'reconnect_morning_meditation',   // Meditation
  'reconnect_morning_dance',        // Rise & Vibe Dance
  'reconnect_morning_breathwork',   // Breathwork
  'reconnect_self_identified',      // Self-Identified Activity
  'reconnect_daily_prayer',         // Daily Prayer
  'reconnect_weekly_task',          // Weekly Self-Identified Task
  'reconnect_remove_negative'       // Environment Hygiene
]

// Dimensions for self-identified activities
const DIMENSIONS = [
  { id: 'body', label: 'Body', icon: '🏃', description: 'Physical movement & wellness' },
  { id: 'mind', label: 'Mind', icon: '🧠', description: 'Learning & mental clarity' },
  { id: 'spirit', label: 'Spirit', icon: '✨', description: 'Inner connection & meaning' },
  { id: 'people', label: 'People', icon: '👥', description: 'Social & community' },
  { id: 'nature', label: 'Nature', icon: '🌿', description: 'Outdoor & environment' }
]

// Prayer elements
const PRAYER_ELEMENTS = [
  { id: 'gratitude', label: 'Gratitude', icon: '🙏' },
  { id: 'intentions', label: 'Intentions', icon: '🎯' },
  { id: 'asks', label: 'Asks', icon: '💫' },
  { id: 'surrender', label: 'Surrender', icon: '🕊️' },
  { id: 'guidance', label: 'Guidance', icon: '🧭' }
]

// Environment drain types
const DRAIN_TYPES = [
  { id: 'relationship', label: 'Relationship', icon: '👤', description: 'Person draining your energy' },
  { id: 'environment', label: 'Environment', icon: '🏠', description: 'Physical space or situation' },
  { id: 'content', label: 'Content', icon: '📱', description: 'Media or accounts you consume' },
  { id: 'habit', label: 'Habit', icon: '🔄', description: 'Pattern you want to break' },
  { id: 'commitment', label: 'Commitment', icon: '📋', description: 'Obligation no longer serving you' }
]

// Duration options (for weekly tasks)
const DURATION_OPTIONS = [
  { id: '5-15', label: '5-15 min' },
  { id: '15-30', label: '15-30 min' },
  { id: '30-60', label: '30-60 min' },
  { id: '60+', label: '60+ min' }
]

// Meditation duration options
const MEDITATION_DURATIONS = [
  { id: '5', label: '5 min' },
  { id: '10', label: '10 min' },
  { id: '15', label: '15 min' },
  { id: '20+', label: '20+ min' }
]

// Breathwork types
const BREATHWORK_TYPES = [
  { id: 'box', label: 'Box Breathing', icon: '📦' },
  { id: 'wim_hof', label: 'Wim Hof', icon: '❄️' },
  { id: 'holotropic', label: 'Holotropic', icon: '🌀' },
  { id: 'other', label: 'Other', icon: '🌬️' }
]

// Difficulty levels
const DIFFICULTY_LEVELS = [
  { id: 1, label: 'Easy', emoji: '😊' },
  { id: 2, label: 'Moderate', emoji: '😐' },
  { id: 3, label: 'Challenging', emoji: '😤' },
  { id: 4, label: 'Very Hard', emoji: '😰' },
  { id: 5, label: 'Terrifying', emoji: '😱' }
]

// Outcome feelings for Environment Hygiene
const OUTCOME_FEELINGS = [
  { id: 'relieved', label: 'Relieved', icon: '😌' },
  { id: 'proud', label: 'Proud', icon: '💪' },
  { id: 'mixed', label: 'Mixed', icon: '😕' }
]

// Step configurations for each quest type
const STEP_CONFIGS = {
  reconnect_morning_meditation: { totalSteps: 3, stepTitles: ['Duration', 'How You Felt', 'Review'] },
  reconnect_morning_dance: { totalSteps: 2, stepTitles: ['How You Felt', 'Review'] },
  reconnect_morning_breathwork: { totalSteps: 3, stepTitles: ['Breathwork Type', 'How You Felt', 'Review'] },
  reconnect_self_identified: { totalSteps: 3, stepTitles: ['Your Activity', 'How You Felt', 'Review'] },
  reconnect_daily_prayer: { totalSteps: 3, stepTitles: ['Prayer Elements', 'Connection', 'Review'] },
  reconnect_weekly_task: { totalSteps: 3, stepTitles: ['Your Practice', 'Experience', 'Review'] },
  reconnect_remove_negative: { totalSteps: 4, stepTitles: ['What You Addressed', 'Your Action', 'How It Felt', 'Review'] }
}

// Initial form data
const INITIAL_RECONNECT_FORM_DATA = {
  // Before/After state (1-5 scale)
  beforeState: null,
  afterState: null,
  // Meditation specific
  meditationDuration: null,
  // Breathwork specific
  breathworkType: null,
  // Self-Identified Activity
  dimension: null,
  activityDescription: '',
  // Daily Prayer
  prayerElements: [],
  prayerNote: '',
  connectionRating: null,
  // Weekly Task
  duration: null,
  practiceDescription: '',
  meaningfulnessRating: null,
  // Environment Hygiene
  drainType: null,
  actionDescription: '',
  difficulty: null,
  outcome: null
}

function ReconnectQuestInput({ quest, onComplete }) {
  const config = STEP_CONFIGS[quest.id] || { totalSteps: 2, stepTitles: ['Input', 'Review'] }

  // Validation function
  const validateStep = useCallback((currentStep, data) => {
    switch (quest.id) {
      case 'reconnect_morning_meditation':
        if (currentStep === 1) return data.meditationDuration
        if (currentStep === 2) return data.beforeState && data.afterState
        return true
      case 'reconnect_morning_dance':
        if (currentStep === 1) return data.beforeState && data.afterState
        return true
      case 'reconnect_morning_breathwork':
        if (currentStep === 1) return data.breathworkType
        if (currentStep === 2) return data.beforeState && data.afterState
        return true
      case 'reconnect_self_identified':
        if (currentStep === 1) return data.dimension && data.activityDescription.trim().length >= 10
        if (currentStep === 2) return data.beforeState && data.afterState
        return true
      case 'reconnect_daily_prayer':
        if (currentStep === 1) return data.prayerElements.length > 0
        if (currentStep === 2) return data.connectionRating
        return true
      case 'reconnect_weekly_task':
        if (currentStep === 1) return data.dimension && data.duration
        if (currentStep === 2) return data.practiceDescription.trim().length >= 10 && data.meaningfulnessRating
        return true
      case 'reconnect_remove_negative':
        if (currentStep === 1) return data.drainType
        if (currentStep === 2) return data.actionDescription.trim().length >= 10
        if (currentStep === 3) return data.difficulty && data.outcome
        return true
      default:
        return true
    }
  }, [quest.id])

  // Build structured data for submission
  const buildStructuredData = useCallback((data) => {
    switch (quest.id) {
      case 'reconnect_morning_meditation':
        return {
          quest_type: 'meditation',
          duration: data.meditationDuration,
          before_state: data.beforeState,
          after_state: data.afterState,
          shift: data.afterState - data.beforeState
        }
      case 'reconnect_morning_dance':
        return {
          quest_type: 'dance',
          before_state: data.beforeState,
          after_state: data.afterState,
          shift: data.afterState - data.beforeState
        }
      case 'reconnect_morning_breathwork':
        return {
          quest_type: 'breathwork',
          breathwork_type: data.breathworkType,
          before_state: data.beforeState,
          after_state: data.afterState,
          shift: data.afterState - data.beforeState
        }
      case 'reconnect_self_identified':
        return {
          quest_type: 'self_identified_activity',
          dimension: data.dimension,
          activity: data.activityDescription,
          before_state: data.beforeState,
          after_state: data.afterState,
          shift: data.afterState - data.beforeState
        }
      case 'reconnect_daily_prayer':
        return {
          quest_type: 'daily_prayer',
          elements: data.prayerElements,
          note: data.prayerNote,
          connection_rating: data.connectionRating
        }
      case 'reconnect_weekly_task':
        return {
          quest_type: 'weekly_reconnection',
          dimension: data.dimension,
          duration: data.duration,
          practice: data.practiceDescription,
          meaningfulness: data.meaningfulnessRating
        }
      case 'reconnect_remove_negative':
        return {
          quest_type: 'environment_hygiene',
          drain_type: data.drainType,
          action: data.actionDescription,
          difficulty: data.difficulty,
          outcome: data.outcome
        }
      default:
        return data
    }
  }, [quest.id])

  const {
    step,
    formData,
    setFormData,
    isSubmitting,
    isReviewStep,
    totalSteps,
    canContinue,
    handleNext,
    handleBack,
    handleSubmit,
    toggleArrayItem
  } = useSteppedForm({
    totalSteps: config.totalSteps,
    initialData: INITIAL_RECONNECT_FORM_DATA,
    validateStep,
    onSubmit: (data) => onComplete(quest, buildStructuredData(data))
  })

  // Helper to render state selectors (before/after)
  const renderStateSelector = (label, value, onChange, startEmoji = '😔', endEmoji = '😄') => (
    <div className="reconnect-section">
      <label className="reconnect-label">{label}</label>
      <div className="state-selector">
        <span className="state-end">{startEmoji}</span>
        <div className="state-buttons">
          {[1, 2, 3, 4, 5].map(level => (
            <button
              key={level}
              type="button"
              className={`state-btn ${value === level ? 'selected' : ''}`}
              onClick={() => onChange(level)}
            >
              {level}
            </button>
          ))}
        </div>
        <span className="state-end">{endEmoji}</span>
      </div>
    </div>
  )

  // Helper to render shift display
  const renderShiftDisplay = () => {
    if (!formData.beforeState || !formData.afterState) return null
    const shift = formData.afterState - formData.beforeState
    return (
      <div className="shift-display">
        <span className="shift-label">Shift:</span>
        <span className={`shift-value ${shift > 0 ? 'positive' : shift < 0 ? 'negative' : 'neutral'}`}>
          {shift > 0 ? '+' : ''}{shift}
        </span>
      </div>
    )
  }

  // Render step content based on quest type and current step
  const renderStepContent = () => {
    switch (quest.id) {
      case 'reconnect_morning_meditation':
        return renderMeditationSteps()
      case 'reconnect_morning_dance':
        return renderDanceSteps()
      case 'reconnect_morning_breathwork':
        return renderBreathworkSteps()
      case 'reconnect_self_identified':
        return renderSelfIdentifiedSteps()
      case 'reconnect_daily_prayer':
        return renderPrayerSteps()
      case 'reconnect_weekly_task':
        return renderWeeklyTaskSteps()
      case 'reconnect_remove_negative':
        return renderEnvironmentHygieneSteps()
      default:
        return null
    }
  }

  // Meditation steps
  const renderMeditationSteps = () => {
    if (step === 1) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">🧘</span>
            <h4>How long did you meditate?</h4>
          </div>
          <div className="duration-selector">
            {MEDITATION_DURATIONS.map(d => (
              <button
                key={d.id}
                type="button"
                className={`duration-option ${formData.meditationDuration === d.id ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, meditationDuration: d.id })}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (step === 2) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">✨</span>
            <h4>How did you feel?</h4>
          </div>
          {renderStateSelector('Before meditation', formData.beforeState,
            (val) => setFormData({ ...formData, beforeState: val }))}
          {renderStateSelector('After meditation', formData.afterState,
            (val) => setFormData({ ...formData, afterState: val }))}
          {renderShiftDisplay()}
        </div>
      )
    }

    // Review step
    return renderMeditationReview()
  }

  const renderMeditationReview = () => (
    <div className="step-content">
      <div className="step-header">
        <span className="step-icon">🎯</span>
        <h4>Review Your Session</h4>
      </div>
      <div className="selection-summary">
        <div className="summary-item">
          <span className="summary-label">Duration</span>
          <span className="summary-value">
            {MEDITATION_DURATIONS.find(d => d.id === formData.meditationDuration)?.label || '-'}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">State Shift</span>
          <span className="summary-value">
            {formData.beforeState} → {formData.afterState}
            ({formData.afterState - formData.beforeState > 0 ? '+' : ''}{formData.afterState - formData.beforeState})
          </span>
        </div>
      </div>
    </div>
  )

  // Dance steps
  const renderDanceSteps = () => {
    if (step === 1) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">💃</span>
            <h4>Rate your energy</h4>
          </div>
          {renderStateSelector('Before dancing', formData.beforeState,
            (val) => setFormData({ ...formData, beforeState: val }))}
          {renderStateSelector('After dancing', formData.afterState,
            (val) => setFormData({ ...formData, afterState: val }))}
          {renderShiftDisplay()}
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
            <span className="summary-label">Energy Shift</span>
            <span className="summary-value">
              {formData.beforeState} → {formData.afterState}
              ({formData.afterState - formData.beforeState > 0 ? '+' : ''}{formData.afterState - formData.beforeState})
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Breathwork steps
  const renderBreathworkSteps = () => {
    if (step === 1) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">🌬️</span>
            <h4>What type of breathwork?</h4>
          </div>
          <div className="breathwork-type-grid">
            {BREATHWORK_TYPES.map(bw => (
              <button
                key={bw.id}
                type="button"
                className={`breathwork-type-option ${formData.breathworkType === bw.id ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, breathworkType: bw.id })}
              >
                <span className="breathwork-type-icon">{bw.icon}</span>
                <span className="breathwork-type-label">{bw.label}</span>
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (step === 2) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">✨</span>
            <h4>How did you feel?</h4>
          </div>
          {renderStateSelector('Before breathwork', formData.beforeState,
            (val) => setFormData({ ...formData, beforeState: val }))}
          {renderStateSelector('After breathwork', formData.afterState,
            (val) => setFormData({ ...formData, afterState: val }))}
          {renderShiftDisplay()}
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
            <span className="summary-label">Breathwork Type</span>
            <span className="summary-value">
              {BREATHWORK_TYPES.find(b => b.id === formData.breathworkType)?.label || '-'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">State Shift</span>
            <span className="summary-value">
              {formData.beforeState} → {formData.afterState}
              ({formData.afterState - formData.beforeState > 0 ? '+' : ''}{formData.afterState - formData.beforeState})
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Self-Identified Activity steps
  const renderSelfIdentifiedSteps = () => {
    if (step === 1) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">🌟</span>
            <h4>Your Reconnection Activity</h4>
          </div>

          <div className="reconnect-section">
            <label className="reconnect-label">Which dimension did you reconnect with?</label>
            <div className="dimension-grid">
              {DIMENSIONS.map(dim => (
                <button
                  key={dim.id}
                  type="button"
                  className={`dimension-option ${formData.dimension === dim.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, dimension: dim.id })}
                >
                  <span className="dimension-icon">{dim.icon}</span>
                  <span className="dimension-label">{dim.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="reconnect-section">
            <label className="reconnect-label">What did you do?</label>
            <textarea
              className="reconnect-textarea"
              placeholder="Describe your reconnection activity"
              value={formData.activityDescription}
              onChange={(e) => setFormData({ ...formData, activityDescription: e.target.value })}
              rows={2}
            />
            <span className={`char-hint ${formData.activityDescription.trim().length >= 10 ? 'met' : ''}`}>
              {formData.activityDescription.trim().length}/10 characters minimum
            </span>
          </div>
        </div>
      )
    }

    if (step === 2) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">✨</span>
            <h4>How did you feel?</h4>
          </div>
          {renderStateSelector('Before your activity', formData.beforeState,
            (val) => setFormData({ ...formData, beforeState: val }))}
          {renderStateSelector('After your activity', formData.afterState,
            (val) => setFormData({ ...formData, afterState: val }))}
          {renderShiftDisplay()}
        </div>
      )
    }

    // Review step
    return (
      <div className="step-content">
        <div className="step-header">
          <span className="step-icon">🎯</span>
          <h4>Review Your Activity</h4>
        </div>
        <div className="selection-summary">
          <div className="summary-item">
            <span className="summary-label">Dimension</span>
            <span className="summary-value">
              {DIMENSIONS.find(d => d.id === formData.dimension)?.icon} {DIMENSIONS.find(d => d.id === formData.dimension)?.label || '-'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Activity</span>
            <span className="summary-value">{formData.activityDescription || '-'}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">State Shift</span>
            <span className="summary-value">
              {formData.beforeState} → {formData.afterState}
              ({formData.afterState - formData.beforeState > 0 ? '+' : ''}{formData.afterState - formData.beforeState})
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Daily Prayer steps
  const renderPrayerSteps = () => {
    if (step === 1) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">🙏</span>
            <h4>What did your prayer include?</h4>
          </div>
          <p className="step-description">Select all that apply</p>
          <div className="prayer-elements-grid">
            {PRAYER_ELEMENTS.map(el => (
              <button
                key={el.id}
                type="button"
                className={`prayer-element ${formData.prayerElements.includes(el.id) ? 'selected' : ''}`}
                onClick={() => toggleArrayItem('prayerElements', el.id)}
              >
                <span className="prayer-icon">{el.icon}</span>
                <span className="prayer-label">{el.label}</span>
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (step === 2) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">✨</span>
            <h4>Your Connection</h4>
          </div>

          <div className="reconnect-section">
            <label className="reconnect-label">Any notes from your prayer? (optional)</label>
            <textarea
              className="reconnect-textarea"
              placeholder="What came up for you?"
              value={formData.prayerNote}
              onChange={(e) => setFormData({ ...formData, prayerNote: e.target.value })}
              rows={2}
            />
          </div>

          {renderStateSelector('How connected did you feel?', formData.connectionRating,
            (val) => setFormData({ ...formData, connectionRating: val }), '😶', '🙏')}
        </div>
      )
    }

    // Review step
    return (
      <div className="step-content">
        <div className="step-header">
          <span className="step-icon">🎯</span>
          <h4>Review Your Prayer</h4>
        </div>
        <div className="selection-summary">
          <div className="summary-item">
            <span className="summary-label">Prayer Elements</span>
            <span className="summary-value">
              {formData.prayerElements.map(id =>
                PRAYER_ELEMENTS.find(p => p.id === id)?.icon
              ).join(' ') || '-'}
            </span>
          </div>
          {formData.prayerNote && (
            <div className="summary-item">
              <span className="summary-label">Notes</span>
              <span className="summary-value">{formData.prayerNote}</span>
            </div>
          )}
          <div className="summary-item">
            <span className="summary-label">Connection Level</span>
            <span className="summary-value">{formData.connectionRating}/5</span>
          </div>
        </div>
      </div>
    )
  }

  // Weekly Task steps
  const renderWeeklyTaskSteps = () => {
    if (step === 1) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">📅</span>
            <h4>Your Weekly Practice</h4>
          </div>

          <div className="reconnect-section">
            <label className="reconnect-label">Which dimension?</label>
            <div className="dimension-grid">
              {DIMENSIONS.map(dim => (
                <button
                  key={dim.id}
                  type="button"
                  className={`dimension-option ${formData.dimension === dim.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, dimension: dim.id })}
                >
                  <span className="dimension-icon">{dim.icon}</span>
                  <span className="dimension-label">{dim.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="reconnect-section">
            <label className="reconnect-label">How long was your practice?</label>
            <div className="duration-selector">
              {DURATION_OPTIONS.map(d => (
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
            <span className="step-icon">✨</span>
            <h4>Your Experience</h4>
          </div>

          <div className="reconnect-section">
            <label className="reconnect-label">What was your practice?</label>
            <textarea
              className="reconnect-textarea"
              placeholder="Describe your weekly reconnection practice"
              value={formData.practiceDescription}
              onChange={(e) => setFormData({ ...formData, practiceDescription: e.target.value })}
              rows={3}
            />
            <span className={`char-hint ${formData.practiceDescription.trim().length >= 10 ? 'met' : ''}`}>
              {formData.practiceDescription.trim().length}/10 characters minimum
            </span>
          </div>

          {renderStateSelector('How meaningful was it?', formData.meaningfulnessRating,
            (val) => setFormData({ ...formData, meaningfulnessRating: val }), '😐', '🌟')}
        </div>
      )
    }

    // Review step
    return (
      <div className="step-content">
        <div className="step-header">
          <span className="step-icon">🎯</span>
          <h4>Review Your Practice</h4>
        </div>
        <div className="selection-summary">
          <div className="summary-item">
            <span className="summary-label">Dimension</span>
            <span className="summary-value">
              {DIMENSIONS.find(d => d.id === formData.dimension)?.icon} {DIMENSIONS.find(d => d.id === formData.dimension)?.label || '-'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Duration</span>
            <span className="summary-value">
              {DURATION_OPTIONS.find(d => d.id === formData.duration)?.label || '-'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Practice</span>
            <span className="summary-value">{formData.practiceDescription || '-'}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Meaningfulness</span>
            <span className="summary-value">{formData.meaningfulnessRating}/5</span>
          </div>
        </div>
      </div>
    )
  }

  // Environment Hygiene steps
  const renderEnvironmentHygieneSteps = () => {
    if (step === 1) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">🧹</span>
            <h4>What did you address?</h4>
          </div>
          <p className="step-description">What type of drain did you remove or address?</p>
          <div className="drain-grid">
            {DRAIN_TYPES.map(drain => (
              <button
                key={drain.id}
                type="button"
                className={`drain-option ${formData.drainType === drain.id ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, drainType: drain.id })}
              >
                <span className="drain-icon">{drain.icon}</span>
                <span className="drain-label">{drain.label}</span>
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (step === 2) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">💪</span>
            <h4>Your Action</h4>
          </div>
          <div className="reconnect-section">
            <label className="reconnect-label">What action did you take?</label>
            <textarea
              className="reconnect-textarea"
              placeholder="Describe how you removed or addressed this drain"
              value={formData.actionDescription}
              onChange={(e) => setFormData({ ...formData, actionDescription: e.target.value })}
              rows={3}
            />
            <span className={`char-hint ${formData.actionDescription.trim().length >= 10 ? 'met' : ''}`}>
              {formData.actionDescription.trim().length}/10 characters minimum
            </span>
          </div>
        </div>
      )
    }

    if (step === 3) {
      return (
        <div className="step-content">
          <div className="step-header">
            <span className="step-icon">✨</span>
            <h4>How did it feel?</h4>
          </div>

          <div className="reconnect-section">
            <label className="reconnect-label">How difficult was it?</label>
            <div className="difficulty-selector">
              {DIFFICULTY_LEVELS.map(d => (
                <button
                  key={d.id}
                  type="button"
                  className={`difficulty-option ${formData.difficulty === d.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, difficulty: d.id })}
                >
                  <span className="difficulty-emoji">{d.emoji}</span>
                  <span className="difficulty-label">{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="reconnect-section">
            <label className="reconnect-label">How do you feel now?</label>
            <div className="outcome-grid">
              {OUTCOME_FEELINGS.map(o => (
                <button
                  key={o.id}
                  type="button"
                  className={`outcome-option ${formData.outcome === o.id ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, outcome: o.id })}
                >
                  <span className="outcome-icon">{o.icon}</span>
                  <span className="outcome-label">{o.label}</span>
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
          <h4>Review Your Action</h4>
        </div>
        <div className="selection-summary">
          <div className="summary-item">
            <span className="summary-label">Drain Type</span>
            <span className="summary-value">
              {DRAIN_TYPES.find(d => d.id === formData.drainType)?.icon} {DRAIN_TYPES.find(d => d.id === formData.drainType)?.label || '-'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Action Taken</span>
            <span className="summary-value">{formData.actionDescription || '-'}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Difficulty</span>
            <span className="summary-value">
              {DIFFICULTY_LEVELS.find(d => d.id === formData.difficulty)?.emoji} {DIFFICULTY_LEVELS.find(d => d.id === formData.difficulty)?.label || '-'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Outcome</span>
            <span className="summary-value">
              {OUTCOME_FEELINGS.find(o => o.id === formData.outcome)?.icon} {OUTCOME_FEELINGS.find(o => o.id === formData.outcome)?.label || '-'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="reconnect-input stepped">
      {/* Progress indicator */}
      <StepProgress
        currentStep={step}
        totalSteps={totalSteps}
        stepTitle={config.stepTitles[step - 1]}
      />

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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Complete Quest'}
          </button>
        )}
      </div>
    </div>
  )
}

export { RECONNECT_QUEST_IDS }
export default ReconnectQuestInput
