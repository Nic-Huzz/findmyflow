/**
 * PostActionModal - 3% Reflection after completing action milestones
 *
 * Shows after completing specific milestones to capture:
 * - What went well
 * - What would you do differently
 * - Key insight
 *
 * Part of the Action Loop system.
 */

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabaseClient'
import './PostActionModal.css'

// Milestones that trigger POST-ACTION
export const POST_ACTION_MILESTONE_IDS = [
  // Stage 6 - Pre-Launch
  'milestone_launch_sequence',
  'milestone_content_plan',
  'milestone_lead_capture',
  'milestone_nurture_sequence',
  'milestone_crm_setup',
  // Stage 7 - Launch
  'milestone_attraction_offer_launched',
  'daily_implementation',
  'milestone_post_launch_review'
]

// Contextual questions based on milestone type
const MILESTONE_CONTEXT = {
  // Stage 6 - Pre-Launch
  milestone_launch_sequence: {
    title: 'Launch Sequence Complete!',
    question: 'What did you learn about your launch approach?'
  },
  milestone_content_plan: {
    title: 'Content Plan Complete!',
    question: 'What did you learn about your content strategy?'
  },
  milestone_lead_capture: {
    title: 'Lead Capture Setup Complete!',
    question: 'What did you learn about capturing leads?'
  },
  milestone_nurture_sequence: {
    title: 'Nurture Sequence Complete!',
    question: 'What did you learn about nurturing leads?'
  },
  milestone_crm_setup: {
    title: 'CRM & Tracking Setup Complete!',
    question: 'What did you learn about tracking your business?'
  },
  // Stage 7 - Launch
  milestone_attraction_offer_launched: {
    title: 'Attraction Offer Launched!',
    question: 'What did you learn from launching your offer?'
  },
  daily_implementation: {
    title: 'Daily Implementation Complete!',
    question: 'What patterns are you noticing in your daily actions?'
  },
  milestone_post_launch_review: {
    title: 'Post-Launch Review Complete!',
    question: 'What will you do differently in your next launch?'
  }
}

function PostActionModal({ quest, userId, onComplete, onSkip }) {
  const [step, setStep] = useState('reflection') // reflection | insight
  const [wentWell, setWentWell] = useState('')
  const [doDifferently, setDoDifferently] = useState('')
  const [keyInsight, setKeyInsight] = useState('')
  const [saving, setSaving] = useState(false)

  const context = MILESTONE_CONTEXT[quest.id] || {
    title: 'Task Complete!',
    question: 'What did you learn?'
  }

  const handleSave = async () => {
    if (!wentWell.trim() && !doDifferently.trim() && !keyInsight.trim()) {
      onSkip?.()
      return
    }

    setSaving(true)
    try {
      await supabase.from('post_action_reflections').insert({
        user_id: userId,
        quest_id: quest.id,
        quest_name: quest.name,
        went_well: wentWell.trim() || null,
        do_differently: doDifferently.trim() || null,
        key_insight: keyInsight.trim() || null,
        created_at: new Date().toISOString()
      })

      onComplete?.()
    } catch (error) {
      console.error('Error saving post-action reflection:', error)
      onComplete?.() // Continue anyway
    } finally {
      setSaving(false)
    }
  }

  const handleNext = () => {
    if (step === 'reflection') {
      setStep('insight')
    } else {
      handleSave()
    }
  }

  return createPortal(
    <div className="post-action-overlay">
      <div className="post-action-modal">
        <div className="post-action-header">
          <span className="post-action-icon">💭</span>
          <h2>{context.title}</h2>
          <p className="post-action-subtitle">Quick reflection (3%)</p>
        </div>

        {step === 'reflection' && (
          <div className="post-action-content">
            <div className="post-action-question">
              <label>What went well?</label>
              <textarea
                value={wentWell}
                onChange={(e) => setWentWell(e.target.value)}
                placeholder="The parts that clicked or worked..."
                rows={3}
              />
            </div>

            <div className="post-action-question">
              <label>What would you do differently?</label>
              <textarea
                value={doDifferently}
                onChange={(e) => setDoDifferently(e.target.value)}
                placeholder="If you did this again..."
                rows={3}
              />
            </div>

            <div className="post-action-actions">
              <button className="skip-btn" onClick={onSkip}>
                Skip
              </button>
              <button
                className="continue-btn"
                onClick={handleNext}
                disabled={!wentWell.trim() && !doDifferently.trim()}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'insight' && (
          <div className="post-action-content">
            <div className="post-action-question insight">
              <label>{context.question}</label>
              <textarea
                value={keyInsight}
                onChange={(e) => setKeyInsight(e.target.value)}
                placeholder="The one thing you'll remember..."
                rows={4}
                autoFocus
              />
            </div>

            <div className="post-action-actions">
              <button className="skip-btn" onClick={() => setStep('reflection')}>
                Back
              </button>
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Done'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default PostActionModal
