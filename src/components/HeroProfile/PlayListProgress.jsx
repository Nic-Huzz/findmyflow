import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Visibility layers in order, with unlock requirements
 */
const VISIBILITY_LAYERS = [
  { id: 'screen', label: 'Screen', emoji: '💻' },
  { id: 'live', label: 'Live', emoji: '🎤' },
  { id: 'money', label: 'Money', emoji: '💰' },
  { id: 'vulnerable', label: 'Vulnerable', emoji: '💎' },
  { id: 'authority', label: 'Authority', emoji: '👑' },
]

/**
 * PlayListProgress - 5 visibility layer progress bars
 *
 * Shows:
 * - Progress bar for each visibility layer (screen → authority)
 * - Completed percentage
 * - Locked/unlocked status
 * - Total XP from visibility challenges
 */
function PlayListProgress({ visibilityProgress, groanChallenges = [] }) {
  // Calculate total XP from completed groan challenges
  const visibilityXP = groanChallenges
    .filter(c => c.status === 'completed')
    .reduce((sum, c) => sum + (c.xp_earned || 0), 0)

  // Check if there's any visibility data at all
  const hasAnyData = Object.values(visibilityProgress || {}).some(v => v.total > 0)

  return (
    <div className="playlist-progress">
      <div className="playlist-header">
        <h3 className="playlist-title">Play-List (Visibility Mastery)</h3>
        {visibilityXP > 0 && (
          <span className="playlist-xp">Total: {visibilityXP} XP</span>
        )}
      </div>

      {!hasAnyData && (
        <div className="playlist-empty">
          <p className="playlist-empty-text">
            Your Play-List tracks courage challenges across 5 visibility layers
            — from behind a screen to full authority. Start generating challenges
            in the{' '}
            <Link to="/7-day-challenge?tab=groans" className="hero-profile-link">
              Groan Matrix →
            </Link>{' '}
            to light up your progress.
          </p>
        </div>
      )}

      <div className="playlist-layers">
        {VISIBILITY_LAYERS.map(layer => {
          const progress = visibilityProgress?.[layer.id]
          const percentage = progress?.percentage || 0
          const completed = progress?.completed || 0
          const total = progress?.total || 0
          const isComplete = percentage === 100 && total > 0
          const isInProgress = percentage > 0 && percentage < 100

          return (
            <div
              key={layer.id}
              className={`playlist-layer ${isComplete ? 'complete' : ''}`}
            >
              <div className="layer-info">
                <span className="layer-emoji">{layer.emoji}</span>
                <span className="layer-label">{layer.label}</span>
              </div>

              <div className="layer-bar-container">
                <div className="layer-bar">
                  <div
                    className="layer-bar-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <div className="layer-status">
                {isComplete && (
                  <span className="status-complete">✓ Complete</span>
                )}
                {isInProgress && (
                  <span className="status-progress">◐ {completed}/{total}</span>
                )}
                {!isComplete && !isInProgress && (
                  <span className="status-empty">{percentage}%</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PlayListProgress
