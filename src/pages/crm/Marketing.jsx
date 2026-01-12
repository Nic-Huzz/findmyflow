/**
 * CRM Marketing - Quest Board
 * Weekly marketing tasks with engagement tracking
 * Now integrated with AI Content Copilot Strategy
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  fetchWeeklyTasks,
  checkWeeklyTasksExist,
  generateWeeklyTasks,
  toggleTaskCompletion,
  updateTaskEngagement,
  getWeekInfo,
  getWeekStartDate,
  getTodayInfo,
  addPoints,
  updateStreak,
} from '../../lib/crm'
import { hasContentStrategy, fetchContentStrategy } from '../../lib/contentStrategy'
import { ContentGenerator, WeeklyPlanningSession, StoryBank } from '../../components/crm'
import ContentStrategyFlow from '../../flows/ContentStrategyFlow'
import './Marketing.css'

// Map task types to content generator types
const TASK_TO_CONTENT_TYPE = {
  'Transformation Story': 'transformation_story',
  'Educational Post': 'educational',
  'Pain Point Post': 'pain_agitation',
  'Social Proof': 'social_proof',
  'Offer Teaser': 'offer_teaser',
  'Behind the Scenes': 'transformation_story',
  'Value Thread': 'educational',
  'Engagement Post': 'pain_agitation'
}

// Onboarding stages for first-time users
const ONBOARDING_STAGES = {
  CHECKING: 'checking',
  EXPLAINER: 'explainer',
  TIME_CHECK: 'time_check',
  STRATEGY_FLOW: 'strategy_flow',
  WEEKLY_PLANNING: 'weekly_planning',
  COMPLETE: 'complete'
}

// Check if user should see weekly planning (start of new week)
function shouldShowWeeklyPlanning() {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday

  // Show on Monday or if it's early in the week (Mon-Wed)
  // and user hasn't dismissed it this week
  const isEarlyWeek = dayOfWeek >= 1 && dayOfWeek <= 3

  // Check localStorage for dismissal
  const lastDismissed = localStorage.getItem('weekly_planning_dismissed')
  if (lastDismissed) {
    const dismissedDate = new Date(lastDismissed)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + 1) // Get Monday
    weekStart.setHours(0, 0, 0, 0)

    // If dismissed this week, don't show again
    if (dismissedDate >= weekStart) {
      return false
    }
  }

  return isEarlyWeek
}

export default function Marketing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [engagementModal, setEngagementModal] = useState(null)
  const [engagement, setEngagement] = useState({ likes: 0, comments: 0, shares: 0, dms: 0 })
  const [weekOffset, setWeekOffset] = useState(0)
  const [quickGenerateTask, setQuickGenerateTask] = useState(null)
  const [showStrategyFlow, setShowStrategyFlow] = useState(false)
  const [showStoryBank, setShowStoryBank] = useState(false)
  const [strategy, setStrategy] = useState(null)
  const [onboardingStage, setOnboardingStage] = useState(ONBOARDING_STAGES.CHECKING)

  const weekInfo = useMemo(() => getWeekInfo(weekOffset), [weekOffset])
  const todayInfo = useMemo(() => getTodayInfo(), [])

  useEffect(() => {
    if (user?.id) {
      checkAndLoadStrategy()
    }
  }, [user?.id])

  useEffect(() => {
    // Only load tasks after we've checked strategy
    if (user?.id && strategy !== null) {
      loadTasks()
    }
  }, [user?.id, weekOffset, strategy])

  async function checkAndLoadStrategy() {
    try {
      const userStrategy = await fetchContentStrategy(user.id)
      if (userStrategy) {
        setStrategy(userStrategy)
        // Check if returning user should see weekly planning
        if (shouldShowWeeklyPlanning()) {
          setOnboardingStage(ONBOARDING_STAGES.WEEKLY_PLANNING)
        } else {
          setOnboardingStage(ONBOARDING_STAGES.COMPLETE)
        }
      } else {
        // No strategy found - show explainer first (like Money Models pattern)
        setStrategy(false) // Mark as checked but not found
        setOnboardingStage(ONBOARDING_STAGES.EXPLAINER)
      }
    } catch (err) {
      console.error('Error checking strategy:', err)
      setStrategy(false)
      setOnboardingStage(ONBOARDING_STAGES.EXPLAINER)
    }
  }

  function handleStrategyComplete(newStrategy) {
    setStrategy(newStrategy)
    setShowStrategyFlow(false)
    setOnboardingStage(ONBOARDING_STAGES.COMPLETE)
    // Reload tasks with new strategy
    loadTasks()
  }

  // Skip strategy setup - go directly to task board
  function handleSkipStrategy() {
    setOnboardingStage(ONBOARDING_STAGES.COMPLETE)
    // Allow loading tasks even without strategy (user can single-generate)
    loadTasks()
  }

  // Weekly planning completed - transition to main view
  function handleWeeklyPlanningComplete() {
    setOnboardingStage(ONBOARDING_STAGES.COMPLETE)
    // Reload tasks to get freshly generated tasks
    loadTasks()
  }

  // User skips weekly planning - don't show again this week
  function handleWeeklyPlanningSkip() {
    localStorage.setItem('weekly_planning_dismissed', new Date().toISOString())
    setOnboardingStage(ONBOARDING_STAGES.COMPLETE)
  }

  async function loadTasks() {
    setLoading(true)
    try {
      const weekStartDate = getWeekStartDate(weekOffset)

      // Check if tasks exist for this week
      const exists = await checkWeeklyTasksExist(user.id, weekStartDate)

      if (!exists) {
        // Generate tasks for the week
        await generateWeeklyTasks(user.id, null, weekStartDate)
      }

      // Fetch the tasks
      const result = await fetchWeeklyTasks(user.id, weekStartDate)
      if (result.data) {
        setTasks(result.data)
        // Default to today if it's a weekday and current week
        if (weekInfo.isCurrentWeek && todayInfo.isWeekday) {
          setSelectedDay(todayInfo.dayName)
        } else {
          setSelectedDay('Monday')
        }
      }
    } catch (err) {
      console.error('Error loading tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleWeekChange(direction) {
    // Limit to 4 weeks in the past and no future weeks
    const newOffset = weekOffset + direction
    if (newOffset <= 0 && newOffset >= -4) {
      setWeekOffset(newOffset)
    }
  }

  const dayTasks = useMemo(() => {
    if (!selectedDay) return []
    return tasks.filter(t => t.day_of_week === selectedDay)
  }, [tasks, selectedDay])

  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.completed).length
    const total = tasks.length
    const points = tasks.filter(t => t.completed).reduce((sum, t) => sum + (t.points_value || 0), 0)
    return { completed, total, points, rate: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }, [tasks])

  async function handleToggleTask(task) {
    const newCompleted = !task.completed
    const result = await toggleTaskCompletion(task.id, newCompleted)

    if (result.data) {
      // Update local state
      setTasks(prev => prev.map(t => t.id === task.id ? result.data : t))

      // Award points and update streak if completing
      if (newCompleted && task.points_value > 0) {
        await addPoints(user.id, task.points_value)
        await updateStreak(user.id)
      }
    }
  }

  function openEngagementModal(task) {
    setEngagementModal(task)
    setEngagement({
      likes: task.engagement_likes || 0,
      comments: task.engagement_comments || 0,
      shares: task.engagement_shares || 0,
      dms: task.engagement_dms || 0,
    })
  }

  async function saveEngagement() {
    if (!engagementModal) return

    const result = await updateTaskEngagement(engagementModal.id, engagement)
    if (result.data) {
      setTasks(prev => prev.map(t => t.id === engagementModal.id ? result.data : t))
      setEngagementModal(null)
    }
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  // ONBOARDING: Explainer Stage (like Money Models pattern)
  if (onboardingStage === ONBOARDING_STAGES.EXPLAINER) {
    return (
      <div className="crm-marketing">
        <div className="crm-onboarding">
          <div className="onboarding-content">
            <div className="onboarding-icon">🎯</div>
            <h1>Content Marketing Strategy</h1>
            <p className="onboarding-subtitle">
              Let AI plan your weekly content based on your goals
            </p>

            <div className="onboarding-benefits">
              <div className="benefit-item">
                <span className="benefit-icon">📅</span>
                <span>Weekly content calendar auto-generated</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">✍️</span>
                <span>AI writes posts in your voice</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">📊</span>
                <span>Track what works, improve over time</span>
              </div>
            </div>

            <button
              className="crm-primary-btn"
              onClick={() => setOnboardingStage(ONBOARDING_STAGES.TIME_CHECK)}
            >
              Set Up My Strategy
            </button>
            <button
              className="crm-secondary-btn"
              onClick={handleSkipStrategy}
            >
              Skip for Now
            </button>
            <p className="onboarding-skip-note">
              You can still generate individual posts without a strategy
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ONBOARDING: Time Check Stage
  if (onboardingStage === ONBOARDING_STAGES.TIME_CHECK) {
    return (
      <div className="crm-marketing">
        <div className="crm-onboarding">
          <div className="onboarding-content">
            <div className="onboarding-icon">⏱️</div>
            <h1>Ready to Set Up?</h1>
            <p className="onboarding-subtitle">
              <strong>This takes about 5 minutes</strong>
            </p>
            <p className="onboarding-description">
              6 quick questions about your goals, platforms, and schedule.
              <br />Find a quiet moment where you can think clearly.
            </p>

            <button
              className="crm-primary-btn glow-btn"
              onClick={() => setOnboardingStage(ONBOARDING_STAGES.STRATEGY_FLOW)}
            >
              I've Got Time, Let's Go
            </button>
            <button
              className="crm-secondary-btn"
              onClick={handleSkipStrategy}
            >
              Come Back Later
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ONBOARDING: Strategy Flow Stage
  if (onboardingStage === ONBOARDING_STAGES.STRATEGY_FLOW) {
    return (
      <ContentStrategyFlow
        onComplete={handleStrategyComplete}
        isModal={false}
      />
    )
  }

  // WEEKLY PLANNING: Review last week + generate this week
  if (onboardingStage === ONBOARDING_STAGES.WEEKLY_PLANNING) {
    return (
      <WeeklyPlanningSession
        onComplete={handleWeeklyPlanningComplete}
        onSkip={handleWeeklyPlanningSkip}
      />
    )
  }

  // Legacy support - remove once fully migrated
  if (showStrategyFlow) {
    return (
      <ContentStrategyFlow
        onComplete={handleStrategyComplete}
      />
    )
  }

  if (loading && onboardingStage === ONBOARDING_STAGES.COMPLETE) {
    return (
      <div className="crm-marketing">
        <div className="crm-loading">
          <div className="crm-spinner"></div>
          <p>Loading quests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="crm-marketing">
      <header className="marketing-header">
        <button className="back-btn" onClick={() => navigate('/crm')}>
          ← Back
        </button>
        <div className="header-content">
          <h1>Marketing Quests</h1>
          <div className="header-actions">
            <div className="week-nav">
              <button
                className="week-nav-btn"
                onClick={() => handleWeekChange(-1)}
                disabled={weekOffset <= -4}
              >
                ←
              </button>
              <span className="week-label">
                {weekInfo.label}
                {weekInfo.isCurrentWeek && <span className="current-week-badge">This Week</span>}
              </span>
              <button
                className="week-nav-btn"
                onClick={() => handleWeekChange(1)}
                disabled={weekOffset >= 0}
              >
                →
              </button>
            </div>
            <div className="crm-header-actions">
              <button
                className="strategy-btn"
                onClick={() => setShowStrategyFlow(true)}
                title="Edit your content strategy"
              >
                ⚙️ Strategy
              </button>
              <button
                className="performance-btn"
                onClick={() => navigate('/crm/performance')}
                title="View performance analytics"
              >
                📊 Analytics
              </button>
              <button
                className="story-bank-btn"
                onClick={() => setShowStoryBank(true)}
                title="Manage your Story Bank"
              >
                📚 Stories
              </button>
              <button
                className="queue-btn"
                onClick={() => navigate('/crm/content-queue')}
                title="Review pending content"
              >
                📬 Queue
              </button>
              <ContentGenerator
                userId={user?.id}
                projectId={null}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Week Progress */}
      <div className="week-progress">
        <div className="progress-stats">
          <span className="progress-text">
            {stats.completed}/{stats.total} tasks • {stats.points} pts
          </span>
          <span className="progress-rate">{stats.rate}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${stats.rate}%` }}></div>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="day-tabs">
        {days.map(day => (
          <button
            key={day}
            className={`day-tab ${selectedDay === day ? 'active' : ''} ${day === todayInfo.dayName ? 'today' : ''}`}
            onClick={() => setSelectedDay(day)}
          >
            {day.slice(0, 3)}
            {day === todayInfo.dayName && <span className="today-dot"></span>}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="tasks-list">
        {dayTasks.length === 0 ? (
          <div className="empty-day">
            <p>No tasks for {selectedDay}</p>
          </div>
        ) : (
          dayTasks.map(task => (
            <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`}>
              <button
                className="task-checkbox"
                onClick={() => handleToggleTask(task)}
              >
                {task.completed ? '✓' : ''}
              </button>
              <div className="task-content">
                <span className="task-type">{task.task_type}</span>
                <div className="task-meta">
                  <span className="task-platform">{task.platform}</span>
                  {task.points_value > 0 && (
                    <span className="task-points">+{task.points_value} pts</span>
                  )}
                </div>
              </div>
              <div className="task-actions">
                {!task.completed && (
                  <button
                    className="quick-generate-btn"
                    onClick={() => setQuickGenerateTask(task)}
                    title="AI Generate Content"
                  >
                    ✨
                  </button>
                )}
                {task.completed && (
                  <button
                    className="engagement-btn"
                    onClick={() => openEngagementModal(task)}
                  >
                    📊
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Engagement Modal */}
      {engagementModal && (
        <div className="modal-overlay" onClick={() => setEngagementModal(null)}>
          <div className="engagement-modal" onClick={e => e.stopPropagation()}>
            <h3>Track Engagement</h3>
            <p className="modal-task">{engagementModal.task_type}</p>

            <div className="engagement-inputs">
              <div className="engagement-field">
                <label>❤️ Likes</label>
                <input
                  type="number"
                  min="0"
                  value={engagement.likes}
                  onChange={e => setEngagement(prev => ({ ...prev, likes: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="engagement-field">
                <label>💬 Comments</label>
                <input
                  type="number"
                  min="0"
                  value={engagement.comments}
                  onChange={e => setEngagement(prev => ({ ...prev, comments: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="engagement-field">
                <label>🔄 Shares</label>
                <input
                  type="number"
                  min="0"
                  value={engagement.shares}
                  onChange={e => setEngagement(prev => ({ ...prev, shares: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="engagement-field">
                <label>📩 DMs</label>
                <input
                  type="number"
                  min="0"
                  value={engagement.dms}
                  onChange={e => setEngagement(prev => ({ ...prev, dms: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setEngagementModal(null)}>
                Cancel
              </button>
              <button className="save-btn" onClick={saveEngagement}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Generate Modal */}
      {quickGenerateTask && (
        <div className="modal-overlay" onClick={() => setQuickGenerateTask(null)}>
          <div className="quick-generate-modal" onClick={e => e.stopPropagation()}>
            <div className="qg-header">
              <h3>Generate Content</h3>
              <button className="qg-close" onClick={() => setQuickGenerateTask(null)}>×</button>
            </div>
            <div className="qg-task-info">
              <span className="qg-task-type">{quickGenerateTask.task_type}</span>
              <span className="qg-task-platform">{quickGenerateTask.platform}</span>
            </div>
            <div className="qg-generator">
              <ContentGenerator
                userId={user?.id}
                projectId={null}
                initialPlatform={quickGenerateTask.platform?.toLowerCase().replace('/', '_')}
                initialType={TASK_TO_CONTENT_TYPE[quickGenerateTask.task_type]}
                onContentGenerated={(content) => {
                  // Could save to task or clipboard
                  navigator.clipboard.writeText(content.content)
                  setQuickGenerateTask(null)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Story Bank Modal */}
      {showStoryBank && (
        <div className="modal-overlay" onClick={() => setShowStoryBank(false)}>
          <div className="story-bank-modal" onClick={e => e.stopPropagation()}>
            <StoryBank onClose={() => setShowStoryBank(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
