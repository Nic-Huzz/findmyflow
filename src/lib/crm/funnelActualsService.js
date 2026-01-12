/**
 * Funnel Actuals Service
 * Calculates real funnel metrics from CRM deal data
 * Feeds the autonomous AI with actual conversion rates
 */
import { supabase } from '../supabaseClient'

/**
 * Calculate funnel metrics from deals for a given period
 */
export async function calculateFunnelActuals(userId, startDate, endDate, projectId = null) {
  // Fetch deals created or updated in this period
  let query = supabase
    .from('sales_deals')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data: deals, error } = await query

  if (error) {
    console.error('Error fetching deals for funnel actuals:', error)
    return null
  }

  if (!deals || deals.length === 0) {
    return {
      leads: 0,
      qualified_leads: 0,
      proposals: 0,
      sales: 0,
      total_revenue: 0,
      avg_sale_value: 0,
      conversion_rates: {
        lead_to_discovery: 0,
        discovery_to_proposal: 0,
        proposal_to_won: 0,
        overall: 0,
      }
    }
  }

  // Count deals that reached each stage
  // A deal counts for a stage if it's currently at that stage or passed through it
  const stageOrder = { lead: 0, discovery: 1, proposal: 2, won: 3, lost: 3 }

  const reachedStage = (deal, targetStage) => {
    const currentOrder = stageOrder[deal.status] ?? 0
    const targetOrder = stageOrder[targetStage] ?? 0
    return currentOrder >= targetOrder
  }

  const leads = deals.length // All deals start as leads
  const qualified_leads = deals.filter(d => reachedStage(d, 'discovery')).length
  const proposals = deals.filter(d => reachedStage(d, 'proposal')).length
  const sales = deals.filter(d => d.status === 'won').length

  // Revenue from won deals
  const wonDeals = deals.filter(d => d.status === 'won')
  const total_revenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0)
  const avg_sale_value = sales > 0 ? total_revenue / sales : 0

  // Calculate conversion rates
  const conversion_rates = {
    lead_to_discovery: leads > 0 ? Math.round((qualified_leads / leads) * 100) : 0,
    discovery_to_proposal: qualified_leads > 0 ? Math.round((proposals / qualified_leads) * 100) : 0,
    proposal_to_won: proposals > 0 ? Math.round((sales / proposals) * 100) : 0,
    overall: leads > 0 ? Math.round((sales / leads) * 100) : 0,
  }

  return {
    leads,
    qualified_leads,
    proposals,
    sales,
    total_revenue,
    avg_sale_value: Math.round(avg_sale_value),
    conversion_rates,
  }
}

/**
 * Save funnel actuals to database
 */
