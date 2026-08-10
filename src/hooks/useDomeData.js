import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Hook to read/write Experience Dome ratings for the current user.
 * Returns { domeStates, setNodeState, loading }
 *
 * domeStates: { [nodeId]: 'vibe_rise' | 'fun' | 'growth_edge' | 'pressure' | 'bored' }
 * setNodeState(nodeId, state): upserts a rating (state=null deletes it)
 */
export function useDomeData(userId) {
  const [domeStates, setDomeStates] = useState({})
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
        .select('node_id, ns_state')
        .eq('user_id', userId)

      if (error) {
        console.error('Failed to load dome ratings:', error)
        setLoading(false)
        return
      }

      const states = {}
      data.forEach(row => {
        states[row.node_id] = row.ns_state
      })
      setDomeStates(states)
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
  const bulkSetStates = useCallback(async (ratings) => {
    if (!userId) return

    // Optimistic update
    setDomeStates(prev => {
      const next = { ...prev }
      Object.entries(ratings).forEach(([nodeId, state]) => {
        if (!state) delete next[nodeId]
        else next[nodeId] = state
      })
      return next
    })

    const rows = Object.entries(ratings)
      .filter(([, state]) => state)
      .map(([nodeId, state]) => ({
        user_id: userId,
        node_id: nodeId,
        ns_state: state,
        updated_at: new Date().toISOString(),
      }))

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

  return { domeStates, setNodeState, bulkSetStates, loading }
}
