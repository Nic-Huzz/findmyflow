/**
 * Step 4: Unique Approach / Difference
 * Captures what makes their method different + learns positioning style
 * Includes voice preview showing how their voice is developing
 * Now with voice recording option!
 */
import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import VoiceRecorder from './VoiceRecorder'

export default function Step4_Difference({ value, onChange, onContinue, voiceData }) {
  const [text, setText] = useState(value || '')
  const [inputMode, setInputMode] = useState('type') // 'type' or 'speak'
  const [showPreview, setShowPreview] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState(null)

  const handleContinue = () => {
    onChange(text.trim())
    onContinue()
  }

  const handleVoiceTranscript = (transcript) => {
    setText(transcript)
  }

  const isValid = text.trim().length >= 50

  // Generate a voice preview based on data collected so far (Steps 1-4)
  const handleGeneratePreview = async () => {
    setPreviewLoading(true)
    setPreviewError(null)
    setShowPreview(true)

    try {
      // Build context from Steps 1-4 - this IS their voice, no style options needed
      const previewContext = `
VOICE TRAINING DATA (Steps 1-4):

Origin Story: ${voiceData?.originStory || 'Not provided'}

Target Audience: ${voiceData?.audienceDescription || 'Not provided'}

Success Story: ${voiceData?.successStory || 'Not provided'}

Unique Approach: ${text.trim()}
`

      const response = await supabase.functions.invoke('content-generator', {
        body: {
          action: 'generate',
          contentType: 'educational',
          platform: 'instagram',
          context: { custom: previewContext },
          additionalInstructions: `
Generate a SHORT sample social media post (2-3 sentences max) that sounds like this specific person based on their voice training data above.

IMPORTANT: Analyze their writing style from the data provided:
- How do they structure sentences? (short/punchy vs flowing)
- What's their energy level? (bold/direct vs warm/nurturing)
- Do they use casual language or more professional tone?
- What makes them unique based on their story?

This preview should SOUND LIKE THEM based on what they've shared. Don't impose a style - let their voice emerge from their answers.

Make it feel authentic to THEIR story, audience, and approach. Reference their actual wins/approach.
          `.trim()
        }
      })

      if (response.error) throw response.error

      setPreviewContent(response.data?.content || 'Could not generate preview')
    } catch (err) {
      console.error('Error generating preview:', err)
      setPreviewError('Could not generate preview. Please continue to the next step.')
    } finally {
      setPreviewLoading(false)
    }
  }

  return (
    <div className="vt-step">
      <div className="vt-step-header">
        <h2>What makes you different?</h2>
        <p>
          Everyone in your space does things a certain way. What&apos;s your
          contrarian take? What do you believe that others might disagree with?
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
          placeholder="Click the microphone and share your contrarian take..."
        />
      )}

      <textarea
        className="vt-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={inputMode === 'speak'
          ? "Your spoken words will appear here. You can edit them afterwards..."
          : "Most coaches tell you to hustle harder and grind 24/7. I think that's BS. I believe you can build a 6-figure business working 4 hours a day if you focus on leverage, not just effort. My clients don't burn out - they build sustainable businesses..."
        }
        maxLength={1000}
      />

      <div className="vt-char-count">
        {text.length}/1000 characters (min 50)
      </div>

      <div className="vt-tip">
        <span className="vt-tip-icon">💡</span>
        <div className="vt-tip-content">
          <strong>We&apos;re learning:</strong> How you position yourself, your
          contrarian thinking, confidence level, and how you challenge norms.
          {inputMode === 'speak' && (
            <span className="vt-tip-bonus"> Get passionate - we love hearing what fires you up!</span>
          )}
        </div>
      </div>

      {/* Voice Preview Section */}
      {isValid && !showPreview && (
        <button
          className="vt-preview-btn"
          onClick={handleGeneratePreview}
          disabled={previewLoading}
        >
          <span className="vt-preview-icon">🎙️</span>
          Preview My Voice So Far
        </button>
      )}

      {showPreview && (
        <div className="vt-voice-preview">
          <div className="vt-preview-header">
            <span className="vt-preview-icon">🎙️</span>
            <h3>Your Voice Preview</h3>
          </div>

          {previewLoading ? (
            <div className="vt-preview-loading">
              <div className="vt-spinner"></div>
              <p>Analyzing your voice...</p>
            </div>
          ) : previewError ? (
            <div className="vt-preview-error">
              <p>{previewError}</p>
            </div>
          ) : (
            <>
              <div className="vt-preview-content">
                <p>{previewContent}</p>
              </div>
              <div className="vt-preview-note">
                <span>✨</span>
                <p>This is based on Steps 1-4. Complete the remaining steps for a fully personalized voice!</p>
              </div>
            </>
          )}

          <button
            className="vt-preview-refresh"
            onClick={handleGeneratePreview}
            disabled={previewLoading}
          >
            {previewLoading ? 'Generating...' : '🔄 Try Another Sample'}
          </button>
        </div>
      )}

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
