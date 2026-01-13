/**
 * HomeFirstTime.jsx
 *
 * First-time home screen for users who have completed PersonaAssessment
 * but haven't completed onboarding (no project yet).
 *
 * Shows:
 * 1. Essence archetype card
 * 2. Protective pattern card
 * 3. "Start Finding Your Flow" CTA
 * 4. 3-question persona assessment
 * 5. Branching to Flow Finder or ExistingProjectFlow
 *
 * Created: Dec 2024
 * Part of project-based refactor (see docs/2024-12-20-major-refactor-plan.md)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { essenceProfiles } from '../data/essenceProfiles'
import { protectiveProfiles } from '../data/protectiveProfiles'
import {
  determineGuidanceEmphasis,
  derivePersonaFromWealthLadder,
  getValidGoalsForWealthLadder,
  determineOnboardingPath,
  getPersonaDisplay
} from '../lib/onboardingV2'
import { PersonaReveal, QuickCapture } from './onboarding'
import ExistingProjectFlow from './ExistingProjectFlow'
import './HomeFirstTime.css'

const SCREENS = {
  ARCHETYPE_REVEAL: 'archetype_reveal',
  PERSONA_Q1: 'persona_q1',      // Q1: Journey stage (employment status)
  PERSONA_Q2: 'persona_q2',      // Q2: Wealth ladder
  PERSONA_Q3: 'persona_q3',      // Q3: Goal (with greyed out options)
  PERSONA_REVEAL: 'persona_reveal',
  VIBE_SEEKER_EXPLAINER: 'vibe_seeker_explainer',
  QUICK_CAPTURE: 'quick_capture', // Quick capture for paths 2-4
  PROJECT_TYPE: 'project_type',
  NEW_PROJECT_EXPLAINER: 'new_project_explainer',
  EXISTING_PROJECT: 'existing_project'
}

function HomeFirstTime() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [currentScreen, setCurrentScreen] = useState(SCREENS.ARCHETYPE_REVEAL)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // User archetype data
  const [essenceArchetype, setEssenceArchetype] = useState(null)
  const [protectiveArchetype, setProtectiveArchetype] = useState(null)
  const [userName, setUserName] = useState('')

  // Persona assessment data
  const [personaQuestions, setPersonaQuestions] = useState(null)
  const [personaAnswers, setPersonaAnswers] = useState({})
  const [assignedPersona, setAssignedPersona] = useState(null)

  // Onboarding V2: Wealth ladder + emphasis data
  const [employmentStatus, setEmploymentStatus] = useState(null)
  const [hasSideProject, setHasSideProject] = useState(false)
  const [wealthLadderRung, setWealthLadderRung] = useState(null)
  const [primaryGoal, setPrimaryGoal] = useState(null)
  const [guidanceEmphasis, setGuidanceEmphasis] = useState(null)

  // Load user data and persona questions on mount
  useEffect(() => {
    loadUserData()
    loadPersonaQuestions()
  }, [user])

  const loadUserData = async () => {
    if (!user?.id) return

    try {
      // Fetch lead flow profile (has essence and protective archetypes)
      const { data: leadProfile, error: leadError } = await supabase
        .from('lead_flow_profiles')
        .select('*')
        .eq('email', user.email?.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (leadProfile) {
        setUserName(leadProfile.user_name || user.user_metadata?.name || '')

        // Get essence profile data
        const essenceName = leadProfile.essence_archetype
        if (essenceName) {
          const essenceData = essenceProfiles.essence_archetypes?.find(
            a => a.name?.toLowerCase() === essenceName.toLowerCase()
          )
          setEssenceArchetype(essenceData || { name: essenceName })
        }

        // Get protective profile data
        const protectiveName = leadProfile.protective_archetype
        if (protectiveName) {
          const protectiveData = protectiveProfiles[protectiveName]
          setProtectiveArchetype(protectiveData
            ? { ...protectiveData, name: protectiveName }
            : { name: protectiveName }
          )
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPersonaQuestions = async () => {
    try {
      const response = await fetch(`/persona-assessment.json?v=${Date.now()}`)
      if (!response.ok) throw new Error('Failed to load assessment')
      const data = await response.json()
      setPersonaQuestions(data)
    } catch (err) {
      console.error('Failed to load persona questions:', err)
    }
  }

  // Handle Q1 (Journey Stage) selection
  const handleQ1Selection = (option) => {
    setEmploymentStatus(option.value)
    setHasSideProject(
      option.value === 'employed_building' ||
      option.value === 'solo_early' ||
      option.value === 'solo_established'
    )
    setPersonaAnswers(prev => ({
      ...prev,
      q1_journey: { value: option.value, persona: option.persona, label: option.label }
    }))
    setTimeout(() => setCurrentScreen(SCREENS.PERSONA_Q2), 300)
  }

  // Handle Q2 (Wealth Ladder) selection
  const handleQ2Selection = (option) => {
    const ladderValue = option.data?.wealth_ladder || option.value
    setWealthLadderRung(ladderValue)
    // Reset goal when wealth ladder changes (may invalidate previous selection)
    setPrimaryGoal(null)
    setPersonaAnswers(prev => ({
      ...prev,
      q2_created: { value: option.value, persona: option.persona, label: option.label, wealth_ladder: ladderValue }
    }))
    setTimeout(() => setCurrentScreen(SCREENS.PERSONA_Q3), 300)
  }

  // Handle Q3 (Goal) selection - with validation
  const handleQ3Selection = (option) => {
    const validGoals = getValidGoalsForWealthLadder(wealthLadderRung)
    if (!validGoals.includes(option.value)) return // Shouldn't happen, but safety check

    setPrimaryGoal(option.value)
    const emphasis = determineGuidanceEmphasis(wealthLadderRung, option.value)
    setGuidanceEmphasis(emphasis)

    // Derive persona from wealth ladder (V2 approach - persona is derived, not voted)
    const derivedPersona = derivePersonaFromWealthLadder(wealthLadderRung)

    setPersonaAnswers(prev => ({
      ...prev,
      q3_goal: { value: option.value, persona: option.persona, label: option.label }
    }))

    setAssignedPersona({
      persona: derivedPersona,
      confidence: 'high' // V2 uses wealth ladder derivation, always high confidence
    })

    // Save all V2 data to database
    saveOnboardingV2Data(derivedPersona, emphasis, option.value)
    setTimeout(() => setCurrentScreen(SCREENS.PERSONA_REVEAL), 300)
  }

  // Save all V2 onboarding data to database
  const saveOnboardingV2Data = async (persona, emphasis, goal) => {
    if (!user?.id) return

    try {
      await supabase
        .from('user_stage_progress')
        .update({
          persona: persona,
          employment_status: employmentStatus,
          has_side_project: hasSideProject,
          wealth_ladder_rung: wealthLadderRung,
          primary_goal: goal,
          guidance_emphasis: emphasis,
          onboarding_v2_completed: true,
          // Set initial stage based on wealth ladder
          current_stage: wealthLadderRung === 'pre_ladder' ? null : 1
        })
        .eq('user_id', user.id)
    } catch (err) {
      console.error('Error saving V2 onboarding data:', err)
    }
  }

  // Handle project type selection
  const handleProjectType = (type) => {
    if (type === 'new') {
      // Show explainer before Flow Finder
      setCurrentScreen(SCREENS.NEW_PROJECT_EXPLAINER)
    } else {
      // Show existing project flow
      setCurrentScreen(SCREENS.EXISTING_PROJECT)
    }
  }

  // Handle after persona reveal - uses path routing logic
  const handleContinueAfterPersona = () => {
    // Get the full path configuration based on wealth ladder + goal
    const pathConfig = determineOnboardingPath(wealthLadderRung, primaryGoal)

    if (pathConfig.path === 1) {
      // Path 1 (Pre-ladder): Show Flow Finder explainer
      setCurrentScreen(SCREENS.VIBE_SEEKER_EXPLAINER)
    } else if (pathConfig.showQuickCapture) {
      // Paths 2-4: Go to Quick Capture flow
      setCurrentScreen(SCREENS.QUICK_CAPTURE)
    } else {
      // Fallback: Go to profile
      navigate('/me')
    }
  }

  // Handle Quick Capture completion
  const handleQuickCaptureComplete = (capturedData) => {
    // Navigate to report card to see their captured data
    navigate('/report-card')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="home-first-time">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading your profile...</p>
        </div>
      </div>
    )
  }

  // ARCHETYPE REVEAL SCREEN
  if (currentScreen === SCREENS.ARCHETYPE_REVEAL) {
    return (
      <div className="home-first-time" style={{
        justifyContent: 'space-between',
        alignItems: 'center',
        textAlign: 'center',
        padding: '24px'
      }}>
        {/* Spacer for top */}
        <div style={{ flex: 1 }} />

        {/* Content centered */}
        <div style={{ maxWidth: '400px' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '12px',
            color: 'white'
          }}>
            Welcome{userName ? `, ${userName}` : ''}!
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1.1rem',
            marginBottom: '40px'
          }}>
            Let's get you set up 🙌🏼
          </p>

          <p style={{
            fontSize: '1.2rem',
            lineHeight: 1.7,
            color: 'white',
            marginBottom: '20px',
            fontWeight: 500
          }}>
            To personalise your journey here's three quick questions.
          </p>
          <p style={{
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            Your answers will ensure we provide the best support for where you're at.
          </p>
        </div>

        {/* Spacer for bottom */}
        <div style={{ flex: 1 }} />

        {/* Button at bottom */}
        <div style={{ width: '100%', maxWidth: '400px', paddingBottom: '32px' }}>
          <button
            className="primary-button"
            onClick={() => setCurrentScreen(SCREENS.PERSONA_Q1)}
          >
            Let's Go
          </button>
        </div>
      </div>
    )
  }

  // PERSONA QUESTIONS (Q1-Q3 with V2 logic)
  if (currentScreen === SCREENS.PERSONA_Q1 || currentScreen === SCREENS.PERSONA_Q2 || currentScreen === SCREENS.PERSONA_Q3) {
    const questionIndex = currentScreen === SCREENS.PERSONA_Q1 ? 0
      : currentScreen === SCREENS.PERSONA_Q2 ? 1 : 2
    const question = personaQuestions?.questions?.[questionIndex]

    if (!question) {
      return (
        <div className="home-first-time">
          <div className="error-state">
            <p>Failed to load questions. Please refresh.</p>
            <button onClick={() => window.location.reload()}>Refresh</button>
          </div>
        </div>
      )
    }

    // Get valid goals for Q3 based on Q2 wealth ladder answer
    const validGoals = currentScreen === SCREENS.PERSONA_Q3
      ? getValidGoalsForWealthLadder(wealthLadderRung)
      : null

    // Get warm transition text
    const transitionText = currentScreen === SCREENS.PERSONA_Q2
      ? personaQuestions?.ux_config?.warm_transitions?.after_q1
      : currentScreen === SCREENS.PERSONA_Q3
        ? personaQuestions?.ux_config?.warm_transitions?.after_q2
        : null

    // Determine handler based on question
    const handleOptionClick = (option) => {
      if (currentScreen === SCREENS.PERSONA_Q1) {
        handleQ1Selection(option)
      } else if (currentScreen === SCREENS.PERSONA_Q2) {
        handleQ2Selection(option)
      } else if (currentScreen === SCREENS.PERSONA_Q3) {
        handleQ3Selection(option)
      }
    }

    return (
      <div className="home-first-time question-screen">
        <div className="progress-dots">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className={`dot ${i === questionIndex ? 'active' : i < questionIndex ? 'completed' : ''}`}
            />
          ))}
        </div>

        <div className="question-container">
          {transitionText && (
            <p className="transition-text" style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '14px',
              fontStyle: 'italic',
              marginBottom: '16px'
            }}>
              {transitionText}
            </p>
          )}
          <h2>{question.question}</h2>
          <p className="question-subtext">{question.subtext || 'Your answers help us personalise your journey'}</p>

          <div className="options-list">
            {question.options.map((option) => {
              // For Q3, check if this option is valid based on wealth ladder
              const isDisabled = validGoals && !validGoals.includes(option.value)

              return (
                <button
                  key={option.value}
                  className={`option-button ${isDisabled ? 'disabled-option' : ''}`}
                  style={{
                    background: isDisabled ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isDisabled ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.15)'}`,
                    borderRadius: '16px',
                    color: 'white',
                    opacity: isDisabled ? 0.4 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => !isDisabled && handleOptionClick(option)}
                  disabled={isDisabled}
                >
                  <span className="option-label" style={{ color: 'white', fontWeight: 600, fontSize: '18px' }}>{option.label}</span>
                  <span className="option-description" style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>{option.description}</span>
                  {isDisabled && (
                    <span style={{
                      display: 'block',
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.4)',
                      marginTop: '4px',
                      fontStyle: 'italic'
                    }}>
                      Not available at your stage
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Back button for Q2 and Q3 */}
          {(currentScreen === SCREENS.PERSONA_Q2 || currentScreen === SCREENS.PERSONA_Q3) && (
            <button
              className="back-link"
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '14px',
                marginTop: '24px',
                cursor: 'pointer'
              }}
              onClick={() => setCurrentScreen(
                currentScreen === SCREENS.PERSONA_Q2 ? SCREENS.PERSONA_Q1 : SCREENS.PERSONA_Q2
              )}
            >
              Back
            </button>
          )}
        </div>
      </div>
    )
  }

  // PERSONA REVEAL SCREEN - Using new PersonaReveal component
  if (currentScreen === SCREENS.PERSONA_REVEAL) {
    return (
      <div className="home-first-time reveal-screen">
        <PersonaReveal
          persona={assignedPersona?.persona}
          wealthLadder={wealthLadderRung}
          emphasis={guidanceEmphasis}
          showWealthLadder={true}
          showEmphasis={false}
          onContinue={handleContinueAfterPersona}
        />
      </div>
    )
  }

  // VIBE SEEKER EXPLAINER SCREEN
  if (currentScreen === SCREENS.VIBE_SEEKER_EXPLAINER) {
    return (
      <div className="home-first-time" style={{
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '24px'
      }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '16px',
            color: 'white'
          }}>
            Let's Find Your Flow
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1rem',
            lineHeight: 1.6,
            marginBottom: '32px'
          }}>
            As a Vibe Seeker, you're ready to explore what lights you up.
            The Flow Finder will guide you through discovering your unique skills,
            the problems you naturally solve, and who you're meant to help.
          </p>

          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '32px'
          }}>
            <p style={{
              fontSize: '1.1rem',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0
            }}>
              ⏱️ This takes about <strong>5 minutes</strong>
            </p>
          </div>

          <div className="project-type-options">
            <button
              className="option-card"
              onClick={() => navigate('/nikigai/skills')}
            >
              <span className="option-icon">🚀</span>
              <span className="option-title">I have 5 minutes now</span>
              <span className="option-desc">Let's start the Flow Finder</span>
            </button>

            <button
              className="option-card"
              onClick={() => navigate('/me')}
            >
              <span className="option-icon">⏰</span>
              <span className="option-title">I'll do this later</span>
              <span className="option-desc">Take me to my profile</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // NEW PROJECT EXPLAINER SCREEN (for Vibe Riser / Movement Maker choosing "start fresh")
  if (currentScreen === SCREENS.NEW_PROJECT_EXPLAINER) {
    return (
      <div className="home-first-time" style={{
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '24px'
      }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '16px',
            color: 'white'
          }}>
            Let's Find Your Flow
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1rem',
            lineHeight: 1.6,
            marginBottom: '32px'
          }}>
            {assignedPersona?.persona === 'movement_maker'
              ? "Even with an established business, discovering new opportunities can unlock your next level of growth."
              : "Let's discover what lights you up. The Flow Finder will guide you through identifying your unique skills, problems you solve, and who you're meant to help."
            }
          </p>

          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px 24px',
            marginBottom: '32px'
          }}>
            <p style={{
              fontSize: '1.1rem',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: 0
            }}>
              ⏱️ This takes about <strong>5 minutes</strong>
            </p>
          </div>

          <div className="project-type-options">
            <button
              className="option-card"
              onClick={() => navigate('/nikigai/skills')}
            >
              <span className="option-icon">🚀</span>
              <span className="option-title">I have 5 minutes now</span>
              <span className="option-desc">Let's start the Flow Finder</span>
            </button>

            <button
              className="option-card"
              onClick={() => navigate('/me')}
            >
              <span className="option-icon">⏰</span>
              <span className="option-title">I'll do this later</span>
              <span className="option-desc">Take me to my profile</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // PROJECT TYPE SCREEN (for Vibe Riser / Movement Maker)
  if (currentScreen === SCREENS.PROJECT_TYPE) {
    const personaDisplay = getPersonaDisplay()

    return (
      <div className="home-first-time" style={{
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '24px'
      }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '16px',
            color: 'white'
          }}>
            Do you have an existing project?
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1rem',
            lineHeight: 1.6,
            marginBottom: '40px'
          }}>
            {assignedPersona?.persona === 'movement_maker'
              ? "As a Movement Maker, you may have an existing business or want to explore new opportunities."
              : "As a Vibe Riser, you may already be working on something or looking to start fresh."
            }
          </p>

          <div className="project-type-options">
            <button
              className="option-card"
              onClick={() => handleProjectType('existing')}
            >
              <span className="option-icon">📁</span>
              <span className="option-title">I have an existing project</span>
              <span className="option-desc">Let's capture what you're working on</span>
            </button>

            <button
              className="option-card"
              onClick={() => handleProjectType('new')}
            >
              <span className="option-icon">✨</span>
              <span className="option-title">I want to start fresh</span>
              <span className="option-desc">Let's discover a new opportunity</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // QUICK CAPTURE FLOW (for paths 2-4)
  if (currentScreen === SCREENS.QUICK_CAPTURE) {
    return (
      <QuickCapture
        userId={user?.id}
        wealthLadder={wealthLadderRung}
        guidanceEmphasis={guidanceEmphasis}
        onComplete={handleQuickCaptureComplete}
        onBack={() => setCurrentScreen(SCREENS.PERSONA_REVEAL)}
      />
    )
  }

  // EXISTING PROJECT FLOW
  if (currentScreen === SCREENS.EXISTING_PROJECT) {
    return (
      <ExistingProjectFlow
        onComplete={() => navigate('/me')}
        onBack={() => setCurrentScreen(SCREENS.PROJECT_TYPE)}
      />
    )
  }

  return null
}

export default HomeFirstTime
