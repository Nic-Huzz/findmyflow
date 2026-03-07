/**
 * PriorityOverlay.jsx
 *
 * Full-page overlay that replaces the old WeeklyPlanningFlow.
 * Shows at the start of each week when user has no priority picks.
 * Reuses existing Priority components: assessment → picker → done.
 *
 * Created: 2026-03-04
 */

import { useEffect } from 'react'
import usePriorityTab from '../hooks/usePriorityTab'
import PriorityMiniAssessment from './PriorityMiniAssessment'
import PriorityLayerCard from './PriorityLayerCard'
import PriorityWeekPicker from './PriorityWeekPicker'
import './PriorityTab.css'

export default function PriorityOverlay({ userId, stageProgress, onStageProgressUpdate, onComplete }) {
  const {
    currentState,
    priorityLayer,
    skills,
    dailyHealingQuests,
    weeklyHealingQuests,
    recommendations,
    confirmWeek,
    finishReassess,
    loading,
  } = usePriorityTab(userId, stageProgress)

  const handleConfirm = async (picks) => {
    await confirmWeek(picks)
    onComplete()
  }

  const handleAssessmentComplete = async () => {
    await onStageProgressUpdate?.()
    finishReassess()
  }

  // Race condition guard: if picks already exist, dismiss overlay after render
  useEffect(() => {
    if (currentState === 'quest_list') {
      onComplete()
    }
  }, [currentState, onComplete])

  if (loading || currentState === 'loading') {
    return (
      <div className="priority-tab priority-overlay">
        <div className="spinner" />
      </div>
    )
  }

  if (currentState === 'quest_list') return null

  return (
    <div className="priority-tab priority-overlay">
      <div className="priority-overlay-inner">
        <h2 className="priority-overlay-title">Plan Your Week</h2>
        <p className="priority-overlay-desc">Choose what to focus on this week</p>

        {currentState === 'assessment' && (
          <PriorityMiniAssessment userId={userId} onComplete={handleAssessmentComplete} />
        )}

        {currentState === 'picker' && (
          <>
            <PriorityLayerCard layer={priorityLayer} />
            <PriorityWeekPicker
              skills={skills}
              userId={userId}
              dailyHealingQuests={dailyHealingQuests}
              weeklyHealingQuests={weeklyHealingQuests}
              recommendations={recommendations}
              onConfirm={handleConfirm}
            />
          </>
        )}

        <button className="priority-overlay-skip" onClick={onComplete}>
          Skip for now
        </button>
      </div>
    </div>
  )
}
