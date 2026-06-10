/**
 * RemarkableFlow.jsx — /create/remarkable
 * "Blow Up Your Brand — Part 1: Readiness Diagnostic"
 *
 * 3-layer model: Distil → Prove → Ceiling
 * Category Pirates-aligned: Two Worlds first, Assumption, Remove, Compress
 * Data-enriched: Scope Map, DNA match, experience counts inform answers
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import { onRemarkableComplete } from '../lib/brain/autoPopulate'
import dnaData from '../../public/data/experienceCreatorDNA.json'
import './RemarkableFlow.css'

const STEPS = {
  INTRO: 'intro',
  TWO_WORLDS: 'two_worlds',
  ASSUMPTION: 'assumption',
  WHATS_LEFT: 'whats_left',
  COMPRESSION: 'compression',
  GENERATING: 'generating',
  SUMMARY: 'summary',
  PROOF: 'proof',
  CEILING: 'ceiling',
  READINESS: 'readiness',
}

function creatorSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
}

function lookupCreatorOneLiner(name) {
  const profile = dnaData.profiles?.find(p => p.name === name)
  return profile?.oneLiner || null
}

export default function RemarkableFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStepRaw] = useState(STEPS.INTRO)

  const setStep = (next) => {
    setStepRaw(next)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // User inputs — Layer 1 (Distillation)
  const [twoWorlds, setTwoWorlds] = useState('')
  const [assumption, setAssumption] = useState('')
  const [whatsLeft, setWhatsLeft] = useState('')
  const [compression, setCompression] = useState('')

  // User inputs — Layer 2 (Proof)
  const [proofCount, setProofCount] = useState('')
  const [proofEvidence, setProofEvidence] = useState('')
  const [previousExperience, setPreviousExperience] = useState('')

  // User inputs — Layer 3 (Ceiling)
  const [ceilingType, setCeilingType] = useState('')

  // Data from other flows
  const [skills, setSkills] = useState([])
  const [problems, setProblems] = useState([])
  const [scopeMapProblem, setScopeMapProblem] = useState('')
  const [matchedFounder, setMatchedFounder] = useState('')
  const [matchedOneLiner, setMatchedOneLiner] = useState('')
  const [experienceCount, setExperienceCount] = useState(0)
  const [existingAngle, setExistingAngle] = useState(null)
  const [loading, setLoading] = useState(true)

  // AI result
  const [aiResult, setAiResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [savedAngleId, setSavedAngleId] = useState(null)

  // Fetch all data sources
  useEffect(() => {
    if (!user) { setLoading(false); return }
    ;(async () => {
      try {
        const [
          { data: probData },
          { data: skillData },
          { data: scopeData },
          { data: dnaResult },
          { count: expCount },
          { data: angleData },
        ] = await Promise.all([
          supabase
            .from('nikigai_clusters')
            .select('cluster_label, is_favourite')
            .eq('user_id', user.id)
            .eq('cluster_type', 'problems'),
          supabase
            .from('nikigai_clusters')
            .select('cluster_label, items')
            .eq('user_id', user.id)
            .eq('cluster_type', 'skills'),
          supabase
            .from('scope_map_results')
            .select('stage, response_problem, response_audience')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('founder_dna_results')
            .select('matched_founder, archetype')
            .eq('user_id', user.id)
            .limit(1),
          supabase
            .from('experiences')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('remarkable_angles')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1),
        ])

        const sorted = (probData || []).sort((a, b) => (b.is_favourite ? 1 : 0) - (a.is_favourite ? 1 : 0))
        setProblems(sorted.map(p => p.cluster_label))
        setSkills(skillData?.map(s => s.cluster_label) || [])
        setScopeMapProblem(scopeData?.[0]?.response_problem || '')
        setExperienceCount(expCount || 0)

        // DNA match → look up oneLiner from JSON
        const founder = dnaResult?.[0]?.matched_founder || ''
        setMatchedFounder(founder)
        if (founder) setMatchedOneLiner(lookupCreatorOneLiner(founder) || '')

        // Pre-fill for returning users
        const angle = angleData?.[0]
        if (angle) {
          setExistingAngle(angle)
          if (angle.combination_insight) setTwoWorlds(angle.combination_insight)
          if (angle.wound_problem) setAssumption(angle.wound_problem)
        }
      } catch (err) {
        console.warn('RemarkableFlow data load failed:', err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  // Generate AI synthesis
  const generate = async () => {
    setStep(STEPS.GENERATING)
    setError(null)
    hapticLight()

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-remarkable-angle', {
        body: {
          wound_problem: `Assumption everyone follows: ${assumption}`,
          rule_identified: `Current assumption: ${assumption}. Remove it and what's left: ${whatsLeft}`,
          combination_insight: twoWorlds,
          extreme_action_plan: `One-sentence method: ${compression}`,
        },
      })
      if (fnError) throw fnError
      setAiResult(data)
      hapticSuccess()
      setStep(STEPS.SUMMARY)
    } catch (err) {
      console.error('Remarkable generation error:', err)
      setError('Something went wrong. Let\'s try again.')
      setStep(STEPS.COMPRESSION)
    }
  }

  // Save result — returns true on success, false on failure
  const save = async () => {
    if (!user || saving) return false
    setSaving(true)
    try {
      const { data: insertedRow, error: saveErr } = await supabase.from('remarkable_angles').insert({
        user_id: user.id,
        wound_problem: assumption,
        rule_identified: `Two worlds: ${twoWorlds} | Assumption: ${assumption} | Without it: ${whatsLeft}`,
        combination_insight: twoWorlds,
        extreme_action_plan: compression,
        ai_rule_statement: aiResult?.rule_statement || null,
        ai_remarkable_bio: aiResult?.remarkable_bio || null,
        ai_tribe_statement: aiResult?.tribe_statement || null,
      }).select('id').single()
      if (saveErr) throw saveErr
      if (insertedRow?.id) setSavedAngleId(insertedRow.id)
      // Auto-populate brain
      onRemarkableComplete(user.id, {
        ruleIdentified: `Two worlds: ${twoWorlds} | Assumption: ${assumption} | Without it: ${whatsLeft}`,
        combinationInsight: twoWorlds,
        extremeAction: compression,
        aiRuleStatement: aiResult?.rule_statement || null,
        aiTribeStatement: aiResult?.tribe_statement || null,
      })
      hapticSuccess()
      return true
    } catch (err) {
      console.error('Save error:', err)
      setError('Failed to save. Please try again.')
      return false
    } finally {
      setSaving(false)
    }
  }

  // Save readiness assessment (Layer 2 + 3)
  const saveReadiness = async () => {
    if (!user) return
    try {
      await supabase.from('blow_up_readiness').insert({
        user_id: user.id,
        proof_count: proofCount || 'not_yet',
        proof_evidence: proofEvidence || null,
        previous_experience: previousExperience || null,
        ceiling_type: ceilingType || 'not_yet',
        layer1_status: readiness.layer1,
        layer2_status: readiness.layer2,
        layer3_status: readiness.layer3,
        all_ready: readiness.allReady,
        matched_founder_used: matchedFounder || null,
        experience_count_at_time: experienceCount,
        remarkable_angle_id: savedAngleId || null,
      })
    } catch (err) {
      console.warn('Readiness save failed:', err.message)
    }
  }

  // Readiness computation
  const readiness = useMemo(() => {
    const layer1 = compression.trim().length > 10
    const layer2 = proofCount === '10_50' || proofCount === '50_plus'
    const layer2Amber = proofCount === '1_10'
    const layer3 = ceilingType === 'reach' || ceilingType === 'credibility'
    return {
      layer1: layer1 ? 'green' : 'amber',
      layer2: layer2 ? 'green' : layer2Amber ? 'amber' : 'red',
      layer3: layer3 ? 'green' : 'red',
      allReady: layer1 && layer2 && layer3,
    }
  }, [compression, proofCount, ceilingType])

  if (loading) {
    return (
      <div className="rmk">
        <div className="rmk-center">
          <div className="rmk-spinner" />
        </div>
      </div>
    )
  }

  // ── SCREEN 1: INTRO (3-Layer Model) ──
  if (step === STEPS.INTRO) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-intro">
            <div className="rmk-badge">Blow Up Your Brand</div>
            {existingAngle ? (
              <>
                <h1>Welcome back. Let's <span className="rmk-gold">sharpen</span> your angle.</h1>
                <p>Last time you identified your remarkable angle. Let's see if it's evolved.</p>
              </>
            ) : (
              <>
                <h1>What makes you <span className="rmk-gold">worth talking about</span>?</h1>
                <p>We studied 129 experience creators. Every one who sustained had 3 ingredients. Every one who peaked was missing at least one.</p>
              </>
            )}

            <div className="rmk-layers-preview">
              <div className="rmk-layer-pill">
                <span className="rmk-layer-num">1</span>
                <span>Distil your method</span>
              </div>
              <div className="rmk-layer-pill">
                <span className="rmk-layer-num">2</span>
                <span>Prove it works</span>
              </div>
              <div className="rmk-layer-pill">
                <span className="rmk-layer-num">3</span>
                <span>Find your ceiling</span>
              </div>
            </div>

            <button className="rmk-cta" onClick={() => { hapticLight(); setStep(STEPS.TWO_WORLDS) }}>
              {existingAngle ? 'Sharpen my angle' : 'Let\'s go'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 2: TWO WORLDS ──
  if (step === STEPS.TWO_WORLDS) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Distil · 1 of 4</div>
          <h2 className="rmk-heading">What <span className="rmk-gold">two worlds</span> do you live in?</h2>
          <p className="rmk-prompt">Every remarkable creator combines two domains nobody expected together.</p>

          {skills.length > 0 && (
            <div className="rmk-skills-hint">
              <div className="rmk-skills-label">Your Life Map</div>
              <div className="rmk-skills-tags">
                {skills.slice(0, 6).map((skill, i) => (
                  <span key={i} className="rmk-skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          )}

          <div className="rmk-example-card">
            Radha Agrawal combined nightlife + wellness. Phil Jackson combined Zen Buddhism + basketball. What's yours?
          </div>

          <textarea
            className="rmk-textarea"
            value={twoWorlds}
            onChange={e => setTwoWorlds(e.target.value)}
            placeholder="e.g. I combine VC analytical thinking with breathwork facilitation"
            rows={3}
            autoFocus
          />

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.INTRO)}>Back</button>
            <button
              className="rmk-cta"
              disabled={twoWorlds.trim().length < 10}
              onClick={() => { hapticLight(); setStep(STEPS.ASSUMPTION) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 3: ASSUMPTION ──
  if (step === STEPS.ASSUMPTION) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Distil · 2 of 4</div>
          <h2 className="rmk-heading">What does everyone assume is <span className="rmk-gold">required</span>?</h2>
          <p className="rmk-prompt">In your space, what rule does everyone follow that you think is wrong?</p>

          {scopeMapProblem && (
            <div className="rmk-context-card">
              You told us the problem is: "{scopeMapProblem}". What assumption caused that?
            </div>
          )}

          <textarea
            className="rmk-textarea"
            value={assumption}
            onChange={e => setAssumption(e.target.value)}
            placeholder="e.g. Everyone assumes healing must be serious, clinical, and expensive"
            rows={3}
            autoFocus
          />

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.TWO_WORLDS)}>Back</button>
            <button
              className="rmk-cta"
              disabled={assumption.trim().length < 10}
              onClick={() => { hapticLight(); setStep(STEPS.WHATS_LEFT) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 4: WHAT'S LEFT ──
  if (step === STEPS.WHATS_LEFT) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Distil · 3 of 4</div>
          <div className="rmk-context-card">{assumption}</div>
          <h2 className="rmk-heading">Remove that assumption. What's <span className="rmk-gold">left</span>?</h2>
          <p className="rmk-prompt">If that rule didn't exist, how would you solve this problem?</p>

          {problems.length > 0 && (
            <div className="rmk-skills-hint">
              <div className="rmk-skills-label">Problems you care about</div>
              <div className="rmk-skills-tags">
                {problems.slice(0, 4).map((prob, i) => (
                  <span key={i} className="rmk-skill-tag">{prob}</span>
                ))}
              </div>
            </div>
          )}

          <textarea
            className="rmk-textarea"
            value={whatsLeft}
            onChange={e => setWhatsLeft(e.target.value)}
            placeholder="e.g. Dancing with strangers at sunrise. Community. Play. No certification needed."
            rows={3}
            autoFocus
          />

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.ASSUMPTION)}>Back</button>
            <button
              className="rmk-cta"
              disabled={whatsLeft.trim().length < 10}
              onClick={() => { hapticLight(); setStep(STEPS.COMPRESSION) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 5: COMPRESSION GATE ──
  if (step === STEPS.COMPRESSION) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Distil · 4 of 4</div>
          <h2 className="rmk-heading">State your method in <span className="rmk-gold">one sentence</span>.</h2>
          <p className="rmk-prompt">If you can compress it, it's ready to travel. If you can't, it needs more reps.</p>

          {matchedOneLiner && (
            <div className="rmk-example-card">
              {matchedFounder}: "{matchedOneLiner}"
            </div>
          )}

          {!matchedOneLiner && (
            <div className="rmk-example-card">
              Ram Dass: "Be here now." Priya Parker: "How you gather matters more than why."
            </div>
          )}

          <textarea
            className="rmk-textarea"
            value={compression}
            onChange={e => setCompression(e.target.value)}
            placeholder="e.g. Healing should be fun, communal, and accessible"
            rows={2}
            autoFocus
          />

          {error && <div className="rmk-error">{error}</div>}

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.WHATS_LEFT)}>Back</button>
            <button
              className="rmk-cta"
              disabled={compression.trim().length < 5}
              onClick={generate}
            >
              Show me my angle
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 6: GENERATING ──
  if (step === STEPS.GENERATING) {
    return (
      <div className="rmk">
        <div className="rmk-center">
          <div className="rmk-spinner" />
          <p className="rmk-loading-text">Finding your remarkable angle...</p>
        </div>
      </div>
    )
  }

  // ── SCREEN 7: SUMMARY ──
  if (step === STEPS.SUMMARY && aiResult) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-badge">Your Remarkable Angle</div>

          <div className="rmk-output-section">
            <div className="rmk-output-card">
              <div className="rmk-output-label">Your rule break</div>
              <p className="rmk-output-text">{aiResult.rule_statement}</p>
            </div>

            <div className="rmk-output-card">
              <div className="rmk-output-label">Your remarkable bio</div>
              <p className="rmk-output-text">{aiResult.remarkable_bio}</p>
            </div>

            <div className="rmk-output-card rmk-output-tribe">
              <div className="rmk-output-label">Your tribe</div>
              <p className="rmk-output-text">{aiResult.tribe_statement}</p>
            </div>
          </div>

          <div className="rmk-output-card" style={{ marginBottom: '1.5rem' }}>
            <div className="rmk-output-label">Your one-liner</div>
            <p className="rmk-output-text" style={{ fontWeight: 700, fontSize: '1.1rem' }}>{compression}</p>
          </div>

          {error && <div className="rmk-error">{error}</div>}

          <p className="rmk-prompt" style={{ textAlign: 'center' }}>
            That's your angle. Now let's check if you're ready to deploy it.
          </p>

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.COMPRESSION)}>Back</button>
            <button
              className="rmk-cta"
              disabled={saving}
              onClick={async () => {
                const saved = await save()
                if (saved) {
                  hapticLight()
                  setStep(STEPS.PROOF)
                }
              }}
            >
              {saving ? 'Saving...' : 'Check my readiness'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 8: PROOF ──
  if (step === STEPS.PROOF) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Prove · 1 of 2</div>
          <h2 className="rmk-heading">Have you <span className="rmk-gold">run this</span>?</h2>
          <p className="rmk-prompt">How many people have experienced your method?</p>

          {experienceCount > 0 && (
            <div className="rmk-context-card">
              You've created {experienceCount} experience{experienceCount !== 1 ? 's' : ''} in the app. Include any work outside the app too.
            </div>
          )}

          <div className="rmk-problem-list">
            {[
              { key: 'not_yet', label: 'Not yet' },
              { key: '1_10', label: '1-10 people' },
              { key: '10_50', label: '10-50 people' },
              { key: '50_plus', label: '50+ people' },
            ].map(opt => (
              <button
                key={opt.key}
                className={`rmk-problem-btn ${proofCount === opt.key ? 'rmk-problem-selected' : ''}`}
                onClick={() => { hapticLight(); setProofCount(opt.key) }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {proofCount && proofCount !== 'not_yet' && (
            <>
              <p className="rmk-prompt" style={{ marginTop: '0.5rem' }}>What happened to them? What changed?</p>
              <textarea
                className="rmk-textarea"
                value={proofEvidence}
                onChange={e => setProofEvidence(e.target.value)}
                placeholder="e.g. People said they felt lighter. Three came back every week."
                rows={3}
              />
            </>
          )}

          <p className="rmk-prompt" style={{ marginTop: '1rem' }}>Have you done something like this before, even in a different context?</p>
          <textarea
            className="rmk-textarea"
            value={previousExperience}
            onChange={e => setPreviousExperience(e.target.value)}
            placeholder="e.g. I ran team workshops at my corporate job for 3 years"
            rows={2}
          />

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.SUMMARY)}>Back</button>
            <button
              className="rmk-cta"
              disabled={!proofCount}
              onClick={() => { hapticLight(); setStep(STEPS.CEILING) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 9: CEILING ──
  if (step === STEPS.CEILING) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Ceiling · 2 of 2</div>
          <h2 className="rmk-heading">Where are you <span className="rmk-gold">stuck</span>?</h2>
          <p className="rmk-prompt">Which sounds most like where you are right now?</p>

          <div className="rmk-problem-list">
            <button
              className={`rmk-problem-btn ${ceilingType === 'reach' ? 'rmk-problem-selected' : ''}`}
              onClick={() => { hapticLight(); setCeilingType('reach') }}
            >
              My method works. People love it. But I can only reach the people in my room. It's relevant to way more.
            </button>
            <button
              className={`rmk-problem-btn ${ceilingType === 'credibility' ? 'rmk-problem-selected' : ''}`}
              onClick={() => { hapticLight(); setCeilingType('credibility') }}
            >
              My method works. But people who haven't experienced it don't believe me yet. I need proof that scales.
            </button>
            <button
              className={`rmk-problem-btn ${ceilingType === 'not_yet' ? 'rmk-problem-selected' : ''}`}
              onClick={() => { hapticLight(); setCeilingType('not_yet') }}
            >
              I'm still filling the room I'm in. My format isn't the bottleneck yet.
            </button>
          </div>

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.PROOF)}>Back</button>
            <button
              className="rmk-cta"
              disabled={!ceilingType}
              onClick={() => { hapticLight(); setStep(STEPS.READINESS) }}
            >
              Show my readiness
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 10: READINESS MAP ──
  if (step === STEPS.READINESS) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-badge">Your Readiness</div>

          <div className="rmk-readiness-map">
            <div className={`rmk-readiness-layer rmk-readiness-${readiness.layer1}`}>
              <div className="rmk-readiness-dot" />
              <div>
                <div className="rmk-readiness-label">Distilled</div>
                <div className="rmk-readiness-detail">
                  {readiness.layer1 === 'green'
                    ? `"${compression}"`
                    : 'Your method needs more compression.'}
                </div>
              </div>
            </div>

            <div className={`rmk-readiness-layer rmk-readiness-${readiness.layer2}`}>
              <div className="rmk-readiness-dot" />
              <div>
                <div className="rmk-readiness-label">Proven</div>
                <div className="rmk-readiness-detail">
                  {readiness.layer2 === 'green'
                    ? `${proofCount === '50_plus' ? '50+' : '10-50'} people have experienced it.`
                    : readiness.layer2 === 'amber'
                      ? '1-10 people. Keep going. Run the 3% chain after every experience.'
                      : 'No proof yet. Run 5 experiences. Capture one 3% improvement after each.'}
                </div>
              </div>
            </div>

            <div className={`rmk-readiness-layer rmk-readiness-${readiness.layer3}`}>
              <div className="rmk-readiness-dot" />
              <div>
                <div className="rmk-readiness-label">Ceiling</div>
                <div className="rmk-readiness-detail">
                  {ceilingType === 'reach'
                    ? 'You\'re hitting a reach ceiling. Your method is ready for a format change.'
                    : ceilingType === 'credibility'
                      ? 'You\'re hitting a credibility ceiling. You need proof that scales.'
                      : 'Keep filling the room you\'re in. Run the 3% chain. The ceiling will come.'}
                </div>
              </div>
            </div>
          </div>

          {matchedFounder && (
            <div className="rmk-output-card" style={{ marginTop: '1.25rem' }}>
              <div className="rmk-output-label">Your DNA match</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <img
                  className="rmk-edu-avatar"
                  src={`/images/creators/${creatorSlug(matchedFounder)}.png`}
                  alt={matchedFounder}
                  onError={e => { e.target.style.display = 'none' }}
                />
                <span className="rmk-edu-name">{matchedFounder}</span>
              </div>
              {matchedOneLiner && (
                <p className="rmk-output-text" style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>
                  "{matchedOneLiner}"
                </p>
              )}
            </div>
          )}

          {readiness.allReady ? (
            <div className="rmk-ready-card">
              <p style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 0.5rem' }}>You're ready.</p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem' }}>
                Your method is distilled, proven, and hitting a ceiling. Time to change the format.
              </p>
            </div>
          ) : (
            <div className="rmk-notready-card">
              <p style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 0.5rem' }}>Keep building.</p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem' }}>
                After every experience, ask: "What's the one thing I'd improve by 3%?" That's the chain that turns good into undeniable.
              </p>
            </div>
          )}

          <button
            className="rmk-cta"
            style={{ width: '100%', marginTop: '1.25rem' }}
            onClick={async () => {
              await saveReadiness()
              navigate('/create')
            }}
          >
            Back to Creator Portal
          </button>
        </div>
      </div>
    )
  }

  return null
}
