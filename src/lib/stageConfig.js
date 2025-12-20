/**
 * Stage Configuration for Project-Based Progression
 *
 * This replaces the persona-based stage system with a universal 6-stage
 * progression that applies to all projects.
 *
 * Created: 2024-12-20
 * See: docs/2024-12-20-major-refactor-plan.md
 */

// =============================================================================
// STAGE DEFINITIONS
// =============================================================================

export const STAGES = {
  VALIDATION: 1,
  PRODUCT_CREATION: 2,
  TESTING: 3,
  MONEY_MODELS: 4,
  CAMPAIGN_CREATION: 5,
  LAUNCH: 6
}

export const STAGE_CONFIG = {
  [STAGES.VALIDATION]: {
    id: 1,
    name: 'Validation',
    shortName: 'Validation',
    description: 'Validate your opportunity with real potential customers',
    icon: '🔍',
    color: '#6366f1', // indigo
    requiredFlows: ['persona_selection'],
    milestones: ['validation_form_sent', 'validation_responses_3'],
    groanChallenge: {
      id: 'groan_stage_1_validation',
      name: 'Validation Groan',
      fear: 'Fear of rejection when asking for feedback',
      description: 'Reach out to someone and ask for honest feedback on your idea, even though you fear they might reject it or say it\'s not good enough.'
    },
    tabLabel: 'Validation',
    upsellPrompt: null,
    externalLink: null
  },
  [STAGES.PRODUCT_CREATION]: {
    id: 2,
    name: 'Product Creation',
    shortName: 'Product',
    description: 'Build your core offer and lead magnet',
    icon: '🛠️',
    color: '#8b5cf6', // violet
    requiredFlows: ['100m_offer', 'lead_magnet'],
    milestones: ['offer_created', 'lead_magnet_created'],
    groanChallenge: {
      id: 'groan_stage_2_creation',
      name: 'Creation Groan',
      fear: 'Fear of imperfection / shipping before it\'s ready',
      description: 'Ship something (a page, a product, content) before you feel it\'s 100% ready. Your essence knows it\'s good enough, but your body fears judgment.'
    },
    tabLabel: 'Product Creation',
    upsellPrompt: 'Want help building faster? Try buildwithAI',
    externalLink: null
  },
  [STAGES.TESTING]: {
    id: 3,
    name: 'Testing',
    shortName: 'Testing',
    description: 'Test your product with real users and gather feedback',
    icon: '🎯',
    color: '#ec4899', // pink
    requiredFlows: [],
    milestones: ['offer_tested_with_3', 'testing_complete', 'feedback_responses_3', 'improvements_identified'],
    groanChallenge: {
      id: 'groan_stage_3_testing',
      name: 'Testing Groan',
      fear: 'Fear of hearing negative feedback',
      description: 'Ask a tester to be brutally honest about what\'s NOT working. Sit with the discomfort of criticism without defending or explaining.'
    },
    tabLabel: 'Testing',
    upsellPrompt: null,
    externalLink: null
  },
  [STAGES.MONEY_MODELS]: {
    id: 4,
    name: 'Money Models',
    shortName: 'Money Models',
    description: 'Expand your offer stack with upsells, downsells, and continuity',
    icon: '💰',
    color: '#f59e0b', // amber
    requiredFlows: ['upsell_offer', 'downsell_offer', 'continuity_offer'],
    milestones: ['decide_acquisition', 'decide_upsell', 'decide_downsell', 'decide_continuity'],
    groanChallenge: {
      id: 'groan_stage_4_money',
      name: 'Money Groan',
      fear: 'Fear of charging money / being "salesy"',
      description: 'Tell someone your price confidently without apologizing, discounting, or over-explaining. Own your value even when it feels uncomfortable.'
    },
    tabLabel: 'Money Models',
    upsellPrompt: null,
    externalLink: null
  },
  [STAGES.CAMPAIGN_CREATION]: {
    id: 5,
    name: 'Campaign Creation',
    shortName: 'Campaign',
    description: 'Create your lead generation strategy and marketing assets',
    icon: '📢',
    color: '#10b981', // emerald
    requiredFlows: ['leads_strategy'],
    milestones: ['strategy_identified'],
    groanChallenge: {
      id: 'groan_stage_5_campaign',
      name: 'Campaign Groan',
      fear: 'Fear of public visibility',
      description: 'Put yourself out there publicly in a way that feels exposing - a video, a post, an interview. Let the world see the real you, not the polished version.'
    },
    tabLabel: 'Campaign Creation',
    upsellPrompt: null,
    externalLink: {
      name: 'Marketing Tower',
      description: 'CRM integration for campaign management'
    }
  },
  [STAGES.LAUNCH]: {
    id: 6,
    name: 'Launch',
    shortName: 'Launch',
    description: 'Execute your launch with your leads funnel',
    icon: '🚀',
    color: '#ef4444', // red
    requiredFlows: ['attraction_offer'],
    milestones: ['acquisition_offer_launched'],
    groanChallenge: {
      id: 'groan_stage_6_launch',
      name: 'Launch Groan',
      fear: 'Fear of failure after going "all in"',
      description: 'Make a bold, public commitment to your launch with a specific date. Announce it to your audience. No backing out, no moving the goalposts.'
    },
    tabLabel: 'Launch',
    upsellPrompt: null,
    externalLink: {
      name: 'Sales Tower + Analytics',
      description: 'CRM integration for sales and analytics'
    }
  }
}

