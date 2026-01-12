/**
 * Strategy Calculator - Goal-based marketing calculations
 *
 * Part of Marketing Tower Tier 1+2: Goal-Based Strategy System
 *
 * Reverse-engineers from revenue goal to required marketing activity:
 * Revenue Goal → Customers Needed → Leads Needed → Reach Needed → Posts Needed
 */

import {
  getBenchmarks,
  getConfidenceLevel,
  PLATFORM_ENGAGEMENT_RATES,
  LEAD_MAGNET_RATES,
} from './marketingBenchmarks'

// ============================================
// CORE CALCULATOR
// ============================================

/**
 * Calculate required marketing metrics to hit revenue goal
 *
 * @param {Object} params - Calculation parameters
 * @param {number} params.revenueGoal - Monthly revenue target
 * @param {number} params.coreOfferPrice - Price of main offer
 * @param {number} params.upsellPrice - Price of upsell (optional)
 * @param {number} params.downsellPrice - Price of downsell (optional)
 * @param {number} params.continuityPrice - Monthly continuity price (optional)
 * @param {string} params.platform - Primary platform
 * @param {string} params.contentType - Primary content type
 * @param {string} params.leadMagnetType - Type of lead magnet
 * @param {string} params.followerLevel - Follower level for reach estimates (fallback)
 * @param {number} params.followerCount - Actual follower count (optional, more accurate)
 * @param {number} params.avgViewsPerPost - Avg views from last 3 posts (optional, most accurate)
 * @param {Object} params.customRates - User's actual conversion rates (overrides benchmarks)
 *
 * @returns {Object} Calculated requirements
 */
export function calculateMarketingRequirements(params) {
  const {
    revenueGoal,
    coreOfferPrice,
    upsellPrice = 0,
    downsellPrice = 0,
    continuityPrice = 0,
    platform = null,
    contentType = null,
    leadMagnetType = null,
    followerLevel = 'average',
    followerCount = null,
    avgViewsPerPost = null,
    customRates = {},
  } = params

  // Get benchmarks (with platform/content customization + actual user data)
  const benchmarks = getBenchmarks({
    platform,
    contentType,
    leadMagnetType,
    followerLevel,
    followerCount,
    avgViewsPerPost,
  })

  // Merge custom rates over benchmarks
  const rates = { ...benchmarks, ...customRates }

  // ============================================
  // STEP 1: Calculate effective revenue per customer
  // ============================================

  // Core offer revenue
  const coreRevenue = coreOfferPrice

  // Expected upsell revenue per customer
  const upsellRevenue = upsellPrice * rates.customerToUpsell

  // Expected downsell revenue (only from non-upsellers)
  const nonUpsellRate = 1 - rates.customerToUpsell
  const downsellRevenue = downsellPrice * nonUpsellRate * rates.customerToDownsell

  // Expected first-month continuity revenue
  const continuityRevenue = continuityPrice * rates.customerToContinuity

  // Total expected revenue per customer (first month)
  const revenuePerCustomer = coreRevenue + upsellRevenue + downsellRevenue + continuityRevenue

  // ============================================
  // STEP 2: Work backwards through funnel
  // ============================================

  // Customers needed
  const customersNeeded = Math.ceil(revenueGoal / revenuePerCustomer)

  // Nurtured leads needed (to get customers)
  const nurturedLeadsNeeded = Math.ceil(customersNeeded / rates.nurturedToCustomer)

  // Total leads needed (to get nurtured leads)
  const leadsNeeded = Math.ceil(nurturedLeadsNeeded / rates.leadToNurtured)

  // Engagements needed (to get leads)
  const engagementsNeeded = Math.ceil(leadsNeeded / rates.engagementToLead)

  // Reach needed (to get engagements)
  const reachNeeded = Math.ceil(engagementsNeeded / rates.reachToEngagement)

  // Posts needed (to get reach)
  const postsNeeded = Math.ceil(reachNeeded / rates.averageReachPerPost)

  // ============================================
  // STEP 3: Calculate posting frequency
  // ============================================

  const postsPerMonth = postsNeeded
  const postsPerWeek = Math.ceil(postsNeeded / 4.33) // Avg weeks per month
  const postsPerDay = Math.round((postsNeeded / 30) * 10) / 10 // 1 decimal

  // ============================================
  // STEP 4: Generate insights
  // ============================================

  const insights = generateInsights({
    postsPerWeek,
    platform,
    leadMagnetType,
    rates,
    benchmarks,
  })

  return {
    // Inputs (for display)
    inputs: {
      revenueGoal,
      coreOfferPrice,
      upsellPrice,
      downsellPrice,
      continuityPrice,
      platform,
      leadMagnetType,
    },

    // Revenue breakdown
    revenue: {
      perCustomer: Math.round(revenuePerCustomer * 100) / 100,
      fromCore: coreRevenue,
      fromUpsell: Math.round(upsellRevenue * 100) / 100,
      fromDownsell: Math.round(downsellRevenue * 100) / 100,
      fromContinuity: Math.round(continuityRevenue * 100) / 100,
    },

    // Funnel requirements
    funnel: {
      customersNeeded,
      nurturedLeadsNeeded,
      leadsNeeded,
      engagementsNeeded,
      reachNeeded,
    },

    // Content requirements
    content: {
      postsNeeded: postsPerMonth,
      postsPerWeek,
      postsPerDay,
    },

    // Rates used (for transparency)
    ratesUsed: {
      reachToEngagement: rates.reachToEngagement,
      engagementToLead: rates.engagementToLead,
      leadToNurtured: rates.leadToNurtured,
      nurturedToCustomer: rates.nurturedToCustomer,
      averageReachPerPost: rates.averageReachPerPost,
    },

    // Reach calculation metadata (shows data source + confidence)
    reachData: {
      source: benchmarks.reachSource || 'benchmark',
      confidence: benchmarks.reachConfidence || 'low',
      note: benchmarks.reachNote || 'Using industry averages',
      followerCount,
      avgViewsPerPost,
    },

    // Actionable insights
    insights,
  }
}

