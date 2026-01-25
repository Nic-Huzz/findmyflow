/**
 * Screenshot Analysis - AI-powered deal extraction from conversation screenshots
 */
import { supabase } from './supabaseClient'

// Valid deal stages that match database constraint
const VALID_STAGES = ['lead', 'qualified', 'booked', 'showed', 'pitched', 'follow_up', 'won', 'lost']

// Map AI-suggested stages to valid database stages
function mapToValidStage(suggestedStage) {
  if (!suggestedStage) return 'lead'

  const lower = suggestedStage.toLowerCase().trim()

  // Direct matches
  if (VALID_STAGES.includes(lower)) return lower

  // Common AI variations mapped to valid stages
  const stageMap = {
    'new': 'lead',
    'inquiry': 'lead',
    'interested': 'lead',
    'initial': 'lead',
    'discovery': 'qualified',
    'qualifying': 'qualified',
    'meeting': 'booked',
    'scheduled': 'booked',
    'call_booked': 'booked',
    'attended': 'showed',
    'met': 'showed',
    'presented': 'pitched',
    'proposal': 'pitched',
    'sent_proposal': 'pitched',
    'follow-up': 'follow_up',
    'followup': 'follow_up',
    'pending': 'follow_up',
    'negotiating': 'follow_up',
    'closed': 'won',
    'converted': 'won',
    'sale': 'won',
    'rejected': 'lost',
    'dead': 'lost',
    'no_response': 'lost',
  }

  return stageMap[lower] || 'lead'
}

// ============================================
// IMAGE COMPRESSION (Cost Optimization)
// ============================================

/**
 * Compress an image file to reduce API costs
 * @param {File} file - Original image file
 * @param {Object} options - Compression options
 * @returns {Promise<Blob>} - Compressed image blob
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    type = 'image/jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => {
          if (blob) {
            console.log(`📷 Image compressed: ${file.size} → ${blob.size} bytes (${Math.round((1 - blob.size / file.size) * 100)}% reduction)`)
            resolve(blob)
          } else {
            reject(new Error('Canvas toBlob failed'))
          }
        },
        type,
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

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
    status: mapToValidStage(extracted.suggested_stage),
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

// ============================================
// POST METRICS SCREENSHOT ANALYSIS
// ============================================

/**
 * Analyze a post metrics screenshot using Claude Vision
 * @param {File} imageFile - The image file to analyze
 * @returns {Promise<{metrics: object, success: boolean}>}
 */
export async function analyzeMetricsScreenshot(imageFile) {
  try {
    // Compress image to reduce API costs (max 1200px, 80% quality)
    const compressed = await compressImage(imageFile, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.8,
      type: 'image/jpeg'
    })

    // Convert compressed blob to base64
    const base64 = await fileToBase64(new File([compressed], 'compressed.jpg', { type: 'image/jpeg' }))

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('analyze-metrics-screenshot', {
      body: {
        imageBase64: base64,
        mimeType: 'image/jpeg'
      }
    })

    if (error) {
      console.error('Edge function error:', error)
      return { metrics: null, success: false, error: error.message }
    }

    return data
  } catch (err) {
    console.error('Metrics screenshot analysis error:', err)
    return { metrics: null, success: false, error: err.message }
  }
}

/**
 * Upload a metrics screenshot to Supabase storage
 * @param {string} userId - The user's ID
 * @param {File} file - The image file
 * @param {string} contentId - Content history ID to associate with
 * @returns {Promise<{url: string, path: string} | null>}
 */
