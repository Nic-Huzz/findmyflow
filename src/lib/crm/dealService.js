/**
 * Deal Service - Sales Pipeline Manager
 * Handles creating, fetching, and managing sales deals
 */
import { supabase } from '../supabaseClient'

// Deal stages in order
export const DEAL_STAGES = ['lead', 'discovery', 'proposal', 'won', 'lost']

// Stage display info
export const STAGE_INFO = {
  lead: { label: 'Lead', probability: 30 },
  discovery: { label: 'Discovery', probability: 50 },
  proposal: { label: 'Proposal', probability: 70 },
  won: { label: 'Won', probability: 100 },
  lost: { label: 'Lost', probability: 0 },
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
    discovery: [],
    proposal: [],
    won: [],
    lost: [],
  }

  data?.forEach(deal => {
    if (grouped[deal.status]) {
      grouped[deal.status].push(deal)
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
export async function updateDealStage(dealId, userId, newStatus) {
  const stageInfo = STAGE_INFO[newStatus]

  const updates = {
    status: newStatus,
    probability: stageInfo?.probability || 50,
    updated_at: new Date().toISOString(),
  }

  if (newStatus === 'won') {
    updates.actual_close_date = new Date().toISOString().split('T')[0]
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

  return { data, error: null }
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

  const wonThisMonth = deals.filter(d => {
    if (d.status !== 'won') return false
    const closeDate = new Date(d.actual_close_date || d.updated_at)
    return closeDate.getMonth() === currentMonth && closeDate.getFullYear() === currentYear
  })

  const currentRevenue = wonThisMonth.reduce((sum, d) => sum + (d.value || 0), 0)

  const pipelineDeals = deals.filter(d => !['won', 'lost'].includes(d.status))
  const pipelineValue = pipelineDeals.reduce((sum, d) => sum + (d.value || 0), 0)

  const weightedPipeline = pipelineDeals.reduce(
    (sum, d) => sum + (d.value || 0) * ((d.probability || 50) / 100),
    0
  )

  const totalDeals = deals.length
  const activeDeals = pipelineDeals.length
  const wonDeals = deals.filter(d => d.status === 'won').length
  const lostDeals = deals.filter(d => d.status === 'lost').length

  const closedDeals = wonDeals + lostDeals
  const winRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0

  return {
    currentRevenue,
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
  const stageOrder = { lead: 0, discovery: 1, proposal: 2, won: 3 }

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
