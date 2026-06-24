/**
 * BossFightCard.jsx
 *
 * Pre-session intake for boss fights (shift sessions).
 * Captures the same fields as vibe-rise-shift form.
 * User is logged in so no name needed.
 * Stuck area comes from the level/condition context.
 *
 * Created: 2026-03-27
 * Updated: 2026-06-24
 */

import { useState } from 'react'

export default function BossFightCard({ boss, condition, isCompleted, onSubmitPre }) {
  const [mode, setMode] = useState(null)
  const [preAnswers, setPreAnswers] = useState({
    actionScene: '',
    takeAction: '',
    dreamAction: '',
    tensionScore: 5,
  })

  if (!boss) return null

  return (
    <div className={`level-boss-fight ${isCompleted ? 'completed' : ''}`}>
      <div className="level-boss-header">
        <span className="level-boss-fight-icon">&#9876;&#65039;</span>
        <div>
          <div className="level-boss-fight-title">Boss Fight: {boss}</div>
          <div className="level-boss-fight-sub">
            {condition
              ? `Your shift session for ${condition}`
              : 'Book a healing session to defeat this boss'}
          </div>
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
            Describe the situation where you feel the freeze
          </label>
          <textarea
            className="level-boss-textarea"
            value={preAnswers.actionScene}
            onChange={e => setPreAnswers(p => ({ ...p, actionScene: e.target.value }))}
            placeholder="Where does your body lock up or pull back?"
          />
          <label className="level-boss-label">
            What do you want to do in that moment but can't?
          </label>
          <textarea
            className="level-boss-textarea"
            value={preAnswers.takeAction}
            onChange={e => setPreAnswers(p => ({ ...p, takeAction: e.target.value }))}
            placeholder="The action you avoid..."
          />
          <label className="level-boss-label">
            What's the action you dream of taking?
          </label>
          <textarea
            className="level-boss-textarea"
            value={preAnswers.dreamAction}
            onChange={e => setPreAnswers(p => ({ ...p, dreamAction: e.target.value }))}
            placeholder="What does it look like when the freeze doesn't fire?"
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
