/**
 * useCapacityScore.js — v5 Per-Day Quadrant Model
 *
 * Safety score (0-10):
 *   For each of last 7 days, daily_ratio = min(1, safety_items / SAFETY_DAILY_TARGET)
 *   safety = avg(daily_ratios) * 10
 *
 * Expression score (0-10):
 *   For each of last 7 days, daily_ratio = min(1, expression_items / EXPRESSION_DAILY_TARGET)
 *   wahoo_bonus = has_wahoo_this_week ? 1.0 : 0.0
 *   expression = min(10, avg(daily_ratios) * 8 + wahoo_bonus * 2)
 *
 * Quadrant (replaces zone):
 *   >= 5 on both → vibe-rise
 *   >= 5 safety only → grounded
 *   >= 5 expression only → wired
 *   both < 5 → stuck
 *
 * Maintenance: same per-day average as before.
 *
 * Rewritten: 2026-09-07 (v5)
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatLocalDate } from '../lib/dateUtils'

// Per-day targets
const SAFETY_DAILY_TARGET = 4
const EXPRESSION_DAILY_TARGET = 3
const QUADRANT_THRESHOLD = 5.0  // >= 5 on an axis = "high"

// Quest IDs by category
const MAINTENANCE_IDS = ['practice_sleep', 'practice_exercise', 'practice_sunlight', 'meal_breakfast', 'meal_lunch', 'meal_dinner']
const SAFETY_IDS = ['reconnect_morning_meditation_breathwork', 'reconnect_daily_prayer', 'practice_connect_friend', 'safety_self_compassion', 'safety_savouring']
const EXPRESSION_IDS = ['practice_voice_work', 'practice_own_style', 'practice_social_media', 'weekly_peak_state', 'rewire_weekly_focus']

function getQuadrant(safety, expression) {
  const highSafety = safety >= QUADRANT_THRESHOLD
  const highExpression = expression >= QUADRANT_THRESHOLD
  if (highSafety && highExpression) return 'vibe-rise'
  if (highSafety) return 'grounded'
  if (highExpression) return 'wired'
  return 'stuck'
}

/**
 * Count items per day matching a filter, returning array of 7 daily counts (oldest first)
 */
function dailyCounts(completions, filterFn, dateField = 'completed_at') {
  const dayMap = {}
  completions.filter(filterFn).forEach(c => {
    const ts = c[dateField]
    if (ts) {
      const day = formatLocalDate(new Date(ts))
      dayMap[day] = (dayMap[day] || 0) + 1
    }
  })

  const counts = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = formatLocalDate(d)
    counts.push(dayMap[dateStr] || 0)
  }
  return counts
}

