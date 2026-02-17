/**
 * LetsPlayReviewFlow - Reflection quest for Let's Play
 *
 * After completing a Let's Play plan and helping someone IRL,
 * users complete this quest to reflect on what happened.
 *
 * Loads pending Let's Play completions and allows reflection.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useAutoSave } from '../hooks/useAutoSave'
import { supabase } from '../lib/supabaseClient'
import '../styles/flow-base.css'
import './LetsPlayFlow.css'

// Outcome rating options
const OUTCOME_RATINGS = [
  { id: 'loved_it', label: 'They loved it', icon: '⭐', description: 'Clear positive impact' },
  { id: 'it_helped', label: 'It helped', icon: '👍', description: 'Made a difference, even small' },
  { id: 'mixed', label: 'Mixed results', icon: '🤷', description: "Some parts worked, some didn't" },
  { id: 'didnt_land', label: "Didn't quite land", icon: '😬', description: 'Felt off or missed the mark' },
  { id: 'not_needed', label: "They didn't need it", icon: '❌', description: 'Wrong problem or wrong person' }
]

// Initial form data
const INITIAL_FORM_DATA = {
  whatHappened: '',
  outcomeRating: null,
  wentWell: '',
  whatSurprised: '',
  threePctBetter: '',
  selectedEnergy: null,  // 'excited' or 'tired'
  selectedFlow: null     // 'ease' or 'resistance'
}

// Calculate direction from energy + flow
const getDirection = (energy, flow) => {
  if (energy === 'excited' && flow === 'ease') return 'north'
  if (energy === 'excited' && flow === 'resistance') return 'east'
  if (energy === 'tired' && flow === 'resistance') return 'south'
  if (energy === 'tired' && flow === 'ease') return 'west'
  return null
}

const getDirectionInfo = (direction) => {
  const info = {
    north: { label: 'Flow', emoji: '🌊', color: '#22c55e' },
    east: { label: 'Redirect', emoji: '🔄', color: '#3b82f6' },
    south: { label: 'Rest', emoji: '🛏️', color: '#ef4444' },
    west: { label: 'Honour', emoji: '🙏', color: '#eab308' }
  }
  return info[direction] || { label: '', emoji: '', color: '' }
}

export default function LetsPlayReviewFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [pendingPlays, setPendingPlays] = useState([])
  const [selectedPlay, setSelectedPlay] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { loadProgress, clearProgress } = useAutoSave('lets_play', user?.id)

  // Scroll to top on step changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  // Load pending Let's Play completions that need review
  useEffect(() => {
    const init = async () => {
      if (!user?.id) return

      setLoading(true)
      try {
        // Get Let's Play completions that are pending review
        const { data: completions, error } = await supabase
          .from('quest_completions')
          .select('id, reflection_text, created_at')
          .eq('user_id', user.id)
          .eq('quest_id', 'lets_play')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading Let\'s Play completions:', error)
          return
        }

        // Filter to only pending reviews
        const pending = (completions || []).filter(c => {
          try {
            const data = JSON.parse(c.reflection_text)
            return data.phase === 'pending_review'
          } catch {
            return false
          }
        }).map(c => {
          const data = JSON.parse(c.reflection_text)
          return {
            id: c.id,
            createdAt: c.created_at,
            ...data
          }
        })

        setPendingPlays(pending)

        // Check localStorage for most recent plan
        const saved = loadProgress()
        if (saved?.completionId && pending.length > 0) {
          const match = pending.find(p => p.id === saved.completionId)
          if (match) {
            setSelectedPlay(match)
            setStep(1) // Skip selection, go to reflection
          }
        }
      } catch (err) {
        console.warn('LetsPlayReviewFlow init error:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [user?.id, loadProgress])

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Validation
  const canContinue = () => {
    switch (step) {
      case 0: return selectedPlay !== null
      case 1: return formData.whatHappened.trim().length >= 10 && formData.outcomeRating !== null
      case 2: return true // Optional fields
      default: return false
    }
  }

  const handleNext = () => {
    if (canContinue()) {
      setStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(prev => prev - 1)
    }
  }

  const handleSelectPlay = (play) => {
    setSelectedPlay(play)
  }

  // Submit reflection
  const handleSubmit = async () => {
    if (isSubmitting || !selectedPlay) return
    setIsSubmitting(true)

    try {
      // Calculate flow direction
      const flowDirection = getDirection(formData.selectedEnergy, formData.selectedFlow)

      // Get the original data and merge with reflection
      const updatedData = {
        ...selectedPlay,
        phase: 'completed',
        what_happened: formData.whatHappened,
        outcome_rating: formData.outcomeRating,
        went_well: formData.wentWell || null,
        what_surprised: formData.whatSurprised || null,
        three_pct_better: formData.threePctBetter || null,
        flow_energy: formData.selectedEnergy || null,
        flow_state: formData.selectedFlow || null,
        flow_direction: flowDirection || null,
        reviewed_at: new Date().toISOString()
      }

      // Update the original Let's Play completion
      const { error: updateError } = await supabase
        .from('quest_completions')
        .update({
          reflection_text: JSON.stringify(updatedData)
        })
        .eq('id', selectedPlay.id)

      if (updateError) {
        console.error('Error updating Let\'s Play:', updateError)
        alert('Failed to save reflection. Please try again.')
        setIsSubmitting(false)
        return
      }

      // Create the review quest completion for bonus points
      const { error: insertError } = await supabase
        .from('quest_completions')
        .insert({
          user_id: user.id,
          challenge_instance_id: null,
          quest_id: 'lets_play_review',
          quest_category: 'Business',
          quest_type: 'Validation',
          points_earned: 4,
          challenge_day: 0,
          reflection_text: JSON.stringify({
            quest_type: 'lets_play_review',
            original_play_id: selectedPlay.id,
            skill_name: selectedPlay.skill_name,
            problem_name: selectedPlay.problem_name,
            person_name: selectedPlay.person_name,
            outcome_rating: formData.outcomeRating,
            what_happened: formData.whatHappened,
            went_well: formData.wentWell || null,
            what_surprised: formData.whatSurprised || null,
            three_pct_better: formData.threePctBetter || null,
            flow_energy: formData.selectedEnergy || null,
            flow_state: formData.selectedFlow || null,
            flow_direction: flowDirection || null
          }),
          project_id: null,
          stage: 1
        })

      if (insertError) {
        console.error('Error creating review completion:', insertError)
        // Don't block - the main update succeeded
      }

      // Clear localStorage
      clearProgress()

      // Navigate back to challenge
      navigate('/7-day-challenge')
    } catch (err) {
      console.error('Let\'s Play Review error:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Character count hint
  const charHint = (value, min) => {
    const len = (value || '').trim().length
    if (len >= min) return <span className="char-hint met">Ready to continue</span>
    return <span className="char-hint">{len}/{min} characters minimum</span>
  }

  if (loading) {
    return (
      <div className="lets-play-flow flow-base">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading your plays...</p>
        </div>
      </div>
    )
  }

  if (pendingPlays.length === 0) {
    return (
      <div className="lets-play-flow flow-base">
        <div className="flow-content">
          <div className="prereq-message">
            <span className="prereq-icon">🎮</span>
            <h2>No Peer-Trials to Review</h2>
            <p>Complete a Let's Play Peer-Trial quest first, then come back to reflect on your experience.</p>
            <button className="primary-button" onClick={() => navigate('/lets-play')}>
              Start a New Peer-Trial
            </button>
            <button className="secondary-button" onClick={() => navigate('/7-day-challenge')}>
              Back to Challenge
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Intro/selection screen (step 0)
  if (step === 0) {
    return (
      <div className="lets-play-flow flow-base">
        <div className="welcome-container">
          <p className="time-icon">📝</p>
          <h1 className="welcome-greeting">Review Your Peer-Trial</h1>
          <div className="welcome-message">
            <p>You've helped someone. Now let's reflect on what happened.</p>
            <p>This is how you learn what works and what doesn't.</p>
          </div>

          {pendingPlays.length === 1 ? (
            <>
              <div className="selected-context" style={{ marginBottom: '24px' }}>
                <span className="context-label">Reviewing:</span>
                <span className="context-value">
                  Helped {pendingPlays[0].person_name} with {pendingPlays[0].problem_name}
                </span>
              </div>
              <button className="primary-button" onClick={() => { setSelectedPlay(pendingPlays[0]); setStep(1); }}>
                Start Reflection
              </button>
            </>
          ) : (
            <>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
                Which play are you reviewing?
              </p>
              <div className="options-list" style={{ marginBottom: '24px' }}>
                {pendingPlays.map(play => (
                  <button
                    key={play.id}
                    type="button"
                    className={`option-card ${selectedPlay?.id === play.id ? 'selected' : ''}`}
                    onClick={() => handleSelectPlay(play)}
                  >
                    <span className="option-icon">🎮</span>
                    <span className="option-name">
                      Helped {play.person_name} with {play.problem_name}
                    </span>
                    <span className="option-desc">
                      {new Date(play.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="primary-button"
                onClick={() => setStep(1)}
                disabled={!selectedPlay}
              >
                Start Reflection
              </button>
            </>
          )}

          <button className="go-back-link" onClick={() => navigate('/7-day-challenge')}>
            Go back
          </button>
        </div>
      </div>
    )
  }

  // Progress dots (for steps 1-2)
  const totalSteps = 2
  const currentStep = step

  return (
    <div className="lets-play-flow flow-base">
      <div className="progress-container">
        <div className="progress-dots">
          {Array.from({ length: totalSteps }, (_, i) => (
            <span
              key={i}
              className={`progress-dot ${i + 1 === currentStep ? 'active' : ''} ${i + 1 < currentStep ? 'completed' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="flow-content">
        {/* Step 1: What Actually Happened? */}
        {step === 1 && (
          <div className="question-container">
            <div className="question-number">Step 1 of 2</div>
            <h2 className="question-text">What Actually Happened?</h2>
            <p className="question-subtext">
              You planned to: "{selectedPlay.plan_description}"
            </p>

            <div className="input-group">
              <label className="input-label">What did you actually do?</label>
              <textarea
                className="textarea"
                placeholder={`What happened when you helped ${selectedPlay.person_name}?`}
                value={formData.whatHappened}
                onChange={(e) => updateField('whatHappened', e.target.value)}
                rows={3}
              />
              {charHint(formData.whatHappened, 10)}
            </div>

            <div className="input-group">
              <label className="input-label">How did it land?</label>
              <div className="options-list">
                {OUTCOME_RATINGS.map(rating => (
                  <button
                    key={rating.id}
                    type="button"
                    className={`option-card ${formData.outcomeRating === rating.id ? 'selected' : ''}`}
                    onClick={() => updateField('outcomeRating', rating.id)}
                  >
                    <span className="option-icon">{rating.icon}</span>
                    <span className="option-name">{rating.label}</span>
                    <span className="option-desc">{rating.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: What Did You Learn? */}
        {step === 2 && (
          <div className="question-container">
            <div className="question-number">Step 2 of 2</div>
            <h2 className="question-text">What Did You Learn?</h2>
            <p className="question-subtext">Every play teaches you something about your flow.</p>

            <div className="input-group">
              <label className="input-label">What went well? <span className="optional">(optional)</span></label>
              <textarea
                className="textarea"
                placeholder="The parts that clicked or worked..."
                value={formData.wentWell}
                onChange={(e) => updateField('wentWell', e.target.value)}
                rows={2}
              />
            </div>

            <div className="input-group">
              <label className="input-label">What surprised you? <span className="optional">(optional)</span></label>
              <textarea
                className="textarea"
                placeholder="Anything unexpected about the experience?"
                value={formData.whatSurprised}
                onChange={(e) => updateField('whatSurprised', e.target.value)}
                rows={2}
              />
            </div>

            <div className="input-group">
              <label className="input-label">How would you make it 3% better next time? <span className="optional">(optional)</span></label>
              <textarea
                className="textarea"
                placeholder="One small tweak for next time..."
                value={formData.threePctBetter}
                onChange={(e) => updateField('threePctBetter', e.target.value)}
                rows={2}
              />
            </div>

            {/* Flow Compass Questions */}
            <div className="input-group" style={{ marginTop: '24px' }}>
              <label className="input-label">Are you feeling excited or tired?</label>
              <div className="icon-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <button
                  type="button"
                  className={`icon-btn ${formData.selectedEnergy === 'excited' ? 'selected' : ''}`}
                  onClick={() => updateField('selectedEnergy', 'excited')}
                >
                  <span className="icon-btn-icon">🔥</span>
                  <span className="icon-btn-label">Excited</span>
                </button>
                <button
                  type="button"
                  className={`icon-btn ${formData.selectedEnergy === 'tired' ? 'selected' : ''}`}
                  onClick={() => updateField('selectedEnergy', 'tired')}
                >
                  <span className="icon-btn-icon">😴</span>
                  <span className="icon-btn-label">Tired</span>
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">How is the project flowing?</label>
              <div className="icon-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <button
                  type="button"
                  className={`icon-btn ${formData.selectedFlow === 'ease' ? 'selected' : ''}`}
                  onClick={() => updateField('selectedFlow', 'ease')}
                >
                  <span className="icon-btn-icon">✨</span>
                  <span className="icon-btn-label">Great</span>
                </button>
                <button
                  type="button"
                  className={`icon-btn ${formData.selectedFlow === 'resistance' ? 'selected' : ''}`}
                  onClick={() => updateField('selectedFlow', 'resistance')}
                >
                  <span className="icon-btn-icon">🧗</span>
                  <span className="icon-btn-label">Resistance</span>
                </button>
              </div>
            </div>

            {/* Direction Preview */}
            {formData.selectedEnergy && formData.selectedFlow && (() => {
              const direction = getDirection(formData.selectedEnergy, formData.selectedFlow)
              const info = getDirectionInfo(direction)
              return (
                <div
                  className="selected-context"
                  style={{
                    marginTop: '16px',
                    background: `${info.color}20`,
                    borderColor: `${info.color}50`
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{info.emoji}</span>
                  <span className="context-value" style={{ color: info.color }}>{info.label}</span>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flow-navigation">
        {step === 1 && (
          <button className="primary-button" onClick={handleNext} disabled={!canContinue()}>
            Continue
          </button>
        )}
        {step === 2 && (
          <button className="primary-button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Complete Review (+4 pts)'}
          </button>
        )}

        {step >= 1 && (
          <button className="go-back-link" onClick={handleBack}>
            Go back
          </button>
        )}
      </div>
    </div>
  )
}
