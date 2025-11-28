import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import HybridArchetypeFlow from './HybridArchetypeFlow'
import { essenceProfiles } from './data/essenceProfiles'
import { protectiveProfiles } from './data/protectiveProfiles'
import './PersonaAssessment.css'

// Flow stages
const STAGES = {
  WELCOME: 'welcome',
  PERSONA_Q1: 'persona_q1',
  PERSONA_Q2: 'persona_q2',
  PERSONA_Q3: 'persona_q3',
  PERSONA_REVEAL: 'persona_reveal',
  ESSENCE_INTRO: 'essence_intro',
  ESSENCE_FLOW: 'essence_flow',
  ESSENCE_REVEAL: 'essence_reveal',
  PROTECTIVE_INTRO: 'protective_intro',
  PROTECTIVE_FLOW: 'protective_flow',
  PROTECTIVE_REVEAL: 'protective_reveal',
  NAME_CAPTURE: 'name_capture',
  EMAIL_CAPTURE: 'email_capture',
  CODE_VERIFY: 'code_verify',
  SUCCESS: 'success'
}

// Stage groupings for progress dots
const STAGE_GROUPS = [
  { id: 'welcome', label: 'Welcome', stages: [STAGES.WELCOME] },
  { id: 'persona', label: 'Persona', stages: [STAGES.PERSONA_Q1, STAGES.PERSONA_Q2, STAGES.PERSONA_Q3, STAGES.PERSONA_REVEAL] },
  { id: 'essence', label: 'Essence', stages: [STAGES.ESSENCE_INTRO, STAGES.ESSENCE_FLOW, STAGES.ESSENCE_REVEAL] },
  { id: 'protective', label: 'Protective', stages: [STAGES.PROTECTIVE_INTRO, STAGES.PROTECTIVE_FLOW, STAGES.PROTECTIVE_REVEAL] },
  { id: 'profile', label: 'Profile', stages: [STAGES.NAME_CAPTURE, STAGES.EMAIL_CAPTURE, STAGES.CODE_VERIFY] },
  { id: 'complete', label: 'Complete', stages: [STAGES.SUCCESS] }
]

