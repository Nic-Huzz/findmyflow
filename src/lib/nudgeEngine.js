// src/lib/nudgeEngine.js
// Context-aware micro-coaching system

import { supabase } from './supabaseClient'
import {
  getRecentNudges,
  createNudge,
  calculateFunnelHealth,
  getLatestFunnelMetrics,
  getPendingImprovements,
  getThisWeekTasks,
  getStuckTasks
} from './executeHelpers'

// Nudge rules with triggers and cooldowns
const NUDGE_RULES = [
  {
    id: 'stuck_task',
    check: async (userId, context) => {
      const { stuckTasks } = context

      if (stuckTasks?.length > 0) {
        const task = stuckTasks[0]
        return {
          trigger_type: 'stuck_task',
          message: `"${task.title}" has been waiting ${Math.floor((Date.now() - new Date(task.created_at)) / (1000 * 60 * 60 * 24))} days. Break it into smaller steps?`,
          action_type: 'break_down_task',
          action_data: { task_id: task.id, task_title: task.title }
        }
      }
      return null
    },
    cooldown: 24 * 60 * 60 * 1000 // Once per day max
  },

  {
    id: 'high_execution_no_improvement',
    check: async (userId, context) => {
      const { executionRate, pendingImprovements } = context

      if (executionRate > 80 && pendingImprovements.length === 0) {
        return {
          trigger_type: 'high_execution_no_improvement',
          message: `You're at ${executionRate}% execution this week! Ready to test an improvement?`,
          action_type: 'start_improvement',
          action_data: {}
        }
      }
      return null
    },
    cooldown: 7 * 24 * 60 * 60 * 1000 // Once per week
  },

  {
    id: 'improvement_needs_outcome',
    check: async (userId, context) => {
      const { pendingImprovements } = context

      // Find improvements older than 7 days without outcome
      const oldImprovements = pendingImprovements.filter(imp => {
        const daysSince = (Date.now() - new Date(imp.created_at)) / (1000 * 60 * 60 * 24)
        return daysSince > 7
      })

      if (oldImprovements.length > 0) {
        const imp = oldImprovements[0]
        return {
          trigger_type: 'improvement_needs_outcome',
          message: `How did your "${imp.hypothesis}" improvement work out? Log the result for bonus points!`,
          action_type: 'log_outcome',
          action_data: { improvement_id: imp.id }
        }
      }
      return null
    },
    cooldown: 3 * 24 * 60 * 60 * 1000 // Every 3 days
  },

  {
    id: 'funnel_neglected',
    check: async (userId, context) => {
      const { funnelHealth } = context

      if (!funnelHealth || Object.keys(funnelHealth).length === 0) return null

      const neglected = Object.entries(funnelHealth)
        .find(([stage, data]) => data.count === 0 && data.daysStale >= 7)

      if (neglected) {
        const [stage] = neglected
        return {
          trigger_type: 'funnel_neglected',
          message: `Your ${stage} stage hasn't seen action in over a week. Quick win idea?`,
          action_type: 'suggest_funnel_action',
          action_data: { stage }
        }
      }
      return null
    },
    cooldown: 3 * 24 * 60 * 60 * 1000
  },

  {
    id: 'week_half_done_no_progress',
    check: async (userId, context) => {
      const { weekTasks, executionRate } = context
      const dayOfWeek = new Date().getDay()

      // Wednesday or later, low execution
      if (dayOfWeek >= 3 && weekTasks.length > 0 && executionRate < 30) {
        return {
          trigger_type: 'week_half_done_no_progress',
          message: `Week's halfway done - what can we knock out today?`,
          action_type: 'focus_today',
          action_data: {}
        }
      }
      return null
    },
    cooldown: 24 * 60 * 60 * 1000
  },

  {
    id: 'first_login_priority',
    check: async (userId, context) => {
      const { weekTasks, isFirstLoginToday } = context

      if (!isFirstLoginToday) return null

      // Find highest priority incomplete task
      const incompleteTasks = weekTasks
        .filter(t => !t.completed)
        .sort((a, b) => (b.points || 0) - (a.points || 0))

      if (incompleteTasks.length > 0) {
        const topTask = incompleteTasks[0]
        return {
          trigger_type: 'first_login_priority',
          message: `Welcome back! Your #1 priority today: "${topTask.title}"`,
          action_type: 'highlight_task',
          action_data: { task_id: topTask.id, task_title: topTask.title }
        }
      }
      return null
    },
    cooldown: 12 * 60 * 60 * 1000 // Twice per day max
  }
]

/**
 * Check for nudges and return the most relevant one
 * @param {string} userId - User ID
 * @param {boolean} isFirstLoginToday - Whether this is the first login today
 * @returns {Object|null} Nudge object or null
 */
export async function checkForNudges(userId, isFirstLoginToday = false) {
  const context = await gatherNudgeContext(userId, isFirstLoginToday)
  const recentNudges = await getRecentNudges(userId)

  for (const rule of NUDGE_RULES) {
    // Check cooldown (use shown_at if available, otherwise created_at)
    const lastNudge = recentNudges.find(n => n.trigger_type === rule.id)
    const lastShown = lastNudge?.shown_at || lastNudge?.created_at
    if (lastNudge && lastShown && Date.now() - new Date(lastShown) < rule.cooldown) {
      continue
    }

    const nudge = await rule.check(userId, context)
    if (nudge) {
      return await createNudge(userId, nudge)
    }
  }

  return null
}

/**
 * Gather all context needed for nudge decisions
 */
async function gatherNudgeContext(userId, isFirstLoginToday) {
  const [weekTasks, funnelMetrics, pendingImprovements, stuckTasks] = await Promise.all([
    getThisWeekTasks(userId),
    getLatestFunnelMetrics(userId),
    getPendingImprovements(userId),
    getStuckTasks(userId)
  ])

  const completedTasks = weekTasks.filter(t => t.completed).length
  const totalTasks = weekTasks.length
  const executionRate = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0

  return {
    weekTasks,
    executionRate,
    funnelHealth: calculateFunnelHealth(funnelMetrics),
    pendingImprovements,
    stuckTasks,
    isFirstLoginToday
  }
}

/**
 * Get action handler for a nudge
 * @param {string} actionType - The type of action
 * @param {Object} actionData - Data for the action
 * @returns {Object} Handler with route and/or callback
 */
export function getNudgeActionHandler(actionType, actionData) {
  const handlers = {
    break_down_task: {
      label: 'Break it down',
      route: null,
      callback: 'openTaskBreakdown',
      data: actionData
    },
    start_improvement: {
      label: "Let's do it",
      route: '/crm/execute?tab=improve',
      callback: null
    },
    log_outcome: {
      label: 'Log result',
      route: null,
      callback: 'openOutcomeLogger',
      data: actionData
    },
    suggest_funnel_action: {
      label: 'Show me',
      route: `/crm/execute?focus=${actionData.stage}`,
      callback: null
    },
    focus_today: {
      label: "Let's go",
      route: '/crm/execute?view=today',
      callback: null
    },
    highlight_task: {
      label: 'Start now',
      route: null,
      callback: 'highlightTask',
      data: actionData
    }
  }

  return handlers[actionType] || {
    label: 'Take action',
    route: '/crm/execute',
    callback: null
  }
}
