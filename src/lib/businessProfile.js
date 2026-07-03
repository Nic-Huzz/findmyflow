/**
 * Business Profile Service
 *
 * Unified data layer that aggregates user business information from multiple
 * flows and tables. Used by both Marketing Tower and Sales Tower for AI features.
 *
 * Architecture: Service aggregation pattern (real-time queries vs. denormalized table)
 * Benefits:
 * - Single source of truth for both towers
 * - No sync issues - always pulls latest data
 * - Each flow can evolve independently
 * - Extensible - easy to add new data sources
 *
 * See docs/architecture/BUSINESS_PROFILE_ARCHITECTURE.md for full architecture details.
 */

import { supabase } from './supabaseClient'

// ============================================================================
// FETCH FUNCTIONS - Individual data source queries
// ============================================================================

async function fetchLatestOffer(userId) {
  const { data, error } = await supabase
    .from('offer_creations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching offer:', error)
  }
  return data
}

async function fetchProducts(userId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) console.error('Error fetching products:', error)
  return data || []
}

async function fetchLTVModel(userId) {
  const { data, error } = await supabase
    .from('ltv_models')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching LTV model:', error)
  }
  return data
}

async function fetchContentStrategy(userId) {
  const { data, error } = await supabase
    .from('content_strategies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching content strategy:', error)
  }
  return data
}

async function fetchLeadsAssessment(userId) {
  const { data, error } = await supabase
    .from('leads_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching leads assessment:', error)
  }
  return data
}

async function fetchPersonaProfile(userId) {
  const { data, error } = await supabase
    .from('persona_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching persona profile:', error)
  }
  return data
}

async function fetchNikigaiOutcomes(userId) {
  const { data, error } = await supabase
    .from('nikigai_key_outcomes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching nikigai outcomes:', error)
  }
  return data
}

async function fetchVoiceProfile(userId) {
  const { data, error } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching voice profile:', error)
  }
  return data
}

async function fetchOfferBuilderAssessment(userId) {
  const { data, error } = await supabase
    .from('offer_builder_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching offer builder assessment:', error)
  }
  return data
}

// ============================================================================
// ASSESSMENT FETCH FUNCTIONS - Money Model flow assessments
// ============================================================================

async function fetchAttractionAssessment(userId) {
  const { data, error } = await supabase
    .from('attraction_offer_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching attraction assessment:', error)
  }
  return data
}

async function fetchUpsellAssessment(userId) {
  const { data, error } = await supabase
    .from('upsell_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching upsell assessment:', error)
  }
  return data
}

async function fetchDownsellAssessment(userId) {
  const { data, error } = await supabase
    .from('downsell_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching downsell assessment:', error)
  }
  return data
}

async function fetchContinuityAssessment(userId) {
  const { data, error } = await supabase
    .from('continuity_assessments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching continuity assessment:', error)
  }
  return data
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateCompleteness(checks) {
  const total = Object.keys(checks).length
  const completed = Object.values(checks).filter(Boolean).length
  return Math.round((completed / total) * 100)
}

function extractResponseValue(responses, key, field = 'value') {
  if (!responses || !responses[key]) return null
  const response = responses[key]
  return typeof response === 'object' ? response[field] : response
}

// ============================================================================
// MAIN SERVICE FUNCTION
// ============================================================================

/**
 * Get unified business profile for a user
 * Aggregates data from all relevant tables in parallel
 *
 * @param {string} userId - User ID
 * @returns {Object} Unified business profile
 */
