/**
 * validationObstacles.js
 *
 * Helper functions to extract obstacle data from validation survey responses
 * for use in the Offer Builder's obstacles step.
 *
 * Maps validation questions to obstacle types:
 * - Step 2.0 (mental_story): Internal beliefs
 * - Step 3.0 (additional_reasons): Direct obstacles (5 items)
 * - Step 6.0 (current_emotion): Motivation indicators
 * - Step 7.0 (hell_yes_factors): Inverse needs (what's missing)
 */

import { supabase } from './supabaseClient'

/**
 * Fetch validation responses for a user's flows
 * @param {string} userId - The user ID (creator of validation flows)
 * @param {string|null} projectId - Optional project ID to filter flows
 * @returns {Promise<Array>} Array of validation sessions with responses
 */
export async function fetchValidationResponses(userId, projectId = null) {
  try {
    // Get user's validation flows
    let flowsQuery = supabase
      .from('validation_flows')
      .select('id, flow_name, placeholders')
      .eq('creator_user_id', userId)
      .eq('is_active', true)

    if (projectId) {
      flowsQuery = flowsQuery.eq('project_id', projectId)
    }

    const { data: flows, error: flowsError } = await flowsQuery

    if (flowsError || !flows?.length) {
      return []
    }

    const flowIds = flows.map(f => f.id)

    // Get completed sessions for these flows
    const { data: sessions, error: sessionsError } = await supabase
      .from('validation_sessions')
      .select('id, flow_id, completed_at')
      .in('flow_id', flowIds)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false })

    if (sessionsError || !sessions?.length) {
      return []
    }

    const sessionIds = sessions.map(s => s.id)

    // Get responses for these sessions
    const { data: responses, error: responsesError } = await supabase
      .from('validation_responses')
      .select('session_id, step_id, answer_value, question_text')
      .in('session_id', sessionIds)

    if (responsesError) {
      console.error('Error fetching validation responses:', responsesError)
      return []
    }

    // Group responses by session
    const sessionMap = {}
    sessions.forEach(s => {
      sessionMap[s.id] = {
        ...s,
        flow: flows.find(f => f.id === s.flow_id),
        responses: []
      }
    })

    responses?.forEach(r => {
      if (sessionMap[r.session_id]) {
        sessionMap[r.session_id].responses.push(r)
      }
    })

    return Object.values(sessionMap)
  } catch (err) {
    console.error('Error in fetchValidationResponses:', err)
    return []
  }
}

/**
 * Extract obstacles from validation responses
 * @param {Array} sessions - Array of validation sessions with responses
 * @returns {Object} Structured obstacles data
 */
