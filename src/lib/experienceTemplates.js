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
  // Event Page Copy moved to NODE_TOOLS as "coming soon" (pipelineConfig.js)

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
