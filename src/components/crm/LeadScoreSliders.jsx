/**
 * LeadScoreSliders - PTUF Lead Scoring Component
 * Pain / Trust / Urgency / Fit sliders for qualifying leads
 */
import { useState, useEffect } from 'react'
import './LeadScoreSliders.css'

const SCORE_DEFINITIONS = {
  pain: {
    label: 'Pain',
    emoji: '😣',
    question: 'How bad is their problem?',
    low: 'Minor inconvenience',
    high: 'Critical problem',
  },
  trust: {
    label: 'Trust',
    emoji: '🤝',
    question: 'Do they believe you can help?',
    low: 'Skeptical',
    high: 'Fully trusts you',
  },
  urgency: {
    label: 'Urgency',
    emoji: '⏰',
    question: 'How fast do they need it?',
    low: 'No rush',
    high: 'Needs it now',
  },
  fit: {
    label: 'Fit',
    emoji: '🎯',
    question: 'Are they your ideal customer?',
    low: 'Poor fit',
    high: 'Perfect match',
  },
}

export default function LeadScoreSliders({ scores, onChange, showNotes = true }) {
  const [localScores, setLocalScores] = useState({
    pain_score: scores?.pain_score || 5,
    pain_notes: scores?.pain_notes || '',
    trust_score: scores?.trust_score || 5,
    trust_notes: scores?.trust_notes || '',
    urgency_score: scores?.urgency_score || 5,
    urgency_notes: scores?.urgency_notes || '',
    fit_score: scores?.fit_score || 5,
    fit_notes: scores?.fit_notes || '',
  })

  useEffect(() => {
    if (scores) {
      setLocalScores({
        pain_score: scores.pain_score || 5,
        pain_notes: scores.pain_notes || '',
        trust_score: scores.trust_score || 5,
        trust_notes: scores.trust_notes || '',
        urgency_score: scores.urgency_score || 5,
        urgency_notes: scores.urgency_notes || '',
        fit_score: scores.fit_score || 5,
        fit_notes: scores.fit_notes || '',
      })
    }
  }, [scores])

  function handleScoreChange(type, value) {
    const newScores = { ...localScores, [`${type}_score`]: parseInt(value) }
    setLocalScores(newScores)
    onChange?.(newScores)
  }

  function handleNotesChange(type, value) {
    const newScores = { ...localScores, [`${type}_notes`]: value }
    setLocalScores(newScores)
    onChange?.(newScores)
  }

  const totalScore = (localScores.pain_score || 0) + (localScores.trust_score || 0) +
                     (localScores.urgency_score || 0) + (localScores.fit_score || 0)

  const temperature = totalScore >= 32 ? 'hot' : totalScore >= 24 ? 'warm' : 'cold'

  return (
    <div className="lead-score-sliders">
      <div className="score-header">
        <h4>Lead Score (PTUF)</h4>
        <div className={`total-score ${temperature}`}>
          <span className="temp-emoji">
            {temperature === 'hot' ? '🔥' : temperature === 'warm' ? '🌤️' : '❄️'}
          </span>
          <span className="temp-label">{totalScore}/40</span>
        </div>
      </div>

      {Object.entries(SCORE_DEFINITIONS).map(([key, def]) => (
        <div key={key} className="score-slider-group">
          <div className="slider-header">
            <span className="slider-emoji">{def.emoji}</span>
            <span className="slider-label">{def.label}</span>
            <span className="slider-value">{localScores[`${key}_score`]}</span>
          </div>
          <p className="slider-question">{def.question}</p>
          <div className="slider-container">
            <span className="slider-hint low">{def.low}</span>
            <input
              type="range"
              min="1"
              max="10"
              value={localScores[`${key}_score`]}
              onChange={(e) => handleScoreChange(key, e.target.value)}
              className={`score-slider ${key}`}
            />
            <span className="slider-hint high">{def.high}</span>
          </div>
          {showNotes && (
            <input
              type="text"
              placeholder={`Notes about ${def.label.toLowerCase()}...`}
              value={localScores[`${key}_notes`]}
              onChange={(e) => handleNotesChange(key, e.target.value)}
              className="score-notes"
            />
          )}
        </div>
      ))}

      <div className="score-summary">
        <div className="summary-breakdown">
          <span>P:{localScores.pain_score}</span>
          <span>T:{localScores.trust_score}</span>
          <span>U:{localScores.urgency_score}</span>
          <span>F:{localScores.fit_score}</span>
        </div>
        <div className={`temperature-badge ${temperature}`}>
          {temperature === 'hot' && '🔥 HOT LEAD'}
          {temperature === 'warm' && '🌤️ WARM LEAD'}
          {temperature === 'cold' && '❄️ COLD LEAD'}
        </div>
      </div>
    </div>
  )
}
