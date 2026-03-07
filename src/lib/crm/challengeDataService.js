/**
 * Challenge Data Service
 *
 * Fetches challenge/flow data for use in CRM components.
 * Connects the "planning" side (challenges) to the "execution" side (CRM).
 *
 * Missing connections this file addresses:
 * - offer_stack_builds → Sales page prompts, Email sequences
 * - grand_slam_offers → Proof/credibility in prompts
 * - validation_analysis → Pain language in prompts
 * - launch_readiness_assessments → Launch Mode
 * - product_selections → Value equation data
 * - mvp_readiness_assessments → Testers as warm leads
 * - groan_reflections → Psychological personalization
 * - nervous_system_responses → Pricing/visibility confidence
 * - funnel_metrics → Week-over-week trends
 *
 * @see docs/crm-challenge-data-mapping.md for full mapping documentation
 */

import { supabase } from '../supabaseClient'

// ============================================================================
// OFFER & PRODUCT DATA FETCHERS
// ============================================================================

/**
 * Fetch Offer Stack Builder data
 * Contains: lead magnet, bonuses, guarantee, scarcity, offer name
 */
export async function fetchOfferStackData(userId) {
  const { data, error } = await supabase
    .from('offer_stack_builds')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching offer stack:', error)
  }
  return data
}

/**
 * Fetch Grand Slam Evaluation data
 * Contains: proof stack, speed/ease data, obstacles, score
 */
export async function fetchGrandSlamData(userId) {
  const { data, error } = await supabase
    .from('grand_slam_offers')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching grand slam:', error)
  }
  return data
}

/**
 * Fetch AI-analyzed Validation Analysis
 * Contains: pain language, objections, dream outcomes, pricing signals
 * NOTE: Different from raw validation_responses - this is AI-processed
 */
export async function fetchValidationAnalysis(userId) {
  const { data, error } = await supabase
    .from('validation_analysis')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching validation analysis:', error)
  }
  return data
}

/**
 * Fetch Launch Readiness Assessment
 * Contains: pricing, audience size, proof inventory, launch approach
 */
export async function fetchLaunchReadiness(userId) {
  const { data, error } = await supabase
    .from('launch_readiness_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching launch readiness:', error)
  }
  return data
}

/**
 * Fetch Product Selection data (Value Equation)
 * Contains: mechanism, features, dream outcome, time delay, proof strategy
 */
export async function fetchProductSelections(userId) {
  const { data, error } = await supabase
    .from('product_selections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching product selections:', error)
  }
  return data || []
}

/**
 * Fetch Lead Magnet Assessment
 * Contains: magnet type, idea, reasoning
 */
export async function fetchLeadMagnetAssessment(userId) {
  const { data, error } = await supabase
    .from('lead_magnet_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching lead magnet assessment:', error)
  }
  return data
}

/**
 * Fetch Attraction Offer Assessment
 * Contains: recommended offer name, confidence score
 */
export async function fetchAttractionOfferData(userId) {
  const { data, error } = await supabase
    .from('attraction_offer_assessments')
    .select('recommended_offer_name, confidence_score, total_score, all_offer_scores')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching attraction offer assessment:', error)
  }
  return data
}

/**
 * Fetch Leads Strategy Assessment
 * Contains: recommended strategy name, confidence score
 */
export async function fetchLeadsStrategyData(userId) {
  const { data, error } = await supabase
    .from('leads_assessments')
    .select('recommended_strategy_name, confidence_score, total_score, all_strategy_scores')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching leads strategy assessment:', error)
  }
  return data
}

/**
 * Fetch Upsell Assessment
 * Contains: recommended offer name, confidence score
 */
export async function fetchUpsellData(userId) {
  const { data, error } = await supabase
    .from('upsell_assessments')
    .select('recommended_offer_name, confidence_score, total_score, all_offer_scores')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching upsell assessment:', error)
  }
  return data
}

/**
 * Fetch Downsell Assessment
 * Contains: recommended offer name, confidence score
 */
