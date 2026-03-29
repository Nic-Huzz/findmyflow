/**
 * HomeFirstTime.jsx
 *
 * First-time home screen for new users.
 *
 * Shows 3+1 journey-level diagnostic questions:
 *   Q1 — Identity (Level 1)
 *   Q2 — Vulnerability (Level 2)
 *   Q3 — Enough (Level 4)
 *   Q4 — Passion-Risk (Level 7, conditional: only if Q1-Q3 all >= 2)
 *
 * After assessment → Journey Level Reveal → Mind Space → /me
 *
 * Created: Dec 2024
 * Updated: Mar 2026 — Journey-level v2 assessment (3+1 questions)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { useOnboarding } from '../context/OnboardingContext'
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

// Journey-level question screen configs (3 mandatory)
const TENSION_SCREENS = [
  { screen: 'tension_q1', key: 'tension_identity', level: 1, next: 'tension_q2', prev: null },
  { screen: 'tension_q2', key: 'tension_vulnerability', level: 2, next: 'tension_q3', prev: 'tension_q1' },
  { screen: 'tension_q3', key: 'tension_enough', level: 4, next: null, prev: 'tension_q2' },
]

// Conditional Q4 — only shown if Q1-Q3 all score >= 2
const TENSION_Q4_CONFIG = { screen: 'tension_q4', key: 'tension_passion', level: 7, next: null, prev: 'tension_q3' }

// Journey level descriptions for the reveal screen
const LEVEL_DESCRIPTIONS = {
  1: { name: 'Identity', question: 'Who am I really?', description: 'Discover your essence and what to pursue' },
  2: { name: 'Vulnerability', question: 'Can I be honest about what I need?', description: 'Learn to let people see where you really are' },
  4: { name: 'Enough', question: 'Do I have permission to move?', description: 'Silence the inner critic and take action' },
  7: { name: 'Passion-Risk', question: 'Am I investing in the right path?', description: 'Build from genuine passion, not obligation' },
}

/**
 * Compute the user's starting journey level from tension scores.
 * First score below 3 = starting emphasis level.
 * If all >= 3 (or Q4 not asked), default to level 1.
 */
