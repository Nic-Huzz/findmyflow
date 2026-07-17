import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { completeGroanChallenge } from '../lib/crm/groanChallengeService'
import { getScoringCategory } from '../lib/scoringCategories'
import { getWeekStartLocal } from '../lib/dateUtils'
import { awardMovementXP } from '../lib/movementXP'
import NervousSystemCheckin from './NervousSystemCheckin'
import ShareWinStep from './playlist/ShareWinStep'
import confetti from 'canvas-confetti'
import { trackWahooCompleted } from '../lib/analytics'
import { postFeedEvent } from '../lib/communityFeed'
import { earnMysteryBox, checkNewCategoryBox } from '../lib/mysteryBoxes'
import './GroanCompletionModal.css'

// Auto-skip component (avoids setState during render)
function CrossPollinationSkip({ onSkip }) {
  useEffect(() => { onSkip() }, [])
  return null
}

// RP per wahoo classification (Hades model: harder states earn MORE)
const WAHOO_RP = {
  vibe: 10,      // 7 base + 3 identity bonus
  peace: 7,      // base
  anxious: 10,   // 7 base + 3 edge-push bonus (Pressure is as brave as Vibe Rise)
  shutdown: 9,   // 7 base + 2 honesty bonus
  // Legacy compat
  wahoo: 10,
  vibe_rise: 7,
  routine: 7,
}