export async function fetchDownsellData(userId) {
  const { data, error } = await supabase
    .from('downsell_assessments')
    .select('recommended_offer_name, confidence_score, total_score, all_offer_scores')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching downsell assessment:', error)
  }
  return data
}

/**
 * Fetch Continuity Assessment
 * Contains: recommended offer name, confidence score
 */
export async function fetchContinuityData(userId) {
  const { data, error } = await supabase
    .from('continuity_assessments')
    .select('recommended_offer_name, confidence_score, total_score, all_offer_scores')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching continuity assessment:', error)
  }
  return data
}

// ============================================================================
// STAGE 3: TESTING DATA FETCHERS
// ============================================================================

/**
 * Fetch MVP Readiness Assessment
 * Contains: testers list (warm leads!), MVP definition
 */
export async function fetchMVPReadiness(userId) {
  const { data, error } = await supabase
    .from('mvp_readiness_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching MVP readiness:', error)
  }
  return data
}

/**
 * Fetch Feedback Analysis Assessment
 * Contains: key learnings, planned changes from tester feedback
 */
export async function fetchFeedbackAnalysis(userId) {
  const { data, error } = await supabase
    .from('feedback_analysis_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching feedback analysis:', error)
  }
  return data
}

/**
 * Fetch Conversation Logs
 * Contains: actual objections and insights from validation conversations
 */
export async function fetchConversationLogs(userId, limit = 20) {
  const { data, error } = await supabase
    .from('conversation_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching conversation logs:', error)
  }
  return data || []
}

// ============================================================================
// PSYCHOLOGICAL DATA FETCHERS
// ============================================================================

/**
 * Fetch Groan Reflection patterns (aggregated)
 * Uses SQL views for pre-aggregated data
 */
async function fetchGroanPatterns(userId) {
  const [fearsResult, archetypesResult, flowResult] = await Promise.all([
    supabase.from('user_fear_patterns').select('*').eq('user_id', userId),
    supabase.from('user_archetype_patterns').select('*').eq('user_id', userId),
    supabase.from('user_visibility_flow_patterns').select('*').eq('user_id', userId)
  ])

  const fears = fearsResult.data || []
  const archetypes = archetypesResult.data || []
  const flow = flowResult.data || []

  return {
    topFear: fears.sort((a, b) => b.occurrence_count - a.occurrence_count)[0]?.fear_type || null,
    topArchetype: archetypes.sort((a, b) => b.occurrence_count - a.occurrence_count)[0]?.protective_archetype || null,
    fearCounts: fears,
    archetypeCounts: archetypes,
    flowPatterns: flow
  }
}

/**
 * Fetch Nervous System calibration data
 * Contains: visibility ceiling, earning ceiling
 */
async function fetchNervousSystemData(userId) {
  const { data, error } = await supabase
    .from('nervous_system_responses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching nervous system data:', error)
  }
  return data
}

/**
 * Calculate recommended prompt tone based on psychological profile
 * Returns: 'assertive', 'balanced', or 'gentle'
 */
function calculateRecommendedTone(groanPatterns, nervousSystem) {
  const { topFear, topArchetype } = groanPatterns

  // High rejection/judgment fear or ghost archetype = gentle tone
  if (topFear === 'rejection' || topFear === 'judgment' || topArchetype === 'ghost') {
    return 'gentle'
  }

  // Performer or controller archetype = more assertive tone
  if (topArchetype === 'performer' || topArchetype === 'controller') {
    return 'assertive'
  }

  return 'balanced'
}

/**
 * Get full psychological profile for prompt personalization
 */
export async function fetchPsychologicalProfile(userId) {
  const [groanPatterns, nervousSystem] = await Promise.all([
    fetchGroanPatterns(userId),
    fetchNervousSystemData(userId)
  ])

  return {
    dominantFear: groanPatterns.topFear,
    dominantArchetype: groanPatterns.topArchetype,
    fearCounts: groanPatterns.fearCounts,
    archetypeCounts: groanPatterns.archetypeCounts,
    visibilityComfort: groanPatterns.flowPatterns,
    earningCeiling: nervousSystem?.earning_ceiling || null,
    visibilityCeiling: nervousSystem?.visibility_ceiling || null,
    recommendedTone: calculateRecommendedTone(groanPatterns, nervousSystem)
  }
}

