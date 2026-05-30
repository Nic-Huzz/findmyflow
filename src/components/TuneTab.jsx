/**
 * TuneTab.jsx
 *
 * Daily maintenance tab — "Tuning your nervous system."
 * Three sections:
 *   1. Daily Practices (6 items, inline 2-option state check)
 *   2. Reconnect Practices (opens HealingCompletionModal for multi-step input)
 *   3. Rest (simple checkbox, inline 2-option state check)
 *
 * CSS prefix: tt-
 * Created: 2026-05-09
 */

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getScoringCategory } from '../lib/scoringCategories'
import { getWeekStartLocal } from '../lib/dateUtils'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import confetti from 'canvas-confetti'
import { getLevel, getLevelNumber } from '../lib/crm/statsService'
import HealingCompletionModal from './HealingCompletionModal'
import CapacityCard from './level/CapacityCard'
import useCapacityScore from '../hooks/useCapacityScore'
import './TuneTab.css'

// Quest IDs that render inline (Practice + Rest checkboxes)
const INLINE_TYPES = ['Practice', 'Rest']

// Drain categories from the ecosystem doc
const DRAIN_CATEGORIES = [
  { id: 'drain_work', label: 'Work', icon: '💼' },
  { id: 'drain_people', label: 'People', icon: '👤' },
  { id: 'drain_environment', label: 'Environment', icon: '🏠' },
  { id: 'drain_content', label: 'Content', icon: '📱' },
  { id: 'drain_commitment', label: 'Commitment', icon: '📋' },
]

// Voices by state — mapped from zone-calibration-framework.md
// Sympathetic: Controller (fight), Ghost (flight). Dorsal: Auto-Pilot (collapse), Perfectionist (freeze).
// People Pleaser (fawn) layers on any state.
const VOICES_BY_STATE = {
  sympathetic: [
    { id: 'controller', name: 'Controller', icon: '🧱' },
    { id: 'ghost', name: 'Ghost', icon: '👻' },
    { id: 'people-pleaser', name: 'People Pleaser', icon: '🪞' },
  ],
  dorsal: [
    { id: 'auto-pilot', name: 'Auto-Pilot', icon: '🤖' },
    { id: 'perfectionist', name: 'Perfectionist', icon: '🎯' },
    { id: 'people-pleaser', name: 'People Pleaser', icon: '🪞' },
  ],
}

// Stall categories — same areas as drains, but tracking where you froze
const STALL_CATEGORIES = [
  { id: 'stall_work', label: 'Work', icon: '💼' },
  { id: 'stall_people', label: 'People', icon: '👤' },
  { id: 'stall_environment', label: 'Environment', icon: '🏠' },
  { id: 'stall_content', label: 'Content', icon: '📱' },
  { id: 'stall_commitment', label: 'Commitment', icon: '📋' },
]

// All daily Tune quest IDs (used for filtering from JSON)
const DAILY_PRACTICE_IDS = [
  // Maintenance
  'practice_sleep',
  'practice_exercise',
  'practice_sunlight',
  'practice_healthy_meal',
  // Safety
  'reconnect_morning_meditation_breathwork',
  'reconnect_daily_prayer',
  'practice_connect_friend',
  'practice_feel_emotions',
  'safety_self_compassion',
  'safety_savouring',
  // Expression
  'practice_voice_work',
  'practice_own_style',
  'practice_social_media',
  'weekly_peak_state',
]

// Weekly Focus category labels
const FOCUS_CATEGORY_LABELS = {
  boundary: { icon: '🛡️', label: 'Boundary' },
  behaviour_swap: { icon: '🔄', label: 'Behaviour Swap' },
  future_self: { icon: '🔮', label: 'Future Self' },
  belief: { icon: '🧠', label: 'Belief' },
  expression: { icon: '🎨', label: 'Expression' },
}

