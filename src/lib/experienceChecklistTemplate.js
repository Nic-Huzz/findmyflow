/**
 * Experience Checklist Template
 *
 * Type-keyed templates: marketing, followup, and reflection are shared across
 * all experience types. The organisation section adapts per type.
 *
 * Each item becomes a row in experience_checklist_items with:
 *   is_custom: false, is_hidden: false, completed: false
 *
 * Users can hide (skip) seeded items, add custom items, and reorder.
 */

// ─── Shared across all types ───────────────────────────────────
const MARKETING = [
  { phase: 'pre', section: 'marketing', sort_order: 1, key: 'one_line_promise', label: 'Write the one-line promise (what transformation do attendees get?)' },
  { phase: 'pre', section: 'marketing', sort_order: 2, key: 'booking_page', label: 'Create the booking / sales page link' },
  { phase: 'pre', section: 'marketing', sort_order: 3, key: 'announce_email', label: 'Announce to your email list' },
  { phase: 'pre', section: 'marketing', sort_order: 4, key: 'post_teasers', label: 'Post 3 teaser pieces on social' },
  { phase: 'pre', section: 'marketing', sort_order: 5, key: 'dm_warm_leads', label: 'DM 10 warm leads personally with a direct invite' },
  { phase: 'pre', section: 'marketing', sort_order: 6, key: 'share_testimonial', label: 'Share 1 testimonial from a past experience' },
  { phase: 'pre', section: 'marketing', sort_order: 7, key: 'confirmation_email', label: 'Set up confirmation email for registrants' },
  { phase: 'pre', section: 'marketing', sort_order: 8, key: 'bts_content', label: 'Post behind-the-scenes content in the final week' },
  { phase: 'pre', section: 'marketing', sort_order: 9, key: 'last_chance', label: 'Send "last chance" reminder 48h before close' },
]

const FOLLOWUP = [
  { phase: 'post', section: 'followup', sort_order: 1, key: 'upload_attendees', label: 'Upload attendee contact data' },
  { phase: 'post', section: 'followup', sort_order: 2, key: 'thank_you_email', label: 'Send thank-you email within 24 hours' },
  { phase: 'post', section: 'followup', sort_order: 3, key: 'feedback_request', label: 'Send feedback / review request within 48 hours' },
  { phase: 'post', section: 'followup', sort_order: 4, key: 'upsell_invite', label: 'Send upsell or next-experience invite within 7 days' },
  { phase: 'post', section: 'followup', sort_order: 5, key: 'collect_testimonials', label: 'Collect written testimonials from 3+ attendees' },
  { phase: 'post', section: 'followup', sort_order: 6, key: 'upload_photos', label: 'Upload photos / highlights reel' },
]

const REFLECTION = [
  { phase: 'post', section: 'reflection', sort_order: 1, key: 'wahoo_note', label: 'What worked? (wahoo moments)' },
  { phase: 'post', section: 'reflection', sort_order: 2, key: 'scary_note', label: 'What drained energy? (scary / friction moments)' },
  { phase: 'post', section: 'reflection', sort_order: 3, key: 'three_percent_note', label: 'What one 3% improvement will you make next time?' },
  { phase: 'post', section: 'reflection', sort_order: 4, key: 'archive', label: 'Archive this experience' },
]

// ─── Type-specific organisation items ──────────────────────────
const ORG_WORKSHOP = [
  { sort_order: 1, key: 'room_setup', label: 'Confirm venue and room setup (chairs, mats, space layout)' },
  { sort_order: 2, key: 'run_sheet', label: 'Write the run-sheet (minute-by-minute agenda)' },
  { sort_order: 3, key: 'energy_arc', label: 'Plan your energy arc (pacing peaks and rests)' },
  { sort_order: 4, key: 'materials', label: 'Prepare materials (slides, handouts, physical items)' },
  { sort_order: 5, key: 'test_tech', label: 'Test tech end-to-end (audio, video, recording)' },
  { sort_order: 6, key: 'recording', label: 'Decide if you\'re recording, and set it up' },
  { sort_order: 7, key: 'brief_cohosts', label: 'Brief any co-hosts or support staff' },
  { sort_order: 8, key: 'opening_ritual', label: 'Prepare the opening ritual / energy set' },
  { sort_order: 9, key: 'payment_processing', label: 'Confirm payment processing is working' },
  { sort_order: 10, key: 'attendee_list', label: 'Prepare attendee list + name tags / welcome messages' },
  { sort_order: 11, key: 'feedback_plan', label: 'Plan how you\'ll capture feedback + photos on the day' },
  { sort_order: 12, key: 'day_before_reminder', label: 'Send day-before reminder with location/link + what to bring' },
]

