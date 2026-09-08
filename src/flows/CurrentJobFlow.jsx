/**
 * CurrentJobFlow — /add-current-job
 * Maps current work as a quest with dome experiences, dimension baselines,
 * Life Fuel. After save, shows pain reveal + fork (pursue this path or find new).
 *
 * Steps: name_and_pick → dimensions → reveal → fork → dream_yes | dream_no
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useDomeData } from '../hooks/useDomeData'
import { getAllDomeExperiences, groupByPrimal } from '../lib/domeSummary'
import { DIMENSION_OPTIONS, DIMENSION_IDS, DIMENSION_LABELS, DIMENSION_ICONS, DIMENSION_DESCRIPTIONS, OPTION_HINTS } from '../lib/currentJobChallenges'
import { LIFE_FUEL_CHANNELS, CHANNEL_IDS } from '../data/channelMapping'
import { DOME_DIMENSIONS } from '../data/domeDimensions'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './CurrentJobFlow.css'

const NS_EMOJI = { vibe_rise: '🔥', fun: '😊', pressure: '😰', growth_edge: '😰', bored: '😐', uninterested: '😐' }
const NS_DISPLAY = { vibe_rise: '🔥 Vibe Rise', fun: '😊 Fun', pressure: '😰 Stressful', growth_edge: '😰 Stressful', bored: '😐 Bored', uninterested: '😐 Bored' }

// "Ideal life" framing for each dimension (NO path)
const IDEAL_QUESTIONS = {
  people: 'How many people would you want to reach or work with?',
  money: 'How much would you want to earn per experience or per month?',
  vulnerability: 'How visible would you need to be?',
  stakes: 'How much would you be willing to risk?',
  rarity: 'How different from the norm would your path be?',
  identity: 'How much would people who know you be surprised?',
  context: 'How far from your comfort zone would you need to go?',
  business_commitment: 'How deep into building something would you go?',
}

export default function CurrentJobFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { domeStates, loading: domeLoading } = useDomeData(user?.id)

  const [step, setStep] = useState('name_and_pick')
  const [jobTitle, setJobTitle] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [dimensions, setDimensions] = useState({})
  const [lifeFuel, setLifeFuel] = useState({ choice: false, connection: false, mastery: false, meaning: false })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [savedQuestId, setSavedQuestId] = useState(null)

  // Dream dimensions (YES path)
  const [dreamDimensions, setDreamDimensions] = useState({})

  // Ideal fuel + dream dimensions (NO path)
  const [idealFuel, setIdealFuel] = useState({ choice: false, connection: false, mastery: false, meaning: false })
  const [idealDimensions, setIdealDimensions] = useState({})

  useEffect(() => {
    document.body.classList.add('hide-toolbar')
    return () => document.body.classList.remove('hide-toolbar')
  }, [])

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [step])

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

  const selectedExps = allItems.filter(e => selectedIds.has(e.id))

  // Computed pain data
  const hasFuels = CHANNEL_IDS.filter(id => lifeFuel[id])
  const missingFuels = CHANNEL_IDS.filter(id => !lifeFuel[id])

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      const counts = {}
      selectedExps.forEach(e => { const k = e.nsState === 'growth_edge' ? 'pressure' : e.nsState; counts[k] = (counts[k] || 0) + 1 })
      const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'fun'

      const { data } = await supabase.from('quests').insert({
        user_id: user.id,
        label: jobTitle.trim(),
        is_current_job: true,
        predicted_state: dominant,
        status: 'active',
        current_dimensions: dimensions,
        life_fuel_baseline: lifeFuel,
        format_picks: [...selectedIds],
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

  // Save dream dimensions to the quest (YES path)
  const handleSaveDream = async () => {
    if (!savedQuestId) return
    setSaving(true)
    try {
      await supabase.from('quests').update({
        dream_dimensions: dreamDimensions,
      }).eq('id', savedQuestId)
      hapticSuccess()
      navigate('/7-day-challenge')
    } catch (err) {
      console.error('Error saving dream:', err)
    } finally {
      setSaving(false)
    }
  }

  // Save ideal fuel + dimensions on the current job quest (NO path)
  const handleSaveIdeal = async () => {
    setSaving(true)
    try {
      if (savedQuestId) {
        await supabase.from('quests').update({
          path_fuels: CHANNEL_IDS.filter(id => idealFuel[id]),
          dream_dimensions: idealDimensions,
        }).eq('id', savedQuestId)
      }
      hapticSuccess()
    } catch (err) {
      console.error('Error saving ideal:', err)
    } finally {
      setSaving(false)
      navigate('/choose-quests')
    }
  }

  if (domeLoading) return <div className="cjf"><div className="cjf-container" style={{ textAlign: 'center', paddingTop: 60, color: 'rgba(0,0,0,0.3)' }}>Loading...</div></div>

  if (!domeLoading && allItems.length === 0) return (
    <div className="cjf"><div className="cjf-container">
      <div className="cjf-done">
        <div className="cjf-done-icon">🎯</div>
        <h2>Rate some experiences first</h2>
        <p>Complete the Experience Dome on the Discover tab so we know what experiences to show here.</p>
        <div className="cjf-fixed">
          <button onClick={() => navigate('/7-day-challenge')}>Go to Discover</button>
        </div>
      </div>
    </div></div>
  )

  const canProceedStep1 = jobTitle.trim().length > 0 && selectedIds.size >= 1

  return (
    <div className="cjf">
      <div className="cjf-container">

        {/* STEP 1: Name + Pick Experiences */}
        {step === 'name_and_pick' && (
          <>
            <div className="cjf-header">
              <div className="cjf-step-label">Step 1 of 2</div>
              <h2>Map your current work</h2>
              <p>Name your job, then pick the experiences that make up your typical work.</p>
            </div>

            <input
              className="cjf-input"
              placeholder="e.g. Account Manager at XYZ"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              autoFocus
            />

            <div className="cjf-count">{selectedIds.size} selected (min 1)</div>

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
              <button disabled={!canProceedStep1} onClick={() => setStep('dimensions')}>Next</button>
            </div>
          </>
        )}

        {/* STEP 2: Dimensions + Life Fuel */}
        {step === 'dimensions' && (
          <>
            <button className="cjf-back" onClick={() => setStep('name_and_pick')}>&larr; Back</button>
            <div className="cjf-header">
              <div className="cjf-step-label">Step 2 of 2</div>
              <h2>Where are you now?</h2>
              <p>Set your current work dimensions.</p>
            </div>

            {DIMENSION_IDS.map(dimId => (
              <div key={dimId} className="cjf-dim-section">
                <div className="cjf-dim-label">{DIMENSION_ICONS[dimId]} {DIMENSION_LABELS[dimId]}</div>
                <div className="cjf-dim-desc">{DIMENSION_DESCRIPTIONS[dimId]}</div>
                <div className="cjf-dim-options">
                  {DIMENSION_OPTIONS[dimId].map(opt => (
                    <button
                      key={opt.value}
                      className={`cjf-dim-pill ${dimensions[dimId] === opt.value ? 'selected' : ''}`}
                      onClick={() => {
                        hapticLight()
                        setDimensions(prev => ({ ...prev, [dimId]: opt.value }))
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {dimensions[dimId] && OPTION_HINTS[dimId]?.[dimensions[dimId]] && (
                  <div className="cjf-dim-hint">{OPTION_HINTS[dimId][dimensions[dimId]]}</div>
                )}
              </div>
            ))}

            <div className="cjf-fuel-section">
              <div className="cjf-fuel-title">Life Fuel</div>
              <div className="cjf-fuel-sub">Thinking about your current work overall, which are true?</div>
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
                      <span className="cjf-fuel-text">{ch.checkbox}</span>
                      {lifeFuel[id] && <span className="cjf-fuel-tick">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="cjf-fixed">
              <button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        )}

        {/* STEP 3: Pain Reveal */}
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

            {missingFuels.length > 0 && (
              <p className="cjf-reveal-insight">
                Your current work gives you {hasFuels.map(id => LIFE_FUEL_CHANNELS[id].name).join(' and ')}{hasFuels.length > 0 ? ', but ' : ''}you're missing <strong>{missingFuels.map(id => LIFE_FUEL_CHANNELS[id].name).join(' and ')}</strong>.
              </p>
            )}
            {missingFuels.length === 0 && (
              <p className="cjf-reveal-insight">
                Your current work gives you all four life fuels. That's rare. The question is whether you want more of them.
              </p>
            )}

            <div className="cjf-fixed">
              <button onClick={() => { hapticLight(); setStep('fork') }}>
                What's next?
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Fork */}
        {step === 'fork' && (
          <div className="cjf-done">
            <div className="cjf-done-icon">🧭</div>
            <h2>Do you want this to be your life path?</h2>
            <p>Is {jobTitle} something you want to keep building on, or do you want something different?</p>
            <div className="cjf-direction-options">
              <button
                className="cjf-direction-btn"
                onClick={() => {
                  hapticLight()
                  // Pre-fill dream with current (user adjusts up)
                  setDreamDimensions({ ...dimensions })
                  setStep('dream_yes')
                }}
              >
                <span className="cjf-direction-emoji">🔥</span>
                <span className="cjf-direction-text">Yes, I want to grow this</span>
                <span className="cjf-direction-sub">Set where you want this path to take you.</span>
              </button>
              <button
                className="cjf-direction-btn"
                onClick={() => {
                  hapticLight()
                  setStep('dream_no')
                }}
              >
                <span className="cjf-direction-emoji">🌱</span>
                <span className="cjf-direction-text">No, I want something different</span>
                <span className="cjf-direction-sub">Tell us what your ideal life path looks like.</span>
              </button>
            </div>
          </div>
        )}

        {/* YES PATH: Dream dimensions for this path */}
        {step === 'dream_yes' && (
          <>
            <button className="cjf-back" onClick={() => setStep('fork')}>&larr; Back</button>
            <div className="cjf-header">
              <h2>Where do you want {jobTitle} to take you?</h2>
              <p>Set where you'd love each dimension to be. Think big.</p>
            </div>

            {DOME_DIMENSIONS.map(dim => {
              const currentVal = dimensions[dim.id]
              const tiers = dim.type === 'numeric'
                ? dim.tiers.map((t, i) => ({ value: i + 1, label: dim.inputType === 'money' ? `$${t >= 1000 ? `${t / 1000}K` : t}` : String(t) }))
                : dim.levels.map(l => ({ value: l.level, label: l.label }))

              return (
                <div key={dim.id} className="cjf-dim-section">
                  <div className="cjf-dim-label">
                    {dim.icon} {dim.label}
                    {currentVal != null && <span className="cjf-dim-current">now: {currentVal}</span>}
                  </div>
                  <div className="cjf-dim-options">
                    {tiers.map(t => (
                      <button
                        key={t.value}
                        className={`cjf-dim-pill ${dreamDimensions[dim.id] === t.value ? 'selected cjf-dream-selected' : ''}`}
                        onClick={() => {
                          hapticLight()
                          setDreamDimensions(prev => ({ ...prev, [dim.id]: t.value }))
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}

            <div className="cjf-fixed">
              <button
                onClick={handleSaveDream}
                disabled={saving || Object.keys(dreamDimensions).length === 0}
              >
                {saving ? 'Saving...' : 'Set my ambition'}
              </button>
            </div>
          </>
        )}

        {/* NO PATH: Ideal life fuel + dream dimensions */}
        {step === 'dream_no' && (
          <>
            <button className="cjf-back" onClick={() => setStep('fork')}>&larr; Back</button>
            <div className="cjf-header">
              <h2>In your ideal life path...</h2>
              <p>You don't need to know what it is yet. Just what it would feel like.</p>
            </div>

            <div className="cjf-fuel-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
              <div className="cjf-fuel-title">Which of these would be true?</div>
              <div className="cjf-fuel-checks">
                {CHANNEL_IDS.map(id => {
                  const ch = LIFE_FUEL_CHANNELS[id]
                  return (
                    <button
                      key={id}
                      className={`cjf-fuel-btn ${idealFuel[id] ? 'selected' : ''}`}
                      onClick={() => {
                        hapticLight()
                        setIdealFuel(prev => ({ ...prev, [id]: !prev[id] }))
                      }}
                    >
                      <span className="cjf-fuel-emoji">{ch.emoji}</span>
                      <span className="cjf-fuel-text">{ch.checkbox}</span>
                      {idealFuel[id] && <span className="cjf-fuel-tick">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="cjf-ideal-dims">
              <div className="cjf-fuel-title">What would your ideal life look like?</div>
              <div className="cjf-fuel-sub">Compared to {jobTitle}, how much would need to change?</div>

              {DOME_DIMENSIONS.map(dim => {
                const currentVal = dimensions[dim.id]
                const tiers = dim.type === 'numeric'
                  ? dim.tiers.map((t, i) => ({ value: i + 1, label: dim.inputType === 'money' ? `$${t >= 1000 ? `${t / 1000}K` : t}` : String(t) }))
                  : dim.levels.map(l => ({ value: l.level, label: l.label }))

                return (
                  <div key={dim.id} className="cjf-dim-section">
                    <div className="cjf-dim-label">
                      {dim.icon} {IDEAL_QUESTIONS[dim.id]}
                      {currentVal != null && <span className="cjf-dim-current">now: {currentVal}</span>}
                    </div>
                    <div className="cjf-dim-options">
                      {tiers.map(t => (
                        <button
                          key={t.value}
                          className={`cjf-dim-pill ${idealDimensions[dim.id] === t.value ? 'selected cjf-dream-selected' : ''}`}
                          onClick={() => {
                            hapticLight()
                            setIdealDimensions(prev => ({ ...prev, [dim.id]: t.value }))
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="cjf-fixed">
              <button onClick={handleSaveIdeal} disabled={saving}>
                {saving ? 'Saving...' : 'Find my paths'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
