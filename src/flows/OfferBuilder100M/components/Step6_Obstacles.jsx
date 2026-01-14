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
  love: [
    "Don't believe they deserve happiness",
    "Past trauma holding them back",
    "Afraid of getting their hopes up",
    "Too busy surviving to thrive",
    "Don't know where to start",
    "Have tried self-help before and failed",
    "Need ongoing support and accountability",
    "Don't believe real change is possible for them"
  ]
}

function Step6_Obstacles({ bucket, contextData, initialData, onComplete, setError }) {
  const [obstacles, setObstacles] = useState(initialData?.obstacles || [])
  const [newObstacle, setNewObstacle] = useState('')

  const examples = OBSTACLE_EXAMPLES[bucket] || OBSTACLE_EXAMPLES.wealth

  // Extract obstacles from validation survey responses
  const validationData = contextData?.validationData
  const hasValidationData = validationData?.hasValidationData || false
  const validationObstacles = validationData?.obstacles || []
  const validationByType = validationData?.byType || {}

  // Extract obstacles from V1 Offer Builder (problem_reasons)
  const v1Data = contextData?.offerBuilderData
  const v1Obstacles = []
  if (v1Data?.problem_reasons) {
    // Internal beliefs → obstacles
    if (v1Data.problem_reasons.internal_beliefs) {
      v1Data.problem_reasons.internal_beliefs.forEach(belief => {
        if (typeof belief === 'string' && belief.trim()) {
          v1Obstacles.push({ text: belief.trim(), source: 'internal' })
        }
      })
    }
    // External blockers → obstacles
    if (v1Data.problem_reasons.external_blockers) {
      v1Data.problem_reasons.external_blockers.forEach(blocker => {
        if (typeof blocker === 'string' && blocker.trim()) {
          v1Obstacles.push({ text: blocker.trim(), source: 'external' })
        }
      })
    }
    // Motivation gaps → obstacles
    if (v1Data.problem_reasons.motivation_gaps) {
      v1Data.problem_reasons.motivation_gaps.forEach(gap => {
        if (typeof gap === 'string' && gap.trim()) {
          v1Obstacles.push({ text: gap.trim(), source: 'motivation' })
        }
      })
    }
  }
  const hasV1Obstacles = v1Obstacles.length > 0

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

      {/* V1 Offer Builder Obstacles Panel */}
      {hasV1Obstacles && (
        <div className="v1-obstacles-panel">
          <div className="objections-panel-header">
            <span className="panel-icon">📦</span>
            <span>OBSTACLES FROM YOUR OFFER FOUNDATION</span>
          </div>
          <div className="objections-panel-content">
            <p className="objections-intro">
              Real obstacles you identified in your offer foundation:
            </p>
            <div className="objections-list">
              {v1Obstacles.slice(0, 8).map((obstacle, i) => (
                <button
                  key={i}
                  type="button"
                  className={`objection-chip ${obstacle.source} ${obstacles.includes(obstacle.text) ? 'added' : ''}`}
                  onClick={() => {
                    if (!obstacles.includes(obstacle.text) && obstacles.length < 10) {
                      setObstacles(prev => [...prev, obstacle.text])
                    }
                  }}
                  disabled={obstacles.includes(obstacle.text) || obstacles.length >= 10}
                >
                  {obstacles.includes(obstacle.text) ? '✓ ' : '+ '}
                  {obstacle.text}
                  <span className="obstacle-source">
                    ({obstacle.source === 'internal' ? 'belief' : obstacle.source === 'external' ? 'blocker' : 'motivation'})
                  </span>
                </button>
              ))}
            </div>
            <p className="objections-tip">
              💡 Click to add these foundation obstacles to your list!
            </p>
          </div>
        </div>
      )}

      {/* Validation Survey Obstacles Panel */}
      {hasValidationData && validationObstacles.length > 0 && (
        <div className="validation-objections-panel">
          <div className="objections-panel-header">
            <span className="panel-icon">📊</span>
            <span>REAL OBSTACLES FROM YOUR VALIDATION SURVEYS ({validationData.totalResponses} responses)</span>
          </div>
          <div className="objections-panel-content">
            {/* Direct obstacles from Step 3.0 */}
            {validationByType.directObstacles?.length > 0 && (
              <div className="validation-section">
                <p className="section-label">🎯 Direct reasons they gave:</p>
                <div className="objections-list">
                  {validationByType.directObstacles.slice(0, 5).map((item, i) => (
                    <button
                      key={`direct-${i}`}
                      type="button"
                      className={`objection-chip direct ${obstacles.includes(item.text) ? 'added' : ''}`}
                      onClick={() => {
                        if (!obstacles.includes(item.text) && obstacles.length < 10) {
                          setObstacles(prev => [...prev, item.text])
                        }
                      }}
                      disabled={obstacles.includes(item.text) || obstacles.length >= 10}
                    >
                      {obstacles.includes(item.text) ? '✓ ' : '+ '}
                      {item.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Internal beliefs from Step 2.0 */}
            {validationByType.internalBeliefs?.length > 0 && (
              <div className="validation-section">
                <p className="section-label">🧠 Internal stories they tell themselves:</p>
                <div className="objections-list">
                  {validationByType.internalBeliefs.slice(0, 3).map((item, i) => (
                    <button
                      key={`belief-${i}`}
                      type="button"
                      className={`objection-chip belief ${obstacles.includes(item.text) ? 'added' : ''}`}
                      onClick={() => {
                        if (!obstacles.includes(item.text) && obstacles.length < 10) {
                          setObstacles(prev => [...prev, item.text])
                        }
                      }}
                      disabled={obstacles.includes(item.text) || obstacles.length >= 10}
                    >
                      {obstacles.includes(item.text) ? '✓ ' : '+ '}
                      "{item.text}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Emotional indicators from Step 6.0 */}
            {validationByType.emotionalIndicators?.length > 0 && (
              <div className="validation-section">
                <p className="section-label">💭 Emotional barriers detected:</p>
                <div className="objections-list">
                  {validationByType.emotionalIndicators.slice(0, 3).map((item, i) => (
                    <button
                      key={`emotion-${i}`}
                      type="button"
                      className={`objection-chip emotion ${obstacles.includes(item.text) ? 'added' : ''}`}
                      onClick={() => {
                        if (!obstacles.includes(item.text) && obstacles.length < 10) {
                          setObstacles(prev => [...prev, item.text])
                        }
                      }}
                      disabled={obstacles.includes(item.text) || obstacles.length >= 10}
                    >
                      {obstacles.includes(item.text) ? '✓ ' : '+ '}
                      {item.text}
                      <span className="emotion-source">({item.emotion?.split(' - ')[0]})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="objections-tip">
              💡 These are real responses from your validation surveys - click to add!
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
