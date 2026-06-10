/**
 * canonicalFields.js — Creator Brain field definitions
 *
 * ~90 fields across 6 domains, adapted for experience creators.
 * Each field has: key, domain, section, label, type, description.
 *
 * Key format: "domain.field_key" (e.g., "identity.essence_archetype")
 * Used by: merge logic, markdown regeneration, auto-populate hooks, brain review UI
 */

// ─── Identity (~15 fields) ──────────────────────────────────────────────────
// Who you are as a creator. Auto-populated from Essence Mirror, Scope Map,
// Experience Creator Matching, Remarkable Flow, Life Map.

const IDENTITY_FIELDS = [
  { key: 'identity.essence_archetype', section: 'Essence', label: 'Essence Archetype', type: 'string', description: 'Primary essence archetype (e.g., Radiant Rebel, Sacred Jester)' },
  { key: 'identity.secondary_archetype', section: 'Essence', label: 'Secondary Archetype', type: 'string', description: 'Secondary essence archetype from blend' },
  { key: 'identity.hero_name', section: 'Essence', label: 'Hero Name', type: 'string', description: 'Custom name chosen for their essence hero' },
  { key: 'identity.hero_avatar_url', section: 'Essence', label: 'Hero Avatar', type: 'string', description: 'URL to Pixar-style avatar image' },
  { key: 'identity.business_name', section: 'Basics', label: 'Business Name', type: 'string', description: 'Creator business or brand name' },
  { key: 'identity.website', section: 'Basics', label: 'Website', type: 'string', description: 'Primary website URL' },
  { key: 'identity.social_links', section: 'Basics', label: 'Social Links', type: 'object', description: 'Social media handles (instagram, tiktok, youtube, linkedin, etc.)' },
  { key: 'identity.creator_archetype', section: 'Creator Type', label: 'Creator Archetype', type: 'enum', enumValues: ['workshop', 'performance', 'cohort', 'books_media', 'facilitation', 'retreats'], description: 'Dominant business model archetype' },
  { key: 'identity.scope_position', section: 'Position', label: 'Scope Map Position', type: 'enum', enumValues: ['stream', 'lake', 'waterfall', 'river'], description: 'Root & Reach diagnostic result' },
  { key: 'identity.skills', section: 'Skills & Problems', label: 'Skills', type: 'array', description: 'Core play-skills from Life Map (e.g., storytelling, coaching)' },
  { key: 'identity.problems', section: 'Skills & Problems', label: 'Problems', type: 'array', description: 'Problems they are passionate about solving' },
  { key: 'identity.north_stars', section: 'North Stars', label: 'North Star Creators', type: 'array', description: 'Selected role model creators (up to 5)' },
  { key: 'identity.product_suite', section: 'North Stars', label: 'Product Suite', type: 'object', description: 'Per-layer product suite from creator matching (attraction/core/continuity)' },
  { key: 'identity.rule_break', section: 'Remarkable Angle', label: 'Rule Break', type: 'string', description: 'The industry rule they break (current → mine)' },
  { key: 'identity.unexpected_combo', section: 'Remarkable Angle', label: 'Unexpected Combo', type: 'string', description: 'Their unique combination of skills/domains' },
  { key: 'identity.extreme_action', section: 'Remarkable Angle', label: 'Extreme Action', type: 'string', description: 'Bold action plan from Remarkable Flow' },
  { key: 'identity.ai_rule_statement', section: 'Remarkable Angle', label: 'Rule Statement', type: 'string', description: 'AI-generated rule break statement' },
  { key: 'identity.ai_tribe_statement', section: 'Remarkable Angle', label: 'Tribe Statement', type: 'string', description: 'AI-generated tribe/audience statement' },
]

// ─── Offer (~20 fields) ─────────────────────────────────────────────────────
// What you sell and how. Auto-populated from Pay Rent, Scale Income,
// Offer flows, PTUF calculator, creator assessments.

