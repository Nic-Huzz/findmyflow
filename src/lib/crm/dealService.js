/**
 * Deal Service - Sales Pipeline Manager
 * Handles creating, fetching, and managing sales deals
 */
import { supabase } from '../supabaseClient'
import { processDealForAscension } from './ascensionService'

// Deal stages in order (Hormozi-style pipeline)
// Tracks: Lead → Qualified → Booked → Showed → Pitched → Follow-up → Won → Delivering → Completed / Lost
export const DEAL_STAGES = ['lead', 'qualified', 'booked', 'showed', 'pitched', 'follow_up', 'won', 'delivering', 'completed', 'lost']

// Active stages (excludes terminal and post-sale states)
export const ACTIVE_STAGES = ['lead', 'qualified', 'booked', 'showed', 'pitched', 'follow_up']

// Post-sale stages (active customers)
export const POST_SALE_STAGES = ['delivering', 'completed']

// Stage display info with colors
export const STAGE_INFO = {
  lead:       { label: 'Lead', probability: 10, color: '#6b7280', description: 'Raw inbound interest' },
  qualified:  { label: 'Qualified', probability: 25, color: '#3b82f6', description: 'Passed PTUF screen' },
  booked:     { label: 'Booked', probability: 40, color: '#8b5cf6', description: 'Meeting scheduled' },
  showed:     { label: 'Showed', probability: 55, color: '#f59e0b', description: 'Attended meeting' },
  pitched:    { label: 'Pitched', probability: 70, color: '#f97316', description: 'Made the offer' },
  follow_up:  { label: 'Follow-up', probability: 50, color: '#eab308', description: 'Thinking/negotiating' },
  won:        { label: 'Won', probability: 100, color: '#10b981', description: 'Closed deal' },
  delivering: { label: 'Delivering', probability: 100, color: '#22c55e', description: 'Actively fulfilling' },
  completed:  { label: 'Completed', probability: 100, color: '#059669', description: 'Delivered successfully' },
  lost:       { label: 'Lost', probability: 0, color: '#ef4444', description: 'Deal lost' },
}

// Legacy mapping for backward compatibility
export const LEGACY_STAGE_MAP = {
  discovery: 'qualified',  // Old discovery → new qualified
  proposal: 'pitched',     // Old proposal → new pitched
}

// Default product types and their values (fallback if no user offers)
export const DEFAULT_PRODUCTS = {
  'Attraction Offer': 47,
  'Core Offer': 497,
  'Premium 1:1': 997,
  'VIP Package': 1997,
  'Continuity': 97,
}

// Legacy export for backward compatibility
export const PRODUCTS = DEFAULT_PRODUCTS

// Fetch user's products from Offer Builder, with fallback to defaults
export async function fetchUserProducts(userId) {
  const { data, error } = await supabase
    .from('offer_creations')
    .select('id, version_name, core_price, selected_version, status')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user products:', error)
    return { products: DEFAULT_PRODUCTS, isCustom: false }
  }

  // If user has offers, convert to products object
  if (data && data.length > 0) {
    const userProducts = {}
    data.forEach(offer => {
      const name = offer.version_name || `${offer.selected_version} Offer`
      userProducts[name] = offer.core_price || 497
    })
    return { products: userProducts, isCustom: true }
  }

  // Fall back to defaults
  return { products: DEFAULT_PRODUCTS, isCustom: false }
}

