/**
 * usePriorityTab.js
 *
 * Data hook for the Priority tab in the 7-Day Challenge.
 * Manages 3 states: assessment → picker → quest_list
 *
 * Created: 2026-03-04
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { computePriorityLayer, TENSION_LAYER_DISPLAY } from '../lib/onboardingV2'
import { getWeekStartLocal } from '../lib/dateUtils'
import { fetchJson } from '../lib/fetchJson'

// Sequential quest recommendations per priority layer
// Discover & Regulate: recommend specific quests (first uncompleted)
// Reveal & Value: recommend play-list visibility layers
const LAYER_RECOMMENDATIONS = {
  discover: {
    type: 'quests',
    questIds: ['flow_finder_skills', 'flow_finder_problems', 'flow_finder_persona', 'recognise_nervous_system'],
  },
  regulate: {
    type: 'quests',
    questIds: ['recognise_nervous_system', 'recognise_limiting_belief_rewire'],
    alwaysRecommend: ['release_weekly_big'],
  },
  reveal: {
    type: 'playlist_layers',
    layers: ['screen', 'live', 'money'],
  },
  value: {
    type: 'playlist_layers',
    layers: ['vulnerable', 'authority'],
  },
}

export { LAYER_RECOMMENDATIONS }

// Onboarding quest IDs — must be completed in order
const ONBOARDING_QUEST_IDS = [
  'mind_space_extraction',
  'recognise_matrix_codes',
  'what_is_healing_explainer',
  'recognise_healing_compass',
  'play_list_finder',
]

export { ONBOARDING_QUEST_IDS }

export default function usePriorityTab(userId, stageProgress, isQuestEverCompleted) {
  const [loading, setLoading] = useState(true)
  const [weeklyPicks, setWeeklyPicks] = useState([])
  const [skills, setSkills] = useState([])
  const [problems, setProblems] = useState([])
  const [personas, setPersonas] = useState([])
  const [allHealingQuests, setAllHealingQuests] = useState([])
  const [forceState, setForceState] = useState(null) // override for reassess flow
  const [hasAcceptedChallenge, setHasAcceptedChallenge] = useState(false)
  const [hasCustomPhoto, setHasCustomPhoto] = useState(false)
  const [essenceProfile, setEssenceProfile] = useState(null)
  const [alignmentVersion, setAlignmentVersion] = useState(0) // bump to re-trigger onboardingStatus
  const [checkinDoneThisWeek, setCheckinDoneThisWeek] = useState(false)
  const [isFirstEverWeek, setIsFirstEverWeek] = useState(true)
  const [nudgeLayer, setNudgeLayer] = useState(null)

  const weekStart = useMemo(() => getWeekStartLocal(), [])

  // Derive tension scores and priority layer from stageProgress
  const hasTensionScores = !!(
    stageProgress?.tension_discover != null &&
    stageProgress?.tension_regulate != null &&
    stageProgress?.tension_reveal != null &&
    stageProgress?.tension_value != null
  )

  const priorityLayer = useMemo(() => {
    if (!hasTensionScores) return null
    return computePriorityLayer({
      discover: stageProgress.tension_discover,
      regulate: stageProgress.tension_regulate,
      reveal: stageProgress.tension_reveal,
      value: stageProgress.tension_value,
    })
  }, [hasTensionScores, stageProgress?.tension_discover, stageProgress?.tension_regulate, stageProgress?.tension_reveal, stageProgress?.tension_value])

  const layerDisplay = priorityLayer ? TENSION_LAYER_DISPLAY[priorityLayer] : null

  // Onboarding status — 8 steps
  const onboardingStatus = useMemo(() => {
    // Step 1: create your character (upload archetype photo)
    const step1 = hasCustomPhoto
    // Steps 2-6: quest completion check
    const questSteps = ONBOARDING_QUEST_IDS.map(id =>
      isQuestEverCompleted ? isQuestEverCompleted(id) : false
    )
    // Step 7: alignment check (localStorage)
    const alignSkills = typeof window !== 'undefined' && localStorage.getItem('priority_align_skills') === 'true'
    const alignProblems = typeof window !== 'undefined' && localStorage.getItem('priority_align_problems') === 'true'
    const alignPersona = typeof window !== 'undefined' && localStorage.getItem('priority_align_persona') === 'true'
    const step7 = alignSkills && alignProblems && alignPersona
    // Step 8: accepted a play-list challenge
    const step8 = hasAcceptedChallenge
    return [step1, ...questSteps, step7, step8]
  }, [isQuestEverCompleted, hasAcceptedChallenge, hasCustomPhoto, alignmentVersion])

  // Onboarding is complete when steps 2-8 are done (step 1 photo is a recurring bonus, never blocks)
  const isOnboardingComplete = useMemo(() => onboardingStatus.slice(1).every(Boolean), [onboardingStatus])

  // Determine current state
  const currentState = useMemo(() => {
    if (loading) return 'loading'
    if (forceState) return forceState
    if (!isOnboardingComplete) return 'onboarding'
    if (!checkinDoneThisWeek && !isFirstEverWeek && hasTensionScores && priorityLayer !== 'value') return 'layer_checkin'
    if (weeklyPicks.length === 0) return 'picker'
    return 'quest_list'
  }, [loading, forceState, isOnboardingComplete, hasTensionScores, checkinDoneThisWeek, isFirstEverWeek, priorityLayer, weeklyPicks.length])

  // Split healing quests by frequency
  const dailyHealingQuests = useMemo(
    () => allHealingQuests.filter(q => q.frequency === 'daily'),
    [allHealingQuests]
  )
  const weeklyHealingQuests = useMemo(
    () => allHealingQuests.filter(q => q.frequency === 'weekly'),
    [allHealingQuests]
  )

  // Split weekly picks by type for quest list rendering
  const selectedGroanPicks = useMemo(
    () => weeklyPicks.filter(p => p.pick_type === 'groan'),
    [weeklyPicks]
  )
  // Quest types most relevant per priority layer
  const LAYER_QUEST_TYPES = {
    discover: ['Reconnect', 'Rewire'],
    regulate: ['Reconnect', 'Release'],
    reveal: ['Rewire', 'Reconnect'],
    value: ['Rewire', 'Release'],
  }

  const selectedHealingQuests = useMemo(() => {
    const healingPicks = weeklyPicks.filter(p => p.pick_type === 'daily_healing' || p.pick_type === 'weekly_healing')
    const healingPickIds = healingPicks.map(p => p.reference_id)
    const quests = allHealingQuests
      .filter(q => healingPickIds.includes(q.id))
      .map(q => {
        const pick = healingPicks.find(p => p.reference_id === q.id)
        const customName = pick?.display_name
        return {
          ...q,
          customDisplayName: (customName && customName !== q.name) ? customName : null,
        }
      })

    if (priorityLayer && LAYER_QUEST_TYPES[priorityLayer]) {
      const preferredTypes = LAYER_QUEST_TYPES[priorityLayer]
      quests.sort((a, b) => {
        const aIdx = preferredTypes.indexOf(a.type)
        const bIdx = preferredTypes.indexOf(b.type)
        const aRank = aIdx === -1 ? 99 : aIdx
        const bRank = bIdx === -1 ? 99 : bIdx
        return aRank - bRank
      })
    }

    return quests
  }, [weeklyPicks, allHealingQuests, priorityLayer])

  // ── Data Loading ──

  const loadPicks = useCallback(async () => {
    if (!userId) return []
    const { data, error } = await supabase
      .from('priority_weekly_picks')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', weekStart)
    if (error) {
      console.warn('Failed to load weekly picks:', error)
      return []
    }
    return data || []
  }, [userId, weekStart])

  const loadClusters = useCallback(async () => {
    if (!userId) return { skills: [], problems: [], personas: [] }
    const { data, error } = await supabase
      .from('nikigai_clusters')
      .select('id, cluster_label, cluster_type, items, proficiency, insight')
      .eq('user_id', userId)
      .in('cluster_type', ['skills', 'problems', 'persona'])
      .order('proficiency', { ascending: false })
    if (error) {
      console.warn('Failed to load clusters:', error)
      return { skills: [], problems: [], personas: [] }
    }
    // Dedup by cluster_label per type — keep highest proficiency
    const dedup = (items) => {
      const map = new Map()
      for (const item of items) {
        const existing = map.get(item.cluster_label)
        if (!existing || (item.proficiency || 0) > (existing.proficiency || 0)) {
          map.set(item.cluster_label, item)
        }
      }
      return [...map.values()]
    }
    const all = data || []
    return {
      skills: dedup(all.filter(c => c.cluster_type === 'skills')),
      problems: dedup(all.filter(c => c.cluster_type === 'problems')),
      personas: dedup(all.filter(c => c.cluster_type === 'persona')),
    }
  }, [userId])

  const loadHealingQuests = useCallback(async () => {
    try {
      const json = await fetchJson('/challengeQuestsUpdate.json')
      const quests = json.quests || json
      return quests.filter(q =>
        q.category === 'Healing' &&
        (q.frequency === 'daily' || q.frequency === 'weekly') &&
        q.id !== 'release_daily_challenge'
      )
    } catch (err) {
      console.warn('Failed to load healing quests:', err)
      return []
    }
  }, [])

  const loadCheckinStatus = useCallback(async () => {
    if (!userId) return false
    const { data, error } = await supabase
      .from('priority_layer_checkins')
      .select('id')
      .eq('user_id', userId)
      .eq('week_start_date', weekStart)
      .limit(1)
    if (error) {
      console.warn('Failed to load checkin status:', error)
      return false
    }
    return (data && data.length > 0)
  }, [userId, weekStart])

  const loadHasEverPicked = useCallback(async () => {
    if (!userId) return false
    const { data, error } = await supabase
      .from('priority_weekly_picks')
      .select('id')
      .eq('user_id', userId)
      .lt('week_start_date', weekStart)
      .limit(1)
    if (error) {
      console.warn('Failed to load pick history:', error)
      return false
    }
    return (data && data.length > 0)
  }, [userId, weekStart])

  const loadAcceptedChallenge = useCallback(async () => {
    if (!userId) return false
    const { data } = await supabase
      .from('groan_challenges')
      .select('id')
      .eq('user_id', userId)
      .not('accepted_at', 'is', null)
      .limit(1)
    return (data && data.length > 0)
  }, [userId])

  const loadCustomPhoto = useCallback(async () => {
    if (!userId) return { hasPhoto: false, profile: null }
    // Query by user_id first, then fall back to email
    // Use limit(1) + array access instead of maybeSingle() to handle duplicate rows
    let { data } = await supabase
      .from('lead_flow_profiles')
      .select('custom_essence_image, essence_archetype')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
    let row = data?.[0]
    if (!row) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const { data: emailData } = await supabase
          .from('lead_flow_profiles')
          .select('custom_essence_image, essence_archetype')
          .ilike('email', user.email)
          .order('created_at', { ascending: false })
          .limit(1)
        row = emailData?.[0]
      }
    }
    return row
      ? { hasPhoto: !!(row.custom_essence_image), profile: row }
      : { hasPhoto: false, profile: null }
  }, [userId])

  // Load all data on mount
  const loadAllData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [picks, clusters, healing, hasAccepted, photoResult, checkinDone, hasEverPicked] = await Promise.all([
        loadPicks(),
        loadClusters(),
        loadHealingQuests(),
        loadAcceptedChallenge(),
        loadCustomPhoto(),
        loadCheckinStatus(),
        loadHasEverPicked(),
      ])
      setWeeklyPicks(picks)
      setSkills(clusters.skills)
      setProblems(clusters.problems)
      setPersonas(clusters.personas)
      setAllHealingQuests(healing)
      setHasAcceptedChallenge(hasAccepted)
      setHasCustomPhoto(photoResult.hasPhoto)
      setEssenceProfile(photoResult.profile)
      setCheckinDoneThisWeek(checkinDone)
      setIsFirstEverWeek(!hasEverPicked)
    } catch (err) {
      console.error('usePriorityTab: load error', err)
    } finally {
      setLoading(false)
    }
  }, [userId, loadPicks, loadClusters, loadHealingQuests, loadAcceptedChallenge, loadCustomPhoto, loadCheckinStatus, loadHasEverPicked])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  // ── Actions ──

  const confirmWeek = useCallback(async (picks) => {
    if (!userId || picks.length === 0) return

    // Delete existing picks for this week first
    await supabase
      .from('priority_weekly_picks')
      .delete()
      .eq('user_id', userId)
      .eq('week_start_date', weekStart)

    // Insert new picks
    const rows = picks.map(p => ({
      user_id: userId,
      week_start_date: weekStart,
      pick_type: p.pick_type,
      reference_id: p.reference_id,
      display_name: p.display_name || null,
    }))

    const { data, error } = await supabase
      .from('priority_weekly_picks')
      .insert(rows)
      .select()

    if (error) {
      console.error('Failed to save weekly picks:', error)
      return
    }

    setWeeklyPicks(data || rows)
    setForceState(null)
  }, [userId, weekStart])

  const editWeek = useCallback(async () => {
    if (!userId) return
    // Delete picks for this week
    await supabase
      .from('priority_weekly_picks')
      .delete()
      .eq('user_id', userId)
      .eq('week_start_date', weekStart)

    setWeeklyPicks([])
    setForceState(null) // let currentState derive to 'picker'
  }, [userId, weekStart])

  const startReassess = useCallback(() => {
    setForceState('assessment')
  }, [])

  const finishReassess = useCallback(() => {
    setForceState(null)
  }, [])

  const refreshData = useCallback(async () => {
    const picks = await loadPicks()
    setWeeklyPicks(picks)
  }, [loadPicks])

  const completeCheckin = useCallback(async (answer, newScores) => {
    if (!userId) return {}
    const previousLayer = priorityLayer

    let newLayer = previousLayer
    let layerChanged = false

    if (answer && newScores) {
      // Save new tension scores
      const computed = computePriorityLayer(newScores)
      const { error } = await supabase
        .from('user_stage_progress')
        .upsert({
          user_id: userId,
          tension_discover: newScores.discover,
          tension_regulate: newScores.regulate,
          tension_reveal: newScores.reveal,
          tension_value: newScores.value,
          priority_layer: computed,
        }, { onConflict: 'user_id' })
      if (error) console.warn('Error saving tension scores:', error)

      newLayer = computed
      layerChanged = computed !== previousLayer
    }

    if (!answer) {
      setNudgeLayer(previousLayer)
    }

    // Record the check-in
    const { error: insertError } = await supabase.from('priority_layer_checkins').insert({
      user_id: userId,
      week_start_date: weekStart,
      layer_asked: previousLayer,
      answer,
      previous_layer: previousLayer,
      new_layer: newLayer,
      layer_changed: layerChanged,
    })
    if (insertError) console.warn('Failed to save checkin record:', insertError)

    // Don't mark done yet if layer changed — celebration needs to show first
    if (!layerChanged) {
      setCheckinDoneThisWeek(true)
    }
    return { layerChanged, previousLayer, newLayer }
  }, [userId, weekStart, priorityLayer])

  const finalizeCheckin = useCallback(() => {
    setCheckinDoneThisWeek(true)
  }, [])

  const clearNudge = useCallback(() => setNudgeLayer(null), [])

  const refreshAcceptedChallenge = useCallback(async () => {
    const result = await loadAcceptedChallenge()
    setHasAcceptedChallenge(result)
  }, [loadAcceptedChallenge])

  const refreshCustomPhoto = useCallback(async () => {
    const result = await loadCustomPhoto()
    setHasCustomPhoto(result.hasPhoto)
    setEssenceProfile(result.profile)
  }, [loadCustomPhoto])

  const onAlignmentChange = useCallback(() => {
    setAlignmentVersion(v => v + 1)
  }, [])

  // Compute current recommendation based on layer config + quest completion
  const recommendations = useMemo(() => {
    if (!priorityLayer) return { type: null, sections: [] }
    const config = LAYER_RECOMMENDATIONS[priorityLayer]
    if (!config) return { type: null, sections: [] }

    if (config.type === 'quests') {
      // Find first uncompleted quest in the sequence
      const nextQuest = config.questIds.find(id =>
        isQuestEverCompleted ? !isQuestEverCompleted(id) : true
      ) || null
      // Always-recommended quests (e.g. release_weekly_big for regulate)
      const alwaysQuests = config.alwaysRecommend || []
      return {
        type: 'quests',
        nextQuest,
        allQuests: config.questIds,
        alwaysRecommend: alwaysQuests,
        sections: [], // no picker section highlighting for quest-based layers
      }
    }

    if (config.type === 'playlist_layers') {
      return {
        type: 'playlist_layers',
        layers: config.layers,
        sections: ['groan'], // highlight play-list section in picker/quest list
      }
    }

    return { type: null, sections: [] }
  }, [priorityLayer, isQuestEverCompleted])

  return {
    currentState,
    priorityLayer,
    layerDisplay,

    // Picker source data
    skills,
    problems,
    personas,
    dailyHealingQuests,
    weeklyHealingQuests,

    // Quest list data
    weeklyPicks,
    selectedHealingQuests,
    selectedGroanPicks,

    // Recommendations (computed from layer config + completion status)
    recommendations,

    // Onboarding
    onboardingStatus,
    isOnboardingComplete,
    hasAcceptedChallenge,
    essenceProfile,

    // Layer check-in
    checkinDoneThisWeek,
    nudgeLayer,
    clearNudge,
    completeCheckin,
    finalizeCheckin,

    // Actions
    confirmWeek,
    editWeek,
    startReassess,
    finishReassess,
    refreshData,
    refreshAcceptedChallenge,
    refreshCustomPhoto,
    onAlignmentChange,
    loading,
  }
}
