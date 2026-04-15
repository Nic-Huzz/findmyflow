import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { completeGroanChallenge } from '../lib/crm/groanChallengeService'
import { getScoringCategory } from '../lib/scoringCategories'
import { getWeekStartLocal } from '../lib/dateUtils'
import CompassCheckin from './CompassCheckin'
import ShareWinStep from './playlist/ShareWinStep'
import confetti from 'canvas-confetti'
import './GroanCompletionModal.css'

const PLAY_LIST_POINTS = 7

export default function GroanCompletionModal({ challenge, userId, onComplete, onClose }) {
  const [step, setStep] = useState('reflection') // 'reflection' | 'voices' | 'compass' | 'share'

  // Hide bottom toolbar while modal is open
  useEffect(() => {
    document.body.classList.add('modal-active')
    return () => document.body.classList.remove('modal-active')
  }, [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showExplainer, setShowExplainer] = useState(false)

  // Reflection state
  const [scaryScore, setScaryScore] = useState(5)
  const [wahooScore, setWahooScore] = useState(5)
  const [reflection, setReflection] = useState('')

  // Voices state
  const [essenceShowedUp, setEssenceShowedUp] = useState(null)
  const [essenceHow, setEssenceHow] = useState('')
  const [protectiveShowedUp, setProtectiveShowedUp] = useState(null)
  const [protectiveHow, setProtectiveHow] = useState('')

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

  const handleCompleteReflection = async () => {
    setSaving(true)
    setError(null)
    try {
      // 1. Mark groan challenge as completed
      const reflectionText = reflection
      const { error: groanError } = await completeGroanChallenge(challenge.id, {
        reflectionText,
        scaryScoreAfter: scaryScore,
        wahooScoreAfter: wahooScore,
      })
      if (groanError) throw groanError

      // 2. Insert quest_completions record
      const questId = `play_list_challenge_${challenge.id}`
      const { error: questError } = await supabase.from('quest_completions').insert({
        user_id: userId,
        challenge_instance_id: null,
        quest_id: questId,
        quest_category: 'Groans',
        quest_type: 'Rewire',
        points_earned: PLAY_LIST_POINTS,
        challenge_day: 0,
        project_id: null,
        reflection_text: JSON.stringify({
          challenge_id: challenge.id,
          source_label: challenge.source_label,
          visibility_layer: challenge.visibility_layer,
          scary_score: scaryScore,
          wahoo_score: wahooScore,
          reflection,
        }),
      })
      if (questError) console.warn('Quest completion insert error:', questError)

      // 3. Update scores
      try {
        await supabase.rpc('increment_scores', {
          p_user_id: userId,
          p_project_id: null,
          p_category: getScoringCategory('Groans'),
          p_points: PLAY_LIST_POINTS,
          p_week_start: getWeekStartLocal(),
        })
      } catch (e) {
        console.warn('Score increment error:', e)
      }

      // 4. Remove from priority_weekly_picks so it no longer shows as active
      try {
        await supabase
          .from('priority_weekly_picks')
          .delete()
          .eq('user_id', userId)
          .eq('pick_type', 'groan')
          .eq('reference_id', challenge.id)
      } catch (e) {
        console.warn('Error removing weekly pick:', e)
      }

      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      setStep('voices')
    } catch (err) {
      console.error('Error completing challenge:', err)
      setError('Failed to complete challenge. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleVoicesContinue = async () => {
    const voiceEntries = []
    if (essenceShowedUp !== null) {
      voiceEntries.push({
        user_id: userId,
        challenge_instance_id: null,
        quest_id: 'playlist_essence_voice',
        quest_category: 'Voices',
        quest_type: 'recognise',
        points_earned: 3,
        challenge_day: 0,
        project_id: null,
        reflection_text: JSON.stringify({
          showed_up: essenceShowedUp,
          how: essenceHow || null,
          from_challenge: challenge.id,
        }),
      })
    }
    if (protectiveShowedUp !== null) {
      voiceEntries.push({
        user_id: userId,
        challenge_instance_id: null,
        quest_id: 'playlist_protective_voice',
        quest_category: 'Voices',
        quest_type: 'recognise',
        points_earned: 3,
        challenge_day: 0,
        project_id: null,
        reflection_text: JSON.stringify({
          showed_up: protectiveShowedUp,
          how: protectiveHow || null,
          from_challenge: challenge.id,
        }),
      })
    }
    if (voiceEntries.length > 0) {
      const { error } = await supabase.from('quest_completions').insert(voiceEntries)
      if (error) console.warn('Error saving voice data:', error)
    }
    setStep('compass')
  }

  const handleCompassComplete = async (compassData) => {
    try {
      await supabase.from('flow_entries').insert({
        user_id: userId,
        direction: compassData.direction,
        internal_state: compassData.internal_state,
        external_state: compassData.external_state,
        note: compassData.reasoning || null,
        project_id: null,
      })
    } catch (err) {
      console.warn('Error saving compass:', err)
    }
    setStep('share')
  }

  const handleShareDone = ({ shared } = {}) => {
    if (shared) {
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } })
    }
    onComplete?.()
    onClose()
  }


  return (
    <div className="gcm-overlay" onClick={onClose}>
      <div className="gcm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="gcm-close" onClick={onClose}>&times;</button>

        {step === 'reflection' && (
          <>
            <h2 className="gcm-title">I Did It!</h2>
            <p className="gcm-subtitle">{challenge.title || challenge.source_label}</p>

            <div className="gcm-form">
              <div className="gcm-slider-group">
                <label>How scary was it? <span className="gcm-score">{scaryScore}/10</span></label>
                <input type="range" min="1" max="10" value={scaryScore}
                  onChange={(e) => setScaryScore(parseInt(e.target.value))} />
              </div>

              <div className="gcm-slider-group">
                <label>How exciting was it? <span className="gcm-score">{wahooScore}/10</span></label>
                <input type="range" min="1" max="10" value={wahooScore}
                  onChange={(e) => setWahooScore(parseInt(e.target.value))} />
              </div>

              <div className="gcm-textarea-group">
                <div className="gcm-label-row">
                  <label>How can you make this 3% better next time?</label>
                  <button className="gcm-explainer-btn" onClick={() => setShowExplainer(true)}>Explainer</button>
                </div>
                <textarea placeholder="What small improvement could compound over time?"
                  value={reflection} onChange={(e) => setReflection(e.target.value)} rows={3} />
              </div>

              {showExplainer && (
                <div className="gcm-explainer-overlay" onClick={() => setShowExplainer(false)}>
                  <div className="gcm-explainer-card" onClick={(e) => e.stopPropagation()}>
                    <button className="gcm-explainer-close" onClick={() => setShowExplainer(false)}>&times;</button>
                    <h3 className="gcm-explainer-title">The 3% Rule</h3>
                    <p className="gcm-explainer-text">
                      The secret to real progress isn't giant leaps. It's compounding micro-improvements over time.
                    </p>
                    <p className="gcm-explainer-text">
                      If you improve just 3% each time you repeat a challenge, those small gains stack up fast. After 10 rounds, you're 34% better. After 24, you've doubled.
                    </p>
                    <p className="gcm-explainer-text">
                      So don't aim for perfect. Just ask: what's one tiny thing I could do differently next time?
                    </p>
                    <button className="gcm-gold-btn" onClick={() => setShowExplainer(false)}>Got it</button>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="gcm-error">{error}</p>}

            <button className="gcm-gold-btn" onClick={handleCompleteReflection} disabled={saving}>
              {saving ? 'Saving...' : 'Complete Challenge'}
            </button>
          </>
        )}

        {step === 'voices' && (
          <>
            <h2 className="gcm-title">Voice Check-in</h2>

            <div className="gcm-form">
              <div className="gcm-voice-group">
                <label>Did your Essence voice show up?</label>
                <div className="gcm-toggle-row">
                  <button className={`gcm-toggle ${essenceShowedUp === true ? 'active yes' : ''}`}
                    onClick={() => setEssenceShowedUp(true)}>Yes</button>
                  <button className={`gcm-toggle ${essenceShowedUp === false ? 'active no' : ''}`}
                    onClick={() => { setEssenceShowedUp(false); setEssenceHow('') }}>No</button>
                </div>
                {essenceShowedUp && (
                  <textarea placeholder="How did your Essence show up?"
                    value={essenceHow} onChange={(e) => setEssenceHow(e.target.value)} rows={2} />
                )}
              </div>

              <div className="gcm-voice-group">
                <label>Did your Protective voice show up?</label>
                <div className="gcm-toggle-row">
                  <button className={`gcm-toggle ${protectiveShowedUp === true ? 'active yes' : ''}`}
                    onClick={() => setProtectiveShowedUp(true)}>Yes</button>
                  <button className={`gcm-toggle ${protectiveShowedUp === false ? 'active no' : ''}`}
                    onClick={() => { setProtectiveShowedUp(false); setProtectiveHow('') }}>No</button>
                </div>
                {protectiveShowedUp && (
                  <textarea placeholder="How did your Protective voice try to hold you back?"
                    value={protectiveHow} onChange={(e) => setProtectiveHow(e.target.value)} rows={2} />
                )}
              </div>
            </div>

            <button className="gcm-gold-btn" onClick={handleVoicesContinue}>Continue</button>
            <button className="gcm-skip-btn" onClick={() => setStep('compass')}>Skip</button>
          </>
        )}

        {step === 'compass' && (
          <CompassCheckin
            onComplete={handleCompassComplete}
            onSkip={() => setStep('share')}
            challengeTitle={challenge.title || challenge.source_label}
          />
        )}

        {step === 'share' && (
          <ShareWinStep
            userId={userId}
            challenge={challenge}
            scaryScore={scaryScore}
            wahooScore={wahooScore}
            onDone={handleShareDone}
          />
        )}
      </div>
    </div>
  )
}
