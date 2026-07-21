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

export default function WeeklyReview({ userId, weekStart, onComplete, onClose }) {
  const [narrativeRevision, setNarrativeRevision] = useState('')
  const [identityDid, setIdentityDid] = useState(null)
  const [identityText, setIdentityText] = useState('')
  const [compoundingText, setCompoundingText] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedReview, setSavedReview] = useState(null)

  const isValid = narrativeRevision.trim().length > 0 && compoundingText.trim().length > 0

  async function handleSubmit() {
    if (!isValid || saving) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('weekly_reviews')
        .insert({
          user_id: userId,
          week_start: weekStart,
          narrative_revision: narrativeRevision.trim() || null,
          identity_did: identityDid,
          identity_text: identityText.trim() || null,
          compounding_text: compoundingText.trim() || null,
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
          <div className="wr-progress-fill" style={{ width: `${Math.round(([narrativeRevision, identityDid !== null, compoundingText].filter(Boolean).length / 3) * 100)}%` }} />
        </div>

        <div className="wr-form">
          {/* Q1: Narrative Revision */}
          <div className="wr-question">
            <div className="wr-question-top">
              <span className="wr-question-icon">🪞</span>
              <span className="wr-question-label">Identity Shift</span>
            </div>
            <p className="wr-question-text">Old me would have ___. Instead I ___.</p>
            <textarea
              className="wr-textarea"
              value={narrativeRevision}
              onChange={e => setNarrativeRevision(e.target.value)}
              placeholder="Old me would have stayed quiet. Instead I spoke up."
              maxLength={300}
            />
          </div>

          {/* Q2: Procrastination */}
          <div className="wr-question">
            <div className="wr-question-top">
              <span className="wr-question-icon">⏳</span>
              <span className="wr-question-label">Procrastination</span>
            </div>
            <p className="wr-question-text">Did procrastination stop you from doing something this week?</p>
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
                placeholder="What did you put off?"
                maxLength={200}
              />
            )}
          </div>

          {/* Q3: Proudest brave thing */}
          <div className="wr-question">
            <div className="wr-question-top">
              <span className="wr-question-icon">🔥</span>
              <span className="wr-question-label">Courage</span>
            </div>
            <p className="wr-question-text">What's the one brave thing you're most proud of?</p>
            <textarea
              className="wr-textarea"
              value={compoundingText}
              onChange={e => setCompoundingText(e.target.value)}
              placeholder="I finally..."
              maxLength={200}
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
