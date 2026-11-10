/**
 * financialSecurityEngine.js
 *
 * Resolves next challenge template for a financial security quest
 * and handles stage advancement.
 */
import { supabase } from './supabaseClient'
import { TIER1_CHALLENGES, TIER1_IDS, COURAGE_LADDER, FINANCIAL_STAGES } from '../data/tier1Challenges'

/**
 * Get the next challenge template for a financial security quest.
 * Returns { title, desc, dims } or null if stage is a picker (acquisition) or complete.
 */
export function getNextChallenge(quest) {
  const { financial_stage, acquisition_method, skill_node_id } = quest
  const skillId = skill_node_id

  // Discovery uses TIER1_CHALLENGES (already created by Money Map)
  if (financial_stage === 'discovery') return null

  // Acquisition is a picker, not a challenge
  if (financial_stage === 'acquisition') return null

  // Portfolio — per-skill
  if (financial_stage === 'portfolio') {
    return skillId ? COURAGE_LADDER.portfolio?.[skillId] : null
  }

  // First opportunity — per-skill × per-method
  if (financial_stage === 'first_opportunity') {
    const methodTemplates = COURAGE_LADDER.first_opportunity?.[acquisition_method]
    if (!methodTemplates) return null
    return methodTemplates[skillId] || methodTemplates._generic || null
  }

  // First income + repeatable — generic (same for all skills)
  if (financial_stage === 'first_income') {
    return COURAGE_LADDER.first_income?._generic || null
  }
  if (financial_stage === 'repeatable') {
    return COURAGE_LADDER.repeatable?._generic || null
  }

  return null
}

/**
 * Create the next courage challenge for a financial security quest.
 * Returns the created challenge or null if stage doesn't have a template.
 */
export async function createNextChallenge(userId, quest) {
  const template = getNextChallenge(quest)
  if (!template) return null

  // Create challenge
  const { data: challenge, error } = await supabase.from('groan_challenges').insert({
    user_id: userId,
    quest_id: quest.id,
    title: template.title,
    description: template.desc,
    source_type: 'skill',
    source_value: quest.skill_node_id,
    source_label: 'Financial Security',
    challenge_source: 'money_map',
    visibility_layer: 'screen',
    dimension_values: template.dims,
    expansion_dimensions: Object.keys(template.dims),
    status: 'active',
  }).select().single()

  if (error) {
    console.error('Failed to create next challenge:', error)
    return null
  }

  // Create quest_tasks row so QuestBoardCard can discover + complete it
  await supabase.from('quest_tasks').insert({
    user_id: userId,
    quest_id: quest.id,
    text: template.title,
    is_courage_challenge: true,
    groan_challenge_id: challenge.id,
    done: false,
  })

  return challenge
}

/**
 * Advance a financial security quest to the next stage.
 * Returns the new stage key, or null if already at the end.
 */
export async function advanceStage(questId, currentStage) {
  const currentIndex = FINANCIAL_STAGES.findIndex(s => s.key === currentStage)
  if (currentIndex === -1 || currentIndex >= FINANCIAL_STAGES.length - 1) return null

  const nextStage = FINANCIAL_STAGES[currentIndex + 1]

  const { error } = await supabase.from('quests')
    .update({ financial_stage: nextStage.key })
    .eq('id', questId)

  if (error) {
    console.error('Failed to advance stage:', error)
    return null
  }

  return nextStage.key
}
