import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import './FlowFeedback.css'

const ENJOYMENT_OPTIONS = [
  { value: 'loved_it', label: 'Loved it', emoji: '💚', description: 'This was exactly what I needed' },
  { value: 'liked_it', label: 'Liked it', emoji: '👍', description: 'Good experience overall' },
  { value: 'okay', label: 'It was okay', emoji: '😐', description: "Some parts worked, some didn't" },
  { value: 'not_for_me', label: 'Not for me', emoji: '👎', description: "Didn't resonate with my style" }
]

const TIMING_OPTIONS = [
  { value: 'too_short', label: 'Too short', description: 'I wanted to go deeper' },
  { value: 'just_right', label: 'Just right', description: 'Perfect amount of time' },
  { value: 'bit_long', label: 'A bit long', description: 'Could be tightened up' },
  { value: 'too_long', label: 'Too long', description: 'Lost focus partway through' }
]

/**
 * FlowFeedback - Collapsible feedback accordion for flow completion
 *
 * @param {string} flowType - Type of flow (e.g., 'attraction_offer', 'nervous_system')
 * @param {string} userId - User ID for authenticated users (optional)
 * @param {string} sessionToken - Session token for public users (optional)
 * @param {function} onSubmit - Callback after successful submission (optional)
 */
export default function FlowFeedback({ flowType, userId, sessionToken, onSubmit }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const [enjoymentRating, setEnjoymentRating] = useState(null)
  const [timingRating, setTimingRating] = useState(null)
  const [enjoyedComment, setEnjoyedComment] = useState('')
  const [improvementComment, setImprovementComment] = useState('')

  const handleSubmit = async () => {
    // Don't submit if nothing filled out
    if (!enjoymentRating && !timingRating && !enjoyedComment.trim() && !improvementComment.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('flow_feedback')
        .insert({
          flow_type: flowType,
          user_id: userId || null,
          session_token: sessionToken || null,
          enjoyment_rating: enjoymentRating,
          timing_rating: timingRating,
          enjoyed_comment: enjoyedComment.trim() || null,
          improvement_comment: improvementComment.trim() || null
        })

      if (error) {
        console.error('Error submitting feedback:', error)
        // Still show success to user - don't block their experience
      }

      setIsSubmitted(true)
      if (onSubmit) onSubmit()
    } catch (err) {
      console.error('Error submitting feedback:', err)
      setIsSubmitted(true) // Show success anyway
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="flow-feedback flow-feedback-submitted">
        <div className="flow-feedback-thanks">
          <span className="thanks-emoji">🙏</span>
          <span>Thanks for your feedback!</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flow-feedback">
      <button
        className="flow-feedback-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        <span className="toggle-text">Share your feedback</span>
        <span className="toggle-hint">(optional)</span>
      </button>

      {isExpanded && (
        <div className="flow-feedback-content">
          {/* Question 1: Enjoyment */}
          <div className="feedback-question">
            <label className="feedback-label">Did you enjoy this flow?</label>
            <div className="feedback-options enjoyment-options">
              {ENJOYMENT_OPTIONS.map(option => (
                <button
                  key={option.value}
                  className={`feedback-option ${enjoymentRating === option.value ? 'selected' : ''}`}
                  onClick={() => setEnjoymentRating(option.value)}
                  title={option.description}
                >
                  <span className="option-emoji">{option.emoji}</span>
                  <span className="option-label">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: Timing */}
          <div className="feedback-question">
            <label className="feedback-label">How was the timing?</label>
            <div className="feedback-options timing-options">
              {TIMING_OPTIONS.map(option => (
                <button
                  key={option.value}
                  className={`feedback-option timing-option ${timingRating === option.value ? 'selected' : ''}`}
                  onClick={() => setTimingRating(option.value)}
                  title={option.description}
                >
                  <span className="option-label">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Question 3: What worked */}
          <div className="feedback-question">
            <label className="feedback-label">One thing you enjoyed and wouldn't change?</label>
            <textarea
              className="feedback-textarea"
              placeholder="What worked well for you?"
              value={enjoyedComment}
              onChange={(e) => setEnjoyedComment(e.target.value)}
              rows={2}
            />
          </div>

          {/* Question 4: Improvement */}
          <div className="feedback-question">
            <label className="feedback-label">One thing you would change to improve it?</label>
            <textarea
              className="feedback-textarea"
              placeholder="Any suggestions?"
              value={improvementComment}
              onChange={(e) => setImprovementComment(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit */}
          <button
            className="feedback-submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Submit Feedback'}
          </button>
        </div>
      )}
    </div>
  )
}
