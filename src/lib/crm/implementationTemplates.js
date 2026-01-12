/**
 * Implementation Templates
 *
 * Templates for the AI Implementation Coach (Tier 3).
 * Each template defines how to guide users through completing a specific task.
 *
 * Structure:
 * - task_id: Matches the task identifier from implementation checklists
 * - display_name: Human-readable name
 * - category: Which offer type this belongs to
 * - context_sources: Fields to pull from getUserBusinessProfile()
 * - context_display: Function to format context for user confirmation
 * - clarifying_questions: Questions to ask if data is missing
 * - generation_prompt: AI prompt template for content generation
 * - success_tips: Guidance for the user after generation
 */

// ============================================================================
// TIER 4 CONTEXT BUILDER - Enriches prompts with autonomous data
// ============================================================================

/**
 * Build enhanced context section for AI prompts using Tier 4 data
 * Only includes sections where we have actual data
 */
function buildAutonomousContext(ctx) {
  if (!ctx?.autonomous) return ''

  const sections = []
  const auto = ctx.autonomous

  // Business baseline
  if (auto.revenue?.current || auto.revenue?.target) {
    sections.push(`BUSINESS CONTEXT:
- Current monthly revenue: ${auto.revenue?.current ? `$${auto.revenue.current.toLocaleString()}` : 'not specified'}
- Revenue goal: ${auto.revenue?.target ? `$${auto.revenue.target.toLocaleString()}` : 'not specified'}
- Business model: ${auto.revenue?.model || 'not specified'}`)
  }

  // Customer intelligence - this is gold for copywriting
  if (auto.customers?.best) {
    sections.push(`IDEAL CUSTOMER PROFILE:
- Description: ${auto.customers.best.description || 'not specified'}
- What made them buy: ${auto.customers.best.buyingTrigger || 'not specified'}
- Revenue share: ${auto.customers.best.revenuePercent ? `${auto.customers.best.revenuePercent}%` : 'not specified'}`)
  }

  // Common objections - critical for sales copy
  if (auto.customers?.worst?.objections?.length > 0) {
    sections.push(`COMMON OBJECTIONS TO ADDRESS:
${auto.customers.worst.objections.map((o, i) => `${i + 1}. "${o}"`).join('\n')}`)
  }

  // Competitive positioning
  if (auto.competitors?.length > 0 || auto.yourAdvantage) {
    const compLines = auto.competitors?.slice(0, 2).map(c =>
      `- ${c.name}: ${c.positioning || 'unknown positioning'}${c.pricing ? ` (~$${c.pricing})` : ''}`
    ) || []

    sections.push(`COMPETITIVE LANDSCAPE:
${compLines.length > 0 ? compLines.join('\n') : '- No competitors specified'}
- YOUR KEY ADVANTAGE: ${auto.yourAdvantage || 'not specified'}`)
  }

  // Funnel performance (real data from CRM)
  if (auto.funnel) {
    const funnelSection = [`FUNNEL PERFORMANCE (actual data):
- This month: ${auto.funnel.leads} leads → ${auto.funnel.sales} sales (${auto.funnel.conversionRate}% conversion)
- Average deal size: ${auto.funnel.avgDealSize ? `$${auto.funnel.avgDealSize.toLocaleString()}` : 'not enough data'}`]

    if (auto.funnel.weakPoint) {
      funnelSection.push(`- Weak point: ${auto.funnel.weakPoint}`)
    }
    if (auto.funnel.recommendation) {
      funnelSection.push(`- AI recommendation: ${auto.funnel.recommendation}`)
    }

    sections.push(funnelSection.join('\n'))
  }

  if (sections.length === 0) return ''

  return `
// ENHANCED CONTEXT (from Tier 4 data)
${sections.join('\n\n')}
// END ENHANCED CONTEXT
`
}

// ============================================================================
// ATTRACTION TEMPLATES
// ============================================================================

export const ATTRACTION_HEADLINE_TEMPLATE = {
  task_id: 'create_attraction_headline',
  display_name: 'Create Lead Magnet Headline',
  category: 'attraction',
  task_type: 'headline',

  context_sources: [
    'offers.attraction.recommendedName',
    'offers.leadMagnet.type',
    'offers.core.name',
    'audience.problems',
    'niche.definition',
  ],

  context_display: (ctx) => {
    const items = []
    if (ctx?.offer?.recommendedName) {
      items.push({ label: 'Attraction Offer', value: ctx.offer.recommendedName })
    }
    if (ctx?.core?.name) {
      items.push({ label: 'Core Offer', value: ctx.core.name })
    }
    if (ctx?.niche?.definition) {
      items.push({ label: 'Target Audience', value: ctx.niche.definition })
    }
    if (ctx?.audience?.problems?.length > 0) {
      items.push({ label: 'Main Problem', value: ctx.audience.problems[0]?.name || ctx.audience.problems[0] })
    }
    return items
  },

  clarifying_questions: [
    {
      id: 'lead_magnet_type',
      question: 'What type of lead magnet are you creating?',
      help: 'Choose the format that best fits your content',
      required: true,
      options: ['PDF Guide/Checklist', 'Video Training', 'Quiz/Assessment', 'Template/Swipe File', 'Free Tool/Calculator'],
    },
    {
      id: 'main_promise',
      question: 'What specific result will they get from this free resource?',
      help: 'Be specific. Example: "5 email templates that book calls" not "learn about email marketing"',
      required: true,
      placeholder: 'e.g., Double your response rate, Save 5 hours per week, Get your first 3 clients',
    },
  ],

  generation_prompt: (ctx, answers, voiceInstructions) => `
You are a direct-response copywriter trained in Alex Hormozi's $100M Offers methodology, specializing in lead magnets.

CONTEXT:
- Attraction offer type: ${ctx?.offer?.recommendedName || 'lead magnet'}
- Core offer (what they'll eventually buy): ${ctx?.core?.name || 'premium program'}
- Target audience: ${ctx?.niche?.definition || 'ideal customers'}
- Main problem they face: ${ctx?.audience?.problems?.[0]?.name || ctx?.audience?.problems?.[0] || 'their biggest challenge'}
- Lead magnet format: ${answers.lead_magnet_type}
- Main promise: ${answers.main_promise}
${buildAutonomousContext(ctx)}
HORMOZI LEAD MAGNET PRINCIPLES:
- Lead with the result, not the method
- Be specific about the outcome (numbers, timeframes)
- Make it feel like a "no-brainer" to grab
- The headline should make them think "I need this NOW"

${voiceInstructions ? `VOICE PROFILE:\n${voiceInstructions}\n` : ''}

Create 3 compelling lead magnet headlines that:
1. Lead with the specific result/transformation
2. Include specificity (numbers, timeframe, or method)
3. Create immediate desire to download/access
4. ${voiceInstructions ? 'Match the voice profile above' : 'Sound valuable and urgent'}
${ctx?.autonomous?.customers?.best?.buyingTrigger ? `5. Tap into this buying trigger: "${ctx.autonomous.customers.best.buyingTrigger}"` : ''}

Format your response EXACTLY like this:
HEADLINE 1: [headline text]
WHY IT WORKS: [1 sentence explanation]

HEADLINE 2: [headline text]
WHY IT WORKS: [1 sentence explanation]

HEADLINE 3: [headline text]
WHY IT WORKS: [1 sentence explanation]
`,

  success_tips: [
    'Test your headline with 5 people - do they immediately understand the value?',
    'The best lead magnet headlines promise a specific, quick win',
    'Avoid vague words like "secrets" or "ultimate guide"',
  ],
}

