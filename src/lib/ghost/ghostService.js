/**
 * ghostService.js — DB operations for Ghost Self League
 */
import { supabase } from '../supabaseClient'

/**
 * Get or create the ghost_weekly_results row for the given week.
 * If no row exists, creates one with ghost = empty (week 1 bootstrap).
 * Does NOT populate ghost from previous week — that's the hook's job
 * (it has completions in memory).
 *
 * @param {string} userId
 * @param {string} weekStart - YYYY-MM-DD Monday
 * @returns {Object|null} The ghost_weekly_results row
 */
export async function getOrCreateCurrentWeek(userId, weekStart) {
  // Try to fetch existing
  const { data: existing } = await supabase
    .from('ghost_weekly_results')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .single()

  if (existing) return existing

  // Create new row (ghost will be populated by the hook on first render)
  const { data: created, error } = await supabase
    .from('ghost_weekly_results')
    .insert({
      user_id: userId,
      week_start: weekStart,
    })
    .select()
    .single()

  if (error) {
    // Race condition: another tab may have created it
    if (error.code === '23505') {
      const { data: retry } = await supabase
        .from('ghost_weekly_results')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .single()
      return retry
    }
    console.warn('Ghost: failed to create week row:', error)
    return null
  }

  return created
}

/**
 * Get the previous week's result row (for building the ghost).
 * @param {string} userId
 * @param {string} currentWeekStart - YYYY-MM-DD Monday of current week
 * @returns {Object|null}
 */
export async function getPreviousWeekResult(userId, currentWeekStart) {
  const prevMonday = new Date(currentWeekStart + 'T00:00:00')
  prevMonday.setDate(prevMonday.getDate() - 7)
  const prevWeekStart = prevMonday.toISOString().slice(0, 10)

  const { data } = await supabase
    .from('ghost_weekly_results')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', prevWeekStart)
    .single()

  return data
}

/**
 * Save the ghost daily scores on the current week's row.
 * Called once when the hook first computes the ghost for a new week.
 * @param {string} rowId - ghost_weekly_results.id
 * @param {Object} ghostDailyScores - The JSONB to store
 */
export async function saveGhostScores(rowId, ghostDailyScores) {
  const { error } = await supabase
    .from('ghost_weekly_results')
    .update({ ghost_daily_scores: ghostDailyScores })
    .eq('id', rowId)

  if (error) console.warn('Ghost: failed to save ghost scores:', error)
}

/**
 * Get all pending past weeks (before current week) that need finalization.
 * Returns them in chronological order so they can be finalized sequentially.
 * @param {string} userId
 * @param {string} currentWeekStart - YYYY-MM-DD of current week's Monday
 * @returns {Array} pending ghost_weekly_results rows
 */
export async function getPendingPastWeeks(userId, currentWeekStart) {
  const { data } = await supabase
    .from('ghost_weekly_results')
    .select('*')
    .eq('user_id', userId)
    .eq('result', 'pending')
    .lt('week_start', currentWeekStart)
    .order('week_start', { ascending: true })
    .limit(4)

  return data || []
}

/**
 * Get past week results for the History tab.
 * @param {string} userId
 * @param {number} [limit=12]
 * @returns {Array}
 */
export async function getWeekHistory(userId, limit = 12) {
  const { data } = await supabase
    .from('ghost_weekly_results')
    .select('*')
    .eq('user_id', userId)
    .neq('result', 'pending')
    .order('week_start', { ascending: false })
    .limit(limit)

  return data || []
}

/**
 * Get or create the ghost_streaks row.
 * @param {string} userId
 * @returns {Object}
 */
export async function getGhostStreak(userId) {
  const { data: existing } = await supabase
    .from('ghost_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing) return existing

  // Create default streak row
  const { data: created } = await supabase
    .from('ghost_streaks')
    .insert({ user_id: userId })
    .select()
    .single()

  return created || {
    current_streak: 0, longest_streak: 0, consecutive_losses: 0,
    total_wins: 0, total_losses: 0, total_draws: 0,
    pb_tune: 0, pb_courage: 0, pb_community: 0,
  }
}

/**
 * Get content submissions for a given week.
 * @param {string} userId
 * @param {string} weekStart - YYYY-MM-DD Monday
 * @returns {Array}
 */
export async function getContentSubmissions(userId, weekStart) {
  const { data } = await supabase
    .from('ghost_content_submissions')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)

  return data || []
}

/**
 * Submit a community content action.
 * @param {string} userId
 * @param {string} weekStart
 * @param {string} contentType - key from GHOST_CONTENT_TYPES
 * @param {number} pointsValue
 * @param {Object} [extra={}] - { link_url, description }
 * @returns {Object|null}
 */
export async function submitContent(userId, weekStart, contentType, pointsValue, extra = {}) {
  const { data, error } = await supabase
    .from('ghost_content_submissions')
    .insert({
      user_id: userId,
      week_start: weekStart,
      content_type: contentType,
      points_value: pointsValue,
      link_url: extra.link_url || null,
      description: extra.description || null,
    })
    .select()
    .single()

  if (error) {
    console.warn('Ghost: content submission failed:', error)
    return null
  }
  return data
}
