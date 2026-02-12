// src/lib/crm/weeklyPlanningService.js
// Service layer for CRM Weekly Planning System

import { supabase } from '../supabaseClient'
import { getWeekStartLocal as getWeekStart, formatLocalDate } from '../dateUtils'
import { syncWeeklyPlanToExecute } from './executeSyncService'

// ============================================
// DATE HELPERS
// ============================================

// Re-export for backwards compatibility
export { getWeekStart }

/**
 * Get the upcoming Monday (for planning the next week)
 */
export function getUpcomingMonday() {
  const now = new Date()
  const day = now.getDay()
  // If Sunday after 3pm, or any day Mon-Sat, get next Monday
  const daysUntilMonday = day === 0 ? 1 : (8 - day)
  const monday = new Date(now)
  monday.setDate(monday.getDate() + daysUntilMonday)
  return formatLocalDate(monday)
}

/**
 * Check if it's time to show weekly planning (Sunday 3pm+ or Monday with no plan)
 */
export function shouldShowWeeklyPlanning() {
  const now = new Date()
  const day = now.getDay() // 0 = Sunday, 1 = Monday
  const hour = now.getHours()

  // Sunday after 3pm
  if (day === 0 && hour >= 15) return true

  // Monday (any time)
  if (day === 1) return true

  return false
}

/**
 * Get the week start date for planning (next Monday if Sunday 3pm+)
 */
export function getPlanningWeekStart() {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()

  // Sunday after 3pm - plan for upcoming Monday
  if (day === 0 && hour >= 15) {
    return getUpcomingMonday()
  }

  // Otherwise use current week's Monday
  return getWeekStart()
}

// ============================================
// WEEKLY PLAN CRUD
// ============================================

/**
 * Get the current week's plan
 */
export async function getCurrentWeekPlan(userId) {
  const weekStart = getPlanningWeekStart()

  const { data, error } = await supabase
    .from('crm_weekly_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching weekly plan:', error)
  }

  return data
}

/**
 * Create or update a weekly plan
 */
