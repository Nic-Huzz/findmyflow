import { useState } from 'react'

const DIRECTION_META = {
  north: { label: 'Flow', emoji: '🌊', color: '#10b981' },
  east:  { label: 'Redirect', emoji: '🔄', color: '#3b82f6' },
  south: { label: 'Rest', emoji: '🛏️', color: '#ef4444' },
  west:  { label: 'Honour', emoji: '🙏', color: '#eab308' },
}

function getDirection(internal, external) {
  if (internal === 'excited' && external === 'ease') return 'north'
  if (internal === 'excited' && external === 'resistance') return 'east'
  if (internal === 'tired' && external === 'resistance') return 'south'
  if (internal === 'tired' && external === 'ease') return 'west'
  return null
}

export default function ChallengeRating({ founderName, challengeAction, onRate, onBack }) {
  const [voiceType, setVoiceType] = useState(null) // 'essence' | 'protective'
  const [voiceReflection, setVoiceReflection] = useState('')
  const [internalState, setInternalState] = useState(null) // 'excited' | 'tired'
  const [externalState, setExternalState] = useState(null) // 'ease' | 'resistance'

  const direction = getDirection(internalState, externalState)
  const dirMeta = direction ? DIRECTION_META[direction] : null
  const canSubmit = voiceType && internalState && externalState

  return (
    <div style={{ paddingTop: 16, paddingBottom: 40 }}>
      <div className="pp-fade-in-up" style={{ textAlign: 'center', marginBottom: 8 }}>
        <h2>How did it go?</h2>
        <p className="pp-subtitle">Reflect on {founderName}&apos;s challenge</p>
      </div>

      {/* Show the challenge they completed */}
      {challengeAction && (
        <div className="pp-glass-card pp-fade-in-up pp-stagger-2" style={{ padding: 14, marginBottom: 24 }}>
          <div style={{ fontSize: 13, lineHeight: 1.5 }} className="pp-challenge-content">
            {challengeAction.length > 150 ? challengeAction.slice(0, 150) + '...' : challengeAction}
          </div>
        </div>
      )}

      {/* Q1: Essence or Protective */}
      <div className="pp-rating-section pp-fade-in-up pp-stagger-3">
        <div className="pp-rating-question">Which voice showed up?</div>
        <div className="pp-voice-options">
          <button
            className={`pp-voice-btn pp-voice-essence${voiceType === 'essence' ? ' selected' : ''}`}
            onClick={() => setVoiceType('essence')}
          >
            <span className="pp-voice-emoji">🌟</span>
            <span className="pp-voice-label">Essence</span>
            <span className="pp-voice-desc">My true self showed up</span>
          </button>
          <button
            className={`pp-voice-btn pp-voice-protective${voiceType === 'protective' ? ' selected' : ''}`}
            onClick={() => setVoiceType('protective')}
          >
            <span className="pp-voice-emoji">🛡️</span>
            <span className="pp-voice-label">Protective</span>
            <span className="pp-voice-desc">I felt myself holding back</span>
          </button>
        </div>
        {voiceType && (
          <textarea
            className="pp-textarea"
            placeholder={voiceType === 'essence'
              ? 'How did your essence voice show up?'
              : 'What was your protective voice saying?'}
            value={voiceReflection}
            onChange={(e) => setVoiceReflection(e.target.value)}
            rows={2}
            style={{ marginTop: 10 }}
          />
        )}
      </div>

      {/* Q2: Excited or Tired */}
      <div className="pp-rating-section pp-fade-in-up pp-stagger-4">
        <div className="pp-rating-question">Are you feeling excited or tired?</div>
        <div className="pp-voice-options">
          <button
            className={`pp-voice-btn pp-compass-excited${internalState === 'excited' ? ' selected' : ''}`}
            onClick={() => setInternalState('excited')}
          >
            <span className="pp-voice-emoji">🔥</span>
            <span className="pp-voice-label">Excited</span>
          </button>
          <button
            className={`pp-voice-btn pp-compass-tired${internalState === 'tired' ? ' selected' : ''}`}
            onClick={() => setInternalState('tired')}
          >
            <span className="pp-voice-emoji">😴</span>
            <span className="pp-voice-label">Tired</span>
          </button>
        </div>
      </div>

      {/* Q3: Ease or Resistance */}
      <div className="pp-rating-section pp-fade-in-up pp-stagger-5">
        <div className="pp-rating-question">How is the business flowing?</div>
        <div className="pp-voice-options">
          <button
            className={`pp-voice-btn pp-compass-ease${externalState === 'ease' ? ' selected' : ''}`}
            onClick={() => setExternalState('ease')}
          >
            <span className="pp-voice-emoji">✨</span>
            <span className="pp-voice-label">Great</span>
          </button>
          <button
            className={`pp-voice-btn pp-compass-resistance${externalState === 'resistance' ? ' selected' : ''}`}
            onClick={() => setExternalState('resistance')}
          >
            <span className="pp-voice-emoji">🧗</span>
            <span className="pp-voice-label">Facing Resistance</span>
          </button>
        </div>
      </div>

      {/* Compass direction preview */}
      {dirMeta && (
        <div className="pp-compass-preview pp-fade-in-up" style={{ borderColor: dirMeta.color }}>
          <span style={{ fontSize: 24 }}>{dirMeta.emoji}</span>
          <span className="pp-compass-preview-label" style={{ color: dirMeta.color }}>{dirMeta.label}</span>
        </div>
      )}

      {/* Submit */}
      <div className="pp-fade-in-up pp-stagger-6" style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          className="pp-btn-gold"
          disabled={!canSubmit}
          onClick={() => onRate({
            voice_type: voiceType,
            voice_reflection: voiceReflection.trim() || null,
            internal_state: internalState,
            external_state: externalState,
            compass_direction: direction,
          })}
        >
          Save Rating
        </button>
        {onBack && (
          <button className="pp-btn-ghost" onClick={onBack}>
            Go back
          </button>
        )}
      </div>
    </div>
  )
}
