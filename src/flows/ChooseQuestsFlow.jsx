/**
 * ChooseQuestsFlow.jsx — /choose-quests
 *
 * Phase 1→2 bridge: Dome experiences → AI life path suggestions → quest creation.
 * Flow: Intro → Select Experiences → Processing → Pick Paths → Stuck Points → Done
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useDomeData } from '../hooks/useDomeData'
import { getDomeExperiencesForBridge, groupByPrimal, formatDomeForPrompt } from '../lib/domeSummary'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import { getWeekStartLocal } from '../lib/dateUtils'
import './ChooseQuestsFlow.css'

const STEPS = {
  INTRO: 'intro',
  SELECT: 'select',
  PROCESSING: 'processing',
  PATHS: 'paths',
  STUCK: 'stuck',
  SAVING: 'saving',
  DONE: 'done',
}

export default function ChooseQuestsFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { domeStates, loading: domeLoading } = useDomeData(user?.id)
  const spNextId = useRef(1)

  const [step, setStep] = useState(STEPS.INTRO)
  const [essenceArchetype, setEssenceArchetype] = useState(null)

  // Select step
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showFun, setShowFun] = useState(false)

  // Paths step
  const [paths, setPaths] = useState([])
  const [selectedPaths, setSelectedPaths] = useState(new Set())
  const [customInput, setCustomInput] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [aiError, setAiError] = useState(null)

  // Stuck points step
  const [stuckPoints, setStuckPoints] = useState([])
  const [stuckInput, setStuckInput] = useState('')
  const [currentPathIdx, setCurrentPathIdx] = useState(null)
  const [activeSpId, setActiveSpId] = useState(null)
  const stuckInputRef = useRef(null)

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
    const domeProfile = formatDomeForPrompt(selectedLabels, domeStates, essenceArchetype)

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

  // ── Stuck points ──
  const addStuckPoint = useCallback((pathIdx) => {
    if (!stuckInput.trim()) return
    const sp = {
      id: 'sp' + spNextId.current++,
      pathIdx,
      text: stuckInput.trim(),
      depthLevel: null,
      wahooCategory: null,
      protectiveVoice: null,
    }
    setStuckPoints(prev => [...prev, sp])
    setStuckInput('')
    setActiveSpId(sp.id)
    setTimeout(() => stuckInputRef.current?.focus(), 50)
  }, [stuckInput])

  const updateStuckField = useCallback((spId, field, value) => {
    setStuckPoints(prev => prev.map(sp => sp.id === spId ? { ...sp, [field]: value } : sp))
  }, [])

  const removeStuckPoint = useCallback((spId) => {
    setStuckPoints(prev => prev.filter(sp => sp.id !== spId))
  }, [])

  // ── Save quests + courage challenges ──
  const saveQuests = useCallback(async () => {
    if (!user?.id) return
    goTo(STEPS.SAVING)

    try {
      for (const pathIdx of selectedPaths) {
        const path = paths[pathIdx]
        if (!path) continue

        // Create quest
        const { data: newQuest } = await supabase.from('quests').insert({
          user_id: user.id,
          label: path.name,
          career_id: `dome-bridge-${Date.now()}-${pathIdx}`,
          predicted_state: 'vibe_rise',
          status: 'active',
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

        // Create courage challenges from stuck points
        const pathStuck = stuckPoints.filter(sp => sp.pathIdx === pathIdx)
        for (const sp of pathStuck) {
          const { data: existingGroan } = await supabase.from('groan_challenges')
            .select('id').eq('user_id', user.id).eq('title', sp.text).limit(1)
          let groanId = existingGroan?.[0]?.id

          if (!groanId) {
            const { data: newGroan } = await supabase.from('groan_challenges').insert({
              user_id: user.id,
              title: sp.text,
              challenge_text: sp.text,
              status: 'active',
              source_type: 'skill',
              challenge_source: 'dome_bridge',
              source_label: path.name,
              scary_score: 5,
              wahoo_score: 5,
              depth_level: sp.depthLevel || null,
              wahoo_category: sp.wahooCategory || null,
              visibility_layer: sp.wahooCategory || 'screen',
              visibility_layers: sp.wahooCategory ? [sp.wahooCategory] : [],
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
                  display_name: sp.text,
                }, { onConflict: 'user_id,week_start_date,pick_type,reference_id', ignoreDuplicates: true })
              } catch {}
            }
          }

          if (groanId) {
            const { data: existingTask } = await supabase.from('quest_tasks')
              .select('id').eq('quest_id', questId).eq('text', sp.text).limit(1)
            if (!existingTask?.length) {
              try {
                const { data: taskRow } = await supabase.from('quest_tasks').insert({
                  quest_id: questId,
                  user_id: user.id,
                  text: sp.text,
                  is_courage_challenge: true,
                  groan_challenge_id: groanId,
                  sort_order: pathStuck.indexOf(sp),
                }).select('id').single()

                if (taskRow?.id && sp.protectiveVoice) {
                  await supabase.from('healing_intentions').upsert({
                    quest_task_id: taskRow.id,
                    user_id: user.id,
                    pattern: sp.protectiveVoice,
                    protective_voice: sp.protectiveVoice,
                    healing_stage: 'in_progress',
                  }, { onConflict: 'quest_task_id' })
                }
              } catch {}
            }
          }
        }
      }

      hapticSuccess()
      goTo(STEPS.DONE)
    } catch (err) {
      console.error('Quest creation failed:', err)
      goTo(STEPS.STUCK)
    }
  }, [user, paths, selectedPaths, stuckPoints, goTo])

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
            <button className="cqf-cta cqf-cta-gold" disabled={n === 0} onClick={callAI}>
              {n === 0 ? 'Select at least 1 →' : 'Show me life paths →'}
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
            <p>Based on what lights you up. Pick 1-3 to pursue as quests.</p>
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
                      {path.draws_from.split(/[,+]/).map((s, j) => {
                        const trimmed = s.trim().replace(/^(and|or)\s+/i, '')
                        return trimmed ? <span key={j} className="cqf-path-source">{trimmed}</span> : null
                      })}
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
            <button className="cqf-cta cqf-cta-gold" disabled={n === 0} onClick={() => goTo(STEPS.STUCK)}>
              {n === 0 ? 'Select at least 1 →' : 'Continue →'}
            </button>
            <button className="cqf-cta cqf-cta-secondary" onClick={() => { setPaths([]); setSelectedPaths(new Set()); setStuckPoints([]); goTo(STEPS.SELECT) }}>← Change experiences</button>
          </div>
        </div>
      </div>
    )
  }

  // ── STUCK POINTS ──
  if (step === STEPS.STUCK) {
    return (
      <div className="cqf">
        <div className="cqf-container">
          <div className="cqf-stuck-header">
            <h2>What have you been putting off?</h2>
            <p>For each path, add the things you've wanted to do but haven't yet. These become your courage challenges.</p>
          </div>

          {chosenPaths.map((path, displayIdx) => {
            const pathIdx = paths.indexOf(path)
            const pStuck = stuckPoints.filter(sp => sp.pathIdx === pathIdx)
            return (
              <div key={pathIdx} className="cqf-stuck-group">
                <div className="cqf-stuck-group-name">
                  <div className="cqf-stuck-group-dot" />
                  {path.name}
                </div>

                {pStuck.map(sp => (
                  <div key={sp.id} className="cqf-stuck-item">
                    <div className="cqf-stuck-item-row">
                      <span className="cqf-stuck-item-text">{sp.text}</span>
                      <span className="cqf-stuck-remove" onClick={() => removeStuckPoint(sp.id)}>✕</span>
                    </div>
                    {activeSpId === sp.id && (
                      <div className="cqf-stuck-selects">
                        <select value={sp.depthLevel || ''} onChange={e => updateStuckField(sp.id, 'depthLevel', e.target.value || null)}>
                          <option value="">Where are you with this?</option>
                          <option value="education">Still learning about it</option>
                          <option value="testing">Starting to test it</option>
                          <option value="practising">Practising it</option>
                          <option value="charging">Getting paid for it</option>
                          <option value="teaching">Teaching others</option>
                        </select>
                        <select value={sp.wahooCategory || ''} onChange={e => updateStuckField(sp.id, 'wahooCategory', e.target.value || null)}>
                          <option value="">What part pushes your boundary?</option>
                          <option value="screen">Sharing it online</option>
                          <option value="live">Doing it in front of people</option>
                          <option value="money">Asking for money</option>
                          <option value="vulnerable">Being emotionally open about it</option>
                          <option value="authority">Claiming expertise</option>
                        </select>
                        <select value={sp.protectiveVoice || ''} onChange={e => updateStuckField(sp.id, 'protectiveVoice', e.target.value || null)}>
                          <option value="">What voice tries to stop you?</option>
                          <option value="controller">Controller (pushes too hard)</option>
                          <option value="ghost">Ghost (disappears, avoids)</option>
                          <option value="people-pleaser">People Pleaser (says yes when you mean no)</option>
                          <option value="auto-pilot">Auto-Pilot (goes through the motions)</option>
                          <option value="perfectionist">Perfectionist (won't start until it's perfect)</option>
                        </select>
                      </div>
                    )}
                    {activeSpId !== sp.id && sp.depthLevel && (
                      <div className="cqf-stuck-badges">
                        {sp.depthLevel && <span className="cqf-stuck-badge depth">{sp.depthLevel}</span>}
                        {sp.wahooCategory && <span className="cqf-stuck-badge wahoo">{sp.wahooCategory}</span>}
                        {sp.protectiveVoice && <span className="cqf-stuck-badge voice">{sp.protectiveVoice}</span>}
                      </div>
                    )}
                  </div>
                ))}

                <div className="cqf-stuck-input">
                  <input type="text" ref={currentPathIdx === pathIdx ? stuckInputRef : undefined}
                    value={currentPathIdx === pathIdx ? stuckInput : ''}
                    onFocus={() => setCurrentPathIdx(pathIdx)}
                    onChange={e => { setCurrentPathIdx(pathIdx); setStuckInput(e.target.value) }}
                    onKeyDown={e => { if (e.key === 'Enter' && stuckInput.trim()) addStuckPoint(pathIdx) }}
                    placeholder="Something you've been putting off..." />
                  <button onClick={() => addStuckPoint(pathIdx)} disabled={currentPathIdx !== pathIdx || !stuckInput.trim()}>Add</button>
                </div>
              </div>
            )
          })}

          <div className="cqf-fixed">
            <button className="cqf-cta cqf-cta-gold" onClick={saveQuests}>
              {stuckPoints.length > 0 ? 'Create my quests →' : 'Create quests (no challenges yet) →'}
            </button>
            <button className="cqf-cta cqf-cta-secondary" onClick={() => goTo(STEPS.PATHS)}>← Change paths</button>
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
            <h2>Quests created</h2>
            <p>Head to your Quests tab to see your active quests and start your first courage challenge.</p>
            <div className="cqf-done-list">
              {chosenPaths.map((path, i) => (
                <div key={i} className="cqf-done-quest">
                  <div className="cqf-done-dot" />
                  <div className="cqf-done-name">{path.name}</div>
                </div>
              ))}
            </div>
            <div className="cqf-fixed">
              <button className="cqf-cta cqf-cta-gold" onClick={() => navigate('/7-day-challenge?tab=Quests')}>
                Go to my quests →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
