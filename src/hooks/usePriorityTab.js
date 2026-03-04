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

// Which sections are recommended per priority layer
const LAYER_RECOMMENDATIONS = {
  discover: ['play_profile'],
  regulate: ['daily_healing', 'weekly_healing'],
  reveal: ['groan'],
  value: ['groan'],
}

export { LAYER_RECOMMENDATIONS }

export default function usePriorityTab(userId, stageProgress) {
  const [loading, setLoading] = useState(true)
  const [weeklyPicks, setWeeklyPicks] = useState([])
  const [skills, setSkills] = useState([])
  const [activeDnaSession, setActiveDnaSession] = useState(null)
  const [dnaResult, setDnaResult] = useState(null)
  const [allHealingQuests, setAllHealingQuests] = useState([])
  const [forceState, setForceState] = useState(null) // override for reassess flow

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

  // Determine current state
  const currentState = useMemo(() => {
    if (loading) return 'loading'
    if (forceState) return forceState
    if (!hasTensionScores) return 'assessment'
    if (weeklyPicks.length === 0) return 'picker'
    return 'quest_list'
  }, [loading, forceState, hasTensionScores, weeklyPicks.length])

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
  const selectedDnaPick = useMemo(
    () => weeklyPicks.find(p => p.pick_type === 'play_profile') || null,
    [weeklyPicks]
  )
  const selectedHealingQuests = useMemo(() => {
    const healingPickIds = weeklyPicks
      .filter(p => p.pick_type === 'daily_healing' || p.pick_type === 'weekly_healing')
      .map(p => p.reference_id)
    return allHealingQuests.filter(q => healingPickIds.includes(q.id))
  }, [weeklyPicks, allHealingQuests])

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

  const loadSkills = useCallback(async () => {
    if (!userId) return []
    const { data, error } = await supabase
      .from('nikigai_clusters')
      .select('id, cluster_label, cluster_type, items, proficiency, insight')
      .eq('user_id', userId)
      .eq('cluster_type', 'skills')
      .order('proficiency', { ascending: false })
    if (error) {
      console.warn('Failed to load skills:', error)
      return []
    }
    // Dedup by cluster_label — keep highest proficiency
    const map = new Map()
    for (const item of (data || [])) {
      const existing = map.get(item.cluster_label)
      if (!existing || (item.proficiency || 0) > (existing.proficiency || 0)) {
        map.set(item.cluster_label, item)
      }
    }
    return [...map.values()]
  }, [userId])

  const loadDnaResult = useCallback(async () => {
    if (!userId) return null
    const { data, error } = await supabase
      .from('founder_dna_results')
      .select('matched_founder, matched_founder_company, archetype, dna_code, slider_values, selected_games')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()
    if (error) {
      console.warn('Failed to load DNA result:', error)
      return null
    }
    return data
  }, [userId])

  const loadDnaSession = useCallback(async () => {
    if (!userId) return null
    const { data, error } = await supabase
      .from('founder_dna_sessions')
      .select('id, challenge_name, stuck_point_name, challenge_type, status')
      .eq('user_id', userId)
      .in('status', ['active', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) {
      console.warn('Failed to load DNA session:', error)
      return null
    }
    return data
  }, [userId])

  const loadHealingQuests = useCallback(async () => {
    try {
      const json = await fetchJson('/challengeQuestsUpdate.json')
      const quests = json.quests || json
      return quests.filter(q =>
        q.category === 'Healing' &&
        (q.frequency === 'daily' || q.frequency === 'weekly')
      )
    } catch (err) {
      console.warn('Failed to load healing quests:', err)
      return []
    }
  }, [])

  // Load all data on mount
  const loadAllData = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [picks, skillsData, dnaProfile, dna, healing] = await Promise.all([
        loadPicks(),
        loadSkills(),
        loadDnaResult(),
        loadDnaSession(),
        loadHealingQuests(),
      ])
      setWeeklyPicks(picks)
      setSkills(skillsData)
      setDnaResult(dnaProfile)
      setActiveDnaSession(dna)
      setAllHealingQuests(healing)
    } catch (err) {
      console.error('usePriorityTab: load error', err)
    } finally {
      setLoading(false)
    }
  }, [userId, loadPicks, loadSkills, loadDnaResult, loadDnaSession, loadHealingQuests])

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

  const refreshDnaSession = useCallback(async () => {
    const [dnaProfile, dna] = await Promise.all([loadDnaResult(), loadDnaSession()])
    setDnaResult(dnaProfile)
    setActiveDnaSession(dna)
  }, [loadDnaResult, loadDnaSession])

  return {
    currentState,
    priorityLayer,
    layerDisplay,

    // Picker source data
    skills,
    dnaResult,
    activeDnaSession,
    dailyHealingQuests,
    weeklyHealingQuests,

    // Quest list data
    weeklyPicks,
    selectedHealingQuests,
    selectedGroanPicks,
    selectedDnaPick,

    // Recommendations
    recommendations: priorityLayer ? (LAYER_RECOMMENDATIONS[priorityLayer] || []) : [],

    // Actions
    confirmWeek,
    editWeek,
    startReassess,
    finishReassess,
    refreshData,
    refreshDnaSession,
    loading,
  }
}
