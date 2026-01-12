/**
 * Performance Dashboard
 * Analytics and insights for posted content performance
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { getPerformanceMetrics, fetchContentHistory } from '../../lib/contentHistory'
import './PerformanceDashboard.css'

// Platform colors for charts
const PLATFORM_COLORS = {
  instagram: '#E4405F',
  linkedin: '#0A66C2',
  twitter: '#1DA1F2',
  facebook: '#1877F2',
  email: '#6366f1',
  tiktok: '#000000'
}

// Content type icons
const CONTENT_TYPE_ICONS = {
  transformation_story: '✨',
  educational: '📚',
  pain_agitation: '🎯',
  social_proof: '⭐',
  offer_teaser: '🎁'
}

export default function PerformanceDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // State
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(null)
  const [recentPosts, setRecentPosts] = useState([])
  const [timeRange, setTimeRange] = useState(30) // days

  // Load data
  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id, timeRange])

  async function loadData() {
    setLoading(true)

    const [metricsData, { data: posts }] = await Promise.all([
      getPerformanceMetrics(user.id, { days: timeRange }),
      fetchContentHistory(user.id, { status: 'posted', limit: 20 })
    ])

    setMetrics(metricsData)
    setRecentPosts(posts || [])
    setLoading(false)
  }

  // Calculate engagement rate average
  const avgEngagementRate = useMemo(() => {
    if (!recentPosts.length) return 0

    const rates = recentPosts
      .filter(p => p.engagement_data?.engagement_rate)
      .map(p => p.engagement_data.engagement_rate)

    if (!rates.length) return 0
    return (rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(2)
  }, [recentPosts])

  // Calculate week-over-week growth
  const weeklyGrowth = useMemo(() => {
    if (!recentPosts.length) return null

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const thisWeek = recentPosts.filter(p => new Date(p.posted_at) >= oneWeekAgo)
    const lastWeek = recentPosts.filter(p => {
      const d = new Date(p.posted_at)
      return d >= twoWeeksAgo && d < oneWeekAgo
    })

    const thisWeekEngagement = thisWeek.reduce((sum, p) => {
      const e = p.engagement_data || {}
      return sum + (e.likes || 0) + (e.comments || 0) + (e.shares || 0)
    }, 0)

    const lastWeekEngagement = lastWeek.reduce((sum, p) => {
      const e = p.engagement_data || {}
      return sum + (e.likes || 0) + (e.comments || 0) + (e.shares || 0)
    }, 0)

    if (lastWeekEngagement === 0) return null

    const growth = ((thisWeekEngagement - lastWeekEngagement) / lastWeekEngagement) * 100
    return growth.toFixed(1)
  }, [recentPosts])

  // Find best performing platform
  const bestPlatform = useMemo(() => {
    if (!metrics?.byPlatform) return null

    let best = null
    let highestAvg = 0

    Object.entries(metrics.byPlatform).forEach(([platform, data]) => {
      const avg = (data.likes + data.comments * 2) / data.count
      if (avg > highestAvg) {
        highestAvg = avg
        best = { platform, ...data, avgEngagement: avg.toFixed(1) }
      }
    })

    return best
  }, [metrics])

  // Find best content type
  const bestContentType = useMemo(() => {
    if (!metrics?.byContentType) return null

    let best = null
    let highestAvg = 0

    Object.entries(metrics.byContentType).forEach(([type, data]) => {
      const avg = (data.likes + data.comments * 2) / data.count
      if (avg > highestAvg) {
        highestAvg = avg
        best = { type, ...data, avgEngagement: avg.toFixed(1) }
      }
    })

    return best
  }, [metrics])

  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num?.toString() || '0'
  }

  function truncate(text, max = 100) {
    if (!text || text.length <= max) return text
    return text.substring(0, max) + '...'
  }

  if (loading) {
    return (
      <div className="pd-container">
        <div className="pd-loading">
          <div className="pd-loading-spinner" />
          <p>Loading performance data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pd-container">
      {/* Header */}
      <div className="pd-header">
        <div className="pd-header-left">
          <button className="pd-back-btn" onClick={() => navigate('/crm/marketing')}>
            ← Back
          </button>
          <div>
            <h1 className="pd-title">Performance Dashboard</h1>
            <p className="pd-subtitle">Track your content performance and insights</p>
          </div>
        </div>

        <div className="pd-time-selector">
          <button
            className={`pd-time-btn ${timeRange === 7 ? 'active' : ''}`}
            onClick={() => setTimeRange(7)}
          >
            7 Days
          </button>
          <button
            className={`pd-time-btn ${timeRange === 30 ? 'active' : ''}`}
            onClick={() => setTimeRange(30)}
          >
            30 Days
          </button>
          <button
            className={`pd-time-btn ${timeRange === 90 ? 'active' : ''}`}
            onClick={() => setTimeRange(90)}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="pd-metrics-grid">
        <div className="pd-metric-card pd-metric-primary">
          <div className="pd-metric-icon">📊</div>
          <div className="pd-metric-content">
            <span className="pd-metric-value">{metrics?.totalPosts || 0}</span>
            <span className="pd-metric-label">Posts Tracked</span>
          </div>
        </div>

        <div className="pd-metric-card">
          <div className="pd-metric-icon">❤️</div>
          <div className="pd-metric-content">
            <span className="pd-metric-value">{formatNumber(metrics?.averages?.likes || 0)}</span>
            <span className="pd-metric-label">Avg Likes</span>
          </div>
        </div>

        <div className="pd-metric-card">
          <div className="pd-metric-icon">💬</div>
          <div className="pd-metric-content">
            <span className="pd-metric-value">{formatNumber(metrics?.averages?.comments || 0)}</span>
            <span className="pd-metric-label">Avg Comments</span>
          </div>
        </div>

        <div className="pd-metric-card">
          <div className="pd-metric-icon">🔄</div>
          <div className="pd-metric-content">
            <span className="pd-metric-value">{formatNumber(metrics?.averages?.shares || 0)}</span>
            <span className="pd-metric-label">Avg Shares</span>
          </div>
        </div>

        <div className="pd-metric-card pd-metric-highlight">
          <div className="pd-metric-icon">📈</div>
          <div className="pd-metric-content">
            <span className="pd-metric-value">{avgEngagementRate}%</span>
            <span className="pd-metric-label">Avg Engagement Rate</span>
          </div>
        </div>

        {weeklyGrowth !== null && (
          <div className={`pd-metric-card ${parseFloat(weeklyGrowth) >= 0 ? 'pd-metric-positive' : 'pd-metric-negative'}`}>
            <div className="pd-metric-icon">{parseFloat(weeklyGrowth) >= 0 ? '📈' : '📉'}</div>
            <div className="pd-metric-content">
              <span className="pd-metric-value">
                {parseFloat(weeklyGrowth) >= 0 ? '+' : ''}{weeklyGrowth}%
              </span>
              <span className="pd-metric-label">Week-over-Week</span>
            </div>
          </div>
        )}
      </div>

      {/* Insights Row */}
      <div className="pd-insights-row">
        {/* Best Platform */}
        {bestPlatform && (
          <div className="pd-insight-card">
            <div className="pd-insight-header">
              <span className="pd-insight-icon">🏆</span>
              <h3>Best Platform</h3>
            </div>
            <div className="pd-insight-content">
              <span
                className="pd-platform-badge"
                style={{ backgroundColor: PLATFORM_COLORS[bestPlatform.platform] + '20',
                         color: PLATFORM_COLORS[bestPlatform.platform] }}
              >
                {bestPlatform.platform}
              </span>
              <div className="pd-insight-stats">
                <span>{bestPlatform.avgEngagement} avg engagement</span>
                <span>{bestPlatform.count} posts</span>
              </div>
            </div>
          </div>
        )}

        {/* Best Content Type */}
        {bestContentType && (
          <div className="pd-insight-card">
            <div className="pd-insight-header">
              <span className="pd-insight-icon">⭐</span>
              <h3>Top Content Type</h3>
            </div>
            <div className="pd-insight-content">
              <span className="pd-type-badge">
                {CONTENT_TYPE_ICONS[bestContentType.type] || '📝'} {bestContentType.type.replace(/_/g, ' ')}
              </span>
              <div className="pd-insight-stats">
                <span>{bestContentType.avgEngagement} avg engagement</span>
                <span>{bestContentType.count} posts</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Tip */}
        <div className="pd-insight-card pd-insight-tip">
          <div className="pd-insight-header">
            <span className="pd-insight-icon">💡</span>
            <h3>Quick Tip</h3>
          </div>
          <div className="pd-insight-content">
            <p className="pd-tip-text">
              {bestPlatform && bestContentType
                ? `Try posting more ${bestContentType.type.replace(/_/g, ' ')} content on ${bestPlatform.platform} - it's your winning combination!`
                : 'Upload metrics screenshots to start tracking your content performance.'}
            </p>
          </div>
        </div>
      </div>

      {/* Platform Breakdown */}
      {metrics?.byPlatform && Object.keys(metrics.byPlatform).length > 0 && (
        <div className="pd-section">
          <h2 className="pd-section-title">Platform Breakdown</h2>
          <div className="pd-platform-grid">
            {Object.entries(metrics.byPlatform).map(([platform, data]) => (
              <div key={platform} className="pd-platform-card">
                <div
                  className="pd-platform-header"
                  style={{ borderLeftColor: PLATFORM_COLORS[platform] || '#6366f1' }}
                >
                  <span className="pd-platform-name">{platform}</span>
                  <span className="pd-platform-count">{data.count} posts</span>
                </div>
                <div className="pd-platform-stats">
                  <div className="pd-platform-stat">
                    <span className="pd-stat-value">{formatNumber(data.likes)}</span>
                    <span className="pd-stat-label">Likes</span>
                  </div>
                  <div className="pd-platform-stat">
                    <span className="pd-stat-value">{formatNumber(data.comments)}</span>
                    <span className="pd-stat-label">Comments</span>
                  </div>
                  <div className="pd-platform-stat">
                    <span className="pd-stat-value">{formatNumber(data.shares)}</span>
                    <span className="pd-stat-label">Shares</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performers */}
      {metrics?.topPerformers && metrics.topPerformers.length > 0 && (
        <div className="pd-section">
          <h2 className="pd-section-title">Top Performing Content</h2>
          <div className="pd-top-performers">
            {metrics.topPerformers.map((post, index) => (
              <div key={post.id} className="pd-performer-card">
                <div className="pd-performer-rank">#{index + 1}</div>
                <div className="pd-performer-content">
                  <div className="pd-performer-header">
                    <span
                      className="pd-performer-platform"
                      style={{ color: PLATFORM_COLORS[post.platform] }}
                    >
                      {post.platform}
                    </span>
                    <span className="pd-performer-date">
                      {new Date(post.posted_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="pd-performer-text">{truncate(post.content)}</p>
                  <div className="pd-performer-metrics">
                    <span>❤️ {post.engagement_data?.likes || 0}</span>
                    <span>💬 {post.engagement_data?.comments || 0}</span>
                    <span>🔄 {post.engagement_data?.shares || 0}</span>
                    <span>📌 {post.engagement_data?.saves || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!metrics || metrics.totalPosts === 0) && (
        <div className="pd-empty">
          <div className="pd-empty-icon">📊</div>
          <h3>No Performance Data Yet</h3>
          <p>Start tracking your content performance by uploading metrics screenshots.</p>
          <button
            className="pd-btn pd-btn-primary"
            onClick={() => navigate('/crm/content-history')}
          >
            Go to Content History
          </button>
        </div>
      )}
    </div>
  )
}
