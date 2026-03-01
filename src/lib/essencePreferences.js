import { supabase } from './supabaseClient'

// Map field names to archetype data keys
const FIELD_KEYS = {
  // Essence fields
  tagline: 'essence',
  essence: 'poetic_line',
  superpower: 'superpower',
  vision: 'poetic_vision',
  north_star: 'north_star',
  inner_child: 'inner_child_desire',
  wound: 'essence_wound',
  characters: 'characters',
  energetic_transmission: 'energetic_transmission',
  recognition_pattern: 'recognition_pattern',
  vision_in_action: 'vision_in_action',
  // Shadow/Protective Voice fields
  shadow_lie: 'lie',
  shadow_origin: 'origin',
  shadow_protects: 'howItProtects',
  shadow_kryptonite: 'kryptonite',
  shadow_affirmation: 'affirmation',
  shadow_play_blocker: 'playBlocker'
}

// Export for use in other components
export { FIELD_KEYS }

/**
 * Returns custom essence name if set, else original archetype name
 */
export function getEssenceDisplayName(profile) {
  return profile?.custom_essence_name || profile?.essence_archetype || 'Unknown'
}

/**
 * Returns custom image URL if set, else builds default PNG path
 */
export function getEssenceImagePath(profile) {
  if (profile?.custom_essence_image) return profile.custom_essence_image
  const name = profile?.essence_archetype
  if (!name) return null
  return `/images/archetypes/lead-magnet-essence/${name.toLowerCase().replace(/\s+/g, '-')}.webp`
}

/**
 * Compress image to max dimension and quality for upload
 */
export function compressImage(file, maxDimension = 800, quality = 0.85) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width <= maxDimension && height <= maxDimension && file.size < 500 * 1024) {
        // Already small enough
        resolve(file)
        return
      }

      // Scale down
      if (width > height) {
        if (width > maxDimension) { height = (height * maxDimension) / width; width = maxDimension }
      } else {
        if (height > maxDimension) { width = (width * maxDimension) / height; height = maxDimension }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: outputType }))
          } else {
            resolve(file) // fallback to original
          }
        },
        outputType,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file) // fallback to original
    }

    img.src = url
  })
}

/**
 * Build an AI image prompt from archetype + project data
 * Styled as a mystical tarot card
 */
export function buildAvatarPrompt({ essenceName, superpower, poeticLine, skills, problems, persona }) {
  const parts = [
    `Create a tarot card illustration for an archetype called "The ${essenceName}".`,
  ]

  // Build narrative from their journey data
  if (skills?.length) {
    parts.push(`This person has gifts in: ${skills.join(', ')}.`)
  }
  if (problems?.length) {
    parts.push(`They are called to solve: ${problems.join(', ')}.`)
  }
  if (persona) {
    parts.push(`They serve and guide: ${persona}.`)
  }
  if (superpower) {
    parts.push(`Their unique power: ${superpower}.`)
  }
  if (poeticLine) {
    parts.push(`Their essence: "${poeticLine}".`)
  }

  parts.push(
    'Use the attached photo of me as reference for the central figure — capture my likeness, features, and energy.',
    'Style: Pixar-inspired 3D animation character portrait.',
    'Warm cinematic lighting with purple and gold tones.',
    'Expressive, big eyes with a confident smile.',
    'Heroic but approachable pose — arms crossed or hands on hips.',
    'Stylized background with glowing elements related to their gifts and mission.',
    'Clean render, soft shadows, vibrant colors.',
    'Square format, no text.'
  )

  return parts.join(' ')
}

/**
 * Upload custom avatar to Supabase Storage
 */
