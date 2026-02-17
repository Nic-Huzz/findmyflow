/**
 * Voice Profile Service
 * Manages user voice profiles for personalized content generation
 */
import { supabase } from './supabaseClient'

// ============================================
// VOICE PROFILE CACHING (Cost Optimization)
// ============================================

const VOICE_CACHE_KEY = 'flow_voice_profile_cache'
const VOICE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get cached voice profile or fetch from database
 */
function getCachedVoiceProfile(userId) {
  try {
    const cached = localStorage.getItem(VOICE_CACHE_KEY)
    if (!cached) return null

    const { userId: cachedUserId, profile, timestamp } = JSON.parse(cached)

    // Check if cache is for same user and not expired
    if (cachedUserId === userId && Date.now() - timestamp < VOICE_CACHE_TTL) {
      console.log('🎙️ Using cached voice profile')
      return profile
    }
  } catch (e) {
    // Invalid cache, ignore
  }
  return null
}

/**
 * Cache voice profile in localStorage
 */
function setCachedVoiceProfile(userId, profile) {
  try {
    localStorage.setItem(VOICE_CACHE_KEY, JSON.stringify({
      userId,
      profile,
      timestamp: Date.now()
    }))
  } catch (e) {
    // Storage full or unavailable, ignore
  }
}

/**
 * Clear voice profile cache
 */
export function clearVoiceProfileCache() {
  localStorage.removeItem(VOICE_CACHE_KEY)
}

/**
 * Voice Templates - Pre-built voice profiles for users without existing content
 */
