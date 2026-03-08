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

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import usePriorityTab from '../hooks/usePriorityTab'
import PriorityMiniAssessment from './PriorityMiniAssessment'
import PriorityLayerCard from './PriorityLayerCard'
import PriorityOnboardingCard from './PriorityOnboardingCard'
import PriorityRecommendedCard from './PriorityRecommendedCard'
import PriorityLayerCheckin from './PriorityLayerCheckin'
import PriorityWeekPicker from './PriorityWeekPicker'
import GroanCompletionModal from './GroanCompletionModal'
import HealingCompletionModal from './HealingCompletionModal'
import './PriorityTab.css'

const QUEST_INFO = {
  flow_finder_skills: { name: 'Flow Finder: Skills', route: '/nikigai/skills', icon: '🎯', desc: 'Discover what you\'re naturally great at' },
  flow_finder_problems: { name: 'Flow Finder: Problems', route: '/nikigai/problems', icon: '🧩', desc: 'Find the problems you care about solving' },
  flow_finder_persona: { name: 'Flow Finder: Persona', route: '/nikigai/persona', icon: '👤', desc: 'Identify who you\'re meant to serve' },
  recognise_nervous_system: { name: 'Map Your Nervous System', route: '/nervous-system', icon: '🧠', desc: 'Find your boundaries around money and visibility' },
  recognise_limiting_belief_rewire: { name: 'Limiting Belief Rewire', route: '/limiting-belief-rewire', icon: '🔓', desc: 'Trace a limiting belief to its origin and rewire it' },
  release_weekly_big: { name: 'Big Release', route: null, icon: '💜', desc: 'Complete an extended release practice this week' },
}