export const ATTRACTION_WELCOME_EMAIL_TEMPLATE = {
  task_id: 'write_welcome_email',
  display_name: 'Write Welcome Email (Day 0)',
  category: 'attraction',
  task_type: 'email',

  context_sources: [
    'offers.attraction.recommendedName',
    'offers.core.name',
    'niche.definition',
  ],

  context_display: (ctx) => {
    const items = []
    if (ctx?.offer?.recommendedName) {
      items.push({ label: 'Attraction Offer', value: ctx.offer.recommendedName })
    }
    if (ctx?.core?.name) {
      items.push({ label: 'Core Offer', value: ctx.core.name })
    }
    if (ctx?.niche?.definition) {
      items.push({ label: 'Target Audience', value: ctx.niche.definition })
    }
    return items
  },

  clarifying_questions: [
    {
      id: 'lead_magnet_name',
      question: 'What is the name of your lead magnet?',
      help: 'The title they signed up for',
      required: true,
      placeholder: 'e.g., The 5-Day Client Acquisition Blueprint',
    },
    {
      id: 'first_action',
      question: 'What ONE action should they take first?',
      help: 'The most important first step to get results',
      required: true,
      placeholder: 'e.g., Complete the assessment on page 2, Watch the first 10 minutes',
    },
  ],

  generation_prompt: (ctx, answers, voiceInstructions) => `
You are an email copywriter trained in Alex Hormozi's methodology.

CONTEXT:
- Lead magnet name: ${answers.lead_magnet_name}
- First action to take: ${answers.first_action}
- Core offer: ${ctx?.core?.name || 'premium program'}
- Target audience: ${ctx?.niche?.definition || 'new subscribers'}

EMAIL GOALS:
1. Deliver the lead magnet with excitement
2. Set expectations for what's coming
3. Get them to take the first action TODAY
4. Build relationship (not sell yet)

${voiceInstructions ? `VOICE PROFILE:\n${voiceInstructions}\n` : ''}

Write a welcome email in this format:

SUBJECT LINE: [compelling subject - focus on what they're getting]

---

[Email body - 150-200 words max]
- Welcome them
- Deliver the resource (link placeholder: [LEAD MAGNET LINK])
- Tell them the ONE thing to do first
- Build anticipation for next email

---

P.S. [Quick tip or excitement builder]

---

WHY THIS EMAIL WORKS:
[2-3 sentences explaining the psychology]
`,

  success_tips: [
    'Send immediately after signup - speed matters',
    'Focus on ONE action, not multiple steps',
    'Keep it short - save the teaching for the lead magnet',
  ],
}

export const ATTRACTION_LAUNCH_EMAIL_TEMPLATE = {
  task_id: 'write_launch_email',
  display_name: 'Write Value/Launch Email',
  category: 'attraction',
  task_type: 'email',

  context_sources: [
    'offers.attraction.recommendedName',
    'offers.core.name',
    'offers.core.price',
    'niche.definition',
  ],

  context_display: (ctx) => {
    const items = []
    if (ctx?.offer?.recommendedName) {
      items.push({ label: 'Attraction Offer', value: ctx.offer.recommendedName })
    }
    if (ctx?.core?.name) {
      items.push({ label: 'Core Offer', value: `${ctx.core.name}${ctx.core.price ? ` ($${ctx.core.price})` : ''}` })
    }
    if (ctx?.niche?.definition) {
      items.push({ label: 'Target Audience', value: ctx.niche.definition })
    }
    return items
  },

  clarifying_questions: [
    {
      id: 'transformation_story',
      question: 'Describe a quick transformation story or case study',
      help: 'A real result someone got. Even if it\'s your own experience.',
      required: true,
      placeholder: 'e.g., Sarah went from 0 to 5 clients in 30 days using this exact method',
    },
    {
      id: 'offer_deadline',
      question: 'Is there a deadline or special offer?',
      help: 'Optional urgency element',
      required: false,
      placeholder: 'e.g., Founding member pricing ends Friday, Bonus expires in 48 hours',
    },
  ],

  generation_prompt: (ctx, answers, voiceInstructions) => `
You are an email copywriter trained in Alex Hormozi's methodology.

CONTEXT:
- Core offer: ${ctx?.core?.name || 'premium program'} at $${ctx?.core?.price || 'TBD'}
- Target audience: ${ctx?.niche?.definition || 'subscribers'}
- Transformation story: ${answers.transformation_story}
- Deadline/urgency: ${answers.offer_deadline || 'none'}

EMAIL GOALS:
1. Share valuable insight or story
2. Transition naturally to the offer
3. Create desire without being pushy
4. Clear call-to-action

${voiceInstructions ? `VOICE PROFILE:\n${voiceInstructions}\n` : ''}

Write a value/launch email in this format:

SUBJECT LINE: [curiosity-driven subject related to the story]

---

[Email body - 200-300 words]
- Open with the transformation story
- Connect to what they're struggling with
- Bridge to how your offer helps
- Call-to-action

[CTA Button: e.g., "See How It Works →"]

---

P.S. [Urgency or social proof element]

---

WHY THIS EMAIL WORKS:
[2-3 sentences explaining the psychology]
`,

  success_tips: [
    'Lead with story, not pitch',
    'One clear CTA - don\'t give multiple options',
    'P.S. lines have high readership - use them wisely',
  ],
}

