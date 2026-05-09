import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { completeGroanChallenge } from '../lib/crm/groanChallengeService'
import { getScoringCategory } from '../lib/scoringCategories'
import { getWeekStartLocal } from '../lib/dateUtils'
import { awardMovementXP } from '../lib/movementXP'
import NervousSystemCheckin from './NervousSystemCheckin'
import ShareWinStep from './playlist/ShareWinStep'
import confetti from 'canvas-confetti'
import './GroanCompletionModal.css'

const PLAY_LIST_POINTS = 7

// Wahoo classification → scary/wahoo score mapping
const WAHOO_SCORES = {
  wahoo: { scary: 8, wahoo: 9 },       // Hell yes — edge crossing
  vibe_rise: { scary: 3, wahoo: 8 },   // Felt alive — capacity grew
  routine: { scary: 3, wahoo: 3 },      // Just did it — routine
}

export default function GroanCompletionModal({ challenge, userId, onComplete, onClose }) {
  const [step, setStep] = useState('state_checkin') // 'state_checkin' | 'wahoo_check' | 'three_percent' | 'share'

  // Hide bottom toolbar while modal is open
  useEffect(() => {
    document.body.classList.add('modal-active')
    return () => document.body.classList.remove('modal-active')
  }, [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showExplainer, setShowExplainer] = useState(false)

  // Nervous system state
  const [beforeState, setBeforeState] = useState(null)
  const [afterState, setAfterState] = useState(null)
  const [protectiveArchetype, setProtectiveArchetype] = useState(null)

  // Wahoo classification
  const [wahooClassification, setWahooClassification] = useState(null) // 'wahoo' | 'vibe_rise' | 'routine'

  // 3% reflection
  const [reflection, setReflection] = useState('')

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
      // 1. Mark groan challenge as completed with user-reported scores
      const reflectionText = reflection
      const scores = WAHOO_SCORES[wahooClassification] || WAHOO_SCORES.routine
      const { error: groanError } = await completeGroanChallenge(challenge.id, {
        reflectionText,
        scaryScoreAfter: scores.scary,
        wahooScoreAfter: scores.wahoo,
      })
      if (groanError) throw groanError

      // Update scary/wahoo scores on the challenge record (user self-report replaces AI prediction)
      await supabase
        .from('groan_challenges')
        .update({ scary_score: scores.scary, wahoo_score: scores.wahoo })
        .eq('id', challenge.id)

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
          before_state: beforeState,
          after_state: afterState,
          protective_archetype: protectiveArchetype,
          reflection,
        }),
      })
      if (questError) console.warn('Quest completion insert error:', questError)

      // 3. Insert nervous system check-in
      try {
        await supabase.from('nervous_system_checkins').insert({
          user_id: userId,
          before_state: beforeState,
          after_state: afterState,
          protective_archetype: protectiveArchetype,
          checkin_type: 'playlist',
          source_quest_id: questId,
          source_challenge_id: challenge.id,
        })
      } catch (e) {
        console.warn('NS check-in insert error:', e)
      }

      // 4. Update scores
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

      // 4b. Award Movement XP for Strike completion
      if (challenge.challenge_source === 'strike') {
        awardMovementXP(userId, 'strike_complete', challenge.title)
      }

      // 5. Remove from priority_weekly_picks so it no longer shows as active
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

      // 6. Append challenge id to user_level_progress.courage_challenge_ids for current level
      try {
        const { data: stage } = await supabase
          .from('user_stage_progress')
          .select('current_journey_level')
          .eq('user_id', userId)
          .maybeSingle()
        const currentLevel = stage?.current_journey_level ?? 0
        if (currentLevel > 0) {
          const { data: progress } = await supabase
            .from('user_level_progress')
            .select('courage_challenge_ids')
            .eq('user_id', userId)
            .eq('current_level', currentLevel)
            .maybeSingle()
          const existing = progress?.courage_challenge_ids || []
          if (!existing.includes(challenge.id)) {
            await supabase
              .from('user_level_progress')
              .upsert({
                user_id: userId,
                current_level: currentLevel,
                courage_challenge_ids: [...existing, challenge.id],
              }, { onConflict: 'user_id,current_level' })
          }
        }
      } catch (e) {
        console.warn('Error updating level courage progress:', e)
      }

      // Celebration based on classification
      if (wahooClassification === 'wahoo') {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#E9A23B', '#f5c55a', '#fbbf24'] })
        setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors: ['#E9A23B', '#f5c55a'] }), 300)
      } else {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } })
      }
      setStep('share')
    } catch (err) {
      console.error('Error completing challenge:', err)
      setError('Failed to complete challenge. Please try again.')
    } finally {
      setSaving(false)
    }
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

        {step === 'state_checkin' && (
          <>
            <h2 className="gcm-title">I Did It!</h2>
            <p className="gcm-subtitle">{challenge.title || challenge.source_label}</p>

            <NervousSystemCheckin
              mode="both"
              beforeState={beforeState}
              afterState={afterState}
              onBeforeChange={setBeforeState}
              onAfterChange={setAfterState}
              protectiveArchetype={protectiveArchetype}
              onArchetypeChange={setProtectiveArchetype}
              onComplete={() => setStep('wahoo_check')}
            />
          </>
        )}

        {step === 'wahoo_check' && (
          <>
            <h2 className="gcm-title">Was that a Wahoo?</h2>
            <div className="gcm-wahoo-options">
              <button
                className={`gcm-wahoo-btn gcm-wahoo-hell-yes ${wahooClassification === 'wahoo' ? 'selected' : ''}`}
                onClick={() => setWahooClassification('wahoo')}
              >
                <span className="gcm-wahoo-emoji">🔥</span>
                <span className="gcm-wahoo-label">Hell yes</span>
                <span className="gcm-wahoo-desc">Scared AND alive</span>
              </button>
              <button
                className={`gcm-wahoo-btn gcm-wahoo-alive ${wahooClassification === 'vibe_rise' ? 'selected' : ''}`}
                onClick={() => setWahooClassification('vibe_rise')}
              >
                <span className="gcm-wahoo-emoji">⚡</span>
                <span className="gcm-wahoo-label">Felt alive but not scary</span>
                <span className="gcm-wahoo-desc">This is becoming your baseline</span>
              </button>
              <button
                className={`gcm-wahoo-btn gcm-wahoo-routine ${wahooClassification === 'routine' ? 'selected' : ''}`}
                onClick={() => setWahooClassification('routine')}
              >
                <span className="gcm-wahoo-emoji">😐</span>
                <span className="gcm-wahoo-label">Just did it</span>
                <span className="gcm-wahoo-desc">Neither scary nor alive</span>
              </button>
            </div>
            <button
              className="gcm-gold-btn"
              disabled={!wahooClassification}
              onClick={() => setStep('three_percent')}
            >
              Continue
            </button>
          </>
        )}

        {step === 'three_percent' && (
          <>
            <h2 className="gcm-title">3% Better</h2>

            <div className="gcm-form">
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

        {step === 'share' && (
          <ShareWinStep
            userId={userId}
            challenge={challenge}
            beforeState={beforeState}
            afterState={afterState}
            onDone={handleShareDone}
          />
        )}
      </div>
    </div>
  )
}
