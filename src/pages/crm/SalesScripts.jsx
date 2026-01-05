/**
 * Sales Scripts - Hormozi-Style Scripts Library
 * 15 proven scripts based on $100M Offers framework
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { fetchScripts, SCRIPT_STAGES, logScriptUsage, fetchScriptStats } from '../../lib/scripts'
import './SalesScripts.css'

export default function SalesScripts() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [scripts, setScripts] = useState([])
  const [selectedStage, setSelectedStage] = useState('all')
  const [expandedScript, setExpandedScript] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [stats, setStats] = useState([])
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    loadScripts()
    if (user?.id) {
      loadStats()
    }
  }, [user?.id])

  async function loadScripts() {
    setLoading(true)
    const { data, error } = await fetchScripts()
    if (data) {
      setScripts(data)
    }
    setLoading(false)
  }

  async function loadStats() {
    const { data } = await fetchScriptStats(user.id)
    if (data) {
      setStats(data)
    }
  }

  function getScriptStat(scriptId) {
    return stats.find(s => s.scriptId === scriptId)
  }

  function copyScript(script) {
    navigator.clipboard.writeText(script.script_text)
    setCopiedId(script.id)
    setTimeout(() => setCopiedId(null), 2000)

    // Log usage
    if (user?.id) {
      logScriptUsage(user.id, script.id, null, 'pending')
    }
  }

  const filteredScripts = selectedStage === 'all'
    ? scripts
    : scripts.filter(s => s.stage === selectedStage)

  const groupedScripts = SCRIPT_STAGES.reduce((acc, stage) => {
    const stageScripts = filteredScripts.filter(s => s.stage === stage.value)
    if (stageScripts.length > 0) {
      acc.push({ ...stage, scripts: stageScripts })
    }
    return acc
  }, [])

  if (loading) {
    return (
      <div className="sales-scripts">
        <div className="sales-scripts-loading">
          <div className="sales-scripts-spinner"></div>
          <p>Loading scripts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="sales-scripts">
      <header className="sales-scripts-header">
        <button className="sales-scripts-back" onClick={() => navigate('/crm')}>
          ← Back
        </button>
        <div className="sales-scripts-title">
          <h1>Hormozi Sales Scripts</h1>
          <p>15 proven scripts based on $100M Offers framework</p>
        </div>
        <button
          className={`sales-scripts-stats-btn ${showStats ? 'active' : ''}`}
          onClick={() => setShowStats(!showStats)}
        >
          📊 {showStats ? 'Hide' : 'Show'} Stats
        </button>
      </header>

      {/* Stage Filter */}
      <div className="sales-scripts-filters">
        <button
          className={`stage-filter ${selectedStage === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedStage('all')}
        >
          All Scripts
        </button>
        {SCRIPT_STAGES.map(stage => (
          <button
            key={stage.value}
            className={`stage-filter ${selectedStage === stage.value ? 'active' : ''}`}
            onClick={() => setSelectedStage(stage.value)}
          >
            <span>{stage.emoji}</span>
            <span>{stage.label}</span>
          </button>
        ))}
      </div>

      {/* Scripts by Stage */}
      <div className="sales-scripts-list">
        {selectedStage === 'all' ? (
          groupedScripts.map(group => (
            <div key={group.value} className="scripts-stage-group">
              <h2 className="stage-group-title">
                <span className="stage-emoji">{group.emoji}</span>
                {group.label}
                <span className="stage-count">{group.scripts.length}</span>
              </h2>
              <div className="stage-scripts">
                {group.scripts.map(script => (
                  <ScriptCard
                    key={script.id}
                    script={script}
                    expanded={expandedScript === script.id}
                    onExpand={() => setExpandedScript(expandedScript === script.id ? null : script.id)}
                    onCopy={() => copyScript(script)}
                    copied={copiedId === script.id}
                    stat={showStats ? getScriptStat(script.id) : null}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="stage-scripts flat">
            {filteredScripts.map(script => (
              <ScriptCard
                key={script.id}
                script={script}
                expanded={expandedScript === script.id}
                onExpand={() => setExpandedScript(expandedScript === script.id ? null : script.id)}
                onCopy={() => copyScript(script)}
                copied={copiedId === script.id}
                stat={showStats ? getScriptStat(script.id) : null}
              />
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {scripts.length === 0 && !loading && (
        <div className="sales-scripts-empty">
          <p>No scripts found. Run the migration to add Hormozi scripts.</p>
        </div>
      )}

      {/* Quick Reference */}
      <div className="sales-scripts-reference">
        <h3>Sales Flow Stages</h3>
        <div className="reference-flow">
          {SCRIPT_STAGES.map((stage, idx) => (
            <div key={stage.value} className="flow-stage">
              <span className="flow-emoji">{stage.emoji}</span>
              <span className="flow-label">{stage.label}</span>
              {idx < SCRIPT_STAGES.length - 1 && <span className="flow-arrow">→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScriptCard({ script, expanded, onExpand, onCopy, copied, stat }) {
  return (
    <div className={`script-card ${expanded ? 'expanded' : ''}`}>
      <div className="script-card-header" onClick={onExpand}>
        <div className="script-name-row">
          <span className="script-category">{script.category}</span>
          <h3 className="script-name">{script.name}</h3>
        </div>
        <div className="script-actions">
          {stat && (
            <span className={`script-stat ${stat.successRate >= 50 ? 'good' : ''}`}>
              {stat.successRate}% ({stat.total})
            </span>
          )}
          <button
            className={`script-copy-btn ${copied ? 'copied' : ''}`}
            onClick={(e) => { e.stopPropagation(); onCopy(); }}
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
          <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {expanded && (
        <div className="script-card-body">
          <div className="script-section">
            <h4>The Script</h4>
            <div className="script-text">{script.script_text}</div>
          </div>

          <div className="script-section">
            <h4>When to Use</h4>
            <p className="script-when">{script.when_to_use}</p>
          </div>

          {script.tips && (
            <div className="script-section">
              <h4>Pro Tips</h4>
              <p className="script-tips">{script.tips}</p>
            </div>
          )}

          {script.example_response && (
            <div className="script-section">
              <h4>Expected Response</h4>
              <p className="script-example">{script.example_response}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