// ============================================================================
// UPSELL TEMPLATES
// ============================================================================

export const UPSELL_HEADLINE_TEMPLATE = {
  task_id: 'create_upsell_headline',
  display_name: 'Create Upsell Headline',
  category: 'upsell',
  task_type: 'headline',

  context_sources: [
    'offers.upsell.recommendedName',
    'offers.upsell.goal',
    'offers.core.name',
    'offers.core.price',
    'audience.personas',
    'niche.definition',
  ],

  context_display: (ctx) => {
    const items = []
    if (ctx?.offers?.upsell?.recommendedName) {
      items.push({ label: 'Upsell Type', value: ctx.offers.upsell.recommendedName })
    }
    if (ctx?.offers?.core?.name) {
      items.push({ label: 'Core Offer', value: `${ctx.offers.core.name}${ctx.offers.core.price ? ` ($${ctx.offers.core.price})` : ''}` })
    }
    if (ctx?.offers?.upsell?.goal) {
      items.push({ label: 'Goal', value: ctx.offers.upsell.goal.replace(/_/g, ' ') })
    }
    if (ctx?.niche?.definition) {
      items.push({ label: 'Target Audience', value: ctx.niche.definition })
    }
    return items
  },

  clarifying_questions: [
    {
      id: 'transformation',
      question: "What's the ONE big transformation this upsell delivers?",
      help: 'Focus on the result, not features. Example: "Master outbound sales in 30 days"',
      required: true,
      placeholder: 'e.g., Double your close rate, Save 10 hours per week',
    },
    {
      id: 'timeframe',
      question: 'How quickly will they see results?',
      help: 'Be specific if possible. Example: "30 days", "first week", "immediately"',
      required: false,
      placeholder: 'e.g., 30 days, first week, immediately',
    },
  ],

  generation_prompt: (ctx, answers, voiceInstructions) => `
You are a direct-response copywriter trained in Alex Hormozi's $100M Offers methodology.

CONTEXT:
- Business niche: ${ctx?.niche?.definition || 'not specified'}
- Core offer: ${ctx?.offers?.core?.name || 'their main product'} at $${ctx?.offers?.core?.price || 'TBD'}
- Upsell type: ${ctx?.offers?.upsell?.recommendedName || 'premium upgrade'}
- Upsell goal: ${ctx?.offers?.upsell?.goal?.replace(/_/g, ' ') || 'increase revenue'}
- Target transformation: ${answers.transformation}
- Timeframe: ${answers.timeframe || 'not specified'}
${buildAutonomousContext(ctx)}
${voiceInstructions ? `VOICE PROFILE:\n${voiceInstructions}\n` : ''}

Create 3 compelling upsell headlines that:
1. Lead with the transformation, not features
2. Include specific timeframe or outcome if known
3. Create urgency without being pushy
4. ${voiceInstructions ? 'Match the voice profile above' : 'Sound professional and confident'}

Format your response EXACTLY like this:
HEADLINE 1: [headline text]
WHY IT WORKS: [1 sentence explanation]

HEADLINE 2: [headline text]
WHY IT WORKS: [1 sentence explanation]

HEADLINE 3: [headline text]
WHY IT WORKS: [1 sentence explanation]
`,

  success_tips: [
    'Pick the headline that feels most "you"',
    'Test 2-3 versions if possible',
    'The best headlines promise a specific transformation',
  ],
}

