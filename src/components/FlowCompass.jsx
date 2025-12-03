import React from 'react'
import { FLOW_DIRECTIONS } from '../lib/flowCompass'

/**
 * FlowCompass - Interactive compass for selecting flow direction
 *
 * Props:
 * - onSelect: (direction, internalState, externalState) => void
 * - selectedDirection: string | null
 * - size: 'small' | 'medium' | 'large' (default: 'medium')
 * - showLabels: boolean (default: true)
 */

const FlowCompass = ({
  onSelect,
  selectedDirection = null,
  size = 'medium',
  showLabels = true
}) => {
  const directions = Object.values(FLOW_DIRECTIONS)

  const handleSelect = (dir) => {
    if (onSelect) {
      onSelect(dir.id, dir.internal, dir.external)
    }
  }

  return (
    <div className={`flow-compass flow-compass-${size}`}>
      {/* Center circle */}
      <div className="compass-center">
        <span className="compass-icon">🧭</span>
        {selectedDirection && (
          <div className="selected-indicator">
            {FLOW_DIRECTIONS[selectedDirection]?.emoji}
          </div>
        )}
      </div>

      {/* Four quadrants */}
      {directions.map(dir => (
        <button
          key={dir.id}
          className={`compass-quadrant compass-${dir.id} ${selectedDirection === dir.id ? 'selected' : ''}`}
          onClick={() => handleSelect(dir)}
          style={{ '--quadrant-color': dir.color }}
          aria-label={`${dir.label} - ${dir.description}`}
        >
          <div className="quadrant-content">
            <span className="quadrant-icon">{dir.icon}</span>
            {showLabels && (
              <>
                <span className="quadrant-label">{dir.label}</span>
                <span className="quadrant-states">
                  {dir.internal === 'excited' ? '😊' : '😴'} + {dir.external === 'ease' ? '✅' : '❌'}
                </span>
              </>
            )}
          </div>

          {/* Hover tooltip */}
          <div className="quadrant-tooltip">
            <strong>{dir.fullLabel}</strong>
            <p>{dir.signal}</p>
          </div>
        </button>
      ))}

      {/* Legend (optional, shows on larger sizes) */}
      {size === 'large' && (
        <div className="compass-legend">
          <div className="legend-item">
            <span>😊 Excited</span>
            <span>😴 Tired</span>
          </div>
          <div className="legend-item">
            <span>✅ Ease</span>
            <span>❌ Resistance</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default FlowCompass
