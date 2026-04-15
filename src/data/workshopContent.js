/**
 * Workshop Content — Single source of truth
 *
 * Used by HealingCompassLanding.jsx (frontend) and referenced by
 * send-workshop-profile Edge Function (email template).
 * If you update content here, update the Edge Function copy too.
 */

export const EMOTIONAL_NEEDS = [
  {
    key: 'life-design',
    name: 'Life Design',
    subtitle: 'Autonomy',
    group: 'Survive',
    description: "I need to feel like I have choices and control over my own path."
  },
  {
    key: 'connection',
    name: 'Connection',
    subtitle: 'Relatedness',
    group: 'Survive',
    description: "I need to feel seen, loved, and like I belong."
  },
  {
    key: 'mastery',
    name: 'Mastery',
    subtitle: 'Competence',
    group: 'Thrive',
    description: "I need to feel like I'm growing, learning, and getting better."
  },
  {
    key: 'meaning',
    name: 'Meaning',
    subtitle: 'Purpose',
    group: 'Thrive',
    description: "I need to feel like my life matters and I'm contributing to something bigger."
  },
]

export const PROTECTIVE_PATTERNS = [
  {
    key: 'controller',
    name: 'The Controller',
    description: "Manages everything. Controls outcomes and image. Leaving it to chance isn't an option."
  },
  {
    key: 'ghost',
    name: 'The Ghost',
    description: "Withdraws. Disappears. Doesn't feel comfortable sharing."
  },
  {
    key: 'perfectionist',
    name: 'The Perfectionist',
    description: "Gas and brake at the same time. Not ready yet. Delays and overthinks."
  },
  {
    key: 'auto-pilot',
    name: 'The Auto-Pilot',
    description: "Goes through the motions. Checked out. Fine, just tired."
  },
  {
    key: 'people-pleaser',
    name: 'The People Pleaser',
    description: "Says yes to everything. As long as everyone's happy, they're safe."
  },
]

export const FOUR_RS = [
  {
    key: 'recognise',
    name: 'Recognise',
    description: "Notice the pattern. Name the protective voice. See when it activates."
  },
  {
    key: 'release',
    name: 'Release',
    description: "Let the body process. Breathwork, shaking, somatic release."
  },
  {
    key: 'rewire',
    name: 'Rewire',
    description: "Create the new story. Reframe the belief. Build the new neural pathway."
  },
  {
    key: 'reconnect',
    name: 'Reconnect',
    description: "Return to the younger self. Give them what they needed. Integration."
  },
]

// The 8 archetypes shown in the Healing Compass workshop
// (essenceProfiles.js has 12 total — filter to these 8)
export const WORKSHOP_ARCHETYPE_NAMES = [
  'Compassionate Leader',
  'Truth-Teller',
  'Radiant Rebel',
  'Playful Creator',
  'Sacred Jester',
  'Wild Alchemist',
  'Heart Holder',
  'Cosmic Connector',
]
