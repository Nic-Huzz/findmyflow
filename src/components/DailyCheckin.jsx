/**
 * DailyCheckin — Lightweight overlay on challenge page load.
 * "How are you right now?" with 4 state buttons.
 * Flow: State pick → Drain capture (sympathetic/dorsal only) → Regulation exercise.
 */

import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { trackDailyCheckin } from '../lib/analytics'
import { getWeekStartLocal } from '../lib/dateUtils'
import { getScoringCategory } from '../lib/scoringCategories'
import { NERVOUS_SYSTEM_STATES } from '../lib/nervousSystemConstants'
import RegulationCard from './RegulationCard'
import './DailyCheckin.css'

const DRAIN_CATEGORIES = [
  { id: 'drain_work', label: 'Work', icon: '💼' },
  { id: 'drain_people', label: 'People', icon: '👤' },
  { id: 'drain_environment', label: 'Environment', icon: '🏠' },
  { id: 'drain_content', label: 'Content', icon: '📱' },
  { id: 'drain_commitment', label: 'Commitment', icon: '📋' },
]

const BOOST_CATEGORIES = [
  { id: 'boost_wahoo', label: 'A Wahoo', icon: '⚡' },
  { id: 'boost_movement', label: 'Movement', icon: '🏃' },
  { id: 'boost_connection', label: 'Connection', icon: '👥' },
  { id: 'boost_nature', label: 'Nature', icon: '🌿' },
  { id: 'boost_creative', label: 'Creative', icon: '🎨' },
  { id: 'boost_rest', label: 'Rest', icon: '😌' },
]

const isDysregulated = (state) => state === 'sympathetic' || state === 'dorsal'

export default function DailyCheckin({ userId, onComplete }) {
  // Steps: 'state' → 'drain'|'boost' (conditional) → 'regulation'
  const [step, setStep] = useState('state')
  const [selectedState, setSelectedState] = useState(null)
  const [drainCategory, setDrainCategory] = useState(null)
  const [drainNote, setDrainNote] = useState('')
  const [boostCategory, setBoostCategory] = useState(null)
  const [boostNote, setBoostNote] = useState('')
  const savingRef = useRef(false)

  const handleSelect = (stateId) => {
    if (savingRef.current) return
    setSelectedState(stateId)
    if (isDysregulated(stateId)) setStep('drain')
    else if (stateId === 'vibe_rise') setStep('boost')
    else setStep('regulation')
  }

  const handleBackToState = () => {
    setStep('state')
    setSelectedState(null)
    setDrainCategory(null)
    setDrainNote('')
    setBoostCategory(null)
    setBoostNote('')
  }

  const handleDrainContinue = () => {
    // Save drain as a separate checkin row (best-effort, don't block)
    if (drainCategory) {
      supabase.from('nervous_system_checkins').insert({
        user_id: userId,
        after_state: selectedState,
        checkin_type: 'drain',
        source_quest_id: drainCategory,
        drain_note: drainNote.trim() || null,
      })
    }
    setStep('regulation')
  }

  const handleBoostContinue = () => {
    if (boostCategory) {
      supabase.from('nervous_system_checkins').insert({
        user_id: userId,
        after_state: 'vibe_rise',
        checkin_type: 'boost',
        source_quest_id: boostCategory,
        drain_note: boostNote.trim() || null,
      })
    }
    setStep('regulation')
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

    // Award +2 RP for showing up (all states equal — Celeste model)
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
      // Date-stamped quest_id prevents double-awarding. Dupe insert fails silently.
      console.warn('Daily checkin RP:', e?.message?.includes('duplicate') ? 'already awarded today' : e)
    }

    trackDailyCheckin({ state: selectedState })

    setTimeout(() => onComplete(selectedState), 300)
  }

  return (
    <div className="daily-checkin-overlay">
      <div className="daily-checkin-card">
        {step === 'state' && (
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
        )}

        {step === 'drain' && (
          <div className="daily-checkin-drain">
            <button type="button" className="daily-checkin-back" onClick={handleBackToState}>
              ← Back
            </button>
            <span className="daily-checkin-emoji">
              {selectedState === 'dorsal' ? '😶' : '😬'}
            </span>
            <h3 className="daily-checkin-title">What created this?</h3>
            <p className="daily-checkin-sub">Naming it is the first step back</p>

            <div className="daily-checkin-drain-cats">
              {DRAIN_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`daily-checkin-drain-cat ${drainCategory === cat.id ? 'selected' : ''}`}
                  onClick={() => setDrainCategory(drainCategory === cat.id ? null : cat.id)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {drainCategory && (
              <textarea
                className="daily-checkin-drain-note"
                placeholder="What specifically? (optional)"
                value={drainNote}
                onChange={(e) => setDrainNote(e.target.value)}
                rows={2}
                maxLength={200}
              />
            )}

            <div className="daily-checkin-drain-actions">
              <button
                type="button"
                className="daily-checkin-drain-skip"
                onClick={() => setStep('regulation')}
              >
                Skip
              </button>
              <button
                type="button"
                className="daily-checkin-drain-save"
                onClick={handleDrainContinue}
                disabled={!drainCategory}
              >
                {drainCategory ? 'Log it' : 'Pick one above'}
              </button>
            </div>
          </div>
        )}

        {step === 'boost' && (
          <div className="daily-checkin-drain daily-checkin-boost">
            <button type="button" className="daily-checkin-back" onClick={handleBackToState}>
              ← Back
            </button>
            <span className="daily-checkin-emoji">⚡</span>
            <h3 className="daily-checkin-title">What created this?</h3>
            <p className="daily-checkin-sub">Knowing your fuel helps you find more of it</p>

            <div className="daily-checkin-drain-cats">
              {BOOST_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`daily-checkin-drain-cat ${boostCategory === cat.id ? 'selected boost-selected' : ''}`}
                  onClick={() => setBoostCategory(boostCategory === cat.id ? null : cat.id)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {boostCategory && (
              <textarea
                className="daily-checkin-drain-note daily-checkin-boost-note"
                placeholder="What specifically? (optional)"
                value={boostNote}
                onChange={(e) => setBoostNote(e.target.value)}
                rows={2}
                maxLength={200}
              />
            )}

            <div className="daily-checkin-drain-actions">
              <button
                type="button"
                className="daily-checkin-drain-skip"
                onClick={() => setStep('regulation')}
              >
                Skip
              </button>
              <button
                type="button"
                className="daily-checkin-drain-save daily-checkin-boost-save"
                onClick={handleBoostContinue}
                disabled={!boostCategory}
              >
                {boostCategory ? 'Log it' : 'Pick one above'}
              </button>
            </div>
          </div>
        )}

        {step === 'regulation' && (
          <RegulationCard
            state={selectedState}
            onDone={finishCheckin}
            onSkip={finishCheckin}
            onBack={isDysregulated(selectedState) ? () => setStep('drain') : selectedState === 'vibe_rise' ? () => setStep('boost') : handleBackToState}
          />
        )}
      </div>
    </div>
  )
}