function computeAxes(completions, checkins, wahoos) {
  // --- Safety: per-day average ---
  const isSafety = c =>
    SAFETY_IDS.includes(c.quest_id) ||
    (c.quest_category === 'Healing' && !c.quest_id?.startsWith('reconnect_weekly')
      && c.quest_id !== 'reconnect_remove_negative' && c.quest_id !== 'session_with_huzz') ||
    (c.quest_category === 'Healing' && (
      c.quest_id?.startsWith('reconnect_weekly') ||
      c.quest_id === 'reconnect_remove_negative' ||
      c.quest_id === 'session_with_huzz'
    ))
  const safetyCounts = dailyCounts(completions, isSafety)
  const safetyRatios = safetyCounts.map(count => Math.min(1, count / SAFETY_DAILY_TARGET))
  const safety = Math.round((safetyRatios.reduce((a, b) => a + b, 0) / 7) * 10 * 10) / 10

  // --- Expression: per-day average + wahoo bonus ---
  const isExpression = c =>
    EXPRESSION_IDS.includes(c.quest_id) || c.quest_id === 'rewire_behavior_change'
  const exprCounts = dailyCounts(completions, isExpression)
  const exprRatios = exprCounts.map(count => Math.min(1, count / EXPRESSION_DAILY_TARGET))
  const wahooBonus = wahoos.length > 0 ? 1.0 : 0.0
  const expression = Math.round(Math.min(10, (exprRatios.reduce((a, b) => a + b, 0) / 7) * 8 + wahooBonus * 2) * 10) / 10

  // --- Maintenance (rolling 7-day %) ---
  const maintenanceCompletions = completions.filter(c => MAINTENANCE_IDS.includes(c.quest_id))
  const maintDayMap = {}
  maintenanceCompletions.forEach(c => {
    if (c.completed_at) {
      const day = formatLocalDate(new Date(c.completed_at))
      if (!maintDayMap[day]) maintDayMap[day] = new Set()
      maintDayMap[day].add(c.quest_id)
    }
  })

  const maintenanceDays = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = formatLocalDate(d)
    const done = maintDayMap[dateStr]?.size || 0
    const total = MAINTENANCE_IDS.length
    maintenanceDays.push({
      label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()],
      done,
      total,
      status: done >= total * 0.75 ? 'filled' : done >= total * 0.5 ? 'partial' : done > 0 ? 'low' : 'empty',
    })
  }

  const totalMaintPossible = MAINTENANCE_IDS.length * 7
  const totalMaintDone = maintenanceDays.reduce((sum, d) => sum + d.done, 0)
  const maintenancePct = totalMaintPossible > 0 ? Math.round((totalMaintDone / totalMaintPossible) * 100) : 0

  // --- Quadrant + backward-compat capacity ---
  const zone = getQuadrant(safety, expression)
  const capacity = Math.round((safety + expression) * 5) // 0-100 for leaderboard compat

  // --- Pillar activation (backward compat) ---
  const safetyTotal = safetyCounts.reduce((a, b) => a + b, 0)
  const exprTotal = exprCounts.reduce((a, b) => a + b, 0)
  const safetyActive = safety >= QUADRANT_THRESHOLD
  const expressionActive = expression >= QUADRANT_THRESHOLD
  const maintenanceActive = maintenancePct >= 50
  const activePillars = [safetyActive, expressionActive, maintenanceActive].filter(Boolean).length

  // --- Today's progress ---
  const todayStr = formatLocalDate(new Date())
  const todaySafety = completions.filter(c => {
    if (!c.completed_at) return false
    return formatLocalDate(new Date(c.completed_at)) === todayStr && isSafety(c)
  }).length
  const todayExpression = completions.filter(c => {
    if (!c.completed_at) return false
    return formatLocalDate(new Date(c.completed_at)) === todayStr && isExpression(c)
  }).length
  const todayMaintenance = maintDayMap[todayStr]?.size || 0

  return {
    safety,
    expression,
    capacity,
    zone,
    maintenancePct,
    maintenanceDays,
    pillars: {
      safety: { active: safetyActive, count: safetyTotal, strength: safety / 10 },
      expression: { active: expressionActive, count: exprTotal, strength: expression / 10 },
      maintenance: { active: maintenanceActive, pct: maintenancePct, strength: maintenancePct / 100 },
    },
    activePillars,
    todayProgress: {
      safety: { done: todaySafety, target: SAFETY_DAILY_TARGET },
      expression: { done: todayExpression, target: EXPRESSION_DAILY_TARGET },
      maintenance: { done: todayMaintenance, target: MAINTENANCE_IDS.length },
    },
  }
}

