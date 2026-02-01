/**
 * Version Check Utility
 *
 * Clears stale localStorage data when app version changes.
 * This ensures returning users get fresh experiences after updates.
 *
 * Increment APP_VERSION when you want to force a cache clear.
 */

// Increment this when you want to clear user localStorage
// Format: YYYY.MM.DD or semantic versioning
const APP_VERSION = '2026.02.01'

const VERSION_KEY = 'findmyflow_app_version'

// Keys to clear on version change (stale UI data)
const KEYS_TO_CLEAR_ON_VERSION_CHANGE = [
  // Onboarding flags
  'profile_onboarding_seen_',
  'onboarding_v2_progress_',

  // Flow state that may be stale
  'see_your_flow_',
  'flow_compass_',

  // Challenge state
  'challenge_filters_',
]

// Keys to ALWAYS preserve (user preferences, not UI state)
const KEYS_TO_PRESERVE = [
  'supabase.',
  'sb-',
]

export function checkAppVersion() {
  const storedVersion = localStorage.getItem(VERSION_KEY)

  if (storedVersion !== APP_VERSION) {
    console.log(`[VersionCheck] App updated: ${storedVersion || 'none'} → ${APP_VERSION}`)
    clearStaleLocalStorage()
    localStorage.setItem(VERSION_KEY, APP_VERSION)
    return true // Version changed
  }

  return false // Same version
}

function clearStaleLocalStorage() {
  const keysToRemove = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue

    // Skip preserved keys (auth, etc.)
    const shouldPreserve = KEYS_TO_PRESERVE.some(prefix => key.startsWith(prefix))
    if (shouldPreserve) continue

    // Check if this key should be cleared
    const shouldClear = KEYS_TO_CLEAR_ON_VERSION_CHANGE.some(prefix => key.includes(prefix))
    if (shouldClear) {
      keysToRemove.push(key)
    }
  }

  // Remove stale keys
  keysToRemove.forEach(key => {
    console.log(`[VersionCheck] Clearing stale key: ${key}`)
    localStorage.removeItem(key)
  })

  if (keysToRemove.length > 0) {
    console.log(`[VersionCheck] Cleared ${keysToRemove.length} stale localStorage keys`)
  }
}

export default checkAppVersion
