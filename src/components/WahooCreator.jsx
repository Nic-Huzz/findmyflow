/**
 * WahooCreator.jsx
 *
 * Wahoo creation for the Play-list tab.
 * Primary path: free text ("I know what I want to do") → category → save + activate.
 * Secondary path: "Choose from your list" → activate a queued bucket-list wahoo.
 *
 * Browse/AI-suggestion paths moved to WahooInspiration ("Need inspiration?").
 * Saves via createGroanChallenge + acceptGroanChallenge + priority_weekly_picks.
 *
 * CSS prefix: wc-
 * Created: 2026-05-09. Slimmed: 2026-06-12.
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
import { getWeekStartLocal } from '../lib/dateUtils'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './WahooCreator.css'

const WAHOO_CATEGORIES = [
  { id: 'appearance', name: 'Appearance', icon: '👤' },
  { id: 'creation', name: 'Creation', icon: '🎨' },
  { id: 'connection', name: 'Connection', icon: '🤝' },
]

export default function WahooCreator({
  userId,
  currentVisibilityLayer = 'screen', // from current level config
  bucketList = [], // queued wahoos from parent
  onWahooAccepted,
  onClose,
}) {
  const [step, setStep] = useState('freetext') // freetext | fromlist | success
  const [freeText, setFreeText] = useState('')
  const [wahooCategory, setWahooCategory] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const successTimerRef = useRef(null)

  useEffect(() => {
    return () => { if (successTimerRef.current) clearTimeout(successTimerRef.current) }
  }, [])

  // ─── Accept Challenge ───────────────────────────────────────────────────────

  async function acceptChallenge(challenge) {
    setGenerating(true)
    setError(null)

    try {
      const { data: dbRecord, error: saveError } = await createGroanChallenge({
        userId,
        title: challenge.title,
        description: challenge.description,
        visibilityLayer: challenge.visibilityLayer,
        sourceType: 'skill',
        sourceLabel: challenge.sourceLabel,
        scaryScore: challenge.scaryScore,
        wahooScore: challenge.wahooScore,
        wahooCategory: challenge.wahooCategory || wahooCategory,
      })
      if (saveError || !dbRecord) throw saveError || new Error('Challenge was not saved')

      const { error: acceptError } = await acceptGroanChallenge(dbRecord.id)
      if (acceptError) throw acceptError

      // Add to weekly picks
      const { error: pickError } = await supabase.from('priority_weekly_picks').insert({
        user_id: userId,
        week_start_date: getWeekStartLocal(),
        pick_type: 'groan',
        reference_id: dbRecord.id,
        display_name: challenge.title,
      })
      if (pickError) throw pickError

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

  // ─── Success ────────────────────────────────────────────────────────────────

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

  // ─── Choose from bucket list ────────────────────────────────────────────────

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
                    const { error: acceptError } = await acceptGroanChallenge(w.id)
                    if (acceptError) throw acceptError
                    await supabase.from('priority_weekly_picks').insert({
                      user_id: userId,
                      week_start_date: getWeekStartLocal(),
                      pick_type: 'groan',
                      reference_id: w.id,
                      display_name: w.title || w.challenge_text,
                    })
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
                {w.wahoo_category && (
                  <div className="wc-suggestion-desc">
                    {WAHOO_CATEGORIES.find(c => c.id === w.wahoo_category)?.icon} {WAHOO_CATEGORIES.find(c => c.id === w.wahoo_category)?.name}
                  </div>
                )}
              </button>
            ))}
          </div>

          {error && <p className="wc-error">{error}</p>}
        </div>
      </div>
    )
  }

  // ─── Free Text (default) ────────────────────────────────────────────────────

  return (
    <div className="wc-container">
      <div className="wc-header">
        <h3 className="wc-title">Choose Your Wahoo:</h3>
        <p className="wc-explainer">Every Wahoo is a rep. The more you practise expression with safety, the more Vibe Rise your nervous system can hold.</p>
      </div>

      <div className="wc-card">
        <h3 className="wc-card-title">What&apos;s something you&apos;d love to do that scares you a little?</h3>
        <p className="wc-card-sub">Anything goes. Host a silent disco, do magic tricks, post a vulnerable video, cold-call 5 strangers.</p>

        <textarea
          className="wc-textarea"
          placeholder="I want to..."
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          rows={3}
        />

        <div className="wc-inline-category">
          <span className="wc-inline-category-label">Category:</span>
          <div className="wc-inline-category-btns">
            {WAHOO_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`wc-inline-cat-btn ${wahooCategory === cat.id ? 'selected' : ''}`}
                onClick={() => { hapticLight(); setWahooCategory(cat.id) }}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="wc-error">{error}</p>}

        <button
          className="wc-cta"
          disabled={!freeText.trim() || !wahooCategory || generating}
          onClick={() => acceptChallenge({
            title: freeText.trim(),
            description: freeText.trim(),
            visibilityLayer: currentVisibilityLayer || 'screen',
            sourceLabel: 'Free text',
            scaryScore: 7,
            wahooScore: 7,
          })}
        >
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
