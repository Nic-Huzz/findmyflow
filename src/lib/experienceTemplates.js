/**
 * experienceTemplates.js — Template definitions for the Experience Pipeline
 *
 * Each template produces AI-generated copy from Creator Brain + experience data.
 * Templates are surfaced inside pipeline nodes via TemplateSelector.
 *
 * To add a new template: add an entry to EXPERIENCE_TEMPLATES with items[].
 * Each item's buildInstructions() receives the experience object and brain context string.
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return 'TBD'
  return new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

function experienceContext(exp) {
  const parts = [`Event: "${exp.name || 'Untitled'}"`]
  if (exp.experience_type) parts.push(`Type: ${exp.experience_type.replace(/_/g, ' ')}`)
  if (exp.experience_date) parts.push(`Date: ${formatDate(exp.experience_date)}`)
  if (exp.ticket_price) parts.push(`Price: $${exp.ticket_price}`)
  if (exp.venue) parts.push(`Venue: ${exp.venue}`)
  if (exp.one_line_promise) parts.push(`Promise: "${exp.one_line_promise}"`)
  if (exp.value_stack) parts.push(`What attendees get: ${exp.value_stack}`)
  if (exp.description) parts.push(`Description: ${exp.description}`)
  return parts.join('\n')
}

// ─── Templates ───────────────────────────────────────────────────────────────

export const EXPERIENCE_TEMPLATES = [
  {
    id: 'event_page',
    name: 'Event Page Copy',
    icon: '📝',
    description: 'Event listing copy in 3 lengths. Paste into your booking page.',
    node: 'attract',
    outputType: 'copy_blocks',
    items: [
      {
        label: 'Short (social bio / one-liner)',
        contentType: 'offer_teaser',
        platform: 'instagram',
        buildInstructions: (exp, brain) =>
          `Write a 1-2 sentence event teaser that creates intrigue and makes someone want to know more.

EVENT DETAILS:
${experienceContext(exp)}

CREATOR CONTEXT:
${brain}

RULES:
- Maximum 2 sentences. Punchy. No fluff.
- Reference what the attendee will experience or feel, not logistics.
- Match the creator's voice and tone from the context above.
- Do NOT use em dashes. Use commas or full stops instead.
- Do NOT include hashtags or emojis unless the voice profile says to.
- Output ONLY the teaser text, nothing else.`,
      },
      {
        label: 'Medium (event listing)',
        contentType: 'educational',
        platform: 'email',
        buildInstructions: (exp, brain) =>
          `Write a 3-4 paragraph event listing for a booking page or event platform (Eventbrite, Humanitix, etc.).

EVENT DETAILS:
${experienceContext(exp)}

CREATOR CONTEXT:
${brain}

STRUCTURE:
- Paragraph 1: Hook. What problem does this solve or what desire does it fulfill?
- Paragraph 2: What will actually happen at this event? Paint the picture.
- Paragraph 3: Who is this for? Make the ideal attendee feel seen.
- Paragraph 4: Logistics (date, venue, price) + clear CTA.

RULES:
- Write in the creator's voice from the context above.
- Be specific, not generic. Reference the actual event name, date, venue.
- Do NOT use em dashes. Use commas or full stops instead.
- Do NOT use bullet points unless describing what's included.
- Output ONLY the listing text, nothing else.`,
      },
      {
        label: 'Long (full sales page copy)',
        contentType: 'transformation_story',
        platform: 'email',
        buildInstructions: (exp, brain) =>
          `Write full event sales page copy that could stand alone as a landing page.

EVENT DETAILS:
${experienceContext(exp)}

CREATOR CONTEXT:
${brain}

STRUCTURE:
- Headline: Bold, benefit-driven, speaks to the transformation.
- Opening: The problem or feeling the reader is sitting with right now.
- The shift: What becomes possible when they attend. Paint the "after" picture.
- What's included: What they'll actually do/experience (bullet list is fine here).
- About the facilitator: Brief, warm, credible. Use essence archetype and story from context.
- Social proof: Reference testimonials or past results if available in the context.
- Details: Date, time, venue, price, what to bring.
- CTA: Clear, warm, no pressure. Make it feel like an invitation, not a pitch.

RULES:
- Write in the creator's voice from the context above.
- Keep it warm and inviting. This is an experience, not a product launch.
- Do NOT use em dashes. Use commas or full stops instead.
- If price is available, frame it as an investment in themselves.
- Output ONLY the sales page copy, nothing else.`,
      },
    ],
  },

  // ─── Future templates (stubs) ────────────────────────────────────────────
  // Add items[] when ready to build each one.

  {
    id: 'pre_event_emails',
    name: 'Pre-Event Sales Sequence',
    icon: '✉️',
    description: '5-email drip to fill the room. Tied to your event countdown.',
    node: 'attract',
    outputType: 'email_sequence',
    items: [], // TODO: populate with real email templates
  },
  {
    id: 'post_event_emails',
    name: 'Post-Event Follow-Up',
    icon: '💌',
    description: 'Thank you, feedback, upsell. Sent after your event.',
    node: 'grow',
    outputType: 'email_sequence',
    items: [], // TODO: populate
  },
  {
    id: 'social_content_pack',
    name: 'Social Content Pack',
    icon: '📸',
    description: '5 posts from different angles. One click, five pieces of content.',
    node: 'attract',
    outputType: 'copy_blocks',
    items: [], // TODO: populate
  },
  {
    id: 'affiliate_outreach',
    name: 'Affiliate Outreach',
    icon: '🤝',
    description: '3 message templates for asking people to promote your event.',
    node: 'attract',
    outputType: 'copy_blocks',
    items: [], // TODO: populate
  },
  {
    id: 'attraction_offer_copy',
    name: 'Attraction Offer Copy',
    icon: '🎁',
    description: 'Copy for your chosen attraction strategies (early bird, group, etc.).',
    node: 'attract',
    outputType: 'copy_blocks',
    items: [], // TODO: populate from selected Attraction Stack strategies
  },
]

// ─── API ─────────────────────────────────────────────────────────────────────

/** Get templates available for a specific pipeline node */
export function getTemplatesForNode(nodeKey) {
  return EXPERIENCE_TEMPLATES.filter(t => t.node === nodeKey && t.items.length > 0)
}

/** Get a single template by ID */
export function getTemplate(templateId) {
  return EXPERIENCE_TEMPLATES.find(t => t.id === templateId) || null
}