export const VOICE_TEMPLATES = {
  bold_challenger: {
    id: 'bold_challenger',
    name: 'Bold Challenger',
    icon: '🔥',
    inspiration: 'Gary Vee, Alex Hormozi',
    description: 'Direct, confrontational, action-focused. No fluff, no excuses.',
    preview: "Stop waiting for permission. The only thing between you and your goal is the story you keep telling yourself. Real talk: start today or admit you don't want it bad enough.",
    settings: {
      sentence_length: 25,      // Short & punchy
      emoji_usage: 30,          // Minimal
      humor_level: 35,          // Serious with edge
      formality_level: 20,      // Very casual
      vulnerability_level: 40   // Shares struggles strategically
    },
    patterns: {
      hook_style: 'bold_statement',
      sentence_avg: 8,
      uses_questions: true,
      uses_lists: true,
      confrontational: true
    },
    signature_phrases: ['Real talk:', 'Stop.', 'Here\'s the truth:', 'No excuses.']
  },

  warm_educator: {
    id: 'warm_educator',
    name: 'Warm Educator',
    icon: '💛',
    inspiration: 'Brené Brown, Simon Sinek',
    description: 'Empathetic, research-backed, story-driven. Gentle but powerful.',
    preview: "I used to think vulnerability was weakness. Turns out, it's the birthplace of innovation, creativity, and change. Here's what 12 years of research taught me about showing up when you can't control the outcome...",
    settings: {
      sentence_length: 60,      // Flowing
      emoji_usage: 25,          // Light
      humor_level: 40,          // Warm, occasional lightness
      formality_level: 55,      // Professional but accessible
      vulnerability_level: 85   // Very open
    },
    patterns: {
      hook_style: 'personal_story',
      sentence_avg: 16,
      uses_questions: true,
      uses_lists: false,
      uses_research: true
    },
    signature_phrases: ['Here\'s what I\'ve learned:', 'The research shows...', 'I used to think...', 'What if...']
  },

  witty_expert: {
    id: 'witty_expert',
    name: 'Witty Expert',
    icon: '😏',
    inspiration: 'Marketing Twitter, clever copywriters',
    description: 'Smart, funny, pattern-breaking. Makes you think and smile.',
    preview: "Hot take: Your content strategy isn't boring because you're in a 'boring industry.' It's boring because you're cosplaying as a corporation instead of being a human. Plot twist: humans buy from humans.",
    settings: {
      sentence_length: 40,      // Medium
      emoji_usage: 45,          // Moderate
      humor_level: 80,          // Very playful
      formality_level: 25,      // Casual
      vulnerability_level: 50   // Balanced
    },
    patterns: {
      hook_style: 'hot_take',
      sentence_avg: 12,
      uses_questions: true,
      uses_lists: true,
      uses_metaphors: true
    },
    signature_phrases: ['Hot take:', 'Plot twist:', 'Unpopular opinion:', '*chef\'s kiss*']
  },

  calm_authority: {
    id: 'calm_authority',
    name: 'Calm Authority',
    icon: '🧘',
    inspiration: 'Naval Ravikant, Tim Ferriss',
    description: 'Thoughtful, philosophical, timeless. Quality over quantity.',
    preview: "The person who can sit quietly in a room alone will outperform the person who needs constant stimulation. Boredom is the gateway to your best ideas. Most people will never discover this.",
    settings: {
      sentence_length: 35,      // Concise but complete
      emoji_usage: 10,          // Almost never
      humor_level: 25,          // Subtle wit
      formality_level: 65,      // Refined
      vulnerability_level: 35   // Selective sharing
    },
    patterns: {
      hook_style: 'philosophical',
      sentence_avg: 14,
      uses_questions: false,
      uses_lists: false,
      first_principles: true
    },
    signature_phrases: ['The truth is...', 'Most people...', 'First principles:', 'Long-term thinking:']
  },

  relatable_friend: {
    id: 'relatable_friend',
    name: 'Relatable Friend',
    icon: '☕',
    inspiration: 'Emma Chamberlain, everyday creators',
    description: 'Authentic, unfiltered, "we\'re all figuring it out" energy.',
    preview: "okay so i had a complete breakdown yesterday about my business and then ate an entire pizza and honestly?? it helped. anyway here's what i realized at 2am while doom scrolling...",
    settings: {
      sentence_length: 50,      // Stream of consciousness
      emoji_usage: 70,          // Lots
      humor_level: 65,          // Self-deprecating
      formality_level: 10,      // Very casual
      vulnerability_level: 90   // Overshares (strategically)
    },
    patterns: {
      hook_style: 'casual_confession',
      sentence_avg: 18,
      uses_questions: true,
      lowercase_aesthetic: true,
      uses_parentheses: true
    },
    signature_phrases: ['okay so', 'honestly??', 'anyway', 'idk but', 'not gonna lie']
  },

  inspirational_leader: {
    id: 'inspirational_leader',
    name: 'Inspirational Leader',
    icon: '✨',
    inspiration: 'Tony Robbins, Mel Robbins',
    description: 'High energy, action-oriented, belief-building. You CAN do this.',
    preview: "You are ONE decision away from a completely different life. Not one year. Not one month. One decision. The question isn't whether you're capable - you are. The question is: are you willing?",
    settings: {
      sentence_length: 35,      // Punchy but complete
      emoji_usage: 40,          // Strategic emphasis
      humor_level: 30,          // Mostly serious
      formality_level: 45,      // Accessible
      vulnerability_level: 55   // Shares journey
    },
    patterns: {
      hook_style: 'empowering_statement',
      sentence_avg: 10,
      uses_questions: true,
      uses_caps: true,
      repetition: true
    },
    signature_phrases: ['You CAN do this.', 'Here\'s the truth:', 'The question is:', 'ONE decision.']
  }
}

/**
 * Fetch user's voice profile (with caching)
 */
export async function fetchVoiceProfile(userId, skipCache = false) {
  // Check cache first (unless explicitly skipped)
  if (!skipCache) {
    const cached = getCachedVoiceProfile(userId)
    if (cached) {
      return { data: cached, error: null }
    }
  }

  const { data, error } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching voice profile:', error)
    return { data: null, error }
  }

  // Cache the profile
  if (data) {
    setCachedVoiceProfile(userId, data)
  }

  return { data, error: null }
}

/**
 * Create or update voice profile
 */
