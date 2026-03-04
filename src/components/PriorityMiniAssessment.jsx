/**
 * PriorityMiniAssessment.jsx
 *
 * Compact inline tension assessment for the Priority tab.
 * Shows all 4 questions vertically (not one-at-a-time like onboarding).
 * Saves scores to user_stage_progress and fires onComplete with the computed layer.
 *
 * Created: 2026-03-04
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { computePriorityLayer } from '../lib/onboardingV2'
import { fetchJson } from '../lib/fetchJson'

export default function PriorityMiniAssessment({ userId, onComplete }) {
  const [questions, setQuestions] = useState(null)
  const [scores, setScores] = useState({
    discover: null,
    regulate: null,
    reveal: null,
    value: null,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchJson('/tension-assessment.json')
      .then(data => setQuestions(data.questions))
      .catch(err => console.error('Failed to load tension questions:', err))
  }, [])

  const allAnswered = scores.discover !== null && scores.regulate !== null &&
    scores.reveal !== null && scores.value !== null

  const handleOptionSelect = (layer, score) => {
    setScores(prev => ({ ...prev, [layer]: score }))
  }

  const handleSubmit = async () => {
    if (!allAnswered || !userId) return
    setSaving(true)
    setError(null)

    const computedLayer = computePriorityLayer(scores)

    try {
      const { error: dbError } = await supabase
        .from('user_stage_progress')
        .upsert({
          user_id: userId,
          tension_discover: scores.discover,
          tension_regulate: scores.regulate,
          tension_reveal: scores.reveal,
          tension_value: scores.value,
          priority_layer: computedLayer,
        }, { onConflict: 'user_id' })

      if (dbError) throw dbError

      onComplete?.(computedLayer)
    } catch (err) {
      console.error('Failed to save tension scores:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!questions) {
    return (
      <div className="pt-assessment-loading">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="pt-assessment">
      <div className="pt-assessment-header">
        <h3 className="pt-assessment-title">Find Your Priority</h3>
        <p className="pt-assessment-desc">
          Answer 4 quick questions to discover where your flow is stuck.
        </p>
      </div>

      <div className="pt-assessment-questions">
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
                  onClick={() => handleOptionSelect(q.layer, opt.score)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <p className="pt-error">{error}</p>}

      <button
        className="pt-gold-cta"
        disabled={!allAnswered || saving}
        onClick={handleSubmit}
      >
        {saving ? 'Saving...' : 'See My Priority'}
      </button>
    </div>
  )
}
