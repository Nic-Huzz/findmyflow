/**
 * CRM Analytics - Weekly Report Card
 * Shows grades, comparisons, and top performers
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  fetchWeeklyMarketingStats,
  fetchWeeklySalesStats,
  fetchUserStats,
  fetchTopContent,
  calculateWeeklyGrade,
  compareWeeks,
  getWeekRange,
  fetchPlatformBreakdown,
} from '../../lib/crm'
import './Analytics.css'

export default function Analytics() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [marketingStats, setMarketingStats] = useState(null)
  const [lastWeekMarketing, setLastWeekMarketing] = useState(null)
  const [salesStats, setSalesStats] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [topContent, setTopContent] = useState([])
  const [platformBreakdown, setPlatformBreakdown] = useState(null)

  const weekRange = useMemo(() => getWeekRange(weekOffset), [weekOffset])

  useEffect(() => {
    if (user?.id) {
      loadAnalytics()
    }
  }, [user?.id, weekOffset])

  async function loadAnalytics() {
    setLoading(true)
    try {
      const [marketing, lastMarketing, sales, stats, top, platforms] = await Promise.all([
        fetchWeeklyMarketingStats(user.id, weekOffset),
        fetchWeeklyMarketingStats(user.id, weekOffset - 1),
        fetchWeeklySalesStats(user.id, weekOffset),
        fetchUserStats(user.id),
        fetchTopContent(user.id, 5),
        fetchPlatformBreakdown(user.id, weekOffset),
      ])

      if (marketing.data) setMarketingStats(marketing.data)
      if (lastMarketing.data) setLastWeekMarketing(lastMarketing.data)
      if (sales.data) setSalesStats(sales.data)
      if (stats.data) setUserStats(stats.data)
      if (top.data) setTopContent(top.data)
      if (platforms.data) setPlatformBreakdown(platforms.data)
    } catch (err) {
      console.error('Error loading analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const weeklyGrade = useMemo(() => {
    return calculateWeeklyGrade(marketingStats, salesStats, userStats)
  }, [marketingStats, salesStats, userStats])

  const comparison = useMemo(() => {
    if (!marketingStats || !lastWeekMarketing) return null
    return compareWeeks(marketingStats, lastWeekMarketing)
  }, [marketingStats, lastWeekMarketing])

  function formatChange(value) {
    if (value > 0) return `+${value}%`
    if (value < 0) return `${value}%`
    return '0%'
  }

  function getChangeClass(value) {
    if (value > 0) return 'positive'
    if (value < 0) return 'negative'
    return ''
  }

  if (loading) {
    return (
      <div className="crm-analytics">
        <div className="crm-loading">
          <div className="crm-spinner"></div>
          <p>Crunching your numbers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="crm-analytics">
      <header className="analytics-header">
        <button className="back-btn" onClick={() => navigate('/crm')}>
          ← Back
        </button>
        <div className="header-content">
          <h1>Weekly Report Card</h1>
          <div className="week-nav">
            <button
              className="week-btn"
              onClick={() => setWeekOffset(prev => prev - 1)}
            >
              ← Previous
            </button>
            <span className="week-label">{weekRange.label}</span>
            <button
              className="week-btn"
              onClick={() => setWeekOffset(prev => Math.min(0, prev + 1))}
              disabled={weekOffset >= 0}
            >
              Next →
            </button>
          </div>
        </div>
      </header>

      {/* Overall Grade */}
      <div className="grade-card">
        <div className="grade-display">
          <span className="grade-emoji">{weeklyGrade.grade.emoji}</span>
          <span className="grade-letter">{weeklyGrade.grade.letter}</span>
        </div>
        <div className="grade-info">
          <span className="grade-score">{weeklyGrade.overall}%</span>
          <span className="grade-label">Overall Score</span>
        </div>
      </div>

      {/* Grade Breakdown */}
      <section className="analytics-section">
        <h2>Score Breakdown</h2>
        <div className="breakdown-grid">
          {Object.entries(weeklyGrade.breakdown).map(([key, { score, weight }]) => (
            <div key={key} className="breakdown-item">
              <div className="breakdown-header">
                <span className="breakdown-name">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="breakdown-weight">{Math.round(weight * 100)}%</span>
              </div>
              <div className="breakdown-bar">
                <div
                  className="breakdown-fill"
                  style={{ width: `${score}%` }}
                ></div>
              </div>
              <span className="breakdown-score">{score}%</span>
            </div>
          ))}
        </div>
      </section>

      {/* Week Comparison */}
      {comparison && (
        <section className="analytics-section">
          <h2>vs Last Week</h2>
          <div className="comparison-grid">
            <div className={`comparison-item ${getChangeClass(comparison.tasksChange)}`}>
              <span className="comparison-label">Tasks</span>
              <span className="comparison-value">{formatChange(comparison.tasksChange)}</span>
            </div>
            <div className={`comparison-item ${getChangeClass(comparison.pointsChange)}`}>
              <span className="comparison-label">Points</span>
              <span className="comparison-value">{formatChange(comparison.pointsChange)}</span>
            </div>
            <div className={`comparison-item ${getChangeClass(comparison.engagementChange)}`}>
              <span className="comparison-label">Engagement</span>
              <span className="comparison-value">{formatChange(comparison.engagementChange)}</span>
            </div>
            <div className={`comparison-item ${getChangeClass(comparison.completionRateChange)}`}>
              <span className="comparison-label">Completion</span>
              <span className="comparison-value">{formatChange(comparison.completionRateChange)}</span>
            </div>
          </div>
        </section>
      )}

      {/* Marketing Stats */}
      {marketingStats && (
        <section className="analytics-section">
          <h2>Marketing Performance</h2>
          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-value">{marketingStats.completedTasks}/{marketingStats.totalTasks}</span>
              <span className="stat-label">Tasks Completed</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{marketingStats.pointsEarned}</span>
              <span className="stat-label">Points Earned</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{marketingStats.totalEngagement}</span>
              <span className="stat-label">Total Engagement</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{marketingStats.daysActive}/5</span>
              <span className="stat-label">Days Active</span>
            </div>
          </div>

          {/* Engagement Breakdown */}
          <div className="engagement-breakdown">
            <div className="eng-item">
              <span className="eng-icon">❤️</span>
              <span className="eng-value">{marketingStats.totalLikes}</span>
              <span className="eng-label">Likes</span>
            </div>
            <div className="eng-item">
              <span className="eng-icon">💬</span>
              <span className="eng-value">{marketingStats.totalComments}</span>
              <span className="eng-label">Comments</span>
            </div>
            <div className="eng-item">
              <span className="eng-icon">🔄</span>
              <span className="eng-value">{marketingStats.totalShares}</span>
              <span className="eng-label">Shares</span>
            </div>
            <div className="eng-item">
              <span className="eng-icon">📩</span>
              <span className="eng-value">{marketingStats.totalDMs}</span>
              <span className="eng-label">DMs</span>
            </div>
          </div>
        </section>
      )}

      {/* Sales Stats */}
      {salesStats && (
        <section className="analytics-section">
          <h2>Sales Performance</h2>
          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-value">{salesStats.dealsCreated}</span>
              <span className="stat-label">Deals Created</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{salesStats.dealsWon}</span>
              <span className="stat-label">Deals Won</span>
            </div>
            <div className="stat-box highlight">
              <span className="stat-value">${salesStats.revenueThisWeek.toLocaleString()}</span>
              <span className="stat-label">Revenue</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">${salesStats.pipelineValue.toLocaleString()}</span>
              <span className="stat-label">Pipeline</span>
            </div>
          </div>
        </section>
      )}

      {/* Platform Breakdown */}
      {platformBreakdown && platformBreakdown.breakdown.length > 0 && (
        <section className="analytics-section">
          <h2>Platform Breakdown</h2>
          <p className="section-subtitle">See which platforms are driving your results</p>
          <div className="platform-breakdown-grid">
            {platformBreakdown.breakdown.map(platform => (
              <div key={platform.platform} className="platform-card">
                <div className="platform-header">
                  <span className="platform-emoji">{platform.emoji}</span>
                  <span className="platform-name">{platform.platform}</span>
                </div>
                <div className="platform-stats">
                  <div className="platform-stat">
                    <span className="platform-stat-value">{platform.totalEngagement}</span>
                    <span className="platform-stat-label">Engagement</span>
                  </div>
                  <div className="platform-stat">
                    <span className="platform-stat-value">{platform.leadsGenerated}</span>
                    <span className="platform-stat-label">Leads</span>
                  </div>
                  <div className="platform-stat">
                    <span className="platform-stat-value">${platform.revenue.toLocaleString()}</span>
                    <span className="platform-stat-label">Revenue</span>
                  </div>
                </div>
                {platform.totalEngagement > 0 && (
                  <div className="platform-engagement-bar">
                    <div
                      className="platform-bar-fill"
                      style={{
                        width: `${Math.min(100, (platform.totalEngagement / platformBreakdown.totals.totalEngagement) * 100)}%`,
                        backgroundColor: platform.color
                      }}
                    ></div>
                  </div>
                )}
                <div className="platform-details">
                  <span>❤️ {platform.likes}</span>
                  <span>💬 {platform.comments}</span>
                  <span>🔄 {platform.shares}</span>
                  <span>📩 {platform.dms}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Platform Totals */}
          <div className="platform-totals">
            <div className="platform-total-item">
              <span className="total-label">Total Engagement</span>
              <span className="total-value">{platformBreakdown.totals.totalEngagement}</span>
            </div>
            <div className="platform-total-item">
              <span className="total-label">Total Leads</span>
              <span className="total-value">{platformBreakdown.totals.totalLeads}</span>
            </div>
            <div className="platform-total-item highlight">
              <span className="total-label">Total Revenue</span>
              <span className="total-value">${platformBreakdown.totals.totalRevenue.toLocaleString()}</span>
            </div>
          </div>
        </section>
      )}

      {/* Top Performers */}
      {topContent.length > 0 && (
        <section className="analytics-section">
          <h2>Top Performing Content</h2>
          <div className="top-content-list">
            {topContent.map((item, index) => (
              <div key={item.id} className="top-content-item">
                <span className="top-rank">#{index + 1}</span>
                <div className="top-info">
                  <span className="top-type">{item.task_type}</span>
                  <span className="top-platform">{item.platform} • {item.date}</span>
                </div>
                <span className="top-engagement">{item.totalEngagement}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
