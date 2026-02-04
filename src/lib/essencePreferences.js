import { supabase } from './supabaseClient'

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
  return `/images/archetypes/lead-magnet-essence/${name.toLowerCase().replace(/\s+/g, '-')}.PNG`
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
 */
export function buildAvatarPrompt({ essenceName, group, superpower, poeticLine, skills, problems, persona }) {
  const parts = [
    `Create a stylized portrait avatar for a personal brand archetype called "${essenceName}".`,
  ]

  if (group) parts.push(`They belong to the "${group}" energy group.`)
  if (superpower) parts.push(`Their superpower is: ${superpower}.`)
  if (poeticLine) parts.push(`Their essence is captured in the line: "${poeticLine}".`)

  if (skills?.length) parts.push(`Their key skills include: ${skills.join(', ')}.`)
  if (problems?.length) parts.push(`They solve problems like: ${problems.join(', ')}.`)
  if (persona) parts.push(`Their ideal audience persona is: ${persona}.`)

  parts.push(
    'Style: Warm, aspirational, modern illustration with a purple-to-gold gradient background.',
    'The image should feel empowering and personal — like a hero card in a video game.',
    'Square format, centered portrait, clean composition. No text.'
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
