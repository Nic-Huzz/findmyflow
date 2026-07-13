import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './UnstickFlow.css'

/**
 * UnstickFlow — 3-step guided flow to break through stuckness.
 * Follows HealingFlowModal pattern (multi-step, modal overlay).
 * Step 3 auto-creates a wahoo linked to the user's most recent active quest.
 *
 * Props:
 *  - userId: string
 *  - heroStage: number (for context-aware copy)
 *  - onClose: () => void
 *  - onWahooCreated: () => void (called after step 3 creates the wahoo)
 */
export default function UnstickFlow({ userId, heroStage, onClose, onWahooCreated }) {
  const [step, setStep] = useState(1)
  const [avoiding, setAvoiding] = useState('')
  const [worstCase, setWorstCase] = useState('')
  const [smallestStep, setSmallestStep] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!smallestStep.trim() || saving) return
    setSaving(true)

    try {
      // Find user's most recent active quest to link the wahoo to
      const { data: quests } = await supabase
        .from('quests')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      const questId = quests?.[0]?.id || null

      // Create a groan challenge (wahoo) from the smallest step
      const { data: challenge } = await supabase
        .from('groan_challenges')
        .insert({
          user_id: userId,
          title: smallestStep.trim(),
          description: `Unstick flow: Avoiding "${avoiding.trim()}". Fear: "${worstCase.trim()}". Smallest step: "${smallestStep.trim()}"`,
          status: 'active',
          challenge_source: 'unstick_flow',
          wahoo_category: 'connection', // Default category
        })
        .select('id')
        .single()

      // Link to quest if one exists
      if (questId && challenge?.id) {
        await supabase.from('quest_tasks').insert({
          user_id: userId,
          quest_id: questId,
          label: smallestStep.trim(),
          is_courage_challenge: true,
          groan_challenge_id: challenge.id,
        })
      }

      onWahooCreated?.()
    } catch (e) {
      console.error('UnstickFlow error:', e)
      setSaving(false)
    }
  }

  return (
    <div className="uf-overlay" onClick={onClose}>
      <div className="uf-modal" onClick={e => e.stopPropagation()}>
        <button className="uf-close" onClick={onClose}>&times;</button>

        {/* Step dots */}
        <div className="uf-dots">
          {[1, 2, 3].map(n => (
            <span key={n} className={`uf-dot ${step >= n ? 'uf-dot-filled' : ''}`} />
          ))}
        </div>

        {step === 1 && (
          <>
            <span className="uf-step-icon">🧭</span>
            <h2 className="uf-title">What's the thing you've been avoiding?</h2>
            <p className="uf-subtitle">Not the thing you should do. The thing you keep not doing.</p>
            <textarea
              className="uf-input"
              value={avoiding}
              onChange={e => setAvoiding(e.target.value)}
              placeholder="e.g. sharing my work publicly, having that conversation, going to a class"
              rows={3}
            />
            <button
              className="uf-btn"
              disabled={!avoiding.trim()}
              onClick={() => setStep(2)}
            >
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <span className="uf-step-icon">😰</span>
            <h2 className="uf-title">If you did that, what's the worst that could happen?</h2>
            <textarea
              className="uf-input"
              value={worstCase}
              onChange={e => setWorstCase(e.target.value)}
              placeholder="e.g. people would judge me, I'd fail, it wouldn't be good enough"
              rows={3}
            />
            {worstCase.trim() && (
              <p className="uf-reframe">That's the voice talking. Not you.</p>
            )}
            <button
              className="uf-btn"
              disabled={!worstCase.trim()}
              onClick={() => setStep(3)}
            >
              Continue
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <span className="uf-step-icon">🌱</span>
            <h2 className="uf-title">What's the smallest version you could do this week?</h2>
            <p className="uf-subtitle">Not the brave version. The version that barely scares you.</p>
            <textarea
              className="uf-input"
              value={smallestStep}
              onChange={e => setSmallestStep(e.target.value)}
              placeholder="e.g. send one message, attend one class, write one paragraph"
              rows={3}
            />
            <button
              className="uf-btn uf-btn-gold"
              disabled={!smallestStep.trim() || saving}
              onClick={handleSubmit}
            >
              {saving ? 'Creating...' : 'Add to Courage Tab'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