export const UPSELL_PRICING_TEMPLATE = {
  task_id: 'set_upsell_pricing',
  display_name: 'Set Upsell Pricing Strategy',
  category: 'upsell',
  task_type: 'strategy',

  context_sources: [
    'offers.upsell.recommendedName',
    'offers.core.price',
    'offers.upsell.avgOrderValue',
  ],

  context_display: (ctx) => {
    const items = []
    if (ctx?.offers?.upsell?.recommendedName) {
      items.push({ label: 'Upsell Type', value: ctx.offers.upsell.recommendedName })
    }
    if (ctx?.offers?.core?.price) {
      items.push({ label: 'Core Offer Price', value: `$${ctx.offers.core.price}` })
    }
    if (ctx?.offers?.upsell?.avgOrderValue) {
      items.push({ label: 'Avg Order Value Range', value: ctx.offers.upsell.avgOrderValue.replace(/_/g, ' ') })
    }
    return items
  },

  clarifying_questions: [
    {
      id: 'upsell_value',
      question: 'What is the total value of your upsell package?',
      help: 'Add up all the components - courses, templates, bonuses, support, etc.',
      required: true,
      placeholder: 'e.g., $2,997, $497',
    },
    {
      id: 'price_sensitivity',
      question: 'How price-sensitive is your audience?',
      help: 'This affects whether to anchor high or lead with value',
      required: true,
      options: ['Very price-sensitive', 'Moderate', 'Value-focused (less price-sensitive)'],
    },
  ],

  generation_prompt: (ctx, answers, voiceInstructions) => `
You are a pricing strategist trained in Alex Hormozi's $100M Offers methodology.

CONTEXT:
- Core offer price: $${ctx?.offers?.core?.price || 'unknown'}
- Upsell type: ${ctx?.offers?.upsell?.recommendedName || 'premium upgrade'}
- Total upsell value: ${answers.upsell_value}
- Price sensitivity: ${answers.price_sensitivity}

HORMOZI PRICING PRINCIPLES:
- Price-to-value ratio should make the offer feel like a "no-brainer"
- Anchor with a higher number first (total value), then reveal price
- The gap between value and price is the "deal"
- For upsells, the sweet spot is often 30-50% of core offer price

${voiceInstructions ? `VOICE PROFILE:\n${voiceInstructions}\n` : ''}

Create 2 pricing strategy recommendations:

STRATEGY 1 (Conservative):
- Recommended price: $[price]
- Value-to-price ratio: [X]:1
- Positioning statement: "[1-2 sentence pitch]"
- Why this works: [explanation]

STRATEGY 2 (Aggressive):
- Recommended price: $[price]
- Value-to-price ratio: [X]:1
- Positioning statement: "[1-2 sentence pitch]"
- Why this works: [explanation]

ANCHORING SCRIPT:
"[A 2-3 sentence script for presenting the price with value anchoring]"
`,

  success_tips: [
    'The value-to-price ratio should be at least 3:1 for upsells',
    'Test the conservative price first, then optimize',
    'Always present value before price',
  ],
}

export const UPSELL_ORDER_BUMP_TEMPLATE = {
  task_id: 'create_order_bump',
  display_name: 'Create Order Bump Copy',
  category: 'upsell',
  task_type: 'pitch',

  context_sources: [
    'offers.upsell.recommendedName',
    'offers.core.name',
    'offers.core.price',
    'niche.definition',
  ],

  context_display: (ctx) => {
    const items = []
    if (ctx?.offer?.recommendedName) {
      items.push({ label: 'Upsell Type', value: ctx.offer.recommendedName })
    }
    if (ctx?.core?.name) {
      items.push({ label: 'Core Offer', value: `${ctx.core.name}${ctx.core.price ? ` ($${ctx.core.price})` : ''}` })
    }
    if (ctx?.niche?.definition) {
      items.push({ label: 'Target Audience', value: ctx.niche.definition })
    }
    return items
  },

  clarifying_questions: [
    {
      id: 'bump_product',
      question: 'What is the order bump product?',
      help: 'The small add-on offered at checkout (usually $17-$97)',
      required: true,
      placeholder: 'e.g., Quick-start templates, Implementation checklist, Bonus module',
    },
    {
      id: 'bump_price',
      question: 'What is the order bump price?',
      help: 'Should be an impulse-buy price point',
      required: true,
      placeholder: 'e.g., $27, $47, $67',
    },
    {
      id: 'main_benefit',
      question: 'What\'s the #1 benefit of adding this?',
      help: 'How does it make their main purchase better/faster/easier?',
      required: true,
      placeholder: 'e.g., Get results 2x faster, Skip the setup headaches, Done-for-you templates',
    },
  ],

  generation_prompt: (ctx, answers, voiceInstructions) => `
You are a conversion copywriter trained in Alex Hormozi's $100M Offers methodology, specializing in order bumps.

CONTEXT:
- Core offer: ${ctx?.core?.name || 'main product'} at $${ctx?.core?.price || 'TBD'}
- Order bump product: ${answers.bump_product}
- Order bump price: ${answers.bump_price}
- Main benefit: ${answers.main_benefit}
- Target audience: ${ctx?.niche?.definition || 'customers'}

HORMOZI ORDER BUMP PRINCIPLES:
- Order bumps should feel like a "no-brainer" add-on
- Position as making the main purchase MORE valuable
- Price should feel insignificant compared to main purchase
- Focus on speed, ease, or completeness

${voiceInstructions ? `VOICE PROFILE:\n${voiceInstructions}\n` : ''}

Create order bump copy in this format:

CHECKBOX HEADLINE:
☐ Yes! Add [Product Name] for just ${answers.bump_price}

SHORT DESCRIPTION (2-3 sentences):
[Compelling copy explaining why they need this]

BULLET POINTS (3-4 benefits):
• [Benefit 1]
• [Benefit 2]
• [Benefit 3]
• [Benefit 4 - optional]

URGENCY LINE:
[One line creating urgency or exclusivity]

---

WHY THIS ORDER BUMP CONVERTS:
[2-3 sentences explaining the psychology]
`,

  success_tips: [
    'Order bumps convert best at 10-20% of main offer price',
    'Position it as making the main purchase complete',
    'Test different checkbox headlines - small changes matter',
  ],
}

// ============================================================================
// DOWNSELL TEMPLATES
// ============================================================================

