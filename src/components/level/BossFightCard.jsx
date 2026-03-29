/**
 * BossFightCard.jsx
 *
 * Pre/post session verification for boss fights.
 * Users prepare for a healing session by answering
 * diagnostic questions about where the boss shows up.
 *
 * Created: 2026-03-27
 */

import { useState } from 'react'

export default function BossFightCard({ boss, isCompleted, onSubmitPre }) {
  const [mode, setMode] = useState(null) // null or 'pre'
  const [preAnswers, setPreAnswers] = useState({
    actionScene: '',
    tensionScore: 5,
    bossPrediction: '',
  })

  if (!boss) return null

  return (
    <div className={`level-boss-fight ${isCompleted ? 'completed' : ''}`}>
      <div className="level-boss-header">
        <span className="level-boss-fight-icon">&#9876;&#65039;</span>
        <div>
          <div className="level-boss-fight-title">Boss Fight: {boss}</div>
          <div className="level-boss-fight-sub">Book a healing session to defeat this boss</div>
        </div>
        {isCompleted && <span className="level-dd-status done">Defeated</span>}
      </div>
      {!isCompleted && !mode && (
        <div className="level-boss-actions">
          <button
            type="button"
            className="level-boss-btn pre"
            onClick={() => setMode('pre')}
          >
            Prepare for Session
          </button>
        </div>
      )}
      {mode === 'pre' && (
        <div className="level-boss-form">
          <label className="level-boss-label">
            What's the action scene you're working with?
          </label>
          <textarea
            className="level-boss-textarea"
            value={preAnswers.actionScene}
            onChange={e => setPreAnswers(p => ({ ...p, actionScene: e.target.value }))}
            placeholder="Describe the situation where the Boss shows up..."
          />
          <label className="level-boss-label">
            Tension in your body (1-10): {preAnswers.tensionScore}
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={preAnswers.tensionScore}
            onChange={e => setPreAnswers(p => ({ ...p, tensionScore: parseInt(e.target.value) }))}
            className="level-boss-slider"
          />
          <label className="level-boss-label">
            What does your body tell you will happen?
          </label>
          <textarea
            className="level-boss-textarea"
            value={preAnswers.bossPrediction}
            onChange={e => setPreAnswers(p => ({ ...p, bossPrediction: e.target.value }))}
            placeholder="The Boss voice prediction..."
          />
          <button
            type="button"
            className="level-boss-submit"
            onClick={() => {
              onSubmitPre?.(preAnswers)
              setMode(null)
            }}
          >
            Save &amp; Book Session
          </button>
        </div>
      )}
    </div>
  )
}
