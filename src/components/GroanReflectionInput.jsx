/**
 * GroanReflectionInput.jsx
 *
 * Captures protective voices and fears when completing groan/visibility quests.
 * Multi-step form:
 *   Step 1: What did you do? (text input for the groan task)
 *   Step 2: Which protective voice showed up? (5 archetypes)
 *   Step 3: What fear came up? (7 fear types)
 *   Step 4: How did the process feel? (flow direction N/E/S/W)
 *   Step 5: Optional deeper reflection
 *
 * Data feeds into: Nervous System flow, Healing Compass, AI personalization
 */

import { useState } from 'react'
import './GroanReflectionInput.css'

// Protective archetypes with descriptions
const ARCHETYPES = [
  {
    id: 'ghost',
    name: 'The Ghost',
    icon: '👻',
    description: 'Wants to disappear, avoid being seen',
    color: '#6b7280'
  },
  {
    id: 'people_pleaser',
    name: 'The People Pleaser',
    icon: '🎭',
    description: 'Worried about what others will think',
    color: '#ec4899'
  },
  {
    id: 'perfectionist',
    name: 'The Perfectionist',
    icon: '✨',
    description: "It's not good enough yet",
    color: '#8b5cf6'
  },
  {
    id: 'performer',
    name: 'The Performer',
    icon: '🎪',
    description: 'Only shows the polished version',
    color: '#f59e0b'
  },
  {
    id: 'controller',
    name: 'The Controller',
    icon: '🎯',
    description: "Can't let go, needs certainty",
    color: '#3b82f6'
  }
]

// Fear types
const FEAR_TYPES = [
  { id: 'rejection', label: 'Rejection', icon: '🚪', description: 'Fear of being turned away' },
  { id: 'judgment', label: 'Judgment', icon: '👁️', description: 'Fear of being criticized' },
  { id: 'not_good_enough', label: 'Not Good Enough', icon: '📉', description: 'Fear of inadequacy' },
  { id: 'failure', label: 'Failure', icon: '💔', description: 'Fear of things not working out' },
  { id: 'visibility', label: 'Being Seen', icon: '🔦', description: 'Fear of exposure' },
  { id: 'success', label: 'Success', icon: '🏆', description: 'Fear of what success brings' },
  { id: 'other', label: 'Something Else', icon: '❓', description: "I'll explain below" }
]

// Flow directions for how the action felt
const FLOW_DIRECTIONS = [
  {
    id: 'north',
    label: 'Flowing & Excited',
    icon: '⬆️',
    description: 'It felt easy and energizing',
    color: '#10b981',
    energy: 'excited',
    flow: 'ease'
  },
  {
    id: 'east',
    label: 'Challenging & Excited',
    icon: '➡️',
    description: 'Hard but I felt alive doing it',
    color: '#3b82f6',
    energy: 'excited',
    flow: 'resistance'
  },
  {
    id: 'south',
    label: 'Draining & Hard',
    icon: '⬇️',
    description: 'Exhausting and difficult',
    color: '#ef4444',
    energy: 'tired',
    flow: 'resistance'
  },
  {
    id: 'west',
    label: 'Easy but Tiring',
    icon: '⬅️',
    description: 'Smooth but drained my energy',
    color: '#fbbf24',
    energy: 'tired',
    flow: 'ease'
  }
]

