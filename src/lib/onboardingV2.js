/**
 * Onboarding V2 - Path Routing & Emphasis Configuration
 *
 * This module contains all the logic for:
 * - Determining user path based on wealth ladder + goal
 * - Deriving persona from wealth ladder
 * - Emphasis configuration for dashboard/quest prioritization
 * - Valid goal options based on wealth ladder position
 *
 * Created: Jan 2026
 */

// ============================================================================
// PATH ROUTING
// ============================================================================

/**
 * Determine the full onboarding path based on wealth ladder and goal
 * @param {string} wealthLadder - pre_ladder, service, productized, products
 * @param {string} goal - discovery, creation, monetization, growth
 * @returns {object} Path configuration
 */
export function determineOnboardingPath(wealthLadder, goal) {
  // Path 1: Pre-ladder - Discovery/Creation focus
  if (wealthLadder === 'pre_ladder') {
    return {
      path: 1,
      emphasis: goal === 'creation' ? 'fast_track_creation' : 'deep_discovery',
      startingStage: null, // No stage yet - needs Flow Finder first
      nextFlow: '/nikigai/skills',
      nextFlowLabel: 'Flow Finder',
      description: 'Start with Flow Finder to discover your skills',
      showQuickCapture: false
    }
  }

  // Path 2: Service - Offer refinement/Client acquisition
  if (wealthLadder === 'service') {
    return {
      path: 2,
      emphasis: goal === 'monetization' ? 'client_acquisition' : 'offer_refinement',
      startingStage: goal === 'monetization' ? 3 : 2,
      nextFlow: 'quick_capture',
      nextFlowLabel: 'Quick Capture',
      description: 'Capture your existing service',
      showQuickCapture: true
    }
  }

  // Path 3: Productized - Suite building/Launch sales
  if (wealthLadder === 'productized') {
    return {
      path: 3,
      emphasis: goal === 'monetization' ? 'launch_sales' : 'suite_building',
      startingStage: goal === 'monetization' ? 5 : 4,
      nextFlow: 'quick_capture',
      nextFlowLabel: 'Quick Capture',
      description: 'Capture your existing offerings',
      showQuickCapture: true
    }
  }

  // Path 4: Products - Pipeline optimization/Scale systems
  if (wealthLadder === 'products') {
    return {
      path: 4,
      emphasis: goal === 'growth' ? 'scale_systems' : 'pipeline_optimization',
      startingStage: 6,
      nextFlow: 'quick_capture',
      nextFlowLabel: 'Quick Capture',
      description: 'Capture your product suite',
      showQuickCapture: true
    }
  }

  // Fallback
  return {
    path: 1,
    emphasis: 'deep_discovery',
    startingStage: null,
    nextFlow: '/nikigai/skills',
    nextFlowLabel: 'Flow Finder',
    description: 'Start discovering your flow',
    showQuickCapture: false
  }
}

/**
 * Determine guidance emphasis from wealth ladder + goal
 * Mirrors the database function determine_guidance_emphasis()
 */
export function determineGuidanceEmphasis(wealthLadder, goal) {
  if (wealthLadder === 'pre_ladder') {
    return goal === 'creation' ? 'fast_track_creation' : 'deep_discovery'
  }
  if (wealthLadder === 'service') {
    return goal === 'monetization' ? 'client_acquisition' : 'offer_refinement'
  }
  if (wealthLadder === 'productized') {
    return goal === 'monetization' ? 'launch_sales' : 'suite_building'
  }
  if (wealthLadder === 'products') {
    return goal === 'growth' ? 'scale_systems' : 'pipeline_optimization'
  }
  return 'deep_discovery'
}

/**
 * Derive persona from wealth ladder position
 * Mirrors the database function derive_persona_from_wealth_ladder()
 */
export function derivePersonaFromWealthLadder(wealthLadder) {
  switch (wealthLadder) {
    case 'pre_ladder': return 'vibe_seeker'
    case 'service':
    case 'productized': return 'vibe_riser'
    case 'products': return 'movement_maker'
    default: return 'vibe_seeker'
  }
}

/**
 * Get valid goal options based on wealth ladder position
 * Used to grey out invalid Q3 options
 */
