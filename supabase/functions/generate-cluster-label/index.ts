// Supabase Edge Function: Generate Semantic Cluster Label
// Uses Claude AI to create thematic labels for skill clusters

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const LABEL_GENERATION_PROMPT = `
You are a career coach helping someone discover their unique skills and purpose.

Given a cluster of activities/skills, you need to:
1. Create an EVOCATIVE, PERSONAL label (2-4 words) that captures the essence
2. Map it to the BEST MATCHING archetype(s) from this list of 30 role archetypes:

**Creative Roles:**
- The Creator
- The Storyteller
- The Visionary
- The Curator

**Relational Roles:**
- The Connector
- The Facilitator
- The Guide
- The Advocate

**Operational Roles:**
- The Builder
- The Organizer
- The Optimizer
- The Operator

**Analytical Roles:**
- The Analyst
- The Strategist
- The Problem-Solver
- The Researcher

**Transformational Roles:**
- The Healer
- The Activator
- The Transformer
- The Liberator

**Nurturing Roles:**
- The Cultivator
- The Gardener
- The Nurturer
- The Steward

**Expressive Roles:**
- The Performer
- The Host
- The Inspirer

**Protective Roles:**
- The Guardian
- The Mediator
- The Anchor

RULES FOR EVOCATIVE LABEL:
- Be creative, personal, and resonant (e.g., "Movement & Embodied Energy")
- Capture the THEME, not just list activities
- Use archetypal language that feels alive
- 2-4 words maximum

RULES FOR ARCHETYPE MAPPING:
- Map to 1-3 archetypes from the list above
- Use EXACT names (e.g., "The Builder" not "Builder")
- Include confidence score 0-1 for each
- Multiple archetypes OK if cluster is multi-faceted

EXAMPLES:
Input: ["Building things", "Building businesses", "Creating products"]
Output: {
  "displayLabel": "Builder & Creator",
  "archetypes": [
    {"name": "The Builder", "confidence": 0.9},
    {"name": "The Creator", "confidence": 0.7}
  ]
}

Input: ["Running around", "Sport", "Dancing", "Movement"]
Output: {
  "displayLabel": "Movement & Embodied Energy",
  "archetypes": [
    {"name": "The Performer", "confidence": 0.85}
  ]
}

Input: ["Researching", "Writing", "Analyzing data", "Problem solving"]
Output: {
  "displayLabel": "Curiosity & Discovery",
  "archetypes": [
    {"name": "The Researcher", "confidence": 0.9},
    {"name": "The Analyst", "confidence": 0.6}
  ]
}

Input: ["Teaching kids", "Mentoring", "Coaching", "Supporting growth"]
Output: {
  "displayLabel": "Guide & Nurturer",
  "archetypes": [
    {"name": "The Guide", "confidence": 0.95},
    {"name": "The Nurturer", "confidence": 0.7}
  ]
}

Now generate a label for this cluster.

Return ONLY valid JSON (no markdown):
{
  "displayLabel": "Your Evocative Label",
  "archetypes": [
    {"name": "The Archetype", "confidence": 0.9}
  ],
  "rationale": "Brief explanation"
}
`

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { items } = await req.json()

    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ label: 'Unnamed Cluster' }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // Format items for Claude
    const itemsList = items.map((item: any) => {
      const topTags = Object.entries(item.tags || {})
        .filter(([_, vals]: [string, any]) => Array.isArray(vals) && vals.length > 0)
        .flatMap(([type, vals]: [string, any]) => vals)
        .slice(0, 3)

      if (topTags.length > 0) {
        return `"${item.text}" (${topTags.join(', ')})`
      }
      return `"${item.text}"`
    }).join('\n')

    console.log('📝 Formatted items for Claude:', itemsList)

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: `${LABEL_GENERATION_PROMPT}\n\nCluster items:\n${itemsList}`
        }]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API error:', claudeResponse.status, errorText)
      throw new Error(`Claude API error ${claudeResponse.status}`)
    }

    const claudeData = await claudeResponse.json()
    const extractedText = claudeData.content[0].text

    // Parse JSON response
    let result
    try {
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        result = JSON.parse(extractedText)
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', extractedText)
      throw new Error('Invalid JSON response from Claude')
    }

    // Ensure proper structure
    const response = {
      displayLabel: result.displayLabel || result.label || 'Unnamed Cluster',
      archetypes: result.archetypes || [],
      rationale: result.rationale,
      model: 'claude-3-haiku-20240307'
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Error in generate-cluster-label:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        label: 'Unnamed Cluster'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
