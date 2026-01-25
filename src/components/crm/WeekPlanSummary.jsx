// src/components/crm/WeekPlanSummary.jsx
// Screen 4: Week summary with task breakdown

import { PHASES } from '../../lib/crm/weeklyPlanningService'
import { FLOW_DIRECTIONS } from '../../lib/crm/reflectionService'
import './WeekPlanSummary.css'

export default function WeekPlanSummary({
  activePhases = [],
  tasks = [],
  flowDirection,
  onStartWeek,
  onBack
}) {
  // Group tasks by phase
  const tasksByPhase = activePhases.reduce((acc, phaseId) => {
    acc[phaseId] = tasks.filter(t => t.phase === phaseId)
    return acc
  }, {})

  // Total task count
  const totalTasks = tasks.reduce((sum, t) => sum + (t.count || 1), 0)

  // Flow info
  const flowInfo = flowDirection ? FLOW_DIRECTIONS[flowDirection] : null

  return (
    <div className="week-plan-summary">
      <div className="summary-header">
        <span className="summary-emoji">🎯</span>
        <h2 className="summary-title">Your Week is Planned!</h2>
      </div>

      {/* Active Phases */}
      <div className="active-phases-section">
        <h3 className="section-label">ACTIVE PHASES</h3>
        <div className="phase-pills">
          {activePhases.map(phaseId => {
            const phase = PHASES[phaseId]
            return (
              <span
                key={phaseId}
                className="phase-pill"
                style={{ '--phase-color': phase.color }}
              >
                {phase.icon} {phase.label}
              </span>
            )
          })}
        </div>
      </div>

      {/* Task Breakdown */}
      <div className="task-breakdown-section">
        <h3 className="section-label">TASK BREAKDOWN</h3>
        <div className="task-breakdown-card">
          {activePhases.map(phaseId => {
            const phase = PHASES[phaseId]
            const phaseTasks = tasksByPhase[phaseId] || []
            const phaseTaskCount = phaseTasks.reduce((sum, t) => sum + (t.count || 1), 0)

            if (phaseTaskCount === 0) return null

            return (
              <div key={phaseId} className="phase-breakdown">
                <div className="phase-breakdown-header" style={{ color: phase.color }}>
                  {phase.icon} {phase.label.toUpperCase()} ({phaseTaskCount} task{phaseTaskCount !== 1 ? 's' : ''})
                </div>
                <ul className="phase-task-list">
                  {phaseTasks.map(task => (
                    <li key={task.id}>
                      {task.title}
                      {task.count > 1 && <span className="task-multiplier"> (×{task.count})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
        <p className="total-tasks">{totalTasks} tasks total</p>
      </div>

      {/* Flow State */}
      {flowInfo && (
        <div className="flow-state-section">
          <h3 className="section-label">CURRENT FLOW STATE</h3>
          <div
            className="flow-state-display"
            style={{ '--direction-color': flowInfo.color }}
          >
            <span className="flow-emoji">{flowInfo.emoji}</span>
            <span className="flow-label">{flowInfo.label}</span>
            <span className="flow-desc">({flowInfo.description})</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="summary-actions">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
        )}
        <button className="start-week-btn" onClick={onStartWeek}>
          Start Week →
        </button>
      </div>
    </div>
  )
}
