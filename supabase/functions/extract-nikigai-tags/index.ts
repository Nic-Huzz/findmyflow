// Supabase Edge Function: Extract Nikigai Tags
// Calls Claude API to extract tags from user responses

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const DECISION_TREE_PROMPT = `
Extract tags from this user response.

Use these tag types:
1. skill_verb — actions (use -ing form: designing, teaching)
2. domain_topic — fields/subjects (UX, education, psychology)
3. value — principles (integrity, growth, connection)
4. emotion — feelings (joy, fear, excitement)
5. context — situations (remote work, team settings)
6. problem_theme — challenges (burnout, disconnection)
7. persona_hint — specific groups (parents, creatives, professionals)

DECISION RULES:
- Action words → skill_verb (use verb form)
- Fields/subjects → domain_topic
- Principles/beliefs → value
- Temporary feelings → emotion
- Recurring challenges → problem_theme
- Working conditions → context
- Specific groups of people → persona_hint

EXAMPLES:
- "I love creating digital art" → skill_verb: [creating], domain_topic: [digital art]
- "Helping burned-out teachers" → persona_hint: [burned-out teachers], problem_theme: [teacher burnout]
- "Purpose drives me" → value: [purpose]

Return ONLY valid JSON (no markdown, no explanation):
{
  "skill_verb": ["verb1", "verb2"],
  "domain_topic": ["topic1"],
  "value": ["value1"],
  "emotion": [],
  "context": [],
  "problem_theme": [],
  "persona_hint": []
}

Only include tags that clearly appear in the response. Empty arrays are fine.
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
          tags: {
            skill_verb: [],
            domain_topic: [],
            value: [],
            emotion: [],
            context: [],
            problem_theme: [],
            persona_hint: []
          }
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
    let tags
    try {
      // Try to extract JSON from response (in case Claude adds markdown formatting)
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        tags = JSON.parse(jsonMatch[0])
      } else {
        tags = JSON.parse(extractedText)
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', extractedText)
      throw new Error('Invalid JSON response from Claude')
    }

    // Ensure all expected keys exist
    const completeTags = {
      skill_verb: tags.skill_verb || [],
      domain_topic: tags.domain_topic || [],
      value: tags.value || [],
      emotion: tags.emotion || [],
      context: tags.context || [],
      problem_theme: tags.problem_theme || [],
      persona_hint: tags.persona_hint || []
    }

    // Return extracted tags
    return new Response(
      JSON.stringify({
        tags: completeTags,
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
        tags: {
          skill_verb: [],
          domain_topic: [],
          value: [],
          emotion: [],
          context: [],
          problem_theme: [],
          persona_hint: []
        }
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
