import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const COMPOSIO_API_KEY = Deno.env.get('COMPOSIO_API_KEY')!
const COMPOSIO_BASE = 'https://backend.composio.dev/api/v3.1'
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')!
const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_BASE = 'https://generativelanguage.googleapis.com'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ANALYSIS_PROMPT = `Analyze this Instagram Reel and return a JSON object with these fields:

1. hook_type: classify the opening 0-3 seconds. One of: face_to_camera, text_overlay, pattern_interrupt, question, shock, story_opening, b_roll, montage
2. hook_text: any text shown on screen in first 3 seconds (null if none)
3. hook_energy: rate 1-5 (1=calm/slow, 5=high energy/surprising)
4. content_type: what the reel does. One of: teaches, entertains, inspires, storytelling, behind_the_scenes, transformation
5. structure: editing pattern. One of: talking_head, montage, text_cards, mixed_cuts, slideshow
6. talking_head_pct: estimated percentage of reel that is face-to-camera talking (0-100)
7. text_overlay_present: boolean, are there text overlays/captions throughout?
8. music_present: boolean, is there background music?
9. audio_type: one of voiceover, talking, music_only, mixed
10. pacing: one of slow, medium, fast (based on cut frequency)
11. visual_style: brief description of color grade, lighting, setting
12. cta_present: boolean, is there a call to action?
13. cta_type: if CTA exists, what type. One of: follow, comment, share, link, dm, none
14. duration_estimate_seconds: your estimate of total length
15. key_message: one sentence summary of the core message
16. emotional_arc: one of: problem_to_solution, buildup_to_reveal, story_to_lesson, direct_value, tension_to_release
17. uniqueness_factors: array of strings describing what makes this reel distinctive
18. opening_line_type: classify the first spoken sentence. One of: bold_claim, vulnerable_confession, contrarian_take, relatable_pain, curiosity_gap, direct_address, statistic, none (if no spoken words)
19. storytelling_framework: classify the overall narrative structure. One of: origin_story, lesson_learned, before_after, day_in_life, challenge_journey, analogy, myth_busting, direct_advice, none (if no clear narrative)
20. story_stages: timestamp each story stage that appears in the reel. Return an array of objects, each with "stage", "start_s" (start second), and "end_s" (end second). Only include stages that are actually present. Use these stage names:
    - normal: the old, stuck, or "before" version of the creator/viewer
    - desire_challenge: what they wanted deep down and the thing blocking it, or a bigger idea/argument
    - enter_unfamiliar: the decision to do the scary thing, naming the fear and risk
    - adapt_adversity: the messy hard middle, broke/lost/awkward/exposed
    - attain_desire: getting what they wanted but it cost something real (comfort, ego, safety, old identity)
    - return_changed: return to the same place/situation, now different
    - new_normal: who they are now, stated simply
    - turn_to_viewer: a reminder, question, or invitation to the audience
    If the reel has no clear story arc, return an empty array.

Return ONLY valid JSON, no markdown formatting or explanation.`

