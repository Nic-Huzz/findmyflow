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
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { cluster_label, cluster_type, original_items, challenge_outcomes } = await req.json()

    if (!cluster_label) throw new Error('cluster_label required')

    const itemsList = (original_items || []).map((i: any) => typeof i === 'string' ? i : i.text).join(', ')
    const outcomesList = (challenge_outcomes || []).map((o: any) =>
      `- "${o.title}" (felt: ${o.classification}${o.identity_statement ? `, identity: "${o.identity_statement}"` : ''})`
    ).join('\n')

    const prompt = `You are updating a self-knowledge cluster based on new behavioral evidence.

ORIGINAL CLUSTER:
Name: ${cluster_label}
Type: ${cluster_type}
Items that created it: ${itemsList || 'none recorded'}

RECENT EVIDENCE (${(challenge_outcomes || []).length} courage challenges completed):
${outcomesList || 'none'}

Based on this evidence, the cluster may need refining. The user has been actively living this part of their identity through these challenges.

Return JSON only:
{
  "evolved_label": "Updated cluster name that reflects who they're BECOMING, not just who they were",
  "evolved_insight": "One paragraph explaining what the challenges revealed about this part of who they are",
  "evolution_reason": "One sentence explaining the shift",
  "confidence": 0.0-1.0
}

Rules:
- Only change the label if the evidence genuinely shifts the meaning
- If confidence < 0.6, return the original label unchanged
- The new label should feel like growth, not correction
- The insight should reference specific challenge evidence
- Write so a 12-year-old would understand`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const result = await response.json()
    const text = result.content?.[0]?.text || '{}'
    const match = text.match(/\{[\s\S]*\}/s)
    const parsed = match ? JSON.parse(match[0]) : { evolved_label: cluster_label, confidence: 0 }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('regenerate-cluster error:', err)
    return new Response(JSON.stringify({ error: err.message, evolved_label: null, confidence: 0 }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
