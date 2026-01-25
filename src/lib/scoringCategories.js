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

// Map quest categories to scoring categories
export const SCORING_CATEGORIES = {
  // Business score
  'Business': 'business',
  'Flow Finder': 'business',
  'Bonus': 'business', // Engagement activities (feedback, referrals, etc.)

  // Healing score
  'Healing': 'healing',
  'Tracker': 'healing',
  'Daily': 'healing',
  'Weekly': 'healing',

  // Courage score
  'Groans': 'courage'
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

export default {
  SCORING_CATEGORIES,
  getScoringCategory,
  CATEGORY_DISPLAY,
  getCategoryDisplay,
  calculateTotalScore,
  formatScoresForDisplay,
  SCORING_CATEGORY_KEYS
}
