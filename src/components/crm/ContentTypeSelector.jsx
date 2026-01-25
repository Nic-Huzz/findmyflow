// src/components/crm/ContentTypeSelector.jsx
// Screen 1: Select content types from phase-based list

import { useState, useEffect } from 'react'
import { PHASE_CONTENT_TYPES } from '../../lib/crm/contentPlanningService'
import { PHASES } from '../../lib/crm/weeklyPlanningService'
import './ContentTypeSelector.css'

export default function ContentTypeSelector({
  activePhases = [],
  value = [],
  onChange,
  onContinue,
  onBack
}) {
  const [selected, setSelected] = useState(value)
  const [customText, setCustomText] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customPhase, setCustomPhase] = useState(null)

  useEffect(() => {
    setSelected(value)
  }, [value])

  const addItem = (contentType, phase) => {
    const newItem = {
      id: `${contentType.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: contentType.type,
      label: contentType.label,
      icon: contentType.icon,
      phase
    }
    const newSelected = [...selected, newItem]
    setSelected(newSelected)
    onChange?.(newSelected)
  }

  const removeItem = (itemId) => {
    const newSelected = selected.filter(item => item.id !== itemId)
    setSelected(newSelected)
    onChange?.(newSelected)
  }

  const getCountForType = (type, phase) => {
    return selected.filter(item => item.type === type && item.phase === phase).length
  }

  const handleAddCustom = () => {
    if (!customText.trim() || !customPhase) return

    const newItem = {
      id: `custom-${Date.now()}`,
      type: 'custom',
      label: customText.trim(),
      icon: '✏️',
      phase: customPhase,
      isCustom: true
    }
    const newSelected = [...selected, newItem]
    setSelected(newSelected)
    onChange?.(newSelected)
    setCustomText('')
    setShowCustomInput(false)
    setCustomPhase(null)
  }

  const handleContinue = () => {
    if (selected.length > 0) {
      onContinue(selected)
    }
  }

  return (
    <div className="content-type-selector">
      <div className="selector-header">
        <h2 className="selector-title">Your Content Plan</h2>
        <p className="selector-subtitle">
          Based on: {activePhases.map(p => PHASES[p]?.icon).join(' ')} {activePhases.map(p => PHASES[p]?.label).join(', ')}
        </p>
      </div>

      <div className="content-types-list">
        {activePhases.map(phaseId => {
          const phase = PHASES[phaseId]
          const types = PHASE_CONTENT_TYPES[phaseId] || []

          return (
            <div key={phaseId} className="phase-content-section">
              <h3 className="phase-section-title" style={{ color: phase.color }}>
                {phase.icon} {phase.label.toUpperCase()}
              </h3>

              <div className="content-type-options">
                {types.map(contentType => {
                  const count = getCountForType(contentType.type, phaseId)
                  return (
                    <div key={contentType.type} className="content-type-row">
                      <button
                        className="add-content-btn"
                        onClick={() => addItem(contentType, phaseId)}
                      >
                        +
                      </button>
                      <span className="content-type-icon">{contentType.icon}</span>
                      <span className="content-type-label">{contentType.label}</span>
                      {count > 0 && (
                        <div className="content-count-controls">
                          <button
                            className="remove-content-btn"
                            onClick={() => {
                              const itemToRemove = selected.find(
                                i => i.type === contentType.type && i.phase === phaseId
                              )
                              if (itemToRemove) removeItem(itemToRemove.id)
                            }}
                          >
                            −
                          </button>
                          <span className="content-count">{count}×</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Custom Content */}
      {!showCustomInput ? (
        <button
          className="add-custom-btn"
          onClick={() => setShowCustomInput(true)}
        >
          + Add custom content idea
        </button>
      ) : (
        <div className="custom-content-input">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Enter content idea..."
            autoFocus
          />
          <select
            value={customPhase || ''}
            onChange={(e) => setCustomPhase(e.target.value)}
          >
            <option value="">Select phase...</option>
            {activePhases.map(phaseId => (
              <option key={phaseId} value={phaseId}>
                {PHASES[phaseId].icon} {PHASES[phaseId].label}
              </option>
            ))}
          </select>
          <div className="custom-content-actions">
            <button
              className="cancel-custom-btn"
              onClick={() => {
                setShowCustomInput(false)
                setCustomText('')
                setCustomPhase(null)
              }}
            >
              Cancel
            </button>
            <button
              className="save-custom-btn"
              onClick={handleAddCustom}
              disabled={!customText.trim() || !customPhase}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Selected Summary */}
      <div className="selected-summary">
        <span className="summary-label">Selected:</span>
        <span className="summary-count">{selected.length} piece{selected.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Actions */}
      <div className="selector-actions">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            ← Back
          </button>
        )}
        <button
          className="continue-btn"
          onClick={handleContinue}
          disabled={selected.length === 0}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
