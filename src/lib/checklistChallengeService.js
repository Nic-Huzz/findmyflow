/**
 * checklistChallengeService.js
 *
 * Converts experience checklist items into Play-List courage challenges.
 * The bridge between passive to-dos and actionable groan challenges.
 *
 * Only marketing + follow-up items are convertible (not organisation or reflection).
 * DNA personalization is optional: if Play Profile exists, challenge framing adapts.
 */

import { supabase } from './supabaseClient'
import { awardMovementXP } from './movementXP'

// Sections where [lightning bolt] conversion is available
export const CONVERTIBLE_SECTIONS = ['marketing', 'followup']


// DNA-based challenge framing variants
const DNA_FRAMINGS = {
  DO_IT: {
    prefix: 'Speed round.',
    suffix: 'Do it all today.',
  },
  THINK_IT: {
    prefix: 'Plan first.',
    suffix: 'Write your approach, then execute over 3 days.',
  },
  MAKE_IT: {
    prefix: 'Make it personal.',
    suffix: 'Create something unique, not templated.',
  },
}

/**
 * Determine challenge type from DNA sliders
 * @param {number|null} knowledgeStyle - 1-5 scale
 * @returns {'DO_IT'|'THINK_IT'|'MAKE_IT'|null}
 */
export function getChallengeType(knowledgeStyle) {
  if (knowledgeStyle == null) return null
  if (knowledgeStyle >= 4) return 'DO_IT'
  if (knowledgeStyle <= 2) return 'THINK_IT'
  return 'MAKE_IT'
}

/**
 * Apply DNA framing to a challenge title
 * @param {string} baseTitle - The checklist item label
 * @param {string|null} challengeType - DO_IT, THINK_IT, MAKE_IT, or null
 * @returns {string} The framed challenge description
 */
export function frameChallengeDescription(baseTitle, challengeType) {
  if (!challengeType || !DNA_FRAMINGS[challengeType]) return baseTitle
  const framing = DNA_FRAMINGS[challengeType]
  return `${framing.prefix} ${baseTitle} ${framing.suffix}`
}

/**
 * Fetch user's Play Profile DNA sliders
 * @param {string} userId
 * @returns {Promise<{knowledgeStyle: number|null, fuelType: number|null}>}
 */
export async function fetchDNASliders(userId) {
  const { data } = await supabase
    .from('founder_dna_results')
    .select('slider_values, dna_code')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return { knowledgeStyle: null, fuelType: null }

  // knowledgeStyle is the 4th value in the dna_code (X-X-X-KS-X)
  const codeParts = (data.dna_code || '').split('-').map(Number)
  const knowledgeStyle = codeParts[3] || data.slider_values?.knowledgeStyle || null
  const fuelType = codeParts[1] || data.slider_values?.fuelType || null

  return { knowledgeStyle, fuelType }
}

/**
 * Convert a checklist item to a groan challenge
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {object} params.checklistItem - The experience_checklist_items row
 * @param {object} params.experience - The experiences row
 * @param {Date|string|null} params.deadline - Challenge deadline
 * @param {number|null} params.knowledgeStyle - DNA slider (optional)
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function convertChecklistToChallenge({
  userId,
  checklistItem,
  experience,
  deadline = null,
  knowledgeStyle = null,
}) {
  const challengeType = getChallengeType(knowledgeStyle)
  const description = frameChallengeDescription(checklistItem.label, challengeType)

  const { data, error } = await supabase
    .from('groan_challenges')
    .insert({
      user_id: userId,
      challenge_text: checklistItem.label,
      title: checklistItem.label,
      description,
      source_type: 'skill',
      source_value: 'checklist',
      source_label: experience.name,
      visibility_layer: 'screen',
      status: 'active',
      accepted_at: new Date().toISOString(),
      challenge_source: 'checklist',
      checklist_item_id: checklistItem.id,
      experience_id: experience.id,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      dna_challenge_type: challengeType,
    })
    .select()
    .single()

  if (error) {
    console.error('Error converting checklist to challenge:', error)
    return { data: null, error }
  }

  // Award 3 XP for converting checklist item to challenge
  awardMovementXP(userId, 'checklist_to_challenge', checklistItem.label)

  return { data, error: null }
}

/**
 * Convert a custom intention (from group call) to a groan challenge
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.title - Custom intention text
 * @param {string|null} params.experienceId - Linked experience (optional)
 * @param {Date|string|null} params.deadline
 * @param {number|null} params.knowledgeStyle
 * @returns {Promise<{data: object|null, error: Error|null}>}
 */
export async function createIntentionChallenge({
  userId,
  title,
  experienceId = null,
  deadline = null,
  knowledgeStyle = null,
}) {
  const challengeType = getChallengeType(knowledgeStyle)
  const description = frameChallengeDescription(title, challengeType)

  const { data, error } = await supabase
    .from('groan_challenges')
    .insert({
      user_id: userId,
      challenge_text: title,
      title,
      description,
      source_type: 'skill',
      source_value: 'intention',
      source_label: 'Group Call Intention',
      visibility_layer: 'screen',
      status: 'active',
      accepted_at: new Date().toISOString(),
      challenge_source: 'intention',
      experience_id: experienceId,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      dna_challenge_type: challengeType,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating intention challenge:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Fetch active checklist/intention challenges for a user
 *
 * @param {string} userId
 * @param {string|null} experienceId - Filter by experience (optional)
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function fetchCreatorChallenges(userId, experienceId = null) {
  let query = supabase
    .from('groan_challenges')
    .select('*')
    .eq('user_id', userId)
    .in('challenge_source', ['checklist', 'intention', 'strike'])
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (experienceId) {
    query = query.eq('experience_id', experienceId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching creator challenges:', error)
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

/**
 * Complete a checklist challenge and auto-tick the linked checklist item
 *
 * @param {string} challengeId
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function completeChecklistChallenge(challengeId) {
  // 1. Get the challenge to find the linked checklist item
  const { data: challenge, error: fetchErr } = await supabase
    .from('groan_challenges')
    .select('id, checklist_item_id')
    .eq('id', challengeId)
    .single()

  if (fetchErr) return { success: false, error: fetchErr }

  // 2. Mark challenge as completed
  const { error: updateErr } = await supabase
    .from('groan_challenges')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', challengeId)

  if (updateErr) return { success: false, error: updateErr }

  // 3. Auto-tick the linked checklist item (if exists)
  if (challenge.checklist_item_id) {
    const { error: tickErr } = await supabase
      .from('experience_checklist_items')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', challenge.checklist_item_id)

    if (tickErr) {
      console.error('Error auto-ticking checklist item:', tickErr)
      // Don't fail the whole operation, challenge is already completed
    }
  }

  return { success: true, error: null }
}
