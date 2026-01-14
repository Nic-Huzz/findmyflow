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
  const [previewFlow, setPreviewFlow] = useState(null)
  const [previewSteps, setPreviewSteps] = useState([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [qrCodeFlow, setQrCodeFlow] = useState(null)
  const [editFlow, setEditFlow] = useState(null)
  const [editPlaceholders, setEditPlaceholders] = useState({
    problemArea: '',
    solutionConcept: '',
    audienceDescription: ''
  })
  const [editSaving, setEditSaving] = useState(false)
  const [aiSummary, setAiSummary] = useState(null)
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false)

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
    setAiSummary(null) // Clear previous AI summary
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

  // Export responses to CSV
  const exportToCSV = () => {
    if (!responses || responses.length === 0) {
      alert('No responses to export')
      return
    }

    // Get all unique questions across responses
    const allQuestions = new Set()
    responses.forEach(session => {
      session.responses.forEach((r, idx) => {
        allQuestions.add(`Q${idx + 1}: ${r.question_text}`)
      })
    })
    const questionHeaders = Array.from(allQuestions)

    // Build CSV header
    const headers = ['Email', 'Completed At', ...questionHeaders]

    // Build CSV rows
    const rows = responses.map(session => {
      const row = [
        session.respondent_email || 'Anonymous',
        new Date(session.completed_at).toLocaleString()
      ]

      // Add answers in order
      questionHeaders.forEach((qHeader, idx) => {
        const response = session.responses[idx]
        if (response) {
          const answer = Array.isArray(response.answer_value)
            ? response.answer_value.join('; ')
            : String(response.answer_value || '')
          row.push(`"${answer.replace(/"/g, '""')}"`)
        } else {
          row.push('')
        }
      })

      return row
    })

    // Create CSV content
    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(r => r.join(','))
    ].join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${selectedFlow.flow_name.replace(/[^a-z0-9]/gi, '_')}_responses_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Preview flow
  const handlePreviewFlow = async (flow) => {
    setPreviewFlow(flow)
    setPreviewLoading(true)

    try {
      const response = await fetch(`/${flow.flow_json_path}`)
      if (!response.ok) throw new Error('Failed to load flow questions')

      const flowJson = await response.json()

      // Replace placeholders in steps
      const mergedPlaceholders = {
        ...(flowJson.placeholders || {}),
        ...(flow.placeholders || {})
      }

      const processedSteps = flowJson.steps.map(step => ({
        ...step,
        assistant_prompt: replacePlaceholdersInText(step.assistant_prompt, mergedPlaceholders)
      }))

      setPreviewSteps(processedSteps)
    } catch (err) {
      console.error('Error loading preview:', err)
      setPreviewSteps([])
    } finally {
      setPreviewLoading(false)
    }
  }

  const replacePlaceholdersInText = (text, placeholders) => {
    if (!text || !placeholders) return text
    let result = text
    Object.entries(placeholders).forEach(([key, value]) => {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      result = result.replace(pattern, value)
    })
    return result
  }

  const closePreview = () => {
    setPreviewFlow(null)
    setPreviewSteps([])
  }

  // Edit flow
  const handleEditFlow = (flow) => {
    setEditFlow(flow)
    setEditPlaceholders({
      problemArea: flow.placeholders?.problemArea || '',
      solutionConcept: flow.placeholders?.solutionConcept || '',
      audienceDescription: flow.placeholders?.audienceDescription || ''
    })
  }

  const handleSaveEdit = async () => {
    if (!editFlow) return

    setEditSaving(true)
    try {
      // Update flow name and description based on new placeholders
      const newName = editFlow.flow_json_path?.includes('testing')
        ? `Testing: ${editPlaceholders.solutionConcept.substring(0, 30)}...`
        : `Validation: ${editPlaceholders.problemArea.substring(0, 30)}...`

      const newDescription = `For: ${editPlaceholders.audienceDescription}`

      const { error } = await supabase
        .from('validation_flows')
        .update({
          flow_name: newName,
          flow_description: newDescription,
          placeholders: editPlaceholders,
          updated_at: new Date().toISOString()
        })
        .eq('id', editFlow.id)

      if (error) throw error

      loadFlows()
      closeEditModal()
    } catch (err) {
      console.error('Error updating flow:', err)
      alert('Failed to update flow. Please try again.')
    } finally {
      setEditSaving(false)
    }
  }

  const closeEditModal = () => {
    setEditFlow(null)
    setEditPlaceholders({
      problemArea: '',
      solutionConcept: '',
      audienceDescription: ''
    })
  }

  const canSaveEdit = () => {
    return editPlaceholders.problemArea.trim().length > 0 &&
           editPlaceholders.solutionConcept.trim().length > 0 &&
           editPlaceholders.audienceDescription.trim().length > 0
  }

  // Generate AI Summary
  const generateAiSummary = async () => {
    if (!responses || responses.length === 0) {
      alert('No responses to summarize')
      return
    }

    setAiSummaryLoading(true)
    setAiSummary(null)

    try {
      // Prepare responses for summarization
      const responseData = responses.map(session => ({
        email: session.respondent_email || 'Anonymous',
        answers: session.responses.map((r, idx) => ({
          question: `Q${idx + 1}: ${r.question_text}`,
          answer: Array.isArray(r.answer_value)
            ? r.answer_value.join(', ')
            : String(r.answer_value || '')
        }))
      }))

      // Call edge function for AI summary
      const { data, error } = await supabase.functions.invoke('validation-summary', {
        body: {
          flowName: selectedFlow.flow_name,
          flowDescription: selectedFlow.flow_description,
          responses: responseData,
          totalResponses: responses.length
        }
      })

      if (error) throw error

      setAiSummary(data.summary)
    } catch (err) {
      console.error('Error generating AI summary:', err)
      // Fallback to local summary if edge function fails
      generateLocalSummary()
    } finally {
      setAiSummaryLoading(false)
    }
  }

  // Fallback local summary if edge function unavailable
  const generateLocalSummary = () => {
    if (!responses || responses.length === 0) return

    const summary = {
      overview: `Analysis of ${responses.length} responses for "${selectedFlow.flow_name}"`,
      highlights: [],
      patterns: []
    }

    // Analyze each question's responses
    const questionAnswers = {}
    responses.forEach(session => {
      session.responses.forEach((r, idx) => {
        const key = `Q${idx + 1}`
        if (!questionAnswers[key]) {
          questionAnswers[key] = { question: r.question_text, answers: [] }
        }
        const answer = Array.isArray(r.answer_value)
          ? r.answer_value.join(', ')
          : String(r.answer_value || '')
        if (answer) questionAnswers[key].answers.push(answer)
      })
    })

    // Find common themes
    Object.entries(questionAnswers).forEach(([key, data]) => {
      if (data.answers.length > 0) {
        const uniqueAnswers = [...new Set(data.answers)]
        if (uniqueAnswers.length <= 3 && data.answers.length > 1) {
          summary.patterns.push(`${key}: Common answer - "${uniqueAnswers[0]}"`)
        } else {
          summary.highlights.push(`${key}: ${data.answers.length} diverse responses`)
        }
      }
    })

    if (summary.patterns.length === 0) {
      summary.patterns.push('Responses show diverse perspectives across questions')
    }

    setAiSummary(summary)
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
                    className="qr-btn"
                    onClick={() => setQrCodeFlow(flow)}
                  >
                    📱 QR Code
                  </button>
                  <button
                    className="preview-btn"
                    onClick={() => handlePreviewFlow(flow)}
                  >
                    👁️ Preview
                  </button>
                  <button
                    className="view-responses-btn"
                    onClick={() => handleViewResponses(flow)}
                  >
                    View Responses
                  </button>
                  <button
                    className="edit-btn"
                    onClick={() => handleEditFlow(flow)}
                  >
                    ✏️ Edit
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
              <div className="responses-header-actions">
                <button
                  className="export-btn"
                  onClick={exportToCSV}
                  disabled={responses.length === 0}
                >
                  📥 Export CSV
                </button>
                <button className="close-btn" onClick={() => setSelectedFlow(null)}>×</button>
              </div>
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

            {/* AI Summary Section */}
            <div className="ai-summary-section">
              <div className="ai-summary-header">
                <h3>🤖 AI Insights</h3>
                <button
                  className="generate-summary-btn"
                  onClick={generateAiSummary}
                  disabled={aiSummaryLoading || responses.length === 0}
                >
                  {aiSummaryLoading ? 'Analyzing...' : aiSummary ? 'Regenerate' : 'Generate Summary'}
                </button>
              </div>

              {aiSummaryLoading && (
                <div className="ai-summary-loading">
                  <div className="spinner"></div>
                  <p>Analyzing responses...</p>
                </div>
              )}

              {aiSummary && !aiSummaryLoading && (
                <div className="ai-summary-content">
                  {typeof aiSummary === 'string' ? (
                    <p className="ai-summary-text">{aiSummary}</p>
                  ) : (
                    <>
                      <p className="ai-summary-overview">{aiSummary.overview}</p>
                      {aiSummary.highlights && aiSummary.highlights.length > 0 && (
                        <div className="ai-summary-list">
                          <h4>Key Highlights</h4>
                          <ul>
                            {aiSummary.highlights.map((h, i) => (
                              <li key={i}>{h}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiSummary.patterns && aiSummary.patterns.length > 0 && (
                        <div className="ai-summary-list">
                          <h4>Patterns Found</h4>
                          <ul>
                            {aiSummary.patterns.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {!aiSummary && !aiSummaryLoading && responses.length > 0 && (
                <p className="ai-summary-hint">Click "Generate Summary" to get AI-powered insights from your responses.</p>
              )}
            </div>

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

        {/* Preview Modal */}
        {previewFlow && (
          <div className="modal-overlay" onClick={closePreview}>
            <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
              <div className="preview-header">
                <h2>Flow Preview</h2>
                <p>{previewFlow.flow_name}</p>
                <button className="close-btn" onClick={closePreview}>×</button>
              </div>

              {previewLoading ? (
                <div className="preview-loading">
                  <div className="spinner"></div>
                  <p>Loading preview...</p>
                </div>
              ) : (
                <div className="preview-steps">
                  {previewSteps.map((step, index) => (
                    <div key={step.id || index} className="preview-step">
                      <div className="preview-step-number">{index + 1}</div>
                      <div className="preview-step-content">
                        <div className="preview-question">{step.assistant_prompt}</div>
                        {step.expected_inputs?.[0] && (
                          <div className="preview-input-type">
                            Input type: <span>{step.expected_inputs[0].type}</span>
                            {step.expected_inputs[0].options && (
                              <div className="preview-options">
                                Options: {step.expected_inputs[0].options.join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="preview-footer">
                <a
                  href={`/v/${previewFlow.share_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="open-flow-btn"
                >
                  Open Full Flow →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {qrCodeFlow && (
          <div className="modal-overlay" onClick={() => setQrCodeFlow(null)}>
            <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
              <div className="qr-header">
                <h2>Share via QR Code</h2>
                <p>{qrCodeFlow.flow_name}</p>
                <button className="close-btn" onClick={() => setQrCodeFlow(null)}>×</button>
              </div>

              <div className="qr-content">
                <div className="qr-code-container">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/v/${qrCodeFlow.share_token}`)}`}
                    alt="QR Code"
                    className="qr-code-image"
                  />
                </div>

                <div className="qr-url">
                  <code>{`${window.location.origin}/v/${qrCodeFlow.share_token}`}</code>
                </div>

                <div className="qr-actions">
                  <button
                    className="copy-url-btn"
                    onClick={() => copyShareLink(qrCodeFlow.share_token)}
                  >
                    {copiedToken === qrCodeFlow.share_token ? '✓ Copied!' : '📋 Copy URL'}
                  </button>
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=${encodeURIComponent(`${window.location.origin}/v/${qrCodeFlow.share_token}`)}`}
                    download={`${qrCodeFlow.flow_name.replace(/[^a-z0-9]/gi, '_')}_qr.png`}
                    className="download-qr-btn"
                  >
                    ⬇️ Download QR
                  </a>
                </div>
              </div>

              <div className="qr-tip">
                Print this QR code or share it in person to quickly get people to your validation survey.
              </div>
            </div>
          </div>
        )}

        {/* Edit Flow Modal */}
        {editFlow && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Edit Flow Context</h2>
              <p>Update the context information for your validation survey.</p>

              <div className="context-form">
                <div className="form-group">
                  <label>What problem are you solving?</label>
                  <textarea
                    placeholder="e.g., finding clarity and purpose in their career"
                    value={editPlaceholders.problemArea}
                    onChange={(e) => setEditPlaceholders({ ...editPlaceholders, problemArea: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label>Who is this for?</label>
                  <textarea
                    placeholder="e.g., professionals feeling stuck or unfulfilled"
                    value={editPlaceholders.audienceDescription}
                    onChange={(e) => setEditPlaceholders({ ...editPlaceholders, audienceDescription: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label>What solution are you exploring?</label>
                  <textarea
                    placeholder="e.g., a guided discovery process to uncover your ideal path"
                    value={editPlaceholders.solutionConcept}
                    onChange={(e) => setEditPlaceholders({ ...editPlaceholders, solutionConcept: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={closeEditModal}>
                  Cancel
                </button>
                <button
                  className="confirm-btn"
                  onClick={handleSaveEdit}
                  disabled={!canSaveEdit() || editSaving}
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ValidationFlowsManager
