/**
 * useAudioRecorder — Cross-browser audio recording with silence detection.
 *
 * Handles:
 * - MIME type detection (WebM/Opus for Chrome/Firefox, MP4/AAC for Safari)
 * - Silence detection via Web Audio API AnalyserNode
 * - Safari ondataavailable quirks
 * - WKWebView detection (in-app browsers)
 */
import { useState, useRef, useCallback, useEffect } from 'react'

const SILENCE_THRESHOLD = 0.01 // RMS below this = silence
const SILENCE_DURATION_MS = 5000 // auto-stop after 5s of silence
const MAX_RECORDING_MS = 30000 // 30 second max per stem

function getSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined') return null
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/mp4;codecs=aac',
    'audio/mp4',
    '',
  ]
  return candidates.find(t => t === '' || MediaRecorder.isTypeSupported(t)) ?? null
}

function isInAppBrowser() {
  const ua = navigator.userAgent || ''
  return /FBAN|FBAV|Instagram|Messenger|Line|Snapchat/i.test(ua)
}

export function useAudioRecorder({ onSilenceStop } = {}) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [error, setError] = useState(null)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [silenceDetected, setSilenceDetected] = useState(false)
  const [isInApp, setIsInApp] = useState(false)

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const silenceTimerRef = useRef(null)
  const hasSpokenRef = useRef(false)
  const animFrameRef = useRef(null)
  const maxTimerRef = useRef(null)
  const mimeTypeRef = useRef(null)
  const stoppedRef = useRef(false)

  // Keep onSilenceStop ref current so the rAF loop always calls the latest version
  const onSilenceStopRef = useRef(onSilenceStop)
  useEffect(() => { onSilenceStopRef.current = onSilenceStop }, [onSilenceStop])

  useEffect(() => {
    setIsInApp(isInAppBrowser())
    mimeTypeRef.current = getSupportedMimeType()
  }, [])

  const requestPermission = useCallback(async () => {
    if (mimeTypeRef.current === null) {
      setError('Your browser does not support audio recording. Please use Safari or Chrome.')
      return false
    }
    if (isInApp) {
      setError('Please open this link in Safari or Chrome, not an in-app browser.')
      return false
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop the stream immediately — we just needed permission
      stream.getTracks().forEach(t => t.stop())
      setPermissionGranted(true)
      setError(null)
      return true
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone access was denied. Please allow microphone access to continue.')
      } else {
        setError('Could not access your microphone. Please check your browser settings.')
      }
      return false
    }
  }, [isInApp])

  const start = useCallback(async () => {
    setAudioBlob(null)
    setSilenceDetected(false)
    setError(null)
    chunksRef.current = []
    hasSpokenRef.current = false
    stoppedRef.current = false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up silence detection via Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const dataArray = new Float32Array(analyser.fftSize)
      let silenceStart = null

      const checkSilence = () => {
        if (!analyserRef.current || stoppedRef.current) return
        analyserRef.current.getFloatTimeDomainData(dataArray)
        const rms = Math.sqrt(dataArray.reduce((sum, v) => sum + v * v, 0) / dataArray.length)

        if (rms > SILENCE_THRESHOLD) {
          hasSpokenRef.current = true
          silenceStart = null
        } else if (hasSpokenRef.current) {
          if (!silenceStart) silenceStart = Date.now()
          else if (Date.now() - silenceStart > SILENCE_DURATION_MS) {
            setSilenceDetected(true)
            stoppedRef.current = true
            stop()
            if (onSilenceStopRef.current) onSilenceStopRef.current()
            return
          }
        }

        animFrameRef.current = requestAnimationFrame(checkSilence)
      }
      animFrameRef.current = requestAnimationFrame(checkSilence)

      // Set up MediaRecorder
      const mimeType = mimeTypeRef.current
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          // Guard against Safari huge-chunk bug: cap at 5MB
          if (e.data.size < 5 * 1024 * 1024) {
            chunksRef.current.push(e.data)
          }
        }
      }

      recorder.onstop = () => {
        const mType = mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: mType })
        setAudioBlob(blob)
        setIsRecording(false)

        // Cleanup
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {})
          audioContextRef.current = null
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop())
          streamRef.current = null
        }
        if (maxTimerRef.current) {
          clearTimeout(maxTimerRef.current)
          maxTimerRef.current = null
        }
      }

      recorder.start(1000) // collect chunks every 1s
      setIsRecording(true)

      // Max recording timer
      maxTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stop()
        }
      }, MAX_RECORDING_MS)
    } catch (err) {
      setError('Could not start recording. Please check your microphone.')
      console.warn('Recording start error:', err)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // stop uses refs not state; onSilenceStop via ref

  const stop = useCallback(() => {
    stoppedRef.current = true
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    const recorder = mediaRecorderRef
    const anim = animFrameRef
    const ctx = audioContextRef
    const stream = streamRef
    const maxT = maxTimerRef
    const silT = silenceTimerRef
    return () => {
      if (recorder.current?.state === 'recording') recorder.current.stop()
      if (anim.current) cancelAnimationFrame(anim.current)
      if (ctx.current) ctx.current.close().catch(() => {})
      if (stream.current) stream.current.getTracks().forEach(t => t.stop())
      if (maxT.current) clearTimeout(maxT.current)
      if (silT.current) clearTimeout(silT.current)
    }
  }, [])

  return {
    start,
    stop,
    isRecording,
    audioBlob,
    error,
    permissionGranted,
    requestPermission,
    silenceDetected,
    isInApp,
    mimeType: mimeTypeRef.current,
  }
}
