/**
 * ExecutionReview.jsx
 * Shows last week's execution score and task breakdown
 * Part of the merged WeeklyPlanningFlow
 */

import { useState, useEffect } from 'react'
import { fetchWeeklyTasks, getWeekStartDate, getWeekInfo } from '../../lib/crm'
import './ExecutionReview.css'

// Get score color based on percentage
function getScoreColor(score) {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'needs-work'
  return 'low'
}

// Get score message
function getScoreMessage(score) {
  if (score >= 80) return "Excellent system execution! Your consistency is paying off."
  if (score >= 60) return "Good effort! A few more tasks would level up your consistency."
  if (score >= 40) return "Room to improve. Consider if your strategy is realistic for your schedule."
  if (score > 0) return "Your system needs attention. Let's adjust to something more achievable."
  return "No tasks completed last week. Let's set up a system you can stick to."
}

export default function ExecutionReview({ userId, onComplete, onSkip }) {
  const [loading, setLoading] = useState(true)
  const [lastWeekData, setLastWeekData] = useState(null)
  const [executionScore, setExecutionScore] = useState(0)

  useEffect(() => {
    if (userId) {
      loadLastWeekData()
    }
  }, [userId])

  async function loadLastWeekData() {
    try {
      // Get last week's tasks
      const lastWeekStart = getWeekStartDate(-1) // -1 = last week
      const lastWeekTasks = await fetchWeeklyTasks(userId, lastWeekStart)

      // Calculate execution score
      if (lastWeekTasks?.data && lastWeekTasks.data.length > 0) {
        const tasks = lastWeekTasks.data
        const completed = tasks.filter(t => t.completed).length
        const total = tasks.length
        const score = Math.round((completed / total) * 100)

        setLastWeekData({
          tasks,
          completed,
          total,
          weekInfo: getWeekInfo(-1)
        })
        setExecutionScore(score)
      } else {
        setLastWeekData(null)
        setExecutionScore(0)
      }
    } catch (err) {
      console.error('Error loading last week data:', err)
      setLastWeekData(null)
    }
    setLoading(false)
  }

  // Group tasks by type for breakdown
  function getTaskBreakdown() {
    if (!lastWeekData?.tasks) return []

    const byType = {}
    lastWeekData.tasks.forEach(task => {
      const type = task.task_type || 'Other'
      if (!byType[type]) {
        byType[type] = { total: 0, completed: 0 }
      }
      byType[type].total++
      if (task.completed) byType[type].completed++
    })

    return Object.entries(byType).map(([type, data]) => ({
      type,
      ...data,
      rate: Math.round((data.completed / data.total) * 100)
    }))
  }

  if (loading) {
    return (
      <div className="execution-review">
        <div className="execution-review-loading">
          <div className="spinner"></div>
          <p>Loading last week's data...</p>
        </div>
      </div>
    )
  }

  const taskBreakdown = getTaskBreakdown()

  return (
    <div className="execution-review">
      <div className="execution-review-header">
        <h2>Review Last Week</h2>
        <p className="execution-review-philosophy">
          "You don't rise to the level of your goals, you fall to the level of your systems."
        </p>
      </div>

      {lastWeekData ? (
        <>
          {/* Execution Score */}
          <div className={`execution-score-card ${getScoreColor(executionScore)}`}>
            <div className="execution-score-header">
              <span className="execution-score-label">System Execution Score</span>
              <span className="execution-week-label">{lastWeekData.weekInfo?.label}</span>
            </div>
            <div className="execution-score-value">{executionScore}%</div>
            <div className="execution-score-detail">
              {lastWeekData.completed} of {lastWeekData.total} tasks completed
            </div>
            <div className="execution-score-bar">
              <div
                className="execution-score-fill"
                style={{ width: `${executionScore}%` }}
              ></div>
            </div>
            <p className="execution-score-message">{getScoreMessage(executionScore)}</p>
          </div>

          {/* Task Breakdown */}
          {taskBreakdown.length > 0 && (
            <div className="execution-breakdown">
              <h3>Breakdown by Task Type</h3>
              <div className="execution-breakdown-list">
                {taskBreakdown.map(item => (
                  <div key={item.type} className="execution-breakdown-item">
                    <span className="execution-breakdown-type">{item.type}</span>
                    <span className="execution-breakdown-stats">
                      {item.completed}/{item.total}
                      <span className={`execution-breakdown-rate ${getScoreColor(item.rate)}`}>
                        {item.rate}%
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="execution-no-data">
          <span className="execution-no-data-icon">📊</span>
          <h3>No data from last week</h3>
          <p>This might be your first week, or no tasks were scheduled. Let's set up your system!</p>
        </div>
      )}

      <div className="execution-review-actions">
        <button className="execution-primary-btn" onClick={onComplete}>
          Continue →
        </button>
        <button className="execution-skip-btn" onClick={onSkip}>
          Skip Review
        </button>
      </div>
    </div>
  )
}