export function extractObstaclesFromValidation(sessions) {
  const obstacles = {
    internalBeliefs: [],      // From step 2.0 (mental_story)
    directObstacles: [],      // From step 3.0 (additional_reasons)
    emotionalIndicators: [],  // From step 6.0 (current_emotion)
    inverseNeeds: [],         // From step 7.0 (hell_yes_factors)
    solutionPreferences: {    // From step 5.0/5.1 (solution category + types)
      categories: [],         // Aggregated category votes
      specificTypes: {
        service: [],
        productized: [],
        product: []
      }
    },
    // Additional validation insights for Offer Builder
    dreamOutcomes: [],        // From step 1.0 - what they want to achieve
    hellYesFactors: [],       // From step 7.0 - what would make them say yes
    painLevels: [],           // From step 9.0 - how painful the problem is
    budgets: []               // From step 10.0 - what they'd pay
  }

  if (!sessions?.length) {
    return obstacles
  }

  sessions.forEach(session => {
    session.responses?.forEach(response => {
      const stepId = response.step_id
      const value = response.answer_value

      if (!value) return

      switch (stepId) {
        case '1.0':
          // Dream outcome - what they want to achieve
          if (typeof value === 'string' && value.trim()) {
            obstacles.dreamOutcomes.push({
              text: value.trim(),
              source: 'validation',
              type: 'dream_outcome',
              sessionId: session.id
            })
          }
          break

        case '2.0':
          // Mental story - internal beliefs
          if (typeof value === 'string' && value.trim()) {
            obstacles.internalBeliefs.push({
              text: value.trim(),
              source: 'validation',
              type: 'internal_belief',
              sessionId: session.id
            })
          }
          break

        case '3.0':
          // Additional reasons - direct obstacles (array of 5 items)
          if (Array.isArray(value)) {
            value.forEach(reason => {
              if (typeof reason === 'string' && reason.trim()) {
                obstacles.directObstacles.push({
                  text: reason.trim(),
                  source: 'validation',
                  type: 'direct_obstacle',
                  sessionId: session.id
                })
              }
            })
          }
          break

        case '5.0':
          // Solution category preference (Service/Productized/Product)
          if (typeof value === 'string') {
            obstacles.solutionPreferences.categories.push({
              value: value,
              sessionId: session.id
            })
          }
          break

        case '5.1a':
          // Service-specific types (multi-select)
          if (Array.isArray(value)) {
            value.forEach(type => {
              if (typeof type === 'string' && type.trim()) {
                obstacles.solutionPreferences.specificTypes.service.push({
                  text: type.trim(),
                  sessionId: session.id
                })
              }
            })
          }
          break

        case '5.1b':
          // Productized-specific types (multi-select)
          if (Array.isArray(value)) {
            value.forEach(type => {
              if (typeof type === 'string' && type.trim()) {
                obstacles.solutionPreferences.specificTypes.productized.push({
                  text: type.trim(),
                  sessionId: session.id
                })
              }
            })
          }
          break

        case '5.1c':
          // Product-specific types (multi-select)
          if (Array.isArray(value)) {
            value.forEach(type => {
              if (typeof type === 'string' && type.trim()) {
                obstacles.solutionPreferences.specificTypes.product.push({
                  text: type.trim(),
                  sessionId: session.id
                })
              }
            })
          }
          break

        case '6.0':
          // Current emotion - motivation indicators
          if (typeof value === 'string' && value.trim()) {
            const emotion = value.trim()
            // Map emotions to obstacle insights
            const emotionMapping = {
              'Frustrated - tried stuff, nothing sticks': 'Past solutions haven\'t worked for them',
              'Desperate - I need this solved NOW': 'High urgency, fear of missing out',
              'Skeptical - I\'ve been burned before': 'Trust issues with similar solutions',
              'Overwhelmed - too many options': 'Decision paralysis, need simplicity',
              'Confused - don\'t even know where to start': 'Need clear first steps',
              'Resigned - maybe this is just how it is': 'Lost hope, need proof it\'s possible'
            }

            if (emotionMapping[emotion]) {
              obstacles.emotionalIndicators.push({
                text: emotionMapping[emotion],
                emotion: emotion,
                source: 'validation',
                type: 'emotional_indicator',
                sessionId: session.id
              })
            }
          }
          break

        case '7.0':
          // Hell yes factors - inverse reveals what's missing
          if (typeof value === 'string' && value.trim()) {
            obstacles.inverseNeeds.push({
              text: value.trim(),
              source: 'validation',
              type: 'inverse_need',
              sessionId: session.id
            })
            // Also store as hellYesFactors for the insights panel
            obstacles.hellYesFactors.push({
              text: value.trim(),
              source: 'validation',
              type: 'hell_yes_factor',
              sessionId: session.id
            })
          }
          break

        case '9.0':
          // Pain level - how painful the problem is (1-10 scale)
          if (value) {
            obstacles.painLevels.push({
              value: typeof value === 'number' ? value : parseInt(value, 10) || 0,
              text: String(value),
              source: 'validation',
              type: 'pain_level',
              sessionId: session.id
            })
          }
          break

        case '10.0':
          // Budget - what they'd pay to solve this
          if (typeof value === 'string' && value.trim()) {
            obstacles.budgets.push({
              text: value.trim(),
              source: 'validation',
              type: 'budget',
              sessionId: session.id
            })
          }
          break
      }
    })
  })

  return obstacles
}

/**
 * Deduplicate and rank obstacles by frequency
 * @param {Object} obstacles - Structured obstacles data
 * @returns {Array} Ranked, deduplicated obstacles ready for display
 */
