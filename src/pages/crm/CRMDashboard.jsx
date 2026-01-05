/**
 * CRM Dashboard - Command Center Overview
 * Shows points, streaks, revenue progress, and quick actions
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  fetchUserStats,
  getLevel,
  getLevelProgress,
  getPointsToNextLevel,
  fetchDeals,
  calculateRevenueStats,
  fetchWeeklyMarketingStats,
} from '../../lib/crm'
import './CRMDashboard.css'

export default function CRMDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [deals, setDeals] = useState([])
  const [marketingStats, setMarketingStats] = useState(null)

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    }
  }, [user?.id])

  async function loadDashboardData() {
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
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const level = useMemo(() => {
    if (!stats) return null
    return getLevel(stats.total_points || 0)
  }, [stats])

  const levelProgress = useMemo(() => {
    if (!stats) return 0
    return getLevelProgress(stats.total_points || 0)
  }, [stats])

  const pointsToNext = useMemo(() => {
    if (!stats) return 0
    return getPointsToNextLevel(stats.total_points || 0)
  }, [stats])

  const revenueStats = useMemo(() => {
    return calculateRevenueStats(deals, stats?.monthly_revenue_goal || 5000)
  }, [deals, stats])

  if (loading) {
    return (
      <div className="crm-dashboard">
        <div className="crm-loading">
          <div className="crm-spinner"></div>
          <p>Loading command center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="crm-dashboard">
      <header className="crm-header">
        <h1>Command Center</h1>
        <p className="crm-subtitle">Your marketing & sales HQ</p>
      </header>

      {/* Stats Cards Row */}
      <div className="crm-stats-grid">
        {/* Points Card */}
        <div className="crm-stat-card points-card">
          <div className="stat-icon">{level?.emoji || '🏰'}</div>
          <div className="stat-content">
            <span className="stat-label">{level?.name || 'Vibe Apprentice'}</span>
            <span className="stat-value">{stats?.total_points || 0} pts</span>
          </div>
          <div className="level-progress">
            <div className="level-bar">
              <div
                className="level-fill"
                style={{ width: `${levelProgress}%` }}
              ></div>
            </div>
            <span className="level-text">{pointsToNext} pts to next level</span>
          </div>
        </div>

        {/* Streak Card */}
        <div className="crm-stat-card streak-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <span className="stat-label">Current Streak</span>
            <span className="stat-value">{stats?.current_streak || 0} days</span>
          </div>
          <span className="stat-secondary">
            Best: {stats?.longest_streak || 0} days
          </span>
        </div>

        {/* Revenue Card */}
        <div className="crm-stat-card revenue-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <span className="stat-label">Monthly Revenue</span>
            <span className="stat-value">${revenueStats.currentRevenue.toLocaleString()}</span>
          </div>
          <div className="revenue-progress">
            <div className="revenue-bar">
              <div
                className="revenue-fill"
                style={{ width: `${revenueStats.progress}%` }}
              ></div>
            </div>
            <span className="revenue-text">
              {revenueStats.progress}% of ${revenueStats.monthlyGoal.toLocaleString()} goal
            </span>
          </div>
        </div>

        {/* Pipeline Card */}
        <div className="crm-stat-card pipeline-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-label">Pipeline Value</span>
            <span className="stat-value">${revenueStats.pipelineValue.toLocaleString()}</span>
          </div>
          <span className="stat-secondary">
            {revenueStats.activeDeals} active deals
          </span>
        </div>
      </div>

      {/* Weekly Progress */}
      {marketingStats && (
        <section className="crm-section">
          <h2>This Week&apos;s Progress</h2>
          <div className="weekly-stats">
            <div className="weekly-stat">
              <span className="weekly-label">Tasks Completed</span>
              <span className="weekly-value">
                {marketingStats.completedTasks} / {marketingStats.totalTasks}
              </span>
              <div className="weekly-bar">
                <div
                  className="weekly-fill"
                  style={{ width: `${marketingStats.completionRate}%` }}
                ></div>
              </div>
            </div>
            <div className="weekly-stat">
              <span className="weekly-label">Points Earned</span>
              <span className="weekly-value">{marketingStats.pointsEarned} pts</span>
            </div>
            <div className="weekly-stat">
              <span className="weekly-label">Engagement</span>
              <span className="weekly-value">{marketingStats.totalEngagement}</span>
            </div>
            <div className="weekly-stat">
              <span className="weekly-label">Days Active</span>
              <span className="weekly-value">{marketingStats.daysActive} / 5</span>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="crm-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <button
            className="action-btn marketing-btn"
            onClick={() => navigate('/crm/marketing')}
          >
            <span className="action-icon">📝</span>
            <span className="action-text">Marketing Quests</span>
          </button>
          <button
            className="action-btn sales-btn"
            onClick={() => navigate('/crm/sales')}
          >
            <span className="action-icon">💼</span>
            <span className="action-text">Sales Pipeline</span>
          </button>
          <button
            className="action-btn analytics-btn"
            onClick={() => navigate('/crm/analytics')}
          >
            <span className="action-icon">📈</span>
            <span className="action-text">Report Card</span>
          </button>
          <button
            className="action-btn alerts-btn"
            onClick={() => navigate('/crm/alerts')}
          >
            <span className="action-icon">🔔</span>
            <span className="action-text">Smart Alerts</span>
          </button>
        </div>
      </section>

      {/* Hormozi Tools */}
      <section className="crm-section">
        <h2>Hormozi Tools</h2>
        <div className="tools-grid">
          <button className="tool-btn" onClick={() => navigate('/crm/ptuf')}>
            <span className="tool-icon">🎯</span>
            <span className="tool-name">PTUF Calculator</span>
            <span className="tool-desc">Price To Unit Formula</span>
          </button>
          <button className="tool-btn" onClick={() => navigate('/crm/ltv')}>
            <span className="tool-icon">💎</span>
            <span className="tool-name">LTV Calculator</span>
            <span className="tool-desc">Lifetime Value Analysis</span>
          </button>
          <button className="tool-btn" onClick={() => navigate('/crm/cac')}>
            <span className="tool-icon">📊</span>
            <span className="tool-name">CAC Tracker</span>
            <span className="tool-desc">Acquisition Cost by Channel</span>
          </button>
          <button className="tool-btn" onClick={() => navigate('/crm/scripts')}>
            <span className="tool-icon">📝</span>
            <span className="tool-name">Sales Scripts</span>
            <span className="tool-desc">Proven Frameworks</span>
          </button>
        </div>
      </section>

      {/* Pipeline Summary */}
      <section className="crm-section">
        <h2>Pipeline Summary</h2>
        <div className="pipeline-summary">
          <div className="pipeline-stage">
            <span className="stage-name">Leads</span>
            <span className="stage-count">
              {deals.filter(d => d.status === 'lead').length}
            </span>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-stage">
            <span className="stage-name">Discovery</span>
            <span className="stage-count">
              {deals.filter(d => d.status === 'discovery').length}
            </span>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-stage">
            <span className="stage-name">Proposal</span>
            <span className="stage-count">
              {deals.filter(d => d.status === 'proposal').length}
            </span>
          </div>
          <div className="pipeline-arrow">→</div>
          <div className="pipeline-stage won">
            <span className="stage-name">Won</span>
            <span className="stage-count">
              {deals.filter(d => d.status === 'won').length}
            </span>
          </div>
        </div>
        <div className="pipeline-metrics">
          <span className="metric">
            Win Rate: <strong>{revenueStats.winRate}%</strong>
          </span>
          <span className="metric">
            Weighted Pipeline: <strong>${revenueStats.weightedPipeline.toLocaleString()}</strong>
          </span>
        </div>
      </section>
    </div>
  )
}