export const DOWNSELL_HEADLINE_TEMPLATE = {
  task_id: 'create_downsell_headline',
  display_name: 'Create Downsell Headline',
  category: 'downsell',
  task_type: 'headline',

  context_sources: [
    'offers.downsell.recommendedName',
    'offers.downsell.mainObjection',
    'offers.core.name',
    'offers.core.price',
    'offers.downsell.pricePoint',
  ],

  context_display: (ctx) => {
    const items = []
    if (ctx?.offers?.downsell?.recommendedName) {
      items.push({ label: 'Downsell Type', value: ctx.offers.downsell.recommendedName })
    }
    if (ctx?.offers?.downsell?.mainObjection) {
      items.push({ label: 'Main Objection', value: ctx.offers.downsell.mainObjection.replace(/_/g, ' ') })
    }
    if (ctx?.offers?.core?.name) {
      items.push({ label: 'Core Offer', value: ctx.offers.core.name })
    }
    if (ctx?.offers?.downsell?.pricePoint) {
      items.push({ label: 'Price Range', value: ctx.offers.downsell.pricePoint.replace(/_/g, ' ') })
    }
    return items
  },

  clarifying_questions: [
    {
      id: 'what_they_still_get',
      question: 'What will they STILL get with the downsell?',
      help: 'Focus on the core value that remains. What problem does this still solve?',
      required: true,
      placeholder: 'e.g., Core training modules, Basic support, Essential templates',
    },
    {
      id: 'objection_addressed',
      question: 'How does this address their objection?',
      help: 'Connect the downsell directly to why they said no',
      required: true,
      placeholder: 'e.g., Lower monthly payments, Try before full commitment',
    },
  ],

  generation_prompt: (ctx, answers, voiceInstructions) => `
You are a direct-response copywriter trained in Alex Hormozi's $100M Offers methodology, specializing in downsell offers.

CONTEXT:
- Core offer: ${ctx?.offers?.core?.name || 'their main product'}
- Downsell type: ${ctx?.offers?.downsell?.recommendedName || 'alternative offer'}
- Main objection: ${ctx?.offers?.downsell?.mainObjection?.replace(/_/g, ' ') || 'price concern'}
- What they still get: ${answers.what_they_still_get}
- How objection is addressed: ${answers.objection_addressed}
${buildAutonomousContext(ctx)}
HORMOZI DOWNSELL PRINCIPLES:
- Downsells should feel like a genuine alternative, not a consolation prize
- Address the specific objection directly
- Maintain perceived value while lowering the barrier
- Never make the customer feel like they're getting "less" - reframe as "different fit"

${voiceInstructions ? `VOICE PROFILE:\n${voiceInstructions}\n` : ''}

Create 3 compelling downsell headlines that:
1. Acknowledge their hesitation without judgment
2. Present the alternative as a smart choice
3. Lead with what they GET, not what they miss
4. ${voiceInstructions ? 'Match the voice profile above' : 'Sound understanding and helpful'}

Format your response EXACTLY like this:
HEADLINE 1: [headline text]
WHY IT WORKS: [1 sentence explanation]

HEADLINE 2: [headline text]
WHY IT WORKS: [1 sentence explanation]

HEADLINE 3: [headline text]
WHY IT WORKS: [1 sentence explanation]
`,

  success_tips: [
    'Never make downsells feel like "second best"',
    'The best downsell headlines validate their concern',
    'Focus on fit, not price',
  ],
}

export const DOWNSELL_EMAIL_TEMPLATE = {
  task_id: 'write_downsell_email',
  display_name: 'Write Downsell Follow-up Email',
  category: 'downsell',
  task_type: 'email',

  context_sources: [
    'offers.downsell.recommendedName',
    'offers.downsell.mainObjection',
    'offers.core.name',
    'niche.definition',
  ],

  context_display: (ctx) => {
    const items = []
    if (ctx?.offers?.downsell?.recommendedName) {
      items.push({ label: 'Downsell Type', value: ctx.offers.downsell.recommendedName })
    }
    if (ctx?.offers?.downsell?.mainObjection) {
      items.push({ label: 'Main Objection', value: ctx.offers.downsell.mainObjection.replace(/_/g, ' ') })
    }
    if (ctx?.niche?.definition) {
      items.push({ label: 'Target Audience', value: ctx.niche.definition })
    }
    return items
  },

  clarifying_questions: [
    {
      id: 'downsell_offer',
      question: 'What is the downsell offer?',
      help: 'Describe the alternative you\'re offering (payment plan, lite version, trial, etc.)',
      required: true,
      placeholder: 'e.g., 3-month payment plan at $299/mo, Starter package at $497',
    },
    {
      id: 'deadline',
      question: 'Is there a deadline or urgency element?',
      help: 'Optional but helps conversion. Example: "available for 48 hours"',
      required: false,
      placeholder: 'e.g., 48 hours, end of week, limited spots',
    },
  ],

  generation_prompt: (ctx, answers, voiceInstructions) => `
You are an email copywriter trained in Alex Hormozi's $100M Offers methodology.

CONTEXT:
- Core offer: ${ctx?.offers?.core?.name || 'their main product'}
- Main objection: ${ctx?.offers?.downsell?.mainObjection?.replace(/_/g, ' ') || 'price concern'}
- Downsell offer: ${answers.downsell_offer}
- Target audience: ${ctx?.niche?.definition || 'potential customers'}
- Deadline: ${answers.deadline || 'none specified'}
${buildAutonomousContext(ctx)}
EMAIL GOALS:
1. Acknowledge they didn't move forward (no guilt)
2. Introduce the alternative naturally
3. Address the specific objection${ctx?.autonomous?.customers?.worst?.objections?.length > 0 ? ` (reference their actual objections above)` : ''}
4. Clear call-to-action

${voiceInstructions ? `VOICE PROFILE:\n${voiceInstructions}\n` : ''}

Write a downsell follow-up email in this format:

SUBJECT LINE: [compelling subject line]

---

[Email body - 150-250 words]

[Clear CTA button text: e.g., "Get Started with [Offer Name]"]

---

P.S. [Optional urgency or reassurance line]

---

WHY THIS EMAIL WORKS:
[2-3 sentences explaining the psychology]
`,

  success_tips: [
    'Send within 24-48 hours of the "no"',
    'Keep it short - under 250 words',
    'One clear CTA only',
  ],
}

