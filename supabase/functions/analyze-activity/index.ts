// Supabase Edge Function: Analyze Activity
// Extracts key points from screenshots and transcribes voice notes for sales activities

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ActivityAnalysis {
  keyPoints: string[]
  summary: string
  suggestedFollowUp: string | null
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  nextAction: string | null
  transcription?: string
}

interface DealContext {
  contact_name: string
  product_type: string
  status: string
  value: number
  notes?: string
}

/**
 * Analyze a screenshot of a conversation (text/email)
 */
async function analyzeScreenshot(
  imageBase64: string,
  mimeType: string,
  activityType: string,
  dealContext: DealContext
): Promise<ActivityAnalysis> {
  const contextStr = `
Contact: ${dealContext.contact_name}
Product: ${dealContext.product_type}
Stage: ${dealContext.status}
Value: $${dealContext.value}
${dealContext.notes ? `Previous Notes: ${dealContext.notes}` : ''}
`.trim()

  const prompt = `You are a sales assistant analyzing a screenshot of a ${activityType === 'text' ? 'text/DM conversation' : 'email'}.

DEAL CONTEXT:
${contextStr}

Analyze this conversation and extract:
1. KEY POINTS - The most important things discussed (max 5 bullet points)
2. SUMMARY - A brief 1-2 sentence summary of the exchange
3. SENTIMENT - How is the prospect feeling? (positive, neutral, negative, mixed)
4. NEXT ACTION - What should the salesperson do next?
5. FOLLOW-UP DATE - When should they follow up? (ISO date string if you can infer, null if unclear)

Focus on:
- Buying signals or objections
- Questions asked
- Commitments made
- Timeline mentions
- Price/budget discussions
- Concerns or hesitations

Return ONLY valid JSON:
{
  "keyPoints": ["point 1", "point 2", ...],
  "summary": "brief summary",
  "sentiment": "positive|neutral|negative|mixed",
  "nextAction": "recommended next step or null",
  "suggestedFollowUp": "YYYY-MM-DD or null"
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imageBase64
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Anthropic API error:', errorText)
    throw new Error(`Anthropic API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleanedText)
  } catch (e) {
    console.error('JSON parse error:', e)
    return {
      keyPoints: ['Could not parse conversation details'],
      summary: text.substring(0, 200),
      sentiment: 'neutral',
      nextAction: null,
      suggestedFollowUp: null
    }
  }
}

/**
 * Transcribe and analyze a voice note about a call
 * Note: For now we'll use Claude to analyze the audio description
 * In production, you'd use Whisper or another transcription service
 */
async function transcribeVoiceNote(
  audioBase64: string,
  mimeType: string,
  dealContext: DealContext
): Promise<ActivityAnalysis> {
  // Claude doesn't directly transcribe audio, but we can still process it
  // For now, we'll return a helpful response asking user to type notes
  // In production, integrate with Whisper API or similar

  const contextStr = `
Contact: ${dealContext.contact_name}
Product: ${dealContext.product_type}
Stage: ${dealContext.status}
Value: $${dealContext.value}
`.trim()

  // For MVP, we'll simulate transcription with a text-based approach
  // This would be replaced with actual audio transcription in production
  const prompt = `You are a sales assistant helping log a phone call.

DEAL CONTEXT:
${contextStr}

The user has recorded a voice note describing their call. Based on typical sales calls at this stage (${dealContext.status}), suggest:

1. What key points they should capture
2. A template summary they can edit
3. Recommended follow-up timing for ${dealContext.status} stage deals

Return ONLY valid JSON:
{
  "transcription": "Voice transcription not available - please type your notes",
  "keyPoints": ["Suggested point to capture 1", "Suggested point to capture 2", "Suggested point to capture 3"],
  "summary": "Template: Called [contact] to discuss [topic]. They [response]. Next step: [action].",
  "sentiment": "neutral",
  "nextAction": "Recommended next action based on stage",
  "suggestedFollowUp": "YYYY-MM-DD based on stage"
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Anthropic API error:', errorText)
    throw new Error(`Anthropic API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || '{}'

  try {
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim()
    const result = JSON.parse(cleanedText)

    // Calculate suggested follow-up date based on stage
    if (!result.suggestedFollowUp) {
      const daysToAdd = {
        lead: 3,
        qualified: 2,
        booked: 1,
        showed: 1,
        pitched: 2,
        follow_up: 3,
      }[dealContext.status] || 3

      const followUp = new Date()
      followUp.setDate(followUp.getDate() + daysToAdd)
      result.suggestedFollowUp = followUp.toISOString().split('T')[0]
    }

    return result
  } catch (e) {
    console.error('JSON parse error:', e)

    // Provide sensible defaults
    const followUp = new Date()
    followUp.setDate(followUp.getDate() + 3)

    return {
      transcription: 'Voice transcription not available - please type your notes',
      keyPoints: [
        'What was discussed?',
        'What was their response?',
        'What are the next steps?'
      ],
      summary: `Called ${dealContext.contact_name} about ${dealContext.product_type}. [Add details]`,
      sentiment: 'neutral',
      nextAction: 'Follow up as planned',
      suggestedFollowUp: followUp.toISOString().split('T')[0]
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action, imageBase64, audioBase64, mimeType, activityType, dealContext } = body

    console.log(`📥 analyze-activity action: ${action}`)

    if (!dealContext) {
      throw new Error('dealContext is required')
    }

    let result: ActivityAnalysis

    if (action === 'screenshot') {
      if (!imageBase64) {
        throw new Error('imageBase64 is required for screenshot analysis')
      }
      if (!mimeType) {
        throw new Error('mimeType is required')
      }
      result = await analyzeScreenshot(imageBase64, mimeType, activityType, dealContext)
    } else if (action === 'voice') {
      if (!audioBase64) {
        throw new Error('audioBase64 is required for voice analysis')
      }
      result = await transcribeVoiceNote(audioBase64, mimeType || 'audio/webm', dealContext)
    } else {
      throw new Error(`Unknown action: ${action}. Use 'screenshot' or 'voice'`)
    }

    return new Response(
      JSON.stringify({
        ...result,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error in analyze-activity:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