function GroanReflectionInput({ quest, onComplete, projectId, challengeInstanceId, stage }) {
  const [step, setStep] = useState(1)
  const [groanTask, setGroanTask] = useState('')
  const [selectedArchetype, setSelectedArchetype] = useState(null)
  const [selectedFear, setSelectedFear] = useState(null)
  const [selectedDirection, setSelectedDirection] = useState(null)
  const [reflectionNote, setReflectionNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalSteps = 5

  const canContinue = () => {
    switch (step) {
      case 1: return groanTask.trim().length >= 10
      case 2: return selectedArchetype !== null
      case 3: return selectedFear !== null
      case 4: return selectedDirection !== null
      case 5: return true // Reflection is optional
      default: return false
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

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const groanData = {
        groan_task: groanTask.trim(),
        protective_archetype: selectedArchetype,
        fear_type: selectedFear,
        flow_direction: selectedDirection,
        reflection_note: reflectionNote.trim() || null,
        project_id: projectId || null,
        challenge_instance_id: challengeInstanceId || null,
        quest_category: quest.category,
        stage: stage || quest.stage_required || null
      }

      // Call the parent's onComplete with the groan data
      await onComplete(quest, groanData)
    } catch (error) {
      console.error('Error submitting groan reflection:', error)
      setIsSubmitting(false)
    }
  }

  const getArchetype = (id) => ARCHETYPES.find(a => a.id === id)
  const getFear = (id) => FEAR_TYPES.find(f => f.id === id)
  const getDirection = (id) => FLOW_DIRECTIONS.find(d => d.id === id)

  return (
    <div className="groan-reflection-input">
      {/* Progress indicator */}
      <div className="groan-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
        <span className="progress-text">Step {step} of {totalSteps}</span>
      </div>

      {/* Step 1: What did you do? */}
      {step === 1 && (
        <div className="groan-step">
          <div className="step-header">
            <span className="step-icon">🦁</span>
            <h4>What groan did you face?</h4>
          </div>
          <p className="step-description">
            A groan is something your essence knows you're capable of, but your body still resists.
            What visibility action did you take?
          </p>
          <textarea
            className="groan-textarea"
            value={groanTask}
            onChange={(e) => setGroanTask(e.target.value)}
            placeholder="e.g., Posted about my offer on social media, reached out to a potential client, asked for a testimonial..."
            rows={3}
          />
          <div className="char-hint">
            {groanTask.length < 10
              ? `${10 - groanTask.length} more characters needed`
              : '✓ Ready to continue'}
          </div>
        </div>
      )}

      {/* Step 2: Protective archetype */}
      {step === 2 && (
        <div className="groan-step">
          <div className="step-header">
            <span className="step-icon">🛡️</span>
            <h4>Which protective voice showed up?</h4>
          </div>
          <p className="step-description">
            Before or during this action, which inner voice tried to stop you?
          </p>
          <div className="archetype-grid">
            {ARCHETYPES.map(archetype => (
              <button
                key={archetype.id}
                className={`archetype-card ${selectedArchetype === archetype.id ? 'selected' : ''}`}
                onClick={() => setSelectedArchetype(archetype.id)}
                style={{
                  '--archetype-color': archetype.color,
                  borderColor: selectedArchetype === archetype.id ? archetype.color : undefined
                }}
              >
                <span className="archetype-icon">{archetype.icon}</span>
                <span className="archetype-name">{archetype.name}</span>
                <span className="archetype-desc">{archetype.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Fear type */}
      {step === 3 && (
        <div className="groan-step">
          <div className="step-header">
            <span className="step-icon">💭</span>
            <h4>What fear came up?</h4>
          </div>
          <p className="step-description">
            What was the underlying fear that {getArchetype(selectedArchetype)?.name} was trying to protect you from?
          </p>
          <div className="fear-grid">
            {FEAR_TYPES.map(fear => (
              <button
                key={fear.id}
                className={`fear-card ${selectedFear === fear.id ? 'selected' : ''}`}
                onClick={() => setSelectedFear(fear.id)}
              >
                <span className="fear-icon">{fear.icon}</span>
                <span className="fear-label">{fear.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: How did it feel? (Flow direction) */}
      {step === 4 && (
        <div className="groan-step">
          <div className="step-header">
            <span className="step-icon">🧭</span>
            <h4>How did the process feel?</h4>
          </div>
          <p className="step-description">
            Despite {getArchetype(selectedArchetype)?.name} showing up, you did it anyway. How did that feel?
          </p>
          <div className="direction-grid">
            {FLOW_DIRECTIONS.map(direction => (
              <button
                key={direction.id}
                className={`direction-card ${selectedDirection === direction.id ? 'selected' : ''}`}
                onClick={() => setSelectedDirection(direction.id)}
                style={{
                  '--direction-color': direction.color,
                  borderColor: selectedDirection === direction.id ? direction.color : undefined,
                  backgroundColor: selectedDirection === direction.id ? `${direction.color}20` : undefined
                }}
              >
                <span className="direction-icon">{direction.icon}</span>
                <span className="direction-label">{direction.label}</span>
                <span className="direction-desc">{direction.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 5: Optional reflection */}
      {step === 5 && (
        <div className="groan-step">
          <div className="step-header">
            <span className="step-icon">📝</span>
            <h4>Any deeper insights?</h4>
          </div>

          {/* Summary of selections */}
          <div className="selection-summary">
            <div className="summary-item">
              <span className="summary-label">You faced:</span>
              <span className="summary-value">{groanTask}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Voice that showed up:</span>
              <span className="summary-value">
                {getArchetype(selectedArchetype)?.icon} {getArchetype(selectedArchetype)?.name}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Fear underneath:</span>
              <span className="summary-value">
                {getFear(selectedFear)?.icon} {getFear(selectedFear)?.label}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">How it felt:</span>
              <span
                className="summary-value direction-badge"
                style={{ color: getDirection(selectedDirection)?.color }}
              >
                {getDirection(selectedDirection)?.icon} {getDirection(selectedDirection)?.label}
              </span>
            </div>
          </div>

          <p className="step-description">
            Anything else you want to remember about this moment? (Optional)
          </p>
          <textarea
            className="groan-textarea reflection"
            value={reflectionNote}
            onChange={(e) => setReflectionNote(e.target.value)}
            placeholder="What did you learn? What surprised you? How do you feel now that it's done?"
            rows={3}
          />
        </div>
      )}

      {/* Navigation buttons */}
      <div className="groan-navigation">
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
            {isSubmitting ? 'Saving...' : `Complete Quest (+${quest.points} pts)`}
          </button>
        )}
      </div>

      {/* Encouragement message */}
      {step === 5 && (
        <p className="groan-encouragement">
          You faced your groan and did it anyway. That's how we expand our capacity for visibility.
        </p>
      )}
    </div>
  )
}

export default GroanReflectionInput