export const DOWNSELL_PAYMENT_PLAN_TEMPLATE = {
  task_id: 'create_payment_plan_pitch',
  display_name: 'Create Payment Plan Pitch',
  category: 'downsell',
  task_type: 'script',

  context_sources: [
    'offers.downsell.recommendedName',
    'offers.downsell.mainObjection',
    'offers.core.name',
    'offers.core.price',
    'niche.definition',
  ],

  context_display: (ctx) => {
    const items = []
    if (ctx?.offer?.mainObjection) {
      items.push({ label: 'Main Objection', value: ctx.offer.mainObjection.replace(/_/g, ' ') })
    }
    if (ctx?.core?.name) {
      items.push({ label: 'Core Offer', value: `${ctx.core.name}${ctx.core.price ? ` ($${ctx.core.price})` : ''}` })
    }
    if (ctx?.niche?.definition) {
      items.push({ label: 'Target Audience', value: ctx.niche.definition })
    }
    return items
  },

  clarifying_questions: [
    {
      id: 'monthly_amount',
      question: 'What is the monthly payment amount?',
      help: 'The recurring amount for the payment plan',
      required: true,
      placeholder: 'e.g., $297/month, $197/month',
    },
    {
      id: 'num_payments',
      question: 'How many payments?',
      help: 'Total number of monthly payments',
      required: true,
      options: ['3 payments', '4 payments', '6 payments', '12 payments'],
    },
    {
      id: 'payment_plan_bonus',
      question: 'Is there a bonus for choosing pay-in-full vs payment plan?',
      help: 'Optional: Some offer a bonus for paying in full',
      required: false,
      placeholder: 'e.g., Pay-in-full saves $200, Pay-in-full gets bonus module',
    },
  ],

  generation_prompt: (ctx, answers, voiceInstructions) => `
You are a sales strategist trained in Alex Hormozi's $100M Offers methodology, specializing in payment plans and objection handling.

CONTEXT:
- Core offer: ${ctx?.core?.name || 'program'} at $${ctx?.core?.price || 'full price'}
- Main objection: ${ctx?.offer?.mainObjection?.replace(/_/g, ' ') || 'price concern'}
- Monthly payment: ${answers.monthly_amount}
- Number of payments: ${answers.num_payments}
- Pay-in-full bonus: ${answers.payment_plan_bonus || 'none'}
- Target audience: ${ctx?.niche?.definition || 'prospects'}
${buildAutonomousContext(ctx)}
HORMOZI PAYMENT PLAN PRINCIPLES:
- Payment plans are about ACCESSIBILITY, not discounting value
- Frame it as "investment management" not "can't afford it"
- Make the monthly amount feel small compared to the result
- Never apologize for offering a payment plan

${voiceInstructions ? `VOICE PROFILE:\n${voiceInstructions}\n` : ''}

Create a payment plan pitch script (30-45 seconds when spoken):

---

TRANSITION LINE:
[1 sentence acknowledging their hesitation without judgment]

REFRAME:
[1-2 sentences reframing from "can't afford" to "smart investment management"]

PAYMENT PLAN PRESENTATION:
"Here's what I can do for you:
[Present the payment plan with monthly amount and total payments]"

VALUE COMPARISON:
[Compare monthly payment to something relatable - daily cost, coffee, etc.]

CALL TO ACTION:
[Clear next step to get started with payment plan]

---

OBJECTION HANDLER - "I'll think about it":
[2-3 sentence response]

OBJECTION HANDLER - "What if I can't make a payment?":
[2-3 sentence response addressing this concern]

---

WHY THIS PITCH WORKS:
[2-3 sentences explaining the psychology]
`,

  success_tips: [
    'Never make them feel bad for needing a payment plan',
    'Compare the monthly amount to daily costs they already accept',
    'Have a clear policy for missed payments ready',
  ],
}

// ============================================================================
// CONTINUITY TEMPLATES
// ============================================================================

export const CONTINUITY_PITCH_TEMPLATE = {
  task_id: 'create_continuity_pitch',
  display_name: 'Create Continuity Pitch',
  category: 'continuity',
  task_type: 'script',

  context_sources: [
    'offers.continuity.recommendedName',
    'offers.core.name',
    'niche.definition',
  ],

  context_display: (ctx) => {
    const items = []
    if (ctx?.offers?.continuity?.recommendedName) {
      items.push({ label: 'Continuity Model', value: ctx.offers.continuity.recommendedName })
    }
    if (ctx?.offers?.core?.name) {
      items.push({ label: 'Core Offer', value: ctx.offers.core.name })
    }
    if (ctx?.niche?.definition) {
      items.push({ label: 'Target Audience', value: ctx.niche.definition })
    }
    return items
  },

  clarifying_questions: [
    {
      id: 'recurring_benefit',
      question: 'What ongoing value do members get each month?',
      help: 'What makes it worth staying? New content, community, support, updates?',
      required: true,
      placeholder: 'e.g., Weekly live calls, new templates each month, private community',
    },
    {
      id: 'monthly_price',
      question: 'What is the monthly price?',
      help: 'The recurring amount they\'ll pay',
      required: true,
      placeholder: 'e.g., $97/month, $47/month',
    },
  ],

  generation_prompt: (ctx, answers, voiceInstructions) => `
You are a sales strategist trained in Alex Hormozi's $100M Offers methodology, specializing in continuity programs.

CONTEXT:
- Continuity model: ${ctx?.offers?.continuity?.recommendedName || 'membership/subscription'}
- Core offer: ${ctx?.offers?.core?.name || 'their main product'}
- Ongoing value: ${answers.recurring_benefit}
- Monthly price: ${answers.monthly_price}
- Target audience: ${ctx?.niche?.definition || 'customers'}
${buildAutonomousContext(ctx)}
HORMOZI CONTINUITY PRINCIPLES:
- Continuity should feel like "insurance against going backwards"
- Monthly value should clearly exceed the price
- Create FOMO about missing out on ongoing updates
- Make cancellation feel like a step backward, not a release

${voiceInstructions ? `VOICE PROFILE:\n${voiceInstructions}\n` : ''}

Create a continuity pitch script (30-60 seconds when spoken):

---

OPENING HOOK:
[1-2 sentences that create curiosity about the ongoing value]

CORE PITCH:
[3-4 sentences explaining what they get and why it matters]

VALUE STACK:
"Each month you get:
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]"

PRICE REVEAL:
[1-2 sentences positioning the price as a no-brainer]

CALL TO ACTION:
[Clear next step]

---

OBJECTION HANDLER:
If they say "I'll just cancel later":
[1-2 sentence response]

WHY THIS PITCH WORKS:
[2-3 sentences explaining the psychology]
`,

  success_tips: [
    'Present continuity at the moment of highest excitement (right after purchase)',
    'Frame it as protection of their investment',
    'Make the first month irresistible',
  ],
}

