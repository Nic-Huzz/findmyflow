/**
 * ScriptsModal - Quick script picker for deal cards
 * Shows recommended scripts based on deal stage AND objection patterns
 */
import { useState, useEffect } from 'react'
import { fetchScripts, SCRIPT_STAGES, logScriptUsage } from '../../lib/scripts'
import { getDealOutcomeStats } from '../../lib/crm'
import './ScriptsModal.css'

// Map deal stages to script stages
const DEAL_TO_SCRIPT_STAGE = {
  lead: 'opener',
  discovery: 'discovery',
  proposal: 'offer',
  won: 'follow-up',
  lost: 'follow-up',
}

// Get smart suggestions based on lead scores and deal context
function getSmartSuggestions(deal, scripts) {
  const suggestions = []

  // Check for notes mentioning specific objections
  const notes = (deal.notes || '').toLowerCase()
  const notesKeywords = {
    'price': ['price', 'expensive', 'cost', 'afford', 'budget', 'money'],
    'time': ['think about', 'consider', 'later', 'wait'],
    'timing': ['busy', 'not now', 'bad time', 'schedule'],
    'authority': ['research', 'tried before', 'skeptical'],
    'self_doubt': ['can\'t do', 'won\'t work', 'not sure'],
    'commitment': ['cancel', 'guarantee', 'refund'],
    'comparison': ['cheaper', 'competitor', 'alternative'],
  }

  // Check notes for objection keywords
  Object.entries(notesKeywords).forEach(([category, keywords]) => {
    if (keywords.some(kw => notes.includes(kw))) {
      const script = scripts.find(s => s.category?.toUpperCase() === category.toUpperCase())
      if (script && !suggestions.find(s => s.script.id === script.id)) {
        suggestions.push({
          script,
          reason: `Notes mention "${category}" objection`
        })
      }
    }
  })

  // Score-based suggestions
  if (deal.trust_score && deal.trust_score < 5) {
    // Low trust - suggest AUTHORITY scripts
    const script = scripts.find(s => s.category?.toUpperCase() === 'AUTHORITY')
    if (script && !suggestions.find(s => s.script.id === script.id)) {
      suggestions.push({
        script,
        reason: `Low trust (${deal.trust_score}/10) - handle skepticism`
      })
    }
  }

  if (deal.urgency_score && deal.urgency_score < 5) {
    // Low urgency - suggest TIME/TIMING scripts
    const script = scripts.find(s => s.category?.toUpperCase() === 'TIME' || s.category?.toUpperCase() === 'TIMING')
    if (script && !suggestions.find(s => s.script.id === script.id)) {
      suggestions.push({
        script,
        reason: `Low urgency (${deal.urgency_score}/10) - overcome delay`
      })
    }
  }

  if (deal.fit_score && deal.fit_score < 5) {
    // Low fit - suggest SELF_DOUBT scripts
    const script = scripts.find(s => s.category?.toUpperCase() === 'SELF_DOUBT')
    if (script && !suggestions.find(s => s.script.id === script.id)) {
      suggestions.push({
        script,
        reason: `Low fit (${deal.fit_score}/10) - build confidence`
      })
    }
  }

  // Pitched stage - likely price objections coming
  if (deal.status === 'pitched') {
    const priceScript = scripts.find(s => s.category?.toUpperCase() === 'PRICE')
    if (priceScript && !suggestions.find(s => s.script.id === priceScript.id)) {
      suggestions.push({
        script: priceScript,
        reason: `Proposal stage - prepare for price discussion`
      })
    }
  }

  // If no suggestions yet, suggest FINAL scripts for closing
  if (suggestions.length === 0 && deal.status === 'pitched') {
    const finalScript = scripts.find(s => s.category?.toUpperCase() === 'FINAL')
    if (finalScript) {
      suggestions.push({
        script: finalScript,
        reason: `Ready to close - final objection handler`
      })
    }
  }

  return suggestions.slice(0, 3) // Max 3 suggestions
}

