/**
 * Money Model Flow Configurations
 *
 * This file defines the configuration for each Money Model flow.
 * Used to reduce duplication across the 6 Money Model assessment flows.
 *
 * Phase 2 of Money Model consolidation - configuration only, no behavior changes.
 */

// Shared STAGES constant used by all flows
export const STAGES = {
  WELCOME: 'welcome',
  Q1: 'q1',
  Q2: 'q2',
  Q3: 'q3',
  Q4: 'q4',
  Q5: 'q5',
  Q6: 'q6',
  Q7: 'q7',
  Q8: 'q8',
  Q9: 'q9',
  Q10: 'q10',
  CALCULATING: 'calculating',
  REVEAL: 'reveal',
  SUCCESS: 'success'
}

// Stage group templates - reusable patterns
const STAGE_GROUP_TEMPLATES = {
  // Used by AttractionOffer, Downsell, Continuity
  marketGoals: [
    { id: 'welcome', label: 'Welcome', stages: [STAGES.WELCOME] },
    { id: 'business', label: 'Business', stages: [STAGES.Q1, STAGES.Q2, STAGES.Q3] },
    { id: 'operations', label: 'Operations', stages: [STAGES.Q4, STAGES.Q5] },
    { id: 'market', label: 'Market', stages: [STAGES.Q6, STAGES.Q7] },
    { id: 'goals', label: 'Goals', stages: [STAGES.Q8, STAGES.Q9, STAGES.Q10] },
    { id: 'results', label: 'Results', stages: [STAGES.CALCULATING, STAGES.REVEAL] },
    { id: 'complete', label: 'Complete', stages: [STAGES.SUCCESS] }
  ],
  // Used by Upsell
  strategyExecution: [
    { id: 'welcome', label: 'Welcome', stages: [STAGES.WELCOME] },
    { id: 'business', label: 'Business', stages: [STAGES.Q1, STAGES.Q2, STAGES.Q3] },
    { id: 'operations', label: 'Operations', stages: [STAGES.Q4, STAGES.Q5] },
    { id: 'strategy', label: 'Strategy', stages: [STAGES.Q6, STAGES.Q7] },
    { id: 'execution', label: 'Execution', stages: [STAGES.Q8, STAGES.Q9, STAGES.Q10] },
    { id: 'results', label: 'Results', stages: [STAGES.CALCULATING, STAGES.REVEAL] },
    { id: 'complete', label: 'Complete', stages: [STAGES.SUCCESS] }
  ],
  // Used by LeadsStrategy, LeadMagnet
  resourcesSkills: [
    { id: 'welcome', label: 'Welcome', stages: [STAGES.WELCOME] },
    { id: 'resources', label: 'Resources', stages: [STAGES.Q1, STAGES.Q2, STAGES.Q3] },
    { id: 'skills', label: 'Skills', stages: [STAGES.Q4, STAGES.Q5, STAGES.Q6] },
    { id: 'business', label: 'Business', stages: [STAGES.Q7, STAGES.Q8] },
    { id: 'priorities', label: 'Priorities', stages: [STAGES.Q9, STAGES.Q10] },
    { id: 'results', label: 'Results', stages: [STAGES.CALCULATING, STAGES.REVEAL] },
    { id: 'complete', label: 'Complete', stages: [STAGES.SUCCESS] }
  ]
}

/**
 * Configuration for each Money Model flow
 */
