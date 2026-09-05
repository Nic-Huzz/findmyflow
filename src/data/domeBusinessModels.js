/**
 * domeBusinessModels.js — Business model dome minimums.
 *
 * Each model has minimum dome edge requirements per dimension.
 * For numeric dims (people, money), minimums are raw values (not tiers).
 * For qualitative dims, minimums are level indices (1-5).
 *
 * V1: binary ready/not-ready only. No specific gap messaging.
 */

import { getNumericTier } from './domeDimensions'

export const BUSINESS_MODELS = [
  {
    id: 'one_on_one',
    label: '1:1 Sessions',
    icon: '🧑‍🤝‍🧑',
    minimums: { people: 1, money: 20, vulnerability: 2, stakes: 1, rarity: 1, identity: 1, context: 1, business_commitment: 2 },
  },
  {
    id: 'per_session',
    label: 'Per Session',
    icon: '🎤',
    minimums: { people: 5, money: 20, vulnerability: 2, stakes: 2, rarity: 1, identity: 1, context: 1, business_commitment: 2 },
  },
  {
    id: 'group_program',
    label: 'Group Program',
    icon: '👥',
    minimums: { people: 8, money: 100, vulnerability: 3, stakes: 3, rarity: 2, identity: 2, context: 2, business_commitment: 3 },
  },
  {
    id: 'content',
    label: 'Content',
    icon: '📱',
    minimums: { people: 100, money: 0, vulnerability: 3, stakes: 2, rarity: 2, identity: 3, context: 1, business_commitment: 2 },
  },
  {
    id: 'digital_product',
    label: 'Digital Product',
    icon: '📦',
    minimums: { people: 0, money: 27, vulnerability: 2, stakes: 2, rarity: 1, identity: 2, context: 1, business_commitment: 3 },
  },
  {
    id: 'membership',
    label: 'Membership',
    icon: '🔑',
    minimums: { people: 10, money: 27, vulnerability: 3, stakes: 3, rarity: 2, identity: 2, context: 2, business_commitment: 3 },
  },
  {
    id: 'live_events',
    label: 'Live Events',
    icon: '🎪',
    minimums: { people: 20, money: 50, vulnerability: 3, stakes: 3, rarity: 2, identity: 2, context: 3, business_commitment: 3 },
  },
  {
    id: 'retreat',
    label: 'Retreat',
    icon: '🏔',
    minimums: { people: 10, money: 500, vulnerability: 4, stakes: 4, rarity: 3, identity: 3, context: 4, business_commitment: 4 },
  },
  {
    id: 'certification',
    label: 'Certification',
    icon: '🎓',
    minimums: { people: 3, money: 2000, vulnerability: 4, stakes: 4, rarity: 3, identity: 4, context: 3, business_commitment: 5 },
  },
]

/**
 * Check if a user's dome edges meet a model's minimum requirements.
 *
 * @param {Object} domeEdges - { dimId: level } from useSafetyDome
 * @param {string} modelId - business model ID
 * @returns {{ ready: boolean }}
 */
export function getModelReadiness(domeEdges, modelId) {
  const model = BUSINESS_MODELS.find(m => m.id === modelId)
  if (!model) return { ready: false }

  for (const [dimId, minValue] of Object.entries(model.minimums)) {
    if (minValue === 0) continue // no requirement

    const userLevel = domeEdges[dimId] || 0

    // For numeric dims (people, money): convert minimum raw value to tier, compare tiers
    if (dimId === 'people' || dimId === 'money') {
      const requiredTier = getNumericTier(dimId, minValue)
      if (userLevel < requiredTier) return { ready: false }
    } else {
      if (userLevel < minValue) return { ready: false }
    }
  }

  return { ready: true }
}
