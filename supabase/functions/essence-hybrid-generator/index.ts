// Supabase Edge Function: Essence Hybrid Generator
// Generates synthesized essence statements from 2-3 selected archetype sources

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Field descriptions for the AI
const FIELD_DESCRIPTIONS: Record<string, string> = {
  tagline: 'A short essence tagline - a punchy 3-6 word phrase that captures your core identity (e.g., "Disruptive truth-teller with heart.")',
  essence: 'A short poetic line that captures the soul of who you are (e.g., "You are fire with a heartbeat, designed to disrupt what\'s false and awaken what\'s real.")',
  superpower: 'Your unique gift - the thing you do that creates transformation for others',
  vision: 'A poetic vision of what becomes possible when you fully embody your essence',
  north_star: 'Your guiding principle - the one truth that keeps you on path',
  inner_child: 'What your inner child wanted most - a desire from childhood that still drives you',
  wound: 'Your essence wound - the message you internalized that made you dim your light',
  characters: 'Fictional or real characters who embody similar energy (comma-separated list)',
  energetic_transmission: 'The energy you transmit when you\'re fully in your power',
  recognition_pattern: 'How people recognize when they need you and what you offer',
  vision_in_action: 'What it looks like when your vision is fully manifested in the world'
}

// Map field names to archetype data keys
const FIELD_KEYS: Record<string, string> = {
  tagline: 'essence',
  essence: 'poetic_line',
  superpower: 'superpower',
  vision: 'poetic_vision',
  north_star: 'north_star',
  inner_child: 'inner_child_desire',
  wound: 'essence_wound',
  characters: 'characters',
  energetic_transmission: 'energetic_transmission',
  recognition_pattern: 'recognition_pattern',
  vision_in_action: 'vision_in_action'
}

interface HybridRequest {
  field: string
  sources: string[] // Archetype names
  archetype_data: Array<{
    name: string
    poetic_line: string
    superpower: string
    poetic_vision: string
    north_star: string
  }>
}

async function generateHybridStatement(request: HybridRequest): Promise<{ statement: string; synthesis_note: string }> {
  const { field, sources, archetype_data } = request

  if (!sources || sources.length < 2 || sources.length > 3) {
    throw new Error('Must select 2-3 archetypes to synthesize')
  }

  const fieldKey = FIELD_KEYS[field]
  if (!fieldKey) {
    throw new Error(`Unknown field: ${field}`)
  }

  // Get the specific field values from selected archetypes
  const sourceStatements = sources.map(sourceName => {
    const archetype = archetype_data.find(a => a.name === sourceName)
    if (!archetype) {
      throw new Error(`Archetype not found: ${sourceName}`)
    }
    const rawValue = archetype[fieldKey as keyof typeof archetype]

    // Handle array fields (like characters)
    let statement: string
    if (Array.isArray(rawValue)) {
      statement = rawValue.join(', ')
    } else if (typeof rawValue === 'string' && rawValue) {
      statement = rawValue
    } else {
      throw new Error(`Invalid or missing field '${fieldKey}' for archetype '${sourceName}'`)
    }

    return {
      name: sourceName,
      statement
    }
  })

  const fieldDescription = FIELD_DESCRIPTIONS[field]

  const prompt = `You are an expert at synthesizing essence archetypes to create personalized statements that feel true and resonant.

A user has selected ${sources.length} archetypes that resonate with them and wants a ${field} statement that blends these energies.

FIELD TYPE: ${field}
DESCRIPTION: ${fieldDescription}

SELECTED ARCHETYPES AND THEIR STATEMENTS:
${sourceStatements.map(s => `
${s.name}:
"${s.statement}"
`).join('\n')}

Create a NEW ${field} statement that:
1. Synthesizes the core themes from all ${sources.length} archetypes
2. Feels unified, not like a list of parts stitched together
3. Matches the poetic, second-person style ("You are...")
4. Is roughly the same length as the original statements
5. Captures what makes these archetypes powerful together

Return ONLY valid JSON:
{
  "statement": "The synthesized ${field} statement",
  "synthesis_note": "A brief 10-15 word note about what was blended (e.g., 'Combines the fire of rebellion with the depth of intuition')"
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    const result = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
    return {
      statement: result.statement || '',
      synthesis_note: result.synthesis_note || `Synthesized from ${sources.join(' + ')}`
    }
  } catch {
    // If JSON parsing fails, try to extract the statement
    return {
      statement: text.trim(),
      synthesis_note: `Synthesized from ${sources.join(' + ')}`
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: HybridRequest = await req.json()
    const { field, sources, archetype_data } = body

    if (!field || !sources || !archetype_data) {
      throw new Error('Missing required fields: field, sources, archetype_data')
    }

    console.log(`essence-hybrid-generator: field=${field}, sources=${sources.join(', ')}`)

    const result = await generateHybridStatement(body)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in essence-hybrid-generator:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
