// Supabase Edge Function: Mind Space Map
// Maps extracted skills, problems, and personas to wheel taxonomy using Claude Haiku

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

interface MappingRequest {
  prompt: string
}

interface MappingResult {
  skills: string[]
  problems: string[]
  personas: string[]
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const { prompt }: MappingRequest = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: prompt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const systemPrompt = `You are a precise classifier that maps items to predefined categories.
Your job is to identify which category best matches each item based on semantic meaning.

RULES:
1. Match based on semantic meaning and intent, not just keywords
2. Each item gets exactly ONE category
3. Use only the category IDs provided - do not invent new ones
4. Return ONLY valid JSON, no explanation or commentary
5. For skills, consider the CATEGORY hint provided (Strategic, Creative, Technical, etc.)
6. For problems, consider the emotional core and who it affects
7. For personas, consider the archetype and journey stage they represent`

    // Call Claude Haiku API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text()
      throw new Error(`Anthropic API error: ${anthropicResponse.status} - ${errorText}`)
    }

    const anthropicData = await anthropicResponse.json()
    const responseText = anthropicData.content[0]?.text || '{}'

    // Parse the JSON response
    let result: MappingResult
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      result = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse response:', responseText)
      // Return empty arrays on parse failure
      result = {
        skills: [],
        problems: [],
        personas: [],
      }
    }

    // Validate category IDs
    const validSkillIds = ['clarifying', 'analyzing', 'strategizing', 'organizing', 'building', 'designing', 'creating', 'expressing', 'connecting', 'influencing', 'nurturing', 'synthesizing']
    const validProblemIds = ['physical_vitality', 'mental_wellbeing', 'personal_mastery', 'intimate_bonds', 'service_care', 'creative_expression', 'local_impact', 'cultural_movements', 'economic_freedom', 'social_justice', 'planetary_health', 'human_progress']
    const validPersonaIds = ['seekers', 'builders', 'healers', 'teachers', 'connectors', 'achievers', 'explorers', 'visionaries', 'protectors', 'creators', 'nurturers', 'challengers']

    // Filter to only valid IDs, keep null for invalid
    result.skills = (result.skills || []).map(id => validSkillIds.includes(id) ? id : null)
    result.problems = (result.problems || []).map(id => validProblemIds.includes(id) ? id : null)
    result.personas = (result.personas || []).map(id => validPersonaIds.includes(id) ? id : null)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Mind space mapping error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
