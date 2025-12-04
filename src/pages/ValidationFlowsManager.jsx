import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthProvider'
import {
  getUserValidationFlows,
  createValidationFlow,
  getFlowResponses,
  toggleFlowStatus,
  deleteValidationFlow,
  getFlowAnalytics
} from '../lib/validationFlows'
import './ValidationFlowsManager.css'

/**
 * ValidationFlowsManager - Creator dashboard for managing validation flows
 */

const ValidationFlowsManager = () => {
  const { user } = useAuth()
  const [flows, setFlows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFlow, setSelectedFlow] = useState(null)
  const [responses, setResponses] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedFlowType, setSelectedFlowType] = useState(null)
  const [copiedToken, setCopiedToken] = useState(null)

  useEffect(() => {
    if (user?.id) {
      loadFlows()
    }
  }, [user])

  const loadFlows = async () => {
    setLoading(true)
    const data = await getUserValidationFlows(user.id)
    setFlows(data)
    setLoading(false)
  }

  const handleCreateFlow = async (flowType) => {
    let flowConfig

    if (flowType === 'validation') {
      flowConfig = {
        name: 'Vibe Riser Validation',
        description: 'Customer discovery questions for Vibe Riser persona',
        jsonPath: 'validation-flow-vibe-riser.json',
        persona: 'vibe_riser',
        stage: 'validation'
      }
    } else if (flowType === 'testing') {
      flowConfig = {
        name: 'Vibe Riser Testing Feedback',
        description: 'Product feedback questions for Vibe Riser beta testers',
        jsonPath: 'validation-flow-vibe-riser-testing.json',
        persona: 'vibe_riser',
        stage: 'testing'
      }
    }

    const result = await createValidationFlow(
      user.id,
      flowConfig.name,
      flowConfig.description,
      flowConfig.jsonPath,
      flowConfig.persona,
      flowConfig.stage
    )

    if (result.success) {
      alert(`Flow created! Share URL: ${result.shareUrl}`)
      setShowCreateModal(false)
      setSelectedFlowType(null)
      loadFlows()
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  const handleViewResponses = async (flow) => {
    setSelectedFlow(flow)
    const data = await getFlowResponses(flow.id)
    const analyticsData = await getFlowAnalytics(flow.id)
    setResponses(data)
    setAnalytics(analyticsData)
  }

  const handleToggleStatus = async (flowId, currentStatus) => {
    const success = await toggleFlowStatus(flowId, !currentStatus)
    if (success) {
      loadFlows()
    }
  }

  const handleDelete = async (flowId) => {
    if (window.confirm('Are you sure you want to delete this flow? All responses will be lost.')) {
      const success = await deleteValidationFlow(flowId)
      if (success) {
        loadFlows()
        if (selectedFlow?.id === flowId) {
          setSelectedFlow(null)
          setResponses([])
        }
      }
    }
  }

  const copyShareLink = (shareToken) => {
    const url = `${window.location.origin}/v/${shareToken}`
    navigator.clipboard.writeText(url)
    setCopiedToken(shareToken)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  if (loading) {
    return (
      <div className="validation-manager-page">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="validation-manager-page">
      <div className="manager-header">
        <div>
          <h1>Validation Flows</h1>
          <p>Create shareable validation flows to gather customer feedback</p>
        </div>
        <button className="create-flow-btn" onClick={() => setShowCreateModal(true)}>
          + Create New Flow
        </button>
      </div>

      <div className="manager-content">
        {/* Flows List */}
        <div className="flows-list">
          <h2>Your Flows</h2>
          {flows.length === 0 ? (
            <div className="empty-state">
              <p>No validation flows yet. Create one to get started!</p>
            </div>
          ) : (
            flows.map(flow => (
              <div key={flow.id} className="flow-card">
                <div className="flow-card-header">
                  <div>
                    <h3>{flow.flow_name}</h3>
                    <p>{flow.flow_description}</p>
                  </div>
                  <div className={`flow-status ${flow.is_active ? 'active' : 'inactive'}`}>
                    {flow.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div className="flow-card-stats">
                  <div className="stat">
                    <span className="stat-value">{flow.response_count}</span>
                    <span className="stat-label">Responses</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{new Date(flow.created_at).toLocaleDateString()}</span>
                    <span className="stat-label">Created</span>
                  </div>
                </div>

                <div className="flow-card-actions">
                  <button
                    className="copy-link-btn"
                    onClick={() => copyShareLink(flow.share_token)}
                  >
                    {copiedToken === flow.share_token ? '✓ Copied!' : '📋 Copy Link'}
                  </button>
                  <button
                    className="view-responses-btn"
                    onClick={() => handleViewResponses(flow)}
                  >
                    View Responses
                  </button>
                  <button
                    className="toggle-status-btn"
                    onClick={() => handleToggleStatus(flow.id, flow.is_active)}
                  >
                    {flow.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(flow.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Responses Viewer */}
        {selectedFlow && (
          <div className="responses-viewer">
            <div className="responses-header">
              <h2>{selectedFlow.flow_name} - Responses</h2>
              <button className="close-btn" onClick={() => setSelectedFlow(null)}>×</button>
            </div>

            {/* Analytics Summary */}
            {analytics && (
              <div className="analytics-summary">
                <div className="analytics-stat">
                  <div className="analytics-value">{analytics.totalResponses}</div>
                  <div className="analytics-label">Total Responses</div>
                </div>
                <div className="analytics-stat">
                  <div className="analytics-value">{analytics.averageTime} min</div>
                  <div className="analytics-label">Avg. Completion Time</div>
                </div>
              </div>
            )}

            {/* Individual Responses */}
            <div className="responses-list">
              {responses.length === 0 ? (
                <div className="empty-state">No responses yet</div>
              ) : (
                responses.map(session => (
                  <div key={session.id} className="response-card">
                    <div className="response-header">
                      <div className="response-email">{session.respondent_email || 'Anonymous'}</div>
                      <div className="response-date">
                        {new Date(session.completed_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="response-answers">
                      {session.responses.map((response, index) => (
                        <div key={response.id} className="response-item">
                          <div className="response-question">Q{index + 1}: {response.question_text}</div>
                          <div className="response-answer">
                            {Array.isArray(response.answer_value)
                              ? response.answer_value.join(', ')
                              : JSON.stringify(response.answer_value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Flow Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create Validation Flow</h2>
            <p>Choose which stage flow you want to create:</p>

            <div className="flow-type-options">
              <div
                className={`flow-type-card ${selectedFlowType === 'validation' ? 'selected' : ''}`}
                onClick={() => setSelectedFlowType('validation')}
              >
                <h3>Validation Stage</h3>
                <p>Customer discovery questions - validate the problem and solution before building</p>
                <span className="question-count">11 questions</span>
              </div>

              <div
                className={`flow-type-card ${selectedFlowType === 'testing' ? 'selected' : ''}`}
                onClick={() => setSelectedFlowType('testing')}
              >
                <h3>Testing Stage</h3>
                <p>Product feedback questions - gather insights from beta testers</p>
                <span className="question-count">10 questions</span>
              </div>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => {
                setShowCreateModal(false)
                setSelectedFlowType(null)
              }}>
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={() => handleCreateFlow(selectedFlowType)}
                disabled={!selectedFlowType}
              >
                Create Flow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ValidationFlowsManager