export default function TuneTab({ userId, onQuestComplete, onRefreshPoints, onLevelUp }) {
  const [allQuests, setAllQuests] = useState([])
  const [completions, setCompletions] = useState([])
  const [loading, setLoading] = useState(true)
  const [completingQuestId, setCompletingQuestId] = useState(null)
  const [healingModalQuest, setHealingModalQuest] = useState(null) // for Reconnect multi-step

  // Weekly Focus state
  const [weeklyFocus, setWeeklyFocus] = useState(null)
  // Peak State state
  const [peakState, setPeakState] = useState(null)

  // Capacity / Vibe Rise score (single hook call, shared with CapacityCard)
  const [capacityRefresh, setCapacityRefresh] = useState(0)
  const scoreData = useCapacityScore(userId, capacityRefresh)
  const { safety, expression, maintenancePct } = scoreData

  // Practice info pop-up
  const [infoQuest, setInfoQuest] = useState(null)

  // Meal tracking state
  const [mealExpanded, setMealExpanded] = useState(false)
  const [savingMeal, setSavingMeal] = useState(null) // 'breakfast' | 'lunch' | 'dinner'

  // Drain logging state
  const [showDrainForm, setShowDrainForm] = useState(false)
  const [drainCategory, setDrainCategory] = useState(null)
  const [drainNote, setDrainNote] = useState('')
  const [drainState, setDrainState] = useState(null) // 'sympathetic' | 'dorsal'
  const [savingDrain, setSavingDrain] = useState(false)
  const [recentDrains, setRecentDrains] = useState([])

  // Stall logging state
  const [showStallForm, setShowStallForm] = useState(false)
  const [stallCategory, setStallCategory] = useState(null)
  const [stallNote, setStallNote] = useState('')
  const [stallState, setStallState] = useState(null) // 'sympathetic' | 'dorsal'
  const [stallVoice, setStallVoice] = useState(null)
  const [savingStall, setSavingStall] = useState(false)
  const [recentStalls, setRecentStalls] = useState([])

  // Load quests from static JSON + completions from DB
  useEffect(() => {
    if (!userId) return

    Promise.all([
      fetch('/challengeQuestsUpdate.json').then(r => r.json()),
      supabase
        .from('quest_completions')
        .select('quest_id, completed_at')
        .eq('user_id', userId)
        .in('quest_category', ['Tune', 'Healing']) // include historical Healing completions for Reconnect/Rest
        .gte('completed_at', getWeekStartLocal()),
      // Load this week's drains
      supabase
        .from('nervous_system_checkins')
        .select('source_quest_id, after_state, drain_note, created_at')
        .eq('user_id', userId)
        .eq('checkin_type', 'drain')
        .gte('created_at', getWeekStartLocal())
        .order('created_at', { ascending: false }),
      // Load this week's stalls
      supabase
        .from('nervous_system_checkins')
        .select('source_quest_id, after_state, drain_note, protective_voice, created_at')
        .eq('user_id', userId)
        .eq('checkin_type', 'stall')
        .gte('created_at', getWeekStartLocal())
        .order('created_at', { ascending: false }),
      // Load weekly focus intention (check both setup ID and main ID for backwards compat)
      supabase
        .from('quest_completions')
        .select('response_data, reflection_text')
        .eq('user_id', userId)
        .in('quest_id', ['rewire_weekly_focus_setup', 'rewire_weekly_focus'])
        .gte('completed_at', getWeekStartLocal())
        .order('completed_at', { ascending: true })
        .limit(5)
        .then(res => res)
        .catch(() => ({ data: null })),
      // Load peak state commitment
      supabase
        .from('quest_completions')
        .select('response_data')
        .eq('user_id', userId)
        .eq('quest_id', 'weekly_peak_state_setup')
        .gte('completed_at', getWeekStartLocal())
        .order('completed_at', { ascending: true })
        .limit(1)
        .then(res => res)
        .catch(() => ({ data: null })),
    ]).then(([questData, { data: completionData }, { data: drainData }, { data: stallData }, { data: focusData }, { data: peakData }]) => {
      const tuneQuests = (questData.quests || []).filter(q => q.category === 'Tune' && !q.archived)
      setAllQuests(tuneQuests)
      setCompletions(completionData || [])
      setRecentDrains(drainData || [])
      setRecentStalls(stallData || [])
      // Find the setup record — check response_data first, fall back to reflection_text
      const focusRecord = (focusData || []).find(r => {
        if (r.response_data?.quest_type === 'weekly_focus_setup') return true
        if (r.reflection_text) {
          try { return JSON.parse(r.reflection_text)?.quest_type === 'weekly_focus_setup' } catch { return false }
        }
        return false
      })
      if (focusRecord) {
        setWeeklyFocus(focusRecord.response_data || JSON.parse(focusRecord.reflection_text))
      }
      if (peakData?.[0]?.response_data?.quest_type === 'peak_state_setup') {
        setPeakState(peakData[0].response_data)
      }
      setLoading(false)
    }).catch(err => {
      console.error('TuneTab load error:', err)
      setLoading(false)
    })
  }, [userId])

  // Check if quest is completed today
  const isCompletedToday = (questId) => {
    const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local
    return completions.some(c =>
      c.quest_id === questId && c.completed_at?.startsWith(today)
    )
  }

  // Check if quest is completed this week (for weekly quests)
  // completions are already fetched from weekStart forward, so any match = done this week
  const isCompletedThisWeek = (questId) => {
    return completions.some(c => c.quest_id === questId)
  }

  // Get 7-day streak data for a quest
  const getStreak = (questId) => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('en-CA')
      days.push(completions.some(c => c.quest_id === questId && c.completed_at?.startsWith(dateStr)))
    }
    return days
  }

  const getDayLabels = () => {
    const labels = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      labels.push(['S','M','T','W','T','F','S'][d.getDay()])
    }
    return labels
  }

  // Section data — split by capacityType (maintenance / safety / expression)
  const allDailyPractices = useMemo(() =>
    DAILY_PRACTICE_IDS.map(id => allQuests.find(q => q.id === id)).filter(Boolean),
    [allQuests]
  )

  const maintenancePractices = useMemo(() =>
    allDailyPractices.filter(q => q.capacityType === 'maintenance'),
    [allDailyPractices]
  )

  const safetyPractices = useMemo(() =>
    allDailyPractices.filter(q => q.capacityType === 'safety'),
    [allDailyPractices]
  )

  const expressionPractices = useMemo(() =>
    allDailyPractices.filter(q => q.capacityType === 'expression'),
    [allDailyPractices]
  )

  // Weekly quests (split by capacityType)
  const weeklySafety = useMemo(() =>
    allQuests.filter(q => q.frequency === 'weekly' && q.capacityType === 'safety'),
    [allQuests]
  )

  const weeklyExpression = useMemo(() =>
    allQuests.filter(q => q.frequency === 'weekly' && (q.capacityType === 'expression' || q.capacityType === 'activation')),
    [allQuests]
  )

  // Check for RP level-up after scoring
  const checkLevelUp = async (pointsAdded) => {
    if (!onLevelUp || !pointsAdded) return
    try {
      const { data } = await supabase
        .from('user_lifetime_scores')
        .select('lifetime_total_score')
        .eq('user_id', userId)
        .is('project_id', null)
        .maybeSingle()
      const newXP = data?.lifetime_total_score || 0
      const oldXP = newXP - pointsAdded
      if (getLevelNumber(newXP) > getLevelNumber(oldXP)) {
        onLevelUp(getLevel(newXP))
      }
    } catch (err) {
      // Non-fatal
    }
  }

  // Inline completion: tap Complete → save + auto-log ventral for capacity
  const handleInlineComplete = async (quest) => {
    if (completingQuestId) return
    setCompletingQuestId(quest.id)
    hapticLight()

    const optimisticTs = new Date().toISOString()
    try {
      // Optimistic update — mark as done immediately so button can't be double-tapped
      setCompletions(prev => [...prev, { quest_id: quest.id, completed_at: optimisticTs }])

      // 1. Save quest completion
      const { error: questError } = await supabase.from('quest_completions').insert({
        user_id: userId,
        quest_id: quest.id,
        quest_category: 'Tune',
        quest_type: quest.type,
        points_earned: quest.points,
        challenge_instance_id: null,
        challenge_day: 0,
        project_id: null,
      })
      if (questError) {
        console.error('Tune quest completion error:', questError)
        setCompletions(prev => prev.filter(c => c.completed_at !== optimisticTs))
        throw questError
      }

      // 2. Increment scores
      const { error: scoreError } = await supabase.rpc('increment_scores', {
        p_user_id: userId,
        p_project_id: null,
        p_category: getScoringCategory('Tune'),
        p_points: quest.points,
        p_week_start: getWeekStartLocal(),
      })
      if (scoreError) console.warn('Tune score increment error:', scoreError)

      hapticSuccess()
      confetti({ particleCount: 50, spread: 45, origin: { y: 0.7 }, ticks: 100, gravity: 1.4, scalar: 0.8 })
      setCapacityRefresh(n => n + 1)

      // Check for RP level-up (only if scoring succeeded)
      if (!scoreError) checkLevelUp(quest.points)

      // Refresh completions
      const { data } = await supabase
        .from('quest_completions')
        .select('quest_id, completed_at')
        .eq('user_id', userId)
        .in('quest_category', ['Tune', 'Healing'])
        .gte('completed_at', getWeekStartLocal())
      if (data) setCompletions(data)

      onRefreshPoints?.()
    } catch (err) {
      console.error('TuneTab completion error:', err)
    } finally {
      setCompletingQuestId(null)
    }
  }

  // Meal tracking
  const MEALS = [
    { id: 'meal_breakfast', label: 'Breakfast' },
    { id: 'meal_lunch', label: 'Lunch' },
    { id: 'meal_dinner', label: 'Dinner' },
  ]
  const MEAL_OPTIONS = [
    { value: 'healthy', label: 'Healthy', color: '#10b981' },
    { value: 'cheat', label: 'Cheat Meal', color: '#f59e0b' },
    { value: 'skipped', label: 'Skipped', color: '#ef4444' },
  ]

  const isMealLogged = (mealId) => completions.some(c => c.quest_id === mealId && c.completed_at?.startsWith(new Date().toLocaleDateString('en-CA')))

  const handleMealLog = async (mealId, mealType) => {
    if (savingMeal) return
    setSavingMeal(mealId)
    hapticLight()

    try {
      const { error } = await supabase.from('quest_completions').insert({
        user_id: userId,
        quest_id: mealId,
        quest_category: 'Tune',
        quest_type: 'Practice',
        points_earned: mealType === 'healthy' ? 1 : 0,
        challenge_instance_id: null,
        challenge_day: 0,
        project_id: null,
        reflection_text: mealType,
      })
      if (error) throw error

      // Increment scores for RP
      const pts = mealType === 'healthy' ? 1 : 0
      if (pts > 0) {
        await supabase.rpc('increment_scores', {
          p_user_id: userId,
          p_project_id: null,
          p_category: getScoringCategory('Tune'),
          p_points: pts,
          p_week_start: getWeekStartLocal(),
        })
      }

      hapticSuccess()
      confetti({ particleCount: 50, spread: 45, origin: { y: 0.7 }, ticks: 100, gravity: 1.4, scalar: 0.8 })
      setCompletions(prev => [...prev, { quest_id: mealId, completed_at: new Date().toISOString() }])
      setCapacityRefresh(n => n + 1)
      if (pts > 0) checkLevelUp(pts)
      onRefreshPoints?.()
    } catch (err) {
      console.error('Meal log error:', err)
    } finally {
      setSavingMeal(null)
    }
  }

  // Reconnect quest completed via HealingCompletionModal
  const handleReconnectComplete = (q, data) => {
    setHealingModalQuest(null)
    // Forward to Challenge.jsx's handleQuestComplete for scoring/celebrations
    onQuestComplete?.(q, data)
    // Refresh completions
    supabase
      .from('quest_completions')
      .select('quest_id, completed_at')
      .eq('user_id', userId)
      .in('quest_category', ['Tune', 'Healing'])
      .gte('completed_at', getWeekStartLocal())
      .then(({ data: rows }) => {
        if (rows) setCompletions(rows)
      })
    // Refresh weekly focus (in case setup just completed)
    if (q?.id === 'rewire_weekly_focus') {
      supabase
        .from('quest_completions')
        .select('response_data')
        .eq('user_id', userId)
        .eq('quest_id', 'rewire_weekly_focus_setup')
        .gte('completed_at', getWeekStartLocal())
        .order('completed_at', { ascending: true })
        .limit(1)
        .then(({ data: focusRows }) => {
          if (focusRows?.[0]?.response_data?.quest_type === 'weekly_focus_setup') {
            setWeeklyFocus(focusRows[0].response_data)
          }
        })
    }
    if (q?.id === 'weekly_peak_state') {
      supabase
        .from('quest_completions')
        .select('response_data')
        .eq('user_id', userId)
        .eq('quest_id', 'weekly_peak_state_setup')
        .gte('completed_at', getWeekStartLocal())
        .order('completed_at', { ascending: true })
        .limit(1)
        .then(({ data: peakRows }) => {
          if (peakRows?.[0]?.response_data?.quest_type === 'peak_state_setup') {
            setPeakState(peakRows[0].response_data)
          }
        })
    }
    onRefreshPoints?.()
  }

  // Save a drain log
  const handleSaveDrain = async () => {
    if (!drainCategory || !drainState || savingDrain) return
    setSavingDrain(true)

    try {
      const { error } = await supabase.from('nervous_system_checkins').insert({
        user_id: userId,
        before_state: null,
        after_state: drainState,
        checkin_type: 'drain',
        source_quest_id: drainCategory,
        drain_note: drainNote.trim() || null,
      })

      if (error) throw error

      hapticSuccess()
      setCapacityRefresh(n => n + 1)
      // Reset form
      setDrainCategory(null)
      setDrainNote('')
      setDrainState(null)
      setShowDrainForm(false)

      // Refresh recent drains
      const { data } = await supabase
        .from('nervous_system_checkins')
        .select('source_quest_id, after_state, drain_note, created_at')
        .eq('user_id', userId)
        .eq('checkin_type', 'drain')
        .gte('created_at', getWeekStartLocal())
        .order('created_at', { ascending: false })
      if (data) setRecentDrains(data)

      onRefreshPoints?.()
    } catch (err) {
      console.error('Drain save error:', err)
    } finally {
      setSavingDrain(false)
    }
  }

  // Save a stall log
  const handleSaveStall = async () => {
    if (!stallCategory || !stallState || !stallVoice || savingStall) return
    setSavingStall(true)

    try {
      const { error } = await supabase.from('nervous_system_checkins').insert({
        user_id: userId,
        before_state: null,
        after_state: stallState,
        checkin_type: 'stall',
        source_quest_id: stallCategory,
        drain_note: stallNote.trim() || null,
        protective_voice: stallVoice,
      })

      if (error) throw error

      hapticSuccess()
      setCapacityRefresh(n => n + 1)
      setStallCategory(null)
      setStallNote('')
      setStallState(null)
      setStallVoice(null)
      setShowStallForm(false)

      const { data } = await supabase
        .from('nervous_system_checkins')
        .select('source_quest_id, after_state, drain_note, protective_voice, created_at')
        .eq('user_id', userId)
        .eq('checkin_type', 'stall')
        .gte('created_at', getWeekStartLocal())
        .order('created_at', { ascending: false })
      if (data) setRecentStalls(data)

      onRefreshPoints?.()
    } catch (err) {
      console.error('Stall save error:', err)
    } finally {
      setSavingStall(false)
    }
  }

  // Render a quest row (reuses healing tab ht- pattern)
  function renderQuestRow(quest, useInlineComplete = true) {
    const completed = quest.frequency === 'weekly' ? isCompletedThisWeek(quest.id) : isCompletedToday(quest.id)
    const streak = quest.frequency === 'daily' ? getStreak(quest.id) : null
    const dayLabels = quest.frequency === 'daily' ? getDayLabels() : null
    const isCompleting = completingQuestId === quest.id

    return (
      <div key={quest.id} className={`ht-item-row ${completed ? 'done' : ''}`}>
        <span className={`ht-item-check ${completed ? 'done' : ''}`}>
          {completed ? '✓' : ''}
        </span>
        <div className="ht-item-body">
          <div className="ht-item-name" onClick={() => quest.description && setInfoQuest(quest)} style={quest.description ? { cursor: 'pointer' } : undefined}>
            {quest.name}
            {quest.description && <span className="tt-info-icon">ⓘ</span>}
          </div>
          <div className="ht-item-meta">
            <span className="ht-item-type">{quest.type}</span>
            <span className="ht-item-sep">·</span>
            <span className="ht-pts">{quest.points}pts</span>
          </div>
          {streak && dayLabels && (
            <div className="ht-streak-dots">
              {dayLabels.map((day, i) => (
                <div key={i} className="ht-streak-day">
                  <span className={`ht-streak-dot ${streak[i] ? 'filled' : ''}`} />
                  <span className="ht-streak-label">{day}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {completed ? (
          <span className="ht-item-action done-action">Done</span>
        ) : useInlineComplete ? (
          <button
            className="ht-item-action"
            disabled={isCompleting}
            onClick={() => handleInlineComplete(quest)}
          >
            {isCompleting ? '...' : 'Complete'}
          </button>
        ) : (
          <button
            className="ht-item-action"
            onClick={() => setHealingModalQuest(quest)}
          >
            Complete
          </button>
        )}
      </div>
    )
  }

  if (loading) {
    return <div className="tune-tab"><div className="loading-state"><div className="spinner" /></div></div>
  }

  // Count today's completed practices
  const mealsLoggedToday = MEALS.filter(m => isMealLogged(m.id)).length
  const maintenanceDone = maintenancePractices.filter(q => q.inputType !== 'meal_tracker' && isCompletedToday(q.id)).length + (mealsLoggedToday === 3 ? 1 : 0)
  const safetyDone = safetyPractices.filter(q => isCompletedToday(q.id)).length
  const expressionDone = expressionPractices.filter(q => isCompletedToday(q.id)).length
  const totalDone = maintenanceDone + safetyDone + expressionDone
  const totalPractices = maintenancePractices.length + safetyPractices.length + expressionPractices.length

  return (
    <div className="tune-tab">
      {/* Vibe Rise Score */}
      <CapacityCard userId={userId} refreshTrigger={capacityRefresh} scoreData={scoreData} />

      {/* Section 1: Daily Practices */}
      <div className="tt-section">
        <div className="tt-section-header">
          <div className="tt-section-header-left">
            <span className="tt-section-icon">☀️</span>
            <span className="tt-section-title">Daily Practices</span>
          </div>
          <span className="tt-section-count">{totalDone}/{totalPractices}</span>
        </div>
        <p className="tt-section-sub">Safety builds the container, expression expands it. Maintenance keeps it all running.</p>

        {/* Maintenance sub-section */}
        <div className="tt-subsection">
          <div className="tt-subsection-header">
            <span className="tt-subsection-icon">⚙️</span>
            <span className="tt-subsection-label tt-label-maintenance">Maintenance</span>
            {maintenancePct > 0 && <span className="tt-score-badge tt-score-maintenance">{maintenancePct}%</span>}
            <span className="tt-subsection-count">{maintenanceDone}/{maintenancePractices.length}</span>
          </div>
          <div className="tt-quest-list">
            {maintenancePractices.map(q => {
              if (q.inputType === 'meal_tracker') {
                const allMealsLogged = MEALS.every(m => isMealLogged(m.id))
                return (
                  <div key={q.id} className={`ht-item-row ${allMealsLogged ? 'done' : ''}`}>
                    <span className={`ht-item-check ${allMealsLogged ? 'done' : ''}`}>
                      {allMealsLogged ? '✓' : ''}
                    </span>
                    <div className="ht-item-body">
                      <div className="ht-item-name" onClick={() => q.description && !mealExpanded && setInfoQuest(q)} style={q.description && !mealExpanded ? { cursor: 'pointer' } : undefined}>
                        {q.name}
                        {q.description && !mealExpanded && <span className="tt-info-icon">ⓘ</span>}
                      </div>
                      <div className="ht-item-meta">
                        <span className="ht-item-type">{q.type}</span>
                        <span className="ht-item-sep">·</span>
                        <span className="ht-pts">{MEALS.filter(m => isMealLogged(m.id)).length}/3 meals</span>
                      </div>
                      {mealExpanded && (
                        <div className="tt-meal-grid">
                          {MEALS.map(meal => {
                            const logged = isMealLogged(meal.id)
                            const isSaving = savingMeal === meal.id
                            return (
                              <div key={meal.id} className="tt-meal-row">
                                <span className="tt-meal-label">{meal.label}</span>
                                {logged ? (
                                  <span className="tt-meal-done">✓</span>
                                ) : (
                                  <div className="tt-meal-options">
                                    {MEAL_OPTIONS.map(opt => (
                                      <button
                                        key={opt.value}
                                        className="tt-meal-btn"
                                        style={{ color: opt.color }}
                                        disabled={isSaving}
                                        onClick={() => handleMealLog(meal.id, opt.value)}
                                      >
                                        {isSaving ? '...' : opt.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    {allMealsLogged ? (
                      <span className="ht-item-action done-action">Done</span>
                    ) : (
                      <button
                        className={`ht-item-action ${mealExpanded ? 'tt-meal-action-top' : ''}`}
                        onClick={() => { hapticLight(); setMealExpanded(!mealExpanded) }}
                      >
                        {mealExpanded ? 'Close' : 'Log'}
                      </button>
                    )}
                  </div>
                )
              }
              return renderQuestRow(q, q.inputType === 'checkbox')
            })}
          </div>
        </div>

        {/* Safety sub-section */}
        <div className="tt-subsection">
          <div className="tt-subsection-header">
            <span className="tt-subsection-icon">🛡️</span>
            <span className="tt-subsection-label tt-label-safety">Safety</span>
            {safety !== null && <span className="tt-score-badge tt-score-safety">{safety}/10</span>}
            <span className="tt-subsection-count">{safetyDone}/{safetyPractices.length}</span>
          </div>
          <div className="tt-quest-list">
            {safetyPractices.map(q => renderQuestRow(q, q.inputType === 'checkbox'))}
          </div>
        </div>

        {/* Expression sub-section */}
        <div className="tt-subsection">
          <div className="tt-subsection-header">
            <span className="tt-subsection-icon">🔥</span>
            <span className="tt-subsection-label tt-label-activation">Expression</span>
            {expression !== null && <span className="tt-score-badge tt-score-expression">{expression}/10</span>}
            <span className="tt-subsection-count">{expressionDone}/{expressionPractices.length}</span>
          </div>
          <div className="tt-quest-list">
            {expressionPractices.map(q => renderQuestRow(q, q.inputType === 'checkbox'))}
            {/* Weekly Focus — always visible in daily expression */}
            {(() => {
              const focusQuest = allQuests.find(q => q.id === 'rewire_weekly_focus')
              if (!focusQuest) return null

              // Before intention set: show "Set your intention" prompt
              if (!weeklyFocus) {
                return (
                  <div className="ht-item-row">
                    <span className="ht-item-check" />
                    <div className="ht-item-body">
                      <div className="ht-item-name">Weekly Focus</div>
                      <div className="ht-item-meta">
                        <span className="ht-item-type">Set your intention for this week</span>
                      </div>
                    </div>
                    <button type="button" className="ht-item-action" onClick={() => setHealingModalQuest(focusQuest)}>
                      Set
                    </button>
                  </div>
                )
              }

              // After intention set: show the intention + Honour button + day dots
              const focusDoneToday = isCompletedToday('rewire_weekly_focus')
              const cat = FOCUS_CATEGORY_LABELS[weeklyFocus.focus_category]
              const focusStreak = getStreak('rewire_weekly_focus')
              const focusDayLabels = getDayLabels()
              return (
                <div className={`ht-item-row ${focusDoneToday ? 'done' : ''}`}>
                  <span className={`ht-item-check ${focusDoneToday ? 'done' : ''}`}>
                    {focusDoneToday ? '✓' : ''}
                  </span>
                  <div className="ht-item-body">
                    <div className="ht-item-name">
                      {cat?.icon} {weeklyFocus.intention}
                    </div>
                    <div className="ht-item-meta">
                      <span className="ht-item-type">Weekly Focus</span>
                      <span className="ht-item-sep">·</span>
                      <span className="ht-pts">{focusQuest.points}pts</span>
                    </div>
                    {focusStreak && focusDayLabels && (
                      <div className="ht-streak-dots">
                        {focusDayLabels.map((day, i) => (
                          <div key={i} className="ht-streak-day">
                            <span className={`ht-streak-dot ${focusStreak[i] ? 'filled' : ''}`} />
                            <span className="ht-streak-label">{day}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {focusDoneToday ? (
                    <span className="ht-item-action done-action">Done</span>
                  ) : (
                    <button
                      type="button"
                      className="ht-item-action"
                      disabled={completingQuestId === 'rewire_weekly_focus'}
                      onClick={() => setHealingModalQuest(focusQuest)}
                    >
                      {completingQuestId === 'rewire_weekly_focus' ? '...' : 'Honour'}
                    </button>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Section 2: Drains */}
      <div className="tt-section">
        <div className="tt-section-header">
          <div className="tt-section-header-left">
            <span className="tt-section-icon">⚡</span>
            <span className="tt-section-title">Drains</span>
            {expression !== null && <span className="tt-score-badge tt-score-expression">🔥 {expression}/10</span>}
          </div>
          {recentDrains.length > 0 && (
            <span className="tt-section-count tt-drain-count">{recentDrains.length} this week</span>
          )}
        </div>
        <p className="tt-section-sub">What's depleting your energy? Drains pull you out of expression faster than practices can refill it.</p>

        {!showDrainForm ? (
          <button
            className="tt-drain-log-btn"
            onClick={() => { hapticLight(); setShowDrainForm(true) }}
          >
            + Log a drain
          </button>
        ) : (
          <div className="tt-drain-form">
            {/* Step 1: Category */}
            <div className="tt-drain-categories">
              {DRAIN_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`tt-drain-cat-btn ${drainCategory === cat.id ? 'selected' : ''}`}
                  onClick={() => { hapticLight(); setDrainCategory(cat.id) }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Step 2: Note (optional) */}
            {drainCategory && (
              <input
                type="text"
                className="tt-drain-note"
                placeholder="What drained you? (optional)"
                value={drainNote}
                onChange={e => setDrainNote(e.target.value)}
              />
            )}

            {/* Step 3: State check */}
            {drainCategory && (
              <div className="tt-drain-state">
                <span className="tt-state-label">How did it leave you?</span>
                <div className="tt-state-buttons">
                  <button
                    className={`tt-state-btn tt-state-activated ${drainState === 'sympathetic' ? 'selected' : ''}`}
                    onClick={() => setDrainState('sympathetic')}
                  >
                    <span>😬</span> Activated
                  </button>
                  <button
                    className={`tt-state-btn tt-state-shutdown ${drainState === 'dorsal' ? 'selected' : ''}`}
                    onClick={() => setDrainState('dorsal')}
                  >
                    <span>😶</span> Shutdown
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="tt-drain-actions">
              <button
                className="tt-drain-save"
                disabled={!drainCategory || !drainState || savingDrain}
                onClick={handleSaveDrain}
              >
                {savingDrain ? 'Saving...' : 'Log Drain'}
              </button>
              <button
                className="tt-drain-cancel"
                onClick={() => { setShowDrainForm(false); setDrainCategory(null); setDrainNote(''); setDrainState(null) }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Recent drains list */}
        {recentDrains.length > 0 && (
          <div className="tt-drain-list">
            {recentDrains.slice(0, 5).map((drain, i) => {
              const cat = DRAIN_CATEGORIES.find(c => c.id === drain.source_quest_id)
              return (
                <div key={i} className="tt-drain-item">
                  <span className="tt-drain-item-icon">{cat?.icon || '⚡'}</span>
                  <div className="tt-drain-item-body">
                    <span className="tt-drain-item-cat">{cat?.label || 'Drain'}</span>
                    {drain.drain_note && <span className="tt-drain-item-note">{drain.drain_note}</span>}
                  </div>
                  <span className={`tt-drain-item-state ${drain.after_state === 'dorsal' ? 'tt-shutdown' : 'tt-activated'}`}>
                    {drain.after_state === 'dorsal' ? '😶' : '😬'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Section 4: Stalls */}
      <div className="tt-section">
        <div className="tt-section-header">
          <div className="tt-section-header-left">
            <span className="tt-section-icon">🧊</span>
            <span className="tt-section-title">Stalls</span>
            {safety !== null && <span className="tt-score-badge tt-score-safety">🛡️ {safety}/10</span>}
          </div>
          {recentStalls.length > 0 && (
            <span className="tt-section-count tt-stall-count">{recentStalls.length} this week</span>
          )}
        </div>
        <p className="tt-section-sub">Where did your protective voice win? Stalls erode safety and keep you stuck in the smaller version of yourself.</p>

        {!showStallForm ? (
          <button
            className="tt-drain-log-btn tt-stall-log-btn"
            onClick={() => { hapticLight(); setShowStallForm(true) }}
          >
            + Log a stall
          </button>
        ) : (
          <div className="tt-drain-form">
            <div className="tt-drain-categories">
              {STALL_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`tt-drain-cat-btn ${stallCategory === cat.id ? 'selected' : ''}`}
                  onClick={() => { hapticLight(); setStallCategory(cat.id) }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {stallCategory && (
              <input
                type="text"
                className="tt-drain-note"
                placeholder="What happened? (optional)"
                value={stallNote}
                onChange={e => setStallNote(e.target.value)}
              />
            )}

            {stallCategory && (
              <div className="tt-drain-state">
                <span className="tt-state-label">How did it leave you?</span>
                <div className="tt-state-buttons">
                  <button
                    className={`tt-state-btn tt-state-activated ${stallState === 'sympathetic' ? 'selected' : ''}`}
                    onClick={() => { setStallState('sympathetic'); setStallVoice(null) }}
                  >
                    <span>😬</span> Activated
                  </button>
                  <button
                    className={`tt-state-btn tt-state-shutdown ${stallState === 'dorsal' ? 'selected' : ''}`}
                    onClick={() => { setStallState('dorsal'); setStallVoice(null) }}
                  >
                    <span>😶</span> Shutdown
                  </button>
                </div>
              </div>
            )}

            {/* Voice picker — shows after state selection */}
            {stallState && (
              <div className="tt-stall-voice">
                <span className="tt-state-label">Which voice showed up?</span>
                <div className="tt-voice-buttons">
                  {VOICES_BY_STATE[stallState].map(v => (
                    <button
                      key={v.id}
                      className={`tt-voice-btn ${stallVoice === v.id ? 'selected' : ''}`}
                      onClick={() => { hapticLight(); setStallVoice(v.id) }}
                    >
                      <span>{v.icon}</span> {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="tt-drain-actions">
              <button
                className="tt-drain-save tt-stall-save"
                disabled={!stallCategory || !stallState || !stallVoice || savingStall}
                onClick={handleSaveStall}
              >
                {savingStall ? 'Saving...' : 'Log Stall'}
              </button>
              <button
                className="tt-drain-cancel"
                onClick={() => { setShowStallForm(false); setStallCategory(null); setStallNote(''); setStallState(null); setStallVoice(null) }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {recentStalls.length > 0 && (
          <div className="tt-drain-list">
            {recentStalls.slice(0, 5).map((stall, i) => {
              const cat = STALL_CATEGORIES.find(c => c.id === stall.source_quest_id)
              return (
                <div key={i} className="tt-drain-item">
                  <span className="tt-drain-item-icon">{cat?.icon || '🧊'}</span>
                  <div className="tt-drain-item-body">
                    <span className="tt-drain-item-cat">{cat?.label || 'Stall'}{stall.protective_voice ? ` · ${stall.protective_voice}` : ''}</span>
                    {stall.drain_note && <span className="tt-drain-item-note">{stall.drain_note}</span>}
                  </div>
                  <span className={`tt-drain-item-state ${stall.after_state === 'dorsal' ? 'tt-shutdown' : 'tt-activated'}`}>
                    {stall.after_state === 'dorsal' ? '😶' : '😬'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Practice Info Pop-up */}
      {infoQuest && (
        <div className="tt-info-overlay" onClick={() => setInfoQuest(null)}>
          <div className="tt-info-modal" onClick={e => e.stopPropagation()}>
            <div className="tt-info-modal-name">{infoQuest.name}</div>
            <div className="tt-info-modal-desc">{infoQuest.description}</div>
            <button className="tt-info-modal-close" onClick={() => setInfoQuest(null)}>Got it</button>
          </div>
        </div>
      )}

      {/* Reconnect Completion Modal */}
      {healingModalQuest && (
        <HealingCompletionModal
          quest={healingModalQuest}
          userId={userId}
          onComplete={handleReconnectComplete}
          onClose={() => {
            const closingQuest = healingModalQuest
            setHealingModalQuest(null)
            // Refresh setup state in case setup completed without onComplete (setup mode returns early)
            if (closingQuest?.id === 'rewire_weekly_focus' || closingQuest?.id === 'weekly_peak_state') {
              const setupId = closingQuest.id === 'rewire_weekly_focus' ? 'rewire_weekly_focus_setup' : 'weekly_peak_state_setup'
              const setupType = closingQuest.id === 'rewire_weekly_focus' ? 'weekly_focus_setup' : 'peak_state_setup'
              const setter = closingQuest.id === 'rewire_weekly_focus' ? setWeeklyFocus : setPeakState
              supabase
                .from('quest_completions')
                .select('response_data')
                .eq('user_id', userId)
                .eq('quest_id', setupId)
                .gte('completed_at', getWeekStartLocal())
                .order('completed_at', { ascending: true })
                .limit(1)
                .then(({ data }) => {
                  if (data?.[0]?.response_data?.quest_type === setupType) {
                    setter(data[0].response_data)
                  }
                })
            }
          }}
        />
      )}
    </div>
  )
}
