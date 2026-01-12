/**
 * Intelligence Engine
 * Analyzes performance data to generate insights and recommendations
 * Personalizes benchmarks based on user's actual data
 */
import { supabase } from './supabaseClient'

// ============================================
// PART B: PERFORMANCE INTELLIGENCE
// ============================================

/**
 * Get performance insights from last 30 days of content
 * Analyzes patterns to find what works best for this user
 */
export async function getPerformanceInsights(userId) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Fetch posted content with metrics
  const { data: content, error } = await supabase
    .from('content_history')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'posted')
    .gte('posted_at', thirtyDaysAgo.toISOString())
    .order('posted_at', { ascending: false })

  if (error) {
    console.error('Error fetching content for insights:', error)
    return null
  }

  if (!content || content.length < 3) {
    return {
      hasEnoughData: false,
      message: 'Need at least 3 posted pieces with metrics for insights',
      contentCount: content?.length || 0
    }
  }

  // Calculate insights
  const insights = {
    hasEnoughData: true,
    contentCount: content.length,
    period: '30 days',

    // Performance by content type
    byContentType: analyzeByDimension(content, 'content_type'),

    // Performance by platform
    byPlatform: analyzeByDimension(content, 'platform'),

    // Performance by day of week
    byDayOfWeek: analyzeByDayOfWeek(content),

    // Overall metrics
    avgEngagement: calculateAvgEngagement(content),

    // Top performers
    topPerformers: getTopPerformers(content, 3),

    // Trends
    trends: calculateTrends(content),

    // Generated recommendations
    recommendations: []
  }

  // Generate recommendations based on insights
  insights.recommendations = generateRecommendations(insights)

  return insights
}

/**
 * Analyze performance by a specific dimension (content_type, platform)
 */
function analyzeByDimension(content, dimension) {
  const groups = {}

  content.forEach(item => {
    const key = item[dimension] || 'unknown'
    if (!groups[key]) {
      groups[key] = { items: [], totalEngagement: 0 }
    }

    const engagement = getEngagementScore(item)
    groups[key].items.push(item)
    groups[key].totalEngagement += engagement
  })

  // Calculate averages and find best
  const results = Object.entries(groups).map(([name, data]) => ({
    name,
    count: data.items.length,
    avgEngagement: data.items.length > 0 ? data.totalEngagement / data.items.length : 0,
    totalEngagement: data.totalEngagement
  }))

  // Sort by average engagement
  results.sort((a, b) => b.avgEngagement - a.avgEngagement)

  return {
    breakdown: results,
    best: results[0] || null,
    worst: results[results.length - 1] || null
  }
}

/**
 * Analyze performance by day of week
 */
function analyzeByDayOfWeek(content) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayGroups = {}

  days.forEach(day => {
    dayGroups[day] = { items: [], totalEngagement: 0 }
  })

  content.forEach(item => {
    if (!item.posted_at) return
    const dayIndex = new Date(item.posted_at).getDay()
    const dayName = days[dayIndex]
    const engagement = getEngagementScore(item)

    dayGroups[dayName].items.push(item)
    dayGroups[dayName].totalEngagement += engagement
  })

  const results = Object.entries(dayGroups)
    .filter(([, data]) => data.items.length > 0)
    .map(([name, data]) => ({
      name,
      count: data.items.length,
      avgEngagement: data.totalEngagement / data.items.length
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)

  return {
    breakdown: results,
    best: results[0] || null,
    worst: results[results.length - 1] || null
  }
}

/**
 * Get engagement score from content item
 */
function getEngagementScore(item) {
  // Try engagement_data JSONB first
  if (item.engagement_data) {
    const data = typeof item.engagement_data === 'string'
      ? JSON.parse(item.engagement_data)
      : item.engagement_data
    return (data.likes || 0) + (data.comments || 0) * 2 + (data.shares || 0) * 3 + (data.dms || 0) * 4
  }

  // Fall back to individual fields
  return (item.likes || 0) + (item.comments || 0) * 2 + (item.shares || 0) * 3 + (item.dms || 0) * 4
}

/**
 * Calculate average engagement across all content
 */
function calculateAvgEngagement(content) {
  if (content.length === 0) return 0

  const total = content.reduce((sum, item) => sum + getEngagementScore(item), 0)
  return Math.round(total / content.length)
}

/**
 * Get top performing content pieces
 */
function getTopPerformers(content, limit = 3) {
  return [...content]
    .map(item => ({
      ...item,
      engagementScore: getEngagementScore(item)
    }))
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, limit)
}