export function rankObstacles(obstacles) {
  const allObstacles = []

  // Add direct obstacles (highest priority - they explicitly listed these)
  obstacles.directObstacles.forEach(o => {
    allObstacles.push({ ...o, priority: 1 })
  })

  // Add internal beliefs (high priority - root causes)
  obstacles.internalBeliefs.forEach(o => {
    allObstacles.push({ ...o, priority: 2 })
  })

  // Add emotional indicators (medium priority - derived insights)
  obstacles.emotionalIndicators.forEach(o => {
    allObstacles.push({ ...o, priority: 3 })
  })

  // Add inverse needs (lower priority - need interpretation)
  obstacles.inverseNeeds.forEach(o => {
    allObstacles.push({ ...o, priority: 4 })
  })

  // Deduplicate by similar text (fuzzy matching)
  const seen = new Set()
  const deduplicated = allObstacles.filter(o => {
    const normalized = o.text.toLowerCase().trim()
    if (seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })

  // Sort by priority, then by frequency of similar responses
  return deduplicated.sort((a, b) => a.priority - b.priority)
}

/**
 * Analyze solution preferences to determine recommended version
 * @param {Object} solutionPreferences - Raw solution preference data
 * @returns {Object} Analysis with recommended version and breakdown
 */
export function analyzeSolutionPreferences(solutionPreferences) {
  const categories = solutionPreferences?.categories || []
  const specificTypes = solutionPreferences?.specificTypes || { service: [], productized: [], product: [] }

  if (categories.length === 0) {
    return {
      hasPreferences: false,
      recommendedVersion: null,
      breakdown: { service: 0, productized: 0, product: 0 },
      specificTypes: { service: [], productized: [], product: [] }
    }
  }

  // Count category votes
  const breakdown = { service: 0, productized: 0, product: 0 }

  categories.forEach(cat => {
    const value = cat.value?.toLowerCase() || ''
    if (value.includes('service')) {
      breakdown.service++
    } else if (value.includes('productized') || value.includes('guided')) {
      breakdown.productized++
    } else if (value.includes('product') || value.includes('tools')) {
      breakdown.product++
    }
  })

  // Determine winner
  const max = Math.max(breakdown.service, breakdown.productized, breakdown.product)
  let recommendedVersion = null
  let confidence = 0

  if (max > 0) {
    if (breakdown.service === max) recommendedVersion = 'service'
    else if (breakdown.productized === max) recommendedVersion = 'productized'
    else recommendedVersion = 'product'

    confidence = max / categories.length
  }

  // Aggregate specific types (count occurrences)
  const aggregateTypes = (types) => {
    const counts = {}
    types.forEach(t => {
      const text = t.text
      counts[text] = (counts[text] || 0) + 1
    })
    return Object.entries(counts)
      .map(([text, count]) => ({ text, count }))
      .sort((a, b) => b.count - a.count)
  }

  return {
    hasPreferences: true,
    recommendedVersion,
    confidence,
    totalVotes: categories.length,
    breakdown,
    specificTypes: {
      service: aggregateTypes(specificTypes.service),
      productized: aggregateTypes(specificTypes.productized),
      product: aggregateTypes(specificTypes.product)
    }
  }
}

/**
 * Get formatted obstacles for Offer Builder display
 * @param {string} userId - The user ID
 * @param {string|null} projectId - Optional project ID to filter flows
 * @returns {Promise<Object>} Formatted obstacles data for UI
 */
export async function getValidationObstaclesForOfferBuilder(userId, projectId = null) {
  const sessions = await fetchValidationResponses(userId, projectId)
  const obstacles = extractObstaclesFromValidation(sessions)
  const ranked = rankObstacles(obstacles)
  const solutionAnalysis = analyzeSolutionPreferences(obstacles.solutionPreferences)

  // Calculate average pain level
  const painLevelAvg = obstacles.painLevels.length > 0
    ? Math.round(obstacles.painLevels.reduce((sum, p) => sum + p.value, 0) / obstacles.painLevels.length * 10) / 10
    : null

  // Aggregate budgets by frequency
  const budgetCounts = {}
  obstacles.budgets.forEach(b => {
    budgetCounts[b.text] = (budgetCounts[b.text] || 0) + 1
  })
  const aggregatedBudgets = Object.entries(budgetCounts)
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)

  return {
    hasValidationData: sessions.length > 0,
    totalResponses: sessions.length,
    obstacles: ranked,
    solutionPreferences: solutionAnalysis,
    // Grouped for UI display
    byType: {
      directObstacles: obstacles.directObstacles,
      internalBeliefs: obstacles.internalBeliefs,
      emotionalIndicators: obstacles.emotionalIndicators,
      inverseNeeds: obstacles.inverseNeeds
    },
    // Additional insights for Offer Builder
    insights: {
      dreamOutcomes: obstacles.dreamOutcomes,
      hellYesFactors: obstacles.hellYesFactors,
      painLevel: {
        average: painLevelAvg,
        responses: obstacles.painLevels
      },
      budgets: {
        aggregated: aggregatedBudgets,
        raw: obstacles.budgets
      }
    }
  }
}
