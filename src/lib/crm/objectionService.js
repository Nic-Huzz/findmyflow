/**
 * Objection Logging Service
 * CRUD + analytics for objection_logs table (Three Distortions framework)
 */
import { supabase } from '../supabaseClient'

export async function logObjection(userId, data) {
  const { data: result, error } = await supabase
    .from('objection_logs')
    .insert({
      user_id: userId,
      deal_id: data.deal_id || null,
      layer: data.layer,
      category: data.category,
      strategy_used: data.strategy_used || null,
      outcome: data.outcome || 'unknown',
      prospect_response: data.prospect_response || null,
      notes: data.notes || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error logging objection:', error)
    return { data: null, error }
  }
  return { data: result, error: null }
}

export async function fetchObjectionLogs(userId, options = {}) {
  let query = supabase
    .from('objection_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (options.deal_id) {
    query = query.eq('deal_id', options.deal_id)
  }
  if (options.layer) {
    query = query.eq('layer', options.layer)
  }
  if (options.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching objection logs:', error)
    return { data: [], error }
  }
  return { data: data || [], error: null }
}

export async function getObjectionStats(userId) {
  const { data, error } = await supabase
    .from('objection_logs')
    .select('layer, category, strategy_used, outcome')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching objection stats:', error)
    return null
  }

  if (!data || data.length === 0) return null

  const byLayer = { circumstances: 0, others: 0, self: 0 }
  const byCategory = {}
  const strategyResults = {}

  data.forEach(log => {
    byLayer[log.layer] = (byLayer[log.layer] || 0) + 1
    byCategory[log.category] = (byCategory[log.category] || 0) + 1

    if (log.strategy_used) {
      if (!strategyResults[log.strategy_used]) {
        strategyResults[log.strategy_used] = { total: 0, overcame: 0, partially: 0, failed: 0 }
      }
      strategyResults[log.strategy_used].total++
      if (log.outcome === 'overcame') strategyResults[log.strategy_used].overcame++
      if (log.outcome === 'partially') strategyResults[log.strategy_used].partially++
      if (log.outcome === 'failed') strategyResults[log.strategy_used].failed++
    }
  })

  const strategyEffectiveness = Object.entries(strategyResults)
    .map(([strategy, results]) => ({
      strategy,
      total: results.total,
      overcameCount: results.overcame,
      successRate: results.total > 0 ? Math.round(((results.overcame + results.partially * 0.5) / results.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  const topObjections = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return {
    totalLogs: data.length,
    byLayer,
    byCategory,
    strategyEffectiveness,
    topObjections,
  }
}

export async function deleteObjectionLog(logId, userId) {
  const { error } = await supabase
    .from('objection_logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting objection log:', error)
    return { error }
  }
  return { error: null }
}
