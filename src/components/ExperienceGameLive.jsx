/**
 * ExperienceGameLive — Voice-driven experience game with tap fallback.
 *
 * Architecture: single async for-loop inside a useEffect.
 *   open mic → for each activity: show → listen OR tap → flash → next
 *
 * Mic opens once. Each activity shows instantly (zero lag).
 * Records 1.5s clips, pipelines recording + transcription, advances when classified.
 * Tap buttons always visible as fallback. Back button to re-answer previous.
 * Per-run cancellation token — StrictMode safe, no shared refs.
 */
import { useState, useEffect, useRef } from 'react'
import { transcribeAudio } from '../lib/deepgramClient'

const CLIP_MS = 1500
const MAX_LISTEN_MS = 12000
const FLASH_MS = 200

function classifyResponse(transcript) {
  const t = (transcript || '').toLowerCase().trim()
  if (!t) return 'uncertain'
  const notIdx = Math.max(t.lastIndexOf('not'), t.lastIndexOf('nah'), t.lastIndexOf('no '))
  const funIdx = Math.max(t.lastIndexOf('fun'), t.lastIndexOf('phone'), t.lastIndexOf('done'), t.lastIndexOf('one'))
  if (funIdx >= 0 && notIdx >= 0 && notIdx < funIdx) return 'not_fun'
  if (/\b(fun|phone|phon|fon|done|one|run)\b/.test(t) && notIdx < 0) return 'fun'
  if (/\b(no|nah|nope|nuh|hate|boring|meh|not)\b/.test(t)) return 'not_fun'
  if (/\b(yes|yeah|yep|yay|love|hell yeah)\b/.test(t)) return 'fun'
  return 'uncertain'
}

