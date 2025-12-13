import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import './FlowCompassInput.css'

/**
 * FlowCompassInput - Quest input component for logging flow within challenges
 * Updated to match /flow-compass Quick Log UX
 *
 * Props:
 * - quest: Quest object
 * - onComplete: (quest, data) => void - Callback when user completes
 */

function FlowCompassInput({ quest, onComplete }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [hasProject, setHasProject] = useState(null) // null = loading, true/false = result
  const [projectId, setProjectId] = useState(null) // Store the project ID for submission
  const [step, setStep] = useState(1) // 1: quick log, 2: context
  const [selectedEnergy, setSelectedEnergy] = useState(null) // 'excited' or 'tired'
  const [selectedFlow, setSelectedFlow] = useState(null) // 'ease' or 'resistance'
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
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) throw error

        if (data && data.length > 0) {
          setHasProject(true)
          setProjectId(data[0].id) // Store the project ID
        } else {
          setHasProject(false)
        }
      } catch (error) {
        console.error('Error checking project:', error)
        setHasProject(false)
      }
    }

    checkProject()
  }, [user])

  // Calculate direction from energy + flow
  const getDirection = () => {
    if (selectedEnergy === 'excited' && selectedFlow === 'ease') return 'north'
    if (selectedEnergy === 'excited' && selectedFlow === 'resistance') return 'east'
    if (selectedEnergy === 'tired' && selectedFlow === 'resistance') return 'south'
    if (selectedEnergy === 'tired' && selectedFlow === 'ease') return 'west'
    return null
  }

  const getDirectionLabel = () => {
    const dir = getDirection()
    if (dir === 'north') return 'Flowing (North)'
    if (dir === 'east') return 'Pivoting (East)'
    if (dir === 'south') return 'Resting (South)'
    if (dir === 'west') return 'Honouring (West)'
    return ''
  }

  const handleContinue = () => {
    if (!selectedEnergy || !selectedFlow) {
      alert('Please answer both questions')
      return
    }
    setStep(2)
  }

  const handleSubmit = () => {
    if (!reasoning || reasoning.trim().length < 10) {
      alert('Please describe what happened (at least 10 characters)')
      return
    }

    if (!projectId) {
      alert('Please set up your Flow Compass first')
      navigate('/flow-compass')
      return
    }

    const direction = getDirection()

    // Structure data for quest completion
    const flowData = {
      direction,
      internal_state: selectedEnergy,
      external_state: selectedFlow,
      activity_description: activityDescription,
      reasoning: reasoning.trim(),
      project_id: projectId
    }

    // Call completion callback
    onComplete(quest, flowData)
  }

  // Show loading state while checking project
  if (hasProject === null) {
    return (
      <div className="flow-compass-input">
        <div className="compass-loading">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Show redirect if no project exists
  if (hasProject === false) {
    return (
      <div className="flow-compass-input">
        <div className="compass-no-project">
          <p className="no-project-text">
            To track your flow, you need to set up your Flow Compass first.
          </p>
          <button
            className="start-compass-btn"
            onClick={() => navigate('/flow-compass')}
          >
            Start Your Flow Compass
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flow-compass-input">
      {step === 1 && (
        <div className="quick-log-step">
          {/* Energy Question */}
          <div className="question-group">
            <h4 className="question-heading">Are you feeling excited or tired?</h4>
            <div className="button-row">
              <button
                className={`energy-btn energy-excited ${selectedEnergy === 'excited' ? 'selected' : ''}`}
                onClick={() => setSelectedEnergy('excited')}
              >
                Excited
              </button>
              <button
                className={`energy-btn energy-tired ${selectedEnergy === 'tired' ? 'selected' : ''}`}
                onClick={() => setSelectedEnergy('tired')}
              >
                Tired
              </button>
            </div>
          </div>

          {/* Flow Question */}
          <div className="question-group">
            <h4 className="question-heading">How is the project flowing?</h4>
            <div className="button-row">
              <button
                className={`flow-btn flow-great ${selectedFlow === 'ease' ? 'selected' : ''}`}
                onClick={() => setSelectedFlow('ease')}
              >
                <span className="arrow-icon">↑</span>
                <span>Great</span>
              </button>
              <button
                className={`flow-btn flow-resistance ${selectedFlow === 'resistance' ? 'selected' : ''}`}
                onClick={() => setSelectedFlow('resistance')}
              >
                <span className="arrow-icon">→</span>
                <span>Facing Resistance</span>
              </button>
            </div>
          </div>

          {/* Direction Preview */}
          {selectedEnergy && selectedFlow && (
            <div className={`direction-preview direction-${getDirection()}`}>
              <span className="direction-label">{getDirectionLabel()}</span>
            </div>
          )}

          {/* Continue Button */}
          <button
            className="continue-btn"
            onClick={handleContinue}
            disabled={!selectedEnergy || !selectedFlow}
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="context-step">
          <button
            className="back-btn"
            onClick={() => setStep(1)}
          >
            ← Change Selection
          </button>

          <div className={`direction-badge direction-${getDirection()}`}>
            {getDirectionLabel()}
          </div>

          <div className="input-group">
            <label>What were you doing? (optional)</label>
            <input
              type="text"
              value={activityDescription}
              onChange={(e) => setActivityDescription(e.target.value)}
              placeholder="e.g., Working on my project, Talking to customers..."
              className="activity-input"
            />
          </div>

          <div className="input-group">
            <label>What happened? Why this direction? *</label>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Describe what you experienced..."
              rows="3"
              className="reasoning-textarea"
            />
            <span className="char-count">
              {reasoning.length}/10 characters minimum
            </span>
          </div>

          <button
            className="complete-btn"
            onClick={handleSubmit}
            disabled={!reasoning || reasoning.trim().length < 10}
          >
            Complete Quest (+{quest.points} points)
          </button>
        </div>
      )}
    </div>
  )
}

export default FlowCompassInput
