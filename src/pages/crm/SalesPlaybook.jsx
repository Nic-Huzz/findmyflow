/**
 * SalesPlaybook - Library page for all sales frameworks
 * Learn tab: study frameworks at your own pace
 * Track tab: objection stats from logged data
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
      {/* Top Toolbar */}
      <div className="sp-toolbar">
        <button className="back-btn" onClick={() => navigate('/crm/nurture')}>
          ←
        </button>
        <h2 className="toolbar-title">Sales Playbook</h2>
      </div>

      <header className="sp-header">
        <div className="sp-breadcrumb">
          <button onClick={() => navigate('/crm')}>Home</button>
          <span>→</span>
          <button onClick={() => navigate('/crm/nurture')}>Nurture</button>
          <span>→</span>
          <span>Playbook</span>
        </div>
        <h1>📚 Sales Playbook</h1>
        <p className="sp-subtitle">Hormozi frameworks for closing with conviction</p>
      </header>

      {/* Tabs */}
      <nav className="sp-tabs">
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
      </nav>

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
      <div className="sp-section">
        <div className="sp-section-header" onClick={() => toggleSection('three-things')}>
          <span className="sp-section-icon">🎯</span>
          <div className="sp-section-info">
            <span className="sp-section-title">{THREE_THINGS_ON_CALL.title}</span>
            <span className="sp-section-desc">{THREE_THINGS_ON_CALL.subtitle}</span>
          </div>
          <span className="sp-expand">{expandedSection === 'three-things' ? '▼' : '▶'}</span>
        </div>
        {expandedSection === 'three-things' && (
          <div className="sp-section-body">
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
      <div className="sp-section">
        <div className="sp-section-header" onClick={() => toggleSection('conviction')}>
          <span className="sp-section-icon">🔥</span>
          <div className="sp-section-info">
            <span className="sp-section-title">Conviction & Tonality</span>
            <span className="sp-section-desc">Mindset principles for closing</span>
          </div>
          <span className="sp-expand">{expandedSection === 'conviction' ? '▼' : '▶'}</span>
        </div>
        {expandedSection === 'conviction' && (
          <div className="sp-section-body">
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
      <div className="sp-section">
        <div className="sp-section-header" onClick={() => toggleSection('closer')}>
          <span className="sp-section-icon">📋</span>
          <div className="sp-section-info">
            <span className="sp-section-title">{CLOSER_FRAMEWORK.name}</span>
            <span className="sp-section-desc">{CLOSER_FRAMEWORK.description}</span>
          </div>
          <span className="sp-expand">{expandedSection === 'closer' ? '▼' : '▶'}</span>
        </div>
        {expandedSection === 'closer' && (
          <div className="sp-section-body">
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
                    <span className="sp-expand-sm">{expandedItem === step.letter ? '▼' : '▶'}</span>
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
      <div className="sp-section">
        <div className="sp-section-header" onClick={() => toggleSection('distortions')}>
          <span className="sp-section-icon">🛡️</span>
          <div className="sp-section-info">
            <span className="sp-section-title">Three Distortions</span>
            <span className="sp-section-desc">Objection handling framework</span>
          </div>
          <span className="sp-expand">{expandedSection === 'distortions' ? '▼' : '▶'}</span>
        </div>
        {expandedSection === 'distortions' && (
          <div className="sp-section-body">
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
                            {copiedId === strategy.id ? '✓' : '📋'}
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
      <div className="sp-section">
        <div className="sp-section-header" onClick={() => toggleSection('nine-things')}>
          <span className="sp-section-icon">🏆</span>
          <div className="sp-section-info">
            <span className="sp-section-title">9 Things Best Salespeople Do</span>
            <span className="sp-section-desc">Habits of top closers</span>
          </div>
          <span className="sp-expand">{expandedSection === 'nine-things' ? '▼' : '▶'}</span>
        </div>
        {expandedSection === 'nine-things' && (
          <div className="sp-section-body">
            <div className="sp-nine-things">
              {NINE_THINGS.map(thing => (
                <div key={thing.id} className={`sp-thing ${thing.isPhase1 ? 'phase1' : ''}`}>
                  <div className="sp-thing-header">
                    <span className="sp-thing-name">{thing.name}</span>
                    {thing.isPhase1 && <span className="sp-thing-badge">Active</span>}
                  </div>
                  <span className="sp-thing-full">{thing.fullName}</span>
                  <p className="sp-thing-description">{thing.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sell the Vacation */}
      <div className="sp-section">
        <div className="sp-section-header" onClick={() => toggleSection('vacation')}>
          <span className="sp-section-icon">🏖️</span>
          <div className="sp-section-info">
            <span className="sp-section-title">{SELL_THE_VACATION.title}</span>
            <span className="sp-section-desc">Outcome-first framing</span>
          </div>
          <span className="sp-expand">{expandedSection === 'vacation' ? '▼' : '▶'}</span>
        </div>
        {expandedSection === 'vacation' && (
          <div className="sp-section-body">
            <p className="sp-vacation-text">{SELL_THE_VACATION.description}</p>
            <p className="sp-vacation-guidance">{SELL_THE_VACATION.guidance}</p>
          </div>
        )}
      </div>

      {/* Key Principles */}
      <div className="sp-section">
        <div className="sp-section-header" onClick={() => toggleSection('principles')}>
          <span className="sp-section-icon">💡</span>
          <div className="sp-section-info">
            <span className="sp-section-title">10 Key Principles</span>
            <span className="sp-section-desc">Core sales beliefs</span>
          </div>
          <span className="sp-expand">{expandedSection === 'principles' ? '▼' : '▶'}</span>
        </div>
        {expandedSection === 'principles' && (
          <div className="sp-section-body">
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
      <div className="sp-case-study">
        <h3>{CASE_STUDY_DATA.title}</h3>
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
        <div className="sp-track-empty">
          <span className="sp-empty-icon">📝</span>
          <h3>No Objection Data Yet</h3>
          <p>Log objections during sales calls using the Playbook drawer on deal cards.</p>
        </div>
      ) : (
        <div className="sp-objection-stats">
          {/* Summary */}
          <div className="sp-stats-summary">
            <div className="sp-stat-card">
              <span className="sp-stat-value">{stats.totalLogs}</span>
              <span className="sp-stat-label">Objections Logged</span>
            </div>
            {stats.strategyEffectiveness?.[0] && (
              <div className="sp-stat-card">
                <span className="sp-stat-value">{stats.strategyEffectiveness[0].successRate}%</span>
                <span className="sp-stat-label">Top Strategy Rate</span>
              </div>
            )}
          </div>

          {/* By Layer */}
          <div className="sp-stats-section">
            <h4>By Distortion Layer</h4>
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

          {/* Top Objections */}
          {stats.topObjections?.length > 0 && (
            <div className="sp-stats-section">
              <h4>Most Common Objections</h4>
              {stats.topObjections.map(([category, count]) => (
                <div key={category} className="sp-top-category" style={{ marginBottom: 6 }}>
                  <span className="sp-top-label">
                    {DISTORTION_REASON_LABELS[category] || category}
                  </span>
                  <span className="sp-top-count">{count} times</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
