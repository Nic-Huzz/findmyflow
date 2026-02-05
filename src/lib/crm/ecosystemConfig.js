/**
 * Ecosystem Config - Business Flywheel System
 * Defines the 4 phases and their checklist items
 */

export const ECOSYSTEM_PHASES = [
  {
    id: 'foundation',
    name: 'Foundation',
    icon: '🏗️',
    description: 'Know who you help, what you offer, and why it matters.',
    items: [
      { id: 'flow-finder', label: 'Complete Flow Finder', link: '/nikigai/skills', auto: true },
      { id: 'persona', label: 'Define Your Ideal Customer', link: '/nikigai/persona', auto: true },
      { id: 'core-offer', label: 'Build Your Core Offer', link: '/offer-builder', auto: true },
      { id: 'offer-stack', label: 'Package Your Offer Stack', link: '/offer-stack-builder', auto: true },
      { id: 'lead-magnet', label: 'Choose Your Lead Magnet', link: '/lead-magnet-selection', auto: true },
    ],
  },
  {
    id: 'attract',
    name: 'Attract',
    icon: '🧲',
    description: 'Create content that brings the right people to you.',
    items: [
      { id: 'content-plan', label: 'Create a Content Plan', link: '/crm/marketing' },
      { id: 'landing-page', label: 'Build a Landing Page', link: '/crm/pages' },
      { id: 'first-posts', label: 'Publish Your First 3 Posts', link: '/crm/content-create' },
      { id: 'warm-outreach', label: 'Start Warm Outreach', link: '/crm/warm-outreach' },
    ],
  },
  {
    id: 'nurture',
    name: 'Nurture',
    icon: '💜',
    description: 'Build trust and move leads toward a buying decision.',
    items: [
      { id: 'contacts-list', label: 'Add Your First Contacts', link: '/crm/contacts' },
      { id: 'email-sequence', label: 'Create a Welcome Sequence', link: '/crm/email-sequences' },
      { id: 'sales-pipeline', label: 'Set Up Your Sales Pipeline', link: '/crm/sales' },
      { id: 'sales-script', label: 'Save a Sales Script', link: '/crm/scripts' },
    ],
  },
  {
    id: 'optimise',
    name: 'Optimise',
    icon: '📈',
    description: 'Track what works, refine what doesn\'t, and scale.',
    items: [
      { id: 'funnel-calculator', label: 'Set Up Funnel Tracking', link: '/funnel-calculator' },
      { id: 'weekly-planning', label: 'Complete Weekly Planning', link: '/weekly-planning' },
      { id: 'analytics-check', label: 'Review Your First Report', link: '/crm/reports' },
      { id: 'grand-slam', label: 'Run Grand Slam Evaluation', link: '/grand-slam-matrix', auto: true },
      { id: 'voice-training', label: 'Train Your Brand Voice', link: '/voice-training' },
      { id: 'implementations', label: 'Track an Implementation', link: '/crm/implementations' },
    ],
  },
]

/**
 * Maps source tables to auto-detected phase/systemId pairs.
 * Each entry: { table, countColumn, filter?, phase, systemId }
 */
export const AUTO_CHECK_MAP = [
  { table: 'nikigai_clusters', phase: 'foundation', systemId: 'flow-finder' },
  { table: 'persona_profiles', phase: 'foundation', systemId: 'persona' },
  { table: 'offer_builder_assessments', phase: 'foundation', systemId: 'core-offer' },
  { table: 'grand_slam_offers', phase: 'foundation', systemId: 'offer-stack' },
  { table: 'lead_magnet_assessments', phase: 'foundation', systemId: 'lead-magnet' },
  { table: 'grand_slam_offers', phase: 'optimise', systemId: 'grand-slam' },
]

/**
 * Get items for a specific phase
 */
export function getPhaseItems(phaseId) {
  const phase = ECOSYSTEM_PHASES.find(p => p.id === phaseId)
  return phase?.items || []
}

/**
 * Get total item count across all phases
 */
export function getTotalItemCount() {
  return ECOSYSTEM_PHASES.reduce((sum, phase) => sum + phase.items.length, 0)
}
