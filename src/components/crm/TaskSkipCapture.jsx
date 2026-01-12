/**
 * Task Skip Capture
 * Captures why users didn't complete a task - external blockers vs internal resistance
 * Feeds into nervous system pattern recognition
 * Also supports rescheduling tasks for later
 */
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import './TaskSkipCapture.css'

// External reasons (practical blockers)
const EXTERNAL_REASONS = [
  { id: 'no_time', label: "Didn't have time", icon: '⏰' },
  { id: 'forgot', label: 'Forgot about it', icon: '🤔' },
  { id: 'technical_issue', label: 'Technical issue', icon: '🔧' },
  { id: 'other_priorities', label: 'Other priorities came up', icon: '📋' },
  { id: 'waiting_on_something', label: 'Waiting on something', icon: '⏳' },
  { id: 'not_relevant', label: "Wasn't relevant today", icon: '🎯' },
]

// Internal reasons (nervous system resistance)
const INTERNAL_REASONS = [
  { id: 'fear_of_judgment', label: 'Fear of being judged', icon: '👀', description: 'Worried about what others will think' },
  { id: 'not_good_enough', label: "It's not good enough", icon: '📉', description: 'Felt the content wasn\'t ready' },
  { id: 'fear_of_failure', label: 'Fear of failure', icon: '😰', description: 'Worried it won\'t work or perform' },
  { id: 'fear_of_success', label: 'Fear of success', icon: '🚀', description: 'Worried about what happens if it works' },
  { id: 'perfectionism', label: 'Perfectionism', icon: '✨', description: 'Couldn\'t get it "just right"' },
  { id: 'overwhelm', label: 'Felt overwhelmed', icon: '🌊', description: 'Too much to do, froze up' },
  { id: 'imposter_syndrome', label: 'Imposter syndrome', icon: '🎭', description: 'Who am I to share this?' },
  { id: 'visibility_fear', label: 'Fear of visibility', icon: '🔦', description: 'Didn\'t want to be seen' },
  { id: 'rejection_fear', label: 'Fear of rejection', icon: '💔', description: 'Worried about negative responses' },
]

// Quick reschedule options
const RESCHEDULE_OPTIONS = [
  { id: 'tomorrow', label: 'Tomorrow', icon: '📅', days: 1 },
  { id: 'in_2_days', label: 'In 2 days', icon: '📆', days: 2 },
  { id: 'next_week', label: 'Next week', icon: '🗓️', days: 7 },
  { id: 'custom', label: 'Pick a date', icon: '✏️', days: null },
]

