import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import HybridArchetypeFlow from './flows/HybridArchetypeFlow'
import { essenceProfiles } from './data/essenceProfiles'
import { essenceProfiles as essenceProfilesFlat } from './lib/data/essenceProfiles'
import { protectiveProfiles } from './data/protectiveProfiles'
import ProtectiveArchetypeIcon from './components/ProtectiveArchetypeIcon'
import './PersonaAssessment.css'

// Flow stages - Reordered: archetypes first, story second (Mar 2026)
// Q1-Q3 persona/wealth ladder questions in post-auth HomeFirstTime.jsx
const STAGES = {
  ESSENCE_INTRO: 'essence_intro',
  ESSENCE_FLOW: 'essence_flow',
  ESSENCE_REVEAL: 'essence_reveal',
  PROTECTIVE_INTRO: 'protective_intro',
  PROTECTIVE_FLOW: 'protective_flow',
  PROTECTIVE_REVEAL: 'protective_reveal',
  STORY_FLOW: 'story_flow',
  STORY_EAR: 'story_ear',
  STORY_TRANSFORM: 'story_transform',
  NAME_CAPTURE: 'name_capture',
  EMAIL_CAPTURE: 'email_capture',
  CODE_VERIFY: 'code_verify',
  SUCCESS: 'success'
}

// Stage groupings for progress dots
const STAGE_GROUPS = [
  { id: 'essence', label: 'Essence', stages: [STAGES.ESSENCE_INTRO, STAGES.ESSENCE_FLOW, STAGES.ESSENCE_REVEAL] },
  { id: 'protective', label: 'Protective', stages: [STAGES.PROTECTIVE_INTRO, STAGES.PROTECTIVE_FLOW, STAGES.PROTECTIVE_REVEAL] },
  { id: 'story', label: 'Story', stages: [STAGES.STORY_FLOW, STAGES.STORY_EAR, STAGES.STORY_TRANSFORM] },
  { id: 'profile', label: 'Profile', stages: [STAGES.NAME_CAPTURE, STAGES.EMAIL_CAPTURE, STAGES.CODE_VERIFY] },
  { id: 'complete', label: 'Complete', stages: [STAGES.SUCCESS] }
]

