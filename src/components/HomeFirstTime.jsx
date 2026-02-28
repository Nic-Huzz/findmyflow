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
 * 5. Mind Space flow for all users
 *
 * Created: Dec 2024
 * Part of project-based refactor (see docs/2024-12-20-major-refactor-plan.md)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { useOnboarding } from '../context/OnboardingContext'
import { essenceProfiles } from '../data/essenceProfiles'
import { protectiveProfiles } from '../data/protectiveProfiles'
import {
  determineGuidanceEmphasis,
  derivePersonaFromWealthLadder,
  getValidGoalsForWealthLadder,
  determineOnboardingPath
} from '../lib/onboardingV2'
import { PersonaReveal } from './onboarding'
import { getEssenceDisplayName } from '../lib/essencePreferences'
import './HomeFirstTime.css'

const SCREENS = {
  ARCHETYPE_REVEAL: 'archetype_reveal',
  PERSONA_Q1: 'persona_q1',      // Q1: Journey stage (employment status)
  PERSONA_Q2: 'persona_q2',      // Q2: Wealth ladder
  PERSONA_Q3: 'persona_q3',      // Q3: Goal (with greyed out options)
  PERSONA_REVEAL: 'persona_reveal',
  VIBE_SEEKER_EXPLAINER: 'vibe_seeker_explainer'
}

// LocalStorage key for onboarding progress
const ONBOARDING_STORAGE_KEY = 'onboarding_v2_progress'

