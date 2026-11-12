/**
 * ExperienceGameLive — One-at-a-time voice experience game.
 *
 * Shows a single activity on screen. User says "fun" or "not fun".
 * Short audio clip → transcribe → classify → advance to next.
 * After all activities: returns { fun, notFun, uncertain } arrays.
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { transcribeAudio } from '../lib/deepgramClient'

const SILENCE_TIMEOUT_MS = 5000 // show skip hint after 5s
const MAX_UTTERANCE_MS = 5000 // max recording per activity

function classifyResponse(transcript) {
  const t = (transcript || '').toLowerCase().trim()
  if (!t) return 'uncertain'
  // Check for "not" before "fun"
  const notIdx = t.lastIndexOf('not')
  const funIdx = t.lastIndexOf('fun')
  if (funIdx >= 0 && notIdx >= 0 && notIdx < funIdx) return 'not_fun'
  if (funIdx >= 0) return 'fun'
  // Alternative words
  if (/\b(no|nah|nope|nuh|hate|boring|meh)\b/.test(t)) return 'not_fun'
  if (/\b(yes|yeah|yep|yay|love|hell yeah)\b/.test(t)) return 'fun'
  return 'uncertain'
}

export default function ExperienceGameLive({ activities, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [responses, setResponses] = useState([]) // { id, label, response, branch }
  const [flash, setFlash] = useState(null) // 'fun' | 'not_fun' | null
  const [transcribing, setTranscribing] = useState(false)
  const [showSkip, setShowSkip] = useState(false)
  const [error, setError] = useState(null)

  const skipTimerRef = useRef(null)
  const maxTimerRef = useRef(null)
  const processingRef = useRef(false)
  const responsesRef = useRef([])
  const currentIndexRef = useRef(0)

  const activity = activities[currentIndex]
  const isFinished = currentIndex >= activities.length

  // Keep ref in sync with state to avoid stale closures in async callbacks
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])

  const handleSilenceStop = useCallback(() => {
    // Silence detected — audio blob will be set via the hook
  }, [])

  const { start, stop, isRecording, audioBlob, permissionGranted, requestPermission } = useAudioRecorder({
    onSilenceStop: handleSilenceStop,
  })

  // Start recording for current activity
  const startListening = useCallback(() => {
    if (isFinished) return
    setFlash(null)
    setShowSkip(false)
    setError(null)
    setTranscribing(false)
    // processingRef is reset in handleResultForIndex after advance, not here

    start()

    // Show skip hint after timeout
    skipTimerRef.current = setTimeout(() => setShowSkip(true), SILENCE_TIMEOUT_MS)
    // Max recording safety
    maxTimerRef.current = setTimeout(() => {
      stop()
    }, MAX_UTTERANCE_MS)
  }, [start, stop, isFinished])

  // When recording starts for first time or advances
  useEffect(() => {
    if (permissionGranted && !isFinished && !isRecording && !transcribing && flash === null) {
      // Small delay for visual breathing room
      const t = setTimeout(startListening, currentIndex === 0 ? 100 : 600)
      return () => clearTimeout(t)
    }
  }, [currentIndex, permissionGranted, isFinished, isRecording, transcribing, flash, startListening])

  // Process audio when blob is ready
  useEffect(() => {
    if (!audioBlob || processingRef.current || isFinished) return
    processingRef.current = true

    // Capture index at moment of processing — prevents stale closure
    const capturedIndex = currentIndexRef.current

    if (skipTimerRef.current) clearTimeout(skipTimerRef.current)
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current)

    setTranscribing(true)
    setShowSkip(false)

    transcribeAudio(audioBlob)
      .then(({ transcript }) => {
        const result = classifyResponse(transcript)
        handleResultForIndex(result, capturedIndex)
      })
      .catch(() => {
        handleResultForIndex('uncertain', capturedIndex)
      })
  }, [audioBlob]) // eslint-disable-line react-hooks/exhaustive-deps

  const handledRef = useRef(new Set())

  const handleResultForIndex = (result, idx) => {
    const act = activities[idx]
    if (!act) return

    // Ignore if already handled (prevents double-call from skip + transcription)
    if (handledRef.current.has(idx)) return
    handledRef.current.add(idx)

    // Ignore if we've already moved past this index (late-arriving transcription)
    if (idx !== currentIndexRef.current) return

    // Always set a visible flash — 'uncertain' shows as dim skip
    const flashType = result === 'not_fun' ? 'not_fun' : result === 'fun' ? 'fun' : 'skip'
    setFlash(flashType)
    setTranscribing(false)

    const entry = { id: act.id, label: act.label, response: result, branch: act.branch }
    const updated = [...responsesRef.current, entry]
    responsesRef.current = updated
    setResponses(updated)

    // Advance after flash
    setTimeout(() => {
      processingRef.current = false
      const nextIdx = idx + 1
      if (nextIdx >= activities.length) {
        finishGame(updated)
      } else {
        setCurrentIndex(nextIdx)
        setFlash(null)
      }
    }, 500)
  }

  const handleSkip = () => {
    stop()
    if (skipTimerRef.current) clearTimeout(skipTimerRef.current)
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current)
    handleResultForIndex('uncertain', currentIndexRef.current)
  }

  const finishGame = (allResponses) => {
    const fun = allResponses.filter(r => r.response === 'fun').map(({ id, label, branch }) => ({ id, label, branch }))
    const notFun = allResponses.filter(r => r.response === 'not_fun').map(({ id, label, branch }) => ({ id, label, branch }))
    const uncertain = allResponses.filter(r => r.response === 'uncertain').map(({ id, label, branch }) => ({ id, label, branch }))
    onComplete({ fun, notFun, uncertain })
  }

  // Request permission on mount if needed
  useEffect(() => {
    if (!permissionGranted) requestPermission()
  }, [permissionGranted, requestPermission])

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current)
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current)
    }
  }, [])

  if (!permissionGranted) {
    return (
      <div className="vs-exp-live">
        <p style={{ color: 'var(--vs-muted)' }}>Requesting microphone access...</p>
      </div>
    )
  }

  if (isFinished) {
    return (
      <div className="vs-exp-live">
        <div className="vs-exp-live-processing">Mapping your experiences...</div>
      </div>
    )
  }

  return (
    <div className="vs-exp-live">
      {/* Progress */}
      <div className="vs-exp-live-progress">
        <span className="vs-exp-live-count">{currentIndex + 1} / {activities.length}</span>
        <div className="vs-exp-live-bar">
          <div
            className="vs-exp-live-bar-fill"
            style={{ width: `${((currentIndex) / activities.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Activity card */}
      <div className={`vs-exp-live-card ${flash === 'fun' ? 'vs-flash-fun' : (flash === 'not_fun' || flash === 'skip') ? 'vs-flash-notfun' : ''}`} key={currentIndex}>
        <h2 className="vs-exp-live-label">{activity.label}</h2>
      </div>

      {/* Recording indicator */}
      <div className="vs-exp-live-mic">
        {transcribing ? (
          <div className="vs-exp-live-status">Listening...</div>
        ) : isRecording ? (
          <>
            <div className="vs-exp-live-dot" />
            <div className="vs-exp-live-status">Say &quot;fun&quot; or &quot;not fun&quot;</div>
          </>
        ) : flash ? (
          <div className="vs-exp-live-status vs-exp-live-response">
            {flash === 'fun' ? 'Fun!' : flash === 'not_fun' ? 'Not fun' : 'Skipped'}
          </div>
        ) : null}
      </div>

      {/* Skip hint */}
      {showSkip && (
        <button className="vs-exp-live-skip" onClick={handleSkip}>
          Tap to skip
        </button>
      )}

      {error && <div className="vs-error-msg">{error}</div>}
    </div>
  )
}
