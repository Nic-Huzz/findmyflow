/**
 * useAppBuildData.js — Data hook for Build Your App flow
 *
 * Manages: challenge progress (checkbox tracking), prework responses, unlock logic.
 * Challenge content comes from static data (appBuildChallenges.js).
 * Progress persists in Supabase (app_build_progress, app_build_prework).
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { APP_BUILD_CHALLENGES } from '../data/appBuildChallenges'

export default function useAppBuildData() {
  const { user } = useAuth()
  const userId = user?.id

  const [progress, setProgress] = useState({})    // { [challengeNumber]: { checkboxes: [], completedAt } }
  const [prework, setPrework] = useState(null)     // { responses, completedAt }
  const [loading, setLoading] = useState(true)

  // Fetch all progress + prework on mount
  useEffect(() => {
    if (!userId) { setLoading(false); return }

    async function load() {
      setLoading(true)
      const [progressRes, preworkRes] = await Promise.all([
        supabase
          .from('app_build_progress')
          .select('challenge_number, checkboxes_completed, completed_at')
          .eq('user_id', userId),
        supabase
          .from('app_build_prework')
          .select('responses, completed_at')
          .eq('user_id', userId)
          .maybeSingle()
      ])

      if (progressRes.data) {
        const map = {}
        progressRes.data.forEach(row => {
          map[row.challenge_number] = {
            checkboxes: row.checkboxes_completed || [],
            completedAt: row.completed_at
          }
        })
        setProgress(map)
      }

      if (preworkRes.data) {
        setPrework({
          responses: preworkRes.data.responses || {},
          completedAt: preworkRes.data.completed_at
        })
      }

      setLoading(false)
    }

    load()
  }, [userId])

  // Check if a challenge is unlocked
  const isUnlocked = useCallback((challengeNumber) => {
    if (challengeNumber === 1) return !!prework?.completedAt
    // Each challenge unlocks when the previous one is completed
    const prev = progress[challengeNumber - 1]
    return !!prev?.completedAt
  }, [progress, prework])

  // Toggle a checkbox for a challenge
  const toggleCheckbox = useCallback(async (challengeNumber, checkboxId) => {
    if (!userId) return

    const current = progress[challengeNumber]?.checkboxes || []
    const updated = current.includes(checkboxId)
      ? current.filter(id => id !== checkboxId)
      : [...current, checkboxId]

    // Check if all checkboxes are now completed
    const challenge = APP_BUILD_CHALLENGES.find(c => c.number === challengeNumber)
    const allIds = challenge?.checkboxes?.map(c => c.id) || []
    const allDone = allIds.length > 0 && allIds.every(id => updated.includes(id))

    // Optimistic update
    setProgress(prev => ({
      ...prev,
      [challengeNumber]: {
        checkboxes: updated,
        completedAt: allDone ? new Date().toISOString() : (prev[challengeNumber]?.completedAt || null)
      }
    }))

    // Upsert to DB
    const { error } = await supabase
      .from('app_build_progress')
      .upsert({
        user_id: userId,
        challenge_number: challengeNumber,
        checkboxes_completed: updated,
        completed_at: allDone ? new Date().toISOString() : null
      }, { onConflict: 'user_id,challenge_number' })

    if (error) console.error('Error saving app build progress:', error)
  }, [userId, progress])

  // Save prework responses
  const savePrework = useCallback(async (responses, isComplete = false) => {
    if (!userId) return

    const completedAt = isComplete ? new Date().toISOString() : null

    setPrework({ responses, completedAt })

    const { error } = await supabase
      .from('app_build_prework')
      .upsert({
        user_id: userId,
        responses,
        completed_at: completedAt
      }, { onConflict: 'user_id' })

    if (error) console.error('Error saving app build prework:', error)
  }, [userId])

  // Save feedback/metadata for a challenge (used by Challenge 5)
  const saveFeedback = useCallback(async (challengeNumber, feedbackData) => {
    if (!userId) return

    const { error } = await supabase
      .from('app_build_progress')
      .upsert({
        user_id: userId,
        challenge_number: challengeNumber,
        checkboxes_completed: progress[challengeNumber]?.checkboxes || [],
        metadata: feedbackData
      }, { onConflict: 'user_id,challenge_number' })

    if (error) console.error('Error saving app build feedback:', error)
  }, [userId, progress])

  // Get completion percentage for a challenge
  const getProgress = useCallback((challengeNumber) => {
    const challenge = APP_BUILD_CHALLENGES.find(c => c.number === challengeNumber)
    if (!challenge?.checkboxes?.length) return 0
    const completed = progress[challengeNumber]?.checkboxes || []
    return Math.round((completed.length / challenge.checkboxes.length) * 100)
  }, [progress])

  // Is a specific checkbox checked?
  const isChecked = useCallback((challengeNumber, checkboxId) => {
    return (progress[challengeNumber]?.checkboxes || []).includes(checkboxId)
  }, [progress])

  return {
    loading,
    challenges: APP_BUILD_CHALLENGES,
    progress,
    prework,
    isUnlocked,
    toggleCheckbox,
    savePrework,
    saveFeedback,
    getProgress,
    isChecked
  }
}