export async function uploadMetricsScreenshot(userId, file, contentId) {
  try {
    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${userId}/metrics/${contentId}_${timestamp}.${extension}`

    // Upload to storage (reusing deal-screenshots bucket)
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

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('deal-screenshots')
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path
    }
  } catch (err) {
    console.error('Metrics screenshot upload error:', err)
    return null
  }
}

/**
 * Save metrics to content history
 * @param {string} contentId - Content history record ID
 * @param {object} metrics - Extracted metrics object
 * @param {string} screenshotUrl - URL of the uploaded screenshot
 * @returns {Promise<boolean>}
 */
export async function saveContentMetrics(contentId, metrics, screenshotUrl = null) {
  try {
    const engagementData = {
      likes: metrics.likes,
      comments: metrics.comments,
      shares: metrics.shares,
      saves: metrics.saves,
      impressions: metrics.impressions,
      reach: metrics.reach,
      engagement_rate: metrics.engagement_rate,
      profile_visits: metrics.profile_visits,
      follows: metrics.follows,
      link_clicks: metrics.link_clicks,
      video_views: metrics.video_views,
      average_watch_time: metrics.average_watch_time,
      performance_tier: metrics.performance_tier,
      insights: metrics.insights,
      screenshot_url: screenshotUrl,
      recorded_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('content_history')
      .update({
        engagement_data: engagementData,
        status: 'posted'
      })
      .eq('id', contentId)

    if (error) {
      console.error('Save metrics error:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Save content metrics error:', err)
    return false
  }
}

// ============================================
// LEADS SCREENSHOT ANALYSIS
// ============================================

/**
 * Analyze a leads screenshot using Claude Vision to extract lead information
 * @param {File} imageFile - The image file to analyze (DMs, comments, etc.)
 * @param {string} platform - Optional platform hint
 * @returns {Promise<{leads: array, success: boolean}>}
 */
export async function analyzeLeadsScreenshot(imageFile, platform = null) {
  try {
    // Compress image to reduce API costs
    const compressed = await compressImage(imageFile, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.8,
      type: 'image/jpeg'
    })

    // Convert compressed blob to base64
    const base64 = await fileToBase64(new File([compressed], 'compressed.jpg', { type: 'image/jpeg' }))

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('analyze-leads-screenshot', {
      body: {
        imageBase64: base64,
        mimeType: 'image/jpeg',
        platform
      }
    })

    if (error) {
      console.error('Edge function error:', error)
      return { leads: [], success: false, error: error.message }
    }

    return data
  } catch (err) {
    console.error('Leads screenshot analysis error:', err)
    return { leads: [], success: false, error: err.message }
  }
}

/**
 * Create contacts from extracted leads
 * @param {string} userId - User ID
 * @param {array} leads - Array of lead objects with additional info
 * @param {string} sourceContentId - Optional content ID that generated these leads
 * @returns {Promise<{created: array, errors: array}>}
 */
export async function createContactsFromLeads(userId, leads, sourceContentId = null) {
  const created = []
  const errors = []

  for (const lead of leads) {
    try {
      // Map engagement type to CRM source
      const sourceMap = {
        dm: 'DM',
        comment: 'Social Comment',
        story_reply: 'Story Reply',
        like: 'Social Engagement',
        mention: 'Mention',
        other: 'Social Media'
      }

      // Map temperature to lifecycle stage
      const stageMap = {
        hot: 'qualified',  // Hot leads are already qualified
        warm: 'lead',      // Warm leads are standard leads
        cold: 'lead'       // Cold leads start as leads
      }

      const contactData = {
        user_id: userId,
        name: lead.name || lead.handle || 'Unknown',
        email: lead.email || null,
        phone: lead.phone || null,
        lifecycle_stage: stageMap[lead.temperature] || 'lead',
        source: sourceMap[lead.engagement_type] || 'Social Media',
        tags: [
          lead.platform?.toLowerCase(),
          lead.temperature,
          sourceContentId ? `content:${sourceContentId}` : null
        ].filter(Boolean),
        notes: buildLeadNotes(lead, sourceContentId)
      }

      const { data, error } = await supabase
        .from('crm_contacts')
        .insert(contactData)
        .select()
        .single()

      if (error) {
        console.error('Error creating contact:', error)
        errors.push({ lead, error: error.message })
      } else {
        created.push(data)

        // Also create a warm_leads entry for tracking
        await supabase
          .from('crm_warm_leads')
          .insert({
            user_id: userId,
            name: lead.name || lead.handle,
            platform: lead.platform || 'Instagram',
            handle: lead.handle,
            engagement_type: mapEngagementType(lead.engagement_type),
            status: 'to_contact',
            notes: lead.message_preview || null
          })
      }
    } catch (err) {
      console.error('Error processing lead:', err)
      errors.push({ lead, error: err.message })
    }
  }

  return { created, errors }
}

/**
 * Build notes string from lead data
 */
function buildLeadNotes(lead, sourceContentId) {
  const parts = []

  if (lead.platform) {
    parts.push(`Platform: ${lead.platform}`)
  }

  if (lead.handle) {
    parts.push(`Handle: ${lead.handle}`)
  }

  if (lead.engagement_type) {
    parts.push(`Engagement: ${lead.engagement_type}`)
  }

  if (lead.message_preview) {
    parts.push(`Message: "${lead.message_preview}"`)
  }

  if (lead.temperature) {
    parts.push(`Temperature: ${lead.temperature}`)
  }

  if (sourceContentId) {
    parts.push(`Source Content ID: ${sourceContentId}`)
  }

  if (lead.notes) {
    parts.push(`AI Notes: ${lead.notes}`)
  }

  return parts.join('\n')
}

/**
 * Map engagement type to valid database value
 */
function mapEngagementType(type) {
  const validTypes = ['liked_post', 'commented', 'dm', 'email_reply', 'webinar', 'lead_magnet', 'referral']

  const typeMap = {
    dm: 'dm',
    comment: 'commented',
    like: 'liked_post',
    story_reply: 'dm',
    mention: 'commented',
    other: 'liked_post'
  }

  const mapped = typeMap[type] || 'liked_post'
  return validTypes.includes(mapped) ? mapped : 'liked_post'
}

/**
 * Update content history with leads data
 * @param {string} contentId - Content history record ID
 * @param {object} leadsData - Leads data to add to engagement_data
 * @returns {Promise<boolean>}
 */
export async function updateContentWithLeads(contentId, leadsData) {
  try {
    // First get existing engagement data
    const { data: content, error: fetchError } = await supabase
      .from('content_history')
      .select('engagement_data')
      .eq('id', contentId)
      .single()

    if (fetchError) {
      console.error('Error fetching content:', fetchError)
      return false
    }

    // Merge leads data with existing engagement data
    const updatedEngagement = {
      ...content.engagement_data,
      leads: {
        total: leadsData.total || 0,
        by_type: leadsData.by_type || {},
        contacts_created: leadsData.contacts_created || 0,
        recorded_at: new Date().toISOString()
      }
    }

    const { error } = await supabase
      .from('content_history')
      .update({ engagement_data: updatedEngagement })
      .eq('id', contentId)

    if (error) {
      console.error('Error updating content with leads:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Update content with leads error:', err)
    return false
  }
}

/**
 * Update content strategy with metrics from screenshot analysis
 * Uses rolling average to blend new data with existing
 *
 * @param {string} userId - User ID
 * @param {object} metrics - Extracted metrics from screenshot
 * @returns {Promise<boolean>}
 */
export async function updateStrategyFromScreenshot(userId, metrics) {
  try {
    // Get the reach/impressions from the screenshot
    const newViews = metrics.reach || metrics.impressions
    if (!newViews || newViews <= 0) {
      console.log('No reach/impressions in metrics, skipping strategy update')
      return false
    }

    // Get existing strategy
    const { data: strategy, error: fetchError } = await supabase
      .from('content_strategies')
      .select('avg_views_per_post, follower_count')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching strategy:', fetchError)
      return false
    }

    if (!strategy) {
      console.log('No strategy found for user, skipping update')
      return false
    }

    // Calculate new rolling average (weighted: 2/3 existing, 1/3 new)
    const existingViews = strategy.avg_views_per_post || 0
    const updatedAvg = existingViews > 0
      ? Math.round((existingViews * 2 + newViews) / 3)
      : newViews

    // Update strategy with new average
    const { error: updateError } = await supabase
      .from('content_strategies')
      .update({
        avg_views_per_post: updatedAvg,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating strategy:', updateError)
      return false
    }

    console.log(`📊 Strategy updated: avg_views_per_post ${existingViews} → ${updatedAvg} (new post: ${newViews})`)

    // Also store individual post data in marketing_metrics for detailed tracking
    const postDate = metrics.post_date || new Date().toISOString().split('T')[0]
    const { error: metricsError } = await supabase
      .from('marketing_metrics')
      .upsert({
        user_id: userId,
        period_type: 'post',
        period_start: postDate,
        period_end: postDate,
        total_reach: metrics.reach || 0,
        total_impressions: metrics.impressions || 0,
        total_engagements: (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0) + (metrics.saves || 0),
        engagement_rate: metrics.engagement_rate,
        posts_count: 1,
        platform_breakdown: metrics.platform ? {
          [metrics.platform.toLowerCase()]: {
            reach: metrics.reach,
            impressions: metrics.impressions,
            likes: metrics.likes,
            comments: metrics.comments,
            shares: metrics.shares,
          }
        } : {},
      }, {
        onConflict: 'user_id,period_type,period_start'
      })

    if (metricsError) {
      // Non-critical - log but don't fail
      console.warn('Error storing marketing_metrics:', metricsError)
    }

    return true
  } catch (err) {
    console.error('Update strategy from screenshot error:', err)
    return false
  }
}
