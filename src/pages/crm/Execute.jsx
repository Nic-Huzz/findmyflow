/**
 * Execute - Weekly Task Management & Execution Tracking
 * Phase-based task system with gamification
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { useExecute } from '../../hooks/useExecute'
import { supabase } from '../../lib/supabaseClient'
import {
  getWeekStart,
  getTaskMenuByPhase,
  getQuickStats,
} from '../../lib/executeHelpers'
import {
  triggerConfetti,
  FloatingPointsContainer,
  MicroToast,
  LevelUpModal,
} from '../../components/Celebrations'
import WeeklyPlanningFlow, { useWeeklyPlanningPrompt } from '../../components/crm/WeeklyPlanningFlow'
import { getCurrentWeekPlan, PHASES as PHASE_DATA } from '../../lib/crm/weeklyPlanningService'
import './Execute.css'

// Phase configuration
const PHASES = [
  { id: 'build', label: 'Build', icon: '🛠️', color: '#3b82f6' },
  { id: 'launch', label: 'Launch', icon: '🚀', color: '#8b5cf6' },
  { id: 'deliver', label: 'Deliver', icon: '📦', color: '#22c55e' },
  { id: 'recap', label: 'Recap', icon: '📊', color: '#f59e0b' },
]

export default function Execute() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentProject, setCurrentProject] = useState(null)
  const [projects, setProjects] = useState([])
  const [activePhase, setActivePhase] = useState('build')
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [quickStats, setQuickStats] = useState(null)
  const [improvements, setImprovements] = useState([])
  const [showTaskMenu, setShowTaskMenu] = useState(false)

  // Weekly Planning
  const [showPlanningFlow, setShowPlanningFlow] = useState(false)
  const [weeklyPlan, setWeeklyPlan] = useState(null)
  const { shouldShow: shouldShowPlanning, checked: planningChecked } = useWeeklyPlanningPrompt()

  const {
    tasks,
    loading,
    loadData,
    completeTask,
    uncompleteTask,
    addTask,
    frameworks,
    frameworkProgress,
    showLevelUp,
    floatingPoints,
    toast,
    closeLevelUp,
    clearToast,
    removeFloatingPoints,
  } = useExecute(user?.id, currentProject?.id)

  // Toggle body class for bottom toolbar hiding when modal is open
  useEffect(() => {
    if (showTaskMenu) {
      document.body.classList.add('modal-active')
    } else {
      document.body.classList.remove('modal-active')
    }
    return () => document.body.classList.remove('modal-active')
  }, [showTaskMenu])

  // Load projects and stats
  useEffect(() => {
    if (user?.id) {
      loadProjects()
      loadQuickStats()
      loadImprovements()
      loadWeeklyPlan()
    }
  }, [user?.id])

  // Auto-show planning flow if needed (Sunday 3pm+ or Monday with no plan)
  useEffect(() => {
    if (planningChecked && shouldShowPlanning && !weeklyPlan) {
      setShowPlanningFlow(true)
    }
  }, [planningChecked, shouldShowPlanning, weeklyPlan])

  // Load tasks when project changes
  useEffect(() => {
    if (currentProject?.id) {
      loadData()
    }
  }, [currentProject?.id, loadData])

  async function loadProjects() {
    const { data } = await supabase
      .from('user_projects')
      .select('id, name, current_stage')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (data?.length > 0) {
      setProjects(data)
      // Restore last selected project
      const savedProjectId = localStorage.getItem('execute_current_project')
      const saved = data.find(p => p.id === savedProjectId)
      setCurrentProject(saved || data[0])
    }
  }

  async function loadQuickStats() {
    const stats = await getQuickStats(user.id)
    setQuickStats(stats)
  }

  async function loadImprovements() {
    const { data } = await supabase
      .from('improvements')
      .select('*')
      .eq('user_id', user.id)
      .eq('outcome_logged', false)
      .order('created_at', { ascending: false })
      .limit(5)

    setImprovements(data || [])
  }

  async function loadWeeklyPlan() {
    const plan = await getCurrentWeekPlan(user.id)
    setWeeklyPlan(plan)
  }

  function handlePlanComplete(plan) {
    setWeeklyPlan(plan)
    setShowPlanningFlow(false)
    loadQuickStats()
  }

  // Group manual tasks by phase (exclude framework tasks)
  const tasksByPhase = useMemo(() => {
    const grouped = {
      build: [],
      launch: [],
      deliver: [],
      recap: [],
    }

    tasks.forEach(task => {
      if (task.is_framework) return // Framework tasks rendered separately
      const phase = task.phase || 'build'
      if (grouped[phase]) {
        grouped[phase].push(task)
      }
    })

    return grouped
  }, [tasks])

  // Group frameworks by phase
  const frameworksByPhase = useMemo(() => {
    const grouped = { build: [], launch: [], deliver: [], recap: [] }
    frameworks.forEach(fw => {
      if (grouped[fw.phase]) {
        grouped[fw.phase].push(fw)
      }
    })
    return grouped
  }, [frameworks])

  // Calculate phase completion rates (manual + frameworks combined)
  const phaseStats = useMemo(() => {
    const stats = {}
    PHASES.forEach(phase => {
      const phaseTasks = tasksByPhase[phase.id] || []
      const phaseFws = frameworksByPhase[phase.id] || []
      const manualCompleted = phaseTasks.filter(t => t.completed).length
      const fwCompleted = phaseFws.filter(fw => frameworkProgress[fw.key]?.isComplete).length
      const completed = manualCompleted + fwCompleted
      const total = phaseTasks.length + phaseFws.length
      stats[phase.id] = {
        completed,
        total,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    })
    return stats
  }, [tasksByPhase, frameworksByPhase, frameworkProgress])

  // Week info
  const weekStart = getWeekStart()
  const weekDisplay = new Date(weekStart).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })

  function handleProjectChange(project) {
    setCurrentProject(project)
    localStorage.setItem('execute_current_project', project.id)
  }

  async function handleTaskClick(task, e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const position = {
      left: rect.right - 60,
      top: rect.top + rect.height / 2
    }

    if (task.completed) {
      await uncompleteTask(task.id)
    } else {
      await completeTask(task.id, task.phase, position)
      loadQuickStats() // Refresh stats
    }
  }

  async function handleAddTask(taskData = null) {
    const title = taskData?.title || newTaskTitle.trim()
    if (!title) return

    await addTask({
      title,
      phase: taskData?.phase || activePhase,
      category: taskData?.category || 'custom',
      points: taskData?.points || 10,
      scheduled_date: weekStart,
    })

    setNewTaskTitle('')
    setShowAddTask(false)
    setShowTaskMenu(false)
  }

  function handleAddFromMenu(task) {
    handleAddTask({
      title: task.title,
      phase: activePhase,
      category: task.category,
      points: task.points,
    })
  }

  const taskMenu = getTaskMenuByPhase()

  if (loading && !tasks.length) {
    return (
      <div className="execute-page">
        <div className="execute-toolbar">
          <button className="execute-toolbar-back" onClick={() => navigate('/crm/nurture')}>←</button>
          <h2 className="execute-toolbar-title">Execute</h2>
        </div>
        <div className="execute-loading">
          <div className="execute-spinner"></div>
          <p>Loading your week...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="execute-page">
      {/* Top Toolbar */}
      <div className="execute-toolbar">
        <button className="execute-toolbar-back" onClick={() => navigate('/crm')}>
          ←
        </button>
        <h2 className="execute-toolbar-title">Execute</h2>
      </div>

      {/* Dark Hero Stats Card */}
      <div className="execute-hero">
        <div className="execute-hero-week">Week of {weekDisplay}</div>
        <div className="execute-hero-stats">
          <div className="execute-hero-stat">
            <span className="execute-hero-value gold">{quickStats?.executionRate || 0}%</span>
            <span className="execute-hero-label">Execution</span>
          </div>
          <div className="execute-hero-divider"></div>
          <div className="execute-hero-stat">
            <span className="execute-hero-value">{quickStats?.tasksCompleted || 0}/{quickStats?.totalTasks || 0}</span>
            <span className="execute-hero-label">Tasks</span>
          </div>
          <div className="execute-hero-divider"></div>
          <div className="execute-hero-stat">
            <span className="execute-hero-value">{quickStats?.streak || 0}</span>
            <span className="execute-hero-label">Streak</span>
          </div>
        </div>
      </div>

      {/* Project Selector */}
      {projects.length > 1 && (
        <select
          className="execute-project-select"
          value={currentProject?.id || ''}
          onChange={(e) => {
            const project = projects.find(p => p.id === e.target.value)
            if (project) handleProjectChange(project)
          }}
        >
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}

      {/* Weekly Plan Banner */}
      {weeklyPlan && (
        <div className="weekly-plan-banner">
          <div className="plan-phases">
            {weeklyPlan.active_phases?.map(phaseId => {
              const phase = PHASE_DATA[phaseId]
              return phase ? (
                <span key={phaseId} className="plan-phase-pill" style={{ '--phase-color': phase.color }}>
                  {phase.icon} {phase.label}
                </span>
              ) : null
            })}
          </div>
          <div className="plan-info">
            <span>{weeklyPlan.tasks?.reduce((sum, t) => sum + (t.count || 1), 0) || 0} tasks planned</span>
            <button className="edit-plan-btn" onClick={() => setShowPlanningFlow(true)}>
              Edit Plan
            </button>
          </div>
        </div>
      )}

      {/* Plan Your Week CTA (if no plan) */}
      {!weeklyPlan && planningChecked && (
        <button className="plan-week-cta" onClick={() => setShowPlanningFlow(true)}>
          📋 Plan Your Week →
        </button>
      )}

      {/* Phase Tabs */}
      <div className="phase-tabs">
        {PHASES.map(phase => (
          <button
            key={phase.id}
            className={`phase-tab ${activePhase === phase.id ? 'active' : ''}`}
            onClick={() => setActivePhase(phase.id)}
            style={{ '--phase-color': phase.color }}
          >
            <span className="phase-icon">{phase.icon}</span>
            <span className="phase-label">{phase.label}</span>
            {phaseStats[phase.id]?.total > 0 && (
              <span className="phase-count">
                {phaseStats[phase.id].completed}/{phaseStats[phase.id].total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="task-list">
        <div className="task-list-header">
          <h2>{PHASES.find(p => p.id === activePhase)?.label} Tasks</h2>
          <button
            className="add-task-btn"
            onClick={() => setShowTaskMenu(true)}
          >
            + Add Task
          </button>
        </div>

        {/* Framework Tasks (auto-tracked progress bars) */}
        {frameworksByPhase[activePhase]?.length > 0 && (
          <div className="framework-tasks">
            {frameworksByPhase[activePhase].map(fw => {
              const progress = frameworkProgress[fw.key] || { current: 0, target: fw.target, isComplete: false }
              const pct = Math.min(100, Math.round((progress.current / progress.target) * 100))

              return (
                <div key={fw.key} className={`framework-task ${progress.isComplete ? 'done' : ''}`}>
                  <div className="framework-task-header">
                    <span className="framework-task-icon">{progress.isComplete ? '✓' : '⚡'}</span>
                    <span className="framework-task-title">{fw.title}</span>
                    <span className="framework-count">{progress.current}/{progress.target}</span>
                    {progress.isComplete ? (
                      <span className="framework-done-badge">Done</span>
                    ) : (
                      <span className="framework-points">{fw.points}pts</span>
                    )}
                  </div>
                  <div className="framework-progress-bar">
                    <div
                      className="framework-progress-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Manual Tasks (checkboxes) */}
        {tasksByPhase[activePhase]?.length === 0 && (frameworksByPhase[activePhase]?.length || 0) === 0 ? (
          <div className="empty-tasks">
            <p>No {activePhase} tasks this week</p>
            <button
              className="add-first-task"
              onClick={() => setShowTaskMenu(true)}
            >
              Add your first {activePhase} task
            </button>
          </div>
        ) : (
          <div className="tasks">
            {tasksByPhase[activePhase]?.map(task => (
              <div
                key={task.id}
                className={`task-item ${task.completed ? 'completed' : ''}`}
                onClick={(e) => handleTaskClick(task, e)}
              >
                <div className={`task-checkbox ${task.completed ? 'checked' : ''}`}>
                  {task.completed && '✓'}
                </div>
                <div className="task-content">
                  <span className="task-title">{task.title}</span>
                  <span className="task-meta">
                    {task.category} · {task.points || 10} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Improvements */}
      {improvements.length > 0 && (
        <div className="improvements-section">
          <h3>Pending Improvements</h3>
          <p className="improvements-hint">Log outcomes to earn bonus points!</p>
          <div className="improvements-list">
            {improvements.map(imp => (
              <div key={imp.id} className="improvement-item">
                <span className="improvement-type">{imp.improvement_type}</span>
                <span className="improvement-desc">{imp.description}</span>
                <button
                  className="log-outcome-btn"
                  onClick={() => navigate(`/crm/improvements/${imp.id}`)}
                >
                  Log Outcome
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showTaskMenu && (
        <div className="modal-overlay" onClick={() => setShowTaskMenu(false)}>
          <div className="add-task-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add {PHASES.find(p => p.id === activePhase)?.label} Task</h3>
              <button
                className="close-btn"
                onClick={() => setShowTaskMenu(false)}
              >
                ×
              </button>
            </div>

            {/* Quick Add */}
            <div className="quick-add">
              <input
                type="text"
                placeholder="Type a custom task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTaskTitle.trim()) {
                    handleAddTask()
                  }
                }}
                autoFocus
              />
              <button
                className="add-btn"
                onClick={() => handleAddTask()}
                disabled={!newTaskTitle.trim()}
              >
                Add
              </button>
            </div>

            <div className="divider">
              <span>or choose from menu</span>
            </div>

            {/* Task Menu */}
            <div className="task-menu">
              {taskMenu[activePhase]?.map((task, i) => (
                <button
                  key={i}
                  className="task-menu-item"
                  onClick={() => handleAddFromMenu(task)}
                >
                  <span className="menu-task-title">{task.title}</span>
                  <span className="menu-task-points">+{task.points} pts</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Celebrations */}
      <FloatingPointsContainer
        items={floatingPoints}
        onItemComplete={removeFloatingPoints}
      />

      {toast && (
        <MicroToast
          type={toast.type}
          onComplete={clearToast}
        />
      )}

      {showLevelUp && (
        <LevelUpModal
          level={showLevelUp}
          onClose={closeLevelUp}
        />
      )}

      {/* Weekly Planning Flow */}
      <WeeklyPlanningFlow
        isOpen={showPlanningFlow}
        onClose={() => setShowPlanningFlow(false)}
        onComplete={handlePlanComplete}
      />
    </div>
  )
}
