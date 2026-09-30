/**
 * DailyCheckin — Lightweight overlay on challenge page load.
 * "How are you right now?" with 4 state buttons.
 * Vibe Rise / Fun = single tap, done.
 * Pressure / Bored = drain capture + regulation exercise.
 */

import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { trackDailyCheckin } from '../lib/analytics'
import { getWeekStartLocal } from '../lib/dateUtils'
import { getScoringCategory } from '../lib/scoringCategories'
import { NERVOUS_SYSTEM_STATES } from '../lib/nervousSystemConstants'
import RegulationCard from './RegulationCard'
import {
  BoltIcon,
  FaceSmileIcon,
  ExclamationTriangleIcon,
  MinusCircleIcon,
  BriefcaseIcon,
  UserIcon,
  HomeIcon,
  DevicePhoneMobileIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/solid'
import './DailyCheckin.css'

const DRAIN_CATEGORIES = [
  { id: 'drain_work', label: 'Work', icon: <BriefcaseIcon style={{ width: 18, height: 18 }} /> },
  { id: 'drain_people', label: 'People', icon: <UserIcon style={{ width: 18, height: 18 }} /> },
  { id: 'drain_environment', label: 'Environment', icon: <HomeIcon style={{ width: 18, height: 18 }} /> },
  { id: 'drain_content', label: 'Content', icon: <DevicePhoneMobileIcon style={{ width: 18, height: 18 }} /> },
  { id: 'drain_commitment', label: 'Commitment', icon: <ClipboardDocumentListIcon style={{ width: 18, height: 18 }} /> },
]

// Map NS state IDs to Heroicon components for the daily checkin buttons
const NS_ICONS = {
  vibe_rise: <BoltIcon style={{ width: 24, height: 24, color: '#E9A23B' }} />,
  ventral: <FaceSmileIcon style={{ width: 24, height: 24, color: '#E9A23B' }} />,
  sympathetic: <ExclamationTriangleIcon style={{ width: 24, height: 24, color: '#E9A23B' }} />,
  dorsal: <MinusCircleIcon style={{ width: 24, height: 24, color: '#E9A23B' }} />,
}

const isDysregulated = (state) => state === 'sympathetic' || state === 'dorsal'

export default function DailyCheckin({ userId, onComplete }) {
  const [step, setStep] = useState('state')
  const [selectedState, setSelectedState] = useState(null)
  const [drainCategory, setDrainCategory] = useState(null)
  const [drainNote, setDrainNote] = useState('')
  const savingRef = useRef(false)

  const handleSelect = (stateId) => {
    if (savingRef.current) return
    setSelectedState(stateId)

    if (isDysregulated(stateId)) {
      // Pressure/Bored → drain capture screen
      setStep('drain')
    } else {
      // Vibe Rise / Fun → save immediately and close
      finishCheckin(stateId)
    }
  }

  const handleDrainContinue = () => {
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

  const finishCheckin = async (stateOverride) => {
    if (savingRef.current) return
    savingRef.current = true

    const state = stateOverride || selectedState

    await supabase.from('nervous_system_checkins').insert({
      user_id: userId,
      before_state: state,
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

    trackDailyCheckin({ state })
    setTimeout(() => onComplete(state), 300)
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
            <span className="daily-checkin-emoji"><BoltIcon style={{ width: 32, height: 32, color: '#5e17eb' }} /></span>
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
                  <span className="daily-checkin-btn-emoji">{NS_ICONS[state.id] || state.emoji}</span>
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
            <button type="button" className="daily-checkin-back" onClick={() => { setStep('state'); setSelectedState(null); setDrainCategory(null); setDrainNote('') }}>
              ← Back
            </button>
            <span className="daily-checkin-emoji">
              {selectedState === 'dorsal'
                ? <MinusCircleIcon style={{ width: 32, height: 32, color: '#6b7280' }} />
                : <ExclamationTriangleIcon style={{ width: 32, height: 32, color: '#ef4444' }} />}
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

        {step === 'regulation' && (
          <RegulationCard
            state={selectedState}
            onDone={finishCheckin}
            onSkip={finishCheckin}
            onBack={() => setStep('drain')}
          />
        )}
      </div>
    </div>
  )
}
