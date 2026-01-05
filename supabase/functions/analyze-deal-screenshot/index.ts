// Supabase Edge Function: Analyze Deal Screenshot
// Uses Claude Vision to extract deal details from conversation screenshots

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExtractedDeal {
  contact_name: string | null
  contact_email: string | null
  product_interest: string | null
  estimated_value: number | null
  suggested_stage: 'lead' | 'discovery' | 'proposal'
  lead_temperature: 'cold' | 'warm' | 'hot'
  key_points: string[]
  pain_indicators: string[]
  urgency_level: number // 1-10
  notes: string
  confidence: number // 0-1
  platform_detected: string | null
}

async function analyzeScreenshot(imageBase64: string, mimeType: string): Promise<ExtractedDeal> {
  const prompt = `You are a sales CRM assistant analyzing a screenshot of a conversation (DM, email, text, etc).

Extract ALL relevant deal information from this image. Be thorough but only extract what you can actually see.

IMPORTANT RULES:
1. Only extract information you can clearly see in the image
2. If you can't see something clearly, set it to null
3. For contact_name, look for:
   - Profile names/handles
   - Signatures
   - "From:" fields
   - How they sign off
4. For product_interest, infer what they might be interested in based on the conversation
5. For estimated_value, only provide if pricing is discussed, otherwise null
6. For suggested_stage:
   - "lead" = Initial contact, just exploring
   - "discovery" = Active discussion, asking questions
   - "proposal" = Ready to buy, discussing terms
7. For lead_temperature:
   - "cold" = Skeptical, many objections, not engaged
   - "warm" = Interested, asking questions, engaged
   - "hot" = Ready to buy, urgent, very interested
8. For urgency_level (1-10):
   - 1-3 = No rush, just browsing
   - 4-6 = Interested but not urgent
   - 7-10 = Needs solution soon, time-sensitive
9. For platform_detected: Instagram, WhatsApp, Email, LinkedIn, Facebook, iMessage, SMS, Slack, etc.

Look for:
- Pain points they mention (problems, frustrations, challenges)
- Questions they ask
- Objections or concerns
- Timeline mentions
- Budget mentions
- Interest signals
- Competitor mentions

Return ONLY valid JSON with this exact structure:
{
  "contact_name": "string or null",
  "contact_email": "string or null",
  "product_interest": "what they seem interested in or null",
  "estimated_value": number or null,
  "suggested_stage": "lead" | "discovery" | "proposal",
  "lead_temperature": "cold" | "warm" | "hot",
  "key_points": ["array", "of", "key", "conversation", "points"],
  "pain_indicators": ["specific", "pain", "points", "mentioned"],
  "urgency_level": 1-10,
  "notes": "Summary of the conversation and any relevant context for follow-up",
  "confidence": 0.0-1.0,
  "platform_detected": "string or null"
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
      max_tokens: 2000,
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
    // Clean up potential markdown formatting
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleanedText)
  } catch (e) {
    console.error('JSON parse error:', e, 'Raw text:', text.substring(0, 500))
    // Return a default structure with the raw text as notes
    return {
      contact_name: null,
      contact_email: null,
      product_interest: null,
      estimated_value: null,
      suggested_stage: 'lead',
      lead_temperature: 'warm',
      key_points: [],
      pain_indicators: [],
      urgency_level: 5,
      notes: `Could not parse AI response. Raw response: ${text.substring(0, 200)}`,
      confidence: 0,
      platform_detected: null
    }
  }
}

// Match screenshot to existing deals
async function suggestMatchingDeals(extracted: ExtractedDeal, existingDeals: any[]): Promise<any[]> {
  if (!existingDeals || existingDeals.length === 0) {
    return []
  }

  const matches: any[] = []

  for (const deal of existingDeals) {
    let score = 0

    // Name match (fuzzy)
    if (extracted.contact_name && deal.contact_name) {
      const extractedName = extracted.contact_name.toLowerCase()
      const dealName = deal.contact_name.toLowerCase()
      if (dealName.includes(extractedName) || extractedName.includes(dealName)) {
        score += 50
      }
    }

    // Email match (exact)
    if (extracted.contact_email && deal.contact_email) {
      if (extracted.contact_email.toLowerCase() === deal.contact_email.toLowerCase()) {
        score += 100
      }
    }

    // Product interest match
    if (extracted.product_interest && deal.product_type) {
      const interest = extracted.product_interest.toLowerCase()
      const product = deal.product_type.toLowerCase()
      if (interest.includes(product) || product.includes(interest)) {
        score += 25
      }
    }

    if (score > 0) {
      matches.push({
        deal,
        matchScore: score,
        matchReasons: []
      })
    }
  }

  // Sort by match score descending
  return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3)
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action, imageBase64, mimeType, existingDeals } = body

    console.log(`📥 analyze-deal-screenshot action: ${action}`)

    if (!imageBase64) {
      throw new Error('imageBase64 is required')
    }

    if (!mimeType) {
      throw new Error('mimeType is required (e.g., image/jpeg, image/png)')
    }

    // Validate mime type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validMimeTypes.includes(mimeType)) {
      throw new Error(`Invalid mime type: ${mimeType}. Supported: ${validMimeTypes.join(', ')}`)
    }

    // Analyze the screenshot
    const extracted = await analyzeScreenshot(imageBase64, mimeType)

    // Find matching existing deals if provided
    let matchingDeals: any[] = []
    if (existingDeals && existingDeals.length > 0) {
      matchingDeals = await suggestMatchingDeals(extracted, existingDeals)
    }

    return new Response(
      JSON.stringify({
        extracted,
        matchingDeals,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error in analyze-deal-screenshot:', error)
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
