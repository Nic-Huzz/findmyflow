/**
 * VoiceRecorder Component
 * Records audio and provides real-time transcription using Web Speech API
 *
 * Features:
 * - Real-time speech-to-text transcription
 * - Visual recording indicator
 * - Append mode (adds to existing text)
 * - Fallback message if speech recognition unavailable
 */
import { useState, useRef, useEffect } from 'react'
import './VoiceRecorder.css'

// Check if speech recognition is available
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export default function VoiceRecorder({
  onTranscript,
  existingText = '',
  placeholder = 'Click the microphone to start speaking...',
  disabled = false
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interim += transcript
        }
      }

      setInterimTranscript(interim)

      if (finalTranscript) {
        // Append to existing text with proper spacing
        const separator = existingText && !existingText.endsWith(' ') ? ' ' : ''
        const newText = existingText + separator + finalTranscript
        onTranscript(newText.trim())
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.')
      } else if (event.error === 'no-speech') {
        // This is normal, just means silence detected
        setError(null)
      } else {
        setError(`Error: ${event.error}`)
      }
      setIsRecording(false)
    }

    recognition.onend = () => {
      // Auto-restart if still supposed to be recording
      if (isRecording && recognitionRef.current) {
        try {
          recognition.start()
        } catch (e) {
          // Already started, ignore
        }
      }
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [existingText, onTranscript, isRecording])

  // Audio visualization
  useEffect(() => {
    if (!isRecording || !canvasRef.current) return

    const startVisualization = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
        analyserRef.current = audioContextRef.current.createAnalyser()
        const source = audioContextRef.current.createMediaStreamSource(stream)
        source.connect(analyserRef.current)
        analyserRef.current.fftSize = 256

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const draw = () => {
          if (!isRecording) return
          animationRef.current = requestAnimationFrame(draw)

          analyserRef.current.getByteFrequencyData(dataArray)

          ctx.fillStyle = 'rgba(30, 30, 30, 0.2)'
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          const barWidth = (canvas.width / bufferLength) * 2.5
          let x = 0

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height * 0.8

            // Gradient from teal to cyan
            const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height)
            gradient.addColorStop(0, '#00d4aa')
            gradient.addColorStop(1, '#00a8cc')
            ctx.fillStyle = gradient

            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
            x += barWidth + 1
          }
        }

        draw()
      } catch (err) {
        console.error('Error starting visualization:', err)
      }
    }

    startVisualization()

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRecording])

  const startRecording = () => {
    if (!recognitionRef.current || disabled) return
    setError(null)
    setInterimTranscript('')
    setIsRecording(true)
    try {
      recognitionRef.current.start()
    } catch (e) {
      console.error('Error starting recognition:', e)
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
    setInterimTranscript('')
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  if (!isSupported) {
    return (
      <div className="vr-unsupported">
        <span className="vr-unsupported-icon">🎤</span>
        <p>Voice recording is not supported in your browser.</p>
        <p className="vr-unsupported-hint">Try using Chrome, Edge, or Safari for voice input.</p>
      </div>
    )
  }

  return (
    <div className={`voice-recorder ${isRecording ? 'recording' : ''} ${disabled ? 'disabled' : ''}`}>
      <div className="vr-controls">
        <button
          type="button"
          className={`vr-record-btn ${isRecording ? 'active' : ''}`}
          onClick={toggleRecording}
          disabled={disabled}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        >
          <span className="vr-mic-icon">{isRecording ? '⏹️' : '🎤'}</span>
          <span className="vr-btn-label">
            {isRecording ? 'Stop' : 'Speak'}
          </span>
        </button>

        {isRecording && (
          <div className="vr-recording-indicator">
            <span className="vr-pulse"></span>
            <span className="vr-recording-text">Listening...</span>
          </div>
        )}
      </div>

      {/* Audio visualization canvas */}
      {isRecording && (
        <canvas
          ref={canvasRef}
          className="vr-visualizer"
          width={300}
          height={60}
        />
      )}

      {/* Show interim (in-progress) transcript */}
      {interimTranscript && (
        <div className="vr-interim">
          <span className="vr-interim-label">Hearing:</span>
          <span className="vr-interim-text">{interimTranscript}</span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="vr-error">
          <span className="vr-error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Helpful hint */}
      {!isRecording && !error && (
        <p className="vr-hint">{placeholder}</p>
      )}
    </div>
  )
}
