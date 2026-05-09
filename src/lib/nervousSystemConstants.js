/**
 * Nervous System Check-In constants
 * Shared across GroanCompletionModal, HealingCompletionModal, Challenge.jsx
 */

export const NERVOUS_SYSTEM_STATES = [
  { id: 'vibe_rise', name: 'Vibe Rise', label: 'Alive, activated, safe, fully here', emoji: '⚡' },
  { id: 'ventral', name: 'Safe', label: 'Calm, connected, present', emoji: '😊' },
  { id: 'sympathetic', name: 'Activated', label: 'Activated, buzzing, on edge', emoji: '😬' },
  { id: 'dorsal', name: 'Shutdown', label: 'Heavy, numb, shut down', emoji: '😶' },
]

// Sympathetic (fight/flight)
const SYMPATHETIC_ARCHETYPES = [
  { id: 'Controller', label: 'Controller', icon: '🎮' },
  { id: 'Ghost', label: 'Ghost', icon: '👻' },
  { id: 'People Pleaser', label: 'People Pleaser', icon: '🪞' },
  { id: 'unsure', label: 'Unsure', icon: '🤷' },
]

// Dorsal (freeze/collapse)
const DORSAL_ARCHETYPES = [
  { id: 'Perfectionist', label: 'Perfectionist', icon: '🎭' },
  { id: 'Auto-Pilot', label: 'Auto-Pilot', icon: '🛋️' },
  { id: 'People Pleaser', label: 'People Pleaser', icon: '🪞' },
  { id: 'unsure', label: 'Unsure', icon: '🤷' },
]

export function getArchetypesForState(state) {
  if (state === 'sympathetic') return SYMPATHETIC_ARCHETYPES
  if (state === 'dorsal') return DORSAL_ARCHETYPES
  return []
}

export const needsArchetype = (beforeState, afterState) =>
  beforeState === 'sympathetic' || beforeState === 'dorsal' ||
  afterState === 'sympathetic' || afterState === 'dorsal'
