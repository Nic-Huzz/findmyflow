/**
 * Edge Function: extract-attendees
 * Uses Claude Vision to extract attendee names/contacts from screenshots
 * of sign-up sheets, booking confirmations, WhatsApp groups, etc.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'npm:@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64, mimeType } = await req.json()

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'No image provided', attendees: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')
    })

    const systemPrompt = `You are an expert at extracting attendee information from screenshots.
The user runs workshops, retreats, and experiences. They will upload screenshots of:
- Sign-up sheets (handwritten or digital)
- Booking platform confirmations (Eventbrite, Google Forms, etc.)
- WhatsApp/Telegram group member lists
- Email threads with RSVPs
- Spreadsheets or notes with attendee names
- Payment confirmations (Stripe, bank transfer lists)

For each attendee you can identify, extract:
1. Name (first name at minimum, full name if visible)
2. Email (if visible)
3. Phone (if visible, with country code if shown)

Return your analysis as JSON in this exact format:
{
  "attendees": [
    {
      "name": "string - full name or first name",
      "email": "string|null",
      "phone": "string|null"
    }
  ],
  "source_type": "string - signup_sheet|booking_platform|whatsapp_group|email_thread|spreadsheet|payment|other",
  "total_found": number,
  "confidence": number between 0 and 1,
  "notes": "string - any relevant context about what you see"
}

Important:
- Extract every person you can identify, even if you only have a first name
- Do not invent or guess contact details, only extract what is visible
- If names are handwritten, do your best to read them
- For WhatsApp groups, extract display names (ignore phone numbers that are just numbers with no name)
- Return empty attendees array if no people can be identified`

    const message = await anthropic.messages.create({
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
                media_type: mimeType || 'image/jpeg',
                data: imageBase64
              }
            },
            {
              type: 'text',
              text: 'Extract all attendee names and contact information from this screenshot.'
            }
          ]
        }
      ],
      system: systemPrompt
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    let analysis
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseErr) {
      console.error('Failed to parse AI response:', parseErr)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Could not read attendee data from this screenshot. Try a clearer image.',
          attendees: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        attendees: analysis.attendees || [],
        source_type: analysis.source_type || 'other',
        total_found: analysis.total_found || analysis.attendees?.length || 0,
        confidence: analysis.confidence || 0.8,
        notes: analysis.notes || '',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('extract-attendees error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message, attendees: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
