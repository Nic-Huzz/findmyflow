/**
 * RemarkableFlow.jsx — /create/remarkable
 * "Blow Up Your Brand — Part 1: Readiness Diagnostic"
 *
 * 7-step distillation: Problem → Assumption → Two Worlds → Different → Experience → Compress → Score
 * Remarkability Score: Uniqueness x Shareability x Simplicity (gates AI generation)
 * Data-enriched: Scope Map, DNA match, Life Map inform answers
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import { onRemarkableComplete } from '../lib/brain/autoPopulate'
import dnaData from '../../public/data/experienceCreatorDNA.json'
import './RemarkableFlow.css'

const STEPS = {
  INTRO: 'intro',
  PROJECTS: 'projects',
  PROBLEM: 'problem',
  ASSUMPTION: 'assumption',
  TWO_WORLDS: 'two_worlds',
  DIFFERENT: 'different',
  EXPERIENCE: 'experience',
  COMPRESSION: 'compression',
  SCORE: 'score',
  GENERATING: 'generating',
  REVIEW_RULE: 'review_rule',
  SUMMARY: 'summary',
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

  // User inputs — Screen 0 (Projects)
  const [projectItems, setProjectItems] = useState([''])
  const [projectType, setProjectType] = useState('') // 'one_thing' | 'separate'
  const [selectedItems, setSelectedItems] = useState([])
  const [projectName, setProjectName] = useState('')

  // User inputs — Distillation
  const [problem, setProblem] = useState('')
  const [assumption, setAssumption] = useState('')
  const [twoWorlds, setTwoWorlds] = useState('')
  const [different, setDifferent] = useState('')
  const [experience, setExperience] = useState('')
  const [compression, setCompression] = useState('')

  // User inputs — Remarkability Score
  const [scoreUnique, setScoreUnique] = useState(0)
  const [scoreShare, setScoreShare] = useState(0)
  const [scoreSimple, setScoreSimple] = useState(0)

  // Data from other flows
  const [skills, setSkills] = useState([])
  const [problems, setProblems] = useState([])
  const [scopeMapProblem, setScopeMapProblem] = useState('')
  const [matchedFounder, setMatchedFounder] = useState('')
  const [matchedOneLiner, setMatchedOneLiner] = useState('')
  const [existingAngle, setExistingAngle] = useState(null)
  const [loading, setLoading] = useState(true)

  // AI result
  const [aiResult, setAiResult] = useState(null)
  const [editedRuleBreak, setEditedRuleBreak] = useState('')
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
            .from('remarkable_angles')
            .select('id, wound_problem, assumption, rule_identified, combination_insight, different, experience, extreme_action_plan, project_name, score_unique, score_share, score_simple, ai_rule_statement, ai_remarkable_bio')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1),
        ])

        const sorted = (probData || []).sort((a, b) => (b.is_favourite ? 1 : 0) - (a.is_favourite ? 1 : 0))
        setProblems(sorted.map(p => p.cluster_label))
        setSkills(skillData?.map(s => s.cluster_label) || [])
        setScopeMapProblem(scopeData?.[0]?.response_problem || '')

        // DNA match → look up oneLiner from JSON
        const founder = dnaResult?.[0]?.matched_founder || ''
        setMatchedFounder(founder)
        if (founder) setMatchedOneLiner(lookupCreatorOneLiner(founder) || '')

        // Pre-fill for returning users
        const angle = angleData?.[0]
        if (angle) {
          setExistingAngle(angle)
          if (angle.id) setSavedAngleId(angle.id)
          if (angle.wound_problem) setProblem(angle.wound_problem)
          if (angle.assumption) setAssumption(angle.assumption)
          if (angle.combination_insight) setTwoWorlds(angle.combination_insight)
          if (angle.different) setDifferent(angle.different)
          if (angle.experience) setExperience(angle.experience)
          if (angle.extreme_action_plan) setCompression(angle.extreme_action_plan)
          if (angle.project_name) setProjectName(angle.project_name)
          if (angle.score_unique) setScoreUnique(angle.score_unique)
          if (angle.score_share) setScoreShare(angle.score_share)
          if (angle.score_simple) setScoreSimple(angle.score_simple)
          // Legacy fallback: parse rule_identified if new columns are empty
          if (!angle.assumption && angle.rule_identified?.includes('Assumption: ')) {
            const parts = angle.rule_identified.split(' | ')
            parts.forEach(part => {
              if (part.startsWith('Project: ') && !angle.project_name) setProjectName(part.replace('Project: ', ''))
              if (part.startsWith('Assumption: ') && !angle.assumption) setAssumption(part.replace('Assumption: ', ''))
              if (part.startsWith('Different: ') && !angle.different) setDifferent(part.replace('Different: ', ''))
              if (part.startsWith('Experience: ') && !angle.experience) setExperience(part.replace('Experience: ', ''))
              if (part.startsWith('One-liner: ') && !angle.extreme_action_plan) setCompression(part.replace('One-liner: ', ''))
            })
          }
        }
      } catch (err) {
        console.warn('RemarkableFlow data load failed:', err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  // Auto-save when step changes (after render with latest state)
  useEffect(() => {
    if (step !== STEPS.INTRO && step !== STEPS.PROJECTS && step !== STEPS.SCORE && step !== STEPS.GENERATING && step !== STEPS.SUMMARY && user) {
      autoSave()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // Auto-save progress after each screen (silent, non-blocking)
  // Only saves fields that have values — never blanks existing data
  const autoSave = () => {
    if (!user) return
    const ruleId = `Project: ${projectName} | Problem: ${problem} | Assumption: ${assumption} | Two worlds: ${twoWorlds} | Different: ${different} | Experience: ${experience} | One-liner: ${compression} | Score: ${scoreUnique}x${scoreShare}x${scoreSimple}=${scoreUnique * scoreShare * scoreSimple}`

    const fields = { rule_identified: ruleId }
    if (problem) fields.wound_problem = problem
    if (assumption) fields.assumption = assumption
    if (twoWorlds) fields.combination_insight = twoWorlds
    if (different) fields.different = different
    if (experience) fields.experience = experience
    if (compression) fields.extreme_action_plan = compression
    if (projectName) fields.project_name = projectName
    if (scoreUnique) fields.score_unique = scoreUnique
    if (scoreShare) fields.score_share = scoreShare
    if (scoreSimple) fields.score_simple = scoreSimple

    if (savedAngleId) {
      supabase.from('remarkable_angles').update(fields).eq('id', savedAngleId)
        .then(({ error }) => { if (error) console.error('Auto-save update failed:', error.message) })
    } else {
      supabase.from('remarkable_angles').insert({ ...fields, user_id: user.id }).select('id').single()
        .then(({ data: row, error }) => {
          if (error) console.error('Auto-save insert failed:', error.message)
          else if (row?.id) setSavedAngleId(row.id)
        })
    }
  }

  // Generate AI extractions from user's answers
  const generate = async () => {
    setStep(STEPS.GENERATING)
    setError(null)
    hapticLight()

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-remarkable-angle', {
        body: {
          wound_problem: problem,
          rule_identified: assumption,
          combination_insight: twoWorlds,
          extreme_action_plan: `${different}. The experience: ${experience}. User's one-liner: ${compression}`,
          user_name: projectName,
        },
      })
      if (fnError) throw fnError
      setAiResult(data)
      setEditedRuleBreak(data?.rule_statement || '')
      hapticSuccess()
      setStep(STEPS.REVIEW_RULE)
    } catch (err) {
      console.error('Remarkable generation error:', err)
      setError('Something went wrong. Let\'s try again.')
      setStep(STEPS.SCORE)
    }
  }

  // Save final result — updates existing auto-saved row or inserts new
  const save = async () => {
    if (!user || saving) return false
    setSaving(true)
    try {
      const coreData = {
        wound_problem: problem,
        assumption: assumption,
        combination_insight: twoWorlds,
        different: different,
        experience: experience,
        extreme_action_plan: compression,
        project_name: projectName,
        score_unique: scoreUnique || null,
        score_share: scoreShare || null,
        score_simple: scoreSimple || null,
        rule_identified: `Project: ${projectName} | Problem: ${problem} | Assumption: ${assumption} | Two worlds: ${twoWorlds} | Different: ${different} | Experience: ${experience} | One-liner: ${compression} | Score: ${scoreUnique}x${scoreShare}x${scoreSimple}=${scoreUnique * scoreShare * scoreSimple}`,
        ai_rule_statement: editedRuleBreak || aiResult?.rule_statement || null,
        ai_remarkable_bio: aiResult?.remarkable_bio || null,
        ai_tribe_statement: null,
      }
      let rowId = savedAngleId
      if (rowId) {
        const { error: updateErr } = await supabase.from('remarkable_angles').update(coreData).eq('id', rowId)
        if (updateErr) throw updateErr
      } else {
        const { data: insertedRow, error: insertErr } = await supabase.from('remarkable_angles').insert({ ...coreData, user_id: user.id }).select('id').single()
        if (insertErr) throw insertErr
        if (insertedRow?.id) rowId = insertedRow.id
      }
      if (rowId) setSavedAngleId(rowId)
      // Auto-populate brain
      onRemarkableComplete(user.id, {
        ruleIdentified: `Assumption: ${assumption} | Two worlds: ${twoWorlds} | Different: ${different}`,
        combinationInsight: twoWorlds,
        extremeAction: compression,
        aiRuleStatement: aiResult?.rule_statement || null,
        aiTribeStatement: null,
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
            <div className="rmk-intro-content">
              <div className="rmk-badge">Remarkable Results</div>
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
            </div>

            <button className="rmk-cta" onClick={() => { hapticLight(); setStep(STEPS.PROJECTS) }}>
              {existingAngle ? 'Sharpen my angle' : 'Let\'s go'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 0: PROJECTS ──
  if (step === STEPS.PROJECTS) {
    const filledItems = projectItems.filter(s => s.trim())
    const canAddMore = projectItems.length < 5
    const showTypeChoice = filledItems.length >= 2 && !projectType
    const singleItem = filledItems.length === 1
    const showNameInput = projectType === 'one_thing' || (projectType === 'separate' && selectedItems.length > 0) || singleItem
    const canProceed = projectName.trim().length >= 2

    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Getting started</div>
          <h2 className="rmk-heading">What are you <span className="rmk-gold">building</span>?</h2>
          <p className="rmk-prompt">List everything you're working on. Events, apps, content, products.</p>

          <div className="rmk-project-inputs">
            {projectItems.map((item, i) => (
              <textarea
                key={i}
                className="rmk-textarea"
                value={item}
                onChange={e => {
                  const next = [...projectItems]
                  next[i] = e.target.value
                  setProjectItems(next)
                }}
                placeholder={i === 0 ? 'e.g. Dance events, breathwork workshops' : 'e.g. An app, a podcast, a course'}
                rows={1}
                style={{ marginBottom: '0.5rem' }}
              />
            ))}
            {canAddMore && (
              <button
                className="rmk-add-more"
                onClick={() => { hapticLight(); setProjectItems([...projectItems, '']) }}
              >
                + Add more
              </button>
            )}
          </div>

          {showTypeChoice && (
            <div style={{ marginTop: '1.25rem' }}>
              <p className="rmk-prompt">Are these expressions of one thing, or separate projects?</p>
              <div className="rmk-problem-list">
                <button
                  className="rmk-problem-btn"
                  onClick={() => { hapticLight(); setProjectType('one_thing'); setSelectedItems(filledItems) }}
                >
                  Expressions of one thing
                </button>
                <button
                  className="rmk-problem-btn"
                  onClick={() => { hapticLight(); setProjectType('separate') }}
                >
                  Separate projects
                </button>
              </div>
            </div>
          )}

          {projectType === 'separate' && (
            <div style={{ marginTop: '1rem' }}>
              <p className="rmk-prompt">Select which ones you want to focus on:</p>
              <div className="rmk-problem-list">
                {filledItems.map((item, i) => (
                  <button
                    key={i}
                    className={`rmk-problem-btn ${selectedItems.includes(item) ? 'rmk-problem-selected' : ''}`}
                    onClick={() => {
                      hapticLight()
                      setSelectedItems(prev =>
                        prev.includes(item) ? prev.filter(s => s !== item) : [...prev, item]
                      )
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showNameInput && (
            <div style={{ marginTop: '1.25rem' }}>
              <p className="rmk-prompt">
                {projectType === 'one_thing' ? 'What do you call this movement?' : 'What do you call this project?'}
              </p>
              <textarea
                className="rmk-textarea"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder={projectType === 'one_thing' ? 'e.g. Vibe Rise' : 'e.g. My breathwork workshop'}
                rows={1}
              />
            </div>
          )}

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.INTRO)}>Back</button>
            <button
              className="rmk-cta"
              disabled={!canProceed}
              onClick={() => { hapticLight(); setStep(STEPS.PROBLEM) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 2: PROBLEM ──
  if (step === STEPS.PROBLEM) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Distil · 1 of 7</div>
          <h2 className="rmk-heading">What problem does {projectName ? <span className="rmk-gold">{projectName}</span> : 'your work'} solve that nobody else is <span className="rmk-gold">solving right</span>?</h2>
          <p className="rmk-prompt">The one that still fires you up when you think about it.</p>

          {scopeMapProblem && (
            <div className="rmk-context-card">
              You told us before: "{scopeMapProblem}"
            </div>
          )}

          {problems.length > 0 && (
            <>
              <div className="rmk-problem-list">
                {problems.map((prob, i) => (
                  <button
                    key={i}
                    className={`rmk-problem-btn ${problem === prob ? 'rmk-problem-selected' : ''}`}
                    onClick={() => { hapticLight(); setProblem(prob) }}
                  >
                    {prob}
                  </button>
                ))}
              </div>
              <div className="rmk-or-divider"><span>or write your own</span></div>
            </>
          )}

          <textarea
            className="rmk-textarea"
            value={problem}
            onChange={e => setProblem(e.target.value)}
            placeholder="e.g. Real transformation is paywalled. People spend thousands and are still stuck."
            rows={3}
          />

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.PROJECTS)}>Back</button>
            <button
              className="rmk-cta"
              disabled={!problem || problem.trim().length < 5}
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
          <div className="rmk-step-badge">Distil · 2 of 7</div>
          <div className="rmk-context-card">{problem}</div>
          <h2 className="rmk-heading">What does everyone assume is <span className="rmk-gold">required</span> to solve it?</h2>
          <p className="rmk-prompt">What rule does everyone follow that you think is wrong?</p>

          <textarea
            className="rmk-textarea"
            value={assumption}
            onChange={e => setAssumption(e.target.value)}
            placeholder="e.g. Everyone assumes healing must be serious, clinical, and expensive"
            rows={3}
            autoFocus
          />

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.PROBLEM)}>Back</button>
            <button
              className="rmk-cta"
              disabled={assumption.trim().length < 10}
              onClick={() => { hapticLight(); setStep(STEPS.TWO_WORLDS) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 4: TWO WORLDS ──
  if (step === STEPS.TWO_WORLDS) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Distil · 3 of 7</div>
          <div className="rmk-context-card">{assumption}</div>
          <h2 className="rmk-heading">What experience or background showed you that assumption is <span className="rmk-gold">wrong</span>?</h2>
          <p className="rmk-prompt">What did you live through that made you see what others can't?</p>

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
            Radha Agrawal spent years in nightlife and saw parties don't need alcohol. Wim Hof nearly lost everything and discovered breathing could control what doctors said was impossible.
          </div>

          <textarea
            className="rmk-textarea"
            value={twoWorlds}
            onChange={e => setTwoWorlds(e.target.value)}
            placeholder="e.g. I did a year-long fear challenge that changed my life more in 3 months than 3 years of online courses"
            rows={3}
            autoFocus
          />

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.ASSUMPTION)}>Back</button>
            <button
              className="rmk-cta"
              disabled={twoWorlds.trim().length < 10}
              onClick={() => { hapticLight(); setStep(STEPS.DIFFERENT) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 5: HOW YOU'RE DIFFERENT ──
  if (step === STEPS.DIFFERENT) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Distil · 4 of 7</div>
          <div className="rmk-context-card">{assumption}</div>
          <h2 className="rmk-heading">Remove that assumption. How does {projectName ? <span className="rmk-gold">{projectName}</span> : 'your approach'} <span className="rmk-gold">solve it differently</span>?</h2>
          <p className="rmk-prompt">Given what you lived through, what does your approach look like?</p>

          <textarea
            className="rmk-textarea"
            value={different}
            onChange={e => setDifferent(e.target.value)}
            placeholder="e.g. Silent discos with breathwork. Group healing through play. No credentials, just a room, music, and permission."
            rows={3}
            autoFocus
          />

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.TWO_WORLDS)}>Back</button>
            <button
              className="rmk-cta"
              disabled={different.trim().length < 10}
              onClick={() => { hapticLight(); setStep(STEPS.EXPERIENCE) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── THE EXPERIENCE (Product) ──
  if (step === STEPS.EXPERIENCE) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Distil · 5 of 7</div>
          <h2 className="rmk-heading">What's the <span className="rmk-gold">experience</span> people actually have?</h2>
          <p className="rmk-prompt">Describe the thing someone walks into, signs up for, or downloads. The product that IS the rule break.</p>

          <div className="rmk-example-card">
            Dawnbreak: 5am sober silent discos on the beach. Byron Katie: 4 questions anyone can ask themselves. Wim Hof: A breathing protocol + ice baths.
          </div>

          <textarea
            className="rmk-textarea"
            value={experience}
            onChange={e => setExperience(e.target.value)}
            placeholder="e.g. A weekly fear challenge where participants do one scary thing and track how it shifts their state"
            rows={3}
            autoFocus
          />

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.DIFFERENT)}>Back</button>
            <button
              className="rmk-cta"
              disabled={experience.trim().length < 10}
              onClick={() => { hapticLight(); setStep(STEPS.COMPRESSION) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── COMPRESSION GATE ──
  if (step === STEPS.COMPRESSION) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Distil · 6 of 7</div>
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
            <button className="rmk-back" onClick={() => setStep(STEPS.EXPERIENCE)}>Back</button>
            <button
              className="rmk-cta"
              disabled={compression.trim().length < 5}
              onClick={() => { hapticLight(); setStep(STEPS.SCORE) }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCORE YOURSELF ──
  if (step === STEPS.SCORE) {
    const total = scoreUnique * scoreShare * scoreSimple
    const allScored = scoreUnique > 0 && scoreShare > 0 && scoreSimple > 0
    const anyLow = allScored && (scoreUnique < 3 || scoreShare < 3 || scoreSimple < 3)

    const ScoreRow = ({ label, value, setValue, hint }) => (
      <div className="rmk-score-row">
        <div className="rmk-score-header">
          <div className="rmk-output-label">{label}</div>
          <div className="rmk-score-hint">{hint}</div>
        </div>
        <div className="rmk-score-buttons">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              className={`rmk-score-btn ${value === n ? 'rmk-score-active' : ''}`}
              onClick={() => { hapticLight(); setValue(n) }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    )

    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-step-badge">Rate your angle</div>
          <h2 className="rmk-heading">How <span className="rmk-gold">remarkable</span> is this?</h2>
          <p className="rmk-prompt">Be honest. Low scores help you sharpen.</p>

          {experience && (
            <div className="rmk-context-card">{experience}</div>
          )}

          <div className="rmk-score-section">
            <ScoreRow
              label="Uniqueness"
              value={scoreUnique}
              setValue={setScoreUnique}
              hint="How many others do this thing this way?"
            />
            <ScoreRow
              label="Shareability"
              value={scoreShare}
              setValue={setScoreShare}
              hint="If you saw someone doing this, would you tell a friend?"
            />
            <ScoreRow
              label="Simplicity"
              value={scoreSimple}
              setValue={setScoreSimple}
              hint="Could a stranger get it in under 10 seconds?"
            />
          </div>

          {allScored && (
            <div className={`rmk-score-result ${anyLow ? 'rmk-score-low' : 'rmk-score-good'}`}>
              <div className="rmk-score-total">{total}<span style={{ fontSize: '0.7rem', opacity: 0.5 }}>/125</span></div>
              {anyLow ? (
                <>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.88rem' }}>
                    {scoreUnique < 3 && 'Your angle might not be different enough. '}
                    {scoreShare < 3 && 'It\'s not remarkable enough to spread yet. '}
                    {scoreSimple < 3 && 'It\'s too complex to travel. '}
                    Sharpen it.
                  </p>
                  <div className="rmk-score-actions">
                    {scoreUnique < 3 && (
                      <button className="rmk-score-fix" onClick={() => setStep(STEPS.ASSUMPTION)}>
                        Sharpen your assumption
                      </button>
                    )}
                    {scoreShare < 3 && (
                      <button className="rmk-score-fix" onClick={() => setStep(STEPS.DIFFERENT)}>
                        Sharpen how you're different
                      </button>
                    )}
                    {scoreSimple < 3 && (
                      <button className="rmk-score-fix" onClick={() => setStep(STEPS.COMPRESSION)}>
                        Sharpen your one-liner
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)' }}>
                  Your angle is remarkable. Let's generate your positioning.
                </p>
              )}
            </div>
          )}

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.COMPRESSION)}>Back</button>
            <button
              className="rmk-cta"
              disabled={!allScored}
              onClick={generate}
            >
              {anyLow ? 'Generate anyway' : 'Show me my angle'}
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

  // ── REVIEW RULE BREAK ──
  if (step === STEPS.REVIEW_RULE && aiResult) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-badge">Your Rule Break</div>
          <p className="rmk-prompt">The AI generated this from your answers. Edit it until it feels right.</p>

          <textarea
            className="rmk-textarea"
            value={editedRuleBreak}
            onChange={e => setEditedRuleBreak(e.target.value)}
            placeholder="Your rule break statement..."
            rows={3}
            autoFocus
            style={{ fontSize: '1.05rem', fontWeight: 600 }}
          />

          <div className="rmk-example-card">
            Examples: "You don't change by learning, you change by being in your discomfort zone." "The question is never why the addiction, but why the pain."
          </div>

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.SCORE)}>Back</button>
            <button
              className="rmk-cta"
              disabled={editedRuleBreak.trim().length < 5}
              onClick={() => { hapticLight(); setStep(STEPS.SUMMARY) }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SUMMARY ──
  if (step === STEPS.SUMMARY && aiResult) {
    return (
      <div className="rmk">
        <div className="rmk-container rmk-screen">
          <div className="rmk-badge">{projectName || 'Your'} Remarkable Angle</div>

          {/* Rule break statement */}
          {editedRuleBreak && (
            <div className="rmk-output-card rmk-output-tribe" style={{ marginBottom: '1rem' }}>
              <div className="rmk-output-label">Your rule break</div>
              <p className="rmk-output-text" style={{ fontWeight: 700, fontSize: '1.05rem' }}>{editedRuleBreak}</p>
            </div>
          )}

          <div className="rmk-output-section">
            <div className="rmk-output-card">
              <div className="rmk-output-label">The problem{projectName ? ` ${projectName}` : ' you'} solve{projectName ? 's' : ''}</div>
              <p className="rmk-output-text">{problem}</p>
            </div>

            <div className="rmk-output-card">
              <div className="rmk-output-label">The assumption you break</div>
              <p className="rmk-output-text">{assumption}</p>
            </div>

            <div className="rmk-output-card">
              <div className="rmk-output-label">What showed you it was wrong</div>
              <p className="rmk-output-text">{twoWorlds}</p>
            </div>

            <div className="rmk-output-card">
              <div className="rmk-output-label">How {projectName || 'you\'re'} different</div>
              <p className="rmk-output-text">{different}</p>
            </div>

            <div className="rmk-output-card">
              <div className="rmk-output-label">The experience</div>
              <p className="rmk-output-text">{experience}</p>
            </div>

            <div className="rmk-output-card">
              <div className="rmk-output-label">Your one-liner</div>
              <p className="rmk-output-text" style={{ fontWeight: 700, fontSize: '1.05rem' }}>{compression}</p>
            </div>
          </div>

          {aiResult.remarkable_bio && (
            <div className="rmk-output-card" style={{ marginTop: '0.75rem' }}>
              <div className="rmk-output-label">Your remarkable bio</div>
              <p className="rmk-output-text">{aiResult.remarkable_bio}</p>
            </div>
          )}

          {error && <div className="rmk-error">{error}</div>}

          <div className="rmk-nav">
            <button className="rmk-back" onClick={() => setStep(STEPS.REVIEW_RULE)}>Back</button>
            <button
              className="rmk-cta"
              disabled={saving}
              onClick={async () => {
                const saved = await save()
                if (saved) {
                  navigate('/create')
                }
              }}
            >
              {saving ? 'Saving...' : 'Save my angle'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
