/**
 * Protective Voices Data
 *
 * Four internal characters mapped to a 2x2 behavioural response grid
 * (Toward/Away x Sympathetic/Dorsal), plus People Pleaser.
 *
 * These are NOT villains to destroy - they're parts of us that developed
 * to keep us safe in environments that weren't safe for our authentic self.
 *
 * |              | Sympathetic (energised) | Dorsal (shutdown)       |
 * |--------------|-------------------------|-------------------------|
 * | Toward       | Controller (fight)      | Perfectionist (freeze)  |
 * | Away         | Ghost (flight)          | Auto-Pilot (collapse)   |
 *
 * + People Pleaser (fawn) — present alongside any of the four.
 */

export const PROTECTIVE_VOICES = {
  controller: {
    id: 'controller',
    name: 'The Controller',
    icon: '🎮',
    lie: "Leaving it to chance isn't an option.",
    origin: 'Developed when chaos, loss, or conditional approval created a need for safety through control and performance',
    howItProtects: 'By managing every outcome and controlling how others see you, it prevents unexpected pain and rejection',
    kryptonite: 'Letting go. Resting without guilt. Trusting others to handle it.',
    signs: [
      'Over-planning and micro-managing',
      'Inability to delegate or trust',
      'Always being "on" — performing, impressing',
      'Rest feels like laziness',
      'Worth tied to output and image'
    ],
    playBlocker: 'Turns play into another thing to control or achieve, never joy to experience',
    affirmation: 'Thank you for protecting me from chaos and rejection. I can handle uncertainty now.'
  },

  ghost: {
    id: 'ghost',
    name: 'The Ghost',
    icon: '👻',
    lie: "I don't feel comfortable sharing.",
    origin: 'Developed when being seen led to pain, criticism, or overwhelm',
    howItProtects: 'By withdrawing and staying hidden, it prevents judgment and emotional intensity',
    kryptonite: 'Being seen anyway. Sharing before you feel ready. Staying in the room.',
    signs: [
      'Hiding your work',
      'Avoiding promotion or visibility',
      'Leaving situations before they get intense',
      'Discomfort with any spotlight'
    ],
    playBlocker: 'Stops you from playing publicly — play must stay private or hidden',
    affirmation: 'Thank you for protecting me from danger. Being seen is safe now.'
  },

  perfectionist: {
    id: 'perfectionist',
    name: 'The Perfectionist',
    icon: '🎭',
    lie: "I'm not ready yet.",
    origin: 'Developed when mistakes led to shame, criticism, or punishment',
    howItProtects: 'By preventing you from shipping, it prevents you from failing publicly',
    kryptonite: 'Shipping something imperfect. "Done beats perfect."',
    signs: [
      'Endless preparation',
      'Moving goalposts',
      'Inability to launch',
      'One more revision syndrome'
    ],
    playBlocker: 'Stops you from playing until everything is "perfect" — gas and brake at the same time',
    affirmation: 'Thank you for protecting me from shame. I can handle imperfection now.'
  },

  'auto-pilot': {
    id: 'auto-pilot',
    name: 'The Auto-Pilot',
    icon: '🛋️',
    lie: "I'm fine, just tired.",
    origin: 'Developed when sustained overwhelm made checking out the only way to survive',
    howItProtects: 'By going through the motions, it prevents you from feeling the weight of what you are avoiding',
    kryptonite: 'Asking yourself "What do I actually want?" and sitting with the answer.',
    signs: [
      'Going through the motions',
      'Scrolling, numbing, zoning out',
      'Saying "I\'m fine" on autopilot',
      'No strong feelings about anything'
    ],
    playBlocker: 'Play requires presence — Auto-Pilot keeps you checked out',
    affirmation: 'Thank you for protecting me from overwhelm. I can feel things now.'
  },

  'people-pleaser': {
    id: 'people-pleaser',
    name: 'The People Pleaser',
    icon: '🪞',
    lie: "As long as everyone's happy, I'm safe.",
    origin: 'Developed when authenticity led to rejection or judgment',
    howItProtects: 'By making you agreeable, it prevents conflict and rejection',
    kryptonite: 'Showing up as yourself, setting boundaries, saying no',
    signs: [
      'Chronic agreement',
      'Inability to state opinions',
      'Fear of disappointing others',
      'Changing yourself to fit in'
    ],
    playBlocker: 'Stops you from playing YOUR way — always adapting to others',
    affirmation: 'Thank you for protecting me from rejection. I can be myself now.'
  }
}

/**
 * Legacy alias — maps old 'performer' key to 'controller'
 */
export const resolveVoiceId = (id) => {
  if (id === 'performer') return 'controller'
  if (id === 'auto_pilot') return 'auto-pilot'
  if (id === 'people_pleaser') return 'people-pleaser'
  return id
}

/**
 * Get voice by ID (with legacy compat)
 */
export const getVoice = (voiceId) => PROTECTIVE_VOICES[resolveVoiceId(voiceId)] || null

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
  const voice = getVoice(voiceId)
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