export async function saveVoiceProfile(userId, profileData) {
  const { data: existing } = await fetchVoiceProfile(userId)

  const payload = {
    user_id: userId,
    ...profileData,
    updated_at: new Date().toISOString()
  }

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('voice_profiles')
      .update(payload)
      .eq('user_id', userId)
      .select()
      .single()

    // Clear cache after successful save
    if (!error && data) {
      clearVoiceProfileCache()
      setCachedVoiceProfile(userId, data)
    }

    return { data, error }
  } else {
    // Create new
    payload.created_at = new Date().toISOString()
    const { data, error } = await supabase
      .from('voice_profiles')
      .insert(payload)
      .select()
      .single()

    // Clear cache after successful save
    if (!error && data) {
      clearVoiceProfileCache()
      setCachedVoiceProfile(userId, data)
    }

    return { data, error }
  }
}

/**
 * Save a voice template as user's profile (quick path)
 */
export async function saveVoiceTemplate(userId, templateId) {
  const template = VOICE_TEMPLATES[templateId]
  if (!template) {
    return { data: null, error: { message: 'Template not found' } }
  }

  const profileData = {
    voice_name: template.name,
    voice_summary: template.description,
    base_template: templateId,
    sentence_length: template.settings.sentence_length,
    emoji_usage: template.settings.emoji_usage,
    humor_level: template.settings.humor_level,
    formality_level: template.settings.formality_level,
    vulnerability_level: template.settings.vulnerability_level,
    detected_patterns: template.patterns,
    catchphrases: template.signature_phrases,
    is_template: true
  }

  return saveVoiceProfile(userId, profileData)
}

/**
 * Delete voice profile
 */
export async function deleteVoiceProfile(userId) {
  const { error } = await supabase
    .from('voice_profiles')
    .delete()
    .eq('user_id', userId)

  // Clear cache after deletion
  if (!error) {
    clearVoiceProfileCache()
  }

  return { error }
}

/**
 * Check if user has a voice profile
 */
export async function hasVoiceProfile(userId) {
  const { data } = await fetchVoiceProfile(userId)
  return !!data
}

/**
 * Build voice instructions for AI prompt
 * Hierarchy: samples > corrections > influences > rules > sliders
 */
