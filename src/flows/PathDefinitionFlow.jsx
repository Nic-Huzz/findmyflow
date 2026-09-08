/**
 * PathDefinitionFlow.jsx — /path-definition/:questId
 *
 * Standalone commitment flow for a single quest. Loads quest from DB,
 * guides user through Setup > The Shift > The Commitment, saves back to DB.
 *
 * Screen 0: Setup (precursor + all 8 dimensions current/aspiration)
 * Screen 1: The Shift (life fuels + buts + voice picker + reframe with voice attribution)
 * Screen 2: The Commitment (fear + identity contrast cards + editable identity + smallest step)
 *
 * Follows the Robbins x Dispenza leverage sequence:
 * Voice moves earlier (after buts), identity becomes a reveal (not blank input),
 * smallest step moves to last position.
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { DOME_DIMENSIONS } from '../data/domeDimensions'
import { PRECURSOR_LEVELS, PRECURSOR_DEFAULTS } from '../data/precursorDefaults'
import { ESSENCE_ARCHETYPES } from '../data/essenceArchetypes'
import DomeOfSafety from '../components/DomeOfSafety'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import { getWeekStartLocal } from '../lib/dateUtils'
import './PathDefinitionFlow.css'

const VOICES = [
  { id: 'ghost', emoji: '👻', label: 'Ghost', sub: 'I want to disappear. Hide. Go quiet.' },
  { id: 'perfectionist', emoji: '🎯', label: 'Perfectionist', sub: "It's not good enough yet. I need more time." },
  { id: 'people-pleaser', emoji: '🪞', label: 'People Pleaser', sub: "I'd rather say yes than deal with their reaction." },
  { id: 'controller', emoji: '🧱', label: 'Controller', sub: 'I want to know how this ends before I do it.' },
  { id: 'auto-pilot', emoji: '🤖', label: 'Auto-Pilot', sub: "I'm going through the motions. I've checked out." },
]

const SHIFT_FUELS = [
  { id: 'choice', icon: '🔓', label: 'Choice', full: 'I get to choose how I spend my time' },
  { id: 'connection', icon: '🤝', label: 'Connection', full: 'I connect with people who get me' },
  { id: 'mastery', icon: '📈', label: 'Mastery', full: 'I grow at something that excites me' },
  { id: 'meaning', icon: '✨', label: 'Meaning', full: 'This serves something I care about' },
]

const IDENTITY_EXAMPLES = [
  '...starts before they\'re ready',
  '...chooses courage over comfort',
  '...proves it\'s never too late',
]

export default function PathDefinitionFlow() {
  const { questId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Loading + quest data
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quest, setQuest] = useState(null)

  // Screen navigation
  const [screen, setScreen] = useState(0)

  // Screen 0: Setup
  const [precursor, setPrecursor] = useState(null)
  const [currentDims, setCurrentDims] = useState({})
  const [aspirationDims, setAspirationDims] = useState({})
  const [expandedDim, setExpandedDim] = useState(null)

  // Screen 1: Framing
  const [stayingFuels, setStayingFuels] = useState(new Set())
  const [pathFuels, setPathFuels] = useState(new Set())
  const [buts, setButs] = useState([])
  const [butInput, setButInput] = useState('')
  const [showReframe, setShowReframe] = useState(false)

  // Screen 2: Commitment
  const [stepText, setStepText] = useState('')
  const [fearText, setFearText] = useState('')
  const [identityText, setIdentityText] = useState('')
  const [voice, setVoice] = useState(null)

  // Essence data (for identity reveal)
  const [essenceName, setEssenceName] = useState(null)
  const [essenceSuperpower, setEssenceSuperpower] = useState(null)
  const [essenceVision, setEssenceVision] = useState(null)
  const [essenceLoaded, setEssenceLoaded] = useState(false)

  // Pre-fill identity from essence when entering Screen 2
  const [identityPrefilled, setIdentityPrefilled] = useState(false)

  // Saving
  const [saving, setSaving] = useState(false)

  // Hide bottom toolbar
  useEffect(() => {
    document.body.classList.add('hide-toolbar')
    return () => document.body.classList.remove('hide-toolbar')
  }, [])

  // Load quest from DB
  useEffect(() => {
    if (!user?.id || !questId) return
    setLoading(true)
    setError(null)

    supabase
      .from('quests')
      .select('*')
      .eq('id', questId)
      .eq('user_id', user.id)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('Could not load this path.')
          setLoading(false)
          return
        }
        setQuest(data)
        // Pre-fill if quest already has partial data
        if (data.precursor_level) setPrecursor(data.precursor_level)
        if (data.current_dimensions) setCurrentDims(data.current_dimensions)
        if (data.dream_dimensions) setAspirationDims(data.dream_dimensions)
        if (data.staying_fuels?.length) setStayingFuels(new Set(data.staying_fuels))
        if (data.path_fuels?.length) setPathFuels(new Set(data.path_fuels))
        if (data.buts?.length) {
          setButs(data.buts)
          setShowReframe(true)
        }
        if (data.fear_outcome) setFearText(data.fear_outcome)
        if (data.identity_declaration) setIdentityText(data.identity_declaration)
        if (data.protective_voice) setVoice(data.protective_voice)
        setLoading(false)
      })
  }, [user?.id, questId])

  // Load essence data for identity reveal
  useEffect(() => {
    if (!user?.id) return
    supabase.from('lead_flow_profiles')
      .select('essence_archetype, custom_essence_name, custom_essence_fields')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          const profile = data[0]
          const name = profile.custom_essence_name || profile.essence_archetype
          const fields = profile.custom_essence_fields || {}
          const archetype = ESSENCE_ARCHETYPES.find(a => a.name === name || a.id === name)

          setEssenceName(name || archetype?.name || null)
          setEssenceSuperpower(fields.superpower || archetype?.superpower || null)
          setEssenceVision(fields.vision_in_action || archetype?.vision_in_action || null)
        }
        setEssenceLoaded(true)
      })
  }, [user?.id])

  // Pre-fill identity input from essence superpower when arriving at Screen 2
  useEffect(() => {
    if (screen === 2 && essenceSuperpower && !identityPrefilled && !identityText) {
      setIdentityText(essenceSuperpower)
      setIdentityPrefilled(true)
    }
  }, [screen, essenceSuperpower, identityPrefilled, identityText])

  const goScreen = useCallback((s) => {
    setScreen(s)
    window.scrollTo(0, 0)
  }, [])

  // ── Dimension helpers ──
  const getDimTiers = useCallback((dim) => {
    if (dim.type === 'numeric') {
      return dim.tiers.map((t, i) => ({
        level: i + 1,
        label: dim.id === 'money' ? `$${t.toLocaleString()}` : (t >= 1000 ? `${t / 1000}K` : String(t)),
        description: dim.id === 'people' ? 'people per experience' : dim.id === 'money' ? 'per experience' : null,
      }))
    }
    return dim.levels
  }, [])

  const setCurrentDim = useCallback((dimId, level) => {
    hapticLight()
    setCurrentDims(prev => ({ ...prev, [dimId]: level }))
  }, [])

  const setAspirationDim = useCallback((dimId, level) => {
    hapticLight()
    setAspirationDims(prev => ({ ...prev, [dimId]: level }))
  }, [])

  // ── Save to DB ──
  const saveDefinition = useCallback(async () => {
    if (!user?.id || !questId) return
    setSaving(true)

    try {
      // Update quest with definition data
      await supabase.from('quests').update({
        precursor_level: precursor,
        current_dimensions: currentDims,
        dream_dimensions: aspirationDims,
        staying_fuels: [...stayingFuels],
        path_fuels: [...pathFuels],
        buts,
        fear_outcome: fearText.trim(),
        identity_declaration: identityText.trim(),
        protective_voice: voice,
      }).eq('id', questId)

      // Create courage challenge from smallest step
      const step = stepText.trim()
      if (step) {
        const { data: existingGroan } = await supabase.from('groan_challenges')
          .select('id').eq('user_id', user.id).eq('title', step).limit(1)
        let groanId = existingGroan?.[0]?.id

        if (!groanId) {
          const { data: newGroan } = await supabase.from('groan_challenges').insert({
            user_id: user.id,
            title: step,
            challenge_text: step,
            status: 'active',
            source_type: 'skill',
            challenge_source: 'path_definition',
            source_label: quest.label,
            scary_score: 5,
            wahoo_score: 5,
            visibility_layer: 'screen',
            visibility_layers: [],
            accepted_at: new Date().toISOString(),
            predicted_voice: voice,
          }).select('id').single()

          if (newGroan?.id) {
            groanId = newGroan.id
            try {
              await supabase.from('priority_weekly_picks').upsert({
                user_id: user.id,
                week_start_date: getWeekStartLocal(),
                pick_type: 'groan',
                reference_id: groanId,
                display_name: step,
              }, { onConflict: 'user_id,week_start_date,pick_type,reference_id', ignoreDuplicates: true })
            } catch {}
          }
        }

        if (groanId) {
          const { data: existingTask } = await supabase.from('quest_tasks')
            .select('id').eq('quest_id', questId).eq('text', step).limit(1)
          if (!existingTask?.length) {
            try {
              await supabase.from('quest_tasks').insert({
                quest_id: questId,
                user_id: user.id,
                text: step,
                is_courage_challenge: true,
                groan_challenge_id: groanId,
                sort_order: 0,
              })
            } catch {}
          }
        }
      }

      hapticSuccess()
      setSaving(false)
      setScreen(3) // done
    } catch (err) {
      console.error('Path definition save failed:', err)
      setError('Something went wrong saving. Please try again.')
      setSaving(false)
    }
  }, [user, questId, quest, precursor, currentDims, aspirationDims,
    stayingFuels, pathFuels, buts, stepText, fearText, identityText, voice])

  // ── Loading ──
  if (loading) {
    return <div className="pdf"><div className="pdf-container"><div className="pdf-loading"><div className="pdf-spinner" /></div></div></div>
  }

  if (error || !quest) {
    return (
      <div className="pdf"><div className="pdf-container">
        <div className="pdf-error">
          {error || 'Path not found.'}
          <button onClick={() => navigate('/7-day-challenge?tab=Paths')}>Go to Paths</button>
        </div>
      </div></div>
    )
  }

  // ── SAVING (must be before screen guards) ──
  if (saving) {
    return (
      <div className="pdf"><div className="pdf-container">
        <div className="pdf-saving">
          <div className="pdf-spinner" />
          <div>Saving your path definition...</div>
        </div>
      </div></div>
    )
  }

  // ── SCREEN 0: SETUP ──
  if (screen === 0) {
    const guessLevels = precursor ? PRECURSOR_DEFAULTS[precursor] || {} : {}
    const hasAspiration = Object.keys(aspirationDims).length >= 4

    return (
      <div className="pdf">
        <div className="pdf-container">
          <div className="pdf-progress">Setup</div>
          <div className="pdf-path-name">{quest.label}</div>

          {/* Precursor */}
          <div className="pdf-section">
            <div className="pdf-q">Have you taken any steps on this path already?</div>
            <div className="pdf-precursor">
              {PRECURSOR_LEVELS.map(lvl => (
                <div key={lvl.id}
                  className={`pdf-pre-card ${precursor === lvl.id ? 'selected' : ''}`}
                  onClick={() => {
                    hapticLight()
                    setPrecursor(lvl.id)
                    setCurrentDims(PRECURSOR_DEFAULTS[lvl.id])
                    // Auto-expand first dimension
                    setExpandedDim(DOME_DIMENSIONS[0].id)
                  }}>
                  <div className="pdf-pre-label">{lvl.label}</div>
                  <div className="pdf-pre-desc">{lvl.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* All 8 dimensions — current + aspiration */}
          {precursor && (
            <div className="pdf-section">
              <div className="pdf-q">Where are you now, and where do you want to be?</div>
              <div className="pdf-dims">
                {DOME_DIMENSIONS.map(dim => {
                  const tiers = getDimTiers(dim)
                  const isExpanded = expandedDim === dim.id
                  const curr = currentDims[dim.id]
                  const asp = aspirationDims[dim.id]
                  const guess = guessLevels[dim.id]

                  const currLabel = dim.type === 'numeric'
                    ? tiers.find(t => t.level === curr)?.label
                    : dim.levels?.find(l => l.level === curr)?.label
                  const aspLabel = dim.type === 'numeric'
                    ? tiers.find(t => t.level === asp)?.label
                    : dim.levels?.find(l => l.level === asp)?.label

                  return (
                    <div key={dim.id} className="pdf-dim-card">
                      <div className="pdf-dim-header" onClick={() => setExpandedDim(isExpanded ? null : dim.id)}>
                        <span className="pdf-dim-icon">{dim.icon}</span>
                        <span className="pdf-dim-label">{dim.label}</span>
                        {(curr || asp) && (
                          <span className="pdf-dim-values">
                            {currLabel || '?'} → {aspLabel || '?'}
                          </span>
                        )}
                        <span className="pdf-dim-chevron">{isExpanded ? '▴' : '▾'}</span>
                      </div>

                      {isExpanded && (
                        <div className="pdf-dim-body">
                          <div className="pdf-dim-sub">Where you are now</div>
                          <div className="pdf-tiers">
                            {tiers.map(tier => {
                              const isCurrent = curr === tier.level
                              const isGuess = !curr && guess === tier.level
                              return (
                                <div key={tier.level}
                                  className={`pdf-tier ${isCurrent ? 'current' : ''} ${isGuess ? 'guess' : ''}`}
                                  onClick={() => setCurrentDim(dim.id, tier.level)}>
                                  <div className="pdf-tier-level">{tier.label}</div>
                                  {tier.description && <div className="pdf-tier-desc">{tier.description}</div>}
                                  {isCurrent && <span className="pdf-tier-badge current-badge">You</span>}
                                  {isGuess && !isCurrent && <span className="pdf-tier-badge guess-badge">Our guess</span>}
                                </div>
                              )
                            })}
                          </div>

                          <div className="pdf-dim-sub">{dim.dreamQuestion}</div>
                          <div className="pdf-tiers">
                            {tiers.map(tier => {
                              const isAsp = asp === tier.level
                              return (
                                <div key={tier.level}
                                  className={`pdf-tier ${isAsp ? 'aspiration' : ''}`}
                                  onClick={() => setAspirationDim(dim.id, tier.level)}>
                                  <div className="pdf-tier-level">{tier.label}</div>
                                  {tier.description && <div className="pdf-tier-desc">{tier.description}</div>}
                                  {isAsp && <span className="pdf-tier-badge aspiration-badge">Dream</span>}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Mini radar when enough dimensions set */}
              {hasAspiration && (
                <div className="pdf-radar">
                  <DomeOfSafety
                    domeEdges={currentDims}
                    edgeZone={aspirationDims}
                    gapMetrics={{}}
                    mini
                  />
                  <div className="pdf-radar-legend">
                    <span className="pdf-legend-now">● Now</span>
                    <span className="pdf-legend-dream">● Dream</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pdf-fixed">
            <button className="pdf-cta pdf-cta-gold"
              disabled={!precursor || !hasAspiration}
              onClick={() => goScreen(1)}>
              {!precursor ? 'Pick where you are' : !hasAspiration ? 'Set aspirations for 4+ dimensions' : 'Next →'}
            </button>
            <button className="pdf-cta pdf-cta-secondary" onClick={() => navigate('/7-day-challenge?tab=Paths')}>
              ← Back to paths
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 1: THE SHIFT ──
  if (screen === 1) {
    const bothFuelsPicked = stayingFuels.size > 0 && pathFuels.size > 0
    const canAdvance = bothFuelsPicked && buts.length > 0 && voice && showReframe

    const toggleFuel = (which, fuelId) => {
      hapticLight()
      const setter = which === 'staying' ? setStayingFuels : setPathFuels
      setter(prev => {
        const next = new Set(prev)
        if (next.has(fuelId)) next.delete(fuelId)
        else next.add(fuelId)
        return next
      })
    }

    const stayingLabels = [...stayingFuels].map(id => SHIFT_FUELS.find(f => f.id === id)?.label).filter(Boolean)
    const pathLabels = [...pathFuels].map(id => SHIFT_FUELS.find(f => f.id === id)?.label).filter(Boolean)

    return (
      <div className="pdf">
        <div className="pdf-container">
          <div className="pdf-progress">The Shift</div>
          <div className="pdf-path-name">{quest.label}</div>

          {/* Staying fuels */}
          <div className="pdf-section">
            <div className="pdf-q">What does your current life give you?</div>
            <div className="pdf-fuel-chips">
              {SHIFT_FUELS.map(f => (
                <div key={f.id}
                  className={`pdf-fuel-chip ${stayingFuels.has(f.id) ? 'selected' : ''}`}
                  onClick={() => toggleFuel('staying', f.id)}>
                  <span className="pdf-fuel-icon">{f.icon}</span>
                  <span>{f.full}</span>
                </div>
              ))}
              <div className={`pdf-fuel-chip ${stayingFuels.has('none') ? 'selected' : ''}`}
                onClick={() => {
                  hapticLight()
                  setStayingFuels(prev => prev.has('none') ? new Set() : new Set(['none']))
                }}>
                <span className="pdf-fuel-none">None of the above</span>
              </div>
            </div>
          </div>

          {/* Path fuels */}
          <div className="pdf-section">
            <div className="pdf-q">What does this path give you?</div>
            <div className="pdf-fuel-chips">
              {SHIFT_FUELS.map(f => (
                <div key={f.id}
                  className={`pdf-fuel-chip ${pathFuels.has(f.id) ? 'selected' : ''}`}
                  onClick={() => toggleFuel('path', f.id)}>
                  <span className="pdf-fuel-icon">{f.icon}</span>
                  <span>{f.full}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bridge line */}
          {bothFuelsPicked && (
            <div className="pdf-bridge">
              {stayingFuels.has('none')
                ? 'Your current life doesn\'t give you what you need.'
                : `Your current life gives you ${stayingLabels.join(', ')}.`
              }
              {' '}This path gives you {pathLabels.join(', ')}.
              {' '}So what's in the way?
            </div>
          )}

          {/* Buts */}
          {bothFuelsPicked && (
            <div className="pdf-section">
              <div className="pdf-q">I want to pursue {quest.label}, but...</div>
              <div className="pdf-but-input">
                <input type="text" value={butInput}
                  onChange={e => setButInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && butInput.trim()) {
                      setButs(prev => [...prev, butInput.trim()])
                      setButInput('')
                    }
                  }}
                  placeholder="What's stopping you?" />
                <button disabled={!butInput.trim()} onClick={() => {
                  setButs(prev => [...prev, butInput.trim()])
                  setButInput('')
                }}>Add</button>
              </div>

              {buts.length > 0 && !voice && (
                <div className="pdf-buts-list">
                  {buts.map((b, i) => (
                    <div key={i} className="pdf-but-item">
                      <div className="pdf-but-text">...{b}</div>
                      <span className="pdf-but-remove" onClick={() => setButs(prev => prev.filter((_, j) => j !== i))}>✕</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Voice picker — after buts, before reframe */}
          {buts.length > 0 && (
            <div className="pdf-section">
              <div className="pdf-q">Which voice is saying that?</div>
              <div className="pdf-voices">
                {VOICES.map(v => (
                  <div key={v.id}
                    className={`pdf-voice ${voice === v.id ? 'selected' : ''}`}
                    onClick={() => {
                      hapticLight()
                      setVoice(v.id)
                      if (!showReframe) setShowReframe(true)
                    }}>
                    <div className="pdf-voice-check">✓</div>
                    <div className="pdf-voice-content">
                      <div className="pdf-voice-label">
                        <span className="pdf-voice-emoji">{v.emoji}</span>
                        <span>{v.label}</span>
                      </div>
                      <div className="pdf-voice-sub">{v.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reframe — shows user's actual buts + voice attribution */}
          {showReframe && voice && (
            <div className="pdf-section">
              <div className="pdf-buts-list">
                {buts.map((b, i) => {
                  const voiceName = VOICES.find(v => v.id === voice)?.label || 'voice'
                  return (
                    <div key={i} className="pdf-but-item reframed">
                      <div className="pdf-but-text">
                        "{b}." <span className="pdf-and">That's my {voiceName} talking.</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="pdf-reframe-note">
                Naming the voice turns a feeling into a pattern you can see.
              </div>
            </div>
          )}

          <div className="pdf-fixed">
            <button className="pdf-cta pdf-cta-gold"
              disabled={!canAdvance}
              onClick={() => goScreen(2)}>
              {!bothFuelsPicked ? 'Pick what each gives you' : buts.length === 0 ? 'Add at least one "but"' : !voice ? 'Pick which voice says that' : 'Next →'}
            </button>
            <button className="pdf-cta pdf-cta-secondary" onClick={() => goScreen(0)}>← Back to setup</button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 2: THE COMMITMENT (progressive reveal) ──
  if (screen === 2) {
    const hasEssence = essenceSuperpower && essenceVision && essenceName
    const canSave = fearText.trim() && voice && stepText.trim() && identityText.trim()
    const voiceName = VOICES.find(v => v.id === voice)?.label || 'voice'

    // Identity section shown after fear
    const showIdentity = fearText.trim()
    // Smallest step shown after identity is filled
    const showSmallestStep = showIdentity && identityText.trim()

    const stepQuestion = hasEssence
      ? `What's the first thing the ${essenceName} does this week?`
      : "What's the smallest step this week?"

    return (
      <div className="pdf">
        <div className="pdf-container">
          <div className="pdf-progress">Your commitment</div>
          <div className="pdf-path-name">{quest.label}</div>

          {error && (
            <div className="pdf-error" style={{ marginBottom: 16 }}>
              {error}
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}

          {/* Fear question */}
          <div className="pdf-section">
            {buts.length > 0 && (
              <div className="pdf-all-buts">
                <div className="pdf-all-buts-label">Your blocks:</div>
                {buts.map((b, i) => (
                  <div key={i} className="pdf-all-buts-item">"{b}"</div>
                ))}
              </div>
            )}
            <div className="pdf-q">If your "buts" win and you never do this, what are you most afraid happens?</div>
            <input className="pdf-step-input" type="text"
              value={fearText}
              onChange={e => setFearText(e.target.value)}
              placeholder="What future scares you most?" />
          </div>

          {/* Identity: contrast cards + editable pre-fill (if essence), or fallback text input */}
          {showIdentity && (
            <div className="pdf-section">
              {hasEssence ? (
                <>
                  <div className="pdf-q">Two futures. Which one wins?</div>

                  {/* Card 1: Protective future (push) */}
                  <div className="pdf-future-card pdf-future-protective">
                    <div className="pdf-future-label">When your {voiceName} leads:</div>
                    <div className="pdf-future-quote">"{fearText.trim()}"</div>
                  </div>

                  {/* Card 2: Essence future (pull) */}
                  <div className="pdf-future-card pdf-future-essence">
                    <div className="pdf-future-label">When the {essenceName} leads:</div>
                    <div className="pdf-future-quote">"{essenceSuperpower}"</div>
                    <div className="pdf-future-quote">"{essenceVision}"</div>
                  </div>

                  {/* Identity reveal — read-only with tap to edit */}
                  <div className="pdf-identity-prefill">
                    <div className="pdf-q">I am someone who...</div>
                    <div className="pdf-identity-reveal" onClick={() => {
                      const input = document.querySelector('.pdf-identity-edit')
                      if (input) { input.style.display = 'block'; input.focus() }
                    }}>
                      {identityText || essenceSuperpower}
                    </div>
                    <input className="pdf-step-input pdf-identity-input pdf-identity-edit" type="text"
                      style={{ display: 'none' }}
                      value={identityText}
                      onChange={e => setIdentityText(e.target.value)}
                      onBlur={e => { if (e.target.value.trim()) e.target.style.display = 'none' }}
                      placeholder="...finish this sentence" />
                  </div>
                </>
              ) : essenceLoaded ? (
                <>
                  <div className="pdf-step-quote">
                    Your fear: "{fearText.trim()}"
                  </div>
                  <div className="pdf-essence-cta">
                    <div className="pdf-essence-cta-text">
                      Want to discover the identity that fights your fear?
                    </div>
                    <Link to="/essence-mirror" className="pdf-essence-cta-link">
                      Discover your essence
                    </Link>
                  </div>
                  <div className="pdf-q">I am someone who...</div>
                  <input className="pdf-step-input pdf-identity-input" type="text"
                    value={identityText}
                    onChange={e => setIdentityText(e.target.value)}
                    placeholder="...finish this sentence" />
                  <div className="pdf-identity-examples">
                    {IDENTITY_EXAMPLES.map((ex, i) => (
                      <button key={i} className="pdf-identity-ex" onClick={() => {
                        hapticLight()
                        setIdentityText(ex)
                      }}>{ex}</button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* Smallest step — moved to last */}
          {showSmallestStep && (
            <div className="pdf-section">
              <div className="pdf-q">{stepQuestion}</div>
              <div className="pdf-step-hint">Think really small. Not "build a website". More like "google how to set up a free one".</div>
              <input className="pdf-step-input" type="text"
                value={stepText}
                onChange={e => setStepText(e.target.value)}
                placeholder="The tiniest possible step..." />
            </div>
          )}

          <div className="pdf-fixed">
            <button className="pdf-cta pdf-cta-gold"
              disabled={!canSave || saving}
              onClick={saveDefinition}>
              {saving ? 'Saving...' :
                !fearText.trim() ? 'Name your fear' :
                !identityText.trim() ? 'Claim your identity' :
                !stepText.trim() ? 'Add your first step' :
                'Define this path →'}
            </button>
            <button className="pdf-cta pdf-cta-secondary" onClick={() => goScreen(1)}>← Back to the shift</button>
          </div>
        </div>
      </div>
    )
  }

  // ── DONE ──
  if (screen === 3) {
    return (
      <div className="pdf">
        <div className="pdf-container">
          <div className="pdf-done">
            <div className="pdf-done-check">✓</div>
            <h2>Path defined</h2>
            <p>Your first courage challenge is ready. Head to your paths to start.</p>
            <div className="pdf-fixed">
              <button className="pdf-cta pdf-cta-gold" onClick={() => navigate('/7-day-challenge?tab=Paths')}>
                Go to my paths →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
