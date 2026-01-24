/**
 * PullToRefresh - Mobile pull-to-refresh gesture
 * Wraps scrollable content with refresh functionality
 */
import { useState, useRef, useCallback } from 'react'
import { hapticMedium } from '../../lib/haptics'
import './PullToRefresh.css'

const THRESHOLD = 80 // pixels to pull before triggering refresh
const MAX_PULL = 120 // maximum pull distance

export default function PullToRefresh({ onRefresh, children, disabled = false }) {
  const [pulling, setPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const containerRef = useRef(null)
  const startY = useRef(0)
  const currentY = useRef(0)

  const handleTouchStart = useCallback((e) => {
    if (disabled || refreshing) return

    // Only start pull if at top of scroll
    const container = containerRef.current
    if (container && container.scrollTop > 0) return

    startY.current = e.touches[0].clientY
    setPulling(true)
  }, [disabled, refreshing])

  const handleTouchMove = useCallback((e) => {
    if (!pulling || disabled || refreshing) return

    currentY.current = e.touches[0].clientY
    const diff = currentY.current - startY.current

    if (diff > 0) {
      // Apply resistance as user pulls further
      const resistance = 1 - Math.min(diff / (MAX_PULL * 2), 0.5)
      const distance = Math.min(diff * resistance, MAX_PULL)
      setPullDistance(distance)

      // Haptic feedback when crossing threshold
      if (distance >= THRESHOLD && pullDistance < THRESHOLD) {
        hapticMedium()
      }
    }
  }, [pulling, disabled, refreshing, pullDistance])

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return

    if (pullDistance >= THRESHOLD && onRefresh) {
      setRefreshing(true)
      setPullDistance(THRESHOLD / 2) // Keep indicator visible during refresh

      try {
        await onRefresh()
      } catch (err) {
        console.error('Refresh failed:', err)
      }

      setRefreshing(false)
    }

    setPulling(false)
    setPullDistance(0)
    startY.current = 0
    currentY.current = 0
  }, [pulling, pullDistance, onRefresh])

  const isTriggered = pullDistance >= THRESHOLD
  const progress = Math.min(pullDistance / THRESHOLD, 1)

  return (
    <div
      ref={containerRef}
      className="pull-to-refresh-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={`pull-indicator ${refreshing ? 'refreshing' : ''} ${isTriggered ? 'triggered' : ''}`}
        style={{
          height: pullDistance,
          opacity: progress
        }}
      >
        <div className="pull-indicator-content">
          {refreshing ? (
            <div className="pull-spinner" />
          ) : (
            <>
              <span
                className="pull-arrow"
                style={{ transform: `rotate(${isTriggered ? 180 : 0}deg)` }}
              >
                ↓
              </span>
              <span className="pull-text">
                {isTriggered ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="pull-content"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * Hook for pull-to-refresh state management
 */
export function usePullToRefresh(refreshFn) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshFn()
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshFn])

  return { isRefreshing, handleRefresh }
}
