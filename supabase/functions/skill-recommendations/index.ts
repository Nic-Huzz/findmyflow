// Skill Recommendations Edge Function
// Uses Claude Haiku to recommend delivery formats based on:
// - User's wealth ladder position
// - Employment status
// - Customer budget (from persona profiles)

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

interface Recommendation {
  skillId: string
  skillLabel: string
  relevanceScore: number  // 1-10, how relevant this skill is to solving the problem
  relevanceReason: string // Why this skill is relevant to the problem
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
  score: number  // 0-100
  factors: string[]
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { skillClusters, userId, problemText } = await req.json()

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

    // Build context for AI
    const wealthLadder = userProgress?.wealth_ladder_rung || 'pre_ladder'
    const employmentStatus = userProgress?.employment_status || 'employed_exploring'
    const customerIncome = personaProfile?.income_level || '$50k–$100k'

    // Determine employment type
    const isEmployed = employmentStatus.startsWith('employed')
    const isSelfEmployed = employmentStatus.startsWith('self_employed')

    // Initialize Anthropic
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey })

    // Prepare skills summary for the prompt
    const skillsSummary = skillClusters.map((skill: SkillCluster) => ({
      id: skill.id,
      label: skill.cluster_label,
      examples: skill.items?.slice(0, 3).map((i: any) => typeof i === 'string' ? i : i.text) || []
    }))

    // Calculate confidence based on available data
    const confidenceFactors: string[] = []
    let confidenceScore = 0

    // Wealth ladder data (+40 points)
    if (wealthLadder && wealthLadder !== 'pre_ladder') {
      confidenceScore += 40
      confidenceFactors.push('Wealth ladder position known')
    } else if (wealthLadder === 'pre_ladder') {
      confidenceScore += 20
      confidenceFactors.push('Starting position identified')
    }

    // Problem context (+35 points) - most important for relevance
    if (problemText && problemText.length > 10) {
      confidenceScore += 35
      confidenceFactors.push('Specific problem provided')
    }

    // Skills data quality (+25 points)
    if (skillClusters.length >= 3) {
      confidenceScore += 25
      confidenceFactors.push('Rich skills profile')
    } else if (skillClusters.length >= 1) {
      confidenceScore += 12
      confidenceFactors.push('Basic skills identified')
    }

    const confidenceLevel: ConfidenceLevel =
      confidenceScore >= 75 ? 'high' :
      confidenceScore >= 45 ? 'medium' : 'low'

    const confidence: ConfidenceInfo = {
      level: confidenceLevel,
      score: Math.min(confidenceScore, 100),
      factors: confidenceFactors
    }

    // Call Claude Haiku for recommendations
    const problemContext = problemText
      ? `
PROBLEM TO SOLVE:
The user is creating a solution to address: "${problemText}"

CRITICAL: Score each skill's RELEVANCE to solving this problem (1-10):
- 10 = This skill directly solves the problem
- 7-9 = This skill is highly relevant to the solution
- 4-6 = This skill could contribute to the solution
- 1-3 = This skill is not very relevant to this problem

Only recommend skills with relevance >= 5. Explain WHY each skill helps solve this specific problem.
`
      : `
No specific problem provided. Score all skills as relevance 7 (general applicability).
`

    const prompt = `You are a business coach helping someone monetize their skills. Based on their context, recommend the best delivery format for each skill.

USER CONTEXT:
- Current wealth ladder position: ${wealthLadder}
  - pre_ladder = hasn't monetized yet
  - service = offering 1:1 services
  - productized = has packaged/group offerings
  - products = selling digital/physical products at scale
- Employment status: ${employmentStatus}
  - employed_* = still has a job, needs flexible options
  - self_employed_* = full-time in their business
- Target customer income: ${customerIncome}
  - Low budget customers ($0-$50k) → prefer lower-priced products
  - High budget customers ($100k+) → can afford premium services
${problemContext}
WEALTH LADDER PROGRESSION RULE:
Help the user climb to the next rung:
- If pre_ladder or service → recommend PRODUCTIZED formats first (to scale)
- If productized → recommend PRODUCT formats first (for passive income)
- If products AND employed → recommend SERVICE to build capital while employed
- If products AND self_employed → they've made it, recommend based on skill fit

CUSTOMER BUDGET ADJUSTMENT:
- Low budget customers → lean toward products (lower price point, more accessible)
- High budget customers → services are viable (premium pricing)

SKILLS TO ANALYZE:
${JSON.stringify(skillsSummary, null, 2)}

DELIVERY FORMAT OPTIONS:
Services (high-touch, premium):
- custom_service: 1:1 tailored consulting/coaching
- packaged_service: Standardized service package (e.g., "4-week program")

Productized (scalable, medium-touch):
- live_group: Live workshops, cohorts, group coaching
- automated_group: Self-paced courses with community

Products (passive, low-touch):
- digital_product: Templates, guides, software tools
- physical_product: Physical goods, merchandise

For each skill, provide:
1. Relevance score (1-10) for how well this skill solves the problem
2. Primary format recommendation (the BEST fit given their ladder position)
3. Secondary format option (alternative they could consider)

Respond in JSON format:
{
  "recommendations": [
    {
      "skillId": "skill-id-here",
      "skillLabel": "Skill Name",
      "relevanceScore": 8,
      "primaryFormat": { "category": "service|productized|product", "type": "format_type", "label": "Human Label" },
      "secondaryFormat": { "category": "...", "type": "...", "label": "..." }
    }
  ]
}

Return ONLY valid JSON, no other text. Sort by relevanceScore descending.`

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })

    // Parse AI response
    const aiText = response.content[0].type === 'text' ? response.content[0].text : ''

    let recommendations: Recommendation[] = []
    try {
      const parsed = JSON.parse(aiText)
      recommendations = parsed.recommendations || []
    } catch (parseError) {
      // If JSON parsing fails, return fallback recommendations
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
          problemText: problemText || null
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

// Fallback recommendations using simple logic (no AI)
function generateFallbackRecommendations(
  skillClusters: SkillCluster[],
  wealthLadder: string,
  isEmployed: boolean,
  customerIncome: string
): Recommendation[] {
  // Determine primary recommendation based on ladder position
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

  // Adjust for low-budget customers
  const lowBudget = customerIncome === '$0–$25k' || customerIncome === '$25k–$50k'
  if (lowBudget && primaryCategory === 'service') {
    primaryCategory = 'product'
    primaryType = 'digital_product'
    primaryLabel = 'Digital Product'
  }

  return skillClusters.map((skill: SkillCluster) => ({
    skillId: skill.id,
    skillLabel: skill.cluster_label,
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
