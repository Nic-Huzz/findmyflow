/**
 * CRM Marketing - Quest Board
 * Weekly marketing tasks with engagement tracking
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
import './CRMMarketing.css'

export default function CRMMarketing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [engagementModal, setEngagementModal] = useState(null)
  const [engagement, setEngagement] = useState({ likes: 0, comments: 0, shares: 0, dms: 0 })
  const [weekOffset, setWeekOffset] = useState(0)

  const weekInfo = useMemo(() => getWeekInfo(weekOffset), [weekOffset])
  const todayInfo = useMemo(() => getTodayInfo(), [])

  useEffect(() => {
    if (user?.id) {
      loadTasks()
    }
  }, [user?.id, weekOffset])

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

  if (loading) {
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
              {task.completed && (
                <button
                  className="engagement-btn"
                  onClick={() => openEngagementModal(task)}
                >
                  📊
                </button>
              )}
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
    </div>
  )
}
