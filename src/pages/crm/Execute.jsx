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

  const {
    tasks,
    loading,
    loadData,
    completeTask,
    uncompleteTask,
    addTask,
    showLevelUp,
    floatingPoints,
    toast,
    closeLevelUp,
    clearToast,
    removeFloatingPoints,
  } = useExecute(user?.id, currentProject?.id)

  // Load projects and stats
  useEffect(() => {
    if (user?.id) {
      loadProjects()
      loadQuickStats()
      loadImprovements()
    }
  }, [user?.id])

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

  // Group tasks by phase
  const tasksByPhase = useMemo(() => {
    const grouped = {
      build: [],
      launch: [],
      deliver: [],
      recap: [],
    }

    tasks.forEach(task => {
      const phase = task.phase || 'build'
      if (grouped[phase]) {
        grouped[phase].push(task)
      }
    })

    return grouped
  }, [tasks])

  // Calculate phase completion rates
  const phaseStats = useMemo(() => {
    const stats = {}
    PHASES.forEach(phase => {
      const phaseTasks = tasksByPhase[phase.id] || []
      const completed = phaseTasks.filter(t => t.completed).length
      const total = phaseTasks.length
      stats[phase.id] = {
        completed,
        total,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    })
    return stats
  }, [tasksByPhase])

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
        <div className="execute-loading">
          <div className="execute-spinner"></div>
          <p>Loading your week...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="execute-page">
      {/* Header */}
      <header className="execute-header">
        <div className="breadcrumb">
          <button onClick={() => navigate('/crm')}>Home</button>
          <span>→</span>
          <span>Execute</span>
        </div>
        <h1>🚀 Execute</h1>
        <p className="week-label">Week of {weekDisplay}</p>
        {projects.length > 1 && (
          <select
            className="project-select"
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
      </header>

      {/* Stats Bar */}
      <div className="execute-stats">
        <div className="stat-item">
          <span className="stat-icon">🎯</span>
          <div className="stat-content">
            <span className="stat-value">{quickStats?.executionRate || 0}%</span>
            <span className="stat-label">Execution</span>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-icon">✅</span>
          <div className="stat-content">
            <span className="stat-value">{quickStats?.tasksCompleted || 0}/{quickStats?.totalTasks || 0}</span>
            <span className="stat-label">Tasks</span>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🔥</span>
          <div className="stat-content">
            <span className="stat-value">{quickStats?.streak || 0}</span>
            <span className="stat-label">Day Streak</span>
          </div>
        </div>
      </div>

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

        {tasksByPhase[activePhase]?.length === 0 ? (
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
    </div>
  )
}
