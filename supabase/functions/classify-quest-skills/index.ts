import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SKILL_DEFINITIONS = `The 10 skills (use these exact IDs):
- storytelling: turning lived experience into compelling narratives, reframing, noticing detail
- teaching: simplifying complex ideas, creating frameworks, bridging knowledge gaps
- coaching: holding space for others, asking powerful questions, guiding transformation
- performing: live presence, stage energy, movement, dance, facilitation in front of groups
- creating: making original things (art, music, content, video, writing, design)
- building: constructing systems, products, businesses, technology, infrastructure
- designing: shaping experiences, spaces, interfaces, visual systems, user journeys
- leading: rallying people, setting direction, making decisions, managing teams
- connecting: bringing people together, networking, community building, matchmaking
- speaking_up: advocating, being vulnerable publicly, challenging norms, using your voice`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured', skill_tags: [] }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { label } = await req.json()

    if (!label) {
      throw new Error('Quest label is required')
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system: `You classify quest/life path labels into skills. Return ONLY a JSON array of matching skill IDs. Pick 1-3 skills that best match. No explanation.

${SKILL_DEFINITIONS}`,
        messages: [
          { role: 'user', content: `Quest label: "${label}"\n\nReturn JSON array of skill IDs:` },
        ],
      }),
    })

    const result = await response.json()
    const text = result.content?.[0]?.text || '[]'

    // Extract JSON array from response
    const match = text.match(/\[.*\]/s)
    const skills = match ? JSON.parse(match[0]) : []

    // Validate against known skill IDs
    const validSkills = ['storytelling', 'teaching', 'coaching', 'performing', 'creating', 'building', 'designing', 'leading', 'connecting', 'speaking_up']
    const filtered = skills.filter((s: string) => validSkills.includes(s))

    return new Response(JSON.stringify({ skill_tags: filtered }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('classify-quest-skills error:', err)
    return new Response(JSON.stringify({ error: err.message, skill_tags: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
