import React, { useState, useEffect, lazy, Suspense } from 'react'
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

// Lazy load heavy analytics components (~940 lines, 7 components)
const LazyResponseTimeline = lazy(() => import('../components/AdvancedAnalytics').then(m => ({ default: m.ResponseTimeline })))
const LazyFunnelVisualization = lazy(() => import('../components/AdvancedAnalytics').then(m => ({ default: m.FunnelVisualization })))
const LazyGeographicBreakdown = lazy(() => import('../components/AdvancedAnalytics').then(m => ({ default: m.GeographicBreakdown })))
const LazyQuestionBreakdown = lazy(() => import('../components/AdvancedAnalytics').then(m => ({ default: m.QuestionBreakdown })))
const LazyAnswerClustering = lazy(() => import('../components/AdvancedAnalytics').then(m => ({ default: m.AnswerClustering })))
const LazySentimentIndicators = lazy(() => import('../components/AdvancedAnalytics').then(m => ({ default: m.SentimentIndicators })))
const LazyPDFReportGenerator = lazy(() => import('../components/AdvancedAnalytics').then(m => ({ default: m.PDFReportGenerator })))
import './ValidationFlowsManager.css'
import '../Profile.css'

/**
 * ValidationFlowsManager - Creator dashboard for managing validation flows
 */

