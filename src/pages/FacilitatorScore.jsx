/**
 * FacilitatorScore.jsx — /try/facilitator-score AND /scale-diagnostic
 * Scale Score v2: 3-pillar Phase 3 diagnostic (RETURN · BREAK · TRIBAL).
 *
 * Public: Intro → Branch → RETURN (2Q) → TRIBAL (2Q) → BREAK (1Q + pulled rule break) → Email → Results
 * Logged-in: Same flow but pulls rule break from Remarkable Results, shows access context, saves to scale_diagnostics
 *
 * 3 Pillars:
 *   RETURN — Does it align with 100K-year-old biology? (Ancestral + Body)
 *   BREAK  — Does it create results in unexpected ways? (Format + Rule Break)
 *   TRIBAL — Does it create a tribe? (Identity + Shareability)
 */
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import '../flows/ScaleDiagnosticFlow.css'

const STEPS = {
  INTRO: 'intro',
  BRANCH: 'branch',
  RETURN: 'return',
  TRIBAL: 'tribal',
  BREAK: 'break',
  EMAIL: 'email',
  RESULTS: 'results',
}

// ── Branch data ──
const BRANCHES = [
  { key: 'movement',    label: 'Movement',    icon: '\u{1F3C3}', desc: 'Fitness, dance, cold exposure, physical challenge', creators: 21 },
  { key: 'nourishment', label: 'Nourishment', icon: '\u{1F37D}\uFE0F', desc: 'Food, cooking, fasting, nutrition', creators: 1 },
  { key: 'tools',       label: 'Tools/Tech',  icon: '\u{1F6E0}\uFE0F', desc: 'Skills, education, problem-solving, AI', creators: 3 },
  { key: 'status',      label: 'Status',      icon: '\u2728', desc: 'Identity, craft, reputation, self-expression', creators: 3 },
  { key: 'bonds',       label: 'Bonds',       icon: '\u{1F91D}', desc: 'Relationships, community, gathering, friendship', creators: 10 },
  { key: 'shelter',     label: 'Shelter',     icon: '\u{1F3E0}', desc: 'Space design, environments, co-living', creators: 1 },
  { key: 'story',       label: 'Story',       icon: '\u{1F4D6}', desc: 'Narrative, storytelling, live content, media', creators: 8 },
  { key: 'fire',        label: 'Fire/Energy', icon: '\u{1F525}', desc: 'Ceremony, lighting, ritual, frequency', creators: 1 },
  { key: 'healing',     label: 'Healing',     icon: '\u{1F49C}', desc: 'Therapy, breathwork, somatic, plant medicine', creators: 30 },
  { key: 'threat',      label: 'Threat',      icon: '\u2694\uFE0F', desc: 'Courage, fear-facing, resilience, safety', creators: 0 },
]

// ── Question options ──
const ANCESTRAL_OPTIONS = [
  { value: 1, label: 'Not really. It\'s a modern invention.' },
  { value: 2, label: 'Loosely inspired by something ancestral.' },
  { value: 3, label: 'It includes a recognisable ancestral element.' },
  { value: 4, label: 'Direct return of an ancestral practice, modern container.' },
  { value: 5, label: 'The experience IS the ancestral practice.' },
]

const BODY_OPTIONS = [
  { value: 1, label: 'Not at all. It\'s purely informational.' },
  { value: 2, label: 'Slightly. Some relaxation or energy.' },
  { value: 3, label: 'Moderately. Noticeable physical shift.' },
  { value: 4, label: 'Strongly. Real physiological change.' },
  { value: 5, label: 'Intensely. They feel it in their bones.' },
]

const IDENTITY_OPTIONS = [
  { value: 1, label: 'No. They attend and leave.' },
  { value: 2, label: 'Slightly. They might think about it.' },
  { value: 3, label: 'Somewhat. It becomes part of their story.' },
  { value: 4, label: 'Yes. They start saying "I\'m someone who ___."' },
  { value: 5, label: 'Completely. It defines how they see themselves.' },
]

const SHAREABILITY_OPTIONS = [
  { value: 1, label: 'Nobody would mention it.' },
  { value: 2, label: 'They might, if the topic came up.' },
  { value: 3, label: 'They\'d probably bring it up naturally.' },
  { value: 4, label: 'They\'d tell friends unprompted.' },
  { value: 5, label: 'They can\'t shut up about it.' },
]

