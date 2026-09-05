/**
 * WahooCreator.jsx
 *
 * Wahoo creation for the Courage tab.
 * Flow: free text → quest link (compulsory) → depth level → visibility → submit.
 * Secondary path: "Choose from your list" → activate a queued bucket-list wahoo.
 *
 * CSS prefix: wc-
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
import { DOME_DIMENSIONS, DIFFICULTY_SCALE, calculateCourageScore } from '../data/domeDimensions'
import { getWeekStartLocal } from '../lib/dateUtils'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import QuestSelector from './QuestSelector'
import './WahooCreator.css'

const VOICE_META = {
  perfectionist: { name: 'Perfectionist', icon: '🎯', desc: 'Won\'t start until it\'s perfect' },
  controller: { name: 'Controller', icon: '🧱', desc: 'Needs to control every variable' },
  ghost: { name: 'Ghost', icon: '👻', desc: 'Disappears, avoids, goes quiet' },
  'people-pleaser': { name: 'People Pleaser', icon: '🪞', desc: 'Says yes when you mean no' },
  'auto-pilot': { name: 'Auto-Pilot', icon: '🤖', desc: 'Goes through the motions, checks out' },
}

// Dimension sub-descriptions for the tag grid
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
  const successTimerRef = useRef(null)

  useEffect(() => {
    return () => { if (successTimerRef.current) clearTimeout(successTimerRef.current) }
  }, [])

  async function handleSubmit() {
    if (!freeText.trim() || !linkedQuestId || generating) return
    setGenerating(true)
    setError(null)

    try {
      // Resolve quest label for source_label
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

          // Depth level auto-bump removed — depth labels replaced by expansion dimensions
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

  if (step === 'success') {
    return (
      <div className="wc-container">
        <div className="wc-success">
          <div className="wc-success-icon">🔥</div>
          <p className="wc-success-text">Wahoo accepted!</p>
          <p className="wc-success-sub">Go make it happen.</p>
        </div>
      </div>
    )
  }

  if (step === 'fromlist') {
    return (
      <div className="wc-container">
        <button className="wc-back" onClick={() => setStep('freetext')}>← Back</button>
        <div className="wc-card">
          <h3 className="wc-card-title">Your Wahoo List</h3>
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
                    // Link to quest_task if groan has a quest_id or linkedQuestId exists
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

  // Voice lies (from protectiveVoices.js)
  const VOICE_LIES = [
    { voice: 'ghost', icon: '👻', lie: "I don't feel comfortable sharing." },
    { voice: 'perfectionist', icon: '🎭', lie: "I'm not ready yet." },
    { voice: 'people-pleaser', icon: '🪞', lie: "As long as everyone's happy, I'm good." },
    { voice: 'controller', icon: '🎮', lie: "Leaving it to chance isn't an option." },
    { voice: 'auto-pilot', icon: '🛋️', lie: "I'm fine, just tired." },
  ]

  const canSubmit = freeText.trim() && linkedQuestId && expansionDims.length > 0 && predictedDifficulty && !generating

  return (
    <div className="wc-container">
      <div className="wc-header">
        <h3 className="wc-title">Add a Courage Challenge</h3>
        <p className="wc-explainer">Something you'd love to do that scares you a little.</p>
      </div>

      <div className="wc-card">
        {/* Step 1: What's the brave action? */}
        <div className="wc-step">
          <div className="wc-step-q">What's the brave action?</div>
          <textarea
            className="wc-textarea"
            placeholder="I want to..."
            value={freeText}
            onChange={e => setFreeText(e.target.value)}
            rows={2}
          />
          {!initialQuestId && (
            <QuestSelector userId={userId} value={linkedQuestId}
              onChange={(id) => setLinkedQuestId(id)} />
          )}
        </div>

        {/* Step 2: Capacity — dims + levels + body prediction (one scrollable step) */}
        {freeText.trim() && linkedQuestId && (
          <div className="wc-step">
            <div className="wc-step-q">What capacity are you building?</div>
            <div className="wc-dim-grid">
              {DOME_DIMENSIONS.map(d => {
                const active = expansionDims.includes(d.id)
                return (
                  <button
                    key={d.id}
                    className={`wc-dim-option ${active ? 'active' : ''}`}
                    onClick={() => {
                      hapticLight()
                      if (active) {
                        setExpansionDims(prev => prev.filter(x => x !== d.id))
                        setDimensionValues(prev => { const n = { ...prev }; delete n[d.id]; return n })
                      } else {
                        setExpansionDims(prev => [...prev, d.id])
                      }
                    }}
                  >
                    <span className="wc-dim-icon">{d.icon}</span>
                    <span className="wc-dim-text">
                      <span className="wc-dim-name">{d.label}</span>
                      <span className="wc-dim-sub">{DIM_SUBS[d.id]}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Inline level pickers for selected dimensions */}
            {expansionDims.length > 0 && (
              <div className="wc-level-pickers">
                {expansionDims.map(dimId => {
                  const dim = DOME_DIMENSIONS.find(d => d.id === dimId)
                  if (!dim) return null
                  const curVal = dimensionValues[dimId]

                  if (dim.type === 'numeric') {
                    return (
                      <div key={dimId} className="wc-level-row">
                        <div className="wc-level-label">{dim.icon} {dim.label}</div>
                        <input
                          className="wc-level-input"
                          type="number"
                          inputMode="numeric"
                          min="0"
                          placeholder={dim.placeholder}
                          value={curVal ?? ''}
                          onChange={e => {
                            const raw = e.target.value
                            if (raw === '') {
                              setDimensionValues(prev => { const n = { ...prev }; delete n[dimId]; return n })
                            } else {
                              setDimensionValues(prev => ({ ...prev, [dimId]: Number(raw) }))
                            }
                          }}
                        />
                      </div>
                    )
                  }

                  // Qualitative: horizontal pill picker
                  return (
                    <div key={dimId} className="wc-level-row">
                      <div className="wc-level-label">{dim.icon} {dim.question}</div>
                      <div className="wc-level-pills">
                        {dim.levels.map(lv => (
                          <button
                            key={lv.level}
                            className={`wc-level-pill ${curVal === lv.level ? 'selected' : ''}`}
                            onClick={() => {
                              hapticLight()
                              setDimensionValues(prev => ({ ...prev, [dimId]: lv.level }))
                            }}
                            title={lv.description}
                          >
                            {lv.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Body prediction */}
                <div className="wc-level-row">
                  <div className="wc-level-label">How does your body feel thinking about this?</div>
                  <div className="wc-level-pills">
                    {DIFFICULTY_SCALE.map(ds => (
                      <button
                        key={ds.level}
                        className={`wc-level-pill wc-body-pill ${predictedDifficulty === ds.level ? 'selected' : ''}`}
                        onClick={() => { hapticLight(); setPredictedDifficulty(ds.level) }}
                        title={ds.description}
                      >
                        <span>{ds.icon}</span>
                        <span>{ds.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Courage score preview */}
                {Object.keys(dimensionValues).length > 0 && (
                  <div className="wc-courage-preview">
                    Courage score: {calculateCourageScore(dimensionValues).toFixed(1)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Which voice is holding you back? */}
        {freeText.trim() && linkedQuestId && expansionDims.length > 0 && (
          <div className="wc-step">
            <div className="wc-step-q">Which voice is holding you back?</div>
            <div className="wc-voice-options">
              {VOICE_LIES.map(v => (
                <button
                  key={v.voice}
                  className={`wc-voice-btn ${protectiveVoice === v.voice ? 'active' : ''}`}
                  onClick={() => { hapticLight(); setProtectiveVoice(v.voice) }}
                >
                  <span className="wc-voice-icon">{v.icon}</span>
                  <span className="wc-voice-lie">{v.lie}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="wc-error">{error}</p>}

        <button className="wc-cta" disabled={!canSubmit} onClick={handleSubmit}>
          {generating ? 'Saving...' : 'Add courage challenge'}
        </button>

        {bucketList.length > 0 && linkedQuestId && (
          <button
            className="wc-text-link"
            onClick={() => { hapticLight(); setError(null); setStep('fromlist') }}
          >
            Or choose from your list ({bucketList.length} waiting)
          </button>
        )}
      </div>
    </div>
  )
}
