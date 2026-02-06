/**
 * ExistingProjectFlow.jsx
 *
 * Captures existing business info for Vibe Risers and Movement Makers
 * who already have a business they're working on.
 *
 * Questions (6 steps):
 * 1. Business name
 * 2. One-liner description
 * 3. Skills used (tag input)
 * 4. Problem solved
 * 5. Ideal customer/persona
 * 6. Stage determination
 *
 * Skills, problem, and persona are saved as seed clusters for Flow Finder.
 *
 * Created: Dec 2024
 * Updated: Dec 2024 - Simplified to 6 steps, added seed cluster capture
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { createExistingProject } from '../lib/projectCreation'
import { STAGES } from '../lib/stageConfig'
import { supabase } from '../lib/supabaseClient'
import './ExistingProjectFlow.css'

const FLOW_STAGES = {
  NAME: 'name',
  DESCRIPTION: 'description',
  SKILLS: 'skills',
  PROBLEM: 'problem',
  PERSONA: 'persona',
  STAGE: 'stage',
  SAVING: 'saving',
  SUCCESS: 'success'
}

const STAGE_OPTIONS = [
  { value: 'not_validated', label: "Haven't validated with customers yet", stage: STAGES.VALIDATION },
  { value: 'validated_no_product', label: 'Validated but no full product', stage: STAGES.PRODUCT_CREATION },
  { value: 'have_product_not_tested', label: 'Have product, not tested broadly', stage: STAGES.TESTING },
  { value: 'have_product_with_customers', label: 'Have product with paying customers', stage: STAGES.MONEY_MODELS },
  { value: 'have_money_models_need_grand_slam', label: 'Have money models, need Grand Slam offer', stage: STAGES.OFFER_CREATION },
  { value: 'multiple_offers_ready_to_scale', label: 'Grand Slam offer ready, need marketing', stage: STAGES.CAMPAIGN_CREATION },
  { value: 'ready_to_launch_campaign', label: 'Ready to launch major campaign', stage: STAGES.LAUNCH }
]

function ExistingProjectFlow({ onComplete, onBack, onboardingData }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [stage, setStage] = useState(FLOW_STAGES.NAME)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Form state
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    skills: [],
    problem: '',
    persona: '',
    stageAnswer: '',
    startingStage: STAGES.VALIDATION
  })

  // Temp state for skill input
  const [currentSkill, setCurrentSkill] = useState('')

  const updateProjectData = (field, value) => {
    setProjectData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    switch (stage) {
      case FLOW_STAGES.NAME:
        if (projectData.name.trim()) setStage(FLOW_STAGES.DESCRIPTION)
        break
      case FLOW_STAGES.DESCRIPTION:
        setStage(FLOW_STAGES.SKILLS)
        break
      case FLOW_STAGES.SKILLS:
        setStage(FLOW_STAGES.PROBLEM)
        break
      case FLOW_STAGES.PROBLEM:
        setStage(FLOW_STAGES.PERSONA)
        break
      case FLOW_STAGES.PERSONA:
        setStage(FLOW_STAGES.STAGE)
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
      case FLOW_STAGES.SKILLS:
        setStage(FLOW_STAGES.DESCRIPTION)
        break
      case FLOW_STAGES.PROBLEM:
        setStage(FLOW_STAGES.SKILLS)
        break
      case FLOW_STAGES.PERSONA:
        setStage(FLOW_STAGES.PROBLEM)
        break
      case FLOW_STAGES.STAGE:
        setStage(FLOW_STAGES.PERSONA)
        break
      default:
        break
    }
  }

  const addSkill = () => {
    if (currentSkill.trim() && !projectData.skills.includes(currentSkill.trim())) {
      updateProjectData('skills', [...projectData.skills, currentSkill.trim()])
      setCurrentSkill('')
    }
  }

  const removeSkill = (index) => {
    updateProjectData('skills', projectData.skills.filter((_, i) => i !== index))
  }

  const handleStageSelect = (option) => {
    updateProjectData('stageAnswer', option.value)
    updateProjectData('startingStage', option.stage)
  }

  const saveSeedClusters = async (projectId) => {
    if (!user?.id) return

    const seedClusters = []
    const sessionId = crypto.randomUUID()

    // Save skills as seed cluster
    if (projectData.skills.length > 0) {
      seedClusters.push({
        user_id: user.id,
        session_id: sessionId,
        cluster_type: 'skills',
        cluster_stage: 'seed',
        cluster_label: `Skills: ${projectData.skills.slice(0, 3).join(', ')}${projectData.skills.length > 3 ? '...' : ''}`,
        items: projectData.skills,
        insight: `These are your core skills from ${projectData.name}.`,
        source_tags: ['existing_project', projectId]
      })
    }

    // Save problem as seed cluster
    if (projectData.problem.trim()) {
      seedClusters.push({
        user_id: user.id,
        session_id: sessionId,
        cluster_type: 'problems',
        cluster_stage: 'seed',
        cluster_label: projectData.problem.substring(0, 50) + (projectData.problem.length > 50 ? '...' : ''),
        items: [projectData.problem],
        insight: `This is the main problem you solve with ${projectData.name}.`,
        source_tags: ['existing_project', projectId]
      })
    }

    // Save persona as seed cluster
    if (projectData.persona.trim()) {
      seedClusters.push({
        user_id: user.id,
        session_id: sessionId,
        cluster_type: 'persona',
        cluster_stage: 'seed',
        cluster_label: projectData.persona.substring(0, 50) + (projectData.persona.length > 50 ? '...' : ''),
        items: [projectData.persona],
        insight: `This is your ideal customer for ${projectData.name}.`,
        source_tags: ['existing_project', projectId]
      })
    }

    if (seedClusters.length > 0) {
      const { error } = await supabase
        .from('nikigai_clusters')
        .insert(seedClusters)

      if (error) {
        console.error('Error saving seed clusters:', error)
      }
    }
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
        startingStage: projectData.startingStage
      })

      if (result.success) {
        // Save seed clusters for Flow Finder
        await saveSeedClusters(result.project?.id)

        // Mark onboarding as complete + save Q1-Q3 answers
        const { error: updateError } = await supabase
          .from('user_stage_progress')
          .upsert({
            user_id: user.id,
            persona: onboardingData?.persona || null,
            employment_status: onboardingData?.employmentStatus || null,
            has_side_project: onboardingData?.hasSideProject || null,
            wealth_ladder_rung: onboardingData?.wealthLadderRung || null,
            primary_goal: onboardingData?.primaryGoal || null,
            guidance_emphasis: onboardingData?.guidanceEmphasis || null,
            onboarding_completed: true,
            onboarding_v2_completed: true,
            current_stage: String(projectData.startingStage)
          }, {
            onConflict: 'user_id'
          })

        if (updateError) {
          console.error('Error marking onboarding complete:', updateError)
          // Don't block - project was created successfully
        }

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

  // Calculate progress (6 main steps)
  const mainStages = ['name', 'description', 'skills', 'problem', 'persona', 'stage']
  const currentIndex = mainStages.indexOf(stage)
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / mainStages.length) * 100 : 0

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
          <h2>Tell me about your business</h2>
          <p className="step-subtitle">What's the name of your business?</p>
          <input
            type="text"
            value={projectData.name}
            onChange={(e) => updateProjectData('name', e.target.value)}
            placeholder="e.g., Flow Coaching"
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
          <p className="step-subtitle">In one sentence, what does it do?</p>
          <textarea
            value={projectData.description}
            onChange={(e) => updateProjectData('description', e.target.value)}
            placeholder="e.g., I help busy professionals find work-life balance through coaching"
            className="flow-textarea"
            rows={3}
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

      {/* SKILLS STAGE */}
      {stage === FLOW_STAGES.SKILLS && (
        <div className="flow-step">
          <h2>What skills do you use?</h2>
          <p className="step-subtitle">Add the skills you bring to this business</p>

          <div className="tag-input-container">
            <input
              type="text"
              value={currentSkill}
              onChange={(e) => setCurrentSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="e.g., coaching, writing, strategy..."
              className="flow-input"
              autoFocus
            />
            <button className="add-button" onClick={addSkill}>Add</button>
          </div>

          {projectData.skills.length > 0 && (
            <div className="tags-list">
              {projectData.skills.map((skill, index) => (
                <span key={index} className="tag skill-tag">
                  {skill}
                  <button onClick={() => removeSkill(index)}>&times;</button>
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

      {/* PROBLEM STAGE */}
      {stage === FLOW_STAGES.PROBLEM && (
        <div className="flow-step">
          <h2>What problem do you solve?</h2>
          <p className="step-subtitle">What main problem do you solve for your customers?</p>
          <textarea
            value={projectData.problem}
            onChange={(e) => updateProjectData('problem', e.target.value)}
            placeholder="e.g., Busy professionals struggle to find work-life balance and feel burnt out"
            className="flow-textarea"
            rows={3}
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

      {/* PERSONA STAGE */}
      {stage === FLOW_STAGES.PERSONA && (
        <div className="flow-step">
          <h2>Who is your ideal customer?</h2>
          <p className="step-subtitle">Describe your ideal customer in a sentence</p>
          <textarea
            value={projectData.persona}
            onChange={(e) => updateProjectData('persona', e.target.value)}
            placeholder="e.g., Burnt-out executives in their 40s looking for a career change"
            className="flow-textarea"
            rows={3}
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

      {/* STAGE DETERMINATION */}
      {stage === FLOW_STAGES.STAGE && (
        <div className="flow-step">
          <h2>Where is this business at?</h2>
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
              {isLoading ? 'Saving...' : 'Create Business'}
            </button>
          </div>
        </div>
      )}

      {/* SAVING STATE */}
      {stage === FLOW_STAGES.SAVING && (
        <div className="flow-step saving-step">
          <div className="loading-spinner" />
          <h2>Setting up your business...</h2>
          <p>Creating {projectData.name}</p>
        </div>
      )}

      {/* SUCCESS STATE */}
      {stage === FLOW_STAGES.SUCCESS && (
        <div className="flow-step success-step">
          <div className="success-icon">✓</div>
          <h2>Business Created!</h2>
          <p>Taking you to your dashboard...</p>
        </div>
      )}
    </div>
  )
}

export default ExistingProjectFlow
