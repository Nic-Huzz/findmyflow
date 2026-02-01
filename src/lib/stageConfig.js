/**
 * Stage Configuration for Project-Based Progression
 *
 * Universal 9-stage system:
 * - Stage 0: Flow Finder (always accessible)
 * - Stages 1-7: Progressive stages (Validation → Product → Testing → Money Models → Offer Creation → Campaign → Launch)
 * - Stage 8: Tracking (always accessible)
 *
 * Created: 2024-12-20
 * See: docs/2024-12-20-major-refactor-plan.md
 */

// =============================================================================
// STAGE DEFINITIONS
// =============================================================================

export const STAGES = {
  FLOW_FINDER: 0,
  GROANS: 0.5,
  VALIDATION: 1,
  PRODUCT_CREATION: 2,
  TESTING: 3,
  MONEY_MODELS: 4,
  OFFER_CREATION: 5,
  CAMPAIGN_CREATION: 6,
  LAUNCH: 7,
  TRACKING: 8
}

export const STAGE_CONFIG = {
  [STAGES.FLOW_FINDER]: {
    id: 0,
    name: 'Flow Finder',
    shortName: 'Flow Finder',
    description: 'Discover your unique skills, problems, and personas',
    icon: '🧭',
    color: '#5e17eb', // brand purple (ombre start)
    requiredFlows: ['nikigai_skills', 'nikigai_problems', 'nikigai_persona', 'nikigai_integration'],
    milestones: [],
    groanChallenge: null, // No groan for Flow Finder
    tabLabel: 'Flow Finder',
    upsellPrompt: null,
    externalLink: null,
    isUserLevel: true, // Key flag: this stage is user-level, not project-level
    alwaysAccessible: true // Can be accessed from any project stage
  },
  [STAGES.GROANS]: {
    id: 0.5,
    name: 'Play',
    shortName: 'Play',
    description: 'Challenges that push you past your comfort zone to grow',
    icon: '🎮',
    color: '#6d26d7', // purple→gold ombre
    requiredFlows: [],
    milestones: [],
    groanChallenge: null,
    tabLabel: 'Play',
    upsellPrompt: null,
    externalLink: null,
    isUserLevel: true,
    alwaysAccessible: true, // Keep true so it renders
    isGroansStage: true, // Flag to identify this as the Groans stage for quest filtering
    temporarilyLocked: true // Flag to lock this tab during testing
  },
  [STAGES.VALIDATION]: {
    id: 1,
    name: 'Validation',
    shortName: 'Validation',
    description: 'Validate your opportunity with real potential customers',
    icon: '🔍',
    color: '#7d36c4', // purple→gold ombre
    requiredFlows: ['persona_selection'],
    milestones: ['validation_form_sent', 'validation_responses_3'],
    groanChallenge: {
      id: 'groan_stage_1_validation',
      name: 'Validation Groan',
      fear: 'Fear of rejection when asking for feedback',
      description: 'Reach out to someone and ask for honest feedback on your idea, even though you fear they might reject it or say it\'s not good enough.'
    },
    voicePrompts: {
      essenceAction: 'share your idea boldly',
      protectiveBlock: 'stop you from asking for feedback',
      stageGroan: 'Ask 1 person for honest feedback'
    },
    tabLabel: 'Validation',
    upsellPrompt: null,
    externalLink: null
  },
  [STAGES.PRODUCT_CREATION]: {
    id: 2,
    name: 'Product Creation',
    shortName: 'Product',
    description: 'Build your core product, lead magnet, and value proposition',
    icon: '🛠️',
    color: '#8c45b0', // purple→gold ombre
    requiredFlows: ['100m_offer', 'lead_magnet_selection', 'product_selection'],
    milestones: [
      'lead_magnet_created'
    ],
    groanChallenge: {
      id: 'groan_stage_2_creation',
      name: 'Creation Groan',
      fear: 'Fear of imperfection / shipping before it\'s ready',
      description: 'Ship something (a page, a product, content) before you feel it\'s 100% ready. Your essence knows it\'s good enough, but your body fears judgment.'
    },
    voicePrompts: {
      essenceAction: 'create without waiting for permission',
      protectiveBlock: 'keep you from shipping',
      stageGroan: 'Ship something before it feels ready'
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
    color: '#9c559d', // purple→gold ombre
    requiredFlows: ['mvp_readiness', 'feedback_analysis'],
    milestones: ['feedback_form_sent'],
    groanChallenge: {
      id: 'groan_stage_3_testing',
      name: 'Testing Groan',
      fear: 'Fear of hearing negative feedback',
      description: 'Ask a tester to be brutally honest about what\'s NOT working. Sit with the discomfort of criticism without defending or explaining.'
    },
    voicePrompts: {
      essenceAction: 'receive feedback with confidence',
      protectiveBlock: 'make you defensive about criticism',
      stageGroan: 'Ask for brutal honesty without defending'
    },
    tabLabel: 'Testing',
    upsellPrompt: null,
    externalLink: null
  },
  [STAGES.MONEY_MODELS]: {
    id: 4,
    name: 'Money Models',
    shortName: 'Money Models',
    description: 'Build your complete product suite with attraction, upsell, downsell, and continuity',
    icon: '💰',
    color: '#ab6489', // purple→gold ombre
    requiredFlows: ['attraction_offer', 'upsell_offer', 'downsell_offer', 'continuity_offer'],
    milestones: [
      'decide_acquisition',
      'decide_upsell',
      'decide_downsell',
      'decide_continuity',
      'create_acquisition_offer',
      'create_upsell_offer',
      'create_downsell_offer',
      'create_continuity_offer',
      'product_suite_mapped',
      'money_model_stack_complete'
    ],
    groanChallenge: {
      id: 'groan_stage_4_money',
      name: 'Money Groan',
      fear: 'Fear of charging money / being "salesy"',
      description: 'Tell someone your price confidently without apologizing, discounting, or over-explaining. Own your value even when it feels uncomfortable.'
    },
    voicePrompts: {
      essenceAction: 'own your value today',
      protectiveBlock: 'make you discount or over-explain',
      stageGroan: 'State your price without apologizing'
    },
    tabLabel: 'Money Models',
    upsellPrompt: null,
    externalLink: null
  },
  [STAGES.OFFER_CREATION]: {
    id: 5,
    name: 'Offer Creation',
    shortName: 'Grand Slam',
    description: 'Build your irresistible Grand Slam offer with bonuses, guarantee, and scarcity',
    icon: '🎯',
    color: '#bb7476', // purple→gold ombre
    requiredFlows: ['offer_builder_v2'],
    milestones: [
      'grand_slam_bonuses_created',
      'grand_slam_guarantee_created',
      'grand_slam_scarcity_created'
    ],
    groanChallenge: {
      id: 'groan_stage_5_offer',
      name: 'Offer Groan',
      fear: 'Fear of making your offer too good / giving away too much',
      description: 'Add one more bonus or strengthen your guarantee beyond what feels comfortable. Your essence knows abundance attracts abundance, but your body fears you\'re giving away your value.'
    },
    voicePrompts: {
      essenceAction: 'stack value from abundance',
      protectiveBlock: 'hold you back from adding more value',
      stageGroan: 'Add a bonus that feels like too much'
    },
    tabLabel: 'Offer Creation',
    upsellPrompt: null,
    externalLink: null
  },
  [STAGES.CAMPAIGN_CREATION]: {
    id: 6,
    name: 'Campaign Creation',
    shortName: 'Campaign',
    description: 'Create your lead generation strategy and marketing assets',
    icon: '📢',
    color: '#ca8362', // purple→gold ombre
    requiredFlows: ['leads_strategy'],
    milestones: ['launch_sequence_planned'],
    groanChallenge: {
      id: 'groan_stage_6_campaign',
      name: 'Campaign Groan',
      fear: 'Fear of public visibility',
      description: 'Put yourself out there publicly in a way that feels exposing - a video, a post, an interview. Let the world see the real you, not the polished version.'
    },
    voicePrompts: {
      essenceAction: 'show up publicly today',
      protectiveBlock: 'hold you back from being seen',
      stageGroan: 'Put yourself out there publicly'
    },
    tabLabel: 'Campaign Creation',
    upsellPrompt: null,
    externalLink: {
      name: 'Marketing Tower',
      description: 'CRM integration for campaign management'
    }
  },
  [STAGES.LAUNCH]: {
    id: 7,
    name: 'Launch',
    shortName: 'Launch',
    description: 'Execute your launch with your leads funnel',
    icon: '🚀',
    color: '#da934f', // purple→gold ombre
    requiredFlows: [],
    milestones: ['acquisition_offer_launched', 'post_launch_review'],
    groanChallenge: {
      id: 'groan_stage_7_launch',
      name: 'Launch Groan',
      fear: 'Fear of failure after going "all in"',
      description: 'Make a bold, public commitment to your launch with a specific date. Announce it to your audience. No backing out, no moving the goalposts.'
    },
    voicePrompts: {
      essenceAction: 'commit boldly despite uncertainty',
      protectiveBlock: 'delay your commitment',
      stageGroan: 'Announce a launch date publicly'
    },
    tabLabel: 'Launch',
    upsellPrompt: null,
    externalLink: {
      name: 'Sales Tower + Analytics',
      description: 'CRM integration for sales and analytics'
    }
  },
  [STAGES.TRACKING]: {
    id: 8,
    name: 'Tracking',
    shortName: 'Tracking',
    description: 'Track your funnel metrics and optimize conversions',
    icon: '📊',
    color: '#E9A23B', // gold (ombre end - success!)
    requiredFlows: ['income_calculator', 'funnel_calculator'],
    milestones: [],
    groanChallenge: null, // No groan for Tracking
    voicePrompts: {
      essenceAction: 'face your results with curiosity',
      protectiveBlock: 'avoid looking at the data',
      stageGroan: 'Review your numbers without judgment'
    },
    tabLabel: 'Tracking',
    upsellPrompt: null,
    externalLink: {
      name: 'Analytics Dashboard',
      description: 'Advanced funnel analytics and reporting'
    },
    alwaysAccessible: true // Can be accessed at any stage
  }
}

// =============================================================================
// GROAN VISIBILITY LAYERS (for Matrix System)
// =============================================================================

/**
 * The 5 visibility layers represent different types of fear/exposure
 * Used in the Groan Matrix to generate personalized challenges
 *
 * Matrix structure:
 * - Rows: Skills, Problems, Personas (from Flow Finder)
 * - Columns: These 5 visibility layers
 *
 * Each cell generates AI-powered challenges based on the combination
 */
export const GROAN_VISIBILITY_LAYERS = [
  {
    id: 'screen',
    label: 'SCREEN',
    icon: '📱',
    color: '#3b82f6', // blue
    fear: 'Being seen online',
    description: 'Behind a screen - sharing content, posting, creating online presence',
    examples: [
      'Post about your expertise on social media',
      'Share a behind-the-scenes moment',
      'Publish content without editing 10 times'
    ],
    difficulty: 1
  },
  {
    id: 'live',
    label: 'LIVE',
    icon: '⚡',
    color: '#f59e0b', // amber
    fear: 'Real-time judgment',
    description: 'Face-to-face or live video - real-time interaction without editing',
    examples: [
      'Go live on social media',
      'Host a virtual workshop',
      'Have a discovery call with a stranger'
    ],
    difficulty: 2
  },
  {
    id: 'money',
    label: 'MONEY',
    icon: '💰',
    color: '#10b981', // emerald
    fear: '"Am I worth it?"',
    description: 'Asking for money - pricing, selling, stating your value',
    examples: [
      'Quote your full price without discounting',
      'Follow up on an unpaid invoice',
      'Pitch your premium offer'
    ],
    difficulty: 3
  },
  {
    id: 'vulnerable',
    label: 'VULNERABLE',
    icon: '💗',
    color: '#ec4899', // pink
    fear: 'Rejected for real self',
    description: 'Deep vulnerability - sharing authentic struggles, imperfections, real story',
    examples: [
      'Share a failure publicly',
      'Ask for help from your community',
      'Admit you don\'t have all the answers'
    ],
    difficulty: 4
  },
  {
    id: 'authority',
    label: 'AUTHORITY',
    icon: '👑',
    color: '#8b5cf6', // violet
    fear: 'Imposter syndrome',
    description: 'Claiming expertise - positioning as leader, expert, authority in your space',
    examples: [
      'Write "I\'m an expert in..." on your profile',
      'Correct someone in your field publicly',
      'Pitch yourself to speak at an event'
    ],
    difficulty: 5
  }
]

/**
 * Get visibility layer by ID
 */
export function getVisibilityLayer(layerId) {
  return GROAN_VISIBILITY_LAYERS.find(layer => layer.id === layerId) || null
}

/**
 * Get visibility layer display info
 */
export function getVisibilityLayerDisplay(layerId) {
  const layer = getVisibilityLayer(layerId)
  if (!layer) return null
  return {
    icon: layer.icon,
    label: layer.label,
    color: layer.color,
    fear: layer.fear
  }
}

/**
 * Get all visibility layers sorted by difficulty
 */
export function getVisibilityLayersByDifficulty() {
  return [...GROAN_VISIBILITY_LAYERS].sort((a, b) => a.difficulty - b.difficulty)
}

/**
 * Calculate "Essence Zone" based on scary + wahoo scores
 * High fear + High excitement = This IS your essence (trauma around expressing true self)
 *
 * @param {number} scaryScore - 1-10 how scary
 * @param {number} wahooScore - 1-10 how exciting
 * @returns {{ zone: string, insight: string, isEssenceZone: boolean }}
 */
export function calculateEssenceZone(scaryScore, wahooScore) {
  const highScary = scaryScore >= 7
  const highWahoo = wahooScore >= 7
  const lowScary = scaryScore <= 3
  const lowWahoo = wahooScore <= 3

  if (highScary && highWahoo) {
    return {
      zone: 'essence',
      insight: 'This is your essence zone - high fear + high excitement means this is who you really are. The fear is trauma around expressing your true self.',
      isEssenceZone: true,
      color: '#ec4899' // pink
    }
  }

  if (highScary && lowWahoo) {
    return {
      zone: 'protective',
      insight: 'High fear but low excitement - this might be your protective voice speaking. Consider if this is truly aligned with your essence.',
      isEssenceZone: false,
      color: '#6b7280' // gray
    }
  }

  if (lowScary && highWahoo) {
    return {
      zone: 'comfort',
      insight: 'Low fear and high excitement - this is your comfort zone. Great for building momentum, but growth happens at the edges.',
      isEssenceZone: false,
      color: '#10b981' // emerald
    }
  }

  if (lowScary && lowWahoo) {
    return {
      zone: 'neutral',
      insight: 'Low engagement both ways - this might not be aligned with your core purpose. Consider exploring other directions.',
      isEssenceZone: false,
      color: '#9ca3af' // lighter gray
    }
  }

  // Medium scores
  return {
    zone: 'growth',
    insight: 'Moderate fear and excitement - a healthy growth challenge. Push through and see what emerges.',
    isEssenceZone: false,
    color: '#f59e0b' // amber
  }
}

/**
 * Source types for groan challenges
 * Determines where the challenge data came from
 */
export const GROAN_SOURCE_TYPES = {
  SKILL: 'skill',
  PROBLEM: 'problem',
  PERSONA: 'persona',
  MANUAL: 'manual' // User-created custom groan
}

/**
 * Groan challenge statuses
 * Note: DB enum has: active, completed, skipped
 * 'active' covers both generated (new) and accepted (in progress)
 */
export const GROAN_CHALLENGE_STATUS = {
  GENERATED: 'active',    // AI created but not started (maps to 'active')
  ACCEPTED: 'active',     // User accepted the challenge (maps to 'active')
  COMPLETED: 'completed', // User marked as done
  SKIPPED: 'skipped'      // User skipped with feedback
}

/**
 * Skip reasons for protective pattern detection
 */
export const GROAN_SKIP_REASONS = {
  TOO_SCARY: 'too_scary',
  NOT_RELEVANT: 'not_relevant',
  ALREADY_DO_THIS: 'already_do_this',
  DONT_UNDERSTAND: 'dont_understand',
  OTHER: 'other'
}

/**
 * Streak badge thresholds (weeks)
 */
export const GROAN_STREAK_BADGES = [
  { weeks: 4, badge: 'Courage Starter', icon: '🌱', description: '4 weeks of facing fears' },
  { weeks: 12, badge: 'Fear Fighter', icon: '⚔️', description: '3 months of growth' },
  { weeks: 26, badge: 'Comfort Zone Crusher', icon: '💪', description: 'Half a year of courage' },
  { weeks: 52, badge: 'Essence Embodied', icon: '👑', description: 'A full year living authentically' }
]

/**
 * Get badge earned for a streak count
 */
export function getStreakBadge(streakWeeks) {
  const earned = GROAN_STREAK_BADGES
    .filter(b => streakWeeks >= b.weeks)
    .sort((a, b) => b.weeks - a.weeks)
  return earned[0] || null
}

/**
 * Get next badge milestone
 */
export function getNextStreakBadge(streakWeeks) {
  return GROAN_STREAK_BADGES.find(b => b.weeks > streakWeeks) || null
}

// =============================================================================
// STEP 0: FLOW FINDER (PREREQUISITE)
// =============================================================================

export const FLOW_FINDER_CONFIG = {
  name: 'Flow Finder',
  description: 'Discover your unique skills, problems, and personas',
  icon: '🧭',
  color: '#5e17eb', // brand purple (matches stage config)
  flows: [
    { id: 'nikigai_skills', name: 'Skills', route: '/nikigai/skills', points: 10 },
    { id: 'nikigai_problems', name: 'Problems', route: '/nikigai/problems', points: 10 },
    { id: 'nikigai_persona', name: 'Personas', route: '/nikigai/persona', points: 9 },
    { id: 'nikigai_integration', name: 'Integration', route: '/nikigai/integration', points: 6 }
  ],
  totalPoints: 35,
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
 * Note: TRACKING (8) is always accessible but not part of normal progression
 */
export function getNextStage(currentStage) {
  if (currentStage >= STAGES.LAUNCH) return null // TRACKING is not part of normal progression
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
 * Get voice prompts for a stage
 * Used for stage-specific Essence/Protective voice quests
 */
export function getVoicePrompts(stageNumber) {
  const config = STAGE_CONFIG[stageNumber]
  return config?.voicePrompts || null
}

/**
 * Generate personalized voice quest question
 * @param {number} stageNumber - The stage number
 * @param {string} voiceType - 'essence' or 'protective'
 * @param {string} archetypeName - The user's archetype name (e.g., "Radiant Rebel")
 * @returns {string} The personalized question
 */
export function generateVoiceQuestion(stageNumber, voiceType, archetypeName) {
  const prompts = getVoicePrompts(stageNumber)
  if (!prompts) return null

  if (voiceType === 'essence') {
    return `How did your ${archetypeName} ${prompts.essenceAction} today?`
  } else if (voiceType === 'protective') {
    return `How did your ${archetypeName} ${prompts.protectiveBlock} today?`
  }
  return null
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
 * @returns {number} Stage number 1-7
 */
export function determineStartingStage(progressDescription) {
  const stageMap = {
    'not_validated': STAGES.VALIDATION,
    'validated_no_product': STAGES.PRODUCT_CREATION,
    'have_product_not_tested': STAGES.TESTING,
    'have_product_with_customers': STAGES.MONEY_MODELS,
    'have_money_models_need_grand_slam': STAGES.OFFER_CREATION,
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
  'money_models': STAGES.MONEY_MODELS,
  'offer_creation': STAGES.OFFER_CREATION,
  'campaign': STAGES.CAMPAIGN_CREATION,
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
  // Groan Matrix exports
  GROAN_VISIBILITY_LAYERS,
  GROAN_SOURCE_TYPES,
  GROAN_CHALLENGE_STATUS,
  GROAN_SKIP_REASONS,
  GROAN_STREAK_BADGES,
  getVisibilityLayer,
  getVisibilityLayerDisplay,
  getVisibilityLayersByDifficulty,
  calculateEssenceZone,
  getStreakBadge,
  getNextStreakBadge,
  // Stage helpers
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
  getVoicePrompts,
  generateVoiceQuestion,
  areStageFlowsComplete,
  getStageProgress,
  determineStartingStage,
  convertLegacyStage,
  LEGACY_STAGE_MAPPING
}
