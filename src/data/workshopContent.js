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
    key: 'ghost',
    name: 'The Ghost',
    description: "Disappears. Withdraws. Becomes invisible to avoid being hurt."
  },
  {
    key: 'controller',
    name: 'The Controller',
    description: "Takes charge of everything. If I control it, it can't hurt me."
  },
  {
    key: 'performer',
    name: 'The Performer',
    description: "Becomes whoever you need me to be. Earns love through achievement."
  },
  {
    key: 'perfectionist',
    name: 'The Perfectionist',
    description: "If I'm perfect, I can't be criticised. Delays and overthinks."
  },
  {
    key: 'people-pleaser',
    name: 'The People Pleaser',
    description: "Says yes to everything. Puts everyone else first to stay safe."
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
