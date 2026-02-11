/**
 * SalesPlaybook.jsx — /crm/sales-playbook
 * Educational library of Hormozi sales frameworks + objection analytics
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  THREE_DISTORTIONS,
  CLOSER_FRAMEWORK,
  NINE_THINGS,
  CONVICTION_TONALITY,
  THREE_THINGS_ON_CALL,
  SELL_THE_VACATION,
  CASE_STUDY_DATA,
  KEY_PRINCIPLES,
  DISTORTION_REASON_LABELS,
} from '../../data/salesPlaybook'
import { getObjectionStats } from '../../lib/crm/objectionService'
import { hapticLight } from '../../lib/haptics'
import './SalesPlaybook.css'

export default function SalesPlaybook() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('learn')

  return (
    <div className="sales-playbook">
      {/* TOOLBAR */}
      <div className="sp-toolbar">
        <button className="sp-back" onClick={() => navigate('/crm/tools')}>←</button>
        <h2 className="sp-toolbar-title">Sales Playbook</h2>
      </div>

      {/* HERO */}
      <div className="sp-hero">
        <span className="sp-hero-label">Hormozi Frameworks</span>
        <h2 className="sp-hero-title">Sales Playbook</h2>
        <p className="sp-hero-sub">Proven closing frameworks and objection handling from $100M+ in sales</p>
        <div className="sp-hero-stats">
          <div className="sp-hero-stat">
            <span className="sp-hero-stat-value">7</span>
            <span className="sp-hero-stat-label">Frameworks</span>
          </div>
          <div className="sp-hero-stat">
            <span className="sp-hero-stat-value">20+</span>
            <span className="sp-hero-stat-label">Strategies</span>
          </div>
          <div className="sp-hero-stat">
            <span className="sp-hero-stat-value">6</span>
            <span className="sp-hero-stat-label">CLOSER Steps</span>
          </div>
          <div className="sp-hero-stat">
            <span className="sp-hero-stat-value">10</span>
            <span className="sp-hero-stat-label">Principles</span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="sp-tabs">
        <button
          className={`sp-tab ${activeTab === 'learn' ? 'active' : ''}`}
          onClick={() => { setActiveTab('learn'); hapticLight() }}
        >
          Learn
        </button>
        <button
          className={`sp-tab ${activeTab === 'track' ? 'active' : ''}`}
          onClick={() => { setActiveTab('track'); hapticLight() }}
        >
          Track
        </button>
      </div>

      {activeTab === 'learn' ? (
        <LearnTab />
      ) : (
        <TrackTab userId={user?.id} />
      )}
    </div>
  )
}

