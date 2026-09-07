/**
 * WahooCreator.jsx
 *
 * Courage challenge creation — step-by-step flow.
 * Steps: freetext → dimensions (drill-in for levels) → body → voice → submit.
 *
 * CSS prefix: wc-
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
import { DOME_DIMENSIONS, DIFFICULTY_SCALE, calculateCourageScore } from '../data/domeDimensions'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import QuestSelector from './QuestSelector'
import './WahooCreator.css'

const VOICE_LIES = [
  { voice: 'ghost', icon: '👻', lie: "I want to disappear. Hide. Go quiet." },
  { voice: 'perfectionist', icon: '🎭', lie: "It's not good enough yet. I need more time." },
  { voice: 'people-pleaser', icon: '🪞', lie: "I'd rather say yes than deal with their reaction." },
  { voice: 'controller', icon: '🎮', lie: "I want to know how this ends before I do it." },
  { voice: 'auto-pilot', icon: '🛋️', lie: "I'm going through the motions. I've checked out." },
]

const DIM_SUBS = {
  people: 'More people watching or involved',
  money: 'Charging or asking for money',
  vulnerability: 'Removing shields, being seen',
  stakes: 'More at risk if it goes wrong',
  rarity: 'Doing something uncommon',
  identity: 'Surprising the people who know you',
  context: 'Unfamiliar territory or conditions',
  business_commitment: 'Going deeper into your business',
}

const STEPS = ['freetext', 'dimensions', 'body', 'voice']

export default function WahooCreator({
  userId,
  bucketList = [],
  initialText = '',
  initialQuestId = null,
  initialSourceLabel = null,
  onWahooAccepted,
  onClose,
}) {
  const [step, setStep] = useState('freetext')
  const [freeText, setFreeText] = useState(initialText)
  const [linkedQuestId, setLinkedQuestId] = useState(initialQuestId)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [protectiveVoice, setProtectiveVoice] = useState(null)
  const [expansionDims, setExpansionDims] = useState([])
  const [dimensionValues, setDimensionValues] = useState({})
  const [predictedDifficulty, setPredictedDifficulty] = useState(null)
  // Drill-in: which dimension is currently being leveled (null = show grid)
  const [drilledDim, setDrilledDim] = useState(null)
  const successTimerRef = useRef(null)
  const drillTimer = useRef(null)

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
      if (drillTimer.current) clearTimeout(drillTimer.current)
    }
  }, [])

  const stepIndex = STEPS.indexOf(step)
  const totalSteps = STEPS.length

  const goBack = useCallback(() => {
    if (drillTimer.current) { clearTimeout(drillTimer.current); drillTimer.current = null }
    if (step === 'dimensions' && drilledDim) {
      // Back from drill-in: if no value was set, remove the dimension
      if (dimensionValues[drilledDim] == null) {
        setExpansionDims(prev => prev.filter(x => x !== drilledDim))
      }
      setDrilledDim(null)
    } else if (step === 'voice') setStep('body')
    else if (step === 'body') setStep('dimensions')
    else if (step === 'dimensions') setStep('freetext')
  }, [step, drilledDim, dimensionValues])

  // The dimension object for the current drill-in
  const drilledDimObj = drilledDim ? DOME_DIMENSIONS.find(d => d.id === drilledDim) : null

  // Handle tapping a dimension card
  // Not selected → select + drill in. Already selected → drill in to change level.
  // Deselect only via × button on tags.
  const handleDimTap = useCallback((dimId) => {
    hapticLight()
    if (!expansionDims.includes(dimId)) {
      setExpansionDims(prev => [...prev, dimId])
    }
    setDrilledDim(dimId)
  }, [expansionDims])

  // Handle picking a level inside drill-in (qualitative)
  const handleDrillLevel = useCallback((dimId, level) => {
    hapticLight()
    setDimensionValues(prev => ({ ...prev, [dimId]: level }))
    // Auto-return to grid after short delay
    if (drillTimer.current) clearTimeout(drillTimer.current)
    drillTimer.current = setTimeout(() => {
      drillTimer.current = null
      setDrilledDim(null)
    }, 250)
  }, [])

  // Get level label for a selected dimension
  const getLevelLabel = useCallback((dimId) => {
    const dim = DOME_DIMENSIONS.find(d => d.id === dimId)
    const val = dimensionValues[dimId]
    if (!dim || val == null) return null
    if (dim.type === 'numeric') return val
    const tier = dim.levels?.find(l => l.level === val)
    return tier?.label || `Level ${val}`
  }, [dimensionValues])

  async function handleSubmit() {
    if (!freeText.trim() || !linkedQuestId || generating) return
    setGenerating(true)
    setError(null)

    try {
      let sourceLabel = initialSourceLabel
      if (!sourceLabel && linkedQuestId) {
        const { data: q } = await supabase.from('quests').select('label').eq('id', linkedQuestId).maybeSingle()
        sourceLabel = q?.label || 'Courage'
      }

      const { data: dbRecord, error: saveError } = await createGroanChallenge({
        userId,
        title: freeText.trim(),
        description: freeText.trim(),
        visibilityLayer: 'screen',
        sourceType: 'skill',
        sourceLabel: sourceLabel || 'Courage',
        depthLevel: null,
        visibilityLayers: [],
        questId: linkedQuestId || null,
        expansionDimensions: expansionDims,
        dimensionValues,
        predictedDifficulty,
        predictedVoice: protectiveVoice || null,
      })
      if (saveError || !dbRecord) throw saveError || new Error('Challenge was not saved')

      const { error: acceptError } = await acceptGroanChallenge(dbRecord.id)
      if (acceptError) throw acceptError

      if (linkedQuestId) {
        try {
          await supabase.from('quest_tasks').insert({
            quest_id: linkedQuestId,
            user_id: userId,
            text: freeText.trim(),
            is_courage_challenge: true,
            groan_challenge_id: dbRecord.id,
            sort_order: 0,
          })
        } catch (e) { /* non-blocking */ }
      }

      hapticSuccess()
      onWahooAccepted?.(null, protectiveVoice || null)
      setStep('success')
      successTimerRef.current = setTimeout(() => onClose?.(), 1500)
    } catch (err) {
      console.error('Accept Wahoo error:', err)
      setError('Failed to save. Try again.')
    } finally {
      setGenerating(false)
    }
  }

  // ── Success ──
  if (step === 'success') {
    return (
      <div className="wc-container">
        <div className="wc-success">
          <div className="wc-success-icon">🔥</div>
          <p className="wc-success-text">Challenge accepted!</p>
          <p className="wc-success-sub">Go make it happen.</p>
        </div>
      </div>
    )
  }

  // ── Bucket list ──
  if (step === 'fromlist') {
    return (
      <div className="wc-container">
        <button className="wc-back" onClick={() => setStep('freetext')}>← Back</button>
        <div className="wc-card">
          <h3 className="wc-card-title">Your Courage List</h3>
          <p className="wc-card-sub">Pick one to activate this week.</p>
          <div className="wc-suggestions-list">
            {bucketList.map(w => (
              <button
                key={w.id}
                className="wc-suggestion-card"
                onClick={async () => {
                  hapticLight()
                  setGenerating(true)
                  try {
                    await acceptGroanChallenge(w.id)
                    const questId = w.quest_id || linkedQuestId
                    if (questId) {
                      const { data: existing } = await supabase.from('quest_tasks')
                        .select('id').eq('groan_challenge_id', w.id).limit(1)
                      if (!existing?.length) {
                        await supabase.from('quest_tasks').insert({
                          quest_id: questId,
                          user_id: userId,
                          text: w.title || w.challenge_text,
                          is_courage_challenge: true,
                          groan_challenge_id: w.id,
                          sort_order: 0,
                        })
                      }
                    }
                    hapticSuccess()
                    onWahooAccepted?.()
                    setStep('success')
                    successTimerRef.current = setTimeout(() => onClose?.(), 1500)
                  } catch (err) {
                    console.error('Accept from list error:', err)
                    setError('Failed to activate. Try again.')
                  } finally {
                    setGenerating(false)
                  }
                }}
                disabled={generating}
              >
                <div className="wc-suggestion-title">{w.title || w.challenge_text}</div>
              </button>
            ))}
          </div>
          {error && <p className="wc-error">{error}</p>}
        </div>
      </div>
    )
  }

  // ── Main flow ──
  return (
    <div className="wc-container">
      {/* Progress bar */}
      <div className="wc-progress-bar">
        <div
          className="wc-progress-fill"
          style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Back button (close handled by parent modal) */}
      {(step !== 'freetext' || drilledDim) && (
        <button className="wc-back" onClick={goBack}>← Back</button>
      )}

      {/* ═══ STEP 1: What's the brave action? ═══ */}
      {step === 'freetext' && (
        <div className="wc-step-screen" key="freetext">
          <h2 className="wc-headline">What's the brave thing?</h2>
          <p className="wc-sub">Something you'd love to do that scares you a little.</p>

          <textarea
            className="wc-textarea"
            placeholder="I want to..."
            value={freeText}
            onChange={e => setFreeText(e.target.value)}
            rows={2}
            autoFocus
          />

          {!initialQuestId && (
            <QuestSelector userId={userId} value={linkedQuestId}
              onChange={(id) => setLinkedQuestId(id)} />
          )}

          <div className="wc-step-footer">
            <button
              className="wc-next-btn"
              disabled={!freeText.trim() || !linkedQuestId}
              onClick={() => { hapticLight(); setStep('dimensions') }}
            >
              Next →
            </button>

            {bucketList.length > 0 && (
              <button
                className="wc-text-link"
                onClick={() => { hapticLight(); setError(null); setStep('fromlist') }}
              >
                Or pick from your list ({bucketList.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══ STEP 2: Dimensions with drill-in ═══ */}
      {step === 'dimensions' && !drilledDim && (
        <div className="wc-step-screen" key="dimensions-grid">
          <h2 className="wc-headline">Where are you stretching?</h2>
          <p className="wc-sub">Tap to pick, then set the level.</p>

          <div className="wc-dim-grid">
            {DOME_DIMENSIONS.map(d => {
              const active = expansionDims.includes(d.id)
              const levelLabel = getLevelLabel(d.id)
              return (
                <button
                  key={d.id}
                  className={`wc-dim-card ${active ? 'active' : ''}`}
                  onClick={() => handleDimTap(d.id)}
                >
                  <span className="wc-dim-emoji">{d.icon}</span>
                  <span className="wc-dim-label">{d.label}</span>
                  {active && levelLabel && (
                    <span className="wc-dim-level-badge">{levelLabel}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Selected dimensions as tags */}
          {expansionDims.length > 0 && (
            <div className="wc-dim-selected-list">
              {expansionDims.map(id => {
                const d = DOME_DIMENSIONS.find(x => x.id === id)
                const levelLabel = getLevelLabel(id)
                return d ? (
                  <div key={id} className="wc-dim-selected-tag">
                    <span>{d.icon} {d.label}{levelLabel ? `: ${levelLabel}` : ''}</span>
                    <button
                      className="wc-dim-remove"
                      onClick={(e) => {
                        e.stopPropagation()
                        hapticLight()
                        setExpansionDims(prev => prev.filter(x => x !== id))
                        setDimensionValues(prev => { const n = { ...prev }; delete n[id]; return n })
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : null
              })}
            </div>
          )}

          <div className="wc-step-footer">
            <button
              className="wc-next-btn"
              disabled={expansionDims.length === 0 || expansionDims.some(id => dimensionValues[id] == null)}
              onClick={() => { hapticLight(); setStep('body') }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 2b: Drill-in level picker ═══ */}
      {step === 'dimensions' && drilledDim && drilledDimObj && (
        <div className="wc-step-screen" key={`drill-${drilledDim}`}>
          <div className="wc-level-icon">{drilledDimObj.icon}</div>
          <h2 className="wc-headline">{drilledDimObj.question || drilledDimObj.label}</h2>
          <p className="wc-sub">{DIM_SUBS[drilledDim]}</p>

          <div className="wc-level-options">
            {drilledDimObj.type === 'numeric' ? (
              <>
                <input
                  className="wc-level-input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder={drilledDimObj.placeholder}
                  value={dimensionValues[drilledDim] ?? ''}
                  onChange={e => {
                    const raw = e.target.value
                    if (raw === '') {
                      setDimensionValues(prev => { const n = { ...prev }; delete n[drilledDim]; return n })
                    } else {
                      setDimensionValues(prev => ({ ...prev, [drilledDim]: Number(raw) }))
                    }
                  }}
                  autoFocus
                />
                <div className="wc-step-footer">
                  <button
                    className="wc-next-btn"
                    disabled={dimensionValues[drilledDim] == null}
                    onClick={() => { hapticLight(); setDrilledDim(null) }}
                  >
                    Done →
                  </button>
                </div>
              </>
            ) : (
              drilledDimObj.levels.map(lv => (
                <button
                  key={lv.level}
                  className={`wc-level-option ${dimensionValues[drilledDim] === lv.level ? 'selected' : ''}`}
                  onClick={() => handleDrillLevel(drilledDim, lv.level)}
                >
                  <span className="wc-level-option-label">{lv.label}</span>
                  {lv.description && (
                    <span className="wc-level-option-desc">{lv.description}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══ STEP 3: Body prediction ═══ */}
      {step === 'body' && (
        <div className="wc-step-screen" key="body">
          <h2 className="wc-headline">How does your body feel thinking about this?</h2>
          <p className="wc-sub">Not what you think. What you feel.</p>

          <div className="wc-body-options">
            {DIFFICULTY_SCALE.map(ds => (
              <button
                key={ds.level}
                className={`wc-body-card ${predictedDifficulty === ds.level ? 'selected' : ''}`}
                onClick={() => {
                  hapticLight()
                  setPredictedDifficulty(ds.level)
                  setTimeout(() => setStep('voice'), 300)
                }}
              >
                <span className="wc-body-emoji">{ds.icon}</span>
                <span className="wc-body-label">{ds.label}</span>
                {ds.description && (
                  <span className="wc-body-desc">{ds.description}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ STEP 4: Voice (optional) ═══ */}
      {step === 'voice' && (
        <div className="wc-step-screen" key="voice">
          <h2 className="wc-headline">Any voice holding you back?</h2>
          <p className="wc-sub">The thing your brain says to talk you out of it. (Optional)</p>

          <div className="wc-voice-options">
            {VOICE_LIES.map(v => (
              <button
                key={v.voice}
                className={`wc-voice-btn ${protectiveVoice === v.voice ? 'active' : ''}`}
                onClick={() => {
                  hapticLight()
                  setProtectiveVoice(prev => prev === v.voice ? null : v.voice)
                }}
              >
                <span className="wc-voice-icon">{v.icon}</span>
                <span className="wc-voice-lie">{v.lie}</span>
              </button>
            ))}
          </div>

          {Object.keys(dimensionValues).length > 0 && (
            <div className="wc-courage-preview">
              Courage score: {calculateCourageScore(dimensionValues).toFixed(1)}
            </div>
          )}

          {error && <p className="wc-error">{error}</p>}

          <div className="wc-step-footer">
            <button
              className="wc-submit-btn"
              disabled={generating}
              onClick={handleSubmit}
            >
              {generating ? 'Saving...' : 'Add courage challenge 🔥'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
