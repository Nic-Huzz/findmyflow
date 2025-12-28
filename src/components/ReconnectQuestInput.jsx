/**
 * ReconnectQuestInput - Enhanced input component for Reconnect quests
 *
 * Handles 7 Reconnect quest types with structured data capture for AI co-founder
 */

import { useState } from 'react'
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

function ReconnectQuestInput({ quest, onComplete }) {
  const [loading, setLoading] = useState(false)

  // State for different quest types
  const [formData, setFormData] = useState({
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
  })

  const handleSubmit = () => {
    setLoading(true)

    // Build structured data based on quest type
    let structuredData = {}

    switch (quest.id) {
      case 'reconnect_morning_meditation':
        structuredData = {
          quest_type: 'meditation',
          duration: formData.meditationDuration,
          before_state: formData.beforeState,
          after_state: formData.afterState,
          shift: formData.afterState - formData.beforeState
        }
        break

      case 'reconnect_morning_dance':
        structuredData = {
          quest_type: 'dance',
          before_state: formData.beforeState,
          after_state: formData.afterState,
          shift: formData.afterState - formData.beforeState
        }
        break

      case 'reconnect_morning_breathwork':
        structuredData = {
          quest_type: 'breathwork',
          breathwork_type: formData.breathworkType,
          before_state: formData.beforeState,
          after_state: formData.afterState,
          shift: formData.afterState - formData.beforeState
        }
        break

      case 'reconnect_self_identified':
        structuredData = {
          quest_type: 'self_identified_activity',
          dimension: formData.dimension,
          activity: formData.activityDescription,
          before_state: formData.beforeState,
          after_state: formData.afterState,
          shift: formData.afterState - formData.beforeState
        }
        break

      case 'reconnect_daily_prayer':
        structuredData = {
          quest_type: 'daily_prayer',
          elements: formData.prayerElements,
          note: formData.prayerNote,
          connection_rating: formData.connectionRating
        }
        break

      case 'reconnect_weekly_task':
        structuredData = {
          quest_type: 'weekly_reconnection',
          dimension: formData.dimension,
          duration: formData.duration,
          practice: formData.practiceDescription,
          meaningfulness: formData.meaningfulnessRating
        }
        break

      case 'reconnect_remove_negative':
        structuredData = {
          quest_type: 'environment_hygiene',
          drain_type: formData.drainType,
          action: formData.actionDescription,
          difficulty: formData.difficulty,
          outcome: formData.outcome
        }
        break
    }

    onComplete(quest, structuredData)
    setLoading(false)
  }

  const isValid = () => {
    switch (quest.id) {
      case 'reconnect_morning_meditation':
        return formData.meditationDuration && formData.beforeState && formData.afterState

      case 'reconnect_morning_dance':
        return formData.beforeState && formData.afterState

      case 'reconnect_morning_breathwork':
        return formData.beforeState && formData.afterState

      case 'reconnect_self_identified':
        return formData.dimension && formData.activityDescription.trim() &&
               formData.beforeState && formData.afterState

      case 'reconnect_daily_prayer':
        return formData.prayerElements.length > 0 && formData.connectionRating

      case 'reconnect_weekly_task':
        return formData.dimension && formData.duration &&
               formData.practiceDescription.trim() && formData.meaningfulnessRating

      case 'reconnect_remove_negative':
        return formData.drainType && formData.actionDescription.trim() &&
               formData.difficulty && formData.outcome

      default:
        return false
    }
  }

  // Render different forms based on quest type
  const renderForm = () => {
    switch (quest.id) {
      case 'reconnect_morning_meditation':
        return renderMeditationForm('meditation')
      case 'reconnect_morning_dance':
        return renderMeditationForm('dance')
      case 'reconnect_morning_breathwork':
        return renderMeditationForm('breathwork')
      case 'reconnect_self_identified':
        return renderSelfIdentifiedForm()
      case 'reconnect_daily_prayer':
        return renderDailyPrayerForm()
      case 'reconnect_weekly_task':
        return renderWeeklyTaskForm()
      case 'reconnect_remove_negative':
        return renderEnvironmentHygieneForm()
      default:
        return null
    }
  }

  // Shared before/after state selector for meditation, dance, breathwork
  const renderMeditationForm = (type) => {
    const labels = {
      meditation: { before: 'How did you feel before?', after: 'How do you feel after?' },
      dance: { before: 'Energy before dancing?', after: 'Energy after dancing?' },
      breathwork: { before: 'State before breathwork?', after: 'State after breathwork?' }
    }

    return (
      <>
        {/* Meditation duration selector */}
        {type === 'meditation' && (
          <div className="reconnect-section">
            <label className="reconnect-label">How long did you meditate?</label>
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
        )}

        {/* Breathwork type selector */}
        {type === 'breathwork' && (
          <div className="reconnect-section">
            <label className="reconnect-label">What type of breathwork?</label>
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
        )}

        <div className="reconnect-section">
          <label className="reconnect-label">{labels[type].before}</label>
          <div className="state-selector">
            <span className="state-end">😔</span>
            <div className="state-buttons">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  type="button"
                  className={`state-btn ${formData.beforeState === level ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, beforeState: level })}
                >
                  {level}
                </button>
              ))}
            </div>
            <span className="state-end">😄</span>
          </div>
        </div>

        <div className="reconnect-section">
          <label className="reconnect-label">{labels[type].after}</label>
          <div className="state-selector">
            <span className="state-end">😔</span>
            <div className="state-buttons">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  type="button"
                  className={`state-btn ${formData.afterState === level ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, afterState: level })}
                >
                  {level}
                </button>
              ))}
            </div>
            <span className="state-end">😄</span>
          </div>
        </div>

        {formData.beforeState && formData.afterState && (
          <div className="shift-display">
            <span className="shift-label">Shift:</span>
            <span className={`shift-value ${formData.afterState - formData.beforeState > 0 ? 'positive' : formData.afterState - formData.beforeState < 0 ? 'negative' : 'neutral'}`}>
              {formData.afterState - formData.beforeState > 0 ? '+' : ''}
              {formData.afterState - formData.beforeState}
            </span>
          </div>
        )}
      </>
    )
  }

  // Self-Identified Activity
  const renderSelfIdentifiedForm = () => (
    <>
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
      </div>

      <div className="reconnect-section">
        <label className="reconnect-label">How did you feel before?</label>
        <div className="state-selector">
          <span className="state-end">😔</span>
          <div className="state-buttons">
            {[1, 2, 3, 4, 5].map(level => (
              <button
                key={level}
                type="button"
                className={`state-btn ${formData.beforeState === level ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, beforeState: level })}
              >
                {level}
              </button>
            ))}
          </div>
          <span className="state-end">😄</span>
        </div>
      </div>

      <div className="reconnect-section">
        <label className="reconnect-label">How do you feel after?</label>
        <div className="state-selector">
          <span className="state-end">😔</span>
          <div className="state-buttons">
            {[1, 2, 3, 4, 5].map(level => (
              <button
                key={level}
                type="button"
                className={`state-btn ${formData.afterState === level ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, afterState: level })}
              >
                {level}
              </button>
            ))}
          </div>
          <span className="state-end">😄</span>
        </div>
      </div>

      {formData.beforeState && formData.afterState && (
        <div className="shift-display">
          <span className="shift-label">Shift:</span>
          <span className={`shift-value ${formData.afterState - formData.beforeState > 0 ? 'positive' : formData.afterState - formData.beforeState < 0 ? 'negative' : 'neutral'}`}>
            {formData.afterState - formData.beforeState > 0 ? '+' : ''}
            {formData.afterState - formData.beforeState}
          </span>
        </div>
      )}
    </>
  )

  // Daily Prayer
  const renderDailyPrayerForm = () => (
    <>
      <div className="reconnect-section">
        <label className="reconnect-label">What did your prayer include?</label>
        <div className="prayer-elements-grid">
          {PRAYER_ELEMENTS.map(el => (
            <button
              key={el.id}
              type="button"
              className={`prayer-element ${formData.prayerElements.includes(el.id) ? 'selected' : ''}`}
              onClick={() => {
                const newElements = formData.prayerElements.includes(el.id)
                  ? formData.prayerElements.filter(e => e !== el.id)
                  : [...formData.prayerElements, el.id]
                setFormData({ ...formData, prayerElements: newElements })
              }}
            >
              <span className="prayer-icon">{el.icon}</span>
              <span className="prayer-label">{el.label}</span>
            </button>
          ))}
        </div>
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

      <div className="reconnect-section">
        <label className="reconnect-label">How connected did you feel? (1-5)</label>
        <div className="state-selector">
          <span className="state-end">😶</span>
          <div className="state-buttons">
            {[1, 2, 3, 4, 5].map(level => (
              <button
                key={level}
                type="button"
                className={`state-btn connection ${formData.connectionRating === level ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, connectionRating: level })}
              >
                {level}
              </button>
            ))}
          </div>
          <span className="state-end">🙏</span>
        </div>
      </div>
    </>
  )

  // Weekly Self-Identified Task
  const renderWeeklyTaskForm = () => (
    <>
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

      <div className="reconnect-section">
        <label className="reconnect-label">What was your practice?</label>
        <textarea
          className="reconnect-textarea"
          placeholder="Describe your weekly reconnection practice"
          value={formData.practiceDescription}
          onChange={(e) => setFormData({ ...formData, practiceDescription: e.target.value })}
          rows={3}
        />
      </div>

      <div className="reconnect-section">
        <label className="reconnect-label">How meaningful was it? (1-5)</label>
        <div className="state-selector">
          <span className="state-end">😐</span>
          <div className="state-buttons">
            {[1, 2, 3, 4, 5].map(level => (
              <button
                key={level}
                type="button"
                className={`state-btn meaningful ${formData.meaningfulnessRating === level ? 'selected' : ''}`}
                onClick={() => setFormData({ ...formData, meaningfulnessRating: level })}
              >
                {level}
              </button>
            ))}
          </div>
          <span className="state-end">🌟</span>
        </div>
      </div>
    </>
  )

  // Environment Hygiene
  const renderEnvironmentHygieneForm = () => (
    <>
      <div className="reconnect-section">
        <label className="reconnect-label">What type of drain did you address?</label>
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

      <div className="reconnect-section">
        <label className="reconnect-label">What action did you take?</label>
        <textarea
          className="reconnect-textarea"
          placeholder="Describe how you removed or addressed this drain"
          value={formData.actionDescription}
          onChange={(e) => setFormData({ ...formData, actionDescription: e.target.value })}
          rows={3}
        />
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
    </>
  )

  return (
    <div className="reconnect-input">
      {renderForm()}

      <button
        className="reconnect-submit-btn"
        onClick={handleSubmit}
        disabled={!isValid() || loading}
      >
        {loading ? 'Saving...' : 'Complete Quest'}
      </button>
    </div>
  )
}

export { RECONNECT_QUEST_IDS }
export default ReconnectQuestInput
