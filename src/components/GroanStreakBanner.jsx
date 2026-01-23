/**
 * GroanStreakBanner.jsx
 * Displays weekly groan challenge streak with badges
 *
 * Features:
 * - Current streak count
 * - Badge display (4/12/26/52 weeks)
 * - Progress to next badge
 * - Confetti on new badge earned
 */

import { useState, useEffect } from 'react'
import { getStreakWithProgress } from '../lib/crm'
import { GROAN_STREAK_BADGES } from '../lib/stageConfig'
import './GroanStreakBanner.css'

function GroanStreakBanner({ userId, compact = false, showConfetti = true }) {
  const [streakData, setStreakData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const [newBadgeEarned, setNewBadgeEarned] = useState(null)

  useEffect(() => {
    if (userId) {
      loadStreak()
    }
  }, [userId])

  const loadStreak = async () => {
    const { data } = await getStreakWithProgress(userId)

    // Check if a new badge was earned (compare with localStorage)
    if (data?.currentBadge) {
      const lastBadge = localStorage.getItem(`groan_last_badge_${userId}`)
      if (lastBadge !== data.currentBadge.badge) {
        setNewBadgeEarned(data.currentBadge)
        localStorage.setItem(`groan_last_badge_${userId}`, data.currentBadge.badge)
      }
    }

    setStreakData(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="groan-streak-banner loading">
        <div className="groan-streak-skeleton" />
      </div>
    )
  }

  if (!streakData) return null

  const {
    currentStreak,
    longestStreak,
    currentBadge,
    nextBadge,
    weeksToNextBadge
  } = streakData

  // Progress percentage to next badge
  const progressPercent = nextBadge
    ? Math.round(((currentStreak % nextBadge.weeks) / nextBadge.weeks) * 100)
    : 100

  return (
    <>
      <div className={`groan-streak-banner ${compact ? 'compact' : ''}`}>
        {/* Streak count */}
        <div className="groan-streak-count">
          <span className="groan-streak-flame">🔥</span>
          <span className="groan-streak-number">{currentStreak}</span>
          <span className="groan-streak-label">
            {currentStreak === 1 ? 'week' : 'weeks'}
          </span>
        </div>

        {/* Current badge */}
        {currentBadge && (
          <div
            className="groan-streak-badge"
            onClick={() => setShowBadgeModal(true)}
          >
            <span className="groan-badge-icon">{currentBadge.icon}</span>
            {!compact && (
              <span className="groan-badge-name">{currentBadge.badge}</span>
            )}
          </div>
        )}

        {/* Progress to next badge */}
        {nextBadge && !compact && (
          <div className="groan-streak-progress">
            <div className="groan-streak-progress-label">
              {weeksToNextBadge} {weeksToNextBadge === 1 ? 'week' : 'weeks'} to {nextBadge.badge}
            </div>
            <div className="groan-streak-progress-bar">
              <div
                className="groan-streak-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Longest streak (if different) */}
        {!compact && longestStreak > currentStreak && (
          <div className="groan-streak-best">
            Best: {longestStreak} weeks
          </div>
        )}
      </div>

      {/* Badge modal */}
      {showBadgeModal && (
        <div className="groan-badge-modal-overlay" onClick={() => setShowBadgeModal(false)}>
          <div className="groan-badge-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="groan-badge-modal-title">Courage Badges</h3>
            <div className="groan-badge-list">
              {GROAN_STREAK_BADGES.map((badge, i) => {
                const earned = currentStreak >= badge.weeks
                return (
                  <div
                    key={badge.weeks}
                    className={`groan-badge-item ${earned ? 'earned' : ''}`}
                  >
                    <span className="groan-badge-item-icon">{badge.icon}</span>
                    <div className="groan-badge-item-info">
                      <span className="groan-badge-item-name">{badge.badge}</span>
                      <span className="groan-badge-item-desc">{badge.description}</span>
                    </div>
                    <span className="groan-badge-item-weeks">{badge.weeks}w</span>
                  </div>
                )
              })}
            </div>
            <button
              className="groan-badge-modal-close"
              onClick={() => setShowBadgeModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* New badge celebration */}
      {newBadgeEarned && showConfetti && (
        <div className="groan-badge-celebration" onClick={() => setNewBadgeEarned(null)}>
          <div className="groan-badge-celebration-content">
            <div className="groan-badge-celebration-icon">{newBadgeEarned.icon}</div>
            <h3 className="groan-badge-celebration-title">New Badge Earned!</h3>
            <p className="groan-badge-celebration-name">{newBadgeEarned.badge}</p>
            <p className="groan-badge-celebration-desc">{newBadgeEarned.description}</p>
            <button
              className="groan-badge-celebration-btn"
              onClick={() => setNewBadgeEarned(null)}
            >
              Celebrate!
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default GroanStreakBanner
