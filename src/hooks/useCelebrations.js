// src/hooks/useCelebrations.js
// Hook for managing celebration animations

import { useState, useCallback } from 'react'
import {
  triggerConfetti,
  triggerCelebration,
  triggerFireConfetti
} from '../components/Celebrations'

/**
 * Hook for managing celebration animations
 * @returns {Object} Celebration handlers and state
 */
export function useCelebrations() {
  const [showLevelUp, setShowLevelUp] = useState(null)
  const [floatingPoints, setFloatingPoints] = useState([])
  const [toast, setToast] = useState(null)

  /**
   * Celebrate completing a single task
   */
  const celebrateTaskComplete = useCallback((points, position = {}) => {
    // Haptic feedback (mobile)
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }

    // Show floating points
    if (points) {
      const id = Date.now()
      setFloatingPoints(prev => [...prev, { id, points, position }])

      // Auto-remove after animation
      setTimeout(() => {
        setFloatingPoints(prev => prev.filter(p => p.id !== id))
      }, 1600)
    }
  }, [])

  /**
   * Celebrate completing all daily tasks
   */
  const celebrateAllTasksComplete = useCallback(() => {
    triggerConfetti()
    setToast({ type: 'all_done' })

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }
  }, [])

  /**
   * Celebrate leveling up
   */
  const celebrateLevelUp = useCallback((newLevel) => {
    setShowLevelUp(newLevel)
    // Confetti handled in LevelUpModal

    // Long haptic
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200])
    }
  }, [])

  /**
   * Celebrate hitting a streak milestone
   */
  const celebrateStreakMilestone = useCallback((days) => {
    triggerFireConfetti()

    let toastType = 'streak_7'
    if (days >= 100) toastType = 'streak_100'
    else if (days >= 30) toastType = 'streak_30'

    setToast({ type: toastType })

    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }
  }, [])

  /**
   * Celebrate a successful improvement
   */
  const celebrateImprovementSuccess = useCallback((bonusPoints) => {
    triggerCelebration()
    setToast({ type: 'improvement_works' })

    if (bonusPoints) {
      celebrateTaskComplete(bonusPoints, { right: 20, top: '40%' })
    }
  }, [celebrateTaskComplete])

  /**
   * Celebrate first task of the day
   */
  const celebrateFirstTask = useCallback(() => {
    setToast({ type: 'first_task' })

    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }, [])

  /**
   * Clear current toast
   */
  const clearToast = useCallback(() => {
    setToast(null)
  }, [])

  /**
   * Close level up modal
   */
  const closeLevelUp = useCallback(() => {
    setShowLevelUp(null)
  }, [])

  /**
   * Remove a floating points item
   */
  const removeFloatingPoints = useCallback((id) => {
    setFloatingPoints(prev => prev.filter(p => p.id !== id))
  }, [])

  return {
    // State
    showLevelUp,
    floatingPoints,
    toast,

    // Actions
    celebrateTaskComplete,
    celebrateAllTasksComplete,
    celebrateLevelUp,
    celebrateStreakMilestone,
    celebrateImprovementSuccess,
    celebrateFirstTask,

    // Cleanup
    clearToast,
    closeLevelUp,
    removeFloatingPoints
  }
}

export default useCelebrations
