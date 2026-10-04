/**
 * ObservationCard — Intelligence Observations card component
 *
 * Full-width card with type-based left border, swipe-to-dismiss + X button.
 * Layout: badge row → title → body → optional CTA.
 * Matches InsightDrop patterns but persistent (not a toast).
 */

import { useState, useRef } from 'react'
import './ObservationCard.css'

const BORDER_COLORS = {
  pattern: '#5e17eb',
  compass: '#7c3aed',
  milestone: '#22c55e',
  prompt: '#f59e0b',
}

const BADGE_CLASSES = {
  pattern: 'obs-badge-pattern',
  compass: 'obs-badge-compass',
  milestone: 'obs-badge-milestone',
  prompt: 'obs-badge-prompt',
}

export default function ObservationCard({ observation, onDismiss, onAskZarlo }) {
  const [dismissing, setDismissing] = useState(false)
  const [swipeX, setSwipeX] = useState(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwipe = useRef(false)

  if (!observation) return null

  const handleDismiss = () => {
    setDismissing(true)
    setTimeout(() => onDismiss?.(observation.id, observation.resolutionKey), 300)
  }

  // Swipe-to-dismiss handlers
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isSwipe.current = false
  }

  const onTouchMove = (e) => {
    const dx = e.touches[0].clientX - touchStartX.current
    const dy = e.touches[0].clientY - touchStartY.current

    // Only track horizontal swipes (not vertical scroll)
    if (!isSwipe.current && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      isSwipe.current = true
    }

    if (isSwipe.current && dx < 0) {
      setSwipeX(dx)
    }
  }

  const onTouchEnd = () => {
    if (swipeX < -100) {
      // Dismiss threshold reached
      handleDismiss()
    } else {
      setSwipeX(0)
    }
    isSwipe.current = false
  }

  const borderColor = BORDER_COLORS[observation.type] || '#5e17eb'
  const badgeClass = BADGE_CLASSES[observation.type] || 'obs-badge-pattern'

  const handleCTA = () => {
    if (observation.action?.zarloContext && onAskZarlo) {
      onAskZarlo(observation.action.zarloContext)
    } else if (observation.action?.route) {
      // Navigation handled by parent
    }
  }

  return (
    <div
      className={`obs-card-wrap ${dismissing ? 'obs-dismissing' : ''}`}
      style={{ transform: swipeX ? `translateX(${swipeX}px)` : undefined }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="obs-card" style={{ borderLeftColor: borderColor }}>
        <div className="obs-header">
          <span className="obs-icon">{observation.icon}</span>
          <span className={`obs-badge ${badgeClass}`}>{observation.badge}</span>
          <button className="obs-dismiss" onClick={handleDismiss} aria-label="Dismiss">
            &times;
          </button>
        </div>
        <div className="obs-title">{observation.title}</div>
        <div className="obs-body">{observation.body}</div>
        {observation.action && (
          <button className="obs-cta" onClick={handleCTA}>
            {observation.action.label}
          </button>
        )}
      </div>
    </div>
  )
}
