/**
 * Edge Function: extract-revenue
 * Uses Claude Vision to extract revenue/payment amounts from screenshots
 * of payment apps, bank transfers, ticket sales dashboards, etc.
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
        JSON.stringify({ success: false, error: 'No image provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')
    })

    const systemPrompt = `You are an expert at extracting revenue and payment information from screenshots.
The user runs workshops, retreats, and experiences. They will upload screenshots of:
- Payment app summaries (GoPay, OVO, Dana, Wise, PayPal, Venmo, bank apps)
- Bank transfer confirmations
- Ticket platform dashboards (Eventbrite, Luma, etc.)
- Spreadsheets with revenue totals
- Handwritten cash records
- Invoice summaries
- POS/card reader reports

Extract the TOTAL revenue amount. If there are multiple payments, sum them.

Return your analysis as JSON in this exact format:
{
  "amount": number (the total revenue as a number, no currency symbols),
  "currency": "string - detected currency code (IDR, USD, AUD, EUR, GBP, etc.)",
  "confidence": number between 0 and 1,
  "notes": "string - what you see (e.g. '12 tickets at 300K each' or 'bank transfer total')",
  "line_items": [
    { "description": "string", "amount": number }
  ]
}

Important:
- Extract the TOTAL amount, not individual line items (though list line items if visible)
- Convert shorthand: "300K" = 300000, "4.2M" = 4200000, "4.2jt" = 4200000
- If multiple currencies visible, use the primary/total one
- If you cannot determine an amount, return amount: null with a helpful notes field
- Do not guess amounts. Only extract what is clearly visible`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
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
              text: 'Extract the total revenue/payment amount from this screenshot.'
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
        JSON.stringify({ success: false, error: 'Could not read amount from this screenshot. Try a clearer image.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        amount: analysis.amount,
        currency: analysis.currency || null,
        confidence: analysis.confidence || 0.8,
        notes: analysis.notes || '',
        line_items: analysis.line_items || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('extract-revenue error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