export function buildVoiceInstructions(voiceProfile) {
  if (!voiceProfile) return ''
  const sections = []

  sections.push('VOICE PROFILE - Write exactly like this person:')
  if (voiceProfile.voice_summary || voiceProfile.voice_name) {
    sections.push(`Voice: ${voiceProfile.voice_summary || voiceProfile.voice_name}`)
  }

  // 1. Voice Identity — influences (highest conceptual weight)
  const influences = voiceProfile.voice_influences || []
  if (influences.length > 0) {
    let influenceText = '## Voice Identity\nWrite in a style that blends:'
    influences.forEach(inf => {
      influenceText += `\n- ${inf.name}: ${inf.description}`
    })
    sections.push(influenceText)
  }

  // 2. Writing samples — few-shot examples (HIGHEST practical weight)
  const samples = voiceProfile.content_samples || []
  if (samples.length > 0) {
    let samplesText = '## How They Actually Write (Study These Carefully)\n'
    samplesText += 'Match the energy, sentence structure, vocabulary, and personality:'
    samples.slice(0, 5).forEach((s, i) => {
      samplesText += `\n\n--- Sample ${i + 1} ---\n${s.slice(0, 2000)}`
    })
    sections.push(samplesText)
  }

  // 3. Corrections — "do this, not that"
  const corrections = voiceProfile.corrections || []
  if (corrections.length > 0) {
    let correctionsText = '## Voice Corrections (Do This, Not That)'
    corrections.slice(-20).forEach(c => {
      correctionsText += `\n- Don't say "${c.original}" → say "${c.corrected}" (${c.category})`
    })
    sections.push(correctionsText)
  }

  // 4. Voice rules — dos/donts/catchphrases/patterns
  const patterns = voiceProfile.detected_patterns || {}

  if (patterns.voice_dos?.length > 0) {
    let dosText = '## DO These When Writing:'
    patterns.voice_dos.forEach(d => { dosText += `\n• ${d}` })
    sections.push(dosText)
  }

  if (patterns.voice_donts?.length > 0) {
    let dontsText = '## DON\'T Do These (Violates Their Voice):'
    patterns.voice_donts.forEach(d => { dontsText += `\n• ${d}` })
    sections.push(dontsText)
  }

  if (voiceProfile.catchphrases?.length > 0) {
    sections.push(`## Signature Phrases (use naturally, don't force):\n${voiceProfile.catchphrases.join(', ')}`)
  }

  const hookStyles = patterns.hook_styles || (patterns.hookStyle ? [patterns.hookStyle] : patterns.hook_style ? [patterns.hook_style] : [])
  if (hookStyles.length > 0) {
    sections.push(`How they START content: ${hookStyles.join(', ')}`)
  }

  const closingStyles = patterns.closing_styles || (patterns.closingStyle ? [patterns.closingStyle] : patterns.closing_style ? [patterns.closing_style] : [])
  if (closingStyles.length > 0) {
    sections.push(`How they END content: ${closingStyles.join(', ')}`)
  }

  if (voiceProfile.origin_story) {
    const story = voiceProfile.origin_story
    sections.push(`Background (for context): ${story.length > 200 ? story.slice(0, 200) + '...' : story}`)
  }

  // 5. Sliders — only as final fine-tuning "Style Notes"
  const sliderNotes = []
  if (voiceProfile.sentence_length < 35) sliderNotes.push('Keep sentences short and punchy')
  else if (voiceProfile.sentence_length > 65) sliderNotes.push('Use flowing, detailed sentences')

  if (voiceProfile.emoji_usage < 30) sliderNotes.push('Rarely use emojis')
  else if (voiceProfile.emoji_usage > 60) sliderNotes.push('Use emojis liberally')

  if (voiceProfile.formality_level < 35) sliderNotes.push('Very casual and conversational')
  else if (voiceProfile.formality_level > 65) sliderNotes.push('Professional and polished')

  if (voiceProfile.vulnerability_level > 60) sliderNotes.push('Openly share personal struggles')
  else if (voiceProfile.vulnerability_level < 40) sliderNotes.push('Keep it professional, limited personal sharing')

  if (voiceProfile.humor_level > 60) sliderNotes.push('Playful and witty')
  else if (voiceProfile.humor_level < 30) sliderNotes.push('Serious and direct')

  if (sliderNotes.length > 0) {
    sections.push(`## Style Notes\n${sliderNotes.map(n => `- ${n}`).join('\n')}`)
  }

  sections.push('CRITICAL: Sound like THIS specific person, not a generic marketer or AI. Match their unique voice.')

  return sections.join('\n\n')
}

/**
 * Get voice profile summary for UI display
 */
export function getVoiceProfileSummary(voiceProfile) {
  if (!voiceProfile) return null

  const traits = []

  if (voiceProfile.sentence_length < 35) traits.push('Punchy')
  else if (voiceProfile.sentence_length > 65) traits.push('Flowing')

  if (voiceProfile.humor_level > 60) traits.push('Witty')
  else if (voiceProfile.humor_level < 30) traits.push('Serious')

  if (voiceProfile.vulnerability_level > 60) traits.push('Open')
  else if (voiceProfile.vulnerability_level < 40) traits.push('Private')

  if (voiceProfile.formality_level < 35) traits.push('Casual')
  else if (voiceProfile.formality_level > 65) traits.push('Professional')

  return {
    name: voiceProfile.voice_name,
    summary: voiceProfile.voice_summary,
    traits,
    isTemplate: voiceProfile.is_template,
    templateId: voiceProfile.base_template
  }
}

// ============================================
// VOICE DNA EXTRACTION
// ============================================

/**
 * Extract Voice DNA from content samples using AI
 * @param {string[]} contentSamples - Array of content samples to analyze
 * @returns {Promise<{voiceDNA: object, voiceProfile: object, success: boolean}>}
 */
