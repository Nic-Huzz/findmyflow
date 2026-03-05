import { useState } from 'react'
import './GroanCompletionModal.css'

export default function HealingCompletionModal({ quest, onComplete, onClose }) {
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  const needsText = quest.inputType === 'text' || quest.inputType === 'text_with_tags'
  const isCheckbox = quest.inputType === 'checkbox'

  const handleSubmit = async () => {
    if (needsText && !input.trim()) return
    setSaving(true)
    try {
      await onComplete(quest, needsText ? input.trim() : null)
      onClose()
    } catch (err) {
      console.error('Error completing healing quest:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="gcm-overlay" onClick={onClose}>
      <div className="gcm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="gcm-close" onClick={onClose}>&times;</button>

        <h2 className="gcm-title">{quest.name}</h2>
        <p className="gcm-subtitle">{quest.description}</p>

        {needsText && (
          <div className="gcm-form">
            <div className="gcm-textarea-group">
              <textarea
                placeholder={quest.placeholder || 'Share your reflection...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={4}
                autoFocus
              />
            </div>
          </div>
        )}

        {isCheckbox && (
          <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: 16, textAlign: 'center' }}>
            Tap below to mark as done
          </p>
        )}

        <button
          className="gcm-gold-btn"
          onClick={handleSubmit}
          disabled={saving || (needsText && !input.trim())}
        >
          {saving ? 'Saving...' : 'Complete'}
        </button>
      </div>
    </div>
  )
}
