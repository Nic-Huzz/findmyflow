/**
 * Codex Configuration
 *
 * The Codex is a progressive lore library that unlocks as users advance.
 * Each entry has unlock conditions that are checked against user progress.
 */

export const CODEX_CATEGORIES = {
  voiceArchives: {
    id: 'voiceArchives',
    name: 'Voice Archives',
    icon: '📜',
    description: 'Deep profiles of each Protective Voice',
    order: 1,
  },
  flowScrolls: {
    id: 'flowScrolls',
    name: 'Flow Scrolls',
    icon: '⚡',
    description: 'Core teachings of the Vibe Rise philosophy',
    order: 2,
  },
  founderJourney: {
    id: 'founderJourney',
    name: "Founder's Journey",
    icon: '🏔️',
    description: "Huzz's stories from 5 years of transformation",
    order: 3,
  },
  ancientWisdom: {
    id: 'ancientWisdom',
    name: 'Ancient Wisdom',
    icon: '🌏',
    description: 'Timeless traditions that validate your path',
    order: 4,
  },
}

/**
 * Unlock trigger types
 */
export const UNLOCK_TRIGGERS = {
  // Voice-related
  VOICE_IDENTIFIED: 'voice_identified',           // User identified this as their voice
  VOICE_FACED: 'voice_faced',                     // Completed 3+ Playground challenges targeting this voice

  // Progress-related
  ONBOARDING_COMPLETE: 'onboarding_complete',
  FLOW_FINDER_COMPLETE: 'flow_finder_complete',
  COMPASS_CHECKIN: 'compass_checkin',

  // Playground-related
  PLAYGROUND_COUNT: 'playground_count',           // X total completions
  PLAYGROUND_LAYER: 'playground_layer',           // First completion in specific layer

  // Stage-related
  STAGE_REACHED: 'stage_reached',

  // Time-related
  DAYS_ACTIVE: 'days_active',
}

/**
 * Check if an entry should be unlocked based on user data
 *
 * @param {Object} entry - The codex entry with unlock conditions
 * @param {Object} userData - User progress data
 * @returns {boolean}
 */
export function checkUnlock(entry, userData) {
  const { unlockTrigger, unlockValue, altUnlockTrigger, altUnlockValue } = entry

  // Check primary trigger first, then alt trigger if it exists
  const primaryUnlocked = checkSingleTrigger(unlockTrigger, unlockValue, userData)
  if (primaryUnlocked) return true

  // Check alt trigger if present
  if (altUnlockTrigger) {
    return checkSingleTrigger(altUnlockTrigger, altUnlockValue, userData)
  }

  return false
}

/**
 * Normalize voice name for comparison
 * Handles: "People Pleaser" vs "people-pleaser", "Perfectionist" vs "perfectionist"
 */
function normalizeVoiceName(name) {
  if (!name) return ''
  return name.toLowerCase().replace(/\s+/g, '-')
}

/**
 * Check a single unlock trigger
 */
function checkSingleTrigger(trigger, value, userData) {
  switch (trigger) {
    case UNLOCK_TRIGGERS.VOICE_IDENTIFIED:
      // If value is true, any voice being identified unlocks this
      if (value === true) {
        return !!userData.protectiveVoice
      }
      // Normalize both sides for comparison (handles "People Pleaser" vs "people-pleaser")
      const userVoice = normalizeVoiceName(userData.protectiveVoice)
      const entryVoice = normalizeVoiceName(value)
      console.log('[Codex] Voice check:', { userVoice, entryVoice, match: userVoice === entryVoice })
      return userVoice === entryVoice

    case UNLOCK_TRIGGERS.VOICE_FACED:
      const voiceChallenges = userData.groanChallenges?.filter(
        c => c.voice_targeted === value && c.status === 'completed'
      ) || []
      return voiceChallenges.length >= 3

    case UNLOCK_TRIGGERS.ONBOARDING_COMPLETE:
      return userData.onboardingComplete === true

    case UNLOCK_TRIGGERS.FLOW_FINDER_COMPLETE:
      return userData.flowFinderComplete === true

    case UNLOCK_TRIGGERS.COMPASS_CHECKIN:
      return (userData.compassCheckins || 0) >= 1

    case UNLOCK_TRIGGERS.PLAYGROUND_COUNT:
      const completedChallenges = userData.groanChallenges?.filter(
        c => c.status === 'completed'
      ) || []
      return completedChallenges.length >= value

    case UNLOCK_TRIGGERS.PLAYGROUND_LAYER:
      const layerChallenges = userData.groanChallenges?.filter(
        c => c.visibility_layer === value && c.status === 'completed'
      ) || []
      return layerChallenges.length >= 1

    case UNLOCK_TRIGGERS.STAGE_REACHED:
      return (userData.currentStage || 0) >= value

    case UNLOCK_TRIGGERS.DAYS_ACTIVE:
      return (userData.daysActive || 0) >= value

    default:
      return false
  }
}

/**
 * Get all entries for a category with unlock status
 */
export function getCategoryEntries(categoryId, entries, userData, unlockedIds = []) {
  return entries
    .filter(entry => entry.category === categoryId)
    .map(entry => ({
      ...entry,
      isUnlocked: unlockedIds.includes(entry.id) || checkUnlock(entry, userData),
    }))
    .sort((a, b) => (a.order || 0) - (b.order || 0))
}

/**
 * Get unlock progress for a category
 */
export function getCategoryProgress(categoryId, entries, userData, unlockedIds = []) {
  const categoryEntries = entries.filter(e => e.category === categoryId)
  const unlockedCount = categoryEntries.filter(
    e => unlockedIds.includes(e.id) || checkUnlock(e, userData)
  ).length

  return {
    unlocked: unlockedCount,
    total: categoryEntries.length,
    percentage: Math.round((unlockedCount / categoryEntries.length) * 100),
  }
}

export default {
  CODEX_CATEGORIES,
  UNLOCK_TRIGGERS,
  checkUnlock,
  getCategoryEntries,
  getCategoryProgress,
}
