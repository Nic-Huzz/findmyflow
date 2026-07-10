/**
 * Prompt Templates for CRM Prompt Generator
 *
 * These templates are designed to be copied to external AI tools (ChatGPT, Claude, etc.)
 * They use data from challenge flows to create personalized prompts.
 *
 * Each template function:
 * - Takes user data as input
 * - Returns a complete, ready-to-use prompt string
 * - Includes context from multiple data sources
 */

// ============================================================================
// LANDING PAGE PROMPTS
// ============================================================================

/**
 * Generate landing page copy prompt
 * Best for: Lead magnet landing pages, opt-in pages
 */
export function generateLandingPagePrompt(data, additionalContext = '') {
  const { persona, offer, validation, voice, launch } = data

  const sections = []

  sections.push(`Create high-converting landing page copy for a lead magnet opt-in page.

GOAL: Get visitors to enter their email in exchange for the lead magnet.`)

  // Target audience
  if (persona?.ideal_customer || offer?.niche_definition) {
    sections.push(`
TARGET AUDIENCE:
- Ideal Customer: ${persona?.ideal_customer || offer?.niche_definition || 'Not specified'}
- Core Problem: ${persona?.core_problem || offer?.problem_area || 'Not specified'}
${persona?.unique_approach ? `- What makes this unique: ${persona.unique_approach}` : ''}`)
  }

  // Lead magnet details
  if (offer?.leadMagnet || offer?.lead_magnet_ideas?.length > 0) {
    sections.push(`
LEAD MAGNET:
- Type: ${offer.leadMagnet?.type || 'Free resource'}
- Idea: ${offer.leadMagnet?.idea || offer.lead_magnet_ideas?.[0] || 'Not specified'}`)
  }

  // Pain points from validation
  if (validation?.painPoints?.length > 0 || validation?.pain_points?.length > 0) {
    const pains = validation.painPoints || validation.pain_points || []
    sections.push(`
PAIN POINTS TO ADDRESS (from real customer research):
${pains.slice(0, 5).map(p => `- "${p}"`).join('\n')}`)
  }

  // Desired outcomes
  if (validation?.dreamOutcomes?.length > 0 || validation?.desired_outcomes?.length > 0) {
    const outcomes = validation.dreamOutcomes || validation.desired_outcomes || []
    sections.push(`
DESIRED OUTCOMES (what they want):
${outcomes.slice(0, 5).map(o => `- ${o}`).join('\n')}`)
  }

  // Voice/tone
  if (voice?.voice_summary || voice?.signature_phrases?.length > 0) {
    sections.push(`
VOICE & TONE:
${voice.voice_summary ? `- Style: ${voice.voice_summary}` : ''}
${voice.signature_phrases?.length > 0 ? `- Signature phrases to incorporate: ${voice.signature_phrases.slice(0, 3).join(', ')}` : ''}`)
  }

  // Additional context
  if (additionalContext) {
    sections.push(`
ADDITIONAL CONTEXT:
${additionalContext}`)
  }

  sections.push(`
OUTPUT FORMAT:
Please create:
1. Headline (attention-grabbing, benefit-focused)
2. Subheadline (expands on the headline)
3. 3-5 bullet points (what they'll learn/get)
4. Call-to-action button text
5. Optional: Social proof element or urgency statement

Keep the copy conversational and focused on transformation, not features.`)

  return sections.join('\n')
}

// ============================================================================
// SALES PAGE PROMPTS
// ============================================================================

/**
 * Generate sales page copy prompt
 * Best for: Core offer sales pages, product pages
 */