// ============================================================================
// FUNNEL BASELINE / TRENDS
// ============================================================================

/**
 * Get funnel trends for week-over-week analysis
 */
export async function getFunnelTrends(userId, weeks = 4) {
  const { data, error } = await supabase
    .from('funnel_metrics')
    .select('*')
    .eq('user_id', userId)
    .eq('mode', 'actual')
    .order('week_start', { ascending: false })
    .limit(weeks)

  if (error) {
    console.error('Error fetching funnel trends:', error)
    return []
  }

  return (data || []).map(week => ({
    weekStart: week.week_start,
    createdAt: week.created_at,
    isBaseline: week.is_baseline,
    trafficSource: week.custom_rates?.traffic_source,
    focusNextWeek: week.custom_rates?.focus_next_week,
    totals: {
      awareness: week.awareness || 0,
      attraction: week.attraction || 0,
      leadmagnet: week.leadmagnet || 0,
      nurture: week.nurture || 0,
      core: week.core || 0,
      upsell: week.upsell || 0,
      downsell: week.downsell || 0,
      continuity: week.continuity || 0
    },
    rates: {
      awarenessToAttraction: week.awareness ? ((week.attraction / week.awareness) * 100).toFixed(1) : '0',
      attractionToLead: week.attraction ? ((week.leadmagnet / week.attraction) * 100).toFixed(1) : '0',
      leadToNurture: week.leadmagnet ? ((week.nurture / week.leadmagnet) * 100).toFixed(1) : '0',
      nurtureToCore: week.nurture ? ((week.core / week.nurture) * 100).toFixed(1) : '0',
      overall: week.awareness ? ((week.core / week.awareness) * 100).toFixed(2) : '0'
    }
  }))
}

/**
 * Analyze funnel trends and generate alerts
 */
export function analyzeFunnelTrends(trends) {
  if (!trends || trends.length < 2) return []

  const alerts = []
  const [current, previous] = trends

  const rateChecks = [
    { key: 'awarenessToAttraction', label: 'engagement', threshold: 20 },
    { key: 'attractionToLead', label: 'lead capture', threshold: 20 },
    { key: 'leadToNurture', label: 'nurture engagement', threshold: 15 },
    { key: 'nurtureToCore', label: 'sales conversion', threshold: 15 }
  ]

  for (const check of rateChecks) {
    const currentRate = parseFloat(current.rates[check.key])
    const previousRate = parseFloat(previous.rates[check.key])

    if (previousRate > 0) {
      const change = ((currentRate - previousRate) / previousRate) * 100

      if (change < -check.threshold) {
        alerts.push({
          type: 'funnel_drop',
          severity: 'high',
          metric: check.label,
          change: change.toFixed(0),
          currentRate: currentRate.toFixed(1),
          previousRate: previousRate.toFixed(1),
          message: `Your ${check.label} rate dropped ${Math.abs(change).toFixed(0)}% this week`
        })
      } else if (change > check.threshold) {
        alerts.push({
          type: 'funnel_improvement',
          severity: 'positive',
          metric: check.label,
          change: change.toFixed(0),
          message: `Great job! Your ${check.label} rate improved ${change.toFixed(0)}% this week`
        })
      }
    }
  }

  return alerts
}

// ============================================================================
// COMPLETENESS CHECKING
// ============================================================================

/**
 * Check which challenge data is complete for CRM features
 */
