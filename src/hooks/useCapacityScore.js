/**
 * useCapacityScore.js
 *
 * Calculates the weekly Capacity Score from nervous_system_checkins.
 * All state check-ins (daily, tune, healing, playlist) flow into one score.
 *
 * State values:
 *   dorsal     = -2  (shutdown)
 *   sympathetic = -1  (activated without safety)
 *   ventral    = +1  (safe, connected)
 *   vibe_rise  = +2  (activated WITH safety — the goal)
 *
 * Score = normalized average of all state readings, mapped to 0-100.
 * 0 = all dorsal, 33 = all sympathetic, 67 = all ventral, 100 = all vibe_rise.
 *
 * Created: 2026-05-09
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getWeekStartLocal, formatLocalDate } from '../lib/dateUtils'

const STATE_VALUES = {
  dorsal: -2,
  sympathetic: -1,
  ventral: 1,
  vibe_rise: 2,
}

// Normalize raw average (-2 to +2) → 0-100 scale
function normalizeScore(rawAvg) {
  // -2 → 0, +2 → 100
  return Math.round(((rawAvg + 2) / 4) * 100)
}

function getWeekStartDate(weeksAgo = 0) {
  const start = getWeekStartLocal()
  if (weeksAgo === 0) return start
  const d = new Date(start + 'T00:00:00')
  d.setDate(d.getDate() - weeksAgo * 7)
  return formatLocalDate(d)
}

export function useCapacityScore(userId, refreshTrigger = 0) {
  const [score, setScore] = useState(null) // 0-100
  const [lastWeekScore, setLastWeekScore] = useState(null) // 0-100
  const [trend, setTrend] = useState(0) // positive = improving
  const [stateDistribution, setStateDistribution] = useState(null)
  const [dataPoints, setDataPoints] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    const thisWeekStart = getWeekStartDate(0)
    const lastWeekStart = getWeekStartDate(1)

    Promise.all([
      // This week's check-ins
      supabase
        .from('nervous_system_checkins')
        .select('before_state, after_state, checkin_type, created_at')
        .eq('user_id', userId)
        .gte('created_at', thisWeekStart),
      // Last week's check-ins (for trend)
      supabase
        .from('nervous_system_checkins')
        .select('before_state, after_state, checkin_type, created_at')
        .eq('user_id', userId)
        .gte('created_at', lastWeekStart)
        .lt('created_at', thisWeekStart),
    ]).then(([{ data: thisWeek }, { data: lastWeek }]) => {
      const thisWeekResult = computeScore(thisWeek || [])
      const lastWeekResult = computeScore(lastWeek || [])

      setScore(thisWeekResult.score)
      setStateDistribution(thisWeekResult.distribution)
      setDataPoints(thisWeekResult.count)
      setLastWeekScore(lastWeekResult.score)
      setTrend(thisWeekResult.score !== null && lastWeekResult.score !== null
        ? thisWeekResult.score - lastWeekResult.score
        : 0
      )
      setLoading(false)
    }).catch(err => {
      console.error('useCapacityScore error:', err)
      setLoading(false)
    })
  }, [userId, refreshTrigger])

  return { score, lastWeekScore, trend, stateDistribution, dataPoints, loading }
}

function computeScore(checkins) {
  if (!checkins || checkins.length === 0) {
    return { score: null, distribution: null, count: 0 }
  }

  // Extract state values from each check-in
  const stateReadings = []
  const counts = { vibe_rise: 0, ventral: 0, sympathetic: 0, dorsal: 0 }

  checkins.forEach(c => {
    // For daily check-ins, the state is in before_state
    // For tune/healing/playlist, the state is in after_state
    const state = c.checkin_type === 'daily' ? c.before_state : c.after_state

    if (state && STATE_VALUES[state] !== undefined) {
      stateReadings.push(STATE_VALUES[state])
      counts[state] = (counts[state] || 0) + 1
    }
  })

  if (stateReadings.length === 0) {
    return { score: null, distribution: null, count: 0 }
  }

  const total = stateReadings.length
  const rawAvg = stateReadings.reduce((sum, v) => sum + v, 0) / total
  const normalized = normalizeScore(rawAvg)

  // Distribution as percentages
  const distribution = {
    vibe_rise: Math.round((counts.vibe_rise / total) * 100),
    ventral: Math.round((counts.ventral / total) * 100),
    sympathetic: Math.round((counts.sympathetic / total) * 100),
    dorsal: Math.round((counts.dorsal / total) * 100),
  }

  return { score: normalized, distribution, count: total }
}

export default useCapacityScore