const ORG_RETREAT = [
  { sort_order: 1, key: 'venue_accommodation', label: 'Confirm venue, accommodation, and room allocations' },
  { sort_order: 2, key: 'meals_catering', label: 'Arrange meals and catering (dietary requirements collected)' },
  { sort_order: 3, key: 'multi_session_arc', label: 'Design the multi-session arc (what happens each day, peaks and integration)' },
  { sort_order: 4, key: 'integration_time', label: 'Schedule integration time between sessions (rest, nature, journaling)' },
  { sort_order: 5, key: 'opening_ceremony', label: 'Plan the opening ceremony and container-setting' },
  { sort_order: 6, key: 'closing_ceremony', label: 'Plan the closing ceremony and re-entry process' },
  { sort_order: 7, key: 'materials', label: 'Prepare materials (journals, handouts, physical items)' },
  { sort_order: 8, key: 'transport_logistics', label: 'Share transport and arrival logistics with attendees' },
  { sort_order: 9, key: 'emergency_plan', label: 'Prepare emergency contacts and first aid plan' },
  { sort_order: 10, key: 'brief_cohosts', label: 'Brief any co-facilitators, assistants, or venue staff' },
  { sort_order: 11, key: 'welcome_pack', label: 'Prepare welcome pack (schedule, guidelines, what to bring)' },
  { sort_order: 12, key: 'payment_processing', label: 'Confirm deposits collected and payment processing working' },
]

const ORG_CIRCLE = [
  { sort_order: 1, key: 'space_setup', label: 'Set up the circle space (cushions, candles, centre altar)' },
  { sort_order: 2, key: 'container_agreements', label: 'Write the container agreements (confidentiality, no advice-giving, witnessing)' },
  { sort_order: 3, key: 'sharing_protocol', label: 'Design the sharing protocol (rounds, time limits, speaking objects)' },
  { sort_order: 4, key: 'opening_ritual', label: 'Prepare the opening ritual (breath, sound, or grounding)' },
  { sort_order: 5, key: 'closing_ritual', label: 'Prepare the closing ritual (gratitude round, intention setting)' },
  { sort_order: 6, key: 'prompt_questions', label: 'Write 2-3 prompt questions for the sharing rounds' },
  { sort_order: 7, key: 'capacity_limit', label: 'Set the capacity limit (circles work best at 6-12 people)' },
  { sort_order: 8, key: 'music_ambience', label: 'Prepare ambient music or soundscape for holding space' },
  { sort_order: 9, key: 'day_before_reminder', label: 'Send day-before reminder with location + what to expect' },
]

const ORG_ONLINE = [
  { sort_order: 1, key: 'zoom_setup', label: 'Set up Zoom link with waiting room and security settings' },
  { sort_order: 2, key: 'run_sheet', label: 'Write the run-sheet (minute-by-minute agenda)' },
  { sort_order: 3, key: 'energy_arc', label: 'Plan your energy arc (screen fatigue peaks at 45 min)' },
  { sort_order: 4, key: 'slides_materials', label: 'Prepare slides, screen shares, and digital handouts' },
  { sort_order: 5, key: 'camera_lighting', label: 'Test your camera, lighting, and audio setup' },
  { sort_order: 6, key: 'recording', label: 'Decide if you\'re recording, configure Zoom settings' },
  { sort_order: 7, key: 'breakout_rooms', label: 'Plan breakout rooms or interactive elements to keep energy up' },
  { sort_order: 8, key: 'backup_plan', label: 'Prepare a backup plan for tech failures (phone number, backup link)' },
  { sort_order: 9, key: 'brief_cohosts', label: 'Brief any co-hosts on chat moderation and tech support' },
  { sort_order: 10, key: 'day_before_reminder', label: 'Send day-before reminder with Zoom link + tech requirements' },
]

const ORG_ONE_ON_ONE = [
  { sort_order: 1, key: 'client_prep', label: 'Send client prep message (intention, what to expect, what to bring)' },
  { sort_order: 2, key: 'session_script', label: 'Write the session arc (opening, exploration, integration, close)' },
  { sort_order: 3, key: 'calibration_notes', label: 'Review client history and calibration notes' },
  { sort_order: 4, key: 'space_setup', label: 'Set up the session space (in-person) or test tech (online)' },
  { sort_order: 5, key: 'followup_protocol', label: 'Prepare follow-up message template (send within 24 hours)' },
  { sort_order: 6, key: 'payment_processing', label: 'Confirm payment is received or invoiced' },
  { sort_order: 7, key: 'integration_homework', label: 'Prepare integration homework or practice for the client' },
]