function computeJourneyLevel(scores) {
  if (scores.identity != null && scores.identity < 3) return { level: 1, name: 'Identity', emphasis: 'identity' }
  if (scores.vulnerability != null && scores.vulnerability < 3) return { level: 2, name: 'Vulnerability', emphasis: 'vulnerability' }
  if (scores.enough != null && scores.enough < 3) return { level: 4, name: 'Enough', emphasis: 'enough' }
  if (scores.passion != null && scores.passion < 3) return { level: 7, name: 'Passion-Risk', emphasis: 'passion' }
  // All 3s (or Q4 not asked)
  return { level: 1, name: 'Identity', emphasis: 'identity' }
}

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
    identity: null,
    vulnerability: null,
    enough: null,
    passion: null,
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
      const response = await fetch(`/tension-assessment-v2.json?v=${Date.now()}`)
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
  const handleTensionSelection = (screenConfig, score) => {
    if (isTransitioning) return

    const newScores = { ...tensionScores }
    const scoreField = screenConfig.key.replace('tension_', '')
    newScores[scoreField] = score
    setTensionScores(newScores)
    saveProgress(screenConfig.screen, newScores)

    // After Q3: check if Q4 should show (all previous scores >= 2)
    if (screenConfig.screen === 'tension_q3') {
      const allHighEnough = newScores.identity >= 2 && newScores.vulnerability >= 2 && newScores.enough >= 2
      if (allHighEnough) {
        transitionToScreen('tension_q4')
        return
      }
      finishTensionAssessment(newScores)
      return
    }

    // After Q4: finish
    if (screenConfig.screen === 'tension_q4') {
      finishTensionAssessment(newScores)
      return
    }

    // Q1 or Q2: advance to next
    if (screenConfig.next) {
      transitionToScreen(screenConfig.next)
    }
  }

  // Finish the assessment: compute level, save, and show reveal
  const finishTensionAssessment = async (scores) => {
    setIsSaving(true)
    setError(null)

    const computed = computeJourneyLevel(scores)
    setPriorityLayer(computed)

    const success = await saveTensionData(scores, computed)
    setIsSaving(false)

    if (success) {
      clearSavedProgress()
      transitionToScreen(SCREENS.PRIORITY_REVEAL)
    } else {
      setError('Failed to save your answers. Please try again.')
    }
  }

  // Save tension data to database
  const saveTensionData = async (scores, computed) => {
    if (!user?.id) return false

    try {
      const { error } = await supabase
        .from('user_stage_progress')
        .upsert({
          user_id: user.id,
          persona: 'vibe_seeker',
          // Map new journey scores to existing columns
          tension_discover: scores.identity,
          tension_regulate: scores.vulnerability,
          tension_reveal: scores.enough,
          tension_value: scores.passion,
          priority_layer: computed.emphasis,
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
            Three quick questions to discover where your journey begins.
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

  // TENSION QUESTIONS (Q1-Q3 + conditional Q4)
  // Find screen config from mandatory screens or Q4 config
  const currentTension = TENSION_SCREENS.find(t => t.screen === currentScreen)
    || (currentScreen === TENSION_Q4_CONFIG.screen ? TENSION_Q4_CONFIG : null)

  if (currentTension) {
    // Determine question index for progress dots
    const mandatoryIndex = TENSION_SCREENS.findIndex(t => t.screen === currentScreen)
    const isQ4 = currentScreen === TENSION_Q4_CONFIG.screen
    const questionIndex = isQ4 ? 3 : mandatoryIndex
    const totalDots = isQ4 ? 4 : 3

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

    return (
      <div className={`home-first-time question-screen ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''}`}>
        <div className="progress-dots">
          {Array.from({ length: totalDots }, (_, i) => (
            <span
              key={i}
              className={`dot ${i === questionIndex ? 'active' : i < questionIndex ? 'completed' : ''}`}
            />
          ))}
        </div>

        <div className="question-container">
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
              Finding your starting point...
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

          {/* Back button for Q2+ */}
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

  // JOURNEY LEVEL REVEAL
  if (currentScreen === SCREENS.PRIORITY_REVEAL) {
    if (!priorityLayer) {
      // Corrupt/missing priorityLayer — restart from Q1
      transitionToScreen(SCREENS.TENSION_Q1)
      return null
    }

    const levelInfo = LEVEL_DESCRIPTIONS[priorityLayer.level]
    // Check if all scores are 3 (fully resolved)
    const allResolved = ['identity', 'vulnerability', 'enough'].every(k => tensionScores[k] >= 3)
      && (tensionScores.passion == null || tensionScores.passion >= 3)

    return (
      <div className="home-first-time reveal-screen">
        <div className="priority-reveal-content">
          <p className="priority-reveal-label">
            {allResolved ? 'You are ready' : 'Your journey starts here'}
          </p>

          <div className="priority-reveal-card" style={{ borderColor: allResolved ? '#E9A23B' : '#9333EA' }}>
            <h2 className="priority-reveal-name" style={{ color: allResolved ? '#E9A23B' : '#E9A23B' }}>
              {allResolved ? 'All Clear' : `Level ${priorityLayer.level}: ${levelInfo.name}`}
            </h2>
            <p className="priority-reveal-layer">
              {allResolved ? 'Every layer is strong' : levelInfo.question}
            </p>

            <p className="priority-reveal-blocked">
              {allResolved
                ? "Your foundations are solid across the board. Time to put it all into action."
                : levelInfo.description}
            </p>
          </div>

          <p className="priority-reveal-why">
            {allResolved
              ? "Mind Space will map your strengths so you can decide what to build next."
              : "Mind Space will map your strengths and connect them to where you are right now."}
          </p>

          <button
            className="welcome-cta-button priority-reveal-cta"
            onClick={handleContinueAfterReveal}
          >
            <span className="shimmer-layer" />
            Let's Begin
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
