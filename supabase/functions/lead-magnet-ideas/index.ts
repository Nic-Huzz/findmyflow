/**
 * lead-magnet-ideas Edge Function
 *
 * AI-powered lead magnet idea generation using Claude Haiku.
 * Analyzes user's niche, solution type, and selected lead magnet category
 * to generate personalized lead magnet ideas.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const SYSTEM_PROMPT = `[ROLE]
You are a lead magnet strategist helping entrepreneurs create compelling lead magnets that attract their ideal customers.

[TONE & STYLE]
- Be creative, specific, and actionable
- Use second person ("You could..." not "They could...")
- Focus on what would genuinely help their target audience
- Provide ideas that are achievable, not overwhelming

[YOUR APPROACH]
1. Consider the solution type (1:1 service, group program, digital product, etc.)
2. Match ideas to the lead magnet category (reveal problem, free trial, or free step 1)
3. Personalize based on their niche, problem, and audience
4. Provide 3-4 distinct, creative ideas

[RESPONSE FORMAT]
Use the 'lead_magnet_ideas' tool with:
- ideas: Array of 3-4 lead magnet ideas, each with:
  - title: Catchy name for the lead magnet
  - format: Type of content (quiz, checklist, video, etc.)
  - description: What it contains and why it works
  - hook: A compelling headline or hook for the landing page

[CRITICAL REQUIREMENTS]
- Make ideas SPECIFIC to their niche and problem - not generic
- Ideas should be achievable within 1-2 weeks
- Each idea should be distinctly different in approach
- Focus on value delivery, not just lead capture`

// Tool definition for structured response
const tools = [{
  name: 'lead_magnet_ideas',
  description: 'Provide personalized lead magnet ideas based on user context',
  input_schema: {
    type: 'object',
    properties: {
      ideas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Catchy name for the lead magnet (e.g., "The 5-Minute Burnout Assessment")'
            },
            format: {
              type: 'string',
              description: 'Type of content (e.g., "Interactive Quiz", "PDF Checklist", "Video Series")'
            },
            description: {
              type: 'string',
              description: 'What it contains, how it helps, and why it works (2-3 sentences)'
            },
            hook: {
              type: 'string',
              description: 'Compelling headline for a landing page (e.g., "Discover the #1 thing holding you back")'
            }
          },
          required: ['title', 'format', 'description', 'hook']
        },
        description: '3-4 personalized lead magnet ideas'
      }
    },
    required: ['ideas']
  }
}]

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const {
      solutionType,        // e.g., "one_to_one", "digital_product"
      solutionDescription, // User's description of this solution
      leadMagnetType,      // "reveal_problem", "free_trial", "free_step_1"
      problemText,         // The problem this solution solves
      niche                // Optional: user's niche from offer builder
    } = await req.json()

    if (!solutionType || !leadMagnetType) {
      return new Response(
        JSON.stringify({ error: 'solutionType and leadMagnetType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Map lead magnet types to descriptions
    const leadMagnetDescriptions: Record<string, string> = {
      reveal_problem: 'Reveal the Problem - Help prospects discover they have a problem they didn\'t know about (quiz, assessment, calculator, audit)',
      free_trial: 'Free Trial - Let prospects experience your solution before buying (free session, sample, demo, trial period)',
      free_step_1: 'Free Step 1 - Give prospects the first step of your process for free (template, guide, mini-course, checklist)'
    }

    // Map solution types to descriptions
    const solutionTypeDescriptions: Record<string, string> = {
      one_to_one: '1:1 Service (coaching, consulting, freelance)',
      group_program: 'Group Program (courses, memberships, communities)',
      digital_product: 'Digital Product (ebooks, templates, courses)',
      tech_digital: 'Tech/Digital Product (SaaS, apps, tools)',
      physical_product: 'Physical Product'
    }

    // Build context for Claude
    const context = `SOLUTION TYPE: ${solutionTypeDescriptions[solutionType] || solutionType}
SOLUTION: ${solutionDescription || 'Not specified'}
PROBLEM IT SOLVES: ${problemText || 'Not specified'}
${niche ? `NICHE: ${niche}` : ''}

LEAD MAGNET CATEGORY: ${leadMagnetDescriptions[leadMagnetType] || leadMagnetType}

Generate 3-4 creative, personalized lead magnet ideas that would attract ideal customers for this solution. Make them specific to this niche and problem - avoid generic ideas.`

    console.log('📊 Lead Magnet Ideas Context:', context)

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
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        tools: tools,
        tool_choice: { type: 'tool', name: 'lead_magnet_ideas' },
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

    console.log('✅ Generated', result.ideas?.length || 0, 'lead magnet ideas')

    return new Response(
      JSON.stringify({
        success: true,
        ideas: result.ideas
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('❌ Error in lead-magnet-ideas:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
