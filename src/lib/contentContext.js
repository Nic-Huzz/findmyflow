/**
 * Content Context Service
 * Gathers all user data for AI-powered content generation
 *
 * Data Sources:
 * 1. FindMyFlow persona (nikigai_clusters)
 * 2. Validation survey insights (validation_responses)
 * 3. Offer Builder details (offer_creations)
 * 4. Past marketing performance (marketing_tasks)
 * 5. Recent deal context (sales_deals)
 */
import { supabase } from './supabaseClient'

/**
 * Fetch user's persona data from FindMyFlow
 */
export async function fetchPersonaData(userId) {
  try {
    // Query actual nikigai_clusters columns
    const { data, error } = await supabase
      .from('nikigai_clusters')
      .select('cluster_label, cluster_type, items, insight, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error || !data || data.length === 0) {
      console.log('No persona data found:', error?.message)
      return null
    }

    // Transform to expected format
    const skills = data.filter(d => d.cluster_type === 'skills').map(d => d.cluster_label)
    const problems = data.filter(d => d.cluster_type === 'problems').map(d => d.cluster_label)
    const persona = data.find(d => d.cluster_type === 'persona')

    return {
      ideal_customer: persona?.cluster_label || null,
      core_problem: problems[0] || null,
      skills: skills,
      values: [],
      unique_approach: persona?.insight || null
    }
  } catch (err) {
    console.log('Error fetching persona:', err)
    return null
  }
}

/**
 * Fetch validation survey insights
 * Validation responses are stored as individual Q&A pairs in validation_responses
 * We aggregate them by looking at question patterns
 */
export async function fetchValidationInsights(userId, projectId = null) {
  try {
    // First get user's validation flows
    let flowsQuery = supabase
      .from('validation_flows')
      .select('id')
      .eq('creator_user_id', userId)
      .limit(5)

    if (projectId) {
      flowsQuery = flowsQuery.eq('project_id', projectId)
    }

    const { data: flows, error: flowsError } = await flowsQuery

    if (flowsError || !flows || flows.length === 0) {
      console.log('No validation flows found:', flowsError?.message)
      return null
    }

    const flowIds = flows.map(f => f.id)

    // Fetch responses for those flows
    const { data: responses, error: respError } = await supabase
      .from('validation_responses')
      .select('question_text, answer_value, answered_at')
      .in('flow_id', flowIds)
      .order('answered_at', { ascending: false })
      .limit(50)

    if (respError || !responses || responses.length === 0) {
      console.log('No validation responses found:', respError?.message)
      return null
    }

    // Categorize responses by question patterns
    const aggregated = {
      pain_points: [],
      desired_outcomes: [],
      objections: [],
      direct_quotes: [],
      language_used: []
    }

    responses.forEach(r => {
      const q = (r.question_text || '').toLowerCase()
      const answer = r.answer_value

      if (!answer || typeof answer !== 'string') return

      // Categorize by question keywords
      if (q.includes('pain') || q.includes('struggle') || q.includes('challenge') || q.includes('problem')) {
        aggregated.pain_points.push(answer)
      } else if (q.includes('outcome') || q.includes('goal') || q.includes('achieve') || q.includes('want')) {
        aggregated.desired_outcomes.push(answer)
      } else if (q.includes('hesitat') || q.includes('concern') || q.includes('objection') || q.includes('worry')) {
        aggregated.objections.push(answer)
      } else {
        // Collect unique language/phrases from all other responses
        aggregated.language_used.push(answer)
      }
    })

    // Deduplicate and limit
    Object.keys(aggregated).forEach(key => {
      aggregated[key] = [...new Set(aggregated[key])].slice(0, 10)
    })

    // Only return if we have some data
    const hasData = Object.values(aggregated).some(arr => arr.length > 0)
    return hasData ? aggregated : null
  } catch (err) {
    console.log('Error fetching validation:', err)
    return null
  }
}

/**
 * Fetch Offer Builder V1 data (original offer builder assessments)
 * Contains niche definition, problem area, pain level, solutions
 */