export default function GroanCompletionModal({ challenge, userId, onComplete, onClose }) {
  const [step, setStep] = useState('state_checkin') // 'state_checkin' | 'wahoo_check' | 'expectation' | 'cross_pollination' | 'three_percent' | 'share'

  // Hide bottom toolbar while modal is open
  useEffect(() => {
    document.body.classList.add('modal-active')
    return () => document.body.classList.remove('modal-active')
  }, [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showExplainer, setShowExplainer] = useState(false)

  // Essence archetype for identity-linked celebration
  const [essenceName, setEssenceName] = useState(null)
  useEffect(() => {
    if (!userId) return
    supabase.from('user_stage_progress').select('essence_name').eq('user_id', userId).maybeSingle()
      .then(({ data }) => { if (data?.essence_name) setEssenceName(data.essence_name) })
  }, [userId])

  // Nervous system state
  const [beforeState, setBeforeState] = useState(null)
  const [afterState, setAfterState] = useState(null)

  // Wahoo classification
  const [wahooClassification, setWahooClassification] = useState(null)
  const [identityStatement, setIdentityStatement] = useState('')

  // Expectation check
  const [expectationResult, setExpectationResult] = useState(null) // 'better' | 'expected' | 'worse'

  // Cross-pollination
  const [crossQuests, setCrossQuests] = useState([]) // user's other active quests
  const [sourceQuestId, setSourceQuestId] = useState(null) // quest this challenge belongs to
  const [selectedCrossQuests, setSelectedCrossQuests] = useState([]) // quest IDs this challenge also fed
  useEffect(() => {
    if (!userId) return
    supabase.from('quests').select('id, label, predicted_state')
      .eq('user_id', userId).eq('status', 'active')
      .then(({ data }) => { if (data) setCrossQuests(data) })
    // Find which quest this challenge belongs to
    if (challenge?.id) {
      supabase.from('quest_tasks').select('quest_id')
        .eq('groan_challenge_id', challenge.id).eq('user_id', userId)
        .maybeSingle()
        .then(({ data }) => { if (data?.quest_id) setSourceQuestId(data.quest_id) })
    }
  }, [userId, challenge?.id])

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
      // 1. Mark groan challenge as completed
      const reflectionText = reflection
      const { error: groanError } = await completeGroanChallenge(challenge.id, {
        reflectionText,
      })
      if (groanError) throw groanError

      // 2. Upsert quest_completions record (delete old first to prevent RP farming)
      const questId = `play_list_challenge_${challenge.id}`
      try {
        await supabase.from('quest_completions').delete()
          .eq('user_id', userId).eq('quest_id', questId)
      } catch {} // ignore if no existing record
      const completionData = {
        challenge_id: challenge.id,
        source_label: challenge.source_label,
        visibility_layer: challenge.visibility_layer,
        before_state: beforeState,
        after_state: afterState,
        wahoo_classification: wahooClassification,
        identity_statement: wahooClassification === 'anxious' ? null : (identityStatement || null),
        voice_objection: wahooClassification === 'anxious' ? (identityStatement || null) : null,
        expectation_result: expectationResult,
        reflection,
      }
      const { error: questError } = await supabase.from('quest_completions').insert({
        user_id: userId,
        challenge_instance_id: null,
        quest_id: questId,
        quest_category: 'Groans',
        quest_type: 'Rewire',
        points_earned: WAHOO_RP[wahooClassification] || 7,
        challenge_day: 0,
        project_id: null,
        reflection_text: JSON.stringify(completionData),
        response_data: completionData,
      })
      if (questError) throw questError

      // 3. Insert nervous system check-in
      try {
        await supabase.from('nervous_system_checkins').insert({
          user_id: userId,
          before_state: beforeState,
          after_state: afterState,
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
          p_points: WAHOO_RP[wahooClassification] || 7,
          p_week_start: getWeekStartLocal(),
        })
      } catch (e) {
        console.warn('Score increment error:', e)
      }

      // 4a2. Auto-post first_wahoo + mystery box checks
      try {
        const { count } = await supabase
          .from('quest_completions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('quest_category', 'Groans')
        if (count === 1) {
          postFeedEvent(userId, 'first_wahoo', 'Completed their first wahoo')
          earnMysteryBox(userId, 'first_wahoo', 'bronze')
        }
      } catch (e) { /* best effort */ }

      // 4a3. Mystery box: new wahoo category check
      checkNewCategoryBox(userId, challenge.visibility_layer).catch(() => {})

      // 4b. Track wahoo analytics
      trackWahooCompleted({ challengeId: challenge.id })

      // 4c. Award Movement XP for Strike completion
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

      // 5b. Sync linked quest_tasks — mark as done + set safety_status
      const isSafe = ['vibe', 'peace'].includes(wahooClassification)
        && ['better', 'expected'].includes(expectationResult)
      try {
        await supabase
          .from('quest_tasks')
          .update({
            done: true,
            completed_at: new Date().toISOString(),
            safety_status: isSafe ? 'safe' : 'not_safe',
          })
          .eq('groan_challenge_id', challenge.id)
          .eq('user_id', userId)
      } catch (e) {
        console.warn('Error syncing quest task:', e)
      }

      // 5c. Save cross-pollination signals
      if (selectedCrossQuests.length > 0 && sourceQuestId) {
        try {
          const rows = selectedCrossQuests.map(targetId => ({
            user_id: userId,
            source_quest_id: sourceQuestId,
            target_quest_id: targetId,
            groan_challenge_id: challenge.id,
          }))
          await supabase.from('quest_cross_pollination').insert(rows)
        } catch (e) {
          console.warn('Error saving cross-pollination:', e)
        }
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

      // Celebration based on classification (Hades model: every state gets appropriate response)
      if (wahooClassification === 'vibe' || wahooClassification === 'wahoo') {
        // Gold confetti — peak experience
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#E9A23B', '#f5c55a', '#fbbf24'] })
        setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors: ['#E9A23B', '#f5c55a'] }), 300)
      } else if (wahooClassification === 'peace') {
        // Gentle purple — warm acknowledgment
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 }, colors: ['#5e17eb', '#8b5cf6', '#c4b5fd'] })
      }
      // Pressure + Uninterested: no confetti (intentional — the copy IS the response)
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
    // Notify Zarlo of wahoo completion (proactive bubble)
    window.dispatchEvent(new CustomEvent('zarlo:reaction', {
      detail: { actionType: 'wahoo_completed', actionData: { category: challenge?.wahoo_category || 'unknown', classification: wahooClassification || 'unknown' } }
    }))
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
              skipArchetype
              onComplete={() => setStep('wahoo_check')}
            />
          </>
        )}

        {step === 'wahoo_check' && (
          <>
            <h2 className="gcm-title">How did that feel?</h2>
            <div className="gcm-wahoo-options">
              <button
                className={`gcm-wahoo-btn gcm-wahoo-hell-yes ${wahooClassification === 'vibe' ? 'selected' : ''}`}
                onClick={() => setWahooClassification('vibe')}
              >
                <span className="gcm-wahoo-emoji">🔥</span>
                <span className="gcm-wahoo-label">Vibe Rise</span>
              </button>
              <button
                className={`gcm-wahoo-btn gcm-wahoo-alive ${wahooClassification === 'peace' ? 'selected' : ''}`}
                onClick={() => setWahooClassification('peace')}
              >
                <span className="gcm-wahoo-emoji">😌</span>
                <span className="gcm-wahoo-label">Fun</span>
              </button>
              <button
                className={`gcm-wahoo-btn ${wahooClassification === 'anxious' ? 'selected' : ''}`}
                onClick={() => setWahooClassification('anxious')}
                style={wahooClassification === 'anxious' ? { borderColor: '#ef4444', background: 'rgba(239,68,68,0.06)', color: '#ef4444' } : undefined}
              >
                <span className="gcm-wahoo-emoji">😰</span>
                <span className="gcm-wahoo-label">Pressure</span>
              </button>
              <button
                className={`gcm-wahoo-btn ${wahooClassification === 'shutdown' ? 'selected' : ''}`}
                onClick={() => setWahooClassification('shutdown')}
                style={wahooClassification === 'shutdown' ? { borderColor: '#6b7280', background: 'rgba(107,114,128,0.06)', color: '#6b7280' } : undefined}
              >
                <span className="gcm-wahoo-emoji">😶</span>
                <span className="gcm-wahoo-label">Uninterested</span>
              </button>
            </div>
            {/* Per-state response copy (Hades inversion: every state gets a meaningful response) */}
            {wahooClassification === 'vibe' && (
              <div className="gcm-identity-prompt">
                {essenceName && <div className="gcm-identity-line">That's the {essenceName} in you.</div>}
                <label className="gcm-identity-label">Now that I {challenge.title?.toLowerCase()}, I've proven I'm someone who...</label>
                <input className="gcm-identity-input" type="text" value={identityStatement}
                  onChange={e => setIdentityStatement(e.target.value)}
                  placeholder="e.g. takes risks, shows up, backs themselves" />
              </div>
            )}
            {wahooClassification === 'peace' && (
              <div className="gcm-identity-prompt">
                <div className="gcm-reframe-line">That landed. Good.</div>
                <label className="gcm-identity-label">Now that I {challenge.title?.toLowerCase()}, I've proven I'm someone who...</label>
                <input className="gcm-identity-input" type="text" value={identityStatement}
                  onChange={e => setIdentityStatement(e.target.value)}
                  placeholder="e.g. takes risks, shows up, backs themselves" />
              </div>
            )}
            {wahooClassification === 'anxious' && (
              <div className="gcm-identity-prompt">
                <div className="gcm-reframe-line gcm-reframe-pressure">
                  That wasn't easy. The voice probably told you to stop. You didn't.
                </div>
                <label className="gcm-identity-label">What did the voice say before you did it?</label>
                <input className="gcm-identity-input" type="text" value={identityStatement}
                  onChange={e => setIdentityStatement(e.target.value)}
                  placeholder="e.g. you're not ready, people will judge, it won't work" />
              </div>
            )}
            {wahooClassification === 'shutdown' && (
              <div className="gcm-identity-prompt">
                <div className="gcm-reframe-line gcm-reframe-neutral">
                  This one didn't land. That's useful information. Not everything that scares you matters to you.
                </div>
              </div>
            )}
            <button
              className="gcm-gold-btn"
              disabled={!wahooClassification}
              onClick={() => setStep('expectation')}
            >
              Continue
            </button>
          </>
        )}

        {step === 'expectation' && (
          <>
            <h2 className="gcm-title">Did it go...</h2>
            <div className="gcm-wahoo-options">
              <button
                className={`gcm-wahoo-btn ${expectationResult === 'better' ? 'selected' : ''}`}
                onClick={() => setExpectationResult('better')}
                style={expectationResult === 'better' ? { borderColor: '#E9A23B', background: 'rgba(233,162,59,0.06)', color: '#E9A23B' } : undefined}
              >
                <span className="gcm-wahoo-emoji">✨</span>
                <span className="gcm-wahoo-label">Better than expected</span>
              </button>
              <button
                className={`gcm-wahoo-btn ${expectationResult === 'expected' ? 'selected' : ''}`}
                onClick={() => setExpectationResult('expected')}
                style={expectationResult === 'expected' ? { borderColor: '#5e17eb', background: 'rgba(94,23,235,0.06)', color: '#5e17eb' } : undefined}
              >
                <span className="gcm-wahoo-emoji">👌</span>
                <span className="gcm-wahoo-label">As expected</span>
              </button>
              <button
                className={`gcm-wahoo-btn ${expectationResult === 'worse' ? 'selected' : ''}`}
                onClick={() => setExpectationResult('worse')}
                style={expectationResult === 'worse' ? { borderColor: '#6b7280', background: 'rgba(107,114,128,0.06)', color: '#6b7280' } : undefined}
              >
                <span className="gcm-wahoo-emoji">😬</span>
                <span className="gcm-wahoo-label">Worse than expected</span>
              </button>
            </div>
            <button
              className="gcm-gold-btn"
              disabled={!expectationResult}
              onClick={() => setStep('cross_pollination')}
            >
              Continue
            </button>
          </>
        )}

        {step === 'cross_pollination' && (() => {
          const otherQuests = crossQuests.filter(q => q.id !== sourceQuestId && q.label !== 'Healing Work')

          // Skip if no other quests to cross-pollinate with
          if (otherQuests.length === 0) return <CrossPollinationSkip onSkip={() => setStep('three_percent')} />

          return (
            <>
              <h2 className="gcm-title">Did this also feed another path?</h2>
              <p className="gcm-subtitle">Tap any paths this experience helped</p>
              <div className="gcm-cross-quests">
                {otherQuests.map(q => {
                  const selected = selectedCrossQuests.includes(q.id)
                  return (
                    <button key={q.id}
                      className={`gcm-cross-quest-btn ${selected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedCrossQuests(prev =>
                          selected ? prev.filter(id => id !== q.id) : [...prev, q.id]
                        )
                      }}>
                      {q.label}
                    </button>
                  )
                })}
              </div>
              <button className="gcm-gold-btn" onClick={() => setStep('three_percent')}>
                {selectedCrossQuests.length > 0 ? 'Continue' : 'None, continue'}
              </button>
            </>
          )
        })()}

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