/**
 * Generate actionable insights based on calculations
 */
function generateInsights({ postsPerWeek, platform, leadMagnetType, rates, benchmarks }) {
  const insights = []

  // Posting frequency assessment
  if (postsPerWeek > 14) {
    insights.push({
      type: 'warning',
      title: 'High Volume Required',
      message: `${postsPerWeek} posts/week is aggressive. Consider: higher-priced offer, better lead magnet, or longer timeline.`,
      icon: '⚠️',
    })
  } else if (postsPerWeek > 7) {
    insights.push({
      type: 'info',
      title: 'Consistent Effort Needed',
      message: `${postsPerWeek} posts/week is achievable with batching. Plan content weekly.`,
      icon: '📅',
    })
  } else {
    insights.push({
      type: 'success',
      title: 'Achievable Goal',
      message: `${postsPerWeek} posts/week is very manageable. Focus on quality over quantity.`,
      icon: '✅',
    })
  }

  // Platform-specific insights
  if (platform === 'tiktok') {
    insights.push({
      type: 'tip',
      title: 'TikTok Advantage',
      message: 'TikTok has 8x higher engagement than Instagram. Your posts work harder here.',
      icon: '🎯',
    })
  } else if (platform === 'instagram' && rates.reachToEngagement < 0.01) {
    insights.push({
      type: 'tip',
      title: 'Consider Carousels',
      message: 'Carousels get 22% more engagement on Instagram. Use them for key content.',
      icon: '💡',
    })
  } else if (platform === 'linkedin') {
    insights.push({
      type: 'tip',
      title: 'LinkedIn Tip',
      message: 'Document posts and carousels get up to 6.6% engagement (vs 3.5% average).',
      icon: '💼',
    })
  }

  // Lead magnet insights
  if (leadMagnetType === 'ebook') {
    insights.push({
      type: 'warning',
      title: 'Upgrade Your Lead Magnet',
      message: 'Ebooks convert at <1%. Quizzes convert at 40%. Consider switching.',
      icon: '📊',
    })
  } else if (leadMagnetType === 'quiz') {
    insights.push({
      type: 'success',
      title: 'Great Lead Magnet Choice',
      message: "Quizzes convert 6x better than ebooks. You're maximizing conversions.",
      icon: '🏆',
    })
  }

  // Conversion improvement opportunities
  const improvementOpportunities = []

  if (rates.engagementToLead < benchmarks.engagementToLead * 0.8) {
    improvementOpportunities.push('lead magnet conversion')
  }
  if (rates.nurturedToCustomer < benchmarks.nurturedToCustomer * 0.8) {
    improvementOpportunities.push('sales conversion')
  }
  if (rates.reachToEngagement < benchmarks.reachToEngagement * 0.8) {
    improvementOpportunities.push('content engagement')
  }

  if (improvementOpportunities.length > 0) {
    insights.push({
      type: 'opportunity',
      title: 'Improvement Areas',
      message: `Focus on improving: ${improvementOpportunities.join(', ')}.`,
      icon: '📈',
    })
  }

  return insights
}