const FORMAT_OPTIONS = [
  { value: 1, label: 'Same format everyone in my category uses.' },
  { value: 2, label: 'A slight variation on what exists.' },
  { value: 3, label: 'A notable twist on the standard delivery.' },
  { value: 4, label: 'A genuinely different delivery vehicle.' },
  { value: 5, label: 'A format that doesn\'t exist yet in my category.' },
]

const RULEBREAK_OPTIONS = [
  { value: 1, label: 'The result is expected for this type of experience.' },
  { value: 2, label: 'The result is slightly better than people expect.' },
  { value: 3, label: 'The result surprises people when they hear about it.' },
  { value: 4, label: 'People say "wait, really?" when they hear the result.' },
  { value: 5, label: 'The result is so unexpected people don\'t believe it until they try.' },
]

// ── Pillar definitions ──
const PILLAR_META = {
  return: { key: 'return', label: 'Return', color: '#34d399', desc: 'Ancestral alignment' },
  break:  { key: 'break',  label: 'Break',  color: '#E9A23B', desc: 'Unexpected results' },
  tribal: { key: 'tribal', label: 'Tribal', color: '#a78bfa', desc: 'Tribe creation' },
}

const PILLAR_RECOMMENDATIONS = {
  return: 'Your experience doesn\'t connect to ancestral biology strongly enough. What did humans do for 100,000 years that this echoes? Get the body involved. People forget what they think, they remember what they feel.',
  break: 'Your results are expected. People won\'t talk about expected results. What would your industry say CAN\'T work that you prove DOES? And is your delivery vehicle new, or the same format everyone else uses?',
  tribal: 'People attend and leave. They don\'t become anything. Give them a word for what they are now: "I\'m someone who ___." The identity isn\'t a label, it\'s a CHOICE that reflects a VALUE. What do participants CHOOSE by doing this?',
}

