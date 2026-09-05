/**
 * ChooseQuestsFlow.jsx — /choose-quests
 *
 * Phase 1→2 bridge: Dome experiences → AI life path suggestions → quest creation.
 * Flow: Intro → Select → Deep Dive → Processing → Paths → Path Definition (2 screens per path) → Done
 * Path Definition: Screen 1 (precursor + dream dimensions + radar), Screen 2 (buts + reframe + next step + voice)
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useDomeData } from '../hooks/useDomeData'
import { getDomeExperiencesForBridge, groupByPrimal, formatDomeForPrompt } from '../lib/domeSummary'
import { hasSubNodes, getSubNodes, CAREER_VECTORS } from '../data/experienceDomeSubNodes'
import { DOME_DIMENSIONS } from '../data/domeDimensions'
import { PRECURSOR_LEVELS, PRECURSOR_DEFAULTS } from '../data/precursorDefaults'
import DomeOfSafety from '../components/DomeOfSafety'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import { getWeekStartLocal } from '../lib/dateUtils'
import './ChooseQuestsFlow.css'

const STEPS = {
  INTRO: 'intro',
  SELECT: 'select',
  DEEP_DIVE: 'deep_dive',
  PROCESSING: 'processing',
  PATHS: 'paths',
  PATH_DEF: 'path_def',
  SAVING: 'saving',
  DONE: 'done',
}

const VOICES = [
  { id: 'perfectionist', icon: '🎯', label: 'Perfectionist', sub: "Won't start until it's perfect" },
  { id: 'ghost', icon: '👻', label: 'Ghost', sub: 'Disappears, avoids, goes quiet' },
  { id: 'people-pleaser', icon: '🪞', label: 'People Pleaser', sub: 'Says yes when you mean no' },
  { id: 'controller', icon: '🧱', label: 'Controller', sub: 'Needs to control every variable' },
  { id: 'auto-pilot', icon: '🤖', label: 'Auto-Pilot', sub: 'Goes through the motions' },
]

export default function ChooseQuestsFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { domeStates, loading: domeLoading } = useDomeData(user?.id)
  // Hide bottom toolbar
  useEffect(() => {
    document.body.classList.add('hide-toolbar')
    return () => document.body.classList.remove('hide-toolbar')
  }, [])

  const [step, setStep] = useState(STEPS.INTRO)
  const [essenceArchetype, setEssenceArchetype] = useState(null)

  // Select step
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showFun, setShowFun] = useState(false)

  // Deep dive step — { [nodeId]: { formats: Set, vectors: Set } }
  const [deepDive, setDeepDive] = useState({})
  const [ddIndex, setDdIndex] = useState(0) // current node index in deep dive
  const deepDiveRef = useRef(deepDive)
  useEffect(() => { deepDiveRef.current = deepDive }, [deepDive])

  // Paths step
  const [paths, setPaths] = useState([])
  const [selectedPaths, setSelectedPaths] = useState(new Set())
  const [customInput, setCustomInput] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [aiError, setAiError] = useState(null)

  // Path definition step (replaces old stuck points)
  const [pdPathIndex, setPdPathIndex] = useState(0)
  const [pdScreen, setPdScreen] = useState(0) // 0 = setup, 1 = buts+step+voice
  const [precursorLevels, setPrecursorLevels] = useState({})       // { [pathIdx]: 'not_yet' }
  const [selectedDims, setSelectedDims] = useState({})              // { [pathIdx]: Set('people','money',...) }
  const [dreamDimensions, setDreamDimensions] = useState({})        // { [pathIdx]: { people: 5, ... } }
  const [currentDimensions, setCurrentDimensions] = useState({})    // { [pathIdx]: { people: 1, ... } }
  const [butTexts, setButTexts] = useState({})                      // { [pathIdx]: ['text1', ...] }
  const [butInput, setButInput] = useState('')
  const [showReframe, setShowReframe] = useState({})                // { [pathIdx]: boolean }
  const [nextStepTexts, setNextStepTexts] = useState({})            // { [pathIdx]: 'text' }
  const [protectiveVoices, setProtectiveVoices] = useState({})

  // Load essence archetype
  useEffect(() => {
    if (!user?.id) return
    supabase.from('lead_flow_profiles')
      .select('custom_essence_name, essence_archetype')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) setEssenceArchetype(data[0].custom_essence_name || data[0].essence_archetype)
      })
  }, [user?.id])

  // Guard: redirect if no positive dome ratings
  useEffect(() => {
    if (domeLoading) return
    const hasPositive = Object.values(domeStates).some(s => s === 'vibe_rise' || s === 'fun')
    if (!hasPositive) navigate('/experience-game', { replace: true })
  }, [domeLoading, domeStates, navigate])

  // Build experience lists
  const { vibeRise, fun } = getDomeExperiencesForBridge(domeStates)
  const vibeGroups = groupByPrimal(vibeRise)
  const funGroups = groupByPrimal(fun)

  // Get selected path objects
  const chosenPaths = paths.filter((_, i) => selectedPaths.has(i))

  const goTo = useCallback((s) => {
    setStep(s)
    window.scrollTo(0, 0)
  }, [])

  // ── Select handlers ──
  const toggleExp = useCallback((id) => {
    hapticLight()
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // ── AI call ──
  const callAI = useCallback(async () => {
    goTo(STEPS.PROCESSING)
    setAiError(null)

    const allExps = [...vibeRise, ...fun]
    const selectedLabels = allExps.filter(e => selectedIds.has(e.id)).map(e => e.label)
    const domeProfile = formatDomeForPrompt(selectedLabels, domeStates, essenceArchetype, deepDiveRef.current, allExps)

    try {
      const { data, error } = await supabase.functions.invoke('suggest-life-paths', {
        body: { domeProfile, curiosityClusters: [], skills: [], problems: [] },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      if (data?.paths?.length) {
        setPaths(data.paths)
        goTo(STEPS.PATHS)
      } else {
        throw new Error('No paths returned')
      }
    } catch (err) {
      console.error('Life path suggestions failed:', err)
      setAiError(err.message)
      goTo(STEPS.PATHS)
    }
  }, [selectedIds, vibeRise, fun, domeStates, essenceArchetype, goTo])

  // Auto-advance past deep dive if ddIndex exceeds selected count
  const allExpsForDD = [...vibeRise, ...fun].filter(e => selectedIds.has(e.id))
  const ddAutoAdvance = step === STEPS.DEEP_DIVE && allExpsForDD.length > 0 && ddIndex >= allExpsForDD.length
  useEffect(() => {
    if (ddAutoAdvance) callAI()
  }, [ddAutoAdvance]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Path selection ──
  const togglePath = useCallback((idx) => {
    hapticLight()
    setSelectedPaths(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }, [])

  const addCustomPath = useCallback(() => {
    if (!customInput.trim()) return
    const newPath = { name: customInput.trim(), description: 'Your own path', draws_from: 'custom', isCustom: true }
    setPaths(prev => {
      setSelectedPaths(sel => new Set([...sel, prev.length]))
      return [...prev, newPath]
    })
    setCustomInput('')
    setShowCustom(false)
    hapticLight()
  }, [customInput])

  // ── Path definition helpers ──
  const getDimTiers = useCallback((dim) => {
    if (dim.type === 'numeric') {
      // For numeric, show representative tier labels
      return dim.tiers.map((t, i) => ({ level: i + 1, label: t >= 1000 ? `${t / 1000}K` : String(t) }))
    }
    return dim.levels
  }, [])

  // ── Save quests + courage challenges ──
  const saveQuests = useCallback(async () => {
    if (!user?.id) return
    goTo(STEPS.SAVING)

    try {
      const dd = deepDiveRef.current || {}
      const allExps = [...vibeRise, ...fun].filter(e => selectedIds.has(e.id))

      for (const pathIdx of selectedPaths) {
        const path = paths[pathIdx]
        if (!path) continue

        // Resolve career vector + format picks from deep dive data
        const drawsFrom = (path.draws_from || '').toLowerCase()
        const pathName = (path.name || '').toLowerCase()
        let questVector = null
        const questFormats = []

        for (const exp of allExps) {
          const expDd = dd[exp.id]
          if (!expDd) continue
          const expLabel = exp.label.toLowerCase()
          if (!drawsFrom.includes(expLabel) && !pathName.includes(expLabel)) continue
          const vecs = expDd.vectors instanceof Set ? [...expDd.vectors] : (expDd.vectors || [])
          if (!questVector) {
            const nonHobby = vecs.filter(v => v !== 'hobby')
            if (nonHobby.length) questVector = nonHobby[0]
          }
          const fmts = expDd.formats instanceof Set ? expDd.formats : new Set(expDd.formats || [])
          if (fmts.size) {
            getSubNodes(exp.id).filter(s => fmts.has(s.id)).forEach(s => {
              if (!questFormats.includes(s.label)) questFormats.push(s.label)
            })
          }
        }

        // Create quest with path definition data
        const { data: newQuest } = await supabase.from('quests').insert({
          user_id: user.id,
          label: path.name,
          career_id: `dome-bridge-${Date.now()}-${pathIdx}`,
          predicted_state: 'vibe_rise',
          status: 'active',
          career_vector: questVector,
          format_picks: questFormats.length ? questFormats : null,
          precursor_level: precursorLevels[pathIdx] || null,
          current_dimensions: currentDimensions[pathIdx] || null,
          dream_dimensions: dreamDimensions[pathIdx] || null,
          protective_voice: protectiveVoices[pathIdx] || null,
          buts: butTexts[pathIdx]?.length ? butTexts[pathIdx] : null,
        }).select('id').single()

        const questId = newQuest?.id
        if (!questId) continue

        // Auto-tag skills (non-blocking)
        import('../lib/questSkillTagger').then(async (m) => {
          const tags = await m.tagQuestSkills(questId, path.name)
          if (tags?.skill_tags?.length) {
            import('../lib/clusterQuestLinker').then(linker =>
              linker.linkNewQuestToClusters(user.id, questId, tags.skill_tags)
            ).catch(() => {})
          }
        }).catch(() => {})

        // Create courage challenge from next step
        const stepText = (nextStepTexts[pathIdx] || '').trim()
        if (stepText) {
          const { data: existingGroan } = await supabase.from('groan_challenges')
            .select('id').eq('user_id', user.id).eq('title', stepText).limit(1)
          let groanId = existingGroan?.[0]?.id

          if (!groanId) {
            const { data: newGroan } = await supabase.from('groan_challenges').insert({
              user_id: user.id,
              title: stepText,
              challenge_text: stepText,
              status: 'active',
              source_type: 'skill',
              challenge_source: 'dome_bridge',
              source_label: path.name,
              scary_score: 5,
              wahoo_score: 5,
              visibility_layer: 'screen',
              visibility_layers: [],
              accepted_at: new Date().toISOString(),
            }).select('id').single()

            if (newGroan?.id) {
              groanId = newGroan.id
              try {
                await supabase.from('priority_weekly_picks').upsert({
                  user_id: user.id,
                  week_start_date: getWeekStartLocal(),
                  pick_type: 'groan',
                  reference_id: groanId,
                  display_name: stepText,
                }, { onConflict: 'user_id,week_start_date,pick_type,reference_id', ignoreDuplicates: true })
              } catch {}
            }
          }

          if (groanId) {
            const { data: existingTask } = await supabase.from('quest_tasks')
              .select('id').eq('quest_id', questId).eq('text', stepText).limit(1)
            if (!existingTask?.length) {
              try {
                await supabase.from('quest_tasks').insert({
                  quest_id: questId,
                  user_id: user.id,
                  text: stepText,
                  is_courage_challenge: true,
                  groan_challenge_id: groanId,
                  sort_order: 0,
                }).select('id').single()
              } catch {}
            }
          }
        }
      }

      // Write life_path_sessions row so Paths tab auto-unlocks
      const stuckSummary = chosenPaths.map((p, i) => {
        const pathIdx = paths.indexOf(p)
        return {
          id: `pd-${i}`, careerId: pathIdx,
          text: nextStepTexts[pathIdx] || '',
          protectiveVoice: protectiveVoices[pathIdx] || null,
          buts: butTexts[pathIdx] || [],
        }
      })
      await supabase.from('life_path_sessions').insert({
        client_name: user.email || user.id,
        client_email: user.email || null,
        careers: chosenPaths.map((p, i) => ({ id: `dome-${i}`, label: p.name, predictedState: 'vibe_rise' })),
        stuck_points: stuckSummary,
        step: 'complete',
      }).then(() => {}).catch(() => {})

      hapticSuccess()
      goTo(STEPS.DONE)
    } catch (err) {
      console.error('Quest creation failed:', err)
      goTo(STEPS.PATH_DEF)
    }
  }, [user, paths, selectedPaths, chosenPaths, goTo, vibeRise, fun, selectedIds,
    precursorLevels, currentDimensions, dreamDimensions, protectiveVoices, butTexts, nextStepTexts])

  // ── Loading ──
  if (domeLoading) {
    return <div className="cqf"><div className="cqf-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60dvh' }}><div className="cqf-spinner" /></div></div>
  }

  // ── INTRO ──
  if (step === STEPS.INTRO) {
    return (
      <div className="cqf">
        <div className="cqf-container">
          <div className="cqf-intro">
            <div className="cqf-intro-dome">🎯</div>
            <h1>Your dome knows<br/><span>what lights you up</span></h1>
            <p>Let's turn those experiences into life paths you can actually pursue.</p>
            <div className="cqf-steps">
              <div className="cqf-step"><div className="cqf-step-num">1</div><div className="cqf-step-text">Pick experiences you want more of</div></div>
              <div className="cqf-step"><div className="cqf-step-num">2</div><div className="cqf-step-text">We suggest life paths</div></div>
              <div className="cqf-step"><div className="cqf-step-num">3</div><div className="cqf-step-text">Choose your quests</div></div>
            </div>
            <div className="cqf-fixed">
              <button className="cqf-cta cqf-cta-gold" onClick={() => goTo(STEPS.SELECT)}>Let's go →</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── SELECT EXPERIENCES ──
  if (step === STEPS.SELECT) {
    const n = selectedIds.size
    return (
      <div className="cqf">
        <div className="cqf-container">
          <div className="cqf-select-header">
            <h2>Which of these do you want<br/>more of in your life?</h2>
            <p>Pick the experiences that made you feel most alive.</p>
          </div>
          <div className="cqf-count">{n === 0 ? '0 selected' : `${n} selected`}</div>

          <div className="cqf-divider"><span>✦ Vibe Rise</span><hr/></div>
          {vibeGroups.map(group => (
            <div key={group.primal}>
              <div className="cqf-primal">{group.label}</div>
              {group.items.map(exp => (
                <div key={exp.id} className={`cqf-exp ${selectedIds.has(exp.id) ? 'selected' : ''}`} onClick={() => toggleExp(exp.id)}>
                  <div className="cqf-exp-check">✓</div>
                  <span className="cqf-exp-name">{exp.label}</span>
                  <span className="cqf-exp-ns">✦</span>
                </div>
              ))}
            </div>
          ))}

          {funGroups.length > 0 && (
            <>
              <div className="cqf-fun-toggle">
                <button onClick={() => setShowFun(!showFun)}>
                  {showFun ? 'Hide Fun experiences ▴' : 'Also show Fun experiences ▾'}
                </button>
              </div>
              {showFun && (
                <>
                  <div className="cqf-divider fun"><span>○ Fun</span><hr/></div>
                  {funGroups.map(group => (
                    <div key={group.primal}>
                      <div className="cqf-primal">{group.label}</div>
                      {group.items.map(exp => (
                        <div key={exp.id} className={`cqf-exp ${selectedIds.has(exp.id) ? 'selected' : ''}`} onClick={() => toggleExp(exp.id)}>
                          <div className="cqf-exp-check">✓</div>
                          <span className="cqf-exp-name">{exp.label}</span>
                          <span className="cqf-exp-ns">○</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          <div className="cqf-fixed">
            <button className="cqf-cta cqf-cta-gold" disabled={n === 0} onClick={() => { setDdIndex(0); goTo(STEPS.DEEP_DIVE) }}>
              {n === 0 ? 'Select at least 1 →' : 'Tell us more →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── DEEP DIVE ──
  if (step === STEPS.DEEP_DIVE) {
    const selectedExps = allExpsForDD
    const currentExp = selectedExps[ddIndex]

    if (!currentExp) {
      // Waiting for useEffect to fire callAI
      return <div className="cqf"><div className="cqf-container"><div className="cqf-processing"><div className="cqf-spinner" /></div></div></div>
    }

    const nodeId = currentExp.id
    const subNodes = getSubNodes(nodeId)
    const hasFormats = subNodes.length > 0
    const dd = deepDive[nodeId] || { formats: new Set(), vectors: new Set() }

    const toggleFormat = (fmtId) => {
      hapticLight()
      setDeepDive(prev => {
        const existing = prev[nodeId] || { formats: new Set(), vectors: new Set() }
        const next = new Set(existing.formats)
        if (next.has(fmtId)) next.delete(fmtId)
        else next.add(fmtId)
        return { ...prev, [nodeId]: { ...existing, formats: next } }
      })
    }

    const toggleVector = (vecId) => {
      hapticLight()
      setDeepDive(prev => {
        const existing = prev[nodeId] || { formats: new Set(), vectors: new Set() }
        const next = new Set(existing.vectors)
        if (next.has(vecId)) next.delete(vecId)
        else next.add(vecId)
        return { ...prev, [nodeId]: { ...existing, vectors: next } }
      })
    }

    const canProceed = dd.vectors.size > 0
    const isLast = ddIndex === selectedExps.length - 1

    const goNext = () => {
      if (isLast) {
        callAI()
      } else {
        setDdIndex(ddIndex + 1)
        window.scrollTo(0, 0)
      }
    }

    return (
      <div className="cqf">
        <div className="cqf-container">
          <div className="cqf-dd-progress">
            {ddIndex + 1} of {selectedExps.length}
          </div>

          <div className="cqf-dd-header">
            <h2>{currentExp.label}</h2>
          </div>

          {hasFormats && (
            <div className="cqf-dd-section">
              <div className="cqf-dd-q">Which formats specifically?</div>
              <div className="cqf-dd-options">
                {subNodes.map(sub => (
                  <div key={sub.id}
                    className={`cqf-dd-chip ${dd.formats.has(sub.id) ? 'selected' : ''}`}
                    onClick={() => toggleFormat(sub.id)}>
                    <div className="cqf-dd-chip-check">✓</div>
                    <span>{sub.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="cqf-dd-section">
            <div className="cqf-dd-q">When you imagine doing more of this, what excites you?</div>
            <div className="cqf-dd-vectors">
              {CAREER_VECTORS.map(vec => (
                <div key={vec.id}
                  className={`cqf-dd-vector ${dd.vectors.has(vec.id) ? 'selected' : ''}`}
                  onClick={() => toggleVector(vec.id)}>
                  <div className="cqf-dd-vector-check">✓</div>
                  <div>
                    <div className="cqf-dd-vector-label">{vec.label}</div>
                    <div className="cqf-dd-vector-sub">{vec.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cqf-fixed">
            <button className="cqf-cta cqf-cta-gold" disabled={!canProceed} onClick={goNext}>
              {!canProceed ? 'Pick at least one role' : isLast ? 'Show me life paths →' : 'Next →'}
            </button>
            <button className="cqf-cta cqf-cta-secondary" onClick={() => {
              if (ddIndex > 0) { setDdIndex(ddIndex - 1); window.scrollTo(0, 0) }
              else goTo(STEPS.SELECT)
            }}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── PROCESSING ──
  if (step === STEPS.PROCESSING) {
    const allExps = [...vibeRise, ...fun]
    const selectedLabels = allExps.filter(e => selectedIds.has(e.id)).map(e => e.label)
    return (
      <div className="cqf">
        <div className="cqf-container">
          <div className="cqf-processing">
            <div className="cqf-spinner" />
            <h2>Finding your life paths...</h2>
            <p>Based on what makes you feel alive, here's what you could pursue.</p>
            <div className="cqf-tags">
              {selectedLabels.map(l => <span key={l} className="cqf-tag">{l}</span>)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── PICK PATHS ──
  if (step === STEPS.PATHS) {
    const n = selectedPaths.size
    return (
      <div className="cqf">
        <div className="cqf-container">
          <div className="cqf-paths-header">
            <h2>Life paths for you</h2>
            <p>Pick 1-3 experiences that sound super exciting to you.</p>
          </div>

          {aiError && (
            <div className="cqf-error">
              Something went wrong generating paths.
              <button onClick={callAI}>Try again</button>
            </div>
          )}

          {paths.map((path, i) => (
            <div key={i} className={`cqf-path ${selectedPaths.has(i) ? 'selected' : ''}`} onClick={() => togglePath(i)}>
              <div className="cqf-path-top">
                <div className="cqf-path-check">✓</div>
                <div>
                  <div className="cqf-path-name">{path.name}</div>
                  <div className="cqf-path-desc">{path.description}</div>
                  {path.draws_from && !path.isCustom && (
                    <div className="cqf-path-sources">
                      {path.draws_from
                        .split(/[,+.]/)
                        .map(s => s.trim()
                          .replace(/^(and|or|SELECTED:|Vibe Rise:|Fun:|Growth edge:)\s*/gi, '')
                          .replace(/^\(.*?\)\s*/, '')
                        )
                        .filter(s => s.length > 1 && !s.toLowerCase().includes('wild card'))
                        .map((s, j) => <span key={j} className="cqf-path-source">{s}</span>)
                      }
                    </div>
                  )}
                  {path.draws_from?.toLowerCase().includes('wild card') && (
                    <div className="cqf-path-wild">Wild card</div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="cqf-add-own">
            {!showCustom ? (
              <button onClick={() => setShowCustom(true)}>+ Add your own path</button>
            ) : (
              <div className="cqf-custom-input">
                <input type="text" value={customInput} onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomPath()}
                  placeholder="Type your own life path..." autoFocus />
                <button onClick={addCustomPath} disabled={!customInput.trim()}>Add</button>
              </div>
            )}
          </div>

          <div className="cqf-fixed">
            <button className="cqf-cta cqf-cta-gold" disabled={n === 0} onClick={() => { setPdPathIndex(0); setPdScreen(0); goTo(STEPS.PATH_DEF) }}>
              {n === 0 ? 'Select at least 1 →' : 'Continue →'}
            </button>
            <button className="cqf-cta cqf-cta-secondary" onClick={() => { setPaths([]); setSelectedPaths(new Set()); goTo(STEPS.SELECT) }}>← Change experiences</button>
          </div>
        </div>
      </div>
    )
  }

  // ── PATH DEFINITION (2 screens per path) ──
  if (step === STEPS.PATH_DEF) {
    const chosenArr = [...selectedPaths].map(i => ({ idx: i, path: paths[i] })).filter(p => p.path)
    const currentPath = chosenArr[pdPathIndex]
    if (!currentPath) { saveQuests(); return <div className="cqf"><div className="cqf-container"><div className="cqf-processing"><div className="cqf-spinner" /></div></div></div> }

    const { idx: pathIdx, path } = currentPath
    const isLastPath = pdPathIndex === chosenArr.length - 1
    const precursor = precursorLevels[pathIdx]
    const dims = selectedDims[pathIdx] || new Set()
    const dreams = dreamDimensions[pathIdx] || {}
    const currDims = currentDimensions[pathIdx] || {}
    const buts = butTexts[pathIdx] || []
    const reframeShown = showReframe[pathIdx]

    // Screen 0: PATH SETUP (precursor + dimensions + radar)
    if (pdScreen === 0) {
      const dimsReady = dims.size >= 3 && [...dims].every(d => dreams[d] != null)

      return (
        <div className="cqf">
          <div className="cqf-container">
            <div className="cqf-pd-progress">Path {pdPathIndex + 1} of {chosenArr.length} · Setup</div>
            <div className="cqf-pd-path-name">{path.name}</div>

            {/* Precursor */}
            <div className="cqf-pd-section">
              <div className="cqf-pd-q">Have you taken any steps on this path already?</div>
              <div className="cqf-pd-precursor">
                {PRECURSOR_LEVELS.map(lvl => (
                  <div key={lvl.id}
                    className={`cqf-pd-pre-card ${precursor === lvl.id ? 'selected' : ''}`}
                    onClick={() => {
                      hapticLight()
                      setPrecursorLevels(prev => ({ ...prev, [pathIdx]: lvl.id }))
                      setCurrentDimensions(prev => ({ ...prev, [pathIdx]: { ...PRECURSOR_DEFAULTS[lvl.id] } }))
                    }}>
                    <div className="cqf-pd-pre-label">{lvl.label}</div>
                    <div className="cqf-pd-pre-desc">{lvl.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dimensions (show after precursor selected) */}
            {precursor && (
              <div className="cqf-pd-section">
                <div className="cqf-pd-q">Pick the 3 that matter most to you</div>
                <div className="cqf-pd-dim-chips">
                  {DOME_DIMENSIONS.map(dim => {
                    const isSelected = dims.has(dim.id)
                    const canAdd = dims.size < 3 || isSelected
                    return (
                      <div key={dim.id}
                        className={`cqf-pd-dim-chip ${isSelected ? 'selected' : ''} ${!canAdd ? 'disabled' : ''}`}
                        onClick={() => {
                          if (!canAdd) return
                          hapticLight()
                          setSelectedDims(prev => {
                            const next = new Set(prev[pathIdx] || [])
                            if (next.has(dim.id)) { next.delete(dim.id); setDreamDimensions(d => { const n = { ...d[pathIdx] }; delete n[dim.id]; return { ...d, [pathIdx]: n } }) }
                            else next.add(dim.id)
                            return { ...prev, [pathIdx]: next }
                          })
                        }}>
                        <span className="cqf-pd-dim-icon">{dim.icon}</span>
                        <span>{dim.label}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Tier pickers for selected dimensions */}
                {[...dims].map(dimId => {
                  const dim = DOME_DIMENSIONS.find(d => d.id === dimId)
                  if (!dim) return null
                  const tiers = getDimTiers(dim)
                  const currentLevel = currDims[dimId] || 1
                  const dreamLevel = dreams[dimId]

                  return (
                    <div key={dimId} className="cqf-pd-dim-picker">
                      <div className="cqf-pd-dim-q">{dim.icon} {dim.dreamQuestion}</div>
                      <div className="cqf-pd-tiers">
                        {tiers.map(tier => (
                          <div key={tier.level}
                            className={`cqf-pd-tier ${dreamLevel === tier.level ? 'dream' : ''} ${tier.level === currentLevel ? 'current' : ''}`}
                            onClick={() => {
                              hapticLight()
                              setDreamDimensions(prev => ({
                                ...prev,
                                [pathIdx]: { ...(prev[pathIdx] || {}), [dimId]: tier.level }
                              }))
                            }}>
                            <div className="cqf-pd-tier-level">{tier.label}</div>
                            {tier.description && <div className="cqf-pd-tier-desc">{tier.description}</div>}
                            {tier.level === currentLevel && <div className="cqf-pd-tier-you">you</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {/* Mini radar when 3 dimensions have dream levels */}
                {dimsReady && (
                  <div className="cqf-pd-radar">
                    <DomeOfSafety
                      domeEdges={currDims}
                      edgeZone={dreams}
                      gapMetrics={{}}
                      mini
                    />
                    <div className="cqf-pd-radar-legend">
                      <span className="cqf-pd-legend-now">● Now</span>
                      <span className="cqf-pd-legend-dream">● Dream</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="cqf-fixed">
              <button className="cqf-cta cqf-cta-gold"
                disabled={!precursor || !dimsReady}
                onClick={() => { setPdScreen(1); window.scrollTo(0, 0) }}>
                {!precursor ? 'Pick where you are' : !dimsReady ? 'Pick 3 dimensions + dream levels' : 'Next →'}
              </button>
              <button className="cqf-cta cqf-cta-secondary" onClick={() => {
                if (pdPathIndex > 0) { setPdPathIndex(pdPathIndex - 1); setPdScreen(1); window.scrollTo(0, 0) }
                else goTo(STEPS.PATHS)
              }}>← Back</button>
            </div>
          </div>
        </div>
      )
    }

    // Screen 1: BUTS + NEXT STEP + VOICE
    if (pdScreen === 1) {
      const stepText = nextStepTexts[pathIdx] || ''
      const voice = protectiveVoices[pathIdx]

      const advancePath = () => {
        if (isLastPath) {
          saveQuests()
        } else {
          setPdPathIndex(pdPathIndex + 1)
          setPdScreen(0)
          setButInput('')
          window.scrollTo(0, 0)
        }
      }

      return (
        <div className="cqf">
          <div className="cqf-container">
            <div className="cqf-pd-progress">Path {pdPathIndex + 1} of {chosenArr.length} · Your blocks</div>
            <div className="cqf-pd-path-name">{path.name}</div>

            {/* Buts */}
            <div className="cqf-pd-section">
              <div className="cqf-pd-q">I want to pursue {path.name}, but...</div>
              <div className="cqf-pd-but-input">
                <input type="text" value={butInput}
                  onChange={e => setButInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && butInput.trim()) {
                      setButTexts(prev => ({ ...prev, [pathIdx]: [...(prev[pathIdx] || []), butInput.trim()] }))
                      setButInput('')
                    }
                  }}
                  placeholder="What's stopping you?" />
                <button disabled={!butInput.trim()} onClick={() => {
                  setButTexts(prev => ({ ...prev, [pathIdx]: [...(prev[pathIdx] || []), butInput.trim()] }))
                  setButInput('')
                }}>Add</button>
              </div>

              {buts.length > 0 && (
                <div className="cqf-pd-buts-list">
                  {buts.map((b, i) => (
                    <div key={i} className={`cqf-pd-but-item ${reframeShown ? 'reframed' : ''}`}>
                      <div className="cqf-pd-but-text">
                        {reframeShown
                          ? <>I want to pursue {path.name}, <span className="cqf-pd-and">and</span> {b.toLowerCase()}</>
                          : <>...{b}</>
                        }
                      </div>
                      {!reframeShown && (
                        <span className="cqf-pd-but-remove" onClick={() => {
                          setButTexts(prev => ({ ...prev, [pathIdx]: buts.filter((_, j) => j !== i) }))
                        }}>✕</span>
                      )}
                    </div>
                  ))}

                  {!reframeShown && (
                    <button className="cqf-pd-reframe-btn" onClick={() => {
                      hapticLight()
                      setShowReframe(prev => ({ ...prev, [pathIdx]: true }))
                    }}>See the reframe →</button>
                  )}

                  {reframeShown && (
                    <div className="cqf-pd-reframe-note">
                      Saying "and" turns a block into a fact you're choosing to work with.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Next step */}
            <div className="cqf-pd-section">
              <div className="cqf-pd-q">Despite that, what's the smallest step this week?</div>
              <div className="cqf-pd-step-hint">Think really small. Not "build a website". More like "google how to set up a free one".</div>
              <input className="cqf-pd-step-input" type="text"
                value={stepText}
                onChange={e => setNextStepTexts(prev => ({ ...prev, [pathIdx]: e.target.value }))}
                placeholder="The tiniest possible step..." />
            </div>

            {/* Protective voice (shows when next step has text) */}
            {stepText.trim() && (
              <div className="cqf-pd-section">
                <div className="cqf-pd-q">Which voice tries to stop you from doing that?</div>
                <div className="cqf-pd-step-quote">"{stepText.trim()}"</div>
                <div className="cqf-pd-voices">
                  {VOICES.map(v => (
                    <div key={v.id}
                      className={`cqf-dd-vector ${voice === v.id ? 'selected' : ''}`}
                      onClick={() => { hapticLight(); setProtectiveVoices(prev => ({ ...prev, [pathIdx]: v.id })) }}>
                      <div className="cqf-dd-vector-check">✓</div>
                      <div>
                        <div className="cqf-dd-vector-label">{v.icon} {v.label}</div>
                        <div className="cqf-dd-vector-sub">{v.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="cqf-pd-skip" onClick={() => setProtectiveVoices(prev => ({ ...prev, [pathIdx]: null }))}>Skip</button>
              </div>
            )}

            <div className="cqf-fixed">
              <button className="cqf-cta cqf-cta-gold" onClick={advancePath}>
                {isLastPath ? 'Create my paths →' : 'Next path →'}
              </button>
              <button className="cqf-cta cqf-cta-secondary" onClick={() => { setPdScreen(0); window.scrollTo(0, 0) }}>← Back to setup</button>
            </div>
          </div>
        </div>
      )
    }
  }

  // ── SAVING ──
  if (step === STEPS.SAVING) {
    return (
      <div className="cqf">
        <div className="cqf-container">
          <div className="cqf-processing">
            <div className="cqf-spinner" />
            <h2>Creating your quests...</h2>
          </div>
        </div>
      </div>
    )
  }

  // ── DONE ──
  if (step === STEPS.DONE) {
    return (
      <div className="cqf">
        <div className="cqf-container">
          <div className="cqf-done">
            <div className="cqf-done-check">✓</div>
            <h2>Paths created</h2>
            <p>Head to your Paths tab to see your active paths and start your first courage challenge.</p>
            <div className="cqf-done-list">
              {chosenPaths.map((path, i) => (
                <div key={i} className="cqf-done-quest">
                  <div className="cqf-done-dot" />
                  <div className="cqf-done-name">{path.name}</div>
                </div>
              ))}
            </div>
            <div className="cqf-fixed">
              <button className="cqf-cta cqf-cta-gold" onClick={() => navigate('/7-day-challenge?tab=Paths')}>
                Go to my paths →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
