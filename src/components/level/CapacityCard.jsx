/**
 * CapacityCard.jsx
 *
 * Vibe Rise Score v4 — 3-pillar zone model:
 *   1. Pillar status row (Safety / Expression / Maintenance)
 *   2. Zone bar (Stuck / Wired / Grounded / Vibe Rise)
 *   3. Maintenance rolling 7-day streak dots
 *
 * CSS prefix: cc- (scoped under .tune-tab or .level-tab)
 * Rewritten: 2026-08-30 (v4)
 */

import useCapacityScore from '../../hooks/useCapacityScore'
import './CapacityCard.css'

const ZONE_LABELS = [
  { id: 'stuck', label: 'Stuck' },
  { id: 'wired', label: 'Wired' },
  { id: 'grounded', label: 'Grounded' },
  { id: 'vibe-rise', label: 'Vibe Rise' },
]

const PILLAR_CONFIG = [
  { key: 'safety', label: 'Safety', icon: '🛡️' },
  { key: 'expression', label: 'Expression', icon: '🔥' },
  { key: 'maintenance', label: 'Maintenance', icon: '⚡' },
]

export default function CapacityCard({ userId, refreshTrigger = 0, scoreData, onNavigate, hideMaintenance }) {
  const hookData = useCapacityScore(scoreData ? null : userId, refreshTrigger)
  const {
    capacity, zone, trend,
    maintenancePct, maintenanceDays,
    pillars, activePillars,
    dataPoints, loading,
  } = scoreData || hookData

  if (loading) return null
  if (capacity === null || dataPoints === 0) {
    return (
      <div className="cc-card cc-empty">
        <div className="cc-header">
          <span className="cc-title">Vibe Rise Score</span>
        </div>
        <p className="cc-empty-text">Complete a daily practice to start tracking</p>
        {onNavigate && <button className="cc-cta" onClick={onNavigate}>Continue in Challenge <span>→</span></button>}
      </div>
    )
  }

  const trendText = trend > 0 ? `+${trend}` : trend < 0 ? `${trend}` : ''
  const trendClass = trend > 0 ? 'cc-trend-up' : trend < 0 ? 'cc-trend-down' : 'cc-trend-flat'

  return (
    <div className="cc-card">
      {/* Header */}
      <div className="cc-header">
        <span className="cc-title">Vibe Rise Score</span>
        {trend !== 0 && (
          <span className={`cc-trend ${trendClass}`}>
            {trend > 0 ? '↑' : '↓'} {trendText}
          </span>
        )}
      </div>

      {/* Pillar status: 3 pills showing active/inactive */}
      {pillars && (
        <div className="cc-pillars">
          {PILLAR_CONFIG.map(p => {
            const pillar = pillars[p.key]
            return (
              <span
                key={p.key}
                className={`cc-pillar-pill ${pillar.active ? 'cc-pillar-active' : 'cc-pillar-inactive'}`}
              >
                {p.icon} {p.label}
              </span>
            )
          })}
        </div>
      )}

      {/* Zone bar */}
      <div className="cc-bar-wrap">
        <div className="cc-bar-track">
          {ZONE_LABELS.map(z => (
            <div key={z.id} className={`cc-bar-zone cc-bz-${z.id} ${zone === z.id ? 'active' : ''}`} />
          ))}
        </div>
        <div className="cc-marker" style={{ left: `${Math.min(99, Math.max(1, capacity))}%` }} />
      </div>
      <div className="cc-zone-labels">
        {ZONE_LABELS.map(z => (
          <span key={z.id} className={`cc-zone-label ${zone === z.id ? `active cc-zl-${z.id}` : ''}`}>
            {z.label}
          </span>
        ))}
      </div>

      {/* Maintenance streak dots */}
      {!hideMaintenance && (
        <div className="cc-maint">
          <div className="cc-maint-header">
            <span className="cc-maint-label">Maintenance</span>
            <span className="cc-maint-pct">{maintenancePct}%</span>
          </div>
          <div className="cc-maint-dots">
            {maintenanceDays.map((day, i) => (
              <div key={i} className="cc-maint-day">
                <div className={`cc-maint-dot cc-maint-${day.status}`} />
                <span className="cc-maint-day-label">{day.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {onNavigate && <button className="cc-cta" onClick={onNavigate}>Continue in Challenge <span>→</span></button>}
    </div>
  )
}
