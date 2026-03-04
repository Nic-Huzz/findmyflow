/**
 * HomeFirstTime.jsx
 *
 * First-time home screen for new users.
 *
 * Shows 4 tension layer diagnostic questions to identify
 * where in the "river" the user's flow is stuck:
 *   Q1 — Discover (Identity / The Spring)
 *   Q2 — Regulate (Nervous System / The Riverbed)
 *   Q3 — Reveal (Visibility / The Current)
 *   Q4 — Value (Worth / The Ocean)
 *
 * After Q4 → Priority Layer Reveal → Mind Space → /me
 *
 * Created: Dec 2024
 * Updated: Mar 2026 — Tension layer onboarding (4 universal questions)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { useOnboarding } from '../context/OnboardingContext'
import { computePriorityLayer, TENSION_LAYER_DISPLAY } from '../lib/onboardingV2'
import './HomeFirstTime.css'

const SCREENS = {
  WELCOME: 'welcome',
  TENSION_Q1: 'tension_q1',
  TENSION_Q2: 'tension_q2',
  TENSION_Q3: 'tension_q3',
  TENSION_Q4: 'tension_q4',
  PRIORITY_REVEAL: 'priority_reveal',
}

const ONBOARDING_STORAGE_KEY = 'onboarding_v2_progress'

// Tension question screen configs
const TENSION_SCREENS = [
  { screen: 'tension_q1', key: 'tension_discover', layer: 'discover', next: 'tension_q2', prev: null },
  { screen: 'tension_q2', key: 'tension_regulate', layer: 'regulate', next: 'tension_q3', prev: 'tension_q1' },
  { screen: 'tension_q3', key: 'tension_reveal', layer: 'reveal', next: 'tension_q4', prev: 'tension_q2' },
  { screen: 'tension_q4', key: 'tension_value', layer: 'value', next: null, prev: 'tension_q3' },
]

function HomeFirstTime({ onOnboardingComplete }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { setOnboardingScreen } = useOnboarding()

  const [currentScreen, setCurrentScreen] = useState(SCREENS.WELCOME)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

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

  // User data
  const [userName, setUserName] = useState('')

  // Tension assessment data
  const [tensionQuestions, setTensionQuestions] = useState(null)
  const [tensionScores, setTensionScores] = useState({
    discover: null,
    regulate: null,
    reveal: null,
    value: null,
  })
  const [priorityLayer, setPriorityLayer] = useState(null)

  // Load user data and tension questions on mount
  useEffect(() => {
    loadUserData()
    loadTensionQuestions()
    loadSavedProgress()
  }, [user])

  // Save progress to localStorage
  const saveProgress = (screen, newScores = {}) => {
    if (!user?.id) return
    const progress = {
      screen,
      tensionScores: { ...tensionScores, ...newScores },
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
          if (progress.tensionScores) setTensionScores(progress.tensionScores)
          if (progress.screen && progress.screen !== SCREENS.WELCOME) {
            setCurrentScreen(progress.screen)
          }
        } else {
          localStorage.removeItem(`${ONBOARDING_STORAGE_KEY}_${user.id}`)
        }
      }
    } catch (err) {
      console.error('Error loading saved progress:', err)
    }
  }

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
      [SCREENS.WELCOME]: 'welcome',
      [SCREENS.TENSION_Q1]: 'tension_q1',
      [SCREENS.TENSION_Q2]: 'tension_q2',
      [SCREENS.TENSION_Q3]: 'tension_q3',
      [SCREENS.TENSION_Q4]: 'tension_q4',
      [SCREENS.PRIORITY_REVEAL]: 'priority_reveal'
    }
    setOnboardingScreen(screenToZarloMap[currentScreen] || null)
    return () => setOnboardingScreen(null)
  }, [currentScreen, setOnboardingScreen])

  const loadUserData = async () => {
    if (!user?.id) return

    try {
      const { data: leadProfile } = await supabase
        .from('lead_flow_profiles')
        .select('user_name, user_id, id')
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
      }
    } catch (err) {
      console.error('Error loading user data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTensionQuestions = async () => {
    try {
      const response = await fetch(`/tension-assessment.json?v=${Date.now()}`)
      if (!response.ok) throw new Error('Failed to load assessment')
      const data = await response.json()
      setTensionQuestions(data)
    } catch (err) {
      console.error('Failed to load tension questions:', err)
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

  // Handle tension question selection
  const handleTensionSelection = async (screenConfig, score) => {
    const newScores = { ...tensionScores, [screenConfig.layer]: score }
    setTensionScores(newScores)

    if (screenConfig.next) {
      // Not the last question — save progress and move on
      saveProgress(screenConfig.next, { [screenConfig.layer]: score })
      transitionToScreen(screenConfig.next)
    } else {
      // Last question (Q4) — compute priority and save
      setIsSaving(true)
      setError(null)

      const computed = computePriorityLayer(newScores)
      setPriorityLayer(computed)

      const success = await saveTensionData(newScores, computed)
      setIsSaving(false)

      if (success) {
        clearSavedProgress()
        transitionToScreen(SCREENS.PRIORITY_REVEAL)
      } else {
        setError('Failed to save your answers. Please try again.')
      }
    }
  }

  // Save tension data to database
  const saveTensionData = async (scores, computedLayer) => {
    if (!user?.id) return false

    try {
      const { error } = await supabase
        .from('user_stage_progress')
        .upsert({
          user_id: user.id,
          persona: 'vibe_seeker',
          tension_discover: scores.discover,
          tension_regulate: scores.regulate,
          tension_reveal: scores.reveal,
          tension_value: scores.value,
          priority_layer: computedLayer,
          onboarding_completed: true,
          onboarding_v2_completed: true,
          current_stage: '0',
        }, { onConflict: 'user_id' })

      if (error) {
        console.error('Error saving tension data:', error)
        return false
      }
      return true
    } catch (err) {
      console.error('Error saving tension data:', err)
      return false
    }
  }

  // Handle after priority reveal — go to Mind Space
  const handleContinueAfterReveal = async () => {
    await ensureDiscoveryProject()
    navigate('/mind-space')
  }

  // Ensure a Discovery Project exists
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

  const markOnboardingComplete = async () => {
    if (!user?.id) return
    const { error } = await supabase
      .from('user_stage_progress')
      .upsert({
        user_id: user.id,
        persona: 'vibe_seeker',
        onboarding_completed: true,
        onboarding_v2_completed: true,
        current_stage: '0',
      }, { onConflict: 'user_id' })
    if (error) console.error('Error updating onboarding status:', error)
  }

  // Handle "I'll do this later"
  const handleSkipToProfile = async () => {
    await Promise.all([ensureDiscoveryProject(), markOnboardingComplete()])
    if (onOnboardingComplete) {
      await onOnboardingComplete()
    } else {
      window.location.href = '/me'
    }
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

  // WELCOME SCREEN
  if (currentScreen === SCREENS.WELCOME) {
    return (
      <div className="home-first-time" style={{
        justifyContent: 'space-between',
        alignItems: 'center',
        textAlign: 'center',
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
        <span className="welcome-decoration welcome-decoration-1">🌊</span>
        <span className="welcome-decoration welcome-decoration-2">🌊</span>
        <span className="welcome-decoration welcome-decoration-3">🌊</span>
        <span className="welcome-decoration welcome-decoration-4">🌊</span>

        {/* Golden glow behind content */}
        <div className="welcome-glow" />

        <div style={{ flex: 1 }} />

        <div className="welcome-content">
          <h1 className="welcome-greeting animate-text">
            Welcome{userName ? `, ${userName}` : ''}!
          </h1>
          <p className="welcome-subtitle">
            Let's find your flow <span className="welcome-wave">👋</span>
          </p>

          <p className="welcome-main-text">
            Four quick questions to discover where your flow is getting stuck.
          </p>
          <p className="welcome-sub-text">
            Your answers help us meet you exactly where you are.
          </p>
        </div>

        <div style={{ flex: 1 }} />

        <div className="welcome-cta-container">
          <button
            className="welcome-cta-button"
            onClick={() => transitionToScreen(SCREENS.TENSION_Q1)}
          >
            <span className="shimmer-layer" />
            Let's Go
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>
    )
  }

  // TENSION QUESTIONS (Q1-Q4)
  const currentTension = TENSION_SCREENS.find(t => t.screen === currentScreen)
  if (currentTension) {
    const questionIndex = TENSION_SCREENS.indexOf(currentTension)
    const questions = tensionQuestions?.questions
    const question = questions?.find(q => q.id === currentTension.key)

    if (!question) {
      if (!tensionQuestions) {
        return (
          <div className="home-first-time">
            <div className="loading-container">
              <div className="loading-spinner" />
              <p>Loading your questions...</p>
            </div>
          </div>
        )
      }
      return (
        <div className="home-first-time">
          <div className="error-state">
            <p>Failed to load questions. Please refresh.</p>
            <button onClick={() => window.location.reload()}>Refresh</button>
          </div>
        </div>
      )
    }

    // Warm transition text between questions
    const transitionText = questionIndex > 0
      ? tensionQuestions?.ux_config?.warm_transitions?.[`after_q${questionIndex}`]
      : null

    return (
      <div className={`home-first-time question-screen ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''}`}>
        <div className="progress-dots">
          {[0, 1, 2, 3].map(i => (
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
          <p className="question-subtext">Pick whichever feels most true right now</p>

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

          {isSaving && (
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
              Mapping your river...
            </div>
          )}

          <div className="options-list" key={currentTension.key}>
            {question.options.map((option) => (
              <button
                key={option.score}
                className={`option-button ${isSaving ? 'disabled-option' : ''}`}
                style={isSaving ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
                onClick={(e) => { e.currentTarget.blur(); !isSaving && handleTensionSelection(currentTension, option.score) }}
                disabled={isSaving}
              >
                <span className="option-label">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Back button for Q2-Q4 */}
          {currentTension.prev && (
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
              onClick={() => transitionToScreen(currentTension.prev)}
            >
              ← Back
            </button>
          )}
        </div>
      </div>
    )
  }

  // PRIORITY LAYER REVEAL
  if (currentScreen === SCREENS.PRIORITY_REVEAL) {
    const layer = TENSION_LAYER_DISPLAY[priorityLayer]
    // Rich layer data from the JSON (has when_blocked, why_first, app_feature, app_description)
    const layerDetail = tensionQuestions?.layers?.[priorityLayer]
    if (!layer) {
      // Corrupt/missing priorityLayer — restart from Q1
      transitionToScreen(SCREENS.TENSION_Q1)
      return null
    }

    // Check if all layers are fully resolved (all scored 3)
    const allResolved = ['discover', 'regulate', 'reveal', 'value'].every(l => tensionScores[l] >= 3)

    return (
      <div className="home-first-time reveal-screen">
        <div className="priority-reveal-content">
          <p className="priority-reveal-label">{allResolved ? 'Your river is flowing' : 'Your priority right now'}</p>

          <div className="priority-reveal-card" style={{ borderColor: allResolved ? '#E9A23B' : layer.color }}>
            <span className="priority-reveal-emoji">{allResolved ? '🌊' : layer.emoji}</span>
            <h2 className="priority-reveal-name" style={{ color: allResolved ? '#E9A23B' : layer.color }}>
              {allResolved ? 'Source to Ocean' : layer.riverElement}
            </h2>
            <p className="priority-reveal-layer">{allResolved ? 'Fully Flowing' : layer.name}</p>

            <p className="priority-reveal-blocked">
              {allResolved
                ? "You've built from source to ocean. Your river is clear, grounded, visible, and valued."
                : layerDetail?.when_blocked}
            </p>
          </div>

          <p className="priority-reveal-why">
            {allResolved
              ? "Time to put it all into action. Mind Space will map your strengths so you can decide what to build next."
              : layerDetail?.why_first}
          </p>

          {!allResolved && layerDetail?.app_feature && (
            <div className="priority-reveal-recommend">
              <p className="priority-reveal-recommend-label">We recommend starting with</p>
              <p className="priority-reveal-recommend-feature">{layerDetail.app_feature}</p>
              {layerDetail.app_description && (
                <p className="priority-reveal-recommend-desc">{layerDetail.app_description}</p>
              )}
            </div>
          )}

          <button
            className="welcome-cta-button priority-reveal-cta"
            onClick={handleContinueAfterReveal}
          >
            <span className="shimmer-layer" />
            Continue to Mind Space
            <span className="btn-arrow">→</span>
          </button>

          <button
            className="skip-link"
            onClick={handleSkipToProfile}
          >
            I'll do this later
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default HomeFirstTime
