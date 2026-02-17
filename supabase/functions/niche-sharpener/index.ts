/**
 * niche-sharpener Edge Function
 *
 * AI-powered niche statement generation using Claude Haiku.
 * Uses the user's specific cluster selections (problem, persona, skill)
 * from the Offer Builder niche question to generate a focused niche statement.
 *
 * Uses tool calling for structured JSON responses.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const SYSTEM_PROMPT = `[ROLE]
You are a niche positioning expert helping entrepreneurs and creators sharpen their market focus.
You will be given their specific chosen skill, problem they solve, and target persona to craft a focused niche statement.

[TONE & STYLE]
- Be warm, encouraging, and direct
- Use second person ("You are..." not "They are...")
- Speak with confidence about positioning insights
- Focus on what makes them unique and valuable
- Avoid jargon unless explaining it

[YOUR APPROACH]
1. Analyze the specific intersection of their chosen skill + problem + persona
2. Craft a sharp, memorable niche statement from these three elements
3. The statement should be specific enough to be differentiated but broad enough to be scalable

[CRITICAL REQUIREMENTS]
- Base the niche statement ONLY on the three selections provided
- Be specific - the statement should clearly reflect their chosen problem, persona, and skill
- The niche statement should pass the "too narrow?" test - it should feel scary-narrow but actually be scalable
- Format: "I help [specific audience from persona] [solve specific problem] through [unique skill/approach]"
- Keep it to 15-25 words
- If additional context (project, offers) is provided, use it to refine the tone but keep the core focused on the three selections`

// Tool definition for structured response
const tools = [{
  name: 'generate_niche_statement',
  description: 'Generate a focused niche statement from the selected problem, persona, and skill',
  input_schema: {
    type: 'object',
    properties: {
      niche_statement: {
        type: 'string',
        description: 'A sharp, specific niche statement (15-25 words). Format: "I help [specific audience] [achieve specific outcome] through [unique approach]"'
      }
    },
    required: ['niche_statement']
  }
}]

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { userId, selectedProblem, selectedPersona, selectedSkill } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!selectedProblem || !selectedPersona || !selectedSkill) {
      return new Response(
        JSON.stringify({ error: 'selectedProblem, selectedPersona, and selectedSkill are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Fetch lightweight additional context (project + offers) for tone refinement
    const [projectsRes, offersRes] = await Promise.all([
      supabase
        .from('user_projects')
        .select('name, description')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .limit(1),
      supabase
        .from('attraction_offer_assessments')
        .select('offer_name, dream_outcome, target_audience')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
    ])

    const project = projectsRes.data?.[0]
    const offer = offersRes.data?.[0]

    // Build focused context from the three selections
    const contextParts: string[] = [
      `SELECTED PROBLEM: ${selectedProblem}`,
      `SELECTED PERSONA: ${selectedPersona}`,
      `SELECTED SKILL: ${selectedSkill}`
    ]

    if (project) {
      contextParts.push(`PROJECT CONTEXT: ${project.name}${project.description ? ` - ${project.description}` : ''}`)
    }

    if (offer) {
      contextParts.push(`OFFER CONTEXT: ${offer.offer_name || ''} - ${offer.dream_outcome || offer.target_audience || ''}`)
    }

    const userContext = contextParts.join('\n')

    console.log('📊 Niche Sharpener Context:', userContext)

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        tools: tools,
        tool_choice: { type: 'tool', name: 'generate_niche_statement' },
        messages: [{
          role: 'user',
          content: `Generate a niche statement from these three specific selections:

${userContext}

Craft a sharp niche statement that combines this specific problem, persona, and skill into a compelling "I help [audience] [outcome] through [approach]" format.`
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

    if (!toolUse?.input?.niche_statement) {
      console.error('❌ No tool use response from Claude')
      return new Response(
        JSON.stringify({
          error: 'Invalid response from AI',
          details: 'No structured response received'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const nicheStatement = toolUse.input.niche_statement

    console.log('✅ Niche statement generated:', nicheStatement)

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          niche_statement: nicheStatement
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('❌ Error in niche-sharpener:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
