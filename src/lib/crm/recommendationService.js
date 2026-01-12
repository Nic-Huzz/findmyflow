/**
 * Recommendation Service
 * Analyzes user data and generates AI-powered recommendations
 * Part of Phase 2: Recommendations Engine
 */
import { supabase } from '../supabaseClient'
import { getAutonomousContext } from '../businessProfile'
import { getDealOutcomeStats, fetchDealOutcomes } from './dealService'
import { analyzeFunnelHealth, getCurrentMonthFunnelActuals } from './funnelActualsService'
import { buildContentTriggerUrl } from './contentTriggers'

// ============================================================================
// RECOMMENDATION TEMPLATES
// ============================================================================

const RECOMMENDATION_TEMPLATES = {
  // Funnel Health
  low_lead_to_discovery: {
    category: 'funnel',
    priority: 'high',
    title: 'Lead qualification needs attention',
    description: 'Only {rate}% of your leads become qualified. Consider improving your lead follow-up speed or refining your qualification criteria.',
    action_text: 'Create Qualification Content',
    contentTriggerId: 'low_lead_to_discovery', // Links to content generator
  },
  low_discovery_to_proposal: {
    category: 'funnel',
    priority: 'medium',
    title: 'Discovery calls not converting',
    description: '{rate}% of discovery calls lead to proposals. Review your discovery process - are you identifying true fit and building enough trust?',
    action_text: 'Create Trust Content',
    contentTriggerId: 'low_discovery_to_proposal',
  },
  low_proposal_to_close: {
    category: 'sales',
    priority: 'high',
    title: 'Proposals not closing',
    description: 'Only {rate}% of proposals close. Focus on objection handling and follow-up. Your top loss reason is "{lossReason}".',
    action_text: 'Create Objection Content',
    contentTriggerId: 'low_proposal_to_close',
  },

  // Win/Loss Patterns
  price_objections: {
    category: 'pricing',
    priority: 'high',
    title: 'Price is costing you deals',
    description: '{count} recent deals lost to price objections. Consider creating ROI content or adjusting your value presentation.',
    action_text: 'Create Value Content',
    contentTriggerId: 'price_objections',
  },
  competitor_losses: {
    category: 'marketing',
    priority: 'medium',
    title: 'Losing deals to {competitor}',
    description: 'You\'ve lost {count} deals to {competitor}. Create comparison content highlighting your advantages.',
    action_text: 'Create Comparison Post',
    contentTriggerId: 'competitor_loss',
  },
  timing_losses: {
    category: 'sales',
    priority: 'medium',
    title: 'Timing is a common objection',
    description: '{count} deals lost to "bad timing". Consider a nurture sequence to stay top of mind until they\'re ready.',
    action_text: 'Create Nurture Content',
    contentTriggerId: 'timing_objections',
  },

  // Capacity
  near_capacity: {
    category: 'capacity',
    priority: 'high',
    title: 'You\'re almost at capacity',
    description: 'You have {current} of {max} client slots filled. Consider raising prices or planning for team expansion.',
    action_text: 'Create Scarcity Post',
    contentTriggerId: 'near_capacity',
  },
  over_capacity: {
    category: 'capacity',
    priority: 'high',
    title: 'You\'re over capacity',
    description: 'You have {current} clients but capacity for {max}. This affects service quality. Time to hire or adjust.',
    action_text: 'Create Waitlist Post',
    contentTriggerId: 'over_capacity',
  },

  // Wins to celebrate
  win_streak: {
    category: 'marketing',
    priority: 'low',
    title: 'Create a case study from recent wins',
    description: 'You\'ve won {count} deals recently! Turn "{winReason}" wins into a case study or testimonial.',
    action_text: 'Create Case Study',
    contentTriggerId: 'win_streak',
  },

  // Setup prompts (no content generation)
  missing_setup: {
    category: 'sales',
    priority: 'medium',
    title: 'Complete your AI setup for better insights',
    description: 'Your autonomous AI is only {percent}% ready. Complete the setup to get personalized recommendations.',
    action_text: 'Complete Setup',
    action_url: '/crm/setup',
  },
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Analyze funnel and generate recommendations
 */
async function analyzeFunnelForRecommendations(userId) {
  const recommendations = []
  const funnel = await getCurrentMonthFunnelActuals(userId)

  if (!funnel || funnel.leads === 0) return recommendations

  const health = analyzeFunnelHealth(funnel)

  // Check each conversion point
  if (funnel.conversion_rates.lead_to_discovery < 30) {
    recommendations.push({
      ...RECOMMENDATION_TEMPLATES.low_lead_to_discovery,
      trigger_type: 'funnel_health',
      trigger_data: {
        metric: 'lead_to_discovery',
        rate: funnel.conversion_rates.lead_to_discovery,
        threshold: 30,
      },
      description: RECOMMENDATION_TEMPLATES.low_lead_to_discovery.description
        .replace('{rate}', funnel.conversion_rates.lead_to_discovery),
    })
  }

  if (funnel.conversion_rates.discovery_to_proposal < 40) {
    recommendations.push({
      ...RECOMMENDATION_TEMPLATES.low_discovery_to_proposal,
      trigger_type: 'funnel_health',
      trigger_data: {
        metric: 'discovery_to_proposal',
        rate: funnel.conversion_rates.discovery_to_proposal,
        threshold: 40,
      },
      description: RECOMMENDATION_TEMPLATES.low_discovery_to_proposal.description
        .replace('{rate}', funnel.conversion_rates.discovery_to_proposal),
    })
  }

  return recommendations
}

/**
 * Analyze win/loss patterns
 */
async function analyzeWinLossPatterns(userId) {
  const recommendations = []
  const stats = await getDealOutcomeStats(userId)

  if (!stats || stats.totalOutcomes < 3) return recommendations

  // Check for price issues
  if (stats.lossFactors.price >= 3) {
    recommendations.push({
      ...RECOMMENDATION_TEMPLATES.price_objections,
      trigger_type: 'win_loss_pattern',
      trigger_data: {
        pattern: 'price_objections',
        count: stats.lossFactors.price,
      },
      description: RECOMMENDATION_TEMPLATES.price_objections.description
        .replace('{count}', stats.lossFactors.price),
    })
  }

  // Check for timing issues
  if (stats.lossFactors.timing >= 3) {
    recommendations.push({
      ...RECOMMENDATION_TEMPLATES.timing_losses,
      trigger_type: 'win_loss_pattern',
      trigger_data: {
        pattern: 'timing_objections',
        count: stats.lossFactors.timing,
      },
      description: RECOMMENDATION_TEMPLATES.timing_losses.description
        .replace('{count}', stats.lossFactors.timing),
    })
  }

  // Check for competitor patterns
  if (stats.competitorsMentioned.length > 0) {
    const topCompetitor = stats.competitorsMentioned[0]
    const competitorCount = stats.competitorsMentioned.filter(c => c === topCompetitor).length

    if (competitorCount >= 2) {
      recommendations.push({
        ...RECOMMENDATION_TEMPLATES.competitor_losses,
        trigger_type: 'competitor',
        trigger_data: {
          competitor: topCompetitor,
          count: competitorCount,
        },
        description: RECOMMENDATION_TEMPLATES.competitor_losses.description
          .replace('{competitor}', topCompetitor)
          .replace('{count}', competitorCount),
        title: RECOMMENDATION_TEMPLATES.competitor_losses.title
          .replace('{competitor}', topCompetitor),
      })
    }
  }

  // Check for low close rate with reason
  if (stats.winRate < 20 && stats.topLossReason) {
    recommendations.push({
      ...RECOMMENDATION_TEMPLATES.low_proposal_to_close,
      trigger_type: 'win_loss_pattern',
      trigger_data: {
        winRate: stats.winRate,
        topLossReason: stats.topLossReason.reason,
      },
      description: RECOMMENDATION_TEMPLATES.low_proposal_to_close.description
        .replace('{rate}', stats.winRate)
        .replace('{lossReason}', formatReason(stats.topLossReason.reason)),
    })
  }

  // Check for wins to celebrate
  if (stats.wins >= 3 && stats.topWinReason) {
    recommendations.push({
      ...RECOMMENDATION_TEMPLATES.win_streak,
      trigger_type: 'win_loss_pattern',
      trigger_data: {
        wins: stats.wins,
        topWinReason: stats.topWinReason.reason,
      },
      description: RECOMMENDATION_TEMPLATES.win_streak.description
        .replace('{count}', stats.wins)
        .replace('{winReason}', formatReason(stats.topWinReason.reason)),
    })
  }

  return recommendations
}

/**
 * Analyze capacity
 */
async function analyzeCapacity(userId) {
  const recommendations = []
  const context = await getAutonomousContext(userId)

  if (!context?.capacity?.maxClients) return recommendations

  const { currentClients, maxClients } = context.capacity
  const utilization = currentClients / maxClients

  if (utilization >= 1) {
    recommendations.push({
      ...RECOMMENDATION_TEMPLATES.over_capacity,
      trigger_type: 'capacity',
      trigger_data: {
        current: currentClients,
        max: maxClients,
        utilization: Math.round(utilization * 100),
      },
      description: RECOMMENDATION_TEMPLATES.over_capacity.description
        .replace('{current}', currentClients)
        .replace('{max}', maxClients),
    })
  } else if (utilization >= 0.8) {
    recommendations.push({
      ...RECOMMENDATION_TEMPLATES.near_capacity,
      trigger_type: 'capacity',
      trigger_data: {
        current: currentClients,
        max: maxClients,
        utilization: Math.round(utilization * 100),
      },
      description: RECOMMENDATION_TEMPLATES.near_capacity.description
        .replace('{current}', currentClients)
        .replace('{max}', maxClients),
    })
  }

  return recommendations
}

/**
 * Check setup completion
 */
async function checkSetupCompletion(userId) {
  const recommendations = []

  const { data: progress } = await supabase
    .from('autonomous_setup_progress')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!progress || !progress.all_flows_completed) {
    const percent = progress?.data_readiness_percent || 70
    if (percent < 88) {
      recommendations.push({
        ...RECOMMENDATION_TEMPLATES.missing_setup,
        trigger_type: 'scheduled',
        trigger_data: {
          readinessPercent: percent,
        },
        description: RECOMMENDATION_TEMPLATES.missing_setup.description
          .replace('{percent}', percent),
        priority: 'low', // Don't be annoying about this
      })
    }
  }

  return recommendations
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Generate all recommendations for a user
 * Called by scheduled Edge Function
 */
export async function generateRecommendations(userId) {
  // Run all analyses in parallel
  const [funnelRecs, winLossRecs, capacityRecs, setupRecs] = await Promise.all([
    analyzeFunnelForRecommendations(userId),
    analyzeWinLossPatterns(userId),
    analyzeCapacity(userId),
    checkSetupCompletion(userId),
  ])

  const allRecommendations = [
    ...funnelRecs,
    ...winLossRecs,
    ...capacityRecs,
    ...setupRecs,
  ]

  // Dedupe by title (in case multiple analyses produce same rec)
  const uniqueRecs = allRecommendations.reduce((acc, rec) => {
    if (!acc.find(r => r.title === rec.title)) {
      acc.push(rec)
    }
    return acc
  }, [])

  // Resolve content trigger URLs
  const recsWithUrls = uniqueRecs.map(rec => {
    // If has contentTriggerId, build dynamic URL with context
    if (rec.contentTriggerId && !rec.action_url) {
      return {
        ...rec,
        action_url: buildContentTriggerUrl(rec.contentTriggerId, rec.trigger_data || {}),
      }
    }
    return rec
  })

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  recsWithUrls.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  // Take top 5 (don't overwhelm)
  return recsWithUrls.slice(0, 5)
}

/**
 * Save recommendations to database
 */
export async function saveRecommendations(userId, recommendations) {
  if (!recommendations.length) return { data: [], error: null }

  // Set expiration (7 days from now)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const toInsert = recommendations.map(rec => ({
    user_id: userId,
    category: rec.category,
    priority: rec.priority,
    title: rec.title,
    description: rec.description,
    action_text: rec.action_text,
    action_url: rec.action_url,
    trigger_type: rec.trigger_type,
    trigger_data: rec.trigger_data,
    status: 'pending',
    expires_at: expiresAt.toISOString(),
  }))

  const { data, error } = await supabase
    .from('recommendations')
    .insert(toInsert)
    .select()

  if (error) {
    console.error('Error saving recommendations:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Fetch pending recommendations for a user
 */
export async function fetchPendingRecommendations(userId) {
  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching recommendations:', error)
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

/**
 * Mark recommendation as viewed
 */
export async function markRecommendationViewed(recId, userId) {
  const { error } = await supabase
    .from('recommendations')
    .update({
      status: 'viewed',
      viewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', recId)
    .eq('user_id', userId)

  return { error }
}

/**
 * Mark recommendation as acted upon
 */
export async function markRecommendationActed(recId, userId) {
  const { error } = await supabase
    .from('recommendations')
    .update({
      status: 'acted',
      acted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', recId)
    .eq('user_id', userId)

  return { error }
}

/**
 * Dismiss recommendation
 */
/**
 * Dismiss reasons for learning
 */
export const DISMISS_REASONS = [
  { id: 'not_relevant', label: 'Not relevant to me', icon: '🚫' },
  { id: 'already_doing', label: 'Already doing this', icon: '✅' },
  { id: 'will_do_later', label: 'Will do later', icon: '⏰' },
  { id: 'disagree', label: 'I disagree', icon: '🤔' },
]

/**
 * Dismiss recommendation with optional reason
 */
export async function dismissRecommendation(recId, userId, reason = null) {
  const { error } = await supabase
    .from('recommendations')
    .update({
      status: 'dismissed',
      dismissed_at: new Date().toISOString(),
      dismissed_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recId)
    .eq('user_id', userId)

  return { error }
}

/**
 * Clear old pending recommendations before generating new ones
 */
export async function clearOldRecommendations(userId) {
  // Mark old pending as expired
  const { error } = await supabase
    .from('recommendations')
    .update({
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  return { error }
}

/**
 * Full recommendation refresh for a user
 * Call this weekly or on-demand
 */
export async function refreshRecommendations(userId) {
  // Clear old ones first
  await clearOldRecommendations(userId)

  // Generate new recommendations
  const recommendations = await generateRecommendations(userId)

  if (recommendations.length === 0) {
    return { data: [], generated: 0 }
  }

  // Save them
  const { data, error } = await saveRecommendations(userId, recommendations)

  if (error) {
    return { data: null, error, generated: 0 }
  }

  return { data, generated: recommendations.length }
}

// ============================================================================
// HELPERS
// ============================================================================

function formatReason(reason) {
  return reason
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}
