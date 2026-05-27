/**
 * DailyCheckin — Lightweight overlay on challenge page load.
 * "How are you right now?" with 4 state buttons.
 * After selection: shows a regulation exercise (turns diagnosis into medicine).
 */

import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { NERVOUS_SYSTEM_STATES } from '../lib/nervousSystemConstants'
import RegulationCard from './RegulationCard'
import './DailyCheckin.css'

export default function DailyCheckin({ userId, onComplete }) {
  const [selectedState, setSelectedState] = useState(null)
  const [showRegulation, setShowRegulation] = useState(false)
  const savingRef = useRef(false)

  const handleSelect = (stateId) => {
    if (savingRef.current) return
    setSelectedState(stateId)
    setShowRegulation(true)
  }

  const handleBack = () => {
    setShowRegulation(false)
    setSelectedState(null)
  }

  const finishCheckin = async () => {
    if (savingRef.current) return
    savingRef.current = true

    // Best-effort save — proceed even on error so the modal doesn't freeze
    await supabase.from('nervous_system_checkins').insert({
      user_id: userId,
      before_state: selectedState,
      checkin_type: 'daily',
    })

    setTimeout(() => onComplete(selectedState), 300)
  }

  return (
    <div className="daily-checkin-overlay">
      <div className="daily-checkin-card">
        {!showRegulation ? (
          <>
            <button type="button" className="daily-checkin-skip" onClick={() => {
              supabase.from('nervous_system_checkins').insert({
                user_id: userId,
                before_state: null,
                checkin_type: 'daily',
              })
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
                >
                  <span className="daily-checkin-btn-emoji">{state.emoji}</span>
                  <span className="daily-checkin-btn-text">
                    <span className="daily-checkin-btn-name">{state.name}</span>
                    <span className="daily-checkin-btn-label">{state.label}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <RegulationCard
            state={selectedState}
            onDone={finishCheckin}
            onSkip={finishCheckin}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  )
}
