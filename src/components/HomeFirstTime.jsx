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
import ExistingProjectFlow from './ExistingProjectFlow'
import './HomeFirstTime.css'

const SCREENS = {
  ARCHETYPE_REVEAL: 'archetype_reveal',
  PERSONA_Q1: 'persona_q1',
  PERSONA_Q2: 'persona_q2',
  PERSONA_Q3: 'persona_q3',
  PERSONA_REVEAL: 'persona_reveal',
  PROJECT_TYPE: 'project_type',
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

  // Calculate persona from answers
  const calculatePersona = (answers) => {
    const counts = { vibe_seeker: 0, vibe_riser: 0, movement_maker: 0 }
    Object.values(answers).forEach(answer => {
      if (counts[answer.persona] !== undefined) {
        counts[answer.persona]++
      }
    })

    let maxCount = 0
    let winningPersona = 'vibe_seeker'
    Object.entries(counts).forEach(([persona, count]) => {
      if (count > maxCount) {
        maxCount = count
        winningPersona = persona
      }
    })

    return {
      persona: winningPersona,
      confidence: maxCount === 3 ? 'high' : maxCount === 2 ? 'medium' : 'low'
    }
  }

  // Handle persona question selection
  const handlePersonaOption = (questionId, option) => {
    const newAnswers = {
      ...personaAnswers,
      [questionId]: { value: option.value, persona: option.persona, label: option.label }
    }
    setPersonaAnswers(newAnswers)

    // Move to next screen
    if (currentScreen === SCREENS.PERSONA_Q1) {
      setCurrentScreen(SCREENS.PERSONA_Q2)
    } else if (currentScreen === SCREENS.PERSONA_Q2) {
      setCurrentScreen(SCREENS.PERSONA_Q3)
    } else if (currentScreen === SCREENS.PERSONA_Q3) {
      const result = calculatePersona(newAnswers)
      setAssignedPersona(result)
      savePersonaToDatabase(result.persona)
      setTimeout(() => setCurrentScreen(SCREENS.PERSONA_REVEAL), 300)
    }
  }

  // Save persona to database
  const savePersonaToDatabase = async (persona) => {
    if (!user?.id) return

    try {
      await supabase
        .from('user_stage_progress')
        .update({ persona: persona })
        .eq('user_id', user.id)
    } catch (err) {
      console.error('Error saving persona:', err)
    }
  }

  // Handle project type selection
  const handleProjectType = (type) => {
    if (type === 'new') {
      // Go to Flow Finder
      navigate('/nikigai/skills')
    } else {
      // Show existing project flow
      setCurrentScreen(SCREENS.EXISTING_PROJECT)
    }
  }

  // Handle after persona reveal
  const handleContinueAfterPersona = () => {
    const persona = assignedPersona?.persona

    if (persona === 'vibe_seeker') {
      // Vibe Seekers always go to Flow Finder
      navigate('/nikigai/skills')
    } else {
      // Vibe Risers and Movement Makers choose new or existing
      setCurrentScreen(SCREENS.PROJECT_TYPE)
    }
  }

  // Get persona display data
  const getPersonaDisplay = () => {
    if (!assignedPersona || !personaQuestions) return null
    return personaQuestions.personas[assignedPersona.persona]
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
      <div className="home-first-time">
        <div className="welcome-header">
          <h1>Welcome{userName ? `, ${userName}` : ''}!</h1>
          <p>Here's what we've discovered about you...</p>
        </div>

        {/* Essence Card */}
        <div className="archetype-card essence-card">
          <div className="card-badge">Your Essence</div>
          <h2>{essenceArchetype?.name || 'Your Essence Voice'}</h2>
          <p className="card-tagline">{essenceArchetype?.poetic_line || essenceArchetype?.essence || ''}</p>
          {essenceArchetype?.superpower && (
            <div className="card-detail">
              <strong>Your Superpower:</strong> {essenceArchetype.superpower}
            </div>
          )}
        </div>

        {/* Protective Card */}
        <div className="archetype-card protective-card">
          <div className="card-badge">Your Protective Pattern</div>
          <h2>{protectiveArchetype?.name || 'Your Protective Pattern'}</h2>
          <p className="card-tagline">{protectiveArchetype?.summary || ''}</p>
          {protectiveArchetype?.detailed?.howItShowsUp && (
            <div className="card-detail">
              {protectiveArchetype.detailed.howItShowsUp}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="cta-section">
          <p>Ready to discover your unique path?</p>
          <button
            className="primary-button"
            onClick={() => setCurrentScreen(SCREENS.PERSONA_Q1)}
          >
            Start Finding Your Flow
          </button>
        </div>
      </div>
    )
  }

  // PERSONA QUESTIONS
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
          <h2>{question.question}</h2>
          <p className="question-subtext">{question.subtext}</p>

          <div className="options-list">
            {question.options.map((option, index) => (
              <button
                key={option.value}
                className="option-button"
                onClick={() => handlePersonaOption(question.id, option)}
              >
                <span className="option-label">{option.label}</span>
                <span className="option-description">{option.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // PERSONA REVEAL SCREEN
  if (currentScreen === SCREENS.PERSONA_REVEAL) {
    const personaDisplay = getPersonaDisplay()

    return (
      <div className="home-first-time reveal-screen">
        <div className="reveal-content">
          <div className="persona-badge" style={{ background: personaDisplay?.color || '#5e17eb' }}>
            {personaDisplay?.name || 'Your Persona'}
          </div>
          <h2>{personaDisplay?.tagline || ''}</h2>
          <p className="reveal-description">{personaDisplay?.description || ''}</p>

          <button
            className="primary-button"
            onClick={handleContinueAfterPersona}
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // PROJECT TYPE SCREEN (for Vibe Riser / Movement Maker)
  if (currentScreen === SCREENS.PROJECT_TYPE) {
    const personaDisplay = getPersonaDisplay()

    return (
      <div className="home-first-time project-type-screen">
        <h2>Do you have an existing project?</h2>
        <p className="subtext">
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