function RecommendedQuestCard({ questId, isWeekly }) {
  const info = QUEST_INFO[questId]
  if (!info) return null

  return (
    <div className="pt-section-card recommended">
      <div className="pt-section-header">
        <div className="pt-section-header-left">
          <span className="pt-section-icon">{info.icon}</span>
          <span className="pt-section-title">{info.name}</span>
          <span className="pt-rec-badge">{isWeekly ? 'Weekly' : 'Recommended'}</span>
        </div>
      </div>
      <div className="pt-section-items">
        <div className="pt-item-row">
          <span className="pt-item-check"></span>
          <div className="pt-item-body">
            <div className="pt-item-name">{info.desc}</div>
          </div>
          {info.route && <a href={info.route} className="pt-item-action">Start</a>}
        </div>
      </div>
    </div>
  )
}

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
  // Onboarding props
  isQuestEverCompleted,
  onNavigateToPlaylist,
}) {
  const {
    currentState,
    priorityLayer,
    layerDisplay,
    skills,
    dailyHealingQuests,
    weeklyHealingQuests,
    weeklyPicks,
    selectedHealingQuests,
    selectedGroanPicks,
    recommendations,
    onboardingStatus,
    isOnboardingComplete,
    hasAcceptedChallenge,
    essenceProfile,
    checkinDoneThisWeek,
    nudgeLayer,
    clearNudge,
    completeCheckin,
    finalizeCheckin,
    confirmWeek,
    editWeek,
    startReassess,
    finishReassess,
    refreshData,
    refreshAcceptedChallenge,
    refreshCustomPhoto,
    onAlignmentChange,
    loading,
  } = usePriorityTab(userId, stageProgress, isQuestEverCompleted)

  // Refresh accepted challenge on mount (handles returning from Play-list tab)
  useEffect(() => {
    refreshAcceptedChallenge()
  }, [refreshAcceptedChallenge])

  const [completingChallenge, setCompletingChallenge] = useState(null)
  const [loadingChallengeId, setLoadingChallengeId] = useState(null)
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
          {quest.customDisplayName && (
            <div className="pt-item-custom-text">{quest.customDisplayName}</div>
          )}
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

  // ── Onboarding ──
  if (currentState === 'onboarding') {
    return (
      <div className="priority-tab">
        <PriorityOnboardingCard
          userId={userId}
          onboardingStatus={onboardingStatus}
          onNavigateToPlaylist={onNavigateToPlaylist}
          hasAcceptedChallenge={hasAcceptedChallenge}
          onAlignmentChange={onAlignmentChange}
          onPhotoUploaded={refreshCustomPhoto}
          essenceProfile={essenceProfile}
          skills={skills}
        />
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

  // ── Layer Check-in (weekly graduation gate) ──
  if (currentState === 'layer_checkin') {
    return (
      <div className="priority-tab">
        <PriorityLayerCheckin
          priorityLayer={priorityLayer}
          stageProgress={stageProgress}
          onComplete={async (result) => {
            const graduation = await completeCheckin(true, result.scores)
            if (!graduation.layerChanged) {
              await onStageProgressUpdate?.()
            }
            // If layerChanged, stageProgress refresh deferred to onCelebrationDone
            return graduation
          }}
          onNotYet={async () => {
            await completeCheckin(false)
          }}
          onCelebrationDone={async () => {
            finalizeCheckin()
            await onStageProgressUpdate?.()
          }}
        />
      </div>
    )
  }

  // ── State 2: Picker ──
  if (currentState === 'picker') {
    return (
      <div className="priority-tab">
        {nudgeLayer && (
          <div className="pt-nudge-banner">
            <span className="pt-nudge-text">
              {nudgeLayer === 'discover' && "That's your focus this week. Your Flow Finder quests will help you get clear."}
              {nudgeLayer === 'regulate' && "That's okay. Your healing quests this week will build that capacity."}
              {nudgeLayer === 'reveal' && "No rush. Your Play-list challenges will stretch that muscle."}
            </span>
            <button className="pt-nudge-dismiss" onClick={clearNudge}>&times;</button>
          </div>
        )}
        <PriorityLayerCard
          layer={priorityLayer}
          onReassess={startReassess}
        />
        <PriorityWeekPicker
          skills={skills}
          userId={userId}
          dailyHealingQuests={dailyHealingQuests}
          weeklyHealingQuests={weeklyHealingQuests}
          recommendations={recommendations}
          onConfirm={confirmWeek}
        />
      </div>
    )
  }

  // ── State 3: Quest List (Mockup C grouped sections) ──
  const dailyQuests = selectedHealingQuests.filter(q => q.frequency === 'daily')
  const weeklyQuests = selectedHealingQuests.filter(q => q.frequency === 'weekly')

  return (
    <div className="priority-tab">
      <PriorityRecommendedCard
        priorityLayer={priorityLayer}
        recommendations={recommendations}
        onReassess={startReassess}
      />

      <h2 className="pt-weekly-heading">Weekly Intentions</h2>

      {/* Recommended quest card for Discover/Regulate layers */}
      {recommendations.type === 'quests' && recommendations.nextQuest && (
        <RecommendedQuestCard questId={recommendations.nextQuest} />
      )}
      {recommendations.type === 'quests' && recommendations.alwaysRecommend?.map(questId => (
        <RecommendedQuestCard key={questId} questId={questId} isWeekly />
      ))}

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
        <div className={`pt-section-card ${recommendations.sections?.includes('groan') ? 'recommended' : ''}`}>
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

      {/* Daily Healing section */}
      {dailyQuests.length > 0 && (
        <div className={`pt-section-card ${recommendations.sections?.includes('daily_healing') ? 'recommended' : ''}`}>
          <div className="pt-section-header">
            <div className="pt-section-header-left">
              <span className="pt-section-icon">💚</span>
              <span className="pt-section-title">Daily Healing</span>
              {recommendations.sections?.includes('daily_healing') && <span className="pt-rec-badge">Recommended</span>}
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
        <div className={`pt-section-card ${recommendations.sections?.includes('weekly_healing') ? 'recommended' : ''}`}>
          <div className="pt-section-header">
            <div className="pt-section-header-left">
              <span className="pt-section-icon">💜</span>
              <span className="pt-section-title">Weekly Healing</span>
              {recommendations.sections?.includes('weekly_healing') && <span className="pt-rec-badge">Recommended</span>}
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