// Map loss reasons from deal outcomes to script categories
const LOSS_REASON_TO_SCRIPT = {
  price: 'PRICE',
  timing: 'TIMING',
  competitor: 'COMPARISON',
  no_decision: 'TIME',
  fit: 'SELF_DOUBT',
  trust: 'AUTHORITY',
}

// Get suggestions based on user's historical objection patterns
function getPatternSuggestions(patterns, scripts) {
  if (!patterns?.topLossReasons?.length) return []

  const suggestions = []

  patterns.topLossReasons.slice(0, 3).forEach(([reason, count]) => {
    const scriptCategory = LOSS_REASON_TO_SCRIPT[reason]
    if (scriptCategory) {
      const script = scripts.find(s => s.category?.toUpperCase() === scriptCategory)
      if (script && !suggestions.find(s => s.script.id === script.id)) {
        const percent = patterns.totalLosses > 0
          ? Math.round((count / patterns.totalLosses) * 100)
          : 0
        suggestions.push({
          script,
          reason: `${percent}% of your losses cite "${reason.replace(/_/g, ' ')}"`,
          priority: count,
        })
      }
    }
  })

  return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 2)
}

export default function ScriptsModal({ deal, userId, onClose, onScriptUsed }) {
  const [scripts, setScripts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState(null) // Will be set after load
  const [copiedId, setCopiedId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [objectionPatterns, setObjectionPatterns] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  // Set default filter after scripts load
  useEffect(() => {
    if (!loading && scripts.length > 0 && selectedFilter === null) {
      const smartSuggs = getSmartSuggestions(deal, scripts)
      const patternSuggs = getPatternSuggestions(objectionPatterns, scripts)
      if (smartSuggs.length > 0 || patternSuggs.length > 0) {
        setSelectedFilter('smart')
      } else {
        setSelectedFilter('all')
      }
    }
  }, [loading, scripts, objectionPatterns])

  async function loadData() {
    setLoading(true)
    const [scriptsResult, patternsResult] = await Promise.all([
      fetchScripts(),
      userId ? getDealOutcomeStats(userId) : Promise.resolve(null),
    ])
    if (scriptsResult.data) {
      setScripts(scriptsResult.data)
    }
    if (patternsResult) {
      setObjectionPatterns(patternsResult)
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

  const smartSuggestions = getSmartSuggestions(deal, scripts)
  const patternSuggestions = getPatternSuggestions(objectionPatterns, scripts)
  const allSuggestions = [...smartSuggestions, ...patternSuggestions]

  // Build filtered scripts list based on selected filter
  let filteredScripts = []
  let suggestionReasons = {} // Map script ID to reason for smart tab

  if (selectedFilter === 'smart') {
    filteredScripts = allSuggestions.map(s => s.script)
    allSuggestions.forEach(s => {
      suggestionReasons[s.script.id] = s.reason
    })
  } else if (selectedFilter === 'all' || selectedFilter === null) {
    filteredScripts = scripts
  } else {
    filteredScripts = scripts.filter(s => s.category?.toUpperCase() === selectedFilter.toUpperCase())
  }

  const hasSmartSuggestions = allSuggestions.length > 0

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

        {/* Filter Tabs */}
        <div className="scripts-modal-filters">
          {hasSmartSuggestions && (
            <button
              className={`modal-filter smart-filter ${selectedFilter === 'smart' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('smart')}
            >
              🎯 Smart
            </button>
          )}
          <button
            className={`modal-filter ${selectedFilter === 'all' || (!hasSmartSuggestions && selectedFilter === null) ? 'active' : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            All
          </button>
          {SCRIPT_STAGES.map(stage => (
            <button
              key={stage.value}
              className={`modal-filter emoji-filter ${selectedFilter === stage.value ? 'active' : ''}`}
              onClick={() => setSelectedFilter(stage.value)}
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
            <div className="scripts-modal-empty">
              {selectedFilter === 'smart'
                ? 'No smart suggestions - try adjusting lead scores'
                : 'No scripts found'}
            </div>
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
                    {suggestionReasons[script.id] && (
                      <span className="modal-script-reason">{suggestionReasons[script.id]}</span>
                    )}
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