export function generateSalesPagePrompt(data, additionalContext = '') {
  const { persona, offer, validation, voice, proof, launch } = data

  const sections = []

  sections.push(`Create a high-converting sales page for my core offer.

GOAL: Convert warm leads into paying customers.`)

  // Offer details
  if (offer) {
    sections.push(`
THE OFFER:
- Name: ${offer.name || offer.offer_name || 'Core Offer'}
- Dream Outcome: ${offer.dreamOutcome || offer.dream_outcome || 'Not specified'}
- Price: ${offer.price || offer.core_offer_price ? `$${offer.price || offer.core_offer_price}` : 'Not specified'}
${offer.bonuses?.length > 0 ? `- Bonuses included: ${offer.bonuses.map(b => b.name || b).join(', ')}` : ''}
${offer.guarantee?.type ? `- Guarantee: ${offer.guarantee.type}${offer.guarantee.details ? ` - ${offer.guarantee.details}` : ''}` : ''}
${offer.scarcity?.types?.length > 0 ? `- Urgency/Scarcity: ${offer.scarcity.types.join(', ')}` : ''}`)
  }

  // Target audience
  if (persona?.ideal_customer || offer?.niche_definition) {
    sections.push(`
TARGET AUDIENCE:
- Who: ${persona?.ideal_customer || offer?.niche_definition || 'Not specified'}
- Core Problem: ${persona?.core_problem || offer?.problem_area || 'Not specified'}`)
  }

  // Pain points
  if (validation?.painPoints?.length > 0 || validation?.pain_points?.length > 0) {
    const pains = validation.painPoints || validation.pain_points || []
    sections.push(`
PAIN POINTS (use their exact language):
${pains.slice(0, 7).map(p => `- "${p}"`).join('\n')}`)
  }

  // Objections
  if (validation?.objections?.length > 0) {
    sections.push(`
COMMON OBJECTIONS TO ADDRESS:
${validation.objections.slice(0, 5).map(o => `- ${o}`).join('\n')}`)
  }

  // Proof elements
  if (proof?.stack || launch?.proof) {
    const proofData = proof?.stack || launch?.proof
    sections.push(`
PROOF ELEMENTS TO INCLUDE:
${proofData.testimonials ? `- Testimonials: ${proofData.testimonials}` : ''}
${proofData.caseStudies ? `- Case studies: ${proofData.caseStudies}` : ''}
${proofData.credentials ? `- Credentials: ${proofData.credentials}` : ''}
${proofData.mediaFeatures ? `- Media features: ${proofData.mediaFeatures}` : ''}`)
  }

  // Voice
  if (voice?.voice_summary || voice?.contrarian_takes) {
    sections.push(`
VOICE & POSITIONING:
${voice.voice_summary ? `- Tone: ${voice.voice_summary}` : ''}
${voice.contrarian_takes ? `- Unique angle: ${voice.contrarian_takes}` : ''}`)
  }

  // Additional context
  if (additionalContext) {
    sections.push(`
ADDITIONAL CONTEXT:
${additionalContext}`)
  }

  sections.push(`
OUTPUT FORMAT:
Please create a complete sales page with:
1. Attention-grabbing headline
2. Opening hook (address the pain)
3. Story/journey section
4. Problem agitation
5. Solution introduction
6. Offer breakdown with features & benefits
7. Bonuses section (if applicable)
8. Social proof section
9. Objection handling
10. Guarantee section
11. Price presentation
12. Urgency/scarcity (if applicable)
13. Final CTA

Use emotional storytelling and focus on transformation over features.`)

  return sections.join('\n')
}

// ============================================================================
// EMAIL SEQUENCE PROMPTS
// ============================================================================

/**
 * Generate nurture email sequence prompt
 * Best for: Welcome sequences, value sequences, trust-building
 */
export function generateNurtureSequencePrompt(data, additionalContext = '') {
  const { persona, offer, validation, voice, proof } = data

  const sections = []

  sections.push(`Create a 5-email nurture sequence to build trust and warm up leads.

GOAL: Build relationship, deliver value, position for future sale.
SEQUENCE LENGTH: 5 emails over 2 weeks`)

  // Audience
  if (persona?.ideal_customer) {
    sections.push(`
AUDIENCE:
- Who: ${persona.ideal_customer}
- Their main struggle: ${persona.core_problem || 'Finding the right solution'}`)
  }

  // Lead magnet context
  if (offer?.leadMagnet) {
    sections.push(`
ENTRY POINT:
They just downloaded: ${offer.leadMagnet.idea || offer.leadMagnet.type || 'a free resource'}`)
  }

  // Pain points to reference
  if (validation?.painPoints?.length > 0 || validation?.pain_points?.length > 0) {
    const pains = validation.painPoints || validation.pain_points || []
    sections.push(`
PAIN POINTS TO REFERENCE:
${pains.slice(0, 5).map(p => `- "${p}"`).join('\n')}`)
  }

  // Voice
  if (voice?.voice_summary) {
    sections.push(`
VOICE:
Write in this tone: ${voice.voice_summary}`)
  }

  // Additional context
  if (additionalContext) {
    sections.push(`
ADDITIONAL CONTEXT:
${additionalContext}`)
  }

  sections.push(`
EMAIL STRUCTURE:
1. **Welcome Email** (Day 0): Deliver the lead magnet, set expectations, quick win
2. **Value Email #1** (Day 2): Share a key insight or story that addresses their pain
3. **Value Email #2** (Day 5): Teach something actionable, build credibility
4. **Connection Email** (Day 8): Personal story, build relatability
5. **Bridge Email** (Day 12): Soft mention of offer, invite to next step

OUTPUT FORMAT:
For each email, provide:
- Subject line (+ 2 alternatives)
- Preview text
- Full email body (200-400 words each)
- Call-to-action

Make emails conversational, valuable, and focused on building trust.`)

  return sections.join('\n')
}

