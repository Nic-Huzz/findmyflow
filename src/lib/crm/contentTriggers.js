/**
 * Content Triggers Service
 * Maps sales events to content generation with pre-filled context
 * Part of Phase 2: Integrated Content Suggestions
 */

// ============================================================================
// TRIGGER DEFINITIONS - All moments that activate content suggestions
// ============================================================================

export const CONTENT_TRIGGERS = {
  // -------------------------------------------------------------------------
  // FUNNEL HEALTH TRIGGERS
  // -------------------------------------------------------------------------

  low_lead_to_discovery: {
    id: 'low_lead_to_discovery',
    name: 'Low Lead Qualification',
    category: 'funnel',
    description: 'Lead-to-discovery rate below 30%',
    contentConfig: {
      type: 'educational',
      platform: 'linkedin',
      prefilledInstructions: `Create content that pre-qualifies leads by clearly communicating:
- Who this is for (and who it's NOT for)
- What problem you solve
- What makes someone a good fit
This helps filter out unqualified leads before they reach out.`,
      suggestedAngle: 'qualification_content',
    },
    actionText: 'Create Qualification Content',
  },

  low_discovery_to_proposal: {
    id: 'low_discovery_to_proposal',
    name: 'Discovery Not Converting',
    category: 'funnel',
    description: 'Discovery-to-proposal rate below 40%',
    contentConfig: {
      type: 'social_proof',
      platform: 'linkedin',
      prefilledInstructions: `Create trust-building content that establishes credibility:
- Share a client transformation story
- Highlight specific results and outcomes
- Address common concerns prospects have during discovery
This builds trust before the sales conversation.`,
      suggestedAngle: 'trust_building',
    },
    actionText: 'Create Trust Content',
  },

  low_proposal_to_close: {
    id: 'low_proposal_to_close',
    name: 'Proposals Not Closing',
    category: 'funnel',
    description: 'Proposal-to-close rate below target',
    contentConfig: {
      type: 'pain_agitation',
      platform: 'linkedin',
      prefilledInstructions: `Create objection-handling content that addresses why people don't buy:
- Surface the real cost of not solving this problem
- Address the most common objection: {topLossReason}
- Show what happens when people wait too long
This content does the heavy lifting before the proposal.`,
      suggestedAngle: 'objection_handling',
    },
    actionText: 'Create Objection Content',
  },

  // -------------------------------------------------------------------------
  // WIN/LOSS PATTERN TRIGGERS
  // -------------------------------------------------------------------------

  price_objections: {
    id: 'price_objections',
    name: 'Price Objections Pattern',
    category: 'pricing',
    description: '3+ deals lost to price concerns',
    contentConfig: {
      type: 'transformation_story',
      platform: 'linkedin',
      prefilledInstructions: `Create ROI-focused content that justifies your pricing:
- Show the transformation and results clients get
- Calculate the cost of NOT solving this problem
- Compare your price to the value delivered
- Include specific numbers: time saved, revenue gained, problems avoided
Make price feel like an investment, not a cost.`,
      suggestedAngle: 'value_justification',
    },
    actionText: 'Create Value Content',
    dynamicContext: (triggerData) => `
Recent data: ${triggerData.count} deals lost to price objections.
Focus on demonstrating ROI that far exceeds your price point.`,
  },

  timing_objections: {
    id: 'timing_objections',
    name: 'Timing Objections Pattern',
    category: 'sales',
    description: '3+ deals lost to "not the right time"',
    contentConfig: {
      type: 'pain_agitation',
      platform: 'email',
      prefilledInstructions: `Create nurture content that stays top-of-mind:
- The cost of waiting / what gets worse over time
- Signs that indicate "now" is the right time
- Quick wins they can implement while they wait
- A compelling reason to stay connected
This keeps you top-of-mind until they're ready.`,
      suggestedAngle: 'nurture_sequence',
    },
    actionText: 'Create Nurture Content',
    dynamicContext: (triggerData) => `
Recent data: ${triggerData.count} deals lost to timing.
Create content that keeps you top-of-mind and creates urgency.`,
  },

  competitor_loss: {
    id: 'competitor_loss',
    name: 'Lost to Competitor',
    category: 'marketing',
    description: 'Multiple deals lost to same competitor',
    contentConfig: {
      type: 'educational',
      platform: 'linkedin',
      prefilledInstructions: `Create comparison/differentiation content:
- What makes your approach different from {competitor}
- Who is a better fit for you vs them (be respectful)
- Unique benefits only you provide
- Questions prospects should ask when evaluating options
Don't attack the competitor - elevate your unique value.`,
      suggestedAngle: 'differentiation',
    },
    actionText: 'Create Comparison Post',
    dynamicContext: (triggerData) => `
Competitor: ${triggerData.competitor}
Deals lost: ${triggerData.count}
Focus on what makes YOU different, not what's wrong with them.`,
  },

  // -------------------------------------------------------------------------
  // WIN CELEBRATION TRIGGERS
  // -------------------------------------------------------------------------

  win_streak: {
    id: 'win_streak',
    name: 'Win Streak',
    category: 'marketing',
    description: '3+ recent wins to celebrate',
    contentConfig: {
      type: 'social_proof',
      platform: 'linkedin',
      prefilledInstructions: `Create a case study or social proof post:
- Share a recent client win story
- Top win reason: {winReason}
- Include specific, measurable results
- The transformation journey (before → after)
- What made this client successful
Turn your wins into magnetic content.`,
      suggestedAngle: 'case_study',
    },
    actionText: 'Create Case Study',
    dynamicContext: (triggerData) => `
Recent wins: ${triggerData.wins}
Top win reason: ${triggerData.topWinReason || 'value delivered'}
Use real results and transformations from these wins.`,
  },

  testimonial_request: {
    id: 'testimonial_request',
    name: 'Request Testimonials',
    category: 'marketing',
    description: 'Recent wins ready for testimonial outreach',
    contentConfig: {
      type: 'offer_teaser',
      platform: 'email',
      prefilledInstructions: `Create a testimonial request email:
- Reference their specific results/wins
- Make it easy (offer to write a draft they can edit)
- Explain how it helps others like them find you
- Include 2-3 specific questions to guide their response
Keep it short, appreciative, and low-friction.`,
      suggestedAngle: 'testimonial_outreach',
    },
    actionText: 'Create Testimonial Request',
  },

  // -------------------------------------------------------------------------
  // CAPACITY TRIGGERS
  // -------------------------------------------------------------------------

  near_capacity: {
    id: 'near_capacity',
    name: 'Near Capacity',
    category: 'capacity',
    description: '80%+ of client capacity filled',
    contentConfig: {
      type: 'offer_teaser',
      platform: 'instagram',
      prefilledInstructions: `Create scarcity/premium positioning content:
- You're nearly full ({current}/{max} spots)
- This is a good problem (high demand, quality work)
- Hint at limited availability without being pushy
- Position yourself as selective about who you work with
- Invite people to apply/enquire rather than "buy now"
Authentic scarcity builds desire.`,
      suggestedAngle: 'scarcity_positioning',
    },
    actionText: 'Create Scarcity Post',
    dynamicContext: (triggerData) => `
Current capacity: ${triggerData.current}/${triggerData.max} (${triggerData.utilization}% full)
Use real numbers to create authentic scarcity.`,
  },

  over_capacity: {
    id: 'over_capacity',
    name: 'Over Capacity',
    category: 'capacity',
    description: 'At or exceeding client capacity',
    contentConfig: {
      type: 'offer_teaser',
      platform: 'instagram',
      prefilledInstructions: `Create waitlist/exclusivity content:
- You're currently fully booked
- Opening a waitlist for the right people
- What makes someone a good fit
- The benefit of being on the waitlist (first access, special terms)
Turn overflow into anticipation.`,
      suggestedAngle: 'waitlist_launch',
    },
    actionText: 'Create Waitlist Post',
    dynamicContext: (triggerData) => `
You're at ${triggerData.utilization}% capacity (${triggerData.current}/${triggerData.max}).
Position this as exclusive, not overwhelmed.`,
  },

  // -------------------------------------------------------------------------
  // SETUP/ENGAGEMENT TRIGGERS
  // -------------------------------------------------------------------------

  setup_incomplete: {
    id: 'setup_incomplete',
    name: 'Complete Setup',
    category: 'sales',
    description: 'AI setup not complete',
    contentConfig: null, // No content generation - just redirect to setup
    actionText: 'Complete Setup',
    actionUrl: '/crm/setup',
  },
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get content config for a trigger with dynamic context filled in
 */
export function getContentConfigForTrigger(triggerId, triggerData = {}) {
  const trigger = CONTENT_TRIGGERS[triggerId]
  if (!trigger || !trigger.contentConfig) return null

  const config = { ...trigger.contentConfig }

  // Fill in dynamic placeholders in instructions
  let instructions = config.prefilledInstructions || ''

  // Replace {placeholder} patterns with actual data
  if (triggerData.topLossReason) {
    instructions = instructions.replace('{topLossReason}', triggerData.topLossReason)
  }
  if (triggerData.competitor) {
    instructions = instructions.replace('{competitor}', triggerData.competitor)
  }
  if (triggerData.winReason || triggerData.topWinReason) {
    instructions = instructions.replace('{winReason}', triggerData.winReason || triggerData.topWinReason)
  }
  if (triggerData.current && triggerData.max) {
    instructions = instructions.replace('{current}', triggerData.current)
    instructions = instructions.replace('{max}', triggerData.max)
  }

  // Add dynamic context if available
  if (trigger.dynamicContext && triggerData) {
    instructions += '\n\n' + trigger.dynamicContext(triggerData)
  }

  config.prefilledInstructions = instructions

  return {
    triggerId,
    triggerName: trigger.name,
    ...config,
  }
}

/**
 * Build URL params for content generation page
 */
export function buildContentTriggerUrl(triggerId, triggerData = {}) {
  const config = getContentConfigForTrigger(triggerId, triggerData)
  if (!config) {
    // Fallback to action URL if no content config
    const trigger = CONTENT_TRIGGERS[triggerId]
    return trigger?.actionUrl || '/crm/marketing'
  }

  const params = new URLSearchParams({
    trigger: triggerId,
    type: config.type,
    platform: config.platform,
  })

  // Encode the instructions as base64 to preserve formatting
  if (config.prefilledInstructions) {
    params.set('instructions', btoa(encodeURIComponent(config.prefilledInstructions)))
  }

  // Add trigger data as JSON
  if (Object.keys(triggerData).length > 0) {
    params.set('context', btoa(JSON.stringify(triggerData)))
  }

  return `/crm/content-create?${params.toString()}`
}

/**
 * Parse URL params on content creation page
 */
export function parseContentTriggerParams(searchParams) {
  const triggerId = searchParams.get('trigger')
  const type = searchParams.get('type')
  const platform = searchParams.get('platform')
  const instructionsEncoded = searchParams.get('instructions')
  const contextEncoded = searchParams.get('context')

  let instructions = ''
  let triggerContext = {}

  try {
    if (instructionsEncoded) {
      instructions = decodeURIComponent(atob(instructionsEncoded))
    }
    if (contextEncoded) {
      triggerContext = JSON.parse(atob(contextEncoded))
    }
  } catch (e) {
    console.error('Error parsing trigger params:', e)
  }

  return {
    triggerId,
    type,
    platform,
    instructions,
    triggerContext,
    trigger: triggerId ? CONTENT_TRIGGERS[triggerId] : null,
  }
}

/**
 * Get all triggers for a given category
 */
export function getTriggersByCategory(category) {
  return Object.values(CONTENT_TRIGGERS).filter(t => t.category === category)
}

/**
 * Get trigger summary for display
 */
export function getTriggerSummary() {
  return {
    funnel: getTriggersByCategory('funnel'),
    pricing: getTriggersByCategory('pricing'),
    sales: getTriggersByCategory('sales'),
    marketing: getTriggersByCategory('marketing'),
    capacity: getTriggersByCategory('capacity'),
  }
}