export function getValidGoalsForWealthLadder(wealthLadder) {
  switch (wealthLadder) {
    case 'pre_ladder':
      return ['discovery', 'creation'] // Can't monetize or grow what doesn't exist
    case 'service':
      return ['creation', 'monetization'] // Can refine offer or get clients
    case 'productized':
      return ['creation', 'monetization', 'growth'] // Can add to suite, sell, or scale
    case 'products':
      return ['monetization', 'growth'] // Already discovered/created, focus on selling/scaling
    default:
      return ['discovery', 'creation', 'monetization', 'growth']
  }
}

/**
 * Get disabled reason for invalid goal selection
 * Shows helpful tooltip explaining why option is unavailable
 */
export function getGoalDisabledReason(goalId, wealthLadder) {
  if (goalId === 'monetization' && wealthLadder === 'pre_ladder') {
    return "First, let's figure out what you're offering"
  }
  if (goalId === 'growth' && wealthLadder === 'pre_ladder') {
    return "You'll unlock this once you have something to scale"
  }
  if (goalId === 'growth' && wealthLadder === 'service') {
    return "Focus on consistent clients first, then scale"
  }
  if (goalId === 'discovery' && wealthLadder === 'products') {
    return "You've already discovered - focus on what's working"
  }
  if (goalId === 'discovery' && wealthLadder === 'productized') {
    return "You've already discovered - refine or grow"
  }
  return null
}

// ============================================================================
// EMPHASIS CONFIGURATION
// ============================================================================

/**
 * Full configuration for each guidance emphasis
 * Controls: unlocked stages, quest priority, dashboard hero, Zarlo personality
 */
export const EMPHASIS_CONFIG = {
  deep_discovery: {
    id: 'deep_discovery',
    label: 'Deep Discovery',
    description: 'Focus on exploring and understanding your unique value',
    unlockedStages: [0, 1],
    questPriority: ['flow_finder_skills', 'flow_finder_problems', 'flow_finder_persona', 'nervous_system'],
    dashboardHero: 'flow_finder_wheels',
    heroTitle: 'Discover Your Flow',
    heroCta: 'Continue Flow Finder',
    heroRoute: '/nikigai/skills',
    zarloPersonality: 'curious_explorer',
    color: '#9333EA' // Purple
  },

  fast_track_creation: {
    id: 'fast_track_creation',
    label: 'Fast Track Creation',
    description: 'Quickly package your skills into a sellable offer',
    unlockedStages: [0, 1, 2],
    questPriority: ['quick_skills', 'offer_builder', 'first_customer', 'pricing'],
    dashboardHero: 'offer_builder_card',
    heroTitle: 'Build Your First Offer',
    heroCta: 'Create Offer',
    heroRoute: '/offer-builder',
    zarloPersonality: 'action_oriented',
    color: '#F59E0B' // Amber
  },

  offer_refinement: {
    id: 'offer_refinement',
    label: 'Offer Refinement',
    description: 'Improve and optimize your existing service',
    unlockedStages: [2, 3],
    questPriority: ['offer_builder', 'product_designer', 'testing', 'validation'],
    dashboardHero: 'offer_health',
    heroTitle: 'Refine Your Offer',
    heroCta: 'Audit Offer',
    heroRoute: '/offer-builder?mode=audit',
    zarloPersonality: 'strategic_advisor',
    color: '#3B82F6' // Blue
  },

  client_acquisition: {
    id: 'client_acquisition',
    label: 'Client Acquisition',
    description: 'Build systems to find and convert clients consistently',
    unlockedStages: [2, 3, 4],
    questPriority: ['crm_setup', 'lead_capture', 'nurture_sequence', 'sales_scripts'],
    dashboardHero: 'crm_pipeline',
    heroTitle: 'Get Your First Clients',
    heroCta: 'Open CRM',
    heroRoute: '/crm/sales',
    zarloPersonality: 'sales_coach',
    color: '#10B981' // Emerald
  },

  suite_building: {
    id: 'suite_building',
    label: 'Suite Building',
    description: 'Expand your offerings with upsells, downsells, and continuity',
    unlockedStages: [3, 4, 5],
    questPriority: ['upsell_assessment', 'downsell_assessment', 'continuity_assessment', 'product_suite'],
    dashboardHero: 'product_suite',
    heroTitle: 'Build Your Product Suite',
    heroCta: 'Add Upsell',
    heroRoute: '/upsell-offer',
    zarloPersonality: 'strategic_advisor',
    color: '#8B5CF6' // Violet
  },

  launch_sales: {
    id: 'launch_sales',
    label: 'Launch & Sales',
    description: 'Execute campaigns and close deals',
    unlockedStages: [4, 5, 6],
    questPriority: ['core_four', 'funnel_builder', 'launch_sequence', 'first_10_signups'],
    dashboardHero: 'campaign_progress',
    heroTitle: 'Launch Your Campaign',
    heroCta: 'Build Funnel',
    heroRoute: '/funnel-builder',
    zarloPersonality: 'accountability_partner',
    color: '#EF4444' // Red
  },

  pipeline_optimization: {
    id: 'pipeline_optimization',
    label: 'Pipeline Optimization',
    description: 'Optimize your funnel and improve conversions',
    unlockedStages: [5, 6, 7],
    questPriority: ['funnel_calculator', 'weekly_update', 'crm_optimization', 'bottleneck_analysis'],
    dashboardHero: 'funnel_metrics',
    heroTitle: 'Optimize Your Pipeline',
    heroCta: 'View Funnel',
    heroRoute: '/funnel-calculator',
    zarloPersonality: 'data_analyst',
    color: '#06B6D4' // Cyan
  },

  scale_systems: {
    id: 'scale_systems',
    label: 'Scale & Systems',
    description: 'Build systems to scale what\'s already working',
    unlockedStages: [1, 2, 3, 4, 5, 6, 7], // Full access
    questPriority: ['funnel_baseline', 'bottleneck_analysis', 'systems_review', 'team_building'],
    dashboardHero: 'revenue_dashboard',
    heroTitle: 'Scale Your Business',
    heroCta: 'View Dashboard',
    heroRoute: '/funnel-calculator',
    zarloPersonality: 'strategic_advisor',
    color: '#F97316' // Orange
  }
}

