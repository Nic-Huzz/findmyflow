/**
 * moneyMapUtils.js — Quest + courage challenge creation for Money Map flow.
 */
import { supabase } from './supabaseClient'
import { createGroanChallenge } from './crm/groanChallengeService'
import { TIER1_CHALLENGES } from '../data/tier1Challenges'

/**
 * Create a financial security quest + first courage challenge for a Tier 1 skill.
 * @param {string} userId
 * @param {string} selectedId - Tier 1 node ID (e.g. 'exp-coding')
 * @returns {{ quest, challenge }}
 */
export async function createFinancialSecurityPath(userId, selectedId) {
  const template = TIER1_CHALLENGES[selectedId]
  if (!template) throw new Error(`Unknown Tier 1 skill: ${selectedId}`)

  // Step 1: create quest
  const { data: quest, error: questErr } = await supabase.from('quests').insert({
    user_id: userId,
    label: template.questLabel,
    path_type: 'financial_security',
    financial_stage: 'discovery',
    skill_node_id: selectedId,
    status: 'active',
    is_current_job: false,
    is_bridge_job: false,
  }).select().single()

  if (questErr) throw questErr

  // Step 2: create courage challenge linked to quest
  // createGroanChallenge uses 'description' not 'challengeText'.
  // source_id is UUID — dome node IDs go in source_value via post-update.
  const { data: challenge, error: challErr } = await createGroanChallenge({
    userId,
    questId: quest.id,
    title: template.title,
    description: template.desc,
    sourceType: 'skill',
    sourceLabel: 'Financial Security',
    visibilityLayer: 'screen',
    dimensionValues: template.dims,
    expansionDimensions: Object.keys(template.dims),
  })

  if (challErr) throw challErr

  // Step 3: set challenge_source, source_value, and activate
  await supabase.from('groan_challenges')
    .update({ status: 'active', challenge_source: 'money_map', source_value: selectedId })
    .eq('id', challenge.id)

  // Step 4: create quest_tasks row so QuestBoardCard can discover + complete it
  await supabase.from('quest_tasks').insert({
    user_id: userId,
    quest_id: quest.id,
    text: template.title,
    is_courage_challenge: true,
    groan_challenge_id: challenge.id,
    done: false,
  })

  return { quest, challenge }
}

/**
 * Mark Money Map as completed on user_stage_progress.
 */
export async function markMoneyMapCompleted(userId) {
  await supabase.from('user_stage_progress')
    .update({ money_map_completed: true })
    .eq('user_id', userId)
}

/**
 * Reset Money Map for re-trigger (user said "no" on weekly pulse).
 * For 'both' quests (existing passion path that was also the job), reverts to passion.
 * For 'financial_security' custom-named jobs, closes them.
 */
export async function resetMoneyMap(userId) {
  await supabase.from('user_stage_progress')
    .update({ money_map_completed: false })
    .eq('user_id', userId)

  // Revert 'both' quests back to passion (don't destroy the passion path)
  await supabase.from('quests')
    .update({
      path_type: null,
      job_relationship: null,
      bills_pulse_week: null,
    })
    .eq('user_id', userId)
    .eq('path_type', 'both')
    .eq('job_relationship', 'love_it')

  // Close custom-named love_it quests (these were created just for the job)
  await supabase.from('quests')
    .update({ status: 'closed' })
    .eq('user_id', userId)
    .eq('path_type', 'financial_security')
    .eq('job_relationship', 'love_it')
}
