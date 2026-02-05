/**
 * Ecosystem Service - Business Flywheel System
 * Manages progress tracking, auto-detection, and stats
 */
import { supabase } from '../supabaseClient'
import { ECOSYSTEM_PHASES, AUTO_CHECK_MAP, getTotalItemCount } from './ecosystemConfig'

/**
 * Get full ecosystem progress with auto-detection merged
 */
export async function getEcosystemProgress(userId) {
  try {
    const [manualProgress, autoChecks] = await Promise.all([
      getManualProgress(userId),
      detectAutoChecks(userId),
    ])

    // Build a map of all progress: manual overrides auto
    const progressMap = {}

    // First apply auto-detections
    for (const check of autoChecks) {
      const key = `${check.phase}:${check.systemId}`
      progressMap[key] = { completed: check.completed, auto: true }
    }

    // Then apply manual progress (overrides auto)
    for (const row of manualProgress) {
      const key = `${row.phase}:${row.system_id}`
      progressMap[key] = {
        completed: row.completed,
        auto: false,
        notes: row.notes,
        completedAt: row.completed_at,
      }
    }

    return progressMap
  } catch (err) {
    console.error('Error getting ecosystem progress:', err)
    return {}
  }
}

/**
 * Get compact summary for widget display
 */
export async function getEcosystemSummary(userId) {
  const progressMap = await getEcosystemProgress(userId)

  const phases = ECOSYSTEM_PHASES.map(phase => {
    const completed = phase.items.filter(item => {
      const key = `${phase.id}:${item.id}`
      return progressMap[key]?.completed
    }).length

    return {
      id: phase.id,
      name: phase.name,
      icon: phase.icon,
      total: phase.items.length,
      completed,
      percent: phase.items.length > 0
        ? Math.round((completed / phase.items.length) * 100)
        : 0,
    }
  })

  const totalItems = getTotalItemCount()
  const totalCompleted = phases.reduce((sum, p) => sum + p.completed, 0)

  return {
    phases,
    totalItems,
    totalCompleted,
    overallPercent: totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0,
  }
}

/**
 * Toggle a system item on/off
 */
export async function toggleSystemItem(userId, phase, systemId, completed) {
  try {
    const { data, error } = await supabase
      .from('ecosystem_system_progress')
      .upsert({
        user_id: userId,
        phase,
        system_id: systemId,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      }, {
        onConflict: 'user_id,phase,system_id',
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error toggling system item:', err)
    return null
  }
}

/**
 * Get ecosystem stats for Tools tower card
 */
export async function getEcosystemStats(userId) {
  const summary = await getEcosystemSummary(userId)
  return {
    completed: summary.totalCompleted,
    total: summary.totalItems,
    percent: summary.overallPercent,
  }
}

// ---- Internal helpers ----

async function getManualProgress(userId) {
  try {
    const { data, error } = await supabase
      .from('ecosystem_system_progress')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching manual progress:', err)
    return []
  }
}

/**
 * Auto-detect completion from source tables (read-only count queries)
 */
export async function detectAutoChecks(userId) {
  try {
    const checks = await Promise.all(
      AUTO_CHECK_MAP.map(async ({ table, phase, systemId }) => {
        try {
          const { count } = await supabase
            .from(table)
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)

          return { phase, systemId, completed: (count || 0) > 0 }
        } catch {
          return { phase, systemId, completed: false }
        }
      })
    )
    return checks
  } catch (err) {
    console.error('Error detecting auto checks:', err)
    return []
  }
}
