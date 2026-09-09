// src/hooks/useCelebrations.js
// Hook for managing celebration animations

import { useState, useCallback } from 'react'
import confetti from 'canvas-confetti'
import {
  triggerConfetti,
  triggerCelebration,
  triggerFireConfetti,
  triggerSideCannons
} from '../components/Celebrations'

/**
 * Hook for managing celebration animations
 * @returns {Object} Celebration handlers and state
 */
export function useCelebrations() {
  const [showLevelUp, setShowLevelUp] = useState(null)
  const [levelUpKey, setLevelUpKey] = useState(0)
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
   * Note: community feed auto-post handled in Challenge.jsx (has userId)
   */
  const celebrateLevelUp = useCallback((newLevel) => {
    setShowLevelUp(newLevel)
    setLevelUpKey(k => k + 1)
    // Confetti handled in LevelUpModal

    // Long haptic
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200])
    }

  }, [])

  /**
   * Celebrate hitting a streak milestone
   * Note: celebrateStreakMilestone is currently unused (not called anywhere).
   * When wired, community feed auto-post should be added at the call site (where userId is available).
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

  /**
   * Celebrate a hero stage graduation (e.g. Stage 3→4)
   */
  const celebrateStageGraduation = useCallback((fromStage, toStage, context = {}) => {
    const CELEBRATIONS = {
      '0-2': { confetti: 'purple', emoji: '\u{1F331}',
        title: 'Stage 2: Exploring',
        message: 'You showed up. That takes more than most people realise. Your hero\'s journey has begun.' },
      '1-2': { confetti: 'purple', emoji: '\u{1F331}',
        title: 'Stage 2: Exploring',
        message: 'You showed up. That takes more than most people realise. Your hero\'s journey has begun.' },
      '2-3': { confetti: 'purple', emoji: '\u{1F5FA}\uFE0F',
        title: 'Stage 3: Discovering Yourself',
        message: 'You\'ve started collecting dots. Your curiosities, your life story, your paths. Now the patterns can start forming.' },
      '3-4': { confetti: 'side_cannons', emoji: '\u{1FA9E}',
        title: 'Stage 4: Choosing a Direction',
        message: context.essenceName
          ? `Your essence voice has a name. ${context.essenceName}. This is who you\'ve always been underneath the noise.`
          : 'Your essence archetype has been revealed. This is who you are underneath the noise.' },
      '4-5': { confetti: 'gold', emoji: '\u{1F525}',
        title: 'Stage 5: Finding Your Way',
        message: 'You did something courageous and felt it land. That feeling is your compass. Follow it.' },
      '5-6': { confetti: 'purple', emoji: '\u2694\uFE0F',
        title: 'Stage 6: Facing Resistance',
        message: 'You\'re going deeper on one path. The courage challenges are building something real.' },
      '6-7': { confetti: null, emoji: '\u{1F441}\uFE0F',
        title: 'Stage 7: Going Deeper',
        message: context.voiceName
          ? `The ${context.voiceName.charAt(0).toUpperCase() + context.voiceName.slice(1).replace(/_/g, ' ')}. Five times. The pattern is clear. You\'re ready to face what\'s underneath.`
          : 'The pattern is clear. You\'re ready to face what\'s underneath.' },
      '7-8': { confetti: 'gold', emoji: '\u{1F4A5}',
        title: 'Stage 8: The Breakthrough',
        message: 'Something clicked. 20 courage challenges and 3 healing flows. You\'re not the same person who started this.' },
      '8-9': { confetti: 'side_cannons', emoji: '\u{1F4B0}',
        title: 'Stage 9: First Reward',
        message: 'You earned real income from what you love. That\'s not luck. That\'s proof.' },
      '9-10': { confetti: 'gold', emoji: '\u{1F680}',
        title: 'Stage 10: Building Momentum',
        message: 'Three months of income. This isn\'t a one-off. You\'re building something real.' },
      '10-11': { confetti: 'side_cannons', emoji: '\u{1F451}',
        title: 'Stage 11: Proving It\'s Real',
        message: 'Your income covers your expenses. You\'re doing what you love for a living.' },
    }

    const key = `${fromStage}-${toStage}`
    const c = CELEBRATIONS[key]
    if (!c) return

    if (c.confetti === 'side_cannons') triggerSideCannons()
    else if (c.confetti === 'gold') {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#E9A23B', '#f5c55a', '#fbbf24'] })
      setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors: ['#E9A23B', '#f5c55a'] }), 300)
    } else if (c.confetti === 'purple') {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 }, colors: ['#5e17eb', '#8b5cf6', '#c4b5fd'] })
    }
    // 6→7: no confetti (reverent)

    setShowLevelUp({
      name: c.title,
      emoji: c.emoji,
      description: c.message,
      isGraduation: true,
      avatarUrl: context.avatarUrl || null,
      useFigurineOverlay: context.useFigurineOverlay || false,
    })
    setLevelUpKey(k => k + 1)
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200])
  }, [])

  return {
    // State
    showLevelUp,
    levelUpKey,
    floatingPoints,
    toast,

    // Actions
    celebrateTaskComplete,
    celebrateAllTasksComplete,
    celebrateLevelUp,
    celebrateStreakMilestone,
    celebrateImprovementSuccess,
    celebrateFirstTask,
    celebrateStageGraduation,

    // Cleanup
    clearToast,
    closeLevelUp,
    removeFloatingPoints
  }
}

export default useCelebrations
