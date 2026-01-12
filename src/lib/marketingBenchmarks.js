/**
 * Marketing Benchmarks - Validated industry conversion rates
 *
 * Part of Marketing Tower Tier 1+2: Goal-Based Strategy System
 *
 * Sources:
 * - Hootsuite (2025): https://blog.hootsuite.com/average-engagement-rate/
 * - Planable (2026): https://planable.io/blog/social-media-engagement-rate/
 * - MailerLite (2025): https://www.mailerlite.com/blog/compare-your-email-performance-metrics-industry-benchmarks
 * - First Page Sage (2025): https://firstpagesage.com/seo-blog/sales-funnel-conversion-rate-benchmarks-2025-report/
 * - Interact Quiz Report (2026): https://www.tryinteract.com/blog/quiz-conversion-rate-report/
 * - Focus Digital (2025): https://focus-digital.co/lead-magnet-conversion-rate-by-industry/
 *
 * Last updated: January 2026
 */

// ============================================
// PLATFORM ENGAGEMENT RATES
// ============================================

/**
 * Platform-specific engagement rates (reach → engagement)
 * These represent the % of people reached who will engage (like, comment, share)
 */
export const PLATFORM_ENGAGEMENT_RATES = {
  tiktok: {
    name: 'TikTok',
    engagementRate: 0.041, // 4.1% - highest among platforms
    topTier: 0.08,
    reachPerPost: {
      average: 2500,
      beginner: 500,    // <1K followers
      growing: 1500,    // 1K-10K followers
      established: 5000, // 10K-50K followers
      large: 15000,     // 50K+ followers
    },
    notes: 'Best for short-form video, viral potential',
  },
  linkedin: {
    name: 'LinkedIn',
    engagementRate: 0.035, // 3.5% average, up to 6.6% for carousels
    topTier: 0.066,
    reachPerPost: {
      average: 1000,
      beginner: 200,
      growing: 800,
      established: 2500,
      large: 8000,
    },
    notes: 'Best for B2B, thought leadership',
    contentMultipliers: {
      text_post: 1.0,
      carousel: 1.9, // 6.6% vs 3.5%
      document: 1.67,
      video: 1.2,
    },
  },
  instagram: {
    name: 'Instagram',
    engagementRate: 0.0045, // 0.45% - down 30% YoY
    topTier: 0.02,
    reachPerPost: {
      average: 800,
      beginner: 150,
      growing: 500,
      established: 2000,
      large: 6000,
    },
    notes: 'Engagement declining, carousels perform best',
    contentMultipliers: {
      text_post: 1.0,
      carousel: 1.22, // 0.55% vs 0.45%
      reels: 1.11,    // 0.50%
      stories: 0.8,
    },
  },
  twitter: {
    name: 'Twitter/X',
    engagementRate: 0.005, // 0.5%
    topTier: 0.02,
    reachPerPost: {
      average: 500,
      beginner: 100,
      growing: 400,
      established: 1500,
      large: 5000,
    },
    notes: 'Best for real-time, news, tech audience',
  },
  facebook: {
    name: 'Facebook',
    engagementRate: 0.005, // 0.5% - declining
    topTier: 0.015,
    reachPerPost: {
      average: 400,
      beginner: 100,
      growing: 300,
      established: 1000,
      large: 3000,
    },
    notes: 'Best for local business, groups',
  },
}

// ============================================
// LEAD MAGNET CONVERSION RATES
// ============================================

/**
 * Lead magnet type conversion rates (engagement → lead)
 * These represent the % of engaged visitors who will opt-in
 */
export const LEAD_MAGNET_RATES = {
  quiz: {
    name: 'Quiz / Assessment',
    conversionRate: 0.401, // 40.1% average
    topTier: 0.60,
    notes: 'Highest converting, interactive',
  },
  calculator: {
    name: 'Calculator / Tool',
    conversionRate: 0.35,
    topTier: 0.50,
    notes: 'Interactive, high perceived value',
  },
  cheatsheet: {
    name: 'Cheat Sheet / Template',
    conversionRate: 0.34,
    topTier: 0.45,
    notes: 'Quick wins, immediately actionable',
  },
  webinar: {
    name: 'Webinar / Workshop',
    conversionRate: 0.30,
    topTier: 0.50,
    notes: 'High intent leads, but lower volume',
  },
  checklist: {
    name: 'Checklist',
    conversionRate: 0.25,
    topTier: 0.35,
    notes: 'Simple, actionable',
  },
  video_series: {
    name: 'Video Series / Mini-Course',
    conversionRate: 0.22,
    topTier: 0.35,
    notes: 'Higher commitment, quality leads',
  },
  guide: {
    name: 'Guide / Report',
    conversionRate: 0.18,
    topTier: 0.28,
    notes: 'Traditional, lower engagement',
  },
  ebook: {
    name: 'Ebook',
    conversionRate: 0.009, // <0.9% - dropped significantly
    topTier: 0.05,
    notes: 'Declining effectiveness, oversaturated',
  },
  newsletter: {
    name: 'Newsletter Signup',
    conversionRate: 0.15,
    topTier: 0.30,
    notes: 'Lower commitment, higher volume',
  },
}

