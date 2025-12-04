import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import FlowCompass from './FlowCompass'
import './FlowCompassInput.css'

/**
 * FlowCompassInput - Quest input component for logging flow within challenges
 *
 * Props:
 * - quest: Quest object
 * - onComplete: (quest, data) => void - Callback when user completes
 */

function FlowCompassInput({ quest, onComplete }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [hasProject, setHasProject] = useState(null) // null = loading, true/false = result
  const [step, setStep] = useState(1) // 1: compass, 2: context
  const [direction, setDirection] = useState(null)
  const [internalState, setInternalState] = useState(null)
  const [externalState, setExternalState] = useState(null)
  const [activityDescription, setActivityDescription] = useState('')
  const [reasoning, setReasoning] = useState('')

  // Check if user has a project on mount
  useEffect(() => {
    const checkProject = async () => {
      if (!user?.id) return

      try {
        const { data, error } = await supabase
          .from('user_projects')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)

        if (error) throw error

        setHasProject(data && data.length > 0)
      } catch (error) {
        console.error('Error checking project:', error)
        setHasProject(false)
      }
    }

    checkProject()
  }, [user])

  const handleCompassSelect = (dir, internal, external) => {
    setDirection(dir)
    setInternalState(internal)
    setExternalState(external)
    setStep(2)
  }

  const handleSubmit = () => {
    if (!reasoning || reasoning.trim().length < 10) {
      alert('Please describe what happened (at least 10 characters)')
      return
    }

    // Structure data for quest completion
    const flowData = {
      direction,
      internal_state: internalState,
      external_state: externalState,
      activity_description: activityDescription,
      reasoning: reasoning.trim()
    }

    // Call completion callback
    onComplete(quest, flowData)
  }

  // Show loading state while checking project
  if (hasProject === null) {
    return (
      <div className="flow-compass-input">
        <div className="compass-step">
          <p className="step-instruction">Loading...</p>
        </div>
      </div>
    )
  }

  // Show redirect if no project exists
  if (hasProject === false) {
    return (
      <div className="flow-compass-input">
        <div className="compass-step">
          <p className="step-instruction" style={{ marginBottom: '16px' }}>
            To track your flow, you need to set up your Flow Compass first.
          </p>
          <button
            className="quest-flow-btn"
            onClick={() => navigate('/flow-compass')}
            style={{ width: '100%' }}
          >
            Start Your Flow Compass →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flow-compass-input">
      {step === 1 && (
        <div className="compass-step">
          <p className="step-instruction">
            How did this quest go? Select the direction that matches your experience:
          </p>

          <FlowCompass
            onSelect={handleCompassSelect}
            selectedDirection={direction}
            size="medium"
            showLabels={true}
          />

          <div className="compass-legend-small">
            <p><strong>😊 Excited</strong> → You felt energized and motivated</p>
            <p><strong>😴 Tired</strong> → You felt drained or unmotivated</p>
            <p><strong>✅ Ease</strong> → Things flowed naturally, made progress</p>
            <p><strong>❌ Resistance</strong> → Hit blockers, struggled to progress</p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="context-step">
          <button
            className="back-btn"
            onClick={() => setStep(1)}
          >
            ← Change Direction
          </button>

          <div className="input-group">
            <label>What were you doing? (optional)</label>
            <input
              type="text"
              value={activityDescription}
              onChange={(e) => setActivityDescription(e.target.value)}
              placeholder="e.g., Working on the quest, Talking to customers..."
              className="activity-input"
            />
          </div>

          <div className="input-group">
            <label>What happened? Why this direction? *</label>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Describe what you experienced while working on this quest..."
              rows="4"
              className="reasoning-textarea"
            />
            <span className="char-count">
              {reasoning.length}/10 characters minimum
            </span>
          </div>

          <button
            className="complete-button"
            onClick={handleSubmit}
            disabled={!reasoning || reasoning.trim().length < 10}
          >
            Complete Quest (+{quest.points} points)
          </button>

          {quest.counts_toward_graduation && (
            <p className="graduation-note">✨ Counts toward stage graduation</p>
          )}
        </div>
      )}
    </div>
  )
}

export default FlowCompassInput
