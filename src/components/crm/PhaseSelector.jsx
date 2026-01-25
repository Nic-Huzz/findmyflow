// src/components/crm/PhaseSelector.jsx
// Screen 2: Multi-select phase picker

import { useState, useEffect } from 'react'
import { PHASES } from '../../lib/crm/weeklyPlanningService'
import './PhaseSelector.css'

export default function PhaseSelector({ value = [], onChange, onContinue, onBack }) {
  const [selected, setSelected] = useState(value)

  useEffect(() => {
    setSelected(value)
  }, [value])

  const togglePhase = (phaseId) => {
    const newSelected = selected.includes(phaseId)
      ? selected.filter(p => p !== phaseId)
      : [...selected, phaseId]
    setSelected(newSelected)
    onChange?.(newSelected)
  }

  const handleContinue = () => {
    if (selected.length > 0) {
      onContinue(selected)
    }
  }

  return (
    <div className="phase-selector">
      <div className="phase-header">
        <h2 className="phase-title">What's on your plate this week?</h2>
        <p className="phase-subtitle">Select all that apply</p>
      </div>

      <div className="phases-grid">
        {Object.values(PHASES).map(phase => (
          <button
            key={phase.id}
            className={`phase-card ${selected.includes(phase.id) ? 'selected' : ''}`}
            onClick={() => togglePhase(phase.id)}
            style={{ '--phase-color': phase.color }}
          >
            <span className="phase-icon">{phase.icon}</span>
            <span className="phase-label">{phase.label}</span>
            <span className="phase-desc">{phase.description}</span>
            {selected.includes(phase.id) && (
              <span className="phase-check">✓</span>
            )}
          </button>
        ))}
      </div>

      <div className="phase-actions">
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

      {selected.length > 0 && (
        <p className="selected-count">
          {selected.length} phase{selected.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  )
}
