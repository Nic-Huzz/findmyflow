/**
 * OnboardingV2.jsx
 *
 * Self-contained onboarding flow orchestrator
 * Handles Q1-Q3 questions and persona reveal
 *
 * Props:
 * - userId: User ID for saving data
 * - onComplete: Callback with result { persona, wealthLadder, goal, emphasis, pathConfig }
 * - initialData: Optional pre-filled data for resuming
 *
 * Created: Jan 2026
 */

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import {
  determineGuidanceEmphasis,
  derivePersonaFromWealthLadder,
  getValidGoalsForWealthLadder,
  determineOnboardingPath
} from '../../lib/onboardingV2'
import PersonaReveal from './PersonaReveal'
import './OnboardingV2.css'

const STEPS = {
  Q1_JOURNEY: 'q1_journey',
  Q2_WEALTH_LADDER: 'q2_wealth_ladder',
  Q3_GOAL: 'q3_goal',
  PERSONA_REVEAL: 'persona_reveal'
}

// LocalStorage key for resume
const STORAGE_KEY = 'onboarding_v2_progress'

function OnboardingV2({ userId, onComplete, initialData = null }) {
  const [currentStep, setCurrentStep] = useState(STEPS.Q1_JOURNEY)
  const [questions, setQuestions] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Q1-Q3 answers
  const [employmentStatus, setEmploymentStatus] = useState(initialData?.employmentStatus || null)
  const [hasSideProject, setHasSideProject] = useState(initialData?.hasSideProject || false)
  const [wealthLadderRung, setWealthLadderRung] = useState(initialData?.wealthLadderRung || null)
  const [primaryGoal, setPrimaryGoal] = useState(initialData?.primaryGoal || null)

  // Derived values
  const [guidanceEmphasis, setGuidanceEmphasis] = useState(null)
  const [persona, setPersona] = useState(null)

  // Load questions on mount
  useEffect(() => {
    loadQuestions()
    checkForSavedProgress()
  }, [])

  // Save progress on each step change
  useEffect(() => {
    if (userId && currentStep !== STEPS.PERSONA_REVEAL) {
      saveProgressToStorage()
    }
  }, [currentStep, employmentStatus, wealthLadderRung, primaryGoal])

  const loadQuestions = async () => {
    try {
      const response = await fetch(`/persona-assessment.json?v=${Date.now()}`)
      if (!response.ok) throw new Error('Failed to load questions')
      const data = await response.json()
      setQuestions(data)
    } catch (err) {
      console.error('Failed to load questions:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const checkForSavedProgress = () => {
    if (!userId) return
    const saved = localStorage.getItem(`${STORAGE_KEY}_${userId}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Only use if less than 24 hours old
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          if (parsed.employmentStatus) setEmploymentStatus(parsed.employmentStatus)
          if (parsed.hasSideProject) setHasSideProject(parsed.hasSideProject)
          if (parsed.wealthLadderRung) setWealthLadderRung(parsed.wealthLadderRung)
          if (parsed.primaryGoal) setPrimaryGoal(parsed.primaryGoal)
          if (parsed.currentStep) setCurrentStep(parsed.currentStep)
        }
      } catch (e) {
        console.error('Error parsing saved progress:', e)
      }
    }
  }

  const saveProgressToStorage = () => {
    if (!userId) return
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify({
      employmentStatus,
      hasSideProject,
      wealthLadderRung,
      primaryGoal,
      currentStep,
      timestamp: Date.now()
    }))
  }

  const clearSavedProgress = () => {
    if (userId) {
      localStorage.removeItem(`${STORAGE_KEY}_${userId}`)
    }
  }

  // Q1 Handler
  const handleQ1Selection = (option) => {
    setEmploymentStatus(option.value)
    setHasSideProject(
      option.value === 'employed_building' ||
      option.value === 'self_employed_early' ||
      option.value === 'self_employed_established'
    )
    setTimeout(() => setCurrentStep(STEPS.Q2_WEALTH_LADDER), 300)
  }

  // Q2 Handler
  const handleQ2Selection = (option) => {
    const ladderValue = option.data?.wealth_ladder || option.value
    setWealthLadderRung(ladderValue)
    setPrimaryGoal(null) // Reset goal when ladder changes
    setTimeout(() => setCurrentStep(STEPS.Q3_GOAL), 300)
  }

  // Q3 Handler
  const handleQ3Selection = async (option) => {
    const validGoals = getValidGoalsForWealthLadder(wealthLadderRung)
    if (!validGoals.includes(option.value)) return

    setPrimaryGoal(option.value)
    const emphasis = determineGuidanceEmphasis(wealthLadderRung, option.value)
    const derivedPersona = derivePersonaFromWealthLadder(wealthLadderRung)

    setGuidanceEmphasis(emphasis)
    setPersona(derivedPersona)
    setSaveError(null)

    // Save to database and wait for result
    const success = await saveToDatabase(derivedPersona, emphasis, option.value)
    if (success) {
      setTimeout(() => setCurrentStep(STEPS.PERSONA_REVEAL), 300)
    }
  }

  // Save to database - returns true on success, false on failure
  const saveToDatabase = async (derivedPersona, emphasis, goal) => {
    if (!userId) {
      setSaveError('No user ID available. Please refresh and try again.')
      return false
    }
    setIsSaving(true)
    setSaveError(null)

    try {
      // Get path config to determine correct starting stage
      const pathConfig = determineOnboardingPath(wealthLadderRung, goal)
      // Use startingStage from path, default to '0' for pre_ladder (null case)
      const startingStage = pathConfig.startingStage !== null
        ? String(pathConfig.startingStage)
        : '0'

      // Use upsert to handle both new and existing users
      const { error } = await supabase
        .from('user_stage_progress')
        .upsert({
          user_id: userId,
          persona: derivedPersona,
          employment_status: employmentStatus,
          has_side_project: hasSideProject,
          wealth_ladder_rung: wealthLadderRung,
          primary_goal: goal,
          guidance_emphasis: emphasis,
          onboarding_v2_completed: true,
          onboarding_completed: true,
          current_stage: startingStage
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Error saving onboarding data:', error)
        setSaveError('Failed to save your answers. Please try again.')
        return false
      }
      return true
    } catch (err) {
      console.error('Error saving onboarding data:', err)
      setSaveError('Failed to save your answers. Please try again.')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // Handle completion
  const handleComplete = () => {
    clearSavedProgress()
    const pathConfig = determineOnboardingPath(wealthLadderRung, primaryGoal)
    onComplete({
      persona,
      wealthLadder: wealthLadderRung,
      goal: primaryGoal,
      emphasis: guidanceEmphasis,
      employmentStatus,
      hasSideProject,
      pathConfig
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="onboarding-v2 loading">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  // Get current question index for progress dots
  const getQuestionIndex = () => {
    switch (currentStep) {
      case STEPS.Q1_JOURNEY: return 0
      case STEPS.Q2_WEALTH_LADDER: return 1
      case STEPS.Q3_GOAL: return 2
      default: return 3
    }
  }

  // Render progress dots
  const renderProgressDots = () => (
    <div className="onboarding-progress-dots">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className={`dot ${i === getQuestionIndex() ? 'active' : i < getQuestionIndex() ? 'completed' : ''}`}
        />
      ))}
    </div>
  )

  // PERSONA REVEAL
  if (currentStep === STEPS.PERSONA_REVEAL) {
    return (
      <div className="onboarding-v2">
        <PersonaReveal
          persona={persona}
          wealthLadder={wealthLadderRung}
          emphasis={guidanceEmphasis}
          showWealthLadder={true}
          onContinue={handleComplete}
        />
      </div>
    )
  }

  // Get current question data
  const questionIndex = getQuestionIndex()
  const question = questions?.questions?.[questionIndex]
  const validGoals = currentStep === STEPS.Q3_GOAL
    ? getValidGoalsForWealthLadder(wealthLadderRung)
    : null

  // Get warm transition text
  const transitionText = currentStep === STEPS.Q2_WEALTH_LADDER
    ? questions?.ux_config?.warm_transitions?.after_q1
    : currentStep === STEPS.Q3_GOAL
      ? questions?.ux_config?.warm_transitions?.after_q2
      : null

  // Determine handler
  const handleOptionClick = (option) => {
    if (currentStep === STEPS.Q1_JOURNEY) handleQ1Selection(option)
    else if (currentStep === STEPS.Q2_WEALTH_LADDER) handleQ2Selection(option)
    else if (currentStep === STEPS.Q3_GOAL) handleQ3Selection(option)
  }

  // Get previous step for back button
  const getPreviousStep = () => {
    if (currentStep === STEPS.Q2_WEALTH_LADDER) return STEPS.Q1_JOURNEY
    if (currentStep === STEPS.Q3_GOAL) return STEPS.Q2_WEALTH_LADDER
    return null
  }

  if (!question) {
    return (
      <div className="onboarding-v2 error">
        <p>Failed to load questions. Please refresh.</p>
        <button onClick={() => window.location.reload()}>Refresh</button>
      </div>
    )
  }

  return (
    <div className="onboarding-v2">
      {renderProgressDots()}

      <div className="question-container">
        {transitionText && (
          <p className="transition-text">{transitionText}</p>
        )}

        <h2 className="question-title">{question.question}</h2>
        <p className="question-subtext">{question.subtext || 'Your answers help us personalise your journey'}</p>

        {saveError && (
          <div className="save-error">
            <p>{saveError}</p>
            <button onClick={() => setSaveError(null)}>Dismiss</button>
          </div>
        )}

        <div className="options-list">
          {question.options.map((option) => {
            const isDisabled = validGoals && !validGoals.includes(option.value)

            return (
              <button
                key={option.value}
                className={`option-button ${isDisabled ? 'disabled' : ''} ${isSaving ? 'saving' : ''}`}
                onClick={() => !isDisabled && !isSaving && handleOptionClick(option)}
                disabled={isDisabled || isSaving}
              >
                <span className="option-label">{option.label}</span>
                <span className="option-description">{option.description}</span>
                {isDisabled && (
                  <span className="option-locked">Not available at your stage</span>
                )}
              </button>
            )
          })}
        </div>

        {getPreviousStep() && (
          <button
            className="back-button"
            onClick={() => setCurrentStep(getPreviousStep())}
          >
            Back
          </button>
        )}
      </div>
    </div>
  )
}

export default OnboardingV2
