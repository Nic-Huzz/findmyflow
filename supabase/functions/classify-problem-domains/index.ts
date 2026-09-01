// Supabase Edge Function: Classify Problem Domains
// Takes a problem cluster label + optional insight and classifies it
// into 1-2 of the 12 problem taxonomy categories.
//
// Input:  { label: string, insight?: string }
// Output: { problem_tags: string[] }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PROBLEM_DEFINITIONS = `The 12 problem categories (use these exact IDs):
- kids_deserved_better: children dismissed, labelled, hit, or left to face the worst alone. Child development, parenting, youth advocacy.
- voice_taken: people whose voice was taken, suppressed, or erased before they could use it. Advocacy, expression, identity work.
- pain_not_believed: physical or emotional suffering that nobody names, treats, or believes is real. Health coaching, chronic illness, burnout.
- world_losing: ecological destruction, species loss, climate crisis. Environmental consulting, sustainability.
- life_not_yours: systems of control that own, oppress, or decide your life for you. Human rights, liberation, community organising.
- feeling_stupid: knowledge made unnecessarily hard, wrapped in jargon, or explained so badly you blame yourself. Science communication, courses, accessible publishing.
- locked_out: education, healthcare, opportunity, or basic dignity blocked by cost, credentials, or gatekeeping. Open-access, community education, social enterprise.
- work_treated_nothing: your work being treated as nothing. Workplace dignity, recognition, ethical business, underpaid practitioners.
- left_behind: people abandoned by systems built without them, falling through cracks nobody designed a net for. Community building, mutual aid.
- forgot_what_for: the search for purpose, connection, and what makes a life worth living when the old answers stop working. Life coaching, meaning-making, retreat facilitation.
- stopped_wondering: the damage done when people stop questioning and start knowing. Critical thinking, dialogue design, facilitation.
- work_hollows: jobs that strip dignity, businesses that exploit, systems that treat workers as disposable. Career transition, ethical business, social entrepreneurship.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured', problem_tags: [] }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { label, insight } = await req.json()

    if (!label) {
      throw new Error('Problem cluster label is required')
    }

    const context = insight ? `\nInsight: "${insight}"` : ''

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
        system: `You classify problem descriptions into 1-2 problem taxonomy categories. Return ONLY a JSON object with "problem_tags" (array of 1-2 category IDs). No explanation.

These are problems that people experience in life, extracted from their personal life story reflections. Match to the category that best captures the CORE wound or frustration described.

${PROBLEM_DEFINITIONS}`,
        messages: [
          { role: 'user', content: `Problem: "${label}"${context}\n\nReturn JSON: {"problem_tags": [...]}` },
        ],
      }),
    })

    const result = await response.json()
    const text = result.content?.[0]?.text || '{}'

    const match = text.match(/\{.*\}/s)
    const parsed = match ? JSON.parse(match[0]) : {}
    const tags = Array.isArray(parsed.problem_tags) ? parsed.problem_tags : []

    const validIds = [
      'kids_deserved_better', 'voice_taken', 'pain_not_believed', 'world_losing',
      'life_not_yours', 'feeling_stupid', 'locked_out', 'work_treated_nothing',
      'left_behind', 'forgot_what_for', 'stopped_wondering', 'work_hollows',
    ]
    const filteredTags = tags.filter((t: string) => validIds.includes(t))

    return new Response(JSON.stringify({ problem_tags: filteredTags }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('classify-problem-domains error:', err)
    return new Response(JSON.stringify({ error: String(err), problem_tags: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
