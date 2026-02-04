import React from 'react'
import { STAGE_CONFIG } from '../../lib/stageConfig'

/**
 * BusinessJourneyTracker - Visual 8-stage progress tracker
 *
 * Shows a horizontal timeline of stages 1-8 with the current stage highlighted.
 * Stages use the purple→gold ombre from stageConfig.
 */
function BusinessJourneyTracker({ currentStage = 1 }) {
  // Get project stages (1-8, skipping user-level stages 0 and 0.5)
  const projectStages = Object.values(STAGE_CONFIG).filter(
    s => Number.isInteger(s.id) && s.id >= 1 && s.id <= 8
  )

  const totalStages = projectStages.length

  return (
    <div className="business-journey">
      <div className="journey-header">
        <h3 className="journey-title">Business Journey</h3>
        <span className="journey-stage-label">Stage {currentStage} of {totalStages}</span>
      </div>

      <div className="journey-track">
        {projectStages.map((stage, index) => {
          const isCompleted = stage.id < currentStage
          const isCurrent = stage.id === currentStage
          const isFuture = stage.id > currentStage

          return (
            <React.Fragment key={stage.id}>
              {/* Connector line (before each node except first) */}
              {index > 0 && (
                <div
                  className={`journey-connector ${isCompleted || isCurrent ? 'active' : ''}`}
                />
              )}

              {/* Stage node */}
              <div
                className={`journey-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isFuture ? 'future' : ''}`}
                title={stage.name}
              >
                <div
                  className="journey-dot"
                  style={{
                    backgroundColor: isCompleted || isCurrent ? stage.color : 'transparent',
                    borderColor: stage.color,
                  }}
                >
                  {isCompleted ? '✓' : isCurrent ? stage.icon : stage.id}
                </div>
                <span className="journey-label">{stage.shortName || stage.name}</span>
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

export default BusinessJourneyTracker
