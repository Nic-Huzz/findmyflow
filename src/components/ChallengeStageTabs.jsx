/**
 * ChallengeStageTabs.jsx
 *
 * Displays the 9 universal stage tabs for the 7-day challenge.
 * Stage 0 (Flow Finder) is user-level and always accessible.
 * Stages 1-7 are project-level progression stages.
 * Stage 8 (Tracking) is always accessible.
 *
 * Features:
 * - All 9 stages always visible (0 = Flow Finder, 1-7 = project stages, 8 = Tracking)
 * - Flow Finder (stage 0) and Tracking (stage 8) always accessible regardless of project stage
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

function ChallengeStageTabs({ currentStage, completedStages = [], activeTab, onTabChange, flowFinderComplete = false }) {
  const tabsRef = useRef(null)
  const stages = getAllStages()

  // Auto-scroll to active tab on mount
  useEffect(() => {
    if (tabsRef.current && activeTab !== undefined) {
      const activeTabEl = tabsRef.current.querySelector(`[data-stage="${activeTab}"]`)
      if (activeTabEl) {
        activeTabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [activeTab])

  const getTabState = (stageId, stageConfig) => {
    // Check for temporarily locked stages (used during testing)
    if (stageConfig?.temporarilyLocked) {
      return 'locked'
    }
    // Flow Finder (stage 0) - user-level, always accessible
    if (stageConfig?.alwaysAccessible) {
      // Flow Finder uses its own completion status
      if (stageId === 0 && flowFinderComplete) return 'completed'
      // Tracking (stage 8) and other always-accessible stages are always available
      return 'available'
    }
    // Regular project stages
    if (completedStages.includes(stageId)) return 'completed'
    if (stageId === currentStage) return 'current'
    if (stageId < currentStage) return 'available'
    return 'locked'
  }

  const handleTabClick = (stageId, stageConfig) => {
    // Check for temporarily locked stages (used during testing)
    if (stageConfig?.temporarilyLocked) {
      return // Don't allow clicks on locked stages
    }
    // Flow Finder is always clickable
    if (stageConfig?.alwaysAccessible) {
      onTabChange(stageId)
      return
    }
    // Allow clicking on current and previous stages only
    if (stageId <= currentStage) {
      onTabChange(stageId)
    }
  }

  // Calculate progress: stage 0 doesn't count toward project progress
  const projectStages = stages.filter(s => !s.alwaysAccessible)
  const progressPercent = currentStage >= 1
    ? ((currentStage - 1) / (projectStages.length - 1)) * 100
    : 0

  return (
    <div className="stage-tabs-container">
      <div className="stage-tabs" ref={tabsRef}>
        {stages.map(stage => {
          const state = getTabState(stage.id, stage)
          const isActive = activeTab === stage.id

          // Apply stage color directly when active for better browser support
          const activeStyles = isActive ? {
            background: stage.color,
            borderColor: stage.color,
            color: 'white'
          } : {}

          return (
            <button
              key={stage.id}
              data-stage={stage.id}
              className={`stage-tab ${state} ${isActive ? 'active' : ''} ${stage.alwaysAccessible ? 'always-accessible' : ''}`}
              onClick={() => handleTabClick(stage.id, stage)}
              disabled={state === 'locked'}
              style={{ '--stage-color': stage.color, ...activeStyles }}
            >
              <span className="tab-icon">{stage.icon}</span>
              <span className="tab-label">{stage.shortName}</span>
              {state === 'completed' && <span className="completed-check">✓</span>}
            </button>
          )
        })}
      </div>

      {/* Progress Indicator - only for project stages (1-7) */}
      <div className="progress-line">
        <div
          className="progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}

export default ChallengeStageTabs
