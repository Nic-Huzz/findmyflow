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
    const { prompt, count } = await req.json()
    if (!prompt) throw new Error('Missing prompt')

    // Clamp count to 1-5 to prevent abuse
    const safeCount = Math.min(Math.max(1, Number(count) || 1), 5)

    // When count > 1, ask for multiple options separated by |||
    const multiPrompt = safeCount > 1
      ? `${prompt}\n\nIMPORTANT: Write exactly ${safeCount} different options. Each should take a different angle or framing. Separate each option with ||| on its own line. Do not number them or add any labels. Just the statements separated by |||.`
      : prompt

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: safeCount > 1 ? 1200 : 300,
        messages: [{ role: 'user', content: multiPrompt }],
      }),
    })

    const data = await response.json()
    const raw = data?.content?.[0]?.text?.trim() || ''

    // Parse multiple options if count > 1
    if (safeCount > 1) {
      const options = raw.split('|||').map((s: string) => s.trim()).filter((s: string) => s.length > 10)
      return new Response(
        JSON.stringify({ statement: options[0] || raw, options }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ statement: raw }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
