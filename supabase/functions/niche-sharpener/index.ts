/**
 * niche-sharpener Edge Function
 *
 * AI-powered niche sharpening using Claude Haiku.
 * Analyzes user's skills, problems, personas, and offers to
 * suggest a sharper, more differentiated niche positioning.
 *
 * Uses tool calling for structured JSON responses.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const SYSTEM_PROMPT = `[ROLE]
You are a niche positioning expert helping entrepreneurs and creators sharpen their market focus.
Your role is to analyze their skills, problems they solve, target personas, and current offerings to suggest a more focused, differentiated niche.

[TONE & STYLE]
- Be warm, encouraging, and direct
- Use second person ("You are..." not "They are...")
- Speak with confidence about positioning insights
- Focus on what makes them unique and valuable
- Avoid jargon unless explaining it

[YOUR APPROACH]
1. Analyze the intersection of their skills + problems + personas
2. Identify their unique "unfair advantage" or positioning angle
3. Suggest a sharper niche statement that's specific but scalable
4. Provide a compelling positioning statement for marketing
5. Identify 2-3 niche refinement options with tradeoffs

[RESPONSE FORMAT]
Use the 'niche_sharpening_analysis' tool with:
- current_positioning: Brief analysis of their current positioning (what they have now)
- niche_statement: A sharp, specific niche statement (15-25 words)
- positioning_statement: A marketing-ready positioning statement (for, unlike, we, so that format)
- unique_advantage: What makes them uniquely qualified
- refinement_options: 2-3 ways to further sharpen or pivot the niche
- action_items: 3 specific next steps they can take

[CRITICAL REQUIREMENTS]
- Base analysis ONLY on the provided data (don't make things up)
- Be specific - avoid generic advice that could apply to anyone
- The niche statement should pass the "too narrow?" test - it should feel scary-narrow but actually be scalable
- Focus on solving real problems for specific people`

// Tool definition for structured response
const tools = [{
  name: 'niche_sharpening_analysis',
  description: 'Provide structured niche sharpening analysis and recommendations',
  input_schema: {
    type: 'object',
    properties: {
      current_positioning: {
        type: 'string',
        description: 'Brief analysis of their current positioning based on the data provided'
      },
      niche_statement: {
        type: 'string',
        description: 'A sharp, specific niche statement (15-25 words). Format: "I help [specific audience] [achieve specific outcome] through [unique approach]"'
      },
      positioning_statement: {
        type: 'string',
        description: 'Marketing-ready positioning statement. Format: "For [target], unlike [alternatives], we [differentiator], so that [benefit]"'
      },
      unique_advantage: {
        type: 'string',
        description: 'What makes them uniquely qualified to serve this niche (based on their experience and skills)'
      },
      refinement_options: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            option: { type: 'string', description: 'A specific niche refinement direction' },
            pros: { type: 'string', description: 'Advantages of this direction' },
            cons: { type: 'string', description: 'Potential challenges or tradeoffs' }
          },
          required: ['option', 'pros', 'cons']
        },
        description: '2-3 ways to further sharpen or pivot the niche'
      },
      action_items: {
        type: 'array',
        items: { type: 'string' },
        description: '3 specific, actionable next steps'
      }
    },
    required: ['current_positioning', 'niche_statement', 'positioning_statement', 'unique_advantage', 'refinement_options', 'action_items']
  }
}]

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Fetch user's data in parallel
    const [clustersRes, personaRes, offersRes, projectsRes] = await Promise.all([
      // Skills, problems, persona clusters
      supabase
        .from('nikigai_clusters')
        .select('cluster_type, cluster_label, insight, items')
        .eq('user_id', userId)
        .eq('cluster_stage', 'final')
        .order('created_at', { ascending: false }),

      // Customer persona profile
      supabase
        .from('persona_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1),

      // Attraction offers
      supabase
        .from('attraction_offer_assessments')
        .select('offer_name, dream_outcome, target_audience, responses')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3),

      // Projects (for context)
      supabase
        .from('user_projects')
        .select('name, description')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .limit(1)
    ])

    const clusters = clustersRes.data || []
    const persona = personaRes.data?.[0]
    const offers = offersRes.data || []
    const project = projectsRes.data?.[0]

    // Group clusters by type
    const skillsClusters = clusters.filter(c => c.cluster_type === 'skills')
    const problemsClusters = clusters.filter(c => c.cluster_type === 'problems')
    const personaClusters = clusters.filter(c => c.cluster_type === 'persona')

    // Check if we have enough data
    if (skillsClusters.length === 0 && problemsClusters.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'insufficient_data',
          message: 'Please complete the Flow Finder flows (Skills, Problems) first to get niche sharpening insights.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build context for Claude
    const contextParts: string[] = []

    if (project) {
      contextParts.push(`PROJECT: ${project.name}${project.description ? `\n${project.description}` : ''}`)
    }

    if (skillsClusters.length > 0) {
      contextParts.push(`SKILLS CLUSTERS:\n${skillsClusters.map(c =>
        `- ${c.cluster_label}: ${c.insight || ''}`
      ).join('\n')}`)
    }

    if (problemsClusters.length > 0) {
      contextParts.push(`PROBLEMS THEY SOLVE:\n${problemsClusters.map(c =>
        `- ${c.cluster_label}: ${c.insight || ''}`
      ).join('\n')}`)
    }

    if (personaClusters.length > 0) {
      contextParts.push(`TARGET PERSONAS:\n${personaClusters.map(c =>
        `- ${c.cluster_label}: ${c.insight || ''}`
      ).join('\n')}`)
    }

    if (persona) {
      contextParts.push(`CUSTOMER PERSONA DETAILS:
- Problem Area: ${persona.problem_area || 'Not specified'}
- Pain Level: ${persona.pain_level || 'Not specified'}/10
- Income Level: ${persona.income_level || 'Not specified'}
- Emotional State: ${persona.emotion || 'Not specified'}`)
    }

    if (offers.length > 0) {
      contextParts.push(`EXISTING OFFERS:\n${offers.map(o =>
        `- ${o.offer_name || 'Unnamed'}: ${o.dream_outcome || o.target_audience || ''}`
      ).join('\n')}`)
    }

    const userContext = contextParts.join('\n\n')

    console.log('📊 Niche Sharpener Context:', userContext.substring(0, 500) + '...')

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
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        tools: tools,
        tool_choice: { type: 'tool', name: 'niche_sharpening_analysis' },
        messages: [{
          role: 'user',
          content: `Please analyze this entrepreneur's positioning data and provide niche sharpening recommendations:

${userContext}

Based on this data, provide a comprehensive niche sharpening analysis using the niche_sharpening_analysis tool.`
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

    const analysis = toolUse.input

    console.log('✅ Niche sharpening analysis:', analysis.niche_statement)

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        dataSourcesSummary: {
          skillsClusters: skillsClusters.length,
          problemsClusters: problemsClusters.length,
          personaClusters: personaClusters.length,
          hasPersonaProfile: !!persona,
          offersCount: offers.length
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
