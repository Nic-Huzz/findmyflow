/**
 * Step 1: Origin Story
 * Captures their background story + learns storytelling style
 * Now with voice recording option!
 */
import { useState } from 'react'
import VoiceRecorder from './VoiceRecorder'

export default function Step1_Origin({ value, onChange, onContinue }) {
  const [text, setText] = useState(value || '')
  const [inputMode, setInputMode] = useState('type') // 'type' or 'speak'

  const handleContinue = () => {
    onChange(text.trim())
    onContinue()
  }

  const handleVoiceTranscript = (transcript) => {
    setText(transcript)
  }

  const isValid = text.trim().length >= 50

  return (
    <div className="vt-step">
      <div className="vt-step-header">
        <h2>Tell me your origin story</h2>
        <p>
          In 2-3 sentences, how did you end up doing what you do?
          What&apos;s the journey that led you here?
        </p>
      </div>

      {/* Input Mode Toggle */}
      <div className="vt-input-toggle">
        <button
          className={`vt-toggle-btn ${inputMode === 'type' ? 'active' : ''}`}
          onClick={() => setInputMode('type')}
        >
          ⌨️ Type
        </button>
        <button
          className={`vt-toggle-btn ${inputMode === 'speak' ? 'active' : ''}`}
          onClick={() => setInputMode('speak')}
        >
          🎤 Speak
        </button>
      </div>

      {/* Voice Recorder */}
      {inputMode === 'speak' && (
        <VoiceRecorder
          onTranscript={handleVoiceTranscript}
          existingText={text}
          placeholder="Click the microphone and tell your story naturally..."
        />
      )}

      {/* Text Area (always visible so user can edit voice input) */}
      <textarea
        className="vt-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={inputMode === 'speak'
          ? "Your spoken words will appear here. You can edit them afterwards..."
          : "I was a burnt-out corporate lawyer who realized I was building someone else's dream. One day I just couldn't do it anymore. I quit, started helping others make the leap, and now..."
        }
        maxLength={1000}
      />

      <div className="vt-char-count">
        {text.length}/1000 characters (min 50)
      </div>

      <div className="vt-tip">
        <span className="vt-tip-icon">💡</span>
        <div className="vt-tip-content">
          <strong>We&apos;re learning:</strong> Your storytelling style, emotional depth,
          how you structure narratives, and your vocabulary when talking about yourself.
          {inputMode === 'speak' && (
            <span className="vt-tip-bonus"> Speaking naturally helps us capture your authentic voice!</span>
          )}
        </div>
      </div>

      <button
        className="vt-continue-btn"
        onClick={handleContinue}
        disabled={!isValid}
      >
        Continue →
      </button>
    </div>
  )
}
