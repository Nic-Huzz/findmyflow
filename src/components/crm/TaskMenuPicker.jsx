// src/components/crm/TaskMenuPicker.jsx
// Screen 3: Task selection from phase-based menu

import { useState, useEffect } from 'react'
import { getTaskMenuByPhase, PHASES } from '../../lib/crm/weeklyPlanningService'
import './TaskMenuPicker.css'

export default function TaskMenuPicker({
  activePhases = [],
  value = [],
  onChange,
  onContinue,
  onBack,
  lastWeekTaskCount = null
}) {
  const [tasks, setTasks] = useState(value)
  const [customTaskText, setCustomTaskText] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customTaskPhase, setCustomTaskPhase] = useState(null)

  const taskMenu = getTaskMenuByPhase()

  useEffect(() => {
    setTasks(value)
  }, [value])

  const addTask = (task, phase) => {
    const existingIndex = tasks.findIndex(t => t.id === task.id)
    let newTasks

    if (existingIndex >= 0) {
      // Increment count
      newTasks = tasks.map((t, i) =>
        i === existingIndex ? { ...t, count: (t.count || 1) + 1 } : t
      )
    } else {
      // Add new task
      newTasks = [...tasks, { ...task, phase, count: 1 }]
    }

    setTasks(newTasks)
    onChange?.(newTasks)
  }

  const removeTask = (taskId) => {
    const existingIndex = tasks.findIndex(t => t.id === taskId)
    if (existingIndex < 0) return

    const task = tasks[existingIndex]
    let newTasks

    if (task.count > 1) {
      // Decrement count
      newTasks = tasks.map((t, i) =>
        i === existingIndex ? { ...t, count: t.count - 1 } : t
      )
    } else {
      // Remove task
      newTasks = tasks.filter(t => t.id !== taskId)
    }

    setTasks(newTasks)
    onChange?.(newTasks)
  }

  const getTaskCount = (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    return task?.count || 0
  }

  const handleAddCustomTask = () => {
    if (!customTaskText.trim() || !customTaskPhase) return

    const customTask = {
      id: `custom-${Date.now()}`,
      title: customTaskText.trim(),
      phase: customTaskPhase,
      count: 1,
      isCustom: true
    }

    const newTasks = [...tasks, customTask]
    setTasks(newTasks)
    onChange?.(newTasks)
    setCustomTaskText('')
    setShowCustomInput(false)
    setCustomTaskPhase(null)
  }

  const totalTaskCount = tasks.reduce((sum, t) => sum + (t.count || 1), 0)

  const handleContinue = () => {
    onContinue(tasks)
  }

  return (
    <div className="task-menu-picker">
      <div className="picker-header">
        <h2 className="picker-title">Pick your tasks for the week</h2>
        {lastWeekTaskCount && (
          <p className="last-week-hint">
            💡 Last week you completed {lastWeekTaskCount} tasks. Nice consistency!
          </p>
        )}
      </div>

      <div className="task-lists">
        {activePhases.map(phaseId => {
          const phase = PHASES[phaseId]
          const phaseTasks = taskMenu[phaseId] || []

          return (
            <div key={phaseId} className="phase-task-list">
              <h3 className="phase-list-title" style={{ color: phase.color }}>
                {phase.icon} {phase.label.toUpperCase()} TASKS
              </h3>

              <div className="task-options">
                {phaseTasks.map(task => {
                  const count = getTaskCount(task.id)
                  return (
                    <div key={task.id} className="task-option">
                      <button
                        className="add-task-btn"
                        onClick={() => addTask(task, phaseId)}
                      >
                        +
                      </button>
                      <span className="task-title">{task.title}</span>
                      {count > 0 && (
                        <div className="task-count-controls">
                          <button
                            className="remove-task-btn"
                            onClick={() => removeTask(task.id)}
                          >
                            −
                          </button>
                          <span className="task-count">{count}×</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Custom Task */}
      {!showCustomInput ? (
        <button
          className="add-custom-btn"
          onClick={() => setShowCustomInput(true)}
        >
          + Add custom task
        </button>
      ) : (
        <div className="custom-task-input">
          <input
            type="text"
            value={customTaskText}
            onChange={(e) => setCustomTaskText(e.target.value)}
            placeholder="Enter custom task..."
            autoFocus
          />
          <select
            value={customTaskPhase || ''}
            onChange={(e) => setCustomTaskPhase(e.target.value)}
          >
            <option value="">Select phase...</option>
            {activePhases.map(phaseId => (
              <option key={phaseId} value={phaseId}>
                {PHASES[phaseId].icon} {PHASES[phaseId].label}
              </option>
            ))}
          </select>
          <div className="custom-task-actions">
            <button
              className="cancel-custom-btn"
              onClick={() => {
                setShowCustomInput(false)
                setCustomTaskText('')
                setCustomTaskPhase(null)
              }}
            >
              Cancel
            </button>
            <button
              className="save-custom-btn"
              onClick={handleAddCustomTask}
              disabled={!customTaskText.trim() || !customTaskPhase}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Selected Summary */}
      <div className="selected-summary">
        <span className="summary-label">Selected:</span>
        <span className="summary-count">{totalTaskCount} tasks</span>
      </div>

      {/* Actions */}
      <div className="picker-actions">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
        )}
        <button
          className="continue-btn"
          onClick={handleContinue}
          disabled={totalTaskCount === 0}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
