// supabase/functions/generate-passion-challenge/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const STRIKE_SHAPES: Record<string, string> = {
  fight: 'CHALLENGE THE NORM: Declare a position. Say what nobody in this field is saying. Make people pick a side. Example: "What if you posted why you think X is wrong?"',
  stunt: 'MAKE THEM LOOK TWICE: Do something unexpected and pattern-breaking. Make people say "wait, what?" Example: "What if you did X in an unexpected place/way?"',
  functional: 'LET THEM FEEL IT: Prove it works by doing it live. Give people a real taste of the result. Example: "What if you gave 5 people a free session and filmed their before/after?"',
  culture_creating: 'START A RITUAL: Create something repeatable that spreads. Something people identify with and come back to. Example: "What if you committed to running X every week for 4 weeks?"',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')

    const body = await req.json()
    const {
      strike_type, target_dimensions, experience_labels, revenue_pattern,
      business_stage, dimension_gaps, completed_count, quest_label,
      money_filter, money_model_position,
    } = body

    if (!strike_type || !dimension_gaps) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: strike_type, dimension_gaps' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const experienceStr = experience_labels?.length
      ? experience_labels.slice(0, 3).join(', ')
      : quest_label || 'this path'

    const targetDimLines = (target_dimensions || Object.keys(dimension_gaps))
      .filter((d: string) => dimension_gaps[d])
      .map((dim: string) => {
        const g = dimension_gaps[dim]
        return `${dim}: currently ${g.actual}, dream ${g.dream} (gap: ${g.gap})`
      })
      .join('\n')

    if (!targetDimLines) {
      return new Response(
        JSON.stringify({ error: 'No matching dimensions found in dimension_gaps' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const strikeShape = STRIKE_SHAPES[strike_type] || STRIKE_SHAPES.fight

    let moneyRules = ''
    if (money_filter && money_model_position) {
      moneyRules = `
MONEY RULES (money is a target dimension):
- The challenge MUST push toward the NEXT offer shape, not just "do more of the same."
- Current money model: ${money_model_position.current_tier} (${money_model_position.current_deal_size})
- Next money model: ${money_model_position.next_tier} (${money_model_position.next_deal_size})
- The word "charge", "sell", "price", or "pay" MUST appear in the challenge.
- GOOD: "What if you bundled 4 sessions into a program and charged $297?"
- BAD: "What if you had coffee with someone and told them about your idea?"`
    } else if (!money_filter) {
      moneyRules = `
MONEY RULES: Do NOT mention pricing, charging, selling, or money. This user has not chosen money as a comfort zone goal.`
    } else {
      // money_filter true but no position data — still enforce the word requirement
      moneyRules = `
MONEY RULES: This user wants to push their money comfort zone. The word "charge", "sell", "price", or "pay" MUST appear in the challenge.`
    }

    const systemPrompt = `You write courage challenge recommendations for a personal development app.

Write ONE courage challenge that matches the STRIKE TYPE and stretches the user's comfort zone on the TARGET DIMENSIONS.

STRIKE TYPE:
${strikeShape}

The strike type sets the SHAPE. The target dimensions set the INTENSITY and SPECIFICS. Stay within the strike type shape.

RULES:
- Start with "What if you..." Never use "You should" or "Try to" or "Consider".
- Write so a 12-year-old understands. No jargon. No em dashes.
- The challenge must be specific to their experience AND target the gap dimensions.
- Challenge: under 30 words. One concrete, specific action they could do this week.
- Permission: under 20 words. Why this matters for their path. Acknowledge what they want, not what they lack.
- Closer: under 20 words. Reassurance that this is reversible and safe to try.
- Stretches: list 2-3 dimension IDs this challenge pushes.
${moneyRules}

Respond with ONLY valid JSON, no other text:
{"challenge":"What if you...","permission":"...","closer":"...","stretches":["dim1","dim2"]}`

    const userPrompt = `QUEST: "${quest_label}"
EXPERIENCES: ${experienceStr}
REVENUE PATTERN: ${revenue_pattern}
BUSINESS STAGE: ${business_stage} (${completed_count} courage challenges completed so far)

TARGET DIMENSIONS (focus the challenge on these):
${targetDimLines}

Generate one courage challenge.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
    }

    const apiData = await response.json()
    const responseText = apiData.content?.[0]?.text || '{}'

    let result
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      result = JSON.parse(jsonMatch[0])
    } catch {
      console.error('Failed to parse response:', responseText)
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!result.challenge || !result.permission || !result.closer) {
      return new Response(
        JSON.stringify({ error: 'Incomplete AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('generate-passion-challenge error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