/**
 * Calculate engagement trends (week over week)
 */
function calculateTrends(content) {
  if (content.length < 5) {
    return { engagementTrend: null, volumeTrend: null, message: 'Need more data for trends' }
  }

  // Split into two halves (recent vs older)
  const midpoint = Math.floor(content.length / 2)
  const recentHalf = content.slice(0, midpoint)
  const olderHalf = content.slice(midpoint)

  const recentAvg = calculateAvgEngagement(recentHalf)
  const olderAvg = calculateAvgEngagement(olderHalf)

  const change = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0

  return {
    engagementTrend: {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      percentage: Math.round(change),
      recentAvg,
      olderAvg
    },
    volumeTrend: {
      recentCount: recentHalf.length,
      olderCount: olderHalf.length
    }
  }
}

/**
 * Generate actionable recommendations based on insights
 */
function generateRecommendations(insights) {
  const recommendations = []

  // Content type recommendation
  if (insights.byContentType?.best && insights.byContentType?.worst) {
    const best = insights.byContentType.best
    const worst = insights.byContentType.worst

    if (best.avgEngagement > worst.avgEngagement * 1.5 && best.count >= 2) {
      recommendations.push({
        type: 'content_type',
        priority: 'high',
        icon: '📈',
        title: `${best.name} posts perform ${Math.round(best.avgEngagement / (worst.avgEngagement || 1))}x better`,
        message: `Your ${best.name} content averages ${Math.round(best.avgEngagement)} engagement vs ${Math.round(worst.avgEngagement)} for ${worst.name}. Consider creating more ${best.name} content.`,
        action: {
          type: 'increase_frequency',
          contentType: best.name
        }
      })
    }
  }

  // Day of week recommendation
  if (insights.byDayOfWeek?.best && insights.byDayOfWeek.best.count >= 2) {
    const bestDay = insights.byDayOfWeek.best
    recommendations.push({
      type: 'timing',
      priority: 'medium',
      icon: '📅',
      title: `${bestDay.name} is your best day`,
      message: `Posts on ${bestDay.name} average ${Math.round(bestDay.avgEngagement)} engagement. Schedule your most important content then.`,
      action: {
        type: 'optimize_schedule',
        preferredDay: bestDay.name
      }
    })
  }

  // Platform recommendation
  if (insights.byPlatform?.best && insights.byPlatform.breakdown.length > 1) {
    const best = insights.byPlatform.best
    const second = insights.byPlatform.breakdown[1]

    if (best.avgEngagement > second.avgEngagement * 1.3) {
      recommendations.push({
        type: 'platform',
        priority: 'medium',
        icon: '🎯',
        title: `${best.name} is your strongest platform`,
        message: `Focus on ${best.name} where you get ${Math.round(best.avgEngagement)} avg engagement vs ${Math.round(second.avgEngagement)} on ${second.name}.`,
        action: {
          type: 'focus_platform',
          platform: best.name
        }
      })
    }
  }

  // Trend recommendation
  if (insights.trends?.engagementTrend) {
    const trend = insights.trends.engagementTrend
    if (trend.direction === 'up' && trend.percentage > 10) {
      recommendations.push({
        type: 'trend',
        priority: 'low',
        icon: '🚀',
        title: `Engagement up ${trend.percentage}%`,
        message: `Your recent content is performing better. Keep doing what you're doing!`,
        action: { type: 'continue_strategy' }
      })
    } else if (trend.direction === 'down' && trend.percentage < -15) {
      recommendations.push({
        type: 'trend',
        priority: 'high',
        icon: '⚠️',
        title: `Engagement down ${Math.abs(trend.percentage)}%`,
        message: `Recent content isn't resonating as well. Review your top performers and replicate what worked.`,
        action: { type: 'review_top_performers' }
      })
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return recommendations
}

// ============================================
// PART C: STRATEGY AUTO-ADJUSTMENT
// ============================================

/**
 * Industry benchmark conversion rates (defaults)
 */
export const INDUSTRY_BENCHMARKS = {
  reach_to_engagement: 0.05,      // 5% - people who engage with posts
  engagement_to_lead: 0.25,       // 25% - engaged → lead magnet opt-in
  lead_to_nurture: 0.40,          // 40% - lead → engaged with nurture
  nurture_to_customer: 0.05,      // 5% - nurtured → purchase
  customer_to_upsell: 0.20,       // 20% - customer → upsell
  customer_to_downsell: 0.30,     // 30% - non-upsell customer → downsell
  customer_to_continuity: 0.15   // 15% - customer → subscription
}

/**
 * Calculate user's actual conversion rates from historical funnel data
 * Returns personalized rates if enough data exists
 */
export async function getUserConversionRates(userId) {
  // Fetch user's funnel metrics
  const { data: funnelData, error } = await supabase
    .from('funnel_metrics')
    .select('actual_values, campaign_name, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(12) // Last 12 entries (could be weeks or campaigns)

  if (error) {
    console.error('Error fetching funnel data:', error)
    return null
  }

  if (!funnelData || funnelData.length < 3) {
    return {
      hasEnoughData: false,
      source: 'industry',
      rates: INDUSTRY_BENCHMARKS,
      confidence: 'none',
      message: 'Using industry benchmarks. Track 3+ campaigns for personalized rates.'
    }
  }

  // Aggregate actual values across campaigns
  const aggregated = {
    totalReach: 0,
    totalEngagement: 0,
    totalLeads: 0,
    totalNurtured: 0,
    totalCustomers: 0,
    totalUpsells: 0,
    totalDownsells: 0,
    totalContinuity: 0
  }

  funnelData.forEach(entry => {
    const values = entry.actual_values || {}
    aggregated.totalReach += values.awareness || 0
    aggregated.totalEngagement += values.attraction_offer || 0
    aggregated.totalLeads += values.lead_magnet || 0
    aggregated.totalNurtured += values.nurture || 0
    aggregated.totalCustomers += values.core_offer || 0
    aggregated.totalUpsells += values.upsell || 0
    aggregated.totalDownsells += values.downsell || 0
    aggregated.totalContinuity += values.continuity || 0
  })

  // Calculate actual rates (with safety checks)
  const rates = {
    reach_to_engagement: aggregated.totalReach > 0
      ? aggregated.totalEngagement / aggregated.totalReach
      : INDUSTRY_BENCHMARKS.reach_to_engagement,

    engagement_to_lead: aggregated.totalEngagement > 0
      ? aggregated.totalLeads / aggregated.totalEngagement
      : INDUSTRY_BENCHMARKS.engagement_to_lead,

    lead_to_nurture: aggregated.totalLeads > 0
      ? aggregated.totalNurtured / aggregated.totalLeads
      : INDUSTRY_BENCHMARKS.lead_to_nurture,

    nurture_to_customer: aggregated.totalNurtured > 0
      ? aggregated.totalCustomers / aggregated.totalNurtured
      : INDUSTRY_BENCHMARKS.nurture_to_customer,

    customer_to_upsell: aggregated.totalCustomers > 0
      ? aggregated.totalUpsells / aggregated.totalCustomers
      : INDUSTRY_BENCHMARKS.customer_to_upsell,

    customer_to_downsell: aggregated.totalCustomers > 0
      ? aggregated.totalDownsells / aggregated.totalCustomers
      : INDUSTRY_BENCHMARKS.customer_to_downsell,

    customer_to_continuity: aggregated.totalCustomers > 0
      ? aggregated.totalContinuity / aggregated.totalCustomers
      : INDUSTRY_BENCHMARKS.customer_to_continuity
  }

  // Determine confidence level
  const confidence = funnelData.length >= 8 ? 'high'
    : funnelData.length >= 5 ? 'medium'
    : 'low'

  // Compare to industry benchmarks
  const comparison = compareToIndustry(rates)

  return {
    hasEnoughData: true,
    source: 'user_data',
    rates,
    confidence,
    campaignCount: funnelData.length,
    comparison,
    aggregated
  }
}

/**
 * Compare user rates to industry benchmarks
 */
function compareToIndustry(userRates) {
  const comparison = {}

  Object.entries(userRates).forEach(([key, value]) => {
    const industry = INDUSTRY_BENCHMARKS[key]
    const diff = ((value - industry) / industry) * 100

    comparison[key] = {
      userRate: value,
      industryRate: industry,
      difference: Math.round(diff),
      status: diff > 20 ? 'above' : diff < -20 ? 'below' : 'average'
    }
  })

  // Calculate overall performance
  const diffs = Object.values(comparison).map(c => c.difference)
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length

  comparison.overall = {
    avgDifference: Math.round(avgDiff),
    status: avgDiff > 15 ? 'outperforming' : avgDiff < -15 ? 'underperforming' : 'average'
  }

  return comparison
}

/**
 * Calculate required reach based on revenue goal
 * Uses personalized rates if available, falls back to industry
 */
export async function calculateRequiredReach(userId, revenueGoal, coreOfferPrice) {
  // Get user's conversion rates
  const ratesData = await getUserConversionRates(userId)
  const rates = ratesData?.rates || INDUSTRY_BENCHMARKS

  // Work backwards from revenue goal
  const customersNeeded = Math.ceil(revenueGoal / coreOfferPrice)
  const nurturedNeeded = Math.ceil(customersNeeded / rates.nurture_to_customer)
  const leadsNeeded = Math.ceil(nurturedNeeded / rates.lead_to_nurture)
  const engagementsNeeded = Math.ceil(leadsNeeded / rates.engagement_to_lead)
  const reachNeeded = Math.ceil(engagementsNeeded / rates.reach_to_engagement)

  return {
    revenueGoal,
    coreOfferPrice,
    funnel: {
      customersNeeded,
      nurturedNeeded,
      leadsNeeded,
      engagementsNeeded,
      reachNeeded
    },
    ratesUsed: rates,
    ratesSource: ratesData?.source || 'industry',
    confidence: ratesData?.confidence || 'none',
    comparison: ratesData?.comparison
  }
}

/**
 * Calculate posts needed per week based on reach goal and avg reach per post
 */
export function calculatePostsNeeded(reachPerMonth, avgReachPerPost = 1000) {
  const postsPerMonth = Math.ceil(reachPerMonth / avgReachPerPost)
  const postsPerWeek = Math.ceil(postsPerMonth / 4)

  return {
    postsPerMonth,
    postsPerWeek,
    avgReachPerPost,
    note: postsPerWeek > 21
      ? 'This is high volume. Consider improving conversion rates or reach per post.'
      : postsPerWeek > 14
        ? 'Moderate-high volume. Batch content creation recommended.'
        : 'Achievable volume for most creators.'
  }
}

// ============================================
// COMBINED INTELLIGENCE SUMMARY
// ============================================

/**
 * Get complete intelligence summary for a user
 * Combines performance insights, conversion rates, and recommendations
 */
export async function getIntelligenceSummary(userId) {
  // Fetch all intelligence data in parallel
  const [performanceInsights, conversionRates] = await Promise.all([
    getPerformanceInsights(userId),
    getUserConversionRates(userId)
  ])

  // Build summary
  const summary = {
    fetchedAt: new Date().toISOString(),
    performance: performanceInsights,
    conversionRates,

    // Key highlights for dashboard widget
    highlights: []
  }

  // Add performance highlights
  if (performanceInsights?.hasEnoughData) {
    if (performanceInsights.byContentType?.best) {
      summary.highlights.push({
        icon: '📈',
        text: `${performanceInsights.byContentType.best.name} posts get ${Math.round(performanceInsights.byContentType.best.avgEngagement)} avg engagement`,
        type: 'content_type'
      })
    }

    if (performanceInsights.byDayOfWeek?.best) {
      summary.highlights.push({
        icon: '📅',
        text: `${performanceInsights.byDayOfWeek.best.name} is your best day`,
        type: 'timing'
      })
    }

    if (performanceInsights.trends?.engagementTrend?.direction === 'up') {
      summary.highlights.push({
        icon: '🚀',
        text: `Engagement up ${performanceInsights.trends.engagementTrend.percentage}%`,
        type: 'trend'
      })
    }
  }

  // Add conversion rate highlights
  if (conversionRates?.hasEnoughData && conversionRates.comparison?.overall) {
    const overall = conversionRates.comparison.overall
    if (overall.status === 'outperforming') {
      summary.highlights.push({
        icon: '🎯',
        text: `Your funnel beats industry by ${overall.avgDifference}%`,
        type: 'funnel'
      })
    } else if (overall.status === 'underperforming') {
      summary.highlights.push({
        icon: '⚠️',
        text: `Funnel ${Math.abs(overall.avgDifference)}% below industry avg`,
        type: 'funnel_warning'
      })
    }
  }

  return summary
}

/**
 * Get quick stats for dashboard header
 */
export async function getQuickStats(userId) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Fetch counts in parallel
  const [contentResult, storiesResult] = await Promise.all([
    supabase
      .from('content_history')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'posted')
      .gte('posted_at', thirtyDaysAgo.toISOString()),

    supabase
      .from('story_bank')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
  ])

  return {
    postsLast30Days: contentResult.count || 0,
    totalStories: storiesResult.count || 0
  }
}

// ============================================
// GIVE VS ASK ANALYTICS (Hormozi-style)
// ============================================

/**
 * Content Intent Labels - Hormozi's Give/Ask framework
 * Give: Brand building, value-first content (70-80% of content)
 * Ask: Direct response, sales-focused content (20-30% of content)
 */
export const CONTENT_INTENT = {
  give: {
    label: 'Give',
    description: 'Brand building, value, education, entertainment',
    icon: '🎁',
    targetRatio: 0.75 // 75% of content should be Give
  },
  ask: {
    label: 'Ask',
    description: 'Sales, offers, CTAs, direct response',
    icon: '💰',
    targetRatio: 0.25 // 25% of content should be Ask
  }
}

/**
 * CTA Types for Ask posts
 */
export const CTA_TYPES = {
  dm: { label: 'DM Me', icon: '💬', description: 'Direct message to start conversation' },
  link: { label: 'Link Click', icon: '🔗', description: 'Click link in bio or story' },
  comment: { label: 'Comment Keyword', icon: '💬', description: 'Comment a word to trigger DM' },
  signup: { label: 'Sign Up', icon: '📝', description: 'Form submission or email opt-in' },
  call: { label: 'Book Call', icon: '📞', description: 'Schedule a call or meeting' },
  none: { label: 'No CTA', icon: '➖', description: 'No specific call to action' }
}

/**
 * Analyze Give/Ask ratio and performance
 */
export async function getGiveAskAnalytics(userId) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Fetch posted content with intent
  const { data: content, error } = await supabase
    .from('content_history')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'posted')
    .gte('posted_at', thirtyDaysAgo.toISOString())

  if (error || !content || content.length === 0) {
    return {
      hasData: false,
      message: 'No posted content in last 30 days'
    }
  }

  // Count by intent
  const giveContent = content.filter(c => c.content_intent !== 'ask')
  const askContent = content.filter(c => c.content_intent === 'ask')

  // Calculate ratio
  const giveRatio = giveContent.length / content.length
  const askRatio = askContent.length / content.length

  // Calculate engagement by intent
  const giveEngagement = calculateAvgEngagement(giveContent)
  const askEngagement = calculateAvgEngagement(askContent)

  // Calculate CTA performance for Ask posts
  const ctaPerformance = analyzeCTAPerformance(askContent)

  // Calculate conversions from Ask posts
  const totalCTAEngagements = askContent.reduce((sum, c) => sum + (c.cta_engagements || 0), 0)
  const totalConversions = askContent.reduce((sum, c) => sum + (c.cta_conversions || 0), 0)
  const conversionRate = totalCTAEngagements > 0 ? totalConversions / totalCTAEngagements : 0

  // Generate recommendations
  const recommendations = []

  // Check ratio balance
  const idealGiveRatio = CONTENT_INTENT.give.targetRatio
  if (giveRatio < idealGiveRatio - 0.15) {
    recommendations.push({
      type: 'ratio',
      priority: 'high',
      icon: '⚖️',
      title: 'Too much Ask content',
      message: `You're at ${Math.round(giveRatio * 100)}% Give / ${Math.round(askRatio * 100)}% Ask. Aim for 75/25. Add more value-first content.`
    })
  } else if (askRatio < 0.10 && content.length >= 5) {
    recommendations.push({
      type: 'ratio',
      priority: 'medium',
      icon: '💰',
      title: 'Not enough Ask content',
      message: `You're at ${Math.round(askRatio * 100)}% Ask posts. You've earned the right to sell more. Add some CTA posts.`
    })
  }

  // CTA type recommendation
  if (ctaPerformance.best && ctaPerformance.best.conversionRate > 0) {
    recommendations.push({
      type: 'cta',
      priority: 'medium',
      icon: '🎯',
      title: `${CTA_TYPES[ctaPerformance.best.type]?.label || ctaPerformance.best.type} CTAs work best`,
      message: `${Math.round(ctaPerformance.best.conversionRate * 100)}% conversion rate. Use more of these.`
    })
  }

  return {
    hasData: true,
    period: '30 days',
    total: content.length,

    // Ratio breakdown
    ratio: {
      give: {
        count: giveContent.length,
        percentage: Math.round(giveRatio * 100),
        avgEngagement: Math.round(giveEngagement)
      },
      ask: {
        count: askContent.length,
        percentage: Math.round(askRatio * 100),
        avgEngagement: Math.round(askEngagement)
      },
      isBalanced: giveRatio >= 0.60 && giveRatio <= 0.85
    },

    // CTA performance
    cta: {
      totalEngagements: totalCTAEngagements,
      totalConversions,
      conversionRate: Math.round(conversionRate * 100),
      byType: ctaPerformance.byType,
      best: ctaPerformance.best
    },

    recommendations
  }
}

