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

const BRANCH_DEFINITIONS = `The 10 industry branches (use these exact IDs).
Pick the ONE branch this quest/life path primarily SERVES, not the skills used to do it.
A software developer building a meditation app is in "healing", not "tools".
A designer creating fitness experiences is in "movement", not "status".
The branch is the TERRITORY (what industry the work serves), not the VEHICLE (what skills are used).

- healing: medicine, wellness, therapy, transformation, mental health, breathwork, coaching for personal growth
- movement: fitness, sport, dance, physical activity, yoga, martial arts, walking, running
- bonds: community, relationships, retreats, circles, facilitation, gatherings, events, hosting
- story: media, content, publishing, podcasting, speaking, teaching, narrative, entertainment
- tools: technology, software, AI, coding, building products, hardware, engineering
- status: fashion, branding, personal identity, luxury, self-image, design aesthetic
- nourishment: food, nutrition, cooking, farming, agriculture, diet, restaurants
- shelter: housing, property, architecture, interior design, construction
- fire: energy, power, sustainability, lighting, warmth
- threat: security, safety, defence, resilience, protection`

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
        max_tokens: 200,
        system: `You classify quest/life path labels into skills AND a primary industry branch. Return ONLY a JSON object with "skills" (array of 1-3 skill IDs) and "branch" (one branch ID). No explanation.

These are life paths that experience creators (facilitators, coaches, healers, event hosts) pursue. Most work in transformation, wellness, community, or experiences. The branch is about WHAT INDUSTRY the work serves, not what skills are used. A software developer building a meditation app is in "healing", not "tools".

${SKILL_DEFINITIONS}

${BRANCH_DEFINITIONS}`,
        messages: [
          { role: 'user', content: `Quest label: "${label}"\n\nReturn JSON: {"skills": [...], "branch": "..."}` },
        ],
      }),
    })

    const result = await response.json()
    const text = result.content?.[0]?.text || '{}'

    // Extract JSON object from response
    const match = text.match(/\{.*\}/s)
    const parsed = match ? JSON.parse(match[0]) : {}
    const skills = Array.isArray(parsed.skills) ? parsed.skills : []
    const branch = typeof parsed.branch === 'string' ? parsed.branch : null

    // Validate against known IDs
    const validSkills = ['storytelling', 'teaching', 'coaching', 'performing', 'creating', 'building', 'designing', 'leading', 'connecting', 'speaking_up']
    const validBranches = ['movement', 'nourishment', 'tools', 'status', 'bonds', 'shelter', 'story', 'fire', 'healing', 'threat']
    const filteredSkills = skills.filter((s: string) => validSkills.includes(s))
    const validBranch = branch && validBranches.includes(branch) ? branch : null

    return new Response(JSON.stringify({ skill_tags: filteredSkills, branch: validBranch }), {
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
