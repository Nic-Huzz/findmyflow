import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
  // Validate auth
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Missing authorization header' }, 401)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return jsonResponse({ error: 'Invalid or expired token' }, 401)
  }

  const userId = user.id

  // Parse request body
  let selfie_url: string | undefined
  let prompt: string | undefined
  try {
    const body = await req.json()
    selfie_url = body.selfie_url
    prompt = body.prompt
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  if (!selfie_url) {
    return jsonResponse({ error: 'Missing selfie_url' }, 400)
  }

  if (!prompt) {
    return jsonResponse({ error: 'Missing prompt' }, 400)
  }

  // Check OpenAI API key
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiKey) {
    console.error('OPENAI_API_KEY not configured')
    return jsonResponse({ error: 'Image generation is not configured' }, 500)
  }

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
              { type: 'input_image', image_url: selfie_url },
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
    return jsonResponse({ error: 'Image generation failed. Please try again.' }, 502)
  }

  const result = await openaiResponse.json()

  // Extract image from response output
  const imageContent = result.output
    ?.flatMap((o: any) => o.content || [])
    ?.find((c: any) => c.type === 'image')

  // Extract base64 data — handle both response shapes:
  // Shape A: imageContent.image.data (raw base64)
  // Shape B: imageContent.image_url (data URI like "data:image/png;base64,...")
  const rawBase64 = imageContent?.image?.data
    || imageContent?.image_url?.replace(/^data:image\/[a-z]+;base64,/, '')

  if (!rawBase64) {
    console.warn('No image in OpenAI response:', JSON.stringify(result).substring(0, 500))
    return jsonResponse(
      {
        error: 'content_policy',
        message: "Generation couldn't complete. Try a different photo or adjust your lighting.",
      },
      422
    )
  }

  // Decode base64 PNG
  const binaryString = atob(rawBase64)
  const imageBytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    imageBytes[i] = binaryString.charCodeAt(i)
  }

  // Upload to Supabase Storage using service role client
  const adminSupabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const timestamp = Date.now()
  const storagePath = `${userId}/ai-avatar-${timestamp}.png`

  const { error: uploadError } = await adminSupabase.storage
    .from('deal-screenshots')
    .upload(storagePath, imageBytes, {
      contentType: 'image/png',
      upsert: false,
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return jsonResponse({ error: 'Failed to upload image to storage' }, 500)
  }

  const { data: publicUrlData } = adminSupabase.storage
    .from('deal-screenshots')
    .getPublicUrl(storagePath)

  return jsonResponse({ url: publicUrlData.publicUrl })
  } catch (error: any) {
    console.error('generate-avatar error:', error)
    return jsonResponse({ error: 'Unexpected error' }, 500)
  }
})
