/**
 * Funnel Sync Service
 * Bidirectional sync between CRM deals and funnel_metrics
 *
 * CRM → Funnel: When deals move stages, update funnel metrics
 * Funnel → CRM: When funnel metrics update, reflect in analytics
 */
import { supabase } from '../supabaseClient'

/**
 * Map CRM deal stages to funnel metric stages
 */
const CRM_TO_FUNNEL_MAP = {
  // CRM stage → funnel_metrics field
  lead: 'leadmagnet',      // Lead captured = lead magnet conversion
  discovery: 'nurture',    // Discovery call = nurturing
  booked: 'nurture',       // Meeting booked = still nurturing
  proposal: 'nurture',     // Proposal sent = still nurturing
  won: null,               // Won needs special handling based on offer_category
  lost: null,              // Lost doesn't add to funnel
}

/**
 * Map offer categories to funnel metric fields
 */
const OFFER_TO_FUNNEL_MAP = {
  'Core Offer': 'core',
  'Upsell': 'upsell',
  'Downsell': 'downsell',
  'Continuity': 'continuity',
}

/**
 * Sync CRM deal counts to funnel_metrics
 * Called when deals are created, moved, or updated
 */
export async function syncCRMToFunnel(userId, projectId = null) {
  try {
    // Get current week start
    const weekStart = getWeekStart()

    // Fetch all active deals
    let dealsQuery = supabase
      .from('sales_deals')
      .select('id, status, offer_category, is_continuity, value, created_at')
      .eq('user_id', userId)

    if (projectId) {
      dealsQuery = dealsQuery.eq('project_id', projectId)
    }

    const { data: deals, error: dealsError } = await dealsQuery

    if (dealsError) {
      console.error('Error fetching deals for sync:', dealsError)
      return { success: false, error: dealsError }
    }

    // Calculate funnel counts from deals
    const funnelCounts = {
      leadmagnet: 0,
      nurture: 0,
      core: 0,
      upsell: 0,
      downsell: 0,
      continuity: 0,
      total_revenue: 0,
    }

    for (const deal of deals || []) {
      // Count by current stage
      if (deal.status === 'won') {
        // Won deals count toward their offer category
        const offerCategory = deal.offer_category || 'Core Offer'
        const funnelField = OFFER_TO_FUNNEL_MAP[offerCategory]
        if (funnelField) {
          funnelCounts[funnelField]++
        }
        funnelCounts.total_revenue += deal.value || 0

        // Also count continuity if flagged
        if (deal.is_continuity) {
          funnelCounts.continuity++
        }
      } else if (deal.status !== 'lost') {
        // Active deals count as lead magnet conversions
        funnelCounts.leadmagnet++

        // If past lead stage, also count as nurture
        if (['discovery', 'booked', 'proposal'].includes(deal.status)) {
          funnelCounts.nurture++
        }
      }
    }

    // Check if we have an existing CRM sync record for this week
    const { data: existing, error: existingError } = await supabase
      .from('funnel_metrics')
      .select('id')
      .eq('user_id', userId)
      .eq('source', 'crm_sync')
      .eq('week_start', weekStart)
      .maybeSingle()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing sync:', existingError)
    }

    // Upsert the CRM sync record
    const syncData = {
      user_id: userId,
      project_id: projectId,
      mode: 'actual',
      source: 'crm_sync',
      week_start: weekStart,
      ...funnelCounts,
      updated_at: new Date().toISOString(),
    }

    let result
    if (existing?.id) {
      // Update existing
      result = await supabase
        .from('funnel_metrics')
        .update(syncData)
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      // Insert new
      result = await supabase
        .from('funnel_metrics')
        .insert(syncData)
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error saving CRM sync:', result.error)
      return { success: false, error: result.error }
    }

    return { success: true, data: result.data, counts: funnelCounts }
  } catch (err) {
    console.error('CRM to funnel sync error:', err)
    return { success: false, error: err }
  }
}

