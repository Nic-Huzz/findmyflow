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
    text: 'What if I told you our most authentic selves are often our biggest shadows?',
    button: 'Tell me how',
  },
  {
    text: 'Take a moment to think about you as a kid and what you loved to do.',
  },
  {
    text: 'Now how would it have felt if you got teased, made fun of, or rejected for those things?',
  },
  {
    text: 'Horrible.\nShameful.\nEmbarrassed.',
  },
  {
    text: 'We hate feeling that way, so what do we do to protect ourselves?',
    subtext: 'We hide it away.',
  },
  {
    text: 'Heartbreakingly, our most authentic parts become our deepest shadows.',
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
  const [hookTransitioning, setHookTransitioning] = useState(false)
  const [hookEntering, setHookEntering] = useState(true)

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

      // Update lead_flow_profiles so /me hero section picks it up
      await supabase.from('lead_flow_profiles').upsert({
        user_id: user.id,
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
            {HOOK_SLIDES[hookIndex].button && (
              <button className="em-hook-btn" onClick={(e) => { e.stopPropagation(); handleHookTap() }}>
                {HOOK_SLIDES[hookIndex].button} <span>→</span>
              </button>
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

        return (
          <div key={roundStep} className="em-step">
            <div className="em-step-header">
              <div className="em-step-round">Round {roundIndex + 1} of 3</div>
              <h1 className="em-step-title">Do any of these sound like you?</h1>
              <p className="em-step-subtitle">Tap all that resonate.</p>
            </div>

            <div className="em-options">
              {roundIds.map(id => {
                const arch = getArchetype(id)
                const isSelected = selections.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    className={`option-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSelection(selections, setSelections, id)}
                  >
                    {(() => {
                      const firstDot = arch.superpower.indexOf('.')
                      if (firstDot === -1) return <strong>{ARCHETYPE_EMOJI[id]} {arch.superpower}</strong>
                      const first = arch.superpower.slice(0, firstDot + 1)
                      const rest = arch.superpower.slice(firstDot + 1).trim()
                      return <>
                        <strong>{ARCHETYPE_EMOJI[id]} {first}</strong>
                        {rest && <div style={{ marginTop: '0.5rem' }}>{rest}</div>}
                      </>
                    })()}
                  </button>
                )
              })}
            </div>

            <div className="nav-buttons" style={{ flexDirection: 'column', gap: '8px' }}>
              <button
                className="primary-button"
                onClick={() => goToStep(nextStep)}
              >
                {selections.length === 0 ? 'None of these' : 'Continue'} →
              </button>
              <button className="secondary-button" onClick={() => goToStep(prevStep)}>
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
            <p className="em-step-subtitle">You resonated with these. Which visions make something inside you say yes?</p>
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
                  <img
                    className="em-scene-image"
                    src={arch.visionImage || arch.image}
                    alt={arch.name}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                  <div className="em-scene-pill">
                    <div className="em-scene-name">{ARCHETYPE_EMOJI[id]} {arch.name}</div>
                    <div className="em-scene-desc">{arch.poetic_vision}</div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="nav-buttons" style={{ flexDirection: 'column', gap: '8px' }}>
            <button
              className="primary-button"
              onClick={() => goToStep(STEPS.PIXAR)}
            >
              {visionSelections.length === 0 ? 'None of these' : 'Continue'} →
            </button>
            <button className="secondary-button" onClick={() => goToStep(STEPS.ROUND_3)}>
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

          <div className="nav-buttons" style={{ flexDirection: 'column', gap: '8px' }}>
            <button
              className="primary-button"
              onClick={runBlend}
              disabled={!pixarPick}
            >
              {!pixarPick ? 'Pick your essence' : 'Reveal my mirror'} →
            </button>
            <button className="secondary-button" onClick={() => goToStep(STEPS.VISION)}>
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

          <button className="primary-button" onClick={() => goToStep(STEPS.AVATAR)}>
            Reclaim my essence →
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
                        try {
                          const reader = new FileReader()
                          reader.onload = async () => {
                            const base64 = reader.result.split(',')[1]
                            const primary = getArchetype(pixarPick)
                            const prompt = `Transform this photo into a high-quality 3D animated movie character portrait. Keep the person's likeness, features, and energy but render them as a modern animated film character with big expressive eyes, warm cinematic lighting, and purple and gold tones. Their archetype essence is "${primary?.name}": ${primary?.poetic_line}. Their superpower: ${primary?.superpower}. Make them look heroic but approachable. Warm golden ambient light, purple background elements. Square portrait composition.`

                            const { data, error } = await supabase.functions.invoke('generate-avatar-gemini', {
                              body: {
                                photo_base64: base64,
                                photo_mime: avatarPhoto.type,
                                prompt,
                              },
                            })

                            if (error || data?.error) {
                              setAvatarError(data?.message || 'Generation failed. Try a different photo.')
                              setAvatarGenerating(false)
                              return
                            }

                            setAvatarGenerated(data.url)
                            setAvatarGenerating(false)
                          }
                          reader.readAsDataURL(avatarPhoto)
                        } catch (err) {
                          console.warn('Avatar generation error:', err)
                          setAvatarError('Something went wrong. Try again.')
                          setAvatarGenerating(false)
                        }
                      }}
                      disabled={avatarGenerating}
                    >
                      {avatarGenerating ? 'Creating your avatar...' : 'Generate my avatar'} →
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
                  style={{ marginTop: '1.5rem' }}
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
                style={{ marginTop: '0.5rem' }}
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
                value={heroName}
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
