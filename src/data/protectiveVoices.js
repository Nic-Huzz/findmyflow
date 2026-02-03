/**
 * Protective Voices Data
 *
 * The five internal characters that once protected us but now block our access to play.
 * These are NOT villains to destroy - they're parts of us that developed to keep us safe
 * in environments that weren't safe for our authentic self.
 */

export const PROTECTIVE_VOICES = {
  perfectionist: {
    id: 'perfectionist',
    name: 'The Perfectionist',
    icon: '🎭',
    lie: "You're not ready yet.",
    origin: 'Developed when mistakes led to shame or punishment',
    howItProtects: 'By preventing you from shipping, it prevents you from failing publicly',
    kryptonite: 'Shipping something imperfect. "Done beats perfect."',
    signs: [
      'Endless preparation',
      'Moving goalposts',
      'Inability to launch',
      'One more revision syndrome'
    ],
    playBlocker: 'Stops you from playing until everything is "perfect"',
    affirmation: 'Thank you for protecting me from shame. I can handle imperfection now.'
  },

  'people-pleaser': {
    id: 'people-pleaser',
    name: 'The People Pleaser',
    icon: '🪞',
    lie: "They won't like the real you.",
    origin: 'Developed when authenticity led to rejection or judgment',
    howItProtects: 'By making you agreeable, it prevents conflict and rejection',
    kryptonite: 'Showing up as yourself, setting boundaries, saying no',
    signs: [
      'Chronic agreement',
      'Inability to state opinions',
      'Fear of disappointing others',
      'Changing yourself to fit in'
    ],
    playBlocker: 'Stops you from playing YOUR way - always adapting to others',
    affirmation: 'Thank you for protecting me from rejection. I can be myself now.'
  },

  controller: {
    id: 'controller',
    name: 'The Controller',
    icon: '🎮',
    lie: "If you can't control the outcome, don't try.",
    origin: 'Developed when chaos or loss created a need for safety',
    howItProtects: 'By avoiding uncertainty, it prevents unexpected pain',
    kryptonite: 'Taking action without guaranteed results. Surrendering to flow.',
    signs: [
      'Over-planning',
      'Analysis paralysis',
      'Refusing to start without certainty',
      'Needing to know the full path before stepping'
    ],
    playBlocker: 'Stops you from playing because play is inherently uncertain',
    affirmation: 'Thank you for protecting me from chaos. I can handle uncertainty now.'
  },

  performer: {
    id: 'performer',
    name: 'The Performer',
    icon: '🏃',
    lie: "Do more. Be more. Then you'll finally be enough.",
    origin: 'Developed when worth was tied to output and achievement',
    howItProtects: 'By keeping you busy, it prevents the emptiness of "not enough"',
    kryptonite: 'Resting without guilt. Recognizing you\'re already enough.',
    signs: [
      'Burnout cycles',
      'Inability to celebrate wins',
      'Always raising the bar',
      'Rest feels like laziness'
    ],
    playBlocker: 'Turns play into another achievement to unlock, not joy to experience',
    affirmation: 'Thank you for protecting me from worthlessness. I am enough now.'
  },

  ghost: {
    id: 'ghost',
    name: 'The Ghost',
    icon: '👻',
    lie: "Visibility is dangerous. Stay small. Don't attract attention.",
    origin: 'Developed when being seen led to pain, criticism, or danger',
    howItProtects: 'By keeping you hidden, it prevents judgment and attack',
    kryptonite: 'Being seen anyway. Posting, publishing, presenting.',
    signs: [
      'Hiding your work',
      'Avoiding promotion',
      'Discomfort with any spotlight',
      'Staying in the shadows'
    ],
    playBlocker: 'Stops you from playing publicly - play must stay private/hidden',
    affirmation: 'Thank you for protecting me from danger. Being seen is safe now.'
  }
}

/**
 * Get voice by ID
 */
export const getVoice = (voiceId) => PROTECTIVE_VOICES[voiceId] || null

/**
 * Get all voices as array
 */
export const getAllVoices = () => Object.values(PROTECTIVE_VOICES)

/**
 * Get voice options for selection UI
 */
export const getVoiceOptions = () =>
  Object.values(PROTECTIVE_VOICES).map(voice => ({
    id: voice.id,
    name: voice.name,
    icon: voice.icon,
    lie: voice.lie
  }))

/**
 * Get a random voice insight/tip based on the voice
 */
export const getVoiceInsight = (voiceId) => {
  const voice = PROTECTIVE_VOICES[voiceId]
  if (!voice) return null

  const insights = [
    `${voice.name} is active when you hear: "${voice.lie}"`,
    `${voice.name} developed to protect you. Now it's time to show it you're safe.`,
    `Kryptonite for ${voice.name}: ${voice.kryptonite}`,
    voice.affirmation
  ]

  return insights[Math.floor(Math.random() * insights.length)]
}

/**
 * Check if a Play-List item targets a specific voice
 * (for XP multipliers in future phases)
 */
export const getVoiceMultiplier = (voiceId, userPrimaryVoice) => {
  if (voiceId === userPrimaryVoice) return 1.5  // Primary voice = 1.5x
  if (voiceId) return 1.25  // Any voice = 1.25x
  return 1.0  // No voice targeted = base XP
}

export default PROTECTIVE_VOICES
