/**
 * Content Strategy - Template generation and strategy management
 * Part of the AI Content Copilot system
 */
import { supabase } from './supabaseClient'
import { getWeekStartLocal as getWeekStartDate } from './dateUtils'

// ============================================
// CONSTANTS
// ============================================

export const LEAD_STRATEGIES = [
  { id: 'post_free_content', name: 'Content Marketing', description: 'Posts that attract leads to you', icon: '📝', available: true },
  { id: 'warm_outreach', name: 'Warm Outreach', description: 'DMs to people who already know you', icon: '🤝', available: false, comingSoon: true },
  { id: 'cold_outreach', name: 'Cold Outreach', description: 'DMs to strangers who match your ICP', icon: '🎯', available: false, comingSoon: true },
  { id: 'run_paid_ads', name: 'Paid Advertising', description: 'Ads to reach new audiences at scale', icon: '💰', available: false, comingSoon: true },
]

export const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', description: 'B2B, professionals, thought leadership', icon: '💼' },
  { id: 'instagram', name: 'Instagram', description: 'Visual, lifestyle, personal brand', icon: '📸' },
  { id: 'twitter', name: 'Twitter/X', description: 'Tech, news, real-time engagement', icon: '🐦' },
  { id: 'tiktok', name: 'TikTok', description: 'Gen Z, entertainment, viral potential', icon: '🎵' },
  { id: 'facebook', name: 'Facebook', description: 'Local business, communities, groups', icon: '👥' },
]

// Individual days for multi-select
export const WEEKDAYS = [
  { id: 'Monday', short: 'Mon' },
  { id: 'Tuesday', short: 'Tue' },
  { id: 'Wednesday', short: 'Wed' },
  { id: 'Thursday', short: 'Thu' },
  { id: 'Friday', short: 'Fri' },
  { id: 'Saturday', short: 'Sat' },
  { id: 'Sunday', short: 'Sun' },
]

// Legacy - kept for backwards compatibility
export const DAYS_OPTIONS = [
  { value: 3, label: '3 days/week', days: ['Tuesday', 'Thursday', 'Saturday'] },
  { value: 4, label: '4 days/week', days: ['Monday', 'Wednesday', 'Friday', 'Sunday'] },
  { value: 5, label: '5 days/week', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
  { value: 6, label: '6 days/week', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
  { value: 7, label: '7 days/week', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
]

export const TIME_OPTIONS = [
  { value: 30, label: '30 minutes', description: 'Quick posts only' },
  { value: 60, label: '1 hour', description: 'Posts + some engagement' },
  { value: 120, label: '2 hours', description: 'Posts + engagement + outreach' },
  { value: 180, label: '3+ hours', description: 'Full content marketing' },
]

export const CONTENT_TYPES = [
  { id: 'text_post', name: 'Text Posts', description: 'Quick to create, versatile', icon: '📝', minTime: 30 },
  { id: 'carousel', name: 'Carousels/Slides', description: 'More engaging, educational', icon: '🎠', minTime: 60 },
  { id: 'short_video', name: 'Short Video (<60s)', description: 'Reels, TikToks, Shorts', icon: '🎬', minTime: 60 },
  { id: 'long_video', name: 'Long Video (>60s)', description: 'YouTube, detailed content', icon: '📹', minTime: 120 },
  { id: 'stories', name: 'Stories', description: 'Ephemeral, behind-the-scenes', icon: '⏰', minTime: 30 },
  { id: 'threads', name: 'Threads', description: 'Multi-part deep dives', icon: '🧵', minTime: 60 },
  { id: 'newsletter', name: 'Newsletter/Email', description: 'Weekly digest to subscribers', icon: '📧', minTime: 60 },
]

// Content type rotation for variety throughout the week
const CONTENT_TYPE_ROTATION = [
  'transformation_story',  // Day 0: Story
  'educational',           // Day 1: Teach
  'pain_agitation',        // Day 2: Problem
  'social_proof',          // Day 3: Proof
  'offer_teaser',          // Day 4: Soft sell
  'educational',           // Day 5: Value
  'transformation_story',  // Day 6: Story
]

// ============================================
// STRATEGY CRUD
// ============================================

/**
 * Fetch user's content strategy
 */
export async function fetchContentStrategy(userId) {
  const { data, error } = await supabase
    .from('content_strategies')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching strategy:', error)
    return null
  }

  return data
}

/**
 * Save or update content strategy
 */
export async function saveContentStrategy(userId, strategyData) {
  const { data: existing } = await supabase
    .from('content_strategies')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  // Generate the weekly template
  const weeklyTemplate = generateWeeklyTemplate(strategyData)

  // Calculate days_per_week from selectedDays for backwards compatibility
  const daysCount = strategyData.selectedDays?.length || strategyData.daysPerWeek || 5

  const strategyRecord = {
    user_id: userId,
    lead_strategy: strategyData.leadStrategy,
    primary_platform: strategyData.primaryPlatform,
    secondary_platform: strategyData.secondaryPlatform || null,
    days_per_week: daysCount,
    selected_days: strategyData.selectedDays || null,
    minutes_per_day: strategyData.minutesPerDay,
    content_types: strategyData.contentTypes,
    weekly_template: weeklyTemplate,
    last_updated_week: getWeekStartDate(),
    // Goals (Tier 1+2)
    revenue_goal: strategyData.revenueGoal || null,
    core_offer_price: strategyData.coreOfferPrice || null,
    lead_magnet_type: strategyData.leadMagnetType || null,
    follower_count: strategyData.followerCount || null,
    avg_views_per_post: strategyData.avgViewsPerPost || null,
    calculated_targets: strategyData.calculatedTargets || null,
  }

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('content_strategies')
      .update(strategyRecord)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating strategy:', error)
      return { data: null, error }
    }
    return { data, error: null }
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('content_strategies')
      .insert(strategyRecord)
      .select()
      .single()

    if (error) {
      console.error('Error creating strategy:', error)
      return { data: null, error }
    }
    return { data, error: null }
  }
}

