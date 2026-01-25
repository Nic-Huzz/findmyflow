// src/components/crm/ContentPlanSummary.jsx
// Screen 3: Review the complete content plan

import { PHASES } from '../../lib/crm/weeklyPlanningService'
import './ContentPlanSummary.css'

export default function ContentPlanSummary({
  items = [],
  onConfirm,
  onBack,
  onEditItem
}) {
  // Group items by phase
  const groupedByPhase = items.reduce((acc, item) => {
    if (!acc[item.phase]) {
      acc[item.phase] = []
    }
    acc[item.phase].push(item)
    return acc
  }, {})

  const phases = Object.keys(groupedByPhase)
  const totalItems = items.length
  const itemsWithContext = items.filter(i => i.context).length

  return (
    <div className="content-plan-summary">
      {/* Header */}
      <div className="summary-header">
        <span className="summary-emoji">📋</span>
        <h2 className="summary-title">Your Content Plan</h2>
        <p className="summary-subtitle">
          {totalItems} piece{totalItems !== 1 ? 's' : ''} of content planned
          {itemsWithContext > 0 && ` • ${itemsWithContext} with context`}
        </p>
      </div>

      {/* Content Items by Phase */}
      <div className="plan-content-list">
        {phases.map(phaseId => {
          const phase = PHASES[phaseId]
          const phaseItems = groupedByPhase[phaseId]

          return (
            <div
              key={phaseId}
              className="phase-group"
              style={{ '--phase-color': phase?.color }}
            >
              <h3 className="phase-group-title">
                {phase?.icon} {phase?.label}
              </h3>

              <div className="phase-items">
                {phaseItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="content-item-card"
                    onClick={() => onEditItem?.(item, items.indexOf(item))}
                  >
                    <div className="item-header">
                      <span className="item-icon">{item.icon}</span>
                      <span className="item-label">{item.label}</span>
                      {item.isCustom && (
                        <span className="custom-badge">Custom</span>
                      )}
                    </div>
                    {item.context ? (
                      <p className="item-context">{item.context}</p>
                    ) : (
                      <p className="item-no-context">No context added</p>
                    )}
                    <span className="edit-hint">Tap to edit</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats */}
      <div className="plan-stats">
        <div className="stat-item">
          <span className="stat-value">{totalItems}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value">{itemsWithContext}</span>
          <span className="stat-label">With Context</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value">{phases.length}</span>
          <span className="stat-label">Phases</span>
        </div>
      </div>

      {/* Actions */}
      <div className="summary-actions">
        <button className="back-btn" onClick={onBack}>
          ← Edit Plan
        </button>
        <button
          className="confirm-btn"
          onClick={() => onConfirm(items)}
        >
          Start Creating ✨
        </button>
      </div>
    </div>
  )
}
