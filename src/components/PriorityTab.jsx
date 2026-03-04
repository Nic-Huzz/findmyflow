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

import { useMemo } from 'react'
import usePriorityTab from '../hooks/usePriorityTab'
import PriorityMiniAssessment from './PriorityMiniAssessment'
import PriorityLayerCard from './PriorityLayerCard'
import PriorityWeekPicker from './PriorityWeekPicker'
import QuestCard from './QuestCard'
import './PriorityTab.css'

export default function PriorityTab({
  userId,
  stageProgress,
  onStageProgressUpdate,
  // QuestCard shared props
  completions,
  questInputs,
  onInputChange,
  onQuestComplete,
  completingQuestId,
  expandedLearnMore,
  onToggleLearnMore,
  showLockedTooltip,
  onToggleLockedTooltip,
  renderDescription,
  navigate,
  selectedProject,
  progress,
  projectStage,
  justCompletedQuestId,
  isQuestCompletedToday,
  isQuestLocked,
  getRequiredQuestName,
  getDailyStreak,
  getDayLabels,
  isQuestPlanned,
  getPlannedDay,
  userArchetypes,
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

  const renderQuestCard = (quest) => {
    const completed = isQuestCompletedToday?.(quest.id, quest) || false
    const locked = isQuestLocked ? isQuestLocked(quest) : false

    return (
      <QuestCard
        key={quest.id}
        quest={quest}
        completed={completed}
        isCompleting={completingQuestId === quest.id}
        locked={locked}
        lockedPrerequisite={locked && getRequiredQuestName ? getRequiredQuestName(quest.requires_quest, quest.id) : null}
        showStreak={quest.frequency === 'daily'}
        streak={getDailyStreak?.(quest.id)}
        dayLabels={getDayLabels?.()}
        questInput={questInputs?.[quest.id]}
        onInputChange={onInputChange}
        onComplete={onQuestComplete}
        expandedLearnMore={expandedLearnMore}
        onToggleLearnMore={onToggleLearnMore}
        showLockedTooltip={showLockedTooltip}
        onToggleLockedTooltip={(id) => onToggleLockedTooltip?.(showLockedTooltip === id ? null : id)}
        renderDescription={renderDescription}
        completedBadgeText={quest.frequency === 'daily' ? 'Completed Today' : 'Completed'}
        navigate={navigate}
        selectedProject={selectedProject}
        progress={progress}
        projectStage={projectStage}
        justCompleted={justCompletedQuestId === quest.id}
        isPlanned={isQuestPlanned ? isQuestPlanned(quest.id) : false}
        plannedDay={getPlannedDay ? getPlannedDay(quest.id) : null}
        userId={userId}
        userArchetypes={userArchetypes}
      />
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
            {selectedGroanPicks.map(pick => (
              <a
                key={pick.id || pick.reference_id}
                href="/7-day-challenge?tab=play-list&sub=playlist"
                className="pt-item-row"
              >
                <span className="pt-item-check"></span>
                <div className="pt-item-body">
                  <div className="pt-item-name">{pick.display_name}</div>
                  <div className="pt-item-meta">Play-list Challenge</div>
                </div>
                <span className="pt-item-action">Go →</span>
              </a>
            ))}
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
            <a href="/play-profile" className="pt-item-row">
              <span className="pt-item-check"></span>
              <div className="pt-item-body">
                <div className="pt-item-name">{selectedDnaPick.display_name}</div>
                <div className="pt-item-meta">DNA Challenge</div>
              </div>
              <span className="pt-item-action">Go →</span>
            </a>
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
          <div className="pt-section-items pt-quest-cards">
            {dailyQuests.map(quest => renderQuestCard(quest))}
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
          <div className="pt-section-items pt-quest-cards">
            {weeklyQuests.map(quest => renderQuestCard(quest))}
          </div>
        </div>
      )}

      <button className="pt-edit-btn" onClick={editWeek}>
        Edit Week
      </button>
    </div>
  )
}
