/**
 * PlaySkillsOnboarding.jsx
 *
 * /get-started onboarding flow for new users.
 *
 * Beats:
 *   1. Hook slides (childhood → emotional splinters → story → CTA)
 *   2. Signup (name + email + WhatsApp → OTP)
 *   3. Verify (6-digit code → navigate to /me)
 *
 * Play-skills identification happens later at Level 0 via PlaySkillPicker.
 * The full play-skills flow lives at /play-skills-identifier (PlaySkillsIdentifier.jsx).
 *
 * Created: 2026-04-11 | Rebuilt: 2026-04-19 | Cleaned: 2026-05-10
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './JourneyOnboarding.css'
import './PlaySkillsOnboarding.css'

// ─── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'playskills_onboarding_progress'

const BEATS = {
  HOOK: 'hook',
  SIGNUP: 'signup',
  VERIFY: 'verify',
}

const HOOK_SLIDES = [
  { id: 'childhood', text: 'Think about you as a kid.', subtext: 'How playful you were. How full of love. How care-free.\n\nSo where did they go?' },
  { id: 'splinters', text: 'Somewhere along the way, we collect emotional splinters.', subtext: 'Experiences that made being ourselves feel unsafe.\n\nOur nervous system = our safety system.\n\nSo to stop this from happening again, protective patterns were created.' },
  { id: 'story', text: 'At 14 I was a playful, dancing, rainbow.', subtext: 'I wore fluro pinks, blues, oranges, purples and uploaded videos of me dancing on Facebook.\n\nThen I got teased for it.\n\nSo for the next TWELVE YEARS I never wore rainbow clothes or danced sober again. Basically the things that make me feel most like me.' },
  { id: 'cta', text: 'This is what breaks my heart about emotional splinters.', subtext: 'They leave us scared to be ourselves.\n\nAnd this suppression dims the aliveness we were born with.\n\nReady to find what lights you up again?' },
]

// ─── Component ──────────────────────────────────────────────────────────────

export default function PlaySkillsOnboarding() {
  const { user, signInWithCode, verifyCode } = useAuth()
  const navigate = useNavigate()

  // Beat state
  const [currentBeat, setCurrentBeat] = useState(BEATS.HOOK)

  // Hook
  const [hookSlideIndex, setHookSlideIndex] = useState(0)

  // Auth
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState(null)

  // Slide transitions
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isEntering, setIsEntering] = useState(false)
  const [slideDirection, setSlideDirection] = useState('right')
  const touchStartX = useRef(0)

  // If already authenticated, redirect
  useEffect(() => {
    if (user) navigate('/me')
  }, [user, navigate])

  // Clear entering class after animation
  useEffect(() => {
    if (isEntering) {
      const t = setTimeout(() => setIsEntering(false), 300)
      return () => clearTimeout(t)
    }
  }, [isEntering, currentBeat, hookSlideIndex])

  // Restore progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const p = JSON.parse(saved)
        if (Date.now() - p.timestamp < 24 * 60 * 60 * 1000 && [BEATS.HOOK, BEATS.SIGNUP, BEATS.VERIFY].includes(p.currentBeat)) {
          if (p.currentBeat) setCurrentBeat(p.currentBeat)
          if (p.hookSlideIndex) setHookSlideIndex(p.hookSlideIndex)
          if (p.userName) setUserName(p.userName)
          if (p.email) setEmail(p.email)
          if (p.whatsapp) setWhatsapp(p.whatsapp)
        }
      }
    } catch {}
  }, [])

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentBeat, hookSlideIndex, userName, email, whatsapp,
      timestamp: Date.now(),
    }))
  }, [currentBeat, hookSlideIndex, userName, email, whatsapp])

  const transitionTo = useCallback((beat, direction = 'right') => {
    setSlideDirection(direction)
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentBeat(beat)
      setIsTransitioning(false)
      setIsEntering(true)
    }, 250)
  }, [])

  const transitionClass = `${isTransitioning ? 'jo-transitioning' : ''} ${isEntering ? 'jo-entering' : ''}`
  const directionClass = slideDirection === 'left' ? 'jo-slide-left' : 'jo-slide-right'

  // ─── Hook handlers ────────────────────────────────────────────────────────

  const handleHookTap = () => {
    if (hookSlideIndex < HOOK_SLIDES.length - 1) {
      setSlideDirection('right')
      setIsTransitioning(true)
      setTimeout(() => {
        setHookSlideIndex(hookSlideIndex + 1)
        setIsTransitioning(false)
        setIsEntering(true)
      }, 250)
    } else {
      transitionTo(BEATS.SIGNUP)
    }
  }

  const handleTouchStart = (e) => { touchStartX.current = e.changedTouches[0].screenX }
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].screenX
    if (currentBeat === BEATS.HOOK) {
      if (diff > 50) handleHookTap()
    }
  }

  // ─── Auth handlers ────────────────────────────────────────────────────────

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email || isLoading) return
    setIsLoading(true)
    setAuthError(null)
    try {
      const result = await signInWithCode(email.toLowerCase().trim())
      if (result.success) {
        transitionTo(BEATS.VERIFY)
      } else {
        setAuthError(result.message || 'Failed to send verification code')
      }
    } catch {
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
        try {
          const { data: { user: newUser } } = await supabase.auth.getUser()
          if (newUser?.id) {
            if (userName?.trim()) {
              await supabase.auth.updateUser({ data: { display_name: userName.trim(), whatsapp: whatsapp.trim() } })
            }
            // Upsert stage progress
            await supabase.from('user_stage_progress').upsert({
              user_id: newUser.id,
              onboarding_v2_completed: true,
            }, { onConflict: 'user_id' })
            localStorage.removeItem(STORAGE_KEY)
          }
        } catch (saveErr) {
          console.warn('Post-verify save error:', saveErr)
        }
        navigate('/me')
      } else {
        setAuthError(result.message || 'Invalid code. Please try again.')
      }
    } catch {
      setAuthError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  // BEAT 1: Hook slides
  if (currentBeat === BEATS.HOOK) {
    const slide = HOOK_SLIDES[hookSlideIndex]
    const isLast = hookSlideIndex === HOOK_SLIDES.length - 1

    return (
      <div
        className={`journey-onboarding jo-hook ${transitionClass} ${directionClass}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleHookTap}
        style={{ cursor: 'pointer' }}
      >
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="jo-hook-content">
          <h1 className="jo-hook-heading">{slide.text}</h1>
          {slide.subtext && (
            <p className="jo-hook-subtext">
              {slide.subtext.split('\n\n').map((para, i) => (
                <span key={i}>{para}{i < slide.subtext.split('\n\n').length - 1 && <><br /><br /></>}</span>
              ))}
            </p>
          )}
          <div className="jo-hook-dots">
            {HOOK_SLIDES.map((_, i) => (
              <span key={i} className={`jo-hook-dot ${i <= hookSlideIndex ? 'active' : ''}`} />
            ))}
          </div>
          {isLast ? (
            <>
              <button className="jo-hook-continue" onClick={(e) => { e.stopPropagation(); transitionTo(BEATS.SIGNUP) }}>
                <span className="jo-shimmer-layer" />
                Let's go
              </button>
              <a
                href="/log-in"
                className="jo-login-link"
                onClick={(e) => e.stopPropagation()}
              >
                Already have an account? Log in
              </a>
            </>
          ) : (
            <p className="jo-hook-tap-hint">Tap to continue</p>
          )}
        </div>
      </div>
    )
  }

  // BEAT 2: Signup
  if (currentBeat === BEATS.SIGNUP) {
    return (
      <div className={`journey-onboarding jo-signup ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="jo-signup-content">
          <h2 className="jo-signup-heading">Let's begin</h2>
          <p className="jo-signup-subtext">Create your account to start your journey</p>
          <form className="jo-signup-form" onSubmit={(e) => {
            e.preventDefault()
            if (userName.trim() && email.trim() && whatsapp.trim()) handleEmailSubmit(e)
          }}>
            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)}
              placeholder="Your first name" className="jo-signup-input" autoFocus />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com" className="jo-signup-input" />
            <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="WhatsApp number (incl. area code, e.g. +61...)" className="jo-signup-input" />
            <button type="submit" className="jo-cta-button" disabled={isLoading || !userName.trim() || !email.trim() || !whatsapp.trim()}>
              {isLoading ? <span>Sending code...</span> : (
                <><span className="jo-shimmer-layer" />Send Verification Code<span className="jo-btn-arrow">&#8594;</span></>
              )}
            </button>
          </form>
          {authError && <p className="jo-auth-error">{authError}</p>}
        </div>
      </div>
    )
  }

  // BEAT 3: Verify
  if (currentBeat === BEATS.VERIFY) {
    return (
      <div className={`journey-onboarding jo-verify ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="jo-verify-content">
          <h2 className="jo-verify-heading">Check your email</h2>
          <p className="jo-verify-subtext">We sent a code to <strong>{email}</strong></p>
          <form className="jo-verify-form" onSubmit={handleCodeVerify}>
            <input type="text" value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code" className="jo-signup-input jo-code-input"
              maxLength={6} autoFocus inputMode="numeric" autoComplete="one-time-code" />
            <button type="submit" className="jo-cta-button" disabled={isLoading || verificationCode.length !== 6}>
              {isLoading ? <span>Verifying...</span> : (
                <><span className="jo-shimmer-layer" />Verify &amp; Start<span className="jo-btn-arrow">&#8594;</span></>
              )}
            </button>
          </form>
          {authError && <p className="jo-auth-error">{authError}</p>}
          <button className="pso-back-link" onClick={() => {
            setVerificationCode('')
            setAuthError(null)
            handleEmailSubmit({ preventDefault: () => {} })
          }}>Resend code</button>
        </div>
      </div>
    )
  }

  return null
}