const OFFER_FIELDS = [
  { key: 'offer.pay_rent_model', section: 'Pay Rent', label: 'Pay Rent Model', type: 'enum', enumValues: ['day_job_side_project', 'one_on_one_service', 'free_events_paid_elsewhere', 'small_group_paid', 'institutional_salary'], description: 'How they currently pay rent while building' },
  { key: 'offer.attraction_product', section: 'Product Suite', label: 'Attraction Product', type: 'string', description: 'Free/low-cost entry product' },
  { key: 'offer.attraction_status', section: 'Product Suite', label: 'Attraction Status', type: 'enum', enumValues: ['have', 'inconsistent', 'missing'], description: 'Whether attraction product is live' },
  { key: 'offer.core_product', section: 'Product Suite', label: 'Core Product', type: 'string', description: 'Main paid offering' },
  { key: 'offer.core_status', section: 'Product Suite', label: 'Core Status', type: 'enum', enumValues: ['have', 'inconsistent', 'missing'], description: 'Whether core product is live' },
  { key: 'offer.continuity_product', section: 'Product Suite', label: 'Continuity Product', type: 'string', description: 'Recurring/retention offering' },
  { key: 'offer.continuity_status', section: 'Product Suite', label: 'Continuity Status', type: 'enum', enumValues: ['have', 'inconsistent', 'missing'], description: 'Whether continuity product is live' },
  { key: 'offer.core_price', section: 'Pricing', label: 'Core Price', type: 'number', description: 'Price of main offering' },
  { key: 'offer.continuity_price', section: 'Pricing', label: 'Continuity Price', type: 'number', description: 'Monthly recurring price' },
  { key: 'offer.income_target', section: 'Pricing', label: 'Monthly Income Target', type: 'number', description: 'Target monthly revenue from PTUF' },
  { key: 'offer.clients_needed', section: 'Pricing', label: 'Clients Needed', type: 'number', description: 'Clients/month needed to hit target (PTUF output)' },
  { key: 'offer.experience_types', section: 'Experiences', label: 'Experience Types', type: 'array', description: 'Types of experiences they run (workshop, retreat, cohort, etc.)' },
  { key: 'offer.average_price', section: 'Experiences', label: 'Average Event Price', type: 'number', description: 'Average ticket price across experiences' },
  { key: 'offer.average_capacity', section: 'Experiences', label: 'Average Capacity', type: 'number', description: 'Typical max attendees per event' },
  { key: 'offer.modality', section: 'Experiences', label: 'Modality', type: 'string', description: 'Primary modality (breathwork, movement, facilitation, sound, etc.)' },
  { key: 'offer.delivery_format', section: 'Experiences', label: 'Delivery Format', type: 'enum', enumValues: ['in_person', 'online', 'hybrid'], description: 'How experiences are delivered' },
  { key: 'offer.location', section: 'Experiences', label: 'Location', type: 'string', description: 'Where they run events (city/region)' },
  { key: 'offer.dream_outcome', section: 'Dream Outcome', label: 'Dream Outcome', type: 'string', description: 'What transformation attendees get' },
  { key: 'offer.guarantee', section: 'Risk Reversal', label: 'Guarantee', type: 'string', description: 'Risk reversal or guarantee offered' },
  { key: 'offer.proof_stack', section: 'Proof', label: 'Proof Stack', type: 'array', description: 'Testimonials, case studies, credentials' },
]

// ─── Audience (~15 fields) ───────────────────────────────────────────────────
// Who you serve. Auto-populated from CRM contacts, experience attendees,
// sales pipeline, contact activity.

const AUDIENCE_FIELDS = [
  { key: 'audience.total_contacts', section: 'Overview', label: 'Total Contacts', type: 'number', description: 'Total contacts in CRM' },
  { key: 'audience.leads_count', section: 'Overview', label: 'Leads', type: 'number', description: 'Contacts at Lead lifecycle stage' },
  { key: 'audience.customers_count', section: 'Overview', label: 'Customers', type: 'number', description: 'Contacts at Customer lifecycle stage' },
  { key: 'audience.evangelists_count', section: 'Overview', label: 'Evangelists', type: 'number', description: 'Contacts at Evangelist lifecycle stage' },
  { key: 'audience.top_fans', section: 'Top Fans', label: 'Top Fans', type: 'array', description: 'Repeat attendees (name + event count)' },
  { key: 'audience.repeat_rate', section: 'Engagement', label: 'Repeat Rate', type: 'number', description: 'Percentage of attendees who come to 2+ events' },
  { key: 'audience.average_attendees', section: 'Engagement', label: 'Average Attendees', type: 'number', description: 'Average attendees per experience' },
  { key: 'audience.total_attendees', section: 'Engagement', label: 'Total Unique Attendees', type: 'number', description: 'All-time unique attendees across events' },
  { key: 'audience.contact_sources', section: 'Sources', label: 'Contact Sources', type: 'object', description: 'Breakdown of where contacts come from' },
  { key: 'audience.icp_description', section: 'ICP', label: 'Ideal Customer', type: 'string', description: 'Description of ideal customer profile' },
  { key: 'audience.icp_demographics', section: 'ICP', label: 'Demographics', type: 'string', description: 'Age, gender, location, occupation patterns' },
  { key: 'audience.icp_psychographics', section: 'ICP', label: 'Psychographics', type: 'string', description: 'Values, beliefs, lifestyle, pain points' },
  { key: 'audience.warm_leads_count', section: 'Pipeline', label: 'Warm Leads', type: 'number', description: 'Active leads needing follow-up' },
  { key: 'audience.pipeline_value', section: 'Pipeline', label: 'Pipeline Value', type: 'number', description: 'Total value of open deals' },
  { key: 'audience.conversion_rate', section: 'Pipeline', label: 'Lead-to-Customer Rate', type: 'number', description: 'Percentage of leads that become customers' },
]

