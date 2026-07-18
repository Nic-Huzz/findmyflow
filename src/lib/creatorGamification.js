/**
 * Creator Gamification — shared state + utilities for Scale portal gamification.
 *
 * Single localStorage JSON object for all gamification state.
 * Celebration queue with cooldown to prevent rapid-fire confetti.
 * CreatorXP computation from creator-specific data sources.
 */

const STORAGE_KEY = 'scale_gamification'

// ── LocalStorage helpers ────────────────────────────────────────────────────

export function getGamificationState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  catch { return {} }
}

export function updateGamificationState(updates) {
  const current = getGamificationState()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...updates }))
}

// ── Celebration queue ───────────────────────────────────────────────────────

let celebrationQueue = []
let lastCelebrationTime = 0
const COOLDOWN_MS = 3000

export function queueCelebration(fn) {
  celebrationQueue.push(fn)
  processQueue()
}

function processQueue() {
  const now = Date.now()
  const timeSinceLast = now - lastCelebrationTime
  if (timeSinceLast < COOLDOWN_MS && lastCelebrationTime > 0) {
    setTimeout(processQueue, COOLDOWN_MS - timeSinceLast)
    return
  }
  const next = celebrationQueue.shift()
  if (next) {
    lastCelebrationTime = Date.now()
    next()
  }
}

// ── Creator XP ──────────────────────────────────────────────────────────────

/**
 * Creator levels — separate from consumer movementXP.
 */
export const CREATOR_LEVELS = [
  { name: 'Dreamer', threshold: 0 },
  { name: 'Builder', threshold: 50 },
  { name: 'Launcher', threshold: 150 },
  { name: 'Scaler', threshold: 400 },
  { name: 'Movement Maker', threshold: 1000 },
]

export function getCreatorLevel(xp) {
  for (let i = CREATOR_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= CREATOR_LEVELS[i].threshold) return CREATOR_LEVELS[i]
  }
  return CREATOR_LEVELS[0]
}

export function getNextLevel(xp) {
  for (const level of CREATOR_LEVELS) {
    if (xp < level.threshold) return level
  }
  return null // maxed out
}

/**
 * Compute creator XP from available data.
 * Called client-side from CreatorHomeV2 after all data is fetched.
 *
 * @param {object} data - All creator data from CreatorHomeV2 mount queries
 * @returns {number} Total XP
 */
export function computeCreatorXP(data) {
  let xp = 0

  // Playbook stages: 25 XP each
  if (data.hasRemarkableResults) xp += 25
  if (data.hasReach) xp += 25
  if (data.hasGrowth) xp += 25
  if (data.hasScaleScore) xp += 25

  // Experiences created: 10 XP each
  xp += (data.experienceCount || 0) * 10

  // Events run (past experiences): 15 XP each
  xp += (data.pastEventCount || 0) * 15

  // 3% improvements logged: 5 XP each
  xp += (data.threePercentCount || 0) * 5

  // Events filled to 80%+: 20 XP each
  xp += (data.filledEventCount || 0) * 20

  return xp
}

// ── Milestone celebration tracking ──────────────────────────────────────────

/**
 * Check if a milestone has already been celebrated.
 */
export function isCelebrated(milestoneKey) {
  const state = getGamificationState()
  return state.celebrated?.[milestoneKey] === true
}

/**
 * Mark a milestone as celebrated.
 */
export function markCelebrated(milestoneKey) {
  const state = getGamificationState()
  updateGamificationState({
    celebrated: { ...(state.celebrated || {}), [milestoneKey]: true }
  })
}

// ── Staleness nudge tracking ────────────────────────────────────────────────

/**
 * Check if a staleness nudge has been shown today for a given experience.
 */
export function hasShownStaleNudgeToday(experienceId) {
  const state = getGamificationState()
  const today = new Date().toISOString().slice(0, 10)
  return state.stale_nudges?.[experienceId] === today
}

/**
 * Mark staleness nudge as shown today for an experience.
 */
export function markStaleNudgeShown(experienceId) {
  const state = getGamificationState()
  const today = new Date().toISOString().slice(0, 10)
  updateGamificationState({
    stale_nudges: { ...(state.stale_nudges || {}), [experienceId]: today }
  })
}

// ── Spider graph tier calculations ──────────────────────────────────────────

export const SPIDER_AXES = {
  impact: { label: 'Impact', tiers: [10, 50, 100, 250, 500, 1000], unit: 'attendees' },
  consistency: { label: 'Consistency', tiers: [3, 10, 25, 50, 100, 250], unit: 'experiences' },
  retention: { label: 'Retention', tiers: [5, 15, 25, 40, 60, 80], unit: '%' },
  brand: { label: 'Brand', tiers: [1, 3, 5, 7, 10, 13], unit: '/15' },
  price: { label: 'Price', tiers: [20, 50, 100, 250, 500, 1000], unit: '$' },
  reach: { label: 'Reach', tiers: [100, 500, 1000, 5000, 10000, 50000], unit: 'views' },
}

/**
 * Get the tier (0-6) for a given axis value.
 */
export function getAxisTier(axisKey, value) {
  const axis = SPIDER_AXES[axisKey]
  if (!axis || value == null) return 0
  for (let i = axis.tiers.length - 1; i >= 0; i--) {
    if (value >= axis.tiers[i]) return i + 1
  }
  return 0
}
