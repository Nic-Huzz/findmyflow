/**
 * useCapacityScore.js
 *
 * Vibe Rise Score = Safety × Expression (each 0-10, product 0-100).
 *
 * Everything measured in Wahoo-equivalents:
 *   practice = 1pt, daily healing = 1pt, weekly healing = 3pt,
 *   wahoo = 5pt, stall = -1pt, drain = -1pt
 *
 * Score = min(10, BASELINE + net_points / DIVISOR)
 * Baseline 3 = "you're a human with a nervous system, that's not zero"
 * Divisor 5 = calibrated so beginners ≈ 25 (Wired), month 2 ≈ 85+ (Vibe Rise)
 *
 * Display multiplier: points shown in app are ×2 for bigger dopamine.
 * Internal math uses ×1. Displayed via DISPLAY_MULTIPLIER constant.
 *
 * Zones: 0-25 Stuck, 25-50 Wired, 50-75 Grounded, 75-100 Vibe Rise
 * Rolling 7-day window. First 7 days: projected by days elapsed.
 *
 * Maintenance: separate rolling 7-day % (sleep, exercise, eating, sunlight)
 *
 * Rewritten: 2026-05-14
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getWeekStartLocal, formatLocalDate } from '../lib/dateUtils'

// Internal point values for capacity scoring (wahoo = reference unit)
const POINTS = {
  practice: 1,
  dailyHealing: 1,
  weeklyHealing: 3,
  wahoo: 5,
  stall: -1,
  drain: -1,
}

const BASELINE = 3
const DIVISOR = 5

// Quest IDs by category
const MAINTENANCE_IDS = ['practice_sleep', 'practice_exercise', 'practice_sunlight', 'meal_breakfast', 'meal_lunch', 'meal_dinner']
const SAFETY_IDS = ['reconnect_morning_meditation_breathwork', 'reconnect_daily_prayer', 'practice_connect_friend', 'safety_self_compassion', 'safety_savouring']
const EXPRESSION_IDS = ['practice_voice_work', 'practice_own_style', 'practice_social_media', 'weekly_peak_state', 'rewire_weekly_focus']

function getZone(score) {
  if (score >= 75) return 'vibe-rise'
  if (score >= 50) return 'grounded'
  if (score >= 25) return 'wired'
  return 'stuck'
}

function getDaysInWindow(completions, checkins, wahoos) {
  const dates = new Set()
  ;[...completions, ...checkins].forEach(c => {
    const d = (c.completed_at || c.created_at)?.substring(0, 10)
    if (d) dates.add(d)
  })
  wahoos.forEach(w => {
    const d = w.completed_at?.substring(0, 10)
    if (d) dates.add(d)
  })
  return Math.max(1, dates.size)
}

function computeAxes(completions, checkins, wahoos, daysElapsed) {
  // --- Count inputs ---
  const safetyPractices = completions.filter(c => SAFETY_IDS.includes(c.quest_id)).length
  const exprPractices = completions.filter(c => EXPRESSION_IDS.includes(c.quest_id)).length

  const dailyHealing = completions.filter(c =>
    c.quest_category === 'Healing' && !c.quest_id?.startsWith('reconnect_weekly')
    && c.quest_id !== 'reconnect_remove_negative' && c.quest_id !== 'session_with_huzz'
  ).length
  const weeklyHealing = completions.filter(c =>
    c.quest_category === 'Healing' && (
      c.quest_id?.startsWith('reconnect_weekly') ||
      c.quest_id === 'reconnect_remove_negative' ||
      c.quest_id === 'session_with_huzz'
    )
  ).length

  const embodyEssence = completions.filter(c => c.quest_id === 'rewire_behavior_change').length
  const wahooCount = wahoos.length
  const stalls = checkins.filter(c => c.checkin_type === 'stall').length
  const drains = checkins.filter(c => c.checkin_type === 'drain').length

  // --- Safety score ---
  const safetyPositive = safetyPractices * POINTS.practice
    + dailyHealing * POINTS.dailyHealing
    + weeklyHealing * POINTS.weeklyHealing
  const safetyNegative = stalls * Math.abs(POINTS.stall)
  const safetyNet = safetyPositive - safetyNegative

  // --- Expression score ---
  const exprPositive = exprPractices * POINTS.practice
    + wahooCount * POINTS.wahoo
    + embodyEssence * POINTS.practice
  const exprNegative = drains * Math.abs(POINTS.drain)
  const exprNet = exprPositive - exprNegative

  // --- Project to 7 days if in first week ---
  const projectionFactor = daysElapsed < 7 ? (7 / daysElapsed) : 1
  const safetyProjected = safetyNet * projectionFactor
  const exprProjected = exprNet * projectionFactor

  // --- Compute scores ---
  const safety = Math.min(10, Math.max(0, BASELINE + safetyProjected / DIVISOR))
  const expression = Math.min(10, Math.max(0, BASELINE + exprProjected / DIVISOR))
  const safetyRounded = Math.round(safety * 10) / 10
  const expressionRounded = Math.round(expression * 10) / 10
  const rawCapacity = Math.round(safetyRounded * expressionRounded)

  // --- Maintenance ---
  const maintenanceCompletions = completions.filter(c => MAINTENANCE_IDS.includes(c.quest_id))
  const dayMap = {}
  maintenanceCompletions.forEach(c => {
    const day = c.completed_at?.substring(0, 10)
    if (day) {
      if (!dayMap[day]) dayMap[day] = new Set()
      dayMap[day].add(c.quest_id)
    }
  })

  const maintenanceDays = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = formatLocalDate(d)
    const done = dayMap[dateStr]?.size || 0
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

  // --- Apply maintenance as dampened multiplier ---
  // (Safety × Expression) × (0.5 + Maintenance% × 0.5)
  // 100% maintenance = full score, 0% maintenance = half score
  const maintMultiplier = 0.5 + (maintenancePct / 100) * 0.5
  const capacity = Math.round(rawCapacity * maintMultiplier)

  return {
    safety: safetyRounded,
    expression: expressionRounded,
    capacity,
    zone: getZone(capacity),
    maintenancePct,
    maintenanceDays,
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
    const thisEnd = formatLocalDate(now)

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

      const daysElapsed = getDaysInWindow(tc, tch, tw)
      const thisWeek = computeAxes(tc, tch, tw, daysElapsed)
      const lastWeek = computeAxes(lc, lch, lw, 7)

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
        dataPoints: totalInputs,
        loading: false,
      })
    }).catch(err => {
      console.error('useCapacityScore error:', err)
      setData(prev => ({ ...prev, loading: false }))
    })
  }, [userId, refreshTrigger])

  return data
}

export default useCapacityScore
