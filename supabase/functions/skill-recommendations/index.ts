// Skill Recommendations Edge Function
// Uses Claude Haiku to recommend delivery formats based on:
// - User's wealth ladder position
// - Employment status
// - Customer budget & persona
// - Niche definition (4 layers)
// - Validation survey data (real customer responses)
// - Previous offer builder answers

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SkillCluster {
  id: string
  cluster_label: string
  items: Array<{ text: string; rating: number }>
  proficiency?: string
}

interface NicheLayers {
  layer1?: string
  layer2?: string
  layer3?: string
  layer4?: string
}

interface PreviousAnswers {
  painLevel?: string
  problemArea?: string
  spendingCapacity?: string
  sunkCost?: string
  emotion?: string
  persona?: string
  problem?: string
}

interface Recommendation {
  skillId: string
  skillLabel: string
  relevanceScore: number
  relevanceReason: string
  primaryFormat: {
    category: 'service' | 'productized' | 'product'
    type: string
    label: string
  }
  secondaryFormat?: {
    category: 'service' | 'productized' | 'product'
    type: string
    label: string
  }
  reasoning: string
}

type ConfidenceLevel = 'high' | 'medium' | 'low'

interface ConfidenceInfo {
  level: ConfidenceLevel
  score: number
  factors: string[]
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      skillClusters,
      userId,
      problemText,
      nicheLayers,
      previousAnswers
    } = await req.json()

    if (!skillClusters || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: skillClusters, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch user context
    const { data: userProgress } = await supabase
      .from('user_stage_progress')
      .select('wealth_ladder_rung, employment_status')
      .eq('user_id', userId)
      .single()

    // Fetch customer persona (most recent)
    const { data: personaProfile } = await supabase
      .from('persona_profiles')
      .select('income_level, problem_area')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Fetch validation survey data
    const { data: validationFlows } = await supabase
      .from('validation_flows')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let validationData: any = null
    let validationResponseCount = 0

    if (validationFlows?.id) {
      const { data: responses, count } = await supabase
        .from('validation_responses')
        .select('answers', { count: 'exact' })
        .eq('flow_id', validationFlows.id)

      validationResponseCount = count || 0

      if (responses && responses.length > 0) {
        // Extract key insights from validation responses
        const obstacles: string[] = []
        const dreamOutcomes: string[] = []
        const solutionPrefs: string[] = []
        const budgets: string[] = []

        responses.forEach((r: any) => {
          const ans = r.answers || {}
          if (ans.obstacle) obstacles.push(ans.obstacle)
          if (ans.dream_outcome) dreamOutcomes.push(ans.dream_outcome)
          if (ans.solution_preference) solutionPrefs.push(ans.solution_preference)
          if (ans.budget) budgets.push(ans.budget)
          // Also check for nested answers
          if (ans.q_obstacle?.value) obstacles.push(ans.q_obstacle.value)
          if (ans.q_dream?.value) dreamOutcomes.push(ans.q_dream.value)
          if (ans.q_solution_type?.value) solutionPrefs.push(ans.q_solution_type.value)
          if (ans.q_budget?.value) budgets.push(ans.q_budget.value)
        })

        validationData = {
          responseCount: validationResponseCount,
          obstacles: [...new Set(obstacles)].slice(0, 5),
          dreamOutcomes: [...new Set(dreamOutcomes)].slice(0, 3),
          solutionPreferences: [...new Set(solutionPrefs)].slice(0, 3),
          budgets: [...new Set(budgets)].slice(0, 3)
        }
      }
    }

    // Build context
    const wealthLadder = userProgress?.wealth_ladder_rung || 'pre_ladder'
    const employmentStatus = userProgress?.employment_status || 'employed_exploring'
    const customerIncome = previousAnswers?.spendingCapacity || personaProfile?.income_level || '$50k–$100k'
    const isEmployed = employmentStatus.startsWith('employed')

    // Initialize Anthropic
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey })

    // Prepare skills summary
    const skillsSummary = skillClusters.map((skill: SkillCluster) => ({
      id: skill.id,
      label: skill.cluster_label,
      proficiency: skill.proficiency || 'developing',
      examples: skill.items?.slice(0, 4).map((i: any) => typeof i === 'string' ? i : i.text) || []
    }))

    // ===== CONFIDENCE SCORING =====
    const confidenceFactors: string[] = []
    let confidenceScore = 0

    // Validation data (+30 points base, +10 bonus for 5+ responses)
    if (validationData) {
      confidenceScore += 30
      confidenceFactors.push(`Validation data (${validationResponseCount} responses)`)
      if (validationResponseCount >= 5) {
        confidenceScore += 10
        confidenceFactors.push('Strong sample size')
      }
    }

    // Niche defined to layer 4 (+20 points)
    if (nicheLayers?.layer4 && nicheLayers.layer4.length > 5) {
      confidenceScore += 20
      confidenceFactors.push('Specific niche defined')
    } else if (nicheLayers?.layer2) {
      confidenceScore += 10
      confidenceFactors.push('Basic niche defined')
    }

    // Problem text specific (+15 points)
    if (problemText && problemText.length > 15) {
      confidenceScore += 15
      confidenceFactors.push('Specific problem provided')
    }

    // Skills data quality (+15 points)
    if (skillClusters.length >= 3) {
      confidenceScore += 15
      confidenceFactors.push('Rich skills profile')
    } else if (skillClusters.length >= 1) {
      confidenceScore += 8
      confidenceFactors.push('Basic skills identified')
    }

    // Wealth ladder known (+10 points)
    if (wealthLadder && wealthLadder !== 'pre_ladder') {
      confidenceScore += 10
      confidenceFactors.push('Wealth ladder position known')
    }

    // Customer context (+10 points)
    if (previousAnswers?.painLevel || previousAnswers?.emotion) {
      confidenceScore += 10
      confidenceFactors.push('Customer pain/emotion known')
    }

    const confidenceLevel: ConfidenceLevel =
      confidenceScore >= 70 ? 'high' :
      confidenceScore >= 40 ? 'medium' : 'low'

    const confidence: ConfidenceInfo = {
      level: confidenceLevel,
      score: Math.min(confidenceScore, 100),
      factors: confidenceFactors
    }

    // ===== BUILD RICH PROMPT =====

    // Niche context
    const nicheContext = nicheLayers?.layer4
      ? `
NICHE DEFINITION (most specific → broad):
- Specific: ${nicheLayers.layer4}
- Narrower: ${nicheLayers.layer3 || 'N/A'}
- Broader: ${nicheLayers.layer2 || 'N/A'}
- Broadest: ${nicheLayers.layer1 || 'N/A'}
`
      : ''

    // Customer context from previous answers
    const customerContext = previousAnswers ? `
CUSTOMER PROFILE:
- Pain Level: ${previousAnswers.painLevel || 'Unknown'}/10
- Problem Area: ${previousAnswers.problemArea || 'Unknown'}
- Spending Capacity: ${previousAnswers.spendingCapacity || customerIncome}
- Sunk Cost (already spent on solutions): ${previousAnswers.sunkCost || 'Unknown'}
- Primary Emotion: ${previousAnswers.emotion || 'Unknown'}
- Persona: ${previousAnswers.persona || 'Unknown'}
- Core Problem: ${previousAnswers.problem || 'Unknown'}
` : ''

    // Validation data context
    const validationContext = validationData ? `
REAL CUSTOMER VALIDATION DATA (${validationData.responseCount} survey responses):
${validationData.dreamOutcomes.length > 0 ? `- What they want: ${validationData.dreamOutcomes.join('; ')}` : ''}
${validationData.obstacles.length > 0 ? `- What's stopping them: ${validationData.obstacles.join('; ')}` : ''}
${validationData.solutionPreferences.length > 0 ? `- How they want help: ${validationData.solutionPreferences.join('; ')}` : ''}
${validationData.budgets.length > 0 ? `- Budget range: ${validationData.budgets.join('; ')}` : ''}