export async function getChallengeCompleteness(userId) {
  const [
    offerStack,
    grandSlam,
    validation,
    launchReadiness,
    productSelections,
    leadMagnet,
    mvpReadiness
  ] = await Promise.all([
    fetchOfferStackData(userId),
    fetchGrandSlamData(userId),
    fetchValidationAnalysis(userId),
    fetchLaunchReadiness(userId),
    fetchProductSelections(userId),
    fetchLeadMagnetAssessment(userId),
    fetchMVPReadiness(userId)
  ])

  return {
    offerStack: {
      completed: offerStack?.status === 'completed',
      hasLeadMagnet: !!offerStack?.lead_magnet_type,
      hasBonuses: (offerStack?.bonuses?.length || 0) > 0,
      hasGuarantee: !!offerStack?.guarantee_type,
      hasScarcity: (offerStack?.scarcity_types?.length || 0) > 0,
      hasName: !!offerStack?.offer_name
    },
    grandSlam: {
      completed: grandSlam?.status === 'completed',
      score: grandSlam?.grand_slam_score || null,
      hasProof: !!(grandSlam?.proof_data && Object.keys(grandSlam.proof_data).length > 0),
      hasSpeed: !!(grandSlam?.speed_data && Object.keys(grandSlam.speed_data).length > 0),
      hasEase: !!(grandSlam?.ease_data && Object.keys(grandSlam.ease_data).length > 0)
    },
    validation: {
      completed: !!validation,
      hasPainLanguage: (validation?.language_patterns?.length || 0) > 0,
      hasObjections: (validation?.objections?.length || 0) > 0,
      hasDreamOutcomes: (validation?.dream_outcomes?.length || 0) > 0,
      hasPricingSignals: !!validation?.pricing_signals
    },
    launchReadiness: {
      completed: !!launchReadiness,
      score: launchReadiness?.readiness_score || null,
      grade: launchReadiness?.readiness_grade || null,
      hasPricing: !!(launchReadiness?.pricing_data && Object.keys(launchReadiness.pricing_data).length > 0),
      hasAudience: !!(launchReadiness?.audience_data && Object.keys(launchReadiness.audience_data).length > 0),
      hasProof: !!(launchReadiness?.proof_data && Object.keys(launchReadiness.proof_data).length > 0)
    },
    productDesign: {
      completed: productSelections.length > 0,
      productsDesigned: productSelections.length
    },
    leadMagnet: {
      completed: !!leadMagnet,
      type: leadMagnet?.magnet_type || null
    },
    mvpReadiness: {
      completed: !!mvpReadiness,
      hasTesters: !!(mvpReadiness?.testers?.filter(t => t).length > 0)
    }
  }
}

/**
 * Calculate overall readiness percentage for CRM features
 */
export async function calculateCRMReadiness(userId) {
  const completeness = await getChallengeCompleteness(userId)

  const checks = [
    completeness.offerStack.completed,
    completeness.offerStack.hasLeadMagnet,
    completeness.offerStack.hasBonuses,
    completeness.offerStack.hasGuarantee,
    completeness.grandSlam.completed,
    completeness.grandSlam.hasProof,
    completeness.validation.completed,
    completeness.validation.hasPainLanguage,
    completeness.validation.hasObjections,
    completeness.launchReadiness.completed,
    completeness.launchReadiness.hasPricing,
    completeness.productDesign.completed
  ]

  const completedCount = checks.filter(Boolean).length
  const percentage = Math.round((completedCount / checks.length) * 100)

  return {
    percentage,
    completeness,
    isPromptReady: completeness.validation.completed && completeness.offerStack.completed,
    isLaunchReady: completeness.launchReadiness.completed && completeness.grandSlam.completed,
    missingForPrompts: getMissingForPrompts(completeness),
    missingForLaunch: getMissingForLaunch(completeness)
  }
}

function getMissingForPrompts(completeness) {
  const missing = []
  if (!completeness.validation.completed) missing.push('Validation Analysis')
  if (!completeness.validation.hasPainLanguage) missing.push('Pain language from validation')
  if (!completeness.offerStack.completed) missing.push('Offer Stack Builder')
  if (!completeness.offerStack.hasLeadMagnet) missing.push('Lead magnet selection')
  return missing
}

