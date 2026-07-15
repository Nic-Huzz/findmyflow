/**
 * WeeklyReview.jsx
 *
 * 7-question weekly self-audit of T4 multipliers.
 * Single scrollable form, all questions on one page.
 * 15 RP on completion, +5 RP for sharing.
 * Does NOT affect Capacity Score.
 *
 * CSS prefix: wr-
 * Created: 2026-06-14
 */

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getWeekStartLocal } from '../lib/dateUtils'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import confetti from 'canvas-confetti'
import WeeklyReviewCard from './WeeklyReviewCard'
import './WeeklyReview.css'

const ENV_OPTIONS = [
  { id: 'yes', label: 'Yes' },
  { id: 'mostly', label: 'Mostly' },
  { id: 'no', label: 'No' },
]

export default function WeeklyReview({ userId, weekStart, onComplete, onClose }) {
  const [environment, setEnvironment] = useState(null)
  const [networkText, setNetworkText] = useState('')
  const [betSizingText, setBetSizingText] = useState('')
  const [identityDid, setIdentityDid] = useState(null)
  const [identityText, setIdentityText] = useState('')
  const [compoundingDid, setCompoundingDid] = useState(null)
  const [compoundingText, setCompoundingText] = useState('')
  const [learningText, setLearningText] = useState('')
  const [attentionHours, setAttentionHours] = useState('')
  const [narrativeRevision, setNarrativeRevision] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedReview, setSavedReview] = useState(null)

  const filledTextFields = [networkText, betSizingText, identityText, compoundingText, learningText]
    .filter(t => t.trim()).length
  const isValid = environment && filledTextFields >= 2

  async function handleSubmit() {
    if (!isValid || saving) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('weekly_reviews')
        .insert({
          user_id: userId,
          week_start: weekStart,
          environment,
          network_text: networkText.trim() || null,
          bet_sizing_text: betSizingText.trim() || null,
          identity_did: identityDid,
          identity_text: identityText.trim() || null,
          compounding_did: compoundingDid,
          compounding_text: compoundingText.trim() || null,
          learning_text: learningText.trim() || null,
          attention_hours: attentionHours ? Number(attentionHours) : null,
          narrative_revision: narrativeRevision.trim() || null,
        })
        .select()
        .single()
      if (error) throw error

      await supabase.rpc('increment_scores', {
        p_user_id: userId,
        p_project_id: null,
        p_category: 'healing',
        p_points: 15,
        p_week_start: getWeekStartLocal(),
      })

      hapticSuccess()
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } })
      setSavedReview(data)

      // Mystery box: 4th weekly review
      supabase.from('weekly_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .then(({ count }) => {
          if (count === 4) import('../lib/mysteryBoxes').then(m => m.earnMysteryBox(userId, 'weekly_review_streak_4', 'silver'))
        }).catch(() => {})

      onComplete?.()
    } catch (err) {
      console.error('Weekly review save error:', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleShare() {
    if (!savedReview) return
    try {
      await supabase
        .from('weekly_reviews')
        .update({ shared: true })
        .eq('id', savedReview.id)
      await supabase.rpc('increment_scores', {
        p_user_id: userId,
        p_project_id: null,
        p_category: 'healing',
        p_points: 5,
        p_week_start: getWeekStartLocal(),
      })
      onComplete?.()
    } catch (err) {
      console.error('Share bonus error:', err)
    }
  }

  // Format week label
  const weekLabel = (() => {
    const d = new Date(weekStart + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })()

  if (savedReview) {
    return (
      <div className="wr-overlay" onClick={onClose}>
        <div className="wr-modal" onClick={e => e.stopPropagation()}>
          <WeeklyReviewCard
            review={savedReview}
            weekLabel={weekLabel}
            onShare={handleShare}
            onClose={onClose}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="wr-overlay" onClick={onClose}>
      <div className="wr-modal" onClick={e => e.stopPropagation()}>
        <div className="wr-header">
          <div className="wr-header-left">
            <div className="wr-header-icon">⚡</div>
            <div>
              <h2 className="wr-title">Weekly Multipliers</h2>
              <p className="wr-week">Week of {weekLabel}</p>
            </div>
          </div>
          <button className="wr-close" onClick={onClose}>&times;</button>
        </div>

        <div className="wr-progress">
          <div className="wr-progress-fill" style={{ width: `${Math.round(([environment, networkText, betSizingText, identityDid !== null, compoundingDid !== null, learningText, attentionHours].filter(Boolean).length / 7) * 100)}%` }} />
        </div>

        <div className="wr-form">
          {/* Q1: Environment */}
          <div className="wr-question">
            <div className="wr-question-top">
              <span className="wr-question-icon">🏠</span>
              <span className="wr-question-label">Environment</span>
            </div>
            <p className="wr-question-text">Was the right move the easy move this week?</p>
            <div className="wr-option-row">
              {ENV_OPTIONS.map(o => (
                <button
                  key={o.id}
                  type="button"
                  className={`wr-option-btn ${environment === o.id ? 'selected' : ''}`}
                  onClick={() => { hapticLight(); setEnvironment(o.id) }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q2: Network */}
          <div className="wr-question">
            <div className="wr-question-top">
              <span className="wr-question-icon">🤝</span>
              <span className="wr-question-label">Network</span>
            </div>
            <p className="wr-question-text">Who opened a door for you, or whose door did you open?</p>
            <textarea
              className="wr-textarea"
              value={networkText}
              onChange={e => setNetworkText(e.target.value)}
              placeholder="A name or a moment..."
              maxLength={200}
            />
          </div>

          {/* Q3: Bet-Sizing */}
          <div className="wr-question">
            <div className="wr-question-top">
              <span className="wr-question-icon">🚀</span>
              <span className="wr-question-label">Bet-Sizing</span>
            </div>
            <p className="wr-question-text">What did you ship or experiment with?</p>
            <textarea
              className="wr-textarea"
              value={betSizingText}
              onChange={e => setBetSizingText(e.target.value)}
              placeholder="Launched, tested, published..."
              maxLength={200}
            />
          </div>

          {/* Q4: Identity */}
          <div className="wr-question">
            <div className="wr-question-top">
              <span className="wr-question-icon">🪞</span>
              <span className="wr-question-label">Identity</span>
            </div>
            <p className="wr-question-text">Did you behave out of alignment because of fear?</p>
            <div className="wr-option-row">
              <button
                type="button"
                className={`wr-option-btn ${identityDid === true ? 'selected wr-option-negative' : ''}`}
                onClick={() => { hapticLight(); setIdentityDid(true) }}
              >
                Yes
              </button>
              <button
                type="button"
                className={`wr-option-btn ${identityDid === false ? 'selected' : ''}`}
                onClick={() => { hapticLight(); setIdentityDid(false) }}
              >
                No
              </button>
            </div>
            {identityDid && (
              <textarea
                className="wr-textarea wr-textarea-conditional"
                value={identityText}
                onChange={e => setIdentityText(e.target.value)}
                placeholder="What happened?"
                maxLength={200}
              />
            )}
          </div>

          {/* Q5: Compounding */}
          <div className="wr-question">
            <div className="wr-question-top">
              <span className="wr-question-icon">📈</span>
              <span className="wr-question-label">Compounding</span>
            </div>
            <p className="wr-question-text">Did you stay consistent on the boring thing?</p>
            <div className="wr-option-row">
              <button
                type="button"
                className={`wr-option-btn ${compoundingDid === true ? 'selected' : ''}`}
                onClick={() => { hapticLight(); setCompoundingDid(true) }}
              >
                Yes
              </button>
              <button
                type="button"
                className={`wr-option-btn ${compoundingDid === false ? 'selected wr-option-negative' : ''}`}
                onClick={() => { hapticLight(); setCompoundingDid(false) }}
              >
                No
              </button>
            </div>
            <textarea
              className="wr-textarea wr-textarea-conditional"
              value={compoundingText}
              onChange={e => setCompoundingText(e.target.value)}
              placeholder="Which one?"
              maxLength={200}
            />
          </div>

          {/* Q6: Learning */}
          <div className="wr-question">
            <div className="wr-question-top">
              <span className="wr-question-icon">🧠</span>
              <span className="wr-question-label">Learning</span>
            </div>
            <p className="wr-question-text">What can you do now that you couldn&apos;t last Monday?</p>
            <textarea
              className="wr-textarea"
              value={learningText}
              onChange={e => setLearningText(e.target.value)}
              placeholder="A new skill, insight, or ability..."
              maxLength={200}
            />
          </div>

          {/* Q7: Attention */}
          <div className="wr-question">
            <div className="wr-question-top">
              <span className="wr-question-icon">⏱</span>
              <span className="wr-question-label">Attention</span>
            </div>
            <p className="wr-question-text">Longest deep work block this week?</p>
            <div className="wr-number-row">
              <input
                type="number"
                className="wr-number-input"
                value={attentionHours}
                onChange={e => setAttentionHours(e.target.value)}
                min="0"
                max="24"
                step="0.5"
                placeholder="0"
              />
              <span className="wr-number-suffix">hours</span>
            </div>
          </div>

          {/* Q8: Your Story This Week (Identity Narrative Revision) */}
          <div className="wr-question wr-question-narrative">
            <div className="wr-question-top">
              <span className="wr-question-icon">📖</span>
              <span className="wr-question-label">Your Story This Week</span>
            </div>
            <p className="wr-question-text">Complete this sentence:</p>
            <p className="wr-narrative-prompt">This week, the old me would have ___. Instead, I ___.</p>
            <textarea
              className="wr-textarea"
              value={narrativeRevision}
              onChange={e => setNarrativeRevision(e.target.value)}
              placeholder="e.g. ...hidden from the hard conversation. Instead, I said what I actually felt."
              rows={3}
            />
          </div>
        </div>

        <div className="wr-footer">
          <button
            className="wr-submit"
            disabled={!isValid || saving}
            onClick={handleSubmit}
          >
            {saving ? 'Saving...' : 'Complete Review (+15 RP)'}
          </button>
        </div>
      </div>
    </div>
  )
}