export async function extractVoiceDNA(contentSamples) {
  try {
    const { data, error } = await supabase.functions.invoke('extract-voice-dna', {
      body: { contentSamples }
    })

    if (error) {
      console.error('Voice DNA extraction error:', error)
      return { voiceDNA: null, voiceProfile: null, success: false, error: error.message }
    }

    return data
  } catch (err) {
    console.error('Voice DNA extraction error:', err)
    return { voiceDNA: null, voiceProfile: null, success: false, error: err.message }
  }
}

/**
 * Save extracted Voice DNA as a voice profile
 * @param {string} userId - User ID
 * @param {object} voiceDNA - Extracted Voice DNA object
 * @returns {Promise<{data: object, error: object}>}
 */
export async function saveVoiceDNAProfile(userId, voiceDNA) {
  // Map Voice DNA to voice_profiles table format
  const profileData = {
    voice_name: 'My Authentic Voice',
    voice_summary: voiceDNA.voice_essence,

    // Map formality to a 0-100 scale
    formality_level: voiceDNA.formality_level * 10,

    // Map energy to humor (approximation)
    humor_level: voiceDNA.energy_level > 6 ? 60 : voiceDNA.energy_level > 4 ? 45 : 30,

    // Map sentence length
    sentence_length: voiceDNA.avg_sentence_length === 'short' ? 25
      : voiceDNA.avg_sentence_length === 'long' ? 75
      : voiceDNA.avg_sentence_length === 'varied' ? 50
      : 50,

    // Emoji usage
    emoji_usage: voiceDNA.emoji_frequency === 'heavy' ? 80
      : voiceDNA.emoji_frequency === 'moderate' ? 50
      : voiceDNA.emoji_frequency === 'minimal' ? 25
      : 10,

    // Vulnerability based on story usage
    vulnerability_level: voiceDNA.story_driven ? 70 : 40,

    // Store rich voice data
    catchphrases: voiceDNA.signature_phrases || [],
    content_samples: voiceDNA.best_examples || [],

    // Store detection patterns
    detected_patterns: {
      tone_descriptors: voiceDNA.tone_descriptors,
      hook_styles: voiceDNA.hook_styles,
      closing_styles: voiceDNA.closing_styles,
      primary_topics: voiceDNA.primary_topics,
      uses_questions: voiceDNA.uses_questions,
      uses_lists: voiceDNA.uses_bullet_points,
      uses_stories: voiceDNA.story_driven,
      uses_data: voiceDNA.uses_data,
      uses_analogies: voiceDNA.uses_analogies,
      voice_dos: voiceDNA.dos,
      voice_donts: voiceDNA.donts
    },

    // Mark as extracted
    is_template: false,
    base_template: 'voice_dna_extracted',
    extraction_confidence: voiceDNA.confidence
  }

  return saveVoiceProfile(userId, profileData)
}

// ============================================
// VOICE FEEDBACK INTELLIGENCE
// ============================================

/**
 * Feedback correction mappings - what to tell the AI based on user feedback
 */
const FEEDBACK_CORRECTIONS = {
  'too_formal': 'User feedback: Make it MORE casual and conversational - previous content was too stiff/formal',
  'too_casual': 'User feedback: Make it MORE professional - previous content was too casual',
  'wrong_tone': 'User feedback: Pay extra attention to matching their energy level and emotional tone',
  'not_my_words': 'User feedback: Use simpler, more natural language - avoid jargon and AI-sounding phrases',
  'too_generic': 'User feedback: Be MORE specific and personal - avoid generic advice and platitudes',
  'missing_personality': 'User feedback: Inject more personality and unique perspective - be bolder',
  'wrong_structure': 'User feedback: Vary sentence structure more naturally - mix short and long sentences'
}

/**
 * Aggregate voice feedback to improve future content generation
 * Analyzes last 20 feedback submissions to find patterns
 * @param {string} userId - User ID
 * @returns {Promise<{topIssues: Array, recentComments: Array, totalFeedback: number} | null>}
 */
