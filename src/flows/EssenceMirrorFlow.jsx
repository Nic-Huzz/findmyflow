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

// Emoji per archetype for card display
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
import '../styles/flow-base.css'
import './EssenceMirrorFlow.css'

// ─── Hook Slides ────────────────────────────────────────────────────────────

const HOOK_SLIDES = [
  {
    text: 'What if I told you our most authentic selves are often who we hide away the most?',
    button: 'Tell me how',
  },
  {
    text: 'Take a moment to think about you as a kid and all the weird and random things you loved.',
  },
  {
    text: 'Imagine getting teased, made fun of or rejected for these things...',
  },
  {
    text: 'How would you have felt?',
    subtext: 'Embarrassed, ashamed, sad.',
  },
  {
    text: 'We hate feeling that way, so what do we do to protect ourselves?',
    subtext: 'We hide it away.',
  },
  {
    text: 'Heartbreakingly, our most authentic parts no longer feel safe to be seen.',
  },
  {
    text: 'Ready to reconnect to that version of you and share it with the world?',
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
  AVATAR: 'avatar',
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function EssenceMirrorFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/me'

  // Returning user detection
  const [isReturningUser, setIsReturningUser] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('user_stage_progress')
      .select('persona, onboarding_completed, onboarding_v2_completed, essence_archetype')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data && !data.essence_archetype && (data.persona || data.onboarding_completed || data.onboarding_v2_completed)) {
          setIsReturningUser(true)
        }
      })
  }, [user?.id])

  // Flow state
  const [step, setStep] = useState(STEPS.HOOK)
  const [hookIndex, setHookIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [hookTransitioning, setHookTransitioning] = useState(false)
  const [hookEntering, setHookEntering] = useState(true)

  // Selections (archetype IDs)
  const [round1, setRound1] = useState([])
  const [round2, setRound2] = useState([])
  const [round3, setRound3] = useState([])
  const [swipeIndex, setSwipeIndex] = useState(0) // which card within a round
  const swipeTouchStartX = useRef(0)
  const swipeTouchEndX = useRef(0)
  const [visionSelections, setVisionSelections] = useState([])
  const [pixarPick, setPixarPick] = useState(null)

  // AI reveal
  const [blendResult, setBlendResult] = useState(null)
  const [blendError, setBlendError] = useState(false)

  // Avatar
  const [heroName, setHeroName] = useState('')
  const [avatarLoadingText, setAvatarLoadingText] = useState('')
  const [saving, setSaving] = useState(false)
  const [avatarPhoto, setAvatarPhoto] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarGenerated, setAvatarGenerated] = useState(null)
  const [avatarGenerating, setAvatarGenerating] = useState(false)
  const [avatarError, setAvatarError] = useState(null)
  const fileInputRef = useRef(null)

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
        .eq('current_level', 1)
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
      setHeroName(data.blended_name || primary.name || '')
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
        onboarding_completed: true,
        onboarding_v2_completed: true,
        essence_mirror_completed: true,
        current_journey_level: 0,
      }, { onConflict: 'user_id' })

      // Award XP for completing hero avatar
      const { data: existingHero } = await supabase.from('quest_completions')
        .select('id').eq('user_id', user.id).eq('quest_id', 'hero_avatar').maybeSingle()
      if (!existingHero) {
        await supabase.from('quest_completions').insert({
          user_id: user.id,
          quest_id: 'hero_avatar',
          quest_category: 'Groans',
          quest_type: 'Rewire',
          points_earned: 10,
          challenge_day: 0,
        }).catch(() => {})
      }

      // Update lead_flow_profiles so /me hero section picks it up
      // Try update by user_id first, then by email, then insert
      const essenceData = {
        essence_archetype: primary?.name,
        custom_essence_name: heroName,
        custom_essence_image: avatarGenerated !== 'skip' ? avatarGenerated : null,
        custom_essence_fields: {
          tagline: blendResult?.blended_essence || primary?.essence,
          essence: blendResult?.blended_essence || primary?.poetic_line,
          superpower: blendResult?.blended_superpower || primary?.superpower,
          vision: blendResult?.blended_vision || primary?.poetic_vision,
          north_star: primary?.north_star,
          wound: blendResult?.blended_wound || primary?.essence_wound,
          energetic_transmission: primary?.energetic_transmission,
          recognition_pattern: primary?.recognition_pattern,
          vision_in_action: primary?.vision_in_action,
          inner_child: primary?.inner_child_desire,
          characters: primary?.characters?.join(', '),
        },
      }
      // Save to lead_flow_profiles — always insert a new row.
      // Read side uses order(created_at desc).limit(1) so latest row wins.
      const { error: profileErr } = await supabase
        .from('lead_flow_profiles')
        .insert({ ...essenceData, user_id: user.id, email: user.email })
      if (profileErr) console.error('lead_flow_profiles insert error:', profileErr)
      // Auto-create a Discovery Project so /7-day-challenge doesn't show empty state
      const { data: existingProject } = await supabase
        .from('user_projects')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle()
      if (!existingProject) {
        await supabase.from('user_projects').insert({
          user_id: user.id,
          name: 'Discovery Project',
          description: 'Your flow discovery journey.',
          source_flow: 'essence_mirror',
          status: 'active',
          current_stage: 0,
          total_points: 0,
          is_primary: true,
        }).catch(err => console.error('Auto-create project error:', err))
      }

      console.log('Essence Mirror save complete:', { heroName, avatarGenerated: avatarGenerated !== 'skip' ? 'yes' : 'skipped' })
    } catch (err) {
      console.error('Essence Mirror save error:', err)
    }

    setSaving(false)
    navigate(returnTo)
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
            {isReturningUser && hookIndex === 0 ? (
              <>
                <div className="em-hook-text">Welcome Back</div>
                <div className="em-hook-subtext">We've built something new for you. Let's discover your essence, it only takes a few minutes.</div>
              </>
            ) : (
              <>
                <div className="em-hook-text">{HOOK_SLIDES[hookIndex].text}</div>
                {HOOK_SLIDES[hookIndex].subtext && (
                  <div className="em-hook-subtext">{HOOK_SLIDES[hookIndex].subtext}</div>
                )}
              </>
            )}
          </div>
          <div className="em-hook-bottom">
            {(isReturningUser && hookIndex === 0) ? (
              <button className="em-hook-btn" onClick={(e) => { e.stopPropagation(); handleHookTap() }}>
                Let's go <span>→</span>
              </button>
            ) : HOOK_SLIDES[hookIndex].button ? (
              <button className="em-hook-btn" onClick={(e) => { e.stopPropagation(); handleHookTap() }}>
                {HOOK_SLIDES[hookIndex].button} <span>→</span>
              </button>
            ) : (
              <div className="em-hook-tap-hint">Tap anywhere to continue</div>
            )}
          </div>
        </div>
      )}

      {/* ── Superpower Rounds 1-3 (swipeable cards) ── */}
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
          if (isLast) {
            setSwipeIndex(0)
            goToStep(nextStep)
          } else {
            setSwipeIndex(swipeIndex + 1)
          }
        }

        const goBackSwipe = () => {
          if (swipeIndex > 0) {
            setSwipeIndex(swipeIndex - 1)
          } else if (roundIndex > 0) {
            setSwipeIndex(3)
            goToStep(prevStep)
          } else {
            goToStep(STEPS.HOOK)
          }
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
            {/* Progress dots for all 12 */}
            <div className="em-swipe-dots">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={`em-swipe-dot ${i === globalIndex ? 'active' : i < globalIndex ? 'done' : ''}`} />
              ))}
            </div>

            <div className="em-step-header">
              <p className="em-step-subtitle">Does this sound like you?</p>
            </div>

            {/* Swipeable card - centered */}
            <div className="em-swipe-middle">
              <div
                className={`em-swipe-card ${isSelected ? 'selected' : ''}`}
                key={currentId}
              >
                {currentArch.swipeImage && (
                  <img
                    className="em-swipe-image"
                    src={currentArch.swipeImage}
                    alt={currentArch.name}
                    draggable={false}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                )}
                {!currentArch.swipeImage && <div className="em-swipe-emoji">{ARCHETYPE_EMOJI[currentId]}</div>}
                <div className="em-swipe-text">
                  {currentArch.superpower.split(/(?<=[.?!])\s+/).map((s, i) => (
                    <p key={i}>{s}</p>
                  ))}
                </div>
                {isSelected && <div className="em-swipe-check">&#10003;</div>}
              </div>
            </div>

            {/* Buttons pinned to bottom */}
            <div className="em-swipe-bottom">
              <div className="em-swipe-actions">
                <button
                  className="em-swipe-btn no"
                  onClick={advanceSwipe}
                >
                  Not me
                </button>
                <button
                  className="em-swipe-btn yes"
                  onClick={() => {
                    if (!isSelected) toggleSelection(selections, setSelections, currentId)
                    advanceSwipe()
                  }}
                >
                  That's me
                </button>
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
            <p className="em-step-subtitle">Tap all that resonate. You can pick multiple.</p>
          </div>

          <div className="em-scene-cards">
            {getAllSelected().map((id, i) => {
              const arch = getArchetype(id)
              const isSelected = visionSelections.includes(id)
              return (
                <button
                  key={id}
                  type="button"
                  className={`em-scene-card ${isSelected ? 'em-scene-selected' : ''}`}
                  onClick={() => toggleSelection(visionSelections, setVisionSelections, id)}
                  style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                >
                  {isSelected && <div className="em-scene-check">&#10003;</div>}
                  <img
                    className="em-scene-image"
                    src={arch.visionImage || arch.image}
                    alt={arch.name}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
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
            <button
              className="primary-button"
              onClick={() => goToStep(STEPS.PIXAR)}
              style={{ width: '100%' }}
            >
              {visionSelections.length === 0 ? 'None of these' : 'Continue'} →
            </button>
            <button className="secondary-button" onClick={() => goToStep(STEPS.ROUND_3)} style={{ width: '100%' }}>
              ← Back
            </button>
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

          <div className="nav-buttons" style={{ flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '400px', margin: '24px auto 0' }}>
            <button
              className="primary-button"
              onClick={runBlend}
              disabled={!pixarPick}
              style={{ width: '100%' }}
            >
              {!pixarPick ? 'Pick your essence' : 'Reveal my mirror'} →
            </button>
            <button className="secondary-button" onClick={() => goToStep(STEPS.VISION)} style={{ width: '100%' }}>
              ← Back
            </button>
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
              {blendResult.blended_essence?.replace(/[—;]/g, ',').split(/(?<=[.?!])\s+/).map((s, i) => (
                <p key={i}>{s}</p>
              ))}
            </div>
          </div>

          <div className="em-reveal-card">
            <div className="em-reveal-label">Your Superpower</div>
            <div className="em-reveal-text">
              {blendResult.blended_superpower?.replace(/[—;]/g, ',').split(/(?<=[.?!])\s+/).map((s, i) => (
                <p key={i}>{s}</p>
              ))}
            </div>
          </div>

          <div className="em-reveal-card">
            <div className="em-reveal-label">Your Vision</div>
            <div className="em-reveal-text">
              {blendResult.blended_vision?.replace(/[—;]/g, ',').split(/(?<=[.?!])\s+/).map((s, i) => (
                <p key={i}>{s}</p>
              ))}
            </div>
          </div>

          <button className="primary-button" onClick={() => goToStep(STEPS.AVATAR)}>
            This is me →
          </button>
        </div>
      )}

      {/* ── Create Hero Avatar ── */}
      {step === STEPS.AVATAR && (
        <div className="em-step em-avatar">
          {!avatarGenerated ? (
            <>
              <div className="em-reveal-icon">&#128247;</div>
              <h1 className="em-step-title">Create your hero avatar</h1>
              <p className="em-step-subtitle">
                Upload a photo that captures your essence. Ideally one of you doing what you love.
              </p>

              {avatarPreview ? (
                <div className="em-avatar-preview-container">
                  <img src={avatarPreview} alt="Your photo" className="em-avatar-preview" />
                  <div className="em-avatar-preview-actions">
                    <button
                      className="primary-button"
                      onClick={async () => {
                        setAvatarGenerating(true)
                        setAvatarError(null)
                        const loadingMessages = [
                          'Analyzing your photo...',
                          'Finding your essence...',
                          'Mapping your likeness...',
                          'Crafting your avatar...',
                          'Building your scene...',
                          'Adding the magic...',
                          'Refining the details...',
                          'Bringing it to life...',
                          'Polishing the colours...',
                          'Nearly there...',
                          'Just a few more seconds...',
                          'Worth the wait, promise...',
                        ]
                        let msgIndex = 0
                        setAvatarLoadingText(loadingMessages[0])
                        const loadingInterval = setInterval(() => {
                          msgIndex = (msgIndex + 1) % loadingMessages.length
                          setAvatarLoadingText(loadingMessages[msgIndex])
                        }, 3000)
                        try {
                          const reader = new FileReader()
                          reader.onload = async () => {
                            const base64 = reader.result.split(',')[1]
                            const primary = getArchetype(pixarPick)
                            const secondary = getArchetype(getSecondary())
                            const prompt = `Transform this person into a high-quality 3D animated movie character. Use ONLY their face and facial features as reference for likeness. Create a completely new heroic scene around them based on their archetype essence.

Their essence: "${primary?.name}" - ${primary?.poetic_line}
Their superpower: ${primary?.superpower}
Their vision: ${primary?.poetic_vision}

Create a dynamic pose and scene background that embodies this essence. The character should be in action or in their element, not just standing. Use warm cinematic lighting with purple and gold tones. Big expressive animated eyes. Heroic but approachable. Modern 3D animated feature film quality. Square composition.`

                            const { data, error } = await supabase.functions.invoke('generate-avatar-gemini', {
                              body: {
                                photo_base64: base64,
                                photo_mime: avatarPhoto.type,
                                prompt,
                              },
                            })

                            if (error || data?.error) {
                              clearInterval(loadingInterval)
                              setAvatarError(data?.message || 'Generation failed. Try a different photo.')
                              setAvatarGenerating(false)
                              return
                            }

                            clearInterval(loadingInterval)
                            setAvatarGenerated(data.url)
                            setAvatarGenerating(false)
                          }
                          reader.readAsDataURL(avatarPhoto)
                        } catch (err) {
                          clearInterval(loadingInterval)
                          console.warn('Avatar generation error:', err)
                          setAvatarError('Something went wrong. Try again.')
                          setAvatarGenerating(false)
                        }
                      }}
                      disabled={avatarGenerating}
                    >
                      {avatarGenerating ? avatarLoadingText : 'Generate my avatar →'}
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => { setAvatarPreview(null); setAvatarPhoto(null) }}
                      disabled={avatarGenerating}
                    >
                      Choose different photo
                    </button>
                  </div>
                  {avatarError && <p className="em-avatar-error">{avatarError}</p>}
                </div>
              ) : (
                <button
                  className="primary-button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ marginTop: '1.5rem', width: '100%', maxWidth: '400px' }}
                >
                  Upload photo →
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setAvatarPhoto(file)
                    setAvatarPreview(URL.createObjectURL(file))
                  }
                }}
                style={{ display: 'none' }}
              />

              <button
                className="secondary-button"
                onClick={() => setAvatarGenerated('skip')}
                style={{ marginTop: '1rem', width: '100%', maxWidth: '400px' }}
              >
                Skip for now
              </button>
            </>
          ) : (
            <>
              <div className="em-reveal-icon">&#128081;</div>
              {avatarGenerated !== 'skip' && (
                <img src={avatarGenerated} alt="Your hero avatar" className="em-avatar-result" />
              )}
              <h1 className="em-step-title">Name your essence</h1>
              <p className="em-step-subtitle">
                This becomes your hero identity on your profile.
              </p>

              <input
                className="em-avatar-name-input"
                type="text"
                value={heroName || ''}
                onChange={(e) => setHeroName(e.target.value)}
                placeholder="Your essence name"
                maxLength={40}
              />
              <div className="em-avatar-hint">
                Pre-filled with your blended name. Edit it to make it yours.
              </div>

              <button
                className="primary-button"
                onClick={handleSave}
                disabled={saving || !heroName.trim()}
              >
                {saving ? 'Saving...' : 'This is me'} →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
