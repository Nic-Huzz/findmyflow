/**
 * ChallengeStageTabs.jsx
 *
 * Displays the 6 universal stage tabs for the 7-day challenge.
 * Users can view quests for any stage but can only complete quests
 * from their current stage and previous stages.
 *
 * Features:
 * - All 6 stages always visible
 * - Current stage highlighted
 * - Completed stages shown with checkmark
 * - Future stages grayed out but visible
 * - Horizontal scrollable on mobile
 *
 * Created: Dec 2024
 * Part of project-based refactor (see docs/2024-12-20-major-refactor-plan.md)
 */

import { useState, useRef, useEffect } from 'react'
import { STAGE_CONFIG, getAllStages } from '../lib/stageConfig'
import './ChallengeStageTabs.css'

function ChallengeStageTabs({ currentStage, completedStages = [], activeTab, onTabChange }) {
  const tabsRef = useRef(null)
  const stages = getAllStages()

  // Auto-scroll to active tab on mount
  useEffect(() => {
    if (tabsRef.current && activeTab) {
      const activeTabEl = tabsRef.current.querySelector(`[data-stage="${activeTab}"]`)
      if (activeTabEl) {
        activeTabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [activeTab])

  const getTabState = (stageId) => {
    if (completedStages.includes(stageId)) return 'completed'
    if (stageId === currentStage) return 'current'
    if (stageId < currentStage) return 'available'
    return 'locked'
  }

  const handleTabClick = (stageId) => {
    // Allow clicking on current and previous stages only
    if (stageId <= currentStage) {
      onTabChange(stageId)
    }
  }

  return (
    <div className="stage-tabs-container">
      <div className="stage-tabs" ref={tabsRef}>
        {stages.map(stage => {
          const state = getTabState(stage.id)
          const isActive = activeTab === stage.id

          return (
            <button
              key={stage.id}
              data-stage={stage.id}
              className={`stage-tab ${state} ${isActive ? 'active' : ''}`}
              onClick={() => handleTabClick(stage.id)}
              disabled={state === 'locked'}
              style={{ '--stage-color': stage.color }}
            >
              <span className="tab-icon">{stage.icon}</span>
              <span className="tab-label">{stage.shortName}</span>
              {state === 'completed' && <span className="completed-check">✓</span>}
              {state === 'current' && <span className="current-dot" />}
            </button>
          )
        })}
      </div>

      {/* Progress Indicator */}
      <div className="progress-line">
        <div
          className="progress-fill"
          style={{ width: `${((currentStage - 1) / (stages.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  )
}

export default ChallengeStageTabs
