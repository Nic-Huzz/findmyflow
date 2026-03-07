/**
 * Ascension Engine Service
 * Manages customer journeys through the value ladder
 * Tracks: Lead → Attraction → Core → Upsell/Downsell → Continuity
 */
import { supabase } from '../supabaseClient'
import { fetchImplementationsByCategory, CATEGORY_TO_FLOW_TYPE } from './implementationService'
import { getOfferChecklist } from '../implementationChecklists'

// Default value ladder rungs (used when no custom data)
export const VALUE_LADDER_RUNGS = [
  { id: 'lead', label: 'Lead', color: '#6b7280', icon: '👤' },
  { id: 'attraction', label: 'Attraction Offer', color: '#3b82f6', icon: '🎁' },
  { id: 'core', label: 'Core Offer', color: '#10b981', icon: '💎' },
  { id: 'upsell', label: 'Upsell', color: '#8b5cf6', icon: '🚀' },
  { id: 'downsell', label: 'Downsell', color: '#f59e0b', icon: '💰' },
  { id: 'continuity', label: 'Continuity', color: '#ec4899', icon: '🔄' },
]

/**
 * Fetch user's custom value ladder from challenge data
 * Pulls from: offer_stack_builds, launch_readiness, money model assessments
 */
export async function fetchUserValueLadder(userId) {
  try {
    // Fetch all relevant challenge data in parallel
    const [offerStackResult, launchResult, upsellResult, downsellResult, continuityResult, leadMagnetResult, attractionResult, leadsResult] = await Promise.all([
      supabase
        .from('offer_stack_builds')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('launch_readiness_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('upsell_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('downsell_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('continuity_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('lead_magnet_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('attraction_offer_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('leads_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ])

    const offerStack = offerStackResult.data
    const launchReadiness = launchResult.data
    const upsell = upsellResult.data
    const downsell = downsellResult.data
    const continuity = continuityResult.data
    const leadMagnet = leadMagnetResult.data
    const attractionOffer = attractionResult.data
    const leadsStrategy = leadsResult.data

    // Build custom value ladder from user's data
    const customLadder = [
      // Lead (always first)
      {
        id: 'lead',
        label: 'Lead',
        customLabel: null,
        color: '#6b7280',
        icon: '👤',
        price: 0,
        description: 'Captured leads'
      },
      // Lead Magnet / Attraction
      {
        id: 'attraction',
        label: 'Attraction Offer',
        customLabel: attractionOffer?.recommended_offer_name || offerStack?.lead_magnet_idea || leadMagnet?.magnet_name || null,
        color: '#3b82f6',
        icon: '🎁',
        price: offerStack?.attraction_offer_price || 0,
        magnetType: offerStack?.lead_magnet_type || leadMagnet?.magnet_type,
        description: attractionOffer?.recommended_offer_name || offerStack?.lead_magnet_idea || 'Free/low-cost entry offer'
      },
      // Core Offer
      {
        id: 'core',
        label: 'Core Offer',
        customLabel: offerStack?.offer_name || null,
        color: '#10b981',
        icon: '💎',
        price: launchReadiness?.pricing_data?.coreOfferPrice || 0,
        guarantee: offerStack?.guarantee_type,
        bonuses: offerStack?.bonuses?.length || 0,
        description: offerStack?.tagline || 'Main product/service'
      },
      // Upsell
      {
        id: 'upsell',
        label: 'Upsell',
        customLabel: upsell?.offer_name || null,
        color: '#8b5cf6',
        icon: '🚀',
        price: upsell?.pricing || 0,
        description: upsell?.offer_description || 'Premium upgrade'
      },
      // Downsell
      {
        id: 'downsell',
        label: 'Downsell',
        customLabel: downsell?.offer_name || null,
        color: '#f59e0b',
        icon: '💰',
        price: downsell?.pricing || 0,
        description: downsell?.offer_description || 'Alternative for non-buyers'
      },
      // Continuity
      {
        id: 'continuity',
        label: 'Continuity',
        customLabel: continuity?.program_name || null,
        color: '#ec4899',
        icon: '🔄',
        price: continuity?.monthly_price || 0,
        isRecurring: true,
        description: continuity?.program_description || 'Recurring subscription'
      }
    ]

    // Calculate completeness
    const filledRungs = customLadder.filter(r =>
      r.id === 'lead' || r.customLabel || r.price > 0
    ).length
    const completeness = Math.round((filledRungs / customLadder.length) * 100)

    return {
      ladder: customLadder,
      completeness,
      hasOfferStack: !!offerStack,
      hasPricing: !!(launchReadiness?.pricing_data?.coreOfferPrice),
      hasMoneyModels: !!(upsell || downsell || continuity),
      leadsStrategy: leadsStrategy?.recommended_strategy_name || null,
      sources: {
        offerStack: !!offerStack,
        launchReadiness: !!launchReadiness,
        upsell: !!upsell,
        downsell: !!downsell,
        continuity: !!continuity,
        leadMagnet: !!leadMagnet,
        attractionOffer: !!attractionOffer,
        leadsStrategy: !!leadsStrategy
      }
    }
  } catch (err) {
    console.error('Error fetching user value ladder:', err)
    return {
      ladder: VALUE_LADDER_RUNGS,
      completeness: 0,
      hasOfferStack: false,
      hasPricing: false,
      hasMoneyModels: false,
      sources: {}
    }
  }
}

/**
 * Fetch project-specific value ladder from offer_implementations
 * Uses implementation checklists for display names and progress tracking
 */
export async function fetchProjectValueLadder(userId, projectId) {
  try {
    const { data: grouped, error } = await fetchImplementationsByCategory(userId, projectId)

    if (error) {
      console.error('Error fetching project implementations:', error)
      return { ladder: VALUE_LADDER_RUNGS, completeness: 0, implementations: {} }
    }

    // For each category, take the first implementation and enrich with checklist data
    const categories = ['attraction', 'upsell', 'downsell', 'continuity']
    const implMap = {}

    for (const cat of categories) {
      const impl = grouped[cat]?.[0]
      if (!impl) continue

      const flowType = CATEGORY_TO_FLOW_TYPE[cat]
      const checklist = flowType ? await getOfferChecklist(flowType, impl.offer_type) : null

      const completedCount = impl.completed_tasks?.length || 0
      const totalTasks = impl.total_tasks || 0
      let progressPct = 0
      if (impl.status === 'completed') {
        progressPct = 100
      } else if (totalTasks > 0) {
        progressPct = Math.round((completedCount / totalTasks) * 100)
      }

      implMap[cat] = {
        id: impl.id,
        status: impl.status,
        offer_type: impl.offer_type,
        progress: progressPct,
        checklistName: checklist?.name || impl.offer_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        checklistSummary: checklist?.summary || null,
      }
    }

    const ladder = [
      {
        id: 'lead',
        label: 'Lead',
        customLabel: null,
        color: '#6b7280',
        icon: '👤',
        price: 0,
        description: 'Captured leads',
      },
      {
        id: 'attraction',
        label: 'Attraction Offer',
        customLabel: implMap.attraction?.checklistName || null,
        description: implMap.attraction?.checklistSummary || 'Free/low-cost entry offer',
        color: '#3b82f6',
        icon: '🎁',
        price: 0,
        implementation: implMap.attraction || null,
      },
      {
        id: 'core',
        label: 'Core Offer',
        customLabel: null,
        color: '#10b981',
        icon: '💎',
        price: 0,
        description: 'Main product/service',
      },
      {
        id: 'upsell',
        label: 'Upsell',
        customLabel: implMap.upsell?.checklistName || null,
        description: implMap.upsell?.checklistSummary || 'Premium upgrade',
        color: '#8b5cf6',
        icon: '🚀',
        price: 0,
        implementation: implMap.upsell || null,
      },
      {
        id: 'downsell',
        label: 'Downsell',
        customLabel: implMap.downsell?.checklistName || null,
        description: implMap.downsell?.checklistSummary || 'Alternative for non-buyers',
        color: '#f59e0b',
        icon: '💰',
        price: 0,
        implementation: implMap.downsell || null,
      },
      {
        id: 'continuity',
        label: 'Continuity',
        customLabel: implMap.continuity?.checklistName || null,
        description: implMap.continuity?.checklistSummary || 'Recurring subscription',
        color: '#ec4899',
        icon: '🔄',
        price: 0,
        isRecurring: true,
        implementation: implMap.continuity || null,
      },
    ]

    // Completeness: count of categories with an implementation
    const filledCount = categories.filter(c => implMap[c]).length
    // lead + core always count as "present" so 2 + filledCount out of 6
    const completeness = Math.round(((2 + filledCount) / 6) * 100)

    return {
      ladder,
      completeness,
      implementations: implMap,
    }
  } catch (err) {
    console.error('Error fetching project value ladder:', err)
    return { ladder: VALUE_LADDER_RUNGS, completeness: 0, implementations: {} }
  }
}

// Map deal offer_category to value ladder rung
export function mapOfferToRung(offerCategory) {
  const mapping = {
    attraction: 'attraction',
    core: 'core',
    upsell: 'upsell',
    downsell: 'downsell',
    continuity: 'continuity',
  }
  return mapping[offerCategory] || 'core'
}

// ============================================
// CUSTOMER ASCENSION MANAGEMENT
// ============================================

/**
 * Get or create a customer ascension record
 */
export async function getOrCreateCustomerAscension(userId, customerData, projectId = null) {
  const { email, name, dealId } = customerData

  // Try to find existing customer by email
  if (email) {
    const { data: existing } = await supabase
      .from('customer_ascensions')
      .select('*')
      .eq('user_id', userId)
      .eq('customer_email', email)
      .single()

    if (existing) return { data: existing, isNew: false }
  }

  // Create new customer ascension
  const { data, error } = await supabase
    .from('customer_ascensions')
    .insert({
      user_id: userId,
      project_id: projectId,
      first_deal_id: dealId,
      customer_email: email,
      customer_name: name,
      current_rung: 'lead',
      ascension_history: [],
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating customer ascension:', error)
    return { data: null, error }
  }

  return { data, isNew: true }
}

/**
 * Record an ascension (customer moving up the value ladder)
 */
export async function recordAscension(userId, customerId, ascensionData) {
  const { newRung, dealId, value, offerType } = ascensionData

  // Get current customer record
  const { data: customer, error: fetchError } = await supabase
    .from('customer_ascensions')
    .select('*')
    .eq('id', customerId)
    .single()

  if (fetchError || !customer) {
    console.error('Error fetching customer:', fetchError)
    return { data: null, error: fetchError }
  }

  // Build new history entry
  const historyEntry = {
    rung: newRung,
    date: new Date().toISOString(),
    deal_id: dealId,
    value: value || 0,
    offer_type: offerType,
  }

  // Update customer record
  const newHistory = [...(customer.ascension_history || []), historyEntry]
  const newLTV = (customer.lifetime_value || 0) + (value || 0)
  const newPurchases = (customer.total_purchases || 0) + 1

  const { data, error } = await supabase
    .from('customer_ascensions')
    .update({
      current_rung: newRung,
      lifetime_value: newLTV,
      total_purchases: newPurchases,
      ascension_history: newHistory,
      last_purchase_at: new Date().toISOString(),
      first_purchase_at: customer.first_purchase_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId)
    .select()
    .single()

  if (error) {
    console.error('Error recording ascension:', error)
    return { data: null, error }
  }

  // Check for ascension triggers
  await checkAscensionTriggers(userId, data, newRung, customer.current_rung)

  return { data, error: null }
}

/**
 * Fetch all customer ascensions for a user
 */
export async function fetchCustomerAscensions(userId, options = {}) {
  let query = supabase
    .from('customer_ascensions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (options.projectId) {
    query = query.eq('project_id', options.projectId)
  }

  if (options.rung) {
    query = query.eq('current_rung', options.rung)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching customer ascensions:', error)
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

/**
 * Get value ladder statistics
 */
export async function getValueLadderStats(userId, projectId = null) {
  let query = supabase
    .from('customer_ascensions')
    .select('current_rung, lifetime_value, total_purchases')
    .eq('user_id', userId)

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching ladder stats:', error)
    return null
  }

  if (!data || data.length === 0) return null

  // Calculate stats per rung
  const stats = {
    totalCustomers: data.length,
    totalLTV: data.reduce((sum, c) => sum + (c.lifetime_value || 0), 0),
    byRung: {},
    ascensionRates: {},
  }

  // Count customers per rung
  VALUE_LADDER_RUNGS.forEach(rung => {
    const customers = data.filter(c => c.current_rung === rung.id)
    stats.byRung[rung.id] = {
      count: customers.length,
      totalValue: customers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0),
      avgValue: customers.length > 0
        ? customers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0) / customers.length
        : 0,
    }
  })

  // Calculate ascension rates (% who move from one rung to next)
  const rungOrder = ['lead', 'attraction', 'core', 'upsell', 'continuity']
  for (let i = 0; i < rungOrder.length - 1; i++) {
    const fromRung = rungOrder[i]
    const toRung = rungOrder[i + 1]
    const fromCount = stats.byRung[fromRung]?.count || 0
    const toCount = stats.byRung[toRung]?.count || 0
    stats.ascensionRates[`${fromRung}_to_${toRung}`] = fromCount > 0
      ? Math.round((toCount / fromCount) * 100)
      : 0
  }

  return stats
}

// ============================================
// ASCENSION TRIGGERS
// ============================================

/**
 * Get user's ascension triggers
 */
export async function fetchAscensionTriggers(userId, projectId = null) {
  let query = supabase
    .from('ascension_triggers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching triggers:', error)
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

/**
 * Create default triggers for a user
 */
export async function createDefaultTriggers(userId, projectId = null) {
  const { error } = await supabase.rpc('create_default_ascension_triggers', {
    p_user_id: userId,
    p_project_id: projectId,
  })

  if (error) {
    console.error('Error creating default triggers:', error)
    return { success: false, error }
  }

  return { success: true }
}

/**
 * Update a trigger
 */
export async function updateAscensionTrigger(triggerId, updates) {
  const { data, error } = await supabase
    .from('ascension_triggers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', triggerId)
    .select()
    .single()

  if (error) {
    console.error('Error updating trigger:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Check and fire ascension triggers
 */
async function checkAscensionTriggers(userId, customer, newRung, previousRung) {
  // Fetch active triggers
  const { data: triggers } = await supabase
    .from('ascension_triggers')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('from_rung', newRung)

  if (!triggers || triggers.length === 0) return

  for (const trigger of triggers) {
    // Check if trigger should fire
    if (trigger.trigger_timing === 'immediate') {
      await createAscensionTask(userId, customer, trigger)
    } else if (trigger.trigger_timing === 'days_after') {
      // Schedule for future
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + trigger.days_after)
      await createAscensionTask(userId, customer, trigger, dueDate)
    }
  }
}

/**
 * Create an ascension task (appears in Daily Priorities)
 */
async function createAscensionTask(userId, customer, trigger, dueDate = null) {
  const title = trigger.task_title.replace('{customer_name}', customer.customer_name)
  const description = trigger.task_description?.replace('{customer_name}', customer.customer_name)

  const { data, error } = await supabase
    .from('ascension_tasks')
    .insert({
      user_id: userId,
      project_id: customer.project_id,
      customer_ascension_id: customer.id,
      trigger_id: trigger.id,
      task_type: trigger.to_rung,
      title,
      description,
      customer_name: customer.customer_name,
      due_date: dueDate ? dueDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating ascension task:', error)
  }

  return { data, error }
}

// ============================================
// ASCENSION TASKS (For Daily Priorities)
// ============================================

/**
 * Fetch pending ascension tasks
 */
export async function fetchPendingAscensionTasks(userId, options = {}) {
  const today = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('ascension_tasks')
    .select(`
      *,
      customer:customer_ascension_id (
        customer_name,
        customer_email,
        lifetime_value,
        current_rung
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lte('due_date', today)
    .order('due_date', { ascending: true })

  if (options.projectId) {
    query = query.eq('project_id', options.projectId)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching ascension tasks:', error)
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

/**
 * Complete an ascension task
 */
export async function completeAscensionTask(taskId, outcome = 'completed') {
  const { data, error } = await supabase
    .from('ascension_tasks')
    .update({
      status: outcome,  // 'completed' or 'dismissed'
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    console.error('Error completing task:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Dismiss an ascension task (wrapper for completeAscensionTask)
 */
export async function dismissAscensionTask(taskId) {
  return completeAscensionTask(taskId, 'dismissed')
}

/**
 * Reschedule an ascension task to a new date
 */
export async function rescheduleAscensionTask(taskId, newDate) {
  const { data, error } = await supabase
    .from('ascension_tasks')
    .update({
      due_date: newDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    console.error('Error rescheduling task:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Delete an ascension trigger
 */
export async function deleteAscensionTrigger(triggerId) {
  const { error } = await supabase
    .from('ascension_triggers')
    .delete()
    .eq('id', triggerId)

  if (error) {
    console.error('Error deleting trigger:', error)
    return { success: false, error }
  }

  return { success: true, error: null }
}

// ============================================
// CONTINUITY / RETENTION TRACKING
// ============================================

/**
 * Mark a deal as continuity (subscription)
 */
export async function markDealAsContinuity(dealId, continuityData) {
  const { monthlyValue, startDate } = continuityData

  const { data, error } = await supabase
    .from('sales_deals')
    .update({
      is_continuity: true,
      continuity_status: 'active',
      continuity_start_date: startDate || new Date().toISOString(),
      monthly_value: monthlyValue,
      offer_category: 'continuity',
    })
    .eq('id', dealId)
    .select()
    .single()

  if (error) {
    console.error('Error marking continuity:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

/**
 * Fetch continuity customers
 */
export async function fetchContinuityCustomers(userId, options = {}) {
  let query = supabase
    .from('sales_deals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_continuity', true)
    .order('continuity_start_date', { ascending: false })

  if (options.status) {
    query = query.eq('continuity_status', options.status)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching continuity customers:', error)
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

/**
 * Update continuity status (for churn tracking)
 */
export async function updateContinuityStatus(dealId, status, reason = null) {
  const updates = {
    continuity_status: status,
  }

  if (status === 'churned') {
    updates.churn_date = new Date().toISOString()
    updates.churn_reason = reason
    updates.continuity_end_date = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('sales_deals')
    .update(updates)
    .eq('id', dealId)
    .select()
    .single()

  if (error) {
    console.error('Error updating continuity status:', error)
    return { data: null, error }
  }

  // If churned, create win-back tasks
  if (status === 'churned') {
    await createWinbackTasks(data)
  }

  return { data, error: null }
}

/**
 * Create win-back tasks for churned customer
 */
async function createWinbackTasks(deal) {
  // Get customer ascension record
  const { data: customer } = await supabase
    .from('customer_ascensions')
    .select('*')
    .eq('user_id', deal.user_id)
    .eq('customer_email', deal.contact_email)
    .single()

  if (!customer) return

  // Update customer rung to churned
  await supabase
    .from('customer_ascensions')
    .update({ current_rung: 'churned' })
    .eq('id', customer.id)

  // Fetch win-back triggers
  const { data: triggers } = await supabase
    .from('ascension_triggers')
    .select('*')
    .eq('user_id', deal.user_id)
    .eq('from_rung', 'churned')
    .eq('is_active', true)

  if (!triggers) return

  // Create win-back tasks with appropriate due dates
  for (const trigger of triggers) {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + trigger.days_after)
    await createAscensionTask(deal.user_id, customer, trigger, dueDate)
  }
}

/**
 * Get retention/churn statistics
 */
export async function getRetentionStats(userId) {
  const { data: continuityDeals, error } = await supabase
    .from('sales_deals')
    .select('continuity_status, monthly_value, continuity_start_date, churn_date, churn_reason')
    .eq('user_id', userId)
    .eq('is_continuity', true)

  if (error || !continuityDeals) return null

  const active = continuityDeals.filter(d => d.continuity_status === 'active')
  const churned = continuityDeals.filter(d => d.continuity_status === 'churned')
  const atRisk = continuityDeals.filter(d => d.continuity_status === 'at_risk')

  // Calculate MRR
  const mrr = active.reduce((sum, d) => sum + (d.monthly_value || 0), 0)

  // Calculate churn rate (churned / total)
  const churnRate = continuityDeals.length > 0
    ? Math.round((churned.length / continuityDeals.length) * 100)
    : 0

  // Calculate average tenure
  const tenures = active.map(d => {
    const start = new Date(d.continuity_start_date)
    const now = new Date()
    return Math.floor((now - start) / (1000 * 60 * 60 * 24 * 30)) // months
  })
  const avgTenure = tenures.length > 0
    ? (tenures.reduce((a, b) => a + b, 0) / tenures.length).toFixed(1)
    : 0

  // Churn reasons breakdown
  const churnReasons = {}
  churned.forEach(d => {
    if (d.churn_reason) {
      churnReasons[d.churn_reason] = (churnReasons[d.churn_reason] || 0) + 1
    }
  })

  return {
    totalContinuity: continuityDeals.length,
    active: active.length,
    atRisk: atRisk.length,
    churned: churned.length,
    mrr,
    churnRate,
    avgTenure,
    churnReasons,
  }
}

// ============================================
// DEAL INTEGRATION
// ============================================

/**
 * Process a won deal for ascension tracking
 * Call this when a deal is marked as 'won'
 */
export async function processDealForAscension(userId, deal, projectId = null) {
  // Get or create customer
  const { data: customer, isNew } = await getOrCreateCustomerAscension(userId, {
    email: deal.contact_email,
    name: deal.contact_name,
    dealId: deal.id,
  }, projectId)

  if (!customer) return { success: false }

  // Determine rung based on deal's offer category
  const rung = mapOfferToRung(deal.offer_category) || 'core'

  // Record the ascension
  await recordAscension(userId, customer.id, {
    newRung: rung,
    dealId: deal.id,
    value: deal.value,
    offerType: deal.offer_type,
  })

  return { success: true, customer }
}
