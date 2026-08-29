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

const EXPANSION_DIMENSIONS = [
  { id: 'duration', label: 'Duration', icon: '⏱', group: 'craft' },
  { id: 'frequency', label: 'Frequency', icon: '🔁', group: 'craft' },
  { id: 'medium', label: 'Medium', icon: '📡', group: 'craft' },
  { id: 'people', label: 'People', icon: '👥', group: 'craft' },
  { id: 'money', label: 'Money', icon: '💰', group: 'scale' },
  { id: 'location', label: 'Location', icon: '📍', group: 'scale' },
  { id: 'independence', label: 'Independence', icon: '🚀', group: 'scale' },
]

const DEPTH_LEVELS = [
  { id: 'education', label: 'Learning about it', icon: '📚' },
  { id: 'testing', label: 'Tried it / testing it', icon: '🧪' },
  { id: 'practising', label: 'Do it regularly', icon: '🔄' },
  { id: 'charging', label: 'Getting paid for this', icon: '💰' },
  { id: 'teaching', label: 'Teaching / passing it on', icon: '🎓' },
]

// Fear options per depth level — each maps to a voice (or is ambiguous between two)
// `layer` maps to the groan_visibility_layer ENUM for backward compat
const FEAR_OPTIONS = {
  education: [
    { id: 'edu_perfect', label: 'I need to know everything before I start', voice: 'perfectionist', layer: 'vulnerable', ambiguous: ['perfectionist', 'controller'] },
    { id: 'edu_hide', label: 'I don\'t want people to know I\'m searching', voice: 'ghost', layer: 'authority' },
    { id: 'edu_phase', label: 'People will think this is a phase', voice: 'people-pleaser', layer: 'live' },
    { id: 'edu_research', label: 'I can\'t commit until I\'ve researched every option', voice: 'controller', layer: 'money', ambiguous: ['controller', 'perfectionist'] },
    { id: 'edu_abandon', label: 'I\'ll start this and abandon it like everything else', voice: 'auto-pilot', layer: 'screen' },
  ],
  testing: [
    { id: 'test_seen', label: 'I\'ll be seen failing at something new', voice: 'ghost', layer: 'live' },
    { id: 'test_good', label: 'My first attempt won\'t be good enough', voice: 'perfectionist', layer: 'vulnerable' },
    { id: 'test_explain', label: 'I\'ll have to explain why I\'m doing this', voice: 'people-pleaser', layer: 'live' },
    { id: 'test_polish', label: 'I can\'t let anyone see until it\'s polished', voice: 'controller', layer: 'screen', ambiguous: ['controller', 'perfectionist'] },
    { id: 'test_once', label: 'I tried it once, maybe that\'s enough', voice: 'auto-pilot', layer: 'screen' },
  ],
  practising: [
    { id: 'prac_image', label: 'I need to manage how people see my progress', voice: 'controller', layer: 'authority' },
    { id: 'prac_outgrow', label: 'I\'ll outgrow my circle and end up alone', voice: 'ghost', layer: 'live', ambiguous: ['ghost', 'people-pleaser'] },
    { id: 'prac_uncomf', label: 'My growth is making people around me uncomfortable', voice: 'people-pleaser', layer: 'live' },
    { id: 'prac_plateau', label: 'I\'ve plateaued and I\'m not improving fast enough', voice: 'perfectionist', layer: 'vulnerable' },
    { id: 'prac_motions', label: 'I\'m just going through the motions now', voice: 'auto-pilot', layer: 'screen' },
  ],
  charging: [
    { id: 'charge_worth', label: 'I\'m not good enough to charge for this', voice: 'perfectionist', layer: 'money', ambiguous: ['perfectionist', 'people-pleaser'] },
    { id: 'charge_no', label: 'I\'d rather give it away than face someone saying no', voice: 'ghost', layer: 'money' },
    { id: 'charge_offer', label: 'I need the perfect offer before I can sell', voice: 'controller', layer: 'money', ambiguous: ['controller', 'perfectionist'] },
    { id: 'charge_price', label: 'I\'ll price based on what they want to pay, not what it\'s worth', voice: 'people-pleaser', layer: 'money' },
    { id: 'charge_free', label: 'I\'ll just keep doing it for free, it\'s easier', voice: 'auto-pilot', layer: 'money' },
  ],
  teaching: [
    { id: 'teach_ask', label: 'Someone will ask something I can\'t answer', voice: 'perfectionist', layer: 'authority' },
    { id: 'teach_control', label: 'I need to control every outcome for my students', voice: 'controller', layer: 'authority' },
    { id: 'teach_target', label: 'Being seen as an authority makes me a target', voice: 'ghost', layer: 'authority' },
    { id: 'teach_spark', label: 'I\'ve been doing this so long I\'ve lost the spark', voice: 'auto-pilot', layer: 'vulnerable' },
    { id: 'teach_water', label: 'I\'ll water down my teaching to keep everyone happy', voice: 'people-pleaser', layer: 'live' },
  ],
}

