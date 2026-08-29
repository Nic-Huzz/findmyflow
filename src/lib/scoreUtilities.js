import { supabase } from './supabaseClient'

/**
 * Calculate Zone Matrix placement.
 *
 * New model (simplified, phase-aware):
 *   X-axis (commitment): Have you committed to life paths?
 *   Y-axis (action): Did you do at least 1 courage challenge or dome experience this week?
 *
 * Quadrants:
 *   Unfulfilment (bottom-left):    No Life Map AND no Dome done
 *   Misguided (top-left):          Life Map + Dome done, but no Life Paths committed
 *   Head Full of Dreams (bot-right): Life Paths done, but no courage action in last 7 days
 *   Self-Actualisation (top-right): All discovery done + courage action in last 7 days
 *
 * Returns { hasLifeMap, hasDome, hasLifePaths, hasCourageThisWeek, zone, actionScore, clarityScore }
 */
export async function calculateZoneMatrix(userId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [lifeMapRes, domeRes, lifePathRes, courageRes] = await Promise.all([
    // Has Life Map clusters?
    supabase.from('nikigai_clusters')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    // Has Dome ratings?
    supabase.from('experience_dome_ratings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    // Has Life Paths (quests created)?
    supabase.from('quests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active'),
    // Has courage action this week? (courage challenges completed OR dome experiences rated)
    supabase.from('groan_challenges')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', sevenDaysAgo),
  ])

  const hasLifeMap = (lifeMapRes.count || 0) > 0
  const hasDome = (domeRes.count || 0) > 0
  const hasLifePaths = (lifePathRes.count || 0) > 0
  const courageThisWeek = courageRes.count || 0
  const hasCourageThisWeek = courageThisWeek > 0

  // Commitment = have you done the discovery work AND committed to paths?
  const hasCommitted = hasLifePaths
  const hasDiscovery = hasLifeMap || hasDome

  // Zone determination
  let zone
  if (hasCommitted && hasCourageThisWeek) {
    zone = 'Self-Actualisation'
  } else if (hasCommitted && !hasCourageThisWeek) {
    zone = 'Head Full of Dreams'
  } else if (hasDiscovery && !hasCommitted) {
    zone = 'Misguided Zone'
  } else {
    zone = 'Unfulfilment'
  }

  // Scores for backward compat (Progress tab display)
  // Clarity: based on discovery completion (0, 50, or 100)
  const clarityScore = hasCommitted ? 100 : hasDiscovery ? 50 : 0
  // Action: based on courage this week (0 or 100)
  const actionScore = hasCourageThisWeek ? 100 : 0

  return {
    hasLifeMap,
    hasDome,
    hasLifePaths,
    hasCourageThisWeek,
    courageThisWeek,
    zone,
    actionScore,
    clarityScore,
  }
}

// Legacy compat — old consumers call these separately
export async function calculateActionScore(userId) {
  const result = await calculateZoneMatrix(userId)
  return { score: result.actionScore, total: result.courageThisWeek, aligned: result.courageThisWeek }
}

export async function calculateClarityScore(userId) {
  const result = await calculateZoneMatrix(userId)
  return result.clarityScore
}

export function getZone(actionScore, clarityPct) {
  if (actionScore > 50 && clarityPct > 50) return 'Self-Actualisation'
  if (actionScore <= 50 && clarityPct > 50) return 'Head Full of Dreams'
  if (actionScore > 50 && clarityPct <= 50) return 'Misguided Zone'
  return 'Unfulfilment'
}
