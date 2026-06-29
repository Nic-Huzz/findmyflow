/**
 * NarrativeBuilderFlow.jsx — /create/narrative-builder
 * "Phase 3: How do you tell the story?"
 *
 * 4-screen flow: Intro → Tribal Language → First Step → Cosign → Output Narrative
 * Beats 1-2 (Wound + Reframe) pre-filled from RemarkableFlow. User fills beats 3-5.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './NarrativeBuilderFlow.css'

const STEPS = {
  INTRO: 'intro',
  LANGUAGE: 'language',
  FIRST_STEP: 'first_step',
  COSIGN: 'cosign',
  OUTPUT: 'output',
}

export default function NarrativeBuilderFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStepRaw] = useState(STEPS.INTRO)

  const setStep = (next) => {
    setStepRaw(next)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Context from earlier flows
  const [projectName, setProjectName] = useState('')
  const [woundProblem, setWoundProblem] = useState('')
  const [assumption, setAssumption] = useState('')
  const [combinationInsight, setCombinationInsight] = useState('')
  const [ruleStatement, setRuleStatement] = useState('')
  const [oneLiner, setOneLiner] = useState('')
  const [culturePriority, setCulturePriority] = useState(false)
  const [accessPriority, setAccessPriority] = useState(false)

  // User inputs (beats 3-5)
  const [tribalLanguage, setTribalLanguage] = useState('')
  const [identityLabel, setIdentityLabel] = useState('')
  const [feelingName, setFeelingName] = useState('')
  const [firstStepType, setFirstStepType] = useState('')
  const [firstStepDesc, setFirstStepDesc] = useState('')
  const [cosignTargets, setCosignTargets] = useState('')
  const [cosignExisting, setCosignExisting] = useState('')
  const [cosignDream, setCosignDream] = useState('')

  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [existingRecord, setExistingRecord] = useState(null)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  // Editable narrative sections (for output screen)
  const [editWound, setEditWound] = useState('')
  const [editDiscovery, setEditDiscovery] = useState('')
  const [editLanguage, setEditLanguage] = useState('')
  const [editFirstStep, setEditFirstStep] = useState('')
  const [editCosign, setEditCosign] = useState('')

  // Fetch existing data
  useEffect(() => {
    if (!user) { setLoading(false); return }
    ;(async () => {
      try {
        const [
          { data: angleData },
          { data: diagData },
          { data: nbData },
        ] = await Promise.all([
          supabase
            .from('remarkable_angles')
            .select('project_name, wound_problem, assumption, combination_insight, ai_rule_statement, extreme_action_plan')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('scale_diagnostics')
            .select('score_culture, score_access')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('narrative_builders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1),
        ])

        // Pull context from RemarkableFlow
        const angle = angleData?.[0]
        if (angle) {
          if (angle.project_name) setProjectName(angle.project_name)
          if (angle.wound_problem) setWoundProblem(angle.wound_problem)
          if (angle.assumption) setAssumption(angle.assumption)
          if (angle.combination_insight) setCombinationInsight(angle.combination_insight)
          if (angle.ai_rule_statement) setRuleStatement(angle.ai_rule_statement)
          if (angle.extreme_action_plan) setOneLiner(angle.extreme_action_plan)
        }

        // Check Scale Diagnostic priorities
        const diag = diagData?.[0]
        if (diag) {
          if (diag.score_culture < 4) setCulturePriority(true)
          if (diag.score_access < 4) setAccessPriority(true)
        }

        // Pre-fill for returning users
        const existing = nbData?.[0]
        if (existing) {
          setExistingRecord(existing)
          if (existing.tribal_language) setTribalLanguage(existing.tribal_language)
          if (existing.identity_label) setIdentityLabel(existing.identity_label)
          if (existing.first_step_type) setFirstStepType(existing.first_step_type)
          if (existing.first_step_desc) setFirstStepDesc(existing.first_step_desc)
          if (existing.cosign_targets?.length) setCosignTargets(existing.cosign_targets.join(', '))
          if (existing.cosign_existing) setCosignExisting(existing.cosign_existing)
          if (existing.project_name && !angle?.project_name) setProjectName(existing.project_name)
        }
      } catch (err) {
        console.warn('NarrativeBuilderFlow data load failed:', err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  // Auto-save on step change
  useEffect(() => {
    if (step !== STEPS.INTRO && step !== STEPS.OUTPUT && user) {
      autoSave()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // Build narrative text sections
  const buildNarrative = () => {
    const wound = `I was ${woundProblem || '[your problem]'} until ${combinationInsight || '[your insight]'}.`
    const discovery = `I discovered that ${assumption || '[the assumption]'} is actually ${ruleStatement || '[your rule break]'}.`
    const lang = `We call this ${tribalLanguage || feelingName || '[your language]'}. People who do this are ${identityLabel || '[your people]'}. The feeling you've had but couldn't name? That's ${oneLiner || '[your one-liner]'}.`
    const fs = firstStepDesc || '[your first step]'
    const co = cosignExisting
      ? `${cosignExisting} already does this.`
      : cosignDream
        ? `Dream cosign: ${cosignDream}`
        : cosignTargets
          ? `Admired by: ${cosignTargets}`
          : ''
    return { wound, discovery, language: lang, firstStep: fs, cosign: co }
  }

  // Initialize editable fields when reaching output (only if not already populated from a previous visit)
  useEffect(() => {
    if (step === STEPS.OUTPUT && !editWound) {
      const n = buildNarrative()
      setEditWound(n.wound)
      setEditDiscovery(n.discovery)
      setEditLanguage(n.language)
      setEditFirstStep(n.firstStep)
      setEditCosign(n.cosign)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const autoSave = () => {
    if (!user) return
    const fields = {
      project_name: projectName || null,
      tribal_language: [tribalLanguage, feelingName].filter(Boolean).join('\n') || null,
      identity_label: identityLabel || null,
      first_step_type: firstStepType || null,
      first_step_desc: firstStepDesc || null,
      cosign_targets: cosignTargets ? cosignTargets.split(',').map(s => s.trim()).filter(Boolean) : null,
      cosign_existing: cosignExisting || (cosignDream ? `Dream: ${cosignDream}` : null),
    }

    if (existingRecord?.id) {
      supabase.from('narrative_builders').update(fields).eq('id', existingRecord.id)
        .then(({ error: err }) => { if (err) console.error('Auto-save update failed:', err.message) })
    } else {
      supabase.from('narrative_builders').upsert({ ...fields, user_id: user.id }, { onConflict: 'user_id' }).select('id').single()
        .then(({ data: row, error: err }) => {
          if (err) console.error('Auto-save upsert failed:', err.message)
          else if (row?.id) setExistingRecord(row)
        })
    }
  }

  // Final save
  const save = async () => {
    if (!user || saving) return
    setSaving(true)
    try {
      const generatedNarrative = [editWound, editDiscovery, editLanguage, editFirstStep, editCosign].filter(Boolean).join('\n\n')

      const fields = {
        project_name: projectName || null,
        tribal_language: [tribalLanguage, feelingName].filter(Boolean).join('\n') || null,
        identity_label: identityLabel || null,
        first_step_type: firstStepType || null,
        first_step_desc: firstStepDesc || null,
        cosign_targets: cosignTargets ? cosignTargets.split(',').map(s => s.trim()).filter(Boolean) : null,
        cosign_existing: cosignExisting || (cosignDream ? `Dream: ${cosignDream}` : null),
        generated_narrative: generatedNarrative,
      }

      if (existingRecord?.id) {
        const { error: updateErr } = await supabase.from('narrative_builders').update(fields).eq('id', existingRecord.id)
        if (updateErr) throw updateErr
      } else {
        const { data: row, error: insertErr } = await supabase.from('narrative_builders').insert({ ...fields, user_id: user.id }).select('id').single()
        if (insertErr) throw insertErr
        if (row?.id) setExistingRecord(row)
      }

      hapticSuccess()
      navigate('/create')
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const copyNarrative = () => {
    const text = [
      'THE WOUND',
      editWound,
      '',
      'THE DISCOVERY',
      editDiscovery,
      '',
      'THE LANGUAGE',
      editLanguage,
      '',
      'THE FIRST STEP',
      editFirstStep,
      editCosign ? '\nTHE COSIGN\n' + editCosign : '',
    ].filter(Boolean).join('\n')

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="nbf">
        <div className="nbf-center">
          <div className="nbf-spinner" />
        </div>
      </div>
    )
  }

  // ── SCREEN 1: INTRO ──
  if (step === STEPS.INTRO) {
    return (
      <div className="nbf">
        <div className="nbf-container nbf-screen">
          <div className="nbf-intro">
            <div className="nbf-intro-content">
              <div className="nbf-badge">Narrative Builder</div>

              {ruleStatement && (
                <div className="nbf-context-card">
                  {projectName && <strong>{projectName}: </strong>}
                  "{ruleStatement}"
                </div>
              )}

              <h1>How do you tell <span className="nbf-gold">the story</span>?</h1>
              <p>You know your rule break. Now give it language, a first step, and a cosign.</p>

              {culturePriority && (
                <div className="nbf-context-card" style={{ borderColor: 'rgba(233,162,59,0.3)', background: 'rgba(233,162,59,0.06)' }}>
                  Your Scale Diagnostic flagged Culture as a priority. The language you build here directly addresses that.
                </div>
              )}
            </div>

            <button className="nbf-cta" onClick={() => { hapticLight(); setStep(STEPS.LANGUAGE) }}>
              Build your narrative
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 2: TRIBAL LANGUAGE ──
  if (step === STEPS.LANGUAGE) {
    const canProceed = identityLabel.trim() || tribalLanguage.trim()

    return (
      <div className="nbf">
        <div className="nbf-container nbf-screen">
          <div className="nbf-step-badge">Beat 3 · Language</div>
          <h2 className="nbf-heading">Give your people <span className="nbf-gold">words</span></h2>

          {ruleStatement && (
            <div className="nbf-context-card">
              Your rule break: "{ruleStatement}"
            </div>
          )}

          <div className="nbf-input-group">
            <div className="nbf-input-label">What do your people call themselves?</div>
            <input
              className="nbf-input"
              placeholder='e.g., "CrossFitters," "breathers," "makers"'
              value={identityLabel}
              onChange={e => setIdentityLabel(e.target.value)}
            />
          </div>

          <div className="nbf-input-group">
            <div className="nbf-input-label">What insider words do you use? List 3-5 terms your community knows but outsiders don't.</div>
            <textarea
              className="nbf-input"
              placeholder='e.g., "WOD," "nervous system reset," "the shift"'
              value={tribalLanguage}
              onChange={e => setTribalLanguage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="nbf-input-group">
            <div className="nbf-input-label">The feeling people have but can't name. What do you call it?</div>
            <input
              className="nbf-input"
              placeholder='e.g., "the quiet knowing," "body truth"'
              value={feelingName}
              onChange={e => setFeelingName(e.target.value)}
            />
          </div>

          <div className="nbf-nav">
            <button className="nbf-back" onClick={() => setStep(STEPS.INTRO)}>Back</button>
            <button
              className="nbf-cta"
              disabled={!canProceed}
              onClick={() => { hapticLight(); setStep(STEPS.FIRST_STEP) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 3: FIRST STEP ──
  if (step === STEPS.FIRST_STEP) {
    const canProceed = firstStepType && firstStepDesc.trim()

    return (
      <div className="nbf">
        <div className="nbf-container nbf-screen">
          <div className="nbf-step-badge">Beat 4 · First Step</div>
          <h2 className="nbf-heading">What's the <span className="nbf-gold">first thing</span> someone does?</h2>

          {accessPriority && (
            <div className="nbf-context-card" style={{ borderColor: 'rgba(233,162,59,0.3)', background: 'rgba(233,162,59,0.06)' }}>
              Your Scale Diagnostic flagged Access. Make this as friction-free as possible.
            </div>
          )}

          <div className="nbf-toggle-group">
            <button
              className={`nbf-toggle-btn ${firstStepType === 'step' ? 'nbf-toggle-selected' : ''}`}
              onClick={() => { hapticLight(); setFirstStepType('step') }}
            >
              They can try it today, zero prep
            </button>
            <button
              className={`nbf-toggle-btn ${firstStepType === 'window' ? 'nbf-toggle-selected' : ''}`}
              onClick={() => { hapticLight(); setFirstStepType('window') }}
            >
              They need to learn about it first
            </button>
          </div>

          {firstStepType === 'step' && (
            <div className="nbf-input-group">
              <div className="nbf-input-label">Describe it in one sentence.</div>
              <input
                className="nbf-input"
                placeholder='e.g., "Do 3 breaths with me right now."'
                value={firstStepDesc}
                onChange={e => setFirstStepDesc(e.target.value)}
              />
            </div>
          )}

          {firstStepType === 'window' && (
            <div className="nbf-input-group">
              <div className="nbf-input-label">What book, video, or free resource introduces them?</div>
              <input
                className="nbf-input"
                placeholder='e.g., "Watch this 5-min video."'
                value={firstStepDesc}
                onChange={e => setFirstStepDesc(e.target.value)}
              />
            </div>
          )}

          <div className="nbf-nav">
            <button className="nbf-back" onClick={() => setStep(STEPS.LANGUAGE)}>Back</button>
            <button
              className="nbf-cta"
              disabled={!canProceed}
              onClick={() => { hapticLight(); setStep(STEPS.COSIGN) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 4: COSIGN ──
  if (step === STEPS.COSIGN) {
    return (
      <div className="nbf">
        <div className="nbf-container nbf-screen">
          <div className="nbf-step-badge">Beat 5 · Cosign</div>
          <h2 className="nbf-heading">Who makes your audience <span className="nbf-gold">trust</span> this?</h2>

          <div className="nbf-input-group">
            <div className="nbf-input-label">Who does your audience already admire? Name 2-3 people.</div>
            <input
              className="nbf-input"
              placeholder="e.g., Brene Brown, Wim Hof, Tim Ferriss"
              value={cosignTargets}
              onChange={e => setCosignTargets(e.target.value)}
            />
          </div>

          <div className="nbf-input-group">
            <div className="nbf-input-label">Has anyone like that endorsed or participated in what you do?</div>
            <input
              className="nbf-input"
              placeholder="If so, who?"
              value={cosignExisting}
              onChange={e => setCosignExisting(e.target.value)}
            />
          </div>

          <div className="nbf-input-group">
            <div className="nbf-input-label">If not, who would be the dream cosign?</div>
            <input
              className="nbf-input"
              placeholder="We'll help you get there."
              value={cosignDream}
              onChange={e => setCosignDream(e.target.value)}
            />
          </div>

          <div className="nbf-nav">
            <button className="nbf-back" onClick={() => setStep(STEPS.FIRST_STEP)}>Back</button>
            <button
              className="nbf-cta"
              onClick={() => { hapticLight(); setStep(STEPS.OUTPUT) }}
            >
              See my narrative
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 5: OUTPUT — YOUR NARRATIVE ──
  if (step === STEPS.OUTPUT) {
    return (
      <div className="nbf">
        <div className="nbf-container nbf-screen">
          <div className="nbf-badge">Your Story</div>

          {projectName && (
            <div className="nbf-context-card">
              <strong>{projectName}</strong>
            </div>
          )}

          <div className="nbf-narrative-card">
            <div className="nbf-narrative-title">Your Narrative</div>

            <div className="nbf-narrative-section">
              <div className="nbf-narrative-label">The Wound</div>
              {editing ? (
                <textarea className="nbf-input" value={editWound} onChange={e => setEditWound(e.target.value)} rows={2} />
              ) : (
                <p className="nbf-narrative-text">{editWound}</p>
              )}
            </div>

            <div className="nbf-narrative-section">
              <div className="nbf-narrative-label">The Discovery</div>
              {editing ? (
                <textarea className="nbf-input" value={editDiscovery} onChange={e => setEditDiscovery(e.target.value)} rows={2} />
              ) : (
                <p className="nbf-narrative-text">{editDiscovery}</p>
              )}
            </div>

            <div className="nbf-narrative-section">
              <div className="nbf-narrative-label">The Language</div>
              {editing ? (
                <textarea className="nbf-input" value={editLanguage} onChange={e => setEditLanguage(e.target.value)} rows={3} />
              ) : (
                <p className="nbf-narrative-text">{editLanguage}</p>
              )}
            </div>

            <div className="nbf-narrative-section">
              <div className="nbf-narrative-label">The First Step</div>
              {editing ? (
                <textarea className="nbf-input" value={editFirstStep} onChange={e => setEditFirstStep(e.target.value)} rows={2} />
              ) : (
                <p className="nbf-narrative-text">{editFirstStep}</p>
              )}
            </div>

            {editCosign && (
              <div className="nbf-narrative-section">
                <div className="nbf-narrative-label">The Cosign</div>
                {editing ? (
                  <textarea className="nbf-input" value={editCosign} onChange={e => setEditCosign(e.target.value)} rows={2} />
                ) : (
                  <p className="nbf-narrative-text">{editCosign}</p>
                )}
              </div>
            )}
          </div>

          <div className="nbf-actions">
            <button className="nbf-btn-outline" onClick={() => setEditing(!editing)}>
              {editing ? 'Done editing' : 'Edit'}
            </button>
            <button className={`nbf-btn-outline ${copied ? 'nbf-copied' : ''}`} onClick={copyNarrative}>
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </button>
          </div>

          {error && <div className="nbf-error">{error}</div>}

          <div className="nbf-nav">
            <button className="nbf-back" onClick={() => {
              setEditWound(''); setEditDiscovery(''); setEditLanguage(''); setEditFirstStep(''); setEditCosign('')
              setStep(STEPS.COSIGN)
            }}>Back</button>
            <button
              className="nbf-cta"
              disabled={saving}
              onClick={save}
            >
              {saving ? 'Saving...' : 'Save and finish'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
