/**
 * PriorityTab.jsx
 *
 * Main orchestrator for the Priority tab in the 7-Day Challenge.
 * Manages 3 states:
 *   1. Assessment — inline tension questions (no scores yet)
 *   2. Picker — weekly quest selection
 *   3. Quest List — selected quests rendered as QuestCards + action cards
 *
 * Uses Mockup C (Grouped Sections) design — all categories visible
 * in one scrollable view with section cards.
 *
 * Created: 2026-03-04
 */

import { useState, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getScoringCategory } from '../lib/scoringCategories'
import { getWeekStartLocal } from '../lib/dateUtils'
import usePriorityTab from '../hooks/usePriorityTab'
import PriorityMiniAssessment from './PriorityMiniAssessment'
import PriorityLayerCard from './PriorityLayerCard'
import PriorityWeekPicker from './PriorityWeekPicker'
import GroanCompletionModal from './GroanCompletionModal'
import HealingCompletionModal from './HealingCompletionModal'
import ChallengeRating from './PlayProfile/ChallengeRating'
import './PriorityTab.css'

export default function PriorityTab({
  userId,
  stageProgress,
  onStageProgressUpdate,
  // Completion props
  onQuestComplete,
  completingQuestId,
  isQuestCompletedToday,
  getDailyStreak,
  getDayLabels,
}) {
  const {
    currentState,
    priorityLayer,
    layerDisplay,
    skills,
    dnaResult,
    activeDnaSession,
    dailyHealingQuests,
    weeklyHealingQuests,
    weeklyPicks,
    selectedHealingQuests,
    selectedGroanPicks,
    selectedDnaPick,
    recommendations,
    confirmWeek,
    editWeek,
    startReassess,
    finishReassess,
    refreshData,
    refreshDnaSession,
    loading,
  } = usePriorityTab(userId, stageProgress)

  const [completingChallenge, setCompletingChallenge] = useState(null)
  const [loadingChallengeId, setLoadingChallengeId] = useState(null)
  const [showDnaRating, setShowDnaRating] = useState(false)
  const [healingModalQuest, setHealingModalQuest] = useState(null)

  // Progress: count completed picks vs total
  const progressInfo = useMemo(() => {
    if (currentState !== 'quest_list') return null
    const total = weeklyPicks.length
    // Count completions from healing quests (groan/DNA tracked externally)
    let done = 0
    selectedHealingQuests.forEach(q => {
      if (isQuestCompletedToday?.(q.id, q)) done++
    })
    return { done, total }
  }, [currentState, weeklyPicks, selectedHealingQuests, isQuestCompletedToday])

  const handleAssessmentComplete = async (computedLayer) => {
    // Wait for stage progress to update before clearing force state,
    // otherwise hasTensionScores is still false and we flash back to assessment
    await onStageProgressUpdate?.()
    finishReassess()
  }

  const renderHealingRow = (quest) => {
    const completed = isQuestCompletedToday?.(quest.id, quest) || false
    const isCompleting = completingQuestId === quest.id
    const streak = quest.frequency === 'daily' ? getDailyStreak?.(quest.id) : null
    const dayLabels = quest.frequency === 'daily' ? getDayLabels?.() : null

    return (
      <div key={quest.id} className={`pt-item-row ${completed ? 'done' : ''}`}>
        <span className={`pt-item-check ${completed ? 'done' : ''}`}>
          {completed ? '✓' : ''}
        </span>
        <div className="pt-item-body">
          <div className="pt-item-name">{quest.name}</div>
          <div className="pt-item-meta">
            <span className="pt-item-type">{quest.type}</span>
            <span className="pt-item-sep">·</span>
            <span className="pt-pts">{quest.points}pts</span>
          </div>
          {streak && dayLabels && (
            <div className="pt-streak-dots">
              {dayLabels.map((day, i) => (
                <div key={i} className="pt-streak-day">
                  <span className={`pt-streak-dot ${streak[i] ? 'filled' : ''}`} />
                  <span className="pt-streak-label">{day}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {completed ? (
          <span className="pt-item-action done-action">Done</span>
        ) : (
          <button
            className="pt-item-action"
            disabled={isCompleting}
            onClick={() => setHealingModalQuest(quest)}
          >
            {isCompleting ? '...' : 'Complete'}
          </button>
        )}
      </div>
    )
  }

  // ── Loading ──
  if (currentState === 'loading') {
    return (
      <div className="priority-tab pt-loading">
        <div className="spinner" />
      </div>
    )
  }

  // ── State 1: Assessment ──
  if (currentState === 'assessment') {
    return (
      <div className="priority-tab">
        <PriorityMiniAssessment
          userId={userId}
          onComplete={handleAssessmentComplete}
        />
      </div>
    )
  }

  // ── State 2: Picker ──
  if (currentState === 'picker') {
    return (
      <div className="priority-tab">
        <PriorityLayerCard
          layer={priorityLayer}
          onReassess={startReassess}
        />
        <PriorityWeekPicker
          skills={skills}
          userId={userId}
          dnaResult={dnaResult}
          activeDnaSession={activeDnaSession}
          dailyHealingQuests={dailyHealingQuests}
          weeklyHealingQuests={weeklyHealingQuests}
          recommendations={recommendations}
          onConfirm={confirmWeek}
          onDnaRefresh={refreshDnaSession}
        />
      </div>
    )
  }

  // ── State 3: Quest List (Mockup C grouped sections) ──
  const dailyQuests = selectedHealingQuests.filter(q => q.frequency === 'daily')
  const weeklyQuests = selectedHealingQuests.filter(q => q.frequency === 'weekly')

  return (
    <div className="priority-tab">
      <PriorityLayerCard
        layer={priorityLayer}
        onReassess={startReassess}
      />

      {/* Progress bar */}
      {progressInfo && (
        <div className="pt-progress-row">
          <span className="pt-progress-label">{progressInfo.done}/{progressInfo.total} done</span>
          <div className="pt-progress-bar">
            <div
              className="pt-progress-fill"
              style={{ width: `${progressInfo.total > 0 ? (progressInfo.done / progressInfo.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Play-list Challenges section */}
      {selectedGroanPicks.length > 0 && (
        <div className={`pt-section-card ${recommendations.includes('groan') ? 'recommended' : ''}`}>
          <div className="pt-section-header">
            <div className="pt-section-header-left">
              <span className="pt-section-icon">🎮</span>
              <span className="pt-section-title">Play-list Challenges</span>
            </div>
            <span className="pt-section-count">{selectedGroanPicks.length}</span>
          </div>
          <div className="pt-section-items">
            {selectedGroanPicks.map(pick => {
              const formatName = (name) => {
                if (!name) return name
                const match = name.match(/^(.+?)\s*[x\u00d7]\s*(\w+)\s*[—\u2014-]+\s*(.+)$/)
                if (match) return `${match[2].toUpperCase()}: ${match[1].trim()} — ${match[3].trim()}`
                return name
              }
              const isLoading = loadingChallengeId === pick.reference_id

              return (
                <div key={pick.id || pick.reference_id} className="pt-item-row">
                  <span className="pt-item-check"></span>
                  <div className="pt-item-body">
                    <div className="pt-item-name">{formatName(pick.display_name)}</div>
                    <div className="pt-item-meta">Play-list Challenge</div>
                  </div>
                  <button
                    className="pt-item-action"
                    disabled={isLoading}
                    onClick={async () => {
                      setLoadingChallengeId(pick.reference_id)
                      const { data } = await supabase
                        .from('groan_challenges')
                        .select('*')
                        .eq('id', pick.reference_id)
                        .single()
                      setLoadingChallengeId(null)
                      if (data) setCompletingChallenge(data)
                    }}
                  >
                    {isLoading ? '...' : 'Complete'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Play Profile section */}
      {selectedDnaPick && (
        <div className={`pt-section-card ${recommendations.includes('play_profile') ? 'recommended' : ''}`}>
          <div className="pt-section-header">
            <div className="pt-section-header-left">
              <span className="pt-section-icon">🧬</span>
              <span className="pt-section-title">Play Profile</span>
            </div>
            <span className="pt-section-count">0/1</span>
          </div>
          <div className="pt-section-items">
            {!showDnaRating ? (
              <div className="pt-item-row">
                <span className="pt-item-check"></span>
                <div className="pt-item-body">
                  <div className="pt-item-name">{selectedDnaPick.display_name}</div>
                  <div className="pt-item-meta">DNA Challenge</div>
                </div>
                <button className="pt-item-action" onClick={() => setShowDnaRating(true)}>
                  Complete
                </button>
              </div>
            ) : (
              <div style={{ padding: '12px 18px' }}>
                <ChallengeRating
                  founderName={dnaResult?.matched_founder || 'your founder'}
                  challengeAction={activeDnaSession?.challenge_name}
                  onRate={async (ratingData) => {
                    if (activeDnaSession?.id) {
                      const { error } = await supabase
                        .from('founder_dna_sessions')
                        .update({
                          status: 'completed',
                          voice_type: ratingData.voice_type,
                          voice_reflection: ratingData.voice_reflection,
                          compass_internal: ratingData.internal_state,
                          compass_external: ratingData.external_state,
                          compass_direction: ratingData.compass_direction,
                          completed_at: new Date().toISOString(),
                        })
                        .eq('id', activeDnaSession.id)
                      if (error) console.warn('Error saving DNA rating:', error)
                    }

                    await supabase.from('quest_completions').insert({
                      user_id: userId,
                      challenge_instance_id: null,
                      quest_id: `play_profile_challenge_${activeDnaSession?.id || 'unknown'}`,
                      quest_category: 'Groans',
                      quest_type: 'play_profile',
                      points_earned: 10,
                      challenge_day: 0,
                      project_id: null,
                      reflection_text: JSON.stringify(ratingData),
                    })

                    try {
                      await supabase.rpc('increment_scores', {
                        p_user_id: userId,
                        p_project_id: null,
                        p_category: getScoringCategory('Groans'),
                        p_points: 10,
                        p_week_start: getWeekStartLocal(),
                      })
                    } catch (e) { console.warn('Score error:', e) }

                    setShowDnaRating(false)
                    refreshDnaSession()
                  }}
                  onBack={() => setShowDnaRating(false)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Daily Healing section */}
      {dailyQuests.length > 0 && (
        <div className={`pt-section-card ${recommendations.includes('daily_healing') ? 'recommended' : ''}`}>
          <div className="pt-section-header">
            <div className="pt-section-header-left">
              <span className="pt-section-icon">💚</span>
              <span className="pt-section-title">Daily Healing</span>
              {recommendations.includes('daily_healing') && <span className="pt-rec-badge">Recommended</span>}
            </div>
            <span className={`pt-section-count ${dailyQuests.every(q => isQuestCompletedToday?.(q.id, q)) ? 'complete' : ''}`}>
              {dailyQuests.filter(q => isQuestCompletedToday?.(q.id, q)).length}/{dailyQuests.length}
            </span>
          </div>
          <div className="pt-section-items">
            {dailyQuests.map(quest => renderHealingRow(quest))}
          </div>
        </div>
      )}

      {/* Weekly Healing section */}
      {weeklyQuests.length > 0 && (
        <div className={`pt-section-card ${recommendations.includes('weekly_healing') ? 'recommended' : ''}`}>
          <div className="pt-section-header">
            <div className="pt-section-header-left">
              <span className="pt-section-icon">💜</span>
              <span className="pt-section-title">Weekly Healing</span>
              {recommendations.includes('weekly_healing') && <span className="pt-rec-badge">Recommended</span>}
            </div>
            <span className={`pt-section-count ${weeklyQuests.every(q => isQuestCompletedToday?.(q.id, q)) ? 'complete' : ''}`}>
              {weeklyQuests.filter(q => isQuestCompletedToday?.(q.id, q)).length}/{weeklyQuests.length}
            </span>
          </div>
          <div className="pt-section-items">
            {weeklyQuests.map(quest => renderHealingRow(quest))}
          </div>
        </div>
      )}

      <button className="pt-edit-btn" onClick={editWeek}>
        Edit Week
      </button>

      {completingChallenge && (
        <GroanCompletionModal
          challenge={completingChallenge}
          userId={userId}
          onComplete={() => {
            setCompletingChallenge(null)
            refreshData()
          }}
          onClose={() => setCompletingChallenge(null)}
        />
      )}

      {healingModalQuest && (
        <HealingCompletionModal
          quest={healingModalQuest}
          onComplete={(quest, textInput) => {
            const inputValue = quest.inputType === 'checkbox' ? 'completed' : textInput
            onQuestComplete(quest, inputValue)
          }}
          onClose={() => setHealingModalQuest(null)}
        />
      )}
    </div>
  )
}