export async function saveWeeklyPlan(userId, planData) {
  const weekStart = getPlanningWeekStart()

  const { data, error } = await supabase
    .from('crm_weekly_plans')
    .upsert({
      user_id: userId,
      week_start: weekStart,
      active_phases: planData.activePhases,
      tasks: planData.tasks,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,week_start'
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving weekly plan:', error)
    return null
  }

  // Sync plan tasks into execute_tasks
  try {
    await syncWeeklyPlanToExecute(userId, data)
  } catch (syncErr) {
    console.warn('Weekly plan saved but execute sync failed:', syncErr)
  }

  return data
}

/**
 * Check if a plan exists for the current week
 */
export async function hasCurrentWeekPlan(userId) {
  const plan = await getCurrentWeekPlan(userId)
  return !!plan
}

// ============================================
// TASK MENU
// ============================================

/**
 * Get task menu organized by phase
 */
export function getTaskMenuByPhase() {
  return {
    build: [
      { title: 'Set up new system/tool', id: 'build-1' },
      { title: 'Build landing page', id: 'build-2' },
      { title: 'Create lead magnet', id: 'build-3' },
      { title: 'Record training video', id: 'build-4' },
      { title: 'Design/wireframe', id: 'build-5' },
      { title: 'Write sales page copy', id: 'build-6' },
      { title: 'Build email sequence', id: 'build-7' },
      { title: 'Create checkout/payment flow', id: 'build-8' },
      { title: 'Set up automation', id: 'build-9' },
      { title: 'Create offer/package', id: 'build-10' },
      { title: 'Write course outline', id: 'build-11' },
      { title: 'Set up tracking/analytics', id: 'build-12' }
    ],
    launch: [
      { title: 'Send launch email', id: 'launch-1' },
      { title: 'Post launch announcement', id: 'launch-2' },
      { title: 'DM potential customers', id: 'launch-3' },
      { title: 'Go live / webinar', id: 'launch-4' },
      { title: 'Run ads', id: 'launch-5' },
      { title: 'Partner outreach', id: 'launch-6' },
      { title: 'Follow up with leads', id: 'launch-7' },
      { title: 'Host Q&A / AMA', id: 'launch-8' },
      { title: 'Send cart close reminder', id: 'launch-9' },
      { title: 'Warm up audience (pre-launch)', id: 'launch-10' },
      { title: 'Share testimonial/proof', id: 'launch-11' },
      { title: 'Overcome objection (content/call)', id: 'launch-12' }
    ],
    deliver: [
      { title: 'Client session', id: 'deliver-1' },
      { title: 'Create deliverable', id: 'deliver-2' },
      { title: 'Check-in with client', id: 'deliver-3' },
      { title: 'Onboard new client', id: 'deliver-4' },
      { title: 'Send progress update', id: 'deliver-5' },
      { title: 'Collect feedback', id: 'deliver-6' },
      { title: 'Request testimonial', id: 'deliver-7' },
      { title: 'Document results', id: 'deliver-8' }
    ],
    recap: [
      { title: 'Analyze metrics', id: 'recap-1' },
      { title: 'Review funnel performance', id: 'recap-2' },
      { title: 'Identify improvement opportunity', id: 'recap-3' },
      { title: 'Write case study', id: 'recap-4' },
      { title: 'Update testimonials page', id: 'recap-5' },
      { title: 'Reflect & journal', id: 'recap-6' },
      { title: 'Plan next iteration', id: 'recap-7' },
      { title: 'Archive/close completed project', id: 'recap-8' },
      { title: 'Calculate ROI', id: 'recap-9' },
      { title: 'Update systems based on learnings', id: 'recap-10' }
    ]
  }
}

/**
 * Phase metadata
 */
export const PHASES = {
  build: {
    id: 'build',
    label: 'Build',
    icon: '🛠️',
    color: '#3b82f6',
    description: 'Building something new'
  },
  launch: {
    id: 'launch',
    label: 'Launch',
    icon: '🚀',
    color: '#8b5cf6',
    description: 'Launching or promoting'
  },
  deliver: {
    id: 'deliver',
    label: 'Deliver',
    icon: '📦',
    color: '#22c55e',
    description: 'Delivering to clients'
  },
  recap: {
    id: 'recap',
    label: 'Recap',
    icon: '📊',
    color: '#f59e0b',
    description: 'Analyzing or reflecting'
  }
}

// ============================================
// SCORING HELPERS
// ============================================

/**
 * Calculate execution score for a week
 * @returns {number} Percentage (0-100)
 */
export async function calculateExecutionScore(userId, weekStart) {
  const { data: plan } = await supabase
    .from('crm_weekly_plans')
    .select('tasks')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .single()

  if (!plan?.tasks || plan.tasks.length === 0) return null

  // Get completed tasks from execute_tasks for this week
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const { data: completedTasks } = await supabase
    .from('execute_tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('source', 'weekly_plan')
    .eq('completed', true)
    .gte('scheduled_date', weekStart)
    .lt('scheduled_date', weekEnd.toISOString().split('T')[0])

  const plannedCount = plan.tasks.reduce((sum, t) => sum + (t.count || 1), 0)
  const completedCount = completedTasks?.length || 0

  return plannedCount > 0 ? Math.round((completedCount / plannedCount) * 100) : 0
}

/**
 * Calculate conversion score (avg across funnel stages)
 * @returns {number} Percentage
 */
export async function calculateConversionScore(userId) {
  const { data: metrics } = await supabase
    .from('funnel_metrics')
    .select('*')
    .eq('user_id', userId)
    .eq('mode', 'actual')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!metrics) return null

  // Calculate conversion rates between stages
  const rates = []

  if (metrics.awareness > 0 && metrics.attraction) {
    rates.push((metrics.attraction / metrics.awareness) * 100)
  }
  if (metrics.attraction > 0 && metrics.leadmagnet) {
    rates.push((metrics.leadmagnet / metrics.attraction) * 100)
  }
  if (metrics.leadmagnet > 0 && metrics.nurture) {
    rates.push((metrics.nurture / metrics.leadmagnet) * 100)
  }
  if (metrics.nurture > 0 && metrics.core) {
    rates.push((metrics.core / metrics.nurture) * 100)
  }
  if (metrics.core > 0 && metrics.upsell) {
    rates.push((metrics.upsell / metrics.core) * 100)
  }

  if (rates.length === 0) return null

  const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length
  return Math.round(avgRate * 10) / 10
}

/**
 * Calculate improvement score (% change vs last week)
 * @returns {number} Percentage change (can be negative)
 */
export async function calculateImprovementScore(userId) {
  const { data: metrics } = await supabase
    .from('funnel_metrics')
    .select('*')
    .eq('user_id', userId)
    .eq('mode', 'actual')
    .order('created_at', { ascending: false })
    .limit(2)

  if (!metrics || metrics.length < 2) return null

  const [current, previous] = metrics

  // Calculate averages for both weeks
  const calcAvg = (m) => {
    const rates = []
    if (m.awareness > 0 && m.attraction) rates.push((m.attraction / m.awareness) * 100)
    if (m.attraction > 0 && m.leadmagnet) rates.push((m.leadmagnet / m.attraction) * 100)
    if (m.leadmagnet > 0 && m.nurture) rates.push((m.nurture / m.leadmagnet) * 100)
    if (m.nurture > 0 && m.core) rates.push((m.core / m.nurture) * 100)
    if (m.core > 0 && m.upsell) rates.push((m.upsell / m.core) * 100)
    return rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0
  }

  const currentAvg = calcAvg(current)
  const previousAvg = calcAvg(previous)

  if (previousAvg === 0) return null

  const improvement = currentAvg - previousAvg
  return Math.round(improvement * 10) / 10
}

/**
 * Get all three scores for display
 */
export async function getWeeklyScores(userId, weekStart) {
  const [execution, conversion, improvement] = await Promise.all([
    calculateExecutionScore(userId, weekStart),
    calculateConversionScore(userId),
    calculateImprovementScore(userId)
  ])

  return { execution, conversion, improvement }
}

/**
 * Get last week's scores for reflection screen
 */
export async function getLastWeekScores(userId) {
  const lastWeekStart = getWeekStart(new Date(), -1)
  return getWeeklyScores(userId, lastWeekStart)
}
