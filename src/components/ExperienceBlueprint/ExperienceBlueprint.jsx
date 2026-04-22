/**
 * ExperienceBlueprint.jsx
 *
 * Shift Architecture Blueprint for the Create tab.
 * Guides experience creators through designing a reconsolidation container:
 *   Step 1: Your Experience (AI suggests from placemakes)
 *   Step 2: The Encoding (target protective pattern + prediction)
 *   Step 3: Your Arc (6 fixed phases, AI pre-fills, user reviews)
 *   Step 4: Save + Create Experience (type dropdown, checklist, repetition challenges)
 *
 * States:
 *   - empty: No blueprint yet, show CTA
 *   - designing: Stepped inline flow
 *   - complete: Summary card + link to experience management
 *
 * Created: 2026-04-20
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import './ExperienceBlueprint.css'

const STEPS = ['experience', 'encoding', 'arc', 'save']

const STEP_LABELS = {
  experience: 'Your Experience',
  encoding: 'The Encoding',
  arc: 'Your Arc',
  save: 'Save & Create',
}

const ARC_PHASES = [
  { id: 'safety', name: 'Safety + Connection', description: 'Build the container. Co-regulate. Get participants below the neck before going deeper.' },
  { id: 'activation', name: 'Activation', description: 'Surface the emotional learning. Somatic, not cognitive. The encoding must be FELT, not discussed.' },
  { id: 'mismatch', name: 'Mismatch', description: 'While the old learning is live, create an experience that contradicts its prediction. The design heart.' },
  { id: 'discharge', name: 'Discharge', description: 'Let the body complete what it has been holding. Movement, breath, sound, shaking.' },
  { id: 'integration', name: 'Integration', description: 'Inner child, new truth, self-holding. The encoding rewrites.' },
  { id: 'verification', name: 'Verification', description: 'Re-check the original trigger. Notice what shifted. Name the change.' },
]

const EXPERIENCE_TYPES = [
  { id: 'workshop', label: 'Live Workshop', icon: '🎪' },
  { id: 'online', label: 'Online Session', icon: '💻' },
  { id: 'retreat', label: 'Retreat', icon: '🏝️' },
  { id: 'one_on_one', label: '1:1 Session', icon: '🤝' },
  { id: 'circle', label: 'Circle / Gathering', icon: '⭕' },
  { id: 'course', label: 'Course', icon: '📚' },
  { id: 'popup', label: 'Pop-up Event', icon: '⚡' },
]

const PROTECTIVE_PATTERNS = [
  { id: 'ghost', name: 'The Ghost', prediction: 'If I am seen, I will be rejected', description: 'You disappear. You hide. You stay invisible.' },
  { id: 'performer', name: 'The Performer', prediction: 'If I stop achieving, I will not be valued', description: 'You achieve. You impress. You earn love through what you do.' },
  { id: 'controller', name: 'The Controller', prediction: 'If I let go, everything will fall apart', description: 'You grip. You manage. You white-knuckle through life.' },
  { id: 'perfectionist', name: 'The Perfectionist', prediction: 'If I make a mistake, it will be catastrophic', description: 'You prepare. You polish. Nothing is ever ready.' },
  { id: 'people_pleaser', name: 'The People Pleaser', prediction: 'If I say no, I will be abandoned', description: 'You say yes. You put everyone else first. Your needs never matter.' },
]

export default function ExperienceBlueprint({ userId }) {
  const navigate = useNavigate()
  const [state, setState] = useState('loading') // loading | empty | designing | complete
  const [step, setStep] = useState('experience')
  const [blueprint, setBlueprint] = useState(null)
  const [placemakes, setPlacemakes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Draft state
  const [experienceName, setExperienceName] = useState('')
  const [experienceDescription, setExperienceDescription] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [targetPattern, setTargetPattern] = useState(null)
  const [targetPrediction, setTargetPrediction] = useState('')
  const [arcPhases, setArcPhases] = useState(ARC_PHASES.map(p => ({ ...p, content: '' })))
  const [experienceType, setExperienceType] = useState('workshop')

  // Load existing blueprint + placemakes
  useEffect(() => {
    if (!userId) return
    loadData()
  }, [userId])

  const loadData = async () => {
    try {
      const [{ data: skills }, { data: existing }] = await Promise.all([
        supabase
          .from('nikigai_clusters')
          .select('id, cluster_label, items')
          .eq('user_id', userId)
          .eq('cluster_type', 'skills'),
        supabase
          .from('experience_blueprints')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      setPlacemakes(skills || [])

      if (existing && existing.status === 'complete') {
        setBlueprint(existing)
        setState('complete')
      } else if (existing && existing.status === 'draft') {
        setBlueprint(existing)
        setExperienceName(existing.experience_name || '')
        setExperienceDescription(existing.experience_description || '')
        setTargetPattern(existing.target_pattern || null)
        setTargetPrediction(existing.target_prediction || '')
        if (existing.arc_phases?.length) setArcPhases(existing.arc_phases)
        setExperienceType(existing.experience_type || 'workshop')
        setStep(STEPS[Math.min((existing.current_step || 1) - 1, STEPS.length - 1)])
        setState('designing')
      } else {
        setState('empty')
      }
    } catch (err) {
      console.error('ExperienceBlueprint loadData error:', err)
      setState('empty')
    }
  }

  // Save draft to DB
  const saveDraft = async (stepIndex) => {
    const data = {
      user_id: userId,
      experience_name: experienceName || 'Untitled Experience',
      experience_description: experienceDescription,
      source_placemakes: placemakes.map(p => p.cluster_label),
      target_pattern: targetPattern,
      target_prediction: targetPrediction,
      arc_phases: arcPhases,
      experience_type: experienceType,
      status: 'draft',
      current_step: stepIndex + 1,
      updated_at: new Date().toISOString(),
    }

    try {
      if (blueprint?.id) {
        const { error } = await supabase.from('experience_blueprints').update(data).eq('id', blueprint.id)
        if (error) console.error('Draft update error:', error)
      } else {
        const { data: inserted, error } = await supabase.from('experience_blueprints').insert(data).select().single()
        if (error) {
          console.error('Draft insert error:', error)
          return
        }
        if (inserted) setBlueprint(inserted)
      }
    } catch (err) {
      console.error('saveDraft error:', err)
    }
  }

  const goToStep = async (nextStep) => {
    const currentIndex = STEPS.indexOf(step)
    await saveDraft(currentIndex)
    setStep(nextStep)
  }

  const handleStartDesigning = () => {
    setState('designing')
    setStep('experience')
  }

  // ─── STEP 1: Your Experience ─────────────────────────────────────────

  const handleSuggestExperiences = async () => {
    if (placemakes.length === 0) return
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('experience-blueprint-ai', {
        body: {
          action: 'suggest_experiences',
          placemakes: placemakes.map(p => p.cluster_label),
        },
      })
      if (fnError) throw fnError
      setSuggestions(data?.suggestions || [])
    } catch (err) {
      console.error('Suggest experiences error:', err)
      setError('Could not generate suggestions. Try again.')
    }
    setIsLoading(false)
  }

  const handlePickSuggestion = (suggestion) => {
    setExperienceName(suggestion.name)
    setExperienceDescription(suggestion.description)
  }

  // ─── STEP 2: The Encoding ────────────────────────────────────────────

  const handleSuggestEncoding = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('experience-blueprint-ai', {
        body: {
          action: 'suggest_encoding',
          experienceName,
          experienceDescription,
          placemakes: placemakes.map(p => p.cluster_label),
        },
      })
      if (fnError) throw fnError
      if (data?.pattern) setTargetPattern(data.pattern)
      if (data?.prediction) setTargetPrediction(data.prediction)
    } catch (err) {
      console.error('Suggest encoding error:', err)
      setError('Could not suggest encoding. Try again.')
    }
    setIsLoading(false)
  }

  // ─── STEP 3: Your Arc ────────────────────────────────────────────────

  const handleGenerateArc = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('experience-blueprint-ai', {
        body: {
          action: 'generate_arc',
          experienceName,
          experienceDescription,
          targetPattern,
          targetPrediction,
          placemakes: placemakes.map(p => p.cluster_label),
        },
      })
      if (fnError) throw fnError
      if (data?.phases?.length === 6) {
        setArcPhases(data.phases.map((phase, i) => ({
          ...ARC_PHASES[i],
          content: phase.content,
          somaticTool: phase.somaticTool || '',
        })))
      }
    } catch (err) {
      console.error('Generate arc error:', err)
      setError('Could not generate your arc. Try again.')
    }
    setIsLoading(false)
  }

  const updatePhaseContent = (index, content) => {
    setArcPhases(prev => prev.map((p, i) => i === index ? { ...p, content } : p))
  }

  // ─── STEP 4: Save & Create ──────────────────────────────────────────

  const handleSaveBlueprint = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // 1. Mark blueprint complete
      const blueprintData = {
        user_id: userId,
        experience_name: experienceName,
        experience_description: experienceDescription,
        source_placemakes: placemakes.map(p => p.cluster_label),
        target_pattern: targetPattern,
        target_prediction: targetPrediction,
        arc_phases: arcPhases,
        experience_type: experienceType,
        status: 'complete',
        current_step: 4,
        updated_at: new Date().toISOString(),
      }

      let blueprintId = blueprint?.id
      if (blueprintId) {
        await supabase.from('experience_blueprints').update(blueprintData).eq('id', blueprintId)
      } else {
        const { data: inserted } = await supabase.from('experience_blueprints').insert(blueprintData).select().single()
        blueprintId = inserted?.id
      }

      // 2. Create experience row
      const { data: experience, error: expError } = await supabase.from('experiences').insert({
        user_id: userId,
        name: experienceName,
        experience_type: experienceType,
        status: 'upcoming',
      }).select().single()
      if (expError) throw expError

      // 3. Link blueprint to experience
      if (experience?.id && blueprintId) {
        await supabase.from('experience_blueprints')
          .update({ experience_id: experience.id })
          .eq('id', blueprintId)
      }

      // 4. Seed checklist (using existing template for now, type-keyed in task #5)
      if (experience?.id) {
        const { buildChecklistRows } = await import('../../lib/experienceChecklistTemplate')
        const rows = buildChecklistRows(experience.id, userId)
        await supabase.from('experience_checklist_items').insert(rows)
      }

      setBlueprint({ ...blueprintData, id: blueprintId, experience_id: experience?.id })
      setState('complete')
    } catch (err) {
      console.error('Save blueprint error:', err)
      setError('Failed to save. Please try again.')
    }
    setIsLoading(false)
  }

  // ─── RENDER ──────────────────────────────────────────────────────────

  if (state === 'loading') {
    return <div className="eb-loading"><div className="eb-spinner" /></div>
  }

  // Complete state renders first (user may have deleted skills after completing a blueprint)
  if (state === 'complete' && blueprint) {
    const pattern = PROTECTIVE_PATTERNS.find(p => p.id === blueprint.target_pattern)
    return (
      <div className="eb-complete">
        <div className="eb-summary-card">
          <div className="eb-summary-header">
            <h3>{blueprint.experience_name}</h3>
            <span className="eb-type-badge">
              {EXPERIENCE_TYPES.find(t => t.id === blueprint.experience_type)?.icon}{' '}
              {EXPERIENCE_TYPES.find(t => t.id === blueprint.experience_type)?.label}
            </span>
          </div>
          {blueprint.experience_description && (
            <p className="eb-summary-desc">{blueprint.experience_description}</p>
          )}
          {pattern && (
            <div className="eb-summary-encoding">
              <strong>Target shift:</strong> {pattern.name} → "{blueprint.target_prediction}"
            </div>
          )}
          <div className="eb-summary-actions">
            <button
              className="eb-cta-secondary"
              onClick={() => { setState('designing'); setStep('experience') }}
            >
              Edit Blueprint
            </button>
            {blueprint.experience_id && (
              <button
                className="eb-cta"
                onClick={() => navigate(`/create/experience/${blueprint.experience_id}`)}
              >
                View Checklist
              </button>
            )}
          </div>
        </div>
        <button
          className="eb-new-experience"
          onClick={() => {
            setBlueprint(null)
            setExperienceName('')
            setExperienceDescription('')
            setTargetPattern(null)
            setTargetPrediction('')
            setArcPhases(ARC_PHASES.map(p => ({ ...p, content: '' })))
            setSuggestions([])
            setState('empty')
          }}
        >
          + Design Another Experience
        </button>
      </div>
    )
  }

  // No placemakes yet
  if (placemakes.length === 0) {
    return (
      <div className="eb-empty">
        <div className="eb-empty-icon">🎯</div>
        <h3>Discover your play-skills first</h3>
        <p>Complete the Play-list tab to discover what lights you up. Then come back here to design your first experience.</p>
      </div>
    )
  }

  // Empty state — no blueprint
  if (state === 'empty') {
    return (
      <div className="eb-empty">
        <div className="eb-empty-icon">✨</div>
        <h3>Design Your Experience</h3>
        <p>
          You know what lights you up. Now turn it into an experience that
          creates real, lasting shifts for others.
        </p>
        <button className="eb-cta" onClick={handleStartDesigning}>
          Start Designing
        </button>
      </div>
    )
  }



  // ─── Designing state — stepped flow ──────────────────────────────────

  const currentStepIndex = STEPS.indexOf(step)

  return (
    <div className="eb-designing">
      {/* Progress */}
      <div className="eb-progress">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`eb-progress-dot ${i <= currentStepIndex ? 'active' : ''} ${i === currentStepIndex ? 'current' : ''}`}
          >
            <span className="eb-progress-num">{i + 1}</span>
          </div>
        ))}
      </div>
      <h3 className="eb-step-title">{STEP_LABELS[step]}</h3>

      {error && <p className="eb-error">{error}</p>}

      {/* Step 1: Your Experience */}
      {step === 'experience' && (
        <div className="eb-step">
          <p className="eb-step-desc">What shift will your experience create?</p>

          {suggestions.length === 0 && (
            <button
              className="eb-suggest-btn"
              onClick={handleSuggestExperiences}
              disabled={isLoading}
            >
              {isLoading ? 'Generating...' : 'Suggest experiences from my play-skills'}
            </button>
          )}

          {suggestions.length > 0 && (
            <div className="eb-suggestions">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className={`eb-suggestion-card ${experienceName === s.name ? 'selected' : ''}`}
                  onClick={() => handlePickSuggestion(s)}
                >
                  <strong>{s.name}</strong>
                  <span>{s.description}</span>
                </button>
              ))}
            </div>
          )}

          <div className="eb-field">
            <label>Experience name</label>
            <input
              type="text"
              value={experienceName}
              onChange={(e) => setExperienceName(e.target.value)}
              placeholder="e.g. Breathwork Circle for Burnt-Out Execs"
            />
          </div>
          <div className="eb-field">
            <label>What shift does it create?</label>
            <textarea
              value={experienceDescription}
              onChange={(e) => setExperienceDescription(e.target.value)}
              placeholder="Describe the transformation participants walk away with..."
              rows={3}
            />
          </div>

          <div className="eb-nav">
            <div />
            <button
              className="eb-cta"
              onClick={() => goToStep('encoding')}
              disabled={!experienceName.trim()}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: The Encoding */}
      {step === 'encoding' && (
        <div className="eb-step">
          <p className="eb-step-desc">
            What protective pattern does your participant carry?
            Which prediction does your experience need to contradict?
          </p>

          {!targetPattern && (
            <button
              className="eb-suggest-btn"
              onClick={handleSuggestEncoding}
              disabled={isLoading}
            >
              {isLoading ? 'Analyzing...' : 'Suggest based on my experience'}
            </button>
          )}

          <div className="eb-patterns">
            {PROTECTIVE_PATTERNS.map(p => (
              <button
                key={p.id}
                className={`eb-pattern-card ${targetPattern === p.id ? 'selected' : ''}`}
                onClick={() => {
                  setTargetPattern(p.id)
                  setTargetPrediction(p.prediction)
                }}
              >
                <strong>{p.name}</strong>
                <span>{p.description}</span>
              </button>
            ))}
          </div>

          {targetPattern && (
            <div className="eb-field">
              <label>The prediction your experience contradicts</label>
              <input
                type="text"
                value={targetPrediction}
                onChange={(e) => setTargetPrediction(e.target.value)}
                placeholder="If I [do X], [bad thing] will happen"
              />
            </div>
          )}

          <div className="eb-nav">
            <button className="eb-back" onClick={() => goToStep('experience')}>← Back</button>
            <button
              className="eb-cta"
              onClick={() => goToStep('arc')}
              disabled={!targetPattern}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Your Arc */}
      {step === 'arc' && (
        <div className="eb-step">
          <p className="eb-step-desc">
            The 6 phases of Shift Architecture. AI has pre-filled each phase for your experience.
            Review and edit anything that doesn't feel right.
          </p>

          {!arcPhases[0]?.content && (
            <button
              className="eb-suggest-btn"
              onClick={handleGenerateArc}
              disabled={isLoading}
            >
              {isLoading ? 'Building your arc...' : 'Generate my arc'}
            </button>
          )}

          <div className="eb-arc-phases">
            {arcPhases.map((phase, i) => (
              <div key={phase.id} className="eb-arc-phase">
                <div className="eb-arc-phase-header">
                  <span className="eb-arc-phase-num">{i + 1}</span>
                  <strong>{phase.name}</strong>
                </div>
                <p className="eb-arc-phase-hint">{phase.description}</p>
                <textarea
                  value={phase.content || ''}
                  onChange={(e) => updatePhaseContent(i, e.target.value)}
                  placeholder={`What happens in the ${phase.name} phase of your experience?`}
                  rows={3}
                />
              </div>
            ))}
          </div>

          <div className="eb-nav">
            <button className="eb-back" onClick={() => goToStep('encoding')}>← Back</button>
            <button
              className="eb-cta"
              onClick={() => goToStep('save')}
              disabled={!arcPhases.some(p => p.content)}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Save & Create */}
      {step === 'save' && (
        <div className="eb-step">
          <p className="eb-step-desc">Review your Shift Architecture blueprint.</p>

          {/* Summary */}
          <div className="eb-review-card">
            <h4>{experienceName}</h4>
            {experienceDescription && <p>{experienceDescription}</p>}
            <div className="eb-review-encoding">
              <strong>Target:</strong> {PROTECTIVE_PATTERNS.find(p => p.id === targetPattern)?.name} → "{targetPrediction}"
            </div>
            <div className="eb-review-arc">
              {arcPhases.map((phase, i) => phase.content ? (
                <div key={phase.id} className="eb-review-phase">
                  <strong>{i + 1}. {phase.name}</strong>
                  <p>{phase.content}</p>
                </div>
              ) : null)}
            </div>
          </div>

          {/* Experience Type */}
          <div className="eb-field">
            <label>Experience type</label>
            <div className="eb-type-grid">
              {EXPERIENCE_TYPES.map(type => (
                <button
                  key={type.id}
                  className={`eb-type-btn ${experienceType === type.id ? 'selected' : ''}`}
                  onClick={() => setExperienceType(type.id)}
                >
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="eb-nav">
            <button className="eb-back" onClick={() => goToStep('arc')}>← Back</button>
            <button
              className="eb-cta"
              onClick={handleSaveBlueprint}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Save & Create Experience'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
