/**
 * ChecklistDisplay - Displays implementation checklist for recommended offers
 *
 * Part of Tier 1 & Tier 2 Sales Tower implementation.
 * Shows phases, tasks, metrics, and allows PDF/print export.
 * Tier 2: Adds "Start Tracking" button to create tracked implementations.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { getOfferChecklist, generatePrintableChecklist } from '../../lib/implementationChecklists'
import {
  checkExistingImplementation,
  createImplementation,
  CATEGORY_TO_FLOW_TYPE
} from '../../lib/crm/implementationService'
import './ChecklistDisplay.css'

// Map flow type to category
const FLOW_TYPE_TO_CATEGORY = {
  attraction_offer: 'attraction',
  upsell_flow: 'upsell',
  downsell_flow: 'downsell',
  continuity_flow: 'continuity'
}

function ChecklistDisplay({ flowType, offerId, offerName, projectId: propProjectId }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [checklist, setChecklist] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedPhases, setExpandedPhases] = useState({})
  const [existingImpl, setExistingImpl] = useState(null)
  const [checkingImpl, setCheckingImpl] = useState(false)
  const [creatingImpl, setCreatingImpl] = useState(false)

  // Get project ID from props or localStorage
  const getProjectId = () => {
    if (propProjectId) return propProjectId
    const saved = localStorage.getItem('crm_current_project')
    if (saved) {
      try {
        return JSON.parse(saved)?.id
      } catch { return null }
    }
    return null
  }

  const projectId = getProjectId()
  const category = FLOW_TYPE_TO_CATEGORY[flowType]

  useEffect(() => {
    async function loadChecklist() {
      setIsLoading(true)
      const data = await getOfferChecklist(flowType, offerId)
      setChecklist(data)
      setIsLoading(false)
    }
    if (flowType && offerId) {
      loadChecklist()
    }
  }, [flowType, offerId])

  // Check if implementation already exists
  useEffect(() => {
    async function checkImpl() {
      if (!user?.id || !projectId || !offerId) return
      setCheckingImpl(true)
      try {
        const { exists, implementation } = await checkExistingImplementation(
          user.id,
          projectId,
          offerId
        )
        if (exists) {
          setExistingImpl(implementation)
        }
      } catch (err) {
        console.error('Error checking implementation:', err)
      } finally {
        setCheckingImpl(false)
      }
    }
    checkImpl()
  }, [user?.id, projectId, offerId])

  const handleStartTracking = async () => {
    if (!user?.id || !projectId || !offerId || !category) {
      // No project selected - prompt user
      alert('Please select a project from the CRM first to track this implementation.')
      return
    }

    setCreatingImpl(true)
    try {
      const { data, error } = await createImplementation(user.id, {
        projectId,
        offerType: offerId,
        category
      })

      if (error) throw error

      // Navigate to tracker with this implementation expanded
      navigate(`/crm/implementations?id=${data.id}`)
    } catch (err) {
      console.error('Error creating implementation:', err)
      alert('Failed to create implementation. Please try again.')
    } finally {
      setCreatingImpl(false)
    }
  }

  const handleContinueTracking = () => {
    if (existingImpl?.id) {
      navigate(`/crm/implementations?id=${existingImpl.id}`)
    }
  }

  const togglePhase = (phaseIndex) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseIndex]: !prev[phaseIndex]
    }))
  }

  const handlePrint = () => {
    const markdown = generatePrintableChecklist(checklist)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${checklist?.name || offerName} - Implementation Checklist</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 800px;
                margin: 40px auto;
                padding: 20px;
                line-height: 1.6;
                color: #1a1a2e;
              }
              h1 { color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
              h2 { color: #4f46e5; margin-top: 24px; }
              h3 { color: #6366f1; }
              blockquote {
                background: #f0f0ff;
                border-left: 4px solid #6366f1;
                padding: 12px 16px;
                margin: 16px 0;
                font-style: italic;
              }
              ul { padding-left: 24px; }
              li { margin: 8px 0; }
              input[type="checkbox"] { margin-right: 8px; }
              @media print {
                body { margin: 20px; }
              }
            </style>
          </head>
          <body>
            <pre style="white-space: pre-wrap; font-family: inherit;">${markdown
              .replace(/^# (.+)$/gm, '<h1>$1</h1>')
              .replace(/^## (.+)$/gm, '<h2>$1</h2>')
              .replace(/^### (.+)$/gm, '<h3>$1</h3>')
              .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
              .replace(/^- \[ \] \*\*(.+)\*\*$/gm, '<li><input type="checkbox"><strong>$1</strong></li>')
              .replace(/^- (.+)$/gm, '<li>$1</li>')
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.+?)\*/g, '<em>$1</em>')
            }</pre>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleDownload = () => {
    const markdown = generatePrintableChecklist(checklist)
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(checklist?.name || offerName || 'checklist').replace(/\s+/g, '_')}_implementation.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="checklist-display loading">
        <div className="checklist-loading-spinner"></div>
        <p>Loading implementation checklist...</p>
      </div>
    )
  }

  if (!checklist) {
    return null // No checklist available for this offer
  }

  const totalTasks = checklist.implementation_checklist?.reduce(
    (sum, phase) => sum + (phase.tasks?.length || 0), 0
  ) || 0

  return (
    <div className={`checklist-display ${isExpanded ? 'expanded' : ''}`}>
      <button
        className="checklist-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="checklist-toggle-icon">{isExpanded ? '📋' : '📋'}</span>
        <span className="checklist-toggle-text">
          {isExpanded ? 'Hide' : 'Show'} Implementation Checklist
        </span>
        <span className="checklist-toggle-count">
          {totalTasks} tasks
        </span>
        <span className="checklist-toggle-arrow">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {isExpanded && (
        <div className="checklist-content">
          {/* Target Metrics */}
          {checklist.target_metrics && (
            <div className="checklist-metrics">
              <h4>Target Metrics</h4>
              <div className="metrics-grid">
                {Object.entries(checklist.target_metrics).map(([key, value]) => (
                  <div key={key} className="metric-item">
                    <span className="metric-label">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="metric-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hormozi Principle */}
          {checklist.hormozi_principle && (
            <div className="checklist-principle">
              <span className="principle-icon">💡</span>
              <p>"{checklist.hormozi_principle}"</p>
            </div>
          )}

          {/* Implementation Phases */}
          <div className="checklist-phases">
            <h4>Implementation Steps</h4>
            {checklist.implementation_checklist?.map((phase, phaseIndex) => (
              <div key={phaseIndex} className="checklist-phase">
                <button
                  className={`phase-header ${expandedPhases[phaseIndex] ? 'expanded' : ''}`}
                  onClick={() => togglePhase(phaseIndex)}
                >
                  <span className="phase-number">{phaseIndex + 1}</span>
                  <span className="phase-name">{phase.phase}</span>
                  <span className="phase-count">{phase.tasks?.length || 0} tasks</span>
                  <span className="phase-arrow">{expandedPhases[phaseIndex] ? '▼' : '▶'}</span>
                </button>

                {expandedPhases[phaseIndex] && (
                  <div className="phase-tasks">
                    {phase.tasks?.map((task, taskIndex) => (
                      <div key={taskIndex} className="task-item-readonly">
                        <span className="task-number">{taskIndex + 1}.</span>
                        <div className="task-content">
                          <span className="task-title">{task.task}</span>
                          {task.description && (
                            <p className="task-description">{task.description}</p>
                          )}
                          {task.principle && (
                            <p className="task-principle">💡 {task.principle}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Wins */}
          {checklist.quick_wins?.length > 0 && (
            <div className="checklist-quick-wins">
              <h4>Quick Wins</h4>
              <ul>
                {checklist.quick_wins.map((win, index) => (
                  <li key={index}>✨ {win}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tracking Actions - Tier 2 */}
          <div className="checklist-tracking">
            {checkingImpl ? (
              <div className="tracking-loading">Checking status...</div>
            ) : existingImpl ? (
              <div className="tracking-existing">
                <div className="tracking-progress">
                  <span className="tracking-status">
                    {existingImpl.status === 'completed' ? '✅ Completed' : '📊 In Progress'}
                  </span>
                  <span className="tracking-count">
                    {existingImpl.completed_tasks?.length || 0}/{existingImpl.total_tasks || totalTasks} tasks
                  </span>
                </div>
                <button
                  className="checklist-tracking-btn continue"
                  onClick={handleContinueTracking}
                >
                  Continue Implementation →
                </button>
              </div>
            ) : (
              <div className="tracking-new">
                <p className="tracking-prompt">
                  Ready to implement? Track your progress in the CRM.
                </p>
                <button
                  className="checklist-tracking-btn start"
                  onClick={handleStartTracking}
                  disabled={creatingImpl || !projectId}
                >
                  {creatingImpl ? 'Creating...' : '🎯 Start Tracking This Implementation'}
                </button>
                {!projectId && (
                  <p className="tracking-note">
                    Select a project in the CRM to enable tracking
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Export Actions */}
          <div className="checklist-actions">
            <button className="checklist-action-btn" onClick={handlePrint}>
              🖨️ Print Checklist
            </button>
            <button className="checklist-action-btn" onClick={handleDownload}>
              📥 Download Markdown
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChecklistDisplay
