/**
 * Voice Quest Configuration
 *
 * Generates stage-specific Essence Voice, Protective Voice, and Stage Groan quests
 * that use personalized archetype names from the user's profile.
 *
 * Created: 2026-01-22
 * See: docs/challenge-restructure-plan.md
 */

import { getStageConfig, getVoicePrompts, STAGES } from './stageConfig'

// =============================================================================
// VOICE QUEST TYPES
// =============================================================================

export const VOICE_QUEST_TYPES = {
  ESSENCE: 'essence_voice',
  PROTECTIVE: 'protective_voice',
  STAGE_GROAN: 'stage_groan'
}

// =============================================================================
// QUEST GENERATORS
// =============================================================================

/**
 * Generate a unique quest ID for a voice quest
 * @param {number} stageNumber - The stage number
 * @param {string} questType - One of VOICE_QUEST_TYPES
 * @returns {string} Unique quest ID
 */
export function generateVoiceQuestId(stageNumber, questType) {
  return `voice_stage_${stageNumber}_${questType}`
}

/**
 * Generate an Essence Voice quest for a stage
 * @param {number} stageNumber - The stage number
 * @param {object} userArchetypes - User's archetypes { essence: string, protective: string }
 * @returns {object} Quest configuration
 */
export function generateEssenceVoiceQuest(stageNumber, userArchetypes) {
  const stageConfig = getStageConfig(stageNumber)
  const voicePrompts = getVoicePrompts(stageNumber)

  if (!stageConfig || !voicePrompts) return null

  const essenceName = userArchetypes?.essence || 'Essence'

  return {
    id: generateVoiceQuestId(stageNumber, VOICE_QUEST_TYPES.ESSENCE),
    name: `${essenceName} Voice`,
    description: `How did your ${essenceName} ${voicePrompts.essenceAction} today?`,
    category: 'Voices',
    type: 'recognise',
    subType: 'essence',
    frequency: 'daily',
    points: 15,
    inputType: 'recognise_quest',
    stage_required: stageNumber,
    icon: '✨',
    voiceType: 'essence',
    archetypeName: essenceName,
    stageAction: voicePrompts.essenceAction
  }
}

/**
 * Generate a Protective Voice quest for a stage
 * @param {number} stageNumber - The stage number
 * @param {object} userArchetypes - User's archetypes { essence: string, protective: string }
 * @returns {object} Quest configuration
 */
export function generateProtectiveVoiceQuest(stageNumber, userArchetypes) {
  const stageConfig = getStageConfig(stageNumber)
  const voicePrompts = getVoicePrompts(stageNumber)

  if (!stageConfig || !voicePrompts) return null

  const protectiveName = userArchetypes?.protective || 'Protective Voice'

  return {
    id: generateVoiceQuestId(stageNumber, VOICE_QUEST_TYPES.PROTECTIVE),
    name: `${protectiveName} Voice`,
    description: `How did your ${protectiveName} ${voicePrompts.protectiveBlock} today?`,
    category: 'Voices',
    type: 'recognise',
    subType: 'protective',
    frequency: 'daily',
    points: 15,
    inputType: 'recognise_quest',
    stage_required: stageNumber,
    icon: '🛡️',
    voiceType: 'protective',
    archetypeName: protectiveName,
    stageBlock: voicePrompts.protectiveBlock
  }
}

/**
 * Generate a Stage Groan quest for a stage
 * @param {number} stageNumber - The stage number
 * @param {object} userArchetypes - User's archetypes { essence: string, protective: string }
 * @returns {object} Quest configuration
 */
export function generateStageGroanQuest(stageNumber, userArchetypes) {
  const stageConfig = getStageConfig(stageNumber)
  const voicePrompts = getVoicePrompts(stageNumber)

  if (!stageConfig || !voicePrompts) return null

  return {
    id: generateVoiceQuestId(stageNumber, VOICE_QUEST_TYPES.STAGE_GROAN),
    name: `${stageConfig.shortName} Groan`,
    description: voicePrompts.stageGroan,
    category: 'Voices',
    type: 'groan',
    frequency: 'anytime',
    points: 25,
    inputType: 'groan_reflection',
    stage_required: stageNumber,
    icon: stageConfig.icon,
    stageGroanChallenge: voicePrompts.stageGroan,
    // Include existing groan challenge data if available
    fear: stageConfig.groanChallenge?.fear || null,
    fullDescription: stageConfig.groanChallenge?.description || voicePrompts.stageGroan
  }
}

/**
 * Generate all voice quests for a specific stage
 * @param {number} stageNumber - The stage number
 * @param {object} userArchetypes - User's archetypes { essence: string, protective: string }
 * @returns {object[]} Array of quest configurations
 */
export function generateVoiceQuestsForStage(stageNumber, userArchetypes) {
  // Skip Flow Finder (stage 0) - it's user level, not project level
  if (stageNumber === STAGES.FLOW_FINDER) return []

  const quests = []

  const essenceQuest = generateEssenceVoiceQuest(stageNumber, userArchetypes)
  if (essenceQuest) quests.push(essenceQuest)

  const protectiveQuest = generateProtectiveVoiceQuest(stageNumber, userArchetypes)
  if (protectiveQuest) quests.push(protectiveQuest)

  const groanQuest = generateStageGroanQuest(stageNumber, userArchetypes)
  if (groanQuest) quests.push(groanQuest)

  return quests
}

/**
 * Generate all voice quests for all stages
 * @param {object} userArchetypes - User's archetypes { essence: string, protective: string }
 * @returns {object[]} Array of all voice quest configurations
 */
export function generateAllVoiceQuests(userArchetypes) {
  const allQuests = []

  // Generate for stages 1-8 (skip Flow Finder which is stage 0)
  for (let stage = STAGES.VALIDATION; stage <= STAGES.TRACKING; stage++) {
    const stageQuests = generateVoiceQuestsForStage(stage, userArchetypes)
    allQuests.push(...stageQuests)
  }

  return allQuests
}

/**
 * Check if a quest ID is a voice quest
 * @param {string} questId - The quest ID to check
 * @returns {boolean}
 */
export function isVoiceQuest(questId) {
  return questId?.startsWith('voice_stage_')
}

/**
 * Parse a voice quest ID to extract stage and type
 * @param {string} questId - The voice quest ID
 * @returns {object|null} { stageNumber: number, questType: string }
 */
export function parseVoiceQuestId(questId) {
  if (!isVoiceQuest(questId)) return null

  const match = questId.match(/^voice_stage_(\d+)_(.+)$/)
  if (!match) return null

  return {
    stageNumber: parseInt(match[1], 10),
    questType: match[2]
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  VOICE_QUEST_TYPES,
  generateVoiceQuestId,
  generateEssenceVoiceQuest,
  generateProtectiveVoiceQuest,
  generateStageGroanQuest,
  generateVoiceQuestsForStage,
  generateAllVoiceQuests,
  isVoiceQuest,
  parseVoiceQuestId
}
