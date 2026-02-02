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
  const [selectedEnergy, setSelectedEnergy] = useState(null) // 'excited' or 'tired'
  const [selectedFlow, setSelectedFlow] = useState(null) // 'ease' or 'resistance'
  const [headline, setHeadline] = useState('')
  const [comment, setComment] = useState('')

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
    if (dir === 'north') return 'Flow'
    if (dir === 'east') return 'Redirect'
    if (dir === 'south') return 'Rest'
    if (dir === 'west') return 'Honour'
    return ''
  }

  const getDirectionEmoji = () => {
    const dir = getDirection()
    if (dir === 'north') return '🌊'
    if (dir === 'east') return '🔄'
    if (dir === 'south') return '🛏️'
    if (dir === 'west') return '🙏'
    return ''
  }

  const canSubmit = () => {
    return selectedEnergy && selectedFlow && projectId
  }

  const handleSubmit = () => {
    if (!selectedEnergy || !selectedFlow) {
      alert('Please answer both questions')
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
      activity_description: headline.trim() || 'Flow check-in',
      reasoning: comment.trim() || 'Daily reflection',
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
      <div className="checkin-view">
        {/* Energy Question */}
        <div className="question-group">
          <h4 className="question-heading">Are you feeling excited or tired?</h4>
          <div className="button-row">
            <button
              className={`energy-btn energy-excited ${selectedEnergy === 'excited' ? 'selected' : ''}`}
              onClick={() => setSelectedEnergy('excited')}
            >
              <span className="option-emoji">🔥</span>
              <span>Excited</span>
            </button>
            <button
              className={`energy-btn energy-tired ${selectedEnergy === 'tired' ? 'selected' : ''}`}
              onClick={() => setSelectedEnergy('tired')}
            >
              <span className="option-emoji">😴</span>
              <span>Tired</span>
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
              <span className="option-emoji">✨</span>
              <span>Great</span>
            </button>
            <button
              className={`flow-btn flow-resistance ${selectedFlow === 'resistance' ? 'selected' : ''}`}
              onClick={() => setSelectedFlow('resistance')}
            >
              <span className="option-emoji">🧗</span>
              <span>Facing Resistance</span>
            </button>
          </div>
        </div>

        {/* Direction Preview */}
        {selectedEnergy && selectedFlow && (
          <div className={`direction-preview direction-${getDirection()}`}>
            <span className="direction-emoji">{getDirectionEmoji()}</span>
            <span className="direction-label">{getDirectionLabel()}</span>
          </div>
        )}

        {/* Headline */}
        <div className="input-group">
          <label>Headline</label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g., Landed a new client, Stuck on pricing..."
            className="headline-input"
          />
        </div>

        {/* Comment */}
        <div className="input-group">
          <label>Comment (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Any additional thoughts..."
            rows="3"
            className="comment-textarea"
          />
        </div>

        {/* Complete Button */}
        <button
          className="complete-btn"
          onClick={handleSubmit}
          disabled={!canSubmit()}
        >
          Complete Quest (+{quest.points} XP)
        </button>
      </div>
    </div>
  )
}

export default FlowCompassInput
