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
import './TuneTab.css'

// Quest IDs that render inline (Practice + Rest checkboxes)
const INLINE_TYPES = ['Practice', 'Rest']

// Daily practice IDs to show in Section 1 (includes breathwork from Reconnect)
const DAILY_PRACTICE_IDS = [
  'reconnect_morning_breathwork',
  'practice_cold_exposure',
  'practice_voice_work',
  'reconnect_morning_dance',
  'practice_sleep',
  'practice_sunlight',
]

export default function TuneTab({ userId, onQuestComplete, onRefreshPoints }) {
  const [allQuests, setAllQuests] = useState([])
  const [completions, setCompletions] = useState([])
  const [loading, setLoading] = useState(true)
  const [completingQuestId, setCompletingQuestId] = useState(null)
  const [statePickerQuestId, setStatePickerQuestId] = useState(null) // which quest shows inline state picker
  const [healingModalQuest, setHealingModalQuest] = useState(null) // for Reconnect multi-step

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
    ]).then(([questData, { data: completionData }]) => {
      const tuneQuests = (questData.quests || []).filter(q => q.category === 'Tune' && !q.archived)
      setAllQuests(tuneQuests)
      setCompletions(completionData || [])
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

  // Section data
  const dailyPractices = useMemo(() =>
    DAILY_PRACTICE_IDS.map(id => allQuests.find(q => q.id === id)).filter(Boolean),
    [allQuests]
  )

  const reconnectQuests = useMemo(() =>
    allQuests.filter(q => q.type === 'Reconnect' && !DAILY_PRACTICE_IDS.includes(q.id)),
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
      await supabase.from('quest_completions').insert({
        user_id: userId,
        quest_id: quest.id,
        quest_category: 'Tune',
        quest_type: quest.type,
        points_earned: quest.points,
        challenge_instance_id: null,
        challenge_day: 0,
        project_id: null,
      })

      // 2. Save state check-in
      await supabase.from('nervous_system_checkins').insert({
        user_id: userId,
        before_state: null,
        after_state: afterState,
        checkin_type: 'tune',
        source_quest_id: quest.id,
      })

      // 3. Increment scores
      await supabase.rpc('increment_scores', {
        p_user_id: userId,
        p_project_id: null,
        p_category: getScoringCategory('Tune'),
        p_points: quest.points,
        p_week_start: getWeekStartLocal(),
      })

      hapticSuccess()
      setStatePickerQuestId(null)

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
            <span className="ht-pts">{quest.points} RP</span>
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
  const todayPracticeCount = dailyPractices.filter(q => isCompletedToday(q.id)).length

  return (
    <div className="tune-tab">
      {/* Section 1: Daily Practices */}
      <div className="tt-section">
        <div className="tt-section-header">
          <div className="tt-section-header-left">
            <span className="tt-section-icon">☀️</span>
            <span className="tt-section-title">Daily Practices</span>
          </div>
          <span className="tt-section-count">{todayPracticeCount}/{dailyPractices.length}</span>
        </div>
        <p className="tt-section-sub">Your daily deposits. 30-45 min total, massive returns.</p>
        <div className="tt-quest-list">
          {dailyPractices.map(q => renderQuestRow(q, true))}
        </div>
      </div>

      {/* Section 2: Reconnect */}
      {reconnectQuests.length > 0 && (
        <div className="tt-section">
          <div className="tt-section-header">
            <div className="tt-section-header-left">
              <span className="tt-section-icon">🔄</span>
              <span className="tt-section-title">Reconnect</span>
            </div>
          </div>
          <div className="tt-quest-list">
            {reconnectQuests.map(q => renderQuestRow(q, false))}
          </div>
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
