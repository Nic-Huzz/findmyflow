import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { getDirectionColor, getDirectionLabel, getDirectionEmoji } from '../lib/flowCompass'
import './FlowInsights.css'

/**
 * FlowInsights - AI-powered insights dashboard
 *
 * Props:
 * - projectId: uuid (optional - filter by project)
 * - analysisPeriod: 'weekly' | 'monthly' | 'all_time' (default: 'weekly')
 */

const FlowInsights = ({ projectId = null, analysisPeriod = 'weekly' }) => {
  const { user } = useAuth()
  const [pattern, setPattern] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.id) {
      loadPattern()
    }
  }, [user, projectId, analysisPeriod])

  const loadPattern = async () => {
    setLoading(true)
    setError(null)

    try {
      // Calculate period dates
      const periodEnd = new Date()
      const periodStart = new Date()

      switch (analysisPeriod) {
        case 'weekly':
          periodStart.setDate(periodEnd.getDate() - 7)
          break
        case 'monthly':
          periodStart.setMonth(periodEnd.getMonth() - 1)
          break
        case 'all_time':
          periodStart.setFullYear(2024, 0, 1)
          break
      }

      const periodStartStr = periodStart.toISOString().split('T')[0]

      // Fetch most recent pattern for this period
      let query = supabase
        .from('flow_patterns')
        .select('*')
        .eq('user_id', user.id)
        .eq('analysis_period', analysisPeriod)
        .gte('period_start', periodStartStr)
        .order('generated_at', { ascending: false })
        .limit(1)

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setPattern(data && data.length > 0 ? data[0] : null)
    } catch (err) {
      console.error('Error loading pattern:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const runAnalysis = async () => {
    setAnalyzing(true)
    setError(null)

    try {
      const { data, error: analyzeError } = await supabase.functions.invoke('flow-analyze', {
        body: {
          userId: user.id,
          projectId,
          analysisPeriod
        }
      })

      if (analyzeError) throw analyzeError

      console.log('✅ Analysis complete:', data)

      // Reload pattern
      await loadPattern()
    } catch (err) {
      console.error('Error running analysis:', err)
      setError(err.message || 'Failed to analyze flow patterns')
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <div className="flow-insights">
        <h3>Flow Insights</h3>
        <div className="loading">
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )
  }

  if (!pattern) {
    return (
      <div className="flow-insights">
        <h3>Flow Insights</h3>
        <div className="no-insights">
          <p className="no-insights-icon">🧠</p>
          <p className="no-insights-text">No insights yet</p>
          <p className="no-insights-hint">
            Log a few flow entries, then run analysis
          </p>
          <button
            className="btn-primary analyze-btn"
            onClick={runAnalysis}
            disabled={analyzing}
          >
            {analyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>
    )
  }

  const { direction_distribution, dominant_direction, consistency_score, reasoning_clusters, key_patterns, recommendations, summary_text } = pattern

  return (
    <div className="flow-insights">
      <div className="insights-header">
        <h3>Flow Insights</h3>
        <button
          className="btn-secondary refresh-btn"
          onClick={runAnalysis}
          disabled={analyzing}
        >
          {analyzing ? 'Analyzing...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Summary */}
      {summary_text && (
        <div className="insight-summary">
          <p>{summary_text}</p>
        </div>
      )}

      {/* Direction Distribution Chart */}
      <div className="insight-section">
        <h4>Flow Distribution</h4>
        <div className="direction-chart">
          {Object.entries(direction_distribution || {}).map(([dir, count]) => {
            const total = Object.values(direction_distribution).reduce((sum, c) => sum + c, 0)
            const percentage = total > 0 ? (count / total) * 100 : 0

            return (
              <div key={dir} className="direction-bar">
                <div className="bar-label">
                  <span className="bar-emoji">{getDirectionEmoji(dir)}</span>
                  <span className="bar-name">{getDirectionLabel(dir)}</span>
                  <span className="bar-count">{count}</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: getDirectionColor(dir)
                    }}
                  />
                </div>
                <span className="bar-percentage">{percentage.toFixed(0)}%</span>
              </div>
            )
          })}
        </div>

        <div className="dominant-badge">
          <span>Dominant Direction:</span>
          <span
            className="dominant-label"
            style={{ color: getDirectionColor(dominant_direction) }}
          >
            {getDirectionEmoji(dominant_direction)} {getDirectionLabel(dominant_direction)}
          </span>
          <span className="consistency-score">
            Consistency: {(consistency_score * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Reasoning Clusters */}
      {reasoning_clusters && reasoning_clusters.length > 0 && (
        <div className="insight-section">
          <h4>Activity Themes</h4>
          <div className="clusters-list">
            {reasoning_clusters.map((cluster, index) => (
              <div key={index} className="cluster-card">
                <h5>{cluster.label}</h5>
                <p className="cluster-insight">{cluster.insight}</p>
                <div className="cluster-items">
                  {cluster.items && cluster.items.length > 0 && (
                    <span className="cluster-count">{cluster.items.length} entries</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Patterns */}
      {key_patterns && key_patterns.length > 0 && (
        <div className="insight-section">
          <h4>Patterns Detected</h4>
          <div className="patterns-list">
            {key_patterns.map((p, index) => (
              <div key={index} className="pattern-card">
                <h5>🔍 {p.pattern}</h5>
                <p className="pattern-evidence"><strong>Evidence:</strong> {p.evidence}</p>
                <p className="pattern-impact"><strong>Impact:</strong> {p.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="insight-section">
          <h4>Recommendations</h4>
          <div className="recommendations-list">
            {recommendations.map((rec, index) => (
              <div key={index} className={`recommendation-card priority-${rec.priority}`}>
                <div className="rec-header">
                  <span className="rec-icon">
                    {rec.priority === 'high' && '🔥'}
                    {rec.priority === 'medium' && '⭐'}
                    {rec.priority === 'low' && '💡'}
                  </span>
                  <h5>{rec.action}</h5>
                  <span className={`priority-badge priority-${rec.priority}`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="rec-reason">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  )
}

export default FlowInsights
