/**
 * Nikigai Weighting Functions
 *
 * Calculates tag frequencies, weights, and bullet scores based on
 * the context (joy, meaning, direction) in which tags appear.
 *
 * Reference: docs/nikigai-weighting-functions.md
 */

/**
 * Calculate tag frequencies across all responses
 * Groups tags by their context type (joy, meaning, direction)
 */
export function calculateTagFrequencies(allResponses) {
  const frequencies = {}

  // Define which questions map to which context types
  const contextCategories = {
    joy: [
      'life_map.hobbies.childhood',
      'life_map.hobbies.highschool',
      'life_map.hobbies.current',
      'life_map.high_moments.childhood',
      'life_map.high_moments.highschool',
      'life_map.high_moments.current'
    ],
    meaning: [
      'life_map.life_chapters.titles',
      'life_map.life_chapters.growth_and_struggle',
      'life_map.role_models',
      'life_map.experience.impact_created'
    ],
    direction: [
      'life_map.future.desires',
      'life_map.future.top3_now'
    ]
  }

  allResponses.forEach(response => {
    const { store_as, tags } = response

    // Determine which context this response belongs to
    let joyContext = contextCategories.joy.some(pattern =>
      store_as.includes(pattern.split('.')[1]) || store_as === pattern
    )
    let meaningContext = contextCategories.meaning.some(pattern =>
      store_as.includes(pattern.split('.')[1]) || store_as === pattern
    )
    let directionContext = contextCategories.direction.some(pattern =>
      store_as.includes(pattern.split('.')[1]) || store_as === pattern
    )

    // Count tags by context
    Object.entries(tags).forEach(([tagType, tagList]) => {
      if (!Array.isArray(tagList)) return

      tagList.forEach(tag => {
        const key = `${tagType}:${tag}`

        if (!frequencies[key]) {
          frequencies[key] = {
            tag,
            tag_type: tagType,
            joy_count: 0,
            meaning_count: 0,
            direction_count: 0
          }
        }

        if (joyContext) frequencies[key].joy_count++
        if (meaningContext) frequencies[key].meaning_count++
        if (directionContext) frequencies[key].direction_count++
      })
    })
  })

  return frequencies
}

/**
 * Calculate normalized weights for each tag
 * Weights represent how strongly a tag appears in each context
 */
export function calculateWeights(frequencies) {
  // Calculate totals for normalization
  const totals = {
    joy: 0,
    meaning: 0,
    direction: 0
  }

  Object.values(frequencies).forEach(freq => {
    totals.joy += freq.joy_count
    totals.meaning += freq.meaning_count
    totals.direction += freq.direction_count
  })

  // Normalize to create weights (0-1 scale)
  const weighted = {}

  Object.entries(frequencies).forEach(([key, freq]) => {
    weighted[key] = {
      ...freq,
      joy_weight: totals.joy > 0 ? freq.joy_count / totals.joy : 0,
      meaning_weight: totals.meaning > 0 ? freq.meaning_count / totals.meaning : 0,
      direction_weight: totals.direction > 0 ? freq.direction_count / totals.direction : 0
    }
  })

  return weighted
}

/**
 * Calculate bullet score for a single item
 * Formula: bullet_score = 0.5*joy + 0.35*meaning + 0.15*direction
 */
export function calculateBulletScore(tagWeights) {
  const { joy_weight = 0, meaning_weight = 0, direction_weight = 0 } = tagWeights

  const score = (
    (0.5 * joy_weight) +
    (0.35 * meaning_weight) +
    (0.15 * direction_weight)
  )

  return Math.round(score * 100) / 100 // Round to 2 decimals
}

/**
 * Process all responses and calculate bullet scores
 * Returns sorted items with scores
 */
