/**
 * journeyOnboarding.js
 *
 * Utility functions for the Journey Onboarding flow.
 * Handles persisting selections after sign-up and deriving
 * archetype patterns from wound stage choices.
 */

import { supabase } from './supabaseClient'

// ─── Constants ───────────────────────────────────────────────────────────────

const RESULT_STORAGE_KEY = 'journey_onboarding_result'
const PROGRESS_STORAGE_KEY = 'journey_onboarding_state'
const PHOTO_STORAGE_KEY = 'journey_onboarding_photo'

/**
 * Scene-to-zone mapping for all wound stages.
 * Each scene maps to a zone (top_left, diagonal, bottom_right)
 * and an archetype tendency (sympathetic, ventral, dorsal).
 */
const SCENE_METADATA = {
  // Stage 1
  overwhelmed_child: { zone: 'top_left', archetype: 'sympathetic' },
  secure_base: { zone: 'diagonal', archetype: 'ventral' },
  invisible_child: { zone: 'bottom_right', archetype: 'dorsal' },
  // Stage 2
  rejected_self: { zone: 'top_left', archetype: 'sympathetic' },
  unconditional_belonging: { zone: 'diagonal', archetype: 'ventral' },
  adapted_self: { zone: 'bottom_right', archetype: 'dorsal' },
  // Stage 3
  the_rebel: { zone: 'top_left', archetype: 'sympathetic' },
  grounded_student: { zone: 'diagonal', archetype: 'ventral' },
  good_student: { zone: 'bottom_right', archetype: 'dorsal' },
  // Stage 3.5
  the_chameleon: { zone: 'top_left', archetype: 'sympathetic' },
  found_their_tribe: { zone: 'diagonal', archetype: 'ventral' },
  the_withdrawn: { zone: 'bottom_right', archetype: 'dorsal' },
}

/**
 * Derive protective archetype pattern from the user's stage selections.
 *
 * top_left = sympathetic activation (Performer, Controller)
 * bottom_right = dorsal collapse (Perfectionist, Ghost)
 * diagonal = ventral (healthy)
 *
 * Returns an object describing their pattern.
 */
export function deriveArchetypePattern(stageSelections) {
  if (!stageSelections || Object.keys(stageSelections).length === 0) {
    return null
  }

  const zones = Object.values(stageSelections).map(sceneId => {
    const meta = SCENE_METADATA[sceneId]
    return meta?.archetype || 'unknown'
  })

  const counts = {
    sympathetic: zones.filter(z => z === 'sympathetic').length,
    ventral: zones.filter(z => z === 'ventral').length,
    dorsal: zones.filter(z => z === 'dorsal').length,
  }

  // Determine dominant pattern
  let dominant = 'mixed'
  if (counts.sympathetic > counts.dorsal && counts.sympathetic > counts.ventral) {
    dominant = 'sympathetic'
  } else if (counts.dorsal > counts.sympathetic && counts.dorsal > counts.ventral) {
    dominant = 'dorsal'
  } else if (counts.ventral > counts.sympathetic && counts.ventral > counts.dorsal) {
    dominant = 'ventral'
  }

  return {
    dominant,
    counts,
    selections: stageSelections,
    woundDepth: 4 - counts.ventral, // Higher = more wound stages activated
  }
}

/**
 * Generate a hero avatar from a photo stored in localStorage pre-auth.
 * Called post-auth to process the pending photo.
 *
 * 1. Checks localStorage for journey_onboarding_photo
 * 2. Uploads it to Supabase Storage
 * 3. Calls generate-avatar with the uploaded URL
 * 4. Updates user_stage_progress.hero_avatar_url
 * 5. Clears the localStorage key
 */
