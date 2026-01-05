/**
 * ScriptsModal - Quick script picker for deal cards
 * Shows recommended scripts based on deal stage
 */
import { useState, useEffect } from 'react'
import { fetchScripts, SCRIPT_STAGES, logScriptUsage } from '../../lib/scripts'
import './ScriptsModal.css'

// Map deal stages to script stages
const DEAL_TO_SCRIPT_STAGE = {
  lead: 'opener',
  discovery: 'discovery',
  proposal: 'offer',
  won: 'follow-up',
  lost: 'follow-up',
}

// Get smart suggestions based on lead scores
function getSmartSuggestions(deal, scripts) {
  const suggestions = []

  // Only suggest if deal has lead scores
  if (!deal.pain_score && !deal.trust_score && !deal.urgency_score && !deal.fit_score) {
    return suggestions
  }

  // Low pain score - need to highlight cost of inaction
  if (deal.pain_score && deal.pain_score < 5) {
    const script = scripts.find(s => s.name?.toLowerCase().includes('cost') || s.name?.toLowerCase().includes('inaction'))
    if (script) {
      suggestions.push({
        script,
        reason: `Low pain score (${deal.pain_score}/10) - amplify the problem`
      })
    }
  }

  // Low trust score - need social proof
  if (deal.trust_score && deal.trust_score < 5) {
    const script = scripts.find(s => s.name?.toLowerCase().includes('proof') || s.name?.toLowerCase().includes('testimonial') || s.name?.toLowerCase().includes('case'))
    if (script) {
      suggestions.push({
        script,
        reason: `Low trust score (${deal.trust_score}/10) - build credibility`
      })
    }
  }

  // Low urgency score - create time pressure
  if (deal.urgency_score && deal.urgency_score < 5) {
    const script = scripts.find(s => s.name?.toLowerCase().includes('urgency') || s.name?.toLowerCase().includes('opportunity') || s.name?.toLowerCase().includes('now'))
    if (script) {
      suggestions.push({
        script,
        reason: `Low urgency score (${deal.urgency_score}/10) - create momentum`
      })
    }
  }

  // Low fit score - need to qualify or reframe
  if (deal.fit_score && deal.fit_score < 5) {
    const script = scripts.find(s => s.name?.toLowerCase().includes('qualify') || s.name?.toLowerCase().includes('fit'))
    if (script) {
      suggestions.push({
        script,
        reason: `Low fit score (${deal.fit_score}/10) - confirm alignment`
      })
    }
  }

  // Proposal stage - use closing scripts
  if (deal.status === 'proposal') {
    const closeScript = scripts.find(s => s.stage === 'close' || s.name?.toLowerCase().includes('close'))
    if (closeScript && !suggestions.find(s => s.script.id === closeScript.id)) {
      suggestions.push({
        script: closeScript,
        reason: `Proposal stage - ready to close`
      })
    }
  }

  // High scores overall - upsell opportunity
  const totalScore = (deal.pain_score || 0) + (deal.trust_score || 0) + (deal.urgency_score || 0) + (deal.fit_score || 0)
  if (totalScore >= 32) { // 8+ average across all 4
    const upsellScript = scripts.find(s => s.name?.toLowerCase().includes('upsell') || s.name?.toLowerCase().includes('premium'))
    if (upsellScript && !suggestions.find(s => s.script.id === upsellScript.id)) {
      suggestions.push({
        script: upsellScript,
        reason: `High lead score (${totalScore}/40) - consider upselling`
      })
    }
  }

  return suggestions.slice(0, 3) // Max 3 suggestions
}

