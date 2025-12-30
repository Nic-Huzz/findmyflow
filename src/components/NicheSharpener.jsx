/**
 * NicheSharpener.jsx
 *
 * AI-powered niche sharpening component using Claude Haiku.
 * Analyzes user's skills, problems, and personas to suggest
 * a sharper market positioning.
 *
 * Can be used standalone or embedded in other pages.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import './NicheSharpener.css'

function NicheSharpener({ onClose, embedded = false }) {
  const { user } = useAuth()
  const [status, setStatus] = useState('idle') // idle, loading, success, error, insufficient
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)
  const [dataSources, setDataSources] = useState(null)
  const [selectedRefinement, setSelectedRefinement] = useState(null)
  const [saved, setSaved] = useState(false)

  const runAnalysis = async () => {
    if (!user?.id) return

    setStatus('loading')
    setError(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('niche-sharpener', {
        body: { userId: user.id }
      })

      if (fnError) throw fnError

      if (data.error === 'insufficient_data') {
        setStatus('insufficient')
        setError(data.message)
        return
      }

      if (data.error) {
        throw new Error(data.error)
      }

      setAnalysis(data.analysis)
      setDataSources(data.dataSourcesSummary)
      setStatus('success')
    } catch (err) {
      console.error('Niche sharpener error:', err)
      setError(err.message || 'Failed to analyze niche')
      setStatus('error')
    }
  }

  // Auto-run on mount if user is present
  useEffect(() => {
    if (user?.id && status === 'idle') {
      runAnalysis()
    }
  }, [user])

  const saveNicheStatement = async () => {
    if (!analysis || !user?.id) return

    try {
      // Save to a project or user preferences
      // For now, we'll just mark as saved (could expand to save to user_projects)
      setSaved(true)

      // Copy to clipboard
      await navigator.clipboard.writeText(analysis.niche_statement)
    } catch (err) {
      console.error('Failed to save:', err)
    }
  }

  const renderLoading = () => (
    <div className="niche-sharpener-loading">
      <div className="ns-spinner"></div>
      <p className="ns-loading-text">Analyzing your positioning...</p>
      <p className="ns-loading-subtext">
        This usually takes 5-10 seconds. We're reviewing your skills, problems you solve, and target personas.
      </p>
    </div>
  )

  const renderInsufficientData = () => (
    <div className="niche-sharpener-insufficient">
      <h3>More Data Needed</h3>
      <p>{error}</p>
      <div className="ns-action-buttons">
        <a href="/nikigai/skills" className="ns-primary-btn">Start Flow Finder</a>
        {onClose && (
          <button className="ns-secondary-btn" onClick={onClose}>Close</button>
        )}
      </div>
    </div>
  )

  const renderError = () => (
    <div className="niche-sharpener-error">
      <h3>Something went wrong</h3>
      <p>{error}</p>
      <div className="ns-action-buttons">
        <button className="ns-primary-btn" onClick={runAnalysis}>Try Again</button>
        {onClose && (
          <button className="ns-secondary-btn" onClick={onClose}>Close</button>
        )}
      </div>
    </div>
  )

  const renderSuccess = () => (
    <div className="niche-sharpener-results">
      {/* Data Sources Badge */}
      {dataSources && (
        <div className="ns-data-sources">
          <span className="ns-source-badge">
            Based on {dataSources.skillsClusters} skills, {dataSources.problemsClusters} problems, {dataSources.personaClusters} personas
          </span>
        </div>
      )}

      {/* Current Positioning Analysis */}
      <div className="ns-section">
        <h4 className="ns-section-title">Current Positioning</h4>
        <p className="ns-section-content">{analysis.current_positioning}</p>
      </div>

      {/* Niche Statement - Main Result */}
      <div className="ns-section ns-highlight">
        <h4 className="ns-section-title">Your Sharpened Niche</h4>
        <p className="ns-niche-statement">"{analysis.niche_statement}"</p>
        <button
          className={`ns-save-btn ${saved ? 'saved' : ''}`}
          onClick={saveNicheStatement}
        >
          {saved ? 'Copied to Clipboard!' : 'Copy Niche Statement'}
        </button>
      </div>

      {/* Positioning Statement */}
      <div className="ns-section">
        <h4 className="ns-section-title">Marketing Positioning</h4>
        <p className="ns-positioning">{analysis.positioning_statement}</p>
      </div>

      {/* Unique Advantage */}
      <div className="ns-section">
        <h4 className="ns-section-title">Your Unique Advantage</h4>
        <p className="ns-section-content">{analysis.unique_advantage}</p>
      </div>

      {/* Refinement Options */}
      <div className="ns-section">
        <h4 className="ns-section-title">Refinement Options</h4>
        <p className="ns-section-subtitle">Ways to further sharpen your niche:</p>
        <div className="ns-refinements">
          {analysis.refinement_options?.map((option, idx) => (
            <div
              key={idx}
              className={`ns-refinement-card ${selectedRefinement === idx ? 'selected' : ''}`}
              onClick={() => setSelectedRefinement(selectedRefinement === idx ? null : idx)}
            >
              <div className="ns-refinement-header">
                <span className="ns-refinement-number">{idx + 1}</span>
                <span className="ns-refinement-option">{option.option}</span>
              </div>
              {selectedRefinement === idx && (
                <div className="ns-refinement-details">
                  <div className="ns-pros">
                    <strong>Pros:</strong> {option.pros}
                  </div>
                  <div className="ns-cons">
                    <strong>Cons:</strong> {option.cons}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Items */}
      <div className="ns-section">
        <h4 className="ns-section-title">Next Steps</h4>
        <ul className="ns-action-items">
          {analysis.action_items?.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Footer Actions */}
      <div className="ns-footer-actions">
        <button className="ns-primary-btn" onClick={runAnalysis}>
          Regenerate Analysis
        </button>
        {onClose && (
          <button className="ns-secondary-btn" onClick={onClose}>Close</button>
        )}
      </div>
    </div>
  )

  return (
    <div className={`niche-sharpener ${embedded ? 'embedded' : ''}`}>
      {!embedded && (
        <div className="ns-header">
          <h2>AI Niche Sharpener</h2>
          <p>Get AI-powered insights to sharpen your market positioning</p>
        </div>
      )}

      <div className="ns-content">
        {status === 'loading' && renderLoading()}
        {status === 'insufficient' && renderInsufficientData()}
        {status === 'error' && renderError()}
        {status === 'success' && renderSuccess()}
        {status === 'idle' && (
          <div className="ns-idle">
            <button className="ns-primary-btn" onClick={runAnalysis}>
              Analyze My Niche
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default NicheSharpener