/**
 * Get merged funnel data (manual + CRM sync)
 * Returns combined view for Analytics dashboard
 */
export async function getMergedFunnelMetrics(userId, weekOffset = 0) {
  const weekStart = getWeekStart(weekOffset)
  const weekEnd = getWeekEnd(weekOffset)

  // Fetch both manual and CRM sync records for the week
  const { data, error } = await supabase
    .from('funnel_metrics')
    .select('*')
    .eq('user_id', userId)
    .eq('mode', 'actual')
    .gte('created_at', weekStart)
    .lte('created_at', weekEnd)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching merged funnel metrics:', error)
    return { data: null, error }
  }

  if (!data || data.length === 0) {
    return { data: getEmptyFunnelMetrics(), error: null }
  }

  // Prefer manual entries (quest submissions) over CRM sync
  // But use CRM sync as baseline
  const manualEntry = data.find(d => d.source === 'quest' || d.source === 'manual')
  const crmEntry = data.find(d => d.source === 'crm_sync')

  // Merge: manual values override CRM values where provided
  const merged = {
    ...(crmEntry || getEmptyFunnelMetrics()),
    ...(manualEntry || {}),
    // Always include both sources for reference
    sources: {
      manual: manualEntry ? {
        updated_at: manualEntry.updated_at,
        id: manualEntry.id,
      } : null,
      crm: crmEntry ? {
        updated_at: crmEntry.updated_at,
        id: crmEntry.id,
      } : null,
    }
  }

  return { data: merged, error: null }
}

/**
 * Get funnel metrics comparison between weeks
 */
export async function getFunnelComparison(userId, currentWeekOffset = 0) {
  const [current, previous] = await Promise.all([
    getMergedFunnelMetrics(userId, currentWeekOffset),
    getMergedFunnelMetrics(userId, currentWeekOffset - 1),
  ])

  if (!current.data || !previous.data) {
    return { data: null, error: current.error || previous.error }
  }

  const calculateChange = (curr, prev) => {
    if (prev === 0) return curr > 0 ? 100 : 0
    return Math.round(((curr - prev) / prev) * 100)
  }

  const comparison = {
    current: current.data,
    previous: previous.data,
    changes: {
      awareness: calculateChange(current.data.awareness || 0, previous.data.awareness || 0),
      attraction: calculateChange(current.data.attraction || 0, previous.data.attraction || 0),
      leadmagnet: calculateChange(current.data.leadmagnet || 0, previous.data.leadmagnet || 0),
      nurture: calculateChange(current.data.nurture || 0, previous.data.nurture || 0),
      core: calculateChange(current.data.core || 0, previous.data.core || 0),
      total_revenue: calculateChange(current.data.total_revenue || 0, previous.data.total_revenue || 0),
    },
  }

  return { data: comparison, error: null }
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTime(userId) {
  const { data, error } = await supabase
    .from('funnel_metrics')
    .select('updated_at')
    .eq('user_id', userId)
    .eq('source', 'crm_sync')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data.updated_at
}

/**
 * Force a full sync from CRM to funnel metrics
 * Can be triggered manually or on schedule
 */
export async function forceCRMSync(userId, projectId = null) {
  return syncCRMToFunnel(userId, projectId)
}

// Helper functions

function getWeekStart(weekOffset = 0) {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust for Monday start
  const monday = new Date(now.setDate(diff + (weekOffset * 7)))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

function getWeekEnd(weekOffset = 0) {
  const weekStart = new Date(getWeekStart(weekOffset))
  const sunday = new Date(weekStart)
  sunday.setDate(sunday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return sunday.toISOString().split('T')[0]
}

function getEmptyFunnelMetrics() {
  return {
    awareness: 0,
    attraction: 0,
    leadmagnet: 0,
    nurture: 0,
    core: 0,
    upsell: 0,
    downsell: 0,
    continuity: 0,
    total_revenue: 0,
  }
}