function HomeFirstTime({ onOnboardingComplete }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { setOnboardingScreen } = useOnboarding()

  const [currentScreen, setCurrentScreen] = useState(SCREENS.PERSONA_Q1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSavingQ3, setIsSavingQ3] = useState(false)

  // Transition state for smooth page changes
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isEntering, setIsEntering] = useState(true)

  // Clear entering state after animation
  useEffect(() => {
    if (isEntering) {
      const timer = setTimeout(() => setIsEntering(false), 350)
      return () => clearTimeout(timer)
    }
  }, [isEntering, currentScreen])

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
    loadSavedProgress()
  }, [user])

  // Save progress to localStorage
  const saveProgress = (screen, data = {}) => {
    if (!user?.id) return
    const progress = {
      screen,
      employmentStatus: data.employmentStatus ?? employmentStatus,
      hasSideProject: data.hasSideProject ?? hasSideProject,
      wealthLadderRung: data.wealthLadderRung ?? wealthLadderRung,
      primaryGoal: data.primaryGoal ?? primaryGoal,
      personaAnswers: data.personaAnswers ?? personaAnswers,
      timestamp: Date.now()
    }
    localStorage.setItem(`${ONBOARDING_STORAGE_KEY}_${user.id}`, JSON.stringify(progress))
  }

  // Load saved progress from localStorage
  const loadSavedProgress = () => {
    if (!user?.id) return
    try {
      const saved = localStorage.getItem(`${ONBOARDING_STORAGE_KEY}_${user.id}`)
      if (saved) {
        const progress = JSON.parse(saved)
        // Only restore if less than 24 hours old
        if (Date.now() - progress.timestamp < 24 * 60 * 60 * 1000) {
          if (progress.employmentStatus) setEmploymentStatus(progress.employmentStatus)
          if (progress.hasSideProject) setHasSideProject(progress.hasSideProject)
          if (progress.wealthLadderRung) setWealthLadderRung(progress.wealthLadderRung)
          if (progress.primaryGoal) setPrimaryGoal(progress.primaryGoal)
          if (progress.personaAnswers) setPersonaAnswers(progress.personaAnswers)
          // Restore screen (but skip ARCHETYPE_REVEAL - go to Q1 instead)
          if (progress.screen && progress.screen !== SCREENS.ARCHETYPE_REVEAL) {
            setCurrentScreen(progress.screen)
          }
        } else {
          // Clear stale progress
          localStorage.removeItem(`${ONBOARDING_STORAGE_KEY}_${user.id}`)
        }
      }
    } catch (err) {
      console.error('Error loading saved progress:', err)
    }
  }

  // Clear progress from localStorage (call after completion)
  const clearSavedProgress = () => {
    if (!user?.id) return
    localStorage.removeItem(`${ONBOARDING_STORAGE_KEY}_${user.id}`)
  }

  // Hide bottom toolbar during onboarding
  useEffect(() => {
    document.body.classList.add('onboarding-active')
    return () => {
      document.body.classList.remove('onboarding-active')
    }
  }, [])

  // Update Zarlo context when screen changes
  useEffect(() => {
    const screenToZarloMap = {
      [SCREENS.ARCHETYPE_REVEAL]: 'welcome',
      [SCREENS.PERSONA_Q1]: 'q1',
      [SCREENS.PERSONA_Q2]: 'q2',
      [SCREENS.PERSONA_Q3]: 'q3',
      [SCREENS.PERSONA_REVEAL]: 'persona_reveal'
    }
    setOnboardingScreen(screenToZarloMap[currentScreen] || null)

    // Clear onboarding screen when component unmounts
    return () => setOnboardingScreen(null)
  }, [currentScreen, setOnboardingScreen])

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
        // Backfill user_id if missing (profile created pre-auth)
        if (!leadProfile.user_id && user.id) {
          supabase
            .from('lead_flow_profiles')
            .update({ user_id: user.id })
            .eq('id', leadProfile.id)
            .then(({ error }) => {
              if (error) console.warn('Could not backfill lead profile user_id:', error)
            })
        }

        setUserName(leadProfile.user_name || user.user_metadata?.name || '')

        // Get essence profile data (use custom name if set)
        const essenceDisplayName = getEssenceDisplayName(leadProfile)
        const essenceOriginalName = leadProfile.essence_archetype
        if (essenceOriginalName) {
          const essenceData = essenceProfiles.essence_archetypes?.find(
            a => a.name?.toLowerCase() === essenceOriginalName.toLowerCase()
          )
          setEssenceArchetype(essenceData
            ? { ...essenceData, name: essenceDisplayName }
            : { name: essenceDisplayName })
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

  // Helper for smooth screen transitions
  const transitionToScreen = (nextScreen) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentScreen(nextScreen)
      setIsTransitioning(false)
      setIsEntering(true)
    }, 200)
  }

  // Handle Q1 (Journey Stage) selection
  const handleQ1Selection = (option) => {
    // Use option.value directly - it contains the full employment status
    // (employed_exploring, employed_building, self_employed_early, self_employed_established)
    // NOT option.data.employment_status which only has 'employed' or 'self_employed'
    const empStatus = option.value
    const sideProject = option.data?.has_side_project || false
    const newAnswers = {
      ...personaAnswers,
      q1_journey: { value: option.value, persona: option.persona, label: option.label, employment_status: empStatus }
    }

    setEmploymentStatus(empStatus)
    setHasSideProject(sideProject)
    setPersonaAnswers(newAnswers)

    // Save progress to localStorage
    saveProgress(SCREENS.PERSONA_Q2, {
      employmentStatus: empStatus,
      hasSideProject: sideProject,
      personaAnswers: newAnswers
    })

    transitionToScreen(SCREENS.PERSONA_Q2)
  }

  // Handle Q2 (Wealth Ladder) selection
  const handleQ2Selection = (option) => {
    const ladderValue = option.data?.wealth_ladder || option.value
    const newAnswers = {
      ...personaAnswers,
      q2_created: { value: option.value, persona: option.persona, label: option.label, wealth_ladder: ladderValue }
    }

    setWealthLadderRung(ladderValue)
    // Reset goal when wealth ladder changes (may invalidate previous selection)
    setPrimaryGoal(null)
    setPersonaAnswers(newAnswers)

    // Save progress to localStorage
    saveProgress(SCREENS.PERSONA_Q3, {
      wealthLadderRung: ladderValue,
      primaryGoal: null,
      personaAnswers: newAnswers
    })

    transitionToScreen(SCREENS.PERSONA_Q3)
  }

  // Handle Q3 (Goal) selection - with validation
  const handleQ3Selection = async (option) => {
    if (isSavingQ3) return // Prevent double-clicks during save
    const validGoals = getValidGoalsForWealthLadder(wealthLadderRung)
    if (!validGoals.includes(option.value)) return // Shouldn't happen, but safety check

    setIsSavingQ3(true)
    setPrimaryGoal(option.value)
    const emphasis = determineGuidanceEmphasis(wealthLadderRung, option.value)
    setGuidanceEmphasis(emphasis)

    // Derive persona from wealth ladder + employment status (V2 approach)
    // Movement Maker only if self-employed AND has products
    const derivedPersona = derivePersonaFromWealthLadder(wealthLadderRung, employmentStatus)

    setPersonaAnswers(prev => ({
      ...prev,
      q3_goal: { value: option.value, persona: option.persona, label: option.label }
    }))

    setAssignedPersona({
      persona: derivedPersona,
      confidence: 'high' // V2 uses wealth ladder derivation, always high confidence
    })

    // Save all V2 data to database - MUST await before clearing localStorage
    setError(null) // Clear any previous error
    const success = await saveOnboardingV2Data(derivedPersona, emphasis, option.value)

    setIsSavingQ3(false)

    if (success) {
      // Only clear localStorage after successful save
      clearSavedProgress()
      transitionToScreen(SCREENS.PERSONA_REVEAL)
    } else {
      // Show error to user so they know to retry
      setError('Failed to save your answers. Please try again.')
    }
  }

  // Save all V2 onboarding data to database - returns true on success, false on failure
  const saveOnboardingV2Data = async (persona, emphasis, goal) => {
    if (!user?.id) {
      console.error('No user ID available for saving onboarding data')
      return false
    }

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
          user_id: user.id,
          persona: persona,
          employment_status: employmentStatus,
          has_side_project: hasSideProject,
          wealth_ladder_rung: wealthLadderRung,
          primary_goal: goal,
          guidance_emphasis: emphasis,
          onboarding_completed: true,
          onboarding_v2_completed: true,
          current_stage: startingStage
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Error saving V2 onboarding data:', error)
        return false
      }

      console.log('V2 onboarding data saved successfully')
      return true
    } catch (err) {
      console.error('Error saving V2 onboarding data:', err)
      return false
    }
  }

  // Handle after persona reveal - all users go to Mind Space
  const handleContinueAfterPersona = async () => {
    // All users go to Mind Space after persona reveal
    await Promise.all([ensureDiscoveryProject(), markOnboardingComplete()])
    navigate('/mind-space')
  }

  // Mark onboarding complete in the database
  const markOnboardingComplete = async () => {
    if (!user?.id) return
    const { error } = await supabase
      .from('user_stage_progress')
      .update({ onboarding_v2_completed: true })
      .eq('user_id', user.id)
    if (error) {
      console.error('Error updating onboarding status:', error)
    }
  }

  // Ensure a Discovery Project exists so /me always has a project context.
  // Called by both skip and MindSpace paths as a safety net.
  const ensureDiscoveryProject = async () => {
    if (!user?.id) return
    const { data: existing } = await supabase
      .from('user_projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase.from('user_projects').insert({
        user_id: user.id,
        name: 'Discovery Project',
        description: 'Your flow discovery journey — this will update as you explore.',
        source_flow: 'discovery_default',
        status: 'active',
        current_stage: 0,
        total_points: 0,
        is_primary: true
      })
      if (error) console.error('Error creating Discovery Project:', error)
    }
  }

  // Handle "I'll do this later" - mark onboarding complete then go to profile
  const handleSkipToProfile = async () => {
    // These two are independent — run in parallel
    await Promise.all([ensureDiscoveryProject(), markOnboardingComplete()])
    if (onOnboardingComplete) {
      await onOnboardingComplete()
    } else {
      window.location.href = '/me'
    }
  }

  // Handle "I have 2 minutes now" - mark onboarding complete then go to mind-space
  // Also creates Discovery Project as safety net in case user abandons MindSpace
  const handleStartMindSpace = async () => {
    // These two are independent — run in parallel
    await Promise.all([ensureDiscoveryProject(), markOnboardingComplete()])
    navigate('/mind-space')
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
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Sparkle particles */}
        <div className="sparkle-container">
          <div className="sparkle" />
          <div className="sparkle" />
          <div className="sparkle" />
          <div className="sparkle" />
          <div className="sparkle" />
          <div className="sparkle" />
        </div>

        {/* Pulsing glow rings */}
        <div className="glow-rings">
          <div className="glow-ring glow-ring-1" />
          <div className="glow-ring glow-ring-2" />
          <div className="glow-ring glow-ring-3" />
        </div>

        {/* Decorative floating elements */}
        <span className="welcome-decoration welcome-decoration-1">✨</span>
        <span className="welcome-decoration welcome-decoration-2">💫</span>
        <span className="welcome-decoration welcome-decoration-3">🌟</span>
        <span className="welcome-decoration welcome-decoration-4">⭐</span>

        {/* Golden glow behind content */}
        <div className="welcome-glow" />

        {/* Spacer for top */}
        <div style={{ flex: 1 }} />

        {/* Content centered */}
        <div className="welcome-content">
          <h1 className="welcome-greeting animate-text">
            Welcome{userName ? `, ${userName}` : ''}!
          </h1>
          <p className="welcome-subtitle">
            Let's get you set up <span className="welcome-wave">👋</span>
          </p>

          <p className="welcome-main-text">
            To personalise your journey here's three quick questions.
          </p>
          <p className="welcome-sub-text">
            Your answers will ensure we provide the best support for where you're at.
          </p>
        </div>

        {/* Spacer for bottom */}
        <div style={{ flex: 1 }} />

        {/* Button at bottom */}
        <div className="welcome-cta-container">
          <button
            className="welcome-cta-button"
            onClick={() => transitionToScreen(SCREENS.PERSONA_Q1)}
          >
            <span className="shimmer-layer" />
            Let's Go
            <span className="btn-arrow">→</span>
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
      // If personaQuestions hasn't loaded yet, show loading state (not error)
      if (!personaQuestions) {
        return (
          <div className="home-first-time">
            <div className="loading-container">
              <div className="loading-spinner" />
              <p>Loading your questions...</p>
            </div>
          </div>
        )
      }
      // Only show error if questions loaded but the specific question is missing
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
      <div className={`home-first-time question-screen ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''}`}>
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

          {error && (
            <p style={{
              color: '#ff6b6b',
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              {error}
            </p>
          )}

          {isSavingQ3 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              marginBottom: '16px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px'
            }}>
              <div className="loading-spinner" style={{ width: '18px', height: '18px' }} />
              Saving your answers...
            </div>
          )}

          <div className="options-list">
            {question.options.map((option) => {
              // For Q3, check if this option is valid based on wealth ladder
              const isDisabled = validGoals && !validGoals.includes(option.value)
              const isBusy = currentScreen === SCREENS.PERSONA_Q3 && isSavingQ3

              return (
                <button
                  key={option.value}
                  className={`option-button ${isDisabled ? 'disabled-option' : ''}`}
                  style={{
                    background: isDisabled ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${isDisabled ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.15)'}`,
                    borderRadius: '16px',
                    color: 'white',
                    opacity: (isDisabled || isBusy) ? 0.4 : 1,
                    cursor: (isDisabled || isBusy) ? 'not-allowed' : 'pointer'
                  }}
                  onClick={() => !isDisabled && !isBusy && handleOptionClick(option)}
                  disabled={isDisabled || isBusy}
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
                cursor: 'pointer',
                transition: 'color 0.2s ease'
              }}
              onClick={() => transitionToScreen(
                currentScreen === SCREENS.PERSONA_Q2 ? SCREENS.PERSONA_Q1 : SCREENS.PERSONA_Q2
              )}
            >
              ← Back
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
            Let's Discover Your Flow
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1rem',
            lineHeight: 1.6,
            marginBottom: '32px'
          }}>
            The Mind Space will help you discover your unique skills,
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
              ⏱️ This takes about <strong>2 minutes</strong>
            </p>
          </div>

          <div className="project-type-options">
            <button
              className="option-card"
              onClick={handleStartMindSpace}
            >
              <span className="option-icon">🚀</span>
              <span className="option-title">I have 2 minutes now</span>
              <span className="option-desc">Let's find your flow</span>
            </button>

            <button
              className="option-card"
              onClick={handleSkipToProfile}
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

  return null
}

export default HomeFirstTime