const ORG_POPUP = [
  { sort_order: 1, key: 'location_scouting', label: 'Scout and confirm the location (permits, access, logistics)' },
  { sort_order: 2, key: 'run_sheet', label: 'Write the run-sheet and day-of timeline' },
  { sort_order: 3, key: 'energy_arc', label: 'Plan the energy arc (build, peak, cool-down)' },
  { sort_order: 4, key: 'equipment', label: 'Confirm all equipment (sound, lighting, props, signage)' },
  { sort_order: 5, key: 'volunteers', label: 'Recruit and brief volunteers or staff for the day' },
  { sort_order: 6, key: 'weather_backup', label: 'Prepare weather backup plan (if outdoor)' },
  { sort_order: 7, key: 'safety_plan', label: 'Prepare safety and emergency plan for the venue' },
  { sort_order: 8, key: 'day_before_reminder', label: 'Send day-before reminder with location + what to bring' },
]

const ORG_COURSE = [
  { sort_order: 1, key: 'module_structure', label: 'Design the module structure (lessons, milestones, outcomes)' },
  { sort_order: 2, key: 'delivery_platform', label: 'Set up delivery platform (Teachable, Kajabi, etc.)' },
  { sort_order: 3, key: 'drip_schedule', label: 'Configure drip schedule (when each module unlocks)' },
  { sort_order: 4, key: 'record_content', label: 'Record or write all module content' },
  { sort_order: 5, key: 'community_space', label: 'Set up community space (Slack, Circle, WhatsApp group)' },
  { sort_order: 6, key: 'welcome_sequence', label: 'Write the welcome email sequence for new enrollees' },
  { sort_order: 7, key: 'test_enrollment', label: 'Test the full enrollment and access flow end-to-end' },
  { sort_order: 8, key: 'payment_processing', label: 'Confirm payment processing and access automation' },
]

// ─── Type-to-organisation mapping ──────────────────────────────
const ORG_BY_TYPE = {
  workshop: ORG_WORKSHOP,
  retreat: ORG_RETREAT,
  circle: ORG_CIRCLE,
  online: ORG_ONLINE,
  one_on_one: ORG_ONE_ON_ONE,
  popup: ORG_POPUP,
  course: ORG_COURSE,
}

/**
 * Get the full template for a given experience type.
 * Falls back to workshop if type is unknown.
 */
function getTemplateForType(experienceType) {
  const orgItems = ORG_BY_TYPE[experienceType] || ORG_WORKSHOP
  const organisation = orgItems.map(item => ({
    ...item,
    phase: 'pre',
    section: 'organisation',
  }))
  return [...MARKETING, ...organisation, ...FOLLOWUP, ...REFLECTION]
}

// Legacy export for backward compat (defaults to workshop)
export const EXPERIENCE_CHECKLIST_TEMPLATE = getTemplateForType('workshop')

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
 * experience_checklist_items. Includes template_item_key for cross-experience
 * matching on "Run Again".
 *
 * @param {string} experienceId
 * @param {string} userId
 * @param {string} [experienceType='workshop'] - one of: workshop, retreat, circle, online, one_on_one, popup, course
 * @returns {Array<Object>} rows for supabase.from('experience_checklist_items').insert()
 */
export function buildChecklistRows(experienceId, userId, experienceType) {
  const template = getTemplateForType(experienceType || 'workshop')
  return template.map(item => {
    const row = {
      experience_id: experienceId,
      user_id: userId,
      phase: item.phase,
      section: item.section,
      label: item.label,
      sort_order: item.sort_order,
      is_custom: false,
      is_hidden: false,
      completed: false,
    }
    if (item.key) row.template_item_key = item.key
    return row
  })
}

/**
 * Keys for checklist items that support text notes (shown as inline text input).
 * Only these items get a notes textarea in ExperienceDetail.
 */
export const NOTABLE_KEYS = [
  'one_line_promise', 'booking_page',
  // Workshop / shared
  'run_sheet', 'energy_arc', 'opening_ritual',
  // Retreat
  'multi_session_arc', 'opening_ceremony', 'closing_ceremony',
  // Circle
  'container_agreements', 'sharing_protocol', 'prompt_questions',
  // 1:1
  'session_script', 'calibration_notes', 'integration_homework',
  // Course
  'module_structure', 'drip_schedule',
]
