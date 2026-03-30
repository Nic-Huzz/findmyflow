/**
 * EssenceMirrorFlow.jsx
 *
 * 9-step essence discovery flow (replaces Shadow Work for Level 1):
 *   1. Hook slides (swipeable, emotional priming)
 *   2-4. Superpower rounds (3 screens of 4 cards, multi-select)
 *   5. Vision confirmation (selected archetypes only, multi-select)
 *   6. Pixar essence pick (top 3-4, single select = primary)
 *   7. AI Mirror reveal (Haiku blends primary + secondary)
 *   8. The Wound (connects to childhood wound stages)
 *   9. Create Hero Avatar (name + save)
 *
 * Route: /shadow-work
 * Created: 2026-03-30
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { ESSENCE_ARCHETYPES, SUPERPOWER_ROUNDS, getArchetype, getArchetypesByIds } from '../data/essenceArchetypes'
import '../styles/flow-base.css'
import './EssenceMirrorFlow.css'

// ─── Hook Slides ────────────────────────────────────────────────────────────

const HOOK_SLIDES = [
  {
    text: 'Our shadows are the parts of us we suppress most.',
    subtext: 'What if I told you our most authentic selves are often our biggest shadows?',
    button: 'Tell me how',
  },
  {
    text: 'Take a moment to think about you as a kid and what you loved to do.',
  },
  {
    text: 'Now how would it have felt if you got teased, made fun or rejected for those things?',
  },
  {
    text: 'Horrible.\nShameful.\nEmbarrassed.',
  },
  {
    text: 'We hate feeling that way so what do we do to protect ourselves?',
    subtext: 'We hide it away.',
  },
  {
    text: 'Heartbreakingly our most authentic parts become our deepest shadows.',
  },
  {
    text: 'Ready to reconnect to that version of you?',
    button: 'Let\'s go',
  },
]

// ─── Steps ──────────────────────────────────────────────────────────────────

const STEPS = {
  HOOK: 'hook',
  ROUND_1: 'round_1',
  ROUND_2: 'round_2',
  ROUND_3: 'round_3',
  VISION: 'vision',
  PIXAR: 'pixar',
  LOADING: 'loading',
  REVEAL: 'reveal',
  WOUND: 'wound',
  AVATAR: 'avatar',
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function EssenceMirrorFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/7-day-challenge'

  // Flow state
  const [step, setStep] = useState(STEPS.HOOK)
  const [hookIndex, setHookIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Selections (archetype IDs)
  const [round1, setRound1] = useState([])
  const [round2, setRound2] = useState([])
  const [round3, setRound3] = useState([])
  const [visionSelections, setVisionSelections] = useState([])
  const [pixarPick, setPixarPick] = useState(null)

  // AI reveal
  const [blendResult, setBlendResult] = useState(null)
  const [blendError, setBlendError] = useState(false)

  // Avatar
  const [heroName, setHeroName] = useState('')
  const [saving, setSaving] = useState(false)

  // Existing user data for AI context
  const [woundStages, setWoundStages] = useState([])
  const [zoneDiagnosis, setZoneDiagnosis] = useState(null)

  // Load user context data
  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      supabase
        .from('journey_onboarding_selections')
        .select('stage_id, scene_id')
        .eq('user_id', user.id),
      supabase
        .from('user_level_progress')
        .select('zone_selected')
        .eq('user_id', user.id)
        .eq('level', 1)
        .maybeSingle(),
    ]).then(([woundRes, zoneRes]) => {
      if (woundRes.data) {
        setWoundStages(woundRes.data.map(w => w.scene_id))
      }
      if (zoneRes.data?.zone_selected) {
        setZoneDiagnosis(zoneRes.data.zone_selected)
      }
    })
  }, [user?.id])

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
    if (hookIndex < HOOK_SLIDES.length - 1) {
      setHookIndex(hookIndex + 1)
    } else {
      goToStep(STEPS.ROUND_1)
    }
  }

  // ─── Scoring ────────────────────────────────────────────────────────────

  const toggleSelection = (list, setList, id) => {
    setList(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const getAllSelected = () => {
    const all = [...round1, ...round2, ...round3]
    return [...new Set(all)]
  }

  const getScores = () => {
    const selected = getAllSelected()
    const scores = {}
    selected.forEach(id => { scores[id] = 1 })
    visionSelections.forEach(id => {
      if (scores[id]) scores[id] = 2
    })
    return scores
  }

  const getTopArchetypes = (count = 4) => {
    const scores = getScores()
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([id]) => id)
  }

  const getSecondary = () => {
    const scores = getScores()
    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
    // Secondary = highest scoring that isn't the pixar pick
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
      goToStep(STEPS.REVEAL)
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
          wound_stages: woundStages,
          zone_diagnosis: zoneDiagnosis,
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
      setHeroName(data.blended_name || `The ${primary.name.split(' ').pop()}`)
    } catch (err) {
      console.warn('Blend API error:', err)
      // Fallback: use primary data directly
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
      setHeroName(primary.name)
    }

    goToStep(STEPS.REVEAL)
  }

  // ─── Save ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!user?.id) return
    setSaving(true)

    try {
      // Save essence profile
      const secondaryId = getSecondary()
      await supabase.from('essence_profiles').upsert({
        user_id: user.id,
        primary_archetype: pixarPick,
        secondary_archetype: secondaryId,
        archetype_scores: getScores(),
        blended_name: heroName,
        blended_narrative: blendResult?.blended_essence,
        blended_superpower: blendResult?.blended_superpower,
        blended_wound: blendResult?.blended_wound,
        question_responses: { round1, round2, round3, visionSelections, pixarPick },
        wound_stages_at_time: woundStages,
        zone_at_time: zoneDiagnosis,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      // Update user_stage_progress with essence archetype
      const primary = getArchetype(pixarPick)
      await supabase.from('user_stage_progress').upsert({
        user_id: user.id,
        essence_name: heroName,
        essence_archetype: primary?.name,
        vision_in_action: blendResult?.blended_essence || primary?.poetic_line,
      }, { onConflict: 'user_id' })
    } catch (err) {
      console.warn('Save error:', err)
    }

    setSaving(false)
    navigate(returnTo)
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className={`em-flow flow-base ${isTransitioning ? 'transitioning' : ''}`}>

      {/* ── Hook Slides ── */}
      {step === STEPS.HOOK && (
        <div className="em-hook" onClick={HOOK_SLIDES[hookIndex].button ? undefined : handleHookTap}>
          <div className="em-hook-text">{HOOK_SLIDES[hookIndex].text}</div>
          {HOOK_SLIDES[hookIndex].subtext && (
            <div className="em-hook-subtext">{HOOK_SLIDES[hookIndex].subtext}</div>
          )}
          {HOOK_SLIDES[hookIndex].button ? (
            <button className="em-hook-btn" onClick={handleHookTap}>
              {HOOK_SLIDES[hookIndex].button} <span>→</span>
            </button>
          ) : (
            <div className="em-hook-tap">TAP TO CONTINUE</div>
          )}
          <div className="em-hook-dots">
            {HOOK_SLIDES.map((_, i) => (
              <div key={i} className={`em-hook-dot ${i === hookIndex ? 'active' : ''}`} />
            ))}
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

        return (
          <div key={roundStep} className="em-step">
            <div className="em-step-header">
              <div className="em-step-round">Round {roundIndex + 1} of 3</div>
              <h1 className="em-step-title">Do any of these sound like you?</h1>
              <p className="em-step-subtitle">Tap all that resonate.</p>
            </div>

            <div className="em-cards">
              {roundIds.map(id => {
                const arch = getArchetype(id)
                const isSelected = selections.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    className={`em-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSelection(selections, setSelections, id)}
                  >
                    <div className="em-card-text">{arch.superpower}</div>
                    {isSelected && <div className="em-card-check">&#10003;</div>}
                  </button>
                )
              })}
            </div>

            <button
              className="em-next-btn"
              onClick={() => goToStep(nextStep)}
            >
              {selections.length === 0 ? 'None of these' : 'Continue'} <span>→</span>
            </button>

            <button className="em-back-btn" onClick={() => goToStep(prevStep)}>
              ← Back
            </button>
          </div>
        )
      })}

      {/* ── Vision Confirmation ── */}
      {step === STEPS.VISION && (
        <div className="em-step">
          <div className="em-step-header">
            <div className="em-step-badge">Confirmation</div>
            <h1 className="em-step-title">Which of these futures excites you most?</h1>
            <p className="em-step-subtitle">You resonated with these. Which visions make something inside you say yes?</p>
          </div>

          <div className="em-cards">
            {getAllSelected().map(id => {
              const arch = getArchetype(id)
              const isSelected = visionSelections.includes(id)
              return (
                <button
                  key={id}
                  type="button"
                  className={`em-vision-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleSelection(visionSelections, setVisionSelections, id)}
                >
                  <div className="em-vision-name">{arch.name}</div>
                  <div className="em-vision-text">{arch.poetic_vision}</div>
                  {isSelected && <div className="em-card-check">&#10003;</div>}
                </button>
              )
            })}
          </div>

          <button
            className="em-next-btn"
            onClick={() => goToStep(STEPS.PIXAR)}
          >
            {visionSelections.length === 0 ? 'None of these' : 'Continue'} <span>→</span>
          </button>

          <button className="em-back-btn" onClick={() => goToStep(STEPS.ROUND_3)}>
            ← Back
          </button>
        </div>
      )}

      {/* ── Pixar Essence Pick ── */}
      {step === STEPS.PIXAR && (
        <div className="em-step">
          <div className="em-step-header">
            <div className="em-step-badge">Your Essence</div>
            <h1 className="em-step-title">This is who you are</h1>
            <p className="em-step-subtitle">Which one makes something inside you say yes?</p>
          </div>

          <div className="em-pixar-cards">
            {getTopArchetypes(4).map(id => {
              const arch = getArchetype(id)
              const isSelected = pixarPick === id
              return (
                <button
                  key={id}
                  type="button"
                  className={`em-pixar-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setPixarPick(id)}
                >
                  <img
                    className="em-pixar-image"
                    src={arch.image}
                    alt={arch.name}
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                  <div className="em-pixar-body">
                    <div className="em-pixar-name">{arch.name}</div>
                    <div className="em-pixar-essence">{arch.poetic_line}</div>
                  </div>
                  {isSelected && <div className="em-pixar-check">&#10003;</div>}
                </button>
              )
            })}
          </div>

          <button
            className="em-next-btn"
            onClick={runBlend}
            disabled={!pixarPick}
          >
            {!pixarPick ? 'Pick your essence' : 'Reveal my mirror'} <span>→</span>
          </button>

          <button className="em-back-btn" onClick={() => goToStep(STEPS.VISION)}>
            ← Back
          </button>
        </div>
      )}

      {/* ── Loading ── */}
      {step === STEPS.LOADING && (
        <div className="em-step em-reveal-loading">
          <div className="em-reveal-spinner" />
          <div className="em-reveal-loading-text">Finding your mirror...</div>
        </div>
      )}

      {/* ── AI Mirror Reveal ── */}
      {step === STEPS.REVEAL && blendResult && (
        <div className="em-step em-reveal">
          <div className="em-reveal-icon">&#10024;</div>
          <h1 className="em-reveal-name">{blendResult.blended_name}</h1>
          <div className="em-reveal-archetypes">
            {blendResult.primaryName} + {blendResult.secondaryName}
          </div>

          <div className="em-reveal-section">
            <div className="em-reveal-label">Your Essence</div>
            <div className="em-reveal-text">{blendResult.blended_essence}</div>
          </div>

          <div className="em-reveal-section">
            <div className="em-reveal-label">Your Superpower</div>
            <div className="em-reveal-text">{blendResult.blended_superpower}</div>
          </div>

          <div className="em-reveal-section">
            <div className="em-reveal-label">Your Vision</div>
            <div className="em-reveal-text">{blendResult.blended_vision}</div>
          </div>

          <button className="em-next-btn" onClick={() => goToStep(STEPS.WOUND)}>
            Show me why I hid this <span>→</span>
          </button>
        </div>
      )}

      {/* ── The Wound ── */}
      {step === STEPS.WOUND && blendResult && (
        <div className="em-step em-wound">
          <div className="em-reveal-icon">&#128148;</div>
          <h1 className="em-step-title">The wound that hid your essence</h1>

          <div className="em-wound-quote">
            "{blendResult.blended_wound}"
          </div>

          <div className="em-wound-explanation">
            And so you learned to suppress the very thing that makes you powerful.
          </div>

          {zoneDiagnosis && zoneDiagnosis !== 'diagonal' && (
            <div className="em-wound-zone">
              <div className="em-wound-zone-text">
                This is why you're in the <strong>{
                  zoneDiagnosis === 'topLeft' ? 'Outcast Zone' : 'Chameleon Zone'
                }</strong>. Your essence was suppressed, and a protective voice stepped in to keep you safe.
              </div>
            </div>
          )}

          <button className="em-next-btn" onClick={() => goToStep(STEPS.AVATAR)}>
            Reclaim my essence <span>→</span>
          </button>
        </div>
      )}

      {/* ── Create Hero Avatar ── */}
      {step === STEPS.AVATAR && (
        <div className="em-step em-avatar">
          <div className="em-reveal-icon">&#128081;</div>
          <h1 className="em-step-title">Name your essence</h1>
          <p className="em-step-subtitle">
            This becomes your hero identity. You can customize it.
          </p>

          <input
            className="em-avatar-name-input"
            type="text"
            value={heroName}
            onChange={(e) => setHeroName(e.target.value)}
            placeholder="Your essence name"
            maxLength={40}
          />
          <div className="em-avatar-hint">
            Pre-filled with your blended name. Edit it to make it yours.
          </div>

          <button
            className="em-next-btn"
            onClick={handleSave}
            disabled={saving || !heroName.trim()}
          >
            {saving ? 'Saving...' : 'This is me'} <span>→</span>
          </button>
        </div>
      )}
    </div>
  )
}