export async function generatePendingAvatar(userId) {
  if (!userId) return null

  const photoBase64 = localStorage.getItem(PHOTO_STORAGE_KEY)
  if (!photoBase64) return null

  try {
    // Convert base64 data URI to Blob for upload
    const res = await fetch(photoBase64)
    const blob = await res.blob()

    const timestamp = Date.now()
    const filePath = `avatars/${userId}/onboarding-${timestamp}.jpg`

    const { error: uploadErr } = await supabase.storage
      .from('deal-screenshots')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (uploadErr) {
      console.error('Error uploading pending avatar photo:', uploadErr)
      return null
    }

    const { data: urlData } = supabase.storage
      .from('deal-screenshots')
      .getPublicUrl(filePath)

    // Call generate-avatar edge function
    const { data, error } = await supabase.functions.invoke('generate-avatar', {
      body: {
        selfie_url: urlData.publicUrl,
        prompt: `Create a Pixar/Disney-style animated hero avatar of this person.
          Make them look vibrant, playful, and full of life, like the best version
          of themselves. Warm lighting, confident posture, a genuine smile that
          shows their inner light. The background should be a soft golden glow.
          This represents who they were before the world told them who to be.`,
      },
    })

    if (error) {
      console.error('Error generating pending avatar:', error)
      return null
    }

    if (data?.url) {
      // Update user_stage_progress with the avatar URL
      const { error: updateErr } = await supabase
        .from('user_stage_progress')
        .upsert({
          user_id: userId,
          hero_avatar_url: data.url,
        }, { onConflict: 'user_id' })

      if (updateErr) {
        console.error('Error saving avatar URL:', updateErr)
      }

      // Clear the localStorage key
      localStorage.removeItem(PHOTO_STORAGE_KEY)

      return data.url
    }

    return null
  } catch (err) {
    console.error('Error in generatePendingAvatar:', err)
    return null
  }
}

/**
 * Persist journey onboarding data to the database after sign-up.
 * Called from HomeFirstTime or MePage after the user authenticates.
 *
 * Reads from localStorage (stored pre-auth) and saves to DB.
 */
export async function persistJourneyOnboarding(userId) {
  if (!userId) return { success: false, error: 'No user ID' }

  // Read pre-auth data from localStorage
  const savedJson = localStorage.getItem(RESULT_STORAGE_KEY)
  if (!savedJson) return { success: false, error: 'No onboarding data found' }

  let saved
  try {
    saved = JSON.parse(savedJson)
  } catch {
    return { success: false, error: 'Invalid onboarding data' }
  }

  const { stageSelections, avatarUrl } = saved
  if (!stageSelections || Object.keys(stageSelections).length === 0) {
    return { success: false, error: 'No stage selections' }
  }

  try {
    // 1. Save individual stage selections
    const rows = Object.entries(stageSelections).map(([stageId, sceneId]) => {
      const meta = SCENE_METADATA[sceneId] || { zone: 'unknown', archetype: 'unknown' }
      return {
        user_id: userId,
        stage_id: stageId,
        scene_id: sceneId,
        zone: meta.zone,
        archetype: meta.archetype,
      }
    })

    const { error: insertError } = await supabase
      .from('journey_onboarding_selections')
      .upsert(rows, { onConflict: 'user_id,stage_id' })

    if (insertError) {
      console.error('Error saving journey selections:', insertError)
      // Don't block on this — continue to update user_stage_progress
    }

    // 2. Update user_stage_progress with avatar and completion flag
    const updateData = {
      user_id: userId,
      journey_onboarding_completed: true,
    }
    if (avatarUrl) {
      updateData.hero_avatar_url = avatarUrl
    }

    const { error: progressError } = await supabase
      .from('user_stage_progress')
      .upsert(updateData, { onConflict: 'user_id' })

    if (progressError) {
      console.error('Error updating stage progress:', progressError)
      return { success: false, error: progressError.message }
    }

    // 3. Generate avatar from pending photo if it exists
    if (localStorage.getItem(PHOTO_STORAGE_KEY)) {
      // Fire and forget — don't block onboarding persistence on avatar generation
      generatePendingAvatar(userId).catch(err => {
        console.warn('Pending avatar generation failed:', err)
      })
    }

    // 4. Clean up localStorage
    localStorage.removeItem(RESULT_STORAGE_KEY)
    localStorage.removeItem(PROGRESS_STORAGE_KEY)

    return { success: true, pattern: deriveArchetypePattern(stageSelections) }
  } catch (err) {
    console.error('Error persisting journey onboarding:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Check if the user has pending journey onboarding data in localStorage
 * that needs to be persisted after sign-up.
 */
export function hasPendingJourneyData() {
  try {
    const saved = localStorage.getItem(RESULT_STORAGE_KEY)
    if (!saved) return false
    const parsed = JSON.parse(saved)
    return parsed?.stageSelections && Object.keys(parsed.stageSelections).length > 0
  } catch {
    return false
  }
}

/**
 * Get the stored avatar URL from localStorage (pre-auth).
 */
export function getPendingAvatarUrl() {
  try {
    const saved = localStorage.getItem(RESULT_STORAGE_KEY)
    if (!saved) return null
    return JSON.parse(saved)?.avatarUrl || null
  } catch {
    return null
  }
}