/**
 * Generate launch email sequence prompt
 * Best for: Product launches, promotions, time-limited offers
 */
export function generateLaunchSequencePrompt(data, additionalContext = '') {
  const { persona, offer, validation, voice, proof, launch } = data

  const sections = []

  sections.push(`Create a 7-email launch sequence to sell my offer.

GOAL: Convert warm leads into buyers during a launch window.
SEQUENCE: 7 emails over 5-7 days`)

  // Offer details
  if (offer) {
    sections.push(`
THE OFFER:
- Name: ${offer.name || offer.offer_name || 'Core Offer'}
- Outcome: ${offer.dreamOutcome || offer.dream_outcome || 'Not specified'}
- Price: ${offer.price || offer.core_offer_price ? `$${offer.price || offer.core_offer_price}` : 'To be announced'}
${offer.bonuses?.length > 0 ? `- Bonuses: ${offer.bonuses.map(b => b.name || b).join(', ')}` : ''}
${offer.guarantee?.type ? `- Guarantee: ${offer.guarantee.type}` : ''}`)
  }

  // Urgency elements
  if (offer?.scarcity?.types?.length > 0 || launch?.approach) {
    sections.push(`
URGENCY ELEMENTS:
${offer?.scarcity?.types ? `- Scarcity: ${offer.scarcity.types.join(', ')}` : ''}
${launch?.approach ? `- Launch approach: ${launch.approach}` : ''}`)
  }

  // Objections
  if (validation?.objections?.length > 0) {
    sections.push(`
OBJECTIONS TO OVERCOME:
${validation.objections.slice(0, 5).map(o => `- ${o}`).join('\n')}`)
  }

  // Proof
  if (proof?.stack || launch?.proof) {
    sections.push(`
PROOF TO INCLUDE:
- Use testimonials and case studies throughout the sequence`)
  }

  // Additional context
  if (additionalContext) {
    sections.push(`
ADDITIONAL CONTEXT:
${additionalContext}`)
  }

  sections.push(`
EMAIL STRUCTURE:
1. **Announcement** (Day 1): Build excitement, share what's coming
2. **Cart Open** (Day 1): The offer is live, full details, primary CTA
3. **Story/Why** (Day 2): Personal story, why you created this
4. **Social Proof** (Day 3): Testimonials, case studies, results
5. **Objection Buster** (Day 4): Address the #1 objection directly
6. **Last Chance** (Day 5): 24-hour warning, urgency
7. **Final Hours** (Day 5/6): Last call, doors closing

OUTPUT FORMAT:
For each email:
- Subject line (+ 2 alternatives)
- Preview text
- Full email body (250-500 words)
- PS line
- Call-to-action

Make emails urgent but genuine. Focus on transformation and FOMO.`)

  return sections.join('\n')
}

// ============================================================================
// OUTREACH PROMPTS
// ============================================================================

/**
 * Generate cold outreach prompt
 * Best for: DMs, cold emails, first contact
 */
