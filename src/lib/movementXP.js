/**
 * Movement XP Service
 *
 * Awards XP for Creator Portal actions. Each action inserts a quest_completions
 * row and calls increment_scores RPC with category 'movement'.
 *
 * XP Values:
 *   Checklist item completed:     2 XP
 *   Details field saved:          3 XP (first time per field)
 *   Value stack pricing set:      5 XP
 *   Checklist → challenge:        3 XP
 *   Strike completed:            15 XP
 *   Experience completed:        20 XP
 *   3% note captured:            10 XP
 *   Attendees uploaded:           5 XP
 *   Run Again:                   10 XP
 */

import { supabase } from './supabaseClient'
import { getWeekStartLocal } from './dateUtils'

const MOVEMENT_XP = {
  checklist_item: 2,
  details_field: 3,
  value_stack: 5,
  checklist_to_challenge: 3,
  strike_complete: 15,
  experience_complete: 20,
  three_percent: 10,
  attendee_upload: 5,
  run_again: 10,
}

/**
 * Award Movement XP for an action.
 * @param {string} userId
 * @param {string} action - Key from MOVEMENT_XP
 * @param {string} [label] - Optional description for the quest_completions record
 * @returns {Promise<number|null>} - New lifetime score, or null on error
 */
export async function awardMovementXP(userId, action, label = '') {
  const points = MOVEMENT_XP[action]
  if (!points || !userId) return null

  try {
    // 1. Insert quest_completions record
    const questId = `movement_${action}_${Date.now()}`
    await supabase.from('quest_completions').insert({
      user_id: userId,
      quest_id: questId,
      quest_category: 'Movement',
      quest_type: action,
      points_earned: points,
      challenge_day: 0,
      project_id: null,
      reflection_text: label || null,
    }).then(r => { if (r.error) console.warn('Movement XP quest insert:', r.error.message) })

    // 2. Increment scores
    const { data } = await supabase.rpc('increment_scores', {
      p_user_id: userId,
      p_project_id: null,
      p_category: 'movement',
      p_points: points,
      p_week_start: getWeekStartLocal(),
    })

    return data?.lifetime_score || null
  } catch (err) {
    console.error('Movement XP award failed:', err)
    return null
  }
}

export { MOVEMENT_XP }
