/**
 * Objection Pattern Dashboard
 * Visualizes win/loss reasons captured from DealOutcomeModal
 * Helps identify patterns and improve close rates
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { fetchDealOutcomes, getDealOutcomeStats } from '../../lib/crm/dealService'
import './ObjectionPatterns.css'

const LOSS_REASON_LABELS = {
  price: 'Price too high',
  timing: 'Bad timing',
  competitor: 'Went with competitor',
  no_decision: 'No decision made',
  fit: 'Not a fit',
  trust: 'Trust issues',
}

const WIN_REASON_LABELS = {
  timing: 'Right timing',
  value: 'Clear value',
  trust: 'Built trust',
  offer: 'Irresistible offer',
  urgency: 'Urgency',
  referral: 'Strong referral',
}

export default function ObjectionPatterns() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [outcomes, setOutcomes] = useState([])
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'losses', 'wins'

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  async function loadData() {
    setLoading(true)
    try {
      const [statsResult, outcomesResult] = await Promise.all([
        getDealOutcomeStats(user.id),
        fetchDealOutcomes(user.id, { limit: 50 }),
      ])

      setStats(statsResult)
      setOutcomes(outcomesResult.data || [])
    } catch (err) {
      console.error('Error loading objection data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="objection-patterns loading">
        <div className="op-spinner"></div>
        <p>Loading patterns...</p>
      </div>
    )
  }

  const losses = outcomes.filter(o => o.outcome === 'lost')
  const wins = outcomes.filter(o => o.outcome === 'won')

  return (
    <div className="objection-patterns">
      <header className="op-header">
        <div className="op-title-section">
          <h1>Win/Loss Patterns</h1>
          <p className="op-subtitle">Understand why deals close or don't</p>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="op-summary">
        <div className="summary-card wins">
          <span className="summary-icon">🏆</span>
          <div className="summary-content">
            <span className="summary-value">{wins.length}</span>
            <span className="summary-label">Deals Won</span>
          </div>
        </div>
        <div className="summary-card losses">
          <span className="summary-icon">📊</span>
          <div className="summary-content">
            <span className="summary-value">{losses.length}</span>
            <span className="summary-label">Deals Lost</span>
          </div>
        </div>
        <div className="summary-card rate">
          <span className="summary-icon">📈</span>
          <div className="summary-content">
            <span className="summary-value">
              {outcomes.length > 0 ? Math.round((wins.length / outcomes.length) * 100) : 0}%
            </span>
            <span className="summary-label">Win Rate</span>
          </div>
        </div>
      </div>

      {outcomes.length === 0 ? (
        <div className="op-empty-state">
          <span className="empty-icon">📋</span>
          <h3>No Data Yet</h3>
          <p>When you close deals as Won or Lost, patterns will appear here.</p>
          <p className="hint">Make sure to capture reasons when marking deals as won or lost.</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <nav className="op-tabs">
            <button
              className={`op-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`op-tab ${activeTab === 'losses' ? 'active' : ''}`}
              onClick={() => setActiveTab('losses')}
            >
              Loss Analysis ({losses.length})
            </button>
            <button
              className={`op-tab ${activeTab === 'wins' ? 'active' : ''}`}
              onClick={() => setActiveTab('wins')}
            >
              Win Analysis ({wins.length})
            </button>
          </nav>

          {/* Tab Content */}
          <div className="op-content">
            {activeTab === 'overview' && (
              <OverviewView stats={stats} losses={losses} wins={wins} />
            )}
            {activeTab === 'losses' && (
              <LossAnalysisView losses={losses} stats={stats} />
            )}
            {activeTab === 'wins' && (
              <WinAnalysisView wins={wins} stats={stats} />
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================
// OVERVIEW VIEW
// ============================================
function OverviewView({ stats, losses, wins }) {
  if (!stats) return null

  // Calculate top reasons
  const topLossReasons = stats.topLossReasons || []
  const topWinReasons = stats.topWinReasons || []

  // Check for factors
  const priceIssues = losses.filter(l => l.price_factor).length
  const timingIssues = losses.filter(l => l.timing_factor).length
  const fitIssues = losses.filter(l => l.fit_factor).length
  const competitorLosses = losses.filter(l => l.competitor_mentioned).length

  return (
    <div className="overview-view">
      <div className="overview-grid">
        {/* Top Loss Reasons */}
        <div className="pattern-card losses">
          <h3>Top Loss Reasons</h3>
          {topLossReasons.length === 0 ? (
            <p className="no-data">Not enough data yet</p>
          ) : (
            <div className="reason-bars">
              {topLossReasons.map(([reason, count]) => {
                const percent = Math.round((count / losses.length) * 100)
                return (
                  <div key={reason} className="reason-bar">
                    <div className="bar-header">
                      <span className="reason-label">{LOSS_REASON_LABELS[reason] || reason}</span>
                      <span className="reason-count">{count} ({percent}%)</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill loss" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top Win Reasons */}
        <div className="pattern-card wins">
          <h3>Top Win Reasons</h3>
          {topWinReasons.length === 0 ? (
            <p className="no-data">Not enough data yet</p>
          ) : (
            <div className="reason-bars">
              {topWinReasons.map(([reason, count]) => {
                const percent = Math.round((count / wins.length) * 100)
                return (
                  <div key={reason} className="reason-bar">
                    <div className="bar-header">
                      <span className="reason-label">{WIN_REASON_LABELS[reason] || reason}</span>
                      <span className="reason-count">{count} ({percent}%)</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill win" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="insights-section">
        <h3>Key Insights</h3>
        <div className="insights-grid">
          {priceIssues > 0 && priceIssues >= losses.length * 0.3 && (
            <div className="insight-card warning">
              <span className="insight-icon">💰</span>
              <div className="insight-content">
                <span className="insight-title">Price is a common objection</span>
                <span className="insight-detail">
                  {Math.round((priceIssues / losses.length) * 100)}% of losses mention price. Consider:
                  adding more value, payment plans, or stronger ROI positioning.
                </span>
              </div>
            </div>
          )}

          {timingIssues > 0 && timingIssues >= losses.length * 0.25 && (
            <div className="insight-card info">
              <span className="insight-icon">⏰</span>
              <div className="insight-content">
                <span className="insight-title">Timing is frequently cited</span>
                <span className="insight-detail">
                  {Math.round((timingIssues / losses.length) * 100)}% of losses are timing-related.
                  Add urgency elements or nurture sequences for "not now" leads.
                </span>
              </div>
            </div>
          )}

          {competitorLosses > 0 && (
            <div className="insight-card alert">
              <span className="insight-icon">🏁</span>
              <div className="insight-content">
                <span className="insight-title">Competitive losses detected</span>
                <span className="insight-detail">
                  {competitorLosses} deal{competitorLosses > 1 ? 's' : ''} lost to competitors.
                  Review your differentiators and competitive positioning.
                </span>
              </div>
            </div>
          )}

          {wins.length > 0 && topWinReasons[0] && (
            <div className="insight-card success">
              <span className="insight-icon">🎯</span>
              <div className="insight-content">
                <span className="insight-title">Your top closer</span>
                <span className="insight-detail">
                  "{WIN_REASON_LABELS[topWinReasons[0][0]] || topWinReasons[0][0]}" drives most wins.
                  Double down on this in your sales process.
                </span>
              </div>
            </div>
          )}

          {losses.length === 0 && wins.length > 0 && (
            <div className="insight-card success">
              <span className="insight-icon">🔥</span>
              <div className="insight-content">
                <span className="insight-title">Perfect record!</span>
                <span className="insight-detail">
                  No losses recorded yet. Keep capturing why deals close to refine your approach.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// LOSS ANALYSIS VIEW
// ============================================
function LossAnalysisView({ losses, stats }) {
  // Group by reason
  const byReason = {}
  losses.forEach(loss => {
    const reason = loss.primary_reason || 'unknown'
    if (!byReason[reason]) byReason[reason] = []
    byReason[reason].push(loss)
  })

  return (
    <div className="loss-analysis-view">
      <div className="analysis-summary">
        <p>
          <strong>{losses.length}</strong> deals lost.
          Understanding why helps you improve your close rate.
        </p>
      </div>

      {/* Reason breakdown */}
      <div className="reason-breakdown">
        {Object.entries(byReason).map(([reason, deals]) => (
          <div key={reason} className="reason-group">
            <div className="reason-header">
              <span className="reason-title">{LOSS_REASON_LABELS[reason] || reason}</span>
              <span className="reason-count">{deals.length} deal{deals.length > 1 ? 's' : ''}</span>
            </div>
            <div className="reason-deals">
              {deals.slice(0, 3).map(deal => (
                <div key={deal.id} className="deal-item">
                  <span className="deal-name">{deal.deals?.contact_name || 'Unknown'}</span>
                  <span className="deal-value">${deal.deals?.value?.toLocaleString() || 0}</span>
                  {deal.notes && <p className="deal-notes">"{deal.notes}"</p>}
                </div>
              ))}
              {deals.length > 3 && (
                <span className="more-deals">+{deals.length - 3} more</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Competitor Analysis */}
      {losses.some(l => l.competitor_mentioned) && (
        <div className="competitor-section">
          <h3>Competitor Analysis</h3>
          <div className="competitor-list">
            {losses
              .filter(l => l.competitor_mentioned)
              .map(loss => (
                <div key={loss.id} className="competitor-item">
                  <span className="competitor-name">{loss.competitor_mentioned}</span>
                  <span className="deal-name">Lost: {loss.deals?.contact_name}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// WIN ANALYSIS VIEW
// ============================================
function WinAnalysisView({ wins, stats }) {
  // Group by reason
  const byReason = {}
  wins.forEach(win => {
    const reason = win.primary_reason || 'unknown'
    if (!byReason[reason]) byReason[reason] = []
    byReason[reason].push(win)
  })

  // Calculate total value won
  const totalValue = wins.reduce((sum, w) => sum + (w.deals?.value || 0), 0)

  return (
    <div className="win-analysis-view">
      <div className="analysis-summary success">
        <p>
          <strong>{wins.length}</strong> deals won for <strong>${totalValue.toLocaleString()}</strong>.
          Here's what's working.
        </p>
      </div>

      {/* Reason breakdown */}
      <div className="reason-breakdown">
        {Object.entries(byReason).map(([reason, deals]) => {
          const reasonValue = deals.reduce((sum, d) => sum + (d.deals?.value || 0), 0)
          return (
            <div key={reason} className="reason-group win">
              <div className="reason-header">
                <span className="reason-title">{WIN_REASON_LABELS[reason] || reason}</span>
                <span className="reason-stats">
                  {deals.length} deal{deals.length > 1 ? 's' : ''} • ${reasonValue.toLocaleString()}
                </span>
              </div>
              <div className="reason-deals">
                {deals.slice(0, 3).map(deal => (
                  <div key={deal.id} className="deal-item win">
                    <span className="deal-name">{deal.deals?.contact_name || 'Unknown'}</span>
                    <span className="deal-value">${deal.deals?.value?.toLocaleString() || 0}</span>
                    {deal.notes && <p className="deal-notes">"{deal.notes}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* What Sold Them */}
      {wins.some(w => w.what_sold_them) && (
        <div className="sold-section">
          <h3>What Sold Them (In Their Words)</h3>
          <div className="sold-quotes">
            {wins
              .filter(w => w.what_sold_them)
              .slice(0, 5)
              .map(win => (
                <blockquote key={win.id} className="sold-quote">
                  "{win.what_sold_them}"
                  <cite>— {win.deals?.contact_name}</cite>
                </blockquote>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
