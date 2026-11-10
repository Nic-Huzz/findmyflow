import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { hapticLight } from '../lib/haptics'
import confetti from 'canvas-confetti'
import { saveChallengeCompletion } from '../lib/challengeCompletionService'
import { advanceStage, createNextChallenge } from '../lib/financialSecurityEngine'
import { invalidate as invalidatePassionRec, generate as generatePassionChallenge } from '../lib/passionChallengeEngine'
import {
  EyeSlashIcon,
  AdjustmentsHorizontalIcon,
  UsersIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  FireIcon,
  FaceSmileIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  StopIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/solid'
import './GroanCompletionModal.css'

export default function GroanCompletionModal({ challenge, userId, onComplete, onClose }) {
  const savedRef = useRef(false)
  const advanceTimer = useRef(null)
  const rpAwardedRef = useRef(null)
  const onCompleteCalledRef = useRef(false)
  const isMoneyMap = challenge?.challenge_source === 'money_map'

  // Hide bottom toolbar while modal is open
  useEffect(() => {
    document.body.classList.add('modal-active')
    return () => document.body.classList.remove('modal-active')
  }, [])

  // Cleanup advance timer on unmount
  useEffect(() => () => clearTimeout(advanceTimer.current), [])

  // Close handler — on screen 4 (continue/pivot), fire onComplete to exit
  const handleClose = useCallback(() => {
    if (isMoneyMap && savedRef.current && !onCompleteCalledRef.current) {
      // Invalidate + regenerate passion challenge rec for this quest
      if (sourceQuestId) {
        invalidatePassionRec(sourceQuestId)
        generatePassionChallenge(sourceQuestId, userId).catch(() => {})
      }
      onCompleteCalledRef.current = true
      onComplete?.({
        dimensionValues: challenge?.dimension_values,
        rpAwarded: rpAwardedRef.current,
      })
    }
    onClose()
  }, [onClose, onComplete, isMoneyMap, challenge, sourceQuestId, userId])

  const [screen, setScreen] = useState(isMoneyMap ? 3 : 1) // 1=wahoo, 2=aftertaste, 3=voice, 4=continue/pivot (money map discovery only)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [financialStage, setFinancialStage] = useState(null)
  const [pivotChoice, setPivotChoice] = useState(null)

  // Core state kept for save
  const [wahooClassification, setWahooClassification] = useState(null)
  const [afterState, setAfterState] = useState(null)
  const [aftertaste, setAftertaste] = useState(null)
  const [gapVoice, setGapVoice] = useState(null)

  // Default wahoo/aftertaste for money map (screens 1+2 are skipped)
  useEffect(() => {
    if (isMoneyMap) {
      setWahooClassification('vibe')
      setAfterState('vibe_rise')
      setAftertaste('yes')
    }
  }, [isMoneyMap])

  // Quest linking (needed by saveChallengeCompletion for behavioral evidence)
  // Also fetches financial_stage for money map stage branching
  const [sourceQuestId, setSourceQuestId] = useState(null)
  useEffect(() => {
    if (!userId || !challenge?.id) return
    supabase.from('quest_tasks').select('quest_id, quests!inner(financial_stage)')
      .eq('groan_challenge_id', challenge.id).eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.quest_id) setSourceQuestId(data.quest_id)
        if (data?.quests?.financial_stage) setFinancialStage(data.quests.financial_stage)
      })
  }, [userId, challenge?.id])

  function advanceTo(next) {
    clearTimeout(advanceTimer.current)
    advanceTimer.current = setTimeout(() => setScreen(next), 300)
  }

  // Shared: fire onComplete exactly once
  function fireOnComplete() {
    // Invalidate + regenerate passion challenge rec for this quest
    if (sourceQuestId) {
      invalidatePassionRec(sourceQuestId)
      generatePassionChallenge(sourceQuestId, userId).catch(() => {})
    }
    if (!onCompleteCalledRef.current) {
      onCompleteCalledRef.current = true
      onComplete?.({
        dimensionValues: challenge?.dimension_values,
        wahooClassification,
        afterState,
        rpAwarded: rpAwardedRef.current,
      })
    }
  }

  // Discovery only: user chose to continue or pivot
  async function handleContinueOrPivot(choice) {
    const questId = sourceQuestId || challenge?.quest_id
    if (choice === 'continue' && questId) {
      const newStage = await advanceStage(questId, financialStage || 'discovery')
      if (newStage) {
        const { data: quest } = await supabase.from('quests')
          .select('*').eq('id', questId).single()
        if (quest) await createNextChallenge(userId, quest)
      }
    }
    // 'try_different' — stage stays at discovery, no next challenge
    fireOnComplete()
  }

  // Portfolio+ stages: auto-advance without asking
  async function handleAutoAdvance() {
    const questId = sourceQuestId || challenge?.quest_id
    if (!questId) { fireOnComplete(); return }

    // Resolve stage — use cached value, or fetch if useEffect hasn't resolved yet
    let stage = financialStage
    if (!stage) {
      const { data: q } = await supabase.from('quests')
        .select('financial_stage').eq('id', questId).single()
      stage = q?.financial_stage
    }
    if (!stage) { fireOnComplete(); return }

    const newStage = await advanceStage(questId, stage)
    if (newStage && newStage !== 'acquisition') {
      // Create next challenge (skip for acquisition — that's a picker)
      const { data: quest } = await supabase.from('quests')
        .select('*').eq('id', questId).single()
      if (quest) await createNextChallenge(userId, quest)
    }
    fireOnComplete()
  }

  const savingRef = useRef(false)
  const handleSave = async (selectedVoice) => {
    if (savedRef.current || savingRef.current) return
    savingRef.current = true
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
      setSaving(false)

      if (isMoneyMap) {
        rpAwardedRef.current = rpAwarded
        // financialStage may be null if useEffect hasn't resolved — default to discovery
        // (the very first money map challenge IS always discovery)
        const stage = financialStage || 'discovery'
        if (stage === 'discovery') {
          // Discovery: show continue/pivot choice (screen 4)
          advanceTo(4)
        } else {
          // Portfolio+: auto-advance, no question asked
          await handleAutoAdvance()
        }
        return
      }

      onComplete?.({
        dimensionValues: challenge.dimension_values,
        wahooClassification,
        afterState,
        rpAwarded,
      })
    } catch (err) {
      console.error('Save error:', err)
      setError('Something went wrong. Try again.')
      savingRef.current = false
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
    { id: 'ghost', icon: <EyeSlashIcon style={{ width: 18, height: 18 }} />, label: 'Ghost' },
    { id: 'perfectionist', icon: <AdjustmentsHorizontalIcon style={{ width: 18, height: 18 }} />, label: 'Perfectionist' },
    { id: 'people_pleaser', icon: <UsersIcon style={{ width: 18, height: 18 }} />, label: 'People Pleaser' },
    { id: 'controller', icon: <ShieldCheckIcon style={{ width: 18, height: 18 }} />, label: 'Controller' },
    { id: 'auto_pilot', icon: <CpuChipIcon style={{ width: 18, height: 18 }} />, label: 'Auto-Pilot' },
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
            <button className="gcm-back-btn" onClick={() => { clearTimeout(advanceTimer.current); setScreen(1) }}>&larr;</button>
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
            {!isMoneyMap && (
              <button className="gcm-back-btn" onClick={() => { clearTimeout(advanceTimer.current); setScreen(2) }}>&larr;</button>
            )}
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
                <span className="gcm-wahoo-emoji"><CheckCircleIcon style={{ width: 20, height: 20 }} /></span>
                <span className="gcm-wahoo-label">Nope</span>
              </button>
            </div>
            {saving && <p className="gcm-saving">Saving...</p>}
            {error && <p className="gcm-error">{error}</p>}
          </>
        )}

        {/* Screen 4: Continue or pivot (money map discovery only) */}
        {screen === 4 && (
          <>
            <h2 className="gcm-title">Want to keep exploring this?</h2>
            <p className="gcm-subtitle">Or would you rather try a different path to financial security?</p>
            <div className="gcm-wahoo-options">
              <button
                className={`gcm-wahoo-btn ${pivotChoice === 'continue' ? 'selected' : ''}`}
                onClick={() => { hapticLight(); setPivotChoice('continue'); handleContinueOrPivot('continue') }}
                style={pivotChoice === 'continue' ? { borderColor: '#E9A23B', background: 'rgba(233,162,59,0.06)', color: '#E9A23B' } : undefined}
              >
                <span className="gcm-wahoo-emoji"><FireIcon style={{ width: 20, height: 20 }} /></span>
                <span className="gcm-wahoo-label">Yes, keep going</span>
              </button>
              <button
                className={`gcm-wahoo-btn ${pivotChoice === 'try_different' ? 'selected' : ''}`}
                onClick={() => { hapticLight(); setPivotChoice('try_different'); handleContinueOrPivot('try_different') }}
                style={pivotChoice === 'try_different' ? { borderColor: '#5e17eb', background: 'rgba(94,23,235,0.06)', color: '#5e17eb' } : undefined}
              >
                <span className="gcm-wahoo-emoji"><ArrowPathIcon style={{ width: 20, height: 20 }} /></span>
                <span className="gcm-wahoo-label">Try something different</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
