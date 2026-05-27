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
  RULE_PICK: 'rule_pick',
  RULE_CURRENT: 'rule_current',
  RULE_WRONG: 'rule_wrong',
  RULE_YOURS: 'rule_yours',
  TAGLINE: 'tagline',
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
  const [currentSolution, setCurrentSolution] = useState('')
  const [whatsWrong, setWhatsWrong] = useState('')
  const [yourSolution, setYourSolution] = useState('')
  const [tagline, setTagline] = useState('')
  const [aiTaglineSuggestions, setAiTaglineSuggestions] = useState([])
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
          .select('cluster_label, is_favourite')
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
      const sorted = (probData || []).sort((a, b) => (b.is_favourite ? 1 : 0) - (a.is_favourite ? 1 : 0))
      setProblems(sorted.map(p => p.cluster_label))
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
          rule_identified: `Current solution: ${currentSolution}. What's wrong: ${whatsWrong}. My solution: ${yourSolution}`,
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
        rule_identified: `Current: ${currentSolution} | Wrong: ${whatsWrong} | Mine: ${yourSolution}`,
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

  // ── SLIDE 1: INTRO ──
  if (step === STEPS.INTRO) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-intro">
            <div className="rmk-badge">How They Blew Up</div>
            <h1>How did these people become <span className="rmk-gold">known globally</span>?</h1>
            <p>There are two ingredients to becoming known: Trust and Attention.</p>
            <p className="rmk-intro-sub">Let us show you how the people you picked nailed both.</p>
            <button className="rmk-cta" onClick={() => { hapticLight(); setStep(educationData ? STEPS.TRUST : STEPS.RULE_PICK) }}>
              Show me
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SLIDE 2: TRUST ──
  if (step === STEPS.TRUST) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-badge">Ingredient 1</div>
          <h2 className="rmk-heading"><span className="rmk-gold">Trust</span></h2>
          <p className="rmk-prompt">Each of your picks built trust through repetition. Showing up week after week after week for years. And results. Becoming so good at what they do that their results became undeniable.</p>

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
              What about attention?
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SLIDE 3: ATTENTION ──
  if (step === STEPS.ATTENTION) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen rmk-centered-screen">
          <div className="rmk-badge">Ingredient 2</div>
          <h2 className="rmk-heading"><span className="rmk-gold">Attention</span></h2>
          <p className="rmk-prompt-lg">They didn't get attention by shouting louder. They got it by being <strong>remarkable</strong>.</p>
          <p className="rmk-prompt-lg">Remarkable literally means worth <strong>re-marking</strong> on.</p>
          <p className="rmk-prompt-lg">Something so interesting that people can't help but tell their friends.</p>
          <p className="rmk-prompt-lg">Word of mouth is the most powerful marketing in the world. And you can't buy it. You have to earn it.</p>

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.TRUST)}>Back</button>
            <button className="rmk-cta" onClick={() => { hapticLight(); setStep(STEPS.TRIGGERS) }}>
              So how do I become remarkable?
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
          <div className="rmk-badge">The Formula</div>
          <h2 className="rmk-heading">We've found a <span className="rmk-gold">formula</span> to help what you do be seen as remarkable</h2>
          <p className="rmk-prompt">We analysed 57 experience creators. Over 90% hit all 5 of these triggers. Here's how your picks did it.</p>

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
            <button className="rmk-cta" onClick={() => { hapticLight(); setStep(STEPS.RULE_PICK) }}>
              Find my remarkable angle
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 1a: PICK THE PROBLEM ──
  if (step === STEPS.RULE_PICK) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">1 of 3</div>
          <h2 className="rmk-heading">Pick the problem that makes you <span className="rmk-gold">angriest</span></h2>
          <p className="rmk-prompt">The one that still fires you up when you think about it.</p>

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

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(educationData ? STEPS.TRIGGERS : STEPS.INTRO)}>Back</button>
            <button
              className="rmk-cta"
              disabled={!woundProblem}
              onClick={() => { hapticLight(); setStep(STEPS.RULE_CURRENT) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 1b: HOW DOES THE WORLD CURRENTLY SOLVE THIS? ──
  if (step === STEPS.RULE_CURRENT) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">1 of 3</div>
          <div className="rmk-context-card">{woundProblem}</div>
          <h2 className="rmk-heading">How does the world currently <span className="rmk-gold">solve</span> this?</h2>
          <textarea
            className="rmk-textarea"
            value={currentSolution}
            onChange={e => setCurrentSolution(e.target.value)}
            placeholder="e.g. Therapy. One-on-one. Private. Serious. Expensive."
            rows={3}
            autoFocus
          />
          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.RULE_PICK)}>Back</button>
            <button
              className="rmk-cta"
              disabled={currentSolution.trim().length < 5}
              onClick={() => { hapticLight(); setStep(STEPS.RULE_WRONG) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 1c: WHAT'S WRONG WITH THAT? ──
  if (step === STEPS.RULE_WRONG) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">1 of 3</div>
          <div className="rmk-context-card">{currentSolution}</div>
          <h2 className="rmk-heading">What's <span className="rmk-gold">wrong</span> with that?</h2>
          <textarea
            className="rmk-textarea"
            value={whatsWrong}
            onChange={e => setWhatsWrong(e.target.value)}
            placeholder="e.g. It's isolating. People got wounded in groups but heal alone. And most people can't afford it."
            rows={3}
            autoFocus
          />
          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.RULE_CURRENT)}>Back</button>
            <button
              className="rmk-cta"
              disabled={whatsWrong.trim().length < 5}
              onClick={() => { hapticLight(); setStep(STEPS.RULE_YOURS) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 1d: HOW DO YOU SOLVE IT? ──
  if (step === STEPS.RULE_YOURS) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">1 of 3</div>
          <div className="rmk-context-card">{whatsWrong}</div>
          <h2 className="rmk-heading">How do <span className="rmk-gold">you</span> solve it?</h2>
          <textarea
            className="rmk-textarea"
            value={yourSolution}
            onChange={e => setYourSolution(e.target.value)}
            placeholder="e.g. Dancing with strangers at sunrise. Community. Play. Fun."
            rows={3}
            autoFocus
          />
          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.RULE_WRONG)}>Back</button>
            <button
              className="rmk-cta"
              disabled={yourSolution.trim().length < 5}
              onClick={() => {
                hapticLight()
                setStep(STEPS.COMBINATION)
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 1e: YOUR TAGLINE ──
  if (step === STEPS.TAGLINE) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">1 of 3</div>
          <h2 className="rmk-heading">What's your <span className="rmk-gold">tagline</span>?</h2>
          <p className="rmk-prompt">Distill your rule break into 2-4 words. This is what goes on your bio, your events, your brand.</p>

          {aiTaglineSuggestions.length > 0 && (
            <div className="rmk-tagline-suggestions">
              <div className="rmk-tagline-label">AI suggestions (tap to use):</div>
              {aiTaglineSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  className={`rmk-tagline-btn ${tagline === suggestion ? 'rmk-tagline-selected' : ''}`}
                  onClick={() => { hapticLight(); setTagline(suggestion) }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <textarea
            className="rmk-textarea"
            value={tagline}
            onChange={e => setTagline(e.target.value)}
            placeholder="e.g. Healing but Fun"
            rows={2}
          />

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.RULE_YOURS)}>Back</button>
            <button
              className="rmk-cta"
              disabled={tagline.trim().length < 2}
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
              <div className="rmk-skills-label">Your play-skills:</div>
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
            <button className="rmk-back" onClick={() => setStep(STEPS.RULE_YOURS)}>Back</button>
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
