/**
 * Shared constants for splinter/felt-body tracking.
 * Used by SplinterCheckin, HealingIntentionSetter, HealingIntentionCheckin.
 */

export const SHAPES = ['spike', 'knot', 'weight', 'wall', 'void', 'cloud', 'flame', 'ball']
export const SIZES = ['tiny', 'small', 'medium', 'large', 'massive']
export const COLORS = [
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#6b7280', label: 'Grey' },
  { value: '#1f2937', label: 'Black' },
]
export const TEXTURES = ['rough', 'smooth', 'burning', 'cold', 'sharp', 'heavy', 'tight']
export const MOVEMENTS = ['still', 'pulsing', 'spinning', 'expanding', 'contracting', 'vibrating']
export const BODY_ZONES = ['head', 'throat', 'chest', 'stomach', 'hips', 'left_arm', 'right_arm', 'thighs']
