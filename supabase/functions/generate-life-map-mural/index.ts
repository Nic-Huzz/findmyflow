// Supabase Edge Function: Generate Life Map Mural
// Generates a Pixar-style panoramic mural from user's Life Map responses via Gemini 3.1 Flash
// Uploads to Supabase Storage and returns the public URL

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

// Build scene descriptions from Life Map responses
function buildScenePrompt(responses: Record<string, string[]>): string {
  const getItems = (key: string) => (responses[key] || []).filter((v: string) => v?.trim()).map((v: string) => v.trim())

  const childhood = {
    skills: getItems('childhood_skills'),
    problems: getItems('childhood_problems'),
    personas: getItems('childhood_personas'),
  }
  const teens = {
    skills: getItems('teens_skills'),
    problems: getItems('teens_problems'),
    personas: getItems('teens_personas'),
  }
  const youngAdult = {
    skills: getItems('young_adult_skills'),
    problems: getItems('young_adult_problems'),
    personas: getItems('young_adult_personas'),
  }
  const career = {
    skills: getItems('career_skills'),
    problems: getItems('career_problems'),
    personas: getItems('career_personas'),
  }
  const now = {
    skills: getItems('now_skills'),
    problems: getItems('now_problems'),
    personas: getItems('now_personas'),
  }

  return `Pixar 3D cinematic animation style — the EXACT rendering quality of Pixar's Inside Out 2, Soul, and Coco. Smooth subsurface-scattering skin, large expressive eyes with visible iris detail and specular highlights, slightly exaggerated proportions, volumetric atmospheric lighting with visible light rays, depth of field with subtle bokeh.

Create a wide panoramic mural that tells one person's life story as a continuous journey flowing from left to right. The composition should feel like a painted Pixar concept-art banner, with scenes blending seamlessly into each other through atmospheric transitions, not separated into panels.

The sky transitions from deep purple on the left (childhood/past) to warm gold on the right (present/future), like a sunrise across a life.

SCENE 1 (far left — Childhood): A small Pixar-style child with big expressive eyes, engaged in: ${childhood.skills[0] || 'playing and creating'}. ${childhood.problems[0] ? `Visual hint of "${childhood.problems[0]}" in the environment (subtle, not dark).` : ''} ${childhood.personas[0] ? `A poster or shadow of "${childhood.personas[0]}" visible in the background.` : ''} Warm sunlit room, golden afternoon light with volumetric rays.

SCENE 2 (left-center — Teens): The same character as a teenager, outdoors at golden hour. Engaged in: ${teens.skills[0] || 'exploring interests'}. ${teens.problems[0] ? `Subtle visual of "${teens.problems[0]}" in body language or environment.` : ''} ${teens.personas[0] ? `A reference to "${teens.personas[0]}" visible nearby.` : ''} Pixar-quality atmospheric haze, green fields or school setting.

SCENE 3 (center — Young Adult): The same Pixar character around 20-25. ${youngAdult.skills[0] ? `Engaged in "${youngAdult.skills[0]}".` : 'At a crossroads.'} ${youngAdult.problems[0] ? `Visual tension: "${youngAdult.problems[0]}" represented in the scene.` : ''} A fork in the road or transition moment. Dramatic Pixar lighting contrast between old path and new.

SCENE 4 (right-center — Career): The same character, now energized and purposeful. ${career.skills[0] ? `Doing "${career.skills[0]}".` : 'Leading or creating.'} ${career.problems[0] ? `In the background, people who represent "${career.problems[0]}" — looking small or stuck.` : ''} ${career.personas[0] ? `Looking toward "${career.personas[0]}" with recognition.` : ''} Warm workshop or professional setting.

SCENE 5 (far right — Now): The same character at a glowing desk or creative space with tropical plants. ${now.skills[0] ? `Working on "${now.skills[0]}".` : 'Building something that glows.'} Golden light radiates outward from their work. ${now.personas[0] ? `Behind them, slightly transparent like a Pixar memory sequence, stands "${now.personas[0]}" watching with awe.` : 'A younger version of themselves watches from behind, slightly transparent.'} The golden light touches everything on the right side of the mural.

CRITICAL STYLE REQUIREMENTS: Full Pixar/Disney 3D animation rendering quality throughout. NOT 2D illustration, NOT watercolor, NOT flat. Must look like it was rendered by Pixar's RenderMan engine. Smooth 3D surfaces, subsurface scattering on skin, volumetric lighting, cinematic camera depth of field. The entire mural must feel cohesive like one continuous Pixar concept-art painting. No text or words anywhere. Landscape orientation, wide panoramic aspect ratio.

CHARACTER CONSISTENCY: The SAME character must appear in ALL five scenes, aging naturally from child to adult. Maintain consistent facial features, skin tone, and recognizable traits throughout.`
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

    // Parse request
    let responses: Record<string, string[]>
    let essenceImageUrl: string | null = null
    try {
      const body = await req.json()
      responses = body.responses
      essenceImageUrl = body.essenceImageUrl || null
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400)
    }

    if (!responses) {
      return jsonResponse({ error: 'Missing responses' }, 400)
    }

    if (!GEMINI_API_KEY) {
      return jsonResponse({ error: 'Image generation not configured' }, 500)
    }

    // Build prompt from user's life map data
    let prompt = buildScenePrompt(responses)
    console.log('Generating Life Map mural for user:', userId)

    // Fetch reference image if provided (essence archetype avatar)
    let referenceImageParts: any[] = []
    if (essenceImageUrl) {
      try {
        const imgRes = await fetch(essenceImageUrl)
        if (imgRes.ok) {
          const imgBuffer = await imgRes.arrayBuffer()
          const imgBase64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)))
          const imgMime = imgRes.headers.get('content-type') || 'image/png'
          referenceImageParts = [{
            inlineData: { mimeType: imgMime, data: imgBase64 }
          }]
          prompt += `\n\nIMPORTANT: A reference image of the person's Pixar avatar is provided. The character in ALL five scenes must closely match this reference: same face shape, skin tone, hairstyle, and overall appearance. Age the character naturally (child → teen → young adult → adult) while keeping the core facial features recognizable.`
          console.log('Reference image included for character consistency')
        }
      } catch (imgErr) {
        console.warn('Failed to fetch reference image, proceeding without:', imgErr)
      }
    }

    // Call Gemini with optional reference image
    const contentParts = [
      ...referenceImageParts,
      { text: prompt },
    ]

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: contentParts }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error('Gemini error:', geminiResponse.status, errText.substring(0, 300))
      return jsonResponse({ error: 'Image generation failed' }, 500)
    }

    const result = await geminiResponse.json()
    const parts = result.candidates?.[0]?.content?.parts || []

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
      console.error('No image in Gemini response')
      return jsonResponse({ error: 'No image generated' }, 500)
    }

    // Decode and upload to Supabase Storage
    const binaryString = atob(imageBase64)
    const imageBytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      imageBytes[i] = binaryString.charCodeAt(i)
    }

    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const ext = imageMime.includes('png') ? 'png' : 'jpg'
    const storagePath = `${userId}/life-map-mural-${Date.now()}.${ext}`

    const { error: uploadError } = await adminSupabase.storage
      .from('deal-screenshots')
      .upload(storagePath, imageBytes, {
        contentType: imageMime,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return jsonResponse({ error: 'Failed to upload mural' }, 500)
    }

    const { data: publicUrlData } = adminSupabase.storage
      .from('deal-screenshots')
      .getPublicUrl(storagePath)

    console.log('Life Map mural generated:', publicUrlData.publicUrl)
    return jsonResponse({ url: publicUrlData.publicUrl })

  } catch (error: any) {
    console.error('generate-life-map-mural error:', error)
    return jsonResponse({ error: 'Unexpected error' }, 500)
  }
})
