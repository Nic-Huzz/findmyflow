import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { curiosityClusters, skills, problems } = await req.json()

    if (!curiosityClusters?.length && !skills?.length && !problems?.length) {
      throw new Error('Need at least curiosity clusters, skills, or problems to suggest paths')
    }

    const curiositySection = curiosityClusters?.length
      ? `CURIOSITY CLUSTERS (what they keep reading/watching about):\n${curiosityClusters.map((c: any, i: number) => `${i + 1}. ${c.cluster_name} (${c.branch} branch)${c.why ? ' — ' + c.why : ''}`).join('\n')}`
      : 'No curiosity data available.'

    const skillsSection = skills?.length
      ? `LIFE MAP SKILLS (what they're good at):\n${skills.map((s: any) => `- ${s}`).join('\n')}`
      : 'No skills data available.'

    const problemsSection = problems?.length
      ? `LIFE MAP PROBLEMS (what they want to change):\n${problems.map((p: any) => `- ${p}`).join('\n')}`
      : 'No problems data available.'

    const prompt = `A person has mapped their curiosities, skills, and the problems they care about. Based on their data, suggest 5-7 life paths they could pursue.

${curiositySection}

${skillsSection}

${problemsSection}

GUIDELINES:
- Each path should be a specific career direction that clearly says what the person DOES. Not a poetic title.
- Name them in plain language a 12-year-old would understand. Say what the job is, not what it sounds like.
  * GOOD: "Workshop Host for Burnt-Out Professionals", "Breathwork Facilitator", "App Builder for Healing Tools"
  * BAD: "The Possibility Cartographer", "Consciousness Systems Designer", "Architect of Intentional Communities"
- Each path should draw from at least 2 of the 3 data sources (curiosity + skill, or curiosity + problem, or skill + problem)
- Include a mix: some that feel safe/obvious, some that feel exciting but stretchy, and one that feels like a wild card they haven't considered
- Keep descriptions to one sentence: what this path looks like day-to-day
- The person will see these as tappable options. Make them want to tap.

Respond ONLY as JSON:
{"paths": [{"name": "...", "description": "...", "draws_from": "brief note on which curiosity + skill + problem"}]}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
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
    console.error('suggest-life-paths error:', err)
    return new Response(JSON.stringify({ error: err.message, paths: [] }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
