/**
 * Content History Service
 * Manages generated content for calendar planning and history tracking
 */
import { supabase } from './supabaseClient'

/**
 * Fetch content history with filters
 * @param {string} userId - User ID
 * @param {object} filters - Filter options
 * @returns {Promise<{data: array, error: object}>}
 */
export async function fetchContentHistory(userId, filters = {}) {
  const {
    status,
    platform,
    contentType,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
    orderBy = 'created_at',
    orderDir = 'desc'
  } = filters

  let query = supabase
    .from('content_history')
    .select('*')
    .eq('user_id', userId)
    .order(orderBy, { ascending: orderDir === 'asc' })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  if (platform) {
    query = query.eq('platform', platform)
  }

  if (contentType) {
    query = query.eq('content_type', contentType)
  }

  if (startDate) {
    query = query.gte('created_at', startDate)
  }

  if (endDate) {
    query = query.lte('created_at', endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching content history:', error)
    return { data: [], error }
  }

  return { data, error: null }
}

/**
 * Get content by ID
 * @param {string} contentId - Content ID
 * @returns {Promise<{data: object, error: object}>}
 */
export async function getContentById(contentId) {
  const { data, error } = await supabase
    .from('content_history')
    .select('*')
    .eq('id', contentId)
    .single()

  return { data, error }
}

/**
 * Update content status
 * @param {string} contentId - Content ID
 * @param {string} status - New status
 * @returns {Promise<{data: object, error: object}>}
 */
export async function updateContentStatus(contentId, status) {
  const updates = { status }

  if (status === 'posted') {
    updates.posted_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('content_history')
    .update(updates)
    .eq('id', contentId)
    .select()
    .single()

  return { data, error }
}

/**
 * Update content text
 * @param {string} contentId - Content ID
 * @param {string} content - New content text
 * @returns {Promise<{data: object, error: object}>}
 */
export async function updateContentText(contentId, content) {
  const { data, error } = await supabase
    .from('content_history')
    .update({ content })
    .eq('id', contentId)
    .select()
    .single()

  return { data, error }
}

/**
 * Delete content
 * @param {string} contentId - Content ID
 * @returns {Promise<{error: object}>}
 */
export async function deleteContent(contentId) {
  const { error } = await supabase
    .from('content_history')
    .delete()
    .eq('id', contentId)

  return { error }
}

/**
 * Bulk delete content
 * @param {string[]} contentIds - Array of content IDs
 * @returns {Promise<{error: object}>}
 */
export async function bulkDeleteContent(contentIds) {
  const { error } = await supabase
    .from('content_history')
    .delete()
    .in('id', contentIds)

  return { error }
}

/**
 * Update content engagement data
 * @param {string} contentId - Content ID
 * @param {object} engagementData - Engagement metrics
 * @returns {Promise<{data: object, error: object}>}
 */
export async function updateEngagement(contentId, engagementData) {
  const { data, error } = await supabase
    .from('content_history')
    .update({
      engagement_data: engagementData,
      status: 'posted'
    })
    .eq('id', contentId)
    .select()
    .single()

  return { data, error }
}

/**
 * Get content stats for a user
 * @param {string} userId - User ID
 * @returns {Promise<object>}
 */
export async function getContentStats(userId) {
  const { data, error } = await supabase
    .from('content_history')
    .select('status, platform, content_type, engagement_data')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching content stats:', error)
    return { total: 0, byStatus: {}, byPlatform: {}, byType: {} }
  }

  const stats = {
    total: data.length,
    byStatus: {},
    byPlatform: {},
    byType: {},
    totalEngagement: {
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      impressions: 0
    }
  }

  data.forEach(item => {
    // Count by status
    stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1

    // Count by platform
    stats.byPlatform[item.platform] = (stats.byPlatform[item.platform] || 0) + 1

    // Count by type
    stats.byType[item.content_type] = (stats.byType[item.content_type] || 0) + 1

    // Sum engagement
    if (item.engagement_data) {
      stats.totalEngagement.likes += item.engagement_data.likes || 0
      stats.totalEngagement.comments += item.engagement_data.comments || 0
      stats.totalEngagement.shares += item.engagement_data.shares || 0
      stats.totalEngagement.saves += item.engagement_data.saves || 0
      stats.totalEngagement.impressions += item.engagement_data.impressions || 0
    }
  })

  return stats
}

/**
 * Export content to CSV format
 * @param {array} content - Content array to export
 * @returns {string} - CSV string
 */
export function exportToCSV(content) {
  const headers = [
    'ID',
    'Content',
    'Platform',
    'Content Type',
    'Status',
    'Scheduled Date',
    'Posted At',
    'Likes',
    'Comments',
    'Shares',
    'Saves',
    'Impressions',
    'Created At'
  ]

  const rows = content.map(item => [
    item.id,
    `"${(item.content || '').replace(/"/g, '""')}"`,
    item.platform,
    item.content_type,
    item.status,
    item.scheduled_date || '',
    item.posted_at || '',
    item.engagement_data?.likes || 0,
    item.engagement_data?.comments || 0,
    item.engagement_data?.shares || 0,
    item.engagement_data?.saves || 0,
    item.engagement_data?.impressions || 0,
    item.created_at
  ])

  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
}

/**
 * Download CSV file
 * @param {string} csvContent - CSV string
 * @param {string} filename - Filename
 */
export function downloadCSV(csvContent, filename = 'content-history.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Get performance metrics for posted content
 * @param {string} userId - User ID
 * @param {object} options - Options
 * @returns {Promise<object>}
 */
export async function getPerformanceMetrics(userId, options = {}) {
  const { days = 30 } = options

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('content_history')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'posted')
    .gte('posted_at', startDate.toISOString())
    .order('posted_at', { ascending: false })

  if (error) {
    console.error('Error fetching performance metrics:', error)
    return null
  }

  // Calculate averages and find top performers
  const metrics = {
    totalPosts: data.length,
    averages: {
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      impressions: 0,
      engagement_rate: 0
    },
    topPerformers: [],
    byPlatform: {},
    byContentType: {},
    trend: []
  }

  if (data.length === 0) return metrics

  // Calculate totals
  let totalLikes = 0, totalComments = 0, totalShares = 0,
      totalSaves = 0, totalImpressions = 0, totalEngagementRate = 0, rateCount = 0

  data.forEach(item => {
    const e = item.engagement_data || {}
    totalLikes += e.likes || 0
    totalComments += e.comments || 0
    totalShares += e.shares || 0
    totalSaves += e.saves || 0
    totalImpressions += e.impressions || 0

    if (e.engagement_rate) {
      totalEngagementRate += e.engagement_rate
      rateCount++
    }

    // By platform
    if (!metrics.byPlatform[item.platform]) {
      metrics.byPlatform[item.platform] = { count: 0, likes: 0, comments: 0, shares: 0 }
    }
    metrics.byPlatform[item.platform].count++
    metrics.byPlatform[item.platform].likes += e.likes || 0
    metrics.byPlatform[item.platform].comments += e.comments || 0
    metrics.byPlatform[item.platform].shares += e.shares || 0

    // By content type
    if (!metrics.byContentType[item.content_type]) {
      metrics.byContentType[item.content_type] = { count: 0, likes: 0, comments: 0 }
    }
    metrics.byContentType[item.content_type].count++
    metrics.byContentType[item.content_type].likes += e.likes || 0
    metrics.byContentType[item.content_type].comments += e.comments || 0
  })

  // Calculate averages
  metrics.averages.likes = Math.round(totalLikes / data.length)
  metrics.averages.comments = Math.round(totalComments / data.length)
  metrics.averages.shares = Math.round(totalShares / data.length)
  metrics.averages.saves = Math.round(totalSaves / data.length)
  metrics.averages.impressions = Math.round(totalImpressions / data.length)
  metrics.averages.engagement_rate = rateCount > 0 ? (totalEngagementRate / rateCount).toFixed(2) : 0

  // Find top performers (by total engagement)
  metrics.topPerformers = data
    .map(item => ({
      ...item,
      totalEngagement: (item.engagement_data?.likes || 0) +
                       (item.engagement_data?.comments || 0) * 2 +
                       (item.engagement_data?.shares || 0) * 3 +
                       (item.engagement_data?.saves || 0) * 2
    }))
    .sort((a, b) => b.totalEngagement - a.totalEngagement)
    .slice(0, 5)

  return metrics
}
