// src/hooks/useExecute.js
// Hook for Execute system with celebration integration

import { useState, useCallback, useEffect, useRef } from 'react'
import { useCelebrations } from './useCelebrations'
import {
  createTask,
  completeTask as completeTaskHelper,
  uncompleteTask as uncompleteTaskHelper,
  getThisWeekTasks,
  getQuickStats,
  TASK_POINTS,
} from '../lib/executeHelpers'
import {
  getActiveFrameworks,
  getAllFrameworkProgress,
  awardFrameworkCompletion,
} from '../lib/crm/frameworkService'
import {
  getNextImplementationTasks,
  toggleTaskCompletion,
} from '../lib/crm/implementationService'
import { supabase } from '../lib/supabaseClient'

// TASK_POINTS imported from executeHelpers

/**
 * Hook for managing Execute system with celebrations
 */
export function useExecute(userId, projectId) {
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [frameworks, setFrameworks] = useState([])
  const [frameworkProgress, setFrameworkProgress] = useState({})
  const [implTasks, setImplTasks] = useState([])
  const loadingFrameworks = useRef(false)

  const {
    celebrateTaskComplete,
    celebrateAllTasksComplete,
    celebrateLevelUp,
    showLevelUp,
    levelUpKey,
    floatingPoints,
    toast,
    closeLevelUp,
    clearToast,
    removeFloatingPoints,
  } = useCelebrations()

  // Load frameworks and compute live progress
  const loadFrameworks = useCallback(async () => {
    if (!userId || loadingFrameworks.current) return
    loadingFrameworks.current = true

    try {
      const fws = await getActiveFrameworks(userId)
      setFrameworks(fws)

      const progress = await getAllFrameworkProgress(userId, fws)
      setFrameworkProgress(progress)

      // Auto-award completed frameworks
      for (const fw of fws) {
        const p = progress[fw.key]
        if (p?.isComplete) {
          const awarded = await awardFrameworkCompletion(userId, fw.key, fw)
          if (awarded) {
            celebrateTaskComplete(fw.points, {})
            // Update user stats for the awarded points
            await updateUserStats(userId, fw.points)
            await checkLevelUp(userId, fw.points)
          }
        }
      }
    } catch (err) {
      console.error('Error loading frameworks:', err)
    } finally {
      loadingFrameworks.current = false
    }
  }, [userId, celebrateTaskComplete])

  // Refresh framework progress on visibility change
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === 'visible' && userId) {
        loadFrameworks()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [userId, loadFrameworks])

  // Load tasks and stats
  const loadData = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const [tasksResult, statsResult, implTasksResult] = await Promise.all([
        getThisWeekTasks(userId, projectId),
        getQuickStats(userId),
        projectId ? getNextImplementationTasks(userId, projectId) : Promise.resolve([]),
      ])

      setTasks(tasksResult || [])
      setStats(statsResult)
      setImplTasks(implTasksResult || [])

      // Also load frameworks
      loadFrameworks()
    } catch (err) {
      console.error('Error loading execute data:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, projectId, loadFrameworks])

  // Complete a task with celebration
  const completeTask = useCallback(async (taskId, taskPhase, position = {}) => {
    const success = await completeTaskHelper(taskId)

    if (success) {
      // Update local state
      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, completed: true, completed_at: new Date().toISOString() }
          : t
      ))

      // Calculate points
      const points = TASK_POINTS[taskPhase] || TASK_POINTS.custom

      // Celebrate!
      celebrateTaskComplete(points, position)

      // Update user stats
      await updateUserStats(userId, points)

      // Check if all tasks complete
      const remainingTasks = tasks.filter(t => t.id !== taskId && !t.completed)
      if (remainingTasks.length === 0) {
        // Small delay for the floating points animation
        setTimeout(() => {
          celebrateAllTasksComplete()
        }, 800)
      }

      // Check for level up
      await checkLevelUp(userId, points)

      return true
    }

    return false
  }, [tasks, userId, celebrateTaskComplete, celebrateAllTasksComplete])

  // Uncomplete a task
  const uncompleteTask = useCallback(async (taskId) => {
    const success = await uncompleteTaskHelper(taskId)

    if (success) {
      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, completed: false, completed_at: null }
          : t
      ))
    }

    return success
  }, [])

  // Add a new task
  const addTask = useCallback(async (taskData) => {
    const newTask = await createTask(userId, projectId, taskData)

    if (newTask) {
      setTasks(prev => [...prev, newTask])
    }

    return newTask
  }, [userId, projectId])

  // Complete an implementation task
  const completeImplTask = useCallback(async (task, position = {}) => {
    const { phaseCompleted, allCompleted, error } = await toggleTaskCompletion(
      task.implId, userId, task.phaseIndex, task.taskIndex
    )
    if (error) return false

    const points = 15
    celebrateTaskComplete(points, position)
    await updateUserStats(userId, points)
    await checkLevelUp(userId, points)

    // Remove completed task from local state
    setImplTasks(prev => prev.filter(t =>
      !(t.implId === task.implId && t.phaseIndex === task.phaseIndex && t.taskIndex === task.taskIndex)
    ))

    // If phase or all completed, reload to surface next phase's tasks
    if (phaseCompleted || allCompleted) {
      const fresh = await getNextImplementationTasks(userId, projectId)
      setImplTasks(fresh || [])
    }

    return true
  }, [userId, projectId, celebrateTaskComplete])

  // Update user stats (points, streak, execution rate)
  async function updateUserStats(userId, pointsEarned) {
    try {
      const { data: currentStats } = await supabase
        .from('user_crm_stats')
        .select('total_points, current_streak, longest_streak')
        .eq('user_id', userId)
        .single()

      if (currentStats) {
        const newTotal = (currentStats.total_points || 0) + pointsEarned

        await supabase
          .from('user_crm_stats')
          .update({
            total_points: newTotal,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
      }
    } catch (err) {
      console.error('Error updating stats:', err)
    }
  }

  // Check if user leveled up
  async function checkLevelUp(userId, pointsEarned) {
    try {
      const { data: stats } = await supabase
        .from('user_crm_stats')
        .select('total_points')
        .eq('user_id', userId)
        .single()

      if (!stats) return

      const oldPoints = stats.total_points - pointsEarned
      const newPoints = stats.total_points

      // Level thresholds
      const levels = [0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000]

      let oldLevel = 0
      let newLevel = 0

      for (let i = levels.length - 1; i >= 0; i--) {
        if (oldPoints >= levels[i]) {
          oldLevel = i + 1
          break
        }
      }

      for (let i = levels.length - 1; i >= 0; i--) {
        if (newPoints >= levels[i]) {
          newLevel = i + 1
          break
        }
      }

      if (newLevel > oldLevel) {
        celebrateLevelUp(newLevel)
      }
    } catch (err) {
      console.error('Error checking level up:', err)
    }
  }

  return {
    // Data
    tasks,
    stats,
    loading,
    frameworks,
    frameworkProgress,
    implTasks,

    // Actions
    loadData,
    completeTask,
    uncompleteTask,
    addTask,
    completeImplTask,
    loadFrameworks,

    // Celebration state (for rendering overlays)
    showLevelUp,
    levelUpKey,
    floatingPoints,
    toast,
    closeLevelUp,
    clearToast,
    removeFloatingPoints,
  }
}

export default useExecute