/**
 * Get emphasis config by ID
 */
export function getEmphasisConfig(emphasisId) {
  return EMPHASIS_CONFIG[emphasisId] || EMPHASIS_CONFIG.deep_discovery
}

// ============================================================================
// PERSONA DISPLAY DATA
// ============================================================================

/**
 * Persona display information for the reveal screen
 */
export const PERSONA_DISPLAY = {
  vibe_seeker: {
    id: 'vibe_seeker',
    name: 'Vibe Seeker',
    tagline: 'The Explorer',
    description: "You're at the start of an exciting journey. You have skills, passions, and ideas - now it's time to discover how they connect into something meaningful.",
    color: '#9333EA',
    icon: '🔮',
    nextStepLabel: 'Start with Flow Finder',
    nextStepDescription: "Let's discover what makes you unique"
  },

  vibe_riser: {
    id: 'vibe_riser',
    name: 'Vibe Riser',
    tagline: 'The Builder',
    description: "You've started building something real. Now it's time to refine your offer, attract the right clients, and create consistent momentum.",
    color: '#3B82F6',
    icon: '🚀',
    nextStepLabel: 'Capture Your Offering',
    nextStepDescription: "Let's document what you've built"
  },

  movement_maker: {
    id: 'movement_maker',
    name: 'Movement Maker',
    tagline: 'The Scaler',
    description: "You've proven your model works. Now it's time to optimize your systems, expand your reach, and scale what's already successful.",
    color: '#10B981',
    icon: '🌟',
    nextStepLabel: 'Map Your Suite',
    nextStepDescription: "Let's capture your product ecosystem"
  }
}

/**
 * Get persona display data by ID
 */
export function getPersonaDisplay(personaId) {
  return PERSONA_DISPLAY[personaId] || PERSONA_DISPLAY.vibe_seeker
}

// ============================================================================
// WEALTH LADDER DISPLAY DATA
// ============================================================================

export const WEALTH_LADDER_DISPLAY = {
  pre_ladder: {
    id: 'pre_ladder',
    label: 'Pre-Ladder',
    shortLabel: 'Exploring',
    description: 'Still discovering what to build',
    icon: '💭',
    position: 0,
    color: '#9333EA'
  },
  service: {
    id: 'service',
    label: 'Service',
    shortLabel: 'Service',
    description: 'Trading time for money',
    icon: '🤝',
    position: 1,
    color: '#3B82F6'
  },
  productized: {
    id: 'productized',
    label: 'Productized',
    shortLabel: 'Productized',
    description: 'Packaged offerings and programs',
    icon: '📦',
    position: 2,
    color: '#8B5CF6'
  },
  products: {
    id: 'products',
    label: 'Products',
    shortLabel: 'Products',
    description: 'Create once, sell many',
    icon: '🛍️',
    position: 3,
    color: '#10B981'
  }
}

