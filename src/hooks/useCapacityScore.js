/**
 * useCapacityScore.js
 *
 * Capacity Score = Safety × Expression (both 0-10, product mapped to 0-100).
 *
 * Safety (container): how held is your nervous system?
 *   + safety practices (breathwork, meditation, prayer, connect, feel emotions)
 *   + healing quests
 *   - stalls (protective voice won)
 *
 * Expression (expansion): how much are you showing up as your essence?
 *   + wahoos (completed courage challenges)
 *   + expression practices (dance, voice, style, social, values)
 *   + embody your essence quest
 *   - drains (energy depleted)
 *
 * Maintenance: separate rolling 7-day % (sleep, exercise, eating, sunlight)
 *
 * Zone mapping: 0-25 Stuck, 25-50 Wired, 50-75 Grounded, 75-100 Vibe Rise
 *
 * Created: 2026-05-09, Rewritten: 2026-05-14
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getWeekStartLocal, formatLocalDate } from '../lib/dateUtils'

// Quest IDs by category
const MAINTENANCE_IDS = ['practice_sleep', 'practice_exercise', 'practice_sunlight', 'practice_healthy_meal']
const SAFETY_IDS = ['reconnect_morning_breathwork', 'reconnect_morning_meditation', 'reconnect_daily_prayer', 'practice_connect_friend', 'practice_feel_emotions']
const EXPRESSION_IDS = ['reconnect_morning_dance', 'practice_voice_work', 'practice_own_style', 'practice_social_media', 'practice_honour_values']

// Scoring targets (weekly)
const SAFETY_PRACTICE_TARGET = 20   // ~4 safety practices/day × 5 days
const SAFETY_HEALING_TARGET = 4     // ~4 healing quests/week
const EXPRESSION_PRACTICE_TARGET = 15 // ~3 expression practices/day × 5 days
const EXPRESSION_WAHOO_TARGET = 2    // 2 wahoos/week

function getWeekStartDate(weeksAgo = 0) {
  const start = getWeekStartLocal()
  if (weeksAgo === 0) return start
  const d = new Date(start + 'T00:00:00')
  d.setDate(d.getDate() - weeksAgo * 7)
  return formatLocalDate(d)
}

function getZone(score) {
  if (score >= 75) return 'vibe-rise'
  if (score >= 50) return 'grounded'
  if (score >= 25) return 'wired'
  return 'stuck'
}

function computeAxes(completions, checkins, wahoos) {
  // --- Safety Score ---
  const safetyPractices = completions.filter(c => SAFETY_IDS.includes(c.quest_id)).length
  const healingQuests = completions.filter(c => c.quest_category === 'Healing').length
  const stalls = checkins.filter(c => c.checkin_type === 'stall').length

  const safetyFromPractices = Math.min(1, safetyPractices / SAFETY_PRACTICE_TARGET) * 4
  const safetyFromHealing = Math.min(1, healingQuests / SAFETY_HEALING_TARGET) * 3
  const safetyPenalty = stalls * 0.8
  const safetyRaw = Math.max(0, Math.min(10, 1 + safetyFromPractices + safetyFromHealing - safetyPenalty))

  // --- Expression Score ---
  const expressionPractices = completions.filter(c => EXPRESSION_IDS.includes(c.quest_id)).length
  const embodyEssence = completions.filter(c => c.quest_id === 'rewire_behavior_change').length
  const wahooCount = wahoos.length
  const drains = checkins.filter(c => c.checkin_type === 'drain').length

  const exprFromWahoos = Math.min(1, wahooCount / EXPRESSION_WAHOO_TARGET) * 4
  const exprFromPractices = Math.min(1, expressionPractices / EXPRESSION_PRACTICE_TARGET) * 3
  const exprFromEmbody = Math.min(1, embodyEssence) * 1
  const exprPenalty = drains * 0.8
  const expressionRaw = Math.max(0, Math.min(10, 1 + exprFromWahoos + exprFromPractices + exprFromEmbody - exprPenalty))

  // --- Capacity ---
  const safety = Math.round(safetyRaw * 10) / 10
  const expression = Math.round(expressionRaw * 10) / 10
  const capacity = Math.round((safety * expression / 10) * 10)

  // --- Maintenance ---
  // Count maintenance completions per day over the 7-day window
  const maintenanceCompletions = completions.filter(c => MAINTENANCE_IDS.includes(c.quest_id))
  const dayMap = {}
  maintenanceCompletions.forEach(c => {
    const day = c.completed_at?.substring(0, 10)
    if (day) {
      if (!dayMap[day]) dayMap[day] = new Set()
      dayMap[day].add(c.quest_id)
    }
  })

  // Build 7-day dot data
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

  // Rolling 7-day maintenance %
  const totalMaintPossible = MAINTENANCE_IDS.length * 7
  const totalMaintDone = maintenanceDays.reduce((sum, d) => sum + d.done, 0)
  const maintenancePct = totalMaintPossible > 0 ? Math.round((totalMaintDone / totalMaintPossible) * 100) : 0

  return { safety, expression, capacity, zone: getZone(capacity), maintenancePct, maintenanceDays }
}

export function useCapacityScore(userId, refreshTrigger = 0) {
  const [data, setData] = useState({
    safety: null,
    expression: null,
    capacity: null,
    zone: null,
    trend: 0,
    safetyTrend: null,   // 'up' | 'down' | 'flat'
    expressionTrend: null,
    maintenancePct: 0,
    maintenanceDays: [],
    dataPoints: 0,
    loading: true,
  })

  useEffect(() => {
    if (!userId) return

    const thisWeekStart = getWeekStartDate(0)
    const lastWeekStart = getWeekStartDate(1)

    Promise.all([
      // This week's quest completions (Tune + Healing + Groans for Embody Your Essence)
      supabase
        .from('quest_completions')
        .select('quest_id, quest_category, completed_at')
        .eq('user_id', userId)
        .in('quest_category', ['Tune', 'Healing', 'Groans'])
        .gte('completed_at', thisWeekStart),
      // Last week's quest completions
      supabase
        .from('quest_completions')
        .select('quest_id, quest_category, completed_at')
        .eq('user_id', userId)
        .in('quest_category', ['Tune', 'Healing', 'Groans'])
        .gte('completed_at', lastWeekStart)
        .lt('completed_at', thisWeekStart),
      // This week's NS checkins (drains + stalls)
      supabase
        .from('nervous_system_checkins')
        .select('checkin_type, created_at')
        .eq('user_id', userId)
        .in('checkin_type', ['drain', 'stall'])
        .gte('created_at', thisWeekStart),
      // Last week's NS checkins
      supabase
        .from('nervous_system_checkins')
        .select('checkin_type, created_at')
        .eq('user_id', userId)
        .in('checkin_type', ['drain', 'stall'])
        .gte('created_at', lastWeekStart)
        .lt('created_at', thisWeekStart),
      // This week's wahoos (real edge-crossing: scary >= 7 AND wahoo >= 7)
      supabase
        .from('groan_challenges')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('scary_score', 7)
        .gte('wahoo_score', 7)
        .gte('completed_at', thisWeekStart),
      // Last week's wahoos
      supabase
        .from('groan_challenges')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('scary_score', 7)
        .gte('wahoo_score', 7)
        .gte('completed_at', lastWeekStart)
        .lt('completed_at', thisWeekStart),
    ]).then(([
      { data: thisCompletions },
      { data: lastCompletions },
      { data: thisCheckins },
      { data: lastCheckins },
      { data: thisWahoos },
      { data: lastWahoos },
    ]) => {
      const thisWeek = computeAxes(thisCompletions || [], thisCheckins || [], thisWahoos || [])
      const lastWeek = computeAxes(lastCompletions || [], lastCheckins || [], lastWahoos || [])

      const trend = thisWeek.capacity !== null && lastWeek.capacity !== null
        ? thisWeek.capacity - lastWeek.capacity
        : 0

      const getTrend = (curr, prev) => {
        if (curr === null || prev === null) return 'flat'
        const diff = curr - prev
        if (diff > 0.3) return 'up'
        if (diff < -0.3) return 'down'
        return 'flat'
      }

      const totalInputs = (thisCompletions?.length || 0) + (thisCheckins?.length || 0) + (thisWahoos?.length || 0)

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
