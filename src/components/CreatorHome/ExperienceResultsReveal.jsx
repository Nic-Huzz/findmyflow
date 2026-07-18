/**
 * ExperienceResultsReveal — Sequential score reveal on first view of a past event.
 *
 * Metrics appear one at a time with 800ms stagger: attendees → fill rate → repeat → revenue.
 * Fires once per event (tracked in gamification state). Second view skips to PastExperienceStats.
 *
 * CSS prefix: err-
 */
import { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { hapticSuccess } from '../../lib/haptics'
import { getGamificationState, updateGamificationState } from '../../lib/creatorGamification'
import './ExperienceResultsReveal.css'

const STAGGER_MS = 800

export default function ExperienceResultsReveal({ stats, experience, onComplete }) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [finished, setFinished] = useState(false)

  // Build metrics from available data
  const metrics = []
  if (stats.attendeeCount != null) {
    metrics.push({ label: 'Attendees', value: stats.attendeeCount, icon: '👥' })
  }
  if (experience?.capacity && stats.attendeeCount) {
    const fillRate = Math.round(stats.attendeeCount / experience.capacity * 100)
    metrics.push({ label: 'Fill Rate', value: `${fillRate}%`, icon: '🎯' })
  }
  if (stats.repeatCount > 0) {
    metrics.push({ label: 'Came Back', value: stats.repeatCount, icon: '🔁', sub: `${stats.repeatRate}% repeat rate` })
  }
  if (experience?.total_revenue) {
    metrics.push({ label: 'Revenue', value: `$${parseFloat(experience.total_revenue).toLocaleString()}`, icon: '💰' })
  }

  // If no meaningful metrics, skip the reveal
  useEffect(() => {
    if (metrics.length === 0) {
      onComplete?.()
      return
    }

    // Stagger metrics one by one
    const timers = metrics.map((_, i) =>
      setTimeout(() => setVisibleCount(i + 1), (i + 1) * STAGGER_MS)
    )

    // Mark as finished after all revealed
    const finishTimer = setTimeout(() => {
      setFinished(true)
      hapticSuccess()
      // Confetti if attendees > 0
      if (stats.attendeeCount > 0) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#E9A23B', '#f5c55a', '#5e17eb', '#8b5cf6'],
        })
      }
    }, (metrics.length + 1) * STAGGER_MS)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(finishTimer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (metrics.length === 0) return null

  return (
    <div className="err-container">
      <div className="err-header">
        <div className="err-event-name">{experience?.name || 'Your Event'}</div>
        <div className="err-subtitle">Here's how it went</div>
      </div>

      <div className="err-metrics">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`err-metric ${i < visibleCount ? 'err-metric-visible' : ''}`}
          >
            <span className="err-metric-icon">{m.icon}</span>
            <div className="err-metric-data">
              <div className="err-metric-value">{m.value}</div>
              <div className="err-metric-label">{m.label}</div>
              {m.sub && <div className="err-metric-sub">{m.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {finished && (
        <button className="err-continue" onClick={onComplete}>
          See full breakdown →
        </button>
      )}
    </div>
  )
}

/**
 * Check if a reveal has already been shown for this experience.
 */
export function hasBeenRevealed(experienceId) {
  const state = getGamificationState()
  return state.revealedEvents?.[experienceId] === true
}

/**
 * Mark an experience as revealed.
 */
export function markRevealed(experienceId) {
  const state = getGamificationState()
  updateGamificationState({
    revealedEvents: { ...(state.revealedEvents || {}), [experienceId]: true }
  })
}
