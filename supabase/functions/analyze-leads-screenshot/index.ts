/**
 * Edge Function: analyze-leads-screenshot
 * Uses Claude Vision to extract lead information from DM/comments screenshots
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'npm:@anthropic-ai/sdk@0.24.3'

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
    const { imageBase64, mimeType, platform } = await req.json()

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'No image provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')
    })

    const systemPrompt = `You are an expert at analyzing social media screenshots to extract lead information.
Your task is to identify potential leads from DM conversations, comments, or engagement screenshots.

For each lead you identify, extract:
1. Name or handle (username)
2. Platform (Instagram, LinkedIn, Facebook, TikTok, X/Twitter, etc.)
3. Engagement type (dm, comment, like, story_reply, mention, etc.)
4. Any message content or context visible
5. Lead temperature based on engagement (hot, warm, cold)
6. Any visible contact info (email, phone - rare but possible)

Return your analysis as JSON in this exact format:
{
  "leads": [
    {
      "name": "string - name or @handle",
      "platform": "string - detected platform",
      "handle": "string - @username if visible",
      "engagement_type": "string - dm|comment|like|story_reply|mention|other",
      "message_preview": "string - first 100 chars of visible message",
      "temperature": "hot|warm|cold",
      "email": "string|null",
      "phone": "string|null",
      "notes": "string - any additional context"
    }
  ],
  "platform_detected": "string - the social platform shown",
  "screenshot_type": "string - dms|comments|notifications|likes|followers|other",
  "total_leads_found": number,
  "confidence": number between 0 and 1
}

Important:
- Focus on identifying real people who showed interest
- Hot = direct message asking about services/products, scheduling call, asking for help
- Warm = engaged multiple times, replied to story, commented meaningfully
- Cold = single like, generic comment, passive engagement
- Extract @handles when visible
- If no leads are visible, return empty leads array`

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
              text: platform
                ? `Analyze this ${platform} screenshot and extract all potential leads.`
                : 'Analyze this social media screenshot and extract all potential leads.'
            }
          ]
        }
      ],
      system: systemPrompt
    })

    // Parse the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from response
    let analysis
    try {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseErr) {
      console.error('Failed to parse AI response:', parseErr)
      console.log('Raw response:', responseText)

      // Return a structured error response
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to parse lead data from screenshot',
          raw_response: responseText.substring(0, 500)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        leads: analysis.leads || [],
        platform_detected: analysis.platform_detected,
        screenshot_type: analysis.screenshot_type,
        total_leads_found: analysis.total_leads_found || analysis.leads?.length || 0,
        confidence: analysis.confidence || 0.8
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error analyzing leads screenshot:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to analyze screenshot'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
