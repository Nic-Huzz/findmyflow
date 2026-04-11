// Supabase Edge Function: Map to Play-Skills
// Takes extracted skill items (from CuriosityCompass regex parse)
// and maps each to the best-fitting placemake from wheelTaxonomy.
//
// Input:  { items: [{ name, evidence, category }] }
// Output: { mappedItems: [{ placemake, categoryId, evidence, originalName }] }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Full placemakes taxonomy — must stay in sync with wheelTaxonomy.js SKILLS_SEGMENTS
const PLACEMAKES_TAXONOMY: Record<string, { displayName: string; placemakes: string[] }> = {
  storytelling: {
    displayName: 'Storytelling',
    placemakes: [
      'Turning what you lived into something others can hold',
      'Showing up to the page whether you feel like it or not',
      'Telling the story the room needs to hear',
      'Going against the grain of how your world tells stories',
      'Noticing the detail that becomes the whole story',
    ],
  },
  teaching: {
    displayName: 'Teaching',
    placemakes: [
      'Making the complex simple enough that anyone can hold it',
      'Creating the moment something finally clicks',
      'Building a framework others can use without you',
      'Bridging two worlds that don\'t know they need each other',
    ],
  },
  coaching: {
    displayName: 'Coaching',
    placemakes: [
      'Holding someone through a hard moment',
      'Showing up with patience until something clicks',
      'Helping someone see what they can\'t see yet',
      'Stepping back so someone else can step forward',
    ],
  },
  performing: {
    displayName: 'Performing',
    placemakes: [
      'Making the moment itself the message',
      'Getting a room to lean forward',
      'Putting yourself on record',
      'Performing with nothing but your body and voice',
    ],
  },
  creating: {
    displayName: 'Creating',
    placemakes: [
      'Making something that didn\'t exist before',
      'Following a hunch everyone said was wrong',
      'Remixing two things nobody thought to combine',
      'Making something with your hands every single day',
    ],
  },
  building: {
    displayName: 'Building',
    placemakes: [
      'Getting your hands on the actual thing',
      'Prototyping until it works no matter how many tries',
      'Doing whatever it takes to physically bring it into existence',
      'Building something from scratch because nothing good enough exists',
      'Noticing what\'s broken and not being able to leave it alone',
    ],
  },
  designing: {
    displayName: 'Designing',
    placemakes: [
      'Shaping how a space or moment feels',
      'Obsessing over the detail everyone else skips',
      'Stripping away everything that doesn\'t belong',
    ],
  },
  leading: {
    displayName: 'Leading',
    placemakes: [
      'Seeing a future nobody else sees and building the rules to get there',
      'Building a system that runs without you in the room',
      'Making the right call when the stakes are highest',
      'Turning a mess no one wants to touch into something that runs',
      'Spotting the number everyone else walked past',
    ],
  },
  connecting: {
    displayName: 'Connecting',
    placemakes: [
      'Building a community from nothing',
      'Holding space for a conversation nobody else will host',
      'Making a gathering people walk away changed by',
      'Being the person who holds a scattered room together',
    ],
  },
  speaking_up: {
    displayName: 'Speaking Up',
    placemakes: [
      'Speaking truth to power face to face',
      'Speaking from inside your own wound',
      'Standing alone against an industry that rewards silence',
      'Refusing to stop saying it when no one\'s listening yet',
      'Challenging the room you have to keep working in tomorrow',
    ],
  },
}

// Build the taxonomy section of the prompt
function buildTaxonomyPrompt(): string {
  const lines: string[] = []
  for (const [id, cat] of Object.entries(PLACEMAKES_TAXONOMY)) {
    lines.push(`${id} — ${cat.displayName}:`)
    cat.placemakes.forEach((pm, i) => {
      lines.push(`  ${i + 1}. "${pm}"`)
    })
    lines.push('')
  }
  return lines.join('\n')
}

// Collect all valid placemake strings for output validation
function getAllValidPlacemakes(): Set<string> {
  const all = new Set<string>()
  for (const cat of Object.values(PLACEMAKES_TAXONOMY)) {
    for (const pm of cat.placemakes) {
      all.add(pm)
    }
  }
  return all
}

const VALID_CATEGORY_IDS = new Set(Object.keys(PLACEMAKES_TAXONOMY))
const VALID_PLACEMAKES = getAllValidPlacemakes()

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const { items } = await req.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing or empty items array', mappedItems: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Cap at 15 items to stay within Haiku's reliable output window
    const cappedItems = items.slice(0, 15)

    // Build item list for the prompt
    const itemLines = cappedItems.map((item: any, i: number) =>
      `${i}. "${item.name}" (category hint: ${item.category || 'none'}) — evidence: "${item.evidence || 'none'}"`
    ).join('\n')

    const taxonomyBlock = buildTaxonomyPrompt()

    const systemPrompt = `You are a precise matcher. You map user-extracted skills to the single best-fitting placemake from a fixed taxonomy.

TAXONOMY (10 categories, 3-5 placemakes each, 43 total):

${taxonomyBlock}

RULES:
1. For each item, pick the ONE placemake that best captures what the person actually does, based on the skill name AND the evidence.
2. Use the category hint as a guide but override it if the evidence points elsewhere.
3. Return the placemake string EXACTLY as written in the taxonomy. No rephrasing, no punctuation changes.
4. If an item is ambiguous, pick the placemake with the strongest semantic overlap to the evidence.
5. Spread across categories when evidence supports it. Do not force everything into one category.
6. Return ONLY valid JSON, no explanation.`

    const userPrompt = `Map each item below to the single best placemake from the taxonomy.

ITEMS:
${itemLines}

Return JSON:
{
  "mappings": [
    { "index": 0, "categoryId": "category_id", "placemake": "exact placemake string" },
    ...
  ]
}`

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6-20250514',
        max_tokens: 2000,
        temperature: 0.2,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text()
      throw new Error(`Anthropic API error: ${anthropicResponse.status} - ${errorText}`)
    }

    const anthropicData = await anthropicResponse.json()
    const responseText = anthropicData.content[0]?.text || '{}'

    // Parse JSON response
    let parsed: { mappings: Array<{ index: number; categoryId: string; placemake: string }> }
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      parsed = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse Haiku response:', responseText)
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response', mappedItems: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate and build output
    const mappedItems = (parsed.mappings || []).map((m) => {
      const item = cappedItems[m.index]
      if (!item) return null

      const placemake = VALID_PLACEMAKES.has(m.placemake) ? m.placemake : null
      if (!placemake) {
        console.warn(`Invalid placemake for item ${m.index}: ${m.placemake}`)
        return null
      }

      // Auto-correct category: find the category that actually owns this placemake
      let categoryId = VALID_CATEGORY_IDS.has(m.categoryId) ? m.categoryId : null
      const ownerCat = PLACEMAKES_TAXONOMY[categoryId || '']
      if (!categoryId || !ownerCat?.placemakes.includes(placemake)) {
        // Placemake belongs to a different category than Haiku claimed — find the real one
        const correctEntry = Object.entries(PLACEMAKES_TAXONOMY).find(
          ([_, cat]) => cat.placemakes.includes(placemake)
        )
        if (correctEntry) {
          categoryId = correctEntry[0]
        } else {
          console.warn(`Orphaned placemake for item ${m.index}: ${placemake}`)
          return null
        }
      }

      return {
        placemake,
        categoryId,
        evidence: item.evidence || '',
        originalName: item.name,
      }
    }).filter(Boolean)

    return new Response(
      JSON.stringify({ mappedItems }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('map-to-playskills error:', error)
    return new Response(
      JSON.stringify({ error: error.message, mappedItems: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
