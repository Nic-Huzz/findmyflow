/**
 * Mind Space Mapper
 * Maps extracted items to wheel taxonomy categories using Claude Haiku
 */

import { supabase } from './supabaseClient'

/**
 * Segment display info for UI
 */
export const SEGMENT_DISPLAY = {
  skills: {
    clarifying: { icon: '💡', title: 'The Translator', description: 'Making complex ideas simple' },
    analyzing: { icon: '📊', title: 'The Pattern Spotter', description: 'Finding insights in data' },
    strategizing: { icon: '🎯', title: 'The Gamemaker', description: 'Planning and vision' },
    organizing: { icon: '⚙️', title: 'The Systems Architect', description: 'Building processes' },
    building: { icon: '🔨', title: 'The Maker', description: 'Creating tangible things' },
    designing: { icon: '🎨', title: 'The Experience Crafter', description: 'Shaping how things feel' },
    creating: { icon: '✨', title: 'The Originator', description: 'Generating new ideas' },
    expressing: { icon: '🎙️', title: 'The Voice', description: 'Storytelling and communication' },
    connecting: { icon: '🤝', title: 'The Bridge Builder', description: 'Bringing people together' },
    influencing: { icon: '🔥', title: 'The Catalyst', description: 'Moving people to action' },
    nurturing: { icon: '🌱', title: 'The Grower', description: 'Developing and supporting others' },
    synthesizing: { icon: '🔮', title: 'The Integrator', description: 'Connecting the big picture' }
  },
  problems: {
    physical_vitality: { icon: '💪', title: 'Body Whisperer', description: 'Health, energy, physical wellness' },
    mental_wellbeing: { icon: '🧠', title: 'Mind Guardian', description: 'Mental health, clarity, emotional balance' },
    personal_mastery: { icon: '🎓', title: 'Growth Catalyst', description: 'Self-improvement, habits, potential' },
    intimate_bonds: { icon: '💕', title: 'Heart Healer', description: 'Relationships, love, connection' },
    service_care: { icon: '🫶', title: 'Care Champion', description: 'Helping, supporting, giving' },
    creative_expression: { icon: '🎭', title: 'Voice Liberator', description: 'Authenticity, self-expression, identity' },
    local_impact: { icon: '🏘️', title: 'Community Builder', description: 'Local belonging and contribution' },
    cultural_movements: { icon: '📢', title: 'Movement Maker', description: 'Cultural shifts, thought leadership' },
    economic_freedom: { icon: '🚀', title: 'Freedom Architect', description: 'Money, business, career fulfillment' },
    social_justice: { icon: '⚖️', title: 'Equity Champion', description: 'Fairness, rights, equality' },
    planetary_health: { icon: '🌍', title: 'Earth Guardian', description: 'Environment, sustainability' },
    human_progress: { icon: '🔬', title: 'Future Builder', description: 'Innovation, technology, advancement' }
  },
  personas: {
    seekers: { icon: '🧭', title: 'The Compass', description: 'Lost, seeking direction and purpose' },
    builders: { icon: '🏗️', title: 'The Architect', description: 'Creating, launching, entrepreneurial' },
    healers: { icon: '🩹', title: 'The Mender', description: 'Recovering, processing trauma' },
    teachers: { icon: '📚', title: 'The Illuminator', description: 'Learning, growing, developing skills' },
    connectors: { icon: '🕸️', title: 'The Weaver', description: 'Lonely, seeking belonging' },
    achievers: { icon: '🏆', title: 'The Accelerator', description: 'Goal-driven, ambitious, results-focused' },
    explorers: { icon: '🗺️', title: 'The Liberator', description: 'Freedom-seeking, curious, adventurous' },
    visionaries: { icon: '🔭', title: 'The Pioneer', description: 'Impact-driven, mission-focused' },
    protectors: { icon: '🛡️', title: 'The Shield', description: 'Security-focused, risk-aware' },
    creators: { icon: '🎨', title: 'The Muse', description: 'Artistic, expressive, design-minded' },
    nurturers: { icon: '⚓', title: 'The Anchor', description: 'Caring, supportive, family-oriented' },
    challengers: { icon: '⚡', title: 'The Truth Teller', description: 'Courageous, questioning, disruptive' }
  }
}

/**
 * Level options for each wheel type
 */