// ============================================
// COMPARISON CALCULATOR
// ============================================

/**
 * Compare requirements across different platforms
 * Shows user how platform choice affects required effort
 *
 * @param {Object} baseParams - Base calculation parameters
 * @returns {Array} Comparison results for each platform
 */
export function comparePlatforms(baseParams) {
  const platforms = Object.keys(PLATFORM_ENGAGEMENT_RATES)

  return platforms.map(platform => {
    const result = calculateMarketingRequirements({
      ...baseParams,
      platform,
    })

    return {
      platform,
      name: PLATFORM_ENGAGEMENT_RATES[platform].name,
      postsPerWeek: result.content.postsPerWeek,
      reachNeeded: result.funnel.reachNeeded,
      engagementRate: result.ratesUsed.reachToEngagement,
      reachPerPost: result.ratesUsed.averageReachPerPost,
    }
  }).sort((a, b) => a.postsPerWeek - b.postsPerWeek)
}

/**
 * Compare requirements across different lead magnet types
 *
 * @param {Object} baseParams - Base calculation parameters
 * @returns {Array} Comparison results for each lead magnet type
 */
export function compareLeadMagnets(baseParams) {
  const magnetTypes = Object.keys(LEAD_MAGNET_RATES)

  return magnetTypes.map(magnetType => {
    const result = calculateMarketingRequirements({
      ...baseParams,
      leadMagnetType: magnetType,
    })

    return {
      type: magnetType,
      name: LEAD_MAGNET_RATES[magnetType].name,
      conversionRate: LEAD_MAGNET_RATES[magnetType].conversionRate,
      leadsNeeded: result.funnel.leadsNeeded,
      postsPerWeek: result.content.postsPerWeek,
    }
  }).sort((a, b) => a.postsPerWeek - b.postsPerWeek)
}

// ============================================
// PROGRESS TRACKING
// ============================================

/**
 * Calculate progress towards monthly goal
 *
 * @param {Object} params - Progress parameters
 * @param {number} params.targetReach - Monthly reach target
 * @param {number} params.currentReach - Reach achieved so far
 * @param {number} params.targetPosts - Monthly post target
 * @param {number} params.currentPosts - Posts made so far
 * @param {number} params.dayOfMonth - Current day of month
 *
 * @returns {Object} Progress metrics
 */
