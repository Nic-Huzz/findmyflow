// Supabase Edge Function: Classify Response
// Classifies user responses into predefined wheel segments using Claude AI

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { getSegmentsForWheel } from './taxonomy.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

interface ClassificationRequest {
  response: string;
  wheelType: 'skills' | 'problems' | 'persona';
  context?: string; // Optional additional context about the flow step
}

interface SegmentMatch {
  id: string;
  confidence: number;
}

interface ClassificationResult {
  segments: SegmentMatch[];
  primarySegment: string | null;
  problemType?: string; // For problem wheel
  ring?: string; // For maturity/journey stage inference
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const { response, wheelType, context }: ClassificationRequest = await req.json()

    if (!response || !wheelType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: response, wheelType' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const segments = getSegmentsForWheel(wheelType)
    const segmentList = segments
      .map(s => `- ${s.id}: ${s.keywords.join(', ')}`)
      .join('\n')

    // Build the classification prompt
    let systemPrompt = `You are a precise classifier that maps user responses to predefined categories.
Your job is to identify which predefined segments best match the user's response.

RULES:
1. Match based on semantic meaning, not just keywords
2. A response can match 1-3 segments
3. Assign confidence scores (0.0 to 1.0) based on how well it matches
4. If nothing matches well, return empty array
5. The primarySegment should be the highest confidence match

IMPORTANT: Return ONLY valid JSON, no explanation.`

    let userPrompt = `Classify this ${wheelType} response into the predefined categories.

USER RESPONSE: "${response}"

${context ? `CONTEXT: ${context}\n` : ''}
CATEGORIES:
${segmentList}

Return JSON format:
{
  "segments": [
    { "id": "segment_id", "confidence": 0.9 }
  ],
  "primarySegment": "segment_id"
}`

    // Add problem type classification for problem wheel
    if (wheelType === 'problems') {
      userPrompt += `

Also identify the PROBLEM TYPE from these options:
- access: They can't get what they need
- knowledge: They don't know how
- capability: They lack the skills
- motivation: They can't make themselves do it
- connection: They're isolated
- system: They're trapped by structures

Add "problemType": "type_id" to your response.`
    }

    // Add journey/maturity ring for applicable wheels
    if (wheelType === 'persona') {
      userPrompt += `

Also identify the JOURNEY STAGE from these options:
- awakening: Just realized they have this problem
- struggling: Actively trying to solve, hitting walls
- ready: Have budget, urgency, seeking solution

Add "ring": "stage_id" to your response.`
    }

    if (wheelType === 'skills') {
      userPrompt += `

Also infer the SKILL MATURITY from context:
- emerging: Beginning to develop
- proficient: Competent and growing
- mastery: Expert level, can teach others

Add "ring": "maturity_id" to your response.`
    }

    // Call Claude API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Fast and cheap for classification
        max_tokens: 300,
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

    // Parse the JSON response
    let result: ClassificationResult
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      result = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse response:', responseText)
      // Return empty result on parse failure
      result = {
        segments: [],
        primarySegment: null,
      }
    }

    // Validate and normalize the result
    const validSegmentIds = segments.map(s => s.id)
    result.segments = (result.segments || []).filter(
      s => validSegmentIds.includes(s.id) && s.confidence > 0.3
    )

    // Sort by confidence
    result.segments.sort((a, b) => b.confidence - a.confidence)

    // Ensure primarySegment is valid
    if (!result.primarySegment || !validSegmentIds.includes(result.primarySegment)) {
      result.primarySegment = result.segments[0]?.id || null
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Classification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