/**
 * Analyze CTA performance by type
 */
function analyzeCTAPerformance(askContent) {
  const byType = {}

  askContent.forEach(item => {
    const ctaType = item.cta_type || 'none'
    if (!byType[ctaType]) {
      byType[ctaType] = {
        type: ctaType,
        count: 0,
        totalEngagements: 0,
        totalConversions: 0
      }
    }

    byType[ctaType].count++
    byType[ctaType].totalEngagements += item.cta_engagements || 0
    byType[ctaType].totalConversions += item.cta_conversions || 0
  })

  // Calculate conversion rates
  Object.values(byType).forEach(t => {
    t.conversionRate = t.totalEngagements > 0
      ? t.totalConversions / t.totalEngagements
      : 0
  })

  // Find best performing CTA type
  const typesArray = Object.values(byType).filter(t => t.count >= 2)
  const best = typesArray.sort((a, b) => b.conversionRate - a.conversionRate)[0] || null

  return { byType, best }
}

/**
 * Track a CTA conversion
 */
export async function trackCTAConversion(userId, contentId, conversionType, revenueAttributed = 0, notes = '') {
  const { data, error } = await supabase
    .from('cta_conversions')
    .insert({
      user_id: userId,
      content_id: contentId,
      conversion_type: conversionType,
      revenue_attributed: revenueAttributed,
      notes,
      converted_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error tracking CTA conversion:', error)
    return { error }
  }

  // Also update the content_history record
  await supabase.rpc('increment_cta_conversions', { content_id: contentId })

  return { data, error: null }
}

// ============================================
// NERVOUS SYSTEM PATTERN ANALYTICS
// ============================================

/**
 * Get nervous system patterns from task skip reasons
 * Identifies what the user's nervous system feels safe/unsafe with
 */
export async function getNervousSystemPatterns(userId) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Fetch skip reasons
  const { data: skipReasons, error } = await supabase
    .from('task_skip_reasons')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  if (error || !skipReasons || skipReasons.length === 0) {
    return {
      hasData: false,
      message: 'No skip data yet. This builds over time as you interact with tasks.'
    }
  }

  // Separate external vs internal
  const external = skipReasons.filter(r => r.reason_category === 'external')
  const internal = skipReasons.filter(r => r.reason_category === 'internal')

  // Count external reasons
  const externalCounts = {}
  external.forEach(r => {
    externalCounts[r.external_reason] = (externalCounts[r.external_reason] || 0) + 1
  })

  // Count internal reasons with intensity tracking
  const internalAnalysis = {}
  internal.forEach(r => {
    if (!internalAnalysis[r.internal_reason]) {
      internalAnalysis[r.internal_reason] = {
        count: 0,
        totalIntensity: 0,
        occurrences: []
      }
    }
    internalAnalysis[r.internal_reason].count++
    internalAnalysis[r.internal_reason].totalIntensity += r.intensity || 5
    internalAnalysis[r.internal_reason].occurrences.push({
      date: r.created_at,
      intensity: r.intensity,
      taskType: r.task_type
    })
  })

  // Calculate averages and sort by frequency
  const internalPatterns = Object.entries(internalAnalysis)
    .map(([reason, data]) => ({
      reason,
      count: data.count,
      avgIntensity: Math.round((data.totalIntensity / data.count) * 10) / 10,
      trend: calculateTrendDirection(data.occurrences)
    }))
    .sort((a, b) => b.count - a.count)

  const externalPatterns = Object.entries(externalCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)

  // Generate insights
  const insights = generateNervousSystemInsights(internalPatterns, externalPatterns, skipReasons.length)

  return {
    hasData: true,
    period: '30 days',
    totalSkips: skipReasons.length,

    // Category breakdown
    categoryBreakdown: {
      external: {
        count: external.length,
        percentage: Math.round((external.length / skipReasons.length) * 100)
      },
      internal: {
        count: internal.length,
        percentage: Math.round((internal.length / skipReasons.length) * 100)
      }
    },

    // Pattern details
    externalPatterns,
    internalPatterns,

    // Top resistance pattern (if internal)
    topResistance: internalPatterns[0] || null,

    // Generated insights
    insights
  }
}

