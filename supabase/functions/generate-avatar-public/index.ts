import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Simple in-memory rate limiter (per IP, resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 3 // max generations per window
const RATE_WINDOW = 60 * 60 * 1000 // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
      || 'unknown'

    if (!checkRateLimit(ip)) {
      return jsonResponse({ error: 'Rate limit exceeded. Try again later.' }, 429)
    }

    // Parse request — accepts base64 image data directly (no storage URL needed)
    let imageBase64: string | undefined
    try {
      const body = await req.json()
      imageBase64 = body.image_base64
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400)
    }

    if (!imageBase64) {
      return jsonResponse({ error: 'Missing image_base64' }, 400)
    }

    // Validate it looks like base64 image data (basic check)
    if (imageBase64.length > 10_000_000) {
      return jsonResponse({ error: 'Image too large. Max 7MB.' }, 400)
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      console.error('OPENAI_API_KEY not configured')
      return jsonResponse({ error: 'Image generation is not configured' }, 500)
    }

    // Build the data URI for OpenAI
    const dataUri = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`

    const prompt = `Create a Pixar-style 3D animated hero avatar of this person. Make them look heroic, confident, and radiantly alive. Keep their recognizable features (face shape, hair, skin tone) but stylize in warm Pixar animation style. Purple and gold color palette for clothing/background. The expression should be joyful and authentic — this is them at their most free and playful. Square format, centered portrait, cinematic lighting.`

    // Call OpenAI Responses API
    let openaiResponse: Response
    try {
      openaiResponse = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          input: [
            {
              role: 'user',
              content: [
                { type: 'input_text', text: prompt },
                { type: 'input_image', image_url: dataUri },
              ],
            },
          ],
          tools: [
            { type: 'image_generation', size: '1024x1024', quality: 'high' },
          ],
        }),
      })
    } catch (err) {
      console.error('OpenAI fetch error:', err)
      return jsonResponse({ error: 'Failed to reach OpenAI API' }, 502)
    }

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errorText)
      return jsonResponse({ error: 'Image generation failed. Please try again.', debug: `OpenAI ${openaiResponse.status}: ${errorText.substring(0, 200)}` }, 502)
    }

    const result = await openaiResponse.json()

    // Extract image from response
    const imageContent = result.output
      ?.flatMap((o: any) => o.content || [])
      ?.find((c: any) => c.type === 'image')

    const rawBase64 = imageContent?.image?.data
      || imageContent?.image_url?.replace(/^data:image\/[a-z]+;base64,/, '')

    if (!rawBase64) {
      console.warn('No image in OpenAI response:', JSON.stringify(result).substring(0, 500))
      return jsonResponse({
        error: 'content_policy',
        message: "Generation couldn't complete. Try a different photo or adjust your lighting.",
      })
    }

    // Return the base64 image directly (no storage upload pre-auth)
    // The frontend stores this and uploads to storage after sign-up
    return jsonResponse({
      image_base64: `data:image/png;base64,${rawBase64}`,
    })

  } catch (error: any) {
    console.error('generate-avatar-public error:', error)
    return jsonResponse({ error: 'Unexpected error' }, 500)
  }
})