export default function ScriptsModal({ deal, userId, onClose, onScriptUsed }) {
  const [scripts, setScripts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStage, setSelectedStage] = useState(DEAL_TO_SCRIPT_STAGE[deal.status] || 'all')
  const [copiedId, setCopiedId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    loadScripts()
  }, [])

  async function loadScripts() {
    setLoading(true)
    const { data } = await fetchScripts()
    if (data) {
      setScripts(data)
    }
    setLoading(false)
  }

  async function handleCopyScript(script) {
    // Copy to clipboard
    navigator.clipboard.writeText(script.script_text)
    setCopiedId(script.id)
    setTimeout(() => setCopiedId(null), 2000)

    // Log usage for this deal
    if (userId) {
      await logScriptUsage(userId, script.id, deal.id, 'pending')
      onScriptUsed?.()
    }
  }

  const recommendedStage = DEAL_TO_SCRIPT_STAGE[deal.status]
  const filteredScripts = selectedStage === 'all'
    ? scripts
    : scripts.filter(s => s.stage === selectedStage)

  const recommendedScripts = scripts.filter(s => s.stage === recommendedStage)
  const smartSuggestions = getSmartSuggestions(deal, scripts)

  return (
    <div className="scripts-modal-overlay" onClick={onClose}>
      <div className="scripts-modal" onClick={e => e.stopPropagation()}>
        <div className="scripts-modal-header">
          <div className="modal-title">
            <h3>Sales Scripts</h3>
            <span className="modal-deal-name">for {deal.contact_name}</span>
          </div>
          <button className="scripts-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Smart Suggestions based on Lead Score */}
        {smartSuggestions.length > 0 && (
          <div className="smart-suggestions-section">
            <h4>
              <span className="rec-icon">🎯</span>
              Smart Suggestions for {deal.contact_name}
            </h4>
            <div className="smart-suggestions-list">
              {smartSuggestions.map(({ script, reason }) => (
                <div key={script.id} className="smart-suggestion">
                  <div className="suggestion-info">
                    <span className="suggestion-name">{script.name}</span>
                    <span className="suggestion-reason">{reason}</span>
                  </div>
                  <button
                    className={`quick-copy-btn ${copiedId === script.id ? 'copied' : ''}`}
                    onClick={() => handleCopyScript(script)}
                  >
                    {copiedId === script.id ? '✓' : '📋'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Scripts */}
        {recommendedScripts.length > 0 && (
          <div className="recommended-section">
            <h4>
              <span className="rec-icon">⭐</span>
              Recommended for {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)} Stage
            </h4>
            <div className="recommended-list">
              {recommendedScripts.slice(0, 3).map(script => (
                <div key={script.id} className="quick-script">
                  <span className="quick-script-name">{script.name}</span>
                  <button
                    className={`quick-copy-btn ${copiedId === script.id ? 'copied' : ''}`}
                    onClick={() => handleCopyScript(script)}
                  >
                    {copiedId === script.id ? '✓' : '📋'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stage Filter */}
        <div className="scripts-modal-filters">
          <button
            className={`modal-filter ${selectedStage === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedStage('all')}
          >
            All
          </button>
          {SCRIPT_STAGES.map(stage => (
            <button
              key={stage.value}
              className={`modal-filter ${selectedStage === stage.value ? 'active' : ''} ${stage.value === recommendedStage ? 'recommended' : ''}`}
              onClick={() => setSelectedStage(stage.value)}
            >
              {stage.emoji}
            </button>
          ))}
        </div>

        {/* Scripts List */}
        <div className="scripts-modal-list">
          {loading ? (
            <div className="scripts-modal-loading">Loading scripts...</div>
          ) : filteredScripts.length === 0 ? (
            <div className="scripts-modal-empty">No scripts found</div>
          ) : (
            filteredScripts.map(script => (
              <div
                key={script.id}
                className={`modal-script-card ${expandedId === script.id ? 'expanded' : ''}`}
              >
                <div
                  className="modal-script-header"
                  onClick={() => setExpandedId(expandedId === script.id ? null : script.id)}
                >
                  <div className="modal-script-info">
                    <span className="modal-script-stage">{script.category}</span>
                    <span className="modal-script-name">{script.name}</span>
                  </div>
                  <div className="modal-script-actions">
                    <button
                      className={`modal-copy-btn ${copiedId === script.id ? 'copied' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleCopyScript(script); }}
                    >
                      {copiedId === script.id ? '✓ Copied' : '📋 Copy'}
                    </button>
                    <span className="modal-expand">{expandedId === script.id ? '▼' : '▶'}</span>
                  </div>
                </div>
                {expandedId === script.id && (
                  <div className="modal-script-body">
                    <div className="modal-script-text">{script.script_text}</div>
                    {script.tips && (
                      <div className="modal-script-tip">
                        <strong>Tip:</strong> {script.tips}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="scripts-modal-footer">
          <span className="footer-hint">Click a script to expand, copy to use with {deal.contact_name}</span>
        </div>
      </div>
    </div>
  )
}
