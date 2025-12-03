import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './auth/AuthProvider'
import { sanitizeText } from './lib/sanitize'

const Feedback = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [existingFeedback, setExistingFeedback] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    finding_flow_feeling: '',
    essence_initial_feeling: '',
    essence_accuracy: '',
    protective_impact: '',
    portal_navigation: '',
    portal_feeling: '',
    what_loved: '',
    recommendation: '',
    feature_idea: ''
  })

  useEffect(() => {
    if (user?.id) {
      loadExistingFeedback()
    }
  }, [user])

  const loadExistingFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle() // Use maybeSingle() instead of single() - doesn't error on 0 rows

      if (error) {
        console.error('Error loading feedback:', error)
      } else if (data) {
        setExistingFeedback(data)
        setFormData({
          finding_flow_feeling: data.finding_flow_feeling || '',
          essence_initial_feeling: data.essence_initial_feeling || '',
          essence_accuracy: data.essence_accuracy || '',
          protective_impact: data.protective_impact || '',
          portal_navigation: data.portal_navigation || '',
          portal_feeling: data.portal_feeling || '',
          what_loved: data.what_loved || '',
          recommendation: data.recommendation || '',
          feature_idea: data.feature_idea || ''
        })
      }
    } catch (error) {
      console.log('Error in loadExistingFeedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTextChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccessMessage('')

    try {
      // Sanitize text inputs
      const sanitizedData = {
        user_id: user.id,
        finding_flow_feeling: formData.finding_flow_feeling || null,
        essence_initial_feeling: formData.essence_initial_feeling || null,
        essence_accuracy: formData.essence_accuracy || null,
        protective_impact: formData.protective_impact || null,
        portal_navigation: formData.portal_navigation || null,
        portal_feeling: formData.portal_feeling || null,
        what_loved: formData.what_loved ? sanitizeText(formData.what_loved) : null,
        recommendation: formData.recommendation ? sanitizeText(formData.recommendation) : null,
        feature_idea: formData.feature_idea ? sanitizeText(formData.feature_idea) : null
      }

      let error

      if (existingFeedback) {
        // Update existing feedback
        const result = await supabase
          .from('user_feedback')
          .update(sanitizedData)
          .eq('user_id', user.id)
        error = result.error
      } else {
        // Insert new feedback
        const result = await supabase
          .from('user_feedback')
          .insert([sanitizedData])
        error = result.error
      }

      if (error) throw error

      setSuccessMessage(existingFeedback ? 'Feedback updated successfully! 🎉' : 'Thank you for your feedback! 🎉')

      // Mark bonus quest as complete if not already submitted
      if (!existingFeedback) {
        try {
          // Check if user has active challenge progress
          const { data: progressData } = await supabase
            .from('challenge_progress')
            .select('challenge_instance_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle()

          if (progressData?.challenge_instance_id) {
            // Check if quest already completed
            const { data: existingCompletion } = await supabase
              .from('quest_completions')
              .select('id')
              .eq('user_id', user.id)
              .eq('challenge_instance_id', progressData.challenge_instance_id)
              .eq('quest_id', 'bonus_feedback')
              .maybeSingle()

            // Only create completion if it doesn't exist
            if (!existingCompletion) {
              await supabase
                .from('quest_completions')
                .insert([{
                  user_id: user.id,
                  challenge_instance_id: progressData.challenge_instance_id,
                  quest_id: 'bonus_feedback',
                  quest_category: 'Bonus',
                  quest_type: 'anytime',
                  points_earned: 10,
                  reflection_text: 'Completed feedback form',
                  challenge_day: null
                }])

              console.log('✅ Bonus quest "Feedback Form" auto-completed')
            }
          }
        } catch (questError) {
          console.error('Could not auto-complete bonus quest:', questError)
          // Don't throw - feedback was saved successfully
        }
      }

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' })

      // Reload feedback
      await loadExistingFeedback()

    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Error submitting feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="feedback-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <button onClick={() => navigate('/me')} className="back-button">
          ← Back to Profile
        </button>
        <h1>Share Your Feedback</h1>
        <p className="feedback-subtitle">
          Help us improve Find My Flow by sharing your honest thoughts and experiences
        </p>
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="feedback-form">

        {/* Section 1: Premise */}
        <div className="feedback-section">
          <h2>1. Finding Your Flow</h2>
          <div className="question">
            <label>How does the idea of Finding Your Flow make you feel?</label>
            <div className="radio-group">
              {['Excited', 'Curious & open to it', 'Don\'t believe in it'].map(option => (
                <label key={option} className="radio-option">
                  <input
                    type="radio"
                    name="finding_flow_feeling"
                    value={option}
                    checked={formData.finding_flow_feeling === option}
                    onChange={(e) => handleSelectChange('finding_flow_feeling', e.target.value)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Essence Voice */}
        <div className="feedback-section">
          <h2>2. Essence Voice Feedback</h2>

          <div className="question">
            <label>When you were given your essence voice, how did you feel?</label>
            <div className="radio-group">
              {['Excited', 'Curious', 'Bored'].map(option => (
                <label key={option} className="radio-option">
                  <input
                    type="radio"
                    name="essence_initial_feeling"
                    value={option}
                    checked={formData.essence_initial_feeling === option}
                    onChange={(e) => handleSelectChange('essence_initial_feeling', e.target.value)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="question">
            <label>When you went through your essence voice profile, did you feel:</label>
            <div className="radio-group">
              {['Seen', 'Like it was half right', 'Not really right'].map(option => (
                <label key={option} className="radio-option">
                  <input
                    type="radio"
                    name="essence_accuracy"
                    value={option}
                    checked={formData.essence_accuracy === option}
                    onChange={(e) => handleSelectChange('essence_accuracy', e.target.value)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Protective Voice */}
        <div className="feedback-section">
          <h2>3. Protective Voice Feedback</h2>

          <div className="question">
            <label>How much do you feel the identified protective voice is negatively impacting your ambitions?</label>
            <div className="radio-group">
              {['Struggling with it lots', 'Occasionally', 'Not at all'].map(option => (
                <label key={option} className="radio-option">
                  <input
                    type="radio"
                    name="protective_impact"
                    value={option}
                    checked={formData.protective_impact === option}
                    onChange={(e) => handleSelectChange('protective_impact', e.target.value)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: 7-Day Challenge Portal */}
        <div className="feedback-section">
          <h2>4. 7-Day Challenge Portal</h2>

          <div className="question">
            <label>When you first landed on the 7-Day Challenge portal, how easy was it to navigate and figure out?</label>
            <div className="radio-group">
              {[
                "Super intuitive: Finding the list of challenges for the 4R's was easy",
                'Took me a minute but I got it',
                'Super confused, needed to ask for help'
              ].map(option => (
                <label key={option} className="radio-option">
                  <input
                    type="radio"
                    name="portal_navigation"
                    value={option}
                    checked={formData.portal_navigation === option}
                    onChange={(e) => handleSelectChange('portal_navigation', e.target.value)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="question">
            <label>When you started looking through the challenges, portal, leaderboard, how did you feel?</label>
            <div className="radio-group">
              {['Excited', 'Curious', 'Overwhelmed'].map(option => (
                <label key={option} className="radio-option">
                  <input
                    type="radio"
                    name="portal_feeling"
                    value={option}
                    checked={formData.portal_feeling === option}
                    onChange={(e) => handleSelectChange('portal_feeling', e.target.value)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Section 5: Open-Ended Questions */}
        <div className="feedback-section">
          <h2>5. Your Thoughts & Ideas</h2>

          <div className="question">
            <label>What's one thing you loved and definitely wouldn't change?</label>
            <textarea
              value={formData.what_loved}
              onChange={(e) => handleTextChange('what_loved', e.target.value)}
              placeholder="Share what resonated with you..."
              rows="4"
            />
          </div>

          <div className="question">
            <label>What's one recommendation to improve things?</label>
            <textarea
              value={formData.recommendation}
              onChange={(e) => handleTextChange('recommendation', e.target.value)}
              placeholder="What could be better?"
              rows="4"
            />
          </div>

          <div className="question">
            <label>Feature Idea: Any idea for features, things to include, or ways to improve?</label>
            <textarea
              value={formData.feature_idea}
              onChange={(e) => handleTextChange('feature_idea', e.target.value)}
              placeholder="Dream big! What would make this even better?"
              rows="4"
            />
          </div>
        </div>

        <div className="feedback-actions">
          <button
            type="submit"
            className="submit-button"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
          </button>

          {existingFeedback && (
            <p className="update-note">
              You submitted feedback on {new Date(existingFeedback.created_at).toLocaleDateString()}.
              You can update it anytime!
            </p>
          )}
        </div>
      </form>
    </div>
  )
}

export default Feedback
