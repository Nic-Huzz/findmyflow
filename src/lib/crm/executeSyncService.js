// src/lib/crm/executeSyncService.js
// Syncs Weekly Planning and Content Queue tasks into the Execute system

import { supabase } from '../supabaseClient'
import { getTaskMenuByPhase, TASK_POINTS } from '../executeHelpers'

/**
 * Build a title→metadata lookup from the Execute task menu.
 * Maps titles like "Build landing page" → { category: 'build', points: 25 }
 */
function buildExecuteMenuLookup() {
  const menu = getTaskMenuByPhase()
  const lookup = {}
  for (const [phase, tasks] of Object.entries(menu)) {
    for (const task of tasks) {
      lookup[task.title.toLowerCase()] = {
        category: task.category,
        points: task.points,
        phase,
      }
    }
  }
  return lookup
}

/**
 * Sync weekly plan tasks into execute_tasks.
 * Called when a weekly plan is saved/updated.
 *
 * - Deletes incomplete weekly_plan tasks for the week
 * - Inserts new rows from the plan's task list
 * - Completed tasks from previous syncs persist through re-planning
 *
 * @param {string} userId
 * @param {Object} plan - The saved crm_weekly_plans row (with .week_start, .tasks)
 * @returns {number} Count of tasks created
 */
export async function syncWeeklyPlanToExecute(userId, plan) {
  if (!plan?.tasks || plan.tasks.length === 0) return 0

  const weekStart = plan.week_start
  const weekEndDate = new Date(weekStart + 'T00:00:00')
  weekEndDate.setDate(weekEndDate.getDate() + 7)
  const weekEnd = weekEndDate.toISOString().split('T')[0]

  // 1. Delete incomplete weekly plan tasks for this week only
  const { error: deleteError } = await supabase
    .from('execute_tasks')
    .delete()
    .eq('user_id', userId)
    .eq('source', 'weekly_plan')
    .gte('scheduled_date', weekStart)
    .lt('scheduled_date', weekEnd)
    .eq('completed', false)

  if (deleteError) {
    console.error('Error clearing old weekly plan tasks:', deleteError)
  }

  // 2. Build Execute menu lookup for metadata enrichment
  const menuLookup = buildExecuteMenuLookup()

  // 3. Build rows from plan tasks, expanding by count
  const rows = []
  for (const task of plan.tasks) {
    const count = task.count || 1
    const phase = task.phase || 'build'

    // Try to match against Execute's task menu by title
    const match = menuLookup[task.title.toLowerCase()]

    const category = match?.category || 'planned'
    const points = match?.points || TASK_POINTS[phase] || TASK_POINTS.custom

    for (let i = 0; i < count; i++) {
      rows.push({
        user_id: userId,
        project_id: null, // Weekly plan tasks are user-level
        title: task.title,
        phase,
        category,
        points,
        scheduled_date: weekStart,
        source: 'weekly_plan',
        source_ref: task.id || null,
      })
    }
  }

  if (rows.length === 0) return 0

  // 4. Batch insert
  const { error: insertError } = await supabase
    .from('execute_tasks')
    .insert(rows)

  if (insertError) {
    console.error('Error syncing weekly plan to execute:', insertError)
    return 0
  }

  return rows.length
}

/**
 * Calculate the actual date from a day name + week start.
 * e.g. "Tuesday" with weekStart "2026-02-09" (Monday) → "2026-02-10"
 */
function dayNameToDate(dayName, weekStart) {
  const dayMap = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
  }

  const offset = dayMap[dayName.toLowerCase()]
  if (offset === undefined) return weekStart // Fallback to Monday

  const date = new Date(weekStart + 'T00:00:00')
  date.setDate(date.getDate() + offset)

  // Format as YYYY-MM-DD
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Sync content plan items into execute_tasks.
 * Called when a content plan is created/updated.
 *
 * - Deletes incomplete content_plan tasks for the week
 * - Inserts rows for items that have a post_day set
 *
 * @param {string} userId
 * @param {string} weekStart - YYYY-MM-DD
 * @param {Array} items - Content items (with .phase, .label, .icon, .post_day, .id)
 * @returns {number} Count of tasks created
 */
export async function syncContentPlanToExecute(userId, weekStart, items) {
  if (!weekStart || !items || items.length === 0) return 0

  const weekEndDate = new Date(weekStart + 'T00:00:00')
  weekEndDate.setDate(weekEndDate.getDate() + 7)
  const weekEnd = weekEndDate.toISOString().split('T')[0]

  // 1. Delete incomplete content plan tasks for this week only
  const { error: deleteError } = await supabase
    .from('execute_tasks')
    .delete()
    .eq('user_id', userId)
    .eq('source', 'content_plan')
    .gte('scheduled_date', weekStart)
    .lt('scheduled_date', weekEnd)
    .eq('completed', false)

  if (deleteError) {
    console.error('Error clearing old content plan tasks:', deleteError)
  }

  // 2. Build rows for items with a scheduled day
  const rows = []
  for (const item of items) {
    if (!item.post_day && !item.postDay) continue // Skip unscheduled items

    const postDay = item.post_day || item.postDay
    const scheduledDate = dayNameToDate(postDay, weekStart)
    const phase = item.phase || 'build'
    const label = item.label || item.content_type || 'Content'
    const icon = item.icon || ''
    const title = icon ? `${icon} ${label}` : label

    rows.push({
      user_id: userId,
      project_id: null,
      title,
      phase,
      category: 'content',
      points: TASK_POINTS[phase] || TASK_POINTS.custom,
      scheduled_date: scheduledDate,
      source: 'content_plan',
      source_ref: item.id || null,
    })
  }

  if (rows.length === 0) return 0

  // 3. Batch insert
  const { error: insertError } = await supabase
    .from('execute_tasks')
    .insert(rows)

  if (insertError) {
    console.error('Error syncing content plan to execute:', insertError)
    return 0
  }

  return rows.length
}