/**
 * Calculate if a resistance pattern is trending up or down
 */
function calculateTrendDirection(occurrences) {
  if (occurrences.length < 3) return 'neutral'

  const recent = occurrences.slice(0, Math.ceil(occurrences.length / 2))
  const older = occurrences.slice(Math.ceil(occurrences.length / 2))

  const recentAvg = recent.reduce((sum, o) => sum + (o.intensity || 5), 0) / recent.length
  const olderAvg = older.reduce((sum, o) => sum + (o.intensity || 5), 0) / older.length

  if (recentAvg < olderAvg - 1) return 'improving'
  if (recentAvg > olderAvg + 1) return 'increasing'
  return 'stable'
}

/**
 * Generate human-readable insights from nervous system patterns
 */
function generateNervousSystemInsights(internalPatterns, externalPatterns, totalSkips) {
  const insights = []

  // Check if mostly external or internal
  const internalCount = internalPatterns.reduce((sum, p) => sum + p.count, 0)
  const externalCount = externalPatterns.reduce((sum, p) => sum + p.count, 0)
  const internalRatio = internalCount / totalSkips

  if (internalRatio > 0.6) {
    insights.push({
      type: 'pattern',
      icon: '🧠',
      title: 'Internal resistance is your main blocker',
      message: `${Math.round(internalRatio * 100)}% of skips come from internal resistance, not external circumstances. This is awareness - you're noticing the patterns.`,
      priority: 'high'
    })
  } else if (internalRatio < 0.3 && totalSkips > 5) {
    insights.push({
      type: 'pattern',
      icon: '🌍',
      title: 'Mostly practical blockers',
      message: 'Most of your skips are due to time/logistics, not fear. Your nervous system seems fairly regulated around these tasks.',
      priority: 'low'
    })
  }

  // Top internal resistance pattern
  if (internalPatterns[0] && internalPatterns[0].count >= 2) {
    const top = internalPatterns[0]
    const reasonLabels = {
      fear_of_judgment: 'Fear of being judged',
      not_good_enough: "Feeling it's not good enough",
      fear_of_failure: 'Fear of failure',
      fear_of_success: 'Fear of success',
      perfectionism: 'Perfectionism',
      overwhelm: 'Overwhelm',
      imposter_syndrome: 'Imposter syndrome',
      visibility_fear: 'Fear of being seen',
      rejection_fear: 'Fear of rejection'
    }

    insights.push({
      type: 'top_resistance',
      icon: '🔍',
      title: `Your #1 resistance: ${reasonLabels[top.reason] || top.reason}`,
      message: `This came up ${top.count} times with avg intensity ${top.avgIntensity}/10. ${
        top.trend === 'improving' ? "It's getting easier over time. 💪" :
        top.trend === 'increasing' ? "This one might need extra attention." :
        "Track this - awareness helps it shift."
      }`,
      priority: 'medium'
    })
  }

  // Multiple high-intensity patterns
  const highIntensity = internalPatterns.filter(p => p.avgIntensity >= 7)
  if (highIntensity.length >= 2) {
    insights.push({
      type: 'intensity_warning',
      icon: '⚠️',
      title: `${highIntensity.length} high-intensity resistance patterns`,
      message: 'Multiple fears are showing up strongly. Consider working with a coach or doing deeper nervous system work outside the app.',
      priority: 'high'
    })
  }

  // Improving trend
  const improving = internalPatterns.filter(p => p.trend === 'improving')
  if (improving.length > 0) {
    insights.push({
      type: 'progress',
      icon: '📈',
      title: `${improving.length} resistance pattern${improving.length > 1 ? 's' : ''} improving`,
      message: `Your nervous system is building capacity. ${improving.map(p => p.reason.replace(/_/g, ' ')).join(', ')} ${improving.length > 1 ? 'are' : 'is'} getting easier.`,
      priority: 'low'
    })
  }

  return insights.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.priority] - order[b.priority]
  })
}

