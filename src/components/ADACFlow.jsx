/**
 * ADACFlow — 4-step emotional defusing exercise.
 * Acknowledge → Dissociate → Anchor → Change.
 * Fires after logging a drain. Removes emotional charge from the trigger.
 *
 * CSS prefix: adac-
 */

import { useState, useEffect } from 'react'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import { supabase } from '../lib/supabaseClient'
import './ADACFlow.css'

const FEELING_PILLS = [
  'Angry', 'Frustrated', 'Hurt', 'Anxious', 'Drained', 'Resentful', 'Sad',
]

export default function ADACFlow({ userId, onComplete, onSkip }) {
  const [step, setStep] = useState(1)
  const [feeling, setFeeling] = useState(null)
  const [customFeeling, setCustomFeeling] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [anchor, setAnchor] = useState('')
  const [lastAnchor, setLastAnchor] = useState(null)
  const [done, setDone] = useState(false)

  // Load last anchor from previous ADAC sessions
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    supabase
      .from('nervous_system_checkins')
      .select('drain_note')
      .eq('user_id', userId)
      .eq('checkin_type', 'drain')
      .not('drain_note', 'is', null)
      .like('drain_note', '%[adac]%')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (cancelled || !data?.[0]?.drain_note) return
        const match = data[0].drain_note.match(/anchor:\s*(.+?)(?:\n|$)/)
        if (match?.[1]) setLastAnchor(match[1].trim())
      })
    return () => { cancelled = true }
  }, [userId])

  const feelingText = feeling === 'custom' ? customFeeling.trim() : feeling

  function handleDone() {
    if (done) return
    setDone(true)
    hapticSuccess()
    onComplete?.(feelingText, anchor.trim())
  }

  return (
    <div className="adac-container">
      {/* Step indicators */}
      <div className="adac-steps">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`adac-step-dot ${step >= s ? 'active' : ''}`} />
        ))}
      </div>

      {step === 1 && (
        <div className="adac-screen">
          <h4 className="adac-title">Name it</h4>
          <p className="adac-copy">What's the feeling right now? Don't judge it, just name it.</p>
          <div className="adac-pills">
            {FEELING_PILLS.map(f => (
              <button
                key={f}
                type="button"
                className={`adac-pill ${feeling === f ? 'selected' : ''}`}
                onClick={() => { hapticLight(); setFeeling(f); setShowCustom(false) }}
              >
                {f}
              </button>
            ))}
          </div>
          {!showCustom ? (
            <button
              type="button"
              className="adac-custom-toggle"
              onClick={() => { hapticLight(); setShowCustom(true); setFeeling('custom') }}
            >
              Something else
            </button>
          ) : (
            <input
              type="text"
              className="adac-custom-input"
              value={customFeeling}
              onChange={e => setCustomFeeling(e.target.value)}
              placeholder="I feel..."
              maxLength={60}
              autoFocus
            />
          )}
          <div className="adac-actions">
            <button type="button" className="adac-skip" onClick={onSkip}>Skip</button>
            <button
              type="button"
              className="adac-next"
              disabled={!feelingText}
              onClick={() => { hapticLight(); setStep(2) }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="adac-screen">
          <h4 className="adac-title">Step outside it</h4>
          <p className="adac-copy">
            Imagine floating up and watching yourself from across the room. See yourself sitting there with that feeling. You're safe up here, just watching.
          </p>
          <div className="adac-actions">
            <button type="button" className="adac-skip" onClick={onSkip}>Skip</button>
            <button
              type="button"
              className="adac-next"
              onClick={() => { hapticLight(); setStep(3) }}
            >
              I can see it
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="adac-screen">
          <h4 className="adac-title">Find your anchor</h4>
          <p className="adac-copy">
            Think of a time you felt completely calm and in control. Where were you? What could you see?
          </p>
          {lastAnchor && !anchor && (
            <button
              type="button"
              className="adac-pill selected"
              style={{ marginBottom: 12 }}
              onClick={() => { hapticLight(); setAnchor(lastAnchor) }}
            >
              {lastAnchor}
            </button>
          )}
          <input
            type="text"
            className="adac-anchor-input"
            value={anchor}
            onChange={e => setAnchor(e.target.value)}
            placeholder="I was..."
            maxLength={100}
            autoFocus={!lastAnchor}
          />
          <div className="adac-actions">
            <button type="button" className="adac-skip" onClick={onSkip}>Skip</button>
            <button
              type="button"
              className="adac-next"
              disabled={!anchor.trim()}
              onClick={() => { hapticLight(); setStep(4) }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="adac-screen">
          <h4 className="adac-title">Bring it back</h4>
          <p className="adac-copy">
            Now float back down into yourself, but bring that calm feeling with you. The trigger is still there, but the charge is gone.
          </p>
          <div className="adac-actions">
            <button type="button" className="adac-skip" onClick={onSkip}>Skip</button>
            <button type="button" className="adac-next" disabled={done} onClick={handleDone}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