function getMissingForLaunch(completeness) {
  const missing = []
  if (!completeness.launchReadiness.completed) missing.push('Launch Readiness check')
  if (!completeness.launchReadiness.hasPricing) missing.push('Pricing confirmation')
  if (!completeness.grandSlam.completed) missing.push('Grand Slam Evaluation')
  if (!completeness.grandSlam.hasProof) missing.push('Social proof inventory')
  return missing
}

// ============================================================================
// MVP TESTERS → CRM CONTACTS SYNC
// ============================================================================

/**
 * Sync testers from MVP Readiness assessment to CRM contacts
 * Creates contacts with source='mvp_tester' for warm lead tracking
 *
 * @param {string} userId - User ID
 * @param {Object} options - Optional settings
 * @param {boolean} options.skipExisting - Skip if contact name already exists (default: true)
 * @returns {Object} - { created: number, skipped: number, errors: string[] }
 */
export async function syncMVPTestersToContacts(userId, options = {}) {
  const { skipExisting = true } = options

  const result = {
    created: 0,
    skipped: 0,
    errors: []
  }

  try {
    // Fetch MVP readiness data
    const mvpData = await fetchMVPReadiness(userId)

    if (!mvpData?.testers || !Array.isArray(mvpData.testers)) {
      return result
    }

    // Filter out empty tester names
    const testerNames = mvpData.testers.filter(name => name && name.trim())

    if (testerNames.length === 0) {
      return result
    }

    // If skipping existing, fetch current contacts to check names
    let existingNames = new Set()
    if (skipExisting) {
      const { data: existingContacts } = await supabase
        .from('crm_contacts')
        .select('name')
        .eq('user_id', userId)
        .eq('source', 'mvp_tester')

      existingNames = new Set(
        (existingContacts || []).map(c => c.name?.toLowerCase().trim())
      )
    }

    // Create contacts for each tester
    for (const testerName of testerNames) {
      const normalizedName = testerName.trim()

      // Skip if already exists
      if (skipExisting && existingNames.has(normalizedName.toLowerCase())) {
        result.skipped++
        continue
      }

      try {
        const { error } = await supabase
          .from('crm_contacts')
          .insert({
            user_id: userId,
            name: normalizedName,
            source: 'mvp_tester',
            stage: 'lead',
            notes: `Early tester from MVP Readiness flow. Added automatically on ${new Date().toLocaleDateString()}.`,
            tags: ['mvp_tester', 'warm_lead'],
            metadata: {
              imported_from: 'mvp_readiness_assessments',
              imported_at: new Date().toISOString()
            }
          })

        if (error) {
          result.errors.push(`Failed to create contact for "${normalizedName}": ${error.message}`)
        } else {
          result.created++
          existingNames.add(normalizedName.toLowerCase()) // Track for duplicates in same batch
        }
      } catch (err) {
        result.errors.push(`Error creating contact for "${normalizedName}": ${err.message}`)
      }
    }

    return result
  } catch (err) {
    console.error('Error syncing MVP testers:', err)
    result.errors.push(`Sync failed: ${err.message}`)
    return result
  }
}

/**
 * Check if there are unsynced testers (testers not yet in CRM contacts)
 */
export async function getUnsyncedTesters(userId) {
  try {
    const [mvpData, { data: existingContacts }] = await Promise.all([
      fetchMVPReadiness(userId),
      supabase
        .from('crm_contacts')
        .select('name')
        .eq('user_id', userId)
        .eq('source', 'mvp_tester')
    ])

    if (!mvpData?.testers) return []

    const existingNames = new Set(
      (existingContacts || []).map(c => c.name?.toLowerCase().trim())
    )

    const unsyncedTesters = mvpData.testers
      .filter(name => name && name.trim())
      .filter(name => !existingNames.has(name.toLowerCase().trim()))

    return unsyncedTesters
  } catch (err) {
    console.error('Error checking unsynced testers:', err)
    return []
  }
}

// ============================================================================
// AGGREGATED DATA FOR PROMPTS
// ============================================================================