// ============================================
// LEARN TAB
// ============================================
function LearnTab() {
  const [expandedSection, setExpandedSection] = useState(null)
  const [expandedItem, setExpandedItem] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  function copyText(text, id) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    hapticLight()
    setTimeout(() => setCopiedId(null), 2000)
  }

  function toggleSection(id) {
    setExpandedSection(expandedSection === id ? null : id)
    setExpandedItem(null)
    hapticLight()
  }

  return (
    <div className="sp-learn">
      {/* Three Things */}
      <div className="sp-card">
        <div className="sp-accordion-header" onClick={() => toggleSection('three-things')}>
          <div className="sp-accordion-icon">🎯</div>
          <div className="sp-accordion-info">
            <span className="sp-accordion-title">{THREE_THINGS_ON_CALL.title}</span>
            <span className="sp-accordion-desc">{THREE_THINGS_ON_CALL.subtitle}</span>
          </div>
          <span className="sp-chevron">{expandedSection === 'three-things' ? '▼' : '▶'}</span>
        </div>
        {expandedSection === 'three-things' && (
          <div className="sp-accordion-body">
            <div className="sp-three-things">
              {THREE_THINGS_ON_CALL.items.map(item => (
                <div key={item.id} className="sp-thing-card" style={{ borderLeftColor: item.color }}>
                  <span className="sp-thing-label" style={{ color: item.color }}>{item.label}</span>
                  <span className="sp-thing-desc">{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conviction & Tonality */}
      <div className="sp-card">
        <div className="sp-accordion-header" onClick={() => toggleSection('conviction')}>
          <div className="sp-accordion-icon">🔥</div>
          <div className="sp-accordion-info">
            <span className="sp-accordion-title">Conviction & Tonality</span>
            <span className="sp-accordion-desc">Mindset principles for closing</span>
          </div>
          <span className="sp-chevron">{expandedSection === 'conviction' ? '▼' : '▶'}</span>
        </div>
        {expandedSection === 'conviction' && (
          <div className="sp-accordion-body">
            <div className="sp-conviction-cards">
              {CONVICTION_TONALITY.map(card => (
                <div key={card.id} className="sp-conviction-card">
                  <span className="sp-conviction-icon">{card.icon}</span>
                  <div>
                    <span className="sp-conviction-title">{card.title}</span>
                    <span className="sp-conviction-desc">{card.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CLOSER Framework */}
      <div className="sp-card">
        <div className="sp-accordion-header" onClick={() => toggleSection('closer')}>
          <div className="sp-accordion-icon">📋</div>
          <div className="sp-accordion-info">
            <span className="sp-accordion-title">{CLOSER_FRAMEWORK.name}</span>
            <span className="sp-accordion-desc">{CLOSER_FRAMEWORK.description}</span>
          </div>
          <span className="sp-chevron">{expandedSection === 'closer' ? '▼' : '▶'}</span>
        </div>
        {expandedSection === 'closer' && (
          <div className="sp-accordion-body">
            <div className="sp-closer-steps">
              {CLOSER_FRAMEWORK.steps.map(step => (
                <div key={step.letter} className="sp-closer-step">
                  <div
                    className="sp-closer-step-header"
                    onClick={() => setExpandedItem(expandedItem === step.letter ? null : step.letter)}
                  >
                    <span className="sp-closer-letter">{step.letter}</span>
                    <div className="sp-closer-info">
                      <span className="sp-closer-title">{step.title}</span>
                      <span className="sp-closer-desc">{step.description}</span>
                    </div>
                    <span className="sp-chevron-sm">{expandedItem === step.letter ? '▼' : '▶'}</span>
                  </div>
                  {expandedItem === step.letter && (
                    <div className="sp-closer-body">
                      <p className="sp-closer-guidance">{step.guidance}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Three Distortions */}
      <div className="sp-card">
        <div className="sp-accordion-header" onClick={() => toggleSection('distortions')}>
          <div className="sp-accordion-icon">🛡️</div>
          <div className="sp-accordion-info">
            <span className="sp-accordion-title">Three Distortions</span>
            <span className="sp-accordion-desc">Objection handling framework</span>
          </div>
          <span className="sp-chevron">{expandedSection === 'distortions' ? '▼' : '▶'}</span>
        </div>
        {expandedSection === 'distortions' && (
          <div className="sp-accordion-body">
            {THREE_DISTORTIONS.layers.map(layer => (
              <div key={layer.id} className="sp-distortion-layer">
                <div className="sp-layer-header">
                  <span className="sp-layer-icon">{layer.icon}</span>
                  <span className="sp-layer-name">{layer.name}</span>
                  <span className="sp-layer-desc">{layer.description}</span>
                </div>
                {layer.categories.map(cat => (
                  <div key={cat.id} className="sp-category">
                    <div className="sp-category-title">{cat.name} — {cat.subtitle}</div>
                    {cat.strategies.map(strategy => (
                      <div key={strategy.id} className="sp-strategy">
                        <div className="sp-strategy-header">
                          <span className="sp-strategy-name">{strategy.name}</span>
                          <button
                            className={`sp-copy-btn ${copiedId === strategy.id ? 'copied' : ''}`}
                            onClick={() => copyText(strategy.fullScript, strategy.id)}
                          >
                            {copiedId === strategy.id ? '✓ Copied' : '📋 Copy'}
                          </button>
                        </div>
                        <p className="sp-strategy-text">{strategy.shortScript}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nine Things */}
      <div className="sp-card">
        <div className="sp-accordion-header" onClick={() => toggleSection('nine-things')}>
          <div className="sp-accordion-icon">🏆</div>
          <div className="sp-accordion-info">
            <span className="sp-accordion-title">9 Things Best Salespeople Do</span>
            <span className="sp-accordion-desc">Habits of top closers</span>
          </div>
          <span className="sp-chevron">{expandedSection === 'nine-things' ? '▼' : '▶'}</span>
        </div>
        {expandedSection === 'nine-things' && (
          <div className="sp-accordion-body">
            <div className="sp-nine-things">
              {NINE_THINGS.map(thing => (
                <div key={thing.id} className={`sp-nine-item ${thing.isPhase1 ? 'active' : ''}`}>
                  <div className="sp-nine-header">
                    <span className="sp-nine-name">{thing.name}</span>
                    {thing.isPhase1 && <span className="sp-nine-badge">Active</span>}
                  </div>
                  <span className="sp-nine-full">{thing.fullName}</span>
                  <p className="sp-nine-description">{thing.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sell the Vacation */}
      <div className="sp-card">
        <div className="sp-accordion-header" onClick={() => toggleSection('vacation')}>
          <div className="sp-accordion-icon">🏖️</div>
          <div className="sp-accordion-info">
            <span className="sp-accordion-title">{SELL_THE_VACATION.title}</span>
            <span className="sp-accordion-desc">Outcome-first framing</span>
          </div>
          <span className="sp-chevron">{expandedSection === 'vacation' ? '▼' : '▶'}</span>
        </div>
        {expandedSection === 'vacation' && (
          <div className="sp-accordion-body">
            <p className="sp-vacation-text">{SELL_THE_VACATION.description}</p>
            <p className="sp-vacation-guidance">{SELL_THE_VACATION.guidance}</p>
          </div>
        )}
      </div>

      {/* Key Principles */}
      <div className="sp-card">
        <div className="sp-accordion-header" onClick={() => toggleSection('principles')}>
          <div className="sp-accordion-icon">💡</div>
          <div className="sp-accordion-info">
            <span className="sp-accordion-title">10 Key Principles</span>
            <span className="sp-accordion-desc">Core sales beliefs</span>
          </div>
          <span className="sp-chevron">{expandedSection === 'principles' ? '▼' : '▶'}</span>
        </div>
        {expandedSection === 'principles' && (
          <div className="sp-accordion-body">
            <div className="sp-principles">
              {KEY_PRINCIPLES.map(p => (
                <div key={p.id} className="sp-principle">
                  <span className="sp-principle-num">{p.id}</span>
                  <span className="sp-principle-text">{p.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// TRACK TAB
// ============================================
function TrackTab({ userId }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) loadStats()
    else setLoading(false)
  }, [userId])

  async function loadStats() {
    setLoading(true)
    const result = await getObjectionStats(userId)
    setStats(result)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="sp-track-loading">
        <div className="sp-spinner" />
        <p>Loading stats...</p>
      </div>
    )
  }

  return (
    <div className="sp-track">
      {/* Case Study Comparison */}
      <div className="sp-card sp-case-study-card">
        <div className="sp-section-header">
          <div className="sp-section-icon">📊</div>
          <span className="sp-section-title">Framework Results</span>
        </div>
        <h3 className="sp-case-title">{CASE_STUDY_DATA.title}</h3>
        <p className="sp-case-subtitle">{CASE_STUDY_DATA.subtitle}</p>
        <div className="sp-metrics-grid">
          {CASE_STUDY_DATA.metrics.map(metric => (
            <div key={metric.label} className="sp-metric-card">
              <span className="sp-metric-label">{metric.label}</span>
              <div className="sp-metric-comparison">
                <span className="sp-metric-before">{metric.before}{metric.unit}</span>
                <span className="sp-metric-arrow">→</span>
                <span className="sp-metric-after">{metric.after}{metric.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Objection Stats */}
      {!stats ? (
        <div className="sp-card sp-empty-card">
          <span className="sp-empty-icon">📝</span>
          <h3 className="sp-empty-title">No Objection Data Yet</h3>
          <p className="sp-empty-text">Log objections during sales calls using the Playbook drawer on deal cards.</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="sp-card">
            <div className="sp-section-header">
              <div className="sp-section-icon">📈</div>
              <span className="sp-section-title">Your Stats</span>
            </div>
            <div className="sp-stats-summary">
              <div className="sp-stat-tile">
                <span className="sp-stat-value">{stats.totalLogs}</span>
                <span className="sp-stat-label">Objections Logged</span>
              </div>
              {stats.strategyEffectiveness?.[0] && (
                <div className="sp-stat-tile">
                  <span className="sp-stat-value sp-stat-gold">{stats.strategyEffectiveness[0].successRate}%</span>
                  <span className="sp-stat-label">Top Strategy Rate</span>
                </div>
              )}
            </div>
          </div>

          {/* By Distortion Layer */}
          {Object.entries(stats.byLayer).some(([, count]) => count > 0) && (
            <div className="sp-card">
              <div className="sp-section-header">
                <div className="sp-section-icon">🛡️</div>
                <span className="sp-section-title">By Distortion Layer</span>
              </div>
              <div className="sp-layer-bars">
                {Object.entries(stats.byLayer).filter(([, count]) => count > 0).map(([layer, count]) => {
                  const percent = Math.round((count / stats.totalLogs) * 100)
                  return (
                    <div key={layer} className="sp-bar-item">
                      <div className="sp-bar-header">
                        <span className="sp-bar-label">{layer.charAt(0).toUpperCase() + layer.slice(1)}</span>
                        <span className="sp-bar-count">{count} ({percent}%)</span>
                      </div>
                      <div className="sp-bar-track">
                        <div className="sp-bar-fill" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top Objections */}
          {stats.topObjections?.length > 0 && (
            <div className="sp-card">
              <div className="sp-section-header">
                <div className="sp-section-icon">🔥</div>
                <span className="sp-section-title">Most Common Objections</span>
              </div>
              <div className="sp-top-objections">
                {stats.topObjections.map(([category, count]) => (
                  <div key={category} className="sp-top-row">
                    <span className="sp-top-label">
                      {DISTORTION_REASON_LABELS[category] || category}
                    </span>
                    <span className="sp-top-count">{count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
