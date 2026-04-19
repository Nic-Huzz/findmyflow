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

  const { stageSelections, completedAt } = saved
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

    // 2. Update user_stage_progress with completion flag
    const { error: progressError } = await supabase
      .from('user_stage_progress')
      .upsert({
        user_id: userId,
        journey_onboarding_completed: true,
        onboarding_v2_completed: true,
      }, { onConflict: 'user_id' })

    if (progressError) {
      console.error('Error updating stage progress:', progressError)
      return { success: false, error: progressError.message }
    }

    // 3. Clean up localStorage
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

// ─── Play-Skills Onboarding Hydration ─────────────────────────────────────

const PLAYSKILLS_RESULT_KEY = 'playskills_onboarding_result'
const PLAYSKILLS_PROGRESS_KEY = 'playskills_onboarding_progress'

/**
 * Check if the user has pending play-skills onboarding data in localStorage.
 */
export function hasPendingPlaySkillsData() {
  try {
    const saved = localStorage.getItem(PLAYSKILLS_RESULT_KEY)
    if (!saved) return false
    const parsed = JSON.parse(saved)
    return parsed?.keptPlacemakes && parsed.keptPlacemakes.length > 0
  } catch {
    return false
  }
}

/**
 * Persist play-skills onboarding data to the database after sign-up.
 * Called from MePage after the user authenticates.
 *
 * Reads 'playskills_onboarding_result' from localStorage:
 *   { path, keptPlacemakes, userName, completedAt }
 *
 * Writes to:
 *   - nikigai_clusters (cluster_stage: 'final', step_id: 'get_started')
 *   - user_stage_progress (marks onboarding complete)
 *   - auth.users metadata (display_name, if not already set)
 */
export async function persistPlaySkillsOnboarding(userId) {
  if (!userId) return { success: false, error: 'No user ID' }

  const savedJson = localStorage.getItem(PLAYSKILLS_RESULT_KEY)
  if (!savedJson) return { success: false, error: 'No play-skills data found' }

  let saved
  try {
    saved = JSON.parse(savedJson)
  } catch {
    return { success: false, error: 'Invalid play-skills data' }
  }

  const { keptPlacemakes, userName } = saved
  if (!keptPlacemakes || keptPlacemakes.length === 0) {
    return { success: false, error: 'No placemakes found' }
  }

  try {
    // Skip if clusters already exist (direct save from verify may have already written them)
    const { data: existing } = await supabase.from('nikigai_clusters')
      .select('id')
      .eq('user_id', userId)
      .eq('step_id', 'get_started')
      .limit(1)
    if (existing?.length > 0) {
      // Already saved — just clean up localStorage
      localStorage.removeItem(PLAYSKILLS_RESULT_KEY)
      localStorage.removeItem(PLAYSKILLS_PROGRESS_KEY)
      return { success: true, count: existing.length, skipped: true }
    }

    // 1. Remove old get_started clusters, then insert new ones
    await supabase.from('nikigai_clusters')
      .delete()
      .eq('user_id', userId)
      .eq('step_id', 'get_started')

    // Create a flow session
    const { data: session, error: sessionError } = await supabase.from('flow_sessions').insert({
      user_id: userId,
      flow_type: 'get_started_playskills',
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).select('id').single()
    if (sessionError || !session) throw sessionError || new Error('Failed to create session')

    const rows = keptPlacemakes.map(item => ({
      session_id: session.id,
      user_id: userId,
      cluster_type: 'skills',
      cluster_label: item.originalName || item.placemake,
      cluster_stage: 'final',
      step_id: 'get_started',
      items: [{
        text: item.originalName || item.placemake,
        placemake: item.placemake,
        category: item.categoryId,
        evidence: item.evidence || '',
        isStarred: true,
      }],
    }))

    const { error: insertError } = await supabase
      .from('nikigai_clusters')
      .insert(rows)

    if (insertError) {
      console.error('Error saving play-skills clusters:', insertError)
      // Continue — don't block on cluster insert failure
    }

    // 2. Update user_stage_progress
    const { error: progressError } = await supabase
      .from('user_stage_progress')
      .upsert({
        user_id: userId,
        onboarding_v2_completed: true,
      }, { onConflict: 'user_id' })

    if (progressError) {
      console.error('Error updating stage progress:', progressError)
    }

    // 3. Set display name if provided
    if (userName && userName.trim()) {
      await supabase.auth.updateUser({
        data: { display_name: userName.trim() }
      })
    }

    // 4. Clean up localStorage
    localStorage.removeItem(PLAYSKILLS_RESULT_KEY)
    localStorage.removeItem(PLAYSKILLS_PROGRESS_KEY)

    return { success: true, count: keptPlacemakes.length }
  } catch (err) {
    console.error('Error persisting play-skills onboarding:', err)
    return { success: false, error: err.message }
  }
}