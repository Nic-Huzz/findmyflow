/**
 * GarbageCanFlow — Evening emotional hygiene ritual.
 * 3-screen flow: Clear bad moments (dismiss drain/stall cards) → Frame good moment → Done.
 * Surfaces today's actual logged drains/stalls from nervous_system_checkins.
 *
 * CSS prefix: gcf-
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getTodayLocal } from '../lib/dateUtils'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import confetti from 'canvas-confetti'
import './GarbageCanFlow.css'

const DRAIN_CATEGORIES = {
  drain_work: { icon: '💼', label: 'Work' },
  drain_people: { icon: '👤', label: 'People' },
  drain_environment: { icon: '🏠', label: 'Environment' },
  drain_content: { icon: '📱', label: 'Content' },
  drain_commitment: { icon: '📋', label: 'Commitment' },
  stall_work: { icon: '💼', label: 'Work' },
  stall_people: { icon: '👤', label: 'People' },
  stall_environment: { icon: '🏠', label: 'Environment' },
  stall_content: { icon: '📱', label: 'Content' },
  stall_commitment: { icon: '📋', label: 'Commitment' },
}

export default function GarbageCanFlow({ userId, onComplete, onClose }) {
  const [step, setStep] = useState(1)
  const [todayCheckins, setTodayCheckins] = useState([])
  const [dismissed, setDismissed] = useState(new Set())
  const [customBad, setCustomBad] = useState('')
  const [customDismissed, setCustomDismissed] = useState(false)
  const [framedMoment, setFramedMoment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!userId) return
    const todayStart = getTodayLocal()

    supabase
      .from('nervous_system_checkins')
      .select('id, checkin_type, source_quest_id, drain_note, after_state')
      .eq('user_id', userId)
      .gte('created_at', todayStart)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTodayCheckins(data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [userId])

  const hasCheckins = todayCheckins.length > 0
  const allDismissed = hasCheckins
    ? dismissed.size >= todayCheckins.length
    : customDismissed

  function handleDismiss(id) {
    hapticLight()
    setDismissed(prev => new Set([...prev, id]))
  }

  function handleDismissCustom() {
    if (!customBad.trim()) return
    hapticLight()
    setCustomDismissed(true)
  }

  function handleDone() {
    if (saving) return
    setSaving(true)
    hapticSuccess()
    confetti({ particleCount: 50, spread: 45, origin: { y: 0.6 }, ticks: 100, gravity: 1.4, scalar: 0.8 })
    onComplete?.({
      quest_type: 'garbage_can',
      thrown_checkin_ids: [...dismissed],
      thrown_custom: !hasCheckins && customBad.trim() ? customBad.trim() : null,
      framed_moment: framedMoment.trim() || null,
    })
  }

  if (loading) {
    return (
      <div className="gcf-overlay" onClick={onClose}>
        <div className="gcf-modal" onClick={e => e.stopPropagation()}>
          <div className="gcf-loading"><div className="spinner" /></div>
        </div>
      </div>
    )
  }

  return (
    <div className="gcf-overlay" onClick={onClose}>
      <div className="gcf-modal" onClick={e => e.stopPropagation()}>
        <button className="gcf-close" onClick={onClose}>&times;</button>

        {step === 1 && (
          <div className="gcf-screen">
            <h3 className="gcf-title">Clear the day</h3>

            {hasCheckins ? (
              <>
                <p className="gcf-copy">
                  Freeze-frame each one. Shrink it down, drain the color, throw it in the bin.
                </p>
                <div className="gcf-cards">
                  {todayCheckins.map(c => {
                    const cat = DRAIN_CATEGORIES[c.source_quest_id]
                    const isDismissed = dismissed.has(c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`gcf-card ${isDismissed ? 'thrown' : ''}`}
                        onClick={() => !isDismissed && handleDismiss(c.id)}
                        disabled={isDismissed}
                      >
                        <span className="gcf-card-icon">{cat?.icon || '⚡'}</span>
                        <div className="gcf-card-body">
                          <span className="gcf-card-type">
                            {c.checkin_type === 'stall' ? 'Stall' : 'Drain'} · {cat?.label || ''}
                          </span>
                          {c.drain_note && !c.drain_note.startsWith('[rescript]') && (
                            <span className="gcf-card-note">{c.drain_note.split('\n')[0].slice(0, 60)}</span>
                          )}
                        </div>
                        <span className="gcf-card-action">{isDismissed ? '🗑️' : 'Tap'}</span>
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <>
                <p className="gcf-copy">
                  Anything from today that's still sitting with you?
                </p>
                {!customDismissed ? (
                  <>
                    <input
                      type="text"
                      className="gcf-custom-input"
                      value={customBad}
                      onChange={e => setCustomBad(e.target.value)}
                      placeholder="The thing that bugged me..."
                      maxLength={100}
                    />
                    <button
                      type="button"
                      className="gcf-throw-btn"
                      disabled={!customBad.trim()}
                      onClick={handleDismissCustom}
                    >
                      Throw it away
                    </button>
                  </>
                ) : (
                  <div className="gcf-thrown-text">Gone.</div>
                )}
              </>
            )}

            <div className="gcf-step1-actions">
              {allDismissed && (
                <button
                  type="button"
                  className="gcf-next"
                  onClick={() => { hapticLight(); setStep(2) }}
                >
                  Next
                </button>
              )}
              {!allDismissed && (
                <button
                  type="button"
                  className="gcf-skip-link"
                  onClick={() => { hapticLight(); setStep(2) }}
                >
                  {hasCheckins ? 'Skip the rest' : 'Nothing today'}
                </button>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="gcf-screen">
            <h3 className="gcf-title">Keep the good</h3>
            <p className="gcf-copy">
              Now think of one good moment from today. It can be small.
            </p>
            <input
              type="text"
              className="gcf-framed-input"
              value={framedMoment}
              onChange={e => setFramedMoment(e.target.value)}
              placeholder="The moment when..."
              maxLength={100}
              autoFocus
            />
            <p className="gcf-amplify">Make it bigger. Brighter. Full color. Frame it.</p>
            <button
              type="button"
              className="gcf-next"
              onClick={() => { hapticLight(); setStep(3) }}
            >
              Framed
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="gcf-screen">
            <h3 className="gcf-title">Day cleared</h3>
            <p className="gcf-copy">Sleep well.</p>
            <button type="button" className="gcf-done" disabled={saving} onClick={handleDone}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
