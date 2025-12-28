/**
 * ReleaseQuestInput - Enhanced input component for Release quests (Healing tab)
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

function ReleaseQuestInput({ quest, onComplete }) {
  const [loading, setLoading] = useState(false)

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

    // Processing Emotions
    trigger: null,
    releaseMethod: null,

    // Big Release
    practiceType: null,
    duration: null,
    depth: null,
    outcome: null
  })

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
          before_state: formData.beforeState,
          after_state: formData.afterState,
          shift: formData.afterState - formData.beforeState,
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
          shift: formData.afterState - formData.beforeState,
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

  const isValid = () => {
    switch (quest.id) {
      case 'release_daily_challenge':
        return formData.releaseType && formData.emotion &&
               formData.beforeState && formData.afterState

      case 'release_negative_charge':
        return formData.trigger && formData.emotion &&
               formData.releaseMethod && formData.beforeState && formData.afterState

      case 'release_weekly_big':
        return formData.practiceType && formData.duration &&
               formData.emotions.length > 0 && formData.depth && formData.outcome

      default:
        return false
    }
  }

  // Daily Release Challenge
  const renderDailyChallenge = () => (
    <>
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
    </>
  )

  // Processing Your Emotions
  const renderProcessingEmotions = () => (
    <>
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

      <div className="release-section">
        <label className="release-label">Any reflections? (optional)</label>
        <textarea
          className="release-textarea"
          placeholder="What did you notice?"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
        />
      </div>
    </>
  )

  // Big Release
  const renderBigRelease = () => (
    <>
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
    </>
  )

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

  // Render appropriate form
  const renderForm = () => {
    switch (quest.id) {
      case 'release_daily_challenge':
        return renderDailyChallenge()
      case 'release_negative_charge':
        return renderProcessingEmotions()
      case 'release_weekly_big':
        return renderBigRelease()
      default:
        return null
    }
  }

  return (
    <div className="release-input">
      {renderForm()}

      <button
        className="release-submit-btn"
        onClick={handleSubmit}
        disabled={!isValid() || loading}
      >
        {loading ? 'Saving...' : 'Complete Quest'}
      </button>
    </div>
  )
}

export { RELEASE_QUEST_IDS }
export default ReleaseQuestInput
