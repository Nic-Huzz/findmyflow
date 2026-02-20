/**
 * Scoring Categories Configuration
 *
 * Maps quest categories to the three scoring buckets:
 * - business: Project progression, stage tasks, flows
 * - healing: Personal development, self-awareness
 * - courage: Visibility challenges, facing fears
 *
 * See: docs/scoring-system-refactor.md
 */

import { getWeekStartLocal as getWeekStartDate } from './dateUtils'

// Map quest categories to scoring categories
export const SCORING_CATEGORIES = {
  // Business score
  'Business': 'business',
  'Flow Finder': 'business',
  'Bonus': 'business', // Engagement activities (feedback, referrals, etc.)

  // Healing score
  'Healing': 'healing',
  'Tracker': 'bonus',
  'Daily': 'healing',
  'Weekly': 'healing',

  // Courage score
  'Groans': 'courage',
  'Voices': 'courage'
}

/**
 * Get the scoring category for a quest category
 * @param {string} questCategory - The quest's category (e.g., 'Business', 'Healing', 'Groans')
 * @returns {string} - The scoring category ('business', 'healing', or 'courage')
 */
export const getScoringCategory = (questCategory) => {
  return SCORING_CATEGORIES[questCategory] || 'business' // Default fallback
}

/**
 * Display configuration for each scoring category
 */
export const CATEGORY_DISPLAY = {
  business: {
    name: 'Business',
    icon: '💼',
    color: '#5e17eb',  // Brand purple
    description: 'Project progression, stage tasks, and discovery flows'
  },
  healing: {
    name: 'Healing',
    icon: '💚',
    color: '#10b981',  // Emerald
    description: 'Personal development and self-awareness'
  },
  courage: {
    name: 'Courage',
    icon: '🦁',
    color: '#E9A23B',  // Brand gold
    description: 'Visibility challenges and facing fears'
  }
}

/**
 * Get display info for a scoring category
 * @param {string} scoringCategory - 'business', 'healing', or 'courage'
 * @returns {object} - Display info with name, icon, color, description
 */
export const getCategoryDisplay = (scoringCategory) => {
  return CATEGORY_DISPLAY[scoringCategory] || CATEGORY_DISPLAY.business
}

/**
 * Calculate total score from category scores
 * @param {object} scores - Object with business_score, healing_score, courage_score
 * @returns {number} - Total score
 */
export const calculateTotalScore = (scores) => {
  return (scores?.business_score || 0) +
         (scores?.healing_score || 0) +
         (scores?.courage_score || 0)
}

/**
 * Format scores for display
 * @param {object} scores - Object with business_score, healing_score, courage_score
 * @returns {object} - Formatted scores with display info
 */
export const formatScoresForDisplay = (scores) => {
  return {
    business: {
      ...CATEGORY_DISPLAY.business,
      score: scores?.business_score || 0
    },
    healing: {
      ...CATEGORY_DISPLAY.healing,
      score: scores?.healing_score || 0
    },
    courage: {
      ...CATEGORY_DISPLAY.courage,
      score: scores?.courage_score || 0
    },
    total: calculateTotalScore(scores)
  }
}

/**
 * All scoring category keys
 */
export const SCORING_CATEGORY_KEYS = ['business', 'healing', 'courage']

/**
 * Sync points to the leaderboard scoring system
 *
 * This is a NON-BLOCKING helper - failures are logged but don't throw.
 * Use this whenever points are awarded to ensure they appear on leaderboards.
 *
 * @param {object} supabase - Supabase client instance
 * @param {object} params - Score parameters
 * @param {string} params.userId - User ID
 * @param {string} params.questCategory - Quest category (e.g., 'Business', 'Healing', 'Groans')
 * @param {number} params.points - Points to add
 * @param {string|null} params.projectId - Optional project ID (null for user-level)
 * @param {string} params.source - Source for logging (e.g., 'tab_bonus', 'flow_finder')
 * @param {string|null} params.weekStart - Optional week start date (YYYY-MM-DD) for timezone consistency
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const syncScoreToLeaderboard = async (supabase, {
  userId,
  questCategory,
  points,
  projectId = null,
  source = 'unknown',
  weekStart = null
}) => {
  if (!userId || !points || points <= 0) {
    console.warn(`[syncScore] Invalid params: userId=${userId}, points=${points}`)
    return { success: false, error: 'Invalid parameters' }
  }

  const scoringCategory = getScoringCategory(questCategory)

  try {
    const { data, error } = await supabase.rpc('increment_scores', {
      p_user_id: userId,
      p_project_id: projectId,
      p_category: scoringCategory,
      p_points: points,
      p_week_start: weekStart || getWeekStartDate()
    })

    if (error) {
      console.error(`[syncScore] RPC error (${source}):`, error)
      return { success: false, error: error.message }
    }

    console.log(`[syncScore] ✓ ${points}pts → ${scoringCategory} (${source})`)
    return { success: true, data }
  } catch (err) {
    console.error(`[syncScore] Exception (${source}):`, err)
    return { success: false, error: err.message }
  }
}

export default {
  SCORING_CATEGORIES,
  getScoringCategory,
  CATEGORY_DISPLAY,
  getCategoryDisplay,
  calculateTotalScore,
  formatScoresForDisplay,
  SCORING_CATEGORY_KEYS,
  getWeekStartDate,
  syncScoreToLeaderboard
}