function PersonaAssessment() {
  const navigate = useNavigate()
  const { user, signInWithCode, verifyCode } = useAuth()

  const [stage, setStage] = useState(STAGES.WELCOME)
  const [assessment, setAssessment] = useState(null)
  const [personaAnswers, setPersonaAnswers] = useState({})
  const [assignedPersona, setAssignedPersona] = useState(null)
  const [essenceArchetype, setEssenceArchetype] = useState(null)
  const [protectiveArchetype, setProtectiveArchetype] = useState(null)
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load assessment JSON
  useEffect(() => {
    const loadAssessment = async () => {
      try {
        const response = await fetch('/persona-assessment.json')
        if (!response.ok) throw new Error('Failed to load assessment')
        const data = await response.json()
        setAssessment(data)
      } catch (err) {
        setError(`Failed to load assessment: ${err.message}`)
      }
    }
    loadAssessment()
  }, [])

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/me')
    }
  }, [user, navigate])

  // Calculate current stage group for progress
  const getCurrentGroupIndex = () => {
    for (let i = 0; i < STAGE_GROUPS.length; i++) {
      if (STAGE_GROUPS[i].stages.includes(stage)) {
        return i
      }
    }
    return 0
  }

  // Calculate progress within current group
  const getGroupProgress = () => {
    const groupIndex = getCurrentGroupIndex()
    const group = STAGE_GROUPS[groupIndex]
    const stageIndex = group.stages.indexOf(stage)
    return ((stageIndex + 1) / group.stages.length) * 100
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

    // Move to next stage
    if (stage === STAGES.PERSONA_Q1) setStage(STAGES.PERSONA_Q2)
    else if (stage === STAGES.PERSONA_Q2) setStage(STAGES.PERSONA_Q3)
    else if (stage === STAGES.PERSONA_Q3) {
      const result = calculatePersona(newAnswers)
      setAssignedPersona(result)
      setTimeout(() => setStage(STAGES.PERSONA_REVEAL), 300)
    }
  }

  // Handle essence archetype completion
  const handleEssenceComplete = (archetype) => {
    setEssenceArchetype(archetype)
    setStage(STAGES.ESSENCE_REVEAL)
  }

  // Handle protective archetype completion
  const handleProtectiveComplete = (archetype) => {
    setProtectiveArchetype(archetype)
    setStage(STAGES.PROTECTIVE_REVEAL)
  }

  // Handle name submission
  const handleNameSubmit = (e) => {
    e.preventDefault()
    if (userName.trim()) {
      setStage(STAGES.EMAIL_CAPTURE)
    }
  }

  // Handle email submission (send code)
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await signInWithCode(email.toLowerCase())
      if (result.success) {
        setStage(STAGES.CODE_VERIFY)
      } else {
        setError(result.message || 'Failed to send verification code')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle code verification
  const handleCodeVerify = async (e) => {
    e.preventDefault()
    if (!verificationCode || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      // Save profile data first
      const sessionId = crypto.randomUUID()
      await supabase.from('lead_flow_profiles').insert([{
        session_id: sessionId,
        user_name: userName,
        email: email.toLowerCase(),
        persona: assignedPersona?.persona === 'vibe_seeker' ? 'Vibe Seeker' :
                 assignedPersona?.persona === 'vibe_riser' ? 'Vibe Riser' : 'Movement Maker',
        essence_archetype: essenceArchetype?.name,
        protective_archetype: protectiveArchetype?.name,
        context: {
          persona_answers: personaAnswers,
          persona_confidence: assignedPersona?.confidence
        }
      }])

      // Verify the code
      const result = await verifyCode(email.toLowerCase(), verificationCode)
      if (result.success) {
        // Also save to persona_assessments for new system
        await supabase.from('persona_assessments').insert([{
          email: email.toLowerCase(),
          responses: personaAnswers,
          assigned_persona: assignedPersona?.persona,
          confidence_score: assignedPersona?.confidence === 'high' ? 1.0 :
                           assignedPersona?.confidence === 'medium' ? 0.67 : 0.33
        }])

        setStage(STAGES.SUCCESS)
        setTimeout(() => navigate('/me'), 2000)
      } else {
        setError(result.message || 'Invalid verification code')
      }
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Validate email format
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // Get persona display data
  const getPersonaDisplay = () => {
    if (!assignedPersona || !assessment) return null
    return assessment.personas[assignedPersona.persona]
  }

  // Get essence archetype display data
  const getEssenceDisplay = () => {
    if (!essenceArchetype) return null
    return essenceProfiles.essence_archetypes?.find(a => a.name === essenceArchetype.name) || essenceArchetype
  }

  // Get protective archetype display data
  const getProtectiveDisplay = () => {
    if (!protectiveArchetype) return null
    return protectiveProfiles[protectiveArchetype.name] || protectiveArchetype
  }

  // Loading state
  if (!assessment && stage !== STAGES.ESSENCE_FLOW && stage !== STAGES.PROTECTIVE_FLOW) {
    return (
      <div className="persona-assessment">
        <div className="loading-state">
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )
  }

  // Render progress indicators
  const renderProgress = () => {
    const currentGroupIndex = getCurrentGroupIndex()
    const groupProgress = getGroupProgress()

    return (
      <div className="progress-container">
        {/* Main progress dots */}
        <div className="progress-dots">
          {STAGE_GROUPS.map((group, index) => (
            <div
              key={group.id}
              className={`progress-dot ${index < currentGroupIndex ? 'completed' : ''} ${index === currentGroupIndex ? 'active' : ''}`}
            />
          ))}
        </div>
        {/* Section progress bar */}
        <div className="section-progress">
          <div className="section-progress-fill" style={{ width: `${groupProgress}%` }} />
        </div>
      </div>
    )
  }

  // ============ RENDER STAGES ============

  // WELCOME STAGE
  if (stage === STAGES.WELCOME) {
    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="welcome-container">
          <div className="welcome-content">
            <h1 className="welcome-greeting">Welcome. I'm Zarlo.</h1>
            <div className="welcome-message">
              <p><strong>Have you ever felt like you were made for more?</strong></p>
              <p>I believe you're an instrument of life —</p>
              <p>When you were a kid, you embodied this effortlessly: Playful, curious, zero shame.</p>
              <p>Then life taught you to turn it down: "Be good. Don't be weird. Fit in."</p>
              <p>But that original frequency? It's still inside you. It has a name, a shape, a purpose.</p>
              <p>I'm here to help you nurture it — and amplify its impact in the world.</p>
              <p className="welcome-cta-text">If you believe you're here to make a difference, scale your impact, and trust the universe — let's begin.</p>
            </div>
          </div>
          <button className="primary-button" onClick={() => setStage(STAGES.PERSONA_Q1)}>
            Let's Begin
          </button>
        </div>
      </div>
    )
  }

  // PERSONA QUESTIONS
  if ([STAGES.PERSONA_Q1, STAGES.PERSONA_Q2, STAGES.PERSONA_Q3].includes(stage)) {
    const questionIndex = stage === STAGES.PERSONA_Q1 ? 0 : stage === STAGES.PERSONA_Q2 ? 1 : 2
    const question = assessment?.questions?.[questionIndex]
    if (!question) return null

    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="question-container">
          <h2 className="question-text">{question.question}</h2>
          {question.subtext && <p className="question-subtext">{question.subtext}</p>}
          <div className="options-list">
            {question.options.map((option, index) => (
              <button
                key={index}
                className="option-card"
                onClick={() => handlePersonaOption(question.id, option)}
              >
                <div className="option-label">{option.label}</div>
                {option.description && <div className="option-description">{option.description}</div>}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // PERSONA REVEAL
  if (stage === STAGES.PERSONA_REVEAL) {
    const personaDisplay = getPersonaDisplay()
    if (!personaDisplay) return null

    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="reveal-container">
          <div className="reveal-badge" style={{ backgroundColor: personaDisplay.color }}>
            {personaDisplay.name}
          </div>
          <h1 className="reveal-tagline">{personaDisplay.tagline}</h1>
          <p className="reveal-description">{personaDisplay.description}</p>
          <div className="next-step-preview">
            <span className="preview-label">Your flow:</span>
            <span className="preview-value">{personaDisplay.flowName}</span>
          </div>
          <button className="primary-button" onClick={() => setStage(STAGES.ESSENCE_INTRO)}>
            Continue
          </button>
        </div>
      </div>
    )
  }

  // ESSENCE INTRO
  if (stage === STAGES.ESSENCE_INTRO) {
    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="intro-container">
          <h2 className="intro-title">Discover Your Essence</h2>
          <p className="intro-text">
            Every river has a natural current — a direction it flows most powerfully.
          </p>
          <p className="intro-text">
            This is your <strong>essence</strong> — the unique way your energy moves when nothing blocks it.
          </p>
          <p className="intro-text">
            There are 8 Essence Archetypes. One will resonate as the version of you that's most alive and authentic.
          </p>
          <p className="intro-instruction">
            Swipe right on the ones that resonate. Left on the ones that don't.
          </p>
          <button className="primary-button" onClick={() => setStage(STAGES.ESSENCE_FLOW)}>
            Let's Go
          </button>
        </div>
      </div>
    )
  }

  // ESSENCE FLOW (HybridArchetypeFlow)
  if (stage === STAGES.ESSENCE_FLOW) {
    return (
      <div className="persona-assessment archetype-flow-wrapper">
        {renderProgress()}
        <HybridArchetypeFlow
          archetypeType="essence"
          onComplete={handleEssenceComplete}
        />
      </div>
    )
  }

  // ESSENCE REVEAL
  if (stage === STAGES.ESSENCE_REVEAL) {
    const essenceDisplay = getEssenceDisplay()
    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="reveal-container archetype-reveal">
          <div className="archetype-image-container">
            <img
              src={`/images/archetypes/lead-magnet-essence/${essenceArchetype?.image || essenceArchetype?.name?.toLowerCase().replace(/\s+/g, '-') + '.PNG'}`}
              alt={essenceArchetype?.name}
              className="archetype-reveal-image"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
          <div className="reveal-badge essence-badge">Your Essence</div>
          <h1 className="reveal-name">{essenceArchetype?.name}</h1>
          <p className="reveal-teaser">
            {essenceDisplay?.poetic_line || essenceArchetype?.description}
          </p>
          <p className="reveal-hint">You'll discover more about your essence in your profile.</p>
          <button className="primary-button" onClick={() => setStage(STAGES.PROTECTIVE_INTRO)}>
            Continue
          </button>
        </div>
      </div>
    )
  }

  // PROTECTIVE INTRO
  if (stage === STAGES.PROTECTIVE_INTRO) {
    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="intro-container">
          <h2 className="intro-title">Identify What's Blocking You</h2>
          <p className="intro-text">
            Now let's explore what's been slowing your flow.
          </p>
          <p className="intro-text">
            These are <strong>protective patterns</strong> you developed when you were younger to keep yourself safe from failure, rejection, or judgement.
          </p>
          <p className="intro-text">
            <em>The Perfectionist. The People Pleaser. The Controller. The Performer. The Ghost.</em>
          </p>
          <p className="intro-text">
            They were so effective they've now become the thing blocking you from sharing your {essenceArchetype?.name} gifts with the world.
          </p>
          <p className="intro-instruction">
            Swipe right on the ones that sound familiar. Left on the ones that don't.
          </p>
          <button className="primary-button" onClick={() => setStage(STAGES.PROTECTIVE_FLOW)}>
            Let's Go
          </button>
        </div>
      </div>
    )
  }

  // PROTECTIVE FLOW (HybridArchetypeFlow)
  if (stage === STAGES.PROTECTIVE_FLOW) {
    return (
      <div className="persona-assessment archetype-flow-wrapper">
        {renderProgress()}
        <HybridArchetypeFlow
          archetypeType="protective"
          onComplete={handleProtectiveComplete}
        />
      </div>
    )
  }

  // PROTECTIVE REVEAL
  if (stage === STAGES.PROTECTIVE_REVEAL) {
    const protectiveDisplay = getProtectiveDisplay()
    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="reveal-container archetype-reveal">
          <div className="archetype-image-container">
            <img
              src={`/images/archetypes/lead-magnet-protective/${protectiveDisplay?.image || protectiveArchetype?.image || protectiveArchetype?.name?.toLowerCase().replace(/\s+/g, '-') + '.png'}`}
              alt={protectiveArchetype?.name}
              className="archetype-reveal-image"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
          <div className="reveal-badge protective-badge">Your Protective Pattern</div>
          <h1 className="reveal-name">{protectiveArchetype?.name}</h1>
          <p className="reveal-teaser">
            {protectiveDisplay?.summary || protectiveArchetype?.description}
          </p>
          <p className="reveal-hint">Understanding this pattern is the first step to moving past it.</p>
          <button className="primary-button" onClick={() => setStage(STAGES.NAME_CAPTURE)}>
            Continue
          </button>
        </div>
      </div>
    )
  }

  // NAME CAPTURE
  if (stage === STAGES.NAME_CAPTURE) {
    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="capture-container">
          <h2 className="capture-title">Almost there!</h2>
          <p className="capture-subtitle">What should I call you?</p>
          <form onSubmit={handleNameSubmit} className="capture-form">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name"
              className="capture-input"
              autoFocus
            />
            <button
              type="submit"
              className="primary-button"
              disabled={!userName.trim()}
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    )
  }

  // EMAIL CAPTURE
  if (stage === STAGES.EMAIL_CAPTURE) {
    const personaDisplay = getPersonaDisplay()
    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="capture-container">
          <h2 className="capture-title">Perfect, {userName}!</h2>
          <p className="capture-subtitle">
            Enter your email to access your personalized profile and start your {personaDisplay?.flowName || 'discovery'} journey.
          </p>
          <form onSubmit={handleEmailSubmit} className="capture-form">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="capture-input"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              className="primary-button"
              disabled={isLoading || !validateEmail(email)}
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>
    )
  }

  // CODE VERIFICATION
  if (stage === STAGES.CODE_VERIFY) {
    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="capture-container">
          <h2 className="capture-title">Check Your Email</h2>
          <p className="capture-subtitle">
            I've sent a verification code to <strong>{email}</strong>
          </p>
          <form onSubmit={handleCodeVerify} className="capture-form">
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="capture-input code-input"
              maxLength={6}
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              className="primary-button"
              disabled={isLoading || verificationCode.length < 6}
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
          {error && <p className="error-message">{error}</p>}
          <button
            className="text-button"
            onClick={() => {
              setError(null)
              setStage(STAGES.EMAIL_CAPTURE)
            }}
          >
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  // SUCCESS
  if (stage === STAGES.SUCCESS) {
    return (
      <div className="persona-assessment">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Welcome, {userName}!</h2>
          <p>Taking you to your profile...</p>
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default PersonaAssessment
