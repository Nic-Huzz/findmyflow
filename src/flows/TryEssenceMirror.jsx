/**
 * TryEssenceMirror.jsx
 *
 * Public (no auth) version of the Essence Mirror flow.
 * Identical experience to EssenceMirrorFlow but with an email gate
 * before the AI reveal. Saves lead to public_leads table.
 *
 * Route: /try/essence-mirror
 */

import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { SUPERPOWER_ROUNDS, getArchetype } from '../data/essenceArchetypes'
import PublicEmailGate from '../components/PublicEmailGate'
import '../styles/flow-base.css'
import './EssenceMirrorFlow.css'

const ARCHETYPE_EMOJI = {
  radiant_rebel: '🔥',
  playful_creator: '🎨',
  sacred_jester: '🃏',
  mystic_messenger: '🔮',
  truth_teller: '⚡',
  heart_alchemist: '💛',
  grounded_guardian: '🛡️',
  heart_holder: '💗',
  rhythm_architect: '⚙️',
  wise_sage: '🧭',
  cosmic_connector: '🌌',
  compassionate_leader: '👑',
}

const HOOK_SLIDES = [
  { text: 'What if I told you our most authentic selves are often who we hide away the most?', button: 'Tell me how' },
  { text: 'Take a moment to think about you as a kid and all the weird and random things you loved.' },
  { text: 'Imagine getting teased, made fun of or rejected for these things...' },
  { text: 'How would you have felt?', subtext: 'Embarrassed, ashamed, sad.' },
  { text: 'We hate feeling that way, so what do we do to protect ourselves?', subtext: 'We hide it away.' },
  { text: 'Heartbreakingly, our most authentic parts no longer feel safe to be seen.' },
  { text: 'Ready to reconnect to that version of you and share it with the world?', button: "Let's go" },
]

const STEPS = {
  HOOK: 'hook',
  ROUND_1: 'round_1',
  ROUND_2: 'round_2',
  ROUND_3: 'round_3',
  VISION: 'vision',
  PIXAR: 'pixar',
  LOADING: 'loading',
  EMAIL: 'email',
  REVEAL: 'reveal',
}