export function calculateProgress(params) {
  const {
    targetReach,
    currentReach,
    targetPosts,
    currentPosts,
    dayOfMonth,
  } = params

  const daysInMonth = 30 // Simplified
  const progressThroughMonth = dayOfMonth / daysInMonth

  // Reach progress
  const reachProgress = currentReach / targetReach
  const reachOnTrack = reachProgress >= progressThroughMonth

  // Post progress
  const postProgress = currentPosts / targetPosts
  const postsOnTrack = postProgress >= progressThroughMonth

  // Projected end of month
  const projectedReach = currentReach / progressThroughMonth
  const projectedPosts = currentPosts / progressThroughMonth

  // Recommendations
  const remainingDays = daysInMonth - dayOfMonth
  const postsNeededRemaining = Math.max(0, targetPosts - currentPosts)
  const postsPerDayRemaining = remainingDays > 0
    ? Math.ceil(postsNeededRemaining / remainingDays)
    : 0

  return {
    reach: {
      current: currentReach,
      target: targetReach,
      progress: Math.round(reachProgress * 100),
      onTrack: reachOnTrack,
      projected: Math.round(projectedReach),
    },
    posts: {
      current: currentPosts,
      target: targetPosts,
      progress: Math.round(postProgress * 100),
      onTrack: postsOnTrack,
      projected: Math.round(projectedPosts),
    },
    recommendation: {
      postsNeededRemaining,
      postsPerDayRemaining,
      message: postsOnTrack
        ? `On track! Keep posting ${Math.ceil(targetPosts / daysInMonth)}x per day.`
        : `Behind schedule. Post ${postsPerDayRemaining}x per day to catch up.`,
    },
    progressThroughMonth: Math.round(progressThroughMonth * 100),
  }
}

// ============================================
// USER DATA INTEGRATION
// ============================================

/**
 * Calculate user's actual conversion rates from their data
 *
 * @param {Object} userData - User's historical metrics
 * @param {number} userData.totalReach - Total reach achieved
 * @param {number} userData.totalEngagements - Total engagements
 * @param {number} userData.leadsGenerated - Total leads captured
 * @param {number} userData.customersConverted - Total customers
 * @param {number} userData.postCount - Number of posts
 * @param {number} userData.weeksOfData - Weeks of tracking
 *
 * @returns {Object} Calculated rates with confidence level
 */
export function calculateUserRates(userData) {
  const {
    totalReach = 0,
    totalEngagements = 0,
    leadsGenerated = 0,
    customersConverted = 0,
    postCount = 0,
    weeksOfData = 0,
  } = userData

  // Get confidence level
  const confidence = getConfidenceLevel(postCount, weeksOfData)

  // Calculate actual rates (with safety checks)
  const actualRates = {}

  if (totalReach > 0) {
    actualRates.reachToEngagement = totalEngagements / totalReach
    actualRates.averageReachPerPost = totalReach / Math.max(postCount, 1)
  }

  if (totalEngagements > 0 && leadsGenerated > 0) {
    actualRates.engagementToLead = leadsGenerated / totalEngagements
  }

  if (leadsGenerated > 0 && customersConverted > 0) {
    // This is a simplified calculation
    // In reality, you'd track lead → nurture → customer separately
    actualRates.nurturedToCustomer = customersConverted / leadsGenerated
  }

  return {
    rates: actualRates,
    confidence,
    shouldUseUserData: confidence.useUserData,
    dataPoints: {
      posts: postCount,
      weeks: weeksOfData,
      reach: totalReach,
      engagements: totalEngagements,
      leads: leadsGenerated,
      customers: customersConverted,
    },
  }
}

/**
 * Blend user rates with benchmarks based on confidence
 *
 * @param {Object} userRates - User's calculated rates
 * @param {Object} benchmarks - Industry benchmarks
 * @param {string} confidenceLevel - 'insufficient', 'low', 'medium', 'high'
 *
 * @returns {Object} Blended rates
 */
export function blendRates(userRates, benchmarks, confidenceLevel) {
  // Weight given to user data based on confidence
  const weights = {
    insufficient: 0,
    low: 0.25,
    medium: 0.65,
    high: 0.90,
  }

  const userWeight = weights[confidenceLevel] || 0
  const benchmarkWeight = 1 - userWeight

  const blended = {}

  for (const key of Object.keys(benchmarks)) {
    if (userRates[key] !== undefined) {
      blended[key] = (userRates[key] * userWeight) + (benchmarks[key] * benchmarkWeight)
    } else {
      blended[key] = benchmarks[key]
    }
  }

  return blended
}

export default {
  calculateMarketingRequirements,
  comparePlatforms,
  compareLeadMagnets,
  calculateProgress,
  calculateUserRates,
  blendRates,
}
