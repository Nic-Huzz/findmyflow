/**
 * Content Context Service
 *
 * Aggregates user data from various sources to provide context
 * for prompt generation and content creation.
 *
 * This normalizes data from:
 * - persona_profiles (target audience)
 * - offer_builder_assessments (offer details)
 * - validation_analysis (customer research)
 * - brand_voice_assessments (voice/tone)
 * - grand_slam_offers (proof)
 * - launch_readiness_assessments (launch data)
 */

import { supabase } from '../supabaseClient'
import { fetchAllChallengeData } from './challengeDataService'

/**
 * Get content context for prompt generation
 * Returns normalized data structure expected by prompt templates
 */
export async function getContentContext(userId) {
  try {
    // Fetch all challenge data
    const challengeData = await fetchAllChallengeData(userId)

    // Also fetch persona profile directly (may have different data)
    const [{ data: personaProfile }, { data: movementData }] = await Promise.all([
      supabase
        .from('persona_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('remarkable_angles')
        .select('wound_problem, rule_identified, ai_rule_statement, ai_tribe_statement')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    // Fetch validation responses count (via validation_flows, since responses don't have user_id)
    const { data: userFlows } = await supabase
      .from('validation_flows')
      .select('id')
      .eq('user_id', userId)
    const flowIds = (userFlows || []).map(f => f.id)
    let validationCount = 0
    if (flowIds.length > 0) {
      const { count } = await supabase
        .from('validation_responses')
        .select('id', { count: 'exact', head: true })
        .in('flow_id', flowIds)
      validationCount = count || 0
    }

    // Build normalized context
    const context = {
      // Persona / target audience
      persona: {
        personaName: personaProfile?.persona_name || challengeData?.validation?.personaName,
        ideal_customer: personaProfile?.ideal_customer ||
          challengeData?.validation?.idealCustomer,
        core_problem: personaProfile?.core_problem ||
          challengeData?.validation?.painPoints?.[0],
        unique_approach: personaProfile?.unique_approach,
        demographics: personaProfile?.demographics,
        psychographics: personaProfile?.psychographics
      },

      // Offer details
      offer: {
        name: challengeData?.offer?.name,
        tagline: challengeData?.offer?.tagline,
        coreProblem: challengeData?.offer?.fullStack?.core_problem ||
          personaProfile?.core_problem,
        dreamOutcome: challengeData?.offer?.fullStack?.dream_outcome,
        pricing: challengeData?.launch?.pricing?.price ||
          challengeData?.offer?.fullStack?.pricing,
        leadMagnet: challengeData?.offer?.leadMagnet,
        bonuses: challengeData?.offer?.bonuses || [],
        guarantee: challengeData?.offer?.guarantee,
        scarcity: challengeData?.offer?.scarcity
      },

      // Validation insights
      validation: {
        totalResponses: validationCount || 0,
        painPoints: challengeData?.validation?.painPoints || [],
        dreamOutcomes: challengeData?.validation?.dreamOutcomes || [],
        objections: challengeData?.validation?.objections || [],
        pricingSignals: challengeData?.validation?.pricingSignals,
        languagePatterns: challengeData?.validation?.languagePatterns || [],
        keyInsights: challengeData?.validation?.keyInsights || []
      },

      // Proof elements
      proof: {
        stack: challengeData?.proof?.stack,
        score: challengeData?.proof?.score,
        speedAdvantage: challengeData?.proof?.speedAdvantage,
        easeFactor: challengeData?.proof?.easeFactor
      },

      // Launch readiness
      launch: {
        approach: challengeData?.launch?.approach,
        pricing: challengeData?.launch?.pricing,
        audience: challengeData?.launch?.audience,
        proof: challengeData?.launch?.proof,
        readinessScore: challengeData?.launch?.readinessScore,
        readinessGrade: challengeData?.launch?.readinessGrade
      },

      // Movement / DAM statement (from Remarkable Flow)
      movement: movementData ? {
        woundProblem: movementData.wound_problem,
        ruleIdentified: movementData.rule_identified,
        ruleStatement: movementData.ai_rule_statement,
        tribeStatement: movementData.ai_tribe_statement,
      } : null,

      // Voice (placeholder - could be fetched from brand voice assessment)
      voice: null,

      // Products
      products: challengeData?.products || [],

      // Attraction & Leads Strategy
      attractionOffer: challengeData?.attractionOffer || null,
      leadsStrategy: challengeData?.leadsStrategy || null,

      // Money Model Offers
      upsell: challengeData?.upsell || null,
      downsell: challengeData?.downsell || null,
      continuity: challengeData?.continuity || null
    }

    return context
  } catch (err) {
    console.error('Error fetching content context:', err)
    return {
      persona: null,
      offer: null,
      validation: null,
      proof: null,
      launch: null,
      movement: null,
      voice: null,
      products: [],
      attractionOffer: null,
      leadsStrategy: null,
      upsell: null,
      downsell: null,
      continuity: null
    }
  }
}

/**
 * Check data availability for prompts
 * Returns which data sources are populated
 */
export async function checkDataAvailability(userId) {
  const context = await getContentContext(userId)

  return {
    persona: !!(context.persona?.personaName || context.persona?.ideal_customer),
    offer: !!(context.offer?.coreProblem || context.offer?.name),
    price: !!(context.offer?.pricing),
    proof: !!(context.validation?.totalResponses > 0 || context.proof?.stack),
    guarantee: !!(context.offer?.guarantee?.type),
    validation: !!(context.validation?.painPoints?.length > 0),
    voice: !!(context.voice?.voice_summary),
    launch: !!(context.launch?.readinessScore)
  }
}
