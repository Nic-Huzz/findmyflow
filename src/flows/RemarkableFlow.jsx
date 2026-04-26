/**
 * RemarkableFlow.jsx — /create/remarkable
 * "How to Blow Up Your Personal Brand"
 * Section 1: Education — Trust + Attention + 5 triggers with creator proof
 * Section 2: User diagnostic — Rule Break, Unexpected Combination, Extreme Action
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import remarkableData from '../../public/data/experienceCreatorRemarkableAnalysis.json'
import growthData from '../../public/data/experienceCreatorGrowthStrategies.json'
import './RemarkableFlow.css'

const STEPS = {
  INTRO: 'intro',
  TRUST: 'trust',
  ATTENTION: 'attention',
  TRIGGERS: 'triggers',
  RULE_BREAK: 'rule_break',
  COMBINATION: 'combination',
  EXTREME_ACTION: 'extreme_action',
  GENERATING: 'generating',
  SUMMARY: 'summary',
}

const TRIGGER_LABELS = {
  rule_broken: { name: 'Rule Broken', emoji: '🔥', desc: 'They challenged a norm everyone accepted' },
  unexpected_combination: { name: 'Unexpected Combination', emoji: '🔀', desc: 'They combined two things nobody expected together' },
  extreme_action: { name: 'Extreme Action', emoji: '⚡', desc: 'They did something that made people say "wait, what?"' },
  stupid_simplicity: { name: 'Stupid Simplicity', emoji: '💎', desc: 'They found a truth so simple it felt insulting' },
  impossible_result: { name: 'Impossible Result', emoji: '🏆', desc: 'They produced evidence that defied belief' },
}

function creatorSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
}

export default function RemarkableFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(STEPS.INTRO)

  // User inputs
  const [woundProblem, setWoundProblem] = useState('')
  const [ruleIdentified, setRuleIdentified] = useState('')
  const [combinationInsight, setCombinationInsight] = useState('')
  const [extremeAction, setExtremeAction] = useState('')

  // Life Map data
  const [problems, setProblems] = useState([])
  const [skills, setSkills] = useState([])
  const [selectedCreatorNames, setSelectedCreatorNames] = useState([])
  const [loading, setLoading] = useState(true)

  // AI result
  const [aiResult, setAiResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Fetch Life Map data + selected creators
  useEffect(() => {
    if (!user) { setLoading(false); return }
    ;(async () => {
      const [{ data: probData }, { data: skillData }, { data: selData }] = await Promise.all([
        supabase
          .from('nikigai_clusters')
          .select('cluster_label')
          .eq('user_id', user.id)
          .eq('cluster_type', 'problems'),
        supabase
          .from('nikigai_clusters')
          .select('cluster_label, items')
          .eq('user_id', user.id)
          .eq('cluster_type', 'skills'),
        supabase
          .from('experience_creator_selections')
          .select('selected_creators')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1),
      ])
      setProblems(probData?.map(p => p.cluster_label) || [])
      setSkills(skillData?.map(s => s.cluster_label) || [])
      setSelectedCreatorNames(selData?.[0]?.selected_creators || [])
      setLoading(false)
    })()
  }, [user])

  // Build education data from selected creators
  const educationData = useMemo(() => {
    if (!selectedCreatorNames.length) return null

    // Trust: how long each creator did the work
    const trustEntries = selectedCreatorNames.map(name => {
      const gs = growthData.creators?.[name]
      if (!gs) return null
      return { name, earlyGrowth: gs.early_growth, scalingMove: gs.scaling_move }
    }).filter(Boolean)

    // Triggers: 5 triggers per selected creator
    const triggerEntries = selectedCreatorNames.map(name => {
      const rm = remarkableData.creators?.[name]
      if (!rm) return null
      const triggers = {}
      for (const key of ['rule_broken', 'unexpected_combination', 'extreme_action', 'stupid_simplicity', 'impossible_result']) {
        if (rm[key]?.present === 'yes') {
          triggers[key] = rm[key].evidence
        }
      }
      return { name, triggers, headline: rm.remarkable_headline || '' }
    }).filter(Boolean)

    return { trustEntries, triggerEntries }
  }, [selectedCreatorNames])

  // Generate AI synthesis
  const generate = async () => {
    setStep(STEPS.GENERATING)
    setError(null)
    hapticLight()

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-remarkable-angle', {
        body: {
          wound_problem: woundProblem,
          rule_identified: ruleIdentified,
          combination_insight: combinationInsight,
          extreme_action_plan: extremeAction,
        },
      })
      if (fnError) throw fnError
      setAiResult(data)
      hapticSuccess()
      setStep(STEPS.SUMMARY)
    } catch (err) {
      console.error('Remarkable generation error:', err)
      setError('Something went wrong. Let\'s try again.')
      setStep(STEPS.EXTREME_ACTION)
    }
  }

  // Save result
  const save = async () => {
    if (!user || saving) return
    setSaving(true)
    try {
      await supabase.from('remarkable_angles').insert({
        user_id: user.id,
        wound_problem: woundProblem,
        rule_identified: ruleIdentified,
        combination_insight: combinationInsight,
        extreme_action_plan: extremeAction,
        ai_rule_statement: aiResult?.rule_statement || null,
        ai_remarkable_bio: aiResult?.remarkable_bio || null,
        ai_tribe_statement: aiResult?.tribe_statement || null,
      })
      hapticSuccess()
      navigate('/create')
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rmk">
        <div className="rmk-center">
          <div className="rmk-spinner" />
        </div>
      </div>
    )
  }

  // ── INTRO ──
  if (step === STEPS.INTRO) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-intro">
            <div className="rmk-badge">Your Remarkable Angle</div>
            <h1>What makes you <span className="rmk-gold">impossible to ignore</span>?</h1>
            <p>The people you admire didn't become known by being better. They became known by breaking a rule nobody questioned.</p>
            <p className="rmk-intro-sub">You already have 3 of the 5 ingredients. Let's find them.</p>
            <button className="rmk-cta" onClick={() => { hapticLight(); setStep(educationData ? STEPS.TRUST : STEPS.RULE_BREAK) }}>
              Let's go
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── EDUCATION: TRUST ──
  if (step === STEPS.TRUST) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-badge">The Secret</div>
          <h2 className="rmk-heading">Trust takes <span className="rmk-gold">time</span></h2>
          <p className="rmk-prompt">Every person you picked spent years doing the work before anyone noticed. Repetition builds trust. Results build credibility. There are no shortcuts.</p>

          {educationData?.trustEntries?.length > 0 && (
            <div className="rmk-edu-cards">
              {educationData.trustEntries.map(entry => (
                <div key={entry.name} className="rmk-edu-card">
                  <div className="rmk-edu-card-top">
                    <img className="rmk-edu-avatar" src={`/images/creators/${creatorSlug(entry.name)}.png`} alt={entry.name} onError={e => { e.target.style.display = 'none' }} />
                    <span className="rmk-edu-name">{entry.name}</span>
                  </div>
                  <div className="rmk-edu-text">{entry.earlyGrowth}</div>
                </div>
              ))}
            </div>
          )}

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.INTRO)}>Back</button>
            <button className="rmk-cta" onClick={() => { hapticLight(); setStep(STEPS.ATTENTION) }}>
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── EDUCATION: ATTENTION ──
  if (step === STEPS.ATTENTION) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-badge">The Secret</div>
          <h2 className="rmk-heading">Attention comes from being <span className="rmk-gold">remarkable</span></h2>
          <p className="rmk-prompt">Word of mouth is the best marketing in the world. What creates word of mouth? Being remarkable. Literally: worth re-marking about.</p>
          <p className="rmk-prompt">When someone hears about you, would they tell a friend? If not, you're not remarkable yet. If yes, you don't need a marketing budget.</p>
          <p className="rmk-prompt" style={{ color: 'rgba(233,162,59,0.8)', fontWeight: 600 }}>Trust gets you believed. Remarkability gets you noticed. You need both.</p>

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.TRUST)}>Back</button>
            <button className="rmk-cta" onClick={() => { hapticLight(); setStep(STEPS.TRIGGERS) }}>
              So what makes someone remarkable?
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── EDUCATION: TRIGGERS ──
  if (step === STEPS.TRIGGERS) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-badge">The 5 Triggers</div>
          <h2 className="rmk-heading">Every person you picked hit at least <span className="rmk-gold">4 of these 5</span></h2>

          {educationData?.triggerEntries?.length > 0 && (
            <div className="rmk-trigger-proof">
              {educationData.triggerEntries.slice(0, 3).map(entry => (
                <div key={entry.name} className="rmk-trigger-creator">
                  <div className="rmk-trigger-creator-top">
                    <img className="rmk-edu-avatar" src={`/images/creators/${creatorSlug(entry.name)}.png`} alt={entry.name} onError={e => { e.target.style.display = 'none' }} />
                    <span className="rmk-edu-name">{entry.name}</span>
                  </div>
                  <div className="rmk-trigger-list">
                    {Object.entries(TRIGGER_LABELS).map(([key, label]) => {
                      const evidence = entry.triggers[key]
                      return (
                        <div key={key} className={`rmk-trigger-row ${evidence ? 'rmk-trigger-hit' : 'rmk-trigger-miss'}`}>
                          <span className="rmk-trigger-icon">{evidence ? '✓' : '◯'}</span>
                          <div>
                            <div className="rmk-trigger-name">{label.emoji} {label.name}</div>
                            {evidence && <div className="rmk-trigger-evidence">{evidence}</div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="rmk-prompt" style={{ marginTop: '1.5rem', textAlign: 'center' }}>Now let's find yours.</p>

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.ATTENTION)}>Back</button>
            <button className="rmk-cta" onClick={() => { hapticLight(); setStep(STEPS.RULE_BREAK) }}>
              Find my remarkable angle
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 1: RULE BREAK ──
  if (step === STEPS.RULE_BREAK) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">1 of 3</div>
          <h2 className="rmk-heading">What rule are you here to break?</h2>
          <p className="rmk-prompt">First, pick the problem that feels most personal. The one that still makes you angry when you think about it.</p>

          {problems.length > 0 && (
            <div className="rmk-problem-list">
              {problems.map((prob, i) => (
                <button
                  key={i}
                  className={`rmk-problem-btn ${woundProblem === prob ? 'rmk-problem-selected' : ''}`}
                  onClick={() => { hapticLight(); setWoundProblem(prob) }}
                >
                  {prob}
                </button>
              ))}
            </div>
          )}

          {!problems.length && (
            <textarea
              className="rmk-textarea"
              value={woundProblem}
              onChange={e => setWoundProblem(e.target.value)}
              placeholder="What problem in the world makes you angriest?"
              rows={3}
            />
          )}

          {woundProblem && (
            <>
              <p className="rmk-prompt" style={{ marginTop: '1.5rem' }}>Now name the rule. What standard or norm caused this problem?</p>
              <textarea
                className="rmk-textarea"
                value={ruleIdentified}
                onChange={e => setRuleIdentified(e.target.value)}
                placeholder="e.g. Healing is only for people who can afford therapists"
                rows={2}
                autoFocus
              />
            </>
          )}

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.TRIGGERS)}>Back</button>
            <button
              className="rmk-cta"
              disabled={!woundProblem || ruleIdentified.trim().length < 10}
              onClick={() => { hapticLight(); setStep(STEPS.COMBINATION) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 2: UNEXPECTED COMBINATION ──
  if (step === STEPS.COMBINATION) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">2 of 3</div>
          <h2 className="rmk-heading">What's your unexpected combination?</h2>
          <p className="rmk-prompt">What do you bring from OUTSIDE your field that nobody inside it has tried?</p>

          {skills.length > 0 && (
            <div className="rmk-skills-hint">
              <div className="rmk-skills-label">Your skills from your Life Map:</div>
              <div className="rmk-skills-tags">
                {skills.slice(0, 8).map((skill, i) => (
                  <span key={i} className="rmk-skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          )}

          <textarea
            className="rmk-textarea"
            value={combinationInsight}
            onChange={e => setCombinationInsight(e.target.value)}
            placeholder="e.g. I combine VC analytical thinking with breathwork facilitation and comedy performance"
            rows={3}
            autoFocus
          />

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.RULE_BREAK)}>Back</button>
            <button
              className="rmk-cta"
              disabled={combinationInsight.trim().length < 10}
              onClick={() => { hapticLight(); setStep(STEPS.EXTREME_ACTION) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 3: EXTREME ACTION ──
  if (step === STEPS.EXTREME_ACTION) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">3 of 3</div>
          <h2 className="rmk-heading">What's your extreme action?</h2>
          <p className="rmk-prompt">What could you do THIS MONTH that would make people say "wait, what?" Not bigger. Weirder. Bolder.</p>

          <textarea
            className="rmk-textarea"
            value={extremeAction}
            onChange={e => setExtremeAction(e.target.value)}
            placeholder="e.g. Host a sober dance party at sunrise for 50 strangers"
            rows={3}
            autoFocus
          />

          {error && <div className="rmk-error">{error}</div>}

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.COMBINATION)}>Back</button>
            <button
              className="rmk-cta"
              disabled={extremeAction.trim().length < 10}
              onClick={generate}
            >
              Show me my angle
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── GENERATING ──
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

  // ── SUMMARY ──
  if (step === STEPS.SUMMARY && aiResult) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-badge">Your Remarkable Angle</div>

          {/* The 5 triggers checklist */}
          <div className="rmk-checklist">
            <div className="rmk-check-item rmk-check-done">
              <span className="rmk-check-icon">✓</span>
              <div>
                <div className="rmk-check-label">Rule Broken</div>
                <div className="rmk-check-value">{aiResult.rule_statement}</div>
              </div>
            </div>

            <div className="rmk-check-item rmk-check-done">
              <span className="rmk-check-icon">✓</span>
              <div>
                <div className="rmk-check-label">Unexpected Combination</div>
                <div className="rmk-check-value">{combinationInsight}</div>
              </div>
            </div>

            <div className="rmk-check-item rmk-check-done">
              <span className="rmk-check-icon">✓</span>
              <div>
                <div className="rmk-check-label">Extreme Action</div>
                <div className="rmk-check-value">{extremeAction}</div>
              </div>
            </div>

            <div className="rmk-check-item rmk-check-pending">
              <span className="rmk-check-icon">◯</span>
              <div>
                <div className="rmk-check-label">Stupid Simplicity</div>
                <div className="rmk-check-value rmk-check-future">Will emerge from doing the work</div>
              </div>
            </div>

            <div className="rmk-check-item rmk-check-pending">
              <span className="rmk-check-icon">◯</span>
              <div>
                <div className="rmk-check-label">Impossible Result</div>
                <div className="rmk-check-value rmk-check-future">Will emerge from evidence</div>
              </div>
            </div>
          </div>

          {/* AI-generated outputs */}
          <div className="rmk-output-section">
            <div className="rmk-output-card">
              <div className="rmk-output-label">Your remarkable bio</div>
              <p className="rmk-output-text">{aiResult.remarkable_bio}</p>
            </div>

            <div className="rmk-output-card rmk-output-tribe">
              <div className="rmk-output-label">Your tribe</div>
              <p className="rmk-output-text">{aiResult.tribe_statement}</p>
            </div>
          </div>

          <button className="rmk-cta" onClick={save} disabled={saving} style={{ width: '100%' }}>
            {saving ? 'Saving...' : 'Save my remarkable angle'}
          </button>
        </div>
      </div>
    )
  }

  return null
}
