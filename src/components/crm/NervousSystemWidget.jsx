/**
 * Nervous System Widget
 * Shows patterns from task skip reasons - what the user's NS feels safe/unsafe with
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { getNervousSystemPatterns } from '../../lib/intelligenceEngine'
import './NervousSystemWidget.css'

// Reason labels for display
const REASON_LABELS = {
  // External
  no_time: "Didn't have time",
  forgot: 'Forgot about it',
  technical_issue: 'Technical issue',
  other_priorities: 'Other priorities',
  waiting_on_something: 'Waiting on something',
  not_relevant: "Wasn't relevant",
  // Internal
  fear_of_judgment: 'Fear of judgment',
  not_good_enough: "It's not good enough",
  fear_of_failure: 'Fear of failure',
  fear_of_success: 'Fear of success',
  perfectionism: 'Perfectionism',
  overwhelm: 'Overwhelm',
  imposter_syndrome: 'Imposter syndrome',
  visibility_fear: 'Fear of visibility',
  rejection_fear: 'Fear of rejection'
}

const REASON_ICONS = {
  // External
  no_time: '⏰',
  forgot: '🤔',
  technical_issue: '🔧',
  other_priorities: '📋',
  waiting_on_something: '⏳',
  not_relevant: '🎯',
  // Internal
  fear_of_judgment: '👀',
  not_good_enough: '📉',
  fear_of_failure: '😰',
  fear_of_success: '🚀',
  perfectionism: '✨',
  overwhelm: '🌊',
  imposter_syndrome: '🎭',
  visibility_fear: '🔦',
  rejection_fear: '💔'
}

export default function NervousSystemWidget() {
  const { user } = useAuth()
  const [patterns, setPatterns] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadPatterns()
    }
  }, [user?.id])

  async function loadPatterns() {
    setLoading(true)
    try {
      const data = await getNervousSystemPatterns(user.id)
      setPatterns(data)
    } catch (err) {
      console.error('Error loading NS patterns:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="ns-widget">
        <div className="ns-widget-header">
          <div className="ns-widget-title">
            <span className="ns-icon">🧠</span>
            <h2>Nervous System Patterns</h2>
          </div>
        </div>
        <div className="ns-widget-loading">
          <div className="ns-skeleton ns-skeleton-bar"></div>
          <div className="ns-skeleton ns-skeleton-bar short"></div>
        </div>
      </section>
    )
  }

  if (!patterns?.hasData) {
    return (
      <section className="ns-widget ns-widget-empty">
        <div className="ns-widget-header">
          <div className="ns-widget-title">
            <span className="ns-icon">🧠</span>
            <h2>Nervous System Patterns</h2>
          </div>
        </div>
        <div className="ns-empty-state">
          <p>No patterns yet.</p>
          <p className="ns-empty-hint">
            When you skip tasks, we'll track why to help you understand your resistance patterns.
          </p>
        </div>
      </section>
    )
  }

  const { categoryBreakdown, internalPatterns, externalPatterns, insights, topResistance } = patterns

  return (
    <section className="ns-widget">
      <div className="ns-widget-header">
        <div className="ns-widget-title">
          <span className="ns-icon">🧠</span>
          <h2>Nervous System Patterns</h2>
        </div>
        <button
          className="ns-expand-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      </div>

      {/* Category Breakdown */}
      <div className="ns-category-breakdown">
        <div className="ns-category-bar">
          <div
            className="ns-category-fill external"
            style={{ width: `${categoryBreakdown.external.percentage}%` }}
          >
            {categoryBreakdown.external.percentage > 20 && (
              <span>🌍 {categoryBreakdown.external.percentage}%</span>
            )}
          </div>
          <div
            className="ns-category-fill internal"
            style={{ width: `${categoryBreakdown.internal.percentage}%` }}
          >
            {categoryBreakdown.internal.percentage > 20 && (
              <span>💭 {categoryBreakdown.internal.percentage}%</span>
            )}
          </div>
        </div>
        <div className="ns-category-legend">
          <span className="ns-legend-item external">
            <span className="ns-legend-dot"></span>
            External ({categoryBreakdown.external.count})
          </span>
          <span className="ns-legend-item internal">
            <span className="ns-legend-dot"></span>
            Internal ({categoryBreakdown.internal.count})
          </span>
        </div>
      </div>

      {/* Top Insight */}
      {insights.length > 0 && (
        <div className={`ns-insight ns-insight-${insights[0].priority}`}>
          <span className="ns-insight-icon">{insights[0].icon}</span>
          <div className="ns-insight-content">
            <h4>{insights[0].title}</h4>
            <p>{insights[0].message}</p>
          </div>
        </div>
      )}

      {/* Top Resistance (if internal) */}
      {topResistance && (
        <div className="ns-top-resistance">
          <div className="ns-resistance-header">
            <span className="ns-resistance-icon">{REASON_ICONS[topResistance.reason]}</span>
            <div className="ns-resistance-info">
              <span className="ns-resistance-label">#1 Resistance</span>
              <span className="ns-resistance-name">
                {REASON_LABELS[topResistance.reason] || topResistance.reason}
              </span>
            </div>
          </div>
          <div className="ns-resistance-stats">
            <div className="ns-resistance-stat">
              <span className="ns-stat-value">{topResistance.count}x</span>
              <span className="ns-stat-label">occurrences</span>
            </div>
            <div className="ns-resistance-stat">
              <span className="ns-stat-value">{topResistance.avgIntensity}/10</span>
              <span className="ns-stat-label">avg intensity</span>
            </div>
            <div className="ns-resistance-stat">
              <span className={`ns-trend ns-trend-${topResistance.trend}`}>
                {topResistance.trend === 'improving' && '↓ Improving'}
                {topResistance.trend === 'increasing' && '↑ Increasing'}
                {topResistance.trend === 'stable' && '→ Stable'}
                {topResistance.trend === 'neutral' && '• Neutral'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Expanded View */}
      {expanded && (
        <div className="ns-expanded">
          {/* All Insights */}
          {insights.length > 1 && (
            <div className="ns-all-insights">
              <h4>All Insights</h4>
              {insights.slice(1).map((insight, idx) => (
                <div key={idx} className={`ns-insight ns-insight-${insight.priority}`}>
                  <span className="ns-insight-icon">{insight.icon}</span>
                  <div className="ns-insight-content">
                    <h4>{insight.title}</h4>
                    <p>{insight.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Internal Patterns */}
          {internalPatterns.length > 0 && (
            <div className="ns-pattern-section">
              <h4>Internal Resistance Patterns</h4>
              <div className="ns-pattern-list">
                {internalPatterns.map((pattern, idx) => (
                  <div key={idx} className="ns-pattern-item">
                    <span className="ns-pattern-icon">{REASON_ICONS[pattern.reason]}</span>
                    <span className="ns-pattern-name">
                      {REASON_LABELS[pattern.reason] || pattern.reason}
                    </span>
                    <span className="ns-pattern-count">{pattern.count}x</span>
                    <span className="ns-pattern-intensity">
                      {pattern.avgIntensity}/10
                    </span>
                    <span className={`ns-pattern-trend ns-trend-${pattern.trend}`}>
                      {pattern.trend === 'improving' && '↓'}
                      {pattern.trend === 'increasing' && '↑'}
                      {pattern.trend === 'stable' && '→'}
                      {pattern.trend === 'neutral' && '•'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External Patterns */}
          {externalPatterns.length > 0 && (
            <div className="ns-pattern-section">
              <h4>External Blockers</h4>
              <div className="ns-pattern-list">
                {externalPatterns.map((pattern, idx) => (
                  <div key={idx} className="ns-pattern-item external">
                    <span className="ns-pattern-icon">{REASON_ICONS[pattern.reason]}</span>
                    <span className="ns-pattern-name">
                      {REASON_LABELS[pattern.reason] || pattern.reason}
                    </span>
                    <span className="ns-pattern-count">{pattern.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="ns-widget-footer">
        <span className="ns-period">Last 30 days</span>
        <span className="ns-total">{patterns.totalSkips} skips tracked</span>
      </div>
    </section>
  )
}
