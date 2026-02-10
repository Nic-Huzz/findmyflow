/**
 * Task Service - Marketing Quest Board Manager
 * Handles creating, fetching, and managing marketing tasks
 *
 * Tasks are generated from user's content_strategies.weekly_template
 */
import { supabase } from '../supabaseClient'
import { fetchContentStrategy, generateWeeklyTemplate } from '../contentStrategy'
import { getMondayDate, formatLocalDate } from '../dateUtils'

// Re-use shared date utilities
const getMonday = (date) => getMondayDate(date)
const formatDate = (date) => formatLocalDate(date)

// Generate tasks for a specific week based on user's content strategy
export async function generateWeeklyTasks(userId, projectId, weekStartDate = new Date()) {
  const monday = getMonday(weekStartDate)
  const tasks = []

  // Fetch user's content strategy
  const strategy = await fetchContentStrategy(userId)

  if (!strategy) {
    console.error('No content strategy found for user:', userId)
    return { data: null, error: new Error('No content strategy found. Please set up your strategy first.') }
  }

  // Use the saved weekly_template, or regenerate if missing
  const weeklyTemplate = strategy.weekly_template || generateWeeklyTemplate({
    leadStrategy: strategy.lead_strategy,
    primaryPlatform: strategy.primary_platform,
    secondaryPlatform: strategy.secondary_platform,
    selectedDays: strategy.selected_days || ['Monday', 'Wednesday', 'Friday'],
    minutesPerDay: strategy.minutes_per_day || 60,
    contentTypes: strategy.content_types || ['text_post'],
  })

  // Get the days that have tasks
  const daysWithTasks = Object.keys(weeklyTemplate)

  daysWithTasks.forEach((dayName) => {
    // Calculate the date for this day
    const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(dayName)
    if (dayIndex === -1) return

    const taskDate = new Date(monday)
    taskDate.setDate(monday.getDate() + dayIndex)
    const dateStr = formatDate(taskDate)

    // Add each task from the template for this day
    const dayTasks = weeklyTemplate[dayName] || []
    dayTasks.forEach(template => {
      tasks.push({
        user_id: userId,
        project_id: projectId || null,
        date: dateStr,
        day_of_week: dayName,
        task_type: template.task_type,
        platform: template.platform,
        content_type: template.content_type,
        points_value: template.points_value || 10,
        completed: false,
        engagement_likes: 0,
        engagement_comments: 0,
        engagement_shares: 0,
        engagement_dms: 0,
      })
    })
  })

  if (tasks.length === 0) {
    console.error('No tasks generated from template')
    return { data: null, error: new Error('No tasks to generate') }
  }

  const { data, error } = await supabase
    .from('marketing_tasks')
    .insert(tasks)
    .select()

  if (error) {
    console.error('Error generating tasks:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// Check if tasks exist for a given week
export async function checkWeeklyTasksExist(userId, weekStartDate = new Date()) {
  const monday = getMonday(weekStartDate)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const { data, error } = await supabase
    .from('marketing_tasks')
    .select('id')
    .eq('user_id', userId)
    .gte('date', formatDate(monday))
    .lte('date', formatDate(sunday))
    .limit(1)

  if (error) {
    console.error('Error checking tasks:', error)
    return false
  }

  return data && data.length > 0
}

// Fetch tasks for the current week (Monday-Sunday)
export async function fetchWeeklyTasks(userId, weekStartDate = new Date()) {
  const monday = getMonday(weekStartDate)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const { data, error } = await supabase
    .from('marketing_tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('date', formatDate(monday))
    .lte('date', formatDate(sunday))
    .order('date', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching tasks:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// Toggle task completion
export async function toggleTaskCompletion(taskId, completed) {
  const updates = {
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  }

  const { data, error } = await supabase
    .from('marketing_tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    console.error('Error toggling task:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// Update task engagement metrics
export async function updateTaskEngagement(taskId, engagement) {
  const { data, error } = await supabase
    .from('marketing_tasks')
    .update({
      engagement_likes: engagement.likes || 0,
      engagement_comments: engagement.comments || 0,
      engagement_shares: engagement.shares || 0,
      engagement_dms: engagement.dms || 0,
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    console.error('Error updating engagement:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// Get top performing content
export async function getTopPerformers(userId, limit = 5) {
  const { data, error } = await supabase
    .from('marketing_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', true)
    .or('engagement_likes.gt.0,engagement_comments.gt.0')
    .order('engagement_likes', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching top performers:', error)
    return { data: null, error }
  }

  const sorted = (data || []).sort((a, b) => {
    const totalA = (a.engagement_likes || 0) + (a.engagement_comments || 0) + (a.engagement_shares || 0) + (a.engagement_dms || 0)
    const totalB = (b.engagement_likes || 0) + (b.engagement_comments || 0) + (b.engagement_shares || 0) + (b.engagement_dms || 0)
    return totalB - totalA
  })

  return { data: sorted, error: null }
}

// Get week info for display, with optional week offset
export function getWeekInfo(weekOffset = 0) {
  const today = new Date()
  const offsetDate = new Date(today)
  offsetDate.setDate(today.getDate() + (weekOffset * 7))

  const monday = getMonday(offsetDate)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const options = { month: 'short', day: 'numeric' }
  const mondayStr = monday.toLocaleDateString('en-US', options)
  const sundayStr = sunday.toLocaleDateString('en-US', options)

  // Check if this is current week
  const currentWeekMonday = getMonday(new Date())
  const isCurrentWeek = monday.getTime() === currentWeekMonday.getTime()

  return {
    monday,
    sunday,
    label: `${mondayStr} - ${sundayStr}`,
    mondayFormatted: formatDate(monday),
    sundayFormatted: formatDate(sunday),
    isCurrentWeek,
    weekOffset,
  }
}

// Get date object for a specific week offset
export function getWeekStartDate(weekOffset = 0) {
  return getMondayDate(new Date(), weekOffset)
}

// Get today's date info
export function getTodayInfo() {
  const today = new Date()
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayName = dayNames[today.getDay()]

  return {
    date: formatDate(today),
    dayName,
    isWeekday: today.getDay() >= 1 && today.getDay() <= 5,
  }
}

// Check if a task type should have content generation
export function taskHasContentGeneration(contentType) {
  const contentTypes = ['transformation', 'educational', 'build', 'bts', 'community']
  return contentTypes.includes(contentType)
}

// Check if a task type should have engagement tracking
export function taskHasEngagementTracking(contentType) {
  const engagementTypes = ['transformation', 'educational', 'build', 'bts', 'community']
  return engagementTypes.includes(contentType)
}
