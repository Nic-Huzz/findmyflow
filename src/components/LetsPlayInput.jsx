/**
 * LetsPlayInput - Two-phase stepped form for the Let's Play quest
 *
 * Phase 1 (DECIDE): Pick skill×problem combo, choose who to help, plan your move
 * Phase 2 (REFLECT): After real-world action, reflect on what happened
 *
 * Uses useAutoSave to persist plan between sessions (72hr expiry).
 * Uses useSteppedForm for step navigation and validation.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { useSteppedForm } from '../hooks/useSteppedForm'
import { useAutoSave } from '../hooks/useAutoSave'
import { fetchFlowFinderData } from '../lib/crm/groanChallengeService'
import { supabase } from '../lib/supabaseClient'
import { SKILLS_SEGMENTS, PROBLEM_SEGMENTS, findSkillSegment } from '../lib/wheelTaxonomy'
import { StepProgress, IconGrid } from './QuestInputShared'
import './LetsPlayInput.css'

// Quest IDs handled by this component
export const LETS_PLAY_QUEST_IDS = ['lets_play']

// Person type options
const PERSON_TYPES = [
  { id: 'friend', label: 'Friend', icon: '👫' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧' },
  { id: 'colleague', label: 'Colleague', icon: '💼' },
  { id: 'acquaintance', label: 'Acquaintance', icon: '🤝' },
  { id: 'stranger', label: 'Stranger', icon: '🌍' },
  { id: 'online', label: 'Online', icon: '💬' }
]

// Reach method options
const REACH_METHODS = [
  { id: 'in_person', label: 'In Person', icon: '🏠' },
  { id: 'video_call', label: 'Video Call', icon: '📹' },
  { id: 'phone', label: 'Phone', icon: '📞' },
  { id: 'written', label: 'Written/Text', icon: '✍️' },
  { id: 'build', label: 'Build Something', icon: '🔨' },
  { id: 'other', label: 'Other', icon: '🎨' }
]

// Time estimate options
const TIME_ESTIMATES = [
  { id: '5min', label: '5 min', icon: '⚡' },
  { id: '15min', label: '15 min', icon: '⏱️' },
  { id: '30min', label: '30 min', icon: '🕐' },
  { id: '1hour', label: '1 hour', icon: '🕑' },
  { id: '2plus', label: '2+ hours', icon: '🕒' }
]

// Outcome rating options
const OUTCOME_RATINGS = [
  { id: 'loved_it', label: 'They loved it', icon: '⭐', description: 'Clear positive impact' },
  { id: 'it_helped', label: 'It helped', icon: '👍', description: 'Made a difference, even small' },
  { id: 'mixed', label: 'Mixed results', icon: '🤷', description: "Some parts worked, some didn't" },
  { id: 'didnt_land', label: "Didn't quite land", icon: '😬', description: 'Felt off or missed the mark' },
  { id: 'not_needed', label: "They didn't need it", icon: '❌', description: 'Wrong problem or wrong person' }
]

// Escalating difficulty descriptions
const DIFFICULTY_LEVELS = [
  { min: 0, label: 'Starter', prompt: 'Help someone you know' },
  { min: 3, label: 'Growing', prompt: 'Help someone outside your close circle' },
  { min: 7, label: 'Confident', prompt: "Help someone you've never met" },
  { min: 12, label: 'Pro', prompt: 'Help someone and ask for a testimonial' }
]

// Initial form data
const INITIAL_FORM_DATA = {
  // Phase 1: Decide
  selectedSkill: null,
  selectedProblem: null,
  personType: null,
  personName: '',
  personSituation: '',
  reachMethod: null,
  planDescription: '',
  timeEstimate: null,
  // Phase 2: Reflect
  whatHappened: '',
  outcomeRating: null,
  whatSurprised: '',
  whatDifferently: ''
}

function LetsPlayInput({ quest, onComplete }) {
  const { user } = useAuth()
  const [skills, setSkills] = useState([])
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState('decide') // 'decide' | 'encouragement' | 'reflect'
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [savedPlan, setSavedPlan] = useState(null)
  const [completionCount, setCompletionCount] = useState(0)

  const { saveProgress, loadProgress, clearProgress } = useAutoSave('lets_play', user?.id)

  // Determine total steps based on phase
  const totalSteps = phase === 'reflect' ? 6 : 4

  // Validation function
  const validateStep = useCallback((currentStep, data) => {
    if (phase === 'decide') {
      switch (currentStep) {
        case 1: return data.selectedSkill !== null
        case 2: return data.selectedProblem !== null
        case 3: return data.personType !== null && data.personName.trim().length >= 2
        case 4: return data.reachMethod !== null && data.planDescription.trim().length >= 10 && data.timeEstimate !== null
        default: return false
      }
    } else {
      // reflect phase (steps 5-6)
      switch (currentStep) {
        case 1: return true // steps 1-4 are already done (plan data)
        case 2: return true
        case 3: return true
        case 4: return true
        case 5: return data.whatHappened.trim().length >= 10 && data.outcomeRating !== null
        case 6: return true // optional fields
        default: return false
      }
    }
  }, [phase])

  // Build structured data for submission
  const buildStructuredData = useCallback((data) => {
    const skillInfo = getSelectedSkillInfo(data.selectedSkill)
    const problemInfo = getSelectedProblemInfo(data.selectedProblem)

    return {
      quest_type: 'lets_play',
      phase: 'complete',
      // Plan data
      skill_id: data.selectedSkill,
      skill_name: skillInfo.name,
      problem_id: data.selectedProblem,
      problem_name: problemInfo.name,
      person_type: data.personType,
      person_name: data.personName,
      person_situation: data.personSituation || null,
      reach_method: data.reachMethod,
      plan_description: data.planDescription,
      time_estimate: data.timeEstimate,
      // Reflection data
      what_happened: data.whatHappened,
      outcome_rating: data.outcomeRating,
      what_surprised: data.whatSurprised || null,
      what_differently: data.whatDifferently || null,
      completion_number: completionCount + 1
    }
  }, [completionCount, skills, problems])

  const {
    step,
    formData,
    isSubmitting,
    canContinue,
    handleNext,
    handleBack,
    goToStep,
    updateField,
    setFormData,
    handleSubmit
  } = useSteppedForm({
    totalSteps,
    initialData: INITIAL_FORM_DATA,
    validateStep,
    onSubmit: (data) => {
      clearProgress()
      onComplete(quest, buildStructuredData(data))
    }
  })

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

        // Check for saved plan
        const saved = loadProgress()
        if (saved?.phase === 'waiting') {
          setSavedPlan(saved)
          setShowResumePrompt(true)
        }

        // Count past completions for difficulty escalation
        const { count } = await supabase
          .from('quest_completions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('quest_id', 'lets_play')

        setCompletionCount(count || 0)
      } catch (err) {
        console.warn('LetsPlayInput init error:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [user?.id, loadProgress])

  // Get current difficulty level
  const difficultyLevel = useMemo(() => {
    return [...DIFFICULTY_LEVELS].reverse().find(d => completionCount >= d.min) || DIFFICULTY_LEVELS[0]
  }, [completionCount])

  // Convert proficiency text to number for display
  const proficiencyToNumber = (prof) => {
    const map = { exploring: 1, pursuing: 2, proven: 3 }
    return map[prof] || 0
  }

  // Get segment display info - cluster.id is UUID, taxonomy_keys[0] is segment ID
  const getSkillDisplay = (cluster) => {
    const segmentId = cluster.taxonomy_keys?.[0]
    const segment = findSkillSegment(segmentId)
    return {
      id: cluster.id,  // UUID - unique key for selection
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
      id: cluster.id,  // UUID - unique key for selection
      name: cluster.cluster_label || segment?.displayName || 'Problem',
      icon: segment?.icon || '🎯',
      color: segment?.color || '#7c3aed',
      proficiency: proficiencyToNumber(cluster.proficiency)
    }
  }

  // Helper to find cluster by ID from skills/problems arrays
  const findSkillById = (id) => skills.find(s => s.id === id)
  const findProblemById = (id) => problems.find(p => p.id === id)

  // Get display info for a selected skill/problem (by UUID)
  const getSelectedSkillInfo = (skillId) => {
    const cluster = findSkillById(skillId)
    if (!cluster) return { name: 'your skill', icon: '💡' }
    const segmentId = cluster.taxonomy_keys?.[0]
    const segment = findSkillSegment(segmentId)
    return {
      name: cluster.cluster_label || segment?.displayName || 'Skill',
      icon: segment?.icon || '💡'
    }
  }

  const getSelectedProblemInfo = (problemId) => {
    const cluster = findProblemById(problemId)
    if (!cluster) return { name: 'their problem', icon: '🎯' }
    const segmentId = cluster.taxonomy_keys?.[0]
    const segment = PROBLEM_SEGMENTS.find(p => p.id === segmentId)
    return {
      name: cluster.cluster_label || segment?.displayName || 'Problem',
      icon: segment?.icon || '🎯'
    }
  }

  // Handle "Go Play!" - save plan and show encouragement
  const handleGoPlay = () => {
    const skillInfo = getSelectedSkillInfo(formData.selectedSkill)
    const problemInfo = getSelectedProblemInfo(formData.selectedProblem)

    saveProgress({
      phase: 'waiting',
      selectedSkill: formData.selectedSkill,
      selectedProblem: formData.selectedProblem,
      skillName: skillInfo.name,
      problemName: problemInfo.name,
      personType: formData.personType,
      personName: formData.personName,
      personSituation: formData.personSituation,
      reachMethod: formData.reachMethod,
      planDescription: formData.planDescription,
      timeEstimate: formData.timeEstimate
    })

    setPhase('encouragement')
  }

  // Handle resume - user says "I did it!"
  const handleResume = () => {
    if (savedPlan) {
      setFormData(prev => ({
        ...prev,
        selectedSkill: savedPlan.selectedSkill,
        selectedProblem: savedPlan.selectedProblem,
        personType: savedPlan.personType,
        personName: savedPlan.personName,
        personSituation: savedPlan.personSituation || '',
        reachMethod: savedPlan.reachMethod,
        planDescription: savedPlan.planDescription,
        timeEstimate: savedPlan.timeEstimate
      }))
    }
    setPhase('reflect')
    setShowResumePrompt(false)
    goToStep(5)
  }

  // Handle "Not yet" - dismiss resume prompt
  const handleNotYet = () => {
    setShowResumePrompt(false)
  }

  // Character count hint
  const charHint = (value, min) => {
    const len = (value || '').trim().length
    if (len >= min) return <span className="char-hint met">Ready to continue</span>
    return <span className="char-hint">{len}/{min} characters minimum</span>
  }

  if (loading) {
    return (
      <div className="lets-play">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading your skills and problems...</p>
        </div>
      </div>
    )
  }

  if (skills.length === 0 || problems.length === 0) {
    return (
      <div className="lets-play">
        <div className="lets-play-prereq">
          <span className="prereq-icon">🔒</span>
          <p>Complete a Flow Finder flow first to discover your skills and problems.</p>
          <p className="prereq-hint">You need at least 1 skill and 1 problem cluster to play.</p>
        </div>
      </div>
    )
  }

  // Resume prompt (returning with saved plan)
  if (showResumePrompt && savedPlan) {
    return (
      <div className="lets-play">
        <div className="lets-play-resume">
          <p className="resume-title">Welcome back!</p>
          <p className="resume-info">
            You planned to help <strong>{savedPlan.personName}</strong>.
          </p>
          <p className="resume-question">Ready to reflect on how it went?</p>
          <div className="resume-actions">
            <button className="nav-btn next" onClick={handleResume}>
              I did it!
            </button>
            <button className="nav-btn back" onClick={handleNotYet}>
              Not yet
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Encouragement card (after "Go Play!")
  if (phase === 'encouragement') {
    const skillInfo = getSelectedSkillInfo(formData.selectedSkill)
    const problemInfo = getSelectedProblemInfo(formData.selectedProblem)

    return (
      <div className="lets-play">
        <div className="lets-play-encouragement">
          <span className="encouragement-icon">🚀</span>
          <p className="encouragement-text">
            You're going to use <strong>{skillInfo.name}</strong> to help <strong>{formData.personName}</strong> with <strong>{problemInfo.name}</strong>.
          </p>
          <p className="encouragement-sub">
            Come back when you've done it to reflect and earn your points!
          </p>
          <button
            className="nav-btn next"
            onClick={() => {
              setPhase('decide')
              setShowResumePrompt(false)
            }}
          >
            Got it
          </button>
        </div>
      </div>
    )
  }

  // PHASE 1: DECIDE (Steps 1-4)
  if (phase === 'decide') {
    return (
      <div className="lets-play stepped">
        <StepProgress currentStep={step} totalSteps={4} variant="dots" />

        {completionCount > 0 && (
          <div className="difficulty-badge">
            <span className="difficulty-label">{difficultyLevel.label}</span>
            <span className="difficulty-prompt">{difficultyLevel.prompt}</span>
          </div>
        )}

        <div className="step-content">
          {/* Step 1: Pick Your Skill */}
          {step === 1 && (
            <div className="step-section">
              <div className="step-header">
                <span className="step-icon">💡</span>
                <h4>Pick Your Skill</h4>
              </div>
              <p className="step-description">Which of your skills will you use today?</p>

              <div className="combo-options skill-grid">
                {skills.map(cluster => {
                  const display = getSkillDisplay(cluster)
                  return (
                    <button
                      key={display.id}
                      type="button"
                      className={`combo-cell ${formData.selectedSkill === display.id ? 'selected' : ''}`}
                      onClick={() => updateField('selectedSkill', display.id)}
                    >
                      <span className="combo-cell-icon">{display.icon}</span>
                      <span className="combo-cell-name">{display.name}</span>
                      {display.proficiency > 0 && (
                        <span className="combo-cell-prof" style={{ color: display.color }}>
                          {'●'.repeat(Math.min(display.proficiency, 3))}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2: Pick Their Problem */}
          {step === 2 && (
            <div className="step-section">
              <div className="step-header">
                <span className="step-icon">🎯</span>
                <h4>Pick Their Problem</h4>
              </div>
              <p className="step-description">What problem will you help someone solve?</p>

              {formData.selectedSkill && (() => {
                const skillInfo = getSelectedSkillInfo(formData.selectedSkill)
                return (
                  <div className="selected-context">
                    <span className="context-label">Using:</span>
                    <span className="context-value">{skillInfo.icon} {skillInfo.name}</span>
                  </div>
                )
              })()}

              <div className="combo-options problem-grid">
                {problems.map(cluster => {
                  const display = getProblemDisplay(cluster)
                  return (
                    <button
                      key={display.id}
                      type="button"
                      className={`combo-cell ${formData.selectedProblem === display.id ? 'selected' : ''}`}
                      onClick={() => updateField('selectedProblem', display.id)}
                    >
                      <span className="combo-cell-icon">{display.icon}</span>
                      <span className="combo-cell-name">{display.name}</span>
                      {display.proficiency > 0 && (
                        <span className="combo-cell-prof" style={{ color: display.color }}>
                          {'●'.repeat(Math.min(display.proficiency, 3))}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Who Will You Help? */}
          {step === 3 && (
            <div className="step-section">
              <div className="step-header">
                <span className="step-icon">👤</span>
                <h4>Who Will You Help?</h4>
              </div>
              <p className="step-description">Think of someone who has this problem. Who comes to mind?</p>

              <div className="step-subsection">
                <label className="input-label">Person type</label>
                <IconGrid
                  items={PERSON_TYPES}
                  selected={formData.personType}
                  onSelect={(val) => updateField('personType', val)}
                  columns={3}
                  className="lets-play-icon-grid"
                />
              </div>

              <div className="step-subsection">
                <label className="input-label">First name</label>
                <input
                  type="text"
                  className="lets-play-text-input"
                  placeholder="Their first name"
                  value={formData.personName}
                  onChange={(e) => updateField('personName', e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="step-subsection">
                <label className="input-label">Their situation <span className="optional-tag">(optional)</span></label>
                <textarea
                  className="lets-play-textarea"
                  placeholder="What are they dealing with? (optional)"
                  value={formData.personSituation}
                  onChange={(e) => updateField('personSituation', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 4: Plan Your Move */}
          {step === 4 && (() => {
            const skillInfo = getSelectedSkillInfo(formData.selectedSkill)
            const problemInfo = getSelectedProblemInfo(formData.selectedProblem)
            return (
            <div className="step-section">
              <div className="step-header">
                <span className="step-icon">🗺️</span>
                <h4>Plan Your Move</h4>
              </div>
              <p className="step-description">
                How will you use {skillInfo.name} to help {formData.personName || 'them'} with {problemInfo.name}?
              </p>

              <div className="step-subsection">
                <label className="input-label">How will you reach them?</label>
                <IconGrid
                  items={REACH_METHODS}
                  selected={formData.reachMethod}
                  onSelect={(val) => updateField('reachMethod', val)}
                  columns={3}
                  className="lets-play-icon-grid"
                />
              </div>

              <div className="step-subsection">
                <label className="input-label">What will you do or offer?</label>
                <textarea
                  className="lets-play-textarea"
                  placeholder="Describe your plan in a sentence or two..."
                  value={formData.planDescription}
                  onChange={(e) => updateField('planDescription', e.target.value)}
                  rows={3}
                />
                {charHint(formData.planDescription, 10)}
              </div>

              <div className="step-subsection">
                <label className="input-label">How long will it take?</label>
                <IconGrid
                  items={TIME_ESTIMATES}
                  selected={formData.timeEstimate}
                  onSelect={(val) => updateField('timeEstimate', val)}
                  columns={5}
                  variant="compact"
                  className="lets-play-icon-grid"
                />
              </div>
            </div>
            )
          })()}
        </div>

        {/* Navigation */}
        <div className="step-navigation">
          {step > 1 && (
            <button className="nav-btn back" onClick={handleBack}>
              ← Back
            </button>
          )}
          {step < 4 ? (
            <button
              className="nav-btn next"
              onClick={handleNext}
              disabled={!canContinue()}
            >
              Continue →
            </button>
          ) : (
            <button
              className="nav-btn complete"
              onClick={handleGoPlay}
              disabled={!canContinue()}
            >
              Go Play! 🚀
            </button>
          )}
        </div>
      </div>
    )
  }

  // PHASE 2: REFLECT (Steps 5-6)
  if (phase === 'reflect') {
    return (
      <div className="lets-play stepped">
        <StepProgress currentStep={step - 4} totalSteps={2} variant="dots" />

        <div className="step-content">
          {/* Step 5: What Actually Happened? */}
          {step === 5 && (
            <div className="step-section">
              <div className="step-header">
                <span className="step-icon">✨</span>
                <h4>What Actually Happened?</h4>
              </div>
              <p className="step-description">
                You planned to: <em>"{formData.planDescription}"</em>
              </p>

              <div className="step-subsection">
                <label className="input-label">What did you actually do?</label>
                <textarea
                  className="lets-play-textarea"
                  placeholder={`What happened when you helped ${formData.personName}?`}
                  value={formData.whatHappened}
                  onChange={(e) => updateField('whatHappened', e.target.value)}
                  rows={3}
                />
                {charHint(formData.whatHappened, 10)}
              </div>

              <div className="step-subsection">
                <label className="input-label">How did it land?</label>
                <div className="outcome-grid">
                  {OUTCOME_RATINGS.map(rating => (
                    <button
                      key={rating.id}
                      type="button"
                      className={`outcome-card ${formData.outcomeRating === rating.id ? 'selected' : ''}`}
                      onClick={() => updateField('outcomeRating', rating.id)}
                    >
                      <span className="outcome-icon">{rating.icon}</span>
                      <span className="outcome-label">{rating.label}</span>
                      <span className="outcome-desc">{rating.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 6: What Did You Learn? */}
          {step === 6 && (
            <div className="step-section">
              <div className="step-header">
                <span className="step-icon">📝</span>
                <h4>What Did You Learn?</h4>
              </div>
              <p className="step-description">Every play teaches you something about your flow.</p>

              <div className="step-subsection">
                <label className="input-label">What surprised you? <span className="optional-tag">(optional)</span></label>
                <textarea
                  className="lets-play-textarea"
                  placeholder="Anything unexpected about the experience? (optional)"
                  value={formData.whatSurprised}
                  onChange={(e) => updateField('whatSurprised', e.target.value)}
                  rows={2}
                />
              </div>

              <div className="step-subsection">
                <label className="input-label">What would you do differently? <span className="optional-tag">(optional)</span></label>
                <textarea
                  className="lets-play-textarea"
                  placeholder="How would you adjust next time? (optional)"
                  value={formData.whatDifferently}
                  onChange={(e) => updateField('whatDifferently', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="step-navigation">
          {step > 5 && (
            <button className="nav-btn back" onClick={handleBack}>
              ← Back
            </button>
          )}
          {step < 6 ? (
            <button
              className="nav-btn next"
              onClick={handleNext}
              disabled={!canContinue()}
            >
              Continue →
            </button>
          ) : (
            <button
              className="nav-btn complete"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Complete Quest ✨'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}

export default LetsPlayInput
