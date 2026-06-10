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
import { isSpeechRecognitionAvailable } from '../../../lib/platform'
import './VoiceRecorder.css'

export default function VoiceRecorder({
  onTranscript,
  existingText = '',
  placeholder = 'Click the microphone to start speaking...',
  disabled = false
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(isSpeechRecognitionAvailable())
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState(null)
  const [textFallback, setTextFallback] = useState('')
  const recognitionRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animationRef = useRef(null)
  const canvasRef = useRef(null)
  const existingTextRef = useRef(existingText)
  const onTranscriptRef = useRef(onTranscript)
  const isRecordingRef = useRef(isRecording)

  // Keep refs in sync without tearing down SpeechRecognition
  useEffect(() => { existingTextRef.current = existingText }, [existingText])
  useEffect(() => { onTranscriptRef.current = onTranscript }, [onTranscript])
  useEffect(() => { isRecordingRef.current = isRecording }, [isRecording])

  useEffect(() => {
    if (!isSpeechRecognitionAvailable()) {
      setIsSupported(false)
      return
    }

    // Initialize speech recognition once
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
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
        // Append to existing text with proper spacing (read from ref for latest value)
        const current = existingTextRef.current
        const separator = current && !current.endsWith(' ') ? ' ' : ''
        const newText = current + separator + finalTranscript
        onTranscriptRef.current(newText.trim())
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
      if (isRecordingRef.current && recognitionRef.current) {
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
  }, [])

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
        // getUserMedia may not be available in WKWebView — silently skip visualization
        console.warn('Audio visualization unavailable:', err.message)
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

  // Text fallback handler for unsupported environments
  const handleTextFallback = (e) => {
    setTextFallback(e.target.value)
    onTranscript(e.target.value)
  }

  if (!isSupported) {
    return (
      <div className="vr-unsupported">
        <p className="vr-unsupported-hint">Voice input is not available on this device. Type your response below.</p>
        <textarea
          className="vr-text-fallback"
          value={textFallback || existingText}
          onChange={handleTextFallback}
          placeholder={placeholder.replace('microphone', 'text box').replace('speaking', 'typing')}
          rows={4}
          disabled={disabled}
        />
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
