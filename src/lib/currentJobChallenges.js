/**
 * currentJobChallenges.js — Dimension options + context hints for current job quests.
 * Aligned with Dome of Safety 8-dimension spec (docs/features/dome-of-safety-spec.md).
 */

export const DIMENSION_OPTIONS = {
  people: [
    { value: '1', label: '1 (solo)' },
    { value: '2_5', label: '2-5' },
    { value: '6_20', label: '6-20' },
    { value: '20_50', label: '20-50' },
    { value: '50_plus', label: '50+' },
  ],
  money: [
    { value: '0', label: '$0' },
    { value: '10_50', label: '$10-50' },
    { value: '50_200', label: '$50-200' },
    { value: '200_1000', label: '$200-1,000' },
    { value: '1000_plus', label: '$1,000+' },
  ],
  vulnerability: [
    { value: '1', label: 'Fully shielded' },
    { value: '2', label: 'Name on it' },
    { value: '3', label: 'Face visible' },
    { value: '4', label: 'Unscripted' },
    { value: '5', label: 'Unmasked' },
  ],
  stakes: [
    { value: '1', label: 'Nothing to lose' },
    { value: '2', label: 'Ego on the line' },
    { value: '3', label: 'Real consequences' },
    { value: '4', label: 'Major bet' },
  ],
  rarity: [
    { value: '1', label: 'Everyone does this' },
    { value: '2', label: 'Common in your world' },
    { value: '3', label: 'Uncommon' },
    { value: '4', label: 'Rare' },
    { value: '5', label: 'Unheard of' },
  ],
  identity: [
    { value: '1', label: 'Nobody blinks' },
    { value: '2', label: 'Raised eyebrows' },
    { value: '3', label: '"Not like you"' },
    { value: '4', label: '"What happened?"' },
    { value: '5', label: 'You become the story' },
  ],
  context: [
    { value: '1', label: 'Home turf' },
    { value: '2', label: 'Mostly familiar' },
    { value: '3', label: 'Mixed' },
    { value: '4', label: 'Mostly foreign' },
    { value: '5', label: 'Nothing familiar' },
  ],
  business_commitment: [
    { value: '1', label: 'Hobby / side thing' },
    { value: '2', label: 'First revenue' },
    { value: '3', label: 'Repeatable income' },
    { value: '4', label: 'Full-time' },
    { value: '5', label: 'Team / scale' },
  ],
}

export const DIMENSION_LABELS = {
  people: 'People',
  money: 'Money',
  vulnerability: 'Vulnerability',
  stakes: 'Stakes',
  rarity: 'Rarity',
  identity: 'Identity',
  context: 'Context',
  business_commitment: 'Business Commitment',
}

export const DIMENSION_ICONS = {
  people: '👥',
  money: '💰',
  vulnerability: '💜',
  stakes: '⚖️',
  rarity: '✦',
  identity: '🪞',
  context: '🧭',
  business_commitment: '📈',
}

export const DIMENSION_IDS = ['people', 'money', 'vulnerability', 'stakes', 'rarity', 'identity', 'context', 'business_commitment']

/**
 * Returns a context hint for a stressed/bored experience to inspire a courage challenge.
 */
export function getContextHint(nsState) {
  if (nsState === 'pressure' || nsState === 'growth_edge') {
    return 'This part of your work stresses you. What would make it feel more like yours? Maybe more say in how you do it, or doing it with someone you trust.'
  }
  return 'This part of your work bores you. What would make it come alive? Maybe a new challenge within it, or connecting it to something you care about.'
}
