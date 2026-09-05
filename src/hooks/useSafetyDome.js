/**
 * useSafetyDome.js — Compute Dome of Safety edges from completed courage challenges.
 *
 * For each dimension:
 *   domeEdge = highest level where after_state was vibe_rise or ventral (integrated)
 *   edgeZone = highest level where after_state was sympathetic (growth zone, not integrated)
 *
 * Also computes aggregate gap metrics (prediction error) and total courage score.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { DOME_DIMENSIONS, getNumericTier, calculateCourageScore, calculateGap } from '../data/domeDimensions'

const INTEGRATED_STATES = ['vibe_rise', 'ventral']
const EDGE_STATE = 'sympathetic'

export default function useSafetyDome(userId) {
  const [domeEdges, setDomeEdges] = useState({})
  const [edgeZone, setEdgeZone] = useState({})
  const [gapMetrics, setGapMetrics] = useState({ averageGap: null, totalCourageScore: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    async function compute() {
      // 1. Fetch completed challenges with dimension_values
      const { data: challenges } = await supabase
        .from('groan_challenges')
        .select('id, dimension_values, predicted_difficulty, experienced_difficulty')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .not('dimension_values', 'is', null)

      if (!challenges?.length) {
        setLoading(false)
        return
      }

      // 2. Fetch NS check-ins linked to these challenges
      const challengeIds = challenges.map(c => c.id)
      const { data: checkins } = await supabase
        .from('nervous_system_checkins')
        .select('source_challenge_id, after_state')
        .in('source_challenge_id', challengeIds)
        .order('created_at', { ascending: false })

      // Map challenge_id → after_state (most recent check-in wins)
      const stateMap = {}
      ;(checkins || []).forEach(ci => {
        if (!stateMap[ci.source_challenge_id]) {
          stateMap[ci.source_challenge_id] = ci.after_state
        }
      })

      // 3. Compute dome edges per dimension
      const edges = {}
      const zones = {}

      for (const c of challenges) {
        const afterState = stateMap[c.id]
        if (!afterState || !c.dimension_values) continue

        for (const [dimId, rawValue] of Object.entries(c.dimension_values)) {
          const dim = DOME_DIMENSIONS.find(d => d.id === dimId)
          if (!dim) continue

          const level = dim.type === 'numeric' ? getNumericTier(dimId, rawValue) : rawValue
          if (!level || level <= 0) continue

          if (INTEGRATED_STATES.includes(afterState)) {
            edges[dimId] = Math.max(edges[dimId] || 0, level)
          } else if (afterState === EDGE_STATE) {
            zones[dimId] = Math.max(zones[dimId] || 0, level)
          }
        }
      }

      setDomeEdges(edges)
      setEdgeZone(zones)

      // 4. Compute gap metrics
      let gapSum = 0
      let gapCount = 0
      let totalScore = 0

      for (const c of challenges) {
        if (c.dimension_values) {
          totalScore += calculateCourageScore(c.dimension_values)
        }
        if (c.predicted_difficulty && c.experienced_difficulty) {
          const gap = calculateGap(c.predicted_difficulty, c.experienced_difficulty)
          if (gap != null) {
            gapSum += gap
            gapCount++
          }
        }
      }

      setGapMetrics({
        averageGap: gapCount > 0 ? Math.round((gapSum / gapCount) * 100) / 100 : null,
        totalCourageScore: Math.round(totalScore * 100) / 100,
      })

      setLoading(false)
    }

    compute().catch(err => {
      console.warn('useSafetyDome error:', err)
      setLoading(false)
    })
  }, [userId])

  return { domeEdges, edgeZone, gapMetrics, loading }
}