// ─── Voice (~15 fields) ──────────────────────────────────────────────────────
// How you communicate. Auto-populated from voice_profiles table,
// content performance patterns.

const VOICE_FIELDS = [
  { key: 'voice.tone_formality', section: 'Tone', label: 'Formality', type: 'string', description: 'Casual to formal spectrum' },
  { key: 'voice.tone_humor', section: 'Tone', label: 'Humor', type: 'string', description: 'Humor style and frequency' },
  { key: 'voice.tone_vulnerability', section: 'Tone', label: 'Vulnerability', type: 'string', description: 'Level of personal sharing' },
  { key: 'voice.tone_energy', section: 'Tone', label: 'Energy', type: 'string', description: 'Calm to high-energy spectrum' },
  { key: 'voice.pov', section: 'Style', label: 'Point of View', type: 'string', description: 'First/second/third person preference' },
  { key: 'voice.sentence_rhythm', section: 'Style', label: 'Sentence Rhythm', type: 'string', description: 'Short punchy vs flowing vs mixed' },
  { key: 'voice.emoji_usage', section: 'Style', label: 'Emoji Usage', type: 'string', description: 'Heavy, moderate, minimal, none' },
  { key: 'voice.words_to_avoid', section: 'Style', label: 'Words to Avoid', type: 'array', description: 'Words/phrases that feel off-brand' },
  { key: 'voice.preferred_length', section: 'Style', label: 'Preferred Length', type: 'string', description: 'Short-form vs long-form preference' },
  { key: 'voice.catchphrases', section: 'Signature', label: 'Catchphrases', type: 'array', description: 'Recurring phrases or concepts' },
  { key: 'voice.origin_story_hook', section: 'Signature', label: 'Origin Story Hook', type: 'string', description: 'One-line version of their origin story' },
  { key: 'voice.brand_colors', section: 'Brand', label: 'Brand Colors', type: 'string', description: 'Primary brand colors' },
  { key: 'voice.top_content_types', section: 'Performance', label: 'Top Content Types', type: 'array', description: 'Content types that get best engagement' },
  { key: 'voice.best_platform', section: 'Performance', label: 'Best Platform', type: 'string', description: 'Platform with highest engagement' },
  { key: 'voice.posting_frequency', section: 'Performance', label: 'Posting Frequency', type: 'string', description: 'How often they post content' },
]

// ─── Inner Game (~15 fields) ─────────────────────────────────────────────────
// THE DIFFERENTIATOR. No other platform captures this.
// Auto-populated from Nervous System, Wound Map, Healing Compass,
// Play Profile, daily check-ins, journey progression.