export function generateColdOutreachPrompt(data, additionalContext = '') {
  const { persona, offer, voice, validation } = data

  const sections = []

  sections.push(`Create cold outreach scripts for reaching new prospects.

GOAL: Start conversations that lead to discovery calls or lead magnet downloads.
PLATFORM: ${additionalContext?.includes('LinkedIn') ? 'LinkedIn' : additionalContext?.includes('Instagram') ? 'Instagram' : 'Multi-platform (LinkedIn, Instagram, Email)'}`)

  // Target audience
  if (persona?.ideal_customer) {
    sections.push(`
WHO I'M REACHING OUT TO:
- Profile: ${persona.ideal_customer}
- Their likely problem: ${persona.core_problem || 'Not specified'}`)
  }

  // What I offer
  if (offer?.dreamOutcome || offer?.dream_outcome) {
    sections.push(`
WHAT I HELP WITH:
- Outcome I provide: ${offer.dreamOutcome || offer.dream_outcome}
${offer?.leadMagnet?.idea ? `- Free resource to offer: ${offer.leadMagnet.idea}` : ''}`)
  }

  // Voice
  if (voice?.voice_summary) {
    sections.push(`
MY TONE:
${voice.voice_summary}`)
  }

  // Additional context
  if (additionalContext) {
    sections.push(`
ADDITIONAL CONTEXT:
${additionalContext}`)
  }

  sections.push(`
RULES (non-negotiable):
- Every email MUST be under 100 words
- NO links, NO open tracking, NO images
- End with founder name + "Founder" title (nothing else)
- Write like a human, not a marketer

STRUCTURE (every email follows this):
1. REASON — I saw [something specific about their business]. Shows you did homework.
2. VALUE PROP — One sentence on what you offer and why it fits them.
3. ASK — A soft, low-commitment ask. Never "book a call."

OUTPUT FORMAT:
Create 3 versions of a 2-email cold outreach sequence:

**Email 1 (Cold)**
- Subject line (short, no clickbait)
- Body: Reason → Value prop → Ask
- Sign off: [Name] / Founder

**Email 2 (Follow-up, Day 3)**
- Subject line (reply to Email 1)
- Body: Deliver on the ask from Email 1 (e.g., attach pricing sheet) + one qualification question (e.g., "Are you considering buying in the next 6 months?")
- Sign off: [Name] / Founder

Keep it conversational, specific, and under 100 words per email. The ask in Email 1 should be something easy to say yes to (e.g., "Can I send you the pricing sheet to open when the time is right?").`)

  return sections.join('\n')
}

/**
 * Generate warm follow-up prompt
 * Best for: Following up with engaged leads, post-call messages
 */
export function generateWarmFollowUpPrompt(data, contactContext = {}, additionalContext = '') {
  const { persona, offer, voice } = data
  const { name, lastInteraction, status, notes } = contactContext

  const sections = []

  sections.push(`Create a warm follow-up message for an engaged lead.

GOAL: Re-engage and move them toward the next step.`)

  // Contact context
  sections.push(`
CONTACT DETAILS:
- Name: ${name || '[Contact Name]'}
- Last interaction: ${lastInteraction || 'Recently engaged with content'}
- Status: ${status || 'Interested but not yet converted'}
${notes ? `- Notes: ${notes}` : ''}`)

  // What I offer
  if (offer?.dreamOutcome || offer?.dream_outcome) {
    sections.push(`
WHAT I'M OFFERING:
- Outcome: ${offer.dreamOutcome || offer.dream_outcome}
- Next step: ${offer.leadMagnet?.idea ? `Free resource: ${offer.leadMagnet.idea}` : 'Discovery call or consultation'}`)
  }

  // Voice
  if (voice?.voice_summary) {
    sections.push(`
TONE:
${voice.voice_summary}`)
  }

  // Additional context
  if (additionalContext) {
    sections.push(`
ADDITIONAL CONTEXT:
${additionalContext}`)
  }

  sections.push(`
OUTPUT FORMAT:
Create 2 follow-up messages:

**MESSAGE 1: Check-in Style**
- Friendly opener
- Reference previous interaction
- Provide value or insight
- Soft next step

**MESSAGE 2: Direct Value Offer**
- Quick re-introduction
- Specific value proposition
- Clear CTA

Keep messages personal and helpful, not pushy. 75-150 words each.`)

  return sections.join('\n')
}

// ============================================================================
// AD COPY PROMPTS
// ============================================================================

/**
 * Generate ad copy prompt
 * Best for: Facebook/Instagram ads, Google ads, YouTube ads
 */
