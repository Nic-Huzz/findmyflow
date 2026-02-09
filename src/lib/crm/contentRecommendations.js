/**
 * Content Recommendations Service
 * Analyzes CRM data to recommend which content to create next.
 * Lightweight client-side scoring — no DB writes, no caching.
 */
import { supabase } from '../supabaseClient'

/**
 * Get personalized content recommendations based on real CRM data.
 * Returns top 3 scored triggers with context messages.
 *
 * @param {string} userId
 * @returns {Promise<Array<{ triggerId: string, score: number, contextMessage: string }>>}
 */
export async function getContentRecommendations(userId) {
  if (!userId) return []

  try {
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    const fourteenDaysISO = fourteenDaysAgo.toISOString()

    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)
    thisMonthStart.setHours(0, 0, 0, 0)
    const thisMonthISO = thisMonthStart.toISOString()

    // Query 3 tables in parallel
    const [dealsResult, contentResult, warmLeadsResult] = await Promise.all([
      supabase
        .from('sales_deals')
        .select('status, value, updated_at')
        .eq('user_id', userId),
      supabase
        .from('content_history')
        .select('content_type, platform, created_at')
        .eq('user_id', userId)
        .gte('created_at', fourteenDaysISO),
      supabase
        .from('crm_warm_leads')
        .select('temperature, status')
        .eq('user_id', userId)
        .in('status', ['to_contact', 'reached_out', 'in_conversation', 'meeting_booked']),
    ])

    const deals = dealsResult.data || []
    const recentContent = contentResult.data || []
    const warmLeads = warmLeadsResult.data || []

    // Minimum data threshold
    if (deals.length + warmLeads.length < 2) return []

    // Analyze deals
    const wonThisMonth = deals.filter(
      d => ['won', 'delivering', 'completed'].includes(d.status) &&
        d.updated_at >= thisMonthISO
    ).length
    const lostDeals = deals.filter(d => d.status === 'lost').length
    const followUpDeals = deals.filter(d => d.status === 'follow_up').length

    // Analyze recent content types
    const recentTypes = new Set(recentContent.map(c => c.content_type))
    const hasEducational = recentTypes.has('educational')
    const hasSocialProof = recentTypes.has('social_proof')
    const hasNurture = recentTypes.has('pain_agitation') || recentTypes.has('offer_teaser')

    // Score recommendations
    const recommendations = []

    if (wonThisMonth >= 2) {
      recommendations.push({
        triggerId: 'win_streak',
        score: 70 + wonThisMonth * 5,
        contextMessage: `You have ${wonThisMonth} recent wins — turn them into social proof`,
      })
    }

    if (lostDeals > 0) {
      recommendations.push({
        triggerId: 'price_objections',
        score: 60 + lostDeals * 5,
        contextMessage: `${lostDeals} deal${lostDeals > 1 ? 's' : ''} lost — create content that justifies your value`,
      })
    }

    if (warmLeads.length > 5 && !hasNurture) {
      recommendations.push({
        triggerId: 'timing_objections',
        score: 65 + warmLeads.length,
        contextMessage: `${warmLeads.length} warm leads — create nurture content to stay top of mind`,
      })
    }

    if (!hasEducational) {
      recommendations.push({
        triggerId: 'low_lead_to_discovery',
        score: 50,
        contextMessage: 'No qualifying content recently — attract better-fit leads',
      })
    }

    if (!hasSocialProof) {
      recommendations.push({
        triggerId: 'low_discovery_to_proposal',
        score: 45,
        contextMessage: 'No trust content recently — help prospects say yes faster',
      })
    }

    if (followUpDeals > 2) {
      recommendations.push({
        triggerId: 'low_proposal_to_close',
        score: 55 + followUpDeals * 3,
        contextMessage: `${followUpDeals} deals in follow-up — create objection-handling content`,
      })
    }

    // Sort by score descending, return top 3
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  } catch (err) {
    console.error('Error loading content recommendations:', err)
    return []
  }
}
