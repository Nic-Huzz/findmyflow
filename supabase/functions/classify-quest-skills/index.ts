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

const PROBLEM_DEFINITIONS = `The 12 problem categories (use these exact IDs):
- kids_deserved_better: children dismissed, labelled, hit, or left to face the worst alone
- voice_taken: people whose voice was taken, suppressed, or erased
- pain_not_believed: physical or emotional suffering that nobody names, treats, or believes is real
- world_losing: ecological destruction, species loss, climate crisis
- life_not_yours: systems of control that own, oppress, or decide your life for you
- feeling_stupid: knowledge made unnecessarily hard, wrapped in jargon
- locked_out: education, healthcare, opportunity blocked by cost, credentials, or gatekeeping
- work_treated_nothing: your work being treated as nothing, underpaid, unrecognised
- left_behind: people abandoned by systems built without them
- forgot_what_for: the search for purpose when the old answers stop working
- stopped_wondering: the damage done when people stop questioning
- work_hollows: jobs that strip dignity, businesses that exploit`

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

    const { label, mode, insight } = await req.json()

    if (!label) {
      throw new Error('Label is required')
    }

    // Mode: 'problems' classifies into problem taxonomy, default classifies skills+branch
    if (mode === 'problems') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 100,
          system: `You classify problem descriptions into 1-2 problem taxonomy categories. Return ONLY a JSON object with "problem_tags" (array of 1-2 category IDs). No explanation.\n\nThese are problems that people experience in life, extracted from their personal life story reflections. Match to the category that best captures the CORE wound or frustration.\n\n${PROBLEM_DEFINITIONS}`,
          messages: [
            { role: 'user', content: `Problem: "${label}"${insight ? `\nInsight: "${insight}"` : ''}\n\nReturn JSON: {"problem_tags": [...]}` },
          ],
        }),
      })

      const result = await response.json()
      const text = result.content?.[0]?.text || '{}'
      const match = text.match(/\{.*\}/s)
      const parsed = match ? JSON.parse(match[0]) : {}
      const tags = Array.isArray(parsed.problem_tags) ? parsed.problem_tags : []

      const validProblemIds = ['kids_deserved_better', 'voice_taken', 'pain_not_believed', 'world_losing', 'life_not_yours', 'feeling_stupid', 'locked_out', 'work_treated_nothing', 'left_behind', 'forgot_what_for', 'stopped_wondering', 'work_hollows']
      const filteredTags = tags.filter((t: string) => validProblemIds.includes(t))

      return new Response(JSON.stringify({ problem_tags: filteredTags }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Default mode: classify skills + branch
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