export const LEVEL_OPTIONS = {
  skills: [
    { value: 'emerging', label: 'Emerging', description: 'Still learning, passionate but developing' },
    { value: 'establishing', label: 'Establishing', description: 'Competent and building experience' },
    { value: 'mastering', label: 'Mastering', description: 'Expert level, could teach others' }
  ],
  problems: [
    { value: 'exploring', label: 'Exploring', description: "Curious but haven't pursued yet" },
    { value: 'pursuing', label: 'Pursuing', description: 'Currently working on this problem' },
    { value: 'proven', label: 'Proven', description: 'Have results and experience' }
  ],
  personas: [
    { value: 'awakening', label: 'Awakening', description: 'Just realized they have this problem' },
    { value: 'struggling', label: 'Struggling', description: 'Actively trying to solve, hitting walls' },
    { value: 'ready', label: 'Ready', description: 'Have budget, urgency, seeking solution' }
  ]
}

/**
 * Map all items using Claude Haiku for semantic understanding
 * @param {object} parsedData - Output from parseMindSpaceResponse
 * @returns {object} Same structure with mappedTo populated
 */
export async function mapAllToWheelSegments(parsedData) {
  const mapped = { ...parsedData }

  // Build the mapping prompt
  const prompt = buildMappingPrompt(parsedData)

  try {
    console.log('🗺️ Calling mind-space-map Edge Function...')
    const { data: mappings, error } = await supabase.functions.invoke('mind-space-map', {
      body: { prompt }
    })

    if (error) {
      console.error('Edge Function error:', error)
      throw new Error(error.message || 'Mapping API failed')
    }

    if (!mappings || !mappings.skills) {
      console.warn('Invalid response from Edge Function:', mappings)
      throw new Error('Invalid mapping response')
    }

    console.log('✅ AI Mapping successful:', mappings)

    // Apply mappings to data
    mapped.skills = parsedData.skills.map((skill, i) => ({
      ...skill,
      mappedTo: mappings.skills[i] || null
    }))

    mapped.problems = parsedData.problems.map((problem, i) => ({
      ...problem,
      mappedTo: mappings.problems[i] || null
    }))

    mapped.personas = parsedData.personas.map((persona, i) => ({
      ...persona,
      mappedTo: mappings.personas[i] || null
    }))

  } catch (error) {
    console.warn('⚠️ AI mapping failed, using keyword fallback:', error.message)
    // Fallback to keyword mapping if API fails
    mapped.skills = parsedData.skills.map(s => ({ ...s, mappedTo: fallbackMap(s, 'skills') }))
    mapped.problems = parsedData.problems.map(p => ({ ...p, mappedTo: fallbackMap(p, 'problems') }))
    mapped.personas = parsedData.personas.map(p => ({ ...p, mappedTo: fallbackMap(p, 'personas') }))
    console.log('🔧 Fallback mappings applied')
  }

  return mapped
}

/**
 * Build the prompt for Haiku mapping
 */
function buildMappingPrompt(parsedData) {
  const skillCategories = Object.entries(SEGMENT_DISPLAY.skills)
    .map(([id, info]) => `- ${id}: ${info.description}`)
    .join('\n')

  const problemCategories = Object.entries(SEGMENT_DISPLAY.problems)
    .map(([id, info]) => `- ${id}: ${info.description}`)
    .join('\n')

  const personaCategories = Object.entries(SEGMENT_DISPLAY.personas)
    .map(([id, info]) => `- ${id}: ${info.description}`)
    .join('\n')

  const skillsList = parsedData.skills
    .map((s, i) => `${i}. "${s.name}" (${s.category || 'uncategorized'}) - ${s.evidence}`)
    .join('\n')

  const problemsList = parsedData.problems
    .map((p, i) => `${i}. "${p.name}" - ${p.evidence}`)
    .join('\n')

  const personasList = parsedData.personas
    .map((p, i) => `${i}. "${p.name}" - ${p.evidence}`)
    .join('\n')

  return `Map each item to the SINGLE best-fit category. Return ONLY valid JSON.

SKILL CATEGORIES:
${skillCategories}

PROBLEM CATEGORIES:
${problemCategories}

PERSONA CATEGORIES:
${personaCategories}

---

SKILLS TO MAP:
${skillsList}

PROBLEMS TO MAP:
${problemsList}

PERSONAS TO MAP:
${personasList}

---

Return JSON in this exact format:
{
  "skills": ["category_id", "category_id", ...],
  "problems": ["category_id", "category_id", ...],
  "personas": ["category_id", "category_id", ...]
}

Use only the category IDs listed above. Match based on semantic meaning, not just keywords.`
}