export async function fetchOfferBuilderV1(userId) {
  try {
    const { data, error } = await supabase
      .from('offer_builder_assessments')
      .select(`
        responses,
        pain_level,
        problem_area,
        niche_definition,
        chosen_solution,
        mvp_description,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      console.log('No V1 offer data found:', error?.message)
      return null
    }

    // Extract key insights from responses JSONB
    const responses = data.responses || {}

    return {
      niche_definition: data.niche_definition,
      problem_area: data.problem_area,
      pain_level: data.pain_level,
      chosen_solution: data.chosen_solution,
      mvp_description: data.mvp_description,
      // Extract categorized solutions if available
      core_solutions: responses.q8_solution_categories?.value?.core || [],
      lead_magnet_ideas: responses.q8_solution_categories?.value?.lead || [],
      bonus_ideas: responses.q8_solution_categories?.value?.bonus || [],
      raw_responses: responses
    }
  } catch (err) {
    console.log('Error fetching V1 offer:', err)
    return null
  }
}

/**
 * Fetch Voice Profile insights (origin story, client wins, contrarian takes)
 * These are rich narrative content that enriches AI-generated posts
 */
export async function fetchVoiceInsights(userId) {
  try {
    const { data, error } = await supabase
      .from('voice_profiles')
      .select(`
        origin_story,
        audience_description,
        unique_approach,
        catchphrases,
        content_samples,
        voice_summary,
        voice_influences
      `)
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) {
      console.log('No voice profile found:', error?.message)
      return null
    }

    // Only return if user has completed voice training (has origin story or samples)
    if (!data.origin_story && (!data.content_samples || data.content_samples.length === 0)) {
      return null
    }

    return {
      origin_story: data.origin_story,
      audience_description: data.audience_description,
      contrarian_takes: data.unique_approach,
      signature_phrases: data.catchphrases || [],
      content_examples: data.content_samples || [],
      voice_summary: data.voice_summary,
      voice_influences: data.voice_influences || []
    }
  } catch (err) {
    console.log('Error fetching voice insights:', err)
    return null
  }
}

/**
 * Fetch offer details from Offer Builder V2
 * Uses offer_creations table with correct column names
 */
export async function fetchOfferDetails(userId, projectId = null) {
  try {
    let query = supabase
      .from('offer_creations')
      .select(`
        selected_version,
        dream_outcome,
        dream_outcome_bucket,
        price,
        bonuses,
        total_value,
        total_grand_slam_score,
        core_deliverable,
        proof_personal_transformation,
        proof_case_studies,
        proof_credentials,
        created_at,
        completed_at
      `)
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query.maybeSingle()

    if (error || !data) {
      console.log('No offer data found:', error?.message)
      return null
    }

    // Build proof points from available proof columns
    const proofPoints = []
    if (data.proof_personal_transformation) proofPoints.push(data.proof_personal_transformation)
    if (data.proof_case_studies) proofPoints.push(data.proof_case_studies)
    if (data.proof_credentials) proofPoints.push(data.proof_credentials)

    return {
      offer_name: data.selected_version || 'Core Offer',
      dream_outcome: data.dream_outcome,
      target_audience: null, // Not stored in this table
      core_offer_price: data.price,
      key_benefits: data.core_deliverable ? [data.core_deliverable] : [],
      bonuses: data.bonuses || [],
      proof_points: proofPoints,
      grand_slam_score: data.total_grand_slam_score,
      bucket: data.dream_outcome_bucket,
      total_value: data.total_value
    }
  } catch (err) {
    console.log('Error fetching offer:', err)
    return null
  }
}

/**
 * Fetch top performing marketing content
 */
export async function fetchTopPerformingContent(userId, limit = 5) {
  try {
    const { data, error } = await supabase
      .from('marketing_tasks')
      .select('content_type, platform, engagement_likes, engagement_comments, engagement_shares, engagement_dms, task_type, completed_at')
      .eq('user_id', userId)
      .eq('completed', true)
      .order('engagement_likes', { ascending: false })
      .limit(limit * 2)

    if (error || !data || data.length === 0) {
      console.log('No marketing data found:', error?.message)
      return null
    }

    // Calculate total engagement and sort
    const withEngagement = data.map(task => ({
      ...task,
      total_engagement: (task.engagement_likes || 0) + (task.engagement_comments || 0) * 2 + (task.engagement_shares || 0) * 3 + (task.engagement_dms || 0) * 4
    }))
      .filter(t => t.total_engagement > 0)
      .sort((a, b) => b.total_engagement - a.total_engagement)
      .slice(0, limit)

    if (withEngagement.length === 0) return null

    // Analyze patterns
    const contentTypes = {}
    const platforms = {}

    withEngagement.forEach(task => {
      contentTypes[task.content_type] = (contentTypes[task.content_type] || 0) + 1
      platforms[task.platform] = (platforms[task.platform] || 0) + 1
    })

    const bestContentTypes = Object.entries(contentTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type)

    const bestPlatforms = Object.entries(platforms)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([platform]) => platform)

    return {
      top_performing_posts: withEngagement,
      best_content_types: bestContentTypes,
      best_platforms: bestPlatforms,
      total_posts_analyzed: data.length
    }
  } catch (err) {
    console.log('Error fetching marketing:', err)
    return null
  }
}

/**
 * Fetch recent deal wins and context
 */
export async function fetchRecentWins(userId, limit = 3) {
  try {
    const { data: wins, error: winsError } = await supabase
      .from('sales_deals')
      .select('contact_name, product_type, value, actual_close_date, notes')
      .eq('user_id', userId)
      .eq('status', 'won')
      .order('actual_close_date', { ascending: false })
      .limit(limit)

    if (winsError || !wins || wins.length === 0) {
      console.log('No wins found:', winsError?.message)
      return null
    }

    // Get common objections from all deals
    const { data: allDeals } = await supabase
      .from('sales_deals')
      .select('notes')
      .eq('user_id', userId)
      .not('notes', 'is', null)
      .limit(20)

    const objectionKeywords = ['think about', 'expensive', 'afford', 'time', 'not sure', 'later']
    const commonObjections = []

    allDeals?.forEach(deal => {
      if (deal.notes) {
        objectionKeywords.forEach(keyword => {
          if (deal.notes.toLowerCase().includes(keyword)) {
            commonObjections.push(keyword)
          }
        })
      }
    })

    return {
      recent_wins: wins.map(w => ({
        name: w.contact_name,
        product: w.product_type,
        value: w.value,
        date: w.actual_close_date
      })),
      total_won_value: wins.reduce((sum, w) => sum + (w.value || 0), 0),
      common_objections: [...new Set(commonObjections)]
    }
  } catch (err) {
    console.log('Error fetching deals:', err)
    return null
  }
}

/**
 * Gather all context for content generation
 * Includes: persona (FlowFinder), validation surveys, both offer builders, voice insights
 */
export async function gatherContentContext(userId, projectId = null) {
  const [persona, validation, offerV2, offerV1, voice, marketing, deals] = await Promise.all([
    fetchPersonaData(userId),
    fetchValidationInsights(userId, projectId),
    fetchOfferDetails(userId, projectId),
    fetchOfferBuilderV1(userId),
    fetchVoiceInsights(userId),
    fetchTopPerformingContent(userId, 5),
    fetchRecentWins(userId, 3)
  ])

  // Combine V1 and V2 offer data (V2 takes precedence where both exist)
  const offer = offerV2 || offerV1 ? {
    // V2 fields (preferred)
    offer_name: offerV2?.offer_name || 'Core Offer',
    dream_outcome: offerV2?.dream_outcome,
    target_audience: offerV2?.target_audience,
    core_offer_price: offerV2?.core_offer_price,
    key_benefits: offerV2?.key_benefits || [],
    bonuses: offerV2?.bonuses || [],
    proof_points: offerV2?.proof_points || [],
    grand_slam_score: offerV2?.grand_slam_score,
    bucket: offerV2?.bucket,
    total_value: offerV2?.total_value,
    // V1 fields (for deeper niche/problem context)
    niche_definition: offerV1?.niche_definition,
    problem_area: offerV1?.problem_area,
    pain_level: offerV1?.pain_level,
    chosen_solution: offerV1?.chosen_solution || offerV2?.dream_outcome,
    mvp_description: offerV1?.mvp_description,
    core_solutions: offerV1?.core_solutions || [],
    lead_magnet_ideas: offerV1?.lead_magnet_ideas || [],
    bonus_ideas: offerV1?.bonus_ideas || [],
    // Track which versions we have
    hasV1: !!offerV1,
    hasV2: !!offerV2
  } : null

  return {
    persona,
    validation,
    offer,
    voice,
    marketing,
    deals,
    hasFullContext: !!(persona && validation && offer && voice),
    hasPartialContext: !!(persona || validation || offer || voice),
    contextSources: {
      persona: !!persona,
      validation: !!validation,
      offer: !!offer,
      offerV1: !!offerV1,
      offerV2: !!offerV2,
      voice: !!voice,
      marketing: !!marketing,
      deals: !!deals
    }
  }
}

/**
 * Get context completeness for UI display
 */
export function getContextCompleteness(context) {
  const items = [
    { key: 'persona', label: 'FlowFinder (Skills/Persona)', complete: !!context?.persona, route: '/nikigai/skills' },
    { key: 'voice', label: 'Voice Profile', complete: !!context?.voice, route: '/voice-training' },
    { key: 'validation', label: 'Validation Insights', complete: !!context?.validation, route: '/validation-flows' },
    { key: 'offer', label: 'Offer Builder', complete: !!context?.offer, route: context?.contextSources?.offerV2 ? '/offer-builder-v2' : '/offer-builder' },
    { key: 'marketing', label: 'Past Performance', complete: !!context?.marketing, route: '/crm/marketing' },
    { key: 'deals', label: 'Recent Wins', complete: !!context?.deals, route: '/crm/sales' }
  ]

  const completedCount = items.filter(i => i.complete).length
  const percentage = Math.round((completedCount / items.length) * 100)

  return {
    items,
    completedCount,
    percentage,
    isReady: percentage >= 33 // At least 2 sources to generate
  }
}

/**
 * Build prompt context string for AI
 */
export function buildContextString(context) {
  const parts = []

  if (context.persona) {
    parts.push(`
USER PROFILE (from FlowFinder):
- Ideal Customer: ${context.persona.ideal_customer || 'Not specified'}
- Core Problem They Solve: ${context.persona.core_problem || 'Not specified'}
- Unique Approach: ${context.persona.unique_approach || 'Not specified'}
- Skills: ${JSON.stringify(context.persona.skills || [])}
- Values: ${JSON.stringify(context.persona.values || [])}
    `.trim())
  }

  if (context.voice) {
    parts.push(`
VOICE & STORY CONTEXT:
${context.voice.origin_story ? `- Origin Story: ${context.voice.origin_story}` : ''}
${context.voice.contrarian_takes ? `- Unique Perspective/Contrarian Takes: ${context.voice.contrarian_takes}` : ''}
${context.voice.audience_description ? `- How they describe their audience: ${context.voice.audience_description}` : ''}
${context.voice.signature_phrases?.length > 0 ? `- Signature Phrases: ${context.voice.signature_phrases.join(', ')}` : ''}
${context.voice.voice_influences?.length > 0 ? `- Voice Influences: ${context.voice.voice_influences.map(i => i.name).join(', ')}` : ''}
${context.voice.voice_summary ? `- Voice Summary: ${context.voice.voice_summary}` : ''}
    `.trim())
  }

  if (context.validation) {
    parts.push(`
AUDIENCE INSIGHTS (from Validation Surveys):
- Pain Points: ${JSON.stringify(context.validation.pain_points || [])}
- Desired Outcomes: ${JSON.stringify(context.validation.desired_outcomes || [])}
- Common Objections: ${JSON.stringify(context.validation.objections || [])}
- Direct Quotes from Audience: ${JSON.stringify(context.validation.direct_quotes || [])}
- Language They Use: ${JSON.stringify(context.validation.language_used || [])}
    `.trim())
  }

  if (context.offer) {
    let offerSection = `
OFFER DETAILS:
- Dream Outcome: ${context.offer.dream_outcome || 'Not specified'}
- Price: ${context.offer.core_offer_price ? `$${context.offer.core_offer_price}` : 'Not specified'}
- Key Benefits: ${JSON.stringify(context.offer.key_benefits || [])}
- Proof Points: ${JSON.stringify(context.offer.proof_points || [])}`

    // Add V1-specific niche context if available
    if (context.offer.niche_definition) {
      offerSection += `
- Niche Definition: ${context.offer.niche_definition}`
    }
    if (context.offer.problem_area) {
      offerSection += `
- Problem Area Focus: ${context.offer.problem_area} (Pain Level: ${context.offer.pain_level || 'N/A'}/10)`
    }
    if (context.offer.mvp_description) {
      offerSection += `
- MVP Description: ${context.offer.mvp_description}`
    }
    if (context.offer.core_solutions?.length > 0) {
      offerSection += `
- Core Solutions: ${JSON.stringify(context.offer.core_solutions)}`
    }
    if (context.offer.lead_magnet_ideas?.length > 0) {
      offerSection += `
- Lead Magnet Ideas: ${JSON.stringify(context.offer.lead_magnet_ideas)}`
    }
    // Add V2 bonuses if available
    if (context.offer.bonuses?.length > 0) {
      offerSection += `
- Offer Bonuses: ${JSON.stringify(context.offer.bonuses)}`
    }
    if (context.offer.grand_slam_score) {
      offerSection += `
- Grand Slam Score: ${context.offer.grand_slam_score}/40`
    }

    parts.push(offerSection.trim())
  }

  if (context.marketing) {
    parts.push(`
PAST PERFORMANCE:
- Best Performing Content Types: ${JSON.stringify(context.marketing.best_content_types || [])}
- Best Platforms: ${JSON.stringify(context.marketing.best_platforms || [])}
    `.trim())
  }

  if (context.deals) {
    parts.push(`
RECENT SUCCESS:
- Recent Wins: ${context.deals.recent_wins?.map(w => `${w.name} ($${w.value})`).join(', ') || 'None yet'}
- Total Revenue from Wins: $${context.deals.total_won_value || 0}
- Common Objections Encountered: ${JSON.stringify(context.deals.common_objections || [])}
    `.trim())
  }

  return parts.join('\n\n')
}
