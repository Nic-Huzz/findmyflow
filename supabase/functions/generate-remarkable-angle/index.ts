import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RemarkableRequest {
  wound_problem: string
  rule_identified: string
  combination_insight: string
  extreme_action_plan: string
  user_name?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: any = await req.json()
    const { wound_problem, rule_identified, combination_insight, extreme_action_plan, user_name, generate_taglines } = body

    // Tagline-only mode
    if (generate_taglines && rule_identified) {
      const taglinePrompt = `Generate 4 short taglines (2-4 words each) that capture this rule break.

The problem: "${wound_problem}"
The contrast: "${rule_identified}"

Examples of great taglines: "Healing but Fun", "Start with Why", "Atomic Habits", "Find What Feels Good"

Rules:
- Each tagline should be 2-4 words
- No em dashes, semicolons, or double hyphens
- Should feel like a brand name or movement name
- Should capture the CONTRAST (the opposite of how the world currently does it)

Return ONLY valid JSON: {"taglines": ["...", "...", "...", "..."]}`

      const taglineResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 200,
          messages: [{ role: 'user', content: taglinePrompt }],
        }),
      })
      const taglineData = await taglineResponse.json()
      const taglineText = taglineData.content?.[0]?.text || '{"taglines":[]}'
      try {
        const parsed = JSON.parse(taglineText.replace(/```json\n?|\n?```/g, '').trim())
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch {
        return new Response(JSON.stringify({ taglines: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    if (!rule_identified || !combination_insight || !extreme_action_plan) {
      throw new Error('All three inputs are required')
    }

    const prompt = `You help experience creators find their remarkable angle. A user answered 4 questions about their project${user_name ? ` called "${user_name}"` : ''}. Your job is to extract insights and generate copy from their raw answers.

THE USER'S 4 ANSWERS:

1. The problem they solve: "${wound_problem}"
2. The assumption everyone follows that they think is wrong: "${rule_identified}"
3. The experience that showed them the assumption was wrong: "${combination_insight}"
4. How they solve it differently: "${extreme_action_plan}"

Generate two things:

1. RULE STATEMENT: Synthesize answers 1 + 2 into one punchy sentence that captures the rule they break. Written as a universal truth their audience would rally around. Not "I believe..." but a declaration. Like "You don't change by learning, you change by being in your discomfort zone" or "The question is never why the addiction, but why the pain." The statement should reject the assumption (answer 2) and point toward their solution (answer 4).

2. REMARKABLE BIO: 2-3 sentences written in the style of gossip, not credentials. Lead with the surprising thing from their experience (answer 3). Follow with what they do differently (answer 4). Close with the mission. No credential lists. No superlatives. Written as something you'd text a friend: "You HAVE to hear about this person." Use specific details from their answers, do NOT invent facts they didn't share.

Rules:
- NEVER use em dashes, semicolons, or double hyphens
- Use commas, full stops, or rephrase instead
- Be direct and concrete, not inspirational or vague
- The rule statement should make someone say "YES, finally someone said it"
- The bio should make someone say "wait, what?"
- ONLY use facts the user provided. Do not invent specific numbers, stories, or details they didn't share.

Return ONLY valid JSON:
{
  "rule_statement": "...",
  "remarkable_bio": "..."
}`

    console.log('generate-remarkable-angle: synthesizing')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || '{}'

    let result
    try {
      result = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
    } catch {
      result = {
        rule_statement: rule_identified,
        remarkable_bio: `${combination_insight}. ${extreme_action_plan}.`,
        tribe_statement: `People who believe ${rule_identified.toLowerCase()}.`,
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in generate-remarkable-angle:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