export const MONEY_MODEL_CONFIGS = {
  attractionOffer: {
    // Display
    name: 'Attraction Offer',
    title: 'Find Your Perfect Attraction Offer',
    cssClass: 'attraction-offer-flow',

    // Data paths
    questionsPath: '/attraction-offer-questions.json',
    offersPath: '/Money Model/Attraction/offers.json',

    // Database
    dbTable: 'attraction_offer_assessments',
    flowType: 'attraction_offer',
    flowVersion: 'attraction-offer-v1',

    // Quest/Challenge integration
    questId: 'attraction_offer',
    pointsEarned: 35,

    // Stage configuration
    stageGroups: STAGE_GROUP_TEMPLATES.marketGoals,

    // Features
    hasViewingResults: true,    // Supports ?results=true to view saved results
    hasSearchParams: true,      // Uses useSearchParams hook
    hasBackButton: true,        // Shows back button on questions

    // Calculating stage text
    calculatingTitle: 'Analyzing Your Business...',
    calculatingSteps: [
      '✓ Evaluating your business model',
      '✓ Checking margin & capacity',
      '✓ Scoring 6 attraction offers',
      '✓ Finding your best match'
    ]
  },

  upsell: {
    name: 'Upsell',
    title: 'Discover Your Best Upsell Strategy',
    cssClass: 'upsell-flow',

    questionsPath: '/upsell-questions.json',
    offersPath: '/Money Model/Upsell/offers.json',

    dbTable: 'upsell_assessments',
    flowType: 'upsell_flow',
    flowVersion: 'upsell-v1',

    questId: 'upsell_offer',
    pointsEarned: 35,

    stageGroups: STAGE_GROUP_TEMPLATES.strategyExecution,

    hasViewingResults: true,
    hasSearchParams: true,
    hasBackButton: true,

    calculatingTitle: 'Analyzing Your Business...',
    calculatingSteps: [
      '✓ Evaluating your customer base',
      '✓ Checking product compatibility',
      '✓ Scoring 4 upsell strategies',
      '✓ Finding your best match'
    ]
  },

  downsell: {
    name: 'Downsell',
    title: 'Find Your Perfect Downsell Strategy',
    cssClass: 'downsell-flow',

    questionsPath: '/downsell-questions.json',
    offersPath: '/Money Model/Downsell/offers.json',

    dbTable: 'downsell_assessments',
    flowType: 'downsell_flow',
    flowVersion: 'downsell-v1',

    questId: 'downsell_offer',
    pointsEarned: 35,

    stageGroups: STAGE_GROUP_TEMPLATES.marketGoals,

    hasViewingResults: true,
    hasSearchParams: true,
    hasBackButton: true,

    calculatingTitle: 'Analyzing Your Business...',
    calculatingSteps: [
      '✓ Evaluating your offer structure',
      '✓ Checking price sensitivity',
      '✓ Scoring downsell options',
      '✓ Finding your best match'
    ]
  },

  continuity: {
    name: 'Continuity',
    title: 'Find Your Perfect Continuity Model',
    cssClass: 'continuity-flow',

    questionsPath: '/continuity-questions.json',
    offersPath: '/Money Model/Continuity/offers.json',

    dbTable: 'continuity_assessments',
    flowType: 'continuity_flow',
    flowVersion: 'continuity-v1',

    questId: 'continuity_offer',
    pointsEarned: 35,

    stageGroups: STAGE_GROUP_TEMPLATES.marketGoals,

    hasViewingResults: true,
    hasSearchParams: true,
    hasBackButton: true,

    calculatingTitle: 'Analyzing Your Business...',
    calculatingSteps: [
      '✓ Evaluating your revenue model',
      '✓ Checking margins & retention',
      '✓ Scoring 6 continuity models',
      '✓ Finding your best match'
    ]
  },

  leadsStrategy: {
    name: 'Leads Strategy',
    title: 'Discover Your Perfect Lead Generation Strategy',
    cssClass: 'leads-strategy-flow',

    questionsPath: '/leads-strategy-questions.json',
    offersPath: '/leads-strategy-offers.json',

    dbTable: 'leads_assessments',
    flowType: '100m_leads',
    flowVersion: 'leads-strategy-v1',

    // Dynamic quest ID based on persona
    getQuestId: (persona) => {
      return persona === 'movement_maker'
        ? 'flow_leads_strategy_mm'
        : 'flow_leads_strategy_vr'
    },
    pointsEarned: 35,

    stageGroups: STAGE_GROUP_TEMPLATES.resourcesSkills,

    hasViewingResults: false,   // No saved results viewing
    hasSearchParams: false,     // No search params
    hasBackButton: false,       // No back button

    calculatingTitle: 'Analyzing Your Situation...',
    calculatingSteps: [
      '✓ Evaluating your resources',
      '✓ Analyzing your skills & comfort',
      '✓ Scoring the Core Four strategies',
      '✓ Finding your best fit'
    ]
  },

  leadMagnet: {
    name: 'Lead Magnet',
    title: 'Discover Your Perfect Lead Magnet',
    cssClass: 'lead-magnet-flow',

    questionsPath: '/lead-magnet-questions.json',
    offersPath: '/lead-magnet-offers.json',

    dbTable: 'lead_magnet_assessments',
    flowType: 'lead_magnet_offer',
    flowVersion: 'lead-magnet-v1',

    questId: 'flow_lead_magnet',
    pointsEarned: 35,

    stageGroups: STAGE_GROUP_TEMPLATES.resourcesSkills,

    hasViewingResults: false,
    hasSearchParams: false,
    hasBackButton: false,

    // Special features for LeadMagnet
    createsMilestone: true,
    milestoneId: 'lead_magnet_completed',
    autoNavigateOnSuccess: true,
    autoNavigateDelay: 2000,
    autoNavigatePath: '/7-day-challenge',

    calculatingTitle: 'Analyzing Your Situation...',
    calculatingSteps: [
      '✓ Evaluating your resources',
      '✓ Analyzing your skills',
      '✓ Scoring lead magnet options',
      '✓ Finding your best fit'
    ]
  }
}

/**
 * Helper to get config by flow key
 */
export const getFlowConfig = (flowKey) => {
  return MONEY_MODEL_CONFIGS[flowKey] || null
}

/**
 * Helper to get all flow keys
 */
export const getFlowKeys = () => {
  return Object.keys(MONEY_MODEL_CONFIGS)
}
