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
    const { pathName, existingTasks } = await req.json()

    if (!pathName) throw new Error('Path name required')

    const existingSection = existingTasks?.length
      ? `\nThe user already has these tasks for this path (don't duplicate them):\n${existingTasks.map((t: string) => `- ${t}`).join('\n')}`
      : ''

    const prompt = `Someone is pursuing a life path called "${pathName}". They want to log progress they made BEFORE using this app.

Suggest 5-8 common milestones someone pursuing this path might have already completed. These should be concrete, specific achievements — not vague aspirations.
${existingSection}
GUIDELINES:
- Think about what someone does in the first 1-3 years of pursuing this path
- Include a mix: learning/research milestones, first attempts, small wins, bigger commitments
- Order from earliest/easiest to latest/hardest
- Keep each milestone to one short sentence
- Make them feel achievable and real, not aspirational

Respond ONLY as JSON:
{"milestones": ["milestone 1", "milestone 2", ...]}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
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
    console.error('suggest-milestones error:', err)
    return new Response(JSON.stringify({ error: err.message, milestones: [] }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
