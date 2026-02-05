import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * useJourneyMap - Hook for managing journey map data
 *
 * Handles:
 * - Fetching user moments from hero_moments table
 * - Adding new moments
 * - Deleting moments
 * - Calculating current stage and progress flags
 */

export function useJourneyMap(userId) {
  const [moments, setMoments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch user moments
  const fetchMoments = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('hero_moments')
        .select('*')
        .eq('user_id', userId)
        .eq('is_system_generated', false)
        .order('moment_date', { ascending: false })

      if (fetchError) throw fetchError

      setMoments(data || [])
      setError(null) // Clear any previous errors on success
    } catch (err) {
      console.error('Error fetching moments:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchMoments()
  }, [fetchMoments])

  // Add a new moment
  const addMoment = useCallback(async (moment) => {
    if (!userId) return { error: 'No user ID' }

    try {
      const { data, error: insertError } = await supabase
        .from('hero_moments')
        .insert({
          user_id: userId,
          moment_text: moment.moment_text,
          moment_date: moment.moment_date,
          act: moment.act,
          is_system_generated: false,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Add to local state
      setMoments(prev => [data, ...prev])

      return { data }
    } catch (err) {
      console.error('Error adding moment:', err)
      return { error: err.message }
    }
  }, [userId])

  // Delete a moment
  const deleteMoment = useCallback(async (momentId) => {
    if (!userId) return { error: 'No user ID' }

    try {
      const { error: deleteError } = await supabase
        .from('hero_moments')
        .delete()
        .eq('id', momentId)
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      // Remove from local state
      setMoments(prev => prev.filter(m => m.id !== momentId))

      return { success: true }
    } catch (err) {
      console.error('Error deleting moment:', err)
      return { error: err.message }
    }
  }, [userId])

  return {
    moments,
    loading,
    error,
    addMoment,
    deleteMoment,
    refresh: fetchMoments,
  }
}

export default useJourneyMap
