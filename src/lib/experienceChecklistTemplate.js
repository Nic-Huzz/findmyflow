/**
 * Experience Checklist Template
 *
 * Hardcoded seeded items copied into experience_checklist_items on experience creation.
 * V1 targets live workshops (Jock's Bali dance event is user zero).
 *
 * Each item becomes a row in experience_checklist_items with:
 *   is_custom: false, is_hidden: false, completed: false
 *
 * Users can hide (skip) seeded items, add custom items, and reorder.
 * Phase 2 adds 'post' phase items — currently included here but only rendered
 * in ExperienceDetail when the Post-Event tab ships.
 */

export const EXPERIENCE_CHECKLIST_TEMPLATE = [
  // ─────────────────────────────────────────────────────────
  // PRE-EVENT → MARKETING (fill the room)
  // ─────────────────────────────────────────────────────────
  { phase: 'pre', section: 'marketing', sort_order: 1, label: 'Write the one-line promise (what transformation do attendees get?)' },
  { phase: 'pre', section: 'marketing', sort_order: 2, label: 'Create the booking / sales page link' },
  { phase: 'pre', section: 'marketing', sort_order: 3, label: 'Announce to your email list' },
  { phase: 'pre', section: 'marketing', sort_order: 4, label: 'Post 3 teaser pieces on social' },
  { phase: 'pre', section: 'marketing', sort_order: 5, label: 'DM 10 warm leads personally with a direct invite' },
  { phase: 'pre', section: 'marketing', sort_order: 6, label: 'Share 1 testimonial from a past experience' },
  { phase: 'pre', section: 'marketing', sort_order: 7, label: 'Set up confirmation email for registrants' },
  { phase: 'pre', section: 'marketing', sort_order: 8, label: 'Post behind-the-scenes content in the final week' },
  { phase: 'pre', section: 'marketing', sort_order: 9, label: 'Send "last chance" reminder 48h before close' },

  // ─────────────────────────────────────────────────────────
  // PRE-EVENT → ORGANISATION (ready to deliver)
  // Sharpened for live workshops (in-person or live online)
  // ─────────────────────────────────────────────────────────
  { phase: 'pre', section: 'organisation', sort_order: 1, label: 'Confirm room setup OR Zoom link + waiting room settings' },
  { phase: 'pre', section: 'organisation', sort_order: 2, label: 'Write the run-sheet (minute-by-minute agenda)' },
  { phase: 'pre', section: 'organisation', sort_order: 3, label: 'Plan your energy arc (pacing peaks and rests)' },
  { phase: 'pre', section: 'organisation', sort_order: 4, label: 'Prepare materials (slides, handouts, physical items)' },
  { phase: 'pre', section: 'organisation', sort_order: 5, label: 'Test tech end-to-end (audio, video, recording)' },
  { phase: 'pre', section: 'organisation', sort_order: 6, label: 'Decide if you\'re recording, and set it up' },
  { phase: 'pre', section: 'organisation', sort_order: 7, label: 'Brief any co-hosts or support staff' },
  { phase: 'pre', section: 'organisation', sort_order: 8, label: 'Prepare the opening ritual / energy set' },
  { phase: 'pre', section: 'organisation', sort_order: 9, label: 'Confirm payment processing is working' },
  { phase: 'pre', section: 'organisation', sort_order: 10, label: 'Prepare attendee list + name tags / welcome messages' },
  { phase: 'pre', section: 'organisation', sort_order: 11, label: 'Plan how you\'ll capture feedback + photos on the day' },
  { phase: 'pre', section: 'organisation', sort_order: 12, label: 'Send day-before reminder with location/link + what to bring' },

  // ─────────────────────────────────────────────────────────
  // POST-EVENT → FOLLOW-UP (Phase 2)
  // ─────────────────────────────────────────────────────────
  { phase: 'post', section: 'followup', sort_order: 1, label: 'Upload attendee contact data', key: 'upload_attendees' },
  { phase: 'post', section: 'followup', sort_order: 2, label: 'Send thank-you email within 24 hours' },
  { phase: 'post', section: 'followup', sort_order: 3, label: 'Send feedback / review request within 48 hours' },
  { phase: 'post', section: 'followup', sort_order: 4, label: 'Send upsell or next-experience invite within 7 days' },
  { phase: 'post', section: 'followup', sort_order: 5, label: 'Collect written testimonials from 3+ attendees' },
  { phase: 'post', section: 'followup', sort_order: 6, label: 'Upload photos / highlights reel' },

  // ─────────────────────────────────────────────────────────
  // POST-EVENT → REFLECTION (Phase 2)
  // ─────────────────────────────────────────────────────────
  { phase: 'post', section: 'reflection', sort_order: 1, label: 'What worked? (wahoo moments)', key: 'wahoo_note' },
  { phase: 'post', section: 'reflection', sort_order: 2, label: 'What drained energy? (scary / friction moments)', key: 'scary_note' },
  { phase: 'post', section: 'reflection', sort_order: 3, label: 'What one 3% improvement will you make next time?', key: 'three_percent_note' },
  { phase: 'post', section: 'reflection', sort_order: 4, label: 'Archive this experience' },
]

/**
 * Section metadata for UI rendering
 */
export const SECTION_META = {
  marketing:    { title: 'Marketing',    subtitle: 'Fill the room',           icon: '📣', phase: 'pre'  },
  organisation: { title: 'Organisation', subtitle: 'Ready to deliver',        icon: '🗂️', phase: 'pre'  },
  followup:     { title: 'Follow-up',    subtitle: 'Set up for success',      icon: '💌', phase: 'post' },
  reflection:   { title: 'Reflection',   subtitle: 'Compound your gains',     icon: '🪞', phase: 'post' },
}

export const PHASE_META = {
  pre:  { title: 'Pre-Event',  subtitle: 'Set your next experience up to win'  },
  post: { title: 'Post-Event', subtitle: 'Close the loop and compound forward' },
}

/**
 * Build an array of checklist item rows ready for bulk insert into
 * experience_checklist_items. Excludes the `key` field (UI-only hint).
 *
 * @param {string} experienceId
 * @param {string} userId
 * @returns {Array<Object>} rows for supabase.from('experience_checklist_items').insert()
 */
export function buildChecklistRows(experienceId, userId) {
  return EXPERIENCE_CHECKLIST_TEMPLATE.map(item => ({
    experience_id: experienceId,
    user_id: userId,
    phase: item.phase,
    section: item.section,
    label: item.label,
    sort_order: item.sort_order,
    is_custom: false,
    is_hidden: false,
    completed: false,
  }))
}
