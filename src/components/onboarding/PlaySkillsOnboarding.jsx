/**
 * PlaySkillsOnboarding.jsx
 *
 * New /get-started flow. Replaces JourneyOnboarding.
 *
 * Beats:
 *   1. Hook slides (ported from JourneyOnboarding)
 *   2. AI-usage gate ("Have you been journaling with AI?")
 *   3a. Path A: Copy prompt → paste AI response → parse → map-to-playskills edge fn → swipe deck
 *   3b. Path B: Wheel self-selection (10 categories → placemakes)
 *   4. Reveal (simple: kept placemakes grouped by category)
 *   5. Signup (name + email → OTP)
 *   6. Verify (6-digit code)
 *
 * All pre-auth state stored in localStorage. Hydrated to DB after signup
 * via 'playskills_onboarding_result' key (read by /me page).
 *
 * Created: 2026-04-11
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { SKILLS_SEGMENTS, findSkillSegment } from '../../lib/wheelTaxonomy'
import SwipeCardDeck from '../SwipeCardDeck/SwipeCardDeck'
import './JourneyOnboarding.css'
import './PlaySkillsOnboarding.css'

// ─── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'playskills_onboarding_progress'
const RESULT_KEY = 'playskills_onboarding_result'

const MAX_CATEGORIES = 3
const MAX_PLACEMAKES_PER_CATEGORY = 3

const BEATS = {
  HOOK: 'hook',
  AI_GATE: 'ai_gate',
  // Path A
  COPY_PROMPT: 'copy_prompt',
  PASTE: 'paste',
  MAPPING: 'mapping',
  SWIPE: 'swipe',
  // Path B
  WHEEL_CATEGORIES: 'wheel_categories',
  WHEEL_SKILLS: 'wheel_skills',
  // Shared
  REVEAL: 'reveal',
  SIGNUP: 'signup',
  VERIFY: 'verify',
}

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

const SKILLS_PROMPT = `Analyze our entire conversation history. I want you to identify the things I naturally light up about, the activities that feel like play not work.

Look for:
- What I talk about with genuine excitement (not just competence)
- What I'd do even if nobody paid me
- What makes me lose track of time
- What I keep coming back to because I love it, not because I have to

Ignore anything that sounds like obligation, duty, or "should." I only want the things that genuinely energize me.

Extract and organize your findings in this EXACT format:

---START EXTRACTION---

SKILLS
- SKILL: [Name]
  EVIDENCE: [Brief quote or pattern you noticed]
  FREQUENCY: [Low/Medium/High]
  CATEGORY: [Technical/Creative/Interpersonal/Strategic/Healing/Other]

(list ALL skills you identified, aim for 5-10)

---END EXTRACTION---`

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseSkills(text) {
  const skills = []
  const skillMatches = [...text.matchAll(/SKILL:\s*(.+?)(?:\n|$)/gi)]
  const evidenceMatches = [...text.matchAll(/EVIDENCE:\s*(.+?)(?:\n|$)/gi)]
  const categoryMatches = [...text.matchAll(/CATEGORY:\s*(.+?)(?:\n|$)/gi)]

  for (let i = 0; i < skillMatches.length; i++) {
    skills.push({
      name: skillMatches[i][1].trim(),
      evidence: evidenceMatches[i]?.[1]?.trim() || '',
      category: categoryMatches[i]?.[1]?.trim() || 'Other',
    })
  }

  // Fallback: line-by-line
  if (skills.length === 0) {
    const lines = text.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('•'))
    lines.forEach(line => {
      const cleaned = line.replace(/^[-•*]\s*/, '').trim()
      if (cleaned.length > 2 && cleaned.length < 100) {
        skills.push({ name: cleaned, evidence: '', category: 'Other' })
      }
    })
  }

  return skills
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PlaySkillsOnboarding() {
  const { user, signInWithCode, verifyCode } = useAuth()
  const navigate = useNavigate()
  const isAuthenticated = !!user

  // Beat state
  const [currentBeat, setCurrentBeat] = useState(BEATS.HOOK)
  const [path, setPath] = useState(null) // 'a' or 'b'

  // Hook
  const [hookSlideIndex, setHookSlideIndex] = useState(0)

  // Path A: external AI
  const [copied, setCopied] = useState(false)
  const [rawResponse, setRawResponse] = useState('')
  const [mappedCards, setMappedCards] = useState([]) // from edge function
  const [keptPlacemakes, setKeptPlacemakes] = useState([]) // after swipe

  // Path B: wheel picker
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedPlacemakes, setSelectedPlacemakes] = useState({})

  // Auth
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState(null)

  // Shared
  const [error, setError] = useState(null)

  // Transitions
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isEntering, setIsEntering] = useState(true)
  const [slideDirection, setSlideDirection] = useState('right')

  const touchStartX = useRef(0)
  const textareaRef = useRef(null)

  // ─── Effects ──────────────────────────────────────────────────────────────

  useEffect(() => {
    document.body.classList.add('onboarding-active')
    return () => document.body.classList.remove('onboarding-active')
  }, [])

  useEffect(() => {
    if (isEntering) {
      const timer = setTimeout(() => setIsEntering(false), 400)
      return () => clearTimeout(timer)
    }
  }, [isEntering, currentBeat, hookSlideIndex])

  // Load saved progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const p = JSON.parse(saved)
        if (Date.now() - p.timestamp < 24 * 60 * 60 * 1000) {
          // Don't restore transient loading states — fall back to the input beat
          let beat = p.currentBeat
          if (beat === BEATS.MAPPING) beat = BEATS.PASTE
          if (beat === BEATS.SWIPE && (!p.mappedCards || p.mappedCards.length === 0)) beat = BEATS.PASTE
          if (beat) setCurrentBeat(beat)
          if (p.path) setPath(p.path)
          if (p.hookSlideIndex !== undefined) setHookSlideIndex(p.hookSlideIndex)
          if (p.selectedCategories) setSelectedCategories(p.selectedCategories)
          if (p.selectedPlacemakes) setSelectedPlacemakes(p.selectedPlacemakes)
          if (p.keptPlacemakes) setKeptPlacemakes(p.keptPlacemakes)
          if (p.mappedCards) setMappedCards(p.mappedCards)
          if (p.rawResponse) setRawResponse(p.rawResponse)
          if (p.userName) setUserName(p.userName)
          if (p.email) setEmail(p.email)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch {}
  }, [])

  // Save progress
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentBeat, path, hookSlideIndex,
      selectedCategories, selectedPlacemakes,
      keptPlacemakes, mappedCards,
      rawResponse, userName, email,
      timestamp: Date.now(),
    }))
  }, [currentBeat, path, hookSlideIndex, selectedCategories, selectedPlacemakes, keptPlacemakes, mappedCards, rawResponse, userName, email])

  // ─── Navigation ──────────────────────────────────────────────────────────

  const transitionTo = useCallback((beat, direction = 'right') => {
    if (isTransitioning) return
    setSlideDirection(direction)
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentBeat(beat)
      setIsTransitioning(false)
      setIsEntering(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 250)
  }, [isTransitioning])

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
      transitionTo(BEATS.AI_GATE)
    }
  }

  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX
  }

  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].screenX
    if (currentBeat === BEATS.HOOK) {
      if (diff > 50 && hookSlideIndex < HOOK_SLIDES.length - 1) {
        handleHookTap()
      } else if (diff > 50 && hookSlideIndex === HOOK_SLIDES.length - 1) {
        transitionTo(BEATS.AI_GATE)
      }
    }
  }

  // ─── Path A handlers ──────────────────────────────────────────────────────

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(SKILLS_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleParse = async () => {
    if (!rawResponse.trim()) return
    setIsLoading(true)
    setError(null)

    const parsed = parseSkills(rawResponse)
    if (parsed.length === 0) {
      setError("Couldn't find any skills. Make sure you copied the full extraction output.")
      setIsLoading(false)
      return
    }

    // Go straight to loading state (no transition animation needed for a spinner)
    setCurrentBeat(BEATS.MAPPING)

    // Call edge function
    try {
      const { data, error: fnError } = await supabase.functions.invoke('map-to-playskills', {
        body: { items: parsed },
      })

      if (fnError) throw fnError

      const mapped = (data?.mappedItems || []).map((item, i) => ({
        id: `${item.categoryId}_${i}_${item.placemake.slice(0, 20)}`,
        placemake: item.placemake,
        categoryId: item.categoryId,
        evidence: item.evidence,
        originalName: item.originalName,
      }))

      if (mapped.length === 0) {
        setError('Could not map your skills. Please try again.')
        transitionTo(BEATS.PASTE, 'left')
        setIsLoading(false)
        return
      }

      setMappedCards(mapped)
      transitionTo(BEATS.SWIPE)
    } catch (err) {
      console.error('Mapping error:', err)
      setError('Something went wrong mapping your skills. Please try again.')
      transitionTo(BEATS.PASTE, 'left')
    }
    setIsLoading(false)
  }

  const handleSwipeComplete = (keptIds) => {
    const kept = mappedCards.filter(c => keptIds.includes(c.id))
    setKeptPlacemakes(kept)
    transitionTo(BEATS.REVEAL)
  }

  // ─── Path B handlers ──────────────────────────────────────────────────────

  const toggleCategory = (id) => {
    setSelectedCategories(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= MAX_CATEGORIES) return prev
      return [...prev, id]
    })
  }

  const togglePlacemake = (categoryId, placemake) => {
    setSelectedPlacemakes(prev => {
      const current = prev[categoryId] || []
      if (current.includes(placemake)) {
        return { ...prev, [categoryId]: current.filter(s => s !== placemake) }
      }
      if (current.length >= MAX_PLACEMAKES_PER_CATEGORY) return prev
      return { ...prev, [categoryId]: [...current, placemake] }
    })
  }

  const totalWheelPicks = selectedCategories.reduce(
    (sum, catId) => sum + (selectedPlacemakes[catId]?.length || 0), 0
  )

  const handleWheelComplete = () => {
    // Convert wheel picks to the same shape as Path A kept placemakes
    const kept = []
    let idx = 0
    for (const catId of selectedCategories) {
      const seg = findSkillSegment(catId)
      for (const pm of (selectedPlacemakes[catId] || [])) {
        kept.push({
          id: `${catId}_${idx++}_${pm.slice(0, 20)}`,
          placemake: pm,
          categoryId: catId,
          evidence: '',
          originalName: seg?.displayName || catId,
        })
      }
    }
    setKeptPlacemakes(kept)
    transitionTo(BEATS.REVEAL)
  }

  // ─── Save + Auth handlers ──────────────────────────────────────────────────

  // Save directly to DB (authenticated users)
  const handleAuthenticatedSave = async () => {
    if (!user?.id || keptPlacemakes.length === 0) return
    setIsLoading(true)
    setError(null)

    try {
      // Remove old get_started clusters before inserting new ones
      await supabase.from('nikigai_clusters')
        .delete()
        .eq('user_id', user.id)
        .eq('source_flow', 'get_started')

      // Insert kept placemakes into nikigai_clusters
      const rows = keptPlacemakes.map(item => ({
        user_id: user.id,
        cluster_type: 'skills',
        cluster_label: item.placemake,
        source_flow: 'get_started',
        items: [{
          text: item.placemake,
          category: item.categoryId,
          evidence: item.evidence || '',
          isStarred: true,
        }],
      }))

      const { error: insertError } = await supabase.from('nikigai_clusters').insert(rows)
      if (insertError) throw insertError

      // Mark onboarding complete
      await supabase.from('user_stage_progress').upsert({
        user_id: user.id,
        onboarding_v2_completed: true,
      }, { onConflict: 'user_id' })

      localStorage.removeItem(STORAGE_KEY)
      navigate('/me')
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save. Please try again.')
    }
    setIsLoading(false)
  }

  // Save to localStorage for post-auth hydration (unauthenticated users)
  const handleSignUp = () => {
    localStorage.setItem(RESULT_KEY, JSON.stringify({
      path,
      keptPlacemakes,
      userName,
      completedAt: new Date().toISOString(),
    }))
    localStorage.removeItem(STORAGE_KEY)
    transitionTo(BEATS.SIGNUP)
  }

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

  // BEAT 1: Hook
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
          <div className="jo-hook-text-container">
            <h1 className="jo-hook-text" key={slide.id}>{slide.text}</h1>
            {slide.subtext && <p className="jo-hook-subtext">{slide.subtext}</p>}
          </div>
        </div>
        <div className="jo-slide-dots">
          {HOOK_SLIDES.map((_, i) => (
            <span key={i} className={`jo-slide-dot ${i === hookSlideIndex ? 'active' : ''}`} />
          ))}
        </div>
        {isLast ? (
          <button className="jo-hook-continue" onClick={(e) => { e.stopPropagation(); handleHookTap() }}>
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

  // BEAT 2: AI Gate
  if (currentBeat === BEATS.AI_GATE) {
    return (
      <div className={`journey-onboarding pso-gate ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="pso-gate-content">
          <h2 className="pso-gate-title">Do you use ChatGPT or Claude regularly?</h2>
          <p className="pso-gate-subtitle">
            If you have conversation history with an AI, we can mine it for patterns you can't see yourself.
          </p>
          <div className="pso-gate-options">
            <button
              className="pso-gate-btn pso-gate-primary"
              onClick={() => { setPath('a'); transitionTo(BEATS.COPY_PROMPT) }}
            >
              <span className="pso-gate-icon">🧠</span>
              <span className="pso-gate-text">
                <strong>Yes, I journal with AI</strong>
                <span>Deeper analysis, best results</span>
              </span>
            </button>
            <button
              className="pso-gate-btn"
              onClick={() => { setPath('b'); transitionTo(BEATS.WHEEL_CATEGORIES) }}
            >
              <span className="pso-gate-icon">🎯</span>
              <span className="pso-gate-text">
                <strong>No, or only a little</strong>
                <span>Pick from a curated menu instead</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // BEAT 3a-1: Copy Prompt
  if (currentBeat === BEATS.COPY_PROMPT) {
    return (
      <div className={`journey-onboarding pso-copy ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="pso-copy-content">
          <h2>Copy this prompt</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
            Paste it into the AI you've been chatting with. It will analyze your conversation and find what lights you up.
          </p>
          <div className="pso-prompt-preview">
            {SKILLS_PROMPT.substring(0, 180)}...
          </div>
          <button className="jo-cta-button" onClick={handleCopyPrompt} style={{ width: '100%' }}>
            <span className="jo-shimmer-layer" />
            {copied ? '✓ Copied!' : 'Copy Prompt'}
          </button>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer"
              className="pso-external-link">Open ChatGPT</a>
            <a href="https://claude.ai" target="_blank" rel="noopener noreferrer"
              className="pso-external-link">Open Claude</a>
          </div>
          <button className="jo-cta-button" onClick={() => transitionTo(BEATS.PASTE)}
            style={{ width: '100%', marginTop: '1.5rem' }}>
            <span className="jo-shimmer-layer" />
            I have my results →
            <span className="jo-btn-arrow">&#8594;</span>
          </button>
          <button className="pso-back-link" onClick={() => transitionTo(BEATS.AI_GATE, 'left')}>
            ← Back
          </button>
        </div>
      </div>
    )
  }

  // BEAT 3a-2: Paste
  if (currentBeat === BEATS.PASTE) {
    return (
      <div className={`journey-onboarding pso-paste ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="pso-paste-content">
          <h2>Paste your AI extraction</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Paste the skills extraction from your AI conversation below.
          </p>
          <textarea
            ref={textareaRef}
            value={rawResponse}
            onChange={(e) => setRawResponse(e.target.value)}
            placeholder="Paste the extraction here..."
            className="pso-textarea"
          />
          {error && <p className="pso-error">{error}</p>}
          <button
            className="jo-cta-button"
            onClick={handleParse}
            disabled={!rawResponse.trim() || isLoading}
            style={{ width: '100%' }}
          >
            <span className="jo-shimmer-layer" />
            {isLoading ? 'Processing...' : 'Find my play-skills →'}
            {!isLoading && <span className="jo-btn-arrow">&#8594;</span>}
          </button>
          <button className="pso-back-link" onClick={() => transitionTo(BEATS.COPY_PROMPT, 'left')}>
            ← Back
          </button>
        </div>
      </div>
    )
  }

  // BEAT 3a-3: Mapping (loading state)
  if (currentBeat === BEATS.MAPPING) {
    return (
      <div className={`journey-onboarding pso-mapping ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2 jo-glow-gold" />
        </div>
        <div className="pso-mapping-content">
          <div className="pso-mapping-spinner" />
          <h2>Listening for your play-skills...</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            Finding patterns in what lights you up
          </p>
        </div>
      </div>
    )
  }

  // BEAT 3a-4: Swipe Deck
  if (currentBeat === BEATS.SWIPE && mappedCards.length > 0) {
    return (
      <div className={`journey-onboarding pso-swipe ${transitionClass} ${directionClass}`}>
        <div className="pso-swipe-container">
          <SwipeCardDeck
            cards={mappedCards}
            headerText="Does this sound like you?"
            onComplete={handleSwipeComplete}
            onBackFromFirst={() => transitionTo(BEATS.PASTE, 'left')}
            renderCard={(card) => {
              const seg = findSkillSegment(card.categoryId)
              return (
                <>
                  <div className="pso-card-badge">
                    {seg?.icon} {seg?.displayName || card.categoryId}
                  </div>
                  <div className="pso-card-placemake">{card.placemake}</div>
                  {card.evidence && (
                    <div className="pso-card-evidence">
                      You said: "{card.evidence}"
                    </div>
                  )}
                </>
              )
            }}
          />
        </div>
      </div>
    )
  }

  // BEAT 3b-1: Wheel Categories
  if (currentBeat === BEATS.WHEEL_CATEGORIES) {
    return (
      <div className={`journey-onboarding pso-wheel ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="pso-wheel-content">
          <h2>Which of these sound fun?</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Pick up to {MAX_CATEGORIES}. ({selectedCategories.length}/{MAX_CATEGORIES})
          </p>
          <div className="pso-category-grid">
            {SKILLS_SEGMENTS.map(seg => {
              const isSelected = selectedCategories.includes(seg.id)
              const disabled = !isSelected && selectedCategories.length >= MAX_CATEGORIES
              return (
                <button
                  key={seg.id}
                  onClick={() => toggleCategory(seg.id)}
                  disabled={disabled}
                  className={`pso-category-card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                >
                  <div className="pso-cat-icon">{seg.icon}</div>
                  <div className="pso-cat-name">{seg.displayName}</div>
                  <div className="pso-cat-tagline">{seg.tagline}</div>
                </button>
              )
            })}
          </div>
          <button
            className="jo-cta-button"
            onClick={() => transitionTo(BEATS.WHEEL_SKILLS)}
            disabled={selectedCategories.length === 0}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            <span className="jo-shimmer-layer" />
            Continue →
          </button>
          <button className="pso-back-link" onClick={() => transitionTo(BEATS.AI_GATE, 'left')}>
            ← Back
          </button>
        </div>
      </div>
    )
  }

  // BEAT 3b-2: Wheel Placemakes
  if (currentBeat === BEATS.WHEEL_SKILLS) {
    return (
      <div className={`journey-onboarding pso-wheel ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="pso-wheel-content">
          <h2>Pick what sounds fun to do</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Up to {MAX_PLACEMAKES_PER_CATEGORY} per category. ({totalWheelPicks} picked)
          </p>
          {selectedCategories.map(catId => {
            const seg = findSkillSegment(catId)
            if (!seg) return null
            const picks = selectedPlacemakes[catId] || []
            return (
              <div key={catId} className="pso-pm-section">
                <div className="pso-pm-header">
                  <span className="pso-pm-icon">{seg.icon}</span>
                  <span className="pso-pm-name">{seg.displayName}</span>
                  <span className="pso-pm-count">{picks.length}/{MAX_PLACEMAKES_PER_CATEGORY}</span>
                </div>
                <div className="pso-pm-list">
                  {(seg.placemakes || []).map(pm => {
                    const isSelected = picks.includes(pm)
                    const disabled = !isSelected && picks.length >= MAX_PLACEMAKES_PER_CATEGORY
                    return (
                      <button
                        key={pm}
                        onClick={() => togglePlacemake(catId, pm)}
                        disabled={disabled}
                        className={`pso-pm-btn ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                      >
                        {isSelected ? '⭐ ' : ''}{pm}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {error && <p className="pso-error">{error}</p>}
          <button
            className="jo-cta-button"
            onClick={handleWheelComplete}
            disabled={totalWheelPicks === 0}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            <span className="jo-shimmer-layer" />
            See my play-skills →
            <span className="jo-btn-arrow">&#8594;</span>
          </button>
          <button className="pso-back-link" onClick={() => transitionTo(BEATS.WHEEL_CATEGORIES, 'left')}>
            ← Back
          </button>
        </div>
      </div>
    )
  }

  // BEAT 4: Reveal
  if (currentBeat === BEATS.REVEAL) {
    // Group kept placemakes by category
    const grouped = {}
    keptPlacemakes.forEach(item => {
      if (!grouped[item.categoryId]) grouped[item.categoryId] = []
      grouped[item.categoryId].push(item)
    })

    return (
      <div className={`journey-onboarding pso-reveal ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2 jo-glow-gold" />
        </div>
        <div className="pso-reveal-content">
          <div className="pso-reveal-icon">✨</div>
          <h2 className="pso-reveal-title">Your Play-Skills</h2>
          <p className="pso-reveal-subtitle">
            {path === 'a'
              ? "Here's what lights you up, pulled from your own words."
              : "Here's what you chose. These will power your journey."}
          </p>
          <div className="pso-reveal-groups">
            {Object.entries(grouped).map(([catId, items]) => {
              const seg = findSkillSegment(catId)
              return (
                <div key={catId} className="pso-reveal-group">
                  <div className="pso-reveal-cat">
                    {seg?.icon} {seg?.displayName || catId}
                  </div>
                  {items.map((item, i) => (
                    <div key={i} className="pso-reveal-item">
                      {item.placemake}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
          <button
            className="jo-cta-button"
            onClick={isAuthenticated ? handleAuthenticatedSave : handleSignUp}
            disabled={isLoading}
            style={{ width: '100%', marginTop: '1.5rem' }}
          >
            <span className="jo-shimmer-layer" />
            {isLoading ? 'Saving...' : isAuthenticated ? 'Add to my Play-List' : 'Save my play-skills'}
            {!isLoading && <span className="jo-btn-arrow">&#8594;</span>}
          </button>
          {error && <p className="pso-error">{error}</p>}
        </div>
      </div>
    )
  }

  // BEAT 5: Signup
  if (currentBeat === BEATS.SIGNUP) {
    return (
      <div className={`journey-onboarding jo-signup ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2" />
        </div>
        <div className="jo-signup-content">
          <h2 className="jo-signup-heading">Save your play-skills</h2>
          <p className="jo-signup-subtext">Create your account to start your journey</p>
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

  // BEAT 6: Verify
  if (currentBeat === BEATS.VERIFY) {
    return (
      <div className={`journey-onboarding jo-verify ${transitionClass} ${directionClass}`}>
        <div className="jo-ambient">
          <div className="jo-glow jo-glow-1 jo-glow-gold" />
          <div className="jo-glow jo-glow-2" />
        </div>
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
          <button className="pso-back-link" onClick={() => {
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
