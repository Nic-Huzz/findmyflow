/**
 * Step 4: Your People (was Step 2: Audience)
 * Captures audience description + learns how they talk about their people
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import VoiceRecorder from './VoiceRecorder'

export default function Step4_Audience({ value, onChange, userId, onContinue }) {
  const [text, setText] = useState(value || '')
  const [inputMode, setInputMode] = useState('type')
  const [suggestion, setSuggestion] = useState('')

  // Try to pre-fill from existing persona data
  useEffect(() => {
    async function loadPersona() {
      if (!userId || value) return
      try {
        const { data } = await supabase
          .from('persona_profiles')
          .select('persona_name, pain_points')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle()

        if (data) {
          const hint = `Based on your Flow Finder: ${data.persona_name || 'your ideal client'}`
          setSuggestion(hint)
        }
      } catch (err) {
        // Silently skip
      }
    }
    loadPersona()
  }, [userId, value])

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
        <h2>Who do you help?</h2>
        <p>
          Describe your ideal audience - their struggles, their dreams,
          the language they use. Talk about them like you would to a friend.
        </p>
        {suggestion && (
          <div className="vt-suggestion">
            <span className="vt-suggestion-icon">✨</span>
            {suggestion}
          </div>
        )}
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
          placeholder="Click the microphone and describe your people..."
        />
      )}

      <textarea
        className="vt-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={inputMode === 'speak'
          ? "Your spoken words will appear here. You can edit them afterwards..."
          : "My people are mid-career professionals who know they're capable of more but feel stuck. They're usually 30-45, they've achieved 'success' on paper but feel empty inside. They're not looking for another hustle - they want meaningful work that lights them up..."
        }
        maxLength={1000}
      />

      <div className="vt-char-count">
        {text.length}/1000 characters (min 50)
      </div>

      <div className="vt-tip">
        <span className="vt-tip-icon">💡</span>
        <div className="vt-tip-content">
          <strong>We&apos;re learning:</strong> How you relate to your audience -
          your empathy style, the words you choose, and whether you position as
          a mentor, peer, or coach.
          {inputMode === 'speak' && (
            <span className="vt-tip-bonus"> Speaking about your people naturally reveals how you connect!</span>
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
