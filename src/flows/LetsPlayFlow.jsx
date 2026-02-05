/**
 * LetsPlayFlow - Bottom-up validation flow (Planning Quest)
 *
 * Pick skill×problem combo, choose who to help, plan your move.
 * Reflection happens in separate LetsPlayReviewFlow after real-world action.
 *
 * Uses useAutoSave to persist plan for review quest reference.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useAutoSave } from '../hooks/useAutoSave'
import { fetchFlowFinderData } from '../lib/crm/groanChallengeService'
import { SKILLS_SEGMENTS, PROBLEM_SEGMENTS } from '../lib/wheelTaxonomy'
import { supabase } from '../lib/supabaseClient'
import '../styles/flow-base.css'
import './LetsPlayFlow.css'

// Person type options
const PERSON_TYPES = [
  { id: 'myself', label: 'Myself', icon: '🙋' },
  { id: 'friend', label: 'Friend', icon: '👫' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧' },
  { id: 'colleague', label: 'Colleague', icon: '💼' },
  { id: 'acquaintance', label: 'Acquaintance', icon: '🤝' },
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

// Escalating difficulty descriptions
const DIFFICULTY_LEVELS = [
  { min: 0, label: 'Starter', prompt: 'Help someone you know' },
  { min: 3, label: 'Growing', prompt: 'Help someone outside your close circle' },
  { min: 7, label: 'Confident', prompt: "Help someone you've never met" },
  { min: 12, label: 'Pro', prompt: 'Help someone and ask for a testimonial' }
]

// Pre-action: Visibility layers (WHERE resistance shows up)
const VISIBILITY_LAYERS = [
  { id: 'screen', icon: '📱', label: 'Screen', description: 'Being seen/judged online' },
  { id: 'live', icon: '⚡', label: 'Live', description: "Real-time, can't take it back" },
  { id: 'vulnerable', icon: '💗', label: 'Vulnerable', description: 'Showing something unfinished' },
  { id: 'money', icon: '💰', label: 'Money', description: 'Asking to be paid' },
  { id: 'authority', icon: '👑', label: 'Authority', description: 'Claiming expertise' }
]

// Pre-action: Protective voices (HOW resistance sounds)
const PROTECTIVE_VOICES = [
  { id: 'perfectionist', icon: '🎭', label: 'Perfectionist', description: 'It needs to be perfect first' },
  { id: 'people_pleaser', icon: '🤝', label: 'People Pleaser', description: "I don't want to bother anyone" },
  { id: 'controller', icon: '🎛️', label: 'Controller', description: "I can't control their response" },
  { id: 'performer', icon: '🎪', label: 'Performer', description: 'I need more figured out first' },
  { id: 'ghost', icon: '👻', label: 'Ghost', description: "I'd rather stay quiet" }
]

// Pre-action: Essence messages based on voice + layer
const getEssenceMessage = (voice, layer) => {
  const messages = {
    'perfectionist_screen': 'Your Perfectionist wants it perfect before anyone sees. But real feedback beats endless planning.',
    'perfectionist_vulnerable': 'Your Perfectionist fears showing rough work. But done beats perfect every time.',
    'perfectionist_live': 'Your Perfectionist fears making mistakes. But you learn by doing.',
    'perfectionist_money': 'Your Perfectionist wants perfect value first. But clarity comes from action.',
    'perfectionist_authority': 'Your Perfectionist wants more credentials. But your experience is already valuable.',
    'people_pleaser_screen': 'Your People Pleaser worries about bothering people. But helping is generous, not pushy.',
    'people_pleaser_vulnerable': 'Your People Pleaser fears imposing. But people want what you offer.',
    'people_pleaser_live': 'Your People Pleaser fears disappointing someone. But you can\'t help everyone.',
    'people_pleaser_money': 'Your People Pleaser feels awkward asking. But fair exchange honors both parties.',
    'people_pleaser_authority': 'Your People Pleaser worries about seeming arrogant. But sharing expertise is service.',
    'controller_screen': 'Your Controller can\'t predict their response. But every response teaches you something.',
    'controller_vulnerable': 'Your Controller wants certainty first. But action creates clarity.',
    'controller_live': 'Your Controller wants to script outcomes. But real insights come from real moments.',
    'controller_money': 'Your Controller fears rejection. But every "no" brings clarity.',
    'controller_authority': 'Your Controller wants guaranteed results. But authority is built through action.',
    'performer_screen': 'Your Performer wants a bigger stage. But small stages build big skills.',
    'performer_vulnerable': 'Your Performer feels unqualified. But doing builds confidence.',
    'performer_live': 'Your Performer wants to prove expertise first. But action IS proof.',
    'performer_money': 'Your Performer wants more success stories. But you start with one.',
    'performer_authority': 'Your Performer needs more validation. But validation comes from shipping.',
    'ghost_screen': 'Your Ghost wants to stay invisible. But your skills deserve to be seen.',
    'ghost_vulnerable': 'Your Ghost says hiding is safer. But connection requires visibility.',
    'ghost_live': 'Your Ghost prefers silence. But your voice matters.',
    'ghost_money': 'Your Ghost avoids asking. But claiming your worth is powerful.',
    'ghost_authority': 'Your Ghost shrinks from claiming expertise. But quiet authority is still authority.'
  }
  return messages[`${voice}_${layer}`] || 'Your protective voice is trying to keep you safe. But you don\'t need protection from helping people.'
}

// Initial form data
const INITIAL_FORM_DATA = {
  // Pre-action
  preActionFeeling: null,
  visibilityLayer: null,
  protectiveVoice: null,
  // Main flow
  selectedSkill: null,
  selectedProblem: null,
  personType: null,
  personName: '',
  personSituation: '',
  reachMethod: null,
  planDescription: '',
  timeEstimate: null
}

export default function LetsPlayFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [preActionSubStep, setPreActionSubStep] = useState('feeling') // feeling | layer | voice | essence
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [completionCount, setCompletionCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { saveProgress } = useAutoSave('lets_play', user?.id)

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

        // Count past completions for difficulty escalation
        const { count } = await supabase
          .from('quest_completions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('quest_id', 'lets_play')

        setCompletionCount(count || 0)
      } catch (err) {
        console.warn('LetsPlayFlow init error:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [user?.id])

  // Get current difficulty level
  const difficultyLevel = useMemo(() => {
    return [...DIFFICULTY_LEVELS].reverse().find(d => completionCount >= d.min) || DIFFICULTY_LEVELS[0]
  }, [completionCount])

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

  // Get display info for a selected skill/problem (by UUID)
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
    if (!cluster) return { name: 'their problem', icon: '🎯' }
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
      case 0: return true // Intro screen
      case 1: return formData.selectedSkill !== null
      case 2: return formData.selectedProblem !== null
      case 3: return formData.personType !== null && formData.personName.trim().length >= 2
      case 4: return formData.reachMethod !== null && formData.planDescription.trim().length >= 10 && formData.timeEstimate !== null
      case 5: return preActionSubStep === 'done' // Pre-action complete
      default: return false
    }
  }

  // Handle pre-action feeling selection
  const handleFeelingSelect = (feeling) => {
    updateField('preActionFeeling', feeling)
    if (feeling === 'excited' || feeling === 'ready') {
      // Skip to Go Play for positive feelings
      setPreActionSubStep('done')
    } else {
      // Continue to visibility layer for nervous/resistant
      setPreActionSubStep('layer')
    }
  }

  // Handle visibility layer selection
  const handleLayerSelect = (layer) => {
    updateField('visibilityLayer', layer)
    setPreActionSubStep('voice')
  }

  // Handle protective voice selection
  const handleVoiceSelect = (voice) => {
    updateField('protectiveVoice', voice)
    setPreActionSubStep('essence')
  }

  // Handle essence acknowledgment - ready to Go Play
  const handleEssenceAcknowledge = () => {
    setPreActionSubStep('done')
  }

  const handleNext = () => {
    if (canContinue()) {
      setStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (step === 5) {
      // Handle back within pre-action sub-steps
      if (preActionSubStep === 'feeling') {
        setStep(4) // Go back to Plan Your Move
        setPreActionSubStep('feeling') // Reset for next time
      } else if (preActionSubStep === 'layer') {
        setPreActionSubStep('feeling')
      } else if (preActionSubStep === 'voice') {
        setPreActionSubStep('layer')
      } else if (preActionSubStep === 'essence') {
        setPreActionSubStep('voice')
      } else if (preActionSubStep === 'done') {
        // Going back from "done" state
        if (formData.preActionFeeling === 'excited' || formData.preActionFeeling === 'ready') {
          setPreActionSubStep('feeling')
        } else {
          setPreActionSubStep('essence')
        }
      }
    } else if (step > 0) {
      setStep(prev => prev - 1)
    }
  }

  // Handle "Go Play!" - save plan to database and show encouragement
  const handleGoPlay = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const skillInfo = getSelectedSkillInfo(formData.selectedSkill)
      const problemInfo = getSelectedProblemInfo(formData.selectedProblem)

      const structuredData = {
        quest_type: 'lets_play',
        phase: 'pending_review',
        // Pre-action data
        pre_action_feeling: formData.preActionFeeling,
        visibility_layer: formData.visibilityLayer || null,
        protective_voice: formData.protectiveVoice || null,
        // Main flow data
        skill_id: formData.selectedSkill,
        skill_name: skillInfo.name,
        problem_id: formData.selectedProblem,
        problem_name: problemInfo.name,
        person_type: formData.personType,
        person_name: formData.personName,
        person_situation: formData.personSituation || null,
        reach_method: formData.reachMethod,
        plan_description: formData.planDescription,
        time_estimate: formData.timeEstimate,
        completion_number: completionCount + 1
      }

      // Save to quest_completions
      const { data, error } = await supabase
        .from('quest_completions')
        .insert({
          user_id: user.id,
          challenge_instance_id: null,
          quest_id: 'lets_play',
          quest_category: 'Business',
          quest_type: 'Validation',
          points_earned: 8,
          challenge_day: 0,
          reflection_text: JSON.stringify(structuredData),
          project_id: null,
          stage: 1
        })
        .select()

      if (error) {
        console.error('Error saving Let\'s Play:', error)
        alert('Failed to save. Please try again.')
        setIsSubmitting(false)
        return
      }

      console.log('Let\'s Play saved:', data)

      // Also save to localStorage for the review quest to reference
      saveProgress({
        phase: 'pending_review',
        completionId: data?.[0]?.id,
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

      setShowEncouragement(true)
    } catch (err) {
      console.error('Let\'s Play error:', err)
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
            <p>You need to discover your skills and problems before you can play.</p>
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

  // Encouragement card (after "Go Play!")
  if (showEncouragement) {
    const skillInfo = getSelectedSkillInfo(formData.selectedSkill)
    const problemInfo = getSelectedProblemInfo(formData.selectedProblem)

    return (
      <div className="lets-play-flow flow-base">
        <div className="flow-content">
          <div className="encouragement-card">
            <span className="encouragement-icon">🚀</span>
            <h2>You're ready!</h2>
            <p className="encouragement-text">
              You're going to use <strong>{skillInfo.name}</strong> to help <strong>{formData.personName}</strong> with <strong>{problemInfo.name}</strong>.
            </p>
            <p className="encouragement-sub">
              After you've done it, complete the <strong>Let's Play Review</strong> quest to reflect and earn bonus points!
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
          <p className="time-icon">🎮</p>
          <h1 className="welcome-greeting">Ready to Play?</h1>
          <div className="welcome-message animated-text">
            <p>Most people waste time writing out business plans and overplanning.</p>
            <p>But the best way to build a business? <strong>Start delivering value</strong>, getting feedback and improving over time.</p>
            <p>That's it. That's the game.</p>
            <p><strong>To start:</strong> Pick a skill. Pick a problem. Help one real person.</p>
          </div>
          <button className="primary-button" onClick={() => setStep(1)}>
            Let's Play
          </button>
          <button className="go-back-link" onClick={() => navigate('/7-day-challenge')}>
            Go back
          </button>
        </div>
      </div>
    )
  }

  // Pre-action step (step 5) - after Plan Your Move
  if (step === 5) {
    return (
      <div className="lets-play-flow flow-base">
        <div className="flow-content">
          {/* Feeling sub-step */}
          {preActionSubStep === 'feeling' && (
            <div className="question-container">
              <div className="question-number">One last thing...</div>
              <h2 className="question-text">How Do You Feel?</h2>
              <p className="question-subtext">About going out and doing this</p>

              <div className="options-list">
                <button
                  type="button"
                  className={`option-card ${formData.preActionFeeling === 'excited' ? 'selected' : ''}`}
                  onClick={() => handleFeelingSelect('excited')}
                >
                  <span className="option-icon">🔥</span>
                  <span className="option-name">Excited</span>
                  <span className="option-desc">Let's do this!</span>
                </button>
                <button
                  type="button"
                  className={`option-card ${formData.preActionFeeling === 'ready' ? 'selected' : ''}`}
                  onClick={() => handleFeelingSelect('ready')}
                >
                  <span className="option-icon">✅</span>
                  <span className="option-name">Ready</span>
                  <span className="option-desc">Feeling prepared</span>
                </button>
                <button
                  type="button"
                  className={`option-card ${formData.preActionFeeling === 'nervous' ? 'selected' : ''}`}
                  onClick={() => handleFeelingSelect('nervous')}
                >
                  <span className="option-icon">😰</span>
                  <span className="option-name">Nervous</span>
                  <span className="option-desc">A bit anxious</span>
                </button>
                <button
                  type="button"
                  className={`option-card ${formData.preActionFeeling === 'resistant' ? 'selected' : ''}`}
                  onClick={() => handleFeelingSelect('resistant')}
                >
                  <span className="option-icon">🛑</span>
                  <span className="option-name">Resistant</span>
                  <span className="option-desc">Feeling blocked</span>
                </button>
              </div>
            </div>
          )}

          {/* Visibility Layer sub-step */}
          {preActionSubStep === 'layer' && (
            <div className="question-container">
              <div className="question-number">Let's explore that...</div>
              <h2 className="question-text">What Feels Hard?</h2>
              <p className="question-subtext">Where does the resistance show up?</p>

              <div className="options-list">
                {VISIBILITY_LAYERS.map(layer => (
                  <button
                    key={layer.id}
                    type="button"
                    className={`option-card ${formData.visibilityLayer === layer.id ? 'selected' : ''}`}
                    onClick={() => handleLayerSelect(layer.id)}
                  >
                    <span className="option-icon">{layer.icon}</span>
                    <span className="option-name">{layer.label}</span>
                    <span className="option-desc">{layer.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Protective Voice sub-step */}
          {preActionSubStep === 'voice' && (
            <div className="question-container">
              <div className="question-number">Almost there...</div>
              <h2 className="question-text">What's The Voice Saying?</h2>
              <p className="question-subtext">Choose the one that sounds most familiar</p>

              <div className="options-list">
                {PROTECTIVE_VOICES.map(voice => (
                  <button
                    key={voice.id}
                    type="button"
                    className={`option-card ${formData.protectiveVoice === voice.id ? 'selected' : ''}`}
                    onClick={() => handleVoiceSelect(voice.id)}
                  >
                    <span className="option-icon">{voice.icon}</span>
                    <span className="option-name">{voice.label}</span>
                    <span className="option-desc">{voice.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Essence Message sub-step */}
          {preActionSubStep === 'essence' && (
            <div className="question-container">
              <div className="question-number">Your essence knows...</div>
              <h2 className="question-text">You've Got This</h2>

              <div className="selected-context" style={{ marginBottom: '24px', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', fontSize: '1.5rem' }}>
                  <span>{PROTECTIVE_VOICES.find(v => v.id === formData.protectiveVoice)?.icon}</span>
                  <span>×</span>
                  <span>{VISIBILITY_LAYERS.find(l => l.id === formData.visibilityLayer)?.icon}</span>
                </div>
              </div>

              <p className="question-subtext" style={{ fontSize: '1rem', lineHeight: 1.6, maxWidth: '400px' }}>
                {getEssenceMessage(formData.protectiveVoice, formData.visibilityLayer)}
              </p>

              <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '24px', fontSize: '0.9rem' }}>
                <strong style={{ color: '#ffdd27' }}>Your essence knows:</strong> You have something valuable to share. Start imperfectly.
              </p>

              <button className="primary-button" style={{ marginTop: '32px' }} onClick={handleEssenceAcknowledge}>
                I'm Ready
              </button>
            </div>
          )}

          {/* Done sub-step - show Go Play button */}
          {preActionSubStep === 'done' && (
            <div className="question-container">
              <div className="question-number">You're all set!</div>
              <h2 className="question-text">Time to Play</h2>
              <p className="question-subtext">Go help someone and come back to reflect</p>

              <button className="primary-button" style={{ marginTop: '32px' }} onClick={handleGoPlay} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Go Play!'}
              </button>
            </div>
          )}
        </div>

        {/* Navigation for pre-action */}
        <div className="flow-navigation">
          {preActionSubStep === 'feeling' && (
            <button className="go-back-link" onClick={() => setStep(4)}>
              Go back
            </button>
          )}
          {(preActionSubStep === 'layer' || preActionSubStep === 'voice') && (
            <button className="go-back-link" onClick={handleBack}>
              Go back
            </button>
          )}
          {preActionSubStep === 'done' && (
            <button className="go-back-link" onClick={handleBack}>
              Go back
            </button>
          )}
        </div>
      </div>
    )
  }

  // Progress dots (for steps 1-4)
  const totalSteps = 4
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
        {completionCount > 0 && (
          <div className="difficulty-badge">
            <span className="difficulty-label">{difficultyLevel.label}</span>
            <span className="difficulty-prompt">{difficultyLevel.prompt}</span>
          </div>
        )}
      </div>

      <div className="flow-content">
            {/* Step 1: Pick Your Skill */}
            {step === 1 && (
              <div className="question-container">
                <div className="question-number">Step 1 of 4</div>
                <h2 className="question-text">Pick Your Skill</h2>
                <p className="question-subtext">Which of these skills will you choose to test first?</p>

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

            {/* Step 2: Pick Their Problem */}
            {step === 2 && (
              <div className="question-container">
                <div className="question-number">Step 2 of 4</div>
                <h2 className="question-text">Pick Their Problem</h2>
                <p className="question-subtext">What problem will you help someone solve?</p>

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

            {/* Step 3: Who Will You Help? */}
            {step === 3 && (
              <div className="question-container">
                <div className="question-number">Step 3 of 4</div>
                <h2 className="question-text">Who Will You Help?</h2>
                <p className="question-subtext">Think of someone who has this problem.</p>

                <div className="input-group">
                  <label className="input-label">Person type</label>
                  <div className="icon-grid">
                    {PERSON_TYPES.map(type => (
                      <button
                        key={type.id}
                        type="button"
                        className={`icon-btn ${formData.personType === type.id ? 'selected' : ''}`}
                        onClick={() => updateField('personType', type.id)}
                      >
                        <span className="icon-btn-icon">{type.icon}</span>
                        <span className="icon-btn-label">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">First name</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Their first name"
                    value={formData.personName}
                    onChange={(e) => updateField('personName', e.target.value)}
                    maxLength={50}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Their situation <span className="optional">(optional)</span></label>
                  <textarea
                    className="textarea"
                    placeholder="What are they dealing with?"
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
                <div className="question-container">
                  <div className="question-number">Step 4 of 4</div>
                  <h2 className="question-text">Plan Your Move</h2>
                  <p className="question-subtext">
                    How will you use {skillInfo.name} to help {formData.personName || 'them'} with {problemInfo.name}?
                  </p>

                  <div className="input-group">
                    <label className="input-label">How will you reach them?</label>
                    <div className="icon-grid">
                      {REACH_METHODS.map(method => (
                        <button
                          key={method.id}
                          type="button"
                          className={`icon-btn ${formData.reachMethod === method.id ? 'selected' : ''}`}
                          onClick={() => updateField('reachMethod', method.id)}
                        >
                          <span className="icon-btn-icon">{method.icon}</span>
                          <span className="icon-btn-label">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">What will you do or offer?</label>
                    <textarea
                      className="textarea"
                      placeholder="Describe your plan in a sentence or two..."
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
                </div>
              )
            })()}
      </div>

      {/* Navigation */}
      <div className="flow-navigation">
        {step >= 1 && step <= 4 && (
          <button className="primary-button" onClick={handleNext} disabled={!canContinue()}>
            Continue
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
