/**
 * ChooseQuestsFlow.jsx — /choose-quests
 *
 * Phase 1→2 bridge: Dome experiences → AI project ideas → path creation.
 * Flow: Intro → Select → Deep Dive → Processing → Projects → (Clustering) → Paths Review → Save → Done
 * Path definition (dimensions, fuels, commitment) happens separately at /path-definition/:questId.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useDomeData } from '../hooks/useDomeData'
import { getDomeExperiencesForBridge, groupByPrimal, formatDomeForPrompt } from '../lib/domeSummary'
import { getSubNodes, CAREER_VECTORS } from '../data/experienceDomeSubNodes'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './ChooseQuestsFlow.css'

const STEPS = {
  INTRO: 'intro',
  SELECT: 'select',
  DEEP_DIVE: 'deep_dive',
  PROCESSING: 'processing',
  PROJECTS: 'projects',
  CLUSTERING: 'clustering',
  PATHS_REVIEW: 'paths_review',
  SAVING: 'saving',
  DONE: 'done',
}

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

  // Projects step (AI-generated project ideas)
  const [projects, setProjects] = useState([])
  const [removedProjects, setRemovedProjects] = useState(new Set())
  const [aiError, setAiError] = useState(null)
  const [customProjectInput, setCustomProjectInput] = useState('')
  const [showCustomProject, setShowCustomProject] = useState(false)

  // Paths (either from clustering or 1:1 from projects)
  const [paths, setPaths] = useState([])
  const [selectedPaths, setSelectedPaths] = useState(new Set())
  const [clusterLoading, setClusterLoading] = useState(false)
  const [clusterError, setClusterError] = useState(null)
  const [movePopover, setMovePopover] = useState(null) // { fromPath, projectIdx }
  const [shouldSave, setShouldSave] = useState(false)

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
  // ── AI call: generate project ideas ──
  const callAI = useCallback(async () => {
    goTo(STEPS.PROCESSING)
    setAiError(null)

    const allExps = [...vibeRise, ...fun]
    const selectedLabels = allExps.filter(e => selectedIds.has(e.id)).map(e => e.label)
    const domeProfile = formatDomeForPrompt(selectedLabels, domeStates, essenceArchetype, deepDiveRef.current, allExps)

    try {
      const { data, error } = await supabase.functions.invoke('suggest-life-paths', {
        body: { domeProfile },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      if (data?.projects?.length) {
        setProjects(data.projects)
        setRemovedProjects(new Set())
        goTo(STEPS.PROJECTS)
      } else {
        throw new Error('No projects returned')
      }
    } catch (err) {
      console.error('Life path suggestions failed:', err)
      setAiError(err.message)
      goTo(STEPS.PROJECTS)
    }
  }, [selectedIds, vibeRise, fun, domeStates, essenceArchetype, goTo])

  // ── Remove/restore a project ──
  const toggleRemoveProject = useCallback((idx) => {
    hapticLight()
    setRemovedProjects(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }, [])

  // ── Get active (non-removed) projects ──
  const activeProjects = projects.filter((_, i) => !removedProjects.has(i))

  // ── Proceed from projects: 1 → direct path, 2+ → cluster via AI ──
  const proceedFromProjects = useCallback(async () => {
    if (activeProjects.length === 0) return

    if (activeProjects.length === 1) {
      // Single project becomes its own path — skip clustering
      const directPaths = [{ name: activeProjects[0].name, description: activeProjects[0].description, draws_from: activeProjects[0].draws_from, projects: [activeProjects[0]] }]
      setPaths(directPaths)
      setSelectedPaths(new Set([0]))
      goTo(STEPS.PATHS_REVIEW)
      return
    }

    // 2+ projects: cluster into paths via AI
    setClusterLoading(true)
    setClusterError(null)
    goTo(STEPS.CLUSTERING)

    const allExps = [...vibeRise, ...fun]
    const selectedLabels = allExps.filter(e => selectedIds.has(e.id)).map(e => e.label)
    const domeProfile = formatDomeForPrompt(selectedLabels, domeStates, essenceArchetype, deepDiveRef.current, allExps)

    try {
      const { data, error } = await supabase.functions.invoke('suggest-life-paths', {
        body: { mode: 'cluster', selectedProjects: activeProjects, domeProfile },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      if (data?.paths?.length) {
        setPaths(data.paths)
        const allSelected = new Set()
        data.paths.forEach((_, i) => allSelected.add(i))
        setSelectedPaths(allSelected)
        goTo(STEPS.PATHS_REVIEW)
      } else {
        throw new Error('No paths returned from clustering')
      }
    } catch (err) {
      console.error('Life path clustering failed:', err)
      setClusterError(err.message)
    } finally {
      setClusterLoading(false)
    }
  }, [activeProjects, selectedIds, vibeRise, fun, domeStates, essenceArchetype, goTo])

  // ── Confirm clustered paths → filter to selected non-empty, then save ──
  const confirmPaths = useCallback(() => {
    const kept = paths.filter((_, i) => selectedPaths.has(i) && paths[i].projects?.length > 0)
    setPaths(kept)
    const newSelected = new Set()
    kept.forEach((_, i) => newSelected.add(i))
    setSelectedPaths(newSelected)
    // saveQuests will be called on next render via effect
    setShouldSave(true)
  }, [paths, selectedPaths])

  // Auto-advance past deep dive if ddIndex exceeds selected count
  const allExpsForDD = [...vibeRise, ...fun].filter(e => selectedIds.has(e.id))
  const ddAutoAdvance = step === STEPS.DEEP_DIVE && allExpsForDD.length > 0 && ddIndex >= allExpsForDD.length
  useEffect(() => {
    if (ddAutoAdvance) callAI()
  }, [ddAutoAdvance]) // eslint-disable-line react-hooks/exhaustive-deps

  // Save trigger — fires after confirmPaths updates state
  useEffect(() => {
    if (shouldSave) {
      setShouldSave(false)
      saveQuests()
    }
  }, [shouldSave]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save quests ──
  const saveQuests = useCallback(async () => {
    if (!user?.id) return
    goTo(STEPS.SAVING)

    try {
      const dd = deepDiveRef.current || {}
      const allExps = [...vibeRise, ...fun].filter(e => selectedIds.has(e.id))
      const chosenArr = paths.filter((_, i) => selectedPaths.has(i))

      for (let idx = 0; idx < chosenArr.length; idx++) {
        const path = chosenArr[idx]
        if (!path) continue

        // Resolve career vector via majority rule from path's projects
        const vectorCounts = {}
        const questFormats = []

        // Check projects for vectors, fall back to draws_from text matching
        const projectDraws = (path.projects || []).map(p => (p.draws_from || '').toLowerCase()).join(' ')
        const drawsFrom = ((path.draws_from || '') + ' ' + projectDraws).toLowerCase()
        const pathName = (path.name || '').toLowerCase()

        for (const exp of allExps) {
          const expDd = dd[exp.id]
          if (!expDd) continue
          const expLabel = exp.label.toLowerCase()
          if (!drawsFrom.includes(expLabel) && !pathName.includes(expLabel)) continue
          const vecs = expDd.vectors instanceof Set ? [...expDd.vectors] : (expDd.vectors || [])
          const nonHobby = vecs.filter(v => v !== 'hobby')
          nonHobby.forEach(v => { vectorCounts[v] = (vectorCounts[v] || 0) + 1 })
          const fmts = expDd.formats instanceof Set ? expDd.formats : new Set(expDd.formats || [])
          if (fmts.size) {
            getSubNodes(exp.id).filter(s => fmts.has(s.id)).forEach(s => {
              if (!questFormats.includes(s.label)) questFormats.push(s.label)
            })
          }
        }

        // Majority vector
        const questVector = Object.entries(vectorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null

        // Create quest (discovery data only, no path definition)
        const { data: newQuest } = await supabase.from('quests').insert({
          user_id: user.id,
          label: path.name,
          career_id: `dome-bridge-${Date.now()}-${idx}`,
          predicted_state: 'vibe_rise',
          status: 'active',
          career_vector: questVector,
          format_picks: questFormats.length ? questFormats : null,
        }).select('id').single()

        const questId = newQuest?.id
        if (!questId) continue

        // Create quest_experiences for each project under the path
        if (path.projects?.length) {
          await supabase.from('quest_experiences').insert(
            path.projects.map((p, j) => ({
              quest_id: questId,
              user_id: user.id,
              label: p.name,
              status: 'active',
              sort_order: j,
            }))
          )
        }

        // Auto-tag skills (non-blocking)
        import('../lib/questSkillTagger').then(async (m) => {
          const tags = await m.tagQuestSkills(questId, path.name)
          if (tags?.skill_tags?.length) {
            import('../lib/clusterQuestLinker').then(linker =>
              linker.linkNewQuestToClusters(user.id, questId, tags.skill_tags)
            ).catch(() => {})
          }
        }).catch(() => {})
      }

      // Write life_path_sessions row so Paths tab auto-unlocks
      await supabase.from('life_path_sessions').insert({
        client_name: user.email || user.id,
        client_email: user.email || null,
        careers: chosenArr.map((p, i) => ({ id: `dome-${i}`, label: p.name, predictedState: 'vibe_rise' })),
        stuck_points: [],
        step: 'complete',
      }).then(() => {}).catch(() => {})

      hapticSuccess()
      goTo(STEPS.DONE)
    } catch (err) {
      console.error('Quest creation failed:', err)
      goTo(STEPS.PROJECTS)
    }
  }, [user, paths, selectedPaths, goTo, vibeRise, fun, selectedIds])

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
              <div className="cqf-step"><div className="cqf-step-num">1</div><div className="cqf-step-text">Which experiences do you want to have</div></div>
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

    const canProceed = dd.vectors.size > 0 && (!hasFormats || dd.formats.size > 0)
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
              {hasFormats && dd.formats.size === 0 ? 'Pick at least one format' : dd.vectors.size === 0 ? 'Pick at least one role' : isLast ? 'Show me life paths →' : 'Next →'}
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

  // ── PROJECTS (user removes ones they don't want) ──
  if (step === STEPS.PROJECTS) {
    const activeCount = activeProjects.length
    return (
      <div className="cqf">
        <div className="cqf-container">
          <div className="cqf-paths-header">
            <h2>Projects you could pursue</h2>
            <p>Remove any that don't excite you. Keep the ones that make you think "yes, that."</p>
          </div>

          {aiError && (
            <div className="cqf-error">
              Something went wrong generating projects.
              <button onClick={callAI}>Try again</button>
            </div>
          )}

          {projects.map((project, i) => (
            <div key={i} className={`cqf-path ${removedProjects.has(i) ? 'cqf-path-removed' : 'selected'}`} onClick={() => toggleRemoveProject(i)}>
              <div className="cqf-path-top">
                <div className="cqf-path-check">{removedProjects.has(i) ? '✕' : '✓'}</div>
                <div>
                  <div className="cqf-path-name">{project.name}</div>
                  <div className="cqf-path-desc">{project.description}</div>
                  {project.draws_from && (
                    <div className="cqf-path-sources">
                      {project.draws_from
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
                  {project.draws_from?.toLowerCase().includes('wild card') && (
                    <div className="cqf-path-wild">Wild card</div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="cqf-add-own">
            {!showCustomProject ? (
              <button onClick={() => setShowCustomProject(true)}>+ Add your own project</button>
            ) : (
              <div className="cqf-custom-input">
                <input type="text" value={customProjectInput} onChange={e => setCustomProjectInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customProjectInput.trim()) {
                      setProjects(prev => [...prev, { name: customProjectInput.trim(), description: 'Your own project idea', draws_from: 'custom' }])
                      setCustomProjectInput('')
                      setShowCustomProject(false)
                      hapticLight()
                    }
                  }}
                  placeholder="Type your project idea..." autoFocus />
                <button disabled={!customProjectInput.trim()} onClick={() => {
                  if (!customProjectInput.trim()) return
                  setProjects(prev => [...prev, { name: customProjectInput.trim(), description: 'Your own project idea', draws_from: 'custom' }])
                  setCustomProjectInput('')
                  setShowCustomProject(false)
                  hapticLight()
                }}>Add</button>
              </div>
            )}
          </div>

          <div className="cqf-fixed">
            <button className="cqf-cta cqf-cta-gold" disabled={activeCount === 0} onClick={proceedFromProjects}>
              {activeCount === 0 ? 'Keep at least 1 →' : activeCount === 1 ? 'Continue →' : `Group ${activeCount} into paths →`}
            </button>
            <button className="cqf-cta cqf-cta-secondary" onClick={() => { setProjects([]); setRemovedProjects(new Set()); goTo(STEPS.SELECT) }}>← Change experiences</button>
          </div>
        </div>
      </div>
    )
  }

  // ── CLUSTERING (loading state while AI groups projects into paths) ──
  if (step === STEPS.CLUSTERING) {
    return (
      <div className="cqf">
        <div className="cqf-container">
          <div className="cqf-processing">
            <div className="cqf-spinner" />
            <h2>Grouping your projects into life paths...</h2>
            <p>Finding the distinct directions in what you've chosen.</p>
          </div>
        </div>
      </div>
    )
  }

  // ── PATHS REVIEW (after clustering — user confirms/edits) ──
  if (step === STEPS.PATHS_REVIEW) {
    const updatePathName = (idx, newName) => {
      setPaths(prev => prev.map((p, i) => i === idx ? { ...p, name: newName } : p))
    }
    const togglePathSelection = (idx) => {
      hapticLight()
      setSelectedPaths(prev => {
        const next = new Set(prev)
        if (next.has(idx)) next.delete(idx)
        else next.add(idx)
        return next
      })
    }
    const moveProject = (fromPathIdx, projectIdx, toPathIdx) => {
      hapticLight()
      setPaths(prev => {
        const next = prev.map(p => ({ ...p, projects: [...(p.projects || [])] }))
        const [project] = next[fromPathIdx].projects.splice(projectIdx, 1)
        next[toPathIdx].projects.push(project)
        // Remove empty paths, rebuild clean
        const cleaned = next.filter(p => p.projects.length > 0)
        // Reindex selectedPaths to match cleaned array
        const newSelected = new Set()
        cleaned.forEach((_, ci) => newSelected.add(ci))
        // Use setTimeout to avoid nested setState in updater
        setTimeout(() => setSelectedPaths(newSelected), 0)
        return cleaned
      })
      setMovePopover(null)
    }
    const activePaths = paths.filter((_, i) => selectedPaths.has(i))

    // Only show move option when there are 2+ paths
    const canMove = paths.length >= 2
    return (
      <div className="cqf">
        <div className="cqf-container">
          <div className="cqf-paths-header">
            <h2>Your life paths</h2>
            <p>{canMove ? 'Rename paths, move projects between them, or remove a path.' : 'All your projects are under one path.'}</p>
          </div>

          {clusterError && (
            <div className="cqf-error">
              Something went wrong grouping projects.
              <button onClick={proceedFromProjects}>Try again</button>
            </div>
          )}

          {paths.map((path, i) => (
            <div key={i} className={`cqf-path ${selectedPaths.has(i) ? 'selected' : 'cqf-path-removed'}`}>
              <div className="cqf-path-top">
                <div className="cqf-path-check" onClick={() => togglePathSelection(i)}>
                  {selectedPaths.has(i) ? '✓' : '✕'}
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    className="cqf-path-name-edit"
                    value={path.name}
                    onChange={e => updatePathName(i, e.target.value)}
                  />
                  <div className="cqf-path-desc">{path.description}</div>
                  {path.projects?.length > 0 && (
                    <div className="cqf-projects-section">
                      <div className="cqf-projects-label">Projects:</div>
                      {canMove && <div className="cqf-projects-hint">Tap to move between paths</div>}
                      <div className="cqf-projects-list">
                        {path.projects.map((p, j) => (
                          <div key={j} className="cqf-project-wrap">
                            <span className="cqf-project-tag" onClick={canMove ? (e) => {
                              e.stopPropagation()
                              const isOpen = movePopover?.fromPath === i && movePopover?.projectIdx === j
                              setMovePopover(isOpen ? null : { fromPath: i, projectIdx: j })
                            } : undefined}>
                              {p.name}{canMove ? ' ↕' : ''}
                            </span>
                            {canMove && movePopover?.fromPath === i && movePopover?.projectIdx === j && (
                              <div className="cqf-move-popover">
                                <div className="cqf-move-label">Move to:</div>
                                {paths.map((op, oi) => oi !== i && (
                                  <button key={oi} className="cqf-move-option" onClick={(e) => {
                                    e.stopPropagation()
                                    moveProject(i, j, oi)
                                  }}>
                                    {op.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="cqf-fixed">
            <button className="cqf-cta cqf-cta-gold" disabled={activePaths.length === 0} onClick={confirmPaths}>
              {activePaths.length === 0 ? 'Select at least 1 →' : 'These look right →'}
            </button>
            <button className="cqf-cta cqf-cta-secondary" onClick={() => goTo(STEPS.PROJECTS)}>
              ← Go back and change projects
            </button>
          </div>
        </div>
      </div>
    )
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
