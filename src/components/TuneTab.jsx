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
import HealingCompletionModal from './HealingCompletionModal'
import CapacityCard from './level/CapacityCard'
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

// Daily practice IDs — all daily Tune quests merged (Practice + Reconnect)
const DAILY_PRACTICE_IDS = [
  'reconnect_morning_breathwork',
  'practice_cold_exposure',
  'practice_voice_work',
  'reconnect_morning_dance',
  'practice_sleep',
  'practice_sunlight',
  'practice_healthy_meal',
  'reconnect_morning_meditation',
  'reconnect_daily_prayer',
  'reconnect_self_identified',
]

export default function TuneTab({ userId, onQuestComplete, onRefreshPoints }) {
  const [allQuests, setAllQuests] = useState([])
  const [completions, setCompletions] = useState([])
  const [loading, setLoading] = useState(true)
  const [completingQuestId, setCompletingQuestId] = useState(null)
  const [statePickerQuestId, setStatePickerQuestId] = useState(null) // which quest shows inline state picker
  const [healingModalQuest, setHealingModalQuest] = useState(null) // for Reconnect multi-step

  // Capacity score refresh
  const [capacityRefresh, setCapacityRefresh] = useState(0)

  // Drain logging state
  const [showDrainForm, setShowDrainForm] = useState(false)
  const [drainCategory, setDrainCategory] = useState(null)
  const [drainNote, setDrainNote] = useState('')
  const [drainState, setDrainState] = useState(null) // 'sympathetic' | 'dorsal'
  const [savingDrain, setSavingDrain] = useState(false)
  const [recentDrains, setRecentDrains] = useState([])

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
    ]).then(([questData, { data: completionData }, { data: drainData }]) => {
      const tuneQuests = (questData.quests || []).filter(q => q.category === 'Tune' && !q.archived)
      setAllQuests(tuneQuests)
      setCompletions(completionData || [])
      setRecentDrains(drainData || [])
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

  // Section data — split by capacityType
  const allDailyPractices = useMemo(() =>
    DAILY_PRACTICE_IDS.map(id => allQuests.find(q => q.id === id)).filter(Boolean),
    [allQuests]
  )

  const safetyPractices = useMemo(() =>
    allDailyPractices.filter(q => q.capacityType === 'safety'),
    [allDailyPractices]
  )

  const activationPractices = useMemo(() =>
    allDailyPractices.filter(q => q.capacityType === 'activation'),
    [allDailyPractices]
  )

  // Weekly quests (split by capacityType)
  const weeklySafety = useMemo(() =>
    allQuests.filter(q => q.frequency === 'weekly' && q.capacityType === 'safety'),
    [allQuests]
  )

  const weeklyActivation = useMemo(() =>
    allQuests.filter(q => q.frequency === 'weekly' && q.capacityType === 'activation'),
    [allQuests]
  )

  const restQuests = useMemo(() =>
    allQuests.filter(q => q.type === 'Rest'),
    [allQuests]
  )

  // Inline completion: tap Complete → show state picker → save
  const handleInlineComplete = async (quest, afterState) => {
    if (completingQuestId) return
    setCompletingQuestId(quest.id)
    hapticLight()

    try {
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
        throw questError
      }

      // 2. Save state check-in
      const { error: checkinError } = await supabase.from('nervous_system_checkins').insert({
        user_id: userId,
        before_state: null,
        after_state: afterState,
        checkin_type: 'tune',
        source_quest_id: quest.id,
      })
      if (checkinError) console.warn('Tune NS check-in error:', checkinError)

      // 3. Increment scores
      const { error: scoreError } = await supabase.rpc('increment_scores', {
        p_user_id: userId,
        p_project_id: null,
        p_category: getScoringCategory('Tune'),
        p_points: quest.points,
        p_week_start: getWeekStartLocal(),
      })
      if (scoreError) console.warn('Tune score increment error:', scoreError)

      hapticSuccess()
      setStatePickerQuestId(null)
      setCapacityRefresh(n => n + 1)

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

  // Render a quest row (reuses healing tab ht- pattern)
  function renderQuestRow(quest, useInlineStateCheck = true) {
    const completed = isCompletedToday(quest.id)
    const streak = quest.frequency === 'daily' ? getStreak(quest.id) : null
    const dayLabels = quest.frequency === 'daily' ? getDayLabels() : null
    const showStatePicker = statePickerQuestId === quest.id
    const isCompleting = completingQuestId === quest.id

    return (
      <div key={quest.id} className={`ht-item-row ${completed ? 'done' : ''}`}>
        <span className={`ht-item-check ${completed ? 'done' : ''}`}>
          {completed ? '✓' : ''}
        </span>
        <div className="ht-item-body">
          <div className="ht-item-name">{quest.name}</div>
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
          {/* Inline state picker (expands below quest name) */}
          {showStatePicker && (
            <div className="tt-state-picker">
              <span className="tt-state-label">How do you feel?</span>
              <div className="tt-state-buttons">
                <button
                  className="tt-state-btn tt-state-safe"
                  onClick={() => handleInlineComplete(quest, 'ventral')}
                  disabled={isCompleting}
                >
                  😊 Safe
                </button>
                <button
                  className="tt-state-btn tt-state-vibe"
                  onClick={() => handleInlineComplete(quest, 'vibe_rise')}
                  disabled={isCompleting}
                >
                  ⚡ Vibe Rise
                </button>
              </div>
            </div>
          )}
        </div>
        {completed ? (
          <span className="ht-item-action done-action">Done</span>
        ) : useInlineStateCheck ? (
          <button
            className="ht-item-action"
            disabled={isCompleting}
            onClick={() => {
              hapticLight()
              setStatePickerQuestId(showStatePicker ? null : quest.id)
            }}
          >
            {isCompleting ? '...' : showStatePicker ? 'Cancel' : 'Complete'}
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
  const safetyDone = safetyPractices.filter(q => isCompletedToday(q.id)).length
  const activationDone = activationPractices.filter(q => isCompletedToday(q.id)).length
  const totalDone = safetyDone + activationDone
  const totalPractices = safetyPractices.length + activationPractices.length

  return (
    <div className="tune-tab">
      {/* Capacity Score */}
      <CapacityCard userId={userId} refreshTrigger={capacityRefresh} />

      {/* Section 1: Daily Practices */}
      <div className="tt-section">
        <div className="tt-section-header">
          <div className="tt-section-header-left">
            <span className="tt-section-icon">☀️</span>
            <span className="tt-section-title">Daily Practices</span>
          </div>
          <span className="tt-section-count">{totalDone}/{totalPractices}</span>
        </div>
        <p className="tt-section-sub">Building your capacity to hold Vibe Rise. Safety builds the container, activation expands it.</p>

        {/* Safety sub-section */}
        <div className="tt-subsection">
          <div className="tt-subsection-header">
            <span className="tt-subsection-icon">🛡️</span>
            <span className="tt-subsection-label tt-label-safety">Safety</span>
            <span className="tt-subsection-count">{safetyDone}/{safetyPractices.length}</span>
          </div>
          <div className="tt-quest-list">
            {safetyPractices.map(q => renderQuestRow(q, q.inputType === 'checkbox'))}
          </div>
        </div>

        {/* Activation sub-section */}
        <div className="tt-subsection">
          <div className="tt-subsection-header">
            <span className="tt-subsection-icon">🔥</span>
            <span className="tt-subsection-label tt-label-activation">Activation</span>
            <span className="tt-subsection-count">{activationDone}/{activationPractices.length}</span>
          </div>
          <div className="tt-quest-list">
            {activationPractices.map(q => renderQuestRow(q, q.inputType === 'checkbox'))}
          </div>
        </div>
      </div>

      {/* Section 2: Weekly */}
      {(weeklySafety.length > 0 || weeklyActivation.length > 0) && (
        <div className="tt-section">
          <div className="tt-section-header">
            <div className="tt-section-header-left">
              <span className="tt-section-icon">📅</span>
              <span className="tt-section-title">Weekly</span>
            </div>
          </div>
          <p className="tt-section-sub">At least once a week, go deeper.</p>

          {weeklySafety.length > 0 && (
            <div className="tt-subsection">
              <div className="tt-subsection-header">
                <span className="tt-subsection-icon">🛡️</span>
                <span className="tt-subsection-label tt-label-safety">Safety</span>
              </div>
              <div className="tt-quest-list">
                {weeklySafety.map(q => renderQuestRow(q, q.inputType === 'checkbox'))}
              </div>
            </div>
          )}

          {weeklyActivation.length > 0 && (
            <div className="tt-subsection">
              <div className="tt-subsection-header">
                <span className="tt-subsection-icon">🔥</span>
                <span className="tt-subsection-label tt-label-activation">Activation</span>
              </div>
              <div className="tt-quest-list">
                {weeklyActivation.map(q => renderQuestRow(q, q.inputType === 'checkbox'))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section 3: Rest */}
      {restQuests.length > 0 && (
        <div className="tt-section">
          <div className="tt-section-header">
            <div className="tt-section-header-left">
              <span className="tt-section-icon">🌙</span>
              <span className="tt-section-title">Rest</span>
            </div>
          </div>
          <div className="tt-quest-list">
            {restQuests.map(q => renderQuestRow(q, true))}
          </div>
        </div>
      )}

      {/* Section 4: Drains */}
      <div className="tt-section">
        <div className="tt-section-header">
          <div className="tt-section-header-left">
            <span className="tt-section-icon">⚡</span>
            <span className="tt-section-title">Drains</span>
          </div>
          {recentDrains.length > 0 && (
            <span className="tt-section-count tt-drain-count">{recentDrains.length} this week</span>
          )}
        </div>

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
                    😬 Activated
                  </button>
                  <button
                    className={`tt-state-btn tt-state-shutdown ${drainState === 'dorsal' ? 'selected' : ''}`}
                    onClick={() => setDrainState('dorsal')}
                  >
                    😶 Shutdown
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

      {/* Reconnect Completion Modal */}
      {healingModalQuest && (
        <HealingCompletionModal
          quest={healingModalQuest}
          userId={userId}
          onComplete={handleReconnectComplete}
          onClose={() => setHealingModalQuest(null)}
        />
      )}
    </div>
  )
}