// Disambiguation descriptions for ambiguous pairs
const DISAMBIG_DESC = {
  perfectionist: 'It\'s not ready yet, I need it to be perfect',
  controller: 'I need to control every variable before I move',
  ghost: 'I want to pull away before anyone notices',
  'people-pleaser': 'I don\'t want to make anyone uncomfortable',
  'auto-pilot': 'It\'s easier to just check out',
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
  const [depthLevel, setDepthLevel] = useState(null)
  const [selectedFear, setSelectedFear] = useState(null) // the fear option object
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [protectiveVoice, setProtectiveVoice] = useState(null)
  const [showDisambig, setShowDisambig] = useState(false) // voice disambiguation popup
  const [wantsHealing, setWantsHealing] = useState(null) // null | 'yes' | 'no'
  const [expansionDims, setExpansionDims] = useState([]) // expansion dimension tags
  const [healingTiming, setHealingTiming] = useState(null) // null | 'now' | 'later'
  const successTimerRef = useRef(null)

  useEffect(() => {
    return () => { if (successTimerRef.current) clearTimeout(successTimerRef.current) }
  }, [])

  function handleFearSelect(fear) {
    hapticLight()
    setSelectedFear(fear)
    if (fear.ambiguous) {
      // Ambiguous — show disambiguation popup, clear stale voice
      setProtectiveVoice(null)
      setShowDisambig(true)
    } else {
      // Clean mapping — auto-tag voice
      setProtectiveVoice(fear.voice)
      setShowDisambig(false)
    }
    setWantsHealing(null)
    setHealingTiming(null)
  }

  function handleDisambig(voiceId) {
    hapticLight()
    setProtectiveVoice(voiceId)
    setShowDisambig(false)
  }

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

          // Auto-bump quest depth (high watermark — only goes up, never down)
          if (depthLevel) {
            const DEPTH_ORDER = { education: 0, testing: 1, practising: 2, charging: 3, teaching: 4 }
            const { data: quest } = await supabase
              .from('quests')
              .select('depth_level')
              .eq('id', linkedQuestId)
              .single()
            if ((DEPTH_ORDER[depthLevel] ?? -1) > (DEPTH_ORDER[quest?.depth_level] ?? -1)) {
              await supabase
                .from('quests')
                .update({ depth_level: depthLevel })
                .eq('id', linkedQuestId)
            }
          }
        } catch (e) { /* non-blocking */ }
      }

      // Save healing intention if protective voice was identified
      if (protectiveVoice && linkedQuestId) {
        const { data: taskRow } = await supabase
          .from('quest_tasks')
          .select('id')
          .eq('groan_challenge_id', dbRecord.id)
          .maybeSingle()
        if (taskRow) {
          await supabase.from('healing_intentions').upsert({
            quest_task_id: taskRow.id,
            user_id: userId,
            protective_voice: protectiveVoice,
            pattern: protectiveVoice,
            healing_stage: 'pending',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'quest_task_id' }).then(() => {}).catch(() => {})
        }
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

  const canSubmit = freeText.trim() && linkedQuestId && !generating

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

        {/* Step 2: What capacity are you building? */}
        {freeText.trim() && linkedQuestId && (
          <div className="wc-step">
            <div className="wc-step-q">What capacity are you building?</div>
            <div className="wc-dim-grid">
              {EXPANSION_DIMENSIONS.map(d => {
                const active = expansionDims.includes(d.id)
                return (
                  <button
                    key={d.id}
                    className={`wc-dim-option ${active ? (d.group === 'scale' ? 'scale-active' : 'active') : ''}`}
                    onClick={() => {
                      hapticLight()
                      setExpansionDims(prev =>
                        active ? prev.filter(x => x !== d.id) : [...prev, d.id]
                      )
                    }}
                  >
                    <span className="wc-dim-icon">{d.icon}</span>
                    <span className="wc-dim-name">{d.label}</span>
                  </button>
                )
              })}
            </div>
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
