// src/lib/executeHelpers.js
// Shared helpers for the Execute system

import { supabase } from './supabaseClient'
import { getWeekStartLocal as getWeekStart, getTodayLocal } from './dateUtils'

// ============================================
// DATE HELPERS
// ============================================

// Re-export for backwards compatibility
export { getWeekStart }

/**
 * Calculate days since a given date
 */
export function daysSince(dateString) {
  if (!dateString) return Infinity
  const then = new Date(dateString)
  const now = new Date()
  return Math.floor((now - then) / (1000 * 60 * 60 * 24))
}

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getToday() {
  return getTodayLocal()
}

// ============================================
// FUNNEL HEALTH CALCULATOR
// ============================================

/**
 * Calculate health metrics for each funnel stage
 * @param {Object} metrics - Row from funnel_metrics table
 * @returns {Object} Health object with rate and staleness per stage
 */
export function calculateFunnelHealth(metrics) {
  if (!metrics) return {}

  const stages = [
    'awareness',
    'attraction',
    'leadmagnet',
    'nurture',
    'core',
    'upsell',
    'downsell',
    'continuity'
  ]

  const health = {}

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i]
    const current = metrics[stage] || 0
    const previous = i > 0 ? (metrics[stages[i - 1]] || 0) : current

    health[stage] = {
      count: current,
      rate: previous > 0 ? Math.round((current / previous) * 100) : 0,
      daysStale: daysSince(metrics.updated_at)
    }
  }

  return health
}

/**
 * Get the weakest funnel stage (lowest conversion rate)
 */
export function getWeakestFunnelStage(funnelHealth) {
  if (!funnelHealth || Object.keys(funnelHealth).length === 0) {
    return { stage: 'awareness', rate: 0 }
  }

  const entries = Object.entries(funnelHealth)
    .filter(([stage]) => stage !== 'awareness') // Skip first stage
    .sort(([, a], [, b]) => a.rate - b.rate)

  const [stage, data] = entries[0] || ['awareness', { rate: 0 }]
  return { stage, rate: data.rate }
}

// ============================================
// NUDGE HELPERS
// ============================================

/**
 * Get recent nudges for cooldown checking
 */
export async function getRecentNudges(userId, days = 30) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const { data } = await supabase
    .from('coach_nudges')
    .select('id, trigger_type, shown_at, created_at')
    .eq('user_id', userId)
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false })

  return data || []
}

/**
 * Create a new nudge
 */