export default function TaskSkipCapture({
  isOpen,
  onClose,
  onSubmit,
  onReschedule,
  task,
  userId
}) {
  const [step, setStep] = useState('action') // 'action', 'reschedule', 'category', 'reason', 'intensity', 'complete'
  const [action, setAction] = useState(null) // 'skip' or 'reschedule'
  const [category, setCategory] = useState(null) // 'external' or 'internal'
  const [selectedReason, setSelectedReason] = useState(null)
  const [intensity, setIntensity] = useState(5)
  const [notes, setNotes] = useState('')
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  // Calculate date from option
  function getDateFromOption(option) {
    if (!option.days) return null
    const date = new Date()
    date.setDate(date.getDate() + option.days)
    return date.toISOString().split('T')[0]
  }

  // Handle reschedule selection
  function handleRescheduleSelect(option) {
    if (option.id === 'custom') {
      // Show date picker
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setRescheduleDate(tomorrow.toISOString().split('T')[0])
    } else {
      setRescheduleDate(getDateFromOption(option))
    }
  }

  // Handle reschedule submit
  async function handleRescheduleSubmit() {
    if (!rescheduleDate) return

    setSaving(true)
    try {
      // Call the reschedule callback
      if (onReschedule) {
        await onReschedule({
          taskId: task?.id,
          newDate: rescheduleDate,
          taskType: task?.type || 'marketing_task'
        })
      }

      // Also log the reschedule for analytics
      await supabase
        .from('task_skip_reasons')
        .insert({
          user_id: userId,
          task_type: task?.type || 'marketing_task',
          task_id: task?.id || null,
          task_description: task?.description || task?.title || 'Daily marketing task',
          reason_category: 'external',
          external_reason: 'rescheduled',
          notes: `Rescheduled to ${rescheduleDate}`,
          alternative_action: `rescheduled:${rescheduleDate}`
        })

      resetState()
      onClose()
    } catch (err) {
      console.error('Error rescheduling task:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleComplete() {
    setSaving(true)

    try {
      const { error } = await supabase
        .from('task_skip_reasons')
        .insert({
          user_id: userId,
          task_type: task?.type || 'marketing_task',
          task_id: task?.id || null,
          task_description: task?.description || task?.title || 'Daily marketing task',
          reason_category: category,
          external_reason: category === 'external' ? selectedReason : null,
          internal_reason: category === 'internal' ? selectedReason : null,
          intensity: category === 'internal' ? intensity : null,
          notes: notes || null
        })

      if (error) throw error

      // Call parent callback
      if (onSubmit) {
        onSubmit({
          category,
          reason: selectedReason,
          intensity: category === 'internal' ? intensity : null,
          notes
        })
      }

      // Reset and close
      resetState()
      onClose()
    } catch (err) {
      console.error('Error saving skip reason:', err)
    } finally {
      setSaving(false)
    }
  }

  function resetState() {
    setStep('action')
    setAction(null)
    setCategory(null)
    setSelectedReason(null)
    setIntensity(5)
    setNotes('')
    setRescheduleDate('')
  }

  function handleClose() {
    resetState()
    onClose()
  }

  function selectCategory(cat) {
    setCategory(cat)
    setStep('reason')
  }

  function selectReason(reason) {
    setSelectedReason(reason)
    if (category === 'internal') {
      setStep('intensity')
    } else {
      setStep('complete')
    }
  }

  function handleIntensityNext() {
    setStep('complete')
  }

  return (
    <div className="tsc-overlay" onClick={handleClose}>
      <div className="tsc-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="tsc-header">
          <div className="tsc-header-content">
            <span className="tsc-header-icon">🧠</span>
            <div>
              <h3>Let's understand what happened</h3>
              <p>No judgment - just awareness</p>
            </div>
          </div>
          <button className="tsc-close" onClick={handleClose}>×</button>
        </div>

        {/* Task info */}
        {task && (
          <div className="tsc-task-info">
            <span className="tsc-task-label">Task:</span>
            <span className="tsc-task-title">{task.title || task.description}</span>
          </div>
        )}

        {/* Step 0: Action Selection (Skip vs Reschedule) */}
        {step === 'action' && (
          <div className="tsc-step">
            <h4>What would you like to do?</h4>

            <div className="tsc-action-options">
              <button
                className="tsc-action-btn reschedule"
                onClick={() => {
                  setAction('reschedule')
                  setStep('reschedule')
                }}
              >
                <span className="tsc-action-icon">📅</span>
                <span className="tsc-action-label">Reschedule</span>
                <span className="tsc-action-desc">Do it another day</span>
              </button>

              <button
                className="tsc-action-btn skip"
                onClick={() => {
                  setAction('skip')
                  setStep('category')
                }}
              >
                <span className="tsc-action-icon">⏭️</span>
                <span className="tsc-action-label">Skip It</span>
                <span className="tsc-action-desc">Not doing this one</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 0.5: Reschedule Date Selection */}
        {step === 'reschedule' && (
          <div className="tsc-step">
            <button className="tsc-back" onClick={() => setStep('action')}>
              ← Back
            </button>

            <h4>When would you like to do this?</h4>

            <div className="tsc-reschedule-options">
              {RESCHEDULE_OPTIONS.map(option => (
                <button
                  key={option.id}
                  className={`tsc-reschedule-btn ${rescheduleDate === getDateFromOption(option) ? 'selected' : ''}`}
                  onClick={() => handleRescheduleSelect(option)}
                >
                  <span className="tsc-reschedule-icon">{option.icon}</span>
                  <span className="tsc-reschedule-label">{option.label}</span>
                </button>
              ))}
            </div>

            {/* Custom date picker */}
            {rescheduleDate && (
              <div className="tsc-date-picker">
                <label>Selected date:</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="tsc-date-input"
                />
              </div>
            )}

            <button
              className="tsc-reschedule-submit"
              onClick={handleRescheduleSubmit}
              disabled={!rescheduleDate || saving}
            >
              {saving ? 'Rescheduling...' : `Reschedule to ${rescheduleDate ? new Date(rescheduleDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '...'}`}
            </button>
          </div>
        )}

        {/* Step 1: Category Selection */}
        {step === 'category' && (
          <div className="tsc-step">
            <button className="tsc-back" onClick={() => setStep('action')}>
              ← Back
            </button>

            <h4>Was it an external or internal reason?</h4>

            <div className="tsc-category-options">
              <button
                className="tsc-category-btn external"
                onClick={() => selectCategory('external')}
              >
                <span className="tsc-cat-icon">🌍</span>
                <span className="tsc-cat-label">External</span>
                <span className="tsc-cat-desc">Life got in the way</span>
                <span className="tsc-cat-examples">Time, priorities, logistics</span>
              </button>

              <button
                className="tsc-category-btn internal"
                onClick={() => selectCategory('internal')}
              >
                <span className="tsc-cat-icon">💭</span>
                <span className="tsc-cat-label">Internal</span>
                <span className="tsc-cat-desc">Felt some resistance</span>
                <span className="tsc-cat-examples">Fear, doubt, overwhelm</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Specific Reason */}
        {step === 'reason' && (
          <div className="tsc-step">
            <button className="tsc-back" onClick={() => setStep('category')}>
              ← Back
            </button>

            <h4>
              {category === 'external'
                ? 'What got in the way?'
                : 'What resistance came up?'}
            </h4>

            <div className="tsc-reason-grid">
              {(category === 'external' ? EXTERNAL_REASONS : INTERNAL_REASONS).map(reason => (
                <button
                  key={reason.id}
                  className={`tsc-reason-btn ${selectedReason === reason.id ? 'selected' : ''}`}
                  onClick={() => selectReason(reason.id)}
                >
                  <span className="tsc-reason-icon">{reason.icon}</span>
                  <span className="tsc-reason-label">{reason.label}</span>
                  {reason.description && (
                    <span className="tsc-reason-desc">{reason.description}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Intensity (Internal only) */}
        {step === 'intensity' && category === 'internal' && (
          <div className="tsc-step">
            <button className="tsc-back" onClick={() => setStep('reason')}>
              ← Back
            </button>

            <h4>How strong was the resistance?</h4>
            <p className="tsc-intensity-hint">
              This helps track patterns over time
            </p>

            <div className="tsc-intensity-slider">
              <input
                type="range"
                min="1"
                max="10"
                value={intensity}
                onChange={e => setIntensity(Number(e.target.value))}
                className="tsc-slider"
              />
              <div className="tsc-intensity-labels">
                <span>Slight</span>
                <span className="tsc-intensity-value">{intensity}/10</span>
                <span>Strong</span>
              </div>
            </div>

            <div className="tsc-intensity-indicator">
              {intensity <= 3 && <span className="tsc-ind-low">Mild resistance - you noticed it</span>}
              {intensity > 3 && intensity <= 6 && <span className="tsc-ind-med">Moderate - it slowed you down</span>}
              {intensity > 6 && <span className="tsc-ind-high">Strong - it stopped you</span>}
            </div>

            <button className="tsc-next-btn" onClick={handleIntensityNext}>
              Continue
            </button>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="tsc-step">
            <button className="tsc-back" onClick={() => setStep(category === 'internal' ? 'intensity' : 'reason')}>
              ← Back
            </button>

            <h4>Anything else you want to note?</h4>
            <p className="tsc-notes-hint">Optional - helps you reflect later</p>

            <textarea
              className="tsc-notes"
              placeholder="What else was going on? Any insights?"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />

            {/* Summary */}
            <div className="tsc-summary">
              <div className="tsc-summary-item">
                <span className="tsc-sum-label">Category:</span>
                <span className={`tsc-sum-value ${category}`}>
                  {category === 'external' ? '🌍 External' : '💭 Internal'}
                </span>
              </div>
              <div className="tsc-summary-item">
                <span className="tsc-sum-label">Reason:</span>
                <span className="tsc-sum-value">
                  {(category === 'external' ? EXTERNAL_REASONS : INTERNAL_REASONS)
                    .find(r => r.id === selectedReason)?.label}
                </span>
              </div>
              {category === 'internal' && (
                <div className="tsc-summary-item">
                  <span className="tsc-sum-label">Intensity:</span>
                  <span className="tsc-sum-value">{intensity}/10</span>
                </div>
              )}
            </div>

            <button
              className="tsc-submit-btn"
              onClick={handleComplete}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save & Continue'}
            </button>

            <p className="tsc-encouragement">
              {category === 'internal'
                ? "Awareness is the first step. You're doing the work. 💪"
                : "Life happens. Tomorrow's a new day. 🌅"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Also export the reason constants for use elsewhere
export { EXTERNAL_REASONS, INTERNAL_REASONS }
