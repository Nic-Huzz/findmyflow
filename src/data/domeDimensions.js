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
    dreamQuestion: 'How many people do you want to reach per experience?',
    type: 'numeric',
    tiers: [1, 10, 50, 100, 250, 500, 1000, 10000],
    maxLevel: 8,
    inputType: 'number',
    placeholder: 'How many people?',
  },
  {
    id: 'money',
    label: 'Money',
    icon: '💰',
    question: 'How much did you ask someone to pay?',
    dreamQuestion: 'How much do you want to earn per experience or per month?',
    type: 'numeric',
    tiers: [0, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000],
    maxLevel: 10,
    inputType: 'money',
    placeholder: 'Amount charged?',
  },
  {
    id: 'vulnerability',
    label: 'Vulnerability',
    icon: '💜',
    question: 'How much could you hide?',
    dreamQuestion: 'How visible would you need to be?',
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
    dreamQuestion: 'What would you need to put on the line?',
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
    question: 'How much did you stand out?',
    startQuestion: 'How comfortable are you walking this path?',
    dreamQuestion: 'How much would you need to stand out?',
    type: 'qualitative',
    maxLevel: 5,
    levels: [
      { level: 1, label: 'Not at all', description: 'I haven\'t started' },
      { level: 2, label: 'A bit unusual', description: 'My peers would get it, most people wouldn\'t' },
      { level: 3, label: 'Noticeably different', description: 'People noticed' },
      { level: 4, label: 'Very rare', description: 'Almost nobody does this' },
      { level: 5, label: 'I might be the only one', description: 'Nobody\'s done this before' },
    ],
  },
  {
    id: 'identity',
    label: 'Identity',
    icon: '🪞',
    question: 'How different was this from who you used to be?',
    startQuestion: 'How much have you changed on this path so far?',
    dreamQuestion: 'How much would you need to change to live this ambition?',
    type: 'qualitative',
    maxLevel: 5,
    levels: [
      { level: 1, label: 'Same old me', description: 'I haven\'t started' },
      { level: 2, label: 'A small shift', description: 'Slightly out of character' },
      { level: 3, label: 'People would be surprised', description: 'My friends would say "that\'s not like you"' },
      { level: 4, label: 'I barely recognize myself', description: 'I surprised even myself' },
      { level: 5, label: 'Old me wouldn\'t believe this', description: 'Complete reinvention' },
    ],
  },
  {
    id: 'context',
    label: 'Context',
    icon: '🧭',
    question: 'How familiar were the conditions?',
    dreamQuestion: 'How unfamiliar would the conditions be?',
    type: 'qualitative',
    maxLevel: 5,
    // Context = ALL surrounding conditions: physical place, platform, format, support structure, delivery method.
    // NOT just geography. A new platform or format counts as unfamiliar context.
    levels: [
      { level: 1, label: 'Home turf', description: 'Your space, your people, your platform, your routine' },
      { level: 2, label: 'Mostly familiar', description: 'Known setup, one new variable (new format, new venue, or solo for the first time)' },
      { level: 3, label: 'Mixed', description: 'Some things familiar, some not (known format + new city, or new platform + familiar audience)' },
      { level: 4, label: 'Mostly foreign', description: 'Multiple unfamiliar factors stacking' },
      { level: 5, label: 'Nothing familiar', description: 'Different place, people, norms, no safety net' },
    ],
  },
  {
    id: 'business_commitment',
    label: 'Business',
    icon: '📈',
    question: 'How deep are you in building a business?',
    dreamQuestion: 'How far would you need to build this?',
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

// ── Dimension → Value Inference (Values Assist in Healing Flow Step 5) ────

export const DIMENSION_VALUES = {
  people: { value: 'Connection', description: 'Impact, being heard, reaching people' },
  money: { value: 'Building', description: 'Investing in yourself and what you\'re creating' },
  vulnerability: { value: 'Authenticity', description: 'Being seen as you really are' },
  stakes: { value: 'Commitment', description: 'Betting on yourself, putting skin in the game' },
  rarity: { value: 'Originality', description: 'Creating your own path, not following the script' },
  identity: { value: 'Becoming', description: 'Growing into someone new, reinventing yourself' },
  context: { value: 'Adventure', description: 'Expanding your world, leaving the familiar' },
  business_commitment: { value: 'Purpose', description: 'Making it real, building something that matters' },
}

/**
 * Infer top values from a user's dome data.
 * Looks at which dimensions the user pushes most frequently.
 *
 * @param {Object} dimensionCounts - { dimId: count } from completed challenges
 * @param {number} topN - how many values to return (default 3)
 * @returns {{ value: string, description: string, dimension: string, count: number }[]}
 */
export function inferValues(dimensionCounts, topN = 3) {
  if (!dimensionCounts) return []
  return Object.entries(dimensionCounts)
    .filter(([dimId]) => DIMENSION_VALUES[dimId])
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([dimId, count]) => ({
      ...DIMENSION_VALUES[dimId],
      dimension: dimId,
      count,
    }))
}

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
  if (rawValue <= 0) return 0
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
