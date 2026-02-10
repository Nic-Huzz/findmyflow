/**
 * Analytics Service - Report Card Generator
 * Calculates metrics, comparisons, and weekly grades
 */
import { supabase } from '../supabaseClient'
import { getMondayDate, formatLocalDate } from '../dateUtils'

const formatDate = (date) => formatLocalDate(date)

// Get week range
export function getWeekRange(weekOffset = 0) {
  const monday = getMondayDate(new Date(), weekOffset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const options = { month: 'short', day: 'numeric' }

  return {
    start: monday,
    end: sunday,
    startStr: formatDate(monday),
    endStr: formatDate(sunday),
    label: `${monday.toLocaleDateString('en-US', options)} - ${sunday.toLocaleDateString('en-US', options)}`,
  }
}

// Get month range
export function getMonthRange(monthOffset = 0) {
  const now = new Date()
  const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const startDate = formatDate(targetMonth)
  const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0)
  const endDate = formatDate(lastDay)
  const label = targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return {
    start: targetMonth,
    end: lastDay,
    startStr: startDate,
    endStr: endDate,
    label,
  }
}

// Fetch weekly marketing stats
export async function fetchWeeklyMarketingStats(userId, weekOffset = 0) {
  const week = getWeekRange(weekOffset)

  const { data, error } = await supabase
    .from('marketing_tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('date', week.startStr)
    .lte('date', week.endStr)

  if (error) {
    console.error('Error fetching weekly stats:', error)
    return { data: null, error }
  }

  const tasks = data || []
  const completed = tasks.filter(t => t.completed)

  const totalTasks = tasks.length
  const completedTasks = completed.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const pointsEarned = completed.reduce((sum, t) => sum + (t.points_value || 0), 0)
  const pointsPossible = tasks.reduce((sum, t) => sum + (t.points_value || 0), 0)

  const totalLikes = tasks.reduce((sum, t) => sum + (t.engagement_likes || 0), 0)
  const totalComments = tasks.reduce((sum, t) => sum + (t.engagement_comments || 0), 0)
  const totalShares = tasks.reduce((sum, t) => sum + (t.engagement_shares || 0), 0)
  const totalDMs = tasks.reduce((sum, t) => sum + (t.engagement_dms || 0), 0)
  const totalEngagement = totalLikes + totalComments + totalShares + totalDMs

  const byPlatform = {}
  tasks.forEach(t => {
    if (!byPlatform[t.platform]) {
      byPlatform[t.platform] = { total: 0, completed: 0 }
    }
    byPlatform[t.platform].total++
    if (t.completed) byPlatform[t.platform].completed++
  })

  const daysActive = new Set(completed.map(t => t.date)).size

  return {
    data: {
      week,
      totalTasks,
      completedTasks,
      completionRate,
      pointsEarned,
      pointsPossible,
      totalLikes,
      totalComments,
      totalShares,
      totalDMs,
      totalEngagement,
      byPlatform,
      daysActive,
      tasks,
    },
    error: null,
  }
}

// Fetch weekly sales stats
export async function fetchWeeklySalesStats(userId, weekOffset = 0) {
  const week = getWeekRange(weekOffset)

  const { data, error } = await supabase
    .from('sales_deals')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching sales stats:', error)
    return { data: null, error }
  }

  const deals = data || []

  const dealsCreatedThisWeek = deals.filter(d => {
    const created = new Date(d.created_at)
    return created >= week.start && created <= week.end
  })

  const dealsWonThisWeek = deals.filter(d => {
    if (d.status !== 'won') return false
    const closed = new Date(d.actual_close_date || d.updated_at)
    return closed >= week.start && closed <= week.end
  })

  const revenueThisWeek = dealsWonThisWeek.reduce((sum, d) => sum + (d.value || 0), 0)

  const activePipeline = deals.filter(d => !['won', 'lost'].includes(d.status))
  const pipelineValue = activePipeline.reduce((sum, d) => sum + (d.value || 0), 0)

  return {
    data: {
      week,
      dealsCreated: dealsCreatedThisWeek.length,
      dealsWon: dealsWonThisWeek.length,
      revenueThisWeek,
      activePipelineCount: activePipeline.length,
      pipelineValue,
      totalDeals: deals.length,
    },
    error: null,
  }
}