export async function uploadEssenceAvatar(userId, file) {
  try {
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${userId}/essence-avatar-${timestamp}.${extension}`

    const { data, error } = await supabase.storage
      .from('deal-screenshots')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Essence avatar upload error:', error)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('deal-screenshots')
      .getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (err) {
    console.error('Essence avatar upload error:', err)
    return null
  }
}

/**
 * Update custom essence name and/or image in lead_flow_profiles
 */
export async function updateEssencePreferences(userId, email, { customName, customImage }) {
  const updates = {}
  if (customName !== undefined) updates.custom_essence_name = customName || null
  if (customImage !== undefined) updates.custom_essence_image = customImage || null

  // Try user_id first
  let { data, error } = await supabase
    .from('lead_flow_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()

  // Fallback to email match if no rows updated — only update the most recent profile
  if (!error && (!data || data.length === 0) && email) {
    const { data: rows } = await supabase
      .from('lead_flow_profiles')
      .select('id')
      .ilike('email', email)
      .order('created_at', { ascending: false })
      .limit(1)

    if (rows && rows.length > 0) {
      const result = await supabase
        .from('lead_flow_profiles')
        .update(updates)
        .eq('id', rows[0].id)
        .select()
      data = result.data
      error = result.error
    }
  }

  if (error) {
    console.error('Error updating essence preferences:', error)
    return { error }
  }

  return { data }
}

/**
 * Get the display value for an essence field (custom or default from archetype)
 * @param {Object} profile - User's lead_flow_profile
 * @param {string} field - Field name: 'essence', 'superpower', 'vision', 'north_star'
 * @param {Object} archetypeData - The archetype data object
 * @returns {string} The value to display
 */
export function getEssenceFieldValue(profile, field, archetypeData) {
  const customFields = profile?.custom_essence_fields || {}
  const customField = customFields[field]

  if (customField?.value) {
    return customField.value
  }

  // Fall back to default archetype value
  const fieldKey = FIELD_KEYS[field]
  return archetypeData?.[fieldKey] || ''
}

/**
 * Get metadata about a custom essence field (mode, sources)
 * @param {Object} profile - User's lead_flow_profile
 * @param {string} field - Field name
 * @returns {Object|null} { mode, value, sources } or null if not customized
 */
export function getEssenceFieldMeta(profile, field) {
  const customFields = profile?.custom_essence_fields || {}
  return customFields[field] || null
}

/**
 * Check if a field has been customized
 * @param {Object} profile - User's lead_flow_profile
 * @param {string} field - Field name
 * @returns {boolean}
 */
export function isEssenceFieldCustomized(profile, field) {
  const customFields = profile?.custom_essence_fields || {}
  return !!customFields[field]?.value
}

/**
 * Update a custom essence field in lead_flow_profiles
 * @param {string} userId - User ID
 * @param {string} email - User email (fallback)
 * @param {string} field - Field name: 'essence', 'superpower', 'vision', 'north_star'
 * @param {Object} data - { mode: 'browse'|'hybrid'|'custom', value: string, sources?: string[] }
 */
export async function updateEssenceField(userId, email, field, data) {
  // First get current custom_essence_fields
  let currentProfile = null

  // Try user_id first
  let { data: profiles, error: fetchError } = await supabase
    .from('lead_flow_profiles')
    .select('id, custom_essence_fields')
    .eq('user_id', userId)
    .limit(1)

  if (!fetchError && profiles?.length > 0) {
    currentProfile = profiles[0]
  } else if (email) {
    // Fallback to email
    const { data: emailProfiles, error: emailError } = await supabase
      .from('lead_flow_profiles')
      .select('id, custom_essence_fields')
      .ilike('email', email)
      .order('created_at', { ascending: false })
      .limit(1)

    if (!emailError && emailProfiles?.length > 0) {
      currentProfile = emailProfiles[0]
    }
  }

  if (!currentProfile) {
    return { error: new Error('Profile not found') }
  }

  // Merge the new field data
  const currentFields = currentProfile.custom_essence_fields || {}
  const updatedFields = {
    ...currentFields,
    [field]: data
  }

  // Update the profile
  const { data: updated, error } = await supabase
    .from('lead_flow_profiles')
    .update({ custom_essence_fields: updatedFields })
    .eq('id', currentProfile.id)
    .select()

  if (error) {
    console.error('Error updating essence field:', error)
    return { error }
  }

  return { data: updated }
}

/**
 * Reset a custom essence field back to default
 */
export async function resetEssenceField(userId, email, field) {
  // Get current profile
  let currentProfile = null

  let { data: profiles } = await supabase
    .from('lead_flow_profiles')
    .select('id, custom_essence_fields')
    .eq('user_id', userId)
    .limit(1)

  if (profiles?.length > 0) {
    currentProfile = profiles[0]
  } else if (email) {
    const { data: emailProfiles } = await supabase
      .from('lead_flow_profiles')
      .select('id, custom_essence_fields')
      .ilike('email', email)
      .order('created_at', { ascending: false })
      .limit(1)

    if (emailProfiles?.length > 0) {
      currentProfile = emailProfiles[0]
    }
  }

  if (!currentProfile) {
    return { error: new Error('Profile not found') }
  }

  // Remove the field from custom_essence_fields
  const currentFields = currentProfile.custom_essence_fields || {}
  const { [field]: removed, ...remainingFields } = currentFields

  const { data: updated, error } = await supabase
    .from('lead_flow_profiles')
    .update({ custom_essence_fields: remainingFields })
    .eq('id', currentProfile.id)
    .select()

  if (error) {
    console.error('Error resetting essence field:', error)
    return { error }
  }

  return { data: updated }
}

/**
 * Generate a hybrid statement from multiple archetypes using edge function
 * @param {string} field - Field name
 * @param {string[]} sources - Array of archetype names (2-3)
 * @param {Array} archetypeData - All archetype data
 * @returns {Promise<{ statement: string, synthesis_note: string }>}
 */
export async function generateHybridStatement(field, sources, archetypeData) {
  const { data, error } = await supabase.functions.invoke('essence-hybrid-generator', {
    body: {
      field,
      sources,
      archetype_data: archetypeData
    }
  })

  if (error) {
    console.error('Error generating hybrid statement:', error)
    throw error
  }

  // Validate response structure
  if (!data || !data.statement) {
    console.error('Invalid AI response:', data)
    throw new Error(data?.error || 'Invalid response from AI: missing statement')
  }

  return data
}
