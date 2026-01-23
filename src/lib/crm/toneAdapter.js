/**
 * Tone Adapter
 *
 * Adjusts prompt language based on user's psychological profile.
 * Uses the recommendedTone from challengeDataService's fetchPsychologicalProfile()
 *
 * Tones:
 * - 'gentle': For users with rejection/judgment fears or ghost archetype
 * - 'balanced': Default tone for most users
 * - 'assertive': For performer/controller archetypes who respond to direct communication
 *
 * @see src/lib/crm/challengeDataService.js - fetchPsychologicalProfile()
 */

// Tone-specific language mappings
const TONE_LANGUAGE = {
  gentle: {
    // Action words
    should: 'might consider',
    must: 'could',
    need: 'might benefit from',
    have_to: 'may want to',
    required: 'helpful',

    // Feedback starters
    improvement: 'One opportunity',
    problem: 'Something to explore',
    issue: 'An area to consider',
    weakness: 'A growth area',
    failing: 'An area that could use attention',

    // Encouragement
    good_job: 'You\'re making progress',
    well_done: 'That\'s a positive step',
    excellent: 'That\'s working well',

    // Pressure words (soften)
    urgent: 'timely',
    critical: 'important',
    immediately: 'when you\'re ready',
    now: 'soon',
    deadline: 'target date',

    // Closing phrases
    action_cta: 'When you feel ready, consider',
    follow_up: 'No rush, but keep this in mind'
  },

  balanced: {
    should: 'should',
    must: 'need to',
    need: 'need',
    have_to: 'should',
    required: 'important',

    improvement: 'Area for improvement',
    problem: 'Challenge',
    issue: 'Issue',
    weakness: 'Weakness',
    failing: 'Gap',

    good_job: 'Nice work',
    well_done: 'Well done',
    excellent: 'Excellent',

    urgent: 'urgent',
    critical: 'critical',
    immediately: 'as soon as possible',
    now: 'now',
    deadline: 'deadline',

    action_cta: 'Your next step is to',
    follow_up: 'Let me know how it goes'
  },

  assertive: {
    should: 'need to',
    must: 'must',
    need: 'need',
    have_to: 'have to',
    required: 'required',

    improvement: 'Fix this',
    problem: 'Problem',
    issue: 'Issue that needs fixing',
    weakness: 'Weakness to address',
    failing: 'Failure point',

    good_job: 'Solid execution',
    well_done: 'That worked',
    excellent: 'That crushed it',

    urgent: 'urgent',
    critical: 'critical',
    immediately: 'now',
    now: 'right now',
    deadline: 'hard deadline',

    action_cta: 'Take action now:',
    follow_up: 'Execute and report back'
  }
}

// Tone-specific system prompt additions
const TONE_SYSTEM_PROMPTS = {
  gentle: `
IMPORTANT - Communication Style:
- Use encouraging, supportive language
- Frame suggestions as options, not demands
- Acknowledge effort and progress before suggesting improvements
- Avoid words like "must", "should", "need to", "failing"
- Phrase feedback as opportunities for growth
- Be patient and understanding
- Use phrases like "consider", "might want to", "one option is"
`,

  balanced: `
IMPORTANT - Communication Style:
- Be direct but supportive
- Provide clear recommendations with reasoning
- Balance encouragement with honest feedback
- Use professional, friendly tone
`,

  assertive: `
IMPORTANT - Communication Style:
- Be direct and action-oriented
- Get straight to the point
- Use clear, strong language
- Focus on results and execution
- Don't sugarcoat - this user appreciates directness
- Challenge them to do better
`
}

/**
 * Wrap a base prompt with tone-appropriate language instructions
 *
 * @param {string} basePrompt - The original prompt
 * @param {string} tone - 'gentle', 'balanced', or 'assertive'
 * @returns {string} - Tone-adjusted prompt
 */
export function wrapPromptWithTone(basePrompt, tone = 'balanced') {
  const validTone = ['gentle', 'balanced', 'assertive'].includes(tone) ? tone : 'balanced'
  const toneAddition = TONE_SYSTEM_PROMPTS[validTone]

  return `${toneAddition}\n\n${basePrompt}`
}

