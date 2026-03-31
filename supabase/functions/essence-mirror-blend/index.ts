import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BlendRequest {
  primary: {
    name: string
    poetic_line: string
    superpower: string
    essence_wound: string
    poetic_vision: string
    energetic_transmission: string
    north_star: string
    vision_in_action: string
  }
  secondary: {
    name: string
    poetic_line: string
    superpower: string
    essence_wound: string
    poetic_vision: string
    energetic_transmission: string
    north_star: string
    vision_in_action: string
  }
  wound_stages?: string[]
  zone_diagnosis?: string
  tension_scores?: Record<string, number>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: BlendRequest = await req.json()
    const { primary, secondary, wound_stages, zone_diagnosis } = body

    if (!primary || !secondary) {
      throw new Error('Missing primary or secondary archetype data')
    }

    const contextLines = []
    if (wound_stages?.length) {
      contextLines.push(`Their childhood wound patterns: ${wound_stages.join(', ')}`)
    }
    if (zone_diagnosis) {
      contextLines.push(`Their current zone on the Identity graph: ${zone_diagnosis}`)
    }

    const prompt = `You are an expert at blending essence archetypes to create deeply personal identity profiles. You write with poetic precision — every word earns its place.

A user has been identified as a blend of two archetypes. Create a unified profile that weaves both essences together.

PRIMARY ARCHETYPE: ${primary.name}
- Essence: "${primary.poetic_line}"
- Superpower: "${primary.superpower}"
- Wound: "${primary.essence_wound}"
- Vision: "${primary.poetic_vision}"

SECONDARY ARCHETYPE: ${secondary.name}
- Essence: "${secondary.poetic_line}"
- Superpower: "${secondary.superpower}"
- Wound: "${secondary.essence_wound}"
- Vision: "${secondary.poetic_vision}"

${contextLines.length ? `USER CONTEXT:\n${contextLines.join('\n')}` : ''}

Generate a blended profile. The blend should feel like ONE person, not two archetypes stitched together. The secondary archetype adds flavor and nuance to the primary — it's the unexpected edge.

Rules:
- Write in second person ("You are...")
- Keep each field to 2-3 short sentences max. Each sentence should stand alone as its own thought.
- The blended_name should be a unique 2-3 word name that captures both essences (e.g., "The Fierce Alchemist", "The Rebel Healer")
- The wound should combine both wounds into one painful truth
- NEVER use em dashes (—), semicolons (;), or double hyphens (--)
- Use commas, full stops, or rephrase instead
- Be poetic but precise. Every word should land.

Return ONLY valid JSON:
{
  "blended_name": "The [Name]",
  "blended_essence": "A poetic one-line essence statement blending both archetypes",
  "blended_superpower": "What they uniquely do that no single archetype captures",
  "blended_wound": "The combined wound — what they were told that made them suppress both parts",
  "blended_vision": "What becomes possible when they fully embody this blend"
}`

    console.log(`essence-mirror-blend: ${primary.name} + ${secondary.name}`)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || '{}'

    let result
    try {
      result = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
    } catch {
      result = {
        blended_name: `The ${primary.name.split(' ').pop()} ${secondary.name.split(' ').pop()}`,
        blended_essence: `${primary.poetic_line} ${secondary.poetic_line}`,
        blended_superpower: `${primary.superpower}`,
        blended_wound: `${primary.essence_wound}`,
        blended_vision: `${primary.poetic_vision}`,
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in essence-mirror-blend:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
