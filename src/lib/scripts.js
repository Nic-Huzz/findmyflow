/**
 * Hormozi Sales Scripts - Database Operations
 */
import { supabase } from './supabaseClient'

// Script categories for filtering - matches actual database categories
export const SCRIPT_CATEGORIES = [
  { value: 'TIME', label: 'Time Objections', emoji: '⏰' },
  { value: 'PRICE', label: 'Price Objections', emoji: '💰' },
  { value: 'AUTHORITY', label: 'Authority/Trust', emoji: '🛡️' },
  { value: 'SELF_DOUBT', label: 'Self-Doubt', emoji: '🤔' },
  { value: 'TIMING', label: 'Timing', emoji: '📅' },
  { value: 'COMPARISON', label: 'Comparison', emoji: '⚖️' },
  { value: 'COMMITMENT', label: 'Commitment', emoji: '🤝' },
  { value: 'FINAL', label: 'Final Push', emoji: '🎯' },
]

// Legacy export for backwards compatibility
export const SCRIPT_STAGES = SCRIPT_CATEGORIES

/**
 * Fetch all active scripts
 * Maps database columns to expected field names
 */
export async function fetchScripts() {
  // Fetch all scripts - don't filter by is_active in query (column may not exist)
  let { data, error } = await supabase
    .from('sales_scripts')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching scripts:', error)
    return { data: null, error }
  }

  // Debug: log first script's columns to understand structure
  if (data && data.length > 0) {
    console.log('Script columns:', Object.keys(data[0]))
    console.log('First script raw:', data[0])
  }

  // Filter active scripts if column exists
  if (data && data.length > 0 && 'is_active' in data[0]) {
    data = data.filter(s => s.is_active !== false)
  }

  // Map database fields to expected names
  // Columns: script_name, subcategory, category (TIME/PRICE/etc)
  const mappedData = data?.map(script => {
    // Get the display name - handle null, undefined, AND empty strings
    const scriptName = script.script_name?.trim()
    const subcategory = script.subcategory?.trim()
    const displayName = scriptName || subcategory || `${script.category} Script`

    return {
      ...script,
      name: displayName,
      stage: script.category || script.stage || 'objection',
      tips: script.tips || script.follow_up_if_a || script.follow_up_if_b
    }
  })

  return { data: mappedData, error }
}

// Map category to stage values
function mapCategoryToStage(category) {
  const mapping = {
    // Standard stages
    'opener': 'opener',
    'discovery': 'discovery',
    'trust': 'trust',
    'urgency': 'urgency',
    'offer': 'offer',
    'objection': 'objection',
    'close': 'close',
    'follow-up': 'follow-up',
    // Common variations
    'opening': 'opener',
    'qualify': 'discovery',
    'build trust': 'trust',
    'create urgency': 'urgency',
    'present offer': 'offer',
    'handle objection': 'objection',
    'closing': 'close',
    'followup': 'follow-up',
    // Objection categories (map to 'objection' stage)
    'time': 'objection',
    'price': 'objection',
    'authority': 'objection',
    'self_doubt': 'objection',
    'timing': 'objection',
    'comparison': 'objection',
    'commitment': 'objection',
    'final': 'objection',
  }
  return mapping[category?.toLowerCase()] || 'objection'
}

// Get objection type from category for smart suggestions
export function getObjectionType(category) {
  return category?.toUpperCase() || 'OTHER'
}

/**
 * Fetch scripts by stage
 */
export async function fetchScriptsByStage(stage) {
  const { data, error } = await supabase
    .from('sales_scripts')
    .select('*')
    .eq('stage', stage)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return { data, error }
}

/**
 * Fetch a single script by ID
 */
export async function fetchScript(scriptId) {
  const { data, error } = await supabase
    .from('sales_scripts')
    .select('*')
    .eq('id', scriptId)
    .single()

  return { data, error }
}

/**
 * Log script usage
 */
export async function logScriptUsage(userId, scriptId, dealId = null, outcome = 'pending', notes = '') {
  const { data, error } = await supabase
    .from('script_usage_log')
    .insert({
      user_id: userId,
      script_id: scriptId,
      deal_id: dealId,
      outcome,
      notes,
    })
    .select()
    .single()

  return { data, error }
}

/**
 * Update script usage outcome
 */
export async function updateScriptUsage(usageId, userId, updates) {
  const { data, error } = await supabase
    .from('script_usage_log')
    .update(updates)
    .eq('id', usageId)
    .eq('user_id', userId)
    .select()
    .single()

  return { data, error }
}

/**
 * Get user's script usage history
 */
export async function fetchUserScriptUsage(userId, limit = 50) {
  const { data, error } = await supabase
    .from('script_usage_log')
    .select(`
      *,
      script:sales_scripts(name, category, stage),
      deal:sales_deals(contact_name, product_type)
    `)
    .eq('user_id', userId)
    .order('used_at', { ascending: false })
    .limit(limit)

  return { data, error }
}

/**
 * Get script effectiveness stats
 */
export async function fetchScriptStats(userId) {
  const { data, error } = await supabase
    .from('script_usage_log')
    .select(`
      script_id,
      outcome,
      script:sales_scripts(name, stage)
    `)
    .eq('user_id', userId)

  if (error) return { data: null, error }

  // Calculate stats per script
  const stats = {}
  data.forEach(log => {
    if (!stats[log.script_id]) {
      stats[log.script_id] = {
        scriptId: log.script_id,
        name: log.script?.name,
        stage: log.script?.stage,
        total: 0,
        successful: 0,
        unsuccessful: 0,
      }
    }
    stats[log.script_id].total++
    if (log.outcome === 'successful') stats[log.script_id].successful++
    if (log.outcome === 'unsuccessful') stats[log.script_id].unsuccessful++
  })

  // Calculate success rate
  Object.values(stats).forEach(s => {
    s.successRate = s.total > 0 ? Math.round((s.successful / s.total) * 100) : 0
  })

  return { data: Object.values(stats), error: null }
}

/**
 * Get scripts used for a specific deal
 */
export async function fetchDealScriptUsage(dealId, userId) {
  const { data, error } = await supabase
    .from('script_usage_log')
    .select(`
      *,
      script:sales_scripts(name, category, stage, script_text)
    `)
    .eq('deal_id', dealId)
    .eq('user_id', userId)
    .order('used_at', { ascending: false })

  return { data, error }
}
