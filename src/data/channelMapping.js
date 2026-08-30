/**
 * Four Channels of Aliveness
 *
 * The channel isn't in the experience. It's in the context.
 * Any experience can feed any channel depending on HOW you engage with it.
 *
 * Four universal context modifiers turn any experience into a channel-feeder.
 * The pipeline: Aliveness Quiz (identify starved channels) → Experience Game
 * (find vibe rise nodes) → analyze which channels are missing from those
 * nodes → recommend context shifts.
 */

// ── The Four Channels ──
export const CHANNELS = {
  choice:     { name: 'Choice',     emoji: '🔓', category: 'Survive', color: '#60a5fa' },
  connection: { name: 'Connection', emoji: '🤝', category: 'Survive', color: '#f472b6' },
  mastery:    { name: 'Mastery',    emoji: '📈', category: 'Thrive',  color: '#34d399' },
  meaning:    { name: 'Meaning',    emoji: '✨', category: 'Thrive',  color: '#fbbf24' },
}

// ── Universal Context Modifiers ──
// These work for ANY experience. The question isn't "what channel does this
// experience feed?" but "what needs to be true for this experience to feed
// this channel?"
export const CONTEXT_MODIFIERS = {
  choice: {
    name: 'Choice',
    question: 'What needs to be true for this to feed Choice?',
    answer: 'You chose this freely. No obligation, no "should." You could stop anytime. There are options within it.',
    prompts: [
      'Do it because you want to, not because you should',
      'Give yourself options within the experience',
      'Remove any sense of obligation from it',
      'Make it something you could walk away from at any time',
    ],
  },
  connection: {
    name: 'Connection',
    question: 'What needs to be true for this to feed Connection?',
    answer: 'Someone is with you. You feel seen. The experience is shared, not solo. You could be vulnerable here.',
    prompts: [
      'Do it with someone who matters to you',
      'Share what you felt during it with another person',
      'Let yourself be witnessed while doing it',
      'Create space for others to join you in it',
    ],
  },
  mastery: {
    name: 'Mastery',
    question: 'What needs to be true for this to feed Mastery?',
    answer: 'You are growing. There is a challenge at your edge. You can feel yourself getting better. It stretches you.',
    prompts: [
      'Track your progress, even loosely',
      'Set a challenge that is slightly beyond your current level',
      'Notice what you are learning while doing it',
      'Push your edge, then notice the improvement',
    ],
  },
  meaning: {
    name: 'Meaning',
    question: 'What needs to be true for this to feed Meaning?',
    answer: 'It serves something beyond you. Someone benefits. It connects to a larger purpose. It would matter if you stopped.',
    prompts: [
      'Do it for someone else, not just yourself',
      'Connect it to something you care about deeply',
      'Ask: who benefits from me doing this?',
      'Make it part of a larger story you are living',
    ],
  },
}

/**
 * Given a list of vibe rise experiences and the user's starved channels,
 * find which channels are under-represented in their vibe rise set and
 * generate context shift recommendations.
 *
 * @param {Array<{nodeId: string, label: string}>} vibeRiseNodes - experiences rated vibe_rise
 * @param {Array<string>} starvedChannels - channels scored <= 1 on aliveness quiz (e.g. ['connection', 'meaning'])
 * @returns {Array<{channel: string, recommendation: string, prompts: string[]}>}
 */
export function getChannelRecommendations(vibeRiseNodes, starvedChannels) {
  if (!starvedChannels.length || !vibeRiseNodes.length) return []

  return starvedChannels.map(channelId => {
    const modifier = CONTEXT_MODIFIERS[channelId]
    if (!modifier) return null

    // Pick a random vibe rise experience to personalize the recommendation
    const example = vibeRiseNodes[Math.floor(Math.random() * vibeRiseNodes.length)]

    return {
      channel: channelId,
      channelName: modifier.name,
      recommendation: `You love "${example.label}" but it might not be feeding your ${modifier.name} channel. ${modifier.answer}`,
      prompts: modifier.prompts,
      exampleNode: example,
    }
  }).filter(Boolean)
}
