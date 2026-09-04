/**
 * CurrentJobFlow — /add-current-job
 * Maps current work as a quest with dome experiences, dimension baselines,
 * Life Fuel, and user-written courage challenges for stressed/bored parts.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useDomeData } from '../hooks/useDomeData'
import { getAllDomeExperiences, groupByPrimal } from '../lib/domeSummary'
import { DIMENSION_OPTIONS, DIMENSION_IDS, DIMENSION_LABELS, DIMENSION_ICONS, getContextHint } from '../lib/currentJobChallenges'
import { LIFE_FUEL_CHANNELS, CHANNEL_IDS } from '../data/channelMapping'
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './CurrentJobFlow.css'

const NS_EMOJI = { vibe_rise: '🔥', fun: '😊', pressure: '😰', growth_edge: '😰', bored: '😐', uninterested: '😐' }

function isStressedOrBored(ns) {
  return ['pressure', 'growth_edge', 'bored', 'uninterested'].includes(ns)
}

export default function CurrentJobFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { domeStates, loading: domeLoading } = useDomeData(user?.id)

  const [step, setStep] = useState('name_and_pick') // name_and_pick | dimensions | challenges | saving | done
  const [jobTitle, setJobTitle] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [dimensions, setDimensions] = useState({})
  const [lifeFuel, setLifeFuel] = useState({ choice: false, connection: false, mastery: false, meaning: false })
  const [challengeTexts, setChallengeTexts] = useState({}) // { [nodeId]: text }
  const [saving, setSaving] = useState(false)

  // Hide toolbar
  useEffect(() => {
    document.body.classList.add('hide-toolbar')
    return () => document.body.classList.remove('hide-toolbar')
  }, [])

  // Scroll to top on step change
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [step])

  // Build experience lists from dome data
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
  const stressedBored = selectedExps.filter(e => isStressedOrBored(e.nsState))
  const alive = selectedExps.filter(e => !isStressedOrBored(e.nsState))

  // Save everything
  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      // Dominant NS state
      const counts = {}
      selectedExps.forEach(e => { const k = e.nsState === 'growth_edge' ? 'pressure' : e.nsState; counts[k] = (counts[k] || 0) + 1 })
      const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'fun'

      // 1. Create quest
      const { data: quest, error: questErr } = await supabase.from('quests').insert({
        user_id: user.id,
        label: jobTitle.trim(),
        is_current_job: true,
        predicted_state: dominant,
        status: 'active',
        current_dimensions: dimensions,
        life_fuel_baseline: lifeFuel,
      }).select('id').single()
      if (questErr) throw questErr

      // 2. Create quest_tasks for each experience
      const taskInserts = selectedExps.map((exp, i) => ({
        quest_id: quest.id,
        user_id: user.id,
        text: exp.label,
        node_id: exp.id,
        is_courage_challenge: isStressedOrBored(exp.nsState),
        sort_order: i,
      }))
      await supabase.from('quest_tasks').insert(taskInserts)

      // 3. Create courage challenges from user-written texts
      for (const exp of stressedBored) {
        const text = challengeTexts[exp.id]?.trim()
        if (!text) continue

        const { data: groan } = await createGroanChallenge({
          userId: user.id,
          title: text,
          description: text,
          visibilityLayer: 'screen',
          sourceType: 'skill',
          sourceLabel: jobTitle.trim(),
          questId: quest.id,
          expansionDimensions: [],
        })
        if (groan?.id) {
          await acceptGroanChallenge(groan.id)
          await supabase.from('quest_tasks')
            .update({ groan_challenge_id: groan.id })
            .eq('quest_id', quest.id)
            .eq('node_id', exp.id)
        }
      }

      hapticSuccess()
      setStep('done')
    } catch (err) {
      console.error('Error saving current job:', err)
      setSaving(false)
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

  const canProceedStep1 = jobTitle.trim().length > 0 && selectedIds.size >= 3

  // ── Render by step ──

  return (
    <div className="cjf">
      <div className="cjf-container">

        {/* STEP 1: Name + Pick Experiences */}
        {step === 'name_and_pick' && (
          <>
            <div className="cjf-header">
              <div className="cjf-step-label">Step 1 of 3</div>
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

            <div className="cjf-count">{selectedIds.size} selected (min 3)</div>

            {/* Grouped by NS state, then by primal within each */}
            {[
              { key: 'vibe', label: 'Vibe Rise', items: allExps?.vibeRise || [], cls: 'vibe' },
              { key: 'fun', label: 'Fun', items: allExps?.fun || [], cls: 'fun' },
              { key: 'stressed', label: 'Stressed', items: allExps?.stressed || [], cls: 'stressed' },
              { key: 'bored', label: 'Bored', items: allExps?.bored || [], cls: 'bored' },
            ].filter(g => g.items.length > 0).map(group => (
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
              <div className="cjf-step-label">Step 2 of 3</div>
              <h2>Where are you now?</h2>
              <p>Set your current work dimensions.</p>
            </div>

            {DIMENSION_IDS.map(dimId => (
              <div key={dimId} className="cjf-dim-section">
                <div className="cjf-dim-label">{DIMENSION_ICONS[dimId]} {DIMENSION_LABELS[dimId]}</div>
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
              <button onClick={() => stressedBored.length > 0 ? setStep('challenges') : handleSave()} disabled={saving}>
                {saving ? 'Saving...' : stressedBored.length > 0 ? 'Next' : 'Save & start'}
              </button>
            </div>
          </>
        )}

        {/* STEP 3: Courage Challenges for stressed/bored experiences */}
        {step === 'challenges' && (
          <>
            <button className="cjf-back" onClick={() => setStep('dimensions')}>&larr; Back</button>
            <div className="cjf-header">
              <div className="cjf-step-label">Step 3 of 3</div>
              <h2>Shift what's heavy</h2>
              <p>For each part of your work that feels stressful or boring, write one small thing you could change.</p>
            </div>

            {alive.length > 0 && (
              <div className="cjf-alive-section">
                <div className="cjf-alive-label">Already alive in your work</div>
                {alive.map(e => <div key={e.id} className="cjf-alive-item">{NS_EMOJI[e.nsState]} {e.label}</div>)}
              </div>
            )}

            {stressedBored.length > 0 && (
              <>
                <div className="cjf-costing-label">What could feel better</div>
                {stressedBored.map(exp => (
                  <div key={exp.id} className="cjf-challenge-card">
                    <div className="cjf-challenge-exp">{NS_EMOJI[exp.nsState]} {exp.label}</div>
                    <div className="cjf-challenge-hint">{getContextHint(exp.nsState)}</div>
                    <textarea
                      className="cjf-challenge-input"
                      placeholder="One thing I could try this week..."
                      value={challengeTexts[exp.id] || ''}
                      onChange={e => setChallengeTexts(prev => ({ ...prev, [exp.id]: e.target.value }))}
                      rows={2}
                    />
                  </div>
                ))}
              </>
            )}

            <div className="cjf-fixed">
              <button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save & start'}
              </button>
            </div>
          </>
        )}

        {/* DONE */}
        {step === 'done' && (
          <div className="cjf-done">
            <div className="cjf-done-icon">💼</div>
            <h2>Your work is mapped</h2>
            <p>Your current job is now a quest. Courage challenges will help you shift the parts that feel heavy.</p>
            <div className="cjf-fixed">
              <button onClick={() => navigate('/7-day-challenge')}>Go to Quests</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
