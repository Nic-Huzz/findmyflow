/**
 * DailyCheckin — Lightweight overlay on challenge page load.
 * "How are you right now?" with 4 state buttons. One-tap save.
 */

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { NERVOUS_SYSTEM_STATES } from '../lib/nervousSystemConstants'
import './DailyCheckin.css'

export default function DailyCheckin({ userId, onComplete }) {
  const [saving, setSaving] = useState(false)
  const [selectedState, setSelectedState] = useState(null)

  const handleSelect = async (stateId) => {
    if (saving) return
    setSelectedState(stateId)
    setSaving(true)

    await supabase.from('nervous_system_checkins').insert({
      user_id: userId,
      before_state: stateId,
      checkin_type: 'daily',
    })

    // Brief pause so the user sees their selection land
    setTimeout(() => onComplete(stateId), 400)
  }

  return (
    <div className="daily-checkin-overlay">
      <div className="daily-checkin-card">
        <button className="daily-checkin-skip" onClick={() => {
          // Mark as skipped so it doesn't show again today
          supabase.from('nervous_system_checkins').insert({
            user_id: userId,
            before_state: null,
            checkin_type: 'daily',
          }).then(() => {})
          onComplete(null)
        }}>
          Skip
        </button>
        <span className="daily-checkin-emoji">🧠</span>
        <h3 className="daily-checkin-title">How are you right now?</h3>
        <p className="daily-checkin-sub">Quick daily check-in to track your nervous system</p>
        <div className="daily-checkin-states">
          {NERVOUS_SYSTEM_STATES.map((state) => (
            <button
              key={state.id}
              type="button"
              className={`daily-checkin-btn ${selectedState === state.id ? 'selected' : ''} ${state.id === 'vibe_rise' ? 'daily-checkin-vibe-rise' : ''}`}
              onClick={() => handleSelect(state.id)}
              disabled={saving}
            >
              <span className="daily-checkin-btn-emoji">{state.emoji}</span>
              <span className="daily-checkin-btn-text">
                <span className="daily-checkin-btn-name">{state.name}</span>
                <span className="daily-checkin-btn-label">{state.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
