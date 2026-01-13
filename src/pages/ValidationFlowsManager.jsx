import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import {
  getUserValidationFlows,
  createValidationFlow,
  getFlowResponses,
  toggleFlowStatus,
  deleteValidationFlow,
  getFlowAnalytics
} from '../lib/validationFlows'
import { PROBLEM_SEGMENTS, PERSONA_SEGMENTS } from '../lib/wheelTaxonomy'
import './ValidationFlowsManager.css'
import '../Profile.css'

/**
 * ValidationFlowsManager - Creator dashboard for managing validation flows
 */

const ValidationFlowsManager = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [flows, setFlows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFlow, setSelectedFlow] = useState(null)
  const [responses, setResponses] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedFlowType, setSelectedFlowType] = useState(null)
  const [createStep, setCreateStep] = useState(1) // 1 = type, 2 = context
  const [placeholders, setPlaceholders] = useState({
    problemArea: '',
    solutionConcept: '',
    audienceDescription: ''
  })
  const [copiedToken, setCopiedToken] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Taxonomy data for dropdowns
  const [useCustomProblem, setUseCustomProblem] = useState(false)
  const [useCustomPersona, setUseCustomPersona] = useState(false)

  // Format taxonomy segments for dropdowns
  const problemOptions = PROBLEM_SEGMENTS.map(s => ({
    value: s.displayName,
    label: `${s.icon} ${s.displayName}`,
    tagline: s.tagline
  }))

  const personaOptions = PERSONA_SEGMENTS.map(s => ({
    value: s.displayName,
    label: `${s.icon} ${s.displayName}`,
    tagline: s.tagline
  }))

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

  const handleCreateFlow = async () => {
    let flowConfig

    if (selectedFlowType === 'validation') {
      flowConfig = {
        name: `Validation: ${placeholders.problemArea.substring(0, 30)}...`,
        description: `Customer discovery for: ${placeholders.audienceDescription}`,
        jsonPath: 'validation-flow-vibe-riser.json',
        persona: 'vibe_riser',
        stage: 'validation'
      }
    } else if (selectedFlowType === 'testing') {
      flowConfig = {
        name: `Testing: ${placeholders.solutionConcept.substring(0, 30)}...`,
        description: `Product feedback for: ${placeholders.audienceDescription}`,
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
      flowConfig.stage,
      placeholders
    )

    if (result.success) {
      alert(`Flow created! Share URL: ${result.shareUrl}`)
      resetCreateModal()
      loadFlows()
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  const resetCreateModal = () => {
    setShowCreateModal(false)
    setSelectedFlowType(null)
    setCreateStep(1)
    setPlaceholders({
      problemArea: '',
      solutionConcept: '',
      audienceDescription: ''
    })
    setUseCustomProblem(false)
    setUseCustomPersona(false)
  }

  const canProceedToStep2 = () => selectedFlowType !== null

  const canCreateFlow = () => {
    return placeholders.problemArea.trim().length > 0 &&
           placeholders.solutionConcept.trim().length > 0 &&
           placeholders.audienceDescription.trim().length > 0
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const getUserInitials = (email) => {
    if (!email) return '?'
    const parts = email.split('@')[0].split(/[._-]/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return email.substring(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* Mobile Top Bar */}
      <div className="mobile-topbar">
        <div className="topbar-content">
          <div className="topbar-logo">FindMyFlow</div>
          <button className="hamburger-btn" onClick={toggleSidebar}>
            ☰
          </button>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? '' : 'mobile-hidden'}`}>
        <div className="logo">FindMyFlow</div>

        <div className="user-profile">
          <div className="user-avatar">{getUserInitials(user?.email)}</div>
          <div className="user-name">{user?.email?.split('@')[0] || 'User'}</div>
          <div className="user-email">{user?.email}</div>
        </div>

        <ul className="nav-menu">
          <li className="nav-item" onClick={() => { navigate('/me'); setSidebarOpen(false); }}>
            📊 Dashboard
          </li>
          <li className="nav-item" onClick={() => { navigate('/archetypes'); setSidebarOpen(false); }}>
            ✨ Archetypes
          </li>
          <li className="nav-item" onClick={() => { navigate('/7-day-challenge'); setSidebarOpen(false); }}>
            📈 7-Day Challenge
          </li>
          <li className="nav-item" onClick={() => { navigate('/flow-compass'); setSidebarOpen(false); }}>
            🧭 Flow Compass
          </li>
          <li className="nav-item active" onClick={() => setSidebarOpen(false)}>
            🔗 Validation Flows
          </li>
          <li className="nav-item" onClick={() => { navigate('/feedback'); setSidebarOpen(false); }}>
            💬 Give Feedback
          </li>
        </ul>

        <div className="signout-link" onClick={signOut}>
          Sign Out
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="manager-header">
          <div>
            <h1>Validation Flows</h1>
            <p>Create shareable validation flows to gather customer feedback</p>
          </div>
          <button className="create-flow-btn" onClick={() => setShowCreateModal(true)}>
            + Send Form
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
        <div className="modal-overlay" onClick={resetCreateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Step 1: Choose Flow Type */}
            {createStep === 1 && (
              <>
                <h2>Create Validation Flow</h2>
                <p>Choose which stage flow you want to create:</p>

                <div className="flow-type-options">
                  <div
                    className={`flow-type-card ${selectedFlowType === 'validation' ? 'selected' : ''}`}
                    onClick={() => setSelectedFlowType('validation')}
                  >
                    <h3>Validation Stage</h3>
                    <p>Customer discovery questions - validate the problem and solution before building</p>
                    <span className="question-count">13 questions</span>
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
                  <button className="cancel-btn" onClick={resetCreateModal}>
                    Cancel
                  </button>
                  <button
                    className="confirm-btn"
                    onClick={() => setCreateStep(2)}
                    disabled={!canProceedToStep2()}
                  >
                    Next: Add Context
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Add Context */}
            {createStep === 2 && (
              <>
                <h2>Add Context for Respondents</h2>
                <p>This information will be shown to people taking your survey so they understand what you're asking about.</p>

                <div className="context-form">
                  {/* Problem Area - Dropdown or Custom */}
                  <div className="form-group">
                    <label>What problem are you solving?</label>
                    {!useCustomProblem ? (
                      <div className="dropdown-with-custom">
                        <select
                          value={placeholders.problemArea}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setUseCustomProblem(true)
                              setPlaceholders({ ...placeholders, problemArea: '' })
                            } else {
                              setPlaceholders({ ...placeholders, problemArea: e.target.value })
                            }
                          }}
                        >
                          <option value="">Select a problem domain...</option>
                          {problemOptions.map((option, idx) => (
                            <option key={idx} value={option.value}>{option.label}</option>
                          ))}
                          <option value="__custom__">✏️ Write my own...</option>
                        </select>
                      </div>
                    ) : (
                      <div className="custom-input-wrapper">
                        <textarea
                          placeholder="e.g., finding clarity and purpose in their career"
                          value={placeholders.problemArea}
                          onChange={(e) => setPlaceholders({ ...placeholders, problemArea: e.target.value })}
                          rows={2}
                        />
                        <button
                          type="button"
                          className="switch-to-dropdown"
                          onClick={() => {
                            setUseCustomProblem(false)
                            setPlaceholders({ ...placeholders, problemArea: '' })
                          }}
                        >
                          ← Choose from taxonomy
                        </button>
                      </div>
                    )}
                    <span className="form-hint">This helps respondents understand the context of your questions</span>
                  </div>

                  {/* Audience - Dropdown or Custom */}
                  <div className="form-group">
                    <label>Who is this for?</label>
                    {!useCustomPersona ? (
                      <div className="dropdown-with-custom">
                        <select
                          value={placeholders.audienceDescription}
                          onChange={(e) => {
                            if (e.target.value === '__custom__') {
                              setUseCustomPersona(true)
                              setPlaceholders({ ...placeholders, audienceDescription: '' })
                            } else {
                              setPlaceholders({ ...placeholders, audienceDescription: e.target.value })
                            }
                          }}
                        >
                          <option value="">Select a persona type...</option>
                          {personaOptions.map((option, idx) => (
                            <option key={idx} value={option.value}>{option.label}</option>
                          ))}
                          <option value="__custom__">✏️ Write my own...</option>
                        </select>
                      </div>
                    ) : (
                      <div className="custom-input-wrapper">
                        <textarea
                          placeholder="e.g., professionals feeling stuck or unfulfilled"
                          value={placeholders.audienceDescription}
                          onChange={(e) => setPlaceholders({ ...placeholders, audienceDescription: e.target.value })}
                          rows={2}
                        />
                        <button
                          type="button"
                          className="switch-to-dropdown"
                          onClick={() => {
                            setUseCustomPersona(false)
                            setPlaceholders({ ...placeholders, audienceDescription: '' })
                          }}
                        >
                          ← Choose from taxonomy
                        </button>
                      </div>
                    )}
                    <span className="form-hint">Describe your target audience so they can self-identify</span>
                  </div>

                  {/* Solution - Always textarea (moved to last) */}
                  <div className="form-group">
                    <label>What solution are you exploring?</label>
                    <textarea
                      placeholder="e.g., a guided discovery process to uncover your ideal path"
                      value={placeholders.solutionConcept}
                      onChange={(e) => setPlaceholders({ ...placeholders, solutionConcept: e.target.value })}
                      rows={2}
                    />
                    <span className="form-hint">Briefly describe what you're thinking of building</span>
                  </div>
                </div>

                <div className="modal-actions">
                  <button className="cancel-btn" onClick={() => setCreateStep(1)}>
                    Back
                  </button>
                  <button
                    className="confirm-btn"
                    onClick={handleCreateFlow}
                    disabled={!canCreateFlow()}
                  >
                    Create Flow
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  )
}

export default ValidationFlowsManager
