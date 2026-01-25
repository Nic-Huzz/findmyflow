// src/components/crm/WeeklyReflection.jsx
// Screen 1: Weekly reflection with scores, questions, and flow check-in

import { useState, useEffect } from 'react'
import { getReflectionQuestion, FLOW_DIRECTIONS, getFlowDirection } from '../../lib/crm/reflectionService'
import { getLastWeekScores } from '../../lib/crm/weeklyPlanningService'
import FlowCheckIn from './FlowCheckIn'
import './WeeklyReflection.css'

export default function WeeklyReflection({ userId, onComplete, onSkip }) {
  const [scores, setScores] = useState({ execution: null, conversion: null, improvement: null })
  const [loading, setLoading] = useState(true)
  const [reflectionText, setReflectionText] = useState('')
  const [flowState, setFlowState] = useState({ internal: null, external: null })
  const [question, setQuestion] = useState(null)

  useEffect(() => {
    loadScores()
  }, [userId])

  const loadScores = async () => {
    setLoading(true)
    try {
      const weekScores = await getLastWeekScores(userId)
      setScores(weekScores)
      // Only set question if we have scores to reflect on
      if (weekScores.execution !== null || weekScores.conversion !== null) {
        setQuestion(getReflectionQuestion(weekScores))
      }
    } catch (error) {
      console.error('Error loading scores:', error)
    }
    setLoading(false)
  }

  const isComplete = flowState.internal && flowState.external

  const handleContinue = () => {
    const direction = getFlowDirection(flowState.internal, flowState.external)
    onComplete({
      executionScore: scores.execution,
      conversionScore: scores.conversion,
      improvementScore: scores.improvement,
      reflectionType: question?.type || 'first_week',
      reflectionText,
      flowInternal: flowState.internal,
      flowExternal: flowState.external,
      flowDirection: direction
    })
  }

  const hasScores = scores.execution !== null || scores.conversion !== null

  if (loading) {
    return (
      <div className="weekly-reflection loading">
        <div className="loading-spinner" />
        <p>Loading your week...</p>
      </div>
    )
  }

  return (
    <div className="weekly-reflection">
      {/* Scorecard - only show if we have scores */}
      {hasScores && (
        <>
          <div className="scorecard">
            <h3 className="scorecard-title">Last Week's Scorecard 📊</h3>
            <div className="scores-grid">
              <div className="score-item">
                <span className="score-label">EXECUTION</span>
                <span className="score-value">{scores.execution ?? '—'}%</span>
                <div className="score-bar">
                  <div
                    className="score-fill execution"
                    style={{ width: `${scores.execution || 0}%` }}
                  />
                </div>
                <span className="score-desc">Tasks completed</span>
              </div>

              <div className="score-item">
                <span className="score-label">CONVERSION</span>
                <span className="score-value">{scores.conversion ?? '—'}%</span>
                <div className="score-bar">
                  <div
                    className="score-fill conversion"
                    style={{ width: `${Math.min(scores.conversion || 0, 100)}%` }}
                  />
                </div>
                <span className="score-desc">Funnel avg</span>
              </div>

              <div className="score-item">
                <span className="score-label">IMPROVEMENT</span>
                <span className={`score-value ${scores.improvement > 0 ? 'positive' : scores.improvement < 0 ? 'negative' : ''}`}>
                  {scores.improvement !== null ? (scores.improvement > 0 ? '+' : '') + scores.improvement + '%' : '—'}
                </span>
                <div className="score-bar">
                  <div
                    className="score-fill improvement"
                    style={{ width: `${Math.min(Math.abs(scores.improvement || 0) * 5, 100)}%` }}
                  />
                </div>
                <span className="score-desc">vs prev week</span>
              </div>
            </div>
          </div>

          {/* Reflection Question - only if we have scores */}
          {question && (
            <div className="reflection-section">
              <label className="reflection-label">{question.question}</label>
              <textarea
                className="reflection-input"
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Take a moment to reflect..."
                rows={3}
              />
            </div>
          )}
        </>
      )}

      {/* Flow Check-In */}
      <div className="flow-section">
        <h4 className="section-title">Flow Check-In</h4>
        <FlowCheckIn
          value={flowState}
          onChange={setFlowState}
          showResult={true}
        />
      </div>

      {/* Actions */}
      <div className="reflection-actions">
        <button
          className="continue-btn"
          onClick={handleContinue}
          disabled={!isComplete}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
