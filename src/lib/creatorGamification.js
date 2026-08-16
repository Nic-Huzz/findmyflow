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
 * Progression should take MONTHS, not days.
 * Dreamer → Builder: complete positioning work (~2-4 weeks)
 * Builder → Launcher: run first events, get repeat attendees (~1-2 months)
 * Launcher → Scaler: consistent events, growing attendance (~3-6 months)
 * Scaler → Movement Maker: scaled, high repeat, community forming (~6-12 months)
 */
export const CREATOR_LEVELS = [
  { name: 'Dreamer', threshold: 0 },
  { name: 'Builder', threshold: 200 },
  { name: 'Launcher', threshold: 600 },
  { name: 'Scaler', threshold: 1500 },
  { name: 'Movement Maker', threshold: 4000 },
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
 * Compute creator XP from meaningful milestones.
 * Called client-side from CreatorHomeV2 after all data is fetched.
 *
 * Principle: XP for tasks COMPLETED, not for clicking buttons.
 * Creating an empty experience = 0 XP. Running it with attendees = XP.
 * Completing a playbook stage = XP. But the real XP comes from DOING the work.
 *
 * @param {object} data - All creator data from CreatorHomeV2 mount queries
 * @returns {number} Total XP
 */
export function computeCreatorXP(data) {
  let xp = 0

  // ── POSITIONING MILESTONES (one-time, ~200 XP total) ──
  // Finding your rule break is the hardest intellectual work
  if (data.hasRemarkableResults) xp += 50    // Found your rule break
  if (data.hasReach) xp += 30               // Mapped your vehicle + language
  if (data.hasGrowth) xp += 30              // Audited your barriers
  if (data.hasScaleScore) xp += 40          // Scored your Phase 3 readiness
  if (data.hasPositioning) xp += 50         // Generated positioning statement

  // ── EXPERIENCE MILESTONES (earned through action) ──
  // Creating is easy. Running is hard. Filling is harder. Retaining is hardest.
  // No XP for creating experiences — only for running them
  const pastEvents = data.pastEventCount || 0
  if (pastEvents >= 1) xp += 30             // First event run
  if (pastEvents >= 3) xp += 40             // Consistent (3 events)
  if (pastEvents >= 5) xp += 50             // Committed (5 events)
  if (pastEvents >= 10) xp += 80            // Dedicated (10 events)
  if (pastEvents >= 20) xp += 120           // Veteran (20 events)

  // Fill rate milestones (quality, not quantity)
  const filledEvents = data.filledEventCount || 0    // events at 80%+ capacity
  if (filledEvents >= 1) xp += 30           // First sold-out event
  if (filledEvents >= 3) xp += 50           // Consistent fill
  if (filledEvents >= 5) xp += 80           // Reliable fill

  // Repeat attendees (the hardest metric — means the experience WORKS)
  const repeatRate = data.repeatRate || 0
  if (repeatRate >= 20) xp += 40            // Some come back
  if (repeatRate >= 40) xp += 60            // Strong retention
  if (repeatRate >= 60) xp += 100           // Exceptional retention

  // ── COMPOUNDING MILESTONES (3% improvements) ──
  // Each 3% improvement shows the creator is learning from each event
  const improvements = data.threePercentCount || 0
  if (improvements >= 1) xp += 15           // First improvement logged
  if (improvements >= 3) xp += 25           // Compounding habit
  if (improvements >= 5) xp += 35           // Systematic improver
  if (improvements >= 10) xp += 50          // Relentless iteration

  // ── COMMUNITY MILESTONES (when others want to do what you do) ──
  const totalAttendees = data.totalAttendees || 0
  if (totalAttendees >= 10) xp += 20        // First 10 people impacted
  if (totalAttendees >= 50) xp += 40        // 50 people
  if (totalAttendees >= 100) xp += 60       // 100 people
  if (totalAttendees >= 500) xp += 100      // Community scale

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

// ── Hidden Achievements ────────────────────────────────────────────────────

/**
 * 8 secret milestones. Nobody knows they exist until they pop.
 * Different from regular celebrations: trophy icon, "Achievement Unlocked" header.
 */
export const HIDDEN_ACHIEVEMENTS = [
  {
    key: 'polymath',
    name: 'Polymath',
    icon: '🧠',
    toast: 'All 4 playbook stages complete. You see the whole picture now.',
    check: d => d.hasRemarkableResults && d.hasReach && d.hasGrowth && d.hasScaleScore,
  },
  {
    key: 'cult_leader',
    name: 'Cult Leader',
    icon: '🔥',
    toast: '3 people came back for more. That is not luck. That is a pull.',
    check: d => d.repeatAttendeeCount >= 3,
  },
  {
    key: 'ach_sold_out',
    name: 'Sold Out',
    icon: '🎟️',
    toast: 'No seats left. You filled the room.',
    check: d => d.hasSoldOut,
  },
  {
    key: 'chain_reactor',
    name: 'Chain Reactor',
    icon: '⛓️',
    toast: '3 improvements in a row. Compounding has started.',
    check: d => d.threePercentCount >= 3,
  },
  {
    key: 'origin_story',
    name: 'Origin Story',
    icon: '📖',
    toast: 'You mapped your origin. The wound became the work.',
    check: d => d.hasWoundMap,
  },
  {
    key: 'night_owl',
    name: 'Night Owl',
    icon: '🦉',
    toast: "Building after midnight. That's not hustle. That's obsession.",
    check: () => { const h = new Date().getHours(); return h >= 23 || h < 5 },
  },
  {
    key: 'full_stack',
    name: 'Full Stack',
    icon: '🏗️',
    toast: 'Identity found. Experience created. Growth tracked. The full loop.',
    check: d => d.hasRemarkableResults && d.experienceCount > 0 && d.threePercentCount > 0,
  },
  {
    key: 'century',
    name: 'Century',
    icon: '💯',
    toast: '100 people. You are building a movement.',
    check: d => d.totalAttendees >= 100,
  },
]

/**
 * Get all unlocked achievements.
 */
export function getUnlockedAchievements() {
  const state = getGamificationState()
  return Object.keys(state.achievements || {})
}

/**
 * Check if an achievement has been unlocked.
 */
export function isAchievementUnlocked(achievementKey) {
  const state = getGamificationState()
  return state.achievements?.[achievementKey] === true
}

/**
 * Mark an achievement as unlocked.
 */
export function markAchievementUnlocked(achievementKey) {
  const state = getGamificationState()
  updateGamificationState({
    achievements: { ...(state.achievements || {}), [achievementKey]: true }
  })
}

// ── Building Streak ────────────────────────────────────────────────────────

/**
 * Weekly building streak. Forgiving: 1 miss allowed before streak breaks.
 *
 * A "building week" = any week where the creator did at least one growth action:
 * created experience, ran pipeline task, logged 3% note, or completed playbook stage.
 *
 * Streak state: { current, best, lastActiveWeek, missUsed }
 */

function getWeekNumber(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const yearStart = new Date(d.getFullYear(), 0, 4)
  return `${d.getFullYear()}-W${String(Math.ceil(((d - yearStart) / 86400000 + yearStart.getDay() + 1) / 7)).padStart(2, '0')}`
}

function weekToDate(weekStr) {
  // Convert "2026-W29" to the Monday of that ISO week
  const [year, week] = weekStr.split('-W').map(Number)
  const jan4 = new Date(year, 0, 4) // Jan 4 is always in ISO week 1
  const dayOfWeek = jan4.getDay() || 7 // Convert Sunday=0 to 7
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7)
  return monday
}

function weekDiff(weekA, weekB) {
  const dateA = weekToDate(weekA)
  const dateB = weekToDate(weekB)
  return Math.round((dateA - dateB) / (7 * 24 * 60 * 60 * 1000))
}

/**
 * Compute the building streak from gamification state.
 * Call updateBuildingStreak() first to ensure state is current.
 */
export function getBuildingStreak() {
  const state = getGamificationState()
  return {
    current: state.streak?.current || 0,
    best: state.streak?.best || 0,
    lastActiveWeek: state.streak?.lastActiveWeek || null,
    missUsed: state.streak?.missUsed || false,
  }
}

/**
 * Record activity for the current week and update the streak.
 * Called when the portal detects creator activity this week.
 *
 * @param {boolean} hasActivityThisWeek - Whether any growth action happened this week
 * @returns {{ current, best, justBroke, milestone }} Streak result
 */
export function updateBuildingStreak(hasActivityThisWeek) {
  const state = getGamificationState()
  const streak = state.streak || { current: 0, best: 0, lastActiveWeek: null, missUsed: false }
  const currentWeek = getWeekNumber()

  // Already recorded this week — no-op
  if (streak.lastActiveWeek === currentWeek) {
    return { current: streak.current, best: streak.best, justBroke: false, milestone: null }
  }

  if (!hasActivityThisWeek) {
    return { current: streak.current, best: streak.best, justBroke: false, milestone: null }
  }

  const gap = streak.lastActiveWeek ? weekDiff(currentWeek, streak.lastActiveWeek) : null

  let newStreak = { ...streak }
  let justBroke = false

  if (gap === null || gap === 1) {
    // First week or consecutive — extend streak
    newStreak.current = (newStreak.current || 0) + 1
    newStreak.missUsed = false
  } else if (gap === 2 && !streak.missUsed) {
    // Missed 1 week, forgiveness applies — extend streak
    newStreak.current = (newStreak.current || 0) + 1
    newStreak.missUsed = true
  } else {
    // Gap too large or forgiveness already used — streak breaks
    justBroke = newStreak.current >= 3
    newStreak.current = 1
    newStreak.missUsed = false
  }

  newStreak.lastActiveWeek = currentWeek
  newStreak.best = Math.max(newStreak.best, newStreak.current)

  updateGamificationState({ streak: newStreak })

  // Check milestones
  const milestones = [4, 8, 12, 20, 52]
  const milestone = milestones.find(m => newStreak.current === m) || null

  return { current: newStreak.current, best: newStreak.best, justBroke, milestone }
}

// ── Spider Graph Tier Tracking ─────────────────────────────────────────────

/**
 * Compare current spider tiers to previously stored tiers.
 * Returns array of { axisKey, axisLabel, oldTier, newTier } for any upgrades.
 */
export function checkSpiderTierUpgrades(currentTiers) {
  const state = getGamificationState()
  const stored = state.spiderTiers || {}
  const upgrades = []

  for (const [key, newTier] of Object.entries(currentTiers)) {
    const oldTier = stored[key] || 0
    if (newTier > oldTier) {
      const axis = SPIDER_AXES[key]
      upgrades.push({
        axisKey: key,
        axisLabel: axis?.label || key,
        oldTier,
        newTier,
      })
    }
  }

  return upgrades
}

/**
 * Store current spider tiers so future visits can detect upgrades.
 */
export function storeSpiderTiers(currentTiers) {
  updateGamificationState({ spiderTiers: currentTiers })
}

// ── Spider graph tier calculations ──────────────────────────────────────────

export const SPIDER_AXES = {
  impact: { label: 'Impact', tiers: [10, 50, 100, 250, 500, 1000], unit: 'attendees' },
  consistency: { label: 'Consistency', tiers: [3, 10, 25, 50, 100, 250], unit: 'experiences' },
  retention: { label: 'Retention', tiers: [5, 15, 25, 40, 60, 80], unit: '%' },
  brand: { label: 'Brand', tiers: [1, 3, 5, 7, 10, 13], unit: '/15' },
  price: { label: 'Price', tiers: [20, 50, 100, 250, 500, 1000], unit: 'usd' },
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
