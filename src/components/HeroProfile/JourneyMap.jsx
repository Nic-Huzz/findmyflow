import React, { useState } from 'react'
import AddMomentModal from './AddMomentModal'

/**
 * JourneyMap - Visual timeline showing the user's transformation
 *
 * Four Acts:
 * - Matrix: Life before awakening (gray)
 * - Awakening: Discovery phase (purple)
 * - Training: Building & facing fears (purple→gold)
 * - Becoming: Mastery & service (gold)
 */

const ACTS = [
  { id: 'matrix', name: 'Matrix Path', color: '#6b7280' },
  { id: 'awakening', name: 'Awakening', color: '#5e17eb' },
  { id: 'training', name: 'Training', color: '#9b59b6' },
  { id: 'becoming', name: 'Becoming', color: '#E9A23B' },
]

// Map stage numbers to acts
function getActFromStage(stage, hasFlowFinder, hasVoice) {
  if (stage >= 6) return 'becoming'
  if (stage >= 1) return 'training'
  if (hasFlowFinder || hasVoice) return 'awakening'
  return 'matrix'
}

// Get position percentage on timeline (0-100)
function getPositionPercent(currentAct) {
  const actIndex = ACTS.findIndex(a => a.id === currentAct)
  // Position at center of current act segment
  const segmentWidth = 100 / ACTS.length
  return (actIndex * segmentWidth) + (segmentWidth / 2)
}

function JourneyMap({
  currentStage = 0,
  hasFlowFinder = false,
  hasVoice = false,
  moments = [],
  onAddMoment,
  onDeleteMoment,
}) {
  const [showAddModal, setShowAddModal] = useState(false)

  const currentAct = getActFromStage(currentStage, hasFlowFinder, hasVoice)
  const positionPercent = getPositionPercent(currentAct)

  // Generate system milestones based on progress
  const systemMilestones = []

  // Always show "Felt the earthquake" if user has signed up
  systemMilestones.push({
    id: 'earthquake',
    text: 'Felt the earthquake',
    act: 'awakening',
    isSystem: true,
  })

  if (hasFlowFinder) {
    systemMilestones.push({
      id: 'flow-discovered',
      text: 'Discovered your Flow',
      act: 'awakening',
      isSystem: true,
    })
  }

  if (hasVoice) {
    systemMilestones.push({
      id: 'shadow-met',
      text: 'Met your Shadow',
      act: 'awakening',
      isSystem: true,
    })
  }

  if (currentStage >= 1) {
    systemMilestones.push({
      id: 'stage-1',
      text: 'Stage 1: Validation',
      act: 'training',
      isSystem: true,
    })
  }

  if (currentStage >= 3) {
    systemMilestones.push({
      id: 'stage-3',
      text: 'Stage 3: Testing',
      act: 'training',
      isSystem: true,
    })
  }

  if (currentStage >= 6) {
    systemMilestones.push({
      id: 'stage-6',
      text: 'Stage 6: First Service',
      act: 'becoming',
      isSystem: true,
    })
  }

  // Combine system and user moments
  // Sort user moments by date (most recent first), system milestones by act order
  const sortedUserMoments = [...moments].sort((a, b) => {
    return new Date(b.moment_date) - new Date(a.moment_date)
  })

  // Show: current stage system milestone + up to 2 most recent user moments
  const currentStageMilestone = systemMilestones[systemMilestones.length - 1]
  const recentUserMoments = sortedUserMoments.slice(0, 2)

  const displayMoments = [
    currentStageMilestone,
    ...recentUserMoments
  ].filter(Boolean)

  const handleAddMoment = (moment) => {
    onAddMoment?.(moment)
    setShowAddModal(false)
  }

  return (
    <div className="journey-map">
      <div className="journey-map-header">
        <h3 className="journey-map-title">Your Journey</h3>
      </div>

      {/* Timeline */}
      <div className="journey-timeline">
        {/* Act Labels */}
        <div className="timeline-acts">
          {ACTS.map((act, index) => (
            <div
              key={act.id}
              className={`timeline-act ${currentAct === act.id ? 'current' : ''}`}
              style={{ '--act-color': act.color }}
            >
              <span className="act-name">{act.name}</span>
            </div>
          ))}
        </div>

        {/* Timeline Track */}
        <div className="timeline-track">
          <div className="timeline-line">
            {/* Progress fill */}
            <div
              className="timeline-progress"
              style={{ width: `${positionPercent}%` }}
            />

            {/* Act markers */}
            {ACTS.map((act, index) => {
              const isCompleted = ACTS.findIndex(a => a.id === currentAct) > index
              const isCurrent = currentAct === act.id
              return (
                <div
                  key={act.id}
                  className={`timeline-marker ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                  style={{
                    left: `${(index / (ACTS.length - 1)) * 100}%`,
                    '--marker-color': act.color,
                  }}
                />
              )
            })}

            {/* Current position indicator */}
            <div
              className="timeline-current-position"
              style={{ left: `${positionPercent}%` }}
            >
              <div className="position-marker" />
              <span className="position-label">You are here</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Moments */}
      <div className="journey-moments">
        {displayMoments.map((moment, index) => (
          <div
            key={moment.id || index}
            className={`moment-item ${moment.isSystem ? 'system' : 'user'}`}
          >
            <span className="moment-icon">📍</span>
            <span className="moment-text">{moment.text || moment.moment_text}</span>
            {moment.moment_date && (
              <span className="moment-date">
                {new Date(moment.moment_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            )}
            {!moment.isSystem && onDeleteMoment && (
              <button
                className="moment-delete"
                onClick={() => onDeleteMoment(moment.id)}
                aria-label="Delete moment"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* Add Moment Button */}
        <button
          className="add-moment-button"
          onClick={() => setShowAddModal(true)}
        >
          + Add a moment
        </button>
      </div>

      {/* Add Moment Modal */}
      {showAddModal && (
        <AddMomentModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddMoment}
          currentAct={currentAct}
        />
      )}
    </div>
  )
}

export default JourneyMap
