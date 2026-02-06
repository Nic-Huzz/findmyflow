/**
 * PlaybookDrawer - Smart drawer for deal-stage-aware sales coaching
 * booked/showed → Pre-call prep (CLOSER + Conviction + Three Things)
 * pitched/follow_up → Objection handling (Three Distortions + logging)
 */
import { useState, useEffect, useCallback } from 'react'
import {
  THREE_DISTORTIONS,
  CLOSER_FRAMEWORK,
  CONVICTION_TONALITY,
  THREE_THINGS_ON_CALL,
} from '../../data/salesPlaybook'
import { logObjection } from '../../lib/crm/objectionService'
import { fetchCloserScript, generateDefaultScript, saveCloserScript } from '../../lib/crm/closerScriptService'
import { hapticLight, hapticMedium } from '../../lib/haptics'
import './PlaybookDrawer.css'

export default function PlaybookDrawer({ deal, userId, mode: modeProp, onClose, onObjectionLogged }) {
  const mode = modeProp || (['booked', 'showed'].includes(deal?.status) ? 'prep' : 'objection')

  return (
    <div className="playbook-drawer-overlay" onClick={onClose}>
      <div className="playbook-drawer" onClick={e => e.stopPropagation()}>
        <div className="playbook-drawer-handle" />
        <button className="playbook-drawer-close" onClick={onClose}>×</button>

        {mode === 'prep' ? (
          <PrepMode deal={deal} userId={userId} />
        ) : (
          <ObjectionMode deal={deal} userId={userId} onObjectionLogged={onObjectionLogged} />
        )}
      </div>
    </div>
  )
}

