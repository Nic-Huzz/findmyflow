import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Hook to read/write Experience Dome ratings for the current user.
 * Returns { domeStates, wantPaidStates, setNodeState, bulkSetStates, loading }
 *
 * domeStates: { [nodeId]: 'vibe_rise' | 'fun' | 'growth_edge' | 'pressure' | 'bored' }
 * wantPaidStates: { [nodeId]: true | false } — only for fun/vibe_rise nodes
 * setNodeState(nodeId, state): upserts a rating (state=null deletes it)
 * bulkSetStates(ratings, wantPaidMap?): upserts ratings + optional want_paid in one call
 */
export function useDomeData(userId) {
  const [domeStates, setDomeStates] = useState({})
  const [wantPaidStates, setWantPaidStates] = useState({})
  const [loading, setLoading] = useState(true)

  // Load all ratings for user
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function load() {
      const { data, error } = await supabase
        .from('experience_dome_ratings')
        .select('node_id, ns_state, want_paid')
        .eq('user_id', userId)

      if (error) {
        console.error('Failed to load dome ratings:', error)
        setLoading(false)
        return
      }

      const states = {}
      const paid = {}
      data.forEach(row => {
        states[row.node_id] = row.ns_state
        if (row.want_paid != null) paid[row.node_id] = row.want_paid
      })
      setDomeStates(states)
      setWantPaidStates(paid)
      setLoading(false)
    }

    load()
  }, [userId])

  // Upsert or delete a single rating
  const setNodeState = useCallback(async (nodeId, state) => {
    if (!userId) return

    // Optimistic update
    setDomeStates(prev => {
      if (!state) {
        const next = { ...prev }
        delete next[nodeId]
        return next
      }
      return { ...prev, [nodeId]: state }
    })

    if (!state) {
      // Delete
      const { error } = await supabase
        .from('experience_dome_ratings')
        .delete()
        .eq('user_id', userId)
        .eq('node_id', nodeId)

      if (error) console.error('Failed to delete dome rating:', error)
    } else {
      // Upsert
      const { error } = await supabase
        .from('experience_dome_ratings')
        .upsert({
          user_id: userId,
          node_id: nodeId,
          ns_state: state,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,node_id' })

      if (error) console.error('Failed to upsert dome rating:', error)
    }
  }, [userId])

  // Bulk upsert (for onboarding completion)
  // wantPaidMap is optional: { [nodeId]: true | false }
  const bulkSetStates = useCallback(async (ratings, wantPaidMap) => {
    if (!userId) return

    // Optimistic update — ratings
    setDomeStates(prev => {
      const next = { ...prev }
      Object.entries(ratings).forEach(([nodeId, state]) => {
        if (!state) delete next[nodeId]
        else next[nodeId] = state
      })
      return next
    })

    // Optimistic update — want_paid
    if (wantPaidMap) {
      setWantPaidStates(prev => {
        const next = { ...prev }
        Object.entries(wantPaidMap).forEach(([nodeId, val]) => {
          if (val == null) delete next[nodeId]
          else next[nodeId] = val
        })
        return next
      })
    }

    const rows = Object.entries(ratings)
      .filter(([, state]) => state)
      .map(([nodeId, state]) => {
        const row = {
          user_id: userId,
          node_id: nodeId,
          ns_state: state,
          updated_at: new Date().toISOString(),
          // Explicitly set want_paid: use map value if provided, else null
          // (clears stale want_paid on re-rated nodes)
          want_paid: (wantPaidMap && wantPaidMap[nodeId] != null) ? wantPaidMap[nodeId] : null,
        }
        return row
      })

    if (rows.length > 0) {
      const { error } = await supabase
        .from('experience_dome_ratings')
        .upsert(rows, { onConflict: 'user_id,node_id' })

      if (error) console.error('Failed to bulk upsert dome ratings:', error)
    }

    // Delete cleared ratings
    const deletedIds = Object.entries(ratings)
      .filter(([, state]) => !state)
      .map(([nodeId]) => nodeId)

    if (deletedIds.length > 0) {
      const { error } = await supabase
        .from('experience_dome_ratings')
        .delete()
        .eq('user_id', userId)
        .in('node_id', deletedIds)

      if (error) console.error('Failed to bulk delete dome ratings:', error)
    }
  }, [userId])

  return { domeStates, wantPaidStates, setNodeState, bulkSetStates, loading }
}