/**
 * Get resistance history for a specific reason
 */
export async function getResistanceHistory(userId, reason) {
  const { data, error } = await supabase
    .from('task_skip_reasons')
    .select('*')
    .eq('user_id', userId)
    .or(`internal_reason.eq.${reason},external_reason.eq.${reason}`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching resistance history:', error)
    return null
  }

  return data
}

/**
 * Get task completion rate (completed vs skipped)
 */
export async function getTaskCompletionAnalysis(userId) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Get completed marketing tasks
  const { data: completed } = await supabase
    .from('quest_completions')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .gte('completed_at', thirtyDaysAgo.toISOString())

  // Get skipped tasks
  const { data: skipped } = await supabase
    .from('task_skip_reasons')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString())

  const completedCount = completed?.length || 0
  const skippedCount = skipped?.length || 0
  const totalTasks = completedCount + skippedCount

  return {
    completed: completedCount,
    skipped: skippedCount,
    total: totalTasks,
    completionRate: totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0
  }
}

/**
 * Get content progress toward monthly goal
 */
export async function getMonthlyProgress(userId) {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // Get user's content strategy for goals
  const { data: strategy } = await supabase
    .from('content_strategies')
    .select('post_frequency_target, reach_goal')
    .eq('user_id', userId)
    .single()

  // Get posted content this month
  const { data: content, count } = await supabase
    .from('content_history')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'posted')
    .gte('posted_at', startOfMonth.toISOString())

  // Calculate estimated reach
  const estimatedReach = (content || []).reduce((sum, c) => {
    const engagement = c.engagement_data || {}
    // Estimate reach as impressions or 20x engagement
    return sum + (engagement.impressions || (engagement.likes || 0) * 20)
  }, 0)

  // Calculate targets
  const weeksInMonth = 4
  const postsTarget = (strategy?.post_frequency_target || 5) * weeksInMonth // default 5/week
  const reachTarget = strategy?.reach_goal || 10000 // default 10K

  return {
    posts: {
      current: count || 0,
      target: postsTarget,
      percentage: Math.min(100, Math.round(((count || 0) / postsTarget) * 100))
    },
    reach: {
      current: estimatedReach,
      target: reachTarget,
      percentage: Math.min(100, Math.round((estimatedReach / reachTarget) * 100))
    },
    daysRemaining: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0).getDate() - new Date().getDate()
  }
}