export const CONTINUITY_WELCOME_EMAIL_TEMPLATE = {
  task_id: 'write_membership_welcome',
  display_name: 'Write Membership Welcome Email',
  category: 'continuity',
  task_type: 'email',

  context_sources: [
    'offers.continuity.recommendedName',
    'offers.core.name',
    'niche.definition',
  ],

  context_display: (ctx) => {
    const items = []
    if (ctx?.offer?.recommendedName) {
      items.push({ label: 'Continuity Model', value: ctx.offer.recommendedName })
    }
    if (ctx?.core?.name) {
      items.push({ label: 'Core Offer', value: ctx.core.name })
    }
    if (ctx?.niche?.definition) {
      items.push({ label: 'Members', value: ctx.niche.definition })
    }
    return items
  },

  clarifying_questions: [
    {
      id: 'membership_name',
      question: 'What is the name of your membership/subscription?',
      help: 'The official name members will see',
      required: true,
      placeholder: 'e.g., The Inner Circle, Growth Academy, VIP Membership',
    },
    {
      id: 'first_win',
      question: 'What quick win can they get in their first week?',
      help: 'The fastest result to make them feel their investment was worth it',
      required: true,
      placeholder: 'e.g., Complete the 5-Day Quick Start, Post your first win in the community',
    },
    {
      id: 'key_benefit',
      question: 'What is the #1 ongoing benefit they get?',
      help: 'The main reason to stay subscribed month after month',
      required: true,
      placeholder: 'e.g., Weekly live coaching calls, New templates every month, Direct access to me',
    },
  ],

  generation_prompt: (ctx, answers, voiceInstructions) => `
You are an email copywriter trained in Alex Hormozi's methodology, specializing in membership onboarding.

CONTEXT:
- Membership name: ${answers.membership_name}
- First week quick win: ${answers.first_win}
- Key ongoing benefit: ${answers.key_benefit}
- Members are: ${ctx?.niche?.definition || 'new members'}

EMAIL GOALS:
1. Make them feel they made the RIGHT decision
2. Reduce buyer's remorse immediately
3. Get them engaged in the first 48 hours
4. Set expectations for ongoing value

${voiceInstructions ? `VOICE PROFILE:\n${voiceInstructions}\n` : ''}

Write a membership welcome email in this format:

SUBJECT LINE: [Welcome + excitement - make them feel special]

---

[Email body - 200-250 words]
- Celebrate their decision (they're now part of something special)
- Explain what to do FIRST (one clear action)
- Preview the ongoing value they'll receive
- Create excitement about what's coming

ACCESS DETAILS:
[Login link placeholder]
[Community link placeholder if applicable]

YOUR FIRST STEP:
[Clear, specific action to take today]

---

P.S. [Reminder of the ongoing value or community element]

---

WHY THIS EMAIL WORKS:
[2-3 sentences explaining the psychology]
`,

  success_tips: [
    'Send within 5 minutes of signup - speed shows you care',
    'One clear first action - don\'t overwhelm with options',
    'Reference the community if you have one - belonging reduces churn',
  ],
}

export const CONTINUITY_RETENTION_EMAIL_TEMPLATE = {
  task_id: 'write_retention_email',
  display_name: 'Write Retention/Win-Back Email',
  category: 'continuity',
  task_type: 'email',

  context_sources: [
    'offers.continuity.recommendedName',
    'offers.core.name',
    'niche.definition',
  ],

  context_display: (ctx) => {
    const items = []
    if (ctx?.offer?.recommendedName) {
      items.push({ label: 'Continuity Model', value: ctx.offer.recommendedName })
    }
    if (ctx?.core?.name) {
      items.push({ label: 'Core Offer', value: ctx.core.name })
    }
    return items
  },

  clarifying_questions: [
    {
      id: 'membership_name',
      question: 'What is the name of your membership/subscription?',
      help: 'The official name',
      required: true,
      placeholder: 'e.g., The Inner Circle, Growth Academy',
    },
    {
      id: 'recent_value',
      question: 'What valuable thing did you add/do recently?',
      help: 'Something specific that happened in the last 30 days',
      required: true,
      placeholder: 'e.g., New masterclass on X, Updated templates, Member success story',
    },
    {
      id: 'upcoming_value',
      question: 'What exciting thing is coming soon?',
      help: 'Create FOMO about what they\'d miss',
      required: true,
      placeholder: 'e.g., Live workshop next week, New module dropping, Special guest expert',
    },
  ],

  generation_prompt: (ctx, answers, voiceInstructions) => `
You are an email copywriter trained in Alex Hormozi's methodology, specializing in member retention.

CONTEXT:
- Membership name: ${answers.membership_name}
- Recent value added: ${answers.recent_value}
- Upcoming value: ${answers.upcoming_value}
- Members are: ${ctx?.niche?.definition || 'members'}

EMAIL GOALS:
1. Re-engage inactive or at-risk members
2. Remind them of value they're already paying for
3. Create FOMO about upcoming content
4. Make staying feel like the obvious choice

${voiceInstructions ? `VOICE PROFILE:\n${voiceInstructions}\n` : ''}

Write a retention email in this format:

SUBJECT LINE: [Curiosity-driven, not desperate - focus on what they're missing]

---

[Email body - 150-200 words]
- Acknowledge they've been quiet (without guilt-tripping)
- Highlight specific recent value
- Preview exciting upcoming content
- Remind them WHY they joined
- Clear CTA to re-engage

[CTA: e.g., "Jump Back In →"]

---

P.S. [FOMO element about upcoming content or community wins]

---

WHY THIS EMAIL WORKS:
[2-3 sentences explaining the psychology]
`,

  success_tips: [
    'Send before they cancel, not after - watch engagement metrics',
    'Be specific about value, not generic "we miss you"',
    'One re-engagement action, not multiple asks',
  ],
}

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

