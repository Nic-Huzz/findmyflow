/**
 * RegulationCard — Post-check-in micro-intervention.
 * Shows state-specific regulation exercises after the user identifies their nervous system state.
 * Turns diagnosis into medicine. Under 60 seconds.
 */

import { useState } from 'react'
import { REGULATION_EXERCISES } from '../lib/nervousSystemConstants'
import './RegulationCard.css'

export default function RegulationCard({ state, onDone, onSkip, onBack }) {
  const [expandedExercise, setExpandedExercise] = useState(null)
  const regulation = REGULATION_EXERCISES[state]

  if (!regulation) return null

  const isSimple = regulation.exercises.length === 1

  return (
    <div className="regulation-card">
      {onBack && (
        <button type="button" className="regulation-back" onClick={onBack}>
          ← Back
        </button>
      )}
      <h4 className="regulation-title">{regulation.label}</h4>
      <p className="regulation-subtitle">{regulation.subtitle}</p>

      {isSimple ? (
        <div className="regulation-single">
          <p className="regulation-instruction">{regulation.exercises[0].instruction}</p>
          {regulation.exercises[0].duration && (
            <span className="regulation-duration">{regulation.exercises[0].duration}</span>
          )}
        </div>
      ) : (
        <div className="regulation-exercises">
          {regulation.exercises.map((ex) => (
            <button
              key={ex.id}
              type="button"
              className={`regulation-exercise ${expandedExercise === ex.id ? 'expanded' : ''}`}
              onClick={() => setExpandedExercise(expandedExercise === ex.id ? null : ex.id)}
            >
              <div className="regulation-exercise-header">
                <span className="regulation-exercise-name">{ex.name}</span>
                {ex.duration && <span className="regulation-duration">{ex.duration}</span>}
              </div>
              {expandedExercise === ex.id && (
                <p className="regulation-instruction">{ex.instruction}</p>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="regulation-actions">
        <button type="button" className="regulation-done" onClick={onDone}>
          {isSimple ? 'Done' : 'I did one'}
        </button>
        <button type="button" className="regulation-skip" onClick={onSkip}>
          Skip exercise
        </button>
      </div>
    </div>
  )
}
