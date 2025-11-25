import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import './FlowLibrary.css'

function FlowLibrary() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedCard, setExpandedCard] = useState(null)
  const [groupedResponses, setGroupedResponses] = useState({})

  useEffect(() => {
    if (user?.id) {
      fetchAllResponses()
    }
  }, [user])

  const fetchAllResponses = async () => {
    try {
      setLoading(true)

      // Fetch healing compass responses
      const { data: healingData, error: healingError } = await supabase
        .from('healing_compass_responses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (healingError) throw healingError

      // Fetch nervous system responses
      const { data: nervousData, error: nervousError } = await supabase
        .from('nervous_system_responses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (nervousError) throw nervousError

      // Combine and format responses
      const allResponses = [
        ...(healingData || []).map(r => ({
          ...r,
          flowType: 'healing_compass',
          flowName: 'Healing Compass',
          flowIcon: '🧭'
        })),
        ...(nervousData || []).map(r => ({
          ...r,
          flowType: 'nervous_system',
          flowName: 'Nervous System Boundary Map',
          flowIcon: '🧠'
        }))
      ]

      // Sort by date
      allResponses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setResponses(allResponses)

      // Group by flow type
      const grouped = allResponses.reduce((acc, response) => {
        const type = response.flowType
        if (!acc[type]) {
          acc[type] = []
        }
        acc[type].push(response)
        return acc
      }, {})

      setGroupedResponses(grouped)
    } catch (err) {
      console.error('Error fetching responses:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, flowType) => {
    if (!confirm('Are you sure you want to delete this response? This action cannot be undone.')) {
      return
    }

    try {
      const tableName = flowType === 'healing_compass'
        ? 'healing_compass_responses'
        : 'nervous_system_responses'

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)

      if (error) throw error

      // Refresh responses
      await fetchAllResponses()

      // Show success message
      alert('Response deleted successfully')
    } catch (err) {
      console.error('Error deleting response:', err)
      alert('Failed to delete response: ' + err.message)
    }
  }

  const handleExportPDF = async (response) => {
    try {
      // Create a formatted text version for now
      // In a production app, you'd use a library like jsPDF
      const content = formatResponseForExport(response)

      // Create a blob and download
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${response.flowName}-${new Date(response.created_at).toLocaleDateString()}.txt`
      a.click()
      URL.revokeObjectURL(url)

      alert('Response exported successfully! (Note: Full PDF export coming soon)')
    } catch (err) {
      console.error('Error exporting response:', err)
      alert('Failed to export response: ' + err.message)
    }
  }

  const formatResponseForExport = (response) => {
    let content = `${response.flowName}\n`
    content += `Completed: ${new Date(response.created_at).toLocaleString()}\n`
    content += `\n${'='.repeat(50)}\n\n`

    if (response.flowType === 'healing_compass') {
      content += `Selected Safety Contract: ${response.selected_safety_contract || 'N/A'}\n\n`
      content += `Limiting Impact: ${response.limiting_impact || 'N/A'}\n\n`
      content += `Past Parallel Story: ${response.past_parallel_story || 'N/A'}\n\n`
      content += `Past Event Details: ${response.past_event_details || 'N/A'}\n\n`
      content += `Past Event Emotions: ${response.past_event_emotions || 'N/A'}\n\n`
    } else if (response.flowType === 'nervous_system') {
      content += `Impact Goal: ${response.impact_goal || 'N/A'}\n\n`
      content += `Income Goal: ${response.income_goal || 'N/A'}\n\n`
      content += `Positive Change: ${response.positive_change || 'N/A'}\n\n`
      content += `Current Struggle: ${response.current_struggle || 'N/A'}\n\n`
      content += `Reflection: ${response.reflection_text || 'N/A'}\n\n`

      if (response.safety_contracts && response.safety_contracts.length > 0) {
        content += `Safety Contracts:\n`
        response.safety_contracts.forEach((contract, i) => {
          content += `  ${i + 1}. ${contract}\n`
        })
      }
    }

    return content
  }

  const toggleExpand = (id) => {
    setExpandedCard(expandedCard === id ? null : id)
  }

  const renderResponseCard = (response) => {
    const isExpanded = expandedCard === response.id
    const date = new Date(response.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return (
      <div key={response.id} className="response-card">
        <div className="response-card-header" onClick={() => toggleExpand(response.id)}>
          <div className="response-card-title">
            <span className="response-icon">{response.flowIcon}</span>
            <div>
              <h3>{response.flowName}</h3>
              <p className="response-date">{date}</p>
            </div>
          </div>
          <button className="expand-btn">
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>

        {!isExpanded && (
          <div className="response-card-preview">
            {renderPreview(response)}
          </div>
        )}

        {isExpanded && (
          <div className="response-card-content">
            {renderFullContent(response)}
          </div>
        )}

        <div className="response-card-actions">
          <button
            className="action-btn view-btn"
            onClick={() => toggleExpand(response.id)}
          >
            {isExpanded ? '✕ Close' : '👁️ View'}
          </button>
          <button
            className="action-btn export-btn"
            onClick={() => handleExportPDF(response)}
          >
            📄 Export
          </button>
          <button
            className="action-btn delete-btn"
            onClick={() => handleDelete(response.id, response.flowType)}
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    )
  }

  const renderPreview = (response) => {
    if (response.flowType === 'healing_compass') {
      return (
        <p className="preview-text">
          {response.selected_safety_contract
            ? `"${response.selected_safety_contract.substring(0, 100)}${response.selected_safety_contract.length > 100 ? '...' : ''}"`
            : 'Click to view details'}
        </p>
      )
    } else if (response.flowType === 'nervous_system') {
      return (
        <p className="preview-text">
          {response.current_struggle
            ? `Struggle: ${response.current_struggle.substring(0, 100)}${response.current_struggle.length > 100 ? '...' : ''}`
            : 'Click to view details'}
        </p>
      )
    }
    return null
  }

  const renderFullContent = (response) => {
    if (response.flowType === 'healing_compass') {
      return (
        <div className="response-details">
          {response.selected_safety_contract && (
            <div className="detail-item">
              <strong>Selected Safety Contract:</strong>
              <p>"{response.selected_safety_contract}"</p>
            </div>
          )}
          {response.limiting_impact && (
            <div className="detail-item">
              <strong>Limiting Impact:</strong>
              <p>{response.limiting_impact}</p>
            </div>
          )}
          {response.past_parallel_story && (
            <div className="detail-item">
              <strong>Past Parallel Story:</strong>
              <p>{response.past_parallel_story}</p>
            </div>
          )}
          {response.past_event_details && (
            <div className="detail-item">
              <strong>Past Event Details:</strong>
              <p>{response.past_event_details}</p>
            </div>
          )}
          {response.past_event_emotions && (
            <div className="detail-item">
              <strong>Past Event Emotions:</strong>
              <p>{response.past_event_emotions}</p>
            </div>
          )}
        </div>
      )
    } else if (response.flowType === 'nervous_system') {
      return (
        <div className="response-details">
          {response.impact_goal && (
            <div className="detail-item">
              <strong>Impact Goal:</strong>
              <p>{response.impact_goal}</p>
            </div>
          )}
          {response.income_goal && (
            <div className="detail-item">
              <strong>Income Goal:</strong>
              <p>{response.income_goal}</p>
            </div>
          )}
          {response.positive_change && (
            <div className="detail-item">
              <strong>Positive Change:</strong>
              <p>{response.positive_change}</p>
            </div>
          )}
          {response.current_struggle && (
            <div className="detail-item">
              <strong>Current Struggle:</strong>
              <p>{response.current_struggle}</p>
            </div>
          )}
          {response.reflection_text && (
            <div className="detail-item">
              <strong>Reflection:</strong>
              <p>{response.reflection_text}</p>
            </div>
          )}
          {response.safety_contracts && response.safety_contracts.length > 0 && (
            <div className="detail-item">
              <strong>Safety Contracts:</strong>
              <ul className="safety-contracts-list">
                {response.safety_contracts.map((contract, i) => (
                  <li key={i}>"{contract}"</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          Error loading responses: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="app library-container">
      <header className="header">
        <div className="header-content">
          <button className="back-btn" onClick={() => navigate('/me')}>
            ← Back to Profile
          </button>
          <div>
            <h1>Library of Answers</h1>
            <p>Your journey through self-discovery</p>
          </div>
        </div>
      </header>

      <main className="library-content">
        {responses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h2>No Responses Yet</h2>
            <p>Complete a flow to start building your library of insights.</p>
            <div className="empty-actions">
              <button
                className="primary-btn"
                onClick={() => navigate('/healing-compass')}
              >
                Start Healing Compass
              </button>
              <button
                className="secondary-btn"
                onClick={() => navigate('/nervous-system')}
              >
                Start Nervous System Map
              </button>
            </div>
          </div>
        ) : (
          <div className="responses-section">
            {Object.keys(groupedResponses).map(flowType => {
              const flowResponses = groupedResponses[flowType]
              const flowName = flowResponses[0]?.flowName || flowType
              const flowIcon = flowResponses[0]?.flowIcon || '📋'

              return (
                <div key={flowType} className="flow-group">
                  <div className="flow-group-header">
                    <h2>
                      <span className="flow-icon-large">{flowIcon}</span>
                      {flowName}
                    </h2>
                    <span className="flow-count">{flowResponses.length} response{flowResponses.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="responses-grid">
                    {flowResponses.map(response => renderResponseCard(response))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default FlowLibrary
