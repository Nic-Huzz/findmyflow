/**
 * bridgeJobUtils.js — Earning estimate parsing and bridge job filtering
 *
 * Used by FindBridgeFlow and PayTheBillsSection to surface
 * financially viable bridge job options from dome experiences.
 */
import { EXPERIENCE_PRICING } from '../data/experiencePricing'

// Money dimension tier 5 = $1K+/month (from domeDimensions.js tiers: [0, 100, 250, 500, 1000, 2500, ...])
// getDimTiers() maps tiers[i] to value i+1, so $1,000 = value 5
export const MONEY_TIER_5_THRESHOLD = 5

/**
 * Check if an employed rate string is viable for a bridge job.
 * Filters out N/A, Rare, Gig-based — these aren't employable paths.
 */
export function isEmployedViable(employedStr) {
  if (!employedStr) return false
  const lower = employedStr.toLowerCase()
  return !lower.includes('n/a') && !lower.includes('rare') && !lower.includes('gig-based')
}

/**
 * Parse "$25-35/hr" or "$25-35/hr (description)" → { min, max }
 * Returns null if unparseable.
 */
export function parseEmployedRate(rateStr) {
  if (!rateStr || !isEmployedViable(rateStr)) return null
  // Extract the first dollar range pattern: $XX-YY or $XX
  const match = rateStr.match(/\$(\d+)(?:-(\d+))?/)
  if (!match) return null
  const min = parseInt(match[1], 10)
  const max = match[2] ? parseInt(match[2], 10) : min
  return { min, max }
}

/**
 * Estimate monthly income from an employed rate string.
 * Default 160 hrs/month (40hr weeks).
 */
export function estimateMonthly(rateStr, hoursPerMonth = 160) {
  const parsed = parseEmployedRate(rateStr)
  if (!parsed) return null
  return {
    low: parsed.min * hoursPerMonth,
    high: parsed.max * hoursPerMonth,
  }
}

/**
 * Format a monthly estimate as a readable string.
 * e.g. { low: 4000, high: 5600 } → "~$4,000-5,600/month"
 */
export function formatMonthly(estimate) {
  if (!estimate) return ''
  const fmt = (n) => n.toLocaleString('en-US')
  if (estimate.low === estimate.high) return `~$${fmt(estimate.low)}/month`
  return `~$${fmt(estimate.low)}-${fmt(estimate.high)}/month`
}

/**
 * Given an array of Fun-rated dome experiences (with labels),
 * cross-reference with EXPERIENCE_PRICING and return viable bridge options.
 *
 * @param {Array<{nodeId: string, label: string}>} funExperiences
 * @returns {Array<{label, nodeId, employed, perSession, monthlyEstimate, confidencePct, bucket, parsedRate}>}
 *   Sorted by max hourly rate descending (highest earning first).
 */
export function getViableBridgeExperiences(funExperiences) {
  const results = []

  for (const exp of funExperiences) {
    const pricing = EXPERIENCE_PRICING[exp.label]
    if (!pricing) continue
    if (pricing.confidencePct < 50) continue
    if (!isEmployedViable(pricing.employed)) continue

    const parsedRate = parseEmployedRate(pricing.employed)
    if (!parsedRate) continue

    results.push({
      label: exp.label,
      nodeId: exp.nodeId,
      employed: pricing.employed,
      perSession: pricing.per_session,
      monthlyEstimate: estimateMonthly(pricing.employed),
      confidencePct: pricing.confidencePct,
      bucket: pricing.bucket,
      parsedRate,
    })
  }

  // Sort by max hourly rate descending
  results.sort((a, b) => b.parsedRate.max - a.parsedRate.max)
  return results
}

/**
 * Get ALL viable bridge experiences (not just user-rated ones).
 * Used as fallback when user has zero Fun-rated experiences with viable rates.
 *
 * @returns {Array} Same shape as getViableBridgeExperiences output.
 */
export function getAllViableBridgeExperiences() {
  const allExperiences = Object.entries(EXPERIENCE_PRICING).map(([label]) => ({
    label,
    nodeId: null,
  }))
  return getViableBridgeExperiences(allExperiences)
}