export async function getVoiceFeedbackInsights(userId) {
  try {
    const { data, error } = await supabase
      .from('voice_feedback')
      .select('feedback_options, feedback_comment')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20) // Last 20 feedback submissions

    if (error) {
      console.error('Error fetching voice feedback:', error)
      return null
    }

    if (!data || data.length === 0) return null

    // Count feedback option occurrences
    const optionCounts = {}
    const comments = []

    data.forEach(feedback => {
      (feedback.feedback_options || []).forEach(option => {
        optionCounts[option] = (optionCounts[option] || 0) + 1
      })
      if (feedback.feedback_comment?.trim()) {
        comments.push(feedback.feedback_comment.trim())
      }
    })

    // Find issues mentioned 2+ times (pattern, not one-off)
    const topIssues = Object.entries(optionCounts)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3) // Top 3 recurring issues

    return {
      topIssues,
      recentComments: comments.slice(0, 3),
      totalFeedback: data.length
    }
  } catch (err) {
    console.error('Error getting voice feedback insights:', err)
    return null
  }
}

/**
 * Build voice feedback instructions for AI
 * Converts user feedback into actionable instructions
 * @param {object} feedbackInsights - Output from getVoiceFeedbackInsights
 * @returns {string} Instructions to include in prompt
 */
export function buildFeedbackInstructions(feedbackInsights) {
  if (!feedbackInsights?.topIssues?.length) return ''

  let instructions = `
⚠️ IMPORTANT - User has given feedback on previous content. Address these issues:
`

  feedbackInsights.topIssues.forEach(([issue, count]) => {
    const correction = FEEDBACK_CORRECTIONS[issue]
    if (correction) {
      instructions += `• ${correction} (mentioned ${count}x)\n`
    }
  })

  // Include recent specific comments (very valuable)
  if (feedbackInsights.recentComments?.length > 0) {
    instructions += `\nUser's own words about what they want:\n`
    feedbackInsights.recentComments.forEach(comment => {
      instructions += `"${comment.slice(0, 150)}${comment.length > 150 ? '...' : ''}"\n`
    })
  }

  return instructions.trim()
}

/**
 * Enhanced voice instructions that includes feedback learning
 * Use this instead of buildVoiceInstructions when generating content
 * @param {object} voiceProfile - User's voice profile
 * @param {object} feedbackInsights - Optional feedback insights from getVoiceFeedbackInsights
 * @returns {string} Complete voice instructions for AI
 */
export function buildEnhancedVoiceInstructions(voiceProfile, feedbackInsights = null) {
  // Get base voice instructions
  let instructions = buildVoiceInstructions(voiceProfile)

  // Add feedback-based corrections if available
  if (feedbackInsights) {
    const feedbackInstructions = buildFeedbackInstructions(feedbackInsights)
    if (feedbackInstructions) {
      instructions += '\n\n' + feedbackInstructions
    }
  }

  return instructions
}

/**
 * Save voice feedback from content rejection
 * Records what the user didn't like about generated content
 * @param {string} userId - User ID
 * @param {string} contentId - Content history ID
 * @param {string} feedbackOption - Primary feedback reason (e.g., 'too_formal', 'off_brand')
 * @param {object} context - Additional context about the content
 * @returns {Promise<{error: object | null}>}
 */
export async function saveVoiceFeedback(userId, contentId, feedbackOption, context = {}) {
  try {
    const { error } = await supabase
      .from('voice_feedback')
      .insert({
        user_id: userId,
        content_id: contentId,
        feedback_options: [feedbackOption], // Array for consistency with existing table
        content_type: context.contentType || null,
        platform: context.platform || null,
        content_snippet: context.contentSnippet || null,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving voice feedback:', error)
      return { error }
    }

    return { error: null }
  } catch (err) {
    console.error('Error saving voice feedback:', err)
    return { error: err }
  }
}
