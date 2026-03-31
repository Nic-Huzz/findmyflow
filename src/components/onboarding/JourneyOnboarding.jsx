/**
 * JourneyOnboarding.jsx
 *
 * 6-Beat story-driven onboarding flow:
 *   Beat 1 — The Hook (swipeable emotional slides, no interaction)
 *   Beat 2 — The Story (4 wound stages, tap which scene resonates)
 *   Beat 3 — The Reframe (perspective shift question)
 *   Beat 4 — The Promise (sign up CTA)
 *   Beat 5 — Signup (name + email capture, send OTP)
 *   Beat 6 — Verify (6-digit code verification)
 *
 * Works BEFORE account creation. State stored in component,
 * persisted to localStorage, saved to DB after sign-up.
 *
 * Created: Mar 2026
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate } from 'react-router-dom'
import './JourneyOnboarding.css'

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'journey_onboarding_state'

const BEATS = {
  HOOK: 'hook',
  STORY: 'story',
  REFRAME: 'reframe',
  PROMISE: 'promise',
  SIGNUP: 'signup',
  VERIFY: 'verify',
}

// Beat 1: Hook slides
const HOOK_SLIDES = [
  {
    id: 'childhood',
    text: 'Take a moment to think about you as a kid.',
    subtext: 'How playful you were. How full of love. How care-free.',
  },
  {
    id: 'remember',
    text: 'Remember that?',
    subtext: null,
  },
  {
    id: 'question',
    text: 'So where did they go?',
    subtext: null,
  },
]

// Beat 2: The 4 wound stages
const WOUND_STAGES = [
  {
    id: 'stage1',
    title: 'You Arrive',
    subtitle: 'Infancy',
    yAxis: 'Attunement received',
    xAxis: 'Safety present',
    scenes: [
      {
        id: 'overwhelmed_child',
        zone: 'top_left',
        name: 'The Overwhelmed Child',
        description: 'Seen but never settled. Chaotic but present caregiver.',
        archetype: 'sympathetic',
        color: '#e74c3c',
        icon: '🌊',
        image: '/images/onboarding/stage1-overwhelmed.png',
        focalPoint: '55% 35%',
      },
      {
        id: 'secure_base',
        zone: 'diagonal',
        name: 'Secure Base',
        description: 'Attuned and safe. Could explore and be met.',
        archetype: 'ventral',
        color: '#2ecc71',
        icon: '🏠',
        image: '/images/onboarding/stage1-secure.png',
        focalPoint: '55% 30%',
      },
      {
        id: 'invisible_child',
        zone: 'bottom_right',
        name: 'The Invisible Child',
        description: 'Physically safe but unseen. Needs met, self not witnessed.',
        archetype: 'dorsal',
        color: '#3498db',
        icon: '👻',
        image: '/images/onboarding/stage1-invisible.png',
        focalPoint: '50% 35%',
      },
    ],
  },
  {
    id: 'stage2',
    title: 'You Learn What Works',
    subtitle: 'Childhood',
    yAxis: 'Authentic expression',
    xAxis: 'Love received',
    scenes: [
      {
        id: 'rejected_self',
        zone: 'top_left',
        name: 'The Rejected Self',
        description: 'Full expression, love withdrawn. Being yourself costs connection.',
        archetype: 'sympathetic',
        color: '#e74c3c',
        icon: '💔',
        image: '/images/onboarding/stage2-rejected.png',
        focalPoint: '60% 25%',
      },
      {
        id: 'unconditional_belonging',
        zone: 'diagonal',
        name: 'Unconditional Belonging',
        description: 'Authentic expression met with love. No editing required.',
        archetype: 'ventral',
        color: '#2ecc71',
        icon: '💛',
        image: '/images/onboarding/stage2-belonging.png',
        focalPoint: '40% 25%',
      },
      {
        id: 'adapted_self',
        zone: 'bottom_right',
        name: 'The Adapted Self',
        description: 'Love present but only for the edited version. Suppress self to stay connected.',
        archetype: 'dorsal',
        color: '#3498db',
        icon: '🎭',
        image: '/images/onboarding/stage2-adapted.png',
        focalPoint: '55% 25%',
      },
    ],
  },
  {
    id: 'stage3',
    title: 'School Installs the OS',
    subtitle: 'Adolescence',
    yAxis: 'Conformity required',
    xAxis: 'Authentic self suppressed',
    scenes: [
      {
        id: 'the_rebel',
        zone: 'top_left',
        name: 'The Rebel',
        description: 'Fights back. Authentic self survives at social cost. Labelled difficult.',
        archetype: 'sympathetic',
        color: '#e74c3c',
        icon: '🔥',
        image: '/images/onboarding/stage3-rebel.png',
        focalPoint: '75% 25%',
      },
      {
        id: 'grounded_student',
        zone: 'diagonal',
        name: 'The Grounded Student',
        description: 'Navigates without disappearing. Rare.',
        archetype: 'ventral',
        color: '#2ecc71',
        icon: '🌿',
        image: '/images/onboarding/stage3-grounded.png',
        focalPoint: '45% 25%',
      },
      {
        id: 'good_student',
        zone: 'bottom_right',
        name: 'The Good Student',
        description: 'Conforms completely, gets praised, loses themselves gradually.',
        archetype: 'dorsal',
        color: '#3498db',
        icon: '📚',
        image: '/images/onboarding/stage3-good-student.png',
        focalPoint: '40% 35%',
      },
    ],
  },
  {
    id: 'stage3_5',
    title: 'Your Friend Group Decides',
    subtitle: 'Teens',
    yAxis: 'Social belonging',
    xAxis: 'Authentic self maintained',
    scenes: [
      {
        id: 'the_chameleon',
        zone: 'top_left',
        name: 'The Chameleon',
        description: 'High belonging, low authentic self. Absorbed group identity. Popular but lost.',
        archetype: 'sympathetic',
        color: '#e74c3c',
        icon: '🦎',
        image: '/images/onboarding/stage3_5-chameleon.png',
        focalPoint: '50% 30%',
      },
      {
        id: 'found_their_tribe',
        zone: 'diagonal',
        name: 'Found Their Tribe',
        description: 'Belonging and authentic self move together. Group accepted who they were.',
        archetype: 'ventral',
        color: '#2ecc71',
        icon: '🤝',
        image: '/images/onboarding/stage3_5-tribe.png',
        focalPoint: '50% 30%',
      },
      {
        id: 'the_withdrawn',
        zone: 'bottom_right',
        name: 'The Withdrawn',
        description: 'Low belonging, high authentic self. Retreated entirely. Authentic but isolated.',
        archetype: 'dorsal',
        color: '#3498db',
        icon: '🏔️',
        image: '/images/onboarding/stage3_5-withdrawn.png',
        focalPoint: '40% 30%',
      },
    ],
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

function JourneyOnboarding({ onComplete, onSignUp }) {
  const { signInWithCode, verifyCode } = useAuth()
  const navigate = useNavigate()

  // Beat state
  const [currentBeat, setCurrentBeat] = useState(BEATS.HOOK)

  // Beat 1: Hook
  const [hookSlideIndex, setHookSlideIndex] = useState(0)

  // Beat 2: Story
  const [storyStageIndex, setStoryStageIndex] = useState(0)
  const [stageSelections, setStageSelections] = useState({})
  // { stage1: 'overwhelmed_child', stage2: 'adapted_self', ... }

  // Signup state
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState(null)

  // Transition animation
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isEntering, setIsEntering] = useState(true)
  const [slideDirection, setSlideDirection] = useState('right') // 'left' or 'right'

  // Touch handling for swipe
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const autoAdvanceRef = useRef(null)

  // Clean up auto-advance timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)
    }
  }, [])

  // Clear entering state after animation
  useEffect(() => {
    if (isEntering) {
      const timer = setTimeout(() => setIsEntering(false), 400)
      return () => clearTimeout(timer)
    }
  }, [isEntering, currentBeat, hookSlideIndex, storyStageIndex])

  // Hide bottom toolbar during onboarding
  useEffect(() => {
    document.body.classList.add('onboarding-active')
    return () => document.body.classList.remove('onboarding-active')
  }, [])

  // Load saved progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          if (parsed.currentBeat) setCurrentBeat(parsed.currentBeat)
          if (parsed.hookSlideIndex !== undefined) setHookSlideIndex(parsed.hookSlideIndex)
          if (parsed.storyStageIndex !== undefined) setStoryStageIndex(parsed.storyStageIndex)
          if (parsed.stageSelections) setStageSelections(parsed.stageSelections)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (err) {
      console.error('Error loading saved onboarding progress:', err)
    }
  }, [])

  // Save progress on state change
  useEffect(() => {
    const state = {
      currentBeat,
      hookSlideIndex,
      storyStageIndex,
      stageSelections,
      timestamp: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [currentBeat, hookSlideIndex, storyStageIndex, stageSelections])

  // ─── Navigation helpers ──────────────────────────────────────────────────

  const transitionTo = useCallback((setter, value, direction = 'right') => {
    if (isTransitioning) return
    setSlideDirection(direction)
    setIsTransitioning(true)
    setTimeout(() => {
      setter(value)
      setIsTransitioning(false)
      setIsEntering(true)
    }, 250)
  }, [isTransitioning])

  // ─── Touch/swipe handlers ────────────────────────────────────────────────

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX
  }

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX
    const diff = touchStartX.current - touchEndX.current
    const threshold = 50

    if (currentBeat === BEATS.HOOK) {
      if (diff > threshold && hookSlideIndex < HOOK_SLIDES.length - 1) {
        transitionTo(setHookSlideIndex, hookSlideIndex + 1, 'right')
      } else if (diff < -threshold && hookSlideIndex > 0) {
        transitionTo(setHookSlideIndex, hookSlideIndex - 1, 'left')
      } else if (diff > threshold && hookSlideIndex === HOOK_SLIDES.length - 1) {
        // Swipe forward on last hook slide → go to story
        transitionTo(setCurrentBeat, BEATS.STORY, 'right')
      }
    }
  }

  // ─── Beat 1: Hook ────────────────────────────────────────────────────────

  const handleHookNext = () => {
    if (hookSlideIndex < HOOK_SLIDES.length - 1) {
      transitionTo(setHookSlideIndex, hookSlideIndex + 1, 'right')
    } else {
      transitionTo(setCurrentBeat, BEATS.STORY, 'right')
    }
  }

  // ─── Beat 2: Story ──────────────────────────────────────────────────────

  const handleSceneSelect = (stageId, sceneId) => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)

    const newSelections = { ...stageSelections, [stageId]: sceneId }
    setStageSelections(newSelections)

    // Auto-advance to next stage after brief pause
    autoAdvanceRef.current = setTimeout(() => {
      if (storyStageIndex < WOUND_STAGES.length - 1) {
        transitionTo(setStoryStageIndex, storyStageIndex + 1, 'right')
      } else {
        // All stages done → go to reframe
        transitionTo(setCurrentBeat, BEATS.REFRAME, 'right')
      }
      autoAdvanceRef.current = null
    }, 600)
  }

  const handleStoryBack = () => {
    if (storyStageIndex > 0) {
      transitionTo(setStoryStageIndex, storyStageIndex - 1, 'left')
    } else {
      if (isTransitioning) return
      setSlideDirection('left')
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentBeat(BEATS.HOOK)
        setHookSlideIndex(HOOK_SLIDES.length - 1)
        setIsTransitioning(false)
        setIsEntering(true)
      }, 250)
    }
  }

  // ─── Beat 4: Promise ─────────────────────────────────────────────────────

  const handleSignUp = () => {
    // Save all onboarding data to localStorage for post-auth persistence
    const onboardingData = {
      stageSelections,
      completedAt: new Date().toISOString(),
    }
    localStorage.setItem('journey_onboarding_result', JSON.stringify(onboardingData))

    // Clear progress key
    localStorage.removeItem(STORAGE_KEY)

    // Transition to signup beat instead of redirecting
    transitionTo(setCurrentBeat, BEATS.SIGNUP, 'right')
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email || isLoading) return

    setIsLoading(true)
    setAuthError(null)

    try {
      const result = await signInWithCode(email.toLowerCase().trim())
      if (result.success) {
        transitionTo(setCurrentBeat, BEATS.VERIFY, 'right')
      } else {
        setAuthError(result.message || 'Failed to send verification code')
      }
    } catch (err) {
      setAuthError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeVerify = async (e) => {
    e.preventDefault()
    if (!verificationCode || isLoading) return

    setIsLoading(true)
    setAuthError(null)

    try {
      const result = await verifyCode(email.toLowerCase().trim(), verificationCode)
      if (result.success) {
        // Auth successful — navigate to /me which will trigger persistJourneyOnboarding
        navigate('/me')
      } else {
        setAuthError(result.message || 'Invalid code. Please try again.')
      }
    } catch (err) {
      setAuthError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Render helpers ───────────────────────────────────────────────────────

  const transitionClass = `${isTransitioning ? 'jo-transitioning' : ''} ${isEntering ? 'jo-entering' : ''}`
  const directionClass = slideDirection === 'left' ? 'jo-slide-left' : 'jo-slide-right'

  // Progress indicator for all beats
  const renderBeatProgress = () => {
    const beatOrder = [BEATS.HOOK, BEATS.STORY, BEATS.REFRAME, BEATS.PROMISE, BEATS.SIGNUP, BEATS.VERIFY]
    const currentIndex = beatOrder.indexOf(currentBeat)

    return (
      <div className="jo-beat-progress">
        {beatOrder.map((beat, i) => (
          <span
            key={beat}
            className={`jo-beat-dot ${i === currentIndex ? 'active' : i < currentIndex ? 'completed' : ''}`}
          />
        ))}
      </div>
    )
  }

  // ─── BEAT 1: The Hook ─────────────────────────────────────────────────────

  if (currentBeat === BEATS.HOOK) {
    const slide = HOOK_SLIDES[hookSlideIndex]
    const isLastSlide = hookSlideIndex === HOOK_SLIDES.length - 1

    return (
      <div
        className={`journey-onboarding jo-hook ${transitionClass} ${directionClass}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleHookNext}
        style={{ cursor: 'pointer' }}
      >
        {/* Ambient background */}
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1" />
          <div className="jo-glow jo-glow-2" />
        </div>

        <div className="jo-hook-content">
          <div className="jo-hook-text-container">
            <h1 className="jo-hook-text" key={slide.id}>
              {slide.text}
            </h1>
            {slide.subtext && (
              <p className="jo-hook-subtext">{slide.subtext}</p>
            )}
          </div>
        </div>

        {/* Slide dots */}
        <div className="jo-slide-dots">
          {HOOK_SLIDES.map((_, i) => (
            <span
              key={i}
              className={`jo-slide-dot ${i === hookSlideIndex ? 'active' : ''}`}
            />
          ))}
        </div>

        {/* Tap hint or final CTA */}
        {isLastSlide ? (
          <button
            className="jo-hook-continue"
            onClick={(e) => { e.stopPropagation(); handleHookNext() }}
          >
            <span className="jo-shimmer-layer" />
            Let's find out
            <span className="jo-btn-arrow">&#8594;</span>
          </button>
        ) : (
          <div className="jo-tap-anywhere-hint">Tap anywhere to continue</div>
        )}
      </div>
    )
  }

  // ─── BEAT 2: The Story ────────────────────────────────────────────────────

  if (currentBeat === BEATS.STORY) {
    const stage = WOUND_STAGES[storyStageIndex]
    const selectedScene = stageSelections[stage.id]

    return (
      <div className={`journey-onboarding jo-story ${transitionClass} ${directionClass}`}>
        {renderBeatProgress()}

        {/* Stage progress */}
        <div className="jo-stage-progress">
          {WOUND_STAGES.map((s, i) => (
            <span
              key={s.id}
              className={`jo-stage-dot ${i === storyStageIndex ? 'active' : i < storyStageIndex ? 'completed' : ''}`}
            />
          ))}
        </div>

        <div className="jo-story-content">
          <div className="jo-stage-header">
            <span className="jo-stage-label">{stage.subtitle}</span>
            <h2 className="jo-stage-title">{stage.title}</h2>
            <p className="jo-stage-prompt">Which feels most like your experience?</p>
          </div>

          <div className="jo-scenes">
            {stage.scenes.map((scene, sceneIndex) => (
              <button
                key={scene.id}
                className={`jo-scene-card ${selectedScene === scene.id ? 'jo-scene-selected' : ''}`}
                onClick={() => handleSceneSelect(stage.id, scene.id)}
                style={{ animationDelay: `${0.1 + sceneIndex * 0.1}s` }}
              >
                {scene.image && (
                  <img
                    className="jo-scene-image"
                    src={scene.image}
                    alt={scene.name}
                    style={{ objectPosition: scene.focalPoint || 'center' }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex'
                    }}
                  />
                )}
                <div
                  className="jo-scene-icon-fallback"
                  style={{ display: scene.image ? 'none' : 'flex', background: `${scene.color}15` }}
                >
                  <span>{scene.icon}</span>
                </div>
                <div className="jo-scene-pill">
                  <div className="jo-scene-name">{scene.name}</div>
                  <div className="jo-scene-desc">{scene.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Back button */}
        <button className="jo-back-btn" onClick={handleStoryBack}>
          &#8592; Back
        </button>
      </div>
    )
  }

  // ─── BEAT 3: The Reframe ──────────────────────────────────────────────────

  if (currentBeat === BEATS.REFRAME) {
    return (
      <div className={`journey-onboarding jo-reframe ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2" />
        </div>
        {renderBeatProgress()}
        <div className="jo-reframe-content">
          <div className="jo-reframe-center">
            <h2 className="jo-reframe-text">
              What if you could build a life that fits who you actually are, not who you were told to be?
            </h2>
            <button className="jo-cta-button jo-reframe-cta" onClick={() => transitionTo(setCurrentBeat, BEATS.PROMISE, 'right')}>
              <span className="jo-shimmer-layer" />
              Sounds great!
              <span className="jo-btn-arrow">&#8594;</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── BEAT 4: The Promise ──────────────────────────────────────────────────

  if (currentBeat === BEATS.PROMISE) {
    return (
      <div className={`journey-onboarding jo-promise ${transitionClass} ${directionClass}`}>
        {/* Ambient background */}
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2 jo-glow-gold" />
        </div>

        {renderBeatProgress()}

        <div className="jo-promise-content">
          <div className="jo-promise-icon">🌊</div>
          <h2 className="jo-promise-heading">That's what FindMyFlow is for.</h2>
          <p className="jo-promise-subtext">Your journey starts here.</p>
          <button className="jo-cta-button" onClick={handleSignUp}>
            <span className="jo-shimmer-layer" />
            Start My Journey
            <span className="jo-btn-arrow">&#8594;</span>
          </button>
        </div>

        {/* Back */}
        <button
          className="jo-back-btn"
          onClick={() => transitionTo(setCurrentBeat, BEATS.REFRAME, 'left')}
        >
          &#8592; Back
        </button>
      </div>
    )
  }

  // ─── BEAT 5: Signup ────────────────────────────────────────────────────────

  if (currentBeat === BEATS.SIGNUP) {
    return (
      <div className={`journey-onboarding jo-signup ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2" />
        </div>
        {renderBeatProgress()}
        <div className="jo-signup-content">
          <h2 className="jo-signup-heading">Let's get you set up</h2>
          <p className="jo-signup-subtext">Enter your details to start your journey</p>
          <form className="jo-signup-form" onSubmit={(e) => {
            e.preventDefault()
            if (userName.trim() && email.trim()) handleEmailSubmit(e)
          }}>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your first name"
              className="jo-signup-input"
              autoFocus
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="jo-signup-input"
            />
            <button
              type="submit"
              className="jo-cta-button"
              disabled={isLoading || !userName.trim() || !email.trim()}
            >
              {isLoading ? (
                <span>Sending code...</span>
              ) : (
                <>
                  <span className="jo-shimmer-layer" />
                  Send Verification Code
                  <span className="jo-btn-arrow">&#8594;</span>
                </>
              )}
            </button>
          </form>
          {authError && <p className="jo-auth-error">{authError}</p>}
        </div>
      </div>
    )
  }

  // ─── BEAT 6: Verify ─────────────────────────────────────────────────────────

  if (currentBeat === BEATS.VERIFY) {
    return (
      <div className={`journey-onboarding jo-verify ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2" />
        </div>
        {renderBeatProgress()}
        <div className="jo-verify-content">
          <h2 className="jo-verify-heading">Check your email</h2>
          <p className="jo-verify-subtext">
            We sent a code to <strong>{email}</strong>
          </p>
          <form className="jo-verify-form" onSubmit={handleCodeVerify}>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="jo-signup-input jo-code-input"
              maxLength={6}
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            <button
              type="submit"
              className="jo-cta-button"
              disabled={isLoading || verificationCode.length !== 6}
            >
              {isLoading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span className="jo-shimmer-layer" />
                  Verify &amp; Start
                  <span className="jo-btn-arrow">&#8594;</span>
                </>
              )}
            </button>
          </form>
          {authError && <p className="jo-auth-error">{authError}</p>}
          <button className="jo-resend-btn" onClick={() => {
            setVerificationCode('')
            setAuthError(null)
            handleEmailSubmit({ preventDefault: () => {} })
          }}>
            Resend code
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default JourneyOnboarding