function getMimeType() {
  if (typeof MediaRecorder === 'undefined') return ''
  for (const t of ['audio/webm;codecs=opus', 'audio/mp4;codecs=aac', 'audio/mp4', '']) {
    if (t === '' || MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

function recordClip(stream, ms) {
  return new Promise((resolve) => {
    try {
      const mime = getMimeType()
      const chunks = []
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : {})
      rec.ondataavailable = (e) => { if (e.data?.size > 0) chunks.push(e.data) }
      rec.onerror = () => resolve(new Blob([], { type: mime || 'audio/webm' }))
      rec.onstop = () => resolve(new Blob(chunks, { type: mime || 'audio/webm' }))
      rec.start(200)
      setTimeout(() => { if (rec.state === 'recording') rec.stop() }, ms)
    } catch {
      resolve(new Blob([], { type: 'audio/webm' }))
    }
  })
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

/**
 * @param {string} mode - 'fun' (default) or 'paid'
 */
export default function ExperienceGameLive({ activities, onComplete, mode = 'fun' }) {
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [flash, setFlash] = useState(null)
  const [phase, setPhase] = useState('init')
  const [micError, setMicError] = useState(null)
  const [retrying, setRetrying] = useState(false)

  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Action ref: buttons resolve the pending recording promise
  // Queued action: if no promise is waiting, store for next loop iteration
  const actionRef = useRef(null)
  const queuedActionRef = useRef(null)

  const emitAction = (action) => {
    if (actionRef.current) {
      actionRef.current(action)
      actionRef.current = null
    } else {
      queuedActionRef.current = action
    }
  }

  useEffect(() => {
    const token = { cancelled: false }

    async function run() {
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch {
        setMicError('Microphone access denied. Please allow microphone access and refresh.')
        return
      }

      if (token.cancelled) { stream.getTracks().forEach(t => t.stop()); return }

      const results = []
      const maxAttempts = Math.ceil(MAX_LISTEN_MS / CLIP_MS)

      for (let i = 0; i < activities.length; i++) {
        if (token.cancelled) break

        setCurrentIndex(i)
        setFlash(null)
        setRetrying(false)
        setPhase('listening')

        let result = 'uncertain'
        let goBack = false

        // Check if user tapped while previous activity was flashing
        const queued = queuedActionRef.current
        queuedActionRef.current = null
        if (queued === 'back') { goBack = true }
        else if (queued === 'skip') { /* result stays uncertain */ }
        else if (queued?.tap) { result = queued.tap }

        // Only record if no queued action resolved it
        if (!goBack && result === 'uncertain' && queued !== 'skip') {
          let clipResult = await Promise.race([
            recordClip(stream, CLIP_MS).then(blob => ({ blob })),
            new Promise(resolve => { actionRef.current = resolve }),
          ])

          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (token.cancelled) break

            // Check queued action (tapped during transcription)
            if (queuedActionRef.current) {
              clipResult = queuedActionRef.current
              queuedActionRef.current = null
            }

            if (clipResult === 'back') { goBack = true; break }
            if (clipResult === 'skip') { result = 'uncertain'; break }
            if (clipResult?.tap) { result = clipResult.tap; break }

            const { blob } = clipResult

            // Pipeline: record next while transcribing current
            const nextClipPromise = (attempt < maxAttempts - 1)
              ? Promise.race([
                  recordClip(stream, CLIP_MS).then(b => ({ blob: b })),
                  new Promise(resolve => { actionRef.current = resolve }),
                ])
              : null

            try {
              const { transcript } = await transcribeAudio(blob)
              const classified = classifyResponse(transcript)
              console.log(`[exp-game] ${i + 1}/${activities.length} "${activities[i].label}" attempt ${attempt + 1}: "${transcript}" → ${classified}`)
              if (classified !== 'uncertain') {
                result = classified
                break
              }
            } catch (err) {
              console.warn('[exp-game] Transcription error:', err)
            }

            actionRef.current = null
            if (attempt >= 1) setRetrying(true)

            if (!nextClipPromise) break
            clipResult = await nextClipPromise
          }
        }

        if (token.cancelled) break

        // Back: pop last result, rewind
        if (goBack) {
          if (results.length > 0) results.pop()
          i = Math.max(-1, i - 2) // i++ will make it i-1
          actionRef.current = null
          continue
        }

        // Flash result
        actionRef.current = null
        setRetrying(false)
        const flashType = result === 'fun' ? 'fun' : result === 'not_fun' ? 'not_fun' : 'skip'
        setFlash(flashType)
        setPhase('flash')
        results.push({ id: activities[i].id, label: activities[i].label, response: result, branch: activities[i].branch })

        await sleep(FLASH_MS)
      }

      stream.getTracks().forEach(t => t.stop())
      if (token.cancelled) return

      setPhase('done')
      const fun = results.filter(r => r.response === 'fun').map(({ id, label, branch }) => ({ id, label, branch }))
      const notFun = results.filter(r => r.response === 'not_fun').map(({ id, label, branch }) => ({ id, label, branch }))
      const uncertain = results.filter(r => r.response === 'uncertain').map(({ id, label, branch }) => ({ id, label, branch }))
      onCompleteRef.current({ fun, notFun, uncertain })
    }

    run()
    return () => {
      token.cancelled = true
      if (actionRef.current) { actionRef.current('skip'); actionRef.current = null }
    }
  }, [activities])

  // ── Render ──────────────────────────────────────────────────────

  if (micError) {
    return (
      <div className="vs-exp-live">
        <div className="vs-error-msg">{micError}</div>
      </div>
    )
  }

  if (phase === 'init') {
    return (
      <div className="vs-exp-live">
        <p style={{ color: 'var(--vs-muted)' }}>Starting microphone...</p>
      </div>
    )
  }

  if (phase === 'done' || currentIndex < 0 || currentIndex >= activities.length) {
    return (
      <div className="vs-exp-live">
        <div className="vs-exp-live-processing">
          {mode === 'paid' ? 'Finding your paths...' : 'Mapping your experiences...'}
        </div>
      </div>
    )
  }

  const activity = activities[currentIndex]
  const posLabel = mode === 'paid' ? 'Yes' : 'Fun'
  const negLabel = mode === 'paid' ? 'No' : 'Not fun'

  return (
    <div className="vs-exp-live">
      <div className="vs-exp-live-progress">
        <span className="vs-exp-live-count">{currentIndex + 1} / {activities.length}</span>
        <div className="vs-exp-live-bar">
          <div
            className="vs-exp-live-bar-fill"
            style={{ width: `${(currentIndex / activities.length) * 100}%` }}
          />
        </div>
      </div>

      <div className={`vs-exp-live-card ${flash === 'fun' ? 'vs-flash-fun' : flash === 'not_fun' || flash === 'skip' ? 'vs-flash-notfun' : ''}`} key={currentIndex}>
        <h2 className="vs-exp-live-label">{activity.label}</h2>
      </div>

      <div className="vs-exp-live-mic">
        {phase === 'listening' && (
          <>
            <div className="vs-exp-live-dot" />
            {retrying ? (
              <div className="vs-exp-live-status" style={{ opacity: 0.7 }}>
                Didn&apos;t catch that. Tap or say it louder.
              </div>
            ) : (
              <div className="vs-exp-live-status">
                {mode === 'paid' ? 'Would you want to get paid for this?' : 'Say or tap'}
              </div>
            )}

            {/* Tap buttons — always visible */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => emitAction({ tap: 'fun' })}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {posLabel}
              </button>
              {mode !== 'paid' && (
                <button
                  onClick={() => emitAction('skip')}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Not tried
                </button>
              )}
              <button
                onClick={() => emitAction({ tap: 'not_fun' })}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {negLabel}
              </button>
            </div>

            {/* Back button */}
            {currentIndex > 0 && (
              <button
                onClick={() => emitAction('back')}
                style={{
                  marginTop: 16,
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.35)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  padding: '4px 12px',
                }}
              >
                ← Back
              </button>
            )}
          </>
        )}
        {phase === 'flash' && flash && (
          <div className="vs-exp-live-status vs-exp-live-response">
            {mode === 'paid'
              ? (flash === 'fun' ? 'Path!' : flash === 'not_fun' ? 'Hobby' : 'Skipped')
              : (flash === 'fun' ? 'Fun!' : flash === 'not_fun' ? 'Not fun' : 'Skipped')
            }
          </div>
        )}
      </div>
    </div>
  )
}
