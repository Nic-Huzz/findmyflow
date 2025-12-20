/**
 * ExistingProjectFlow.jsx
 *
 * Captures existing projects for Vibe Risers and Movement Makers
 * who already have a project/business they're working on.
 *
 * Questions:
 * 1. Project name
 * 2. Brief description
 * 3. Skills used (text/optional link)
 * 4. Problem solved (text/optional link)
 * 5. Ideal customer (text/optional link)
 * 6. Duration working on it
 * 7. Major milestone moments
 * 8. Major resistant moments
 * 9. Current feeling about it
 * 10. Stage determination
 *
 * Created: Dec 2024
 * Part of project-based refactor (see docs/2024-12-20-major-refactor-plan.md)
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { createExistingProject } from '../lib/projectCreation'
import { STAGES, determineStartingStage } from '../lib/stageConfig'
import { supabase } from '../lib/supabaseClient'
import './ExistingProjectFlow.css'

const FLOW_STAGES = {
  NAME: 'name',
  DESCRIPTION: 'description',
  DURATION: 'duration',
  MILESTONES: 'milestones',
  RESISTANCE: 'resistance',
  FEELING: 'feeling',
  STAGE: 'stage',
  SAVING: 'saving',
  SUCCESS: 'success'
}

const DURATION_OPTIONS = [
  { value: 'less_than_month', label: 'Less than a month' },
  { value: '1_3_months', label: '1-3 months' },
  { value: '3_6_months', label: '3-6 months' },
  { value: '6_12_months', label: '6-12 months' },
  { value: '1_2_years', label: '1-2 years' },
  { value: 'more_than_2_years', label: 'More than 2 years' }
]

const FEELING_OPTIONS = [
  { value: 'excited', label: 'Excited and energized', emoji: '🔥' },
  { value: 'hopeful', label: 'Hopeful but uncertain', emoji: '🌱' },
  { value: 'stuck', label: 'Stuck and looking for direction', emoji: '🧭' },
  { value: 'frustrated', label: 'Frustrated but determined', emoji: '💪' },
  { value: 'mixed', label: 'Mixed feelings', emoji: '🌊' }
]

const STAGE_OPTIONS = [
  { value: 'not_validated', label: "Haven't validated with customers yet", stage: STAGES.VALIDATION },
  { value: 'validated_no_product', label: 'Validated but no full product', stage: STAGES.PRODUCT_CREATION },
  { value: 'have_product_not_tested', label: 'Have product, not tested broadly', stage: STAGES.TESTING },
  { value: 'have_product_with_customers', label: 'Have product with paying customers', stage: STAGES.MONEY_MODELS },
  { value: 'multiple_offers_ready_to_scale', label: 'Multiple offers, ready to scale marketing', stage: STAGES.CAMPAIGN_CREATION },
  { value: 'ready_to_launch_campaign', label: 'Ready to launch major campaign', stage: STAGES.LAUNCH }
]

function ExistingProjectFlow({ onComplete, onBack }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [stage, setStage] = useState(FLOW_STAGES.NAME)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Form state
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    duration: '',
    milestoneMoments: [],
    resistantMoments: [],
    currentFeeling: '',
    stageAnswer: '',
    startingStage: STAGES.VALIDATION
  })

  // Temp state for array inputs
  const [currentMilestone, setCurrentMilestone] = useState('')
  const [currentResistance, setCurrentResistance] = useState('')

  const updateProjectData = (field, value) => {
    setProjectData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    switch (stage) {
      case FLOW_STAGES.NAME:
        if (projectData.name.trim()) setStage(FLOW_STAGES.DESCRIPTION)
        break
      case FLOW_STAGES.DESCRIPTION:
        setStage(FLOW_STAGES.DURATION)
        break
      case FLOW_STAGES.DURATION:
        if (projectData.duration) setStage(FLOW_STAGES.MILESTONES)
        break
      case FLOW_STAGES.MILESTONES:
        setStage(FLOW_STAGES.RESISTANCE)
        break
      case FLOW_STAGES.RESISTANCE:
        setStage(FLOW_STAGES.FEELING)
        break
      case FLOW_STAGES.FEELING:
        if (projectData.currentFeeling) setStage(FLOW_STAGES.STAGE)
        break
      case FLOW_STAGES.STAGE:
        if (projectData.stageAnswer) handleSubmit()
        break
      default:
        break
    }
  }

  const handleBack = () => {
    switch (stage) {
      case FLOW_STAGES.NAME:
        onBack?.()
        break
      case FLOW_STAGES.DESCRIPTION:
        setStage(FLOW_STAGES.NAME)
        break
      case FLOW_STAGES.DURATION:
        setStage(FLOW_STAGES.DESCRIPTION)
        break
      case FLOW_STAGES.MILESTONES:
        setStage(FLOW_STAGES.DURATION)
        break
      case FLOW_STAGES.RESISTANCE:
        setStage(FLOW_STAGES.MILESTONES)
        break
      case FLOW_STAGES.FEELING:
        setStage(FLOW_STAGES.RESISTANCE)
        break
      case FLOW_STAGES.STAGE:
        setStage(FLOW_STAGES.FEELING)
        break
      default:
        break
    }
  }

  const addMilestone = () => {
    if (currentMilestone.trim()) {
      updateProjectData('milestoneMoments', [...projectData.milestoneMoments, currentMilestone.trim()])
      setCurrentMilestone('')
    }
  }

  const removeMilestone = (index) => {
    updateProjectData('milestoneMoments', projectData.milestoneMoments.filter((_, i) => i !== index))
  }

  const addResistance = () => {
    if (currentResistance.trim()) {
      updateProjectData('resistantMoments', [...projectData.resistantMoments, currentResistance.trim()])
      setCurrentResistance('')
    }
  }

  const removeResistance = (index) => {
    updateProjectData('resistantMoments', projectData.resistantMoments.filter((_, i) => i !== index))
  }

  const handleStageSelect = (option) => {
    updateProjectData('stageAnswer', option.value)
    updateProjectData('startingStage', option.stage)
  }

  const handleSubmit = async () => {
    if (!user?.id) {
      setError('Please log in to continue')
      return
    }

    setStage(FLOW_STAGES.SAVING)
    setIsLoading(true)
    setError(null)

    try {
      const result = await createExistingProject(user.id, {
        name: projectData.name,
        description: projectData.description,
        duration: projectData.duration,
        milestoneMoments: projectData.milestoneMoments,
        resistantMoments: projectData.resistantMoments,
        currentFeeling: projectData.currentFeeling,
        startingStage: projectData.startingStage
      })

      if (result.success) {
        // Mark onboarding as complete
        await supabase
          .from('user_stage_progress')
          .update({ onboarding_completed: true })
          .eq('user_id', user.id)

        setStage(FLOW_STAGES.SUCCESS)
        setTimeout(() => {
          onComplete?.(result)
          navigate('/me')
        }, 2000)
      } else {
        setError(result.error || 'Failed to create project')
        setStage(FLOW_STAGES.STAGE)
      }
    } catch (err) {
      console.error('Error creating project:', err)
      setError('Something went wrong. Please try again.')
      setStage(FLOW_STAGES.STAGE)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate progress
  const stages = Object.values(FLOW_STAGES).filter(s => s !== 'saving' && s !== 'success')
  const currentIndex = stages.indexOf(stage)
  const progress = ((currentIndex + 1) / stages.length) * 100

  // Render stages
  return (
    <div className="existing-project-flow">
      {stage !== FLOW_STAGES.SAVING && stage !== FLOW_STAGES.SUCCESS && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* NAME STAGE */}
      {stage === FLOW_STAGES.NAME && (
        <div className="flow-step">
          <h2>Tell me about your project</h2>
          <p className="step-subtitle">What's the name of your project or business?</p>
          <input
            type="text"
            value={projectData.name}
            onChange={(e) => updateProjectData('name', e.target.value)}
            placeholder="e.g., My Coaching Business"
            className="flow-input"
            autoFocus
          />
          <div className="button-row">
            {onBack && (
              <button className="secondary-button" onClick={handleBack}>
                Back
              </button>
            )}
            <button
              className="primary-button"
              onClick={handleNext}
              disabled={!projectData.name.trim()}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* DESCRIPTION STAGE */}
      {stage === FLOW_STAGES.DESCRIPTION && (
        <div className="flow-step">
          <h2>Describe {projectData.name}</h2>
          <p className="step-subtitle">In a sentence or two, what do you do?</p>
          <textarea
            value={projectData.description}
            onChange={(e) => updateProjectData('description', e.target.value)}
            placeholder="I help [who] with [what] so they can [result]..."
            className="flow-textarea"
            rows={4}
            autoFocus
          />
          <div className="button-row">
            <button className="secondary-button" onClick={handleBack}>
              Back
            </button>
            <button
              className="primary-button"
              onClick={handleNext}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* DURATION STAGE */}
      {stage === FLOW_STAGES.DURATION && (
        <div className="flow-step">
          <h2>How long have you been working on this?</h2>
          <div className="options-grid">
            {DURATION_OPTIONS.map(option => (
              <button
                key={option.value}
                className={`option-button ${projectData.duration === option.value ? 'selected' : ''}`}
                onClick={() => updateProjectData('duration', option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="button-row">
            <button className="secondary-button" onClick={handleBack}>
              Back
            </button>
            <button
              className="primary-button"
              onClick={handleNext}
              disabled={!projectData.duration}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* MILESTONES STAGE */}
      {stage === FLOW_STAGES.MILESTONES && (
        <div className="flow-step">
          <h2>Major milestone moments</h2>
          <p className="step-subtitle">What wins or breakthroughs have you had? (Add as many as you like)</p>

          <div className="tag-input-container">
            <input
              type="text"
              value={currentMilestone}
              onChange={(e) => setCurrentMilestone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMilestone()}
              placeholder="e.g., Got my first paying client"
              className="flow-input"
            />
            <button className="add-button" onClick={addMilestone}>Add</button>
          </div>

          {projectData.milestoneMoments.length > 0 && (
            <div className="tags-list">
              {projectData.milestoneMoments.map((item, index) => (
                <span key={index} className="tag milestone-tag">
                  {item}
                  <button onClick={() => removeMilestone(index)}>&times;</button>
                </span>
              ))}
            </div>
          )}

          <div className="button-row">
            <button className="secondary-button" onClick={handleBack}>
              Back
            </button>
            <button className="primary-button" onClick={handleNext}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* RESISTANCE STAGE */}
      {stage === FLOW_STAGES.RESISTANCE && (
        <div className="flow-step">
          <h2>Major resistant moments</h2>
          <p className="step-subtitle">What challenges or blocks have you faced? (Add as many as you like)</p>

          <div className="tag-input-container">
            <input
              type="text"
              value={currentResistance}
              onChange={(e) => setCurrentResistance(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addResistance()}
              placeholder="e.g., Fear of putting myself out there"
              className="flow-input"
            />
            <button className="add-button" onClick={addResistance}>Add</button>
          </div>

          {projectData.resistantMoments.length > 0 && (
            <div className="tags-list">
              {projectData.resistantMoments.map((item, index) => (
                <span key={index} className="tag resistance-tag">
                  {item}
                  <button onClick={() => removeResistance(index)}>&times;</button>
                </span>
              ))}
            </div>
          )}

          <div className="button-row">
            <button className="secondary-button" onClick={handleBack}>
              Back
            </button>
            <button className="primary-button" onClick={handleNext}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* FEELING STAGE */}
      {stage === FLOW_STAGES.FEELING && (
        <div className="flow-step">
          <h2>How are you feeling about it right now?</h2>
          <div className="options-grid feeling-options">
            {FEELING_OPTIONS.map(option => (
              <button
                key={option.value}
                className={`option-button ${projectData.currentFeeling === option.value ? 'selected' : ''}`}
                onClick={() => updateProjectData('currentFeeling', option.value)}
              >
                <span className="option-emoji">{option.emoji}</span>
                {option.label}
              </button>
            ))}
          </div>
          <div className="button-row">
            <button className="secondary-button" onClick={handleBack}>
              Back
            </button>
            <button
              className="primary-button"
              onClick={handleNext}
              disabled={!projectData.currentFeeling}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STAGE DETERMINATION */}
      {stage === FLOW_STAGES.STAGE && (
        <div className="flow-step">
          <h2>Where is this project at?</h2>
          <p className="step-subtitle">This helps us show you the right tools and challenges</p>
          <div className="stage-options">
            {STAGE_OPTIONS.map(option => (
              <button
                key={option.value}
                className={`stage-option ${projectData.stageAnswer === option.value ? 'selected' : ''}`}
                onClick={() => handleStageSelect(option)}
              >
                <span className="stage-number">{option.stage}</span>
                <span className="stage-label">{option.label}</span>
              </button>
            ))}
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="button-row">
            <button className="secondary-button" onClick={handleBack}>
              Back
            </button>
            <button
              className="primary-button"
              onClick={handleNext}
              disabled={!projectData.stageAnswer || isLoading}
            >
              {isLoading ? 'Saving...' : 'Create Project'}
            </button>
          </div>
        </div>
      )}

      {/* SAVING STATE */}
      {stage === FLOW_STAGES.SAVING && (
        <div className="flow-step saving-step">
          <div className="loading-spinner" />
          <h2>Creating your project...</h2>
          <p>Setting up {projectData.name}</p>
        </div>
      )}

      {/* SUCCESS STATE */}
      {stage === FLOW_STAGES.SUCCESS && (
        <div className="flow-step success-step">
          <div className="success-icon">✓</div>
          <h2>Project Created!</h2>
          <p>Taking you to your dashboard...</p>
        </div>
      )}
    </div>
  )
}

export default ExistingProjectFlow
