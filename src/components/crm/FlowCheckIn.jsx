// src/components/crm/FlowCheckIn.jsx
// Reusable two-factor flow tracker component

import { useState, useEffect } from 'react'
import { FLOW_DIRECTIONS, getFlowDirection } from '../../lib/crm/reflectionService'
import './FlowCheckIn.css'

export default function FlowCheckIn({
  value = { internal: null, external: null },
  onChange,
  showResult = true,
  compact = false
}) {
  const [internal, setInternal] = useState(value.internal)
  const [external, setExternal] = useState(value.external)

  useEffect(() => {
    setInternal(value.internal)
    setExternal(value.external)
  }, [value])

  const handleInternalChange = (val) => {
    setInternal(val)
    onChange?.({ internal: val, external })
  }

  const handleExternalChange = (val) => {
    setExternal(val)
    onChange?.({ internal, external: val })
  }

  const direction = internal && external ? getFlowDirection(internal, external) : null
  const directionInfo = direction ? FLOW_DIRECTIONS[direction] : null

  return (
    <div className={`flow-check-in ${compact ? 'compact' : ''}`}>
      <div className="flow-question">
        <p className="flow-label">How are you feeling right now?</p>

        <div className="flow-factor">
          <span className="factor-label">Internally:</span>
          <div className="factor-options">
            <button
              type="button"
              className={`factor-btn ${internal === 'excited' ? 'selected' : ''}`}
              onClick={() => handleInternalChange('excited')}
            >
              <span className="factor-emoji">😊</span>
              <span className="factor-text">Excited</span>
            </button>
            <button
              type="button"
              className={`factor-btn ${internal === 'tired' ? 'selected' : ''}`}
              onClick={() => handleInternalChange('tired')}
            >
              <span className="factor-emoji">😴</span>
              <span className="factor-text">Tired</span>
            </button>
          </div>
        </div>

        <div className="flow-factor">
          <span className="factor-label">Externally:</span>
          <div className="factor-options">
            <button
              type="button"
              className={`factor-btn ${external === 'great' ? 'selected' : ''}`}
              onClick={() => handleExternalChange('great')}
            >
              <span className="factor-emoji">✨</span>
              <span className="factor-text">Great</span>
            </button>
            <button
              type="button"
              className={`factor-btn ${external === 'resistance' ? 'selected' : ''}`}
              onClick={() => handleExternalChange('resistance')}
            >
              <span className="factor-emoji">💪</span>
              <span className="factor-text">Facing Resistance</span>
            </button>
          </div>
        </div>
      </div>

      {showResult && directionInfo && (
        <div
          className="flow-result"
          style={{ '--direction-color': directionInfo.color }}
        >
          <span className="direction-emoji">{directionInfo.emoji}</span>
          <div className="direction-info">
            <span className="direction-label">{directionInfo.label.toUpperCase()}</span>
            <span className="direction-desc">{directionInfo.description}</span>
          </div>
        </div>
      )}
    </div>
  )
}