export async function createNudge(userId, nudgeData) {
  const { data, error } = await supabase
    .from('coach_nudges')
    .insert({
      user_id: userId,
      ...nudgeData
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create nudge:', error)
    return null
  }

  return data
}

/**
 * Mark nudge as shown
 */
export async function markNudgeShown(nudgeId) {
  await supabase
    .from('coach_nudges')
    .update({ shown_at: new Date().toISOString() })
    .eq('id', nudgeId)
}

/**
 * Dismiss a nudge
 */
export async function dismissNudge(nudgeId) {
  await supabase
    .from('coach_nudges')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', nudgeId)
}

/**
 * Mark nudge as acted upon
 */
export async function actOnNudge(nudgeId) {
  await supabase
    .from('coach_nudges')
    .update({ acted_on_at: new Date().toISOString() })
    .eq('id', nudgeId)
}

// ============================================
// STATS HELPERS
// ============================================

/**
 * Get quick stats for voice command response
 */
export async function getQuickStats(userId) {
  const weekStart = getWeekStart()

  // Get tasks for this week
  const { data: tasks } = await supabase
    .from('execute_tasks')
    .select('completed, estimated_hours')
    .eq('user_id', userId)
    .gte('scheduled_date', weekStart)

  const tasksCompleted = tasks?.filter(t => t.completed).length || 0
  const totalTasks = tasks?.length || 0
  const hoursThisWeek = tasks
    ?.filter(t => t.completed && t.estimated_hours)
    .reduce((sum, t) => sum + t.estimated_hours, 0) || 0
  const executionRate = totalTasks > 0
    ? Math.round((tasksCompleted / totalTasks) * 100)
    : 0

  // Get streak
  const { data: stats } = await supabase
    .from('user_crm_stats')
    .select('current_streak')
    .eq('user_id', userId)
    .single()

  return {
    executionRate,
    tasksCompleted,
    totalTasks,
    hoursThisWeek,
    streak: stats?.current_streak || 0
  }
}

/**
 * Get historical stats for a user
 */
export async function getHistoricalStats(userId) {
  // Get last 12 weeks of task data
  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

  const { data: tasks } = await supabase
    .from('execute_tasks')
    .select('scheduled_date, completed, created_at')
    .eq('user_id', userId)
    .gte('scheduled_date', twelveWeeksAgo.toISOString().split('T')[0])

  if (!tasks || tasks.length === 0) {
    return {
      avgTasksPerDay: 3,
      mostProductiveDay: 'Monday',
      dropOffPattern: null,
      currentStreak: 0,
      longestStreak: 0
    }
  }

  // Calculate average tasks per day
  const tasksByDay = {}
  tasks.forEach(t => {
    const day = new Date(t.scheduled_date).toLocaleDateString('en-US', { weekday: 'long' })
    tasksByDay[day] = (tasksByDay[day] || 0) + (t.completed ? 1 : 0)
  })

  const totalDays = Object.keys(tasksByDay).length || 1
  const totalCompleted = tasks.filter(t => t.completed).length
  const avgTasksPerDay = Math.round(totalCompleted / totalDays * 10) / 10

  // Find most productive day
  const mostProductiveDay = Object.entries(tasksByDay)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Monday'

  // Get streak from stats
  const { data: stats } = await supabase
    .from('user_crm_stats')
    .select('current_streak, longest_streak')
    .eq('user_id', userId)
    .single()

  return {
    avgTasksPerDay,
    mostProductiveDay,
    dropOffPattern: null, // Could analyze patterns later
    currentStreak: stats?.current_streak || 0,
    longestStreak: stats?.longest_streak || 0
  }
}

// ============================================
// DATA FETCHING HELPERS
// ============================================

/**
 * Get active projects for a user
 */
export async function getActiveProjects(userId) {
  const { data } = await supabase
    .from('user_projects')
    .select('id, name, current_stage')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  return data || []
}

/**
 * Get last week's execution stats
 */
export async function getLastWeekStats(userId) {
  const lastWeekStart = new Date()
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const weekStartStr = getWeekStart(lastWeekStart)

  const { data: tasks } = await supabase
    .from('execute_tasks')
    .select('completed')
    .eq('user_id', userId)
    .gte('scheduled_date', weekStartStr)
    .lt('scheduled_date', getWeekStart())

  const completed = tasks?.filter(t => t.completed).length || 0
  const total = tasks?.length || 0

  return {
    execution_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    tasks_completed: completed,
    tasks_total: total
  }
}

/**
 * Get latest funnel metrics
 */
export async function getLatestFunnelMetrics(userId) {
  const { data } = await supabase
    .from('funnel_metrics')
    .select('*')
    .eq('user_id', userId)
    .eq('mode', 'actual')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data
}

/**
 * Get pending improvements (not yet logged outcome)
 */
export async function getPendingImprovements(userId) {
  const { data } = await supabase
    .from('improvements')
    .select('*')
    .eq('user_id', userId)
    .eq('outcome_logged', false)
    .order('created_at', { ascending: false })

  return data || []
}

/**
 * Get stuck tasks (3+ days old, not completed)
 */
export async function getStuckTasks(userId) {
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const { data } = await supabase
    .from('execute_tasks')
    .select('id, title, phase, created_at')
    .eq('user_id', userId)
    .eq('completed', false)
    .lt('created_at', threeDaysAgo.toISOString())

  return data || []
}

/**
 * Get this week's tasks
 * Includes both project-specific tasks and user-level framework tasks
 */
export async function getThisWeekTasks(userId, projectId) {
  const weekStart = getWeekStart()

  // Fetch project tasks + framework tasks (project_id IS NULL) in one query
  let query = supabase
    .from('execute_tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('scheduled_date', weekStart)

  if (projectId) {
    // Get tasks for this project OR framework tasks (no project)
    query = query.or(`project_id.eq.${projectId},project_id.is.null`)
  }

  const { data } = await query

  return data || []
}

/**
 * Get historical week data for predictions
 */
export async function getHistoricalWeekData(userId, weeks = 12) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - (weeks * 7))

  const { data } = await supabase
    .from('execute_tasks')
    .select('scheduled_date, completed')
    .eq('user_id', userId)
    .gte('scheduled_date', startDate.toISOString().split('T')[0])

  // Group by week
  const weeklyData = {}
  data?.forEach(task => {
    const week = getWeekStart(new Date(task.scheduled_date))
    if (!weeklyData[week]) {
      weeklyData[week] = { completed: 0, total: 0 }
    }
    weeklyData[week].total++
    if (task.completed) weeklyData[week].completed++
  })

  return Object.entries(weeklyData).map(([week, data]) => ({
    week,
    ...data,
    rate: data.total > 0 ? data.completed / data.total : 0
  }))
}

/**
 * Get user's display name
 */
export async function getUserName(userId) {
  const { data } = await supabase
    .from('user_stage_progress')
    .select('display_name')
    .eq('user_id', userId)
    .single()

  if (data?.display_name) return data.display_name

  // Fallback to email
  const { data: authData } = await supabase.auth.getUser()
  return authData?.user?.email?.split('@')[0] || 'there'
}