export default function FacilitatorScore() {
  const [step, setStepRaw] = useState(STEPS.INTRO)
  const setStep = (next) => { setStepRaw(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  // ── Scores ──
  // RETURN pillar
  const [scoreAncestral, setScoreAncestral] = useState(0)
  const [scoreBody, setScoreBody] = useState(0)
  // TRIBAL pillar
  const [scoreIdentity, setScoreIdentity] = useState(0)
  const [scoreShareability, setScoreShareability] = useState(0)
  // BREAK pillar
  const [scoreFormat, setScoreFormat] = useState(0)
  const [scoreRulebreak, setScoreRulebreak] = useState(0)

  // Identity text input
  const [identityStatement, setIdentityStatement] = useState('')

  // Branch
  const [selectedBranch, setSelectedBranch] = useState(null)

  // Auth + context
  const [user, setUser] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [ruleBreak, setRuleBreak] = useState('')
  const [existingDiagId, setExistingDiagId] = useState(null)
  const [accessScore, setAccessScore] = useState(null)

  // Email capture
  const [email, setEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailError, setEmailError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data?.user
      if (!u) return
      setUser(u)

      // Pull Remarkable Results data
      supabase.from('remarkable_angles')
        .select('project_name, ai_rule_statement, wound_problem, score_unique, score_share, score_simple')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data: angle }) => {
          if (angle?.[0]) {
            if (angle[0].project_name) setProjectName(angle[0].project_name)
            if (angle[0].ai_rule_statement) setRuleBreak(angle[0].ai_rule_statement)
          }
        })

      // Pull access context
      supabase.from('access_architectures')
        .select('score_price, score_time, score_friction, score_cognitive, score_identity')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data: access }) => {
          if (access?.[0]) {
            const avg = Math.round(((access[0].score_price || 0) + (access[0].score_time || 0) + (access[0].score_friction || 0) + (access[0].score_cognitive || 0) + (access[0].score_identity || 0)) / 5 * 10) / 10
            setAccessScore(avg)
          }
        })

      // Pre-fill from existing diagnostic
      supabase.from('scale_diagnostics')
        .select('id, score_body, score_culture, score_identity, score_ancestral, score_format, score_rulebreak, branch')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data: diag }) => {
          if (diag?.[0]) {
            setExistingDiagId(diag[0].id)
            if (diag[0].score_body) setScoreBody(diag[0].score_body)
            if (diag[0].score_culture) setScoreShareability(diag[0].score_culture)
            if (diag[0].score_identity) setScoreIdentity(diag[0].score_identity)
            if (diag[0].score_ancestral) setScoreAncestral(diag[0].score_ancestral)
            if (diag[0].score_format) setScoreFormat(diag[0].score_format)
            if (diag[0].score_rulebreak) setScoreRulebreak(diag[0].score_rulebreak)
            if (diag[0].branch) setSelectedBranch(diag[0].branch)
          }
        })
    })
  }, [])

  const isLoggedIn = !!user

  // ── Pillar scores (average of sub-factors, 1-5) ──
  const pillarReturn = scoreAncestral > 0 && scoreBody > 0
    ? Math.round((scoreAncestral + scoreBody) / 2 * 10) / 10 : 0
  const pillarBreak = scoreFormat > 0 && scoreRulebreak > 0
    ? Math.round((scoreFormat + scoreRulebreak) / 2 * 10) / 10 : 0
  const pillarTribal = scoreIdentity > 0 && scoreShareability > 0
    ? Math.round((scoreIdentity + scoreShareability) / 2 * 10) / 10 : 0

  const totalScore = Math.round((pillarReturn + pillarBreak + pillarTribal) * 10) / 10
  const maxScore = 15

  const getPhaseClass = (score) => {
    if (score >= 12) return { label: 'Phase 3', desc: 'Blow-up conditions present. Protect the purity and find your format change.', color: '#34d399' }
    if (score >= 9) return { label: 'Strong Phase 3', desc: 'One pillar needs sharpening. Fix it and this scales.', color: '#6ee7b7' }
    if (score >= 6) return { label: 'Phase 2.5', desc: 'Phase 3 content delivered through a Phase 2 mechanism. Pick a lane.', color: '#fbbf24' }
    return { label: 'Phase 2', desc: 'This removes difficulty instead of building capacity. Rethink the concept.', color: '#f87171' }
  }

  const getBarColor = (score) => {
    if (score >= 4) return 'sdf-bar-green'
    if (score >= 3) return 'sdf-bar-amber'
    return 'sdf-bar-red'
  }

  const getPillarBarColor = (score) => {
    if (score >= 4) return 'sdf-bar-green'
    if (score >= 3) return 'sdf-bar-amber'
    return 'sdf-bar-red'
  }

  const pillars = [
    { ...PILLAR_META.return, score: pillarReturn, subs: [{ label: 'Ancestral', score: scoreAncestral }, { label: 'Body', score: scoreBody }] },
    { ...PILLAR_META.break, score: pillarBreak, subs: [{ label: 'Format', score: scoreFormat }, { label: 'Rule Break', score: scoreRulebreak }] },
    { ...PILLAR_META.tribal, score: pillarTribal, subs: [{ label: 'Identity', score: scoreIdentity }, { label: 'Shareability', score: scoreShareability }] },
  ]

  const weakestPillar = pillars.reduce((min, p) => p.score > 0 && p.score < min.score ? p : min, pillars[0])

  const branchObj = BRANCHES.find(b => b.key === selectedBranch)

  // ── Save ──
  const saveForUser = async () => {
    if (!user) return
    const fields = {
      score_body: scoreBody,
      score_culture: scoreShareability,
      score_identity: scoreIdentity,
      score_ancestral: scoreAncestral,
      score_format: scoreFormat,
      score_rulebreak: scoreRulebreak,
      branch: selectedBranch,
      total_score: Math.round(totalScore * 10),
      phase_classification: getPhaseClass(totalScore).label,
      gate_passed: pillarReturn >= 4 && pillarTribal >= 3,
      project_name: projectName || null,
    }
    try {
      if (existingDiagId) {
        await supabase.from('scale_diagnostics').update(fields).eq('id', existingDiagId)
      } else {
        const { data } = await supabase.from('scale_diagnostics').insert({ ...fields, user_id: user.id }).select('id').single()
        if (data?.id) setExistingDiagId(data.id)
      }
    } catch (err) { console.warn('Scale Score save failed:', err.message) }
  }

  // ── Email ──
  const handleEmailSubmit = async () => {
    if (!email || !email.includes('@')) { setEmailError('Please enter a valid email address.'); return }
    setEmailSaving(true); setEmailError(null)
    try {
      await supabase.from('lead_captures').insert({
        email, source: 'scale-score',
        scores: { total: totalScore, branch: selectedBranch, return: pillarReturn, break: pillarBreak, tribal: pillarTribal, ancestral: scoreAncestral, body: scoreBody, identity: scoreIdentity, shareability: scoreShareability, format: scoreFormat, rulebreak: scoreRulebreak },
      })
    } catch (err) { console.warn('Lead capture error:', err.message) }
    setEmailSaving(false); hapticSuccess(); setStep(STEPS.RESULTS)
  }

  // ── Share ──
  const handleShare = async () => {
    const url = `${window.location.origin}/try/facilitator-score`
    const phase = getPhaseClass(totalScore)
    const text = `My Scale Score: ${totalScore}/15 (${phase.label}). Return ${pillarReturn}/5, Break ${pillarBreak}/5, Tribal ${pillarTribal}/5. Take yours: ${url}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true); hapticSuccess(); setTimeout(() => setCopied(false), 2500)
    } catch {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
      setCopied(true); hapticSuccess(); setTimeout(() => setCopied(false), 2500)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN 1: INTRO
  // ═══════════════════════════════════════════════════════════════
  if (step === STEPS.INTRO) {
    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-intro">
            <div className="sdf-intro-content">
              <div className="sdf-badge">Scale Score</div>

              {ruleBreak && (
                <div className="sdf-context-card" style={{ marginBottom: '1rem' }}>
                  {projectName && <strong>{projectName}: </strong>}
                  "{ruleBreak}"
                </div>
              )}

              <h1>Will your experience <span className="sdf-gold">scale</span>?</h1>

              <div style={{ textAlign: 'left', maxWidth: 380, margin: '0 auto', fontSize: '0.88rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.65)' }}>
                <p style={{ margin: '0 0 0.75rem' }}>
                  Your brain and body run on software that's 100,000 years old. Every invention since then made life more convenient. Less walking, less cooking, less face-to-face.
                </p>
                <p style={{ margin: '0 0 0.75rem' }}>
                  That worked great until it didn't. When convenience goes too far, people start paying to do the hard thing again. CrossFit. Cold plunge. Dancing sober at sunrise.
                </p>
                <p style={{ margin: '0 0 0.75rem', color: 'rgba(255,255,255,0.85)' }}>
                  <strong>The experiences that scale give people back what convenience took away.</strong>
                </p>
                <p style={{ margin: 0 }}>
                  3 pillars. 6 questions. 2 minutes.
                </p>
              </div>
            </div>

            <button className="sdf-cta" onClick={() => { hapticLight(); setStep(STEPS.BRANCH) }}>
              Score my experience
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN 2: BRANCH SELECTION
  // ═══════════════════════════════════════════════════════════════
  if (step === STEPS.BRANCH) {
    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-step-badge">Step 1 of 4</div>
          <h2 className="sdf-heading">Which <span className="sdf-gold">branch</span> does your experience sit on?</h2>
          <p className="sdf-prompt">Every experience maps to one of 10 primal human needs. This shapes the competition context on your results.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {BRANCHES.map(b => (
              <button key={b.key} className={`sdf-option-btn ${selectedBranch === b.key ? 'sdf-option-selected' : ''}`}
                onClick={() => { hapticLight(); setSelectedBranch(b.key) }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{b.icon}</span>
                <span>
                  <strong>{b.label}</strong>
                  <span style={{ display: 'block', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{b.desc}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="sdf-nav">
            <button className="sdf-back" onClick={() => setStep(STEPS.INTRO)}>Back</button>
            <button className="sdf-cta" disabled={!selectedBranch} onClick={() => { hapticLight(); setStep(STEPS.RETURN) }}>Next</button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN 3: RETURN PILLAR (Ancestral + Body)
  // ═══════════════════════════════════════════════════════════════
  if (step === STEPS.RETURN) {
    const ready = scoreAncestral > 0 && scoreBody > 0
    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-step-badge">Step 2 of 4 \u00b7 Return</div>
          <h2 className="sdf-heading" style={{ color: '#34d399' }}>Does it align with our <span style={{ color: 'white' }}>100,000-year-old</span> biology?</h2>

          <div className="sdf-question-section">
            <div className="sdf-question-label">Does your experience return something humans did for 100,000+ years?</div>
            <p className="sdf-question-why">For 100,000 years humans moved in groups, cooked over fire, told stories in circles, faced fears together. The experiences that scale are the ones that give this back in a modern container.</p>
            <div className="sdf-option-list">
              {ANCESTRAL_OPTIONS.map(opt => (
                <button key={opt.value} className={`sdf-option-btn ${scoreAncestral === opt.value ? 'sdf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setScoreAncestral(opt.value) }}>{opt.label}</button>
              ))}
            </div>
          </div>

          <div className="sdf-question-section">
            <div className="sdf-question-label">After your experience, does the participant's body feel <span className="sdf-gold">physically different</span>?</div>
            <p className="sdf-question-why">You can learn something in your head and forget it by Tuesday. But trembling, sweating, tears, goosebumps: those get encoded differently. It's why you remember your first cold plunge but not last week's podcast.</p>
            <div className="sdf-option-list">
              {BODY_OPTIONS.map(opt => (
                <button key={opt.value} className={`sdf-option-btn ${scoreBody === opt.value ? 'sdf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setScoreBody(opt.value) }}>{opt.label}</button>
              ))}
            </div>
          </div>

          <div className="sdf-nav">
            <button className="sdf-back" onClick={() => setStep(STEPS.BRANCH)}>Back</button>
            <button className="sdf-cta" disabled={!ready} onClick={() => { hapticLight(); setStep(STEPS.TRIBAL) }}>Next</button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN 4: TRIBAL PILLAR (Identity + Shareability)
  // ═══════════════════════════════════════════════════════════════
  if (step === STEPS.TRIBAL) {
    const ready = scoreIdentity > 0 && scoreShareability > 0
    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-step-badge">Step 3 of 4 \u00b7 Tribal</div>
          <h2 className="sdf-heading" style={{ color: '#a78bfa' }}>Does it create a <span style={{ color: 'white' }}>tribe</span>?</h2>

          <div className="sdf-question-section">
            <div className="sdf-question-label">Would participants start calling themselves <span className="sdf-gold">something new</span>?</div>
            <p className="sdf-question-why">Identity isn't a label. It's a CHOICE that reflects a VALUE. "I'm a CrossFitter" means "I choose hard over easy." "I'm a Daybreaker" means "I choose joy without substances." What do participants CHOOSE by doing your experience?</p>
            <div className="sdf-option-list">
              {IDENTITY_OPTIONS.map(opt => (
                <button key={opt.value} className={`sdf-option-btn ${scoreIdentity === opt.value ? 'sdf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setScoreIdentity(opt.value) }}>{opt.label}</button>
              ))}
            </div>

            {scoreIdentity >= 3 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '0.35rem' }}>
                  Complete the sentence: "I'm someone who ___"
                </div>
                <input type="text" value={identityStatement} onChange={(e) => setIdentityStatement(e.target.value)}
                  placeholder="e.g. dances sober at sunrise"
                  style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.15)', borderRadius: 12, color: 'white', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => { e.target.style.borderColor = '#a78bfa' }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.15)' }}
                />
              </div>
            )}
          </div>

          <div className="sdf-question-section">
            <div className="sdf-question-label">Would participants tell friends <span className="sdf-gold">without being asked</span>?</div>
            <p className="sdf-question-why">Shareable experiences have 3 elements: a surprising TRANSFORMATION ("I cried for 20 minutes"), an unexpected DELIVERY ("silent disco on a beach at sunrise"), and WITNESSES ("with 200 strangers"). The stronger each element, the more people talk.</p>
            <div className="sdf-option-list">
              {SHAREABILITY_OPTIONS.map(opt => (
                <button key={opt.value} className={`sdf-option-btn ${scoreShareability === opt.value ? 'sdf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setScoreShareability(opt.value) }}>{opt.label}</button>
              ))}
            </div>
          </div>

          <div className="sdf-nav">
            <button className="sdf-back" onClick={() => setStep(STEPS.RETURN)}>Back</button>
            <button className="sdf-cta" disabled={!ready} onClick={() => { hapticLight(); setStep(STEPS.BREAK) }}>Next</button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN 5: BREAK PILLAR (Format + Rule Break)
  // ═══════════════════════════════════════════════════════════════
  if (step === STEPS.BREAK) {
    const ready = scoreFormat > 0 && scoreRulebreak > 0
    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-step-badge">Step 4 of 4 \u00b7 Break</div>
          <h2 className="sdf-heading" style={{ color: '#E9A23B' }}>Does it create results in <span style={{ color: 'white' }}>unexpected</span> ways?</h2>

          <div className="sdf-question-section">
            <div className="sdf-question-label">Is your <span className="sdf-gold">delivery vehicle</span> new, or is it the same format everyone else uses?</div>
            <p className="sdf-question-why">Gabor Mate had the same insight for 44 years. It blew up when the FORMAT changed (documentary). Wim Hof taught the same method for decades. It blew up when a scientific paper validated it. The blow-up is almost never a content change. It's a vehicle change.</p>
            <div className="sdf-option-list">
              {FORMAT_OPTIONS.map(opt => (
                <button key={opt.value} className={`sdf-option-btn ${scoreFormat === opt.value ? 'sdf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setScoreFormat(opt.value) }}>{opt.label}</button>
              ))}
            </div>
          </div>

          <div className="sdf-question-section">
            {ruleBreak && (
              <div className="sdf-context-card" style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#E9A23B', marginBottom: '0.25rem' }}>From your Remarkable Results</div>
                "{ruleBreak}"
              </div>
            )}
            <div className="sdf-question-label">Does your experience produce a result <span className="sdf-gold">so unexpected</span> people can't help talking about it?</div>
            <p className="sdf-question-why">A rule break isn't about being controversial. It's about producing a result the industry says shouldn't be possible. "I walked on fire and felt unstoppable." "I breathed for 90 minutes and healed a trauma I'd had for 20 years." The more unexpected the result, the more it spreads.</p>
            <div className="sdf-option-list">
              {RULEBREAK_OPTIONS.map(opt => (
                <button key={opt.value} className={`sdf-option-btn ${scoreRulebreak === opt.value ? 'sdf-option-selected' : ''}`}
                  onClick={() => { hapticLight(); setScoreRulebreak(opt.value) }}>{opt.label}</button>
              ))}
            </div>
          </div>

          <div className="sdf-nav">
            <button className="sdf-back" onClick={() => setStep(STEPS.TRIBAL)}>Back</button>
            <button className="sdf-cta" disabled={!ready} onClick={() => {
              hapticLight()
              if (isLoggedIn) { saveForUser(); hapticSuccess(); setStep(STEPS.RESULTS) }
              else setStep(STEPS.EMAIL)
            }}>
              See my score
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN 6: EMAIL CAPTURE (public only)
  // ═══════════════════════════════════════════════════════════════
  if (step === STEPS.EMAIL) {
    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">
          <div className="sdf-intro">
            <div className="sdf-intro-content">
              <div className="sdf-badge">Almost there</div>
              <h1>Where should we send your <span className="sdf-gold">Scale Score</span>?</h1>
              <div style={{ width: '100%', maxWidth: 380, marginTop: '0.5rem' }}>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(null) }}
                  placeholder="your@email.com" autoFocus
                  style={{ width: '100%', padding: '0.9rem 1.1rem', background: 'rgba(255,255,255,0.08)', border: `2px solid ${emailError ? '#f87171' : 'rgba(255,255,255,0.2)'}`, borderRadius: 14, color: 'white', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={(e) => { if (!emailError) e.target.style.borderColor = '#E9A23B' }}
                  onBlur={(e) => { if (!emailError) e.target.style.borderColor = 'rgba(255,255,255,0.2)' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleEmailSubmit() }}
                />
                {emailError && <div className="sdf-error" style={{ marginTop: '0.5rem' }}>{emailError}</div>}
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginTop: '0.75rem', textAlign: 'center' }}>
                  Your 3-pillar breakdown + the one thing to fix first.
                </p>
              </div>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="sdf-cta" style={{ width: '100%' }} disabled={emailSaving} onClick={handleEmailSubmit}>
                {emailSaving ? 'Sending...' : 'Get my score'}
              </button>
              <button className="sdf-back" style={{ width: '100%', textAlign: 'center' }} onClick={() => setStep(STEPS.RESULTS)}>
                Skip, just show me
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREEN 7: RESULTS
  // ═══════════════════════════════════════════════════════════════
  if (step === STEPS.RESULTS) {
    const phase = getPhaseClass(totalScore)

    return (
      <div className="sdf">
        <div className="sdf-container sdf-screen">

          {/* Big score */}
          <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
            <div className="sdf-badge">Scale Score</div>
            <div style={{ fontSize: '4.5rem', fontWeight: 900, lineHeight: 1, color: phase.color, marginBottom: '0.25rem' }}>
              {totalScore}
            </div>
            <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: '0.5rem' }}>
              out of {maxScore}
            </div>
            <div style={{ display: 'inline-block', padding: '0.3rem 0.9rem', background: `${phase.color}18`, border: `1px solid ${phase.color}40`, borderRadius: 100, fontSize: '0.82rem', fontWeight: 700, color: phase.color, marginBottom: '0.5rem' }}>
              {phase.label}
            </div>
            <div style={{ fontSize: '0.92rem', lineHeight: 1.45, color: 'rgba(255,255,255,0.65)', maxWidth: 360, margin: '0.5rem auto 0' }}>
              {phase.desc}
            </div>
          </div>

          {/* 3 Pillar bars with sub-factors */}
          <div className="sdf-results-section">
            {pillars.map(p => (
              <div key={p.key} className={`sdf-score-bar ${p.key === weakestPillar.key ? 'sdf-score-bar-weakest' : ''}`}>
                <div className="sdf-score-bar-header">
                  <span className="sdf-score-bar-label" style={{ color: p.color, fontWeight: 800, fontSize: '0.88rem' }}>{p.label}</span>
                  <span className="sdf-score-bar-value" style={{ color: p.color }}>{p.score}/5</span>
                </div>
                <div className="sdf-score-bar-track">
                  <div className={`sdf-score-bar-fill ${getPillarBarColor(p.score)}`} style={{ width: `${(p.score / 5) * 100}%` }} />
                </div>
                {/* Sub-factors */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {p.subs.map(s => (
                    <div key={s.label} style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>
                        <span>{s.label}</span><span>{s.score}/5</span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 2, width: `${(s.score / 5) * 100}%`, background: s.score >= 4 ? '#34d399' : s.score >= 3 ? '#fbbf24' : '#f87171', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Weakest pillar recommendation */}
          <div className="sdf-accelerator-card" style={{ borderColor: `${weakestPillar.color}40` }}>
            <div className="sdf-accelerator-label" style={{ color: weakestPillar.color }}>
              Your biggest growth lever: {weakestPillar.label}
            </div>
            <p className="sdf-accelerator-text">{PILLAR_RECOMMENDATIONS[weakestPillar.key]}</p>
          </div>

          {/* Identity statement */}
          {identityStatement && (
            <div className="sdf-gap-card">
              <div className="sdf-gap-label">Your Identity Statement</div>
              <p className="sdf-gap-text" style={{ fontSize: '1rem', fontWeight: 600, color: '#a78bfa' }}>
                "I'm someone who {identityStatement}"
              </p>
            </div>
          )}

          {/* Branch competition */}
          {branchObj && (
            <div className="sdf-gap-card">
              <div className="sdf-gap-label">Branch: {branchObj.label}</div>
              <p className="sdf-gap-text">
                {branchObj.creators === 0
                  ? `Zero known experience creators in ${branchObj.label}. You would be first.`
                  : branchObj.creators <= 3
                  ? `Only ${branchObj.creators} known creator${branchObj.creators > 1 ? 's' : ''} in ${branchObj.label}. Wide open.`
                  : branchObj.creators <= 10
                  ? `${branchObj.creators} creators in ${branchObj.label}. Room to differentiate.`
                  : `${branchObj.creators} creators in ${branchObj.label}. Crowded. Your Break pillar matters most.`
                }
              </p>
            </div>
          )}

          {/* Access context */}
          {accessScore !== null && (
            <div className="sdf-gap-card">
              <div className="sdf-gap-label">Access Score (from Barrier Audit)</div>
              <p className="sdf-gap-text">
                Barrier average: {accessScore}/5.
                {accessScore >= 4 ? ' Low barriers.' : accessScore >= 3 ? ' Moderate barriers. Consider a free micro-version.' : ' High barriers. The person who needs this most can\'t reach it yet.'}
              </p>
            </div>
          )}

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1.25rem' }}>
            <a href="/create" className="sdf-cta" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', width: '100%', boxSizing: 'border-box' }}>
              {isLoggedIn ? 'Back to Create Portal' : 'Start creating experiences'}
            </a>
            <button className="sdf-cta" onClick={handleShare} style={{ background: 'rgba(255,255,255,0.08)', color: 'white', boxShadow: 'none', border: '2px solid rgba(255,255,255,0.2)', width: '100%' }}>
              {copied ? 'Copied!' : 'Share my score'}
            </button>
            {!isLoggedIn && (
              <a href="/log-in" style={{ display: 'block', textAlign: 'center', fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'underline', marginTop: '0.25rem' }}>
                Create a free account to save your results
              </a>
            )}
          </div>

        </div>
      </div>
    )
  }

  return null
}
