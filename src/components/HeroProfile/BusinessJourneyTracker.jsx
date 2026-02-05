import React from 'react'
import { STAGE_CONFIG } from '../../lib/stageConfig'

/**
 * Next milestone descriptions for each stage
 */
const STAGE_MILESTONES = {
  1: 'Complete problem validation interviews',
  2: 'Finalize your core product/service',
  3: 'Run your first paid test',
  4: 'Build your money model stack',
  5: 'Create your grand slam offer',
  6: 'Launch your marketing campaign',
  7: 'Execute your launch sequence',
  8: 'Track and optimize your funnel',
}

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
  const currentStageConfig = projectStages.find(s => s.id === currentStage)
  const progressPercentage = Math.round((currentStage / totalStages) * 100)
  const nextMilestone = STAGE_MILESTONES[currentStage] || 'Continue your journey'

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

      {/* Business Stage Progress */}
      <div className="journey-progress-section">
        <div className="journey-progress-header">
          <span className="journey-progress-title">Business Stage Progress</span>
          <span className="journey-progress-stage">
            Stage {currentStage}: {currentStageConfig?.name || 'Unknown'}
          </span>
        </div>
        <div className="journey-progress-bar">
          <div
            className="journey-progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="journey-progress-footer">
          <span className="journey-progress-percent">{progressPercentage}%</span>
          <span className="journey-progress-milestone">
            Next milestone: {nextMilestone}
          </span>
        </div>
      </div>
    </div>
  )
}

export default BusinessJourneyTracker
