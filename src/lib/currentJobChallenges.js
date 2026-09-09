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
    { value: '1', label: 'Not at all' },
    { value: '2', label: 'A bit unusual' },
    { value: '3', label: 'Noticeably different' },
    { value: '4', label: 'Very rare' },
    { value: '5', label: 'I might be the only one' },
  ],
  identity: [
    { value: '1', label: 'Same old me' },
    { value: '2', label: 'A small shift' },
    { value: '3', label: 'People would be surprised' },
    { value: '4', label: 'I barely recognize myself' },
    { value: '5', label: 'Old me wouldn\'t believe this' },
  ],
  context: [
    { value: '1', label: 'Home turf' },
    { value: '2', label: 'Mostly familiar' },
    { value: '3', label: 'Mixed' },
    { value: '4', label: 'Mostly foreign' },
    { value: '5', label: 'Nothing familiar' },
  ],
  business_commitment: [
    { value: '0', label: 'Current job' },
    { value: '1', label: 'Hobby / side thing' },
    { value: '2', label: 'First revenue' },
    { value: '3', label: 'Repeatable income' },
    { value: '4', label: 'Full-time' },
    { value: '5', label: 'Team / scale' },
  ],
}

export const DIMENSION_LABELS = {
  people: 'People',
  money: 'Money earned outside salary',
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

export const DIMENSION_DESCRIPTIONS = {
  people: 'How many people are involved?',
  money: 'How much do you earn from this outside of a regular salary?',
  vulnerability: 'How much could you hide?',
  stakes: 'What was at risk?',
  rarity: 'How much did you stand out?',
  identity: 'How different was this from who you used to be?',
  context: 'How familiar were the conditions?',
  business_commitment: 'How deep are you in building a business?',
}

export const OPTION_HINTS = {
  people: {
    '1': 'Just you, no audience or team.',
    '2_5': 'A small team or a few clients.',
    '6_20': 'A class, workshop, or mid-sized group.',
    '20_50': 'A large room, event, or department.',
    '50_plus': 'A crowd, conference, or online audience.',
  },
  money: {
    '0': 'No money from this yet.',
    '10_50': 'Enough for a coffee or two.',
    '50_200': 'A nice dinner out.',
    '200_1000': 'Covers a bill or two.',
    '1000_plus': 'Real income territory.',
  },
  vulnerability: {
    '1': 'Haven\'t put myself out there yet, or completely hidden.',
    '2': 'Your name attached but behind structure.',
    '3': 'In person or on camera, within a professional context.',
    '4': 'Just you, no preparation or role to fall back on.',
    '5': 'Reveals something normally private (body, raw ability, deep beliefs).',
  },
  stakes: {
    '1': 'Haven\'t put anything on the line yet.',
    '2': 'Embarrassment, rejection, small money lost.',
    '3': 'Reputation, meaningful money, relationship strained.',
    '4': 'Significant money, career move, hard to undo.',
  },
  rarity: {
    '1': 'I haven\'t started.',
    '2': 'My peers would get it, most people wouldn\'t.',
    '3': 'People noticed.',
    '4': 'Almost nobody does this.',
    '5': 'Nobody\'s done this before.',
  },
  identity: {
    '1': 'I haven\'t started.',
    '2': 'Slightly out of character.',
    '3': 'My friends would say "that\'s not like you".',
    '4': 'I surprised even myself.',
    '5': 'Complete reinvention.',
  },
  context: {
    '1': 'Haven\'t left familiar territory yet.',
    '2': 'Known environment, one new variable.',
    '3': 'Some familiar, some not.',
    '4': 'Multiple unfamiliar factors stacking.',
    '5': 'Different place, people, norms, no safety net.',
  },
  business_commitment: {
    '0': 'You work for someone else right now.',
    '1': 'Something you do for fun on the side.',
    '2': 'You\'ve made your first dollar from it.',
    '3': 'Regular income you can count on.',
    '4': 'This is your livelihood.',
    '5': 'Other people depend on this.',
  },
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
