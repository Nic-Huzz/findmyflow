// Supabase Edge Function: Derive Essence Chamber Pillars
// Takes Life Map raw responses + cluster results and derives lifelong expression pillars

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const SYSTEM_PROMPT = `You are analyzing a user's Life Map data to identify their Essence Chamber: the permanent expression needs (Pillars) that have persisted across their entire life, and the specific vehicles (Orbs) that fulfilled each pillar at different life stages.

## Definitions

**Pillar**: A core expression need that is essentially permanent. Not a skill, not a role, not a mission — a NEED TO EXPRESS something that has been present since childhood. Examples: "the need to build containers for others", "the need for embodied aliveness", "the need to make the invisible felt". Pillars don't change. They were there in childhood and they're there now. Name them as felt needs in plain language.

**Orb**: A specific activity, role, or pursuit that fulfils a pillar at a given point in time. Orbs change. They glow when active, fade when outgrown.

**Current Direction**: Something that emerged in Career or Now but has NO childhood/teen roots. This is where the user's pillars are POINTING, not a pillar itself. Important to name, but categorically different from a pillar.

## Strict Rules

1. A pillar MUST have orbs in at least 3 of the 5 periods, AND at least one must be from Childhood or Teens. If it only emerged in Young Adult/Career/Now, it's a Current Direction, not a pillar. No exceptions.

2. Each orb can appear on MAXIMUM 2 pillars. If you find yourself placing the same orb on 3+ pillars, one of those pillars is not distinct enough — merge or drop it.

3. Report ONLY pillars you're genuinely confident about. 3 strong pillars is better than 5 with 2 weak ones. Do not pad.

4. Be honest about status:
   - ACTIVE = has a clearly stated orb in Now+Future
   - FLICKERING = had orbs in Career but nothing explicit in Now+Future
   - EMPTY = no orb in the most recent 2+ periods

5. For problems: they annotate pillars (wounds ON a pillar, suppression OF a pillar). They do not create new pillars.

6. For personas: they validate pillars. Note which ones, but don't force a persona onto a pillar if the connection is weak.

7. After pillars, separately list any Current Directions (emerged recently, may be where pillars are converging but don't have childhood roots).

8. End with the Essence Chamber Gap: the pillar most clearly sitting empty or flickering. This is the diagnostic gold — be specific and honest. If ALL pillars are genuinely ACTIVE, set gap to null.`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { responses, skillsClusters, problemsClusters, personasClusters, essenceArchetype } = await req.json()

    if (!responses) {
      throw new Error('Missing required field: responses')
    }

    const userPrompt = buildUserPrompt(responses, skillsClusters || [], problemsClusters || [], personasClusters || [], essenceArchetype)

    const tools = [{
      name: 'essence_chamber',
      description: 'Return the Essence Chamber analysis with pillars, current directions, and gap insight',
      input_schema: {
        type: 'object',
        properties: {
          pillars: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Pillar name as a felt need, not a job title' },
                confidence: { type: 'string', enum: ['HIGH', 'MEDIUM'] },
                confidence_note: { type: 'string', description: 'One sentence on why this qualifies' },
                status: { type: 'string', enum: ['ACTIVE', 'FLICKERING', 'EMPTY'] },
                orbs: {
                  type: 'object',
                  properties: {
                    childhood: { type: 'array', items: { type: 'string' } },
                    teens: { type: 'array', items: { type: 'string' } },
                    young_adult: { type: 'array', items: { type: 'string' } },
                    career: { type: 'array', items: { type: 'string' } },
                    now: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['childhood', 'teens', 'young_adult', 'career', 'now'],
                },
                wounds: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      text: { type: 'string' },
                    },
                    required: ['text'],
                  },
                },
                personas: { type: 'array', items: { type: 'string' } },
              },
              required: ['name', 'confidence', 'confidence_note', 'status', 'orbs', 'wounds', 'personas'],
            },
          },
          current_directions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
              },
              required: ['name', 'description'],
            },
          },
          gap: {
            description: 'The most significant flickering or empty pillar. Return null if all pillars are ACTIVE.',
            type: ['object', 'null'],
            properties: {
              pillar_name: { type: 'string' },
              status: { type: 'string', enum: ['FLICKERING', 'EMPTY'] },
              insight: { type: 'string', description: '2-3 sentences on what this means for the person right now' },
            },
            required: ['pillar_name', 'status', 'insight'],
          },
        },
        required: ['pillars', 'current_directions'],
      },
    }]

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools,
        tool_choice: { type: 'tool', name: 'essence_chamber' },
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API error:', claudeResponse.status, errorText)
      throw new Error(`Claude API error ${claudeResponse.status}`)
    }

    const claudeData = await claudeResponse.json()
    const toolUse = claudeData.content.find((block: any) => block.type === 'tool_use')

    if (!toolUse || toolUse.name !== 'essence_chamber') {
      throw new Error('Expected essence_chamber tool use in response')
    }

    return new Response(
      JSON.stringify(toolUse.input),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in derive-pillars:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function buildUserPrompt(
  responses: Record<string, string[]>,
  skills: any[],
  problems: any[],
  personas: any[],
  archetype: string | null,
): string {
  const PERIODS: Record<string, string> = {
    childhood: 'Childhood (Pre-school + Primary School)',
    teens: 'Teens (High School)',
    young_adult: 'Young Adult (18-25)',
    career: 'Career (25+)',
    now: 'Now + Future',
  }
  const CATEGORIES: Record<string, string> = {
    skills: 'Skills (what they loved doing)',
    problems: 'Problems (what was hard or made them feel different)',
    personas: 'Personas (who were their heroes)',
  }

  let prompt = '## Raw Life Map Responses\n\n'

  for (const [periodId, periodName] of Object.entries(PERIODS)) {
    prompt += `**${periodName}:**\n`
    for (const [catId, catLabel] of Object.entries(CATEGORIES)) {
      const key = `${periodId}_${catId}`
      const items = (responses[key] || []).filter((v: string) => v?.trim())
      if (items.length) {
        prompt += `- ${catLabel}: ${items.join(', ')}\n`
      }
    }
    prompt += '\n'
  }

  prompt += '## AI-Generated Clusters (for reference)\n\n'

  const formatClusters = (clusters: any[], label: string) => {
    if (!clusters.length) return ''
    return `**${label}:**\n${clusters.map((c: any) => {
      const items = (c.items || []).map((i: any) => typeof i === 'string' ? i : i.text || '').filter(Boolean)
      return `- "${c.label}" (${items.join(', ')})`
    }).join('\n')}\n\n`
  }

  prompt += formatClusters(skills, 'Skills')
  prompt += formatClusters(problems, 'Problems')
  prompt += formatClusters(personas, 'Personas')

  if (archetype) {
    prompt += `## User's Essence Archetype: ${archetype}\n\n`
  }

  prompt += 'Derive the Essence Chamber pillars from this data.'
  return prompt
}