export const IMPLEMENTATION_TEMPLATES = {
  // Attraction tasks
  create_attraction_headline: ATTRACTION_HEADLINE_TEMPLATE,
  write_welcome_email: ATTRACTION_WELCOME_EMAIL_TEMPLATE,
  write_launch_email: ATTRACTION_LAUNCH_EMAIL_TEMPLATE,

  // Upsell tasks
  create_upsell_headline: UPSELL_HEADLINE_TEMPLATE,
  set_upsell_pricing: UPSELL_PRICING_TEMPLATE,
  create_order_bump: UPSELL_ORDER_BUMP_TEMPLATE,

  // Downsell tasks
  create_downsell_headline: DOWNSELL_HEADLINE_TEMPLATE,
  write_downsell_email: DOWNSELL_EMAIL_TEMPLATE,
  create_payment_plan_pitch: DOWNSELL_PAYMENT_PLAN_TEMPLATE,

  // Continuity tasks
  create_continuity_pitch: CONTINUITY_PITCH_TEMPLATE,
  write_membership_welcome: CONTINUITY_WELCOME_EMAIL_TEMPLATE,
  write_retention_email: CONTINUITY_RETENTION_EMAIL_TEMPLATE,
}

/**
 * Get template for a task
 * Falls back to generic template if no specific match
 */
export function getTemplateForTask(taskTitle, category) {
  // Try exact match first
  const taskId = taskTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')

  if (IMPLEMENTATION_TEMPLATES[taskId]) {
    return IMPLEMENTATION_TEMPLATES[taskId]
  }

  // Try partial matches
  const normalizedTitle = taskTitle.toLowerCase()

  // Headline matches
  if (normalizedTitle.includes('headline')) {
    if (category === 'attraction') return ATTRACTION_HEADLINE_TEMPLATE
    if (category === 'upsell') return UPSELL_HEADLINE_TEMPLATE
    if (category === 'downsell') return DOWNSELL_HEADLINE_TEMPLATE
  }

  // Email matches
  if (normalizedTitle.includes('welcome') && normalizedTitle.includes('email')) {
    if (category === 'attraction') return ATTRACTION_WELCOME_EMAIL_TEMPLATE
    if (category === 'continuity') return CONTINUITY_WELCOME_EMAIL_TEMPLATE
  }

  if (normalizedTitle.includes('launch') || normalizedTitle.includes('value')) {
    if (category === 'attraction') return ATTRACTION_LAUNCH_EMAIL_TEMPLATE
  }

  if (normalizedTitle.includes('retention') || normalizedTitle.includes('win-back') || normalizedTitle.includes('winback')) {
    if (category === 'continuity') return CONTINUITY_RETENTION_EMAIL_TEMPLATE
  }

  if (normalizedTitle.includes('email') || normalizedTitle.includes('follow-up')) {
    if (category === 'attraction') return ATTRACTION_WELCOME_EMAIL_TEMPLATE
    if (category === 'downsell') return DOWNSELL_EMAIL_TEMPLATE
    if (category === 'continuity') return CONTINUITY_WELCOME_EMAIL_TEMPLATE
  }

  // Pricing and payment matches
  if (normalizedTitle.includes('pricing') || normalizedTitle.includes('price')) {
    if (category === 'upsell') return UPSELL_PRICING_TEMPLATE
  }

  if (normalizedTitle.includes('payment plan') || normalizedTitle.includes('payment-plan')) {
    if (category === 'downsell') return DOWNSELL_PAYMENT_PLAN_TEMPLATE
  }

  // Order bump matches
  if (normalizedTitle.includes('order bump') || normalizedTitle.includes('bump')) {
    if (category === 'upsell') return UPSELL_ORDER_BUMP_TEMPLATE
  }

  // Pitch and script matches
  if (normalizedTitle.includes('pitch') || normalizedTitle.includes('script')) {
    if (category === 'continuity') return CONTINUITY_PITCH_TEMPLATE
    if (category === 'downsell') return DOWNSELL_PAYMENT_PLAN_TEMPLATE
  }

  // Lead magnet matches
  if (normalizedTitle.includes('lead magnet') || normalizedTitle.includes('freebie') || normalizedTitle.includes('opt-in')) {
    if (category === 'attraction') return ATTRACTION_HEADLINE_TEMPLATE
  }

  // Return null if no template found - coach will show guidance-only mode
  return null
}

/**
 * Check if a task has AI generation capability
 */
export function hasGenerationTemplate(taskTitle, category) {
  return getTemplateForTask(taskTitle, category) !== null
}