function PersonaAssessment() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signInWithCode, verifyCode } = useAuth()

  // If accessing via /log-in, skip to email capture for returning users
  const isLoginRoute = location.pathname === '/log-in'

  const [stage, setStage] = useState(isLoginRoute ? STAGES.EMAIL_CAPTURE : STAGES.ESSENCE_INTRO)
  const [essenceArchetype, setEssenceArchetype] = useState(null)
  const [protectiveArchetype, setProtectiveArchetype] = useState(null)
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSavingUserData, setIsSavingUserData] = useState(false)

  // Scroll to top on every stage change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [stage])

  // Handle route changes - when navigating to /log-in, jump to email capture
  useEffect(() => {
    if (isLoginRoute && stage !== STAGES.EMAIL_CAPTURE && stage !== STAGES.CODE_VERIFY && stage !== STAGES.SUCCESS) {
      setStage(STAGES.EMAIL_CAPTURE)
    }
  }, [isLoginRoute])

  // If user is already authenticated, check if they have profile data
  // If they do, redirect to dashboard. If not, let them continue onboarding.
  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      if (user && !isSavingUserData && (stage === STAGES.ESSENCE_INTRO || isLoginRoute)) {
        // Check if user has profile data
        const { data: profile } = await supabase
          .from('lead_flow_profiles')
          .select('id')
          .eq('email', user.email)
          .maybeSingle()

        if (profile) {
          // User has profile, redirect to dashboard
          navigate('/me')
        }
        // If no profile, let them continue onboarding
      }
    }
    checkProfileAndRedirect()
  }, [user, navigate, isSavingUserData, stage, isLoginRoute])

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

  // Handle authenticated user completing archetype quiz (skip email/OTP steps)
  const handleAuthenticatedQuizComplete = async () => {
    if (!user?.id || !user?.email) return

    setIsLoading(true)
    try {
      const sessionId = crypto.randomUUID()
      const { error: leadError } = await supabase.from('lead_flow_profiles').insert([{
        session_id: sessionId,
        user_id: user.id,
        user_name: user.user_metadata?.name || user.email.split('@')[0],
        email: user.email.toLowerCase(),
        persona: null,
        essence_archetype: essenceArchetype?.name,
        protective_archetype: protectiveArchetype?.name,
        context: {
          intro_completed: true,
          archetypes_completed: true,
          source: 'authenticated_backfill'
        }
      }])

      if (leadError) {
        console.error('Error saving archetype profile:', leadError)
      }

      setStage(STAGES.SUCCESS)
      setTimeout(() => navigate('/me'), 1500)
    } catch (err) {
      console.error('Error completing archetype quiz:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
      // Only save lead profile data for new users (not returning users via /log-in)
      if (!isLoginRoute) {
        const sessionId = crypto.randomUUID()

        // Note: Persona is now determined post-auth in HomeFirstTime.jsx
        // We save essence/protective archetypes here, persona will be updated later
        const { error: leadError } = await supabase.from('lead_flow_profiles').insert([{
          session_id: sessionId,
          user_name: userName,
          email: email.toLowerCase(),
          persona: null, // Will be set after Q1-Q3 assessment in HomeFirstTime
          essence_archetype: essenceArchetype?.name,
          protective_archetype: protectiveArchetype?.name,
          context: {
            intro_completed: true,
            archetypes_completed: true
          }
        }])

        if (leadError) {
          console.error('Error saving lead profile:', leadError)
          // Don't block - user can still authenticate
        }

        // Notify lead capture (fire-and-forget)
        supabase.functions.invoke('notify-lead-capture', {
          body: {
            email: email.toLowerCase(),
            name: userName,
            source: 'Get Started — Signup',
            meta: {
              essence_archetype: essenceArchetype?.name,
              protective_archetype: protectiveArchetype?.name
            }
          }
        }).catch(() => {})
      }

      // Now send the verification code
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
    setIsSavingUserData(true) // Prevent auto-redirect while saving

    try {
      // Verify the code
      const result = await verifyCode(email.toLowerCase(), verificationCode)
      if (result.success) {
        const authUser = result.user

        // For returning users (via /log-in), just redirect without setup
        if (isLoginRoute) {
          setStage(STAGES.SUCCESS)
          setTimeout(() => navigate('/me'), 1500)
          return
        }

        // Create initial user_stage_progress record for new users
        // Note: Persona and V2 fields will be set after Q1-Q3 in HomeFirstTime.jsx
        if (authUser?.id) {
          // Check if stage progress already exists
          const { data: existingProgress } = await supabase
            .from('user_stage_progress')
            .select('id, current_stage, onboarding_completed')
            .eq('user_id', authUser.id)
            .maybeSingle()

          if (!existingProgress) {
            // Create new stage progress record with onboarding_completed = false
            // Persona and V2 fields will be set after Q1-Q3 assessment in HomeFirstTime
            // Note: Don't set current_stage here - let DB default apply, then V2 onboarding will set it
            const { error: insertError } = await supabase.from('user_stage_progress').insert([{
              user_id: authUser.id,
              persona: null, // Will be set after Q1-Q3 assessment
              conversations_logged: 0,
              onboarding_completed: false
            }])

            if (insertError) {
              console.error('Error creating user_stage_progress:', insertError)
              // Don't block the flow - HomeFirstTime will use upsert anyway
            }
          }
          // If existingProgress exists, user is returning - don't overwrite their data
        }

        // Show success and redirect
        setStage(STAGES.SUCCESS)
        setTimeout(() => navigate('/me'), 2000)
      } else {
        setError(result.message || 'Invalid verification code')
      }
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setIsLoading(false)
      setIsSavingUserData(false)
    }
  }

  // Validate email format
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // Get essence archetype display data
  const getEssenceDisplay = () => {
    if (!essenceArchetype) return null
    
    const archetypeName = essenceArchetype.name?.trim()
    if (!archetypeName) return essenceArchetype
    
    // First try: array structure (essenceProfiles.essence_archetypes)
    const foundInArray = essenceProfiles.essence_archetypes?.find(a => 
      a.name?.trim().toLowerCase() === archetypeName.toLowerCase()
    )
    if (foundInArray) {
      console.log('✅ Found essence profile in array:', foundInArray.name, 'with poetic_line:', foundInArray.poetic_line)
      return foundInArray
    }
    
    // Second try: flat object structure (essenceProfilesFlat[key])
    const foundInFlat = essenceProfilesFlat[archetypeName]
    if (foundInFlat && foundInFlat.poetic_line) {
      console.log('✅ Found essence profile in flat structure:', archetypeName, 'with poetic_line:', foundInFlat.poetic_line)
      return { ...essenceArchetype, ...foundInFlat, name: archetypeName }
    }
    
    console.warn('⚠️ Could not find essence profile for:', archetypeName, 
      'Array names:', essenceProfiles.essence_archetypes?.map(a => a.name),
      'Flat keys:', Object.keys(essenceProfilesFlat))
    return essenceArchetype
  }

  // Get protective archetype display data
  const getProtectiveDisplay = () => {
    if (!protectiveArchetype) return null
    return protectiveProfiles[protectiveArchetype.name] || protectiveArchetype
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

  // ESSENCE INTRO - Combined welcome + essence (first slide)
  if (stage === STAGES.ESSENCE_INTRO) {
    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="welcome-container">
          <div className="welcome-content">
            <h1 className="welcome-greeting">Welcome! I'm Huzz! 🌞</h1>
            <div className="welcome-message animated-text">
              <p>I believe we all have an <strong>Essence Voice</strong> — that original song you were born to share.</p>
              <p>The version of you that feels most alive, most authentic, most magnetic.</p>
              <p>There are 8 Essence Voices. One will feel like coming home.</p>
              <p className="intro-instruction">Swipe right on the ones that resonate. Left on the ones that don't.</p>
            </div>
          </div>
          <div className="welcome-actions">
            <button className="primary-button" onClick={() => setStage(STAGES.ESSENCE_FLOW)}>
              Let's Go
            </button>
            <Link to="/log-in" className="login-link">
              Already have an account? Log in
            </Link>
          </div>
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
              src={`/images/archetypes/lead-magnet-essence/${essenceArchetype?.image || essenceArchetype?.name?.toLowerCase().replace(/\s+/g, '-') + '.webp'}`}
              alt={essenceArchetype?.name}
              className="archetype-reveal-image"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
          <div className="reveal-badge essence-badge">Your Essence</div>
          <h1 className="reveal-name">{essenceArchetype?.name}</h1>
          <p className="reveal-teaser">
            {essenceDisplay?.superpower || essenceArchetype?.description}
          </p>
          <p className="reveal-hint">You'll discover more about your essence in your profile.</p>
          <button className="primary-button" onClick={() => setStage(STAGES.PROTECTIVE_INTRO)}>
            Continue
          </button>
        </div>
      </div>
    )
  }

  // PROTECTIVE INTRO - Animated list reveal + icons + time estimate
  if (stage === STAGES.PROTECTIVE_INTRO) {
    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="intro-container">
          <h2 className="intro-title">Identify What's Blocking You</h2>
          <div className="animated-text">
            <p className="intro-text">
              Now let's explore what's been muting your song.
            </p>
            <p className="intro-text">
              These are <strong>protective patterns</strong> you developed when you were younger to keep yourself safe from failure, rejection, or judgement.
            </p>
          </div>
          <div className="pattern-list">
            <span className="pattern-item"><span className="pattern-icon">✨</span> The Perfectionist</span>
            <span className="pattern-item"><span className="pattern-icon">🤝</span> The People Pleaser</span>
            <span className="pattern-item"><span className="pattern-icon">🎮</span> The Controller</span>
            <span className="pattern-item"><span className="pattern-icon">🎭</span> The Performer</span>
            <span className="pattern-item"><span className="pattern-icon">👻</span> The Ghost</span>
          </div>
          <div className="animated-text">
            <p className="intro-text" style={{ animationDelay: '1.2s' }}>
              They were so effective they've now become the thing blocking you from sharing your {essenceArchetype?.name} gifts with the world.
            </p>
            <p className="intro-instruction" style={{ animationDelay: '1.5s' }}>
              Swipe right on the ones that sound familiar. Left on the ones that don't.
            </p>
          </div>
          <div className="time-estimate">
            <span>⏱️</span>
            <span>Takes ~2 minutes</span>
          </div>
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
          <ProtectiveArchetypeIcon archetype={protectiveArchetype?.name} size={160} />
          <div className="reveal-badge protective-badge">Your Protective Pattern</div>
          <h1 className="reveal-name">{protectiveArchetype?.name}</h1>
          <p className="reveal-teaser">
            {protectiveDisplay?.summary || protectiveArchetype?.description}
          </p>
          <p className="reveal-hint">Understanding this pattern is the first step to moving past it.</p>
          <button className="primary-button" disabled={isLoading} onClick={() => {
            if (user?.id) {
              // Already authenticated — save profile and skip email/OTP
              handleAuthenticatedQuizComplete()
            } else {
              setStage(STAGES.STORY_FLOW)
            }
          }}>
            {isLoading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    )
  }

  // STORY: FLOW - Essence/protective → finding your flow
  if (stage === STAGES.STORY_FLOW) {
    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="welcome-container">
          <div className="welcome-content">
            <h1 className="welcome-greeting">Finding Your Flow</h1>
            <div className="welcome-message animated-text">
              <p>I believe when we show up from our essence voice and overcome our protective voice, <strong>life becomes a magical adventure</strong>.</p>
              <p>I call it <strong>finding your flow</strong>.</p>
              <p>Your flow is a life path that is unique to you.</p>
              <p>It's what Sanskrit calls <strong>Svadharma</strong>, Taoists call <strong>Te</strong> and Japanese call <strong>Ikigai</strong>.</p>
            </div>
          </div>
          <button className="primary-button" onClick={() => setStage(STAGES.STORY_EAR)}>
            Keen to find yours?
          </button>
        </div>
      </div>
    )
  }

  // STORY: EAR - Ease and Resistance
  if (stage === STAGES.STORY_EAR) {
    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="welcome-container">
          <div className="welcome-content">
            <h1 className="welcome-greeting">Finding Your Flow</h1>
            <div className="welcome-message animated-text">
              <p>I believe the universe communicates with us every day about what this path is.</p>
              <p>The problem is it can't talk to us directly,<br />so it uses what I like to call:<br /><strong>'Ease and Resistance'</strong>.</p>
              <p><strong>Ease</strong> = when serendipitous moments emerge that make your ambitions possible.</p>
              <p><strong>Resistance</strong> = when no matter what you do you keep hitting road blocks.</p>
              <p>As an acronym it spells <span className="ear-highlight">'EAR'</span> — coincidence? 🤔</p>
            </div>
          </div>
          <button className="primary-button" onClick={() => setStage(STAGES.STORY_TRANSFORM)}>
            Continue
          </button>
        </div>
      </div>
    )
  }

  // STORY: TRANSFORM + CTA - Proof + webapp intro
  if (stage === STAGES.STORY_TRANSFORM) {
    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="welcome-container">
          <div className="welcome-content">
            <div className="welcome-message animated-text">
              <p><strong>I believe the secret to finding your flow is aligning what gives you flow internally, with what's flowing externally (ease).</strong></p>
              <p>It's the only way I can describe my transformation:</p>
            </div>
            <div className="transformation-journey">
              <div className="journey-from">
                <span className="journey-emoji">🏖️</span>
                <span className="journey-text">Dancing on beaches in Thailand<br/><strong>with 13 headsets</strong></span>
              </div>
              <div className="journey-arrow">
                <span className="arrow-line"></span>
                <span className="arrow-head">→</span>
              </div>
              <div className="journey-to">
                <span className="journey-emoji">🎉</span>
                <span className="journey-text">Hosting events at Bali Beach Clubs<br/><strong>with 350 headsets</strong></span>
              </div>
            </div>
            <div className="welcome-message animated-text" style={{ marginTop: '12px' }}>
              <p style={{ animationDelay: '0.6s' }}><strong>In less than 12 months of quitting my job.</strong></p>
              <p style={{ animationDelay: '0.9s' }}>This webapp is designed to help you <strong>find your flow</strong> by gamifying the journey.</p>
            </div>
          </div>
          <button className="primary-button glow-button" onClick={() => setStage(STAGES.NAME_CAPTURE)}>
            Let's go!
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
    return (
      <div className="persona-assessment">
        {!isLoginRoute && renderProgress()}
        <div className="capture-container">
          <h2 className="capture-title">{isLoginRoute ? 'Welcome Back!' : `Perfect, ${userName}!`}</h2>
          <p className="capture-subtitle">
            {isLoginRoute
              ? 'Enter your email to log in and continue your journey.'
              : 'Enter your email to access your profile and start finding your flow.'
            }
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
        {!isLoginRoute && renderProgress()}
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
