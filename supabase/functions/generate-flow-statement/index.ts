// supabase/functions/generate-flow-statement/index.ts

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
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')

    const body = await req.json()
    const { quest_name, quest_branch, format_picks, themes, remarkable_angles, essence } = body

    if (!quest_name || !themes?.length) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: quest_name, themes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const themesStr = themes
      .map((t: { name: string; why?: string; description?: string }) =>
        `- ${t.name}${t.why ? `: ${t.why}` : t.description ? `: ${t.description}` : ''}`
      )
      .join('\n')

    const contextParts = [
      `Quest: ${quest_name}`,
      quest_branch ? `Branch: ${quest_branch}` : null,
      format_picks?.length ? `Dome experiences they love: ${format_picks.join(', ')}` : null,
      `Themes they picked:\n${themesStr}`,
      remarkable_angles?.length
        ? `Their remarkable angles:\n${remarkable_angles.map((a: string) => `- ${a}`).join('\n')}`
        : null,
      essence ? `Their essence: ${essence}` : null,
    ].filter(Boolean).join('\n\n')

    const systemPrompt = `You are helping someone name what they're really building with their life path. Not a business pitch. A personal truth. The thing that connects their curiosity to their path.

Examples of good flow statements:
- "Teaching people to feel alive through movement, not just exercise"
- "Making the scary parts of starting a business feel like play"
- "Helping burnt-out professionals find what they actually care about"
- "Showing people that courage is a skill you can practise, not a trait you're born with"

Rules:
- Max 20 words
- Plain language a 12-year-old would understand
- Must reference something from their themes or dome experiences
- No jargon, no buzzwords, no "empower" or "transform"
- This is personal, not corporate. "I" not "We"
- No em dashes
- If the data is thin, say what you can and flag what's missing

Respond with ONLY valid JSON: {"statement":"..."}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: 'user', content: contextParts }],
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

    if (!result.statement) {
      return new Response(
        JSON.stringify({ error: 'No statement in AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('generate-flow-statement error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
