/**
 * Step6_Obstacles - Identify obstacles to buying (Step 6A)
 *
 * Features:
 * - Dynamic list of obstacles
 * - Helper examples based on bucket
 * - Flows into bonus creation
 */

import { useState } from 'react'

const OBSTACLE_EXAMPLES = {
  wealth: [
    "Don't have time to implement",
    "Don't trust themselves to follow through",
    "Worried they'll get stuck and have no help",
    "Don't have the technical knowledge",
    "Afraid it won't work for their specific situation",
    "Can't afford it right now",
    "Need more hand-holding",
    "Don't believe the results are realistic"
  ],
  health: [
    "Don't have time to exercise",
    "Worried about injuries or doing it wrong",
    "Don't know what to eat",
    "Can't stay consistent",
    "Have tried and failed before",
    "Don't have equipment or gym access",
    "Need accountability",
    "Don't believe they can change"
  ],
  relationships: [
    "Too shy or introverted",
    "Don't know what to say",
    "Afraid of rejection",
    "Past trauma holding them back",
    "Don't have time to meet people",
    "In a bad situation they can't leave",
    "Need ongoing support",
    "Don't believe they deserve love/connection"
  ]
}

function Step6_Obstacles({ bucket, contextData, onComplete, setError }) {
  const [obstacles, setObstacles] = useState([])
  const [newObstacle, setNewObstacle] = useState('')

  const examples = OBSTACLE_EXAMPLES[bucket] || OBSTACLE_EXAMPLES.wealth

  // Extract objections from validation data
  const validationObjections = contextData?.validationData?.objections ||
    contextData?.validationData?.concerns ||
    contextData?.validationData?.hesitations || []
  const hasValidationObjections = validationObjections.length > 0

  // Add obstacle
  const addObstacle = () => {
    const trimmed = newObstacle.trim()
    if (trimmed && trimmed.length >= 10 && trimmed.length <= 200 && !obstacles.includes(trimmed)) {
      if (obstacles.length >= 10) {
        setError('Maximum 10 obstacles allowed.')
        return
      }
      setObstacles(prev => [...prev, trimmed])
      setNewObstacle('')
    }
  }

  // Remove obstacle
  const removeObstacle = (index) => {
    setObstacles(prev => prev.filter((_, i) => i !== index))
  }

  // Add from example
  const addFromExample = (example) => {
    if (!obstacles.includes(example) && obstacles.length < 10) {
      setObstacles(prev => [...prev, example])
    }
  }

  // Continue to bonuses
  const handleContinue = () => {
    if (obstacles.length < 3) {
      setError('Please add at least 3 obstacles.')
      return
    }
    onComplete(obstacles)
  }

  return (
    <div className="obstacles-step">
      <div className="question-header">
        <span className="step-label">Step 6 of 8 (Part 1)</span>
        <h2>Before we build your bonuses, let's identify obstacles</h2>
      </div>

      <p className="question-subtitle">
        Hormozi's secret: Your bonuses should remove every excuse someone has for NOT buying.
      </p>

      {/* Validation Objections Panel */}
      {hasValidationObjections && (
        <div className="validation-objections-panel">
          <div className="objections-panel-header">
            <span className="panel-icon">🚫</span>
            <span>OBJECTIONS FROM YOUR VALIDATION SURVEYS</span>
          </div>
          <div className="objections-panel-content">
            <p className="objections-intro">
              Real objections your potential customers mentioned:
            </p>
            <div className="objections-list">
              {validationObjections.slice(0, 5).map((objection, i) => (
                <button
                  key={i}
                  type="button"
                  className={`objection-chip ${obstacles.includes(typeof objection === 'string' ? objection : objection.text || objection.concern) ? 'added' : ''}`}
                  onClick={() => {
                    const text = typeof objection === 'string' ? objection : objection.text || objection.concern
                    if (!obstacles.includes(text) && obstacles.length < 10) {
                      setObstacles(prev => [...prev, text])
                    }
                  }}
                  disabled={obstacles.includes(typeof objection === 'string' ? objection : objection.text || objection.concern) || obstacles.length >= 10}
                >
                  {obstacles.includes(typeof objection === 'string' ? objection : objection.text || objection.concern) ? '✓ ' : '+ '}
                  {typeof objection === 'string' ? objection : objection.text || objection.concern}
                </button>
              ))}
            </div>
            <p className="objections-tip">
              💡 Click to add these real objections to your list!
            </p>
          </div>
        </div>
      )}

      <p className="instruction">
        List all the reasons someone HASN'T bought this offer from you yet (or similar offers from competitors):
      </p>

      {/* Add obstacle input */}
      <div className="add-obstacle">
        <input
          type="text"
          value={newObstacle}
          onChange={(e) => setNewObstacle(e.target.value)}
          placeholder="Add an obstacle..."
          maxLength={200}
          onKeyPress={(e) => e.key === 'Enter' && addObstacle()}
        />
        <button
          type="button"
          onClick={addObstacle}
          disabled={!newObstacle.trim() || newObstacle.trim().length < 10}
        >
          + Add
        </button>
      </div>

      {/* Obstacles list */}
      <div className="obstacles-list">
        <h4>Your obstacles: ({obstacles.length}/10)</h4>
        {obstacles.length === 0 ? (
          <p className="no-obstacles">(none yet)</p>
        ) : (
          <ol>
            {obstacles.map((obstacle, i) => (
              <li key={i}>
                <span className="obstacle-text">"{obstacle}"</span>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeObstacle(i)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Helper examples */}
      <div className="examples-panel">
        <h4>💡 Common obstacles in {bucket} offers:</h4>
        <div className="examples-grid">
          {examples.map((example, i) => (
            <button
              key={i}
              type="button"
              className={`example-chip ${obstacles.includes(example) ? 'added' : ''}`}
              onClick={() => addFromExample(example)}
              disabled={obstacles.includes(example) || obstacles.length >= 10}
            >
              {obstacles.includes(example) ? '✓ ' : '+ '}
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="validation-info">
        Minimum: 3 obstacles | Maximum: 10 obstacles | Each: 10-200 characters
      </div>

      <button
        className="primary-button"
        onClick={handleContinue}
        disabled={obstacles.length < 3}
      >
        Create Bonuses from Obstacles →
      </button>
    </div>
  )
}

export default Step6_Obstacles
