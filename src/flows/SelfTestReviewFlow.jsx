/**
 * SelfTestReviewFlow - Reflection quest for Self-Test
 *
 * After completing a Self-Test plan and testing on yourself IRL,
 * users complete this quest to reflect on what happened.
 *
 * Mirrors LetsPlayReviewFlow structure with self-test-specific content.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useAutoSave } from '../hooks/useAutoSave'
import { supabase } from '../lib/supabaseClient'
import '../styles/flow-base.css'
import './LetsPlayFlow.css'

// Outcome rating options (self-test specific)
const OUTCOME_RATINGS = [
  { id: 'it_worked', label: 'It worked!', icon: '🎯', description: 'Clear positive result' },
  { id: 'it_helped', label: 'It helped', icon: '👍', description: 'Noticeable improvement' },
  { id: 'mixed', label: 'Mixed results', icon: '🤷', description: "Some parts worked, some didn't" },
  { id: 'not_quite', label: 'Not quite', icon: '😕', description: "Didn't land as expected" },
  { id: 'wrong_match', label: 'Wrong match', icon: '🔄', description: 'Skill/problem combo was off' }
]

// Ready for others options
const READY_OPTIONS = [
  { id: 'yes', label: "Yes, I'm ready!", icon: '🚀', desc: 'Time to help someone else' },
  { id: 'try_again', label: 'Try again first', icon: '🔄', desc: 'Want to test more on myself' },
  { id: 'refine', label: 'Need to refine', icon: '🔧', desc: 'Skill/problem needs adjustment' }
]

// Initial form data
const INITIAL_FORM_DATA = {
  whatHappened: '',
  outcomeRating: null,
  wentWell: '',
  whatSurprised: '',
  threePctBetter: '',
  selectedEnergy: null,  // 'excited' or 'tired'
  selectedFlow: null,    // 'ease' or 'resistance'
  readyForOthers: null   // 'yes' | 'try_again' | 'refine'
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

export default function SelfTestReviewFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [pendingTests, setPendingTests] = useState([])
  const [selectedTest, setSelectedTest] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [savedResults, setSavedResults] = useState(null)

  const { loadProgress, clearProgress } = useAutoSave('self_test', user?.id)

  // Scroll to top on step changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  // Check for ?results=true to show saved results directly
  useEffect(() => {
    const loadSavedResults = async () => {
      if (searchParams.get('results') !== 'true' || !user) return

      try {
        const { data: completions, error } = await supabase
          .from('quest_completions')
          .select('id, reflection_text, created_at')
          .eq('user_id', user.id)
          .eq('quest_id', 'self_test_review')
          .order('created_at', { ascending: false })
          .limit(1)

        if (error || !completions?.length) return

        const parsed = JSON.parse(completions[0].reflection_text)
        setSavedResults({
          ...parsed,
          created_at: completions[0].created_at
        })
      } catch (err) {
        console.warn('Error loading saved results:', err)
      }
    }

    loadSavedResults()
  }, [user, searchParams])

  // Load pending Self-Test completions that need review (skip if viewing results)
  useEffect(() => {
    if (searchParams.get('results') === 'true') return

    const init = async () => {
      if (!user?.id) return

      setLoading(true)
      try {
        // Get Self-Test completions that are pending reflection
        const { data: completions, error } = await supabase
          .from('quest_completions')
          .select('id, reflection_text, created_at')
          .eq('user_id', user.id)
          .eq('quest_id', 'self_test')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading Self-Test completions:', error)
          return
        }

        // Filter to only pending reflections
        const pending = (completions || []).filter(c => {
          try {
            const data = JSON.parse(c.reflection_text)
            return data.phase === 'pending_reflection'
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

        setPendingTests(pending)

        // Check localStorage for most recent plan
        const saved = loadProgress()
        if (saved?.completionId && pending.length > 0) {
          const match = pending.find(p => p.id === saved.completionId)
          if (match) {
            setSelectedTest(match)
            setStep(1) // Skip selection, go to reflection
          }
        }
      } catch (err) {
        console.warn('SelfTestReviewFlow init error:', err)
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
      case 0: return selectedTest !== null
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

  const handleSelectTest = (test) => {
    setSelectedTest(test)
  }

  // Submit reflection
  const handleSubmit = async () => {
    if (isSubmitting || !selectedTest) return
    setIsSubmitting(true)

    try {
      // Calculate flow direction
      const flowDirection = getDirection(formData.selectedEnergy, formData.selectedFlow)

      // Get the original data and merge with reflection
      const updatedData = {
        ...selectedTest,
        phase: 'completed',
        what_happened: formData.whatHappened,
        outcome_rating: formData.outcomeRating,
        went_well: formData.wentWell || null,
        what_surprised: formData.whatSurprised || null,
        three_pct_better: formData.threePctBetter || null,
        flow_energy: formData.selectedEnergy || null,
        flow_state: formData.selectedFlow || null,
        flow_direction: flowDirection || null,
        ready_for_others: formData.readyForOthers || null,
        reviewed_at: new Date().toISOString()
      }

      // Update the original Self-Test completion
      const { error: updateError } = await supabase
        .from('quest_completions')
        .update({
          reflection_text: JSON.stringify(updatedData)
        })
        .eq('id', selectedTest.id)

      if (updateError) {
        console.error('Error updating Self-Test:', updateError)
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
          quest_id: 'self_test_review',
          quest_category: 'Business',
          quest_type: 'Validation',
          points_earned: 4,
          challenge_day: 0,
          reflection_text: JSON.stringify({
            quest_type: 'self_test_review',
            original_test_id: selectedTest.id,
            skill_name: selectedTest.skill_name,
            problem_name: selectedTest.problem_name,
            outcome_rating: formData.outcomeRating,
            what_happened: formData.whatHappened,
            went_well: formData.wentWell || null,
            what_surprised: formData.whatSurprised || null,
            three_pct_better: formData.threePctBetter || null,
            flow_energy: formData.selectedEnergy || null,
            flow_state: formData.selectedFlow || null,
            flow_direction: flowDirection || null,
            ready_for_others: formData.readyForOthers || null
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

      // Navigate based on readiness
      if (formData.readyForOthers === 'yes') {
        navigate('/lets-play')
      } else {
        navigate('/7-day-challenge')
      }
    } catch (err) {
      console.error('Self-Test Review error:', err)
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

  // View Results mode - show saved results read-only
  if (searchParams.get('results') === 'true') {
    if (!savedResults) {
      return (
        <div className="lets-play-flow flow-base">
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading your results...</p>
          </div>
        </div>
      )
    }

    const direction = savedResults.flow_direction ? getDirectionInfo(savedResults.flow_direction) : null

    return (
      <div className="lets-play-flow flow-base">
        <div className="flow-content">
          <div className="question-container">
            <div className="question-number">Your Review</div>
            <h2 className="question-text">🔬 {savedResults.skill_name}</h2>
            <p className="question-subtext">Tested on: {savedResults.problem_name}</p>

            {savedResults.what_happened && (
              <div className="input-group">
                <label className="input-label">What happened</label>
                <p style={{ color: 'rgba(255,255,255,0.9)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  {savedResults.what_happened}
                </p>
              </div>
            )}

            {savedResults.outcome_rating && (
              <div className="input-group">
                <label className="input-label">How it went</label>
                <p style={{ color: 'rgba(255,255,255,0.9)', margin: '4px 0 0' }}>
                  {OUTCOME_RATINGS.find(r => r.id === savedResults.outcome_rating)?.icon}{' '}
                  {OUTCOME_RATINGS.find(r => r.id === savedResults.outcome_rating)?.label || savedResults.outcome_rating}
                </p>
              </div>
            )}

            {savedResults.went_well && (
              <div className="input-group">
                <label className="input-label">What went well</label>
                <p style={{ color: 'rgba(255,255,255,0.9)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  {savedResults.went_well}
                </p>
              </div>
            )}

            {savedResults.what_surprised && (
              <div className="input-group">
                <label className="input-label">What surprised you</label>
                <p style={{ color: 'rgba(255,255,255,0.9)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  {savedResults.what_surprised}
                </p>
              </div>
            )}

            {savedResults.three_pct_better && (
              <div className="input-group">
                <label className="input-label">3% better next time</label>
                <p style={{ color: 'rgba(255,255,255,0.9)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  {savedResults.three_pct_better}
                </p>
              </div>
            )}

            {direction && (
              <div
                className="selected-context"
                style={{
                  marginTop: '16px',
                  background: `${direction.color}20`,
                  borderColor: `${direction.color}50`
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{direction.emoji}</span>
                <span className="context-value" style={{ color: direction.color }}>{direction.label}</span>
              </div>
            )}

            {savedResults.ready_for_others && (
              <div className="input-group">
                <label className="input-label">Ready for others?</label>
                <p style={{ color: 'rgba(255,255,255,0.9)', margin: '4px 0 0' }}>
                  {READY_OPTIONS.find(r => r.id === savedResults.ready_for_others)?.icon}{' '}
                  {READY_OPTIONS.find(r => r.id === savedResults.ready_for_others)?.label || savedResults.ready_for_others}
                </p>
              </div>
            )}

            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '16px' }}>
              {new Date(savedResults.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flow-navigation">
          <button className="primary-button" onClick={() => navigate('/self-test-review')}>
            Start New Self-Trial Review
          </button>
          <button className="go-back-link" onClick={() => navigate('/7-day-challenge')}>
            Back to Challenge
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="lets-play-flow flow-base">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading your tests...</p>
        </div>
      </div>
    )
  }

  if (pendingTests.length === 0) {
    return (
      <div className="lets-play-flow flow-base">
        <div className="flow-content">
          <div className="prereq-message">
            <span className="prereq-icon">🔬</span>
            <h2>No Trials to Review</h2>
            <p>Complete a Play-list Self-Trial quest first, then come back to reflect on your experience.</p>
            <button className="primary-button" onClick={() => navigate('/self-test')}>
              Start a New Self-Trial
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
          <h1 className="welcome-greeting">Review Your Self-Trial</h1>
          <div className="welcome-message animated-text">
            <p>You've trialled your skill on yourself. Now let's reflect on what happened.</p>
            <p>This is how you learn what works and what doesn't.</p>
          </div>

          {pendingTests.length === 1 ? (
            <>
              <div className="selected-context" style={{ marginBottom: '24px' }}>
                <span className="context-label">Reviewing:</span>
                <span className="context-value">
                  Tested {pendingTests[0].skill_name} on {pendingTests[0].problem_name}
                </span>
              </div>
              <button className="primary-button" onClick={() => { setSelectedTest(pendingTests[0]); setStep(1); }}>
                Start Reflection
              </button>
            </>
          ) : (
            <>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
                Which test are you reviewing?
              </p>
              <div className="options-list" style={{ marginBottom: '24px' }}>
                {pendingTests.map(test => (
                  <button
                    key={test.id}
                    type="button"
                    className={`option-card ${selectedTest?.id === test.id ? 'selected' : ''}`}
                    onClick={() => handleSelectTest(test)}
                  >
                    <span className="option-icon">🔬</span>
                    <span className="option-name">
                      Tested {test.skill_name} on {test.problem_name}
                    </span>
                    <span className="option-desc">
                      {new Date(test.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="primary-button"
                onClick={() => setStep(1)}
                disabled={!selectedTest}
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
              You planned to: "{selectedTest.plan_description}"
            </p>

            <div className="input-group">
              <label className="input-label">What did you actually do?</label>
              <textarea
                className="textarea"
                placeholder="What happened when you tested this on yourself?"
                value={formData.whatHappened}
                onChange={(e) => updateField('whatHappened', e.target.value)}
                rows={3}
              />
              {charHint(formData.whatHappened, 10)}
            </div>

            <div className="input-group">
              <label className="input-label">How did it go?</label>
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
            <p className="question-subtext">Every test teaches you something about your skills.</p>

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

            {/* Ready for others? */}
            <div className="input-group" style={{ marginTop: '24px' }}>
              <label className="input-label">Ready to help someone else with this?</label>
              <div className="options-list">
                {READY_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    className={`option-card ${formData.readyForOthers === option.id ? 'selected' : ''}`}
                    onClick={() => updateField('readyForOthers', option.id)}
                  >
                    <span className="option-icon">{option.icon}</span>
                    <span className="option-name">{option.label}</span>
                    <span className="option-desc">{option.desc}</span>
                  </button>
                ))}
              </div>
            </div>
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
