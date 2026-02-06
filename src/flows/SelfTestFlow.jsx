/**
 * SelfTestFlow - Prove your skill works on yourself before helping others
 *
 * Pick skill x problem combo, plan how to apply it to yourself,
 * go do it, then come back to reflect.
 *
 * Uses useAutoSave to detect return visits for reflection phase.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useAutoSave } from '../hooks/useAutoSave'
import { fetchFlowFinderData } from '../lib/crm/groanChallengeService'
import { SKILLS_SEGMENTS, PROBLEM_SEGMENTS } from '../lib/wheelTaxonomy'
import { supabase } from '../lib/supabaseClient'
import '../styles/flow-base.css'
import './LetsPlayFlow.css'

// Time estimate options (reused from LetsPlayFlow)
const TIME_ESTIMATES = [
  { id: '5min', label: '5 min', icon: '⚡' },
  { id: '15min', label: '15 min', icon: '⏱️' },
  { id: '30min', label: '30 min', icon: '🕐' },
  { id: '1hour', label: '1 hour', icon: '🕑' },
  { id: '2plus', label: '2+ hours', icon: '🕒' }
]

// When will you do it?
const WHEN_OPTIONS = [
  { id: 'right_now', label: 'Right Now', icon: '⚡' },
  { id: 'today', label: 'Today', icon: '📅' },
  { id: 'this_week', label: 'This Week', icon: '🗓️' }
]

// Outcome rating options for reflection
const OUTCOME_RATINGS = [
  { id: 'it_worked', label: 'It worked!', icon: '🎯', desc: 'Clear positive result' },
  { id: 'it_helped', label: 'It helped', icon: '👍', desc: 'Noticeable improvement' },
  { id: 'mixed', label: 'Mixed results', icon: '🤔', desc: 'Some good, some not' },
  { id: 'not_quite', label: 'Not quite', icon: '😕', desc: "Didn't land as expected" },
  { id: 'wrong_match', label: 'Wrong match', icon: '🔄', desc: 'Skill/problem combo was off' }
]

// Ready for others options
const READY_OPTIONS = [
  { id: 'yes', label: 'Yes, I\'m ready!', icon: '🚀', desc: 'Time to help someone else' },
  { id: 'try_again', label: 'Try again first', icon: '🔄', desc: 'Want to test more on myself' },
  { id: 'refine', label: 'Need to refine', icon: '🔧', desc: 'Skill/problem needs adjustment' }
]

const INITIAL_FORM_DATA = {
  selectedSkill: null,
  selectedProblem: null,
  planDescription: '',
  timeEstimate: null,
  whenPlanned: null,
  // Reflection fields
  whatHappened: '',
  outcomeRating: null,
  whatLearned: '',
  readyForOthers: null
}

export default function SelfTestFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [showReflection, setShowReflection] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [completionCount, setCompletionCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingCompletionId, setPendingCompletionId] = useState(null)

  const { savedData, saveProgress, clearProgress } = useAutoSave('self_test', user?.id)

  // Fetch Flow Finder data and check for saved progress
  useEffect(() => {
    const init = async () => {
      if (!user?.id) return

      setLoading(true)
      try {
        const { data: ffData } = await fetchFlowFinderData(user.id)
        if (ffData) {
          setSkills(ffData.skills || [])
          setProblems(ffData.problems || [])
        }

        // Count past completions
        const { count } = await supabase
          .from('quest_completions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('quest_id', 'self_test')

        setCompletionCount(count || 0)
      } catch (err) {
        console.warn('SelfTestFlow init error:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [user?.id])

  // Check for pending reflection on mount
  useEffect(() => {
    if (savedData?.phase === 'pending_reflection') {
      setShowReflection(true)
      setPendingCompletionId(savedData.completionId)
      setFormData(prev => ({
        ...prev,
        selectedSkill: savedData.selectedSkill,
        selectedProblem: savedData.selectedProblem
      }))
    }
  }, [savedData])

  // Convert proficiency text to number for display
  const proficiencyToNumber = (prof) => {
    const map = { exploring: 1, pursuing: 2, proven: 3 }
    return map[prof] || 0
  }

  // Get segment display info
  const getSkillDisplay = (cluster) => {
    const segmentId = cluster.taxonomy_keys?.[0]
    const segment = SKILLS_SEGMENTS.find(s => s.id === segmentId)
    return {
      id: cluster.id,
      name: cluster.cluster_label || segment?.displayName || 'Skill',
      icon: segment?.icon || '💡',
      color: segment?.color || '#7c3aed',
      proficiency: proficiencyToNumber(cluster.proficiency)
    }
  }

  const getProblemDisplay = (cluster) => {
    const segmentId = cluster.taxonomy_keys?.[0]
    const segment = PROBLEM_SEGMENTS.find(p => p.id === segmentId)
    return {
      id: cluster.id,
      name: cluster.cluster_label || segment?.displayName || 'Problem',
      icon: segment?.icon || '🎯',
      color: segment?.color || '#7c3aed',
      proficiency: proficiencyToNumber(cluster.proficiency)
    }
  }

  const getSelectedSkillInfo = useCallback((skillId) => {
    const cluster = skills.find(s => s.id === skillId)
    if (!cluster) return { name: 'your skill', icon: '💡' }
    const segmentId = cluster.taxonomy_keys?.[0]
    const segment = SKILLS_SEGMENTS.find(s => s.id === segmentId)
    return {
      name: cluster.cluster_label || segment?.displayName || 'Skill',
      icon: segment?.icon || '💡'
    }
  }, [skills])

  const getSelectedProblemInfo = useCallback((problemId) => {
    const cluster = problems.find(p => p.id === problemId)
    if (!cluster) return { name: 'your problem', icon: '🎯' }
    const segmentId = cluster.taxonomy_keys?.[0]
    const segment = PROBLEM_SEGMENTS.find(p => p.id === segmentId)
    return {
      name: cluster.cluster_label || segment?.displayName || 'Problem',
      icon: segment?.icon || '🎯'
    }
  }, [problems])

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Validation
  const canContinue = () => {
    switch (step) {
      case 0: return true
      case 1: return formData.selectedSkill !== null
      case 2: return formData.selectedProblem !== null
      case 3: return formData.planDescription.trim().length >= 10 && formData.timeEstimate !== null && formData.whenPlanned !== null
      default: return false
    }
  }

  const canSubmitReflection = () => {
    return formData.whatHappened.trim().length >= 10 &&
           formData.outcomeRating !== null &&
           formData.readyForOthers !== null
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

  // Handle "I'll Do It" - save plan and show encouragement
  const handleCommit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const skillInfo = getSelectedSkillInfo(formData.selectedSkill)
      const problemInfo = getSelectedProblemInfo(formData.selectedProblem)

      const structuredData = {
        quest_type: 'self_test',
        phase: 'pending_reflection',
        skill_id: formData.selectedSkill,
        skill_name: skillInfo.name,
        problem_id: formData.selectedProblem,
        problem_name: problemInfo.name,
        plan_description: formData.planDescription,
        time_estimate: formData.timeEstimate,
        when_planned: formData.whenPlanned,
        completion_number: completionCount + 1
      }

      // Save to quest_completions
      const { data, error } = await supabase
        .from('quest_completions')
        .insert({
          user_id: user.id,
          challenge_instance_id: null,
          quest_id: 'self_test',
          quest_category: 'Business',
          quest_type: 'Validation',
          points_earned: 5,
          challenge_day: 0,
          reflection_text: JSON.stringify(structuredData),
          project_id: null,
          stage: 1
        })
        .select()

      if (error) {
        console.error('Error saving Self-Test:', error)
        alert('Failed to save. Please try again.')
        setIsSubmitting(false)
        return
      }

      // Save to localStorage for reflection on return
      saveProgress({
        phase: 'pending_reflection',
        completionId: data?.[0]?.id,
        selectedSkill: formData.selectedSkill,
        selectedProblem: formData.selectedProblem,
        skillName: skillInfo.name,
        problemName: problemInfo.name,
        planDescription: formData.planDescription,
        timeEstimate: formData.timeEstimate,
        whenPlanned: formData.whenPlanned
      })

      setShowEncouragement(true)
    } catch (err) {
      console.error('Self-Test error:', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle reflection submission
  const handleReflectionSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const skillInfo = getSelectedSkillInfo(formData.selectedSkill)
      const problemInfo = getSelectedProblemInfo(formData.selectedProblem)

      const structuredData = {
        quest_type: 'self_test',
        phase: 'completed',
        skill_id: formData.selectedSkill,
        skill_name: skillInfo.name,
        problem_id: formData.selectedProblem,
        problem_name: problemInfo.name,
        plan_description: savedData?.planDescription || formData.planDescription,
        time_estimate: savedData?.timeEstimate || formData.timeEstimate,
        when_planned: savedData?.whenPlanned || formData.whenPlanned,
        what_happened: formData.whatHappened,
        outcome_rating: formData.outcomeRating,
        what_learned: formData.whatLearned || null,
        ready_for_others: formData.readyForOthers,
        completion_number: completionCount
      }

      // Update the existing record with reflection data
      if (pendingCompletionId) {
        const { error } = await supabase
          .from('quest_completions')
          .update({
            reflection_text: JSON.stringify(structuredData)
          })
          .eq('id', pendingCompletionId)
          .eq('user_id', user.id)

        if (error) {
          console.error('Error updating Self-Test reflection:', error)
          alert('Failed to save reflection. Please try again.')
          setIsSubmitting(false)
          return
        }
      }

      clearProgress()

      // Navigate based on readiness
      if (formData.readyForOthers === 'yes') {
        navigate('/lets-play')
      } else {
        navigate('/7-day-challenge')
      }
    } catch (err) {
      console.error('Self-Test reflection error:', err)
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
          <p>Loading your skills and problems...</p>
        </div>
      </div>
    )
  }

  if (skills.length === 0 || problems.length === 0) {
    return (
      <div className="lets-play-flow flow-base">
        <div className="flow-content">
          <div className="prereq-message">
            <span className="prereq-icon">🔒</span>
            <h2>Complete Flow Finder First</h2>
            <p>You need to discover your skills and problems before you can self-test.</p>
            <button className="primary-button" onClick={() => navigate('/nikigai/skills')}>
              Start Flow Finder
            </button>
            <button className="secondary-button" onClick={() => navigate('/7-day-challenge')}>
              Back to Challenge
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Resume prompt for pending reflection
  if (showReflection && savedData?.phase === 'pending_reflection' && !formData.whatHappened) {
    const skillName = savedData?.skillName || 'your skill'
    const problemName = savedData?.problemName || 'your problem'

    return (
      <div className="lets-play-flow flow-base">
        <div className="flow-content">
          <div className="resume-prompt">
            <span className="resume-icon">🔬</span>
            <h2>Welcome Back!</h2>
            <p>
              You were testing <strong>{skillName}</strong> on <strong>{problemName}</strong>.
            </p>
            <p className="resume-question">How did it go?</p>
            <div className="resume-actions">
              <button className="primary-button" onClick={() => setFormData(prev => ({ ...prev, whatHappened: '' }))}>
                Share My Results
              </button>
              <button className="secondary-button" onClick={() => {
                clearProgress()
                setShowReflection(false)
                setStep(0)
                setFormData(INITIAL_FORM_DATA)
              }}>
                Start Fresh
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Reflection phase (returned from doing the test)
  if (showReflection) {
    const skillInfo = getSelectedSkillInfo(formData.selectedSkill)
    const problemInfo = getSelectedProblemInfo(formData.selectedProblem)

    return (
      <div className="lets-play-flow flow-base">
        <div className="flow-content">
          <div className="question-container">
            <div className="question-number">Reflection</div>
            <h2 className="question-text">How Did It Go?</h2>

            <div className="selected-context">
              <span className="context-value">{skillInfo.icon} {skillInfo.name} on {problemInfo.icon} {problemInfo.name}</span>
            </div>

            <div className="input-group">
              <label className="input-label">What happened?</label>
              <textarea
                className="textarea"
                placeholder="Describe what you did and what the result was..."
                value={formData.whatHappened}
                onChange={(e) => updateField('whatHappened', e.target.value)}
                rows={3}
              />
              {charHint(formData.whatHappened, 10)}
            </div>

            <div className="input-group">
              <label className="input-label">How would you rate the outcome?</label>
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
                    <span className="option-desc">{rating.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">What did you learn? <span className="optional">(optional)</span></label>
              <textarea
                className="textarea"
                placeholder="Any surprises or insights?"
                value={formData.whatLearned}
                onChange={(e) => updateField('whatLearned', e.target.value)}
                rows={2}
              />
            </div>

            <div className="input-group">
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
        </div>

        <div className="flow-navigation">
          <button
            className="primary-button"
            onClick={handleReflectionSubmit}
            disabled={!canSubmitReflection() || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Complete Self-Test'}
          </button>
          <button className="go-back-link" onClick={() => navigate('/7-day-challenge')}>
            Back to Challenge
          </button>
        </div>
      </div>
    )
  }

  // Encouragement card (after "I'll Do It")
  if (showEncouragement) {
    const skillInfo = getSelectedSkillInfo(formData.selectedSkill)
    const problemInfo = getSelectedProblemInfo(formData.selectedProblem)

    return (
      <div className="lets-play-flow flow-base">
        <div className="flow-content">
          <div className="encouragement-card">
            <span className="encouragement-icon">🔬</span>
            <h2>Go Test It!</h2>
            <p className="encouragement-text">
              You're going to apply <strong>{skillInfo.name}</strong> to <strong>{problemInfo.name}</strong> — on yourself.
            </p>
            <p className="encouragement-sub">
              Come back to this quest when you're done to reflect on what happened.
            </p>
            <button className="primary-button" onClick={() => navigate('/7-day-challenge')}>
              Got it
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Intro screen (step 0)
  if (step === 0) {
    return (
      <div className="lets-play-flow flow-base">
        <div className="welcome-container">
          <p className="time-icon">🔬</p>
          <h1 className="welcome-greeting">Self-Test</h1>
          <div className="welcome-message animated-text">
            <p>Before you help someone else, prove to yourself that your skill works.</p>
            <p>Pick a skill. Pick a problem <strong>you</strong> have. Apply it to yourself.</p>
            <p>If it works for you, it'll work for others.</p>
          </div>
          <button className="primary-button" onClick={() => setStep(1)}>
            Let's Test It
          </button>
          <button className="go-back-link" onClick={() => navigate('/7-day-challenge')}>
            Go back
          </button>
        </div>
      </div>
    )
  }

  // Progress dots (steps 1-3)
  const totalSteps = 3
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
        {/* Step 1: Pick Your Skill */}
        {step === 1 && (
          <div className="question-container">
            <div className="question-number">Step 1 of 3</div>
            <h2 className="question-text">Pick Your Skill</h2>
            <p className="question-subtext">Which skill will you test on yourself?</p>

            <div className="options-list">
              {skills.map(cluster => {
                const display = getSkillDisplay(cluster)
                return (
                  <button
                    key={display.id}
                    type="button"
                    className={`option-card ${formData.selectedSkill === display.id ? 'selected' : ''}`}
                    onClick={() => updateField('selectedSkill', display.id)}
                  >
                    <span className="option-icon">{display.icon}</span>
                    <span className="option-name">{display.name}</span>
                    {display.proficiency > 0 && (
                      <span className="option-prof">
                        {'●'.repeat(Math.min(display.proficiency, 3))}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: Pick Your Problem */}
        {step === 2 && (
          <div className="question-container">
            <div className="question-number">Step 2 of 3</div>
            <h2 className="question-text">Pick Your Problem</h2>
            <p className="question-subtext">Which of these are you personally dealing with?</p>

            {formData.selectedSkill && (() => {
              const skillInfo = getSelectedSkillInfo(formData.selectedSkill)
              return (
                <div className="selected-context">
                  <span className="context-label">Using:</span>
                  <span className="context-value">{skillInfo.icon} {skillInfo.name}</span>
                </div>
              )
            })()}

            <div className="options-list">
              {problems.map(cluster => {
                const display = getProblemDisplay(cluster)
                return (
                  <button
                    key={display.id}
                    type="button"
                    className={`option-card ${formData.selectedProblem === display.id ? 'selected' : ''}`}
                    onClick={() => updateField('selectedProblem', display.id)}
                  >
                    <span className="option-icon">{display.icon}</span>
                    <span className="option-name">{display.name}</span>
                    {display.proficiency > 0 && (
                      <span className="option-prof">
                        {'●'.repeat(Math.min(display.proficiency, 3))}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 3: Plan & Commit */}
        {step === 3 && (() => {
          const skillInfo = getSelectedSkillInfo(formData.selectedSkill)
          const problemInfo = getSelectedProblemInfo(formData.selectedProblem)
          return (
            <div className="question-container">
              <div className="question-number">Step 3 of 3</div>
              <h2 className="question-text">Plan & Commit</h2>
              <p className="question-subtext">
                How will you apply {skillInfo.name} to {problemInfo.name}?
              </p>

              <div className="input-group">
                <label className="input-label">What will you do?</label>
                <textarea
                  className="textarea"
                  placeholder="Describe how you'll test this skill on yourself..."
                  value={formData.planDescription}
                  onChange={(e) => updateField('planDescription', e.target.value)}
                  rows={3}
                />
                {charHint(formData.planDescription, 10)}
              </div>

              <div className="input-group">
                <label className="input-label">How long will it take?</label>
                <div className="icon-grid compact">
                  {TIME_ESTIMATES.map(time => (
                    <button
                      key={time.id}
                      type="button"
                      className={`icon-btn compact ${formData.timeEstimate === time.id ? 'selected' : ''}`}
                      onClick={() => updateField('timeEstimate', time.id)}
                    >
                      <span className="icon-btn-icon">{time.icon}</span>
                      <span className="icon-btn-label">{time.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">When will you do it?</label>
                <div className="icon-grid">
                  {WHEN_OPTIONS.map(when => (
                    <button
                      key={when.id}
                      type="button"
                      className={`icon-btn ${formData.whenPlanned === when.id ? 'selected' : ''}`}
                      onClick={() => updateField('whenPlanned', when.id)}
                    >
                      <span className="icon-btn-icon">{when.icon}</span>
                      <span className="icon-btn-label">{when.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Navigation */}
      <div className="flow-navigation">
        {step >= 1 && step <= 2 && (
          <button className="primary-button" onClick={handleNext} disabled={!canContinue()}>
            Continue
          </button>
        )}

        {step === 3 && (
          <button className="primary-button" onClick={handleCommit} disabled={!canContinue() || isSubmitting}>
            {isSubmitting ? 'Saving...' : "I'll Do It"}
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
