/**
 * deepgramClient.js — Transcription via the transcribe edge function.
 */
import { supabase } from './supabaseClient'

/**
 * Transcribe an audio blob via the Deepgram proxy edge function.
 * @param {Blob} audioBlob - The recorded audio
 * @returns {Promise<{ transcript: string, utterances: Array, paragraphs: Array }>}
 */
export async function transcribeAudio(audioBlob) {
  const formData = new FormData()
  formData.append('audio', audioBlob, `recording.${audioBlob.type.includes('mp4') ? 'm4a' : 'webm'}`)

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  const response = await fetch(`${supabaseUrl}/functions/v1/transcribe`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `Transcription failed: ${response.status}`)
  }

  return response.json()
}