// ============================================
// PREP MODE (booked/showed)
// ============================================
function PrepMode({ deal, userId }) {
  const [closerScript, setCloserScript] = useState(null)
  const [expandedStep, setExpandedStep] = useState(null)
  const [copiedStep, setCopiedStep] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadScript()
  }, [userId])

  async function loadScript() {
    setLoading(true)
    const { data } = await fetchCloserScript(userId)
    if (data?.steps && Object.keys(data.steps).length > 0) {
      setCloserScript(data.steps)
    } else {
      const defaults = await generateDefaultScript(userId)
      setCloserScript(defaults)
    }
    setLoading(false)
  }

  function copyStep(letter) {
    if (!closerScript?.[letter]) return
    navigator.clipboard.writeText(closerScript[letter])
    setCopiedStep(letter)
    hapticLight()
    setTimeout(() => setCopiedStep(null), 2000)
  }

  return (
    <div className="playbook-prep">
      <div className="playbook-drawer-header">
        <span className="playbook-drawer-icon">📋</span>
        <div>
          <h3>Pre-Call Prep</h3>
          <p className="playbook-drawer-subtitle">{deal.contact_name}</p>
        </div>
      </div>

      {/* Three Things Banner */}
      <div className="three-things-banner">
        {THREE_THINGS_ON_CALL.items.map(item => (
          <span key={item.id} className="three-things-badge" style={{ background: item.color }}>
            {item.label}
          </span>
        ))}
      </div>

      {/* Conviction & Tonality */}
      <div className="playbook-section">
        <h4 className="playbook-section-title">Mindset</h4>
        <div className="conviction-cards">
          {CONVICTION_TONALITY.map(card => (
            <div key={card.id} className="conviction-card">
              <span className="conviction-icon">{card.icon}</span>
              <div className="conviction-content">
                <span className="conviction-title">{card.title}</span>
                <span className="conviction-desc">{card.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CLOSER Checklist */}
      <div className="playbook-section">
        <h4 className="playbook-section-title">CLOSER Checklist</h4>
        {loading ? (
          <div className="playbook-loading">Loading your script...</div>
        ) : (
          <div className="closer-steps">
            {CLOSER_FRAMEWORK.steps.map(step => {
              const isExpanded = expandedStep === step.letter
              const scriptText = closerScript?.[step.letter] || step.templateText
              return (
                <div key={step.letter} className={`closer-step ${isExpanded ? 'expanded' : ''}`}>
                  <div
                    className="closer-step-header"
                    onClick={() => {
                      setExpandedStep(isExpanded ? null : step.letter)
                      hapticLight()
                    }}
                  >
                    <span className="closer-letter">{step.letter}</span>
                    <div className="closer-step-info">
                      <span className="closer-step-title">{step.title}</span>
                      {!isExpanded && (
                        <span className="closer-step-preview">{step.description}</span>
                      )}
                    </div>
                    <span className="closer-expand">{isExpanded ? '▼' : '▶'}</span>
                  </div>
                  {isExpanded && (
                    <div className="closer-step-body">
                      <p className="closer-guidance">{step.guidance}</p>
                      <div className="closer-script-box">
                        <p className="closer-script-text">{scriptText}</p>
                        <button
                          className={`closer-copy-btn ${copiedStep === step.letter ? 'copied' : ''}`}
                          onClick={e => { e.stopPropagation(); copyStep(step.letter) }}
                        >
                          {copiedStep === step.letter ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>
                      {step.crossLink && (
                        <span className="closer-cross-link">{step.crossLink.label}</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// OBJECTION MODE (pitched/follow_up)
// ============================================
function ObjectionMode({ deal, userId, onObjectionLogged }) {
  const [expandedLayer, setExpandedLayer] = useState(null)
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [expandedStrategy, setExpandedStrategy] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [loggingStrategy, setLoggingStrategy] = useState(null) // { layer, category, strategy }
  const [logForm, setLogForm] = useState({ outcome: 'unknown', notes: '' })
  const [logSaving, setLogSaving] = useState(false)

  function copyStrategy(text, id) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    hapticLight()
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function handleLogObjection() {
    if (!loggingStrategy) return
    setLogSaving(true)
    await logObjection(userId, {
      deal_id: deal?.id || null,
      layer: loggingStrategy.layer,
      category: loggingStrategy.category,
      strategy_used: loggingStrategy.strategy,
      outcome: logForm.outcome,
      notes: logForm.notes,
    })
    hapticMedium()
    setLoggingStrategy(null)
    setLogForm({ outcome: 'unknown', notes: '' })
    setLogSaving(false)
    onObjectionLogged?.()
  }

  // Filter strategies by search query
  const filteredLayers = searchQuery.trim()
    ? THREE_DISTORTIONS.layers.map(layer => ({
        ...layer,
        categories: layer.categories.map(cat => ({
          ...cat,
          strategies: cat.strategies.filter(s =>
            s.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase())) ||
            s.name.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        })).filter(cat => cat.strategies.length > 0),
      })).filter(layer => layer.categories.length > 0)
    : THREE_DISTORTIONS.layers

  return (
    <div className="playbook-objection">
      <div className="playbook-drawer-header">
        <span className="playbook-drawer-icon">🎯</span>
        <div>
          <h3>Objection Handling</h3>
          <p className="playbook-drawer-subtitle">{deal.contact_name} — Three Distortions</p>
        </div>
      </div>

      {/* Search */}
      <div className="playbook-search">
        <input
          type="text"
          placeholder='Search (e.g., "spouse", "price", "think about it")'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="playbook-search-clear" onClick={() => setSearchQuery('')}>×</button>
        )}
      </div>

      {/* Distortions Tree */}
      <div className="distortions-tree">
        {filteredLayers.map(layer => (
          <div key={layer.id} className="distortion-layer">
            <div
              className={`layer-header ${expandedLayer === layer.id ? 'expanded' : ''}`}
              onClick={() => {
                setExpandedLayer(expandedLayer === layer.id ? null : layer.id)
                hapticLight()
              }}
            >
              <span className="layer-icon">{layer.icon}</span>
              <div className="layer-info">
                <span className="layer-name">{layer.name}</span>
                <span className="layer-desc">{layer.description}</span>
              </div>
              <span className="layer-count">
                {layer.categories.reduce((sum, c) => sum + c.strategies.length, 0)}
              </span>
              <span className="layer-expand">{expandedLayer === layer.id ? '▼' : '▶'}</span>
            </div>

            {expandedLayer === layer.id && (
              <div className="layer-categories">
                {layer.categories.map(cat => (
                  <div key={cat.id} className="distortion-category">
                    <div
                      className={`category-header ${expandedCategory === cat.id ? 'expanded' : ''}`}
                      onClick={() => {
                        setExpandedCategory(expandedCategory === cat.id ? null : cat.id)
                      }}
                    >
                      <span className="category-name">{cat.name}</span>
                      <span className="category-subtitle">{cat.subtitle}</span>
                      <span className="category-expand">{expandedCategory === cat.id ? '▼' : '▶'}</span>
                    </div>

                    {expandedCategory === cat.id && (
                      <div className="category-strategies">
                        {cat.strategies.map(strategy => (
                          <div key={strategy.id} className="strategy-card">
                            <div
                              className="strategy-header"
                              onClick={() => setExpandedStrategy(
                                expandedStrategy === strategy.id ? null : strategy.id
                              )}
                            >
                              <span className="strategy-name">{strategy.name}</span>
                              <div className="strategy-actions">
                                <button
                                  className={`strategy-copy ${copiedId === strategy.id ? 'copied' : ''}`}
                                  onClick={e => {
                                    e.stopPropagation()
                                    copyStrategy(strategy.fullScript, strategy.id)
                                  }}
                                >
                                  {copiedId === strategy.id ? '✓' : '📋'}
                                </button>
                                <button
                                  className="strategy-log"
                                  onClick={e => {
                                    e.stopPropagation()
                                    setLoggingStrategy({
                                      layer: layer.id,
                                      category: cat.id,
                                      strategy: strategy.id,
                                    })
                                  }}
                                >
                                  📝 Log
                                </button>
                              </div>
                            </div>
                            <p className="strategy-short">{strategy.shortScript}</p>
                            {expandedStrategy === strategy.id && (
                              <div className="strategy-full">
                                <p>{strategy.fullScript}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Bonus: The Reason IS the Reason */}
        {(!searchQuery || THREE_DISTORTIONS.bonus.keywords.some(kw => kw.includes(searchQuery.toLowerCase()))) && (
          <div className="distortion-layer bonus">
            <div
              className={`layer-header ${expandedLayer === 'bonus' ? 'expanded' : ''}`}
              onClick={() => {
                setExpandedLayer(expandedLayer === 'bonus' ? null : 'bonus')
                hapticLight()
              }}
            >
              <span className="layer-icon">{THREE_DISTORTIONS.bonus.icon}</span>
              <div className="layer-info">
                <span className="layer-name">{THREE_DISTORTIONS.bonus.name}</span>
                <span className="layer-desc">The master key</span>
              </div>
              <span className="layer-expand">{expandedLayer === 'bonus' ? '▼' : '▶'}</span>
            </div>
            {expandedLayer === 'bonus' && (
              <div className="strategy-card bonus-strategy">
                <p className="strategy-short">{THREE_DISTORTIONS.bonus.shortScript}</p>
                <p className="strategy-full-text">{THREE_DISTORTIONS.bonus.fullScript}</p>
                <button
                  className={`strategy-copy ${copiedId === 'bonus' ? 'copied' : ''}`}
                  onClick={() => copyStrategy(THREE_DISTORTIONS.bonus.fullScript, 'bonus')}
                >
                  {copiedId === 'bonus' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Log Objection Form */}
      {loggingStrategy && (
        <div className="log-objection-form">
          <h4>Log This Objection</h4>
          <div className="log-field">
            <label>How did it go?</label>
            <div className="outcome-buttons">
              {['overcame', 'partially', 'failed', 'unknown'].map(o => (
                <button
                  key={o}
                  className={`outcome-btn ${logForm.outcome === o ? 'selected' : ''}`}
                  onClick={() => setLogForm(prev => ({ ...prev, outcome: o }))}
                >
                  {o === 'overcame' ? '✅' : o === 'partially' ? '🔄' : o === 'failed' ? '❌' : '❓'}
                  {' '}{o.charAt(0).toUpperCase() + o.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="log-field">
            <label>Notes (optional)</label>
            <textarea
              value={logForm.notes}
              onChange={e => setLogForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="What did they say? Any context..."
              rows={2}
            />
          </div>
          <div className="log-actions">
            <button className="log-cancel" onClick={() => setLoggingStrategy(null)}>Cancel</button>
            <button className="log-save" onClick={handleLogObjection} disabled={logSaving}>
              {logSaving ? 'Saving...' : 'Save Log'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
