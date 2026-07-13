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
  onWahooAccepted,
  onClose,
}) {
  const [step, setStep] = useState('freetext')
  const [freeText, setFreeText] = useState('')
  const [linkedQuestId, setLinkedQuestId] = useState(null)
  const [depthLevel, setDepthLevel] = useState(null)
  const [visibilityLayers, setVisibilityLayers] = useState([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
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
      const { data: dbRecord, error: saveError } = await createGroanChallenge({
        userId,
        title: freeText.trim(),
        description: freeText.trim(),
        visibilityLayer: visibilityLayers[0] || 'screen',
        sourceType: 'skill',
        sourceLabel: 'Free text',
        depthLevel,
        visibilityLayers,
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
      onWahooAccepted?.()
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
  const canSubmit = freeText.trim() && linkedQuestId && depthLevel && !generating

  return (
    <div className="wc-container">
      <div className="wc-header">
        <h3 className="wc-title">Add a Wahoo</h3>
        <p className="wc-explainer">Something you&apos;d love to do that scares you a little.</p>
      </div>

      <div className="wc-card">
        <h3 className="wc-card-title">What&apos;s the wahoo?</h3>
        <textarea
          className="wc-textarea"
          placeholder="I want to..."
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          rows={2}
        />

        <div className="wc-field-label">Which life path is this for?</div>
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