// =============================================================================
// STEP 0: FLOW FINDER (PREREQUISITE)
// =============================================================================

export const FLOW_FINDER_CONFIG = {
  name: 'Flow Finder',
  description: 'Discover your unique skills, problems, and personas',
  icon: '🧭',
  color: '#5e17eb', // brand purple
  flows: [
    { id: 'nikigai_skills', name: 'Skills', route: '/nikigai/skills', points: 40 },
    { id: 'nikigai_problems', name: 'Problems', route: '/nikigai/problems', points: 40 },
    { id: 'nikigai_persona', name: 'Personas', route: '/nikigai/persona', points: 30 },
    { id: 'nikigai_integration', name: 'Integration', route: '/nikigai/integration', points: 30 }
  ],
  totalPoints: 140,
  // Flow Finder is required for:
  // - All Vibe Seekers
  // - Vibe Risers choosing "new opportunity"
  // Optional for:
  // - Movement Makers (can discover adjacent opportunities)
  // - Vibe Risers with existing project
  isPrerequisiteFor: (persona, hasExistingProject) => {
    if (persona === 'vibe_seeker') return true
    if (persona === 'vibe_riser' && !hasExistingProject) return true
    return false
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get stage configuration by stage number
 */
export function getStageConfig(stageNumber) {
  return STAGE_CONFIG[stageNumber] || null
}

/**
 * Get stage display name
 */
export function getStageDisplayName(stageNumber) {
  const config = STAGE_CONFIG[stageNumber]
  return config?.name || `Stage ${stageNumber}`
}

/**
 * Get stage short name (for tabs)
 */
export function getStageShortName(stageNumber) {
  const config = STAGE_CONFIG[stageNumber]
  return config?.shortName || `Stage ${stageNumber}`
}

/**
 * Get next stage number
 */
export function getNextStage(currentStage) {
  if (currentStage >= STAGES.LAUNCH) return null
  return currentStage + 1
}

/**
 * Get previous stage number
 */
export function getPreviousStage(currentStage) {
  if (currentStage <= STAGES.VALIDATION) return null
  return currentStage - 1
}

/**
 * Check if stage is unlocked for a project
 */
export function isStageUnlocked(projectStage, targetStage) {
  return targetStage <= projectStage
}

/**
 * Check if stage can be accessed (current or previous)
 */
export function canAccessStage(projectStage, targetStage) {
  return targetStage <= projectStage
}

/**
 * Get all stages as array for iteration
 */
export function getAllStages() {
  return Object.values(STAGE_CONFIG).sort((a, b) => a.id - b.id)
}

/**
 * Get required flows for a stage
 */
export function getRequiredFlows(stageNumber) {
  const config = STAGE_CONFIG[stageNumber]
  return config?.requiredFlows || []
}

/**
 * Get required milestones for a stage
 */
export function getRequiredMilestones(stageNumber) {
  const config = STAGE_CONFIG[stageNumber]
  return config?.milestones || []
}

/**
 * Get groan challenge for a stage
 */
export function getGroanChallenge(stageNumber) {
  const config = STAGE_CONFIG[stageNumber]
  return config?.groanChallenge || null
}

/**
 * Get groan challenge ID for a stage
 */
export function getGroanChallengeId(stageNumber) {
  const config = STAGE_CONFIG[stageNumber]
  return config?.groanChallenge?.id || null
}

/**
 * Check if all required flows are completed for a stage
 * @param {number} stageNumber - The stage to check
 * @param {string[]} completedFlows - Array of completed flow IDs
 * @returns {boolean}
 */
export function areStageFlowsComplete(stageNumber, completedFlows) {
  const required = getRequiredFlows(stageNumber)
  if (required.length === 0) return true
  return required.every(flow => completedFlows.includes(flow))
}

/**
 * Calculate stage progress percentage
 * @param {number} stageNumber - The stage to check
 * @param {string[]} completedFlows - Completed flow IDs
 * @param {string[]} completedMilestones - Completed milestone IDs
 * @returns {number} 0-100
 */
export function getStageProgress(stageNumber, completedFlows, completedMilestones) {
  const config = STAGE_CONFIG[stageNumber]
  if (!config) return 0

  const requiredFlows = config.requiredFlows || []
  const requiredMilestones = config.milestones || []
  const totalRequired = requiredFlows.length + requiredMilestones.length

  if (totalRequired === 0) return 100

  const completedFlowCount = requiredFlows.filter(f => completedFlows.includes(f)).length
  const completedMilestoneCount = requiredMilestones.filter(m => completedMilestones.includes(m)).length

  return Math.round(((completedFlowCount + completedMilestoneCount) / totalRequired) * 100)
}

/**
 * Determine starting stage based on user's existing progress
 * Used in onboarding for users with existing projects
 * @param {string} progressDescription - User's answer about their progress
 * @returns {number} Stage number 1-6
 */
export function determineStartingStage(progressDescription) {
  const stageMap = {
    'not_validated': STAGES.VALIDATION,
    'validated_no_product': STAGES.PRODUCT_CREATION,
    'have_product_not_tested': STAGES.TESTING,
    'have_product_with_customers': STAGES.MONEY_MODELS,
    'multiple_offers_ready_to_scale': STAGES.CAMPAIGN_CREATION,
    'ready_to_launch_campaign': STAGES.LAUNCH
  }
  return stageMap[progressDescription] || STAGES.VALIDATION
}

// =============================================================================
// PERSONA MAPPING (for backwards compatibility during transition)
// =============================================================================

/**
 * Map old persona stages to new universal stages
 * Used during transition period
 */
export const LEGACY_STAGE_MAPPING = {
  // Vibe Seeker
  'clarity': STAGES.VALIDATION, // After Flow Finder, start at Validation

  // Vibe Riser
  'validation': STAGES.VALIDATION,
  'creation': STAGES.PRODUCT_CREATION,
  'testing': STAGES.TESTING,
  'launch': STAGES.LAUNCH,

  // Movement Maker
  'ideation': STAGES.MONEY_MODELS,
  // 'creation' already mapped above
  // 'launch' already mapped above
}

/**
 * Convert legacy stage name to new stage number
 */
export function convertLegacyStage(legacyStageName) {
  return LEGACY_STAGE_MAPPING[legacyStageName] || STAGES.VALIDATION
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  STAGES,
  STAGE_CONFIG,
  FLOW_FINDER_CONFIG,
  getStageConfig,
  getStageDisplayName,
  getStageShortName,
  getNextStage,
  getPreviousStage,
  isStageUnlocked,
  canAccessStage,
  getAllStages,
  getRequiredFlows,
  getRequiredMilestones,
  getGroanChallenge,
  getGroanChallengeId,
  areStageFlowsComplete,
  getStageProgress,
  determineStartingStage,
  convertLegacyStage,
  LEGACY_STAGE_MAPPING
}
