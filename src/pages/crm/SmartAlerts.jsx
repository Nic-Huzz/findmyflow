/**
 * Smart Alerts - Intelligent Business Notifications
 * Tracks key metrics and triggers alerts when action is needed
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  fetchUserStats,
  fetchDeals,
  fetchWeeklyMarketingStats,
  calculateRevenueStats,
} from '../../lib/crm'
import './SmartAlerts.css'

const ALERT_TYPES = {
  streak: { icon: '🔥', color: '#f59e0b', category: 'Engagement' },
  revenue: { icon: '💰', color: '#10b981', category: 'Revenue' },
  pipeline: { icon: '📊', color: '#8b5cf6', category: 'Sales' },
  marketing: { icon: '📝', color: '#06b6d4', category: 'Marketing' },
  celebration: { icon: '🎉', color: '#ec4899', category: 'Win' },
  warning: { icon: '⚠️', color: '#ef4444', category: 'Warning' },
}

export default function SmartAlerts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [deals, setDeals] = useState([])
  const [marketingStats, setMarketingStats] = useState(null)
  const [dismissedAlerts, setDismissedAlerts] = useState([])

  useEffect(() => {
    if (user?.id) {
      loadData()
      // Load dismissed alerts from localStorage
      const dismissed = localStorage.getItem(`alerts_dismissed_${user.id}`)
      if (dismissed) {
        setDismissedAlerts(JSON.parse(dismissed))
      }
    }
  }, [user?.id])

  async function loadData() {
    setLoading(true)
    try {
      const [statsResult, dealsResult, marketingResult] = await Promise.all([
        fetchUserStats(user.id),
        fetchDeals(user.id),
        fetchWeeklyMarketingStats(user.id),
      ])

      if (statsResult.data) setStats(statsResult.data)
      if (dealsResult.data) setDeals(dealsResult.data)
      if (marketingResult.data) setMarketingStats(marketingResult.data)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const revenueStats = useMemo(() => {
    return calculateRevenueStats(deals, stats?.monthly_revenue_goal || 5000)
  }, [deals, stats])

  const alerts = useMemo(() => {
    const alertsList = []
    const today = new Date()
    const dayOfWeek = today.getDay()
    const dayOfMonth = today.getDate()

    // Streak alerts
    if (stats?.current_streak === 0) {
      alertsList.push({
        id: 'streak-broken',
        type: 'streak',
        title: 'Start Your Streak Today!',
        message: 'Complete a task to begin building momentum.',
        action: { label: 'Go to Quests', path: '/crm/marketing' },
        priority: 'medium',
      })
    } else if (stats?.current_streak >= 7) {
      alertsList.push({
        id: 'streak-7',
        type: 'celebration',
        title: `${stats.current_streak} Day Streak! 🔥`,
        message: "You're on fire! Keep the momentum going.",
        priority: 'low',
      })
    }

    // Revenue alerts
    if (revenueStats.progress >= 100) {
      alertsList.push({
        id: 'goal-hit',
        type: 'celebration',
        title: 'Monthly Goal Achieved! 🎉',
        message: `You've hit $${revenueStats.currentRevenue.toLocaleString()} this month!`,
        priority: 'low',
      })
    } else if (revenueStats.progress >= 75) {
      alertsList.push({
        id: 'goal-close',
        type: 'revenue',
        title: 'Almost There!',
        message: `${revenueStats.progress}% to your monthly goal. $${(revenueStats.monthlyGoal - revenueStats.currentRevenue).toLocaleString()} to go!`,
        priority: 'low',
      })
    } else if (dayOfMonth >= 20 && revenueStats.progress < 50) {
      alertsList.push({
        id: 'goal-behind',
        type: 'warning',
        title: 'Revenue Goal at Risk',
        message: `Only ${revenueStats.progress}% of goal with ${30 - dayOfMonth} days left. Time to accelerate!`,
        action: { label: 'View Pipeline', path: '/crm/sales' },
        priority: 'high',
      })
    }

    // Pipeline alerts
    const staleDeals = deals.filter(d => {
      if (['won', 'lost'].includes(d.status)) return false
      const updated = new Date(d.updated_at)
      const daysSince = Math.floor((today - updated) / (1000 * 60 * 60 * 24))
      return daysSince > 7
    })

    if (staleDeals.length > 0) {
      alertsList.push({
        id: 'stale-deals',
        type: 'pipeline',
        title: `${staleDeals.length} Stale Deal${staleDeals.length > 1 ? 's' : ''}`,
        message: 'Some deals haven\'t been updated in 7+ days. Follow up!',
        action: { label: 'View Pipeline', path: '/crm/sales' },
        priority: 'high',
      })
    }

    const proposalDeals = deals.filter(d => d.status === 'proposal')
    if (proposalDeals.length > 0) {
      alertsList.push({
        id: 'proposals-pending',
        type: 'pipeline',
        title: `${proposalDeals.length} Proposal${proposalDeals.length > 1 ? 's' : ''} Pending`,
        message: 'Deals in proposal stage need follow-up to close.',
        action: { label: 'View Pipeline', path: '/crm/sales' },
        priority: 'medium',
      })
    }

    // Marketing alerts
    if (marketingStats) {
      if (marketingStats.completionRate < 50 && dayOfWeek >= 4) {
        alertsList.push({
          id: 'marketing-behind',
          type: 'marketing',
          title: 'Marketing Tasks Behind',
          message: `Only ${marketingStats.completionRate}% complete this week. Catch up before Friday!`,
          action: { label: 'View Quests', path: '/crm/marketing' },
          priority: 'high',
        })
      }

      if (marketingStats.daysActive < 3 && dayOfWeek >= 3) {
        alertsList.push({
          id: 'consistency-alert',
          type: 'marketing',
          title: 'Consistency Check',
          message: `Only active ${marketingStats.daysActive} days this week. Show up daily!`,
          action: { label: 'Today\'s Tasks', path: '/crm/marketing' },
          priority: 'medium',
        })
      }
    }

    // Weekly planning reminder (Sunday/Monday)
    if (dayOfWeek === 0 || dayOfWeek === 1) {
      alertsList.push({
        id: 'weekly-planning',
        type: 'marketing',
        title: 'Plan Your Week',
        message: 'Set your marketing goals and priorities for the week ahead.',
        action: { label: 'Weekly Planning', path: '/weekly-planning' },
        priority: 'medium',
      })
    }

    // End of month review
    if (dayOfMonth >= 28) {
      alertsList.push({
        id: 'month-review',
        type: 'revenue',
        title: 'Month-End Review',
        message: 'Review your performance and set goals for next month.',
        action: { label: 'View Analytics', path: '/crm/analytics' },
        priority: 'medium',
      })
    }

    // Filter out dismissed alerts
    return alertsList.filter(alert => !dismissedAlerts.includes(alert.id))
  }, [stats, revenueStats, deals, marketingStats, dismissedAlerts])

  function dismissAlert(alertId) {
    const newDismissed = [...dismissedAlerts, alertId]
    setDismissedAlerts(newDismissed)
    localStorage.setItem(`alerts_dismissed_${user.id}`, JSON.stringify(newDismissed))
  }

  function clearAllDismissed() {
    setDismissedAlerts([])
    localStorage.removeItem(`alerts_dismissed_${user.id}`)
  }

  const groupedAlerts = useMemo(() => {
    const high = alerts.filter(a => a.priority === 'high')
    const medium = alerts.filter(a => a.priority === 'medium')
    const low = alerts.filter(a => a.priority === 'low')
    return { high, medium, low }
  }, [alerts])

  if (loading) {
    return (
      <div className="smart-alerts">
        <div className="crm-loading">
          <div className="crm-spinner"></div>
          <p>Analyzing your data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="smart-alerts">
      <header className="alerts-header">
        <button className="back-btn" onClick={() => navigate('/crm')}>
          ← Back
        </button>
        <div className="header-content">
          <h1>Smart Alerts</h1>
          <p>Intelligent notifications based on your data</p>
        </div>
        {dismissedAlerts.length > 0 && (
          <button className="reset-btn" onClick={clearAllDismissed}>
            Reset Dismissed
          </button>
        )}
      </header>

      {alerts.length === 0 ? (
        <div className="no-alerts">
          <span className="no-alerts-icon">✅</span>
          <h2>All Clear!</h2>
          <p>No alerts right now. Keep up the great work!</p>
        </div>
      ) : (
        <>
          {/* High Priority */}
          {groupedAlerts.high.length > 0 && (
            <section className="alert-section high-priority">
              <h2>🚨 Action Required</h2>
              <div className="alerts-list">
                {groupedAlerts.high.map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onDismiss={() => dismissAlert(alert.id)}
                    onAction={() => navigate(alert.action?.path)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Medium Priority */}
          {groupedAlerts.medium.length > 0 && (
            <section className="alert-section medium-priority">
              <h2>📋 Recommended Actions</h2>
              <div className="alerts-list">
                {groupedAlerts.medium.map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onDismiss={() => dismissAlert(alert.id)}
                    onAction={() => navigate(alert.action?.path)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Low Priority / Celebrations */}
          {groupedAlerts.low.length > 0 && (
            <section className="alert-section low-priority">
              <h2>✨ Updates & Wins</h2>
              <div className="alerts-list">
                {groupedAlerts.low.map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onDismiss={() => dismissAlert(alert.id)}
                    onAction={() => alert.action && navigate(alert.action.path)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Stats Summary */}
      <section className="stats-summary">
        <h2>📊 Current Status</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Streak</span>
            <span className="stat-value">{stats?.current_streak || 0} days</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Points</span>
            <span className="stat-value">{stats?.total_points || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Revenue</span>
            <span className="stat-value">${revenueStats.currentRevenue.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Pipeline</span>
            <span className="stat-value">${revenueStats.pipelineValue.toLocaleString()}</span>
          </div>
        </div>
      </section>
    </div>
  )
}

function AlertCard({ alert, onDismiss, onAction }) {
  const typeInfo = ALERT_TYPES[alert.type]

  return (
    <div className="alert-card" style={{ '--alert-color': typeInfo.color }}>
      <div className="alert-icon">{typeInfo.icon}</div>
      <div className="alert-content">
        <span className="alert-category">{typeInfo.category}</span>
        <h3 className="alert-title">{alert.title}</h3>
        <p className="alert-message">{alert.message}</p>
        {alert.action && (
          <button className="alert-action" onClick={onAction}>
            {alert.action.label} →
          </button>
        )}
      </div>
      <button className="dismiss-btn" onClick={onDismiss} title="Dismiss">
        ×
      </button>
    </div>
  )
}
