/**
 * VoiceTemplates - Quick path for users to select a pre-built voice
 */
import { useState } from 'react'
import { VOICE_TEMPLATES } from '../../../lib/voiceProfile'

export default function VoiceTemplates({ onSelectTemplate, onStartFullTraining, onBack }) {
  const [selectedId, setSelectedId] = useState(null)

  const handleSelect = () => {
    if (!selectedId) return
    onSelectTemplate(selectedId)
  }

  const templates = Object.values(VOICE_TEMPLATES)

  return (
    <div className="vt-step" style={{ maxWidth: '800px' }}>
      <div className="vt-step-header">
        <h2>Choose Your Voice Style</h2>
        <p>
          Pick a starting point that resonates with you. This pre-fills your style
          preferences — you&apos;ll still add your own writing samples next.
        </p>
      </div>

      <div className="vt-templates-grid">
        {templates.map(template => (
          <button
            key={template.id}
            className={`vt-template-card ${selectedId === template.id ? 'selected' : ''}`}
            onClick={() => setSelectedId(template.id)}
          >
            <div className="vt-template-header">
              <span className="vt-template-icon">{template.icon}</span>
              <div>
                <div className="vt-template-name">{template.name}</div>
                <div className="vt-template-inspiration">Like: {template.inspiration}</div>
              </div>
            </div>
            <div className="vt-template-desc">{template.description}</div>
            <div className="vt-template-preview">&quot;{template.preview}&quot;</div>
          </button>
        ))}
      </div>

      <button
        className="vt-continue-btn"
        onClick={handleSelect}
        disabled={!selectedId}
      >
        {selectedId ? `Start with "${VOICE_TEMPLATES[selectedId]?.name}" style →` : 'Select a Voice Template'}
      </button>

      <div style={{ textAlign: 'center', margin: '24px 0 16px', color: '#6c757d' }}>
        — or —
      </div>

      <button className="vt-secondary-btn" onClick={onStartFullTraining}>
        🎯 Complete Full Voice Training (7 steps, more personalized)
      </button>

      <button
        className="vt-secondary-btn"
        onClick={onBack}
        style={{ marginTop: '8px' }}
      >
        ← Back
      </button>
    </div>
  )
}