// Fetch all deals for a user
export async function fetchDeals(userId) {
  const { data, error } = await supabase
    .from('sales_deals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching deals:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// Fetch deals grouped by stage
export async function fetchDealsByStage(userId) {
  const { data, error } = await fetchDeals(userId)

  if (error) {
    return { data: null, error }
  }

  const grouped = {
    lead: [],
    qualified: [],
    booked: [],
    showed: [],
    pitched: [],
    follow_up: [],
    won: [],
    delivering: [],
    completed: [],
    lost: [],
  }

  data?.forEach(deal => {
    // Handle legacy stages
    let stage = deal.status
    if (LEGACY_STAGE_MAP[stage]) {
      stage = LEGACY_STAGE_MAP[stage]
    }
    if (grouped[stage]) {
      grouped[stage].push(deal)
    }
  })

  return { data: grouped, error: null }
}

// Create a new deal
export async function createDeal(userId, dealData) {
  const { data, error } = await supabase
    .from('sales_deals')
    .insert({
      user_id: userId,
      project_id: dealData.project_id || null,
      contact_name: dealData.contact_name,
      contact_email: dealData.contact_email || null,
      source: dealData.source || 'Manual',
      product_type: dealData.product_type,
      value: dealData.value,
      status: dealData.status || 'lead',
      probability: dealData.probability || 30,
      expected_close_date: dealData.expected_close_date || null,
      notes: dealData.notes || null,
      conversation_screenshot_url: dealData.conversation_screenshot_url || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating deal:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// Update deal stage
export async function updateDealStage(dealId, userId, newStatus, extraUpdates = {}) {
  const stageInfo = STAGE_INFO[newStatus]

  const updates = {
    status: newStatus,
    probability: stageInfo?.probability || 50,
    updated_at: new Date().toISOString(),
    ...extraUpdates,
  }

  // Handle terminal states
  if (newStatus === 'won') {
    updates.actual_close_date = new Date().toISOString().split('T')[0]
  }

  // Handle showed stage - mark that they showed up
  if (newStatus === 'showed') {
    updates.meeting_showed = true
  }

  const { data, error } = await supabase
    .from('sales_deals')
    .update(updates)
    .eq('id', dealId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating deal stage:', error)
    return { data: null, error }
  }

  // Auto-process for Ascension Engine when deal is won
  // This creates customer record and triggers upsell/continuity tasks
  if (newStatus === 'won' && data) {
    try {
      await processDealForAscension(userId, data, data.project_id)
    } catch (ascensionErr) {
      // Log but don't fail the stage update
      console.error('Error processing ascension:', ascensionErr)
    }
  }

  return { data, error: null }
}

// Schedule a meeting (moves to booked stage)
export async function scheduleMeeting(dealId, userId, meetingDateTime) {
  return updateDealStage(dealId, userId, 'booked', {
    meeting_scheduled_at: meetingDateTime,
    meeting_showed: null, // Reset show status
  })
}

// Mark contact made (updates last_contact_date, increments count, and appends notes)
export async function logContact(dealId, userId, contactDate = null, activityData = {}) {
  // First get current deal data
  const { data: existing } = await supabase
    .from('sales_deals')
    .select('contact_count, notes')
    .eq('id', dealId)
    .eq('user_id', userId)
    .single()

  // Parse contact date
  let dateStr
  if (contactDate instanceof Date) {
    dateStr = contactDate.toISOString().split('T')[0]
  } else if (typeof contactDate === 'string') {
    dateStr = contactDate.split('T')[0]
  } else {
    dateStr = new Date().toISOString().split('T')[0]
  }

  // Build updated notes (append new activity to existing)
  let updatedNotes = existing?.notes || ''
  if (activityData.notes) {
    if (updatedNotes) {
      updatedNotes += '\n\n---\n\n'
    }
    updatedNotes += activityData.notes
  }

  const { data, error } = await supabase
    .from('sales_deals')
    .update({
      last_contact_date: dateStr,
      contact_count: (existing?.contact_count || 0) + 1,
      notes: updatedNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error logging contact:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// Schedule follow-up
export async function scheduleFollowUp(dealId, userId, followUpDate) {
  // Parse follow-up date
  let dateStr
  if (followUpDate instanceof Date) {
    dateStr = followUpDate.toISOString().split('T')[0]
  } else if (typeof followUpDate === 'string') {
    dateStr = followUpDate.split('T')[0]
  } else {
    throw new Error('Invalid followUpDate: must be Date or string')
  }

  const { data, error } = await supabase
    .from('sales_deals')
    .update({
      next_follow_up_date: dateStr,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error scheduling follow-up:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// Get deals with follow-ups due
export async function getFollowUpsDue(userId, beforeDate = new Date()) {
  const { data, error } = await supabase
    .from('sales_deals')
    .select('*')
    .eq('user_id', userId)
    .lte('next_follow_up_date', beforeDate.toISOString().split('T')[0])
    .not('status', 'in', '("won","lost")')
    .order('next_follow_up_date', { ascending: true })

  if (error) {
    console.error('Error fetching follow-ups due:', error)
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

// Get stale deals (no update in X days)
export async function getStaleDeals(userId, staleDays = 7) {
  const staleDate = new Date()
  staleDate.setDate(staleDate.getDate() - staleDays)

  const { data, error } = await supabase
    .from('sales_deals')
    .select('*')
    .eq('user_id', userId)
    .lt('updated_at', staleDate.toISOString())
    .not('status', 'in', '("won","lost")')
    .order('updated_at', { ascending: true })

  if (error) {
    console.error('Error fetching stale deals:', error)
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

// Get meetings scheduled (for booked stage tracking)
export async function getUpcomingMeetings(userId, withinDays = 7) {
  const now = new Date()
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + withinDays)

  const { data, error } = await supabase
    .from('sales_deals')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'booked')
    .gte('meeting_scheduled_at', now.toISOString())
    .lte('meeting_scheduled_at', futureDate.toISOString())
    .order('meeting_scheduled_at', { ascending: true })

  if (error) {
    console.error('Error fetching upcoming meetings:', error)
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

// Calculate stage velocity from stage_history
export function calculateStageVelocity(deal) {
  if (!deal.stage_history || !Array.isArray(deal.stage_history) || deal.stage_history.length < 2) {
    return null
  }

  const velocities = {}
  const history = deal.stage_history

  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1]
    const curr = history[i]
    const prevDate = new Date(prev.entered_at)
    const currDate = new Date(curr.entered_at)
    const daysDiff = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24))

    velocities[`${prev.stage}_to_${curr.stage}`] = daysDiff
  }

  // Total time from first to current
  const firstEntry = new Date(history[0].entered_at)
  const lastEntry = new Date(history[history.length - 1].entered_at)
  velocities.total_days = Math.round((lastEntry - firstEntry) / (1000 * 60 * 60 * 24))

  return velocities
}

// Get show rate (booked → showed conversion)
export async function getShowRate(userId, daysBack = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysBack)

  const { data, error } = await supabase
    .from('sales_deals')
    .select('status, meeting_showed')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())

  if (error) {
    console.error('Error calculating show rate:', error)
    return null
  }

  // Count deals that were booked (have meeting_scheduled_at or reached showed/pitched/won)
  const bookedStages = ['booked', 'showed', 'pitched', 'follow_up', 'won', 'lost']
  const booked = data?.filter(d => bookedStages.includes(d.status) || d.meeting_showed !== null) || []
  const showed = data?.filter(d => d.meeting_showed === true) || []

  return {
    booked: booked.length,
    showed: showed.length,
    showRate: booked.length > 0 ? Math.round((showed.length / booked.length) * 100) : 0,
    noShowRate: booked.length > 0 ? Math.round(((booked.length - showed.length) / booked.length) * 100) : 0,
  }
}

// Update deal details
export async function updateDeal(dealId, userId, updates) {
  const { data, error } = await supabase
    .from('sales_deals')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating deal:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// Delete a deal
export async function deleteDeal(dealId, userId) {
  const { error } = await supabase
    .from('sales_deals')
    .delete()
    .eq('id', dealId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting deal:', error)
    return { error }
  }

  return { error: null }
}

// Calculate revenue stats
export function calculateRevenueStats(deals, monthlyGoal = 5000) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const TERMINAL_STAGES = ['won', 'delivering', 'completed', 'lost']

  const wonThisMonth = deals.filter(d => {
    if (!['won', 'delivering', 'completed'].includes(d.status)) return false
    const closeDate = new Date(d.actual_close_date || d.updated_at)
    return closeDate.getMonth() === currentMonth && closeDate.getFullYear() === currentYear
  })

  const currentRevenue = wonThisMonth.reduce((sum, d) => sum + (d.value || 0), 0)

  const pipelineDeals = deals.filter(d => !TERMINAL_STAGES.includes(d.status))
  const pipelineValue = pipelineDeals.reduce((sum, d) => sum + (d.value || 0), 0)

  const weightedPipeline = pipelineDeals.reduce(
    (sum, d) => sum + (d.value || 0) * ((d.probability || 50) / 100),
    0
  )

  const totalDeals = deals.length
  const activeDeals = pipelineDeals.length
  const activeCustomers = deals.filter(d => d.status === 'delivering').length
  const wonDeals = deals.filter(d => ['won', 'delivering', 'completed'].includes(d.status)).length
  const lostDeals = deals.filter(d => d.status === 'lost').length

  const closedDeals = wonDeals + lostDeals
  const winRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0

  return {
    currentRevenue,
    activeCustomers,
    monthlyGoal,
    progress: Math.min(100, Math.round((currentRevenue / monthlyGoal) * 100)),
    pipelineValue,
    weightedPipeline: Math.round(weightedPipeline),
    totalDeals,
    activeDeals,
    wonDeals,
    lostDeals,
    winRate,
  }
}

// Get points for stage transition
export function getTransitionPoints(fromStage, toStage) {
  const stageOrder = { lead: 0, discovery: 1, proposal: 2, won: 3, delivering: 4, completed: 5 }

  if (toStage === 'won') return 100
  if (toStage === 'lost') return 0

  const fromIndex = stageOrder[fromStage] ?? -1
  const toIndex = stageOrder[toStage] ?? -1

  if (toIndex > fromIndex) {
    if (toStage === 'discovery') return 25
    if (toStage === 'proposal') return 25
  }

  return 0
}

// Save deal outcome (win/loss analysis)
export async function saveDealOutcome(userId, dealId, outcomeData) {
  const { data, error } = await supabase
    .from('deal_outcomes')
    .insert({
      user_id: userId,
      deal_id: dealId,
      outcome: outcomeData.outcome,
      primary_reason: outcomeData.primary_reason,
      secondary_reasons: outcomeData.secondary_reasons || [],
      competitor_mentioned: outcomeData.competitor_mentioned || null,
      price_factor: outcomeData.price_factor || false,
      timing_factor: outcomeData.timing_factor || false,
      fit_factor: outcomeData.fit_factor || false,
      notes: outcomeData.notes || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving deal outcome:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// Fetch deal outcomes for analysis
export async function fetchDealOutcomes(userId, options = {}) {
  let query = supabase
    .from('deal_outcomes')
    .select(`
      *,
      deals:deal_id (
        contact_name,
        product_type,
        value,
        source
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (options.outcome) {
    query = query.eq('outcome', options.outcome)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching deal outcomes:', error)
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

// Get outcome statistics
export async function getDealOutcomeStats(userId) {
  const { data, error } = await supabase
    .from('deal_outcomes')
    .select('outcome, primary_reason, price_factor, timing_factor, fit_factor, competitor_mentioned')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching outcome stats:', error)
    return null
  }

  if (!data || data.length === 0) return null

  const wins = data.filter(d => d.outcome === 'won')
  const losses = data.filter(d => d.outcome === 'lost')

  // Count reason frequencies
  const winReasons = {}
  const lossReasons = {}

  wins.forEach(w => {
    winReasons[w.primary_reason] = (winReasons[w.primary_reason] || 0) + 1
  })

  losses.forEach(l => {
    lossReasons[l.primary_reason] = (lossReasons[l.primary_reason] || 0) + 1
  })

  // Find top reasons
  const topWinReason = Object.entries(winReasons).sort((a, b) => b[1] - a[1])[0]
  const topLossReason = Object.entries(lossReasons).sort((a, b) => b[1] - a[1])[0]

  // Count factor frequencies in losses
  const priceIssues = losses.filter(l => l.price_factor).length
  const timingIssues = losses.filter(l => l.timing_factor).length
  const fitIssues = losses.filter(l => l.fit_factor).length

  // Competitors mentioned
  const competitors = losses
    .filter(l => l.competitor_mentioned)
    .map(l => l.competitor_mentioned)

  return {
    totalOutcomes: data.length,
    wins: wins.length,
    losses: losses.length,
    winRate: data.length > 0 ? Math.round((wins.length / data.length) * 100) : 0,
    topWinReason: topWinReason ? { reason: topWinReason[0], count: topWinReason[1] } : null,
    topLossReason: topLossReason ? { reason: topLossReason[0], count: topLossReason[1] } : null,
    lossFactors: {
      price: priceIssues,
      timing: timingIssues,
      fit: fitIssues,
    },
    competitorsMentioned: [...new Set(competitors)],
  }
}
