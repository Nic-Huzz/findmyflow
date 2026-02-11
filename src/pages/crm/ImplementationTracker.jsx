/**
 * ImplementationTracker - Track progress on offer implementations
 *
 * Part of Sales Tower Tier 2.
 * Shows all user implementations with progress tracking and checkable tasks.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  fetchImplementations,
  getImplementationWithProgress,
  toggleTaskCompletion,
  deleteImplementation,
  isTaskCompleted,
  IMPLEMENTATION_STATUS,
  CATEGORY_INFO
} from '../../lib/crm/implementationService'
import { hasGenerationTemplate } from '../../lib/crm/implementationTemplates'
import { ProjectSwitcher, ZarloImplementationCoach } from '../../components/crm'
import './ImplementationTracker.css'

export default function ImplementationTracker() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [implementations, setImplementations] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [expandedImpl, setExpandedImpl] = useState(null)
  const [expandedPhases, setExpandedPhases] = useState({})
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState(false)
  const [celebration, setCelebration] = useState(null)
  const [currentProject, setCurrentProject] = useState(() => {
    const saved = localStorage.getItem('crm_current_project')
    return saved ? JSON.parse(saved) : null
  })

  // Coach state
  const [coachOpen, setCoachOpen] = useState(false)
  const [coachTask, setCoachTask] = useState(null)
  const [coachPhaseIndex, setCoachPhaseIndex] = useState(null)
  const [coachTaskIndex, setCoachTaskIndex] = useState(null)

  // Check for implementation ID in URL params
  useEffect(() => {
    const implId = searchParams.get('id')
    if (implId) {
      setExpandedId(implId)
    }
  }, [searchParams])

  // Persist project selection
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('crm_current_project', JSON.stringify(currentProject))
    }
  }, [currentProject])

  // Load implementations
  useEffect(() => {
    if (user?.id) {
      loadImplementations()
    }
  }, [user?.id, currentProject?.id])

  // Load expanded implementation details
  useEffect(() => {
    if (expandedId && implementations.length > 0) {
      loadExpandedImplementation()
    } else {
      setExpandedImpl(null)
    }
  }, [expandedId, implementations])

  async function loadImplementations() {
    setLoading(true)
    try {
      const { data, error } = await fetchImplementations(user.id, currentProject?.id)
      if (error) throw error
      setImplementations(data || [])
    } catch (err) {
      console.error('Error loading implementations:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadExpandedImplementation() {
    const impl = implementations.find(i => i.id === expandedId)
    if (!impl) {
      setExpandedImpl(null)
      return
    }

    try {
      const withProgress = await getImplementationWithProgress(impl)
      setExpandedImpl(withProgress)
      // Auto-expand first incomplete phase
      if (withProgress.phaseProgress) {
        const firstIncomplete = withProgress.phaseProgress.findIndex(p => !p.isComplete)
        if (firstIncomplete >= 0) {
          setExpandedPhases({ [firstIncomplete]: true })
        }
      }
    } catch (err) {
      console.error('Error loading implementation details:', err)
    }
  }

  const handleToggleTask = useCallback(async (phaseIndex, taskIndex) => {
    if (!expandedImpl || updating) return

    setUpdating(true)
    try {
      const { data, phaseCompleted, allCompleted, error } = await toggleTaskCompletion(
        expandedImpl.id,
        user.id,
        phaseIndex,
        taskIndex
      )

      if (error) throw error

      // Update local state
      const updatedImpl = { ...expandedImpl, ...data }
      const withProgress = await getImplementationWithProgress(updatedImpl)
      setExpandedImpl(withProgress)

      // Update list
      setImplementations(prev =>
        prev.map(i => i.id === expandedImpl.id ? data : i)
      )

      // Trigger celebration
      if (allCompleted) {
        setCelebration({ type: 'complete', name: expandedImpl.checklist?.name })
      } else if (phaseCompleted) {
        const phaseName = expandedImpl.checklist?.implementation_checklist?.[phaseIndex]?.phase
        setCelebration({ type: 'phase', name: phaseName })
      }
    } catch (err) {
      console.error('Error toggling task:', err)
    } finally {
      setUpdating(false)
    }
  }, [expandedImpl, user?.id, updating])

  const handleDelete = async (implId) => {
    if (!confirm('Are you sure you want to delete this implementation? Progress will be lost.')) {
      return
    }

    try {
      const { error } = await deleteImplementation(implId, user.id)
      if (error) throw error

      setImplementations(prev => prev.filter(i => i.id !== implId))
      if (expandedId === implId) {
        setExpandedId(null)
      }
    } catch (err) {
      console.error('Error deleting implementation:', err)
    }
  }

  const togglePhase = (phaseIndex) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseIndex]: !prev[phaseIndex]
    }))
  }

  const openCoach = (task, phaseIndex, taskIndex) => {
    setCoachTask(task)
    setCoachPhaseIndex(phaseIndex)
    setCoachTaskIndex(taskIndex)
    setCoachOpen(true)
  }

  const closeCoach = () => {
    setCoachOpen(false)
    setCoachTask(null)
    setCoachPhaseIndex(null)
    setCoachTaskIndex(null)
  }

  const handleCoachComplete = async () => {
    // Mark the task as complete when coach says so
    if (coachPhaseIndex !== null && coachTaskIndex !== null) {
      await handleToggleTask(coachPhaseIndex, coachTaskIndex)
    }
    closeCoach()
  }

  const filteredImplementations = filter === 'all'
    ? implementations
    : implementations.filter(i => i.category === filter)

  const getProgressPercentage = (impl) => {
    if (!impl.total_tasks || impl.total_tasks === 0) return 0
    return Math.round(((impl.completed_tasks?.length || 0) / impl.total_tasks) * 100)
  }

  // Clear celebration after animation
  useEffect(() => {
    if (celebration) {
      const timer = setTimeout(() => setCelebration(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [celebration])

  if (loading) {
    return (
      <div className="implementation-tracker">
        <div className="impl-toolbar">
          <button className="impl-toolbar-back" onClick={() => navigate('/crm/tools')}>←</button>
          <h2 className="impl-toolbar-title">Implementations</h2>
        </div>
        <div className="impl-project-bar">
          <ProjectSwitcher
            userId={user?.id}
            currentProject={currentProject}
            onProjectChange={setCurrentProject}
          />
        </div>
        <div className="impl-loading">
          <div className="impl-spinner"></div>
          <p>Loading implementations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="implementation-tracker">
      {/* Top Toolbar */}
      <div className="impl-toolbar">
        <button className="impl-toolbar-back" onClick={() => navigate('/crm/tools')}>
          ←
        </button>
        <h2 className="impl-toolbar-title">Implementations</h2>
      </div>

      {/* Project Switcher */}
      <div className="impl-project-bar">
        <ProjectSwitcher
          userId={user?.id}
          currentProject={currentProject}
          onProjectChange={setCurrentProject}
        />
      </div>

      {/* Celebration Overlay */}
      {celebration && (
        <div className={`celebration-overlay ${celebration.type}`}>
          <div className="celebration-content">
            {celebration.type === 'complete' ? (
              <>
                <span className="celebration-icon">🎉</span>
                <h2>Implementation Complete!</h2>
                <p>You've finished implementing {celebration.name}</p>
              </>
            ) : (
              <>
                <span className="celebration-icon">✨</span>
                <h2>Phase Complete!</h2>
                <p>You've completed: {celebration.name}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <div className="impl-filters">
        <button
          className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({implementations.length})
        </button>
        {Object.entries(CATEGORY_INFO).map(([key, info]) => {
          const count = implementations.filter(i => i.category === key).length
          return (
            <button
              key={key}
              className={`filter-chip ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {info.icon} {info.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredImplementations.length === 0 && (
        <div className="impl-empty">
          <span className="empty-icon">📋</span>
          <h3>No implementations yet</h3>
          <p>Complete a Money Model flow to get your first implementation checklist</p>
          <button
            className="impl-cta-btn"
            onClick={() => navigate('/money-model-guide')}
          >
            Explore Money Models
          </button>
        </div>
      )}

      {/* Implementation List */}
      <div className="impl-list">
        {filteredImplementations.map(impl => {
          const progress = getProgressPercentage(impl)
          const isExpanded = expandedId === impl.id
          const categoryInfo = CATEGORY_INFO[impl.category]
          const statusInfo = IMPLEMENTATION_STATUS[impl.status]

          return (
            <div
              key={impl.id}
              className={`impl-card ${isExpanded ? 'expanded' : ''}`}
            >
              {/* Card Header - Always Visible */}
              <button
                className="impl-card-header"
                onClick={() => setExpandedId(isExpanded ? null : impl.id)}
              >
                <div className="impl-card-icon">
                  {categoryInfo?.icon || '📋'}
                </div>
                <div className="impl-card-info">
                  <div className="impl-card-title">
                    {impl.offer_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <div className="impl-card-meta">
                    <span
                      className="impl-category-badge"
                      style={{ backgroundColor: categoryInfo?.color + '20', color: categoryInfo?.color }}
                    >
                      {categoryInfo?.label}
                    </span>
                    <span
                      className="impl-status-badge"
                      style={{ backgroundColor: statusInfo?.color + '20', color: statusInfo?.color }}
                    >
                      {statusInfo?.label}
                    </span>
                  </div>
                </div>
                <div className="impl-card-progress">
                  <div className="progress-ring">
                    <svg viewBox="0 0 36 36">
                      <path
                        className="progress-ring-bg"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="progress-ring-fill"
                        strokeDasharray={`${progress}, 100`}
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="progress-text">{progress}%</span>
                  </div>
                </div>
                <span className="impl-card-arrow">
                  {isExpanded ? '▼' : '▶'}
                </span>
              </button>

              {/* Expanded Content */}
              {isExpanded && expandedImpl && (
                <div className="impl-card-body">
                  {/* Progress Bar */}
                  <div className="impl-progress-section">
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${expandedImpl.progress?.percentage || 0}%` }}
                      ></div>
                    </div>
                    <div className="progress-stats">
                      <span>{expandedImpl.progress?.completed || 0} of {expandedImpl.progress?.total || 0} tasks</span>
                      {impl.started_at && (
                        <span>Started {new Date(impl.started_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Target Metrics */}
                  {expandedImpl.checklist?.target_metrics && (
                    <div className="impl-metrics">
                      <h4>Target Metrics</h4>
                      <div className="metrics-grid">
                        {Object.entries(expandedImpl.checklist.target_metrics).map(([key, value]) => (
                          <div key={key} className="metric-item">
                            <span className="metric-label">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <span className="metric-value">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hormozi Principle */}
                  {expandedImpl.checklist?.hormozi_principle && (
                    <div className="impl-principle">
                      <span className="principle-icon">💡</span>
                      <p>"{expandedImpl.checklist.hormozi_principle}"</p>
                    </div>
                  )}

                  {/* Phases */}
                  <div className="impl-phases">
                    {expandedImpl.phaseProgress?.map((phase, phaseIndex) => {
                      const phaseData = expandedImpl.checklist?.implementation_checklist?.[phaseIndex]
                      const isPhaseExpanded = expandedPhases[phaseIndex]

                      return (
                        <div key={phaseIndex} className={`impl-phase ${phase.isComplete ? 'complete' : ''}`}>
                          <button
                            className={`phase-header ${isPhaseExpanded ? 'expanded' : ''}`}
                            onClick={() => togglePhase(phaseIndex)}
                          >
                            <span className={`phase-status ${phase.isComplete ? 'complete' : ''}`}>
                              {phase.isComplete ? '✓' : phaseIndex + 1}
                            </span>
                            <span className="phase-name">{phase.phase}</span>
                            <span className="phase-progress">
                              {phase.completed}/{phase.total}
                            </span>
                            <span className="phase-arrow">{isPhaseExpanded ? '▼' : '▶'}</span>
                          </button>

                          {isPhaseExpanded && phaseData?.tasks && (
                            <div className="phase-tasks">
                              {phaseData.tasks.map((task, taskIndex) => {
                                const completed = isTaskCompleted(
                                  expandedImpl.completed_tasks,
                                  phaseIndex,
                                  taskIndex
                                )
                                const hasAI = hasGenerationTemplate(task.task, expandedImpl.category)

                                return (
                                  <div key={taskIndex} className={`task-item ${completed ? 'completed' : ''}`}>
                                    <button
                                      className={`task-checkbox ${completed ? 'checked' : ''}`}
                                      onClick={() => handleToggleTask(phaseIndex, taskIndex)}
                                      disabled={updating}
                                    >
                                      {completed ? '✓' : ''}
                                    </button>
                                    <div className="task-content">
                                      <span className="task-title">{task.task}</span>
                                      {task.description && (
                                        <p className="task-description">{task.description}</p>
                                      )}
                                    </div>
                                    {!completed && (
                                      <button
                                        className={`task-ai-btn ${hasAI ? 'has-ai' : ''}`}
                                        onClick={() => openCoach(task, phaseIndex, taskIndex)}
                                        title={hasAI ? 'Get AI help with this task' : 'Get guidance for this task'}
                                      >
                                        {hasAI ? '🤖' : '💡'}
                                      </button>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Actions */}
                  <div className="impl-actions">
                    <button
                      className="impl-action-btn danger"
                      onClick={() => handleDelete(impl.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Start New CTA */}
      {implementations.length > 0 && (
        <div className="impl-footer">
          <button
            className="impl-cta-btn secondary"
            onClick={() => navigate('/money-model-guide')}
          >
            + Start New Implementation
          </button>
        </div>
      )}

      {/* AI Implementation Coach */}
      <ZarloImplementationCoach
        isOpen={coachOpen}
        onClose={closeCoach}
        task={coachTask}
        category={expandedImpl?.category}
        userId={user?.id}
        onComplete={handleCoachComplete}
      />
    </div>
  )
}