export function processTagWeights(responses) {
  // Step 1: Calculate frequencies
  const frequencies = calculateTagFrequencies(responses)

  // Step 2: Calculate weights
  const weighted = calculateWeights(frequencies)

  // Step 3: Calculate bullet scores
  const scored = Object.entries(weighted).map(([key, data]) => ({
    ...data,
    bullet_score: calculateBulletScore(data)
  }))

  // Step 4: Sort by score (highest first)
  scored.sort((a, b) => b.bullet_score - a.bullet_score)

  return scored
}

/**
 * Calculate cluster score based on item scores and diversity
 */
export function calculateClusterScore(cluster, allTagWeights) {
  if (!cluster.items || cluster.items.length === 0) return 0

  let totalScore = 0
  const domains = new Set()

  cluster.items.forEach(item => {
    // Get bullet score for this item
    const itemScore = item.bullet_score || 0
    totalScore += itemScore

    // Track domain diversity
    if (item.tags && item.tags.domain_topic) {
      item.tags.domain_topic.forEach(domain => domains.add(domain))
    }
  })

  // Average bullet score
  const avgScore = totalScore / cluster.items.length

  // Diversity bonus (max +0.3)
  const diversityBonus = Math.min(domains.size * 0.1, 0.3)

  // Final score
  const finalScore = avgScore + diversityBonus

  return Math.round(finalScore * 100) / 100
}

/**
 * Sort clusters by score
 */
export function sortClustersByScore(clusters, allTagWeights) {
  return clusters.map(cluster => ({
    ...cluster,
    score: calculateClusterScore(cluster, allTagWeights)
  })).sort((a, b) => b.score - a.score)
}

/**
 * Save tag weights to Supabase
 */
export async function saveTagWeights(supabase, sessionId, userId, tagWeights) {
  const { data, error } = await supabase
    .from('nikigai_responses')
    .update({
      tag_weights: tagWeights
    })
    .eq('session_id', sessionId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error saving tag weights:', error)
    throw error
  }

  return data
}

/**
 * Load all responses for a session with tags
 */
export async function loadSessionResponses(supabase, sessionId) {
  const { data, error } = await supabase
    .from('nikigai_responses')
    .select('*')
    .eq('session_id', sessionId)
    .order('step_order_index', { ascending: true })

  if (error) {
    console.error('Error loading responses:', error)
    throw error
  }

  return data
}

/**
 * Complete pipeline: load responses, calculate weights, save to DB
 */
export async function processSessionWeights(supabase, sessionId, userId) {
  // Load all responses
  const responses = await loadSessionResponses(supabase, sessionId)

  // Calculate weights
  const frequencies = calculateTagFrequencies(responses)
  const weighted = calculateWeights(frequencies)

  // Update each response with its weights
  const updates = responses.map(response => {
    const responseWeights = {}

    // For each tag in this response, get its weight
    Object.entries(response.tags_extracted || {}).forEach(([tagType, tags]) => {
      tags.forEach(tag => {
        const key = `${tagType}:${tag}`
        if (weighted[key]) {
          responseWeights[key] = {
            joy_weight: weighted[key].joy_weight,
            meaning_weight: weighted[key].meaning_weight,
            direction_weight: weighted[key].direction_weight,
            bullet_score: calculateBulletScore(weighted[key])
          }
        }
      })
    })

    return supabase
      .from('nikigai_responses')
      .update({ tag_weights: responseWeights })
      .eq('id', response.id)
  })

  await Promise.all(updates)

  return weighted
}

// Helper: Extract bullet points from text
export function extractBulletPoints(text) {
  if (!text) return []

  // Try different bullet formats
  const patterns = [
    /^[•\-\*]\s+(.+)$/gm,  // • - * bullets
    /^\d+\.\s+(.+)$/gm,     // 1. 2. 3. numbers
    /^[a-z]\)\s+(.+)$/gm    // a) b) c) letters
  ]

  for (const pattern of patterns) {
    const matches = Array.from(text.matchAll(pattern))
    if (matches.length > 0) {
      return matches.map(m => m[1].trim())
    }
  }

  // If no bullets found, split by newlines
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
}
