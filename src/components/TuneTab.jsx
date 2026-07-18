/**
 * TuneTab.jsx
 *
 * Daily maintenance tab — "Tuning your nervous system."
 * Four sections:
 *   0. Today's Experiences (predict outcomes, close the loop, calibration)
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
import { getWeekStartLocal, getTodayLocal } from '../lib/dateUtils'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import confetti from 'canvas-confetti'
import { getLevel, getLevelNumber } from '../lib/crm/statsService'
import HealingCompletionModal from './HealingCompletionModal'
import CapacityCard from './level/CapacityCard'
import useCapacityScore from '../hooks/useCapacityScore'
import RegulationCard from './RegulationCard'
import { REGULATION_EXERCISES } from '../lib/nervousSystemConstants'
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
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

// Experience Check-in outcome predictions (T1a Self-Knowledge)
const EXPERIENCE_OUTCOMES = [
  { id: 'bored', label: 'Bored', emoji: '😶' },
  { id: 'stressful', label: 'Stressful', emoji: '😬' },
  { id: 'fun', label: 'Fun', emoji: '😊' },
  { id: 'wahoo', label: 'Courage', emoji: '⚡' },
]

const WAHOO_CATEGORIES = [
  { id: 'creation', name: 'Creation', icon: '🎨' },
  { id: 'connection', name: 'Connection', icon: '🤝' },
  { id: 'appearance', name: 'Appearance', icon: '👤' },
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
  'safety_self_compassion',
  'safety_savouring',
  // Expression
  'practice_own_style',
  'practice_voice_work',
  'practice_social_media',
  'weekly_peak_state',
]

// Weekly Focus category labels
const FOCUS_CATEGORY_LABELS = {
  boundary: { icon: '🛡️', label: 'Value' },
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
  const [drainCategory, setDrainCategory] = useState(null)
  const [drainNote, setDrainNote] = useState('')
  const [drainState, setDrainState] = useState(null) // 'sympathetic' | 'dorsal'
  const [savingDrain, setSavingDrain] = useState(false)
  const [recentDrains, setRecentDrains] = useState([])

  // Stall logging state
  const [stallCategory, setStallCategory] = useState(null)
  const [stallNote, setStallNote] = useState('')
  const [stallState, setStallState] = useState(null) // 'sympathetic' | 'dorsal'
  const [stallVoice, setStallVoice] = useState(null)
  const [savingStall, setSavingStall] = useState(false)
  const [recentStalls, setRecentStalls] = useState([])

  // Regulation overlay after drain/stall save
  const [regulationState, setRegulationState] = useState(null)

  // Recovery tracking
  const [recoveryItem, setRecoveryItem] = useState(null)
  const [recoveryActivities, setRecoveryActivities] = useState([])
  const [recoveryOther, setRecoveryOther] = useState('') // free-text "what else helped?"
  const [recoveryMinutes, setRecoveryMinutes] = useState('') // user-entered duration in minutes
  const [savingRecovery, setSavingRecovery] = useState(false)

  // Experience Check-in state
  const [experiences, setExperiences] = useState([])
  const [showExpForm, setShowExpForm] = useState(false)
  const [expDescription, setExpDescription] = useState('')
  const [expPrediction, setExpPrediction] = useState(null)
  const [savingExp, setSavingExp] = useState(false)
  const [expOutcomeItem, setExpOutcomeItem] = useState(null)
  const [expActual, setExpActual] = useState(null)
  const [savingExpOutcome, setSavingExpOutcome] = useState(false)
  const [showWahooPrompt, setShowWahooPrompt] = useState(null)
  const [wahooConvertCat, setWahooConvertCat] = useState(null)

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
        .select('id, source_quest_id, after_state, drain_note, created_at, recovered_at')
        .eq('user_id', userId)
        .eq('checkin_type', 'drain')
        .gte('created_at', getWeekStartLocal())
        .order('created_at', { ascending: false }),
      // Load this week's stalls
      supabase
        .from('nervous_system_checkins')
        .select('id, source_quest_id, after_state, drain_note, protective_voice, created_at, recovered_at')
        .eq('user_id', userId)
        .eq('checkin_type', 'stall')
        .gte('created_at', getWeekStartLocal())
        .order('created_at', { ascending: false }),
      // Load weekly focus intention — most recent setup from any week, plus this week's daily honours
      supabase
        .from('quest_completions')
        .select('response_data, reflection_text, completed_at')
        .eq('user_id', userId)
        .eq('quest_id', 'rewire_weekly_focus')
        .order('completed_at', { ascending: false })
        .limit(10)
        .then(res => res)
        .catch(() => ({ data: null })),
      // Load peak state commitment — most recent setup from any week
      supabase
        .from('quest_completions')
        .select('response_data, reflection_text, completed_at')
        .eq('user_id', userId)
        .eq('quest_id', 'weekly_peak_state')
        .order('completed_at', { ascending: false })
        .limit(10)
        .then(res => res)
        .catch(() => ({ data: null })),
      // Load this week's experience checkins
      supabase
        .from('experience_checkins')
        .select('id, activity_description, predicted_outcome, actual_outcome, calibration_hit, completed_at, date, created_at')
        .eq('user_id', userId)
        .gte('date', getWeekStartLocal())
        .order('created_at', { ascending: false }),
    ]).then(([questData, { data: completionData }, { data: drainData }, { data: stallData }, { data: focusData }, { data: peakData }, { data: experienceData }]) => {
      const tuneQuests = (questData.quests || []).filter(q => q.category === 'Tune' && !q.archived)
      const mapped = DAILY_PRACTICE_IDS.map(id => {
        const found = tuneQuests.find(q => q.id === id)
        return found
      }).filter(Boolean)
      setAllQuests(tuneQuests)
      setCompletions(completionData || [])
      setRecentDrains(drainData || [])
      setRecentStalls(stallData || [])
      setExperiences(experienceData || [])
      // Find setup records — check response_data first, fall back to reflection_text
      const findSetup = (rows, type) => {
        return (rows || []).find(r => {
          const rd = r.response_data || (r.reflection_text ? (() => { try { return JSON.parse(r.reflection_text) } catch { return null } })() : null)
          return rd?.quest_type === type
        })
      }
      const parseSetup = (record) => record.response_data || JSON.parse(record.reflection_text)

      const focusRecord = findSetup(focusData, 'weekly_focus_setup')
      if (focusRecord) setWeeklyFocus(parseSetup(focusRecord))

      const peakRecord = findSetup(peakData, 'peak_state_setup')
      if (peakRecord) setPeakState(parseSetup(peakRecord))
      setLoading(false)
    }).catch(err => {
      console.error('TuneTab load error:', err)
      setLoading(false)
    })
  }, [userId])

  // Check if quest is completed today (convert UTC timestamps to local date)
  const isCompletedToday = (questId) => {
    const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local
    return completions.some(c =>
      c.quest_id === questId &&
      c.completed_at &&
      new Date(c.completed_at).toLocaleDateString('en-CA') === today
    )
  }

  // Check if quest is completed this week (for weekly quests)
  // completions are already fetched from weekStart forward, so any match = done this week
  const isCompletedThisWeek = (questId) => {
    return completions.some(c => c.quest_id === questId)
  }

  // Get 7-day streak data for a quest (convert UTC timestamps to local date)
  const getStreak = (questId) => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('en-CA')
      days.push(completions.some(c =>
        c.quest_id === questId &&
        c.completed_at &&
        new Date(c.completed_at).toLocaleDateString('en-CA') === dateStr
      ))
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
      const insertData = {
        user_id: userId,
        quest_id: quest.id,
        quest_category: 'Tune',
        quest_type: quest.type,
        points_earned: quest.points,
        challenge_instance_id: null,
        challenge_day: 0,
        project_id: null,
      }
      // Weekly focus daily honoring: include response_data so downstream reads find the right format
      if (quest.id === 'rewire_weekly_focus' && weeklyFocus) {
        insertData.response_data = {
          quest_type: 'weekly_focus_daily',
          honoured: true,
          intention: weeklyFocus.intention,
          focus_category: weeklyFocus.focus_category,
        }
      }
      const { error: questError } = await supabase.from('quest_completions').insert(insertData)
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

  const isMealLogged = (mealId) => {
    const today = new Date().toLocaleDateString('en-CA')
    return completions.some(c =>
      c.quest_id === mealId &&
      c.completed_at &&
      new Date(c.completed_at).toLocaleDateString('en-CA') === today
    )
  }

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

    // Weekly Focus / Peak State SETUP: don't score, just save the intention and refresh
    const isSetup = data?.quest_type === 'weekly_focus_setup' || data?.quest_type === 'peak_state_setup'
    if (isSetup) {
      if (data.quest_type === 'weekly_focus_setup') setWeeklyFocus(data)
      if (data.quest_type === 'peak_state_setup') setPeakState(data)
      // Refresh completions so the row shows updated state
      supabase
        .from('quest_completions')
        .select('quest_id, completed_at')
        .eq('user_id', userId)
        .in('quest_category', ['Tune', 'Healing'])
        .gte('completed_at', getWeekStartLocal())
        .then(({ data: rows }) => { if (rows) setCompletions(rows) })
      return
    }

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
    // Refresh weekly focus (in case daily honour just completed)
    if (q?.id === 'rewire_weekly_focus') {
      supabase
        .from('quest_completions')
        .select('response_data')
        .eq('user_id', userId)
        .eq('quest_id', 'rewire_weekly_focus')
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
        .eq('quest_id', 'weekly_peak_state')
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
    const savedState = drainState // capture before reset for regulation overlay

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
      setRegulationState(savedState) // show regulation exercises overlay

      // Refresh recent drains
      const { data } = await supabase
        .from('nervous_system_checkins')
        .select('id, source_quest_id, after_state, drain_note, created_at, recovered_at')
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
    const savedState = stallState // capture before reset for regulation overlay

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
      setRegulationState(savedState) // show regulation exercises overlay

      const { data } = await supabase
        .from('nervous_system_checkins')
        .select('id, source_quest_id, after_state, drain_note, protective_voice, created_at, recovered_at')
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

  // --- Recovery tracking helpers ---

  const formatRecoveryTime = (createdAt, recoveredAt) => {
    const mins = Math.round((new Date(recoveredAt).getTime() - new Date(createdAt).getTime()) / 60000)
    if (mins < 60) return `${mins}min`
    const hrs = Math.floor(mins / 60)
    const remainMins = mins % 60
    return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`
  }

  // Recovery is only trackable same-day. Sleep is the natural reset, so an
  // unrecovered item from a previous day shows neither button nor badge
  // (recovered_at stays NULL = "unknown", excluded from averages).
  const isToday = (createdAt) => {
    const d = new Date(createdAt)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
  }

  // Average recovery time across this week's recovered drains
  const avgRecoveryLabel = useMemo(() => {
    const recovered = recentDrains.filter(d => d.recovered_at)
    if (recovered.length === 0) return null
    const avgMins = Math.round(recovered.reduce((sum, d) =>
      sum + (new Date(d.recovered_at) - new Date(d.created_at)) / 60000, 0) / recovered.length)
    return avgMins < 60 ? `${avgMins}min` : `${Math.floor(avgMins / 60)}h ${avgMins % 60}m`
  }, [recentDrains])

  const handleSaveRecovery = async () => {
    if (!recoveryItem || savingRecovery) return
    setSavingRecovery(true)
    const mins = parseInt(recoveryMinutes, 10) || 0
    const recoveredAt = mins > 0
      ? new Date(new Date(recoveryItem.created_at).getTime() + mins * 60000).toISOString()
      : new Date().toISOString()
    const activities = [
      ...recoveryActivities,
      ...(recoveryOther.trim() ? [`other:${recoveryOther.trim()}`] : []),
    ]
    try {
      const { error } = await supabase
        .from('nervous_system_checkins')
        .update({
          recovered_at: recoveredAt,
          recovery_activities: activities.length > 0 ? activities : null,
        })
        .eq('id', recoveryItem.id)
      if (error) throw error
      hapticSuccess()
      setRecentDrains(list => list.map(item =>
        item.id === recoveryItem.id ? { ...item, recovered_at: recoveredAt } : item
      ))
      setRecoveryItem(null)
      setRecoveryActivities([])
      setRecoveryOther('')
      setRecoveryMinutes('')
    } catch (err) {
      console.error('Recovery save error:', err)
    } finally {
      setSavingRecovery(false)
    }
  }

  // --- Experience Check-in ---

  const todayStr = getTodayLocal()
  const todayExpCount = experiences.filter(e => e.date === todayStr).length
  const canAddExp = todayExpCount < 3

  const calibrationStat = useMemo(() => {
    const completed = experiences.filter(e => e.actual_outcome != null)
    if (completed.length === 0) return null
    const hits = completed.filter(e => e.calibration_hit).length
    return { hits, total: completed.length }
  }, [experiences])

  async function handleSaveExperience() {
    if (!expDescription.trim() || !expPrediction || savingExp) return
    setSavingExp(true)
    try {
      const { data, error } = await supabase
        .from('experience_checkins')
        .insert({
          user_id: userId,
          date: todayStr,
          activity_description: expDescription.trim(),
          predicted_outcome: expPrediction,
        })
        .select()
        .single()
      if (error) throw error
      hapticSuccess()
      setExperiences(prev => [data, ...prev])
      setExpDescription('')
      setExpPrediction(null)
      setShowExpForm(false)
    } catch (err) {
      console.error('Experience save error:', err)
    } finally {
      setSavingExp(false)
    }
  }

  async function handleSaveExpOutcome() {
    if (!expOutcomeItem || !expActual || savingExpOutcome) return
    setSavingExpOutcome(true)
    const calibrationHit = expActual === expOutcomeItem.predicted_outcome
    try {
      const { error } = await supabase
        .from('experience_checkins')
        .update({
          actual_outcome: expActual,
          calibration_hit: calibrationHit,
          completed_at: new Date().toISOString(),
        })
        .eq('id', expOutcomeItem.id)
      if (error) throw error
      hapticSuccess()
      setExperiences(prev => prev.map(e =>
        e.id === expOutcomeItem.id
          ? { ...e, actual_outcome: expActual, calibration_hit: calibrationHit, completed_at: new Date().toISOString() }
          : e
      ))
      if (expActual === 'wahoo') {
        setShowWahooPrompt(expOutcomeItem)
      }
      setExpOutcomeItem(null)
      setExpActual(null)
    } catch (err) {
      console.error('Experience outcome error:', err)
    } finally {
      setSavingExpOutcome(false)
    }
  }

  async function handleWahooConvert() {
    if (!showWahooPrompt || !wahooConvertCat) return
    try {
      const { data: challenge, error: createErr } = await createGroanChallenge({
        userId,
        title: showWahooPrompt.activity_description,
        description: showWahooPrompt.activity_description,
        visibilityLayer: 'screen',
        sourceType: 'skill',
        sourceLabel: 'experience-checkin',
        scaryScore: 3,
        wahooScore: 8,
        wahooCategory: wahooConvertCat,
      })
      if (createErr || !challenge) throw createErr || new Error('Failed to create')

      const { error: acceptErr } = await acceptGroanChallenge(challenge.id)
      if (acceptErr) throw acceptErr

      await supabase.from('priority_weekly_picks').insert({
        user_id: userId,
        week_start_date: getWeekStartLocal(),
        pick_type: 'groan',
        reference_id: challenge.id,
        display_name: showWahooPrompt.activity_description,
      })

      hapticSuccess()
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } })
      setShowWahooPrompt(null)
      setWahooConvertCat(null)
      onRefreshPoints?.()
    } catch (err) {
      console.error('Wahoo convert error:', err)
      setShowWahooPrompt(null)
      setWahooConvertCat(null)
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
  const expressionDone = expressionPractices.filter(q => isCompletedToday(q.id)).length + (isCompletedToday('rewire_weekly_focus') ? 1 : 0)
  const expressionTotal = expressionPractices.length + 1 // +1 for Weekly Focus
  const totalDone = maintenanceDone + safetyDone + expressionDone
  const totalPractices = maintenancePractices.length + safetyPractices.length + expressionTotal

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

          {/* Stalls — inline after safety */}
          <div className="tt-inline-tracker">
            <div className="tt-inline-tracker-header">
              <span className="tt-inline-tracker-icon">🧊</span>
              <span className="tt-inline-tracker-label">Stalls</span>
            </div>
            <p className="tt-inline-tracker-sub">Where did your protective voice win?</p>
            <div className="tt-drain-form">
              <div className="tt-drain-categories">
                {STALL_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    className={`tt-drain-cat-btn ${stallCategory === cat.id ? 'selected' : ''}`}
                    onClick={() => { hapticLight(); setStallCategory(stallCategory === cat.id ? null : cat.id) }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
              {stallCategory && (
                <input type="text" className="tt-drain-note" placeholder="What happened? (optional)"
                  value={stallNote} onChange={e => setStallNote(e.target.value)} />
              )}
              {stallCategory && (
                <div className="tt-drain-state">
                  <span className="tt-state-label">How did it leave you?</span>
                  <div className="tt-state-buttons">
                    <button className={`tt-state-btn tt-state-activated ${stallState === 'sympathetic' ? 'selected' : ''}`}
                      onClick={() => { setStallState('sympathetic'); setStallVoice(null) }}>
                      <span>😬</span> Activated
                    </button>
                    <button className={`tt-state-btn tt-state-shutdown ${stallState === 'dorsal' ? 'selected' : ''}`}
                      onClick={() => { setStallState('dorsal'); setStallVoice(null) }}>
                      <span>😶</span> Shutdown
                    </button>
                  </div>
                </div>
              )}
              {stallState && (
                <div className="tt-stall-voice">
                  <span className="tt-state-label">Which voice showed up?</span>
                  <div className="tt-voice-buttons">
                    {VOICES_BY_STATE[stallState].map(v => (
                      <button key={v.id} className={`tt-voice-btn ${stallVoice === v.id ? 'selected' : ''}`}
                        onClick={() => { hapticLight(); setStallVoice(v.id) }}>
                        <span>{v.icon}</span> {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {stallCategory && (
                <div className="tt-drain-actions">
                  <button className="tt-drain-save tt-stall-save"
                    disabled={!stallCategory || !stallState || !stallVoice || savingStall}
                    onClick={handleSaveStall}>
                    {savingStall ? 'Saving...' : 'Log Stall'}
                  </button>
                </div>
              )}
            </div>
            {recentStalls.length > 0 && (
              <div className="tt-drain-list">
                {recentStalls.slice(0, 3).map((stall, i) => {
                  const cat = STALL_CATEGORIES.find(c => c.id === stall.source_quest_id)
                  return (
                    <div key={stall.id || i} className="tt-drain-item">
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
        </div>

        {/* Expression sub-section */}
        <div className="tt-subsection">
          <div className="tt-subsection-header">
            <span className="tt-subsection-icon">🔥</span>
            <span className="tt-subsection-label tt-label-activation">Expression</span>
            {expression !== null && <span className="tt-score-badge tt-score-expression">{expression}/10</span>}
            <span className="tt-subsection-count">{expressionDone}/{expressionTotal}</span>
          </div>
          <div className="tt-quest-list">
            {/* First two expression practices: Own Style, Two Hours of Creation */}
            {expressionPractices.slice(0, 2).map(q => renderQuestRow(q, q.inputType === 'checkbox'))}
            {/* Weekly Focus — positioned 3rd in expression */}
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
                      onClick={() => handleInlineComplete(focusQuest)}
                    >
                      {completingQuestId === 'rewire_weekly_focus' ? '...' : 'Honour'}
                    </button>
                  )}
                </div>
              )
            })()}
            {/* Remaining expression practices: Social Media, Peak State */}
            {expressionPractices.slice(2).map(q => renderQuestRow(q, q.inputType === 'checkbox'))}
          </div>

          {/* Drains — inline after expression */}
          <div className="tt-inline-tracker">
            <div className="tt-inline-tracker-header">
              <span className="tt-inline-tracker-icon">⚡</span>
              <span className="tt-inline-tracker-label">Drains</span>
              {avgRecoveryLabel && (
                <span className="tt-inline-tracker-meta">⏱ {avgRecoveryLabel} avg</span>
              )}
            </div>
            <p className="tt-inline-tracker-sub">What's depleting your energy?</p>
            <div className="tt-drain-form">
              <div className="tt-drain-categories">
                {DRAIN_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    className={`tt-drain-cat-btn ${drainCategory === cat.id ? 'selected' : ''}`}
                    onClick={() => { hapticLight(); setDrainCategory(drainCategory === cat.id ? null : cat.id) }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
              {drainCategory && (
                <input type="text" className="tt-drain-note" placeholder="What drained you? (optional)"
                  value={drainNote} onChange={e => setDrainNote(e.target.value)} />
              )}
              {drainCategory && (
                <div className="tt-drain-state">
                  <span className="tt-state-label">How did it leave you?</span>
                  <div className="tt-state-buttons">
                    <button className={`tt-state-btn tt-state-activated ${drainState === 'sympathetic' ? 'selected' : ''}`}
                      onClick={() => setDrainState('sympathetic')}>
                      <span>😬</span> Activated
                    </button>
                    <button className={`tt-state-btn tt-state-shutdown ${drainState === 'dorsal' ? 'selected' : ''}`}
                      onClick={() => setDrainState('dorsal')}>
                      <span>😶</span> Shutdown
                    </button>
                  </div>
                </div>
              )}
              {drainCategory && (
                <div className="tt-drain-actions">
                  <button className="tt-drain-save"
                    disabled={!drainCategory || !drainState || savingDrain}
                    onClick={handleSaveDrain}>
                    {savingDrain ? 'Saving...' : 'Log Drain'}
                  </button>
                </div>
              )}
            </div>
            {recentDrains.length > 0 && (
              <div className="tt-drain-list">
                {recentDrains.slice(0, 3).map((drain, i) => {
                  const cat = DRAIN_CATEGORIES.find(c => c.id === drain.source_quest_id)
                  return (
                    <div key={drain.id || i} className="tt-drain-item">
                      <span className="tt-drain-item-icon">{cat?.icon || '⚡'}</span>
                      <div className="tt-drain-item-body">
                        <span className="tt-drain-item-cat">{cat?.label || 'Drain'}</span>
                        {drain.drain_note && <span className="tt-drain-item-note">{drain.drain_note}</span>}
                      </div>
                      <span className={`tt-drain-item-state ${drain.after_state === 'dorsal' ? 'tt-shutdown' : 'tt-activated'}`}>
                        {drain.after_state === 'dorsal' ? '😶' : '😬'}
                      </span>
                      {drain.recovered_at ? (
                        <span className="tt-recovered-badge">✓ {formatRecoveryTime(drain.created_at, drain.recovered_at)}</span>
                      ) : drain.id && isToday(drain.created_at) ? (
                        <button type="button" className="tt-recover-btn"
                          onClick={(e) => { e.stopPropagation(); hapticLight(); setRecoveryItem({ ...drain, type: 'drain' }) }}>
                          Recovered?
                        </button>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Experiences — archived, re-enable when ready */}

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
              const setupType = closingQuest.id === 'rewire_weekly_focus' ? 'weekly_focus_setup' : 'peak_state_setup'
              const setter = closingQuest.id === 'rewire_weekly_focus' ? setWeeklyFocus : setPeakState
              supabase
                .from('quest_completions')
                .select('response_data, reflection_text')
                .eq('user_id', userId)
                .eq('quest_id', closingQuest.id)
                .gte('completed_at', getWeekStartLocal())
                .order('completed_at', { ascending: true })
                .limit(5)
                .then(({ data }) => {
                  const record = (data || []).find(r => {
                    const rd = r.response_data || (r.reflection_text ? (() => { try { return JSON.parse(r.reflection_text) } catch { return null } })() : null)
                    return rd?.quest_type === setupType
                  })
                  if (record) setter(record.response_data || JSON.parse(record.reflection_text))
                })
            }
          }}
        />
      )}

      {/* Regulation overlay after drain/stall save */}
      {regulationState && (
        <div className="tt-info-overlay" onClick={() => setRegulationState(null)}>
          <div className="tt-info-modal tt-regulation-modal" onClick={e => e.stopPropagation()}>
            <RegulationCard
              state={regulationState}
              onDone={() => setRegulationState(null)}
              onSkip={() => setRegulationState(null)}
            />
          </div>
        </div>
      )}

      {/* Recovery tracking popup — bottom sheet */}
      {recoveryItem && (
        <div className="tt-recovery-overlay" onClick={() => { setRecoveryItem(null); setRecoveryActivities([]); setRecoveryOther(''); setRecoveryMinutes('') }}>
          <div className="tt-recovery-sheet" onClick={e => e.stopPropagation()}>
            <div className="tt-recovery-handle" />

            <div className="tt-recovery-hero">
              <span className="tt-recovery-emoji">
                {recoveryItem.after_state === 'dorsal' ? '😶' : '😬'}
              </span>
              <h3 className="tt-recovery-title">Back to baseline?</h3>
            </div>

            <div className="tt-recovery-body">
              <div className="tt-recovery-section">
                <span className="tt-recovery-label">Recovery time</span>
                <div className="tt-recovery-duration-row">
                  {[
                    { value: '10', label: '< 15m' },
                    { value: '22', label: '15-30m' },
                    { value: '45', label: '30-60m' },
                    { value: '90', label: '1hr +' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`tt-recovery-dur ${recoveryMinutes === opt.value ? 'selected' : ''}`}
                      onClick={() => { hapticLight(); setRecoveryMinutes(opt.value) }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="tt-recovery-section">
                <span className="tt-recovery-label">What brought you back?</span>
                <div className="tt-recovery-activities">
                  {(REGULATION_EXERCISES[recoveryItem.after_state]?.exercises || []).map(ex => (
                    <button
                      key={ex.id}
                      type="button"
                      className={`tt-recovery-activity ${recoveryActivities.includes(ex.id) ? 'selected' : ''}`}
                      onClick={() => setRecoveryActivities(prev =>
                        prev.includes(ex.id) ? prev.filter(a => a !== ex.id) : [...prev, ex.id]
                      )}
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  className="tt-recovery-other"
                  placeholder="Something else..."
                  value={recoveryOther}
                  onChange={e => setRecoveryOther(e.target.value)}
                  maxLength={80}
                />
              </div>
            </div>

            <div className="tt-recovery-footer">
              <button
                type="button"
                className="tt-recovery-save"
                disabled={savingRecovery}
                onClick={handleSaveRecovery}
              >
                {savingRecovery ? 'Saving...' : "I'm back"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Experience outcome popup */}
      {expOutcomeItem && (
        <div className="tt-info-overlay" onClick={() => { setExpOutcomeItem(null); setExpActual(null) }}>
          <div className="tt-info-modal tt-exp-outcome-modal" onClick={e => e.stopPropagation()}>
            <h3 className="tt-recovery-title">How did it go?</h3>
            <p className="tt-recovery-sub">{expOutcomeItem.activity_description}</p>
            <div className="tt-exp-prediction-buttons tt-exp-actual-buttons">
              {EXPERIENCE_OUTCOMES.map(o => (
                <button
                  key={o.id}
                  type="button"
                  className={`tt-exp-pred-btn ${expActual === o.id ? 'selected' : ''}`}
                  onClick={() => setExpActual(o.id)}
                >
                  <span>{o.emoji}</span> {o.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="tt-recovery-save"
              disabled={!expActual || savingExpOutcome}
              onClick={handleSaveExpOutcome}
            >
              {savingExpOutcome ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Wahoo conversion prompt */}
      {showWahooPrompt && (
        <div className="tt-info-overlay" onClick={() => { setShowWahooPrompt(null); setWahooConvertCat(null) }}>
          <div className="tt-info-modal" onClick={e => e.stopPropagation()}>
            <span className="tt-recovery-emoji">⚡</span>
            <h3 className="tt-recovery-title">That sounds like a Wahoo!</h3>
            <p className="tt-recovery-sub">Add &quot;{showWahooPrompt.activity_description}&quot; to your active Wahoos?</p>
            <div className="tt-exp-prediction-buttons" style={{ marginBottom: 16 }}>
              {WAHOO_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  className={`tt-exp-pred-btn ${wahooConvertCat === cat.id ? 'selected' : ''}`}
                  onClick={() => { hapticLight(); setWahooConvertCat(cat.id) }}
                >
                  <span>{cat.icon}</span> {cat.name}
                </button>
              ))}
            </div>
            <div className="tt-drain-actions">
              <button
                type="button"
                className="tt-drain-save"
                disabled={!wahooConvertCat}
                onClick={handleWahooConvert}
              >
                Add Wahoo
              </button>
              <button
                type="button"
                className="tt-drain-cancel"
                onClick={() => { setShowWahooPrompt(null); setWahooConvertCat(null) }}
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