// Fetch monthly marketing stats
export async function fetchMonthlyMarketingStats(userId, monthOffset = 0) {
  const month = getMonthRange(monthOffset)

  const { data, error } = await supabase
    .from('marketing_tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('date', month.startStr)
    .lte('date', month.endStr)

  if (error) {
    console.error('Error fetching monthly stats:', error)
    return { data: null, error }
  }

  const tasks = data || []
  const completed = tasks.filter(t => t.completed)

  const totalTasks = tasks.length
  const completedTasks = completed.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const pointsEarned = completed.reduce((sum, t) => sum + (t.points_value || 0), 0)
  const pointsPossible = tasks.reduce((sum, t) => sum + (t.points_value || 0), 0)

  const totalLikes = tasks.reduce((sum, t) => sum + (t.engagement_likes || 0), 0)
  const totalComments = tasks.reduce((sum, t) => sum + (t.engagement_comments || 0), 0)
  const totalShares = tasks.reduce((sum, t) => sum + (t.engagement_shares || 0), 0)
  const totalDMs = tasks.reduce((sum, t) => sum + (t.engagement_dms || 0), 0)
  const totalEngagement = totalLikes + totalComments + totalShares + totalDMs

  const byPlatform = {}
  tasks.forEach(t => {
    if (!byPlatform[t.platform]) {
      byPlatform[t.platform] = { total: 0, completed: 0 }
    }
    byPlatform[t.platform].total++
    if (t.completed) byPlatform[t.platform].completed++
  })

  const daysActive = new Set(completed.map(t => t.date)).size

  return {
    data: {
      period: month,
      totalTasks,
      completedTasks,
      completionRate,
      pointsEarned,
      pointsPossible,
      totalLikes,
      totalComments,
      totalShares,
      totalDMs,
      totalEngagement,
      byPlatform,
      daysActive,
      tasks,
    },
    error: null,
  }
}

// Fetch monthly sales stats
export async function fetchMonthlySalesStats(userId, monthOffset = 0) {
  const month = getMonthRange(monthOffset)

  const { data, error } = await supabase
    .from('sales_deals')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching monthly sales stats:', error)
    return { data: null, error }
  }

  const deals = data || []

  const dealsCreatedThisMonth = deals.filter(d => {
    const created = new Date(d.created_at)
    return created >= month.start && created <= month.end
  })

  const dealsWonThisMonth = deals.filter(d => {
    if (d.status !== 'won') return false
    const closed = new Date(d.actual_close_date || d.updated_at)
    return closed >= month.start && closed <= month.end
  })

  const revenueThisMonth = dealsWonThisMonth.reduce((sum, d) => sum + (d.value || 0), 0)

  const activePipeline = deals.filter(d => !['won', 'lost'].includes(d.status))
  const pipelineValue = activePipeline.reduce((sum, d) => sum + (d.value || 0), 0)

  return {
    data: {
      period: month,
      dealsCreated: dealsCreatedThisMonth.length,
      dealsWon: dealsWonThisMonth.length,
      revenueThisPeriod: revenueThisMonth,
      activePipelineCount: activePipeline.length,
      pipelineValue,
      totalDeals: deals.length,
    },
    error: null,
  }
}