/**
 * Get wealth ladder display data by ID
 */
export function getWealthLadderDisplay(ladderId) {
  return WEALTH_LADDER_DISPLAY[ladderId] || WEALTH_LADDER_DISPLAY.pre_ladder
}

// ============================================================================
// AUTO-EMPHASIS PROGRESSION
// ============================================================================

/**
 * Emphasis progression mapping
 * When a user completes certain stages, their emphasis may automatically update
 */
const EMPHASIS_PROGRESSION = {
  // Deep Discovery → Fast Track Creation (when completing Flow Finder)
  deep_discovery: {
    triggerStage: 1,
    nextEmphasis: 'fast_track_creation',
    condition: 'flow_finder_complete'
  },
  // Fast Track Creation → Offer Refinement (when completing first offer)
  fast_track_creation: {
    triggerStage: 2,
    nextEmphasis: 'offer_refinement',
    condition: 'stage_complete'
  },
  // Offer Refinement → Client Acquisition (when offer is validated)
  offer_refinement: {
    triggerStage: 3,
    nextEmphasis: 'client_acquisition',
    condition: 'stage_complete'
  },
  // Client Acquisition → Suite Building (when consistent clients)
  client_acquisition: {
    triggerStage: 4,
    nextEmphasis: 'suite_building',
    condition: 'stage_complete'
  },
  // Suite Building → Launch Sales (when suite is complete)
  suite_building: {
    triggerStage: 5,
    nextEmphasis: 'launch_sales',
    condition: 'stage_complete'
  },
  // Launch Sales → Pipeline Optimization (after launch)
  launch_sales: {
    triggerStage: 6,
    nextEmphasis: 'pipeline_optimization',
    condition: 'stage_complete'
  },
  // Pipeline Optimization → Scale Systems (when funnel is optimized)
  pipeline_optimization: {
    triggerStage: 7,
    nextEmphasis: 'scale_systems',
    condition: 'stage_complete'
  },
  // Scale Systems stays at Scale Systems (end of progression)
  scale_systems: {
    triggerStage: null,
    nextEmphasis: null,
    condition: null
  }
}

/**
 * Get next emphasis based on current emphasis and completed stage
 * @param {string} currentEmphasis - Current guidance emphasis
 * @param {number} completedStage - Stage that was just completed
 * @returns {string|null} Next emphasis, or null if no progression
 */
export function getNextEmphasis(currentEmphasis, completedStage) {
  const progression = EMPHASIS_PROGRESSION[currentEmphasis]

  if (!progression || !progression.nextEmphasis) {
    return null
  }

  // Check if the completed stage triggers a progression
  if (progression.triggerStage && completedStage >= progression.triggerStage) {
    return progression.nextEmphasis
  }

  return null
}

/**
 * Determine if emphasis should auto-progress based on stage graduation
 * This is called by graduationChecker when a project graduates
 * @param {string} currentEmphasis - Current guidance emphasis
 * @param {number} fromStage - Stage being graduated from
 * @param {number} toStage - Stage being graduated to
 * @returns {object} { shouldProgress: boolean, newEmphasis: string|null }
 */
export function checkEmphasisProgression(currentEmphasis, fromStage, toStage) {
  const progression = EMPHASIS_PROGRESSION[currentEmphasis]

  if (!progression || !progression.nextEmphasis) {
    return { shouldProgress: false, newEmphasis: null }
  }

  // Progress if graduating from or past the trigger stage
  if (progression.triggerStage && fromStage >= progression.triggerStage) {
    return {
      shouldProgress: true,
      newEmphasis: progression.nextEmphasis
    }
  }

  return { shouldProgress: false, newEmphasis: null }
}

/**
 * Get emphasis recommendation based on current stage
 * Useful for suggesting emphasis changes to users
 * @param {number} currentStage - Current stage (1-7)
 * @param {string} wealthLadder - Current wealth ladder position
 * @returns {string} Recommended emphasis
 */
export function getRecommendedEmphasis(currentStage, wealthLadder) {
  // Map stages to appropriate emphasis
  const stageEmphasisMap = {
    1: wealthLadder === 'pre_ladder' ? 'deep_discovery' : 'fast_track_creation',
    2: 'offer_refinement',
    3: 'client_acquisition',
    4: 'suite_building',
    5: 'launch_sales',
    6: 'pipeline_optimization',
    7: 'scale_systems'
  }

  return stageEmphasisMap[currentStage] || 'deep_discovery'
}
