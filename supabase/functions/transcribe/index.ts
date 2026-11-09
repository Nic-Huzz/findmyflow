/**
 * Edge Function: transcribe
 * Proxies audio to Deepgram Nova-2 for transcription.
 * Keeps DEEPGRAM_API_KEY server-side.
 * Accepts WebM/Opus (Chrome/Firefox) and MP4/AAC (Safari).
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY')
    if (!DEEPGRAM_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'DEEPGRAM_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'No audio file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const params = new URLSearchParams({
      model: 'nova-2',
      language: 'en',
      smart_format: 'true',
      utterances: 'true',
      utt_split: '0.3',
      paragraphs: 'true',
    })

    const audioBytes = await audioFile.arrayBuffer()

    const response = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': audioFile.type || 'audio/webm',
      },
      body: audioBytes,
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Deepgram error:', response.status, errText)
      return new Response(
        JSON.stringify({ error: 'Transcription failed', detail: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()
    const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
    const utterances = result.results?.utterances || []
    const paragraphs = result.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs || []

    return new Response(
      JSON.stringify({ transcript, utterances, paragraphs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Transcribe error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal error', detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