const INNER_GAME_FIELDS = [
  { key: 'inner_game.ns_archetype', section: 'Nervous System', label: 'NS Archetype', type: 'string', description: 'Nervous system archetype from assessment' },
  { key: 'inner_game.visibility_ceiling', section: 'Nervous System', label: 'Visibility Ceiling', type: 'string', description: 'Where nervous system caps their visibility' },
  { key: 'inner_game.income_ceiling', section: 'Nervous System', label: 'Income Ceiling', type: 'string', description: 'Where nervous system caps their income' },
  { key: 'inner_game.wound_theme', section: 'Wound Map', label: 'Wound Theme', type: 'string', description: 'Core wound/origin story theme' },
  { key: 'inner_game.wound_completed', section: 'Wound Map', label: 'Wound Map Done', type: 'boolean', description: 'Whether wound map has been completed' },
  { key: 'inner_game.limiting_beliefs', section: 'Limiting Beliefs', label: 'Active Limiting Beliefs', type: 'array', description: 'Beliefs currently blocking growth' },
  { key: 'inner_game.belief_rewire_done', section: 'Limiting Beliefs', label: 'Belief Rewire Done', type: 'boolean', description: 'Whether limiting belief rewire has been completed' },
  { key: 'inner_game.dna_code', section: 'Play Profile', label: 'DNA Code', type: 'string', description: 'Founder DNA code from quiz' },
  { key: 'inner_game.matched_creator', section: 'Play Profile', label: 'Matched Creator', type: 'string', description: 'Which creator they work like' },
  { key: 'inner_game.work_rhythm', section: 'Play Profile', label: 'Work Rhythm', type: 'string', description: 'Marathon vs Sprints preference' },
  { key: 'inner_game.fuel_type', section: 'Play Profile', label: 'Fuel Type', type: 'string', description: 'Fire vs Purpose motivation style' },
  { key: 'inner_game.capacity_score', section: 'Daily State', label: 'Capacity Score', type: 'number', description: 'Current capacity score (0-100)' },
  { key: 'inner_game.current_state', section: 'Daily State', label: 'Current State', type: 'enum', enumValues: ['vibe_rise', 'ventral', 'sympathetic', 'dorsal'], description: 'Latest daily check-in state' },
  { key: 'inner_game.journey_level', section: 'Journey', label: 'Journey Level', type: 'number', description: 'Current journey level (0-8)' },
  { key: 'inner_game.state_trend', section: 'Daily State', label: 'State Trend', type: 'string', description: 'Trend from recent check-ins (improving/stable/declining)' },
]

// ─── Performance (~10 fields) ────────────────────────────────────────────────
// How you're doing. Auto-populated from experience completions,
// content history, funnel metrics, CRM analytics.

const PERFORMANCE_FIELDS = [
  { key: 'performance.experiences_run', section: 'Experiences', label: 'Experiences Run', type: 'number', description: 'Total completed experiences' },
  { key: 'performance.average_fill_rate', section: 'Experiences', label: 'Average Fill Rate', type: 'number', description: 'Average percentage of capacity filled' },
  { key: 'performance.total_revenue', section: 'Revenue', label: 'Total Revenue', type: 'number', description: 'All-time revenue (if tracked)' },
  { key: 'performance.monthly_revenue', section: 'Revenue', label: 'Monthly Revenue', type: 'number', description: 'Current month revenue' },
  { key: 'performance.three_percent_chain', section: 'Improvements', label: '3% Chain', type: 'array', description: 'Recent 3% improvement notes from completed experiences' },
  { key: 'performance.content_volume', section: 'Content', label: 'Content Volume', type: 'number', description: 'Total pieces of content created' },
  { key: 'performance.top_content', section: 'Content', label: 'Top Content', type: 'array', description: 'Best performing content pieces' },
  { key: 'performance.streak_days', section: 'Engagement', label: 'Current Streak', type: 'number', description: 'Current daily streak (Vibe Rise challenge)' },
  { key: 'performance.rise_points', section: 'Engagement', label: 'Rise Points', type: 'number', description: 'Total RP earned' },
  { key: 'performance.weeks_active', section: 'Engagement', label: 'Weeks Active', type: 'number', description: 'Number of weeks with activity on the platform' },
]

// ─── Exports ─────────────────────────────────────────────────────────────────

export const CANONICAL_FIELDS = [
  ...IDENTITY_FIELDS,
  ...OFFER_FIELDS,
  ...AUDIENCE_FIELDS,
  ...VOICE_FIELDS,
  ...INNER_GAME_FIELDS,
  ...PERFORMANCE_FIELDS,
]

export const DOMAINS = ['identity', 'offer', 'audience', 'voice', 'inner_game', 'performance']

export const DOMAIN_LABELS = {
  identity: 'Identity',
  offer: 'Offer',
  audience: 'Audience',
  voice: 'Voice',
  inner_game: 'Inner Game',
  performance: 'Performance',
}

/** Group fields by domain */
export function groupFieldsByDomain() {
  const grouped = {}
  for (const domain of DOMAINS) {
    grouped[domain] = CANONICAL_FIELDS.filter(f => f.key.startsWith(domain + '.'))
  }
  return grouped
}

/** Lookup a single field by key */
export function getCanonicalField(key) {
  return CANONICAL_FIELDS.find(f => f.key === key) || null
}

/** Get all fields for a domain */
export function getFieldsForDomain(domain) {
  return CANONICAL_FIELDS.filter(f => f.key.startsWith(domain + '.'))
}

/** Get unique sections within a domain */
export function getSectionsForDomain(domain) {
  const fields = getFieldsForDomain(domain)
  return [...new Set(fields.map(f => f.section))]
}
