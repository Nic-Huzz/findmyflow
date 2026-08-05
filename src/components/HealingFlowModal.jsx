/**
 * HealingFlowModal — 7-step per-task healing flow
 * Triggered from QuestBoardCard when user opts to explore fear behind a courage challenge.
 * Steps: Pattern → Fear → Origin → Insight → Rewire → Go Deeper → Expect the Best
 *
 * CSS prefix: hfm-
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import { postFeedEvent } from '../lib/communityFeed'
import './HealingFlowModal.css'

const PATTERNS = [
  { id: 'ghost', name: 'The Ghost', icon: '👻', desc: 'You hide. You stay invisible. Being seen feels dangerous.' },
  { id: 'controller', name: 'The Controller', icon: '🧱', desc: 'You grip. You overwork. If you let go, everything falls apart.' },
  { id: 'auto_pilot', name: 'The Auto-Pilot', icon: '🤖', desc: 'You go through the motions. Nobody\'s home. "This is fine."' },
  { id: 'perfectionist', name: 'The Perfectionist', icon: '🎯', desc: 'You wait until it\'s perfect. Nothing is ever ready.' },
]

export default function HealingFlowModal({ taskText, userId, questTaskId, existingData, onComplete, onClose }) {
  // Resume from existing data if provided
  const resumeStep = existingData
    ? (existingData.expectation_text ? 7 : existingData.rewire_text ? 6 : existingData.origin_text ? 4 : existingData.fear_text ? 3 : existingData.pattern ? 2 : 1)
    : 1
  const [step, setStep] = useState(resumeStep)
  const [pattern, setPattern] = useState(existingData?.pattern || null)
  const [fearText, setFearText] = useState(existingData?.fear_text || '')
  const [originText, setOriginText] = useState(existingData?.origin_text || '')
  const [rewireText, setRewireText] = useState(existingData?.rewire_text || '')
  const [expectationText, setExpectationText] = useState(existingData?.expectation_text || '')
  const [clickedBook, setClickedBook] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sharingHealing, setSharingHealing] = useState(false)
  const [shareCaption, setShareCaption] = useState('')

  const patternMeta = PATTERNS.find(p => p.id === pattern)

  // Save on unmount (e.g. iOS tab switch, modal closed externally)
  const dataRef = useRef({ pattern, fearText, originText, rewireText, expectationText, step })
  useEffect(() => {
    dataRef.current = { pattern, fearText, originText, rewireText, expectationText, step }
  }, [pattern, fearText, originText, rewireText, expectationText, step])

  useEffect(() => {
    return () => {
      const d = dataRef.current
      if (d.pattern && d.step > 1) {
        const insightText = (d.originText?.trim() && d.fearText?.trim())
          ? `When "${d.originText.trim().slice(0, 80)}" happened, your protective voice was created to keep you safe. But that was then. "${taskText}" is now.`
          : null
        try {
          supabase.from('healing_intentions')
            .upsert({
              quest_task_id: questTaskId,
              user_id: userId,
              pattern: d.pattern,
              protective_voice: d.pattern || null,
              fear_text: d.fearText?.trim() || null,
              origin_text: d.originText?.trim() || null,
              insight_text: insightText,
              rewire_text: d.rewireText?.trim() || null,
              expectation_text: d.expectationText?.trim() || null,
              healing_stage: 'in_progress',
              updated_at: new Date().toISOString(),
            }, { onConflict: 'quest_task_id' })
            .then(() => {})
        } catch (e) { /* fire-and-forget */ }
      }
    }
  }, [])

  const canContinue = () => {
    switch (step) {
      case 1: return !!pattern
      case 2: return fearText.trim().length > 0
      case 3: return originText.trim().length > 0
      case 4: return true // insight is read-only
      case 5: return rewireText.trim().length > 0
      case 6: return true // go deeper is optional
      case 7: return expectationText.trim().length > 0
      default: return false
    }
  }

  // Save progress on each step (upsert so partial progress is kept)
  const saveProgress = async (isFinal = false) => {
    const insightText = (originText.trim() && fearText.trim() && patternMeta)
      ? `When "${originText.trim().slice(0, 80)}" happened, your ${patternMeta.name} was created to keep you safe. But that was then. "${taskText}" is now.`
      : null

    const row = {
      quest_task_id: questTaskId,
      user_id: userId,
      pattern: pattern || null,
      protective_voice: pattern || null,
      fear_text: fearText.trim() || null,
      origin_text: originText.trim() || null,
      insight_text: insightText,
      rewire_text: rewireText.trim() || null,
      expectation_text: expectationText.trim() || null,
      healing_stage: isFinal ? 'recognised' : 'in_progress',
      outcome: isFinal ? 'completed' : null,
      updated_at: new Date().toISOString(),
    }

    try {
      await supabase.from('healing_intentions')
        .upsert(row, { onConflict: 'quest_task_id' })
    } catch (e) { /* fire-and-forget */ }
  }

  const handleFinalSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await saveProgress(true)

      // Award RP (fire-and-forget)
      try {
        await supabase.from('quest_completions').insert({
          user_id: userId,
          quest_id: `healing_flow_${questTaskId}`,
          quest_category: 'Healing',
          quest_type: 'Rewire',
          points_earned: 5,
          challenge_day: 0,
          project_id: null,
        })
      } catch (e2) { /* non-blocking */ }

      // Mystery box: first healing flow
      supabase.from('healing_intentions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('healing_stage', ['recognised', 'released'])
        .then(({ count }) => {
          if (count === 1) import('../lib/mysteryBoxes').then(m => m.earnMysteryBox(userId, 'first_healing', 'bronze'))
        }).catch(() => {})

      hapticSuccess()
      // Notify Zarlo of healing completion (proactive bubble)
      window.dispatchEvent(new CustomEvent('zarlo:reaction', {
        detail: { actionType: 'healing_completed', actionData: { stage: 'recognised', pattern: pattern || 'unnamed' } }
      }))
      setStep('done')
    } catch (e) {
      console.error('Healing flow save error:', e)
    }
    setSaving(false)
  }

  const handleNext = () => {
    if (step === 7) {
      handleFinalSave()
      return
    }
    hapticLight()
    // Auto-save progress when advancing past steps with data
    if (step >= 1 && pattern) saveProgress()
    setStep(step + 1)
  }

  return (
    <div className="hfm-overlay" onClick={onClose}>
      <div className="hfm-modal" onClick={e => e.stopPropagation()}>
        <div className="hfm-header">
          <div className="hfm-header-left">
            <span className="hfm-header-icon">💚</span>
            <div>
              <div className="hfm-title">Healing Flow</div>
              <div className="hfm-task-name">{taskText}</div>
            </div>
          </div>
          <button className="hfm-close" onClick={onClose}>&times;</button>
        </div>

        <div className="hfm-progress">
          <div className="hfm-progress-fill" style={{ width: `${Math.round(((typeof step === 'number' ? step : 7) / 7) * 100)}%` }} />
        </div>

        <div className="hfm-body">

          {/* Step 1: Pattern */}
          {step === 1 && (
            <div className="hfm-step">
              <div className="hfm-step-num">Step 1 of 7</div>
              <h3 className="hfm-question">Which voice shows up around this task?</h3>
              <p className="hfm-sub">Not your mind. Your body. Which one do you feel?</p>
              <div className="hfm-patterns">
                {PATTERNS.map(p => (
                  <button key={p.id}
                    className={`hfm-pattern-card ${pattern === p.id ? 'selected' : ''}`}
                    onClick={() => { hapticLight(); setPattern(p.id) }}>
                    <span className="hfm-pattern-icon">{p.icon}</span>
                    <div className="hfm-pattern-info">
                      <span className="hfm-pattern-name">{p.name}</span>
                      <span className="hfm-pattern-desc">{p.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Fear */}
          {step === 2 && (
            <div className="hfm-step">
              <div className="hfm-step-num">Step 2 of 7</div>
              <h3 className="hfm-question">What's the worst thing that could happen?</h3>
              <p className="hfm-sub">If you actually did "{taskText}", what are you really afraid of?</p>
              <textarea className="hfm-textarea" value={fearText}
                onChange={e => setFearText(e.target.value)}
                placeholder="e.g. They say no and I look stupid..."
                rows={3} />
            </div>
          )}

          {/* Step 3: Origin */}
          {step === 3 && (
            <div className="hfm-step">
              <div className="hfm-step-num">Step 3 of 7</div>
              <h3 className="hfm-question">When did you first learn this wasn't safe?</h3>
              <p className="hfm-sub">You didn't wake up with this fear. Something happened that created it.</p>
              <textarea className="hfm-textarea" value={originText}
                onChange={e => setOriginText(e.target.value)}
                placeholder="e.g. When I was 12, I shared something I was proud of and..."
                rows={3} />
            </div>
          )}

          {/* Step 4: Insight */}
          {step === 4 && (
            <div className="hfm-step">
              <div className="hfm-step-num">Step 4 of 7</div>
              <h3 className="hfm-question">Now we can see how this formed</h3>
              <div className="hfm-insight-card">
                <p>When "{originText.trim().slice(0, 100)}" happened, you felt afraid of "{fearText.trim().slice(0, 80)}".</p>
                <p>Your system created <strong>{patternMeta?.name}</strong> to protect you from that ever happening again.</p>
                <p>That's why "{taskText}" doesn't feel safe. Your {patternMeta?.name} is doing its job.</p>
                <p className="hfm-insight-but">But that was then. This is now.</p>
              </div>
            </div>
          )}

          {/* Step 5: Rewire */}
          {step === 5 && (
            <div className="hfm-step">
              <div className="hfm-step-num">Step 5 of 7</div>
              <h3 className="hfm-question">What's true now that wasn't true then?</h3>
              <p className="hfm-sub">You were younger. You had less power. What's different now?</p>
              <textarea className="hfm-textarea" value={rewireText}
                onChange={e => setRewireText(e.target.value)}
                placeholder="e.g. I'm not 12 anymore. I can handle rejection. I've done harder things..."
                rows={3} />
            </div>
          )}

          {/* Step 6: Go Deeper */}
          {step === 6 && (
            <div className="hfm-step">
              <div className="hfm-step-num">Step 6 of 7</div>
              <h3 className="hfm-question">Want to go deeper?</h3>
              <div className="hfm-education">
                <p>Your mind now understands the pattern.</p>
                <p>But your nervous system still holds the original charge. Until the body releases it, {patternMeta?.name} will keep showing up.</p>
                <p className="hfm-education-bold">That's why somatic work creates shifts that thinking alone can't.</p>
              </div>
              <div className="hfm-deeper-options">
                {!clickedBook ? (
                  <>
                    <button className="hfm-deeper-btn hfm-deeper-primary"
                      onClick={() => { window.open('https://calendly.com/huzz-nichuzz/30min', '_blank', 'noopener,noreferrer'); setClickedBook(true) }}>
                      Book a session with Huzz
                    </button>
                    <button className="hfm-deeper-btn hfm-deeper-secondary" disabled>
                      Self-guided release (coming soon)
                    </button>
                    <button className="hfm-deeper-btn hfm-deeper-skip" onClick={handleNext}>
                      Continue on my own →
                    </button>
                  </>
                ) : (
                  <>
                    <button className="hfm-deeper-btn hfm-deeper-primary" onClick={handleNext}>
                      I've booked, continue →
                    </button>
                    <button className="hfm-deeper-btn hfm-deeper-skip" onClick={() => setClickedBook(false)}>
                      See options again
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Step 7: Expect the Best */}
          {step === 7 && (
            <div className="hfm-step">
              <div className="hfm-step-num">Step 7 of 7</div>
              <h3 className="hfm-question">Now expect the best outcome</h3>
              <p className="hfm-sub">You faced the worst case. Now flip it. If "{taskText}" goes perfectly, what does that look like?</p>
              <textarea className="hfm-textarea" value={expectationText}
                onChange={e => setExpectationText(e.target.value)}
                placeholder="e.g. They say yes, we shake hands, and I feel proud of myself..."
                rows={3} />
              <p className="hfm-trick">Secret trick: Now tell yourself this before you do it and watch anxiety turn into excitement</p>
            </div>
          )}

          {/* Done: Share prompt */}
          {step === 'done' && (
            <div className="hfm-step">
              <h3 className="hfm-question">Healing Flow Complete</h3>
              <p className="hfm-sub">You faced the fear, found its origin, and rewired the narrative.</p>
              <textarea className="hfm-textarea" value={shareCaption}
                onChange={e => setShareCaption(e.target.value)}
                placeholder="What would you like to share? (optional)"
                rows={2} />
              <div className="hfm-deeper-options">
                <button className="hfm-deeper-btn hfm-deeper-primary" disabled={sharingHealing}
                  onClick={async () => {
                    setSharingHealing(true)
                    postFeedEvent(userId, 'shared_healing',
                      'Completed a healing flow',
                      shareCaption.trim() || null)
                    hapticSuccess()
                    onComplete?.()
                    onClose()
                  }}>
                  {sharingHealing ? 'Sharing...' : 'Share with the community'}
                </button>
                <button className="hfm-deeper-btn hfm-deeper-skip" onClick={() => { onComplete?.(); onClose() }}>
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer — skip for step 6 and done (have their own buttons) */}
        {step !== 6 && step !== 'done' && (
          <div className="hfm-footer">
            {step > 1 && (
              <button className="hfm-back" onClick={() => setStep(step - 1)}>← Back</button>
            )}
            <button className="hfm-next" disabled={!canContinue() || saving}
              onClick={handleNext}>
              {saving ? 'Saving...' : step === 7 ? 'Complete 💚' : 'Continue →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
