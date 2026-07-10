/**
 * pipelineConfig.js — Shared pipeline node configuration
 *
 * Module definitions, tool definitions, and checklist section mappings
 * used by both PipelineNodeDetail (legacy accordion) and NodeWorkspace (full page).
 */

// Module definitions per node
// certification: true = hidden in v1, shown in certification tier
export const NODE_MODULES = {
  attract: [
    { key: 'attraction_offer', name: 'Attraction Stack', icon: '🎁', desc: 'Choose your attraction strategies', route: '/create/attraction-stack' },
    { key: 'leads_strategy', name: 'Leads Strategy', icon: '📢', desc: 'Define where your audience hangs out', route: '/leads-strategy' },
    { key: 'blow_up_brand', name: 'Blow Up Your Brand', icon: '🔥', desc: 'Find your remarkable angle', route: '/create/remarkable' },
    { key: 'validation', name: 'Validation', icon: '🔍', desc: 'Deep audience research', route: '/validation-flows', multi: 'Capture, Convert', certification: true },
  ],
  capture: [
    { key: 'funnel_builder', name: 'Funnel Builder', icon: '🗺️', desc: 'Deep funnel mapping', route: '/funnel-builder', certification: true },
  ],
  convert: [
    { key: 'launch_readiness', name: 'Launch Readiness', icon: '🚀', desc: 'Pre-launch checklist', route: '/launch-readiness' },
    { key: 'grand_slam', name: 'Grand Slam Offer', icon: '🎯', desc: 'Bonuses + guarantee + scarcity', route: '/offer-builder', certification: true },
    { key: 'offer_builder', name: '100M Offer Builder', icon: '💰', desc: 'Dream outcome, price, proof', route: '/offer-builder', certification: true },
    { key: 'product_selection', name: 'Product Selection', icon: '📦', desc: 'Build a full product suite', route: '/product-selection', certification: true },
  ],
  deliver: [
    { key: 'journey_designer', name: 'Journey Designer', icon: '🎨', desc: 'Runsheet builder for this event', route: '/create' },
    { key: 'testing', name: 'Testing', icon: '🔬', desc: 'Test with real users', route: '/testing-explainer', multi: 'Convert', certification: true },
  ],
  grow: [
    { key: 'scale_income', name: 'Scale Income', icon: '📈', desc: 'See your 3-layer offer stack', route: '/create/scale-income' },
    { key: 'upsell', name: 'Upsell Offer', icon: '⬆️', desc: 'Design your upsell', route: '/upsell-offer', certification: true },
    { key: 'downsell', name: 'Downsell Offer', icon: '⬇️', desc: 'Design your downsell', route: '/downsell-offer', certification: true },
    { key: 'continuity', name: 'Continuity Offer', icon: '🔁', desc: 'Design recurring offer', route: '/continuity-offer', certification: true },
  ],
}

// Tool definitions per node
export const NODE_TOOLS = {
  attract: [
    { name: 'Event Page Copy', icon: '📝', desc: 'Listing copy in 3 lengths for your booking page', soon: true },
    { name: 'Content Generator', icon: '✨', desc: 'AI posts for this event', soon: true },
    { name: 'Content Planning', icon: '📋', desc: 'Weekly calendar', soon: true },
    { name: 'Warm Outreach', icon: '☀️', desc: 'DM contacts about this event', soon: true },
  ],
  capture: [
    { name: 'Landing Page', icon: '🌐', desc: 'Build/update capture page', soon: true },
    { name: 'Email Sequence', icon: '✉️', desc: 'Welcome nurture after signup', soon: true },
  ],
  convert: [
    { name: 'Sales Pipeline', icon: '💼', desc: 'Track bookings', soon: true },
    { name: 'Sales Script', icon: '📝', desc: 'Close conversations', soon: true },
  ],
  deliver: [
    { name: 'Experience Checklist', icon: '✅', desc: 'Organisation items', route: null },
  ],
  grow: [
    { name: 'Follow-Up Checklist', icon: '📋', desc: 'Thank you, feedback, testimonials', route: null, afterEvent: true },
    { name: '3% Chain', icon: '🔄', desc: 'What\'s the one improvement?', route: '/create', afterEvent: true },
    { name: 'Funnel Calculator', icon: '📊', desc: 'Track conversion rates', route: '/funnel-calculator', afterEvent: true },
    { name: 'Analytics', icon: '📈', desc: 'Weekly grade + performance', soon: true, afterEvent: true },
  ],
}

// Which checklist section each node owns
export const NODE_CHECKLIST = {
  attract: 'marketing',
  deliver: 'organisation',
  grow: 'followup',
}

// Node labels and icons for display
export const NODE_META = {
  attract: { label: 'Attract', icon: '📣', sublabel: 'reach' },
  capture: { label: 'Capture', icon: '🔗', sublabel: 'signups' },
  convert: { label: 'Convert', icon: '💰', sublabel: 'revenue' },
  deliver: { label: 'Deliver', icon: '🎪', sublabel: 'showed up' },
  grow: { label: 'Grow', icon: '🌱', sublabel: 'follow-up' },
}