/**
 * Get task menu organized by phase
 */
export function getTaskMenuByPhase() {
  return {
    build: [
      { title: 'Create content piece', category: 'content', points: 15 },
      { title: 'Design/wireframe', category: 'design', points: 20 },
      { title: 'Write copy', category: 'content', points: 15 },
      { title: 'Build landing page', category: 'build', points: 25 },
      { title: 'Record video/audio', category: 'content', points: 20 },
      { title: 'Share progress update', category: 'content', points: 10 }
    ],
    launch: [
      { title: 'Send launch email', category: 'outreach', points: 20 },
      { title: 'Post launch content', category: 'content', points: 15 },
      { title: 'DM potential customers', category: 'outreach', points: 15 },
      { title: 'Go live/webinar', category: 'event', points: 30 },
      { title: 'Run ads', category: 'paid', points: 20 },
      { title: 'Partner outreach', category: 'outreach', points: 15 }
    ],
    deliver: [
      { title: 'Client session', category: 'delivery', points: 25 },
      { title: 'Create deliverable', category: 'delivery', points: 20 },
      { title: 'Check-in with client', category: 'delivery', points: 10 },
      { title: 'Request testimonial', category: 'proof', points: 15 },
      { title: 'Document results', category: 'proof', points: 15 },
      { title: 'Share client win', category: 'content', points: 15 }
    ],
    recap: [
      { title: 'Analyze metrics', category: 'analysis', points: 15 },
      { title: 'Write case study', category: 'content', points: 25 },
      { title: 'Update testimonials', category: 'proof', points: 15 },
      { title: 'Reflect & journal', category: 'mindset', points: 10 },
      { title: 'Plan next iteration', category: 'planning', points: 20 },
      { title: 'Share learnings', category: 'content', points: 15 }
    ]
  }
}

// ============================================
// PREDICTION HELPERS
// ============================================

/**
 * Calculate current pace for week completion prediction
 */
export function calculateCurrentPace(tasks) {
  if (!tasks || tasks.length === 0) return 0
  const completed = tasks.filter(t => t.completed).length
  return completed / tasks.length
}

/**
 * Calculate historical completion rate
 */
export function calculateHistoricalCompletionRate(weeklyData) {
  if (!weeklyData || weeklyData.length === 0) return 0.7 // Default assumption

  const totalRate = weeklyData.reduce((sum, week) => sum + week.rate, 0)
  return totalRate / weeklyData.length
}

/**
 * Calculate confidence based on data quality
 */
export function calculateConfidence(weeklyData) {
  if (!weeklyData || weeklyData.length === 0) return 0.3

  // More data = higher confidence, max at 0.9
  const dataConfidence = Math.min(0.9, weeklyData.length / 12)

  // Lower variance = higher confidence
  const rates = weeklyData.map(w => w.rate)
  const mean = rates.reduce((a, b) => a + b, 0) / rates.length
  const variance = rates.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rates.length
  const varianceConfidence = Math.max(0.3, 1 - variance)

  return Math.round(((dataConfidence + varianceConfidence) / 2) * 100) / 100
}

// ============================================
// SIMILARITY HELPERS
// ============================================

/**
 * Get adjacent audience bucket for fuzzy matching
 */
export function getAdjacentBucket(bucket) {
  const buckets = ['tiny', 'small', 'medium', 'large']
  const index = buckets.indexOf(bucket)

  if (index === 0) return 'small'
  if (index === buckets.length - 1) return 'medium'
  return buckets[index - 1] // Prefer smaller adjacent
}

/**
 * Get audience bucket from size
 */
export function getAudienceBucket(size) {
  if (size < 100) return 'tiny'
  if (size < 1000) return 'small'
  if (size < 10000) return 'medium'
  return 'large'
}

// ============================================
// TASK POINTS BY PHASE
// ============================================

export const TASK_POINTS = {
  build: 10,
  launch: 15,
  deliver: 10,
  recap: 5,
  custom: 10,
}

// ============================================
// TASK HELPERS
// ============================================

/**
 * Create a new task
 */
export async function createTask(userId, projectId, taskData) {
  const { data, error } = await supabase
    .from('execute_tasks')
    .insert({
      user_id: userId,
      project_id: projectId,
      scheduled_date: getToday(),
      ...taskData
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create task:', error)
    return null
  }

  return data
}

/**
 * Complete a task
 */
export async function completeTask(taskId) {
  const { error } = await supabase
    .from('execute_tasks')
    .update({
      completed: true,
      completed_at: new Date().toISOString()
    })
    .eq('id', taskId)

  return !error
}

/**
 * Uncomplete a task
 */
export async function uncompleteTask(taskId) {
  const { error } = await supabase
    .from('execute_tasks')
    .update({
      completed: false,
      completed_at: null
    })
    .eq('id', taskId)

  return !error
}
