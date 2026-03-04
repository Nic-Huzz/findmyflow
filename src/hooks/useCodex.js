import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import {
  CODEX_CATEGORIES,
  checkUnlock,
  getCategoryEntries,
  getCategoryProgress,
} from '../data/codex/index'
import { VOICE_ARCHIVES } from '../data/codex/voiceArchives'
import { FLOW_SCROLLS } from '../data/codex/flowScrolls'
import { FOUNDER_JOURNEY } from '../data/codex/founderJourney'
import { ANCIENT_WISDOM } from '../data/codex/ancientWisdom'

// Combine all entries
const ALL_ENTRIES = [
  ...VOICE_ARCHIVES,
  ...FLOW_SCROLLS,
  ...FOUNDER_JOURNEY,
  ...ANCIENT_WISDOM,
]

/**
 * Hook for fetching codex data and computing unlock status
 *
 * @param {string} userId - User ID
 * @returns {object} - Codex data, loading state, error
 */
export function useCodex(userId) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userData, setUserData] = useState({
    protectiveVoice: null,
    flowFinderComplete: false,
    onboardingComplete: false,
    currentStage: 0,
    groanChallenges: [],
    compassCheckins: 0,
    daysActive: 0,
  })

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch all required data in parallel
      const [
        profileResult,
        flowSessionsResult,
        stageProgressResult,
        projectsResult,
        groanChallengesResult,
        compassResult,
        userCreatedResult,
      ] = await Promise.all([
        // 1. Protective voice from lead_flow_profiles
        supabase
          .from('lead_flow_profiles')
          .select('protective_archetype')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1),

        // 2. Flow Finder completion - check for mind_space completion
        supabase
          .from('flow_sessions')
          .select('id')
          .eq('user_id', userId)
          .eq('flow_type', 'mind_space')
          .eq('status', 'completed')
          .limit(1),

        // 3. Onboarding complete - check if persona exists
        supabase
          .from('user_stage_progress')
          .select('persona')
          .eq('user_id', userId)
          .maybeSingle(),

        // 4. Current stage from projects
        supabase
          .from('user_projects')
          .select('current_stage')
          .eq('user_id', userId)
          .in('status', ['active', 'completed']),

        // 5. Groan challenges for playground tracking
        supabase
          .from('groan_challenges')
          .select('id, status, visibility_layer, voice_targeted')
          .eq('user_id', userId),

        // 6. Compass check-ins count from flow_entries
        supabase
          .from('flow_entries')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .eq('entry_type', 'compass'),

        // 7. User created_at for days active calculation
        supabase.auth.getUser(),
      ])

      // Process protective voice
      const protectiveVoice = profileResult.data?.[0]?.protective_archetype || null
      console.log('[useCodex] Protective voice from DB:', protectiveVoice)

      // Process Flow Finder completion
      const flowFinderComplete = flowSessionsResult.data?.length > 0

      // Process onboarding complete (use flag, not persona — persona set later in BusinessSetup)
      const onboardingComplete = !!stageProgressResult.data?.onboarding_v2_completed

      // Process current stage (max across all projects)
      const currentStage = projectsResult.data?.reduce(
        (max, p) => Math.max(max, p.current_stage || 0),
        0
      ) || 0

      // Process groan challenges
      const groanChallenges = groanChallengesResult.data || []

      // Process compass check-ins
      const compassCheckins = compassResult.count || 0

      // Process days active
      let daysActive = 0
      if (userCreatedResult.data?.user?.created_at) {
        const createdAt = new Date(userCreatedResult.data.user.created_at)
        const now = new Date()
        daysActive = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24))
      }

      setUserData({
        protectiveVoice,
        flowFinderComplete,
        onboardingComplete,
        currentStage,
        groanChallenges,
        compassCheckins,
        daysActive,
      })
    } catch (err) {
      console.error('Error in useCodex:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Compute entries with unlock status
  const entries = useMemo(() => {
    return ALL_ENTRIES.map(entry => ({
      ...entry,
      isUnlocked: checkUnlock(entry, userData),
    }))
  }, [userData])

  // Compute progress per category
  const progress = useMemo(() => {
    const result = {}
    Object.keys(CODEX_CATEGORIES).forEach(categoryId => {
      result[categoryId] = getCategoryProgress(categoryId, ALL_ENTRIES, userData)
    })
    return result
  }, [userData])

  // Get total progress
  const totalProgress = useMemo(() => {
    const totalUnlocked = entries.filter(e => e.isUnlocked).length
    const total = entries.length
    return {
      unlocked: totalUnlocked,
      total,
      percentage: total > 0 ? Math.round((totalUnlocked / total) * 100) : 0,
    }
  }, [entries])

  // Get entries by category with unlock status
  const getEntriesByCategory = useCallback(
    categoryId => {
      return getCategoryEntries(categoryId, ALL_ENTRIES, userData)
    },
    [userData]
  )

  // Get single entry by ID
  const getEntryById = useCallback(
    entryId => {
      const entry = entries.find(e => e.id === entryId)
      return entry || null
    },
    [entries]
  )

  // Get next/prev entries in same category
  const getAdjacentEntries = useCallback(
    entryId => {
      const entry = entries.find(e => e.id === entryId)
      if (!entry) return { prev: null, next: null }

      const categoryEntries = entries
        .filter(e => e.category === entry.category)
        .sort((a, b) => (a.order || 0) - (b.order || 0))

      const currentIndex = categoryEntries.findIndex(e => e.id === entryId)
      const prev = currentIndex > 0 ? categoryEntries[currentIndex - 1] : null
      const next =
        currentIndex < categoryEntries.length - 1
          ? categoryEntries[currentIndex + 1]
          : null

      return { prev, next }
    },
    [entries]
  )

  return {
    entries,
    categories: CODEX_CATEGORIES,
    progress,
    totalProgress,
    userData,
    loading,
    error,
    refresh: fetchData,
    getEntriesByCategory,
    getEntryById,
    getAdjacentEntries,
  }
}

export default useCodex