export default function TryEssenceMirror() {
  const [step, setStep] = useState(STEPS.HOOK)
  const [hookIndex, setHookIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [hookTransitioning, setHookTransitioning] = useState(false)
  const [hookEntering, setHookEntering] = useState(true)

  const [round1, setRound1] = useState([])
  const [round2, setRound2] = useState([])
  const [round3, setRound3] = useState([])
  const [swipeIndex, setSwipeIndex] = useState(0)
  const swipeTouchStartX = useRef(0)
  const swipeTouchEndX = useRef(0)
  const [visionSelections, setVisionSelections] = useState([])
  const [pixarPick, setPixarPick] = useState(null)

  const [blendResult, setBlendResult] = useState(null)
  const [, setBlendError] = useState(false)

  // ─── Navigation ─────────────────────────────────────────────────────────

  const goToStep = (nextStep) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setStep(nextStep)
      setIsTransitioning(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 300)
  }

  const handleHookTap = () => {
    if (hookTransitioning) return
    if (hookIndex < HOOK_SLIDES.length - 1) {
      setHookTransitioning(true)
      setHookEntering(false)
      setTimeout(() => {
        setHookIndex(hookIndex + 1)
        setHookTransitioning(false)
        setHookEntering(true)
      }, 250)
    } else {
      goToStep(STEPS.ROUND_1)
    }
  }

  // ─── Scoring ────────────────────────────────────────────────────────────

  const toggleSelection = (list, setList, id) => {
    setList(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const getAllSelected = () => [...new Set([...round1, ...round2, ...round3])]

  const getScores = () => {
    const selected = getAllSelected()
    const scores = {}
    selected.forEach(id => { scores[id] = 1 })
    visionSelections.forEach(id => { if (scores[id]) scores[id] = 2 })
    return scores
  }

  const getTopArchetypes = (count = 4) => {
    return Object.entries(getScores())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([id]) => id)
  }

  const getSecondary = () => {
    const sorted = Object.entries(getScores()).sort((a, b) => b[1] - a[1]).map(([id]) => id)
    return sorted.find(id => id !== pixarPick) || sorted[1]
  }

  // ─── AI Blend ───────────────────────────────────────────────────────────

  const runBlend = async () => {
    goToStep(STEPS.LOADING)

    const primary = getArchetype(pixarPick)
    const secondaryId = getSecondary()
    const secondary = getArchetype(secondaryId)

    if (!primary || !secondary) {
      setBlendError(true)
      goToStep(STEPS.EMAIL)
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('essence-mirror-blend', {
        body: {
          primary: {
            name: primary.name,
            poetic_line: primary.poetic_line,
            superpower: primary.superpower,
            essence_wound: primary.essence_wound,
            poetic_vision: primary.poetic_vision,
            energetic_transmission: primary.energetic_transmission,
            north_star: primary.north_star,
            vision_in_action: primary.vision_in_action,
          },
          secondary: {
            name: secondary.name,
            poetic_line: secondary.poetic_line,
            superpower: secondary.superpower,
            essence_wound: secondary.essence_wound,
            poetic_vision: secondary.poetic_vision,
            energetic_transmission: secondary.energetic_transmission,
            north_star: secondary.north_star,
            vision_in_action: secondary.vision_in_action,
          },
          wound_stages: [],
          zone_diagnosis: null,
        },
      })

      if (error) throw error

      setBlendResult({
        ...data,
        primaryName: primary.name,
        secondaryName: secondary.name,
        primaryWound: primary.essence_wound,
        secondaryWound: secondary.essence_wound,
      })
    } catch (err) {
      console.warn('Blend API error:', err)
      setBlendResult({
        blended_name: primary.name,
        blended_essence: primary.poetic_line,
        blended_superpower: primary.superpower,
        blended_wound: primary.essence_wound,
        blended_vision: primary.poetic_vision,
        primaryName: primary.name,
        secondaryName: secondary.name,
        primaryWound: primary.essence_wound,
        secondaryWound: secondary.essence_wound,
      })
    }

    goToStep(STEPS.EMAIL)
  }

  // ─── Email Gate ─────────────────────────────────────────────────────────

  const handleEmailSubmit = async (email, name) => {
    goToStep(STEPS.REVEAL)

    try {
      const primary = getArchetype(pixarPick)
      const secondaryId = getSecondary()

      await supabase.from('public_leads').upsert({
        email,
        name: name || null,
        source_flow: 'essence_mirror',
        flow_results: {
          primary_archetype: primary?.name,
          secondary_archetype: getArchetype(secondaryId)?.name,
          blended_name: blendResult?.blended_name,
          archetype_scores: getScores(),
          selections: { round1, round2, round3, visionSelections, pixarPick },
        },
      }, { onConflict: 'email', ignoreDuplicates: false })

      supabase.functions.invoke('notify-lead-capture', {
        body: {
          email,
          name,
          source: 'Essence Mirror',
          meta: {
            primary_archetype: primary?.name,
            secondary_archetype: getArchetype(secondaryId)?.name,
            blended_name: blendResult?.blended_name,
          },
        },
      }).catch(() => {})
    } catch (err) {
      console.error('Error saving essence mirror lead:', err)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className={`em-flow flow-base ${isTransitioning ? 'transitioning' : ''}`}>

      {/* ── Hook Slides ── */}
      {step === STEPS.HOOK && (
        <div className="em-hook" onClick={handleHookTap}>
          <div className="em-hook-dots-top">
            {HOOK_SLIDES.map((_, i) => (
              <div key={i} className={`em-hook-dot ${i === hookIndex ? 'active' : ''}`} />
            ))}
          </div>
          <div className={`em-hook-content ${hookTransitioning ? 'em-hook-exit' : ''} ${hookEntering ? 'em-hook-enter' : ''}`}>
            <div className="em-hook-text">{HOOK_SLIDES[hookIndex].text}</div>
            {HOOK_SLIDES[hookIndex].subtext && (
              <div className="em-hook-subtext">{HOOK_SLIDES[hookIndex].subtext}</div>
            )}
          </div>
          <div className="em-hook-bottom">
            {HOOK_SLIDES[hookIndex].button ? (
              <button className="em-hook-btn" onClick={(e) => { e.stopPropagation(); handleHookTap() }}>
                {HOOK_SLIDES[hookIndex].button} <span>→</span>
              </button>
            ) : (
              <div className="em-hook-tap-hint">Tap anywhere to continue</div>
            )}
          </div>
        </div>
      )}

      {/* ── Superpower Rounds 1-3 ── */}
      {[STEPS.ROUND_1, STEPS.ROUND_2, STEPS.ROUND_3].map((roundStep, roundIndex) => {
        if (step !== roundStep) return null
        const roundIds = SUPERPOWER_ROUNDS[roundIndex]
        const selections = [round1, round2, round3][roundIndex]
        const setSelections = [setRound1, setRound2, setRound3][roundIndex]
        const nextStep = roundIndex < 2
          ? [STEPS.ROUND_1, STEPS.ROUND_2, STEPS.ROUND_3][roundIndex + 1]
          : STEPS.VISION
        const prevStep = roundIndex > 0
          ? [STEPS.ROUND_1, STEPS.ROUND_2, STEPS.ROUND_3][roundIndex - 1]
          : STEPS.HOOK

        const currentArch = getArchetype(roundIds[swipeIndex])
        const currentId = roundIds[swipeIndex]
        const isSelected = selections.includes(currentId)
        const isLast = swipeIndex === roundIds.length - 1
        const globalIndex = roundIndex * 4 + swipeIndex

        const advanceSwipe = () => {
          if (isLast) { setSwipeIndex(0); goToStep(nextStep) }
          else setSwipeIndex(swipeIndex + 1)
        }

        const goBackSwipe = () => {
          if (swipeIndex > 0) setSwipeIndex(swipeIndex - 1)
          else if (roundIndex > 0) { setSwipeIndex(3); goToStep(prevStep) }
          else goToStep(STEPS.HOOK)
        }

        return (
          <div
            key={roundStep}
            className="em-step em-swipe-step"
            onTouchStart={(e) => { swipeTouchStartX.current = e.changedTouches[0].screenX }}
            onTouchEnd={(e) => {
              swipeTouchEndX.current = e.changedTouches[0].screenX
              const diff = swipeTouchStartX.current - swipeTouchEndX.current
              if (diff > 50) advanceSwipe()
              else if (diff < -50) goBackSwipe()
            }}
          >
            <div className="em-swipe-dots">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={`em-swipe-dot ${i === globalIndex ? 'active' : i < globalIndex ? 'done' : ''}`} />
              ))}
            </div>
            <div className="em-step-header">
              <p className="em-step-subtitle">Does this sound like you?</p>
            </div>
            <div className="em-swipe-middle">
              <div className={`em-swipe-card ${isSelected ? 'selected' : ''}`} key={currentId}>
                {currentArch.swipeImage && (
                  <img className="em-swipe-image" src={currentArch.swipeImage} alt={currentArch.name} draggable={false} onError={(e) => { e.target.style.display = 'none' }} />
                )}
                {!currentArch.swipeImage && <div className="em-swipe-emoji">{ARCHETYPE_EMOJI[currentId]}</div>}
                <div className="em-swipe-text">
                  {currentArch.superpower.split(/(?<=[.?!])\s+/).map((s, i) => <p key={i}>{s}</p>)}
                </div>
                {isSelected && <div className="em-swipe-check">&#10003;</div>}
              </div>
            </div>
            <div className="em-swipe-bottom">
              <div className="em-swipe-actions">
                <button className="em-swipe-btn no" onClick={advanceSwipe}>Not me</button>
                <button className="em-swipe-btn yes" onClick={() => { if (!isSelected) toggleSelection(selections, setSelections, currentId); advanceSwipe() }}>That&apos;s me</button>
              </div>
              <button className="em-back-btn" onClick={goBackSwipe} style={{ marginTop: '0.5rem', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
                ← Back
              </button>
            </div>
          </div>
        )
      })}

      {/* ── Vision Confirmation ── */}
      {step === STEPS.VISION && (
        <div className="em-step">
          <div className="em-step-header">
            <div className="em-step-badge">Confirmation</div>
            <h1 className="em-step-title">Which of these futures excites you most?</h1>
            <p className="em-step-subtitle">Tap all that resonate. <strong style={{ color: 'white' }}>You can pick multiple.</strong></p>
          </div>
          <div className="em-scene-cards">
            {getAllSelected().map((id, i) => {
              const arch = getArchetype(id)
              const isSelected = visionSelections.includes(id)
              return (
                <button key={id} type="button" className={`em-scene-card ${isSelected ? 'em-scene-selected' : ''}`} onClick={() => toggleSelection(visionSelections, setVisionSelections, id)} style={{ animationDelay: `${0.1 + i * 0.1}s` }}>
                  {isSelected && <div className="em-scene-check">&#10003;</div>}
                  <img className="em-scene-image" src={arch.visionImage || arch.image} alt={arch.name} onError={(e) => { e.target.style.display = 'none' }} />
                  <div className="em-scene-pill">
                    <div className="em-scene-desc">
                      {arch.poetic_vision.split(/(?<=[.?!])\s+/).map((s, si) => {
                        const isWhatIf = s.toLowerCase().startsWith('what if')
                        return <p key={si} className={isWhatIf ? 'em-scene-whatif' : 'em-scene-rest'}>{s}</p>
                      })}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="nav-buttons" style={{ flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '400px', margin: '24px auto 0' }}>
            <button className="primary-button" onClick={() => goToStep(STEPS.PIXAR)} style={{ width: '100%' }}>
              {visionSelections.length === 0 ? 'None of these' : 'Continue'} →
            </button>
            <button className="secondary-button" onClick={() => goToStep(STEPS.ROUND_3)} style={{ width: '100%' }}>← Back</button>
          </div>
        </div>
      )}

      {/* ── Pixar Essence Pick ── */}
      {step === STEPS.PIXAR && (
        <div className="em-step">
          <div className="em-step-header">
            <div className="em-step-badge">Your Essence</div>
            <h1 className="em-step-title">Which one makes something inside you say yes?</h1>
            <p className="em-step-subtitle">Choose one.</p>
          </div>
          <div className="em-pixar-cards">
            {getTopArchetypes(4).map(id => {
              const arch = getArchetype(id)
              const isSelected = pixarPick === id
              return (
                <button key={id} type="button" className={`em-pixar-card ${isSelected ? 'selected' : ''}`} onClick={() => setPixarPick(id)}>
                  <img className="em-pixar-image" src={arch.image} alt={arch.name} onError={(e) => { e.target.style.display = 'none' }} />
                  <div className="em-pixar-body">
                    <div className="em-pixar-name">{arch.name}</div>
                    <div className="em-pixar-essence">{arch.poetic_line}</div>
                  </div>
                  {isSelected && <div className="em-pixar-check">&#10003;</div>}
                </button>
              )
            })}
          </div>
          <div className="nav-buttons" style={{ flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '400px', margin: '24px auto 0' }}>
            <button className="primary-button" onClick={runBlend} disabled={!pixarPick} style={{ width: '100%' }}>
              {!pixarPick ? 'Pick your essence' : 'Reveal my mirror'} →
            </button>
            <button className="secondary-button" onClick={() => goToStep(STEPS.VISION)} style={{ width: '100%' }}>← Back</button>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {step === STEPS.LOADING && (
        <div className="em-step em-reveal-loading">
          <div className="em-reveal-spinner" />
          <div className="em-reveal-loading-text">Finding your mirror...</div>
        </div>
      )}

      {/* ── Email Gate (before reveal) ── */}
      {step === STEPS.EMAIL && (
        <PublicEmailGate
          flowType="essence_mirror"
          onEmailSubmit={handleEmailSubmit}
          title="Your Essence Archetype is ready"
          subtitle="Enter your details to discover who you really are"
        />
      )}

      {/* ── AI Mirror Reveal ── */}
      {step === STEPS.REVEAL && blendResult && (
        <div className="em-step em-reveal">
          <div className="em-reveal-icon">&#10024;</div>
          <h1 className="em-reveal-name">{blendResult.blended_name}</h1>
          <div className="em-reveal-archetypes">
            {blendResult.primaryName} + {blendResult.secondaryName}
          </div>

          <div className="em-reveal-card">
            <div className="em-reveal-label">Your Essence</div>
            <div className="em-reveal-text">
              {blendResult.blended_essence?.replace(/[—;]/g, ',').split(/(?<=[.?!])\s+/).map((s, i) => <p key={i}>{s}</p>)}
            </div>
          </div>

          <div className="em-reveal-card">
            <div className="em-reveal-label">Your Superpower</div>
            <div className="em-reveal-text">
              {blendResult.blended_superpower?.replace(/[—;]/g, ',').split(/(?<=[.?!])\s+/).map((s, i) => <p key={i}>{s}</p>)}
            </div>
          </div>

          <div className="em-reveal-card">
            <div className="em-reveal-label">Your Vision</div>
            <div className="em-reveal-text">
              {blendResult.blended_vision?.replace(/[—;]/g, ',').split(/(?<=[.?!])\s+/).map((s, i) => <p key={i}>{s}</p>)}
            </div>
          </div>

          <div className="nav-buttons" style={{ flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '400px', margin: '32px auto 0' }}>
            <a href="/get-started" className="primary-button" style={{ textDecoration: 'none', textAlign: 'center', width: '100%' }}>
              Create your hero avatar →
            </a>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', textAlign: 'center', margin: 0 }}>
              Sign up free to save your results and go deeper
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