export async function getUserBusinessProfile(userId) {
  if (!userId) {
    console.error('getUserBusinessProfile: userId is required')
    return null
  }

  // Fetch all relevant data in parallel for performance
  const [
    offerData,
    products,
    ltvModel,
    strategy,
    leadsAssessment,
    personaData,
    nikigaiOutcomes,
    voiceProfile,
    offerBuilder,
    attractionAssessment,
    upsellAssessment,
    downsellAssessment,
    continuityAssessment,
  ] = await Promise.all([
    fetchLatestOffer(userId),
    fetchProducts(userId),
    fetchLTVModel(userId),
    fetchContentStrategy(userId),
    fetchLeadsAssessment(userId),
    fetchPersonaProfile(userId),
    fetchNikigaiOutcomes(userId),
    fetchVoiceProfile(userId),
    fetchOfferBuilderAssessment(userId),
    fetchAttractionAssessment(userId),
    fetchUpsellAssessment(userId),
    fetchDownsellAssessment(userId),
    fetchContinuityAssessment(userId),
  ])

  // Helper to find product by type
  const findProduct = (type) => products?.find(p => p.type === type)

  return {
    // =========================================================================
    // IDENTITY & BUSINESS MODEL
    // =========================================================================
    businessType: offerData?.business_type || null,
    revenueModel: offerData?.revenue_model || 'one_time',

    // From Offer Builder Assessment
    niche: {
      definition: offerBuilder?.niche_definition,
      painLevel: offerBuilder?.pain_level,
      problemArea: offerBuilder?.problem_area,
      mvpDescription: offerBuilder?.mvp_description,
    },

    // =========================================================================
    // OFFER STACK
    // =========================================================================
    offers: {
      core: {
        name: offerData?.dream_outcome || findProduct('core')?.name,
        price: strategy?.core_offer_price || offerData?.price || findProduct('core')?.price,
        version: offerData?.selected_version,
        bonuses: offerData?.bonuses,
        totalValue: offerData?.total_value,
        grandSlamScore: offerData?.grand_slam_score,
      },

      attraction: {
        recommendedId: attractionAssessment?.recommended_offer_id,
        recommendedName: attractionAssessment?.recommended_offer_name,
        confidence: attractionAssessment?.confidence_score,
        responses: attractionAssessment?.responses,
      },

      upsell: {
        product: findProduct('upsell'),
        recommendedId: upsellAssessment?.recommended_offer_id,
        recommendedName: upsellAssessment?.recommended_offer_name,
        confidence: upsellAssessment?.confidence_score,
        responses: upsellAssessment?.responses,
        // Extracted key data for AI generation
        goal: extractResponseValue(upsellAssessment?.responses, 'Q7_primary_upsell_goal'),
        customerBase: extractResponseValue(upsellAssessment?.responses, 'Q1_customer_base_size'),
        productPortfolio: extractResponseValue(upsellAssessment?.responses, 'Q2_product_portfolio'),
        avgOrderValue: extractResponseValue(upsellAssessment?.responses, 'Q3_average_order_value'),
        salesChannel: extractResponseValue(upsellAssessment?.responses, 'Q9_sales_channel'),
      },

      downsell: {
        product: findProduct('downsell'),
        recommendedId: downsellAssessment?.recommended_offer_id,
        recommendedName: downsellAssessment?.recommended_offer_name,
        confidence: downsellAssessment?.confidence_score,
        responses: downsellAssessment?.responses,
        // Extracted key data for AI generation
        mainObjection: extractResponseValue(downsellAssessment?.responses, 'Q3_main_objection'),
        featureModularity: extractResponseValue(downsellAssessment?.responses, 'Q5_feature_modularity'),
        pricePoint: extractResponseValue(downsellAssessment?.responses, 'Q2_price_point'),
        goal: extractResponseValue(downsellAssessment?.responses, 'Q10_downsell_goal'),
        closeRate: extractResponseValue(downsellAssessment?.responses, 'Q6_current_close_rate'),
      },

      continuity: {
        product: findProduct('continuity'),
        recommendedId: continuityAssessment?.recommended_offer_id,
        recommendedName: continuityAssessment?.recommended_offer_name,
        confidence: continuityAssessment?.confidence_score,
        responses: continuityAssessment?.responses,
        // Extracted key data for AI generation
        businessModel: extractResponseValue(continuityAssessment?.responses, 'q1_business_model'),
      },

      leadMagnet: {
        type: strategy?.lead_magnet_type,
        product: findProduct('lead_magnet'),
      },
    },

    // =========================================================================
    // LTV & REVENUE
    // =========================================================================
    ltv: ltvModel?.total_ltv,
    targetCac: ltvModel?.target_cac_3_1 || ltvModel?.target_cac,
    currentMrr: offerData?.current_mrr || 0,
    revenueGoal: strategy?.revenue_goal,

    ltvBreakdown: {
      corePrice: ltvModel?.core_price,
      upsellPrice: ltvModel?.upsell_price,
      upsellRate: ltvModel?.upsell_rate,
      monthlySubscription: ltvModel?.monthly_subscription,
    },

    // =========================================================================
    // AUDIENCE & PERSONA
    // =========================================================================
    audience: {
      followerCount: strategy?.follower_count,
      avgReachPerPost: strategy?.avg_views_per_post,
      platform: strategy?.primary_platform,
      personas: nikigaiOutcomes?.target_personas,
      problems: nikigaiOutcomes?.top_problem_clusters,
      skills: nikigaiOutcomes?.top_skill_clusters,
      opportunities: nikigaiOutcomes?.opportunity_statements,
    },

    persona: personaData,

    // =========================================================================
    // MARKETING STRATEGY
    // =========================================================================
    strategy: {
      leadStrategy: strategy?.lead_strategy || leadsAssessment?.recommended_strategy_id,
      calculatedTargets: strategy?.calculated_targets,
      primaryPlatform: strategy?.primary_platform,
    },

    // =========================================================================
    // VOICE & BRAND
    // =========================================================================
    voice: voiceProfile ? {
      id: voiceProfile.id,
      profileName: voiceProfile.profile_name,
      selectedTemplate: voiceProfile.selected_template,
      customInstructions: voiceProfile.custom_instructions,
      toneSettings: voiceProfile.tone_settings,
      vocabularyBanks: voiceProfile.vocabulary_banks,
      learnedPatterns: voiceProfile.learned_patterns,
      feedbackScore: voiceProfile.feedback_score,
      totalGenerations: voiceProfile.total_generations,
    } : null,

    // =========================================================================
    // RAW ASSESSMENT DATA (for advanced AI context)
    // =========================================================================
    rawAssessments: {
      attraction: attractionAssessment,
      upsell: upsellAssessment,
      downsell: downsellAssessment,
      continuity: continuityAssessment,
      offerBuilder: offerBuilder,
      leads: leadsAssessment,
    },

    // =========================================================================
    // DATA COMPLETENESS (for UI guidance)
    // =========================================================================
    dataCompleteness: calculateCompleteness({
      hasOffer: !!offerData,
      hasPrice: !!(strategy?.core_offer_price || offerData?.price),
      hasAudience: !!(strategy?.follower_count && strategy?.avg_views_per_post),
      hasPersona: !!nikigaiOutcomes?.target_personas,
      hasStrategy: !!strategy?.lead_strategy,
      hasVoice: !!voiceProfile,
      hasUpsell: !!upsellAssessment,
      hasDownsell: !!downsellAssessment,
      hasContinuity: !!continuityAssessment,
    }),

    // Timestamp for cache validation
    fetchedAt: new Date().toISOString(),
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS FOR SPECIFIC USE CASES
// ============================================================================

/**
 * Get just the offer stack data (faster query for Sales Tower)
 */
export async function getOfferStack(userId) {
  const [
    offerData,
    products,
    attractionAssessment,
    upsellAssessment,
    downsellAssessment,
    continuityAssessment,
  ] = await Promise.all([
    fetchLatestOffer(userId),
    fetchProducts(userId),
    fetchAttractionAssessment(userId),
    fetchUpsellAssessment(userId),
    fetchDownsellAssessment(userId),
    fetchContinuityAssessment(userId),
  ])

  const findProduct = (type) => products?.find(p => p.type === type)

  return {
    core: {
      name: offerData?.dream_outcome || findProduct('core')?.name,
      price: offerData?.price || findProduct('core')?.price,
    },
    attraction: {
      recommendedId: attractionAssessment?.recommended_offer_id,
      recommendedName: attractionAssessment?.recommended_offer_name,
    },
    upsell: {
      product: findProduct('upsell'),
      recommendedId: upsellAssessment?.recommended_offer_id,
      recommendedName: upsellAssessment?.recommended_offer_name,
    },
    downsell: {
      product: findProduct('downsell'),
      recommendedId: downsellAssessment?.recommended_offer_id,
      recommendedName: downsellAssessment?.recommended_offer_name,
    },
    continuity: {
      product: findProduct('continuity'),
      recommendedId: continuityAssessment?.recommended_offer_id,
      recommendedName: continuityAssessment?.recommended_offer_name,
    },
    leadMagnet: findProduct('lead_magnet'),
  }
}

// ============================================================================
// TIER 4 DATA FETCHERS - Autonomous System Context
// ============================================================================

async function fetchBusinessBaseline(userId) {
  const { data, error } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching business baseline:', error)
  }
  return data
}

async function fetchCustomerSegments(userId) {
  const { data, error } = await supabase
    .from('customer_segments')
    .select('*')
    .eq('user_id', userId)
    .order('segment_type', { ascending: true })

  if (error) console.error('Error fetching customer segments:', error)
  return data || []
}

async function fetchCompetitorAnalysis(userId) {
  const { data, error } = await supabase
    .from('competitor_analysis')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(3)

  if (error) console.error('Error fetching competitors:', error)
  return data || []
}

/**
 * Get all Tier 4 autonomous context data
 */
export async function getAutonomousContext(userId) {
  // Import dynamically to avoid circular dependency
  const { getFunnelContext } = await import('./crm/funnelActualsService')

  const [baseline, segments, competitors, funnelCtx] = await Promise.all([
    fetchBusinessBaseline(userId),
    fetchCustomerSegments(userId),
    fetchCompetitorAnalysis(userId),
    getFunnelContext(userId).catch(() => null),
  ])

  const bestCustomer = segments.find(s => s.segment_type === 'best')
  const worstCustomer = segments.find(s => s.segment_type === 'worst')

  return {
    // Business baseline
    revenue: {
      current: baseline?.current_monthly_revenue,
      target: baseline?.target_monthly_revenue,
      model: baseline?.revenue_model,
    },
    margins: {
      grossPercent: baseline?.gross_margin_percent,
      deliveryCost: baseline?.cost_to_deliver,
      marketingBudget: baseline?.marketing_budget_monthly,
    },
    capacity: {
      hoursPerWeek: baseline?.hours_per_week,
      teamSize: baseline?.team_size,
      maxClients: baseline?.max_clients,
      currentClients: baseline?.current_clients,
    },
    // Customer intelligence
    customers: {
      best: bestCustomer ? {
        description: bestCustomer.description,
        buyingTrigger: bestCustomer.buying_trigger,
        revenuePercent: bestCustomer.revenue_percent,
        easeRating: bestCustomer.ease_of_work_rating,
      } : null,
      worst: worstCustomer ? {
        description: worstCustomer.description,
        objections: worstCustomer.common_objections,
      } : null,
    },
    // Competitive intelligence
    competitors: competitors.map(c => ({
      name: c.competitor_name,
      pricing: c.their_pricing?.mid,
      positioning: c.their_positioning,
      strength: c.their_strengths?.[0],
      weakness: c.their_weaknesses?.[0],
    })),
    yourAdvantage: competitors[0]?.your_advantage || null,
    // Funnel performance (from CRM actuals)
    funnel: funnelCtx ? {
      leads: funnelCtx.current.leads,
      sales: funnelCtx.current.sales,
      conversionRate: funnelCtx.conversionRates.overall,
      avgDealSize: funnelCtx.current.avgDealSize,
      weakPoint: funnelCtx.health.topIssue,
      recommendation: funnelCtx.health.recommendation,
    } : null,
    // Readiness check
    isComplete: !!(baseline?.setup_completed && bestCustomer && competitors.length > 0),
  }
}

/**
 * Get voice profile with enhanced instructions for AI generation
 */
export async function getVoiceForGeneration(userId) {
  const voiceProfile = await fetchVoiceProfile(userId)
  if (!voiceProfile) return null

  // Import the enhanced voice builder if needed
  try {
    const { buildEnhancedVoiceInstructions } = await import('./voiceProfile')
    return {
      profile: voiceProfile,
      instructions: buildEnhancedVoiceInstructions(voiceProfile),
    }
  } catch (e) {
    return {
      profile: voiceProfile,
      instructions: voiceProfile.custom_instructions || '',
    }
  }
}

/**
 * Get AI context for a specific offer type (optimized for implementation tasks)
 * Now includes Tier 4 autonomous data when available
 */
export async function getOfferContext(userId, offerType) {
  const [profile, autonomous] = await Promise.all([
    getUserBusinessProfile(userId),
    getAutonomousContext(userId),
  ])

  if (!profile) return null

  const offerMap = {
    attraction: profile.offers.attraction,
    upsell: profile.offers.upsell,
    downsell: profile.offers.downsell,
    continuity: profile.offers.continuity,
  }

  return {
    offer: offerMap[offerType] || null,
    core: profile.offers.core,
    audience: profile.audience,
    voice: profile.voice,
    niche: profile.niche,
    // Tier 4 autonomous data
    autonomous: autonomous,
  }
}