/**
 * Fetch all challenge data needed for prompt generation
 * Use this when building context for AI copy generation
 */
export async function fetchAllChallengeData(userId) {
  const [
    offerStack,
    grandSlam,
    validation,
    launchReadiness,
    productSelections,
    psychological,
    attractionOffer,
    leadsStrategy,
    upsell,
    downsell,
    continuity
  ] = await Promise.all([
    fetchOfferStackData(userId),
    fetchGrandSlamData(userId),
    fetchValidationAnalysis(userId),
    fetchLaunchReadiness(userId),
    fetchProductSelections(userId),
    fetchPsychologicalProfile(userId),
    fetchAttractionOfferData(userId),
    fetchLeadsStrategyData(userId),
    fetchUpsellData(userId),
    fetchDownsellData(userId),
    fetchContinuityData(userId)
  ])

  return {
    // Offer details
    offer: {
      name: offerStack?.offer_name,
      tagline: offerStack?.tagline,
      leadMagnet: {
        type: offerStack?.lead_magnet_type,
        idea: offerStack?.lead_magnet_idea
      },
      bonuses: offerStack?.bonuses || [],
      guarantee: {
        type: offerStack?.guarantee_type,
        details: offerStack?.guarantee_details
      },
      scarcity: {
        types: offerStack?.scarcity_types || [],
        details: offerStack?.scarcity_details || {}
      },
      fullStack: offerStack?.full_stack
    },

    // Proof & credibility
    proof: {
      stack: grandSlam?.proof_data,
      speedAdvantage: grandSlam?.speed_data,
      easeFactor: grandSlam?.ease_data,
      obstacles: grandSlam?.obstacles,
      score: grandSlam?.grand_slam_score,
      scoreBreakdown: grandSlam?.score_breakdown
    },

    // Validation insights (AI-analyzed)
    validation: {
      painPoints: validation?.pain_points || [],
      dreamOutcomes: validation?.dream_outcomes || [],
      objections: validation?.objections || [],
      pricingSignals: validation?.pricing_signals,
      languagePatterns: validation?.language_patterns || [],
      keyInsights: validation?.key_insights || [],
      summary: validation?.summary
    },

    // Launch details
    launch: {
      approach: launchReadiness?.launch_approach,
      pricing: launchReadiness?.pricing_data,
      audience: launchReadiness?.audience_data,
      proof: launchReadiness?.proof_data,
      readinessScore: launchReadiness?.readiness_score,
      readinessGrade: launchReadiness?.readiness_grade,
      gaps: launchReadiness?.gaps || [],
      strengths: launchReadiness?.strengths || []
    },

    // Product value equations
    products: productSelections.map(p => ({
      id: p.id,
      productId: p.product_id,
      mechanism: p.mechanism,
      features: p.features,
      dreamOutcome: p.dream_outcome,
      timeDelay: p.time_delay,
      proofStrategy: p.proof_strategy,
      valueScore: p.value_score
    })),

    // Psychological personalization
    psychological: {
      dominantFear: psychological.dominantFear,
      dominantArchetype: psychological.dominantArchetype,
      recommendedTone: psychological.recommendedTone,
      earningCeiling: psychological.earningCeiling,
      visibilityCeiling: psychological.visibilityCeiling
    },

    // Attraction & Leads Strategy
    attractionOffer: attractionOffer ? {
      name: attractionOffer.recommended_offer_name,
      confidence: attractionOffer.confidence_score,
    } : null,

    leadsStrategy: leadsStrategy ? {
      name: leadsStrategy.recommended_strategy_name,
      confidence: leadsStrategy.confidence_score,
    } : null,

    upsell: upsell ? {
      name: upsell.recommended_offer_name,
      confidence: upsell.confidence_score,
    } : null,

    downsell: downsell ? {
      name: downsell.recommended_offer_name,
      confidence: downsell.confidence_score,
    } : null,

    continuity: continuity ? {
      name: continuity.recommended_offer_name,
      confidence: continuity.confidence_score,
    } : null
  }
}