IMPORTANT: These are REAL responses from potential customers. Weight your recommendations toward what they actually said they want.
` : ''

    // Problem context
    const problemContext = problemText
      ? `
SPECIFIC PROBLEM TO SOLVE:
"${problemText}"

Score each skill's RELEVANCE to solving this specific problem (1-10):
- 10 = This skill directly solves the problem
- 7-9 = Highly relevant to the solution
- 4-6 = Could contribute
- 1-3 = Not very relevant

Explain WHY each skill helps solve this problem for THIS customer.
`
      : 'No specific problem provided. Score all skills as relevance 7.'

    const prompt = `You are a business strategist helping someone monetize their skills. Based on ALL the context below, recommend the best delivery format for each skill.

${nicheContext}
${customerContext}
${validationContext}
USER'S BUSINESS STAGE:
- Wealth Ladder: ${wealthLadder} (pre_ladder → service → productized → products)
- Employment: ${employmentStatus}
- Target Customer Income: ${customerIncome}

WEALTH LADDER PROGRESSION:
- pre_ladder/service → recommend PRODUCTIZED (to scale)
- productized → recommend PRODUCT (passive income)
- products + employed → SERVICE (build capital)
- products + self_employed → best skill fit

${problemContext}

SKILLS TO ANALYZE:
${JSON.stringify(skillsSummary, null, 2)}