const ValidationFlowsManager = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
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
  const [validationInsight, setValidationInsight] = useState('')
  const [insightSaved, setInsightSaved] = useState(false)
  const [timePeriod, setTimePeriod] = useState('all')
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [animatedValues, setAnimatedValues] = useState({})
  const [showQuestionBreakdown, setShowQuestionBreakdown] = useState(false)
  const [allSessions, setAllSessions] = useState([])
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('overview') // overview | deep-dive
  const [openMenuId, setOpenMenuId] = useState(null) // For flow card dropdown menu
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // all | active | has_responses | validation | testing
  const [includeIncomplete, setIncludeIncomplete] = useState(true) // Show incomplete responses by default

  // Taxonomy data for dropdowns
  const [useCustomProblem, setUseCustomProblem] = useState(false)
  const [useCustomPersona, setUseCustomPersona] = useState(false)
  const [userProblems, setUserProblems] = useState([])
  const [userPersonas, setUserPersonas] = useState([])

  // Load user's AI-generated cluster labels for dropdowns
  useEffect(() => {
    if (!user?.id) return
    const loadClusters = async () => {
      const { data, error } = await supabase
        .from('nikigai_clusters')
        .select('cluster_label, cluster_type')
        .eq('user_id', user.id)
        .in('cluster_type', ['problems', 'persona'])
      if (!error && data?.length > 0) {
        setUserProblems(data.filter(c => c.cluster_type === 'problems').map(c => c.cluster_label))
        setUserPersonas(data.filter(c => c.cluster_type === 'persona').map(c => c.cluster_label))
      }
    }
    loadClusters()
  }, [user?.id])

  // Use user's clusters if available, fall back to taxonomy
  const problemOptions = userProblems.length > 0
    ? userProblems.map(label => ({ value: label, label }))
    : PROBLEM_SEGMENTS.map(s => ({
        value: s.displayName,
        label: `${s.icon} ${s.displayName}`,
        tagline: s.tagline
      }))

  const personaOptions = userPersonas.length > 0
    ? userPersonas.map(label => ({ value: label, label }))
    : PERSONA_SEGMENTS.map(s => ({
        value: s.displayName,
        label: `${s.icon} ${s.displayName}`,
        tagline: s.tagline
      }))

  useEffect(() => {
    if (user?.id) {
      loadFlows()
    }
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenuId && !e.target.closest('.more-options-container')) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenuId])

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
    setAnalyticsLoading(true)
    setActiveAnalyticsTab('overview')
    // Parallel fetch - responses and analytics at the same time
    const [data, analyticsData] = await Promise.all([
      getFlowResponses(flow.id, includeIncomplete),
      getFlowAnalytics(flow.id, timePeriod)
    ])
    setResponses(data)
    setAnalytics(analyticsData)
    // Store sessions for geographic and timeline data
    setAllSessions(analyticsData?.recentSessions || [])
    setAnalyticsLoading(false)
    // Trigger animation for values
    animateValues(analyticsData)
  }

  // Refresh responses when includeIncomplete changes
  const handleIncludeIncompleteChange = async (value) => {
    setIncludeIncomplete(value)
    if (selectedFlow) {
      setAnalyticsLoading(true)
      const data = await getFlowResponses(selectedFlow.id, value)
      setResponses(data)
      setAnalyticsLoading(false)
    }
  }

  const refreshAnalytics = async () => {
    if (!selectedFlow) return
    setAnalyticsLoading(true)
    const analyticsData = await getFlowAnalytics(selectedFlow.id, timePeriod)
    setAnalytics(analyticsData)
    setAnalyticsLoading(false)
    animateValues(analyticsData)
  }

  const handleTimePeriodChange = async (period) => {
    setTimePeriod(period)
    if (selectedFlow) {
      setAnalyticsLoading(true)
      const analyticsData = await getFlowAnalytics(selectedFlow.id, period)
      setAnalytics(analyticsData)
      setAnalyticsLoading(false)
      animateValues(analyticsData)
    }
  }

  // Animate numeric values counting up
  const animateValues = (data) => {
    if (!data) return
    setAnimatedValues({ started: 0, completed: 0, rate: 0, time: 0 })
    const duration = 800
    const steps = 30
    const interval = duration / steps
    let step = 0

    const timer = setInterval(() => {
      step++
      const progress = step / steps
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setAnimatedValues({
        started: Math.round(data.totalStarted * easeOut),
        completed: Math.round(data.totalCompleted * easeOut),
        rate: Math.round(data.completionRate * easeOut),
        time: Math.round(data.averageTime * easeOut)
      })
      if (step >= steps) clearInterval(timer)
    }, interval)
  }

  // Get color based on completion rate
  const getCompletionRateColor = (rate) => {
    if (rate >= 70) return 'good'
    if (rate >= 40) return 'moderate'
    return 'poor'
  }

  // Render mini sparkline
  const renderSparkline = (data) => {
    if (!data || data.length === 0) return null
    const max = Math.max(...data.map(d => d.completed), 1)
    const width = 60
    const height = 20
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - (d.completed / max) * height
      return `${x},${y}`
    }).join(' ')

    return (
      <svg className="sparkline" width={width} height={height}>
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  // Render trend indicator
  const renderTrendIndicator = (change) => {
    if (change === null || change === undefined) return null
    if (change > 0) return <span className="trend-indicator up">↑{change}</span>
    if (change < 0) return <span className="trend-indicator down">↓{Math.abs(change)}</span>
    return <span className="trend-indicator neutral">—</span>
  }

  // Render progress ring
  const renderProgressRing = (percentage) => {
    const size = 80
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference
    const colorClass = getCompletionRateColor(percentage)

    return (
      <div className={`progress-ring-container ${colorClass}`}>
        <svg width={size} height={size} className="progress-ring">
          <circle
            className="progress-ring-bg"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className="progress-ring-fill"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%'
            }}
          />
        </svg>
        <div className="progress-ring-value">{percentage}%</div>
      </div>
    )
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

  // Save validation insight (Touch Point 2 - POST-ACTION)
  const saveValidationInsight = async () => {
    if (!validationInsight.trim() || !selectedFlow || !user?.id) return

    try {
      await supabase.from('flow_sessions').insert({
        user_id: user.id,
        flow_type: 'validation_insight',
        flow_version: 'v1',
        status: 'completed',
        last_step_id: 'insight_captured',
        step_data: {
          stage: 1,
          source: 'validation_ai_summary',
          action_type: 'analyze_validation_responses',
          key_takeaway: validationInsight.trim(),
          flow_id: selectedFlow.id,
          flow_name: selectedFlow.flow_name,
          responses_analyzed: responses.length,
          timestamp: new Date().toISOString()
        }
      })
      setInsightSaved(true)
      // Reset after 3 seconds
      setTimeout(() => setInsightSaved(false), 3000)
    } catch (err) {
      console.warn('Failed to save validation insight:', err)
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

  // Filter flows based on search and status
  const filteredFlows = flows.filter(flow => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = flow.flow_name?.toLowerCase().includes(query)
      const matchesDesc = flow.flow_description?.toLowerCase().includes(query)
      if (!matchesName && !matchesDesc) return false
    }
    // Status filter
    if (filterStatus === 'active' && !flow.is_active) return false
    if (filterStatus === 'inactive' && flow.is_active) return false
    if (filterStatus === 'has_responses' && (flow.response_count || 0) === 0) return false
    if (filterStatus === 'validation' && flow.stage !== 'validation') return false
    if (filterStatus === 'testing' && flow.stage !== 'testing') return false
    return true
  })

  // Get time ago string
  const getTimeAgo = (dateString) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container validation-flows-page">
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
          <div className="flows-list-header">
            <h2>Your Flows</h2>
            <span className="flow-count">{flows.length} total</span>
          </div>

          {/* Search & Filter Bar */}
          <div className="search-filter-bar">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search flows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>
            <div className="filter-chips">
              <button
                className={`filter-chip ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                All
              </button>
              <button
                className={`filter-chip ${filterStatus === 'active' ? 'active' : ''}`}
                onClick={() => setFilterStatus('active')}
              >
                Active
              </button>
              <button
                className={`filter-chip ${filterStatus === 'validation' ? 'active' : ''}`}
                onClick={() => setFilterStatus('validation')}
              >
                Validation
              </button>
              <button
                className={`filter-chip ${filterStatus === 'testing' ? 'active' : ''}`}
                onClick={() => setFilterStatus('testing')}
              >
                Testing
              </button>
              <button
                className={`filter-chip ${filterStatus === 'has_responses' ? 'active' : ''}`}
                onClick={() => setFilterStatus('has_responses')}
              >
                Has Responses
              </button>
            </div>
          </div>

          {flows.length === 0 ? (
            <div className="empty-state-v2">
              <div className="empty-illustration">
                <div className="empty-icon-circle">
                  <span>📋</span>
                </div>
                <div className="empty-decorations">
                  <span className="decoration d1"></span>
                  <span className="decoration d2"></span>
                  <span className="decoration d3"></span>
                </div>
              </div>
              <h3>Create your first validation flow</h3>
              <p>Validation flows help you collect feedback from potential customers before building your product.</p>
              <button className="empty-cta-btn" onClick={() => setShowCreateModal(true)}>
                + Create Validation Flow
              </button>
            </div>
          ) : filteredFlows.length === 0 ? (
            <div className="no-results">
              <span className="no-results-icon">🔍</span>
              <p>No flows match your search</p>
              <button className="clear-filters-btn" onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="flows-grid">
              {filteredFlows.map(flow => (
                <div key={flow.id} className={`flow-card-v2 ${!flow.is_active ? 'inactive' : ''}`}>
                  <div className="card-accent"></div>

                  <div className="card-content">
                    <div className="card-top">
                      <div className="card-title-section">
                        <div className="title-row">
                          <h3>{flow.flow_name}</h3>
                          {flow.stage && (
                            <span className={`flow-type-tag ${flow.stage}`}>
                              {flow.stage === 'validation' ? 'Validation' : 'Testing'}
                            </span>
                          )}
                        </div>
                        <p className="card-description">{flow.flow_description}</p>
                      </div>
                      <div className={`status-badge ${flow.is_active ? 'active' : 'inactive'}`}>
                        <span className="status-dot"></span>
                        {flow.is_active ? 'Live' : 'Paused'}
                      </div>
                    </div>

                    <div className="card-stats">
                      <div className="stat-item">
                        <span className="stat-number">{flow.response_count || 0}</span>
                        <span className="stat-label">responses</span>
                      </div>
                      <div className="stat-divider"></div>
                      <div className="stat-item">
                        <span className="stat-date">{new Date(flow.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="stat-label">created</span>
                      </div>
                    </div>

                    <div className="card-actions">
                      {/* Primary Action */}
                      <button
                        className="btn-primary"
                        onClick={() => handleViewResponses(flow)}
                      >
                        View Responses
                      </button>

                      {/* Icon Actions */}
                      <div className="icon-actions">
                        <button
                          className="icon-btn"
                          onClick={() => copyShareLink(flow.share_token)}
                          title="Copy share link"
                        >
                          {copiedToken === flow.share_token ? '✓' : '🔗'}
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => setQrCodeFlow(flow)}
                          title="QR Code"
                        >
                          📱
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => handlePreviewFlow(flow)}
                          title="Preview"
                        >
                          👁️
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => handleEditFlow(flow)}
                          title="Edit"
                        >
                          ✏️
                        </button>

                        {/* More Options */}
                        <div className="more-options-container">
                          <button
                            className="icon-btn"
                            onClick={() => setOpenMenuId(openMenuId === flow.id ? null : flow.id)}
                            title="More"
                          >
                            ⋯
                          </button>
                          {openMenuId === flow.id && (
                            <div className="dropdown-menu">
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  handleToggleStatus(flow.id, flow.is_active)
                                  setOpenMenuId(null)
                                }}
                              >
                                {flow.is_active ? '⏸️ Pause' : '▶️ Resume'}
                              </button>
                              <button
                                className="dropdown-item danger"
                                onClick={() => {
                                  handleDelete(flow.id)
                                  setOpenMenuId(null)
                                }}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Responses Viewer */}
        {selectedFlow && (
          <div className="responses-viewer">
            {/* Toolbar Header */}
            <div className="rv-toolbar">
              <button className="rv-back" onClick={() => setSelectedFlow(null)}>&larr;</button>
              <span className="rv-toolbar-title">Responses</span>
              <button className="rv-close" onClick={() => setSelectedFlow(null)}>&times;</button>
            </div>

            {/* Flow Name */}
            <h2 className="rv-flow-name">{selectedFlow.flow_name}</h2>

            {/* Action Chips */}
            <div className="rv-action-bar">
              <label className="rv-chip rv-chip-toggle" title="Show responses from people who started but didn't finish">
                <input
                  type="checkbox"
                  checked={includeIncomplete}
                  onChange={(e) => handleIncludeIncompleteChange(e.target.checked)}
                />
                <span>In-progress</span>
              </label>
              <button
                className="rv-chip rv-chip-gold"
                onClick={exportToCSV}
                disabled={responses.length === 0}
              >
                Export CSV
              </button>
            </div>

            {/* Analytics Hero Card (stats only) */}
            <div className="analytics-dashboard enhanced">
              <div className="rv-hero-eyebrow">Analytics</div>

              {/* Time Period Tabs */}
              <div className="time-period-tabs">
                <button
                  className={`period-tab ${timePeriod === '7days' ? 'active' : ''}`}
                  onClick={() => handleTimePeriodChange('7days')}
                >
                  7 days
                </button>
                <button
                  className={`period-tab ${timePeriod === '30days' ? 'active' : ''}`}
                  onClick={() => handleTimePeriodChange('30days')}
                >
                  30 days
                </button>
                <button
                  className={`period-tab ${timePeriod === 'all' ? 'active' : ''}`}
                  onClick={() => handleTimePeriodChange('all')}
                >
                  All time
                </button>
                <button
                  className={`refresh-btn ${analyticsLoading ? 'loading' : ''}`}
                  onClick={refreshAnalytics}
                  disabled={analyticsLoading}
                  title="Refresh analytics"
                >
                  {analyticsLoading ? (
                    <span className="refresh-spinner"></span>
                  ) : (
                    '↻'
                  )}
                </button>
              </div>

              {/* Stats Grid */}
              {analyticsLoading && !analytics ? (
                <div className="analytics-loading">
                  <div className="spinner"></div>
                  <p>Loading analytics...</p>
                </div>
              ) : analytics && (analytics.totalStarted > 0 || analytics.totalCompleted > 0) ? (
                <div className="analytics-summary">
                  <div className="analytics-stat" title="Total number of people who started the survey">
                    <div className="stat-header">
                      <div className="analytics-value animate-value">
                        {animatedValues.started ?? analytics.totalStarted ?? 0}
                      </div>
                      {analytics.trends && renderTrendIndicator(analytics.trends.startedChange)}
                    </div>
                    <div className="analytics-label">Started</div>
                    {analytics.sparklineData && (
                      <div className="sparkline-container">
                        {renderSparkline(analytics.sparklineData)}
                      </div>
                    )}
                  </div>

                  <div className="analytics-stat highlight" title="Number of people who completed all questions">
                    <div className="stat-header">
                      <div className="analytics-value animate-value">
                        {animatedValues.completed ?? analytics.totalCompleted ?? 0}
                      </div>
                      {analytics.trends && renderTrendIndicator(analytics.trends.completedChange)}
                    </div>
                    <div className="analytics-label">Completed</div>
                  </div>

                  <div className={`analytics-stat completion-rate ${getCompletionRateColor(analytics.completionRate || 0)}`} title="Percentage of starters who completed the survey. Green: 70%+, Yellow: 40-70%, Red: below 40%">
                    {renderProgressRing(animatedValues.rate ?? analytics.completionRate ?? 0)}
                    <div className="analytics-label">Completion Rate</div>
                    {analytics.trends && renderTrendIndicator(analytics.trends.rateChange)}
                  </div>

                  <div className="analytics-stat" title="Average time to complete the survey">
                    <div className="analytics-value animate-value">
                      {animatedValues.time ?? analytics.averageTime ?? 0} <span className="unit">min</span>
                    </div>
                    <div className="analytics-label">Avg. Time</div>
                  </div>
                </div>
              ) : (
                /* Empty State */
                <div className="analytics-empty-state">
                  <div className="empty-illustration">
                    <span className="empty-icon">📊</span>
                    <div className="empty-decoration">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  </div>
                  <h3>No responses yet</h3>
                  <p>Share your validation flow to start collecting feedback. Once people respond, you'll see detailed analytics here.</p>
                  <button
                    className="share-cta-btn"
                    onClick={() => copyShareLink(selectedFlow.share_token)}
                  >
                    {copiedToken === selectedFlow.share_token ? '✓ Link Copied!' : '📋 Copy Share Link'}
                  </button>
                </div>
              )}
            </div>

            {/* White Cards - outside the hero */}
            {analytics && (analytics.totalStarted > 0 || analytics.totalCompleted > 0) && (
              <>
                {/* Device Breakdown Card */}
                {analytics.deviceBreakdown && (analytics.deviceBreakdown.mobile > 0 || analytics.deviceBreakdown.desktop > 0) && (
                  <div className="rv-content-card">
                    <div className="rv-card-eyebrow">
                      <span className="rv-card-eyebrow-icon">📱</span>
                      Devices
                    </div>
                    <div className="rv-device-row">
                      <div className="rv-device-item">
                        <span className="rv-device-icon">📱</span>
                        <div className="rv-device-info">
                          <div className="rv-device-count">{analytics.deviceBreakdown.mobile || 0}</div>
                          <div className="rv-device-label">Mobile</div>
                        </div>
                      </div>
                      <div className="rv-device-item">
                        <span className="rv-device-icon">💻</span>
                        <div className="rv-device-info">
                          <div className="rv-device-count">{analytics.deviceBreakdown.desktop || 0}</div>
                          <div className="rv-device-label">Desktop</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Drop-off Funnel Card */}
                {analytics.dropOffFunnel && Object.keys(analytics.dropOffFunnel).length > 0 && (
                  <div className="rv-content-card">
                    <div className="rv-card-eyebrow">
                      <span className="rv-card-eyebrow-icon">📉</span>
                      Drop-off Points
                    </div>
                    <div className="dropoff-funnel">
                      {Object.entries(analytics.dropOffFunnel)
                        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                        .map(([step, count]) => (
                          <div key={step} className="rv-funnel-item animate-bar">
                            <span className="rv-funnel-step">Q{parseInt(step) + 1}</span>
                            <div className="rv-funnel-track">
                              <div
                                className="rv-funnel-fill"
                                style={{
                                  width: `${Math.min(100, (count / Math.max(1, analytics.totalStarted - analytics.totalCompleted)) * 100)}%`
                                }}
                              />
                            </div>
                            <span className="rv-funnel-count">{count} left</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Tab Switcher */}
                <div className="rv-tab-row">
                  <button
                    className={`rv-tab ${activeAnalyticsTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveAnalyticsTab('overview')}
                  >
                    Overview
                  </button>
                  <button
                    className={`rv-tab ${activeAnalyticsTab === 'deep-dive' ? 'active' : ''}`}
                    onClick={() => setActiveAnalyticsTab('deep-dive')}
                  >
                    Deep Dive
                  </button>
                  <button
                    className="rv-tab rv-tab-gold"
                    onClick={() => setShowQuestionBreakdown(true)}
                  >
                    All Answers
                  </button>
                  <Suspense fallback={null}>
                    <LazyPDFReportGenerator
                      flow={selectedFlow}
                      analytics={analytics}
                      responses={responses}
                    />
                  </Suspense>
                </div>

                {/* Tab Content */}
                {activeAnalyticsTab === 'overview' && (
                  <div className="rv-content-card rv-tab-content">
                    <Suspense fallback={<div className="analytics-loading-state"><div className="spinner"></div></div>}>
                      <LazyResponseTimeline data={allSessions} period={timePeriod} />
                      <LazyFunnelVisualization
                        analytics={analytics}
                        questions={responses?.[0]?.responses?.map(r => r.question_text) || []}
                      />
                      <LazyGeographicBreakdown sessions={allSessions} />
                    </Suspense>
                  </div>
                )}

                {activeAnalyticsTab === 'deep-dive' && (
                  <div className="rv-content-card rv-tab-content">
                    <Suspense fallback={<div className="analytics-loading-state"><div className="spinner"></div></div>}>
                      <LazySentimentIndicators responses={responses} />
                      <LazyAnswerClustering responses={responses} flowId={selectedFlow?.id} />
                    </Suspense>
                  </div>
                )}
              </>
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

                  {/* Insight Capture - POST-ACTION Touch Point 2 */}
                  <div className="insight-capture-section">
                    <div className="insight-capture-divider"></div>
                    <h4 className="insight-capture-question">
                      What's your biggest takeaway from this validation?
                    </h4>
                    <textarea
                      className="insight-capture-textarea"
                      placeholder="e.g., People care more about speed than price..."
                      value={validationInsight}
                      onChange={(e) => setValidationInsight(e.target.value)}
                      rows={2}
                    />
                    <div className="insight-capture-actions">
                      <span className="insight-capture-hint">Optional — capture insights for future reference</span>
                      <button
                        className={`insight-save-btn ${insightSaved ? 'saved' : ''}`}
                        onClick={saveValidationInsight}
                        disabled={!validationInsight.trim() || insightSaved}
                      >
                        {insightSaved ? '✓ Saved' : 'Save Insight'}
                      </button>
                    </div>
                  </div>
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
                  <div key={session.id} className={`response-card ${!session.is_completed ? 'incomplete' : ''}`}>
                    <div className="response-header">
                      <div className="response-email">
                        {session.respondent_email || 'Anonymous'}
                        {!session.is_completed && (
                          <span className="incomplete-badge" title="This person started but hasn't finished the survey">In Progress</span>
                        )}
                      </div>
                      <div className="response-date">
                        {session.completed_at
                          ? new Date(session.completed_at).toLocaleDateString()
                          : `Started ${new Date(session.started_at).toLocaleDateString()}`}
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
                    <span className="question-count">22 questions</span>
                  </div>

                  <div
                    className={`flow-type-card ${selectedFlowType === 'testing' ? 'selected' : ''}`}
                    onClick={() => setSelectedFlowType('testing')}
                  >
                    <h3>Testing Stage</h3>
                    <p>Product feedback questions - gather insights from beta testers</p>
                    <span className="question-count">11 questions</span>
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
                          <option value="">{userProblems.length > 0 ? 'Select from your problems...' : 'Select a problem domain...'}</option>
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
                          ← Choose from list
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
                          <option value="">{userPersonas.length > 0 ? 'Select from your personas...' : 'Select a persona type...'}</option>
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
                          ← Choose from list
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

        {/* Question Breakdown Modal */}
        {showQuestionBreakdown && (
          <div className="modal-overlay" onClick={() => setShowQuestionBreakdown(false)}>
            <div onClick={(e) => e.stopPropagation()}>
              <Suspense fallback={<div className="analytics-loading-state"><div className="spinner"></div></div>}>
                <LazyQuestionBreakdown
                  responses={responses}
                  onClose={() => setShowQuestionBreakdown(false)}
                />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ValidationFlowsManager
