/**
 * CRM Reports - Weekly & Monthly Performance Reports
 * Replaces Analytics with enhanced view mode toggle and export capabilities
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  fetchWeeklyMarketingStats,
  fetchWeeklySalesStats,
  fetchMonthlyMarketingStats,
  fetchMonthlySalesStats,
  fetchUserStats,
  fetchTopContent,
  calculateWeeklyGrade,
  compareWeeks,
  getWeekRange,
  getMonthRange,
  fetchPlatformBreakdown,
  fetchMonthlyPlatformBreakdown,
  getMergedFunnelMetrics,
  getLastSyncTime,
  forceCRMSync,
  fetchProjectPnL,
  aggregatePnL,
} from '../../lib/crm'
import './Reports.css'

export default function Reports() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // View mode: week or month
  const [viewMode, setViewMode] = useState('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)

  // Data states
  const [loading, setLoading] = useState(true)
  const [marketingStats, setMarketingStats] = useState(null)
  const [lastPeriodMarketing, setLastPeriodMarketing] = useState(null)
  const [salesStats, setSalesStats] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [topContent, setTopContent] = useState([])
  const [platformBreakdown, setPlatformBreakdown] = useState(null)
  const [funnelMetrics, setFunnelMetrics] = useState(null)
  const [lastSyncTime, setLastSyncTime] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [pnlData, setPnlData] = useState([])

  // Get current period range based on view mode
  const periodRange = useMemo(() => {
    return viewMode === 'week' ? getWeekRange(weekOffset) : getMonthRange(monthOffset)
  }, [viewMode, weekOffset, monthOffset])

  useEffect(() => {
    if (user?.id) {
      loadReports()
    }
  }, [user?.id, viewMode, weekOffset, monthOffset])

  async function loadReports() {
    setLoading(true)
    try {
      if (viewMode === 'week') {
        const [marketing, lastMarketing, sales, stats, top, platforms, funnel, syncTime] = await Promise.all([
          fetchWeeklyMarketingStats(user.id, weekOffset),
          fetchWeeklyMarketingStats(user.id, weekOffset - 1),
          fetchWeeklySalesStats(user.id, weekOffset),
          fetchUserStats(user.id),
          fetchTopContent(user.id, 5),
          fetchPlatformBreakdown(user.id, weekOffset),
          getMergedFunnelMetrics(user.id, weekOffset),
          getLastSyncTime(user.id),
        ])

        if (marketing.data) setMarketingStats(marketing.data)
        if (lastMarketing.data) setLastPeriodMarketing(lastMarketing.data)
        if (sales.data) setSalesStats(sales.data)
        if (stats.data) setUserStats(stats.data)
        if (top.data) setTopContent(top.data)
        if (platforms.data) setPlatformBreakdown(platforms.data)
        if (funnel.data) setFunnelMetrics(funnel.data)
        if (syncTime) setLastSyncTime(syncTime)

        // Fetch P&L for current month (week view shows current month P&L)
        const now = new Date()
        const pnlMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        const pnl = await fetchProjectPnL(user.id, pnlMonth)
        setPnlData(pnl)
      } else {
        // Month mode
        const [marketing, lastMarketing, sales, stats, top, platforms, syncTime] = await Promise.all([
          fetchMonthlyMarketingStats(user.id, monthOffset),
          fetchMonthlyMarketingStats(user.id, monthOffset - 1),
          fetchMonthlySalesStats(user.id, monthOffset),
          fetchUserStats(user.id),
          fetchTopContent(user.id, 5),
          fetchMonthlyPlatformBreakdown(user.id, monthOffset),
          getLastSyncTime(user.id),
        ])

        if (marketing.data) setMarketingStats(marketing.data)
        if (lastMarketing.data) setLastPeriodMarketing(lastMarketing.data)
        if (sales.data) setSalesStats(sales.data)
        if (stats.data) setUserStats(stats.data)
        if (top.data) setTopContent(top.data)
        if (platforms.data) setPlatformBreakdown(platforms.data)
        if (syncTime) setLastSyncTime(syncTime)
        // Funnel metrics are weekly, so we show null for month view
        setFunnelMetrics(null)

        // Fetch P&L for the selected month
        const d = new Date()
        d.setMonth(d.getMonth() + monthOffset)
        const pnlMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
        const pnl = await fetchProjectPnL(user.id, pnlMonth)
        setPnlData(pnl)
      }
    } catch (err) {
      console.error('Error loading reports:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleForceSync() {
    setSyncing(true)
    try {
      await forceCRMSync(user.id)
      await loadReports()
    } catch (err) {
      console.error('Error forcing sync:', err)
    } finally {
      setSyncing(false)
    }
  }

  const periodGrade = useMemo(() => {
    return calculateWeeklyGrade(marketingStats, salesStats, userStats)
  }, [marketingStats, salesStats, userStats])

  const comparison = useMemo(() => {
    if (!marketingStats || !lastPeriodMarketing) return null
    return compareWeeks(marketingStats, lastPeriodMarketing)
  }, [marketingStats, lastPeriodMarketing])

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

  function formatSyncTime(timestamp) {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays}d ago`
  }

  // Navigate period
  function handlePrevPeriod() {
    if (viewMode === 'week') {
      setWeekOffset(prev => prev - 1)
    } else {
      setMonthOffset(prev => prev - 1)
    }
  }

  function handleNextPeriod() {
    if (viewMode === 'week') {
      setWeekOffset(prev => Math.min(0, prev + 1))
    } else {
      setMonthOffset(prev => Math.min(0, prev + 1))
    }
  }

  const canGoNext = viewMode === 'week' ? weekOffset < 0 : monthOffset < 0

  // Export functions
  function handleExportPDF() {
    window.print()
  }

  function handleExportCSV() {
    const rows = [
      ['FindMyFlow CRM Report'],
      ['Period', periodRange.label],
      ['Generated', new Date().toLocaleString()],
      [''],
      ['Overall Performance'],
      ['Grade', periodGrade.grade.letter],
      ['Score', `${periodGrade.overall}%`],
      [''],
      ['Score Breakdown'],
      ['Task Completion', `${periodGrade.breakdown.taskCompletion.score}%`],
      ['Engagement', `${periodGrade.breakdown.engagement.score}%`],
      ['Sales Activity', `${periodGrade.breakdown.salesActivity.score}%`],
      ['Consistency', `${periodGrade.breakdown.consistency.score}%`],
      [''],
      ['Marketing Performance'],
      ['Tasks Completed', `${marketingStats?.completedTasks || 0}/${marketingStats?.totalTasks || 0}`],
      ['Points Earned', marketingStats?.pointsEarned || 0],
      ['Total Engagement', marketingStats?.totalEngagement || 0],
      ['Days Active', marketingStats?.daysActive || 0],
      ['Likes', marketingStats?.totalLikes || 0],
      ['Comments', marketingStats?.totalComments || 0],
      ['Shares', marketingStats?.totalShares || 0],
      ['DMs', marketingStats?.totalDMs || 0],
      [''],
      ['Sales Performance'],
      ['Deals Created', salesStats?.dealsCreated || 0],
      ['Deals Won', salesStats?.dealsWon || 0],
      ['Revenue', `$${(salesStats?.revenueThisWeek || salesStats?.revenueThisPeriod || 0).toLocaleString()}`],
      ['Pipeline Value', `$${(salesStats?.pipelineValue || 0).toLocaleString()}`],
    ]

    // Add funnel metrics if available
    if (funnelMetrics) {
      rows.push([''])
      rows.push(['Funnel Metrics'])
      rows.push(['Awareness', funnelMetrics.awareness || 0])
      rows.push(['Attraction', funnelMetrics.attraction || 0])
      rows.push(['Lead Magnet', funnelMetrics.leadmagnet || 0])
      rows.push(['Nurture', funnelMetrics.nurture || 0])
      rows.push(['Core Sales', funnelMetrics.core || 0])
      rows.push(['Upsells', funnelMetrics.upsell || 0])
      rows.push(['Downsells', funnelMetrics.downsell || 0])
      rows.push(['Continuity', funnelMetrics.continuity || 0])
      rows.push(['Funnel Revenue', `$${(funnelMetrics.total_revenue || 0).toLocaleString()}`])
    }

    // Add P&L if available
    if (pnlData.length > 0) {
      const totals = aggregatePnL(pnlData)
      rows.push([''])
      rows.push(['Profit & Loss'])
      rows.push(['Total Revenue', `$${totals.revenue.toLocaleString()}`])
      rows.push(['Total Expenses', `$${totals.expenses.toLocaleString()}`])
      rows.push(['Net Profit', `$${totals.profit.toLocaleString()}`])
      rows.push(['Total Hours', totals.totalHours])
      rows.push(['$/Hour', totals.profitPerHour > 0 ? `$${totals.profitPerHour}` : 'N/A'])
      rows.push([''])
      rows.push(['Project', 'Revenue', 'Expenses', 'Profit', 'Hours'])
      pnlData.forEach(p => {
        rows.push([p.projectName, `$${p.revenue}`, `$${p.expenses}`, `$${p.profit}`, p.totalHours])
      })
    }

    // Add platform breakdown if available
    if (platformBreakdown?.breakdown?.length > 0) {
      rows.push([''])
      rows.push(['Platform Breakdown'])
      rows.push(['Platform', 'Engagement', 'Leads', 'Revenue'])
      platformBreakdown.breakdown.forEach(p => {
        rows.push([p.platform, p.totalEngagement, p.leadsGenerated, `$${p.revenue.toLocaleString()}`])
      })
    }

    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `findmyflow-report-${viewMode}-${periodRange.label.replace(/\s/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="reports-page">
        <div className="reports-toolbar">
          <button className="reports-toolbar-back" onClick={() => navigate('/crm')}>←</button>
          <h2 className="reports-toolbar-title">Reports</h2>
        </div>
        <div className="reports-loading">
          <div className="reports-spinner"></div>
          <p>Crunching your numbers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="reports-page">
      <div className="reports-toolbar">
        <button className="reports-toolbar-back" onClick={() => navigate('/crm')}>←</button>
        <h2 className="reports-toolbar-title">Reports</h2>
      </div>

      {/* Controls Bar */}
      <div className="reports-controls">
        {/* View Mode Toggle */}
        <div className="view-mode-toggle">
          <button
            className={viewMode === 'week' ? 'active' : ''}
            onClick={() => setViewMode('week')}
          >
            Week
          </button>
          <button
            className={viewMode === 'month' ? 'active' : ''}
            onClick={() => setViewMode('month')}
          >
            Month
          </button>
        </div>

        {/* Period Navigation */}
        <div className="period-nav">
          <button className="period-btn" onClick={handlePrevPeriod}>
            ← Previous
          </button>
          <span className="period-label">{periodRange.label}</span>
          <button
            className="period-btn"
            onClick={handleNextPeriod}
            disabled={!canGoNext}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Overall Grade */}
      <div className="grade-card">
        <div className="grade-display">
          <span className="grade-emoji">{periodGrade.grade.emoji}</span>
          <span className="grade-letter">{periodGrade.grade.letter}</span>
        </div>
        <div className="grade-info">
          <span className="grade-score">{periodGrade.overall}%</span>
          <span className="grade-label">Overall Score</span>
        </div>
      </div>

      {/* Grade Breakdown */}
      <section className="reports-section">
        <h2>Score Breakdown</h2>
        <div className="breakdown-grid">
          {Object.entries(periodGrade.breakdown).map(([key, { score, weight }]) => (
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

      {/* Period Comparison */}
      {comparison && (
        <section className="reports-section">
          <h2>vs Last {viewMode === 'week' ? 'Week' : 'Month'}</h2>
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
        <section className="reports-section">
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
              <span className="stat-value">{marketingStats.daysActive}/{viewMode === 'week' ? 5 : 20}</span>
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
        <section className="reports-section">
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
              <span className="stat-value">${(salesStats.revenueThisWeek || salesStats.revenueThisPeriod || 0).toLocaleString()}</span>
              <span className="stat-label">Revenue</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">${salesStats.pipelineValue.toLocaleString()}</span>
              <span className="stat-label">Pipeline</span>
            </div>
          </div>
        </section>
      )}

      {/* Profit & Loss */}
      {pnlData.length > 0 && (() => {
        const totals = aggregatePnL(pnlData)
        return (
          <section className="reports-section">
            <h2>Profit & Loss</h2>
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-value">${totals.revenue.toLocaleString()}</span>
                <span className="stat-label">Revenue</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">${totals.expenses.toLocaleString()}</span>
                <span className="stat-label">Expenses</span>
              </div>
              <div className={`stat-box ${totals.profit >= 0 ? 'highlight' : ''}`}>
                <span className={`stat-value ${totals.profit >= 0 ? 'positive' : 'negative'}`}>
                  ${Math.abs(totals.profit).toLocaleString()}
                </span>
                <span className="stat-label">Net {totals.profit >= 0 ? 'Profit' : 'Loss'}</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">
                  {totals.totalHours > 0 ? `$${totals.profitPerHour}` : '—'}
                </span>
                <span className="stat-label">$/Hour</span>
              </div>
            </div>

            {/* Per-project breakdown */}
            {pnlData.length > 1 && (
              <div className="pnl-projects">
                {pnlData.map(p => (
                  <div key={p.projectId} className="pnl-project-card">
                    <span className="pnl-project-name">{p.projectName}</span>
                    <div className="pnl-project-nums">
                      <span className="pnl-project-revenue">${p.revenue.toLocaleString()}</span>
                      <span className="pnl-project-sep">-</span>
                      <span className="pnl-project-expense">${p.expenses.toLocaleString()}</span>
                      <span className="pnl-project-sep">=</span>
                      <span className={`pnl-project-profit ${p.profit >= 0 ? 'positive' : 'negative'}`}>
                        ${Math.abs(p.profit).toLocaleString()}
                      </span>
                      {p.totalHours > 0 && (
                        <span className="pnl-project-hours">{p.totalHours}h</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      })()}

      {/* Funnel Metrics (Week view only) */}
      {funnelMetrics && viewMode === 'week' && (
        <section className="reports-section">
          <div className="section-header-row">
            <h2>Funnel Metrics</h2>
            <div className="sync-info">
              <span className="sync-time">Synced: {formatSyncTime(lastSyncTime)}</span>
              <button
                className="sync-btn"
                onClick={handleForceSync}
                disabled={syncing}
              >
                {syncing ? '↻' : '⟳'} Sync
              </button>
            </div>
          </div>
          <div className="funnel-visual">
            <div className="funnel-stage">
              <div className="funnel-bar" style={{ width: '100%' }}>
                <span className="funnel-label">Awareness</span>
                <span className="funnel-value">{funnelMetrics.awareness || 0}</span>
              </div>
            </div>
            <div className="funnel-stage">
              <div className="funnel-bar" style={{ width: '85%' }}>
                <span className="funnel-label">Attraction</span>
                <span className="funnel-value">{funnelMetrics.attraction || 0}</span>
              </div>
            </div>
            <div className="funnel-stage">
              <div className="funnel-bar" style={{ width: '70%' }}>
                <span className="funnel-label">Lead Magnet</span>
                <span className="funnel-value">{funnelMetrics.leadmagnet || 0}</span>
              </div>
            </div>
            <div className="funnel-stage">
              <div className="funnel-bar" style={{ width: '55%' }}>
                <span className="funnel-label">Nurture</span>
                <span className="funnel-value">{funnelMetrics.nurture || 0}</span>
              </div>
            </div>
            <div className="funnel-stage">
              <div className="funnel-bar highlight" style={{ width: '40%' }}>
                <span className="funnel-label">Core Sales</span>
                <span className="funnel-value">{funnelMetrics.core || 0}</span>
              </div>
            </div>
          </div>
          <div className="funnel-extras">
            <div className="funnel-extra">
              <span className="extra-label">Upsells</span>
              <span className="extra-value">{funnelMetrics.upsell || 0}</span>
            </div>
            <div className="funnel-extra">
              <span className="extra-label">Downsells</span>
              <span className="extra-value">{funnelMetrics.downsell || 0}</span>
            </div>
            <div className="funnel-extra">
              <span className="extra-label">Continuity</span>
              <span className="extra-value">{funnelMetrics.continuity || 0}</span>
            </div>
            <div className="funnel-extra highlight">
              <span className="extra-label">Revenue</span>
              <span className="extra-value">${(funnelMetrics.total_revenue || 0).toLocaleString()}</span>
            </div>
          </div>
          {funnelMetrics.sources && (
            <div className="funnel-sources">
              {funnelMetrics.sources.manual && (
                <span className="source-badge manual">Manual entry</span>
              )}
              {funnelMetrics.sources.crm && (
                <span className="source-badge crm">CRM sync</span>
              )}
            </div>
          )}
        </section>
      )}

      {/* Platform Breakdown */}
      {platformBreakdown && platformBreakdown.breakdown.length > 0 && (
        <section className="reports-section">
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
        <section className="reports-section">
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

      {/* Export Actions */}
      <section className="reports-section export-section">
        <h2>Export Report</h2>
        <p className="section-subtitle">Download your {viewMode}ly report</p>
        <div className="export-actions">
          <button className="export-btn pdf" onClick={handleExportPDF}>
            <span className="export-icon">📄</span>
            <span className="export-text">Download PDF</span>
          </button>
          <button className="export-btn csv" onClick={handleExportCSV}>
            <span className="export-icon">📊</span>
            <span className="export-text">Download CSV</span>
          </button>
        </div>
      </section>
    </div>
  )
}
