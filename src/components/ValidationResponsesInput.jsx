/**
 * ValidationResponsesInput - Quest input for tracking and analyzing validation responses
 *
 * Features:
 * - Response tracking with progress bar
 * - AI-powered analysis with sentiment badges
 * - Validation Score gauge
 * - Response Segmentation
 * - Actionable To-Dos
 * - Competitor Analysis
 * - Voice of Customer integration
 * - Multiple analysis history
 * - Export functionality
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { Link } from 'react-router-dom'
import {
  checkValidationProgressNotification,
  sendAnalysisUnlockedNotification
} from '../lib/notifications'
import './ValidationResponsesInput.css'

// Badge configuration
const BADGES = {
  opportunity: { emoji: '🎯', label: 'Opportunity', class: 'opportunity' },
  gold: { emoji: '✨', label: 'Gold', class: 'gold' },
  pattern: { emoji: '📊', label: 'Pattern', class: 'pattern' }
}

// Priority colors
const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e'
}

// Category icons
const CATEGORY_ICONS = {
  messaging: '💬',
  pricing: '💰',
  product: '📦',
  marketing: '📣',
  objection_handling: '🛡️'
}

function ValidationResponsesInput({ quest, onComplete }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [flows, setFlows] = useState([])
  const [totalResponses, setTotalResponses] = useState(0)
  const [analysisHistory, setAnalysisHistory] = useState([])
  const [currentAnalysis, setCurrentAnalysis] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [error, setError] = useState(null)
  const [expandedFlow, setExpandedFlow] = useState(null)
  const [previewQuotes, setPreviewQuotes] = useState([])
  const [copiedItem, setCopiedItem] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [activeTab, setActiveTab] = useState('insights') // insights, segmentation, actions, competitors, voc

  const REQUIRED_RESPONSES = 3

  useEffect(() => {
    if (user) {
      loadValidationFlows()
    }
  }, [user])

  const loadValidationFlows = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: flowsData, error: flowsError } = await supabase
        .from('validation_flows')
        .select('*')
        .eq('creator_user_id', user.id)
        .order('created_at', { ascending: false })

      if (flowsError) throw flowsError

      const flowsWithResponses = await Promise.all(
        (flowsData || []).map(async (flow) => {
          const { data: sessions, error: sessionsError } = await supabase
            .from('validation_sessions')
            .select('id, respondent_email, started_at, completed_at, is_completed')
            .eq('flow_id', flow.id)
            .eq('is_completed', true)
            .order('completed_at', { ascending: false })

          if (sessionsError) {
            console.error('Error fetching sessions:', sessionsError)
            return { ...flow, sessions: [], responseCount: 0 }
          }

          return {
            ...flow,
            sessions: sessions || [],
            responseCount: sessions?.length || 0
          }
        })
      )

      setFlows(flowsWithResponses)

      const total = flowsWithResponses.reduce((sum, flow) => sum + flow.responseCount, 0)
      setTotalResponses(total)

      if (total > 0 && total < REQUIRED_RESPONSES) {
        checkValidationProgressNotification(user.id, total, REQUIRED_RESPONSES)
        await loadPreviewQuotes(flowsWithResponses)
      } else if (total >= REQUIRED_RESPONSES) {
        sendAnalysisUnlockedNotification(user.id)
      }

      const { data: analyses } = await supabase
        .from('validation_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (analyses && analyses.length > 0) {
        setAnalysisHistory(analyses)
        setCurrentAnalysis(analyses[0])
      }

    } catch (err) {
      console.error('Error loading validation flows:', err)
      setError('Failed to load validation data')
    } finally {
      setLoading(false)
    }
  }

  const loadPreviewQuotes = async (flowsWithResponses) => {
    try {
      const flowIds = flowsWithResponses.filter(f => f.responseCount > 0).map(f => f.id)
      if (flowIds.length === 0) return

      const { data: responses } = await supabase
        .from('validation_responses')
        .select('answer_value, question_text')
        .in('flow_id', flowIds)
        .not('answer_value', 'is', null)
        .limit(10)

      if (responses) {
        const textResponses = responses
          .filter(r => typeof r.answer_value === 'string' && r.answer_value.length > 20)
          .slice(0, 2)
          .map(r => r.answer_value.substring(0, 100) + (r.answer_value.length > 100 ? '...' : ''))

        setPreviewQuotes(textResponses)
      }
    } catch (err) {
      console.error('Error loading preview quotes:', err)
    }
  }

  const runAnalysis = async () => {
    if (totalResponses < REQUIRED_RESPONSES) return

    setAnalyzing(true)
    setError(null)

    try {
      const allResponses = []

      for (const flow of flows) {
        if (flow.responseCount === 0) continue

        const { data: responses, error: respError } = await supabase
          .from('validation_responses')
          .select('*')
          .eq('flow_id', flow.id)
          .order('answered_at', { ascending: true })

        if (respError) {
          console.error('Error fetching responses:', respError)
          continue
        }

        allResponses.push({
          flowName: flow.flow_name,
          flowId: flow.id,
          placeholders: flow.placeholders,
          responses: responses || []
        })
      }

      const { data, error: fnError } = await supabase.functions.invoke('analyze-validation-responses', {
        body: {
          userId: user.id,
          flows: allResponses
        }
      })

      if (fnError) throw fnError

      if (data?.analysis) {
        setCurrentAnalysis(data.analysis)
        setAnalysisHistory(prev => [data.analysis, ...prev])
        setShowReport(true)
      }

    } catch (err) {
      console.error('Error running analysis:', err)
      setError('Failed to generate analysis. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleComplete = () => {
    if (!currentAnalysis) return

    onComplete(quest, {
      analysis_id: currentAnalysis.id,
      total_responses: totalResponses,
      flows_analyzed: flows.length,
      analysis_number: currentAnalysis.analysis_number
    })
  }

  const toggleFlowExpand = (flowId) => {
    setExpandedFlow(expandedFlow === flowId ? null : flowId)
  }

  const viewHistoricalAnalysis = (analysis) => {
    setCurrentAnalysis(analysis)
    setShowReport(true)
    setShowHistory(false)
  }

  const copyToClipboard = async (text, itemId) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(itemId)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const exportReport = () => {
    if (!currentAnalysis) return

    const lines = []
    lines.push('VALIDATION ANALYSIS REPORT')
    lines.push(`Generated: ${new Date(currentAnalysis.created_at).toLocaleDateString()}`)
    lines.push(`Analysis #${currentAnalysis.analysis_number || 1}`)
    lines.push(`Total Responses: ${currentAnalysis.total_responses}`)

    if (currentAnalysis.validation_score) {
      lines.push(`\nVALIDATION SCORE: ${currentAnalysis.validation_score.overall}/100`)
      lines.push(`Recommendation: ${currentAnalysis.validation_score.recommendation}`)
    }

    lines.push('\n---\n')

    // Add all sections...
    if (currentAnalysis.key_insights?.length) {
      lines.push('KEY INSIGHTS')
      currentAnalysis.key_insights.forEach(item => {
        const text = typeof item === 'string' ? item : item.text
        const badge = typeof item === 'object' && item.badge ? ` [${BADGES[item.badge]?.emoji || ''}]` : ''
        lines.push(`  - ${text}${badge}`)
      })
      lines.push('')
    }

    if (currentAnalysis.suggested_actions?.length) {
      lines.push('SUGGESTED ACTIONS')
      currentAnalysis.suggested_actions.forEach(action => {
        lines.push(`  [${action.priority.toUpperCase()}] ${action.action}`)
        lines.push(`    Source: ${action.source}`)
      })
      lines.push('')
    }

    if (currentAnalysis.competitor_analysis) {
      const ca = currentAnalysis.competitor_analysis
      lines.push('COMPETITOR ANALYSIS')
      if (ca.alternatives_mentioned?.length) {
        lines.push(`  Alternatives: ${ca.alternatives_mentioned.join(', ')}`)
      }
      if (ca.positioning_opportunity) {
        lines.push(`  Your Opportunity: ${ca.positioning_opportunity}`)
      }
      lines.push('')
    }

    if (currentAnalysis.summary) {
      lines.push('SUMMARY')
      lines.push(`  ${currentAnalysis.summary}`)
    }

    const text = lines.join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `validation-analysis-${currentAnalysis.analysis_number || 1}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderBadgedItem = (item, index, section) => {
    const isObject = typeof item === 'object' && item !== null
    const text = isObject ? item.text : item
    const badge = isObject ? item.badge : null
    const itemId = `${section}-${index}`

    return (
      <li key={index} className={`vri-badged-item ${badge ? `has-badge badge-${badge}` : ''}`}>
        {badge && BADGES[badge] && (
          <span className={`vri-badge vri-badge-${badge}`} title={BADGES[badge].label}>
            {BADGES[badge].emoji}
          </span>
        )}
        <span className="vri-item-text">{text}</span>
        <button
          className={`vri-copy-btn ${copiedItem === itemId ? 'copied' : ''}`}
          onClick={() => copyToClipboard(text, itemId)}
          title="Copy to clipboard"
        >
          {copiedItem === itemId ? '✓' : '📋'}
        </button>
      </li>
    )
  }

  const renderLanguageTag = (item, index) => {
    const isObject = typeof item === 'object' && item !== null
    const text = isObject ? item.text : item
    const badge = isObject ? item.badge : null
    const itemId = `lang-${index}`

    return (
      <span
        key={index}
        className={`vri-language-tag ${badge ? `badge-${badge}` : ''}`}
        onClick={() => copyToClipboard(text, itemId)}
        title="Click to copy"
      >
        {badge && BADGES[badge] && <span className="vri-tag-badge">{BADGES[badge].emoji}</span>}
        {text}
        {copiedItem === itemId && <span className="vri-copied-indicator">Copied!</span>}
      </span>
    )
  }

  // Render Validation Score Gauge
  const renderValidationScore = () => {
    const score = currentAnalysis?.validation_score
    if (!score) return null

    const getScoreColor = (s) => {
      if (s >= 70) return '#22c55e'
      if (s >= 50) return '#f59e0b'
      return '#ef4444'
    }

    return (
      <div className="vri-validation-score">
        <div className="vri-score-header">
          <h5>Validation Score</h5>
          <span className={`vri-confidence vri-confidence-${score.confidence}`}>
            {score.confidence} confidence
          </span>
        </div>

        <div className="vri-score-gauge">
          <div className="vri-gauge-circle">
            <svg viewBox="0 0 100 100">
              <circle
                className="vri-gauge-bg"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="10"
              />
              <circle
                className="vri-gauge-fill"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={getScoreColor(score.overall)}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${score.overall * 2.83} 283`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="vri-gauge-value" style={{ color: getScoreColor(score.overall) }}>
              {score.overall}
            </div>
          </div>
        </div>

        <div className="vri-score-components">
          {score.components && Object.entries(score.components).map(([key, comp]) => (
            <div key={key} className="vri-score-component">
              <div className="vri-component-header">
                <span className="vri-component-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <span className="vri-component-value" style={{ color: getScoreColor(comp.score) }}>
                  {comp.score}
                </span>
              </div>
              <div className="vri-component-bar">
                <div
                  className="vri-component-fill"
                  style={{ width: `${comp.score}%`, background: getScoreColor(comp.score) }}
                />
              </div>
              <div className="vri-component-reason">{comp.reason}</div>
            </div>
          ))}
        </div>

        {score.recommendation && (
          <div className="vri-score-recommendation">
            <strong>Recommendation:</strong> {score.recommendation}
          </div>
        )}
      </div>
    )
  }

  // Render Segmentation
  const renderSegmentation = () => {
    const seg = currentAnalysis?.segmentation
    if (!seg) return <p className="vri-no-data">No segmentation data available</p>

    const segments = [
      { key: 'high_intent', label: 'High Intent', icon: '🔥', color: '#ef4444' },
      { key: 'budget_conscious', label: 'Budget Conscious', icon: '💰', color: '#f59e0b' },
      { key: 'solution_seekers', label: 'Solution Seekers', icon: '🔍', color: '#3b82f6' }
    ]

    return (
      <div className="vri-segmentation">
        {segments.map(({ key, label, icon, color }) => {
          const data = seg[key]
          if (!data) return null

          return (
            <div key={key} className="vri-segment-card" style={{ borderColor: color }}>
              <div className="vri-segment-header">
                <span className="vri-segment-icon">{icon}</span>
                <span className="vri-segment-label">{label}</span>
                <span className="vri-segment-count" style={{ background: color }}>
                  {data.count || 0}
                </span>
              </div>

              {data.characteristics?.length > 0 && (
                <div className="vri-segment-section">
                  <div className="vri-segment-title">Characteristics</div>
                  <ul>
                    {data.characteristics.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}

              {data.pain_points?.length > 0 && (
                <div className="vri-segment-section">
                  <div className="vri-segment-title">Pain Points</div>
                  <ul>
                    {data.pain_points.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}

              {data.dream_outcomes?.length > 0 && (
                <div className="vri-segment-section">
                  <div className="vri-segment-title">Dream Outcomes</div>
                  <ul>
                    {data.dream_outcomes.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>
              )}

              {data.objections?.length > 0 && (
                <div className="vri-segment-section">
                  <div className="vri-segment-title">Objections</div>
                  <ul>
                    {data.objections.map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              )}

              {data.price_sensitivity && (
                <div className="vri-segment-section">
                  <div className="vri-segment-title">Price Sensitivity</div>
                  <p>{data.price_sensitivity}</p>
                </div>
              )}

              {data.what_theyve_tried?.length > 0 && (
                <div className="vri-segment-section">
                  <div className="vri-segment-title">What They've Tried</div>
                  <ul>
                    {data.what_theyve_tried.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              {data.ideal_solution && (
                <div className="vri-segment-section">
                  <div className="vri-segment-title">Ideal Solution</div>
                  <p>{data.ideal_solution}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Render Suggested Actions
  const renderSuggestedActions = () => {
    const actions = currentAnalysis?.suggested_actions
    if (!actions?.length) return <p className="vri-no-data">No suggested actions available</p>

    const groupedByPriority = {
      high: actions.filter(a => a.priority === 'high'),
      medium: actions.filter(a => a.priority === 'medium'),
      low: actions.filter(a => a.priority === 'low')
    }

    return (
      <div className="vri-actions">
        {['high', 'medium', 'low'].map(priority => {
          const items = groupedByPriority[priority]
          if (!items?.length) return null

          return (
            <div key={priority} className="vri-action-group">
              <div className="vri-action-priority" style={{ color: PRIORITY_COLORS[priority] }}>
                {priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢'} {priority.toUpperCase()} PRIORITY
              </div>
              {items.map((action, idx) => (
                <div key={idx} className="vri-action-item">
                  <div className="vri-action-main">
                    <span className="vri-action-category">
                      {CATEGORY_ICONS[action.category] || '📋'} {action.category.replace('_', ' ')}
                    </span>
                    <span className="vri-action-text">{action.action}</span>
                  </div>
                  <div className="vri-action-source">Source: {action.source}</div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    )
  }

  // Render Competitor Analysis
  const renderCompetitorAnalysis = () => {
    const ca = currentAnalysis?.competitor_analysis
    if (!ca) return <p className="vri-no-data">No competitor analysis available</p>

    return (
      <div className="vri-competitors">
        {ca.alternatives_mentioned?.length > 0 && (
          <div className="vri-comp-section">
            <h6>🏢 Alternatives Mentioned</h6>
            <div className="vri-comp-tags">
              {ca.alternatives_mentioned.map((alt, i) => (
                <span key={i} className="vri-comp-tag">{alt}</span>
              ))}
            </div>
          </div>
        )}

        {ca.why_they_failed?.length > 0 && (
          <div className="vri-comp-section">
            <h6>❌ Why They Failed</h6>
            <ul>
              {ca.why_they_failed.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {ca.gaps_to_fill?.length > 0 && (
          <div className="vri-comp-section">
            <h6>🎯 Gaps You Can Fill</h6>
            <ul>
              {ca.gaps_to_fill.map((gap, i) => (
                <li key={i} className="vri-gap-item">{gap}</li>
              ))}
            </ul>
          </div>
        )}

        {ca.positioning_opportunity && (
          <div className="vri-comp-section vri-positioning">
            <h6>💡 Your Positioning Opportunity</h6>
            <p>{ca.positioning_opportunity}</p>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="validation-responses-input">
        <div className="vri-loading">
          <div className="vri-spinner" />
          <span>Loading validation data...</span>
        </div>
      </div>
    )
  }

  const canAnalyze = totalResponses >= REQUIRED_RESPONSES
  const responsesNeeded = REQUIRED_RESPONSES - totalResponses
  const newResponsesSinceAnalysis = currentAnalysis
    ? totalResponses - (currentAnalysis.total_responses || 0)
    : 0

  return (
    <div className="validation-responses-input">
      {/* Response Count Summary */}
      <div className="vri-summary">
        <div className="vri-count-card">
          <div className="vri-count-number">{totalResponses}</div>
          <div className="vri-count-label">
            {totalResponses === 1 ? 'Response' : 'Responses'} Collected
          </div>
          {!canAnalyze && (
            <div className="vri-count-needed">
              {responsesNeeded} more needed to unlock analysis
            </div>
          )}
        </div>

        <div className="vri-progress-container">
          <div className="vri-progress-bar">
            <div
              className="vri-progress-fill"
              style={{ width: `${Math.min(100, (totalResponses / REQUIRED_RESPONSES) * 100)}%` }}
            />
          </div>
          <div className="vri-progress-markers">
            {[1, 2, 3].map(num => (
              <div
                key={num}
                className={`vri-marker ${totalResponses >= num ? 'filled' : ''}`}
              >
                {num}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Quotes */}
      {previewQuotes.length > 0 && !canAnalyze && (
        <div className="vri-preview-section">
          <div className="vri-preview-header">
            <span className="vri-preview-icon">💬</span>
            <span>Here's what people are saying...</span>
          </div>
          <div className="vri-preview-quotes">
            {previewQuotes.map((quote, idx) => (
              <blockquote key={idx} className="vri-preview-quote">
                "{quote}"
              </blockquote>
            ))}
          </div>
          <p className="vri-preview-cta">
            Get {responsesNeeded} more response{responsesNeeded > 1 ? 's' : ''} to unlock AI analysis
          </p>
        </div>
      )}

      {/* Flows List */}
      {flows.length === 0 ? (
        <div className="vri-empty">
          <p>No validation flows created yet.</p>
          <Link to="/validation-flows" className="vri-create-btn">
            Create Your First Validation Flow
          </Link>
        </div>
      ) : (
        <div className="vri-flows-list">
          {flows.map(flow => (
            <div key={flow.id} className="vri-flow-card">
              <div
                className="vri-flow-header"
                onClick={() => toggleFlowExpand(flow.id)}
              >
                <div className="vri-flow-info">
                  <span className="vri-flow-name">{flow.flow_name}</span>
                  <span className={`vri-flow-status ${flow.is_active ? 'active' : 'inactive'}`}>
                    {flow.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
                <div className="vri-flow-count">
                  <span className="vri-response-badge">{flow.responseCount}</span>
                  <svg
                    className={`vri-expand-icon ${expandedFlow === flow.id ? 'expanded' : ''}`}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                  >
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                </div>
              </div>

              {expandedFlow === flow.id && flow.sessions.length > 0 && (
                <div className="vri-flow-sessions">
                  {flow.sessions.slice(0, 5).map((session, idx) => (
                    <div key={session.id} className="vri-session-item">
                      <span className="vri-session-email">
                        {session.respondent_email || `Response ${idx + 1}`}
                      </span>
                      <span className="vri-session-date">
                        {new Date(session.completed_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {flow.sessions.length > 5 && (
                    <div className="vri-session-more">
                      +{flow.sessions.length - 5} more responses
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <Link to="/validation-flows" className="vri-manage-link">
            Manage Validation Flows →
          </Link>
        </div>
      )}

      {/* Analysis Section */}
      {canAnalyze && !currentAnalysis && (
        <div className="vri-analyze-section">
          <button
            className="vri-analyze-btn"
            onClick={runAnalysis}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <span className="vri-spinner small" />
                Analyzing Responses...
              </>
            ) : (
              <>
                <span className="vri-ai-icon">🤖</span>
                Analyze with AI
              </>
            )}
          </button>
          <p className="vri-analyze-note">
            AI will analyze patterns across all {totalResponses} responses
          </p>
        </div>
      )}

      {/* Re-analyze Section */}
      {canAnalyze && currentAnalysis && newResponsesSinceAnalysis > 0 && (
        <div className="vri-reanalyze-section">
          <div className="vri-reanalyze-info">
            <span className="vri-new-responses-badge">+{newResponsesSinceAnalysis} new</span>
            <span>responses since last analysis</span>
          </div>
          <button
            className="vri-reanalyze-btn"
            onClick={runAnalysis}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <span className="vri-spinner small" />
                Re-analyzing...
              </>
            ) : (
              <>
                <span>🔄</span>
                Re-analyze with New Data
              </>
            )}
          </button>
          <p className="vri-reanalyze-note">
            Previous analyses are saved - you can view them in history
          </p>
        </div>
      )}

      {/* Analysis Report */}
      {currentAnalysis && (
        <div className="vri-report">
          <div className="vri-report-header">
            <div className="vri-report-title">
              <h4>AI Analysis Report</h4>
              {currentAnalysis.analysis_number && (
                <span className="vri-analysis-version">#{currentAnalysis.analysis_number}</span>
              )}
              <span className="vri-analysis-date">
                {new Date(currentAnalysis.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="vri-report-actions">
              {analysisHistory.length > 1 && (
                <button
                  className="vri-history-btn"
                  onClick={() => setShowHistory(!showHistory)}
                  title="View previous analyses"
                >
                  📜 History ({analysisHistory.length})
                </button>
              )}
              <button
                className="vri-export-btn"
                onClick={exportReport}
                title="Export report as text file"
              >
                📥 Export
              </button>
              <button
                className="vri-toggle-report"
                onClick={() => setShowReport(!showReport)}
              >
                {showReport ? 'Hide' : 'Show'} Report
              </button>
            </div>
          </div>

          {/* History Dropdown */}
          {showHistory && analysisHistory.length > 1 && (
            <div className="vri-history-dropdown">
              <div className="vri-history-title">Previous Analyses</div>
              {analysisHistory.map((analysis, idx) => (
                <button
                  key={analysis.id}
                  className={`vri-history-item ${analysis.id === currentAnalysis.id ? 'active' : ''}`}
                  onClick={() => viewHistoricalAnalysis(analysis)}
                >
                  <span className="vri-history-number">#{analysis.analysis_number || idx + 1}</span>
                  <span className="vri-history-meta">
                    {analysis.total_responses} responses • {new Date(analysis.created_at).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Validation Score - Always visible */}
          {showReport && currentAnalysis.validation_score && renderValidationScore()}

          {/* Tab Navigation */}
          {showReport && (
            <div className="vri-tabs">
              <button
                className={`vri-tab ${activeTab === 'insights' ? 'active' : ''}`}
                onClick={() => setActiveTab('insights')}
              >
                💡 Insights
              </button>
              <button
                className={`vri-tab ${activeTab === 'segmentation' ? 'active' : ''}`}
                onClick={() => setActiveTab('segmentation')}
              >
                👥 Segments
              </button>
              <button
                className={`vri-tab ${activeTab === 'actions' ? 'active' : ''}`}
                onClick={() => setActiveTab('actions')}
              >
                ✅ Actions
              </button>
              <button
                className={`vri-tab ${activeTab === 'competitors' ? 'active' : ''}`}
                onClick={() => setActiveTab('competitors')}
              >
                🏢 Competitors
              </button>
              <Link to="/voice-of-customer" className="vri-tab vri-tab-link">
                💬 VoC Database
              </Link>
            </div>
          )}

          {showReport && (
            <div className="vri-report-content">
              {/* Insights Tab */}
              {activeTab === 'insights' && (
                <>
                  {/* Badge Legend */}
                  <div className="vri-badge-legend">
                    <span className="vri-legend-title">Badge Guide:</span>
                    <span className="vri-legend-item">
                      <span className="vri-badge vri-badge-opportunity">🎯</span> Opportunity
                    </span>
                    <span className="vri-legend-item">
                      <span className="vri-badge vri-badge-gold">✨</span> Gold
                    </span>
                    <span className="vri-legend-item">
                      <span className="vri-badge vri-badge-pattern">📊</span> Pattern
                    </span>
                  </div>

                  {currentAnalysis.key_insights?.length > 0 && (
                    <div className="vri-report-section">
                      <h5>Key Insights</h5>
                      <ul className="vri-insights-list">
                        {currentAnalysis.key_insights.map((item, idx) =>
                          renderBadgedItem(item, idx, 'insights')
                        )}
                      </ul>
                    </div>
                  )}

                  {currentAnalysis.pain_points?.length > 0 && (
                    <div className="vri-report-section">
                      <h5>Pain Points</h5>
                      <ul className="vri-pain-list">
                        {currentAnalysis.pain_points.map((item, idx) =>
                          renderBadgedItem(item, idx, 'pain')
                        )}
                      </ul>
                    </div>
                  )}

                  {currentAnalysis.dream_outcomes?.length > 0 && (
                    <div className="vri-report-section">
                      <h5>Dream Outcomes</h5>
                      <ul className="vri-dreams-list">
                        {currentAnalysis.dream_outcomes.map((item, idx) =>
                          renderBadgedItem(item, idx, 'dreams')
                        )}
                      </ul>
                    </div>
                  )}

                  {currentAnalysis.objections?.length > 0 && (
                    <div className="vri-report-section">
                      <h5>Common Objections</h5>
                      <ul className="vri-objections-list">
                        {currentAnalysis.objections.map((item, idx) =>
                          renderBadgedItem(item, idx, 'objections')
                        )}
                      </ul>
                    </div>
                  )}

                  {currentAnalysis.pricing_signals && (
                    <div className="vri-report-section">
                      <h5>Pricing Signals</h5>
                      {(() => {
                        const isObject = typeof currentAnalysis.pricing_signals === 'object'
                        const text = isObject ? currentAnalysis.pricing_signals.text : currentAnalysis.pricing_signals
                        const badge = isObject ? currentAnalysis.pricing_signals.badge : null
                        return (
                          <p className={`vri-pricing-text ${badge ? `has-badge badge-${badge}` : ''}`}>
                            {badge && BADGES[badge] && (
                              <span className={`vri-badge vri-badge-${badge}`}>{BADGES[badge].emoji}</span>
                            )}
                            {text}
                          </p>
                        )
                      })()}
                    </div>
                  )}

                  {currentAnalysis.language_patterns?.length > 0 && (
                    <div className="vri-report-section">
                      <h5>Language to Use <span className="vri-click-hint">(click to copy)</span></h5>
                      <div className="vri-language-tags">
                        {currentAnalysis.language_patterns.map((item, idx) =>
                          renderLanguageTag(item, idx)
                        )}
                      </div>
                    </div>
                  )}

                  {currentAnalysis.summary && (
                    <div className="vri-report-section vri-summary-section">
                      <h5>Summary</h5>
                      <p>{currentAnalysis.summary}</p>
                    </div>
                  )}
                </>
              )}

              {/* Segmentation Tab */}
              {activeTab === 'segmentation' && renderSegmentation()}

              {/* Actions Tab */}
              {activeTab === 'actions' && renderSuggestedActions()}

              {/* Competitors Tab */}
              {activeTab === 'competitors' && renderCompetitorAnalysis()}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="vri-error">
          {error}
        </div>
      )}

      {/* Complete Button */}
      {currentAnalysis && (
        <button
          className="vri-complete-btn"
          onClick={handleComplete}
        >
          Complete Quest
        </button>
      )}
    </div>
  )
}

export default ValidationResponsesInput
