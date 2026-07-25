/**
 * ghostConfig.js — Ghost Self League constants
 * Reuses FANTASY_CATEGORIES from leagueConfig for category definitions.
 */
import { FANTASY_CATEGORIES, CATEGORY_KEYS, CONTENT_POINT_VALUES } from '../league/leagueConfig'

// Re-export what the ghost system needs from league config
export { FANTASY_CATEGORIES, CATEGORY_KEYS, CONTENT_POINT_VALUES }

// Auto-approve content types only (no admin review in ghost mode)
export const GHOST_CONTENT_TYPES = Object.fromEntries(
  Object.entries(CONTENT_POINT_VALUES).filter(([, v]) => v.autoApprove)
)

// Ghost decay rates — applied to ghost scores when user loses consecutive weeks
export const GHOST_DECAY = {
  1: 0.75,  // 25% reduction after 1 consecutive loss
  2: 0.50,  // 50% reduction after 2 consecutive losses
}
// 3+ consecutive losses = full reset to zero (handled in applyDecay)
export const GHOST_DECAY_RESET_THRESHOLD = 3

// Day names for display (ISO week: Monday = 0)
export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
