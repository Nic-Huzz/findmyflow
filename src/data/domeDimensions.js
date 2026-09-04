/**
 * domeDimensions.js — Central definitions for Dome of Safety
 *
 * Single source of truth for:
 * - 8 NS comfort zone dimensions (replaces old EXPANSION_DIMENSIONS in WahooCreator)
 * - Body-based difficulty scale (for prediction error measurement)
 * - Courage score calculation
 * - Gap calculation (prediction error)
 *
 * Imported by: WahooCreator, QuestBoardCard, ProgressTab, DomeOfSafety,
 *              GroanCompletionModal, useDomeData, domeBusinessModels
 */

// ── 8 Dome Dimensions ──────────────────────────────────────────────

export const DOME_DIMENSIONS = [
  {
    id: 'people',
    label: 'People',
    icon: '👥',
    question: 'How many people were involved or watching?',
    type: 'numeric',
    tiers: [1, 5, 10, 20, 50, 100, 250, 500, 1000, 5000, 10000, 100000],
    maxLevel: 12,
    inputType: 'number',
    placeholder: 'How many people?',
  },
  {
    id: 'money',
    label: 'Money',
    icon: '💰',
    question: 'How much did you ask someone to pay?',
    type: 'numeric',
    tiers: [0, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000],
    maxLevel: 11,
    inputType: 'money',
    placeholder: 'Amount charged?',
  },
  {
    id: 'vulnerability',
    label: 'Vulnerability',
    icon: '💜',
    question: 'How much could you hide?',
    type: 'qualitative',
    maxLevel: 5,
    levels: [
      { level: 1, label: 'Fully shielded', description: 'Anonymous, scripted, behind a screen, within a team' },
      { level: 2, label: 'Name on it', description: 'Your name is attached but you\'re behind structure' },
      { level: 3, label: 'Face visible', description: 'In person or on camera, but within a professional context' },
      { level: 4, label: 'Unscripted', description: 'Just you, no preparation or role to fall back on' },
      { level: 5, label: 'Unmasked', description: 'Reveals a part of you that\'s normally private' },
    ],
  },
  {
    id: 'stakes',
    label: 'Stakes',
    icon: '⚖️',
    question: 'What was at risk?',
    type: 'qualitative',
    maxLevel: 4,
    levels: [
      { level: 1, label: 'Nothing to lose', description: 'Worst case, it\'s awkward for a moment' },
      { level: 2, label: 'Ego on the line', description: 'Embarrassment, rejection, small money lost' },
      { level: 3, label: 'Real consequences', description: 'Reputation, meaningful money, relationship strained' },
      { level: 4, label: 'Major bet', description: 'Significant money, career move, hard to undo' },
    ],
  },
  {
    id: 'rarity',
    label: 'Rarity',
    icon: '✦',
    question: 'How normal is this in the world?',
    type: 'qualitative',
    maxLevel: 5,
    levels: [
      { level: 1, label: 'Everyone does this', description: 'Normal, socially accepted, proven path' },
      { level: 2, label: 'Common in your world', description: 'Your peers do it, but mainstream wouldn\'t' },
      { level: 3, label: 'Uncommon', description: 'Some people do it, but you\'d have to explain it' },
      { level: 4, label: 'Rare', description: 'Most people have never seen this done' },
      { level: 5, label: 'Unheard of', description: 'You might be the first, no blueprint exists' },
    ],
  },
  {
    id: 'identity',
    label: 'Identity',
    icon: '🪞',
    question: 'How much does this feel like you?',
    type: 'qualitative',
    maxLevel: 5,
    levels: [
      { level: 1, label: 'Nobody blinks', description: 'This is obviously you, no one questions it' },
      { level: 2, label: 'Raised eyebrows', description: 'People notice, it\'s slightly unexpected' },
      { level: 3, label: '"That\'s not like you"', description: 'People close to you call it out' },
      { level: 4, label: '"What happened to you?"', description: 'People genuinely don\'t recognise this version' },
      { level: 5, label: 'You become the story', description: 'People talk about it when you\'re not in the room' },
    ],
  },
  {
    id: 'context',
    label: 'Context',
    icon: '🧭',
    question: 'How familiar were the conditions?',
    type: 'qualitative',
    maxLevel: 5,
    levels: [
      { level: 1, label: 'Home turf', description: 'Your space, your people, your routine' },
      { level: 2, label: 'Mostly familiar', description: 'Known environment, one new variable' },
      { level: 3, label: 'Mixed', description: 'Some things familiar, some not' },
      { level: 4, label: 'Mostly foreign', description: 'Multiple unfamiliar factors stacking' },
      { level: 5, label: 'Nothing familiar', description: 'Different place, people, norms, no safety net' },
    ],
  },
  {
    id: 'business_commitment',
    label: 'Business',
    icon: '📈',
    question: 'How deep are you in building a business?',
    type: 'qualitative',
    maxLevel: 5,
    levels: [
      { level: 1, label: 'Hobby / side thing', description: 'No real business structure, doing it for fun' },
      { level: 2, label: 'First revenue', description: 'You\'ve charged someone, at least once' },
      { level: 3, label: 'Repeatable income', description: 'Regular clients or customers, it works' },
      { level: 4, label: 'Full-time', description: 'This is your livelihood' },
      { level: 5, label: 'Team / scale', description: 'Other people depend on this business' },
    ],
  },
]

