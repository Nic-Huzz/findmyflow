/**
 * CurrentJobFlow — /add-current-job
 *
 * Steps:
 *   1. name_fuel: Name your job + which life fuels it gives you
 *   2. reveal: Pain reveal (what's missing)
 *   3. fork: Pursue this path or find something new?
 *   YES path:
 *     4a. experiences: Pick dome experiences involved in this job
 *     4b. dimensions: Set current + dream dimensions (real dome tiers)
 *   NO path:
 *     4c. no_summary: Fuel summary + CTAs to /choose-quests or /7-day-challenge
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useDomeData } from '../hooks/useDomeData'
import { getAllDomeExperiences, groupByPrimal } from '../lib/domeSummary'
import { LIFE_FUEL_CHANNELS, CHANNEL_IDS } from '../data/channelMapping'
import { DOME_DIMENSIONS } from '../data/domeDimensions'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './CurrentJobFlow.css'

const NS_EMOJI = { vibe_rise: '🔥', fun: '😊', pressure: '😰', growth_edge: '😰', bored: '😐', uninterested: '😐' }

// Current job framing for each dimension
const CURRENT_QUESTIONS = {
  people: 'How many people do you serve?',
  money: 'How much do you earn per month or per experience?',
  vulnerability: 'How visible are you in your work?',
  stakes: 'What\'s at risk in your current role?',
  rarity: 'How common is what you do?',
  identity: 'How much does this work feel like you?',
  context: 'How familiar is your work environment?',
  business_commitment: 'How deep are you in building this?',
}

const DREAM_QUESTIONS = {
  people: 'How many people would you want to serve?',
  money: 'How much would you want to earn per month or per experience?',
  vulnerability: 'How visible would you need to be?',
  stakes: 'What would you need to put on the line?',
  rarity: 'How original would this need to be?',
  identity: 'How different from your current self would this be?',
  context: 'How unfamiliar would the conditions be?',
  business_commitment: 'How far would you need to build this?',
}

function getDimTiers(dim) {
  if (dim.type === 'numeric') {
    const prefix = dim.inputType === 'money' ? '$' : ''
    return dim.tiers.map((t, i) => ({
      value: i + 1,
      label: `${prefix}${t >= 1000 ? `${t / 1000}K` : t}`,
    }))
  }
  return dim.levels.map(l => ({ value: l.level, label: l.label }))
}

export default function CurrentJobFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { domeStates, loading: domeLoading } = useDomeData(user?.id)

  const [step, setStep] = useState('name_fuel')
  const [jobTitle, setJobTitle] = useState('')
  const [lifeFuel, setLifeFuel] = useState({ choice: false, connection: false, mastery: false, meaning: false })
  const [saving, setSaving] = useState(false)
  const [savedQuestId, setSavedQuestId] = useState(null)

  // YES path
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [search, setSearch] = useState('')
  const [currentDimensions, setCurrentDimensions] = useState({})
  const [dreamDimensions, setDreamDimensions] = useState({})
  const [dimStep, setDimStep] = useState('current') // 'current' | 'dream_intro' | 'dream'
  const [dreamTitle, setDreamTitle] = useState('')

  // NO path (all fuels auto-selected)
  const [idealFuel, setIdealFuel] = useState({ choice: true, connection: true, mastery: true, meaning: true })

  useEffect(() => {
    document.body.classList.add('hide-toolbar')
    return () => document.body.classList.remove('hide-toolbar')
  }, [])

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [step, dimStep])

  // Dome experiences (only needed for YES path)
  const allExps = domeLoading ? null : getAllDomeExperiences(domeStates)
  const allItems = allExps ? [...allExps.vibeRise, ...allExps.fun, ...allExps.stressed, ...allExps.bored] : []

  const toggleExp = (id) => {
    hapticLight()
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Pain data
  const hasFuels = CHANNEL_IDS.filter(id => lifeFuel[id])
  const missingFuels = CHANNEL_IDS.filter(id => !lifeFuel[id])

  // Save initial quest (name + fuels only)
  const handleSaveNameFuel = async () => {
    if (saving || !jobTitle.trim()) return
    setSaving(true)
    try {
      const { data } = await supabase.from('quests').insert({
        user_id: user.id,
        label: jobTitle.trim(),
        is_current_job: true,
        predicted_state: 'fun',
        status: 'active',
        life_fuel_baseline: lifeFuel,
      }).select('id').single()

      if (data?.id) setSavedQuestId(data.id)
      hapticSuccess()
      setStep('reveal')
    } catch (err) {
      console.error('Error saving current job:', err)
    } finally {
      setSaving(false)
    }
  }

  // Save experiences + dimensions (YES path final save)
  const handleSaveYesPath = async () => {
    if (!savedQuestId || saving) return
    setSaving(true)
    try {
      await supabase.from('quests').update({
        current_dimensions: currentDimensions,
        dream_dimensions: dreamDimensions,
        format_picks: [...selectedIds],
      }).eq('id', savedQuestId)
      hapticSuccess()
      navigate('/7-day-challenge')
    } catch (err) {
      console.error('Error saving yes path:', err)
    } finally {
      setSaving(false)
    }
  }

  // Save ideal fuels (NO path) — navigate to summary instead of /choose-quests
  const handleSaveNoPath = async (fuelsOverride) => {
    setSaving(true)
    const fuels = fuelsOverride || idealFuel
    try {
      if (savedQuestId) {
        await supabase.from('quests').update({
          path_fuels: CHANNEL_IDS.filter(id => fuels[id]),
          status: 'reference',
        }).eq('id', savedQuestId)
      }
      hapticSuccess()
      setStep('no_summary')
    } catch (err) {
      console.error('Error saving ideal:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="cjf">
      <div className="cjf-container">

        {/* ═══ STEP 1: Name + Life Fuels ═══ */}
        {step === 'name_fuel' && (
          <>
            <div className="cjf-header">
              <h2>What do you do for work?</h2>
              <p>Name your current job or main thing, then tell us what it gives you.</p>
            </div>

            <input
              className="cjf-input"
              placeholder="e.g. Account Manager at XYZ"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              autoFocus
            />

            {jobTitle.trim() && (
              <div className="cjf-fuel-section" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="cjf-fuel-title">Which of these are true about {jobTitle.trim()}?</div>
                <div className="cjf-fuel-checks">
                  {CHANNEL_IDS.map(id => {
                    const ch = LIFE_FUEL_CHANNELS[id]
                    return (
                      <button
                        key={id}
                        className={`cjf-fuel-btn ${lifeFuel[id] ? 'selected' : ''}`}
                        onClick={() => {
                          hapticLight()
                          setLifeFuel(prev => ({ ...prev, [id]: !prev[id] }))
                        }}
                      >
                        <span className="cjf-fuel-emoji">{ch.emoji}</span>
                        <span className="cjf-fuel-text">{ch.present}</span>
                        {lifeFuel[id] && <span className="cjf-fuel-tick">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="cjf-fixed">
              <button disabled={!jobTitle.trim() || saving} onClick={handleSaveNameFuel}>
                {saving ? 'Saving...' : 'Next'}
              </button>
            </div>
          </>
        )}

        {/* ═══ STEP 2: Pain Reveal ═══ */}
        {step === 'reveal' && (
          <div className="cjf-reveal">
            <h2>Your current reality</h2>

            <div className="cjf-fuel-reveal">
              {CHANNEL_IDS.map(id => {
                const ch = LIFE_FUEL_CHANNELS[id]
                const has = lifeFuel[id]
                return (
                  <div key={id} className={`cjf-fuel-row ${has ? 'has' : 'missing'}`}>
                    <span className="cjf-fuel-row-emoji">{ch.emoji}</span>
                    <span className="cjf-fuel-row-name">{ch.name}</span>
                    <span className="cjf-fuel-row-status">{has ? '✓' : 'missing'}</span>
                  </div>
                )
              })}
            </div>

            {missingFuels.length > 0 && hasFuels.length > 0 && (
              <p className="cjf-reveal-insight">
                {jobTitle} gives you {hasFuels.map(id => LIFE_FUEL_CHANNELS[id].name).join(' and ')}, but you're missing <strong>{missingFuels.map(id => LIFE_FUEL_CHANNELS[id].name).join(' and ')}</strong>.
              </p>
            )}
            {missingFuels.length > 0 && hasFuels.length === 0 && (
              <p className="cjf-reveal-insight">
                {jobTitle} isn't giving you any of the four life fuels right now. That's important to know.
              </p>
            )}
            {missingFuels.length === 0 && (
              <p className="cjf-reveal-insight">
                {jobTitle} gives you all four life fuels. That's rare. The question is whether you want more of them.
              </p>
            )}

            <div className="cjf-fixed">
              <button onClick={() => { hapticLight(); setStep('fork') }}>
                What's next?
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Fork ═══ */}
        {step === 'fork' && (
          <div className="cjf-done">
            <div className="cjf-done-icon">🧭</div>
            <h2>Do you want this to be your life path?</h2>
            <p>Is {jobTitle} something you want to keep building on, or do you want something different?</p>
            <div className="cjf-direction-options">
              <button
                className="cjf-direction-btn"
                onClick={() => { hapticLight(); setStep('experiences') }}
              >
                <span className="cjf-direction-emoji">🔥</span>
                <span className="cjf-direction-text">Yes, I want to grow this</span>
                <span className="cjf-direction-sub">Pick your skills and set your ambition.</span>
              </button>
              <button
                className="cjf-direction-btn"
                disabled={saving}
                onClick={() => {
                  if (saving) return
                  hapticLight()
                  handleSaveNoPath({ choice: true, connection: true, mastery: true, meaning: true })
                }}
              >
                <span className="cjf-direction-emoji">🌱</span>
                <span className="cjf-direction-text">No, I want something different</span>
                <span className="cjf-direction-sub">We'll help you find paths that light you up.</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══ YES PATH: Pick Experiences ═══ */}
        {step === 'experiences' && (
          <>
            <button className="cjf-back" onClick={() => setStep('fork')}>&larr; Back</button>
            <div className="cjf-header">
              <h2>What experiences does {jobTitle} involve?</h2>
              <p>Pick the skills and experiences that make up your typical work.</p>
            </div>

            {domeLoading && (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(0,0,0,0.3)' }}>Loading experiences...</div>
            )}

            {!domeLoading && allItems.length === 0 && (
              <div className="cjf-done" style={{ minHeight: 'auto', padding: '24px 0' }}>
                <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)' }}>
                  Complete the Experience Game first to see your experiences here.
                </p>
                <button className="cjf-direction-btn" onClick={() => navigate('/experience-game')}>
                  <span className="cjf-direction-emoji">🎮</span>
                  <span className="cjf-direction-text">Play the Experience Game</span>
                </button>
              </div>
            )}

            {!domeLoading && allItems.length > 0 && (
              <>
                <div className="cjf-count">{selectedIds.size} selected</div>

                <input
                  className="cjf-search"
                  placeholder="Search experiences..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />

                {[
                  { key: 'vibe', label: 'Vibe Rise', items: allExps?.vibeRise || [], cls: 'vibe' },
                  { key: 'fun', label: 'Fun', items: allExps?.fun || [], cls: 'fun' },
                  { key: 'stressed', label: 'Stressed', items: allExps?.stressed || [], cls: 'stressed' },
                  { key: 'bored', label: 'Bored', items: allExps?.bored || [], cls: 'bored' },
                ].map(g => ({ ...g, items: search.trim() ? g.items.filter(exp => exp.label.toLowerCase().includes(search.toLowerCase())) : g.items })).filter(g => g.items.length > 0).map(group => (
                  <div key={group.key}>
                    <div className={`cjf-ns-divider ${group.cls}`}>
                      <span>{group.label}</span><hr />
                    </div>
                    {groupByPrimal(group.items).map(primalGroup => (
                      <div key={primalGroup.primal}>
                        <div className="cjf-primal">{primalGroup.label}</div>
                        {primalGroup.items.map(exp => (
                          <div key={exp.id} className={`cjf-exp ${selectedIds.has(exp.id) ? 'selected' : ''}`} onClick={() => toggleExp(exp.id)}>
                            <div className="cjf-exp-check">{selectedIds.has(exp.id) ? '✓' : ''}</div>
                            <div className="cjf-exp-name">{exp.label}</div>
                            <div className="cjf-exp-ns">{NS_EMOJI[exp.nsState] || ''}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}

                <div className="cjf-fixed">
                  <button
                    disabled={selectedIds.size === 0}
                    onClick={() => {
                      hapticLight()
                      const defaults = {}
                      DOME_DIMENSIONS.forEach(d => { defaults[d.id] = 1 })
                      setCurrentDimensions(prev => Object.keys(prev).length ? prev : defaults)
                      setDimStep('current')
                      setStep('dimensions')
                    }}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ═══ YES PATH: Dimensions (current then dream) ═══ */}
        {step === 'dimensions' && (
          <>
            <button className="cjf-back" onClick={() => {
              if (dimStep === 'dream') setDimStep('dream_intro')
              else if (dimStep === 'dream_intro') setDimStep('current')
              else setStep('experiences')
            }}>&larr; Back</button>

            {/* Dream intro — articulate the dream before rating */}
            {dimStep === 'dream_intro' && (
              <div className="cjf-reveal" style={{ paddingTop: 20 }}>
                <h2>What's different about your dream?</h2>
                <p className="cjf-reveal-insight" style={{ marginBottom: 16 }}>
                  You've mapped where {jobTitle} is right now. Before we set your ambition, describe where you want it to go.
                </p>
                <input
                  className="cjf-input"
                  placeholder="e.g. Running my own studio, teaching 200 people a week"
                  value={dreamTitle}
                  onChange={e => setDreamTitle(e.target.value)}
                  autoFocus
                />
                <div className="cjf-fixed">
                  <button
                    disabled={!dreamTitle.trim()}
                    onClick={() => { hapticLight(); setDimStep('dream') }}
                  >
                    Set the dimensions
                  </button>
                </div>
              </div>
            )}

            {(dimStep === 'current' || dimStep === 'dream') && (
            <div className="cjf-header">
              <div className="cjf-step-label">{dimStep === 'current' ? 'Where you are now' : 'Where you want to be'}</div>
              <h2>{dimStep === 'current' ? `Where is ${jobTitle} right now?` : dreamTitle || `Where do you want ${jobTitle} to take you?`}</h2>
              <p>{dimStep === 'current' ? 'Rate each dimension honestly.' : 'Set where each dimension would need to be.'}</p>
            </div>
            )}

            {(dimStep === 'current' || dimStep === 'dream') && (
              <>
                {DOME_DIMENSIONS.map(dim => {
                  const tiers = getDimTiers(dim)
                  const questions = dimStep === 'current' ? CURRENT_QUESTIONS : DREAM_QUESTIONS
                  const values = dimStep === 'current' ? currentDimensions : dreamDimensions
                  const setter = dimStep === 'current' ? setCurrentDimensions : setDreamDimensions
                  const currentVal = dimStep === 'dream' ? currentDimensions[dim.id] : null

                  const selectedLevel = values[dim.id]
                  const selectedDesc = selectedLevel && dim.type === 'qualitative'
                    ? dim.levels.find(l => l.level === selectedLevel)?.description
                    : null

                  return (
                    <div key={dim.id} className="cjf-dim-section">
                      <div className="cjf-dim-label">
                        {dim.icon} {questions[dim.id]}
                        {currentVal != null && <span className="cjf-dim-current">now: {currentVal}</span>}
                      </div>
                      <div className="cjf-dim-options">
                        {tiers.map(t => (
                          <button
                            key={t.value}
                            className={`cjf-dim-pill ${values[dim.id] === t.value ? `selected ${dimStep === 'dream' ? 'cjf-dream-selected' : ''}` : ''}`}
                            onClick={() => {
                              hapticLight()
                              setter(prev => ({ ...prev, [dim.id]: t.value }))
                            }}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                      {selectedDesc && <div className="cjf-dim-desc">{selectedDesc}</div>}
                    </div>
                  )
                })}

                <div className="cjf-fixed">
                  {dimStep === 'current' ? (
                    <button
                      onClick={() => {
                        hapticLight()
                        setDreamDimensions({ ...currentDimensions })
                        setDimStep('dream_intro')
                      }}
                >
                  Next: set your ambition
                </button>
              ) : (
                <button
                  onClick={handleSaveYesPath}
                  disabled={saving || Object.keys(dreamDimensions).length === 0}
                >
                  {saving ? 'Saving...' : 'Set my ambition'}
                </button>
              )}
                </div>
              </>
            )}
          </>
        )}

        {/* ═══ NO PATH: Summary ═══ */}
        {step === 'no_summary' && (
          <div className="cjf-reveal" style={{ paddingTop: 20 }}>
            <h2>{jobTitle}</h2>
            <p className="cjf-reveal-insight" style={{ marginBottom: 20 }}>
              Here's what your current job gives you, and what's missing.
            </p>

            <div className="cjf-fuel-reveal">
              {CHANNEL_IDS.map(id => {
                const ch = LIFE_FUEL_CHANNELS[id]
                const has = lifeFuel[id]
                return (
                  <div key={id} className={`cjf-fuel-row ${has ? 'has' : 'missing'}`}>
                    <span className="cjf-fuel-row-emoji">{ch.emoji}</span>
                    <span className="cjf-fuel-row-name">{ch.name}</span>
                    <span className="cjf-fuel-row-status">{has ? '✓' : 'missing'}</span>
                  </div>
                )
              })}
            </div>

            {missingFuels.length > 0 && (
              <p className="cjf-reveal-insight" style={{ marginBottom: 0 }}>
                Your next step is to find a life path that gives you all four. That's what the path picker is for.
              </p>
            )}
            {missingFuels.length === 0 && (
              <p className="cjf-reveal-insight" style={{ marginBottom: 0 }}>
                Your job already gives you all four fuels. The path picker can help you find something that gives you even more of them.
              </p>
            )}

            <div className="cjf-direction-options" style={{ marginTop: 24, maxWidth: '100%' }}>
              <button
                className="cjf-direction-btn"
                onClick={() => { hapticLight(); navigate('/choose-quests') }}
              >
                <span className="cjf-direction-emoji">🧭</span>
                <span className="cjf-direction-text">Find my life paths</span>
                <span className="cjf-direction-sub">Pick experiences that light you up and turn them into paths.</span>
              </button>
              <button
                className="cjf-direction-btn"
                onClick={() => { hapticLight(); navigate('/7-day-challenge') }}
              >
                <span className="cjf-direction-emoji">🏠</span>
                <span className="cjf-direction-text">Back to home</span>
                <span className="cjf-direction-sub">I'll explore paths later.</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