/**
 * Simple keyword fallback if API fails
 */
function fallbackMap(item, type) {
  const searchText = `${item.name} ${item.evidence || ''} ${item.category || ''}`.toLowerCase()

  const keywordMaps = {
    skills: {
      clarifying: ['teach', 'explain', 'simplify', 'translate', 'communicate'],
      analyzing: ['analyze', 'pattern', 'data', 'research', 'diagnose'],
      strategizing: ['strategy', 'plan', 'framework', 'model', 'vision', 'strategic'],
      organizing: ['system', 'process', 'organize', 'structure', 'workflow'],
      building: ['build', 'code', 'engineer', 'develop', 'technical', 'architect'],
      designing: ['design', 'experience', 'ux', 'visual', 'aesthetic'],
      creating: ['creative', 'create', 'art', 'innovate', 'ideate'],
      expressing: ['story', 'narrative', 'voice', 'present', 'speak'],
      connecting: ['connect', 'facilitate', 'collaborate', 'network', 'bridge'],
      influencing: ['influence', 'persuade', 'lead', 'motivate', 'inspire'],
      nurturing: ['nurture', 'coach', 'mentor', 'support', 'heal', 'somatic', 'guide'],
      synthesizing: ['synthesize', 'integrate', 'holistic', 'big picture', 'wisdom']
    },
    problems: {
      physical_vitality: ['health', 'body', 'fitness', 'energy', 'physical'],
      mental_wellbeing: ['mental', 'mind', 'anxiety', 'healing', 'emotional', 'wellbeing', 'heavy', 'serious'],
      personal_mastery: ['growth', 'mastery', 'potential', 'evolution', 'transform', 'patterns', 'sabotage', 'maps'],
      intimate_bonds: ['relationship', 'love', 'intimacy', 'partner', 'family'],
      service_care: ['help', 'serve', 'care', 'support', 'give'],
      creative_expression: ['creative', 'express', 'voice', 'authentic', 'identity', 'playful', 'essence', 'alive', 'disconnected', 'blocked'],
      local_impact: ['community', 'local', 'neighborhood', 'belonging'],
      cultural_movements: ['culture', 'movement', 'trend', 'shift', 'influence'],
      economic_freedom: ['money', 'income', 'business', 'earn', 'wealth', 'financial', 'under-earn', 'value'],
      social_justice: ['justice', 'equity', 'fairness', 'rights'],
      planetary_health: ['environment', 'climate', 'sustainability', 'planet'],
      human_progress: ['innovation', 'technology', 'future', 'progress', 'science']
    },
    personas: {
      seekers: ['seeker', 'seeking', 'lost', 'direction', 'purpose', 'meaning', 'clarity'],
      builders: ['builder', 'building', 'entrepreneur', 'maker', 'founder', 'startup'],
      healers: ['healing', 'healer', 'recovery', 'trauma', 'wellness', 'therapy', 'burnt-out', 'burnout'],
      teachers: ['learning', 'student', 'education', 'knowledge', 'skill'],
      connectors: ['lonely', 'isolated', 'belonging', 'community', 'tribe', 'connection'],
      achievers: ['success', 'goals', 'ambitious', 'driven', 'performance', 'results'],
      explorers: ['adventure', 'freedom', 'explore', 'curious', 'discovery', 'rational', 'skeptical'],
      visionaries: ['vision', 'impact', 'change', 'mission', 'legacy', 'transform', 'movement', 'facilitator', 'leader'],
      protectors: ['security', 'safety', 'protect', 'stability', 'risk'],
      creators: ['creative', 'artist', 'expression', 'design', 'content', 'craft'],
      nurturers: ['caring', 'support', 'family', 'parent', 'caregiver', 'empathy'],
      challengers: ['truth', 'challenge', 'question', 'rebel', 'disrupt', 'courage']
    }
  }

  const keywords = keywordMaps[type] || {}
  let bestMatch = null
  let bestScore = 0

  for (const [categoryId, categoryKeywords] of Object.entries(keywords)) {
    let score = 0
    for (const keyword of categoryKeywords) {
      if (searchText.includes(keyword)) {
        score += item.name.toLowerCase().includes(keyword) ? 3 : 1
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestMatch = categoryId
    }
  }

  return bestMatch
}