DELIVERY FORMAT OPTIONS:
Services: custom_service (1:1 tailored), packaged_service (standardized package)
Productized: live_group (cohorts/workshops), automated_group (self-paced courses)
Products: digital_product (templates/tools), physical_product (goods)

For each skill, provide:
1. relevanceScore (1-10) - how well it solves the problem
2. relevanceReason - WHY this skill fits (reference customer data if available)
3. primaryFormat - best fit given ALL context
4. secondaryFormat - alternative option
5. reasoning - explain your recommendation

Respond ONLY with valid JSON:
{
  "recommendations": [
    {
      "skillId": "id",
      "skillLabel": "Name",
      "relevanceScore": 8,
      "relevanceReason": "This skill helps because...",
      "primaryFormat": { "category": "productized", "type": "live_group", "label": "Live Cohort" },
      "secondaryFormat": { "category": "product", "type": "digital_product", "label": "Digital Product" },
      "reasoning": "Given your customer's budget and preference for..."
    }
  ]
}

Sort by relevanceScore descending. Only include skills with relevanceScore >= 5.`

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })

    const aiText = response.content[0].type === 'text' ? response.content[0].text : ''

    let recommendations: Recommendation[] = []
    try {
      const parsed = JSON.parse(aiText)
      recommendations = parsed.recommendations || []
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiText)
      recommendations = generateFallbackRecommendations(skillClusters, wealthLadder, isEmployed, customerIncome)
    }

    return new Response(
      JSON.stringify({
        recommendations,
        confidence,
        context: {
          wealthLadder,
          employmentStatus,
          isEmployed,
          problemText: problemText || null,
          hasValidationData: !!validationData,
          validationResponseCount,
          nicheLevel: nicheLayers?.layer4 ? 4 : nicheLayers?.layer3 ? 3 : nicheLayers?.layer2 ? 2 : 1
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in skill-recommendations:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Fallback recommendations (no AI)
function generateFallbackRecommendations(
  skillClusters: SkillCluster[],
  wealthLadder: string,
  isEmployed: boolean,
  customerIncome: string
): Recommendation[] {
  let primaryCategory: 'service' | 'productized' | 'product' = 'productized'
  let primaryType = 'live_group'
  let primaryLabel = 'Live Group Program'

  if (wealthLadder === 'pre_ladder' || wealthLadder === 'service') {
    primaryCategory = 'productized'
    primaryType = 'live_group'
    primaryLabel = 'Live Group Program'
  } else if (wealthLadder === 'productized') {
    primaryCategory = 'product'
    primaryType = 'digital_product'
    primaryLabel = 'Digital Product'
  } else if (wealthLadder === 'products' && isEmployed) {
    primaryCategory = 'service'
    primaryType = 'packaged_service'
    primaryLabel = 'Packaged Service'
  }

  const lowBudget = customerIncome === '$0–$25k' || customerIncome === '$25k–$50k'
  if (lowBudget && primaryCategory === 'service') {
    primaryCategory = 'product'
    primaryType = 'digital_product'
    primaryLabel = 'Digital Product'
  }

  return skillClusters.map((skill: SkillCluster) => ({
    skillId: skill.id,
    skillLabel: skill.cluster_label,
    relevanceScore: 7,
    relevanceReason: 'Based on general skill-market fit',
    primaryFormat: {
      category: primaryCategory,
      type: primaryType,
      label: primaryLabel
    },
    secondaryFormat: {
      category: 'service' as const,
      type: 'packaged_service',
      label: 'Packaged Service'
    },
    reasoning: `Based on your ${wealthLadder} position, ${primaryLabel.toLowerCase()} helps you progress up the wealth ladder.`
  }))
}
