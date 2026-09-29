/**
 * DailyCheckin — Single-click overlay on challenge page load.
 * "How are you right now?" with 4 state buttons. Tap one and done.
 */

import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { trackDailyCheckin } from '../lib/analytics'
import { getWeekStartLocal } from '../lib/dateUtils'
import { getScoringCategory } from '../lib/scoringCategories'
import { NERVOUS_SYSTEM_STATES } from '../lib/nervousSystemConstants'
import './DailyCheckin.css'

export default function DailyCheckin({ userId, onComplete }) {
  const [selectedState, setSelectedState] = useState(null)
  const savingRef = useRef(false)

  const handleSelect = async (stateId) => {
    if (savingRef.current) return
    savingRef.current = true
    setSelectedState(stateId)

    // Single-click checkin — save immediately and close
    await supabase.from('nervous_system_checkins').insert({
      user_id: userId,
      before_state: stateId,
      checkin_type: 'daily',
    })

    // Award +2 RP
    const today = new Date().toISOString().slice(0, 10)
    try {
      await supabase.from('quest_completions').insert({
        user_id: userId,
        quest_id: `daily_checkin_${today}`,
        quest_category: 'Tune',
        quest_type: 'DailyCheckin',
        points_earned: 2,
        challenge_day: 0,
        project_id: null,
      })
      await supabase.rpc('increment_scores', {
        p_user_id: userId,
        p_project_id: null,
        p_category: getScoringCategory('Tune'),
        p_points: 2,
        p_week_start: getWeekStartLocal(),
      })
    } catch (e) {
      console.warn('Daily checkin RP:', e?.message?.includes('duplicate') ? 'already awarded today' : e)
    }

    trackDailyCheckin({ state: stateId })
    setTimeout(() => onComplete(stateId), 300)
  }

  // Drain/boost/regulation handlers removed — single-click checkin

  return (
    <div className="daily-checkin-overlay">
      <div className="daily-checkin-card">
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
      </div>
    </div>
  )
}
