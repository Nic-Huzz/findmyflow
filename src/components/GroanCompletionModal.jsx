import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { hapticLight } from '../lib/haptics'
import confetti from 'canvas-confetti'
import { saveChallengeCompletion } from '../lib/challengeCompletionService'
import './GroanCompletionModal.css'

export default function GroanCompletionModal({ challenge, userId, onComplete, onClose }) {
  const savedRef = useRef(false)
  const advanceTimer = useRef(null)

  // Hide bottom toolbar while modal is open
  useEffect(() => {
    document.body.classList.add('modal-active')
    return () => document.body.classList.remove('modal-active')
  }, [])

  // Cleanup advance timer on unmount
  useEffect(() => () => clearTimeout(advanceTimer.current), [])

  // If closed after save happened, still refresh the UI
  const handleClose = useCallback(() => {
    if (savedRef.current) onComplete?.({ dimensionValues: challenge?.dimension_values, wahooClassification, afterState, rpAwarded: null })
    onClose()
  }, [onComplete, onClose, challenge, wahooClassification, afterState])

  const [screen, setScreen] = useState(1) // 1=wahoo, 2=aftertaste, 3=voice
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Core state kept for save
  const [wahooClassification, setWahooClassification] = useState(null)
  const [afterState, setAfterState] = useState(null)
  const [aftertaste, setAftertaste] = useState(null)
  const [gapVoice, setGapVoice] = useState(null)

  // Quest linking (needed by saveChallengeCompletion for behavioral evidence)
  const [sourceQuestId, setSourceQuestId] = useState(null)
  useEffect(() => {
    if (!userId || !challenge?.id) return
    supabase.from('quest_tasks').select('quest_id')
      .eq('groan_challenge_id', challenge.id).eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => { if (data?.quest_id) setSourceQuestId(data.quest_id) })
  }, [userId, challenge?.id])

  function advanceTo(next) {
    clearTimeout(advanceTimer.current)
    advanceTimer.current = setTimeout(() => setScreen(next), 300)
  }

  const handleSave = async (selectedVoice) => {
    if (savedRef.current || saving) return
    setSaving(true)
    setError(null)
    try {
      const { rpAwarded } = await saveChallengeCompletion({
        userId, challenge, wahooClassification, afterState, aftertaste,
        voice: selectedVoice, sourceQuestId,
      })

      // Confetti
      if (wahooClassification === 'vibe') {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#E9A23B', '#f5c55a', '#fbbf24'] })
        setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors: ['#E9A23B', '#f5c55a'] }), 300)
      } else if (wahooClassification === 'peace') {
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 }, colors: ['#5e17eb', '#8b5cf6', '#c4b5fd'] })
      }

      savedRef.current = true
      onComplete?.({
        dimensionValues: challenge.dimension_values,
        wahooClassification,
        afterState,
        rpAwarded,
      })
    } catch (err) {
      console.error('Save error:', err)
      setError('Something went wrong. Try again.')
      setSaving(false)
    }
  }

  // Guard: if challenge is already completed, show message
  if (challenge?.status === 'completed') {
    return (
      <div className="gcm-overlay" onClick={onClose}>
        <div className="gcm-modal" onClick={(e) => e.stopPropagation()}>
          <button className="gcm-close" onClick={onClose}>&times;</button>
          <h2 className="gcm-title">Already Completed</h2>
          <p className="gcm-subtitle">This challenge has already been completed.</p>
          <button className="gcm-gold-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    )
  }

  const voices = [
    { id: 'ghost', icon: '👻', label: 'Ghost' },
    { id: 'perfectionist', icon: '🎯', label: 'Perfectionist' },
    { id: 'people_pleaser', icon: '🪞', label: 'People Pleaser' },
    { id: 'controller', icon: '🎮', label: 'Controller' },
    { id: 'auto_pilot', icon: '🛋️', label: 'Auto-Pilot' },
  ]

  return (
    <div className="gcm-overlay" onClick={handleClose}>
      <div className="gcm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="gcm-close" onClick={handleClose}>&times;</button>

        {/* Screen 1: How did it feel? */}
        {screen === 1 && (
          <>
            <h2 className="gcm-title">I Did It!</h2>
            <p className="gcm-subtitle">{challenge.title || challenge.source_label}</p>
            <h3 className="gcm-question">How did it feel?</h3>
            <div className="gcm-wahoo-options">
              <button
                className={`gcm-wahoo-btn gcm-wahoo-hell-yes ${wahooClassification === 'vibe' ? 'selected' : ''}`}
                onClick={() => { hapticLight(); setWahooClassification('vibe'); setAfterState('vibe_rise'); advanceTo(2) }}
              >
                <span className="gcm-wahoo-emoji"><FireIcon style={{ width: 20, height: 20 }} /></span>
                <span className="gcm-wahoo-label">Vibe Rise</span>
              </button>
              <button
                className={`gcm-wahoo-btn gcm-wahoo-alive ${wahooClassification === 'peace' ? 'selected' : ''}`}
                onClick={() => { hapticLight(); setWahooClassification('peace'); setAfterState('ventral'); advanceTo(2) }}
              >
                <span className="gcm-wahoo-emoji"><FaceSmileIcon style={{ width: 20, height: 20 }} /></span>
                <span className="gcm-wahoo-label">Fun</span>
              </button>
              <button
                className={`gcm-wahoo-btn ${wahooClassification === 'anxious' ? 'selected' : ''}`}
                onClick={() => { hapticLight(); setWahooClassification('anxious'); setAfterState('sympathetic'); advanceTo(2) }}
                style={wahooClassification === 'anxious' ? { borderColor: '#ef4444', background: 'rgba(239,68,68,0.06)', color: '#ef4444' } : undefined}
              >
                <span className="gcm-wahoo-emoji"><ExclamationTriangleIcon style={{ width: 20, height: 20 }} /></span>
                <span className="gcm-wahoo-label">Stressful</span>
              </button>
              <button
                className={`gcm-wahoo-btn ${wahooClassification === 'shutdown' ? 'selected' : ''}`}
                onClick={() => { hapticLight(); setWahooClassification('shutdown'); setAfterState('dorsal'); advanceTo(2) }}
                style={wahooClassification === 'shutdown' ? { borderColor: '#6b7280', background: 'rgba(107,114,128,0.06)', color: '#6b7280' } : undefined}
              >
                <span className="gcm-wahoo-emoji"><StopIcon style={{ width: 20, height: 20 }} /></span>
                <span className="gcm-wahoo-label">Bored</span>
              </button>
            </div>
          </>
        )}

        {/* Screen 2: Do you want to do that again? */}
        {screen === 2 && (
          <>
            <button className="gcm-back-btn" onClick={() => { clearTimeout(advanceTimer.current); setScreen(1) }}>←</button>
            <h2 className="gcm-title">Do you want to do that again?</h2>
            <div className="gcm-wahoo-options">
              <button
                className={`gcm-wahoo-btn ${aftertaste === 'yes' ? 'selected' : ''}`}
                onClick={() => { hapticLight(); setAftertaste('yes'); advanceTo(3) }}
                style={aftertaste === 'yes' ? { borderColor: '#E9A23B', background: 'rgba(233,162,59,0.06)', color: '#E9A23B' } : undefined}
              >
                <span className="gcm-wahoo-emoji"><FireIcon style={{ width: 20, height: 20 }} /></span>
                <span className="gcm-wahoo-label">Yes</span>
              </button>
              <button
                className={`gcm-wahoo-btn ${aftertaste === 'not_sure' ? 'selected' : ''}`}
                onClick={() => { hapticLight(); setAftertaste('not_sure'); advanceTo(3) }}
                style={aftertaste === 'not_sure' ? { borderColor: '#5e17eb', background: 'rgba(94,23,235,0.06)', color: '#5e17eb' } : undefined}
              >
                <span className="gcm-wahoo-emoji"><QuestionMarkCircleIcon style={{ width: 20, height: 20 }} /></span>
                <span className="gcm-wahoo-label">Not sure</span>
              </button>
              <button
                className={`gcm-wahoo-btn ${aftertaste === 'no' ? 'selected' : ''}`}
                onClick={() => { hapticLight(); setAftertaste('no'); advanceTo(3) }}
                style={aftertaste === 'no' ? { borderColor: '#6b7280', background: 'rgba(107,114,128,0.06)', color: '#6b7280' } : undefined}
              >
                <span className="gcm-wahoo-emoji"><StopIcon style={{ width: 20, height: 20 }} /></span>
                <span className="gcm-wahoo-label">No</span>
              </button>
            </div>
          </>
        )}

        {/* Screen 3: Voice check + save trigger */}
        {screen === 3 && (
          <>
            <button className="gcm-back-btn" onClick={() => { clearTimeout(advanceTimer.current); setScreen(2) }}>←</button>
            <h2 className="gcm-title">Did a protective voice show up before or during?</h2>
            <div className="gcm-wahoo-options gcm-voice-grid">
              {voices.map(v => (
                <button
                  key={v.id}
                  className={`gcm-wahoo-btn ${gapVoice === v.id ? 'selected' : ''}`}
                  onClick={() => { hapticLight(); setGapVoice(v.id); handleSave(v.id) }}
                  style={gapVoice === v.id ? { borderColor: '#5e17eb', background: 'rgba(94,23,235,0.06)', color: '#5e17eb' } : undefined}
                >
                  <span className="gcm-wahoo-emoji">{v.icon}</span>
                  <span className="gcm-wahoo-label">{v.label}</span>
                </button>
              ))}
              <button
                className={`gcm-wahoo-btn ${gapVoice === 'none' ? 'selected' : ''}`}
                onClick={() => { hapticLight(); setGapVoice('none'); handleSave(null) }}
                style={gapVoice === 'none' ? { borderColor: '#16a34a', background: 'rgba(22,163,74,0.06)', color: '#16a34a' } : undefined}
              >
                <span className="gcm-wahoo-emoji">✅</span>
                <span className="gcm-wahoo-label">Nope</span>
              </button>
            </div>
            {saving && <p className="gcm-saving">Saving...</p>}
            {error && <p className="gcm-error">{error}</p>}
          </>
        )}
      </div>
    </div>
  )
}
