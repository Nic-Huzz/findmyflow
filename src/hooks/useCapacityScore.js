/**
 * useCapacityScore.js — v4 Pillar Model
 *
 * Zone = how many of 3 pillars are active in a 7-day window:
 *   0 active → Stuck (0-25)
 *   1 active → Wired (25-50)
 *   2 active → Grounded (50-75)
 *   3 active → Vibe Rise (75-100)
 *
 * Position within zone = average strength of active pillars.
 *
 * Pillar thresholds (7-day window):
 *   Safety:      3+ practices (meditation, breathwork, prayer, healing, self-compassion, savouring, connect)
 *   Expression:  3+ practices OR 1+ completed courage challenge
 *   Maintenance: 50%+ of daily items logged (sleep, exercise, sunlight, meals)
 *
 * Zones: 0-25 Stuck, 25-50 Wired, 50-75 Grounded, 75-100 Vibe Rise
 * Rolling 7-day window.
 *
 * Rewritten: 2026-08-30 (v4)
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatLocalDate } from '../lib/dateUtils'

// Pillar activation thresholds
const SAFETY_THRESHOLD = 3       // 3+ safety practices in 7 days
const EXPRESSION_THRESHOLD = 3   // 3+ expression practices OR 1+ wahoo
const MAINTENANCE_THRESHOLD = 50 // 50%+ of daily items logged

// Max strength per pillar (for normalising to 0-1)
const SAFETY_MAX = 15    // ~2/day of 5 possible items
const EXPRESSION_MAX = 15
const MAINTENANCE_MAX = 100 // percentage

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

function computeAxes(completions, checkins, wahoos) {
  // --- Count Safety inputs ---
  const safetyPractices = completions.filter(c => SAFETY_IDS.includes(c.quest_id)).length
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
  const safetyCount = safetyPractices + dailyHealing + weeklyHealing

  // --- Count Expression inputs ---
  const exprPractices = completions.filter(c => EXPRESSION_IDS.includes(c.quest_id)).length
  const embodyEssence = completions.filter(c => c.quest_id === 'rewire_behavior_change').length
  const wahooCount = wahoos.length
  const exprCount = exprPractices + embodyEssence + wahooCount

  // --- Maintenance (rolling 7-day %) ---
  const maintenanceCompletions = completions.filter(c => MAINTENANCE_IDS.includes(c.quest_id))
  const dayMap = {}
  maintenanceCompletions.forEach(c => {
    if (c.completed_at) {
      const day = formatLocalDate(new Date(c.completed_at))
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

  // --- Pillar activation ---
  const safetyActive = safetyCount >= SAFETY_THRESHOLD
  const expressionActive = exprCount >= EXPRESSION_THRESHOLD || wahooCount >= 1
  const maintenanceActive = maintenancePct >= MAINTENANCE_THRESHOLD

  const activePillars = [safetyActive, expressionActive, maintenanceActive].filter(Boolean).length

  // --- Pillar strengths (0-1 each) ---
  const safetyStrength = Math.min(1, safetyCount / SAFETY_MAX)
  const expressionStrength = Math.min(1, exprCount / EXPRESSION_MAX)
  const maintenanceStrength = Math.min(1, maintenancePct / MAINTENANCE_MAX)

  // Average strength of ACTIVE pillars determines position within zone
  const activeStrengths = []
  if (safetyActive) activeStrengths.push(safetyStrength)
  if (expressionActive) activeStrengths.push(expressionStrength)
  if (maintenanceActive) activeStrengths.push(maintenanceStrength)
  const avgStrength = activeStrengths.length > 0
    ? activeStrengths.reduce((a, b) => a + b, 0) / activeStrengths.length
    : 0

  // --- Compute capacity score ---
  const ZONE_BASE = { 0: 0, 1: 25, 2: 50, 3: 75 }
  const ZONE_RANGE = 25
  const capacity = Math.round(ZONE_BASE[activePillars] + avgStrength * (ZONE_RANGE - 1))

  // Back-compat: safety/expression as 0-10 values from strength
  const safety = Math.round(safetyStrength * 10 * 10) / 10
  const expression = Math.round(expressionStrength * 10 * 10) / 10

  return {
    safety,
    expression,
    capacity,
    zone: getZone(capacity),
    maintenancePct,
    maintenanceDays,
    pillars: {
      safety: { active: safetyActive, count: safetyCount, strength: safetyStrength },
      expression: { active: expressionActive, count: exprCount, strength: expressionStrength },
      maintenance: { active: maintenanceActive, pct: maintenancePct, strength: maintenanceStrength },
    },
    activePillars,
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
