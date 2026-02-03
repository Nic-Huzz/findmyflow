import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import HybridArchetypeFlow from './flows/HybridArchetypeFlow'
import { essenceProfiles } from './data/essenceProfiles'
import { essenceProfiles as essenceProfilesFlat } from './lib/data/essenceProfiles'
import { protectiveProfiles } from './data/protectiveProfiles'
import './PersonaAssessment.css'

// Flow stages - Updated for Huzz intro (Dec 2024)
// Q1-Q3 persona/wealth ladder questions moved to post-auth HomeFirstTime.jsx
const STAGES = {
  HUZZ_INTRO_1: 'huzz_intro_1',
  HUZZ_INTRO_2: 'huzz_intro_2',
  HUZZ_INTRO_3: 'huzz_intro_3',
  HUZZ_INTRO_4: 'huzz_intro_4',
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
  { id: 'intro', label: 'Intro', stages: [STAGES.HUZZ_INTRO_1, STAGES.HUZZ_INTRO_2, STAGES.HUZZ_INTRO_3, STAGES.HUZZ_INTRO_4] },
  { id: 'essence', label: 'Essence', stages: [STAGES.ESSENCE_INTRO, STAGES.ESSENCE_FLOW, STAGES.ESSENCE_REVEAL] },
  { id: 'protective', label: 'Protective', stages: [STAGES.PROTECTIVE_INTRO, STAGES.PROTECTIVE_FLOW, STAGES.PROTECTIVE_REVEAL] },
  { id: 'profile', label: 'Profile', stages: [STAGES.NAME_CAPTURE, STAGES.EMAIL_CAPTURE, STAGES.CODE_VERIFY] },
  { id: 'complete', label: 'Complete', stages: [STAGES.SUCCESS] }
]

function PersonaAssessment() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signInWithCode, verifyCode } = useAuth()

  // If accessing via /log-in, skip to email capture for returning users
  const isLoginRoute = location.pathname === '/log-in'

  const [stage, setStage] = useState(isLoginRoute ? STAGES.EMAIL_CAPTURE : STAGES.HUZZ_INTRO_1)
  const [assessment, setAssessment] = useState(null)
  const [essenceArchetype, setEssenceArchetype] = useState(null)
  const [protectiveArchetype, setProtectiveArchetype] = useState(null)
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSavingUserData, setIsSavingUserData] = useState(false)

  // Load assessment JSON
  useEffect(() => {
    const loadAssessment = async () => {
      try {
        const response = await fetch(`/persona-assessment.json?v=${Date.now()}`)
        if (!response.ok) throw new Error('Failed to load assessment')
        const data = await response.json()
        setAssessment(data)
      } catch (err) {
        setError(`Failed to load assessment: ${err.message}`)
      }
    }
    loadAssessment()
  }, [])

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
      if (user && !isSavingUserData && (stage === STAGES.HUZZ_INTRO_1 || isLoginRoute)) {
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

  // Loading state
  if (!assessment && stage !== STAGES.ESSENCE_FLOW && stage !== STAGES.PROTECTIVE_FLOW) {
    return (
      <div className="persona-assessment">
        <div className="loading-state">
          {error ? (
            <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
                Retry
              </button>
            </div>
          ) : (
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          )}
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

  // HUZZ INTRO SCREEN 1 - Animated text reveal
  if (stage === STAGES.HUZZ_INTRO_1) {
    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="welcome-container">
          <div className="welcome-content">
            <h1 className="welcome-greeting">Welcome! I'm Huzz! 🌞</h1>
            <div className="welcome-message animated-text">
              <p>Ever since I quit my job two and a half years ago, I've developed an unwavering belief in: <strong>'Flow'</strong>.</p>
              <p>The idea that there's a unique path that only you could walk due to your combination of skills, experiences and circumstances.</p>
            </div>
          </div>
          <div className="welcome-actions">
            <button className="primary-button" onClick={() => setStage(STAGES.HUZZ_INTRO_2)}>
              Tell me more!
            </button>
            <Link to="/log-in" className="login-link">
              Already have an account? Log in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // HUZZ INTRO SCREEN 2 - EAR glow highlight
  if (stage === STAGES.HUZZ_INTRO_2) {
    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="welcome-container">
          <div className="welcome-content">
            <div className="welcome-message animated-text">
              <p>I believe the universe communicates with us every day about what this path is.</p>
              <p>The problem is it can't talk to us directly,<br />so it uses what I like to call:<br /><strong>'Ease and Resistance'</strong>.</p>
              <p>As an acronym it spells <span className="ear-highlight">'EAR'</span> — coincidence? 🤔</p>
            </div>
          </div>
          <button className="primary-button" onClick={() => setStage(STAGES.HUZZ_INTRO_3)}>
            Continue
          </button>
        </div>
      </div>
    )
  }

  // HUZZ INTRO SCREEN 3 - Animated transformation stats
  if (stage === STAGES.HUZZ_INTRO_3) {
    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="welcome-container">
          <div className="welcome-content">
            <div className="welcome-message animated-text">
              <p>I believe when you find your flow —<br />aligning what gives you flow internally, with what's flowing externally (ease) —<br /><strong>life becomes a magical adventure</strong>.</p>
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
            </div>
          </div>
          <button className="primary-button" onClick={() => setStage(STAGES.HUZZ_INTRO_4)}>
            I'm keen for a magical adventure!
          </button>
        </div>
      </div>
    )
  }

  // HUZZ INTRO SCREEN 4 - Excitement build with button glow + background pulse
  if (stage === STAGES.HUZZ_INTRO_4) {
    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="welcome-container excitement-container">
          <div className="welcome-content" style={{ position: 'relative', zIndex: 1 }}>
            <div className="welcome-message animated-text">
              <p>This webapp is designed to help you <strong>find your flow</strong> by gamifying the journey.</p>
              <p><strong>My North Star is to empower you to go from idea to monetising your mission as fast as possible.</strong></p>
              <p className="welcome-cta-text">Ready to get started?</p>
            </div>
          </div>
          <button className="primary-button glow-button" onClick={() => setStage(STAGES.ESSENCE_INTRO)} style={{ position: 'relative', zIndex: 1 }}>
            Yep!
          </button>
        </div>
      </div>
    )
  }

  // NOTE: Persona questions moved to post-auth flow (HomeFirstTime.jsx)
  // The 3-question persona assessment now happens after user creates account

  // ESSENCE INTRO - Animated text reveal
  if (stage === STAGES.ESSENCE_INTRO) {
    return (
      <div className="persona-assessment">
        {renderProgress()}
        <div className="intro-container">
          <div className="intro-content">
            <h2 className="intro-title">Discover Your Essence</h2>
            <div className="animated-text">
              <p className="intro-text">
                On my journey, I discovered something powerful — we all have an <strong>Essence Voice</strong>.
              </p>
              <p className="intro-text">
                It's that original song you were born to share. The version of you that feels most alive, most authentic, most magnetic.
              </p>
              <p className="intro-text">
                When you show up from this place, your impact doesn't feel like work — it feels like flow.
              </p>
              <p className="intro-text">
                There are 8 Essence Voices. One will feel like coming home.
              </p>
              <p className="intro-instruction">
                Swipe right on the ones that resonate. Left on the ones that don't.
              </p>
            </div>
          </div>
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
