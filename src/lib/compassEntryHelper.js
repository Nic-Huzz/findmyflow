/**
 * compassEntryHelper.js - Creates compass entries in flow_entries table
 *
 * Used by post-action reflections to wire emotional check-ins into the Flow Compass.
 * Follows FlowCompassPage insert pattern (lowercase direction values).
 */

import { supabase } from './supabaseClient'

const DIRECTION_MAP = {
  'excited|ease': 'north',
  'excited|resistance': 'east',
  'tired|resistance': 'south',
  'tired|ease': 'west'
}

const DIRECTION_LABELS = {
  north: 'Flow',
  east: 'Redirect',
  south: 'Rest',
  west: 'Honour'
}

export function deriveDirection(internalState, externalState) {
  return DIRECTION_MAP[`${internalState}|${externalState}`] || null
}

export function getDirectionLabel(direction) {
  return DIRECTION_LABELS[direction] || ''
}

/**
 * Create a compass entry in flow_entries from a post-action reflection.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string|null} params.projectId - nullable; null entries show in "unassigned"
 * @param {string} params.internalState - 'excited' | 'tired'
 * @param {string} params.externalState - 'ease' | 'resistance'
 * @param {string} params.activityDescription - quest name or context
 * @param {string} params.reasoning - key insight or reflection text
 * @param {string|null} params.challengeInstanceId - optional link
 * @param {string|null} params.questCompletionId - optional link
 * @returns {{ success: boolean, entryId?: string, error?: string }}
 */
export async function createCompassEntry({
  userId,
  projectId = null,
  internalState,
  externalState,
  activityDescription,
  reasoning,
  challengeInstanceId = null,
  questCompletionId = null
}) {
  if (!userId || !internalState || !externalState) {
    return { success: false, error: 'Missing required fields' }
  }

  const direction = deriveDirection(internalState, externalState)
  if (!direction) {
    return { success: false, error: 'Invalid state combination' }
  }

  try {
    const now = new Date().toISOString()

    const insertData = {
      user_id: userId,
      project_id: projectId || null,
      direction,
      internal_state: internalState,
      external_state: externalState,
      activity_description: activityDescription || 'Post-action reflection',
      reasoning: reasoning || 'Reflection check-in',
      logged_at: now,
      activity_date: now.split('T')[0]
    }

    if (challengeInstanceId) {
      insertData.challenge_instance_id = challengeInstanceId
    }
    if (questCompletionId) {
      insertData.quest_completion_id = questCompletionId
    }

    const { data, error } = await supabase
      .from('flow_entries')
      .insert(insertData)
      .select('id')
      .single()

    if (error) {
      console.error('Error creating compass entry:', error)
      return { success: false, error: error.message }
    }

    return { success: true, entryId: data?.id }
  } catch (err) {
    console.error('Error creating compass entry:', err)
    return { success: false, error: err.message }
  }
}
