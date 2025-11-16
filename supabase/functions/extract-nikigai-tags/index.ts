// Supabase Edge Function: Extract Nikigai Tags
// Calls Claude API to extract tags from user responses

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const DECISION_TREE_PROMPT = `
Extract MULTIPLE RELATED TAGS from EACH bullet point to enable semantic clustering.

Use these tag types:
1. skill_verb — ALL related actions (use -ing form: designing, creating, building)
2. domain_topic — ALL related fields/subjects (UX, design, digital media)
3. value — principles (integrity, growth, connection)
4. emotion — feelings (joy, fear, excitement)
5. context — situations (remote work, team settings)
6. problem_theme — challenges (burnout, disconnection)
7. persona_hint — specific groups (parents, creatives, professionals)

CRITICAL: Extract MULTIPLE verbs and topics to capture semantic meaning!

EXAMPLES:
- "Creating digital art"
  → skill_verb: [creating, making, designing, producing]
  → domain_topic: [digital art, art, design, visual media, creativity]

- "Playing in the playground"
  → skill_verb: [playing, running, moving, exercising]
  → domain_topic: [recreation, physical activity, sports, outdoor activities, play]

- "Writing"
  → skill_verb: [writing, creating, producing, crafting]
  → domain_topic: [writing, content creation, literature, communication]

- "Building businesses"
  → skill_verb: [building, creating, developing, founding]
  → domain_topic: [entrepreneurship, business, startups, business development]

- "Running around"
  → skill_verb: [running, moving, exercising]
  → domain_topic: [physical activity, sports, fitness, exercise]

Return ONLY valid JSON (no markdown, no explanation):
{
  "bullets": [
    {
      "text": "bullet text here",
      "tags": {
        "skill_verb": ["verb1", "verb2", "verb3"],
        "domain_topic": ["topic1", "topic2", "topic3"],
        "value": [],
        "emotion": [],
        "context": [],
        "problem_theme": [],
        "persona_hint": []
      }
    }
  ]
}

Each bullet gets its own tags. Include 3-5 related verbs and 3-5 related topics per item to enable good clustering.
`

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    // Parse request body
    const { response, context } = await req.json()

    if (!response || response.trim().length === 0) {
      return new Response(
        JSON.stringify({
          bullets: []
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `${DECISION_TREE_PROMPT}\n\nUser response: "${response}"`
        }]
      })
    })

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API error status:', claudeResponse.status)
      console.error('Claude API error body:', errorText)
      console.error('API key present:', !!ANTHROPIC_API_KEY)
      console.error('API key length:', ANTHROPIC_API_KEY?.length)
      throw new Error(`Claude API error ${claudeResponse.status}: ${errorText}`)
    }

    const claudeData = await claudeResponse.json()
    const extractedText = claudeData.content[0].text

    // Parse JSON from Claude's response
    let result
    try {
      // Try to extract JSON from response (in case Claude adds markdown formatting)
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        result = JSON.parse(extractedText)
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', extractedText)
      throw new Error('Invalid JSON response from Claude')
    }

    // Ensure all bullets have complete tag structure
    const bullets = (result.bullets || []).map((bullet: any) => ({
      text: bullet.text,
      tags: {
        skill_verb: bullet.tags?.skill_verb || [],
        domain_topic: bullet.tags?.domain_topic || [],
        value: bullet.tags?.value || [],
        emotion: bullet.tags?.emotion || [],
        context: bullet.tags?.context || [],
        problem_theme: bullet.tags?.problem_theme || [],
        persona_hint: bullet.tags?.persona_hint || []
      }
    }))

    // Return extracted tags per bullet
    return new Response(
      JSON.stringify({
        bullets: bullets,
        raw_response: extractedText,
        model: 'claude-3-haiku-20240307'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Error in extract-nikigai-tags:', error)

    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        bullets: []
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
