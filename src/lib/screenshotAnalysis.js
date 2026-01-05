/**
 * Screenshot Analysis - AI-powered deal extraction from conversation screenshots
 */
import { supabase } from './supabaseClient'

/**
 * Convert a File to base64 string
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Analyze a screenshot using Claude Vision to extract deal details
 * @param {File} imageFile - The image file to analyze
 * @param {Array} existingDeals - Optional array of existing deals to match against
 * @returns {Promise<{extracted: object, matchingDeals: array, success: boolean}>}
 */
export async function analyzeScreenshot(imageFile, existingDeals = []) {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(imageFile)
    const mimeType = imageFile.type

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('analyze-deal-screenshot', {
      body: {
        action: 'analyze',
        imageBase64: base64,
        mimeType,
        existingDeals: existingDeals.map(d => ({
          id: d.id,
          contact_name: d.contact_name,
          contact_email: d.contact_email,
          product_type: d.product_type,
          status: d.status
        }))
      }
    })

    if (error) {
      console.error('Edge function error:', error)
      return { extracted: null, matchingDeals: [], success: false, error: error.message }
    }

    return data
  } catch (err) {
    console.error('Screenshot analysis error:', err)
    return { extracted: null, matchingDeals: [], success: false, error: err.message }
  }
}

/**
 * Upload a screenshot to Supabase storage
 * @param {string} userId - The user's ID
 * @param {File} file - The image file
 * @param {string} dealId - Optional deal ID to associate with
 * @returns {Promise<{url: string, path: string} | null>}
 */
export async function uploadScreenshot(userId, file, dealId = null) {
  try {
    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = dealId
      ? `${userId}/${dealId}_${timestamp}.${extension}`
      : `${userId}/${timestamp}.${extension}`

    // Upload to storage
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

    // Get the public URL (or signed URL for private buckets)
    const { data: urlData } = supabase.storage
      .from('deal-screenshots')
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path
    }
  } catch (err) {
    console.error('Screenshot upload error:', err)
    return null
  }
}

/**
 * Map extracted data to deal fields
 * @param {object} extracted - The extracted data from AI
 * @returns {object} - Deal-ready object
 */
export function mapExtractedToDeal(extracted) {
  // Map lead temperature to PTUF-style scores
  const tempScores = {
    hot: { pain: 8, trust: 7, urgency: 9, fit: 8 },
    warm: { pain: 6, trust: 5, urgency: 5, fit: 6 },
    cold: { pain: 4, trust: 3, urgency: 3, fit: 4 }
  }

  const scores = tempScores[extracted.lead_temperature] || tempScores.warm

  // Build notes from extracted data
  const notesArray = []

  if (extracted.key_points?.length > 0) {
    notesArray.push('Key Points:')
    extracted.key_points.forEach(p => notesArray.push(`• ${p}`))
  }

  if (extracted.pain_indicators?.length > 0) {
    notesArray.push('\nPain Points:')
    extracted.pain_indicators.forEach(p => notesArray.push(`• ${p}`))
  }

  if (extracted.notes) {
    notesArray.push(`\nAI Summary: ${extracted.notes}`)
  }

  if (extracted.platform_detected) {
    notesArray.push(`\nSource: ${extracted.platform_detected}`)
  }

  return {
    contact_name: extracted.contact_name || 'Unknown Contact',
    contact_email: extracted.contact_email || '',
    product_type: mapProductInterest(extracted.product_interest),
    value: extracted.estimated_value || 497,
    status: extracted.suggested_stage || 'lead',
    source: extracted.platform_detected || 'Screenshot',
    notes: notesArray.join('\n'),
    pain_score: scores.pain,
    trust_score: scores.trust,
    urgency_score: Math.min(10, Math.max(1, extracted.urgency_level || 5)),
    fit_score: scores.fit
  }
}

/**
 * Map product interest text to product type
 */
function mapProductInterest(interest) {
  if (!interest) return 'Core Offer'

  const lower = interest.toLowerCase()

  if (lower.includes('premium') || lower.includes('vip') || lower.includes('1:1') || lower.includes('one-on-one')) {
    return 'Premium 1:1'
  }
  if (lower.includes('subscription') || lower.includes('monthly') || lower.includes('continuity')) {
    return 'Continuity'
  }
  if (lower.includes('attraction') || lower.includes('lead') || lower.includes('free') || lower.includes('intro')) {
    return 'Attraction Offer'
  }
  if (lower.includes('vip') || lower.includes('high-end') || lower.includes('exclusive')) {
    return 'VIP Package'
  }

  return 'Core Offer'
}
