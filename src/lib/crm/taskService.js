/**
 * Task Service - Marketing Quest Board Manager
 * Handles creating, fetching, and managing marketing tasks
 */
import { supabase } from '../supabaseClient'

// Weekly task templates - the standard quests for each day
const TASK_TEMPLATES = {
  Monday: [
    { type: 'LinkedIn: Transformation Story Post', platform: 'LinkedIn', contentType: 'transformation', points: 10, hasContent: true },
    { type: 'Comment on 10 posts', platform: 'LinkedIn', contentType: 'engagement', points: 5, hasContent: false },
    { type: 'Respond to all comments', platform: 'LinkedIn', contentType: 'engagement', points: 5, hasContent: false },
    { type: 'DM 5 warm leads', platform: 'LinkedIn', contentType: 'outreach', points: 10, hasContent: false },
  ],
  Tuesday: [
    { type: 'LinkedIn: Educational Framework Post', platform: 'LinkedIn', contentType: 'educational', points: 10, hasContent: true },
    { type: 'Twitter: Thread version', platform: 'Twitter', contentType: 'educational', points: 8, hasContent: true },
    { type: 'Comment on 10 posts', platform: 'LinkedIn', contentType: 'engagement', points: 5, hasContent: false },
    { type: 'Respond to all comments', platform: 'LinkedIn', contentType: 'engagement', points: 5, hasContent: false },
  ],
  Wednesday: [
    { type: 'LinkedIn: Pre-session hype post', platform: 'LinkedIn', contentType: 'build', points: 10, hasContent: true },
    { type: 'LinkedIn: Results post', platform: 'LinkedIn', contentType: 'build', points: 10, hasContent: true },
    { type: 'Collect testimonials', platform: 'Other', contentType: 'build', points: 30, hasContent: false },
    { type: 'Announce next cohort', platform: 'LinkedIn', contentType: 'build', points: 10, hasContent: true },
  ],
  Thursday: [
    { type: 'LinkedIn: Behind-the-scenes content', platform: 'LinkedIn', contentType: 'bts', points: 10, hasContent: true },
    { type: 'Instagram: Carousel of build process', platform: 'Instagram', contentType: 'bts', points: 12, hasContent: true },
    { type: 'Comment on 10 posts', platform: 'LinkedIn', contentType: 'engagement', points: 5, hasContent: false },
  ],
  Friday: [
    { type: 'LinkedIn: Highlight participant win', platform: 'LinkedIn', contentType: 'community', points: 10, hasContent: true },
    { type: 'Newsletter: Weekly insights', platform: 'Email', contentType: 'community', points: 20, hasContent: false },
    { type: "Respond to all week's DMs", platform: 'LinkedIn', contentType: 'engagement', points: 5, hasContent: false },
    { type: "Plan next week's content", platform: 'Other', contentType: 'planning', points: 0, hasContent: false },
  ],
}

// Get Monday of a given week
function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0]
}

// Generate tasks for a specific week
export async function generateWeeklyTasks(userId, projectId, weekStartDate = new Date()) {
  const monday = getMonday(weekStartDate)
  const tasks = []

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  dayNames.forEach((dayName, dayIndex) => {
    const taskDate = new Date(monday)
    taskDate.setDate(monday.getDate() + dayIndex)
    const dateStr = formatDate(taskDate)

    TASK_TEMPLATES[dayName].forEach(template => {
      tasks.push({
        user_id: userId,
        project_id: projectId || null,
        date: dateStr,
        day_of_week: dayName,
        task_type: template.type,
        platform: template.platform,
        content_type: template.contentType,
        points_value: template.points,
        completed: false,
        engagement_likes: 0,
        engagement_comments: 0,
        engagement_shares: 0,
        engagement_dms: 0,
      })
    })
  })

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
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  const { data, error } = await supabase
    .from('marketing_tasks')
    .select('id')
    .eq('user_id', userId)
    .gte('date', formatDate(monday))
    .lte('date', formatDate(friday))
    .limit(1)

  if (error) {
    console.error('Error checking tasks:', error)
    return false
  }

  return data && data.length > 0
}

// Fetch tasks for the current week
export async function fetchWeeklyTasks(userId, weekStartDate = new Date()) {
  const monday = getMonday(weekStartDate)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  const { data, error } = await supabase
    .from('marketing_tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('date', formatDate(monday))
    .lte('date', formatDate(friday))
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
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  const options = { month: 'short', day: 'numeric' }
  const mondayStr = monday.toLocaleDateString('en-US', options)
  const fridayStr = friday.toLocaleDateString('en-US', options)

  // Check if this is current week
  const currentWeekMonday = getMonday(new Date())
  const isCurrentWeek = monday.getTime() === currentWeekMonday.getTime()

  return {
    monday,
    friday,
    label: `${mondayStr} - ${fridayStr}`,
    mondayFormatted: formatDate(monday),
    fridayFormatted: formatDate(friday),
    isCurrentWeek,
    weekOffset,
  }
}

// Get date object for a specific week offset
export function getWeekStartDate(weekOffset = 0) {
  const today = new Date()
  const offsetDate = new Date(today)
  offsetDate.setDate(today.getDate() + (weekOffset * 7))
  return getMonday(offsetDate)
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
