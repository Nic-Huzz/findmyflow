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

const PROTECTIVE_VOICES = [
  { id: 'controller', name: 'Controller', icon: '🧱', desc: 'Takes over, pushes too hard' },
  { id: 'ghost', name: 'Ghost', icon: '👻', desc: 'Disappears, avoids, goes quiet' },
  { id: 'people-pleaser', name: 'People Pleaser', icon: '🪞', desc: 'Says yes when you mean no' },
  { id: 'auto-pilot', name: 'Auto-Pilot', icon: '🤖', desc: 'Goes through the motions, checks out' },
  { id: 'perfectionist', name: 'Perfectionist', icon: '🎯', desc: 'Won\'t start until it\'s perfect' },
]

const DEPTH_LEVELS = [
  { id: 'education', label: 'Learning about it', icon: '📚' },
  { id: 'testing', label: 'Tried it / testing it', icon: '🧪' },
  { id: 'practising', label: 'Do it regularly', icon: '🔄' },
  { id: 'charging', label: 'Getting paid for this', icon: '💰' },
  { id: 'teaching', label: 'Teaching / passing it on', icon: '🎓' },
]

const VISIBILITY_EXAMPLES = {
  education: [
    { id: 'screen', label: 'Share what I\'m learning', icon: '📱' },
    { id: 'live', label: 'Attend a talk or class', icon: '👥' },
    { id: 'money', label: 'Invest in a course or book', icon: '💳' },
    { id: 'vulnerable', label: 'Admit I don\'t know yet', icon: '💜' },
    { id: 'authority', label: 'Let people know I\'m curious', icon: '🌟' },
  ],
  testing: [
    { id: 'screen', label: 'Share my first experience', icon: '📱' },
    { id: 'live', label: 'Go to a class or session', icon: '👥' },
    { id: 'money', label: 'Buy what I need to get started', icon: '💳' },
    { id: 'vulnerable', label: 'Tell someone I\'m a beginner', icon: '💜' },
    { id: 'authority', label: 'Be known as exploring this', icon: '🌟' },
  ],
  practising: [
    { id: 'screen', label: 'Share my journey so far', icon: '📱' },
    { id: 'live', label: 'Join regular practice groups', icon: '👥' },
    { id: 'money', label: 'Invest in going deeper', icon: '💳' },
    { id: 'vulnerable', label: 'Share my struggles', icon: '💜' },
    { id: 'authority', label: 'Be known as someone who does this', icon: '🌟' },
  ],
  charging: [
    { id: 'screen', label: 'Create a professional presence', icon: '📱' },
    { id: 'live', label: 'Run a paid session in person', icon: '👥' },
    { id: 'money', label: 'Set my price and stand by it', icon: '💳' },
    { id: 'vulnerable', label: 'Show my process, not just results', icon: '💜' },
    { id: 'authority', label: 'Be known as a professional', icon: '🌟' },
  ],
  teaching: [
    { id: 'screen', label: 'Create teaching content', icon: '📱' },
    { id: 'live', label: 'Train others in person', icon: '👥' },
    { id: 'money', label: 'Build revenue from teaching', icon: '💳' },
    { id: 'vulnerable', label: 'Teach honestly, including what I don\'t know', icon: '💜' },
    { id: 'authority', label: 'Be the go-to person', icon: '🌟' },
  ],
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
  const [visibilityLayers, setVisibilityLayers] = useState([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [protectiveVoice, setProtectiveVoice] = useState(null)
  const [wantsHealing, setWantsHealing] = useState(null) // null | 'yes' | 'no'
  const [healingTiming, setHealingTiming] = useState(null) // null | 'now' | 'later'
  const successTimerRef = useRef(null)

  useEffect(() => {
    return () => { if (successTimerRef.current) clearTimeout(successTimerRef.current) }
  }, [])

  function toggleVisibility(id) {
    setVisibilityLayers(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    )
  }

  async function handleSubmit() {
    if (!freeText.trim() || !linkedQuestId || !depthLevel || generating) return
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
        visibilityLayer: visibilityLayers[0] || 'screen',
        sourceType: 'skill',
        sourceLabel: sourceLabel || 'Courage',
        depthLevel,
        visibilityLayers,
        questId: linkedQuestId || null,
      })
      if (saveError || !dbRecord) throw saveError || new Error('Challenge was not saved')

      const { error: acceptError } = await acceptGroanChallenge(dbRecord.id)
      if (acceptError) throw acceptError

      await supabase.from('priority_weekly_picks').upsert({
        user_id: userId,
        week_start_date: getWeekStartLocal(),
        pick_type: 'groan',
        reference_id: dbRecord.id,
        display_name: freeText.trim(),
      }, { onConflict: 'user_id,week_start_date,pick_type,reference_id', ignoreDuplicates: true })

      if (linkedQuestId) {
        try {
          // Tag courage challenge with skills
          const { classifyTaskSkills } = await import('../lib/questSkillTagger')
          const taskSkills = classifyTaskSkills(freeText.trim())
          // Courage challenges use quest fallback if keyword classifier misses
          let linkedQuestSkills = null
          if (!taskSkills) {
            const { data: q } = await supabase.from('quests').select('skill_tags').eq('id', linkedQuestId).maybeSingle()
            linkedQuestSkills = q?.skill_tags || null
          }

          await supabase.from('quest_tasks').insert({
            quest_id: linkedQuestId,
            user_id: userId,
            text: freeText.trim(),
            is_courage_challenge: true,
            groan_challenge_id: dbRecord.id,
            sort_order: 0,
            skill_tags: taskSkills || linkedQuestSkills,
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
      if (protectiveVoice && linkedQuestId && wantsHealing !== null) {
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
            healing_stage: wantsHealing === 'yes' ? 'in_progress' : 'in_progress',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'quest_task_id' }).then(() => {}).catch(() => {})
        }
      }

      hapticSuccess()

      // If user chose "dig in now", pass the task ID + voice so parent can open HealingFlowModal
      if (wantsHealing === 'yes' && healingTiming === 'now') {
        const { data: taskRow } = await supabase
          .from('quest_tasks')
          .select('id, text')
          .eq('groan_challenge_id', dbRecord.id)
          .maybeSingle()
        onWahooAccepted?.(taskRow || null, protectiveVoice)
      } else {
        onWahooAccepted?.(null, null)
      }
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
                    await supabase.from('priority_weekly_picks').upsert({
                      user_id: userId,
                      week_start_date: getWeekStartLocal(),
                      pick_type: 'groan',
                      reference_id: w.id,
                      display_name: w.title || w.challenge_text,
                    }, { onConflict: 'user_id,week_start_date,pick_type,reference_id', ignoreDuplicates: true })
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

  const visOptions = depthLevel ? VISIBILITY_EXAMPLES[depthLevel] : []
  const healingComplete = !protectiveVoice || (wantsHealing === 'no') || (wantsHealing === 'yes' && healingTiming !== null)
  const canSubmit = freeText.trim() && linkedQuestId && depthLevel && healingComplete && !generating

  return (
    <div className="wc-container">
      <div className="wc-header">
        <h3 className="wc-title">Add a Courage Challenge</h3>
        <p className="wc-explainer">Something you&apos;d love to do that scares you a little.</p>
      </div>

      <div className="wc-card">
        <h3 className="wc-card-title">What&apos;s the challenge?</h3>
        <textarea
          className="wc-textarea"
          placeholder="I want to..."
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          rows={2}
        />
        <p className="wc-hint">e.g. &quot;Host a breathwork session at a retreat&quot; or &quot;Cold call 10 venue owners&quot;</p>

        <QuestSelector userId={userId} value={linkedQuestId}
          onChange={(id) => setLinkedQuestId(id)} />

        <div className="wc-field-label">Where are you with this?</div>
        <div className="wc-depth-options">
          {DEPTH_LEVELS.map(d => (
            <button
              key={d.id}
              className={`wc-depth-btn ${depthLevel === d.id ? 'selected' : ''}`}
              onClick={() => { hapticLight(); setDepthLevel(d.id); setVisibilityLayers([]) }}
            >
              <span className="wc-depth-icon">{d.icon}</span>
              <span className="wc-depth-label">{d.label}</span>
            </button>
          ))}
        </div>

        {depthLevel && (
          <>
            <div className="wc-field-label">What part pushes your boundary?</div>
            <div className="wc-vis-options">
              {visOptions.map(v => (
                <button
                  key={v.id}
                  className={`wc-vis-btn ${visibilityLayers.includes(v.id) ? 'selected' : ''}`}
                  onClick={() => { hapticLight(); toggleVisibility(v.id) }}
                >
                  <span className="wc-vis-icon">{v.icon}</span>
                  <span className="wc-vis-label">{v.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Protective voice (optional) */}
        {depthLevel && (
          <>
            <div className="wc-field-label">What voice tries to stop you?</div>
            <div className="wc-vis-options">
              {PROTECTIVE_VOICES.map(v => (
                <button
                  key={v.id}
                  className={`wc-vis-btn ${protectiveVoice === v.id ? 'selected' : ''}`}
                  onClick={() => { hapticLight(); setProtectiveVoice(protectiveVoice === v.id ? null : v.id); setWantsHealing(null); setHealingTiming(null) }}
                >
                  <span className="wc-vis-icon">{v.icon}</span>
                  <span className="wc-vis-label">{v.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Healing prompt (only if voice selected) */}
        {protectiveVoice && wantsHealing === null && (
          <div className="wc-healing-prompt">
            <div className="wc-field-label">Keen to explore why?</div>
            <div className="wc-healing-buttons">
              <button className="wc-healing-btn yes" onClick={() => { hapticLight(); setWantsHealing('yes') }}>
                Yes, dig in 💚
              </button>
              <button className="wc-healing-btn no" onClick={() => { hapticLight(); setWantsHealing('no') }}>
                No, all good
              </button>
            </div>
          </div>
        )}

        {/* Timing (only if wants healing) */}
        {wantsHealing === 'yes' && healingTiming === null && (
          <div className="wc-healing-prompt">
            <div className="wc-healing-buttons">
              <button className="wc-healing-btn yes" onClick={() => { hapticLight(); setHealingTiming('now') }}>
                Dive in now 💚
              </button>
              <button className="wc-healing-btn later" onClick={() => { hapticLight(); setHealingTiming('later') }}>
                Later
              </button>
            </div>
          </div>
        )}

        {error && <p className="wc-error">{error}</p>}

        <button className="wc-cta" disabled={!canSubmit} onClick={handleSubmit}>
          {generating ? 'Saving...' : 'Submit'}
        </button>

        {bucketList.length > 0 && (
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
