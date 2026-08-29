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
    const { curiosityClusters, skills, problems, isFiltered, domeProfile } = await req.json()

    if (!curiosityClusters?.length && !skills?.length && !problems?.length && !domeProfile) {
      throw new Error('Need at least curiosity clusters, skills, problems, or dome data to suggest paths')
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

    const filterNote = isFiltered
      ? `\nIMPORTANT: These skills and problems have been filtered to only include ones this person is genuinely excited about. Stressed or boring clusters were excluded. Lean into what lights them up.\n`
      : ''

    // Experience Dome section (Phase 1→2 bridge)
    let domeSection = 'No experience dome data available.'
    if (domeProfile) {
      const lines = []
      if (domeProfile.selected?.length) lines.push(`SELECTED (experiences they want MORE of): ${domeProfile.selected.join(', ')}`)
      if (domeProfile.vibeRise?.length) lines.push(`Full Vibe Rise profile: ${domeProfile.vibeRise.join(', ')}`)
      if (domeProfile.fun?.length) lines.push(`Fun (enjoys but less intense): ${domeProfile.fun.join(', ')}`)
      if (domeProfile.pressure?.length) lines.push(`Growth edges (stressful but has done): ${domeProfile.pressure.join(', ')}`)
      if (domeProfile.essence) lines.push(`Essence archetype: ${domeProfile.essence}`)
      domeSection = `EXPERIENCE DOME (what their nervous system says about real-world experiences they've had):\n${lines.join('\n')}`
    }

    const prompt = `A person has mapped their life experiences and rated how each makes their nervous system feel. Based on their data, suggest 5-7 life paths they could pursue.

${domeSection}

${curiositySection}

${skillsSection}

${problemsSection}
${filterNote}
GUIDELINES:
- Each path should be a specific career direction that clearly says what the person DOES. Not a poetic title.
- Name them in plain language a 12-year-old would understand. Say what the job is, not what it sounds like.
  * GOOD: "Festival Creator", "Adventure Retreat Host", "Dance Event Organiser", "Travel Game Designer"
  * BAD: "The Possibility Cartographer", "Consciousness Systems Designer", "Holistic Transformation Architect"
- ONLY reference experiences from their data. Do NOT invent activities, modalities, or audiences they haven't mentioned. If breathwork isn't in their data, don't mention breathwork.
- If Experience Dome data exists, prioritise it. SELECTED experiences are the primary signal. Combine dome experiences into career directions that let this person do MORE of what lights them up.
- Growth edge experiences (stressful) are interesting stretch paths. At least one suggestion should lean into a growth edge.
- Fun experiences add texture but are weaker signal than Vibe Rise.
- The essence archetype shapes HOW they'd do it, not WHAT they do.
- Each path should draw from at least 2 experiences or data sources.
- Include a mix: some that feel safe/obvious, some that feel exciting but stretchy, and one wild card they haven't considered. Label the wild card.
- Keep descriptions to 1-2 sentences: what this path looks like day-to-day.
- The person will see these as tappable options. Make them want to tap.

Respond ONLY as JSON:
{"paths": [{"name": "...", "description": "...", "draws_from": "brief note on which experiences or data sources"}]}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
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
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err), paths: [] }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
