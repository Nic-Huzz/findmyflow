/**
 * SelfTestFlow - Prove your skill works on yourself before helping others
 *
 * Pick skill x problem combo, plan how to apply it to yourself,
 * process any resistance (pre-action), then go do it.
 *
 * Reflection happens in separate SelfTestReviewFlow after real-world action.
 * Uses useAutoSave to persist plan for review quest reference.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useAutoSave } from '../hooks/useAutoSave'
import { useProjectId } from '../hooks/useProjectId'
import { fetchFlowFinderData } from '../lib/crm/groanChallengeService'
import { SKILLS_SEGMENTS, PROBLEM_SEGMENTS, findSkillSegment } from '../lib/wheelTaxonomy'
import { supabase } from '../lib/supabaseClient'
import '../styles/flow-base.css'
import FlowFeedback from '../components/FlowFeedback/FlowFeedback'
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
  { id: 'controller', icon: '🎮', label: 'Controller', description: "Leaving it to chance isn't an option" },
  { id: 'ghost', icon: '👻', label: 'Ghost', description: "I don't feel comfortable sharing" },
  { id: 'auto_pilot', icon: '🛋️', label: 'Auto-Pilot', description: "I'm fine, just tired" }
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
    'auto_pilot_screen': 'Your Auto-Pilot says it doesn\'t matter. But your ideas deserve to exist.',
    'auto_pilot_vulnerable': 'Your Auto-Pilot has stopped caring. But that numbness is protection, not truth.',
    'auto_pilot_live': 'Your Auto-Pilot can\'t find the energy. But presence returns with one small action.',
    'auto_pilot_money': 'Your Auto-Pilot says "what\'s the point?" But wanting something is the first step back.',
    'auto_pilot_authority': 'Your Auto-Pilot has checked out. But you still have something worth sharing.',
    'ghost_screen': 'Your Ghost wants to stay invisible. But your skills deserve to be seen.',
    'ghost_vulnerable': 'Your Ghost says hiding is safer. But connection requires visibility.',
    'ghost_live': 'Your Ghost prefers silence. But your voice matters.',
    'ghost_money': 'Your Ghost avoids asking. But claiming your worth is powerful.',
    'ghost_authority': 'Your Ghost shrinks from claiming expertise. But quiet authority is still authority.'
  }
  return messages[`${voice}_${layer}`] || 'Your protective voice is trying to keep you safe. But you don\'t need protection from testing your own skills.'
}

const INITIAL_FORM_DATA = {
  selectedSkill: null,
  selectedProblem: null,
  planDescription: '',
  timeEstimate: null,
  whenPlanned: null,
  // Pre-action fields
  preActionFeeling: null,
  visibilityLayer: null,
  protectiveVoice: null
}

export default function SelfTestFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { projectId } = useProjectId()
  const [skills, setSkills] = useState([])
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [preActionSubStep, setPreActionSubStep] = useState('feeling') // feeling | layer | voice | essence | done
  const [showEncouragement, setShowEncouragement] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [completionCount, setCompletionCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [savedResults, setSavedResults] = useState(null)

  const { saveProgress } = useAutoSave('self_test', user?.id)

  // Scroll to top on step/sub-step changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step, preActionSubStep])

  // Check for ?results=true to show saved results directly
  useEffect(() => {
    const loadSavedResults = async () => {
      if (searchParams.get('results') !== 'true' || !user) return

      try {
        const { data: completions, error } = await supabase
          .from('quest_completions')
          .select('id, reflection_text, created_at')
          .eq('user_id', user.id)
          .eq('quest_id', 'self_test')
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

  // Fetch Flow Finder data (skip if viewing results)
  useEffect(() => {
    if (searchParams.get('results') === 'true') return

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

  // Convert proficiency text to number for display
  const proficiencyToNumber = (prof) => {
    const map = { exploring: 1, pursuing: 2, proven: 3 }
    return map[prof] || 0
  }

  // Get segment display info
  const getSkillDisplay = (cluster) => {
    const segmentId = cluster.taxonomy_keys?.[0]
    const segment = findSkillSegment(segmentId)
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
    const segment = findSkillSegment(segmentId)
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
      case 4: return preActionSubStep === 'done'
      default: return false
    }
  }

  // Handle pre-action feeling selection
  const handleFeelingSelect = (feeling) => {
    updateField('preActionFeeling', feeling)
    if (feeling === 'excited' || feeling === 'ready') {
      setPreActionSubStep('done')
    } else {
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

  // Handle essence acknowledgment
  const handleEssenceAcknowledge = () => {
    setPreActionSubStep('done')
  }

  const handleNext = () => {
    if (canContinue()) {
      setStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (step === 4) {
      // Handle back within pre-action sub-steps
      if (preActionSubStep === 'feeling') {
        setStep(3)
        setPreActionSubStep('feeling')
      } else if (preActionSubStep === 'layer') {
        setPreActionSubStep('feeling')
      } else if (preActionSubStep === 'voice') {
        setPreActionSubStep('layer')
      } else if (preActionSubStep === 'essence') {
        setPreActionSubStep('voice')
      } else if (preActionSubStep === 'done') {
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

  // Handle "Go Test It!" - save plan and show encouragement
  const handleCommit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const skillInfo = getSelectedSkillInfo(formData.selectedSkill)
      const problemInfo = getSelectedProblemInfo(formData.selectedProblem)

      const structuredData = {
        quest_type: 'self_test',
        phase: 'pending_reflection',
        // Pre-action data
        pre_action_feeling: formData.preActionFeeling,
        visibility_layer: formData.visibilityLayer || null,
        protective_voice: formData.protectiveVoice || null,
        // Main flow data
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
          project_id: projectId || null,
          stage: 1
        })
        .select()

      if (error) {
        console.error('Error saving Self-Test:', error)
        alert('Failed to save. Please try again.')
        setIsSubmitting(false)
        return
      }

      // Save to localStorage for the review quest to reference
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

    const feeling = savedResults.pre_action_feeling
    const voice = PROTECTIVE_VOICES.find(v => v.id === savedResults.protective_voice)
    const layer = VISIBILITY_LAYERS.find(l => l.id === savedResults.visibility_layer)

    return (
      <div className="lets-play-flow flow-base">
        <div className="flow-content">
          <div className="question-container">
            <div className="question-number">Your Self-Trial</div>
            <h2 className="question-text">🔬 {savedResults.skill_name}</h2>
            <p className="question-subtext">Applied to: {savedResults.problem_name}</p>

            <div className="input-group">
              <label className="input-label">Your plan</label>
              <p style={{ color: 'rgba(255,255,255,0.9)', margin: '4px 0 0', lineHeight: 1.5 }}>
                {savedResults.plan_description}
              </p>
            </div>

            {savedResults.time_estimate && (
              <div className="input-group">
                <label className="input-label">Time estimate</label>
                <p style={{ color: 'rgba(255,255,255,0.9)', margin: '4px 0 0' }}>
                  {TIME_ESTIMATES.find(t => t.id === savedResults.time_estimate)?.label || savedResults.time_estimate}
                </p>
              </div>
            )}

            {feeling && (
              <div className="input-group">
                <label className="input-label">How you felt</label>
                <p style={{ color: 'rgba(255,255,255,0.9)', margin: '4px 0 0', textTransform: 'capitalize' }}>
                  {feeling}
                  {voice && layer && (
                    <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                      — {voice.icon} {voice.label} × {layer.icon} {layer.label}
                    </span>
                  )}
                </p>
              </div>
            )}

            {savedResults.phase === 'completed' && savedResults.outcome_rating && (
              <div className="input-group">
                <label className="input-label">Outcome</label>
                <p style={{ color: 'rgba(255,255,255,0.9)', margin: '4px 0 0' }}>
                  {savedResults.outcome_rating.replace(/_/g, ' ')}
                </p>
              </div>
            )}

            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginTop: '16px' }}>
              {new Date(savedResults.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flow-navigation">
          <button className="primary-button" onClick={() => navigate('/self-test')}>
            Start New Self-Trial
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
            <span className="prereq-icon">{'🔒'}</span>
            <h2>Complete Flow Finder First</h2>
            <p>You need to discover your skills and problems before you can start a self-trial.</p>
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

  // Encouragement card (after "Go Test It!")
  if (showEncouragement) {
    const skillInfo = getSelectedSkillInfo(formData.selectedSkill)
    const problemInfo = getSelectedProblemInfo(formData.selectedProblem)

    return (
      <div className="lets-play-flow flow-base">
        <div className="flow-content">
          <div className="encouragement-card">
            <span className="encouragement-icon">{'🔬'}</span>
            <h2>Go Test It!</h2>
            <p className="encouragement-text">
              You're going to apply <strong>{skillInfo.name}</strong> to <strong>{problemInfo.name}</strong> — on yourself.
            </p>
            <p className="encouragement-sub">
              After you've done it, complete the <strong>Play-list Self-Trial Review</strong> quest to reflect and earn bonus points!
            </p>
            <FlowFeedback flowType="self_test" userId={user?.id} />

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
          <p className="time-icon">{'🔬'}</p>
          <h1 className="welcome-greeting">Play-list Self-Trial</h1>
          <div className="welcome-message">
            <p>You know that skill you've been sharpening? Time to point it at yourself.</p>
            <p>Pick a skill. Pick a problem <strong>you're</strong> actually dealing with. Use one to solve the other.</p>
            <p>Your best proof of concept is you.</p>
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

  // Pre-action step (step 4) - after Plan
  if (step === 4) {
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
                  <span className="option-icon">{'🔥'}</span>
                  <span className="option-name">Excited</span>
                  <span className="option-desc">Let's do this!</span>
                </button>
                <button
                  type="button"
                  className={`option-card ${formData.preActionFeeling === 'ready' ? 'selected' : ''}`}
                  onClick={() => handleFeelingSelect('ready')}
                >
                  <span className="option-icon">{'✅'}</span>
                  <span className="option-name">Ready</span>
                  <span className="option-desc">Feeling prepared</span>
                </button>
                <button
                  type="button"
                  className={`option-card ${formData.preActionFeeling === 'nervous' ? 'selected' : ''}`}
                  onClick={() => handleFeelingSelect('nervous')}
                >
                  <span className="option-icon">{'😰'}</span>
                  <span className="option-name">Nervous</span>
                  <span className="option-desc">A bit anxious</span>
                </button>
                <button
                  type="button"
                  className={`option-card ${formData.preActionFeeling === 'resistant' ? 'selected' : ''}`}
                  onClick={() => handleFeelingSelect('resistant')}
                >
                  <span className="option-icon">{'🛑'}</span>
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
                  <span>{'×'}</span>
                  <span>{VISIBILITY_LAYERS.find(l => l.id === formData.visibilityLayer)?.icon}</span>
                </div>
              </div>

              <p className="question-subtext" style={{ fontSize: '1rem', lineHeight: 1.6, maxWidth: '400px' }}>
                {getEssenceMessage(formData.protectiveVoice, formData.visibilityLayer)}
              </p>

              <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '24px', fontSize: '0.9rem' }}>
                <strong style={{ color: '#ffdd27' }}>Your essence knows:</strong> You have something valuable to test. Start imperfectly.
              </p>

              <button className="primary-button" style={{ marginTop: '32px' }} onClick={handleEssenceAcknowledge}>
                I'm Ready
              </button>
            </div>
          )}

          {/* Done sub-step - show Go Test button */}
          {preActionSubStep === 'done' && (
            <div className="question-container">
              <div className="question-number">You're all set!</div>
              <h2 className="question-text">Time to Test</h2>
              <p className="question-subtext">Go test it on yourself and come back to reflect</p>
            </div>
          )}
        </div>

        {/* Navigation for pre-action */}
        <div className="flow-navigation">
          {preActionSubStep === 'feeling' && (
            <button className="go-back-link" onClick={() => setStep(3)}>
              Go back
            </button>
          )}
          {(preActionSubStep === 'layer' || preActionSubStep === 'voice') && (
            <button className="go-back-link" onClick={handleBack}>
              Go back
            </button>
          )}
          {preActionSubStep === 'done' && (
            <>
              <button className="primary-button" onClick={handleCommit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Go Test It!'}
              </button>
              <button className="go-back-link" onClick={handleBack}>
                Go back
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // Progress dots (steps 1-3, pre-action renders separately)
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

        {/* Step 3: Plan */}
        {step === 3 && (() => {
          const skillInfo = getSelectedSkillInfo(formData.selectedSkill)
          const problemInfo = getSelectedProblemInfo(formData.selectedProblem)
          return (
            <div className="question-container">
              <div className="question-number">Step 3 of 3</div>
              <h2 className="question-text">Plan Your Test</h2>
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
        {step >= 1 && step <= 3 && (
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