export async function saveFunnelActuals(userId, startDate, endDate, metrics, projectId = null, source = 'all') {
  const { data, error } = await supabase
    .from('funnel_actuals')
    .upsert({
      user_id: userId,
      project_id: projectId,
      period_start: startDate.toISOString().split('T')[0],
      period_end: endDate.toISOString().split('T')[0],
      leads: metrics.leads,
      qualified_leads: metrics.qualified_leads,
      proposals: metrics.proposals,
      sales: metrics.sales,
      total_revenue: metrics.total_revenue,
      avg_sale_value: metrics.avg_sale_value,
      source,
    }, {
      onConflict: 'user_id,period_start,period_end',
      ignoreDuplicates: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving funnel actuals:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Get the current month's funnel actuals
 */
export async function getCurrentMonthFunnelActuals(userId, projectId = null) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return calculateFunnelActuals(userId, startOfMonth, endOfMonth, projectId)
}

/**
 * Get last month's funnel actuals for comparison
 */
export async function getLastMonthFunnelActuals(userId, projectId = null) {
  const now = new Date()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  return calculateFunnelActuals(userId, startOfLastMonth, endOfLastMonth, projectId)
}

/**
 * Update funnel actuals for current month (call this after deal changes)
 */
export async function updateCurrentMonthActuals(userId, projectId = null) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const metrics = await calculateFunnelActuals(userId, startOfMonth, endOfMonth, projectId)
  if (!metrics) return null

  return saveFunnelActuals(userId, startOfMonth, endOfMonth, metrics, projectId)
}

/**
 * Fetch stored funnel actuals
 */
export async function fetchFunnelActuals(userId, options = {}) {
  let query = supabase
    .from('funnel_actuals')
    .select('*')
    .eq('user_id', userId)
    .order('period_start', { ascending: false })

  if (options.projectId) {
    query = query.eq('project_id', options.projectId)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching funnel actuals:', error)
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

/**
 * Get funnel health analysis
 * Returns actionable insights based on conversion rates
 */
export function analyzeFunnelHealth(metrics) {
  if (!metrics || metrics.leads === 0) {
    return {
      status: 'no_data',
      message: 'Not enough data to analyze. Start adding deals to your pipeline.',
      recommendations: [],
    }
  }

  const { conversion_rates: cr } = metrics
  const recommendations = []
  let status = 'healthy'

  // Analyze each conversion point
  if (cr.lead_to_discovery < 30) {
    recommendations.push({
      stage: 'lead_to_discovery',
      issue: `Only ${cr.lead_to_discovery}% of leads become qualified`,
      action: 'Improve lead qualification criteria or follow-up speed',
      priority: 'high',
    })
    status = 'needs_attention'
  }

  if (cr.discovery_to_proposal < 40) {
    recommendations.push({
      stage: 'discovery_to_proposal',
      issue: `Only ${cr.discovery_to_proposal}% of discoveries convert to proposals`,
      action: 'Review discovery call process - are you identifying true fit?',
      priority: 'medium',
    })
    status = 'needs_attention'
  }

  if (cr.proposal_to_won < 20) {
    recommendations.push({
      stage: 'proposal_to_won',
      issue: `Only ${cr.proposal_to_won}% of proposals close`,
      action: 'Review pricing, objection handling, and follow-up cadence',
      priority: 'high',
    })
    status = 'needs_attention'
  }

  if (cr.overall < 5) {
    status = 'critical'
  } else if (cr.overall >= 15) {
    status = 'excellent'
  }

  return {
    status,
    message: getStatusMessage(status, cr.overall),
    recommendations,
    topPriority: recommendations.find(r => r.priority === 'high') || recommendations[0],
  }
}

function getStatusMessage(status, overallRate) {
  switch (status) {
    case 'critical':
      return `Your overall conversion rate (${overallRate}%) needs immediate attention.`
    case 'needs_attention':
      return `Your funnel has some weak points that could be improved.`
    case 'excellent':
      return `Strong funnel performance! ${overallRate}% overall conversion is excellent.`
    case 'healthy':
    default:
      return `Your funnel is performing well with a ${overallRate}% overall conversion rate.`
  }
}

/**
 * Get funnel context for AI prompts
 * Returns structured data the AI can use
 */
export async function getFunnelContext(userId, projectId = null) {
  const currentMonth = await getCurrentMonthFunnelActuals(userId, projectId)
  const lastMonth = await getLastMonthFunnelActuals(userId, projectId)

  if (!currentMonth) return null

  const health = analyzeFunnelHealth(currentMonth)

  return {
    current: {
      leads: currentMonth.leads,
      qualified: currentMonth.qualified_leads,
      proposals: currentMonth.proposals,
      sales: currentMonth.sales,
      revenue: currentMonth.total_revenue,
      avgDealSize: currentMonth.avg_sale_value,
    },
    conversionRates: currentMonth.conversion_rates,
    comparison: lastMonth ? {
      leadsChange: currentMonth.leads - lastMonth.leads,
      salesChange: currentMonth.sales - lastMonth.sales,
      revenueChange: currentMonth.total_revenue - lastMonth.total_revenue,
    } : null,
    health: {
      status: health.status,
      topIssue: health.topPriority?.issue || null,
      recommendation: health.topPriority?.action || null,
    },
  }
}