async function composioExecute(toolSlug: string, connectedAccountId: string, args: Record<string, any>, entityId?: string) {
  const res = await fetch(`${COMPOSIO_BASE}/tools/execute/${toolSlug}`, {
    method: 'POST',
    headers: {
      'x-api-key': COMPOSIO_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      connected_account_id: connectedAccountId,
      entity_id: entityId || connectedAccountId,
      arguments: args,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Composio ${toolSlug} failed: ${err}`)
  }
  const data = await res.json()
  return data.data || data.response?.data || data
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { ig_media_id } = body

    if (!ig_media_id) {
      return new Response(
        JSON.stringify({ error: 'ig_media_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Auth: get user from JWT
    const authHeader = req.headers.get('Authorization')
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    let userId: string
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error } = await supabaseUser.auth.getUser(token)
      if (error || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      userId = user.id
    } else {
      return new Response(
        JSON.stringify({ error: 'Missing auth header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Check if post exists and isn't already analyzed
    const { data: post, error: postError } = await supabaseUser
      .from('instagram_posts')
      .select('id, ig_media_id, ai_analysis, media_product_type')
      .eq('user_id', userId)
      .eq('ig_media_id', ig_media_id)
      .single()

    if (postError || !post) {
      return new Response(
        JSON.stringify({ error: 'Post not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (post.ai_analysis) {
      return new Response(
        JSON.stringify({ success: true, analysis: post.ai_analysis, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (post.media_product_type !== 'REELS' && post.media_product_type !== 'VIDEO') {
      return new Response(
        JSON.stringify({ error: 'Only video/reel posts can be analyzed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Get Composio connection
    const { data: integration } = await supabaseUser
      .from('user_integrations')
      .select('composio_connection_id')
      .eq('user_id', userId)
      .eq('platform', 'instagram')
      .eq('status', 'active')
      .single()

    if (!integration?.composio_connection_id) {
      return new Response(
        JSON.stringify({ error: 'instagram_disconnected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Get fresh video URL from Composio (single media fetch)
    let mediaUrl: string
    try {
      const mediaData = await composioExecute(
        'INSTAGRAM_GET_IG_MEDIA',
        integration.composio_connection_id,
        { ig_media_id, fields: 'id,media_url' },
        userId
      )

      mediaUrl = mediaData.media_url || mediaData.data?.media_url
      if (!mediaUrl) {
        return new Response(
          JSON.stringify({ error: 'video_unavailable', detail: 'No media_url returned from Instagram' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'video_unavailable', detail: e.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Download video
    let videoBytes: ArrayBuffer
    try {
      const videoRes = await fetch(mediaUrl)
      if (!videoRes.ok) throw new Error(`Download failed: ${videoRes.status}`)
      videoBytes = await videoRes.arrayBuffer()

      // Cap at 50MB
      if (videoBytes.byteLength > 50 * 1024 * 1024) {
        return new Response(
          JSON.stringify({ error: 'video_too_large', detail: 'Video exceeds 50MB limit' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'video_unavailable', detail: e.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Upload to Gemini File API
    let fileUri: string
    let fileName: string
    try {
      const uploadRes = await fetch(
        `${GEMINI_BASE}/upload/v1beta/files?key=${GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'X-Goog-Upload-Command': 'start, upload, finalize',
            'X-Goog-Upload-Header-Content-Length': videoBytes.byteLength.toString(),
            'X-Goog-Upload-Header-Content-Type': 'video/mp4',
            'Content-Type': 'video/mp4',
          },
          body: videoBytes,
        }
      )
      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`)
      const uploadData = await uploadRes.json()
      fileUri = uploadData.file?.uri
      fileName = uploadData.file?.name
      if (!fileUri || !fileName) throw new Error('No file URI or name returned')
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'analysis_failed', detail: `Gemini upload: ${e.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Poll until ACTIVE
    let fileReady = false
    for (let i = 0; i < 15; i++) {
      const statusRes = await fetch(`${GEMINI_BASE}/v1beta/${fileName}?key=${GOOGLE_API_KEY}`)
      const statusData = await statusRes.json()
      if (statusData.state === 'ACTIVE') { fileReady = true; break }
      if (statusData.state === 'FAILED') break
      await new Promise(r => setTimeout(r, 2000))
    }
    if (!fileReady) {
      return new Response(
        JSON.stringify({ error: 'analysis_failed', detail: 'Video processing timed out' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 7. Analyze with Gemini 2.5 Flash
    let analysis: Record<string, any>
    try {
      const analyzeRes = await fetch(
        `${GEMINI_BASE}/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { fileData: { mimeType: 'video/mp4', fileUri } },
                { text: ANALYSIS_PROMPT },
              ],
            }],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      )

      if (!analyzeRes.ok) {
        const err = await analyzeRes.text()
        throw new Error(`Gemini analysis failed: ${err}`)
      }

      const analyzeData = await analyzeRes.json()
      const text = analyzeData.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('No analysis text returned')

      analysis = JSON.parse(text)
      analysis._analyzed_at = new Date().toISOString()
      analysis._model = GEMINI_MODEL
      analysis._tokens = analyzeData.usageMetadata?.totalTokenCount || null
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'analysis_failed', detail: e.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 8. Store result
    const { error: updateError } = await supabaseUser
      .from('instagram_posts')
      .update({ ai_analysis: analysis })
      .eq('user_id', userId)
      .eq('ig_media_id', ig_media_id)

    if (updateError) {
      console.error('Failed to save analysis:', updateError.message)
    }

    // 9. Cleanup: delete uploaded file (optional, auto-expires in 48h)
    try {
      await fetch(`${GEMINI_BASE}/v1beta/${fileName}?key=${GOOGLE_API_KEY}`, { method: 'DELETE' })
    } catch (_) {
      // Non-critical
    }

    return new Response(
      JSON.stringify({ success: true, analysis, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('analyze-instagram-post error:', error.message)
    return new Response(
      JSON.stringify({ error: 'analysis_failed', detail: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
