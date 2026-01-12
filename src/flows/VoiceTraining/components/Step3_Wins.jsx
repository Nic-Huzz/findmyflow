/**
 * Step 3: Success Story / Wins
 * Captures how they tell success stories + learns celebration style
 * Now with voice recording option!
 */
import { useState } from 'react'
import VoiceRecorder from './VoiceRecorder'

export default function Step3_Wins({ value, onChange, onContinue }) {
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
        <h2>Share a quick win</h2>
        <p>
          Tell me about a client success or a moment when you knew your
          work was making a real difference.
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
          placeholder="Click the microphone and share a client win story..."
        />
      )}

      <textarea
        className="vt-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={inputMode === 'speak'
          ? "Your spoken words will appear here. You can edit them afterwards..."
          : "Last month Sarah messaged me crying happy tears. She'd just hit her first $10k month after struggling for 2 years. What got her there wasn't some magic formula - she finally stopped trying to be 'professional' and just showed up as herself..."
        }
        maxLength={1000}
      />

      <div className="vt-char-count">
        {text.length}/1000 characters (min 50)
      </div>

      <div className="vt-tip">
        <span className="vt-tip-icon">💡</span>
        <div className="vt-tip-content">
          <strong>We&apos;re learning:</strong> How you celebrate wins, share credit,
          use specific details vs. big picture, and your enthusiasm expression.
          {inputMode === 'speak' && (
            <span className="vt-tip-bonus"> Speak naturally - your excitement tells us a lot!</span>
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