export function generateAdCopyPrompt(data, adType = 'facebook', additionalContext = '') {
  const { persona, offer, validation, voice } = data

  const sections = []

  const platformMap = {
    facebook: 'Facebook/Instagram Feed Ads',
    story: 'Instagram/Facebook Story Ads',
    google: 'Google Search Ads',
    youtube: 'YouTube Video Ads'
  }

  sections.push(`Create ad copy for ${platformMap[adType] || 'social media ads'}.

GOAL: Drive traffic to ${offer?.leadMagnet ? 'lead magnet landing page' : 'sales page'}.`)

  // Target audience
  if (persona?.ideal_customer) {
    sections.push(`
TARGET AUDIENCE:
- Who: ${persona.ideal_customer}
- Problem: ${persona.core_problem || 'Not specified'}`)
  }

  // Offer/Hook
  if (offer) {
    sections.push(`
WHAT WE'RE PROMOTING:
${offer.leadMagnet?.idea ? `- Lead Magnet: ${offer.leadMagnet.idea}` : ''}
${offer.dreamOutcome || offer.dream_outcome ? `- Outcome: ${offer.dreamOutcome || offer.dream_outcome}` : ''}`)
  }

  // Pain points for hooks
  if (validation?.painPoints?.length > 0 || validation?.pain_points?.length > 0) {
    const pains = validation.painPoints || validation.pain_points || []
    sections.push(`
PAIN POINTS FOR HOOKS:
${pains.slice(0, 5).map(p => `- "${p}"`).join('\n')}`)
  }

  // Voice
  if (voice?.voice_summary) {
    sections.push(`
BRAND VOICE:
${voice.voice_summary}`)
  }

  // Additional context
  if (additionalContext) {
    sections.push(`
ADDITIONAL CONTEXT:
${additionalContext}`)
  }

  // Platform-specific output
  if (adType === 'facebook' || adType === 'story') {
    sections.push(`
OUTPUT FORMAT:
Create 5 ad variations:

For each ad, provide:
- Hook (first line - must stop the scroll)
- Body copy (2-3 short paragraphs)
- Call-to-action

Variation types:
1. Pain-focused (address their struggle)
2. Outcome-focused (paint the dream)
3. Curiosity-based (open loop)
4. Social proof angle (results/testimonials)
5. Contrarian/unexpected angle

Keep copy punchy and conversational. Use line breaks for readability.`)
  } else if (adType === 'google') {
    sections.push(`
OUTPUT FORMAT:
Create 5 Google Search Ad groups:

For each ad:
- Headline 1 (30 chars max)
- Headline 2 (30 chars max)
- Headline 3 (30 chars max)
- Description 1 (90 chars max)
- Description 2 (90 chars max)

Include relevant keywords naturally. Focus on search intent.`)
  }

  return sections.join('\n')
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get template metadata for UI display
 */
export const PROMPT_TEMPLATES = {
  landingPage: {
    id: 'landingPage',
    name: 'Landing Page Copy',
    description: 'Lead magnet opt-in pages',
    icon: '🌐',
    generator: generateLandingPagePrompt,
    requiredData: ['persona', 'offer'],
    recommendedData: ['validation', 'voice']
  },
  salesPage: {
    id: 'salesPage',
    name: 'Sales Page Copy',
    description: 'Core offer sales pages',
    icon: '💰',
    generator: generateSalesPagePrompt,
    requiredData: ['offer'],
    recommendedData: ['persona', 'validation', 'voice', 'proof']
  },
  nurtureSequence: {
    id: 'nurtureSequence',
    name: 'Nurture Sequence',
    description: '5-email trust-building sequence',
    icon: '📧',
    generator: generateNurtureSequencePrompt,
    requiredData: ['persona'],
    recommendedData: ['offer', 'validation', 'voice']
  },
  launchSequence: {
    id: 'launchSequence',
    name: 'Launch Sequence',
    description: '7-email sales sequence',
    icon: '🚀',
    generator: generateLaunchSequencePrompt,
    requiredData: ['offer'],
    recommendedData: ['persona', 'validation', 'voice', 'proof', 'launch']
  },
  coldOutreach: {
    id: 'coldOutreach',
    name: 'Cold Outreach',
    description: 'DM and email scripts',
    icon: '📤',
    generator: generateColdOutreachPrompt,
    requiredData: ['persona'],
    recommendedData: ['offer', 'voice']
  },
  warmFollowUp: {
    id: 'warmFollowUp',
    name: 'Warm Follow-up',
    description: 'Follow-up messages for engaged leads',
    icon: '🤝',
    generator: generateWarmFollowUpPrompt,
    requiredData: [],
    recommendedData: ['offer', 'voice']
  },
  adCopy: {
    id: 'adCopy',
    name: 'Ad Copy',
    description: 'Social media ad variations',
    icon: '📣',
    generator: generateAdCopyPrompt,
    requiredData: ['persona'],
    recommendedData: ['offer', 'validation', 'voice']
  }
}

/**
 * Check data completeness for a specific template
 */
export function checkTemplateReadiness(templateId, availableData) {
  const template = PROMPT_TEMPLATES[templateId]
  if (!template) return { ready: false, missing: [], recommended: [] }

  const missing = template.requiredData.filter(key => !availableData[key])
  const recommendedMissing = template.recommendedData.filter(key => !availableData[key])

  return {
    ready: missing.length === 0,
    missing,
    recommended: recommendedMissing,
    completeness: Math.round(
      ((template.requiredData.length - missing.length +
        (template.recommendedData.length - recommendedMissing.length) * 0.5) /
        (template.requiredData.length + template.recommendedData.length * 0.5)) * 100
    )
  }
}
