/**
 * ValidationResponsesInput - Quest input for tracking and analyzing validation responses
 *
 * Shows user's validation flows with response counts.
 * Unlocks AI analysis when 3+ total responses collected.
 * Displays AI-generated insights per question.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { Link } from 'react-router-dom'
import './ValidationResponsesInput.css'

function ValidationResponsesInput({ quest, onComplete }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [flows, setFlows] = useState([])
  const [totalResponses, setTotalResponses] = useState(0)
  const [analysisReport, setAnalysisReport] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [error, setError] = useState(null)
  const [expandedFlow, setExpandedFlow] = useState(null)

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
      // Fetch user's validation flows with response counts
      const { data: flowsData, error: flowsError } = await supabase
        .from('validation_flows')
        .select('*')
        .eq('creator_user_id', user.id)
        .order('created_at', { ascending: false })

      if (flowsError) throw flowsError

      // For each flow, get detailed response data
      const flowsWithResponses = await Promise.all(
        (flowsData || []).map(async (flow) => {
          // Get completed sessions with responses
          const { data: sessions, error: sessionsError } = await supabase
            .from('validation_sessions')
            .select(`
              id,
              respondent_email,
              started_at,
              completed_at,
              is_completed
            `)
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

      // Calculate total responses across all flows
      const total = flowsWithResponses.reduce((sum, flow) => sum + flow.responseCount, 0)
      setTotalResponses(total)

      // Check if analysis already exists
      const { data: existingAnalysis } = await supabase
        .from('validation_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingAnalysis) {
        setAnalysisReport(existingAnalysis)
      }

    } catch (err) {
      console.error('Error loading validation flows:', err)
      setError('Failed to load validation data')
    } finally {
      setLoading(false)
    }
  }

  const runAnalysis = async () => {
    if (totalResponses < REQUIRED_RESPONSES) return

    setAnalyzing(true)
    setError(null)

    try {
      // Gather all responses across all flows
      const allResponses = []

      for (const flow of flows) {
        if (flow.responseCount === 0) continue

        // Get all responses for this flow
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
          placeholders: flow.placeholders,
          responses: responses || []
        })
      }

      // Call the Edge Function for AI analysis
      const { data, error: fnError } = await supabase.functions.invoke('analyze-validation-responses', {
        body: {
          userId: user.id,
          flows: allResponses
        }
      })

      if (fnError) throw fnError

      if (data?.analysis) {
        setAnalysisReport(data.analysis)
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
    if (!analysisReport) return

    onComplete(quest, {
      analysis_id: analysisReport.id,
      total_responses: totalResponses,
      flows_analyzed: flows.length
    })
  }

  const toggleFlowExpand = (flowId) => {
    setExpandedFlow(expandedFlow === flowId ? null : flowId)
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

        {/* Progress bar */}
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
      {canAnalyze && !analysisReport && (
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

      {/* Analysis Report */}
      {analysisReport && (
        <div className="vri-report">
          <div className="vri-report-header">
            <h4>AI Analysis Report</h4>
            <button
              className="vri-toggle-report"
              onClick={() => setShowReport(!showReport)}
            >
              {showReport ? 'Hide' : 'Show'} Report
            </button>
          </div>

          {showReport && (
            <div className="vri-report-content">
              {/* Key Insights */}
              {analysisReport.key_insights && (
                <div className="vri-report-section">
                  <h5>Key Insights</h5>
                  <ul className="vri-insights-list">
                    {analysisReport.key_insights.map((insight, idx) => (
                      <li key={idx}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pain Points */}
              {analysisReport.pain_points && (
                <div className="vri-report-section">
                  <h5>Pain Points</h5>
                  <ul className="vri-pain-list">
                    {analysisReport.pain_points.map((pain, idx) => (
                      <li key={idx}>{pain}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Dream Outcomes */}
              {analysisReport.dream_outcomes && (
                <div className="vri-report-section">
                  <h5>Dream Outcomes</h5>
                  <ul className="vri-dreams-list">
                    {analysisReport.dream_outcomes.map((dream, idx) => (
                      <li key={idx}>{dream}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Objections */}
              {analysisReport.objections && (
                <div className="vri-report-section">
                  <h5>Common Objections</h5>
                  <ul className="vri-objections-list">
                    {analysisReport.objections.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pricing Signals */}
              {analysisReport.pricing_signals && (
                <div className="vri-report-section">
                  <h5>Pricing Signals</h5>
                  <p>{analysisReport.pricing_signals}</p>
                </div>
              )}

              {/* Language Patterns */}
              {analysisReport.language_patterns && (
                <div className="vri-report-section">
                  <h5>Language to Use</h5>
                  <div className="vri-language-tags">
                    {analysisReport.language_patterns.map((phrase, idx) => (
                      <span key={idx} className="vri-language-tag">{phrase}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-Question Analysis */}
              {analysisReport.question_analysis && (
                <div className="vri-report-section">
                  <h5>Question-by-Question Analysis</h5>
                  <div className="vri-question-analysis">
                    {analysisReport.question_analysis.map((qa, idx) => (
                      <div key={idx} className="vri-qa-item">
                        <div className="vri-qa-question">{qa.question}</div>
                        <div className="vri-qa-summary">{qa.summary}</div>
                        {qa.notable_quotes && qa.notable_quotes.length > 0 && (
                          <div className="vri-qa-quotes">
                            {qa.notable_quotes.map((quote, qIdx) => (
                              <blockquote key={qIdx}>"{quote}"</blockquote>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {analysisReport.summary && (
                <div className="vri-report-section vri-summary-section">
                  <h5>Summary</h5>
                  <p>{analysisReport.summary}</p>
                </div>
              )}
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
      {analysisReport && (
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
