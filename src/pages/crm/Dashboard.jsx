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
  fetchPendingRecommendations,
  dismissRecommendation,
  markRecommendationActed,
} from '../../lib/crm'
import { getImplementationStats } from '../../lib/crm/implementationService'
import { supabase } from '../../lib/supabaseClient'
import { ProjectSwitcher, DailyPriorities, IntelligenceWidget, NervousSystemWidget } from '../../components/crm'
import { ACTIVE_STAGES, STAGE_INFO } from '../../lib/crm'
import { getMonthlyProgress, getGiveAskAnalytics } from '../../lib/intelligenceEngine'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [deals, setDeals] = useState([])
  const [marketingStats, setMarketingStats] = useState(null)
  const [implStats, setImplStats] = useState(null)
  const [autonomousProgress, setAutonomousProgress] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [contentProgress, setContentProgress] = useState(null)
  const [giveAskStats, setGiveAskStats] = useState(null)
  const [currentProject, setCurrentProject] = useState(() => {
    // Restore from localStorage if available
    const saved = localStorage.getItem('crm_current_project')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    }
  }, [user?.id, currentProject?.id])

  // Persist project selection
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('crm_current_project', JSON.stringify(currentProject))
    }
  }, [currentProject])

  async function loadDashboardData() {
    setLoading(true)
    try {
      const [statsResult, dealsResult, marketingResult, implStatsResult, autonomousResult, recsResult, progressResult, giveAskResult] = await Promise.all([
        fetchUserStats(user.id),
        fetchDeals(user.id),
        fetchWeeklyMarketingStats(user.id),
        getImplementationStats(user.id, currentProject?.id),
        supabase
          .from('autonomous_setup_progress')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        fetchPendingRecommendations(user.id),
        getMonthlyProgress(user.id),
        getGiveAskAnalytics(user.id),
      ])

      if (statsResult.data) setStats(statsResult.data)
      if (dealsResult.data) setDeals(dealsResult.data)
      if (marketingResult.data) setMarketingStats(marketingResult.data)
      setImplStats(implStatsResult)
      if (autonomousResult.data) setAutonomousProgress(autonomousResult.data)
      if (recsResult.data) setRecommendations(recsResult.data.slice(0, 2)) // Top 2 for dashboard
      if (progressResult) setContentProgress(progressResult)
      if (giveAskResult) setGiveAskStats(giveAskResult)
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
        <div className="header-top">
          <ProjectSwitcher
            userId={user?.id}
            currentProject={currentProject}
            onProjectChange={setCurrentProject}
          />
          <h1>Command Center</h1>
        </div>
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

      {/* Daily Priorities - "Here's what to do today" */}
      <DailyPriorities userId={user?.id} />

      {/* Intelligence Insights */}
      <IntelligenceWidget />

      {/* Nervous System Patterns */}
      <NervousSystemWidget />

      {/* Content Progress Bar */}
      {contentProgress && (
        <section className="crm-section content-progress-section">
          <h2>Monthly Content Progress</h2>
          <div className="content-progress-grid">
            {/* Posts Progress */}
            <div className="progress-card">
              <div className="progress-header">
                <span className="progress-icon">📝</span>
                <span className="progress-label">Posts This Month</span>
              </div>
              <div className="progress-stats">
                <span className="progress-current">{contentProgress.posts.current}</span>
                <span className="progress-divider">/</span>
                <span className="progress-target">{contentProgress.posts.target}</span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${contentProgress.posts.percentage}%`,
                    background: contentProgress.posts.percentage >= 80
                      ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                      : contentProgress.posts.percentage >= 50
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        : 'linear-gradient(90deg, #ef4444, #f87171)'
                  }}
                />
              </div>
              <span className="progress-percentage">{contentProgress.posts.percentage}%</span>
            </div>

            {/* Reach Progress */}
            <div className="progress-card">
              <div className="progress-header">
                <span className="progress-icon">👁️</span>
                <span className="progress-label">Estimated Reach</span>
              </div>
              <div className="progress-stats">
                <span className="progress-current">{contentProgress.reach.current.toLocaleString()}</span>
                <span className="progress-divider">/</span>
                <span className="progress-target">{contentProgress.reach.target.toLocaleString()}</span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${contentProgress.reach.percentage}%`,
                    background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)'
                  }}
                />
              </div>
              <span className="progress-percentage">{contentProgress.reach.percentage}%</span>
            </div>

            {/* Give/Ask Ratio */}
            {giveAskStats?.hasData && (
              <div className="progress-card give-ask-card">
                <div className="progress-header">
                  <span className="progress-icon">⚖️</span>
                  <span className="progress-label">Give vs Ask Ratio</span>
                </div>
                <div className="give-ask-bar">
                  <div
                    className="give-portion"
                    style={{ width: `${giveAskStats.ratio.give.percentage}%` }}
                  >
                    <span>🎁 {giveAskStats.ratio.give.percentage}%</span>
                  </div>
                  <div
                    className="ask-portion"
                    style={{ width: `${giveAskStats.ratio.ask.percentage}%` }}
                  >
                    <span>💰 {giveAskStats.ratio.ask.percentage}%</span>
                  </div>
                </div>
                <span className={`ratio-status ${giveAskStats.ratio.isBalanced ? 'balanced' : 'unbalanced'}`}>
                  {giveAskStats.ratio.isBalanced ? '✓ Balanced' : 'Adjust ratio'}
                </span>
              </div>
            )}

            {/* Days Remaining */}
            <div className="progress-card days-card">
              <div className="progress-header">
                <span className="progress-icon">📅</span>
                <span className="progress-label">Days Left</span>
              </div>
              <div className="days-remaining">
                <span className="days-number">{contentProgress.daysRemaining}</span>
                <span className="days-text">days remaining</span>
              </div>
            </div>
          </div>
        </section>
      )}

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

      {/* Autonomous AI Setup Banner */}
      {(() => {
        const completedCount = autonomousProgress
          ? [
              autonomousProgress.business_baseline_completed,
              autonomousProgress.customer_segments_completed,
              autonomousProgress.competitor_snapshot_completed,
            ].filter(Boolean).length
          : 0
        const isComplete = completedCount === 3
        const dataReadiness = 70 + (completedCount * 6)

        if (isComplete) {
          return (
            <section className="ai-setup-banner complete" onClick={() => navigate('/crm/setup')}>
              <div className="ai-setup-content">
                <div className="ai-setup-icon">✅</div>
                <div className="ai-setup-text">
                  <h3>AI System Ready - {dataReadiness}%</h3>
                  <p>Your autonomous AI has the data it needs</p>
                </div>
              </div>
              <div className="ai-setup-cta">
                <span className="ai-setup-status">View Details →</span>
              </div>
            </section>
          )
        }

        if (completedCount > 0) {
          return (
            <section className="ai-setup-banner in-progress" onClick={() => navigate('/crm/setup')}>
              <div className="ai-setup-content">
                <div className="ai-setup-icon">🤖</div>
                <div className="ai-setup-text">
                  <h3>AI Setup {completedCount}/3 Complete</h3>
                  <p>{dataReadiness}% ready - {3 - completedCount} flow{3 - completedCount !== 1 ? 's' : ''} remaining</p>
                </div>
              </div>
              <div className="ai-setup-cta">
                <span className="ai-setup-progress-bar">
                  <span style={{ width: `${(completedCount / 3) * 100}%` }}></span>
                </span>
                <span className="ai-setup-arrow">→</span>
              </div>
            </section>
          )
        }

        return (
          <section className="ai-setup-banner" onClick={() => navigate('/crm/setup')}>
            <div className="ai-setup-content">
              <div className="ai-setup-icon">🤖</div>
              <div className="ai-setup-text">
                <h3>Setup Your Autonomous AI</h3>
                <p>Answer 8 questions to unlock AI that runs your business</p>
              </div>
            </div>
            <div className="ai-setup-cta">
              <span className="ai-setup-time">~8 min</span>
              <span className="ai-setup-arrow">→</span>
            </div>
          </section>
        )
      })()}

      {/* AI Recommendations Banner */}
      {recommendations.length > 0 && (
        <section className="recommendations-banner">
          <div className="rec-banner-header">
            <h2>🤖 AI Recommendations</h2>
            <button
              className="rec-banner-see-all"
              onClick={() => navigate('/crm/alerts')}
            >
              See All →
            </button>
          </div>
          <div className="rec-banner-cards">
            {recommendations.map(rec => (
              <div key={rec.id} className={`rec-banner-card priority-${rec.priority}`}>
                <div className="rec-banner-content">
                  <span className="rec-banner-category">{rec.category}</span>
                  <h3>{rec.title}</h3>
                  <p>{rec.description}</p>
                </div>
                <div className="rec-banner-actions">
                  <button
                    className="rec-banner-action-btn"
                    onClick={() => {
                      markRecommendationActed(rec.id, user.id)
                      if (rec.action_url) navigate(rec.action_url)
                    }}
                  >
                    {rec.action_text} →
                  </button>
                  <button
                    className="rec-banner-dismiss"
                    onClick={(e) => {
                      e.stopPropagation()
                      dismissRecommendation(rec.id, user.id)
                      setRecommendations(prev => prev.filter(r => r.id !== rec.id))
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
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
            {recommendations.length > 0 && (
              <span className="action-badge">{recommendations.length}</span>
            )}
          </button>
          <button
            className="action-btn impl-btn"
            onClick={() => navigate('/crm/implementations')}
          >
            <span className="action-icon">📋</span>
            <span className="action-text">Implementations</span>
          </button>
          <button
            className="action-btn assets-btn"
            onClick={() => navigate('/crm/assets')}
          >
            <span className="action-icon">📚</span>
            <span className="action-text">Content Library</span>
          </button>
          <button
            className="action-btn ascension-btn"
            onClick={() => navigate('/crm/ascension')}
          >
            <span className="action-icon">🚀</span>
            <span className="action-text">Value Ladder</span>
          </button>
          <button
            className="action-btn objections-btn"
            onClick={() => navigate('/crm/objections')}
          >
            <span className="action-icon">📊</span>
            <span className="action-text">Win/Loss Patterns</span>
          </button>
        </div>
      </section>

      {/* Implementations Section */}
      {implStats && (implStats.total > 0 || implStats.currentFocus) && (
        <section className="crm-section">
          <div className="section-header">
            <h2>Implementations</h2>
            <button
              className="section-link"
              onClick={() => navigate('/crm/implementations')}
            >
              View All →
            </button>
          </div>
          <div className="impl-summary-card">
            {implStats.currentFocus ? (
              <div className="impl-focus">
                <div className="impl-focus-header">
                  <span className="impl-focus-label">Current Focus</span>
                  <span className="impl-focus-title">
                    {implStats.currentFocus.offer_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                <div className="impl-focus-progress">
                  <div className="impl-progress-bar">
                    <div
                      className="impl-progress-fill"
                      style={{ width: `${implStats.currentFocus.progressPercentage}%` }}
                    ></div>
                  </div>
                  <span className="impl-progress-text">
                    {implStats.currentFocus.progressPercentage}% complete
                  </span>
                </div>
                <button
                  className="impl-continue-btn"
                  onClick={() => navigate(`/crm/implementations?id=${implStats.currentFocus.id}`)}
                >
                  Continue →
                </button>
              </div>
            ) : (
              <div className="impl-empty-prompt">
                <span className="impl-empty-icon">📋</span>
                <p>No active implementations</p>
                <button
                  className="impl-start-btn"
                  onClick={() => navigate('/money-model-guide')}
                >
                  Start Your First
                </button>
              </div>
            )}
            <div className="impl-stats-row">
              <div className="impl-stat">
                <span className="impl-stat-value">{implStats.inProgress}</span>
                <span className="impl-stat-label">In Progress</span>
              </div>
              <div className="impl-stat">
                <span className="impl-stat-value">{implStats.completed}</span>
                <span className="impl-stat-label">Completed</span>
              </div>
              <div className="impl-stat">
                <span className="impl-stat-value">{implStats.total}</span>
                <span className="impl-stat-label">Total</span>
              </div>
            </div>
          </div>
        </section>
      )}

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
        <div className="pipeline-summary-v2">
          {[...ACTIVE_STAGES, 'won'].map((stage, idx, arr) => (
            <div key={stage} className="pipeline-stage-group">
              <div
                className={`pipeline-stage ${stage}`}
                style={{ borderTopColor: STAGE_INFO[stage]?.color }}
              >
                <span className="stage-name">{STAGE_INFO[stage]?.label || stage}</span>
                <span className="stage-count">
                  {deals.filter(d => d.status === stage).length}
                </span>
              </div>
              {idx < arr.length - 1 && <span className="pipeline-arrow">→</span>}
            </div>
          ))}
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
