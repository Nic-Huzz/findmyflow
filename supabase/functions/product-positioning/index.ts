/**
 * product-positioning Edge Function
 *
 * AI-powered product positioning and offer enhancement using Claude Haiku.
 * Analyzes user's product, value equation scores, and niche to generate:
 * - Positioning statements
 * - Custom bonus ideas
 * - MVP suggestion (7-day buildable)
 * - Objection handlers
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const SYSTEM_PROMPT = `[ROLE]
You are a product positioning strategist helping entrepreneurs create compelling offers using Alex Hormozi's Value Equation framework.

[TONE & STYLE]
- Be specific, actionable, and confident
- Use second person ("You could..." not "They could...")
- Focus on what would genuinely differentiate their offer
- Provide ideas that are achievable and practical

[YOUR APPROACH]
1. Analyze their product type and value equation scores
2. Consider their niche and target audience
3. Generate positioning that emphasizes their strengths
4. Suggest improvements for weaker dimensions
5. Keep MVP suggestions achievable in 7 days or less

[RESPONSE FORMAT]
Use the 'product_positioning' tool with:
- positioningStatements: 2-3 compelling positioning statements
- bonusIdeas: 3-4 specific bonus ideas to increase perceived value
- mvpSuggestion: A simple version they could build/test in 7 days
- objectionHandlers: 2-3 common objections with response scripts

[CRITICAL REQUIREMENTS]
- Make positioning SPECIFIC to their niche - not generic
- Bonuses should directly address their value equation weaknesses
- MVP should be achievable, not overwhelming
- Objection handlers should feel natural, not salesy`

// Tool definition for structured response
const tools = [{
  name: 'product_positioning',
  description: 'Provide product positioning and offer enhancement recommendations',
  input_schema: {
    type: 'object',
    properties: {
      positioningStatements: {
        type: 'array',
        items: { type: 'string' },
        description: '2-3 compelling positioning statements in format: "I help [audience] achieve [outcome] through [method]" or "For [audience] who [situation], [product] is the [category] that [benefit]"'
      },
      bonusIdeas: {
        type: 'array',
        items: { type: 'string' },
        description: '3-4 specific bonus ideas that would increase perceived value of this offer'
      },
      mvpSuggestion: {
        type: 'string',
        description: 'A simple version of this product they could build and test in 7 days or less'
      },
      objectionHandlers: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            objection: { type: 'string', description: 'Common objection prospects might have' },
            response: { type: 'string', description: 'Natural response to handle this objection' }
          },
          required: ['objection', 'response']
        },
        description: '2-3 common objections with natural response scripts'
      }
    },
    required: ['positioningStatements', 'bonusIdeas', 'mvpSuggestion', 'objectionHandlers']
  }
}]

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      solutionType,
      solutionDescription,
      problemText,
      valueAnswers,
      valueScore,
      niche
    } = await req.json()

    if (!solutionType || !solutionDescription) {
      return new Response(
        JSON.stringify({ error: 'solutionType and solutionDescription are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Map solution types
    const solutionTypeDescriptions: Record<string, string> = {
      one_to_one: '1:1 Service (coaching, consulting, freelance)',
      group_program: 'Group Program (courses, memberships, communities)',
      digital_product: 'Digital Product (ebooks, templates, courses)',
      tech_digital: 'Tech/Digital Product (SaaS, apps, tools)',
      physical_product: 'Physical Product'
    }

    // Map value answers to descriptions
    const dreamOutcomeLabels: Record<string, string> = {
      life_changing: 'Life-Changing transformation',
      significant: 'Significant improvement',
      moderate: 'Moderate improvement',
      incremental: 'Incremental improvement'
    }

    const timeDelayLabels: Record<string, string> = {
      immediate: 'Immediate results (same day)',
      days: 'Fast results (within days)',
      weeks: 'Results in weeks',
      months: 'Results take months'
    }

    const proofLabels: Record<string, string> = {
      case_studies: 'Strong case studies with numbers',
      demonstration: 'Live demonstrations',
      testimonials: 'Customer testimonials',
      guarantee: 'Guarantee-based proof'
    }

    // Build context
    const context = `PRODUCT TYPE: ${solutionTypeDescriptions[solutionType] || solutionType}
PRODUCT DESCRIPTION: ${solutionDescription}
${problemText ? `PROBLEM IT SOLVES: ${problemText}` : ''}
${niche ? `NICHE: ${niche}` : ''}

VALUE EQUATION ANALYSIS:
- Dream Outcome: ${dreamOutcomeLabels[valueAnswers?.dream_outcome] || 'Not specified'}
- Time to Results: ${timeDelayLabels[valueAnswers?.time_delay] || 'Not specified'}
- Proof Method: ${proofLabels[valueAnswers?.perceived_likelihood] || 'Not specified'}
- Overall Value Score: ${valueScore || 'Not calculated'}/100

Generate positioning statements, bonus ideas, an MVP suggestion, and objection handlers for this product. Make everything specific to their niche and product type.`

    console.log('📊 Product Positioning Context:', context.substring(0, 500))

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        tools: tools,
        tool_choice: { type: 'tool', name: 'product_positioning' },
        messages: [{
          role: 'user',
          content: context
        }]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('❌ Claude API error:', errorText)
      return new Response(
        JSON.stringify({
          error: `Claude API error: ${claudeResponse.status}`,
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const claudeData = await claudeResponse.json()
    console.log('✅ Claude response received')

    // Extract tool use response
    const toolUse = claudeData.content?.find((c: any) => c.type === 'tool_use')

    if (!toolUse?.input) {
      console.error('❌ No tool use response from Claude')
      return new Response(
        JSON.stringify({
          error: 'Invalid response from AI',
          details: 'No structured response received'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = toolUse.input

    console.log('✅ Generated positioning for:', solutionDescription.substring(0, 50))

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('❌ Error in product-positioning:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