/**
 * Check if user has completed strategy setup
 */
export async function hasContentStrategy(userId) {
  const { data, error } = await supabase
    .from('content_strategies')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  return !error && data !== null
}

// ============================================
// TEMPLATE GENERATION
// ============================================

/**
 * Generate weekly template based on strategy answers
 */
export function generateWeeklyTemplate(strategy) {
  const {
    leadStrategy,
    primaryPlatform,
    secondaryPlatform,
    selectedDays, // Now an array of day names
    daysPerWeek, // Legacy fallback
    minutesPerDay,
    contentTypes
  } = strategy

  const template = {}
  // Use selectedDays array if provided, otherwise fall back to legacy daysPerWeek
  const days = selectedDays && selectedDays.length > 0
    ? selectedDays
    : getDaysForFrequency(daysPerWeek)

  days.forEach((day, dayIndex) => {
    template[day] = []
    let slotNumber = 1
    let pointsBase = 10

    // 1. Primary content task
    const contentType = getContentTypeForDay(dayIndex, contentTypes)
    if (contentType) {
      template[day].push({
        slot: slotNumber++,
        task_category: 'content',
        task_type: `${getPlatformName(primaryPlatform)}: ${getContentTypeName(contentType)}`,
        platform: primaryPlatform,
        content_type: contentType,
        points_value: pointsBase,
        has_content: true,
        guidance: getContentGuidance(contentType, leadStrategy)
      })
    }

    // 2. Secondary platform content (Mon, Wed, Fri only if selected)
    if (secondaryPlatform && ['Monday', 'Wednesday', 'Friday'].includes(day)) {
      const secondaryContentType = getContentTypeForDay((dayIndex + 1) % 7, contentTypes)
      if (secondaryContentType) {
        template[day].push({
          slot: slotNumber++,
          task_category: 'content',
          task_type: `${getPlatformName(secondaryPlatform)}: ${getContentTypeName(secondaryContentType)}`,
          platform: secondaryPlatform,
          content_type: secondaryContentType,
          points_value: 8,
          has_content: true,
          guidance: getContentGuidance(secondaryContentType, leadStrategy)
        })
      }
    }

    // 3. Engagement tasks (based on time available)
    if (minutesPerDay >= 60) {
      template[day].push({
        slot: slotNumber++,
        task_category: 'engagement',
        task_type: `Comment on 10 posts`,
        platform: primaryPlatform,
        content_type: 'engagement',
        points_value: 5,
        has_content: false,
        guidance: 'Leave thoughtful comments that add value. Avoid generic responses.'
      })
    }

    // Always respond to comments
    template[day].push({
      slot: slotNumber++,
      task_category: 'engagement',
      task_type: 'Respond to all comments',
      platform: primaryPlatform,
      content_type: 'engagement',
      points_value: 5,
      has_content: false,
      guidance: 'Reply to every comment on your posts within 24 hours.'
    })

    // 4. Outreach tasks (if warm/cold outreach strategy)
    if (['warm_outreach', 'cold_outreach'].includes(leadStrategy)) {
      const outreachTasks = getOutreachTasks(leadStrategy, day, minutesPerDay, primaryPlatform)
      outreachTasks.forEach(task => {
        template[day].push({ ...task, slot: slotNumber++ })
      })
    }

    // 5. Weekly planning (Friday only)
    if (day === 'Friday') {
      template[day].push({
        slot: slotNumber++,
        task_category: 'planning',
        task_type: "Plan next week's content",
        platform: 'all',
        content_type: 'planning',
        points_value: 5,
        has_content: false,
        guidance: 'Review what worked this week. Outline topics for next week.'
      })
    }

    // 6. Analytics review (Monday only)
    if (day === 'Monday') {
      template[day].push({
        slot: slotNumber++,
        task_category: 'analytics',
        task_type: 'Review last week metrics',
        platform: 'all',
        content_type: 'analytics',
        points_value: 5,
        has_content: false,
        guidance: 'Check engagement rates, top posts, and follower growth.'
      })
    }
  })

  return template
}

