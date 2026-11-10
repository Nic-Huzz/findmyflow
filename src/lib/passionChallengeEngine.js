// src/lib/passionChallengeEngine.js
// STUB: Full implementation ported in Task 3
// This file exists to satisfy QuestBoardCard and GroanCompletionModal imports during Tasks 1-2.

export const STRIKE_TYPES = [
  { id: 'fight', label: 'Challenge the Norm', desc: 'Take a position. Say what nobody is saying.' },
  { id: 'stunt', label: 'Make Them Look Twice', desc: 'Do something unexpected that makes people go "wait, what?"' },
  { id: 'functional', label: 'Let Them Feel It', desc: 'Prove it works by doing it live. Let people experience the result.' },
  { id: 'culture_creating', label: 'Start a Ritual', desc: 'Create something repeatable that people identify with and spread.' },
]

export async function getGapDimensions(questId) {
  // no-op stub — full version in Task 3
  return []
}

export function getCached(questId) {
  // no-op stub — full version in Task 3
  return null
}

export function invalidate(questId) {
  // no-op stub — full version in Task 3
}

export async function markAccepted(questId, userId) {
  // no-op stub — full version in Task 3
}

export async function markDismissed(questId, userId) {
  // no-op stub — full version in Task 3
}

export async function generate(questId, userId, opts) {
  // no-op stub — full version in Task 3
  return null
}
