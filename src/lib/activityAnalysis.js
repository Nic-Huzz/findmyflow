/**
 * Activity Analysis - AI-powered extraction from screenshots and voice notes
 * Used for logging sales activities (calls, texts, emails)
 */
import { supabase } from './supabaseClient'
import { fileToBase64, compressImage } from './screenshotAnalysis'

/**
 * Analyze a screenshot of a text/email conversation
 * @param {File} imageFile - Screenshot to analyze
 * @param {string} activityType - 'text' or 'email'
 * @param {object} deal - The deal this activity relates to
 * @returns {Promise<{keyPoints: string[], summary: string, suggestedFollowUp: string|null, success: boolean}>}
 */
export async function analyzeActivityScreenshot(imageFile, activityType, deal) {
  try {
    // Compress image to reduce API costs
    const compressed = await compressImage(imageFile, {
      maxWidth: 1200,
      maxHeight: 1600, // Taller for conversation threads
      quality: 0.8,
      type: 'image/jpeg'
    })

    const base64 = await fileToBase64(new File([compressed], 'compressed.jpg', { type: 'image/jpeg' }))

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('analyze-activity', {
      body: {
        action: 'screenshot',
        imageBase64: base64,
        mimeType: 'image/jpeg',
        activityType,
        dealContext: {
          contact_name: deal.contact_name,
          product_type: deal.product_type,
          status: deal.status,
          value: deal.value,
          notes: deal.notes?.slice(0, 500) // Truncate for context
        }
      }
    })

    if (error) {
      console.error('Activity analysis error:', error)
      throw new Error(error.message || 'Failed to analyze screenshot')
    }

    return {
      keyPoints: data.keyPoints || [],
      summary: data.summary || '',
      suggestedFollowUp: data.suggestedFollowUp || null,
      sentiment: data.sentiment || 'neutral',
      nextAction: data.nextAction || null,
      success: true
    }
  } catch (err) {
    console.error('Screenshot analysis error:', err)
    throw err
  }
}

/**
 * Transcribe and analyze a voice note about a call
 * @param {Blob} audioBlob - The recorded audio blob
 * @param {object} deal - The deal this activity relates to
 * @returns {Promise<{transcription: string, keyPoints: string[], summary: string, suggestedFollowUp: string|null, success: boolean}>}
 */
export async function transcribeVoiceNote(audioBlob, deal) {
  try {
    // Convert blob to base64
    const base64 = await blobToBase64(audioBlob)

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('analyze-activity', {
      body: {
        action: 'voice',
        audioBase64: base64,
        mimeType: audioBlob.type || 'audio/webm',
        dealContext: {
          contact_name: deal.contact_name,
          product_type: deal.product_type,
          status: deal.status,
          value: deal.value,
          notes: deal.notes?.slice(0, 500)
        }
      }
    })

    if (error) {
      console.error('Voice transcription error:', error)
      throw new Error(error.message || 'Failed to transcribe voice note')
    }

    return {
      transcription: data.transcription || '',
      keyPoints: data.keyPoints || [],
      summary: data.summary || '',
      suggestedFollowUp: data.suggestedFollowUp || null,
      sentiment: data.sentiment || 'neutral',
      nextAction: data.nextAction || null,
      success: true
    }
  } catch (err) {
    console.error('Voice transcription error:', err)
    throw err
  }
}

/**
 * Convert a Blob to base64 string
 */
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Upload activity screenshot to storage
 * @param {string} userId - User ID
 * @param {string} dealId - Deal ID
 * @param {File} file - Image file
 * @returns {Promise<{url: string, path: string} | null>}
 */
export async function uploadActivityScreenshot(userId, dealId, file) {
  try {
    const timestamp = Date.now()
    const extension = file.name?.split('.').pop() || 'jpg'
    const filename = `${userId}/activities/${dealId}_${timestamp}.${extension}`

    const { data, error } = await supabase.storage
      .from('deal-screenshots')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('deal-screenshots')
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path
    }
  } catch (err) {
    console.error('Activity screenshot upload error:', err)
    return null
  }
}

/**
 * Upload voice note to storage
 * @param {string} userId - User ID
 * @param {string} dealId - Deal ID
 * @param {Blob} audioBlob - Audio blob
 * @returns {Promise<{url: string, path: string} | null>}
 */
export async function uploadVoiceNote(userId, dealId, audioBlob) {
  try {
    const timestamp = Date.now()
    const filename = `${userId}/voice-notes/${dealId}_${timestamp}.webm`

    const { data, error } = await supabase.storage
      .from('deal-screenshots')
      .upload(filename, audioBlob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'audio/webm'
      })

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('deal-screenshots')
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path
    }
  } catch (err) {
    console.error('Voice note upload error:', err)
    return null
  }
}