// ============================================
// EMAIL MARKETING RATES
// ============================================

/**
 * Email sequence performance (lead → nurtured engagement)
 */
export const EMAIL_RATES = {
  openRate: {
    average: 0.43,    // 43% average
    topTier: 0.55,
    notes: 'Apple Mail inflates this metric',
  },
  clickRate: {
    average: 0.025,   // 2.5%
    topTier: 0.05,
    notes: 'True engagement signal',
  },
  clickToOpenRate: {
    average: 0.068,   // 6.8%
    topTier: 0.12,
  },
  // Lead → Engaged Nurture Subscriber
  nurtureEngagement: {
    average: 0.40,    // 40% of leads engage with nurture
    topTier: 0.60,
    notes: 'Open + click at least once',
  },
}

// ============================================
// SALES FUNNEL RATES (B2B Coaching/Consulting)
// ============================================

/**
 * Sales conversion rates for coaching/consulting businesses
 */
export const SALES_FUNNEL_RATES = {
  // Nurtured Lead → Customer
  nurtureToCustomer: {
    average: 0.05,    // 5% - industry standard
    topTier: 0.15,
    notes: 'Consulting/coaching converts higher than SaaS',
  },
  // Customer → Upsell
  customerToUpsell: {
    average: 0.20,    // 20%
    topTier: 0.35,
    notes: 'Post-purchase upsell take rate',
  },
  // Customer → Downsell (of those who don't buy upsell)
  customerToDownsell: {
    average: 0.30,    // 30%
    topTier: 0.45,
    notes: 'Rescue offer for non-upsellers',
  },
  // Customer → Continuity
  customerToContinuity: {
    average: 0.15,    // 15%
    topTier: 0.30,
    notes: 'Subscription/recurring offer',
  },
}

// ============================================
// COMPOSITE BENCHMARKS (DEFAULT)
// ============================================

/**
 * Default benchmark set used when no customization
 * Combines average rates across the funnel
 */
export const DEFAULT_BENCHMARKS = {
  // Stage 1: Content → Engagement
  reachToEngagement: 0.03, // 3% - conservative cross-platform average

  // Stage 2: Engagement → Lead
  engagementToLead: 0.20, // 20% - assumes decent lead magnet

  // Stage 3: Lead → Nurtured
  leadToNurtured: 0.40, // 40% engage with nurture sequence

  // Stage 4: Nurtured → Customer
  nurturedToCustomer: 0.05, // 5% purchase conversion

  // Stage 5+: Post-purchase
  customerToUpsell: 0.20,
  customerToDownsell: 0.30,
  customerToContinuity: 0.15,

  // Content metrics
  averageReachPerPost: 1000, // Conservative default
}

// ============================================
// CONFIDENCE THRESHOLDS
// ============================================

/**
 * Thresholds for when to trust user data over benchmarks
 */
export const CONFIDENCE_THRESHOLDS = {
  insufficient: {
    minPosts: 5,
    minWeeks: 2,
    label: 'Insufficient Data',
    useUserData: false,
  },
  low: {
    minPosts: 15,
    minWeeks: 4,
    label: 'Low Confidence',
    useUserData: false, // Show warning, use blended
  },
  medium: {
    minPosts: 30,
    minWeeks: 8,
    label: 'Medium Confidence',
    useUserData: true, // Use user data with benchmark comparison
  },
  high: {
    minPosts: 50,
    minWeeks: 12,
    label: 'High Confidence',
    useUserData: true, // Fully trust user data
  },
}

/**
 * Determine confidence level based on user's data volume
 * @param {number} postCount - Number of posts with metrics
 * @param {number} weeksOfData - Weeks of tracking
 * @returns {Object} Confidence level details
 */
export function getConfidenceLevel(postCount, weeksOfData) {
  if (postCount >= 50 && weeksOfData >= 12) {
    return { ...CONFIDENCE_THRESHOLDS.high, level: 'high' }
  }
  if (postCount >= 30 && weeksOfData >= 8) {
    return { ...CONFIDENCE_THRESHOLDS.medium, level: 'medium' }
  }
  if (postCount >= 15 && weeksOfData >= 4) {
    return { ...CONFIDENCE_THRESHOLDS.low, level: 'low' }
  }
  return { ...CONFIDENCE_THRESHOLDS.insufficient, level: 'insufficient' }
}

// ============================================
// BENCHMARK LOOKUPS
// ============================================

/**
 * Get platform-specific engagement rate
 * @param {string} platformId - Platform identifier
 * @param {string} contentType - Content type (optional)
 * @returns {number} Engagement rate
 */
export function getPlatformEngagementRate(platformId, contentType = null) {
  const platform = PLATFORM_ENGAGEMENT_RATES[platformId]
  if (!platform) return DEFAULT_BENCHMARKS.reachToEngagement

  let rate = platform.engagementRate

  // Apply content type multiplier if available
  if (contentType && platform.contentMultipliers?.[contentType]) {
    rate *= platform.contentMultipliers[contentType]
  }

  return rate
}

