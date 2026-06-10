/**
 * useNervousSystemMap — fetches and aggregates nervous_system_checkins data
 * for the /nervous-system-map page.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

function getWeekNumber(dateStr, startDate) {
  const d = new Date(dateStr)
  const diff = d - startDate
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1
}

export default function useNervousSystemMap(userId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    const loadData = async () => {
      setLoading(true)
      const { data: checkins, error } = await supabase
        .from('nervous_system_checkins')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (cancelled) return
      if (error || !checkins?.length) {
        setData(null)
        setLoading(false)
        return
      }

      const startDate = new Date(checkins[0].created_at)
      const now = new Date()
      const totalWeeks = Math.max(1, Math.ceil((now - startDate) / (7 * 24 * 60 * 60 * 1000)))

      // Overall distribution
      const totals = { vibe_rise: 0, ventral: 0, sympathetic: 0, dorsal: 0 }
      const beforeTotals = { vibe_rise: 0, ventral: 0, sympathetic: 0, dorsal: 0 }
      const afterTotals = { vibe_rise: 0, ventral: 0, sympathetic: 0, dorsal: 0 }
      const archetypeCounts = {}
      const shifts = {}

      // Weekly buckets
      const weeklyBuckets = {}

      checkins.forEach((c) => {
        // Before state distribution (baseline)
        if (c.before_state) {
          totals[c.before_state]++
          beforeTotals[c.before_state]++
        }

        // After state distribution
        if (c.after_state) {
          afterTotals[c.after_state]++
        }

        // Shift pattern
        if (c.before_state && c.after_state) {
          const key = `${c.before_state}_${c.after_state}`
          shifts[key] = (shifts[key] || 0) + 1
        }

        // Archetype counts
        if (c.protective_archetype) {
          archetypeCounts[c.protective_archetype] = (archetypeCounts[c.protective_archetype] || 0) + 1
        }

        // Weekly buckets (based on before_state)
        const week = getWeekNumber(c.created_at, startDate)
        if (!weeklyBuckets[week]) weeklyBuckets[week] = { vibe_rise: 0, ventral: 0, sympathetic: 0, dorsal: 0 }
        if (c.before_state) weeklyBuckets[week][c.before_state]++
      })

      const total = totals.vibe_rise + totals.ventral + totals.sympathetic + totals.dorsal
      const beforeTotal = beforeTotals.vibe_rise + beforeTotals.ventral + beforeTotals.sympathetic + beforeTotals.dorsal
      const afterTotal = afterTotals.vibe_rise + afterTotals.ventral + afterTotals.sympathetic + afterTotals.dorsal

      // Safe percentage that ensures quad sums to 100
      const pctQuad = (counts, t) => {
        if (t === 0) return { vibe_rise: 0, ventral: 0, sympathetic: 0, dorsal: 0 }
        const vr = Math.round((counts.vibe_rise / t) * 100)
        const ve = Math.round((counts.ventral / t) * 100)
        const sy = Math.round((counts.sympathetic / t) * 100)
        const dr = 100 - vr - ve - sy
        return { vibe_rise: vr, ventral: ve, sympathetic: sy, dorsal: Math.max(0, dr) }
      }

      // Build weekly timeline (fill gaps)
      const maxWeekFromData = Object.keys(weeklyBuckets).length > 0
        ? Math.max(...Object.keys(weeklyBuckets).map(Number))
        : totalWeeks
      const weeklyTimeline = []
      for (let w = 1; w <= Math.max(totalWeeks, maxWeekFromData); w++) {
        const bucket = weeklyBuckets[w] || { vibe_rise: 0, ventral: 0, sympathetic: 0, dorsal: 0 }
        const weekTotal = bucket.vibe_rise + bucket.ventral + bucket.sympathetic + bucket.dorsal
        const wp = pctQuad(bucket, weekTotal)
        weeklyTimeline.push({
          week: w,
          ...wp,
          count: weekTotal,
        })
      }

      // Named shift patterns
      const shiftPatterns = [
        { key: 'ventral_vibe_rise', emoji: '😊 → ⚡', label: 'Vibe Rise', count: shifts.ventral_vibe_rise || 0 },
        { key: 'sympathetic_vibe_rise', emoji: '😬 → ⚡', label: 'Activated safe', count: shifts.sympathetic_vibe_rise || 0 },
        { key: 'vibe_rise_vibe_rise', emoji: '⚡ → ⚡', label: 'Sustained', count: shifts.vibe_rise_vibe_rise || 0 },
        { key: 'dorsal_ventral', emoji: '😶 → 😊', label: 'Breakthroughs', count: shifts.dorsal_ventral || 0 },
        { key: 'sympathetic_ventral', emoji: '😬 → 😊', label: 'Regulated', count: shifts.sympathetic_ventral || 0 },
        { key: 'ventral_ventral', emoji: '😊 → 😊', label: 'Maintained', count: shifts.ventral_ventral || 0 },
      ]

      // Archetype list sorted by count
      const archetypeList = Object.entries(archetypeCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)

      const maxArchCount = archetypeList.length > 0 ? archetypeList[0].count : 1

      // Determine dominant state
      const stateEntries = [
        ['vibe_rise', totals.vibe_rise],
        ['ventral', totals.ventral],
        ['sympathetic', totals.sympathetic],
        ['dorsal', totals.dorsal],
      ]
      const dominant = stateEntries.reduce((a, b) => b[1] > a[1] ? b : a)[0]

      if (cancelled) return
      setData({
        totalCheckins: checkins.length,
        totalWeeks,
        dominant,
        overall: pctQuad(totals, total),
        before: pctQuad(beforeTotals, beforeTotal),
        after: pctQuad(afterTotals, afterTotal),
        weeklyTimeline,
        shiftPatterns,
        archetypeList,
        maxArchCount,
      })
      setLoading(false)
    }

    loadData()
    return () => { cancelled = true }
  }, [userId])

  return { data, loading }
}
