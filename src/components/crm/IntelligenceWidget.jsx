/**
 * Intelligence Widget
 * Dashboard widget showing performance insights and recommendations
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import {
  getIntelligenceSummary,
  getQuickStats,
  INDUSTRY_BENCHMARKS
} from '../../lib/intelligenceEngine'
import { getVoiceFeedbackInsights } from '../../lib/voiceProfile'
import './IntelligenceWidget.css'

export default function IntelligenceWidget({ expanded = false }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [quickStats, setQuickStats] = useState(null)
  const [voiceFeedback, setVoiceFeedback] = useState(null)
  const [showDetails, setShowDetails] = useState(expanded)

  useEffect(() => {
    if (user?.id) {
      loadIntelligence()
    }
  }, [user?.id])

  async function loadIntelligence() {
    setLoading(true)
    try {
      const [summaryData, statsData, feedbackData] = await Promise.all([
        getIntelligenceSummary(user.id),
        getQuickStats(user.id),
        getVoiceFeedbackInsights(user.id)
      ])

      setSummary(summaryData)
      setQuickStats(statsData)
      setVoiceFeedback(feedbackData)
    } catch (err) {
      console.error('Error loading intelligence:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="intelligence-widget">
        {/* Skeleton Header */}
        <div className="iw-header">
          <div className="iw-title">
            <span className="iw-icon">💡</span>
            <h3>Intelligence Insights</h3>
          </div>
        </div>

        {/* Skeleton Stats */}
        <div className="iw-quick-stats iw-skeleton">
          <div className="iw-stat">
            <span className="iw-skeleton-num"></span>
            <span className="iw-stat-label">Posts (30d)</span>
          </div>
          <div className="iw-stat">
            <span className="iw-skeleton-num"></span>
            <span className="iw-stat-label">Stories</span>
          </div>
          <div className="iw-stat">
            <span className="iw-skeleton-num"></span>
            <span className="iw-stat-label">Avg Engagement</span>
          </div>
        </div>

        {/* Skeleton Highlights */}
        <div className="iw-highlights iw-skeleton">
          <div className="iw-skeleton-highlight"></div>
          <div className="iw-skeleton-highlight"></div>
        </div>
      </div>
    )
  }

  const hasPerformanceData = summary?.performance?.hasEnoughData
  const hasConversionData = summary?.conversionRates?.hasEnoughData
  const highlights = summary?.highlights || []
  const recommendations = summary?.performance?.recommendations || []

  return (
    <div className={`intelligence-widget ${showDetails ? 'expanded' : ''}`}>
      {/* Header */}
      <div className="iw-header" onClick={() => setShowDetails(!showDetails)}>
        <div className="iw-title">
          <span className="iw-icon">💡</span>
          <h3>Intelligence Insights</h3>
        </div>
        <button className="iw-toggle">
          {showDetails ? '−' : '+'}
        </button>
      </div>

      {/* Quick Stats Bar */}
      {quickStats && (
        <div className="iw-quick-stats">
          <div className="iw-stat">
            <span className="iw-stat-num">{quickStats.postsLast30Days}</span>
            <span className="iw-stat-label">Posts (30d)</span>
          </div>
          <div className="iw-stat">
            <span className="iw-stat-num">{quickStats.totalStories}</span>
            <span className="iw-stat-label">Stories</span>
          </div>
          {summary?.performance?.avgEngagement > 0 && (
            <div className="iw-stat">
              <span className="iw-stat-num">{summary.performance.avgEngagement}</span>
              <span className="iw-stat-label">Avg Engagement</span>
            </div>
          )}
        </div>
      )}

      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="iw-highlights">
          {highlights.slice(0, 3).map((highlight, i) => (
            <div key={i} className={`iw-highlight ${highlight.type}`}>
              <span className="iw-highlight-icon">{highlight.icon}</span>
              <span className="iw-highlight-text">{highlight.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Voice Feedback Alert */}
      {voiceFeedback?.topIssues?.length > 0 && (
        <div className="iw-voice-feedback">
          <div className="iw-vf-header">
            <span className="iw-vf-icon">🎙️</span>
            <strong>Voice Feedback Applied</strong>
          </div>
          <p className="iw-vf-text">
            AI adjusted based on your feedback:
            {voiceFeedback.topIssues.slice(0, 2).map(([issue, count]) => (
              <span key={issue} className="iw-vf-issue">
                {issue.replace(/_/g, ' ')} ({count}x)
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Expanded Details */}
      {showDetails && (
        <div className="iw-details">
          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="iw-section">
              <h4>Recommendations</h4>
              <div className="iw-recommendations">
                {recommendations.map((rec, i) => (
                  <div key={i} className={`iw-rec ${rec.priority}`}>
                    <span className="iw-rec-icon">{rec.icon}</span>
                    <div className="iw-rec-content">
                      <strong>{rec.title}</strong>
                      <p>{rec.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversion Rates Comparison */}
          {hasConversionData && summary.conversionRates.comparison && (
            <div className="iw-section">
              <h4>Your Funnel vs Industry</h4>
              <div className="iw-funnel-comparison">
                {Object.entries(summary.conversionRates.comparison)
                  .filter(([key]) => key !== 'overall')
                  .slice(0, 4)
                  .map(([key, data]) => (
                    <div key={key} className={`iw-funnel-rate ${data.status}`}>
                      <span className="iw-rate-label">
                        {key.replace(/_/g, ' ').replace('to', '→')}
                      </span>
                      <div className="iw-rate-values">
                        <span className="iw-rate-user">
                          {(data.userRate * 100).toFixed(1)}%
                        </span>
                        <span className="iw-rate-vs">vs</span>
                        <span className="iw-rate-industry">
                          {(data.industryRate * 100).toFixed(1)}%
                        </span>
                        <span className={`iw-rate-diff ${data.status}`}>
                          {data.difference > 0 ? '+' : ''}{data.difference}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Top Performers */}
          {hasPerformanceData && summary.performance.topPerformers?.length > 0 && (
            <div className="iw-section">
              <h4>Top Performers</h4>
              <div className="iw-top-performers">
                {summary.performance.topPerformers.slice(0, 3).map((post, i) => (
                  <div key={i} className="iw-top-post">
                    <span className="iw-top-rank">#{i + 1}</span>
                    <div className="iw-top-content">
                      <span className="iw-top-type">{post.content_type}</span>
                      <span className="iw-top-excerpt">
                        {post.content?.slice(0, 60)}...
                      </span>
                    </div>
                    <span className="iw-top-score">{post.engagementScore}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Data State with CTAs */}
          {!hasPerformanceData && !hasConversionData && (
            <div className="iw-no-data">
              <span className="iw-no-data-icon">📊</span>
              <h4>Unlock Intelligence Insights</h4>
              <p>Track your content performance to get personalized recommendations</p>

              <div className="iw-cta-list">
                <a href="/crm/marketing" className="iw-cta-btn">
                  <span className="iw-cta-icon">📝</span>
                  <div className="iw-cta-content">
                    <strong>Create Content</strong>
                    <span>Post 3+ pieces to see what works</span>
                  </div>
                  <span className="iw-cta-arrow">→</span>
                </a>

                <a href="/crm/content-history" className="iw-cta-btn">
                  <span className="iw-cta-icon">📸</span>
                  <div className="iw-cta-content">
                    <strong>Upload Metrics</strong>
                    <span>Add engagement data via screenshots</span>
                  </div>
                  <span className="iw-cta-arrow">→</span>
                </a>

                <a href="/funnel-calculator" className="iw-cta-btn">
                  <span className="iw-cta-icon">📈</span>
                  <div className="iw-cta-content">
                    <strong>Track Funnel</strong>
                    <span>Get personalized conversion rates</span>
                  </div>
                  <span className="iw-cta-arrow">→</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer hint */}
      {!showDetails && (hasPerformanceData || hasConversionData) && (
        <div className="iw-footer-hint">
          {recommendations.length > 0 && (
            <span>{recommendations.length} recommendation{recommendations.length > 1 ? 's' : ''}</span>
          )}
          <span className="iw-expand-hint">Click to expand</span>
        </div>
      )}
    </div>
  )
}
