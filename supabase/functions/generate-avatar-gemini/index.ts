// Supabase Edge Function: Generate Avatar via Gemini 3.1 Flash
// Takes a user photo + essence archetype prompt, generates a Pixar-style avatar

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const GEMINI_API_KEY = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GEMINI_API_KEY')

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
    let photo_base64: string | undefined
    let photo_mime: string | undefined
    let prompt: string | undefined
    try {
      const body = await req.json()
      photo_base64 = body.photo_base64
      photo_mime = body.photo_mime || 'image/jpeg'
      prompt = body.prompt
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400)
    }

    if (!photo_base64) {
      return jsonResponse({ error: 'Missing photo_base64' }, 400)
    }

    if (!prompt) {
      return jsonResponse({ error: 'Missing prompt' }, 400)
    }

    if (!GEMINI_API_KEY) {
      console.error('GOOGLE_API_KEY / GEMINI_API_KEY not configured')
      return jsonResponse({ error: 'Image generation is not configured' }, 500)
    }

    // Call Gemini 3.1 Flash Image Preview
    console.log('Calling Gemini 3.1 Flash for avatar generation...')

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: photo_mime,
                  data: photo_base64,
                },
              },
            ],
          }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
          },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error:', geminiResponse.status, errorText)
      return jsonResponse({ error: 'Image generation failed. Please try again.' }, 502)
    }

    const result = await geminiResponse.json()
    const candidates = result.candidates || []

    if (!candidates.length) {
      const feedback = result.promptFeedback || result.error || 'No response'
      console.warn('No candidates from Gemini:', JSON.stringify(feedback).substring(0, 300))
      return jsonResponse({
        error: 'content_policy',
        message: "Generation couldn't complete. Try a different photo.",
      })
    }

    // Extract image from response
    const parts = candidates[0]?.content?.parts || []
    let imageBase64: string | null = null
    let imageMime = 'image/png'

    for (const part of parts) {
      if (part.inlineData) {
        imageBase64 = part.inlineData.data
        imageMime = part.inlineData.mimeType || 'image/png'
        break
      }
    }

    if (!imageBase64) {
      console.warn('No image in Gemini response')
      return jsonResponse({
        error: 'content_policy',
        message: "Generation couldn't complete. Try a different photo.",
      })
    }

    // Decode base64 image
    const binaryString = atob(imageBase64)
    const imageBytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      imageBytes[i] = binaryString.charCodeAt(i)
    }

    // Upload to Supabase Storage
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const ext = imageMime.includes('png') ? 'png' : 'jpg'
    const timestamp = Date.now()
    const storagePath = `${userId}/essence-avatar-${timestamp}.${ext}`

    const { error: uploadError } = await adminSupabase.storage
      .from('deal-screenshots')
      .upload(storagePath, imageBytes, {
        contentType: imageMime,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return jsonResponse({ error: 'Failed to upload image to storage' }, 500)
    }

    const { data: publicUrlData } = adminSupabase.storage
      .from('deal-screenshots')
      .getPublicUrl(storagePath)

    console.log('Avatar generated and uploaded:', publicUrlData.publicUrl)
    return jsonResponse({ url: publicUrlData.publicUrl })

  } catch (error: any) {
    console.error('generate-avatar-gemini error:', error)
    return jsonResponse({ error: 'Unexpected error' }, 500)
  }
})
