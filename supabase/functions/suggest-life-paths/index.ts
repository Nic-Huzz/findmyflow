import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function buildExperienceLines(domeProfile: any): string {
  const lines: string[] = []

  if (!domeProfile?.selected?.length) return ''

  const first = domeProfile.selected[0]
  if (typeof first === 'string') {
    lines.push(`SELECTED EXPERIENCES:\n${domeProfile.selected.map((s: string) => `- ${s}`).join('\n')}`)
  } else {
    const enrichedLines: string[] = []
    for (const item of domeProfile.selected) {
      let line = `- ${item.label}`
      if (item.formats?.length) {
        line += ` (specifically: ${item.formats.join(', ')})`
      }
      if (item.vectors?.length) {
        const vectorLabels: Record<string, string> = {
          do_it: 'wants to DO this as their career',
          facilitate_it: 'wants to FACILITATE this (run the experience, others participate)',
          build_around: 'wants to BUILD around it (platform, brand, space, content)',
          guide_it: 'wants to FACILITATE this',
        }
        const nonHobby = item.vectors.filter((v: string) => v !== 'hobby')
        if (nonHobby.length) {
          line += ` → ${nonHobby.map((v: string) => vectorLabels[v] || v).join(' + ')}`
        }
      }
      enrichedLines.push(line)
    }
    lines.push(`SELECTED EXPERIENCES (what makes this person come alive, with their preferred career role):\n${enrichedLines.join('\n')}`)
  }

  if (domeProfile.essence) {
    lines.push(`Essence archetype: ${domeProfile.essence}`)
  }

  return lines.join('\n\n')
}

async function callAI(prompt: string): Promise<any> {
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
      temperature: 0.3,
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
  return JSON.parse(jsonMatch[0])
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { domeProfile, mode, selectedProjects } = body

    // ── MODE: CLUSTER (4+ selected projects → 2-3 paths with projects) ──
    if (mode === 'cluster') {
      if (!selectedProjects?.length || selectedProjects.length < 2) {
        throw new Error('Cluster requires 2+ selected projects')
      }

      const experienceData = buildExperienceLines(domeProfile)

      const projectsList = selectedProjects.map((p: any, i: number) =>
        `${i + 1}. "${p.name}" — ${p.description} (draws from: ${p.draws_from})`
      ).join('\n')

      const clusterPrompt = `A person was shown project ideas based on their experience data. They selected ${selectedProjects.length} projects they want to pursue. Your job is to group these into 2-3 distinct life paths.

ORIGINAL EXPERIENCE DATA:
${experienceData}

SELECTED PROJECTS:
${projectsList}

INSTRUCTIONS:
Step 1: Identify the distinct DOMAINS in these projects. A domain is a world/industry/context (e.g., "dance events" is different from "teaching workshops" which is different from "healing retreats"). Two projects in the same domain at different scales (silent disco vs festival) belong together.

Step 2: Group projects by domain. Each domain becomes one life path. Projects within the same domain become projects under that path.

Step 3: Name each life path with a clear, simple label that describes the direction.

RULES:
- Output 1-3 life paths. Each path contains 1+ projects from the selected list. If all projects belong to the same domain, output 1 path.
- Every selected project must appear in exactly one path. Don't drop any.
- Path names should be broad enough to contain their projects but specific enough to be meaningful. "Dance Events" not "Experiences."
- Keep path descriptions to 1 sentence: the direction this path represents.
- Plain language a 12-year-old would understand.
- NEVER use em dashes.

Respond ONLY as JSON:
{"paths": [{"name": "...", "description": "one sentence direction", "projects": [{"name": "project name from the list", "description": "original description"}]}]}`

      const parsed = await callAI(clusterPrompt)

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── MODE: SUGGEST (default — generate project ideas) ──
    if (!domeProfile?.selected?.length) {
      throw new Error('Need selected dome experiences to suggest projects')
    }

    const dataSection = buildExperienceLines(domeProfile)

    const prompt = `A person has completed an experience mapping exercise. They ticked real-world experiences they've done, rated each with their nervous system response, then selected the ones that make them come ALIVE. For each selected experience, they chose specific formats they love and whether they want to DO it, FACILITATE it, or BUILD around it.

This is the ONLY data you have. Do not invent experiences, modalities, or interests not listed below.

${dataSection}

YOUR TASK: Suggest 5-7 exciting project ideas this person could start pursuing. Each project is a concrete thing they could do or build, like "Silent Disco Events" or "Breathwork Retreats" or "Dance Workshop Series." Think big but specific.

RULES:
1. ONLY use the selected experiences listed above. Never reference activities not in the data.
2. RESPECT THE CAREER VECTOR. This is non-negotiable:
   - DO = they perform the activity professionally. Suggest projects where THEY do the thing.
   - FACILITATE = they run the experience, others participate. Suggest projects where they host, organise, or lead.
   - BUILD = they create platforms, brands, spaces, or content around it.
   - NEVER cross vectors. A DO person doesn't want to facilitate. A FACILITATE person doesn't want to perform.
3. If specific formats are listed (e.g. "specifically: silent disco, morning dance"), reference those formats in the project name, not the generic experience.
4. Each project should combine 1-3 selected experiences. Some projects can draw from just one experience if that experience is specific enough.
5. The essence archetype shapes HOW they'd approach it (their energy/style), not WHAT they do.
6. Name projects in plain language a 12-year-old would understand. Say what the project IS.
   GOOD: "Silent Disco Events", "Breathwork Retreat Series", "Public Speaking Workshops"
   BAD: "The Possibility Lab", "Consciousness Architecture Studio"
7. Focus on DOING things, not owning things. "Run retreats" not "Own a retreat center."
8. Keep descriptions to 1-2 sentences: what this project looks like in practice.
9. Include a mix: some obvious, some stretchy, one wild card (label it). The wild card must still draw from selected experiences, just combined in an unexpected way.
10. Write like a friend explaining the project, not a wellness brochure.
11. NEVER use em dashes. Use commas, full stops, or rephrase.
12. BANNED phrases: "nervous system journey", "curated experience", "transformational space", "holding space", "intentional community".

Respond ONLY as JSON:
{"projects": [{"name": "...", "description": "...", "draws_from": "which selected experiences this combines"}]}`

    const parsed = await callAI(prompt)

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('suggest-life-paths error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err), projects: [], paths: [] }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