// Fetch monthly platform breakdown
export async function fetchMonthlyPlatformBreakdown(userId, monthOffset = 0) {
  const month = getMonthRange(monthOffset)

  const { data: tasks, error: tasksError } = await supabase
    .from('marketing_tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('date', month.startStr)
    .lte('date', month.endStr)

  const { data: deals, error: dealsError } = await supabase
    .from('sales_deals')
    .select('*')
    .eq('user_id', userId)

  if (tasksError || dealsError) {
    console.error('Error fetching monthly platform breakdown:', tasksError || dealsError)
    return { data: null, error: tasksError || dealsError }
  }

  const platformStats = {}

  ;(tasks || []).forEach(task => {
    const platform = task.platform || 'Other'
    if (!platformStats[platform]) {
      platformStats[platform] = {
        platform,
        ...PLATFORM_INFO[platform] || PLATFORM_INFO.Other,
        tasks: 0,
        completed: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        dms: 0,
        totalEngagement: 0,
        leadsGenerated: 0,
        dealsWon: 0,
        revenue: 0,
      }
    }

    platformStats[platform].tasks++
    if (task.completed) platformStats[platform].completed++
    platformStats[platform].likes += task.engagement_likes || 0
    platformStats[platform].comments += task.engagement_comments || 0
    platformStats[platform].shares += task.engagement_shares || 0
    platformStats[platform].dms += task.engagement_dms || 0
    platformStats[platform].totalEngagement +=
      (task.engagement_likes || 0) +
      (task.engagement_comments || 0) +
      (task.engagement_shares || 0) +
      (task.engagement_dms || 0)
  })

  ;(deals || []).forEach(deal => {
    const source = deal.lead_source || 'Other'
    if (!platformStats[source]) {
      platformStats[source] = {
        platform: source,
        ...PLATFORM_INFO[source] || PLATFORM_INFO.Other,
        tasks: 0,
        completed: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        dms: 0,
        totalEngagement: 0,
        leadsGenerated: 0,
        dealsWon: 0,
        revenue: 0,
      }
    }

    const createdAt = new Date(deal.created_at)
    if (createdAt >= month.start && createdAt <= month.end) {
      platformStats[source].leadsGenerated++
    }

    if (deal.status === 'won') {
      const closedAt = new Date(deal.actual_close_date || deal.updated_at)
      if (closedAt >= month.start && closedAt <= month.end) {
        platformStats[source].dealsWon++
        platformStats[source].revenue += deal.value || 0
      }
    }
  })

  const breakdown = Object.values(platformStats)
    .sort((a, b) => b.totalEngagement - a.totalEngagement)

  const totals = breakdown.reduce(
    (acc, p) => ({
      totalEngagement: acc.totalEngagement + p.totalEngagement,
      totalLeads: acc.totalLeads + p.leadsGenerated,
      totalRevenue: acc.totalRevenue + p.revenue,
    }),
    { totalEngagement: 0, totalLeads: 0, totalRevenue: 0 }
  )

  return {
    data: {
      period: month,
      breakdown,
      totals,
    },
    error: null,
  }
}

// Calculate report card grade
export function calculateGrade(percentage) {
  if (percentage >= 90) return { letter: 'A', emoji: '🌟' }
  if (percentage >= 80) return { letter: 'B', emoji: '👍' }
  if (percentage >= 70) return { letter: 'C', emoji: '📈' }
  if (percentage >= 60) return { letter: 'D', emoji: '💪' }
  return { letter: 'F', emoji: '🔥' }
}

// Calculate overall weekly grade
export function calculateWeeklyGrade(marketingStats, salesStats, userStats) {
  const weights = {
    taskCompletion: 0.4,
    engagement: 0.2,
    salesActivity: 0.2,
    consistency: 0.2,
  }

  const taskScore = marketingStats?.completionRate || 0
  const engagementScore = Math.min(100, ((marketingStats?.totalEngagement || 0) / 100) * 100)
  const salesScore = Math.min(100,
    ((salesStats?.dealsCreated || 0) * 25) +
    ((salesStats?.dealsWon || 0) * 50)
  )

  const daysActiveScore = Math.min(100, ((marketingStats?.daysActive || 0) / 5) * 100)
  const streakBonus = Math.min(20, (userStats?.current_streak || 0) * 2)
  const consistencyScore = Math.min(100, daysActiveScore + streakBonus)

  const overallScore =
    taskScore * weights.taskCompletion +
    engagementScore * weights.engagement +
    salesScore * weights.salesActivity +
    consistencyScore * weights.consistency

  return {
    overall: Math.round(overallScore),
    grade: calculateGrade(overallScore),
    breakdown: {
      taskCompletion: { score: Math.round(taskScore), weight: weights.taskCompletion },
      engagement: { score: Math.round(engagementScore), weight: weights.engagement },
      salesActivity: { score: Math.round(salesScore), weight: weights.salesActivity },
      consistency: { score: Math.round(consistencyScore), weight: weights.consistency },
    },
  }
}

// Get top performing content
export async function fetchTopContent(userId, limit = 5) {
  const { data, error } = await supabase
    .from('marketing_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', true)
    .order('engagement_likes', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching top content:', error)
    return { data: null, error }
  }

  const sorted = (data || [])
    .map(task => ({
      ...task,
      totalEngagement:
        (task.engagement_likes || 0) +
        (task.engagement_comments || 0) +
        (task.engagement_shares || 0) +
        (task.engagement_dms || 0),
    }))
    .filter(t => t.totalEngagement > 0)
    .sort((a, b) => b.totalEngagement - a.totalEngagement)
    .slice(0, limit)

  return { data: sorted, error: null }
}

// Compare two weeks
export function compareWeeks(thisWeek, lastWeek) {
  const compare = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  return {
    tasksChange: compare(thisWeek?.completedTasks || 0, lastWeek?.completedTasks || 0),
    pointsChange: compare(thisWeek?.pointsEarned || 0, lastWeek?.pointsEarned || 0),
    engagementChange: compare(thisWeek?.totalEngagement || 0, lastWeek?.totalEngagement || 0),
    completionRateChange: (thisWeek?.completionRate || 0) - (lastWeek?.completionRate || 0),
  }
}

// Platform info with colors and icons
const PLATFORM_INFO = {
  Instagram: { emoji: '📸', color: '#E4405F' },
  Facebook: { emoji: '📘', color: '#1877F2' },
  LinkedIn: { emoji: '💼', color: '#0A66C2' },
  Twitter: { emoji: '🐦', color: '#1DA1F2' },
  TikTok: { emoji: '🎵', color: '#000000' },
  YouTube: { emoji: '▶️', color: '#FF0000' },
  Email: { emoji: '📧', color: '#EA4335' },
  Blog: { emoji: '📝', color: '#FF6B35' },
  Other: { emoji: '🌐', color: '#6B7280' },
}

// Fetch platform breakdown with engagement and deals
export async function fetchPlatformBreakdown(userId, weekOffset = 0) {
  const week = getWeekRange(weekOffset)

  // Fetch marketing tasks for this week
  const { data: tasks, error: tasksError } = await supabase
    .from('marketing_tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('date', week.startStr)
    .lte('date', week.endStr)

  // Fetch deals with lead source
  const { data: deals, error: dealsError } = await supabase
    .from('sales_deals')
    .select('*')
    .eq('user_id', userId)

  if (tasksError || dealsError) {
    console.error('Error fetching platform breakdown:', tasksError || dealsError)
    return { data: null, error: tasksError || dealsError }
  }

  // Calculate platform stats from tasks
  const platformStats = {}

  ;(tasks || []).forEach(task => {
    const platform = task.platform || 'Other'
    if (!platformStats[platform]) {
      platformStats[platform] = {
        platform,
        ...PLATFORM_INFO[platform] || PLATFORM_INFO.Other,
        tasks: 0,
        completed: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        dms: 0,
        totalEngagement: 0,
        leadsGenerated: 0,
        dealsWon: 0,
        revenue: 0,
      }
    }

    platformStats[platform].tasks++
    if (task.completed) platformStats[platform].completed++
    platformStats[platform].likes += task.engagement_likes || 0
    platformStats[platform].comments += task.engagement_comments || 0
    platformStats[platform].shares += task.engagement_shares || 0
    platformStats[platform].dms += task.engagement_dms || 0
    platformStats[platform].totalEngagement +=
      (task.engagement_likes || 0) +
      (task.engagement_comments || 0) +
      (task.engagement_shares || 0) +
      (task.engagement_dms || 0)
  })

  // Add deal stats by lead source
  ;(deals || []).forEach(deal => {
    const source = deal.lead_source || 'Other'
    if (!platformStats[source]) {
      platformStats[source] = {
        platform: source,
        ...PLATFORM_INFO[source] || PLATFORM_INFO.Other,
        tasks: 0,
        completed: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        dms: 0,
        totalEngagement: 0,
        leadsGenerated: 0,
        dealsWon: 0,
        revenue: 0,
      }
    }

    // Count as lead if created this week
    const createdAt = new Date(deal.created_at)
    if (createdAt >= week.start && createdAt <= week.end) {
      platformStats[source].leadsGenerated++
    }

    // Count won deals
    if (deal.status === 'won') {
      platformStats[source].dealsWon++
      platformStats[source].revenue += deal.value || 0
    }
  })

  // Convert to array and sort by engagement
  const breakdown = Object.values(platformStats)
    .sort((a, b) => b.totalEngagement - a.totalEngagement)

  // Calculate totals
  const totals = breakdown.reduce(
    (acc, p) => ({
      totalEngagement: acc.totalEngagement + p.totalEngagement,
      totalLeads: acc.totalLeads + p.leadsGenerated,
      totalRevenue: acc.totalRevenue + p.revenue,
    }),
    { totalEngagement: 0, totalLeads: 0, totalRevenue: 0 }
  )

  return {
    data: {
      week,
      breakdown,
      totals,
    },
    error: null,
  }
}