export function useCapacityScore(userId, refreshTrigger = 0) {
  const [data, setData] = useState({
    safety: null,
    expression: null,
    capacity: null,
    zone: null,
    trend: 0,
    safetyTrend: null,
    expressionTrend: null,
    maintenancePct: 0,
    maintenanceDays: [],
    pillars: null,
    activePillars: 0,
    todayProgress: null,
    dataPoints: 0,
    loading: true,
  })

  useEffect(() => {
    if (!userId) return

    // Rolling 7-day window: last 7 days from today
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const fourteenDaysAgo = new Date(now)
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const thisStart = formatLocalDate(sevenDaysAgo)
    const lastStart = formatLocalDate(fourteenDaysAgo)

    // 3 queries covering 14 days, split client-side (halves API calls)
    Promise.all([
      supabase.from('quest_completions')
        .select('quest_id, quest_category, completed_at')
        .eq('user_id', userId)
        .in('quest_category', ['Tune', 'Healing', 'Groans'])
        .gte('completed_at', lastStart),
      supabase.from('nervous_system_checkins')
        .select('checkin_type, created_at')
        .eq('user_id', userId)
        .in('checkin_type', ['drain', 'stall'])
        .gte('created_at', lastStart),
      supabase.from('groan_challenges')
        .select('id, completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', lastStart),
    ]).then(([
      { data: allCompletions },
      { data: allCheckins },
      { data: allWahoos },
    ]) => {
      const completions = allCompletions || []
      const checkins = allCheckins || []
      const wahoos = allWahoos || []

      const tc = completions.filter(c => c.completed_at >= thisStart)
      const lc = completions.filter(c => c.completed_at < thisStart)
      const tch = checkins.filter(c => c.created_at >= thisStart)
      const lch = checkins.filter(c => c.created_at < thisStart)
      const tw = wahoos.filter(w => w.completed_at >= thisStart)
      const lw = wahoos.filter(w => w.completed_at < thisStart)

      const thisWeek = computeAxes(tc, tch, tw)
      const lastWeek = computeAxes(lc, lch, lw)

      const trend = thisWeek.capacity !== null && lastWeek.capacity !== null
        ? thisWeek.capacity - lastWeek.capacity : 0

      const getTrend = (curr, prev) => {
        if (curr === null || prev === null) return 'flat'
        if (curr - prev > 0.3) return 'up'
        if (curr - prev < -0.3) return 'down'
        return 'flat'
      }

      const totalInputs = tc.length + tch.length + tw.length

      setData({
        safety: thisWeek.safety,
        expression: thisWeek.expression,
        capacity: thisWeek.capacity,
        zone: thisWeek.zone,
        trend,
        safetyTrend: getTrend(thisWeek.safety, lastWeek.safety),
        expressionTrend: getTrend(thisWeek.expression, lastWeek.expression),
        maintenancePct: thisWeek.maintenancePct,
        maintenanceDays: thisWeek.maintenanceDays,
        pillars: thisWeek.pillars,
        activePillars: thisWeek.activePillars,
        todayProgress: thisWeek.todayProgress,
        dataPoints: totalInputs,
        loading: false,
      })

      // Persist capacity to user_lifetime_scores for cross-user leaderboard reads
      // Also check for zone transition (mystery box trigger)
      supabase
        .from('user_lifetime_scores')
        .select('capacity_zone')
        .eq('user_id', userId)
        .is('project_id', null)
        .maybeSingle()
        .then(({ data: prev }) => {
          const previousZone = prev?.capacity_zone
          supabase
            .from('user_lifetime_scores')
            .update({
              capacity_score: thisWeek.capacity,
              capacity_zone: thisWeek.zone,
              safety_score: thisWeek.safety,
              expression_score: thisWeek.expression,
            })
            .eq('user_id', userId)
            .is('project_id', null)
            .then(() => {
              if (previousZone && thisWeek.zone !== previousZone) {
                import('../lib/mysteryBoxes').then(({ checkZoneTransitionBox }) => {
                  checkZoneTransitionBox(userId, thisWeek.zone, previousZone)
                }).catch(() => {})
              }
            })
        })
    }).catch(err => {
      console.error('useCapacityScore error:', err)
      setData(prev => ({ ...prev, loading: false }))
    })
  }, [userId, refreshTrigger])

  return data
}

export default useCapacityScore
