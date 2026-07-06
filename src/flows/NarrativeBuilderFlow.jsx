/**
 * NarrativeBuilderFlow.jsx — /create/narrative-builder
 * "Remarkable Reach: How does your story spread?"
 *
 * Flow: Intro → Vehicle Discovery → Tribal Language → Cosign → Output
 * Pulls Remarkable Results (rule break) data. Vehicle discovery educates on 3 types of reach.
 * First Step removed — lives in Remarkable Growth (AccessArchitectureFlow).
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './NarrativeBuilderFlow.css'

const STEPS = {
  INTRO: 'intro',
  VEHICLE: 'vehicle',
  LANGUAGE: 'language',
  COSIGN: 'cosign',
  OUTPUT: 'output',
}

const VEHICLE_TYPE_OPTIONS = [
  { key: 'results', label: 'My results ARE my content', desc: 'What I do is so unexpected that posting it is enough. The result IS the story.', example: 'Wim Hof posting ice baths. CrossFit posting garage workouts. Daybreaker posting sober sunrise dance.' },
  { key: 'new_medium', label: 'Take it somewhere new', desc: 'My industry delivers via studios, retreats, or apps. I go somewhere nobody in my category goes.', example: 'Gabor Mate took psychiatry to documentaries. Sara Auster took sound healing to MoMA and Apple. Emily Fletcher took meditation to Google\'s boardroom.' },
  { key: 'new_action', label: 'Do something new where I already am', desc: 'Everyone\'s on the same platforms. I do something nobody in my category does there.', example: 'Nicole LePera gave away psychology free on Instagram when every psychologist charges $200/hr. Logan and Jake Paul posted their daily lives on YouTube before anyone else. Jackass filmed stunts before TikTok existed. The window closes once others copy it.' },
]

export default function NarrativeBuilderFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStepRaw] = useState(STEPS.INTRO)

  const setStep = (next) => {
    setStepRaw(next)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Context from Remarkable Results
  const [projectName, setProjectName] = useState('')
  const [woundProblem, setWoundProblem] = useState('')
  const [assumption, setAssumption] = useState('')
  const [combinationInsight, setCombinationInsight] = useState('')
  const [ruleStatement, setRuleStatement] = useState('')
  const [oneLiner, setOneLiner] = useState('')
  const [remarkScore, setRemarkScore] = useState(0)

  // Vehicle discovery
  const [vehicleType, setVehicleType] = useState('')
  const [vehicleDesc, setVehicleDesc] = useState('')

  // Tribal language
  const [tribalLanguage, setTribalLanguage] = useState('')
  const [identityLabel, setIdentityLabel] = useState('')
  const [feelingName, setFeelingName] = useState('')

  // Cosign
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
  const [editVehicle, setEditVehicle] = useState('')
  const [editLanguage, setEditLanguage] = useState('')
  const [editCosign, setEditCosign] = useState('')

  // Fetch existing data
  useEffect(() => {
    if (!user) { setLoading(false); return }
    ;(async () => {
      try {
        const [
          { data: angleData },
          { data: nbData },
        ] = await Promise.all([
          supabase
            .from('remarkable_angles')
            .select('project_name, wound_problem, assumption, combination_insight, ai_rule_statement, extreme_action_plan, score_unique, score_share, score_simple')
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

        // Pull context from Remarkable Results
        const angle = angleData?.[0]
        if (angle) {
          if (angle.project_name) setProjectName(angle.project_name)
          if (angle.wound_problem) setWoundProblem(angle.wound_problem)
          if (angle.assumption) setAssumption(angle.assumption)
          if (angle.combination_insight) setCombinationInsight(angle.combination_insight)
          if (angle.ai_rule_statement) setRuleStatement(angle.ai_rule_statement)
          if (angle.extreme_action_plan) setOneLiner(angle.extreme_action_plan)
          const rs = (angle.score_unique || 0) * (angle.score_share || 0) * (angle.score_simple || 0)
          setRemarkScore(rs)
        }

        // Pre-fill for returning users
        const existing = nbData?.[0]
        if (existing) {
          setExistingRecord(existing)
          if (existing.tribal_language) setTribalLanguage(existing.tribal_language)
          if (existing.identity_label) setIdentityLabel(existing.identity_label)
          if (existing.cosign_targets?.length) setCosignTargets(existing.cosign_targets.join(', '))
          if (existing.cosign_existing) setCosignExisting(existing.cosign_existing)
          if (existing.project_name && !angle?.project_name) setProjectName(existing.project_name)
          // Vehicle fields (new — gracefully handle old records without them)
          if (existing.vehicle_type) setVehicleType(existing.vehicle_type)
          if (existing.vehicle_desc) setVehicleDesc(existing.vehicle_desc)
        }
      } catch (err) {
        console.warn('RemarkableReach data load failed:', err.message)
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
    const vehicle = vehicleType === 'results'
      ? `My results speak for themselves. When I post what happens, people can't help sharing it.`
      : vehicleType === 'new_medium'
      ? `I deliver this via ${vehicleDesc || '[your new medium]'}, somewhere nobody in my category goes.`
      : vehicleType === 'new_action'
      ? `On ${vehicleDesc || '[platform]'}, I do something nobody in my category does.`
      : ''
    const lang = `We call this ${tribalLanguage || feelingName || '[your language]'}. People who do this are ${identityLabel || '[your people]'}.`
    const co = cosignExisting
      ? `${cosignExisting} already does this.`
      : cosignDream
        ? `Dream cosign: ${cosignDream}`
        : cosignTargets
          ? `Admired by: ${cosignTargets}`
          : ''
    return { wound, discovery, vehicle, language: lang, cosign: co }
  }

  // Initialize editable fields when reaching output
  useEffect(() => {
    if (step === STEPS.OUTPUT && !editWound) {
      const n = buildNarrative()
      setEditWound(n.wound)
      setEditDiscovery(n.discovery)
      setEditVehicle(n.vehicle)
      setEditLanguage(n.language)
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
      vehicle_type: vehicleType || null,
      vehicle_desc: vehicleDesc || null,
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
      const generatedNarrative = [editWound, editDiscovery, editVehicle, editLanguage, editCosign].filter(Boolean).join('\n\n')

      const fields = {
        project_name: projectName || null,
        tribal_language: [tribalLanguage, feelingName].filter(Boolean).join('\n') || null,
        identity_label: identityLabel || null,
        vehicle_type: vehicleType || null,
        vehicle_desc: vehicleDesc || null,
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
      'THE VEHICLE',
      editVehicle,
      '',
      'THE LANGUAGE',
      editLanguage,
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
              <div className="nbf-badge">Remarkable Reach</div>

              {ruleStatement && (
                <div className="nbf-context-card">
                  {projectName && <strong>{projectName}: </strong>}
                  "{ruleStatement}"
                </div>
              )}

              <h1>How does your story <span className="nbf-gold">spread</span>?</h1>
              <p>You have your rule break. Now let's figure out how it reaches people: your delivery vehicle, tribal language, and cosign.</p>
            </div>

            <button className="nbf-cta" onClick={() => { hapticLight(); setStep(STEPS.VEHICLE) }}>
              Build your reach
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 2: VEHICLE DISCOVERY ──
  if (step === STEPS.VEHICLE) {
    const hasStrongResult = remarkScore >= 27 || (ruleStatement && ruleStatement.length > 20)

    return (
      <div className="nbf">
        <div className="nbf-container nbf-screen">
          <div className="nbf-step-badge">Delivery Vehicle</div>
          <h2 className="nbf-heading">Your results can reach people in <span className="nbf-gold">3 ways</span></h2>

          {hasStrongResult && (
            <div className="nbf-context-card" style={{ borderColor: 'rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.06)' }}>
              Your Remarkable Results score suggests your rule break is strong. Your results may already BE your content. But a vehicle break can accelerate the spread.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            {VEHICLE_TYPE_OPTIONS.map(opt => (
              <button
                key={opt.key}
                className={`nbf-vehicle-card ${vehicleType === opt.key ? 'nbf-vehicle-selected' : ''}`}
                onClick={() => { hapticLight(); setVehicleType(opt.key) }}
              >
                <div className="nbf-vehicle-label">{opt.label}</div>
                <div className="nbf-vehicle-desc">{opt.desc}</div>
                <div className="nbf-vehicle-example">{opt.example}</div>
              </button>
            ))}
          </div>

          {vehicleType && vehicleType !== 'results' && (
            <div className="nbf-input-group">
              <div className="nbf-input-label">
                {vehicleType === 'new_medium'
                  ? 'Where would you take your experience that nobody in your category goes?'
                  : 'What would you do on [Instagram/YouTube/TikTok/podcast] that nobody in your category does?'}
              </div>
              <input
                className="nbf-input"
                placeholder={vehicleType === 'new_medium'
                  ? 'e.g., corporate offices, museums, documentary, scientific journal'
                  : 'e.g., free daily exercises, behind-the-scenes of real sessions, weekly challenges'}
                value={vehicleDesc}
                onChange={e => setVehicleDesc(e.target.value)}
              />
            </div>
          )}

          <div className="nbf-nav">
            <button className="nbf-back" onClick={() => setStep(STEPS.INTRO)}>Back</button>
            <button
              className="nbf-cta"
              disabled={!vehicleType || (vehicleType !== 'results' && !vehicleDesc.trim())}
              onClick={() => { hapticLight(); setStep(STEPS.LANGUAGE) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 3: TRIBAL LANGUAGE ──
  if (step === STEPS.LANGUAGE) {
    const canProceed = identityLabel.trim() || tribalLanguage.trim()

    return (
      <div className="nbf">
        <div className="nbf-container nbf-screen">
          <div className="nbf-step-badge">Tribal Language</div>
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
            <button className="nbf-back" onClick={() => setStep(STEPS.VEHICLE)}>Back</button>
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
          <div className="nbf-step-badge">Cosign</div>
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
            <button className="nbf-back" onClick={() => setStep(STEPS.LANGUAGE)}>Back</button>
            <button
              className="nbf-cta"
              onClick={() => { hapticLight(); setStep(STEPS.OUTPUT) }}
            >
              See my reach strategy
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 5: OUTPUT — YOUR REACH STRATEGY ──
  if (step === STEPS.OUTPUT) {
    return (
      <div className="nbf">
        <div className="nbf-container nbf-screen">
          <div className="nbf-badge">Your Reach Strategy</div>

          {projectName && (
            <div className="nbf-context-card">
              <strong>{projectName}</strong>
            </div>
          )}

          <div className="nbf-narrative-card">
            <div className="nbf-narrative-title">Your Story</div>

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
              <div className="nbf-narrative-label">The Vehicle</div>
              {editing ? (
                <textarea className="nbf-input" value={editVehicle} onChange={e => setEditVehicle(e.target.value)} rows={2} />
              ) : (
                <p className="nbf-narrative-text">{editVehicle}</p>
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
              setEditWound(''); setEditDiscovery(''); setEditVehicle(''); setEditLanguage(''); setEditCosign('')
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
