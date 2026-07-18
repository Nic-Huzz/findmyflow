import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Step 1: Use Claude to research each title and extract what it's REALLY about
async function researchContent(items: any[], episodes: any): Promise<string> {
  const contentList = items.map((item: any, i: number) => {
    const eps = episodes?.[i]
    let line = `${item.title} (${item.type})`
    if (eps?.length) line += ` — favourite episodes: ${eps.join(', ')}`
    return line
  }).join('\n')

  const researchPrompt = `For each piece of content below, provide a brief summary (2-3 sentences) of what it's about, its core themes, and why someone would be drawn to it. Use your knowledge of these titles.

${contentList}

Respond as JSON only:
{"research": [{"title": "...", "summary": "...", "core_themes": ["theme1", "theme2"], "why_drawn": "..."}]}`

  // Scale tokens: 5-10 items = 2000, larger inputs get more room
  const researchTokens = Math.min(Math.max(items.length * 200, 2000), 4096)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: researchTokens,
      messages: [{ role: 'user', content: researchPrompt }],
    }),
  })

  if (!response.ok) throw new Error('Research step failed')
  const data = await response.json()
  const text = data.content?.[0]?.text || ''
  return text
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { items, episodes } = await req.json()

    if (!items?.length || items.length < 3) {
      throw new Error('At least 3 content items required')
    }

    // Step 1: Research each title for richer context
    const researchText = await researchContent(items, episodes)

    // Step 2: Cluster with full context
    const prompt = `You are a warm, deeply insightful guide helping someone see patterns in what they're drawn to.

STEP 1 RESEARCH (what each piece of content is about):
${researchText}

ORIGINAL INPUT LIST:
${items.map((item: any, i: number) => {
  const eps = episodes?.[i]
  let line = `${item.title} (${item.type})`
  if (eps?.length) line += ` — favourite episodes: ${eps.join(', ')}`
  return line
}).join('\n')}

YOUR TASK: Identify 3-5 curiosity clusters from this content. These clusters should make the person feel SEEN, like you understand WHY they keep returning to these topics.

BRANCH DEFINITIONS (map each cluster to the SINGLE closest branch):
- movement: physical activity, fitness, sports, dance, cold exposure, embodied practice, body-based challenge
- nourishment: food, cooking, diet, fasting, nutrition, growing food, ancestral eating
- tools: skills, productivity, learning methods, technology, AI, problem-solving, building things
- status: craft, mastery, reputation, identity, self-expression, skill demonstration, creative work
- bonds: relationships, community, gathering, friendship, belonging, connection, loneliness
- shelter: architecture, space design, nature immersion, environment, co-living, sacred space
- story: narrative, meaning-making, philosophy, worldview, spirituality, consciousness, truth-seeking, writing
- fire: energy, ceremony, ritual, circadian rhythms, light, frequency, celebration
- healing: therapy, trauma, emotions, nervous system, breathwork, somatic practice, inner work, psychology
- threat: courage, fear, resilience, safety, boundaries, risk-taking, self-defence

CLUSTERING GUIDELINES:
- The cluster NAME should feel like a friend describing your deepest interest back to you. Not a category label.
  * GOOD: "The quiet obsession with becoming who you actually are" or "Why humans need each other more than they admit"
  * BAD: "Personal Development" or "Self-Improvement" or "Psychology & Inner Work"
- The DESCRIPTION should make them feel understood. Name the underlying PULL, not just the topic.
  * GOOD: "You keep returning to the question of how to close the gap between who you are and who you sense you could be."
  * BAD: "Books about personal growth and habit formation."
- The WHY field should name what this curiosity reveals about them as a person.
- Group by UNDERLYING MOTIVATION, not surface topic. "Atomic Habits" and "Mastery" are both about the same deep pull (becoming excellent through practice) even though one is about habits and one is about craft.
- Each input can feed multiple clusters.
- Prefer fewer, richer clusters (3-4 is often better than 5).

SKILL DEFINITIONS (tag each cluster with 1-3 matching skills):
- storytelling: turning lived experience into compelling narratives
- teaching: simplifying complex ideas, creating frameworks
- coaching: holding space, asking powerful questions, guiding transformation
- performing: live presence, stage energy, movement, dance, facilitation
- creating: making original things (art, music, content, writing)
- building: constructing systems, products, businesses, technology
- designing: shaping experiences, spaces, interfaces, journeys
- leading: rallying people, setting direction, managing teams
- connecting: bringing people together, community building
- speaking_up: advocating, being vulnerable publicly, challenging norms

PROBLEM DEFINITIONS (tag each cluster with 1-2 matching problems):
- kids_deserved_better: childhood education failures
- voice_taken: expression suppressed
- pain_not_believed: suffering dismissed
- world_losing: environmental/societal loss
- life_not_yours: living someone else's script
- feeling_stupid: intellectual shame
- locked_out: exclusion, gatekeeping
- work_treated_nothing: labour undervalued
- left_behind: abandonment, disconnection
- forgot_what_for: lost purpose
- stopped_wondering: curiosity killed
- work_hollows: burnout, meaninglessness

Respond ONLY as JSON:
{"clusters": [{"name": "...", "description": "...", "why": "...", "branch": "...", "skills": ["skill_id"], "problems": ["problem_id"], "input_count": 0, "titles": ["title1", "title2"]}]}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Anthropic error: ${response.status} ${errText}`)
    }

    const aiData = await response.json()
    const text = aiData.content?.[0]?.text || ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in AI response')

    const parsed = JSON.parse(jsonMatch[0])

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('classify-curiosities error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