/**
 * Get tone-specific language for a key
 *
 * @param {string} key - Language key (e.g., 'should', 'improvement', 'action_cta')
 * @param {string} tone - 'gentle', 'balanced', or 'assertive'
 * @returns {string} - Tone-appropriate phrase
 */
export function getToneWord(key, tone = 'balanced') {
  const validTone = ['gentle', 'balanced', 'assertive'].includes(tone) ? tone : 'balanced'
  return TONE_LANGUAGE[validTone][key] || key
}

/**
 * Replace tone-sensitive words in a string
 *
 * @param {string} text - Text to adapt
 * @param {string} tone - 'gentle', 'balanced', or 'assertive'
 * @returns {string} - Adapted text
 */
export function adaptTextToTone(text, tone = 'balanced') {
  if (!text) return text

  const validTone = ['gentle', 'balanced', 'assertive'].includes(tone) ? tone : 'balanced'
  let adapted = text

  // Replace key words based on tone (only if not already balanced)
  if (validTone !== 'balanced') {
    const replacements = {
      // For gentle tone, soften language
      'you must': getToneWord('must', validTone) === 'could' ? 'you could' : 'you must',
      'you should': `you ${getToneWord('should', validTone)}`,
      'you need to': `you ${getToneWord('need', validTone)}`,
      'you have to': `you ${getToneWord('have_to', validTone)}`,

      // Feedback words
      'problem': getToneWord('problem', validTone),
      'issue': getToneWord('issue', validTone),
      'weakness': getToneWord('weakness', validTone),
    }

    for (const [original, replacement] of Object.entries(replacements)) {
      const regex = new RegExp(original, 'gi')
      adapted = adapted.replace(regex, replacement)
    }
  }

  return adapted
}

/**
 * Generate a feedback message with appropriate tone
 *
 * @param {Object} params - Feedback parameters
 * @param {string} params.type - 'positive', 'improvement', 'action'
 * @param {string} params.message - The core message
 * @param {string} params.tone - 'gentle', 'balanced', or 'assertive'
 * @returns {string} - Tone-appropriate feedback
 */
export function generateTonedFeedback({ type, message, tone = 'balanced' }) {
  const validTone = ['gentle', 'balanced', 'assertive'].includes(tone) ? tone : 'balanced'

  switch (type) {
    case 'positive':
      return `${getToneWord('good_job', validTone)}! ${message}`

    case 'improvement':
      return `${getToneWord('improvement', validTone)}: ${message}`

    case 'action':
      return `${getToneWord('action_cta', validTone)} ${message}`

    default:
      return message
  }
}

/**
 * Build context for AI prompts that includes tone instructions
 *
 * @param {Object} psychProfile - From fetchPsychologicalProfile()
 * @returns {Object} - { toneInstructions: string, tone: string }
 */
export function buildToneContext(psychProfile) {
  const tone = psychProfile?.recommendedTone || 'balanced'

  return {
    tone,
    toneInstructions: TONE_SYSTEM_PROMPTS[tone] || TONE_SYSTEM_PROMPTS.balanced,
    toneLanguage: TONE_LANGUAGE[tone] || TONE_LANGUAGE.balanced
  }
}

/**
 * Get tone description for UI display
 *
 * @param {string} tone - 'gentle', 'balanced', or 'assertive'
 * @returns {Object} - { label, description, emoji }
 */
export function getToneInfo(tone) {
  const toneInfo = {
    gentle: {
      label: 'Gentle',
      description: 'Supportive, encouraging communication style',
      emoji: '💚'
    },
    balanced: {
      label: 'Balanced',
      description: 'Direct yet supportive communication',
      emoji: '💙'
    },
    assertive: {
      label: 'Assertive',
      description: 'Direct, action-oriented communication',
      emoji: '🔥'
    }
  }

  return toneInfo[tone] || toneInfo.balanced
}

export default {
  wrapPromptWithTone,
  getToneWord,
  adaptTextToTone,
  generateTonedFeedback,
  buildToneContext,
  getToneInfo
}
