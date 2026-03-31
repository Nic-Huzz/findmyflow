// Supabase Edge Function: Generate Avatar
// Tries Gemini 3.1 Flash first, falls back to GPT-4o if Gemini fails

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const GEMINI_API_KEY = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GEMINI_API_KEY')
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

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

// ─── Gemini Generation ──────────────────────────────────────────────────────

async function generateWithGemini(photo_base64: string, photo_mime: string, prompt: string): Promise<{ base64: string; mime: string } | null> {
  if (!GEMINI_API_KEY) return null

  const models = ['gemini-3.1-flash-image-preview', 'gemini-2.5-flash-image']

  for (const model of models) {
    try {
      console.log(`Trying Gemini model: ${model}...`)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inlineData: { mimeType: photo_mime, data: photo_base64 } },
              ],
            }],
            generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
          }),
        }
      )

      if (!response.ok) {
        const errText = await response.text()
        console.warn(`Gemini ${model} error ${response.status}:`, errText.substring(0, 200))
        continue
      }

      const result = await response.json()
      const parts = result.candidates?.[0]?.content?.parts || []

      for (const part of parts) {
        if (part.inlineData) {
          console.log(`Gemini ${model} succeeded`)
          return { base64: part.inlineData.data, mime: part.inlineData.mimeType || 'image/png' }
        }
      }

      console.warn(`Gemini ${model}: no image in response`)
    } catch (err) {
      console.warn(`Gemini ${model} threw:`, err.message)
    }
  }

  return null
}

// ─── GPT-4o Fallback ────────────────────────────────────────────────────────

async function generateWithGPT4o(photo_base64: string, photo_mime: string, prompt: string): Promise<{ base64: string; mime: string } | null> {
  if (!OPENAI_API_KEY) return null

  try {
    console.log('Falling back to GPT-4o...')

    // Upload the image as a data URI for GPT-4o
    const dataUri = `data:${photo_mime};base64,${photo_base64}`

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
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

    if (!response.ok) {
      const errText = await response.text()
      console.warn('GPT-4o error:', response.status, errText.substring(0, 200))
      return null
    }

    const result = await response.json()

    const imageContent = result.output
      ?.flatMap((o: any) => o.content || [])
      ?.find((c: any) => c.type === 'image')

    const rawBase64 = imageContent?.image?.data
      || imageContent?.image_url?.replace(/^data:image\/[a-z]+;base64,/, '')

    if (!rawBase64) {
      console.warn('GPT-4o: no image in response')
      return null
    }

    console.log('GPT-4o succeeded')
    return { base64: rawBase64, mime: 'image/png' }
  } catch (err) {
    console.warn('GPT-4o threw:', err.message)
    return null
  }
}

// ─── Main Handler ───────────────────────────────────────────────────────────

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

    // Parse request
    let photo_base64: string
    let photo_mime: string
    let prompt: string
    try {
      const body = await req.json()
      photo_base64 = body.photo_base64
      photo_mime = body.photo_mime || 'image/jpeg'
      prompt = body.prompt
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400)
    }

    if (!photo_base64 || !prompt) {
      return jsonResponse({ error: 'Missing photo_base64 or prompt' }, 400)
    }

    // Try Gemini first, then GPT-4o
    let imageResult = await generateWithGemini(photo_base64, photo_mime, prompt)

    if (!imageResult) {
      imageResult = await generateWithGPT4o(photo_base64, photo_mime, prompt)
    }

    if (!imageResult) {
      return jsonResponse({
        error: 'content_policy',
        message: "Generation couldn't complete. Try a different photo or try again in a moment.",
      })
    }

    // Decode and upload
    const binaryString = atob(imageResult.base64)
    const imageBytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      imageBytes[i] = binaryString.charCodeAt(i)
    }

    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const ext = imageResult.mime.includes('png') ? 'png' : 'jpg'
    const storagePath = `${userId}/essence-avatar-${Date.now()}.${ext}`

    const { error: uploadError } = await adminSupabase.storage
      .from('deal-screenshots')
      .upload(storagePath, imageBytes, {
        contentType: imageResult.mime,
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