/**
 * Get days array based on frequency selection
 */
function getDaysForFrequency(daysPerWeek) {
  const option = DAYS_OPTIONS.find(d => d.value === daysPerWeek)
  return option ? option.days : DAYS_OPTIONS[2].days // Default to 5 days
}

/**
 * Get content type for a specific day (rotation)
 */
function getContentTypeForDay(dayIndex, availableTypes) {
  const preferredType = CONTENT_TYPE_ROTATION[dayIndex % 7]

  // Check if user has content types that support this
  // Map content_type_rotation to actual content format
  const formatMap = {
    'transformation_story': ['text_post', 'carousel', 'short_video'],
    'educational': ['text_post', 'carousel', 'threads', 'long_video'],
    'pain_agitation': ['text_post', 'short_video'],
    'social_proof': ['text_post', 'carousel', 'short_video'],
    'offer_teaser': ['text_post', 'carousel', 'stories'],
  }

  const compatibleFormats = formatMap[preferredType] || ['text_post']
  const matchingFormat = compatibleFormats.find(f => availableTypes.includes(f))

  return matchingFormat ? preferredType : CONTENT_TYPE_ROTATION[0]
}

/**
 * Get outreach tasks based on strategy
 * @param {string} leadStrategy - The lead generation strategy
 * @param {string} day - Day of the week
 * @param {number} minutesPerDay - Time available
 * @param {string} primaryPlatform - User's primary platform (uses this for outreach)
 */
function getOutreachTasks(leadStrategy, day, minutesPerDay, primaryPlatform) {
  const tasks = []
  // Use user's primary platform for outreach, default to linkedin if not set
  const outreachPlatform = primaryPlatform || 'linkedin'

  if (leadStrategy === 'warm_outreach') {
    if (minutesPerDay >= 60) {
      tasks.push({
        task_category: 'outreach',
        task_type: 'DM 5 warm leads',
        platform: outreachPlatform,
        content_type: 'outreach',
        points_value: 10,
        has_content: false,
        guidance: 'Use ACA Framework: Acknowledge → Compliment → Ask how you can help.'
      })
    }
    if (['Monday', 'Thursday'].includes(day)) {
      tasks.push({
        task_category: 'outreach',
        task_type: 'Follow up with 3 conversations',
        platform: outreachPlatform,
        content_type: 'outreach',
        points_value: 8,
        has_content: false,
        guidance: 'Check on people you messaged last week. Offer more value.'
      })
    }
  }

  if (leadStrategy === 'cold_outreach') {
    if (minutesPerDay >= 120) {
      tasks.push({
        task_category: 'outreach',
        task_type: 'Send 10 cold outreach messages',
        platform: outreachPlatform,
        content_type: 'outreach',
        points_value: 15,
        has_content: false,
        guidance: 'Research each prospect briefly. Lead with value, not a pitch.'
      })
    }
    if (['Tuesday', 'Friday'].includes(day)) {
      tasks.push({
        task_category: 'outreach',
        task_type: 'Build prospect list (+20 names)',
        platform: outreachPlatform,
        content_type: 'outreach',
        points_value: 10,
        has_content: false,
        guidance: 'Find ideal customers in groups, comments, or competitor followers.'
      })
    }
  }

  return tasks
}

// ============================================
// HELPERS
// ============================================

function getPlatformName(platformId) {
  const platform = PLATFORMS.find(p => p.id === platformId)
  return platform ? platform.name : platformId
}

function getContentTypeName(contentType) {
  const names = {
    'transformation_story': 'Transformation Story',
    'educational': 'Educational Post',
    'pain_agitation': 'Pain Point Post',
    'social_proof': 'Social Proof',
    'offer_teaser': 'Offer Teaser',
  }
  return names[contentType] || contentType
}

function getContentGuidance(contentType, leadStrategy) {
  const guidance = {
    'transformation_story': 'Share a before/after story. Hook with the problem, reveal the transformation.',
    'educational': 'Teach one valuable concept. Use lists or steps for clarity.',
    'pain_agitation': 'Surface a problem your audience faces. Agitate it, then hint at the solution.',
    'social_proof': 'Share a win, testimonial, or result. Make it specific and relatable.',
    'offer_teaser': 'Create curiosity about your offer. Use the 4:1 ratio (4 value posts to 1 ask).',
  }
  return guidance[contentType] || ''
}

/**
 * Get Monday of current week as YYYY-MM-DD
 */
// Re-export from shared dateUtils (fixes UTC timezone bug)
export { getWeekStartLocal as getWeekStartDate } from './dateUtils'

/**
 * Get available content types based on time
 */
export function getAvailableContentTypes(minutesPerDay) {
  return CONTENT_TYPES.filter(ct => ct.minTime <= minutesPerDay)
}
