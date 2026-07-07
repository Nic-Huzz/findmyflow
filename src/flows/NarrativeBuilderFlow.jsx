/**
 * NarrativeBuilderFlow.jsx — /create/narrative-builder
 * "Remarkable Reach: How does your story spread?"
 *
 * Flow: Intro → Vehicle Deep-Dive (3 types + summary) → Tribal Language → Cosign → Output
 * Pulls Remarkable Results (rule break) data. Vehicle discovery educates on 3 types of reach.
 * First Step removed, lives in Remarkable Growth (AccessArchitectureFlow).
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './NarrativeBuilderFlow.css'

const STEPS = {
  INTRO: 'intro',
  VEHICLE_RESULTS: 'vehicle_results',
  VEHICLE_MEDIUM: 'vehicle_medium',
  VEHICLE_ACTION: 'vehicle_action',
  VEHICLE_SUMMARY: 'vehicle_summary',
  LANGUAGE: 'language',
  COSIGN: 'cosign',
  OUTPUT: 'output',
}

// Diagnostic options anchored to observable reactions, not self-assessment
const RESULTS_DIAGNOSTIC = [
  { value: 1, label: "They nod politely. Sounds like what everyone else does." },
  { value: 2, label: "Mild interest. 'Oh that's cool.'" },
  { value: 3, label: "Genuine curiosity. 'Tell me more about that.'" },
  { value: 4, label: "Surprise. 'Wait, that actually works?'" },
  { value: 5, label: "Disbelief. 'That's not possible.' (But it is.)" },
]

const MEDIUM_DIAGNOSTIC = [
  { value: 1, label: "I show up in the same places as everyone else in my field." },
  { value: 2, label: "I've thought about showing up somewhere new but haven't tried." },
  { value: 3, label: "I have a way into a place nobody in my field has gone." },
  { value: 4, label: "I'm already showing up somewhere nobody in my field goes." },
  { value: 5, label: "I invented a completely new way to reach people in my field." },
]

const ACTION_DIAGNOSTIC = [
  { value: 1, label: "Same stuff, same way as everyone else in my field." },
  { value: 2, label: "Small differences but nothing that would surprise anyone." },
  { value: 3, label: "I'm trying something nobody in my field does on this platform." },
  { value: 4, label: "I regularly do something nobody in my field does here." },
  { value: 5, label: "I started doing something new that others are now copying." },
]

const VEHICLE_SUMMARY_OPTIONS = [
  { key: 'results', label: 'My results ARE my content' },
  { key: 'new_medium', label: 'Take it somewhere new' },
  { key: 'new_action', label: 'Do something new where I already am' },
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
  const [vehicleScoreResults, setVehicleScoreResults] = useState(0)
  const [vehicleScoreMedium, setVehicleScoreMedium] = useState(0)
  const [vehicleScoreAction, setVehicleScoreAction] = useState(0)
  const [fiveResults, setFiveResults] = useState('')
  const [fiveMedium, setFiveMedium] = useState('')
  const [fiveAction, setFiveAction] = useState('')

  // Tribal language
  const [tribalLanguage, setTribalLanguage] = useState('')
  const [identityLabel, setIdentityLabel] = useState('')
  const [feelingName, setFeelingName] = useState('')
  const [purposeLanguage, setPurposeLanguage] = useState('')
  const [simpleLanguage, setSimpleLanguage] = useState('')

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

  // Auto-select strongest vehicle when reaching summary
  useEffect(() => {
    if (step === STEPS.VEHICLE_SUMMARY && !vehicleType) {
      const best = [
        { key: 'results', score: vehicleScoreResults },
        { key: 'new_medium', score: vehicleScoreMedium },
        { key: 'new_action', score: vehicleScoreAction },
      ].reduce((a, b) => a.score > b.score ? a : b)
      if (best.score > 0) setVehicleType(best.key)
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
    const langParts = [
      identityLabel && `People who do this are ${identityLabel}.`,
      tribalLanguage && `After the experience, they say: "${tribalLanguage}"`,
      simpleLanguage && `In simple terms: ${simpleLanguage}`,
      feelingName && `The feeling they can't name? We call it ${feelingName}.`,
    ].filter(Boolean)
    const lang = langParts.length ? langParts.join(' ') : `People who do this are [your people].`
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
      tribal_language: [tribalLanguage, purposeLanguage, simpleLanguage, feelingName].filter(Boolean).join('\n') || null,
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
        tribal_language: [tribalLanguage, purposeLanguage, simpleLanguage, feelingName].filter(Boolean).join('\n') || null,
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
              <p>You know what makes you different. Now let's figure out how people actually hear about it.</p>
            </div>

            <button className="nbf-cta" onClick={() => { hapticLight(); setStep(STEPS.VEHICLE_RESULTS) }}>
              Build your reach
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 2A: RESULTS VEHICLE ──
  if (step === STEPS.VEHICLE_RESULTS) {
    return (
      <div className="nbf">
        <div className="nbf-container nbf-screen">
          <div className="nbf-step-badge">Vehicle 1 of 3</div>
          <h2 className="nbf-heading">Can your results speak <span className="nbf-gold">for themselves</span>?</h2>

          <p className="nbf-edu">Some results are so remarkable that just posting what happens IS the content. No marketing strategy needed. The result IS the story. Nobody else is doing what you're doing, so the content writes itself. You're one of one.</p>

          <div className="nbf-insight">
            This type lasts the longest. Wim Hof has been blowing up for 30+ years because nobody else can say "I control my immune system with breathing."
            <br /><br />
            He climbed Everest in shorts. He ran a marathon in the desert without water. He sat in ice for nearly two hours. Every stunt IS the content. Nobody needs to explain it. When the result itself is one-of-a-kind, nobody can copy it. Compare that to types 2 and 3, which usually last 3-5 years before everyone copies the idea.
          </div>

          <div className="nbf-ref-section">
            <div className="nbf-ref-label">Creators who did this</div>
            <div className="nbf-ref-item">
              <strong>Wim Hof.</strong> Ice + breathwork heals the immune system. Everyone said it was dangerous. He proved it in a peer-reviewed scientific paper. Still blowing up 30+ years later.
            </div>
            <div className="nbf-ref-item">
              <strong>CrossFit.</strong> Garage workouts beat gym machines. Everyone said you need equipment. They posted raw workout videos online. The results were undeniable.
            </div>
            <div className="nbf-ref-item">
              <strong>Daybreaker.</strong> Sober dance at 6am beats drunk dance at 2am. Photos of hundreds dancing at sunrise spoke for themselves.
            </div>
          </div>

          <div className="nbf-diag-label">When you describe what you do, what's the typical reaction?</div>
          <div className="nbf-diag-options">
            {RESULTS_DIAGNOSTIC.map(opt => (
              <button key={opt.value} className={`nbf-diag-option${vehicleScoreResults === opt.value ? ' nbf-diag-selected' : ''}`}
                onClick={() => { hapticLight(); setVehicleScoreResults(opt.value) }}>
                {opt.label}
              </button>
            ))}
          </div>

          <div className="nbf-durability nbf-dur-long">Durability: Decades. Hard to copy because the result itself is one-of-a-kind.</div>

          <div className="nbf-nav">
            <button className="nbf-back" onClick={() => setStep(STEPS.INTRO)}>Back</button>
            <button className="nbf-cta" disabled={!vehicleScoreResults}
              onClick={() => { hapticLight(); setStep(STEPS.VEHICLE_MEDIUM) }}>Next</button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 2B: NEW MEDIUM VEHICLE ──
  if (step === STEPS.VEHICLE_MEDIUM) {
    return (
      <div className="nbf">
        <div className="nbf-container nbf-screen">
          <div className="nbf-step-badge">Vehicle 2 of 3</div>
          <h2 className="nbf-heading">Could a new container <span className="nbf-gold">change everything</span>?</h2>

          <p className="nbf-edu">What you teach doesn't change. Where you teach it does. Take your work somewhere nobody in your field has gone before. Same message, completely new audience.</p>

          <div className="nbf-insight">
            On average, the content exists for 11+ years before a new format makes it blow up. Gabor Mate had the same trauma theory for 31 years. Nobody cared. Then a documentary came out and he became mainstream overnight. The content didn't change. The container did.
          </div>

          <div className="nbf-ref-section">
            <div className="nbf-ref-label">Creators who did this</div>
            <div className="nbf-ref-item">
              <strong>Gabor Mate.</strong> Psychiatrist to documentary. Same insight for 31 years. One format change triggered a global blow-up.
            </div>
            <div className="nbf-ref-item">
              <strong>Brene Brown.</strong> Researcher to TED stage. Researchers don't share breakdowns publicly. One talk changed everything.
            </div>
            <div className="nbf-ref-item">
              <strong>Sara Auster.</strong> Sound healing to MoMA and Apple. Sound baths stayed in studios for decades. She took them to cultural institutions.
            </div>
            <div className="nbf-ref-item">
              <strong>Emily Fletcher.</strong> Meditation to Google's boardroom. Meditation teachers don't go corporate. She walked into the room nobody else entered.
            </div>
            <div className="nbf-ref-item">
              <strong>Esther Perel.</strong> Real therapy sessions on a podcast. Therapists never publish sessions. She took private conversations to a completely new medium.
            </div>
          </div>

          <div className="nbf-diag-label">Where does everyone in your field show up? Are you in the same places?</div>
          <div className="nbf-diag-options">
            {MEDIUM_DIAGNOSTIC.map(opt => (
              <button key={opt.value} className={`nbf-diag-option${vehicleScoreMedium === opt.value ? ' nbf-diag-selected' : ''}`}
                onClick={() => { hapticLight(); setVehicleScoreMedium(opt.value) }}>
                {opt.label}
              </button>
            ))}
          </div>

          <div className="nbf-durability nbf-dur-mid">Durability: Years. New until others follow you into the same channel.</div>

          <div className="nbf-nav">
            <button className="nbf-back" onClick={() => setStep(STEPS.VEHICLE_RESULTS)}>Back</button>
            <button className="nbf-cta" disabled={!vehicleScoreMedium}
              onClick={() => { hapticLight(); setStep(STEPS.VEHICLE_ACTION) }}>Next</button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 2C: NEW ACTION VEHICLE ──
  if (step === STEPS.VEHICLE_ACTION) {
    return (
      <div className="nbf">
        <div className="nbf-container nbf-screen">
          <div className="nbf-step-badge">Vehicle 3 of 3</div>
          <h2 className="nbf-heading">Could you break the rules <span className="nbf-gold">where you already are</span>?</h2>

          <p className="nbf-edu">Everyone's on the same platforms. The break isn't WHERE you show up, it's WHAT you do there. Do something nobody in your category does on a platform people already use.</p>

          <div className="nbf-insight nbf-insight-warn">
            This window closes the fastest. The first person to do something new gets all the attention. The 100th person doing the same thing? Invisible.
            <br /><br />
            Nicole LePera gave away free psychology on Instagram and it worked brilliantly. Within 5 years, thousands of therapists copied her and the advantage faded.
          </div>

          <div className="nbf-ref-section">
            <div className="nbf-ref-label">Creators who did this</div>
            <div className="nbf-ref-item">
              <strong>Nicole LePera.</strong> Free daily psychology on Instagram. Every psychologist charges $200/hr. She gave it away. 5M followers in 2 years. Now thousands of therapists post daily.
            </div>
            <div className="nbf-ref-item">
              <strong>Humans of New York.</strong> Long photo + story captions on Instagram when everyone posted short captions. Spawned thousands of "[City] Humans" copycats within a year.
            </div>
            <div className="nbf-ref-item">
              <strong>Celeste Barber.</strong> Recreating celebrity photos as comedy on Instagram. So simple anyone could copy it. And they did. Hundreds of parody accounts appeared almost immediately.
            </div>
          </div>

          <div className="nbf-insight">
            The first person blows up. The second gets a fraction. The tenth gets almost nothing. By the hundredth, it's invisible. Every person who copies the idea makes it less remarkable for the next. That's why speed matters here more than anywhere else.
          </div>

          <div className="nbf-edu" style={{ marginTop: '0.5rem' }}>
            <strong>Patterns that work:</strong> Give away what everyone charges for. Show the real process behind closed doors. Do it daily when everyone does it weekly. Go unfiltered when everyone is polished. Combine two formats nobody in your field has mixed. Make it teachable when it's founder-dependent.
          </div>

          <div className="nbf-diag-label">On the platforms you're already on, what are you doing differently?</div>
          <div className="nbf-diag-options">
            {ACTION_DIAGNOSTIC.map(opt => (
              <button key={opt.value} className={`nbf-diag-option${vehicleScoreAction === opt.value ? ' nbf-diag-selected' : ''}`}
                onClick={() => { hapticLight(); setVehicleScoreAction(opt.value) }}>
                {opt.label}
              </button>
            ))}
          </div>

          <div className="nbf-durability nbf-dur-short">Durability: Short. The window closes once others copy it.</div>

          <div className="nbf-nav">
            <button className="nbf-back" onClick={() => setStep(STEPS.VEHICLE_MEDIUM)}>Back</button>
            <button className="nbf-cta" disabled={!vehicleScoreAction}
              onClick={() => { hapticLight(); setStep(STEPS.VEHICLE_SUMMARY) }}>See my profile</button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 2D: VEHICLE SUMMARY ──
  if (step === STEPS.VEHICLE_SUMMARY) {
    const scoreCards = [
      { key: 'results', label: 'Results', score: vehicleScoreResults, color: '#34d399',
        question: 'What result could you produce that would make people say "that\'s not possible"?',
        placeholder: 'e.g., heal something nobody thinks can be healed, achieve something the industry says requires years',
        value: fiveResults, onChange: setFiveResults },
      { key: 'new_medium', label: 'New Medium', score: vehicleScoreMedium, color: '#E9A23B',
        question: 'Where could you take your work that nobody in your field has ever gone?',
        placeholder: 'e.g., corporate boardrooms, museums, a documentary, schools, hospitals',
        value: fiveMedium, onChange: setFiveMedium },
      { key: 'new_action', label: 'New Action', score: vehicleScoreAction, color: '#a78bfa',
        question: 'What could you do on your platform that nobody in your field does there?',
        placeholder: 'e.g., give away what others charge for, show the raw unfiltered process, go daily when others go weekly',
        value: fiveAction, onChange: setFiveAction },
    ]
    const strongest = scoreCards.reduce((a, b) => a.score > b.score ? a : b)

    return (
      <div className="nbf">
        <div className="nbf-container nbf-screen">
          <div className="nbf-step-badge">Your Vehicle Profile</div>
          <h2 className="nbf-heading">What would make each a <span className="nbf-gold">5</span>?</h2>

          <p className="nbf-edu">You scored each type. Now imagine you went all-in on each one. What would that look like?</p>

          {scoreCards.map(card => (
            <div key={card.key} className="nbf-five-card" style={{ borderColor: `${card.color}33` }}>
              <div className="nbf-five-header">
                <div className="nbf-five-label">{card.label}</div>
                <div className="nbf-five-score" style={{ color: card.color }}>{card.score}/5</div>
              </div>
              <div className="nbf-score-track" style={{ marginBottom: '0.75rem' }}>
                <div className="nbf-score-fill" style={{ width: `${(card.score / 5) * 100}%`, background: card.color }} />
              </div>
              <div className="nbf-input-label">{card.question}</div>
              <input
                className="nbf-input"
                placeholder={card.placeholder}
                value={card.value}
                onChange={e => card.onChange(e.target.value)}
              />
            </div>
          ))}

          <div className="nbf-diag-label" style={{ marginTop: '0.5rem' }}>Now pick. Which one will you pursue?</div>
          <div className="nbf-diag-options">
            {VEHICLE_SUMMARY_OPTIONS.map(opt => (
              <button key={opt.key} className={`nbf-diag-option${vehicleType === opt.key ? ' nbf-diag-selected' : ''}`}
                onClick={() => {
                  hapticLight()
                  setVehicleType(opt.key)
                  // Pre-fill vehicleDesc from their "make it a 5" answer
                  if (opt.key === 'results' && !vehicleDesc) setVehicleDesc(fiveResults)
                  if (opt.key === 'new_medium' && !vehicleDesc) setVehicleDesc(fiveMedium)
                  if (opt.key === 'new_action' && !vehicleDesc) setVehicleDesc(fiveAction)
                }}>
                {opt.label}
              </button>
            ))}
          </div>

          <div className="nbf-nav">
            <button className="nbf-back" onClick={() => setStep(STEPS.VEHICLE_ACTION)}>Back</button>
            <button className="nbf-cta"
              disabled={!fiveResults.trim() || !fiveMedium.trim() || !fiveAction.trim() || !vehicleType}
              onClick={() => { hapticLight(); setStep(STEPS.LANGUAGE) }}>Next</button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 3: TRIBAL LANGUAGE ──
  if (step === STEPS.LANGUAGE) {
    const canProceed = identityLabel.trim() && tribalLanguage.trim() && purposeLanguage.trim() && simpleLanguage.trim() && feelingName.trim()

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
            <div className="nbf-input-label">When someone finishes your experience, what words do they use to share what happened?</div>
            <textarea
              className="nbf-input"
              placeholder='e.g., "I feel like I can breathe again," "I finally get it," "I just did my first cold plunge"'
              value={tribalLanguage}
              onChange={e => setTribalLanguage(e.target.value)}
              rows={2}
            />
          </div>

          <div className="nbf-input-group">
            <div className="nbf-input-label">When people sign up, what do they say the purpose is?</div>
            <input
              className="nbf-input"
              placeholder='e.g., "I want to feel something real," "I need to get unstuck"'
              value={purposeLanguage}
              onChange={e => setPurposeLanguage(e.target.value)}
            />
          </div>

          <div className="nbf-input-group">
            <div className="nbf-input-label">How would a participant describe what you do to a 12 year old?</div>
            <input
              className="nbf-input"
              placeholder='e.g., "You breathe really hard and then jump in ice and feel amazing"'
              value={simpleLanguage}
              onChange={e => setSimpleLanguage(e.target.value)}
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
            <button className="nbf-back" onClick={() => setStep(STEPS.VEHICLE_SUMMARY)}>Back</button>
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
          <h2 className="nbf-heading">Who gives your audience <span className="nbf-gold">permission</span>?</h2>

          <p className="nbf-edu">A cosign isn't a celebrity endorsement. It's someone your specific audience trusts who says "this is real." It could be a local doctor, a respected teacher, a well-known coach in your niche. The status is relative to YOUR people, not the whole world.</p>

          <div className="nbf-insight">
            Some movements grew without any elite cosign at all. Sourdough revival spread through home bakers. Parkrun spread through communities. But when a cosign lands, it speeds everything up 10x. Joe Rogan doing Wim Hof on camera. Navy SEALs doing CrossFit. That one signal: "if THEY do it, it can't be weird."
          </div>

          <div className="nbf-ref-section">
            <div className="nbf-ref-label">A cosign can be a person, a venue, or a partnership</div>
            <div className="nbf-ref-item">
              <strong>Venue.</strong> Sara Auster did sound healing at MoMA. The venue IS the cosign. "If MoMA hosted it, it must be legit."
            </div>
            <div className="nbf-ref-item">
              <strong>Person.</strong> Joe Rogan did Wim Hof on camera. One person your audience respects trying your thing changes everything.
            </div>
            <div className="nbf-ref-item">
              <strong>Co-facilitate.</strong> Emily Fletcher taught meditation at Google. She didn't need Google to endorse her. She just showed up in their room.
            </div>
          </div>

          <div className="nbf-input-group">
            <div className="nbf-input-label">What's a venue or brand you could partner with?</div>
            <input
              className="nbf-input"
              placeholder='e.g., a yoga studio, a coworking space, a festival, a hotel'
              value={cosignTargets}
              onChange={e => setCosignTargets(e.target.value)}
            />
          </div>

          <div className="nbf-input-group">
            <div className="nbf-input-label">Who could you invite for free so they experience it firsthand?</div>
            <input
              className="nbf-input"
              placeholder='e.g., a local physio, a podcaster in your niche, a journalist'
              value={cosignExisting}
              onChange={e => setCosignExisting(e.target.value)}
            />
          </div>

          <div className="nbf-input-group">
            <div className="nbf-input-label">Who could you co-facilitate with?</div>
            <input
              className="nbf-input"
              placeholder='e.g., a therapist, a personal trainer, a chef, a musician'
              value={cosignDream}
              onChange={e => setCosignDream(e.target.value)}
            />
          </div>

          <div className="nbf-nav">
            <button className="nbf-back" onClick={() => setStep(STEPS.LANGUAGE)}>Back</button>
            <button
              className="nbf-cta"
              disabled={!cosignTargets.trim() || !cosignExisting.trim() || !cosignDream.trim()}
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
