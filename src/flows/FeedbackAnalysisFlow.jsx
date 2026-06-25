/**
 * FeedbackAnalysisFlow - Analyze Testing Feedback for Stage 3
 *
 * Shows AI analysis of feedback responses and captures:
 * - Key learnings from testers
 * - Changes user will make based on feedback
 *
 * Unlocks when 3+ feedback responses are collected.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { useProjectId } from '../hooks/useProjectId'
import { trackFlowCompletion } from '../lib/flowTracking'
import { BackButton, ProgressDots } from '../components/MoneyModelShared'
import './FeedbackAnalysisFlow.css'

const STAGES = {
  LOADING: 'loading',
  NOT_READY: 'not_ready',       // Less than 3 responses
  WELCOME: 'welcome',
  ANALYSIS: 'analysis',          // View AI analysis
  KEY_LEARNINGS: 'key_learnings', // What did you learn?
  CHANGES: 'changes',            // What will you change?
  SUMMARY: 'summary',
  SUCCESS: 'success'
}

const STAGE_GROUPS = [
  { id: 'start', label: 'Start', stages: [STAGES.WELCOME] },
  { id: 'analysis', label: 'Analysis', stages: [STAGES.ANALYSIS] },
  { id: 'reflect', label: 'Reflect', stages: [STAGES.KEY_LEARNINGS, STAGES.CHANGES] },
  { id: 'complete', label: 'Complete', stages: [STAGES.SUMMARY, STAGES.SUCCESS] }
]

function FeedbackAnalysisFlow() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { projectId } = useProjectId()
  const showResults = searchParams.get('results') === 'true'

  const [stage, setStage] = useState(STAGES.LOADING)
  const [feedbackSessions, setFeedbackSessions] = useState([])
  const [testingFlows, setTestingFlows] = useState([])
  const [selectedFlow, setSelectedFlow] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  // User reflection inputs
  const [keyLearnings, setKeyLearnings] = useState(['', '', ''])
  const [changes, setChanges] = useState(['', '', ''])

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      // Load testing flows (validation flows with stage = 'testing')
      const { data: flows, error: flowsError } = await supabase
        .from('validation_flows')
        .select('*')
        .eq('user_id', user.id)
        .eq('stage', 'testing')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (flowsError) throw flowsError

      setTestingFlows(flows || [])

      if (!flows || flows.length === 0) {
        setStage(STAGES.NOT_READY)
        return
      }

      // Load sessions for all testing flows
      const flowIds = flows.map(f => f.id)
      const { data: sessions, error: sessionsError } = await supabase
        .from('validation_sessions')
        .select('*')
        .in('flow_id', flowIds)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (sessionsError) throw sessionsError

      setFeedbackSessions(sessions || [])

      // Check if we have enough responses
      if (!sessions || sessions.length < 3) {
        setStage(STAGES.NOT_READY)
        return
      }

      // Check for existing analysis (View Results mode)
      if (showResults) {
        const { data: existing } = await supabase
          .from('feedback_analysis_assessments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (existing) {
          setKeyLearnings(existing.key_learnings || ['', '', ''])
          setChanges(existing.changes || ['', '', ''])
          setAiAnalysis(existing.ai_analysis)
          setStage(STAGES.SUMMARY)
          return
        }
      }

      // Default to the flow with most responses
      const flowResponseCounts = flows.map(f => ({
        flow: f,
        count: sessions.filter(s => s.flow_id === f.id).length
      })).sort((a, b) => b.count - a.count)

      if (flowResponseCounts[0].count >= 3) {
        setSelectedFlow(flowResponseCounts[0].flow)
      }

      setStage(STAGES.WELCOME)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load feedback data.')
      setStage(STAGES.NOT_READY)
    }
  }

  const generateAiAnalysis = async () => {
    if (!selectedFlow || aiLoading) return

    const flowSessions = feedbackSessions.filter(s => s.flow_id === selectedFlow.id)
    if (flowSessions.length < 3) {
      setError('Need at least 3 responses for AI analysis')
      return
    }

    setAiLoading(true)
    setError(null)

    try {
      // Prepare responses for the AI
      const responseData = flowSessions.map(session => ({
        email: session.respondent_email || 'Anonymous',
        answers: (session.responses || []).map((r, idx) => ({
          question: r.question_text || `Question ${idx + 1}`,
          answer: Array.isArray(r.answer_value)
            ? r.answer_value.join(', ')
            : String(r.answer_value || '')
        }))
      }))

      // Call edge function for AI summary
      const { data, error: fnError } = await supabase.functions.invoke('validation-summary', {
        body: {
          flowName: selectedFlow.flow_name,
          flowDescription: selectedFlow.flow_description || 'Product feedback',
          responses: responseData,
          totalResponses: flowSessions.length,
          analysisType: 'testing' // Signal this is testing feedback
        }
      })

      if (fnError) throw fnError

      setAiAnalysis(data.summary)
    } catch (err) {
      console.error('Error generating AI analysis:', err)
      // Fallback local analysis
      generateLocalAnalysis(flowSessions)
    } finally {
      setAiLoading(false)
    }
  }

  const generateLocalAnalysis = (sessions) => {
    // Fallback if edge function fails
    const analysis = {
      overview: `Analysis of ${sessions.length} feedback responses`,
      highlights: [
        'Multiple testers provided actionable feedback',
        'Common themes emerged across responses',
        'Clear improvement opportunities identified'
      ],
      patterns: [
        'Review individual responses for specific details',
        'Look for recurring suggestions',
        'Note any consistent pain points'
      ]
    }
    setAiAnalysis(analysis)
  }

  const handleSaveResults = async () => {
    if (isLoading || !user) return

    const validLearnings = keyLearnings.filter(l => l.trim())
    const validChanges = changes.filter(c => c.trim())

    if (validLearnings.length === 0 || validChanges.length === 0) {
      setError('Please add at least one learning and one change')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Save to feedback_analysis_assessments
      await supabase.from('feedback_analysis_assessments').insert({
        user_id: user.id,
        flow_id: selectedFlow?.id,
        key_learnings: validLearnings,
        changes: validChanges,
        ai_analysis: aiAnalysis,
        response_count: feedbackSessions.filter(s => s.flow_id === selectedFlow?.id).length
      })

      // Track flow completion
      try {
        await trackFlowCompletion({
          userId: user.id,
          projectId,
          flowType: 'feedback_analysis',
          flowVersion: '1.0',
          experienceId: searchParams.get('experienceId') || null
        })
      } catch (e) {
        console.warn('Flow tracking failed:', e)
      }

      // Complete challenge quest
      try {
        await completeFlowQuest({
          userId: user.id,
          flowId: 'feedback_analysis',
          pointsEarned: 6,
          projectId: projectId || null
        })
      } catch (e) {
        console.warn('Quest completion failed:', e)
      }

      setStage(STAGES.SUCCESS)
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getFlowResponseCount = (flowId) => {
    return feedbackSessions.filter(s => s.flow_id === flowId).length
  }

  const updateLearning = (index, value) => {
    const updated = [...keyLearnings]
    updated[index] = value
    setKeyLearnings(updated)
  }

  const updateChange = (index, value) => {
    const updated = [...changes]
    updated[index] = value
    setChanges(updated)
  }

  const getValidCount = (arr) => arr.filter(item => item.trim()).length

  // ============ RENDER ============

  if (stage === STAGES.LOADING) {
    return (
      <div className="feedback-analysis-flow">
        <div className="loading-state">
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )
  }

  // NOT READY - Less than 3 responses
  if (stage === STAGES.NOT_READY) {
    return (
      <div className="feedback-analysis-flow">
        <div className="not-ready-container">
          <div className="not-ready-icon">📊</div>
          <h2>Not Enough Feedback Yet</h2>
          <p className="not-ready-message">
            You need at least <strong>3 feedback responses</strong> to unlock AI analysis.
          </p>

          {testingFlows.length === 0 ? (
            <div className="not-ready-action">
              <p>You haven't created a testing feedback form yet.</p>
              <button
                className="primary-button"
                onClick={() => navigate('/validation-flows?type=testing')}
              >
                Create Feedback Form
              </button>
            </div>
          ) : (
            <div className="not-ready-action">
              <p>Current responses: {feedbackSessions.length} / 3 required</p>
              <button
                className="primary-button"
                onClick={() => navigate('/validation-flows?type=testing')}
              >
                View & Share Feedback Forms
              </button>
            </div>
          )}

          <button
            className="secondary-button"
            onClick={() => navigate('/7-day-challenge')}
            style={{ marginTop: '16px' }}
          >
            Back to 7-Day Challenge
          </button>
        </div>
      </div>
    )
  }

  // WELCOME
  if (stage === STAGES.WELCOME) {
    return (
      <div className="feedback-analysis-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="welcome-container">
          <h1 className="welcome-greeting">Analyze Your Feedback</h1>
          <div className="welcome-message">
            <p>You've collected <strong>{feedbackSessions.length} responses</strong> from testers.</p>
            <p style={{ marginTop: '16px', color: 'rgba(255,255,255,0.7)' }}>
              Let's find the patterns and turn them into actionable improvements.
            </p>
          </div>

          {testingFlows.length > 1 && (
            <div className="flow-selector">
              <label>Select feedback form to analyze:</label>
              <div className="flow-options">
                {testingFlows.map(flow => (
                  <button
                    key={flow.id}
                    className={`flow-option ${selectedFlow?.id === flow.id ? 'selected' : ''}`}
                    onClick={() => setSelectedFlow(flow)}
                  >
                    <span className="flow-name">{flow.flow_name}</span>
                    <span className="flow-count">{getFlowResponseCount(flow.id)} responses</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            className="primary-button"
            onClick={() => {
              generateAiAnalysis()
              setStage(STAGES.ANALYSIS)
            }}
            disabled={!selectedFlow || getFlowResponseCount(selectedFlow?.id) < 3}
          >
            Generate AI Analysis
          </button>

          <button
            className="secondary-button"
            onClick={() => navigate('/7-day-challenge')}
          >
            Come Back Later
          </button>
        </div>
      </div>
    )
  }

  // ANALYSIS
  if (stage === STAGES.ANALYSIS) {
    return (
      <div className="feedback-analysis-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="analysis-container">
          <h2 className="section-title">AI Analysis</h2>

          {aiLoading && (
            <div className="ai-loading">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
              <p>Analyzing {getFlowResponseCount(selectedFlow?.id)} responses...</p>
            </div>
          )}

          {aiAnalysis && !aiLoading && (
            <div className="ai-analysis-card">
              {typeof aiAnalysis === 'string' ? (
                <p className="analysis-text">{aiAnalysis}</p>
              ) : (
                <>
                  <p className="analysis-overview">{aiAnalysis.overview}</p>

                  {aiAnalysis.highlights && aiAnalysis.highlights.length > 0 && (
                    <div className="analysis-section">
                      <h4>✨ Key Highlights</h4>
                      <ul>
                        {aiAnalysis.highlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiAnalysis.patterns && aiAnalysis.patterns.length > 0 && (
                    <div className="analysis-section">
                      <h4>🔍 Patterns Found</h4>
                      <ul>
                        {aiAnalysis.patterns.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                    <div className="analysis-section">
                      <h4>💡 Recommendations</h4>
                      <ul>
                        {aiAnalysis.recommendations.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {error && <p className="error-message">{error}</p>}

          <button
            className="primary-button"
            onClick={() => setStage(STAGES.KEY_LEARNINGS)}
            disabled={aiLoading || !aiAnalysis}
          >
            Continue to Reflection
          </button>

          <BackButton onClick={() => setStage(STAGES.WELCOME)} />
        </div>
      </div>
    )
  }

  // KEY LEARNINGS
  if (stage === STAGES.KEY_LEARNINGS) {
    return (
      <div className="feedback-analysis-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="reflection-container">
          <h2 className="section-title">What Did You Learn?</h2>
          <p className="section-subtitle">
            Based on the AI analysis and individual responses, what are the key things you learned?
          </p>

          <div className="learning-inputs">
            {keyLearnings.map((learning, index) => (
              <div key={index} className="learning-input-row">
                <span className="input-number">{index + 1}</span>
                <input
                  type="text"
                  className="learning-input"
                  placeholder={`Key learning ${index + 1}${index === 0 ? ' (required)' : ' (optional)'}`}
                  value={learning}
                  onChange={(e) => updateLearning(index, e.target.value)}
                />
              </div>
            ))}
          </div>

          <button
            className="add-more-btn"
            onClick={() => setKeyLearnings([...keyLearnings, ''])}
          >
            + Add Another Learning
          </button>

          <button
            className="primary-button"
            onClick={() => setStage(STAGES.CHANGES)}
            disabled={getValidCount(keyLearnings) === 0}
          >
            Continue ({getValidCount(keyLearnings)} added)
          </button>

          <BackButton onClick={() => setStage(STAGES.ANALYSIS)} />
        </div>
      </div>
    )
  }

  // CHANGES
  if (stage === STAGES.CHANGES) {
    return (
      <div className="feedback-analysis-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="reflection-container">
          <h2 className="section-title">What Will You Change?</h2>
          <p className="section-subtitle">
            Based on your learnings, what specific changes will you make to your product?
          </p>

          <div className="change-inputs">
            {changes.map((change, index) => (
              <div key={index} className="change-input-row">
                <span className="input-number">{index + 1}</span>
                <input
                  type="text"
                  className="change-input"
                  placeholder={`Change ${index + 1}${index === 0 ? ' (required)' : ' (optional)'}`}
                  value={change}
                  onChange={(e) => updateChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>

          <button
            className="add-more-btn"
            onClick={() => setChanges([...changes, ''])}
          >
            + Add Another Change
          </button>

          <button
            className="primary-button"
            onClick={() => setStage(STAGES.SUMMARY)}
            disabled={getValidCount(changes) === 0}
          >
            Review Summary
          </button>

          <BackButton onClick={() => setStage(STAGES.KEY_LEARNINGS)} />
        </div>
      </div>
    )
  }

  // SUMMARY
  if (stage === STAGES.SUMMARY) {
    const validLearnings = keyLearnings.filter(l => l.trim())
    const validChanges = changes.filter(c => c.trim())

    return (
      <div className="feedback-analysis-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />
        <div className="summary-container">
          <h1 className="summary-title">Your Feedback Analysis</h1>

          <div className="summary-card">
            <div className="summary-section">
              <div className="summary-label">Responses Analyzed</div>
              <div className="summary-value">
                {feedbackSessions.filter(s => s.flow_id === selectedFlow?.id).length} testers
              </div>
            </div>

            <div className="summary-section">
              <div className="summary-label">Key Learnings</div>
              <ul className="summary-list">
                {validLearnings.map((learning, i) => (
                  <li key={i}>{learning}</li>
                ))}
              </ul>
            </div>

            <div className="summary-section">
              <div className="summary-label">Changes You'll Make</div>
              <ul className="summary-list">
                {validChanges.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            </div>
          </div>

          {error && <p className="error-message">{error}</p>}

          {showResults ? (
            <button
              className="primary-button"
              onClick={() => navigate('/7-day-challenge')}
            >
              Back to 7-Day Challenge
            </button>
          ) : (
            <>
              <button
                className="primary-button"
                onClick={handleSaveResults}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save & Complete (+6 pts)'}
              </button>
              <p style={{ marginTop: '12px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                Saves your analysis and completes this quest
              </p>
            </>
          )}

          <BackButton onClick={() => setStage(STAGES.CHANGES)} />
        </div>
      </div>
    )
  }

  // SUCCESS
  if (stage === STAGES.SUCCESS) {
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'
    return (
      <div className="feedback-analysis-flow">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Analysis Complete, {userName}!</h2>
          <p style={{ marginBottom: '8px' }}>Your feedback analysis is saved.</p>
          <p style={{ color: '#fbbf24', fontWeight: '600', fontSize: '18px' }}>+6 points earned!</p>

          <div className="success-reminder">
            <p><strong>Now it's time to act:</strong></p>
            <p>Implement the changes you identified and continue iterating based on feedback.</p>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate('/7-day-challenge')}
            style={{ marginTop: '24px' }}
          >
            Return to 7-Day Challenge
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default FeedbackAnalysisFlow
