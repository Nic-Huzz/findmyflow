import { supabase } from './supabaseClient'

const MINIMUM_ACTIONS = 5

/**
 * Calculate Action Score (rolling 7-day alignment rate).
 * Returns { score: 0-100 | null, total: number, aligned: number }
 * score is null when total < MINIMUM_ACTIONS
 */
export async function calculateActionScore(userId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [courageRes, taskRes, checkinRes] = await Promise.all([
    supabase.from('quest_completions')
      .select('reflection_text')
      .eq('user_id', userId).eq('quest_category', 'Groans')
      .gte('created_at', sevenDaysAgo)
      .not('reflection_text', 'is', null),
    supabase.from('quest_tasks')
      .select('task_signal')
      .eq('user_id', userId)
      .not('task_signal', 'is', null)
      .gte('completed_at', sevenDaysAgo),
    supabase.from('nervous_system_checkins')
      .select('after_state')
      .eq('user_id', userId).eq('checkin_type', 'daily')
      .gte('created_at', sevenDaysAgo),
  ])

  let aligned = 0
  let total = 0

  ;(courageRes.data || []).forEach(row => {
    try {
      const { wahoo_classification } = JSON.parse(row.reflection_text)
      if (wahoo_classification) {
        total++
        if (['vibe', 'wahoo', 'peace'].includes(wahoo_classification)) aligned++
      }
    } catch {}
  })

  ;(taskRes.data || []).forEach(t => {
    total++
    if (t.task_signal === 'lit_me_up') aligned++
  })

  ;(checkinRes.data || []).forEach(c => {
    total++
    if (['vibe_rise', 'ventral'].includes(c.after_state)) aligned++
  })

  return {
    score: total >= MINIMUM_ACTIONS ? Math.round((aligned / total) * 100) : null,
    total,
    aligned,
  }
}

/**
 * Calculate Clarity Score from cluster resonance states.
 * Returns number (0-100) or null if no clusters.
 */
export async function calculateClarityScore(userId) {
  const { data } = await supabase
    .from('nikigai_clusters')
    .select('resonance_state, resonance_rating')
    .eq('user_id', userId)
    .in('cluster_type', ['skills', 'problems', 'persona'])
    .is('step_id', null)
    .eq('cluster_stage', 'final')
    .eq('is_removed', false)

  const allClusters = data || []
  if (allClusters.length === 0) return null

  const aligned = allClusters.filter(c => {
    const state = c.resonance_state || (c.resonance_rating >= 4 ? 'vibe_rise' : c.resonance_rating >= 3 ? 'fun' : null)
    return state === 'vibe_rise' || state === 'fun'
  })

  return Math.round((aligned.length / allClusters.length) * 100)
}

/**
 * Determine zone from Action Score + Clarity.
 */
export function getZone(actionScore, clarityPct) {
  if (actionScore == null || clarityPct == null) return null
  if (actionScore > 60 && clarityPct > 60) return 'Self-Actualisation'
  if (actionScore <= 60 && clarityPct > 60) return 'Head Full of Dreams'
  if (actionScore > 60 && clarityPct <= 60) return 'Misguided Zone'
  return 'Unfulfilment'
}
