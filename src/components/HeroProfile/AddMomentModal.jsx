import React, { useState } from 'react'

/**
 * AddMomentModal - Modal for users to log significant journey moments
 */

const ACTS = [
  { id: 'awakening', name: 'Awakening', description: 'Discovery & realization' },
  { id: 'finding', name: 'Finding Flow', description: 'Building & facing fears' },
  { id: 'living', name: 'Living Flow', description: 'Mastery & service' },
]

function AddMomentModal({ onClose, onSave, currentAct }) {
  const [momentText, setMomentText] = useState('')
  const [momentDate, setMomentDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [selectedAct, setSelectedAct] = useState(currentAct || 'finding')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const handleSave = async () => {
    if (!momentText.trim()) return

    setSaving(true)
    setSaveError(null)
    try {
      const result = await onSave({
        moment_text: momentText.trim(),
        moment_date: momentDate,
        act: selectedAct,
      })
      if (result?.error) {
        setSaveError('Failed to save moment. Please try again.')
      }
    } catch (error) {
      console.error('Error saving moment:', error)
      setSaveError('Failed to save moment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="moment-modal-backdrop" onClick={handleBackdropClick}>
      <div className="moment-modal">
        <div className="moment-modal-header">
          <h3>Add a Moment</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="moment-modal-content">
          <div className="moment-field">
            <label htmlFor="moment-text">What happened?</label>
            <textarea
              id="moment-text"
              value={momentText}
              onChange={(e) => setMomentText(e.target.value)}
              placeholder="A significant realization, decision, or milestone..."
              rows={3}
              maxLength={200}
              autoFocus
            />
            <span className="char-count">{momentText.length}/200</span>
          </div>

          <div className="moment-field">
            <label htmlFor="moment-date">When?</label>
            <input
              id="moment-date"
              type="date"
              value={momentDate}
              onChange={(e) => setMomentDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="moment-field">
            <label>Which act does this belong to?</label>
            <div className="act-options">
              {ACTS.map((act) => (
                <label
                  key={act.id}
                  className={`act-option ${selectedAct === act.id ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="act"
                    value={act.id}
                    checked={selectedAct === act.id}
                    onChange={() => setSelectedAct(act.id)}
                  />
                  <div className="act-option-content">
                    <span className="act-option-name">{act.name}</span>
                    <span className="act-option-desc">{act.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="moment-modal-actions">
          {saveError && (
            <p className="modal-error">{saveError}</p>
          )}
          <div className="modal-buttons">
            <button
              className="modal-cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="modal-save"
              onClick={handleSave}
              disabled={!momentText.trim() || saving}
            >
              {saving ? 'Saving...' : 'Save Moment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddMomentModal
