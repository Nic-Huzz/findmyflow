// src/components/Zarlo/ZarloVoiceInput.jsx
// Voice input component for Zarlo

import { useState, useRef, useEffect } from 'react'
import { processVoiceCommand, getVoiceCommandSuggestions } from '../../lib/zarlo/voiceProcessor'
import './ZarloVoiceInput.css'

export default function ZarloVoiceInput({ userId, projectId, onResult, onFallbackChat }) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)

  // Check for browser support — WKWebView on iOS often lacks SpeechRecognition
  const isSupported = typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)

  // If speech recognition isn't available, don't render the voice UI at all
  if (!isSupported) return null

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  function startListening() {
    if (!isSupported) {
      setError('Voice input not supported in this browser. Try Chrome or Safari.')
      return
    }

    setError(null)
    setTranscript('')

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setListening(true)
    }

    recognition.onresult = (event) => {
      const current = event.results[event.results.length - 1]
      setTranscript(current[0].transcript)

      if (current.isFinal) {
        handleFinalTranscript(current[0].transcript)
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setListening(false)

      if (event.error === 'no-speech') {
        setError("Didn't hear anything. Try again?")
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please enable it in settings.')
      } else {
        setError('Voice input failed. Please try again.')
      }
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  function stopListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  async function handleFinalTranscript(text) {
    if (!text.trim()) return

    setProcessing(true)
    setError(null)

    try {
      const result = await processVoiceCommand(text, userId, projectId)

      if (result.action === 'fallback_chat') {
        // Pass to Zarlo chat
        onFallbackChat?.(result.originalText)
      } else {
        onResult?.(result)
      }
    } catch (err) {
      console.error('Voice processing error:', err)
      setError("Something went wrong. Try again?")
      onResult?.({
        success: false,
        message: "I didn't catch that. Try again?"
      })
    } finally {
      setProcessing(false)
      setTranscript('')
    }
  }

  const suggestions = getVoiceCommandSuggestions()

  return (
    <div className="zarlo-voice-input">
      <div className="voice-main">
        <button
          className={`voice-btn ${listening ? 'listening' : ''} ${processing ? 'processing' : ''}`}
          onMouseDown={startListening}
          onMouseUp={stopListening}
          onMouseLeave={stopListening}
          onTouchStart={startListening}
          onTouchEnd={stopListening}
          disabled={processing}
          aria-label={listening ? 'Listening...' : 'Hold to speak'}
        >
          {processing ? (
            <span className="voice-icon processing">...</span>
          ) : listening ? (
            <span className="voice-icon recording">●</span>
          ) : (
            <span className="voice-icon">🎤</span>
          )}
        </button>

        <div className="voice-status">
          {transcript ? (
            <p className="transcript">{transcript}</p>
          ) : listening ? (
            <p className="hint listening">Listening...</p>
          ) : processing ? (
            <p className="hint processing">Processing...</p>
          ) : (
            <p className="hint">Hold to speak</p>
          )}
        </div>

        <button
          className="help-toggle"
          onClick={() => setShowHelp(!showHelp)}
          aria-label="Voice command help"
        >
          ?
        </button>
      </div>

      {error && (
        <p className="voice-error">{error}</p>
      )}

      {showHelp && (
        <div className="voice-help">
          <h4>Voice Commands</h4>
          <ul>
            {suggestions.map((s, i) => (
              <li key={i}>
                <span className="command">{s.command}</span>
                <span className="example">e.g., "{s.example}"</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  )
}
