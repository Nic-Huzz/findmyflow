/**
 * currentJobChallenges.js — Dimension options + context hints for current job quests.
 * No template engine. User writes their own challenges, hints guide them.
 */

export const DIMENSION_OPTIONS = {
  people: [
    { value: 'solo', label: 'Solo' },
    { value: '2_5', label: '2-5 people' },
    { value: '6_20', label: '6-20 people' },
    { value: '20_plus', label: '20+ people' },
  ],
  medium: [
    { value: 'in_person', label: 'In person' },
    { value: 'online', label: 'Online' },
    { value: 'hybrid', label: 'Hybrid' },
  ],
  independence: [
    { value: 'boss_decides', label: 'Boss decides' },
    { value: 'shared', label: 'Shared decisions' },
    { value: 'i_decide', label: 'I decide' },
  ],
  money: [
    { value: 'not_yet', label: 'Not earning from this' },
    { value: 'some', label: 'Some income' },
    { value: 'main_income', label: 'Main income' },
  ],
}

export const DIMENSION_LABELS = {
  people: 'People',
  medium: 'Medium',
  independence: 'Independence',
  money: 'Money',
}

export const DIMENSION_IDS = ['people', 'medium', 'independence', 'money']

/**
 * Returns a context hint for a stressed/bored experience to inspire a courage challenge.
 * @param {string} nsState - 'pressure' | 'growth_edge' | 'bored' | 'uninterested'
 * @returns {string} hint text
 */
export function getContextHint(nsState) {
  if (nsState === 'pressure' || nsState === 'growth_edge') {
    return 'This part of your work stresses you. What would make it feel more like yours? Maybe more say in how you do it, or doing it with someone you trust.'
  }
  return 'This part of your work bores you. What would make it come alive? Maybe a new challenge within it, or connecting it to something you care about.'
}
