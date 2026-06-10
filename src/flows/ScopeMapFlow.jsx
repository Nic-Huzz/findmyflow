/**
 * ScopeMapFlow.jsx
 *
 * Scope Map diagnostic flow for the /create tab.
 * Replaces ExperienceCatalog empty state for first-time visitors.
 *
 * Steps:
 *   1. Hook — "Before you create, let's find what's yours to build"
 *   2. Q1 — What problem do you solve?
 *   3. Q2 — What happened that made this personal?
 *   4. Q3 — Who comes to you and how do you know?
 *   5. Loading — AI classification
 *   6. Reveal — Scope Map with dot + stage description
 *   7. Confirm — "Does this sound like you?" with all 4 stages
 *   8. Prescription — Stage-specific next step
 *
 * Route: embedded in ExperienceCatalog, not a standalone route
 * Created: 2026-04-22
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { hapticLight, hapticMedium, hapticSuccess } from '../lib/haptics'
import { onScopeMapComplete } from '../lib/brain/autoPopulate'
import './ScopeMapFlow.css'

const STEPS = {
  HOOK: 'hook',
  Q1: 'q1',
  Q2: 'q2',
  Q3: 'q3',
  LOADING: 'loading',
  REVEAL: 'reveal',
  CONFIRM: 'confirm',
  PRESCRIPTION: 'prescription',
}

const STAGE_INFO = {
  stream: {
    label: "Someone Else's Channel",
    emoji: '🏞️',
    description: "You're talented and you know it. But right now you're scaling someone else's thing. The skills are real, the direction isn't yours yet. Until you find your own channel, speed just takes you further from where you actually want to go.",
    scaling: "Believe that you're good enough to do this for yourself, not just for someone else",
    color: '#6B9FFF',
  },
  lake: {
    label: 'Full but Scattered',
    emoji: '🌊',
    description: "You care about everything, and that's genuine. But caring about everything means nothing goes deep enough to sell. People can't find you because you haven't picked the one problem that's truly yours. Depth, not breadth, is what people pay for.",
    scaling: "Being more focused will ensure your message resonates and sells better",
    color: '#9B7FE6',
  },
  waterfall: {
    label: 'Found Your Edge',
    emoji: '💧',
    description: "You found your edge. You know your problem, your people, and why it's personal. The thing that will stop you scaling is the temptation to broaden before you've built the proof. Stay narrow. Build evidence. The breadth comes later.",
    scaling: "Continue to obsess over this problem, resist shiny-object syndrome",
    color: '#E9A23B',
  },
  river: {
    label: 'Earned Your Breadth',
    emoji: '🌅',
    description: "Your specificity became a platform. You've earned this breadth because it grew from something real. The thing that will stop you scaling is forgetting the waterfall that got you here. Keep one foot in the specific.",
    scaling: "Continue to serve your raving fans, don't divide your focus",
    color: '#4CAF50',
  },
}

const CONFIRM_OPTIONS = [
  { stage: 'stream', label: "Someone Else's Channel", short: "I'm scaling someone else's thing. The direction isn't mine yet." },
  { stage: 'lake', label: 'Full but Scattered', short: "I care about too much. Nothing goes deep enough to sell." },
  { stage: 'waterfall', label: 'Found Your Edge', short: "I found my edge. I need to build the proof before I broaden." },
  { stage: 'river', label: 'Earned Your Breadth', short: "I earned my breadth. I need to stay connected to what started it." },
]

export default function ScopeMapFlow({ onComplete }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(STEPS.HOOK)

  // Responses
  const [q1, setQ1] = useState('')
  const [q2, setQ2] = useState('')
  const [q3, setQ3] = useState('')

  // Classification result
  const [result, setResult] = useState(null)
  const [classifyError, setClassifyError] = useState(null)

  // Existing data for supplementary signals
  const [existingData, setExistingData] = useState(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      // Fetch existing skills and problems for supplementary classification
      const { data: skills } = await supabase
        .from('nikigai_clusters')
        .select('cluster_label')
        .eq('user_id', user.id)
        .eq('cluster_type', 'skills')
      const { data: problems } = await supabase
        .from('nikigai_clusters')
        .select('cluster_label')
        .eq('user_id', user.id)
        .eq('cluster_type', 'problems')

      if (!cancelled) {
        setExistingData({
          skills: skills?.map(s => s.cluster_label) || [],
          problems: problems?.map(p => p.cluster_label) || [],
          problemSpread: problems?.length || 0,
        })
      }
    })()
    return () => { cancelled = true }
  }, [user])

  const classify = async () => {
    setStep(STEPS.LOADING)
    setClassifyError(null)
    hapticLight()

    try {
      const { data, error } = await supabase.functions.invoke('classify-scope-map', {
        body: {
          response_problem: q1,
          response_source: q2,
          response_audience: q3,
          problem_spread: existingData?.problemSpread,
          existing_skills: existingData?.skills,
          existing_problems: existingData?.problems,
        },
      })

      if (error) throw error
      setResult(data)
      hapticSuccess()
      setStep(STEPS.REVEAL)
    } catch (err) {
      console.error('Scope map classification error:', err)
      setClassifyError('Something went wrong. Let\'s try again.')
      setStep(STEPS.Q3) // Go back to last question
    }
  }

  // Generate positioning: "I help [audience] with [problem] because [source]"
  const buildPositioning = () => {
    if (!q1 || !q2 || !q3) return null
    const audience = q3.split(/[.!?]/)[0].trim()
    const problem = q1.split(/[.!?]/)[0].trim()
    const source = q2.split(/[.!?]/)[0].trim()
    if (!audience || !problem || !source) return null
    return `I help ${audience.charAt(0).toLowerCase() + audience.slice(1)} with ${problem.charAt(0).toLowerCase() + problem.slice(1)} because ${source.charAt(0).toLowerCase() + source.slice(1)}.`
  }

  const saveResult = async (finalStage, reasoningOverride) => {
    if (!user) return
    try {
      const base = {
        user_id: user.id,
        stage: finalStage,
        response_problem: q1,
        response_source: q2,
        response_audience: q3,
        ai_reasoning: reasoningOverride || result?.reasoning || null,
        problem_spread: existingData?.problemSpread ?? null,
      }
      const positioning = buildPositioning()
      // Try with positioning_statement (column added by migration 20260429000000)
      const { error } = await supabase.from('scope_map_results').insert({
        ...base,
        ...(positioning ? { positioning_statement: positioning } : {}),
      })
      // If column doesn't exist yet, retry without it
      if (error?.code === '42703') {
        await supabase.from('scope_map_results').insert(base)
      }
      // Auto-populate brain
      onScopeMapComplete(user.id, stage)
    } catch (err) {
      console.error('Failed to save scope map result:', err)
    }
  }

  const handleConfirm = async (confirmed) => {
    if (confirmed) {
      await saveResult(result.stage)
      hapticSuccess()
      setStep(STEPS.PRESCRIPTION)
    } else {
      // Show all 4 options for manual selection
      setStep(STEPS.CONFIRM)
    }
  }

  const handleManualSelect = async (stage) => {
    hapticMedium()
    const updated = { ...result, stage, reasoning: 'User self-selected' }
    setResult(updated)
    await saveResult(stage, 'User self-selected')
    setStep(STEPS.PRESCRIPTION)
  }

  const handlePrescriptionAction = () => {
    if (!result) return
    hapticMedium()
    if (onComplete) onComplete(result.stage)

    switch (result.stage) {
      case 'stream':
        navigate('/life-map')
        break
      case 'lake':
      case 'waterfall':
      case 'river':
      default:
        navigate('/create/experience/new')
        break
    }
  }

  // ─── Render steps ────────────────────────────────────────────────────────

  if (step === STEPS.HOOK) {
    return (
      <div className="scope-flow">
        <div className="scope-flow-card scope-flow-center">
          <h2 className="scope-flow-heading scope-flow-hook-heading">
            Before you create anything, let's figure out what's{' '}
            <span className="scope-flow-gold">yours</span> to build.
          </h2>
          <p className="scope-flow-sub">
            Three quick questions. Takes about a minute.
          </p>
          <button className="scope-flow-cta" onClick={() => { hapticLight(); setClassifyError(null); setStep(STEPS.Q1) }}>
            Let's go
          </button>
        </div>
      </div>
    )
  }

  if (step === STEPS.Q1) {
    return (
      <div className="scope-flow">
        <div className="scope-flow-card">
          <div className="scope-flow-step">1 of 3</div>
          <h2 className="scope-flow-heading">What problem do you solve?</h2>
          <p className="scope-flow-prompt">
            If you can, name the specific type of person who has it and what it looks like in their daily life.
          </p>
          <textarea
            className="scope-flow-textarea"
            value={q1}
            onChange={(e) => setQ1(e.target.value)}
            placeholder="e.g. I help coaches who freeze when asked to charge what they're worth..."
            rows={4}
            autoFocus
          />
          {classifyError && <div className="scope-flow-error">{classifyError}</div>}
          <div className="scope-flow-nav">
            <button className="scope-flow-back" onClick={() => setStep(STEPS.HOOK)}>Back</button>
            <button
              className="scope-flow-cta"
              disabled={q1.trim().length < 10}
              onClick={() => { hapticLight(); setStep(STEPS.Q2) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === STEPS.Q2) {
    return (
      <div className="scope-flow">
        <div className="scope-flow-card">
          <div className="scope-flow-step">2 of 3</div>
          <h2 className="scope-flow-heading">What happened that made this personal for you?</h2>
          <p className="scope-flow-prompt">
            If there was a specific moment, describe it.
          </p>
          <textarea
            className="scope-flow-textarea"
            value={q2}
            onChange={(e) => setQ2(e.target.value)}
            placeholder="e.g. I was the person who couldn't do this. I remember the exact moment..."
            rows={4}
            autoFocus
          />
          <div className="scope-flow-nav">
            <button className="scope-flow-back" onClick={() => setStep(STEPS.Q1)}>Back</button>
            <button
              className="scope-flow-cta"
              disabled={q2.trim().length < 10}
              onClick={() => { hapticLight(); setStep(STEPS.Q3) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === STEPS.Q3) {
    return (
      <div className="scope-flow">
        <div className="scope-flow-card">
          <div className="scope-flow-step">3 of 3</div>
          <h2 className="scope-flow-heading">What's happening in their life right now that would make them come to you?</h2>
          <p className="scope-flow-prompt">
            And how do you know?
          </p>
          <textarea
            className="scope-flow-textarea"
            value={q3}
            onChange={(e) => setQ3(e.target.value)}
            placeholder="e.g. They're going through... I know because..."
            rows={4}
            autoFocus
          />
          {classifyError && <div className="scope-flow-error">{classifyError}</div>}
          <div className="scope-flow-nav">
            <button className="scope-flow-back" onClick={() => setStep(STEPS.Q2)}>Back</button>
            <button
              className="scope-flow-cta"
              disabled={q3.trim().length < 10}
              onClick={classify}
            >
              Show me where I am
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === STEPS.LOADING) {
    return (
      <div className="scope-flow">
        <div className="scope-flow-card scope-flow-center">
          <div className="scope-flow-spinner" />
          <p className="scope-flow-loading-text">Finding your flow...</p>
        </div>
      </div>
    )
  }

  if (step === STEPS.REVEAL && result) {
    const info = STAGE_INFO[result.stage]
    return (
      <div className="scope-flow">
        <div className="scope-flow-card scope-flow-center">
          <div className="scope-flow-reveal-visual" style={{ background: `linear-gradient(135deg, ${info.color}22, ${info.color}44)`, borderColor: `${info.color}55` }}>
            <span className="scope-flow-reveal-visual-emoji">{info.emoji}</span>
          </div>
          <h2 className="scope-flow-heading">
            You're at <span className="scope-flow-gold">{info.label}</span>
          </h2>
          <p className="scope-flow-reveal-scaling">To scale: <strong>{info.scaling}</strong></p>
          <div className="scope-flow-reveal-desc">
            {(result.reframe || info.description).split(/(?<=[.!?])\s+/).map((sentence, i) => (
              <p key={i}>{sentence}</p>
            ))}
          </div>
          <div className="scope-flow-reveal-actions">
            <button className="scope-flow-cta" onClick={() => handleConfirm(true)}>
              That's me
            </button>
            <button className="scope-flow-secondary" onClick={() => handleConfirm(false)}>
              Not quite
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === STEPS.CONFIRM) {
    return (
      <div className="scope-flow">
        <div className="scope-flow-card">
          <h2 className="scope-flow-heading">Which sounds most like you?</h2>
          <div className="scope-flow-options">
            {CONFIRM_OPTIONS.map(opt => (
              <button
                key={opt.stage}
                className={`scope-flow-option ${result?.stage === opt.stage ? 'scope-flow-option-suggested' : ''}`}
                onClick={() => handleManualSelect(opt.stage)}
              >
                <span className="scope-flow-option-emoji">{STAGE_INFO[opt.stage].emoji}</span>
                <div>
                  <div className="scope-flow-option-label">{opt.label}</div>
                  <div className="scope-flow-option-desc">{opt.short}</div>
                </div>
                {result?.stage === opt.stage && (
                  <span className="scope-flow-option-badge">suggested</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (step === STEPS.PRESCRIPTION && result) {
    const info = STAGE_INFO[result.stage]
    const prescriptions = {
      stream: {
        title: 'Your channel is a clue, not a prison',
        body: "You already have skills and specificity. The question isn't what you can do, it's which parts feel like play, not just competence. Let's look at what you've already identified and find what's actually yours.",
        cta: 'Explore my skills',
      },
      lake: {
        title: 'Pick one. Just one.',
        body: "You care about everything and that's real. But a waterfall needs an edge. Pick the ONE problem that scares you most to commit to. That fear is a compass. Your first experience starts there.",
        cta: 'Create my first experience',
      },
      waterfall: {
        title: "You found your edge. Now build.",
        body: "You know your problem, your people, and why it's yours. Stop exploring. Start building. Your first experience should be exactly what you just described.",
        cta: 'Create my experience',
      },
      river: {
        title: "You've earned this breadth",
        body: "Your specific work became something bigger. Keep one foot in the specific. Build experiences at whatever scope feels right.",
        cta: 'Create an experience',
      },
    }
    const rx = prescriptions[result.stage]

    return (
      <div className="scope-flow">
        <div className="scope-flow-card">
          <div className="scope-flow-rx-header">
            <span className="scope-flow-reveal-emoji">{info.emoji}</span>
            <span className="scope-flow-rx-stage">{info.label}</span>
          </div>
          <h2 className="scope-flow-heading">{rx.title}</h2>
          <div className="scope-flow-rx-body">
            {rx.body.split(/(?<=[.!?])\s+/).map((sentence, i) => (
              <p key={i}>{sentence}</p>
            ))}
          </div>
          {(() => {
            const pos = buildPositioning()
            return pos && (
              <div className="scope-flow-positioning">
                <div className="scope-flow-pos-label">Your positioning</div>
                <div className="scope-flow-pos-text">{pos}</div>
              </div>
            )
          })()}
          <button className="scope-flow-cta" onClick={handlePrescriptionAction}>
            {rx.cta}
          </button>
        </div>
      </div>
    )
  }

  return null
}