/**
 * Get estimated reach per post for a platform and follower level
 * @param {string} platformId - Platform identifier
 * @param {string} followerLevel - 'beginner', 'growing', 'established', 'large'
 * @returns {number} Estimated reach per post
 */
export function getReachPerPost(platformId, followerLevel = 'average') {
  const platform = PLATFORM_ENGAGEMENT_RATES[platformId]
  if (!platform) return DEFAULT_BENCHMARKS.averageReachPerPost

  return platform.reachPerPost[followerLevel] || platform.reachPerPost.average
}

/**
 * Typical reach percentage by platform (% of followers who see a post)
 * Based on 2025-2026 algorithm data
 */
export const PLATFORM_REACH_PERCENTAGES = {
  tiktok: { min: 0.10, avg: 0.20, max: 0.50 },    // TikTok shows to non-followers too
  linkedin: { min: 0.05, avg: 0.10, max: 0.25 },
  instagram: { min: 0.03, avg: 0.07, max: 0.15 }, // Declining organic reach
  twitter: { min: 0.02, avg: 0.05, max: 0.12 },
  facebook: { min: 0.02, avg: 0.05, max: 0.10 },  // Lowest organic reach
}

/**
 * Calculate reach per post from actual user data
 * Priority: avgViewsPerPost > followerCount estimate > followerLevel bracket
 *
 * @param {Object} options
 * @param {string} options.platform - Platform identifier
 * @param {number} options.followerCount - Actual follower count (optional)
 * @param {number} options.avgViewsPerPost - Average views from last 3 posts (optional)
 * @param {string} options.followerLevel - Fallback bracket (optional)
 * @returns {Object} { reachPerPost, source, confidence }
 */
export function calculateReachPerPost(options = {}) {
  const {
    platform = 'linkedin',
    followerCount = null,
    avgViewsPerPost = null,
    followerLevel = 'average',
  } = options

  // Priority 1: User's actual average views (most accurate)
  if (avgViewsPerPost && avgViewsPerPost > 0) {
    return {
      reachPerPost: Math.round(avgViewsPerPost),
      source: 'actual_data',
      confidence: 'high',
      note: 'Based on your actual post performance',
    }
  }

  // Priority 2: Estimate from follower count + platform reach %
  if (followerCount && followerCount > 0) {
    const reachPct = PLATFORM_REACH_PERCENTAGES[platform]?.avg || 0.08
    const estimatedReach = Math.round(followerCount * reachPct)

    return {
      reachPerPost: estimatedReach,
      source: 'follower_estimate',
      confidence: 'medium',
      note: `Estimated ${Math.round(reachPct * 100)}% of your ${followerCount.toLocaleString()} followers`,
    }
  }

  // Priority 3: Fall back to follower level bracket
  const bracketReach = getReachPerPost(platform, followerLevel)
  return {
    reachPerPost: bracketReach,
    source: 'benchmark',
    confidence: 'low',
    note: 'Industry average - add your data for accuracy',
  }
}

/**
 * Get lead magnet conversion rate
 * @param {string} leadMagnetType - Type of lead magnet
 * @returns {number} Conversion rate
 */
export function getLeadMagnetRate(leadMagnetType) {
  const magnet = LEAD_MAGNET_RATES[leadMagnetType]
  return magnet?.conversionRate || DEFAULT_BENCHMARKS.engagementToLead
}

/**
 * Get all benchmarks as a flat object for calculations
 * @param {Object} options - Customization options
 * @returns {Object} Complete benchmark set with reach metadata
 */
export function getBenchmarks(options = {}) {
  const {
    platform = null,
    contentType = null,
    leadMagnetType = null,
    followerLevel = 'average',
    followerCount = null,
    avgViewsPerPost = null,
  } = options

  const benchmarks = { ...DEFAULT_BENCHMARKS }

  // Override with platform-specific if provided
  if (platform) {
    benchmarks.reachToEngagement = getPlatformEngagementRate(platform, contentType)

    // Use new reach calculation with actual data if available
    const reachData = calculateReachPerPost({
      platform,
      followerCount,
      avgViewsPerPost,
      followerLevel,
    })

    benchmarks.averageReachPerPost = reachData.reachPerPost
    benchmarks.reachSource = reachData.source
    benchmarks.reachConfidence = reachData.confidence
    benchmarks.reachNote = reachData.note
  }

  // Override with lead magnet type if provided
  if (leadMagnetType) {
    benchmarks.engagementToLead = getLeadMagnetRate(leadMagnetType)
  }

  return benchmarks
}

export default {
  PLATFORM_ENGAGEMENT_RATES,
  LEAD_MAGNET_RATES,
  EMAIL_RATES,
  SALES_FUNNEL_RATES,
  DEFAULT_BENCHMARKS,
  CONFIDENCE_THRESHOLDS,
  PLATFORM_REACH_PERCENTAGES,
  getConfidenceLevel,
  getPlatformEngagementRate,
  getReachPerPost,
  getLeadMagnetRate,
  getBenchmarks,
  calculateReachPerPost,
}
