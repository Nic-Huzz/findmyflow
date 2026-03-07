/**
 * PriorityLayerCheckin.jsx
 *
 * Weekly graduation check-in. Self-contained 3-phase component:
 *   Phase 1: Action gate question (Yes / Not yet)
 *   Phase 2: Inline 4-question reassessment (if Yes)
 *   Phase 3: Celebration (if layer changed)
 */

import { useState, useEffect } from 'react'
import { TENSION_LAYER_DISPLAY } from '../lib/onboardingV2'
import { fetchJson } from '../lib/fetchJson'

const GRADUATION_QUESTIONS = {
  discover: 'This week, did you explain what you do to someone, and it felt true?',
  regulate: 'This week, were you able to notice fear without it stopping you from acting?',
  reveal: 'This week, did you do something publicly that felt scary?',
  value: 'This week, did you charge (or move toward charging) what your work is worth?',
}

export default function PriorityLayerCheckin({ priorityLayer, stageProgress, onComplete, onNotYet, onCelebrationDone }) {
  const [phase, setPhase] = useState('gate') // gate | reassess | celebration
  const [questions, setQuestions] = useState(null)
  const [scores, setScores] = useState({
    discover: stageProgress?.tension_discover ?? null,
    regulate: stageProgress?.tension_regulate ?? null,
    reveal: stageProgress?.tension_reveal ?? null,
    value: stageProgress?.tension_value ?? null,
  })
  const [saving, setSaving] = useState(false)
  const [graduationResult, setGraduationResult] = useState(null)

  const display = TENSION_LAYER_DISPLAY[priorityLayer]
  const gateQuestion = GRADUATION_QUESTIONS[priorityLayer]

  useEffect(() => {
    if (phase === 'reassess' && !questions) {
      fetchJson('/tension-assessment.json')
        .then(data => setQuestions(data.questions))
        .catch(err => console.error('Failed to load tension questions:', err))
    }
  }, [phase, questions])

  const allAnswered = scores.discover !== null && scores.regulate !== null &&
    scores.reveal !== null && scores.value !== null

  const handleSubmitReassessment = async () => {
    if (!allAnswered) return
    setSaving(true)
    const result = await onComplete({ scores })
    setSaving(false)
    if (result?.layerChanged) {
      setGraduationResult(result)
      setPhase('celebration')
    }
    // If no layer change, parent handles transition (state machine moves to picker)
  }

  // Phase 1: Gate
  if (phase === 'gate') {
    return (
      <div className="pt-checkin-card">
        <span className="pt-checkin-eyebrow">Weekly Check-in</span>
        <div className="pt-checkin-layer">
          <span className="pt-checkin-layer-emoji">{display?.emoji}</span>
          <span className="pt-checkin-layer-name">{display?.riverElement} — {display?.name}</span>
        </div>
        <p className="pt-checkin-question">{gateQuestion}</p>
        <div className="pt-checkin-actions">
          <button className="pt-checkin-yes" onClick={() => setPhase('reassess')}>Yes</button>
          <button className="pt-checkin-notyet" onClick={onNotYet}>Not yet</button>
        </div>
      </div>
    )
  }

  // Phase 2: Inline Reassessment
  if (phase === 'reassess') {
    return (
      <div className="pt-checkin-card">
        <span className="pt-checkin-eyebrow">Quick Reassessment</span>
        <p className="pt-checkin-reassess-desc">
          Let's see if anything has shifted. Answer the same 4 questions.
        </p>

        {!questions ? (
          <div className="pt-assessment-loading"><div className="spinner" /></div>
        ) : (
          <div className="pt-checkin-reassess">
            {questions.map((q) => (
              <div key={q.id} className="pt-question-card">
                <div className="pt-question-header">
                  <span className="pt-question-emoji">{q.emoji}</span>
                  <span className="pt-question-river">{q.river_element}</span>
                </div>
                <p className="pt-question-text">{q.question}</p>
                <div className="pt-question-options">
                  {q.options.map((opt, idx) => (
                    <button
                      key={idx}
                      className={`pt-option-btn ${scores[q.layer] === opt.score ? 'selected' : ''}`}
                      onClick={() => setScores(prev => ({ ...prev, [q.layer]: opt.score }))}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              className="pt-gold-cta"
              disabled={!allAnswered || saving}
              onClick={handleSubmitReassessment}
            >
              {saving ? 'Saving...' : 'See My Priority'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // Phase 3: Celebration
  if (phase === 'celebration' && graduationResult) {
    const newDisplay = TENSION_LAYER_DISPLAY[graduationResult.newLayer]
    return (
      <div className="pt-checkin-card">
        <div className="pt-checkin-celebration">
          <div className="pt-checkin-celebration-emoji">{newDisplay?.emoji}</div>
          <div className="pt-checkin-celebration-text">
            You've graduated to {newDisplay?.riverElement}!
          </div>
          <div className="pt-checkin-celebration-desc">
            {newDisplay?.description}
          </div>
          <button className="pt-gold-cta" onClick={onCelebrationDone}>
            Plan My Week
          </button>
        </div>
      </div>
    )
  }

  return null
}