// ── Body-Based Difficulty Scale (Prediction Error) ──────────────────

export const DIFFICULTY_SCALE = [
  { level: 1, label: 'Relaxed', description: 'Nothing changes in my body', icon: '😌' },
  { level: 2, label: 'Alert', description: 'I notice something but it\'s manageable', icon: '👀' },
  { level: 3, label: 'Butterflies', description: 'My stomach or chest tightens', icon: '🦋' },
  { level: 4, label: 'Racing', description: 'Heart rate up, hard to think straight', icon: '💓' },
  { level: 5, label: 'Frozen', description: 'I want to run or shut down', icon: '🥶' },
]

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Look up a dimension by ID.
 * Returns undefined for unknown IDs (backwards compat with old dimensions).
 */
export function getDimensionById(id) {
  return DOME_DIMENSIONS.find(d => d.id === id)
}

/**
 * For numeric dimensions (people, money): convert a raw number to a tier level.
 * Uses the same pattern as creatorGamification.js getAxisTier.
 * Returns 0 if below minimum tier.
 *
 * Example: getNumericTier('people', 50) → 5
 *          getNumericTier('money', 200) → 6
 */
export function getNumericTier(dimensionId, rawValue) {
  const dim = getDimensionById(dimensionId)
  if (!dim || dim.type !== 'numeric' || rawValue == null) return 0
  for (let i = dim.tiers.length - 1; i >= 0; i--) {
    if (rawValue >= dim.tiers[i]) return i + 1
  }
  return 0
}

/**
 * Calculate courage score for a single challenge.
 *
 * Formula: sum(level / maxLevel) for each tagged dimension.
 * Each dimension contributes 0 to 1.0. Max possible = 8.0.
 *
 * For numeric dimensions, the raw value is converted to a tier first.
 *
 * @param {Object} dimensionValues - { people: 50, vulnerability: 4, stakes: 3, ... }
 * @returns {number} Courage score (0 to 8.0)
 */
export function calculateCourageScore(dimensionValues) {
  if (!dimensionValues || typeof dimensionValues !== 'object') return 0

  let score = 0
  for (const [dimId, value] of Object.entries(dimensionValues)) {
    const dim = getDimensionById(dimId)
    if (!dim) continue

    let level
    if (dim.type === 'numeric') {
      level = getNumericTier(dimId, value)
    } else {
      level = value
    }

    score += Math.min(level, dim.maxLevel) / dim.maxLevel
  }

  return Math.round(score * 100) / 100 // round to 2 decimal places
}

/**
 * Calculate prediction error gap.
 * Positive gap = the action was easier than predicted (learning happened).
 * Zero or negative = prediction was accurate or it was harder than expected.
 *
 * @param {number} predicted - 1-5
 * @param {number} experienced - 1-5
 * @returns {number} Gap (0 to 4, clamped to non-negative)
 */
export function calculateGap(predicted, experienced) {
  if (predicted == null || experienced == null) return null
  return Math.max(0, predicted - experienced)
}

/**
 * Get the difficulty scale label for a level.
 * @param {number} level - 1-5
 * @returns {{ label: string, icon: string } | null}
 */
export function getDifficultyLabel(level) {
  return DIFFICULTY_SCALE.find(d => d.level === level) || null
}
