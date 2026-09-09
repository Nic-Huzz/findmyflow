/**
 * QuestBoardCard — Collapsible quest card for the Quests tab.
 * Shows a life path being actively pursued with its tasks.
 * Option A visual design: progressive disclosure, collapsible experiences.
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { STATE_META } from './LifePathMap/lifePaths'
import { supabase } from '../lib/supabaseClient'
import { getDimensionById } from '../data/domeDimensions'
import { LIFE_FUEL_CHANNELS, CHANNEL_IDS } from '../data/channelMapping'
import HealingFlowModal from './HealingFlowModal'
import GroanCompletionModal from './GroanCompletionModal'
import WahooCreator from './WahooCreator'
import './QuestBoardCard.css'

const STATE_LABELS = {
  vibe_rise: 'Vibe Rise',
  fun: 'Fun',
  pressure: 'Stressful',
  uninterested: 'Bored',
}

const STATE_EMOJI = { vibe_rise: '🔥', fun: '😊', pressure: '😰', uninterested: '😐' }

export default function QuestBoardCard({ quest, tasks, experiences = [], userId, onUpdate }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [taskInput, setTaskInput] = useState('')
  const [showTaskInput, setShowTaskInput] = useState(false)
  const [showWahooCreator, setShowWahooCreator] = useState(false)
  const [wahooCreatorText, setWahooCreatorText] = useState('')
  const [saving, setSaving] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showRenameProject, setShowRenameProject] = useState(false)
  const [renaming, setRenaming] = useState(null) // null | 'quest' | expId
  const [renameText, setRenameText] = useState('')
  const renameRef = useRef(null)
  const renameSavingRef = useRef(false)
  const [healingTaskId, setHealingTaskId] = useState(null)
  const [healingTaskText, setHealingTaskText] = useState('')
  const [healingExistingData, setHealingExistingData] = useState(null)
  const [healingIntentions, setHealingIntentions] = useState({})
  const [outcomeTaskId, setOutcomeTaskId] = useState(null)
  const [groanModalChallenge, setGroanModalChallenge] = useState(null)
  const [signalTaskId, setSignalTaskId] = useState(null)
  const [expandedTaskId, setExpandedTaskId] = useState(null)
  const [collapsedExps, setCollapsedExps] = useState(new Set())
  const [addingProject, setAddingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const addProjectRef = useRef(null)
  const [challengeDims, setChallengeDims] = useState({})
  const [challengeDimValues, setChallengeDimValues] = useState({})
  const [reRatingExpId, setReRatingExpId] = useState(null)
  const inputRef = useRef(null)

  const stateMeta = STATE_META[quest.predicted_state]
  const courageCount = tasks.filter(t => t.is_courage_challenge).length
  const courageDoneCount = tasks.filter(t => t.is_courage_challenge && t.done).length
  const taskIdKey = tasks.map(t => t.id).join(',')

  // Load healing intentions for all tasks
  useEffect(() => {
    if (!tasks.length) return
    const taskIds = tasks.map(t => t.id)
    supabase
      .from('healing_intentions')
      .select('quest_task_id, pattern, healing_stage, expectation_text, outcome')
      .in('quest_task_id', taskIds)
      .then(({ data }) => {
        if (data) {
          const byTask = {}
          data.forEach(h => { byTask[h.quest_task_id] = h })
          setHealingIntentions(byTask)
        }
      })
  }, [taskIdKey])

  // Load expansion dimensions for courage challenges
  useEffect(() => {
    const groanIds = tasks.filter(t => t.groan_challenge_id).map(t => t.groan_challenge_id)
    if (!groanIds.length) return
    supabase
      .from('groan_challenges')
      .select('id, expansion_dimensions, dimension_values')
      .in('id', groanIds)
      .then(({ data }) => {
        if (data) {
          const dims = {}
          const vals = {}
          data.forEach(g => {
            dims[g.id] = g.expansion_dimensions || []
            vals[g.id] = g.dimension_values || {}
          })
          setChallengeDims(dims)
          setChallengeDimValues(vals)
        }
      })
  }, [taskIdKey])

  const addTask = async () => {
    if (!taskInput.trim() || saving) return
    setSaving(true)
    try {
      const { error } = await supabase.from('quest_tasks').insert({
        quest_id: quest.id,
        user_id: userId,
        text: taskInput.trim(),
        is_courage_challenge: false,
        sort_order: tasks.length,
        timeframe: 'week',
      }).select('id').single()

      if (error) console.error('Add task error:', error)
      else {
        setTaskInput('')
        await supabase.rpc('increment_scores', {
          p_user_id: userId, p_project_id: null, p_category: 'courage', p_points: 2,
        }).catch(() => {})
        onUpdate?.()
      }
    } catch (e) { console.error('Add task error:', e) }
    setSaving(false)
  }

  const toggleTask = async (task) => {
    const newDone = !task.done

    if (newDone && task.is_courage_challenge) {
      if (!task.groan_challenge_id) return
      if (groanModalChallenge) return
      try {
        const { data: gc } = await supabase
          .from('groan_challenges').select('*')
          .eq('id', task.groan_challenge_id).single()
        if (gc && gc.status !== 'completed') {
          setGroanModalChallenge(gc)
          return
        }
      } catch (e) {
        console.warn('Error fetching groan challenge:', e)
        return
      }
    }

    const { error } = await supabase.from('quest_tasks')
      .update({
        done: newDone,
        completed_at: newDone ? new Date().toISOString() : null,
        ...((!newDone && task.is_courage_challenge) ? { safety_status: null } : {}),
      })
      .eq('id', task.id)
    if (error) console.error('Toggle task error:', error)

    if (task.groan_challenge_id) {
      await supabase.from('groan_challenges')
        .update({ status: newDone ? 'completed' : 'accepted', completed_at: newDone ? new Date().toISOString() : null })
        .eq('id', task.groan_challenge_id)
    }

    if (newDone && !task.is_courage_challenge) {
      supabase.rpc('increment_scores', {
        p_user_id: userId, p_project_id: null, p_category: 'courage', p_points: 3,
      }).catch(() => {})
    }
    if (!newDone && !task.is_courage_challenge) {
      supabase.rpc('increment_scores', {
        p_user_id: userId, p_project_id: null, p_category: 'courage', p_points: -3,
      }).catch(() => {})
    }

    const hi = healingIntentions[task.id]
    if (newDone && hi?.expectation_text && !hi?.outcome) {
      setOutcomeTaskId(task.id)
    }

    if (newDone && !task.is_courage_challenge && !task.task_signal) {
      setSignalTaskId(task.id)
      return
    }

    onUpdate?.()
  }

  const handleOutcome = async (taskId, outcome) => {
    await supabase.from('healing_intentions')
      .update({ outcome, updated_at: new Date().toISOString() })
      .eq('quest_task_id', taskId)
    supabase.rpc('increment_scores', {
      p_user_id: userId, p_project_id: null, p_category: 'healing', p_points: 2,
    }).catch(() => {})
    setOutcomeTaskId(null)
    onUpdate?.()
  }

  const handleTaskSignal = async (taskId, signal) => {
    setSignalTaskId(null)
    await supabase.from('quest_tasks').update({ task_signal: signal }).eq('id', taskId)
    onUpdate?.()
  }

  const closeQuest = async (reason) => {
    const status = reason === 'achieved' ? 'completed' : 'closed'
    const { error } = await supabase.from('quests')
      .update({ status, close_reason: reason, updated_at: new Date().toISOString() })
      .eq('id', quest.id)
    if (error) console.error('Close quest error:', error)
    else {
      if (reason === 'achieved') {
        supabase.rpc('increment_scores', {
          p_user_id: userId, p_project_id: null, p_category: 'courage', p_points: 10,
        }).catch(() => {})

        supabase.from('quests')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('close_reason', 'achieved')
          .then(({ count }) => {
            if (count === 1) import('../lib/mysteryBoxes').then(m => m.earnMysteryBox(userId, 'first_quest_achieved', 'silver'))
          }).then(() => {}).catch(() => {})
      }
      setShowClose(false)
      setShowMenu(false)
      onUpdate?.()
    }
  }

  const saveRename = async () => {
    if (renameSavingRef.current || !renameText.trim()) return
    renameSavingRef.current = true
    if (renaming === 'quest') {
      await supabase.from('quests').update({ label: renameText.trim() }).eq('id', quest.id)
    } else if (renaming) {
      await supabase.from('quest_experiences').update({ label: renameText.trim() }).eq('id', renaming)
    }
    setRenaming(null)
    setRenameText('')
    renameSavingRef.current = false
    onUpdate?.()
  }

  const startRename = (type, currentName) => {
    setRenaming(type)
    setRenameText(currentName)
    setShowMenu(false)
    setTimeout(() => renameRef.current?.focus(), 50)
  }

  const reRateExperience = async (expId, newState) => {
    const { error } = await supabase.from('quest_experiences')
      .update({ capacity_state: newState, updated_at: new Date().toISOString() })
      .eq('id', expId)
    if (error) console.error('Re-rate experience error:', error)
    setReRatingExpId(null)
    onUpdate?.()
  }

  const addProject = async () => {
    if (!newProjectName.trim()) return
    const { error } = await supabase.from('quest_experiences').insert({
      quest_id: quest.id,
      user_id: userId,
      label: newProjectName.trim(),
      capacity_state: null,
    })
    if (error) console.error('Add project error:', error)
    setAddingProject(false)
    setNewProjectName('')
    onUpdate?.()
  }

  const toggleExp = (expId) => {
    setReRatingExpId(null)
    setCollapsedExps(prev => {
      const next = new Set(prev)
      if (next.has(expId)) next.delete(expId)
      else next.add(expId)
      return next
    })
  }

  const activeExperiences = experiences.filter(e => e.status === 'active')
  const hasExperiences = activeExperiences.length > 0
  const incomplete = tasks.filter(t => !t.done)
  const completed = tasks.filter(t => t.done)

  const getDims = (task) => {
    if (!task.groan_challenge_id) return []
    return challengeDims[task.groan_challenge_id] || []
  }
  const getDimVals = (task) => {
    if (!task.groan_challenge_id) return {}
    return challengeDimValues[task.groan_challenge_id] || {}
  }

  const renderTaskRow = (task) => {
    const dims = getDims(task)
    const hasDims = dims.length > 0
    const isTaskExpanded = expandedTaskId === task.id
    return (
    <div key={task.id}>
      <div
        className={`qbc-task-row ${isTaskExpanded ? 'qbc-task-row--expanded' : ''}`}
        onClick={hasDims ? () => setExpandedTaskId(isTaskExpanded ? null : task.id) : undefined}
      >
        <button className="qbc-check" onClick={(e) => { e.stopPropagation(); toggleTask(task) }} />
        <div className="qbc-task-content">
          <div className="qbc-task-text">{task.text}</div>
        </div>
        <div className="qbc-task-icons">
          {task.is_courage_challenge && (
            <button className="qbc-icon-btn" onClick={(e) => {
              e.stopPropagation()
              if (task.done) return
              setHealingTaskId(task.id)
              setHealingTaskText(task.text || '')
              setHealingExistingData(healingIntentions[task.id] || null)
            }} title={!task.done ? 'Feeling stuck?' : undefined}>
              <span className="qbc-icon-courage">⚡</span>
            </button>
          )}
          {healingIntentions[task.id] && <span className="qbc-icon-heal">💚</span>}
          {hasDims && <span className="qbc-dim-hint">{isTaskExpanded ? '▴' : '▾'}</span>}
        </div>
      </div>
      {isTaskExpanded && hasDims && (
        <div className="qbc-dims">
          {dims.map(d => {
            const dim = getDimensionById(d)
            if (!dim) return null
            const val = getDimVals(task)[d]
            let tierLabel = null
            if (val != null) {
              if (dim.type === 'numeric') {
                tierLabel = val
              } else {
                const tier = dim.levels?.find(l => l.level === val)
                tierLabel = tier?.label || `Level ${val}`
              }
            }
            return (
              <div key={d} className="qbc-dim-row">
                <span className="qbc-dim-name">{dim.icon} {dim.label}:</span>
                <span className="qbc-dim-value">{tierLabel || 'Not set'}</span>
              </div>
            )
          })}
        </div>
      )}
      {signalTaskId === task.id && (
        <div className="qbc-signal-row">
          <button className="qbc-signal-btn" onClick={() => handleTaskSignal(task.id, 'lit_me_up')}>🔥 Lit me up</button>
          <button className="qbc-signal-btn" onClick={() => handleTaskSignal(task.id, 'was_okay')}>😐 Was okay</button>
          <button className="qbc-signal-btn" onClick={() => handleTaskSignal(task.id, 'bored')}>😴 Bored</button>
        </div>
      )}
    </div>
  )}

  const renderCompletedRow = (task) => (
    <div key={task.id} className="qbc-task-row qbc-task-row--done">
      <button className="qbc-check qbc-check--done" onClick={() => toggleTask(task)}>✓</button>
      <div className="qbc-task-content">
        <div className="qbc-task-text">{task.text}</div>
      </div>
      <div className="qbc-task-icons">
        {task.is_courage_challenge && <span className="qbc-icon-courage">⚡</span>}
        {healingIntentions[task.id] && <span className="qbc-icon-heal">💚</span>}
      </div>
    </div>
  )

  return (
    <div className="qbc">
      {/* Header */}
      <div className="qbc-header">
        <div className="qbc-header-main" onClick={() => { setExpanded(!expanded); setShowMenu(false) }}>
          <div className="qbc-dot" style={{ background: quest.color || stateMeta?.color || '#6b7280' }} />
          {renaming === 'quest' ? (
            <input ref={renameRef} className="qbc-rename-input" value={renameText}
              onChange={e => setRenameText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setRenaming(null) }}
              onBlur={saveRename}
              onClick={e => e.stopPropagation()} />
          ) : (
            <div className="qbc-title">{quest.label}</div>
          )}
          {courageCount > 0 && (
            <div className="qbc-badge">{courageDoneCount}/{courageCount}</div>
          )}
          <div className="qbc-chevron">{expanded ? '▴' : '▾'}</div>
        </div>
        <button className="qbc-menu-trigger" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); setShowClose(false); setShowRenameProject(false) }}>···</button>
        {showMenu && (
          <div className="qbc-menu-dropdown">
            {!showClose && !showRenameProject ? (
              <>
                <button className="qbc-menu-item" onClick={() => startRename('quest', quest.label)}>Rename path</button>
                <button className="qbc-menu-item" disabled={!hasExperiences} onClick={() => hasExperiences && setShowRenameProject(true)}>Rename project</button>
                <button className="qbc-menu-item" onClick={() => { setAddingProject(true); setShowMenu(false); setExpanded(true); setTimeout(() => addProjectRef.current?.focus(), 50) }}>Add project</button>
                <button className="qbc-menu-item" onClick={() => setShowClose(true)}>Close path</button>
              </>
            ) : showRenameProject ? (
              <div className="qbc-close-options">
                <div className="qbc-close-title">Which project?</div>
                {activeExperiences.map(exp => (
                  <button key={exp.id} className="qbc-close-btn" onClick={() => { startRename(exp.id, exp.label); setShowRenameProject(false) }}>{exp.label}</button>
                ))}
                <button className="qbc-close-cancel" onClick={() => { setShowRenameProject(false); setShowMenu(false) }}>Cancel</button>
              </div>
            ) : (
              <div className="qbc-close-options">
                <div className="qbc-close-title">Close "{quest.label}"?</div>
                <button className="qbc-close-btn achieved" onClick={() => closeQuest('achieved')}>🎉 I achieved it!</button>
                <button className="qbc-close-btn lost" onClick={() => closeQuest('lost_interest')}>🤔 Lost interest</button>
                <button className="qbc-close-btn paused" onClick={() => closeQuest('not_right_time')}>⏳ Not the right time</button>
                <button className="qbc-close-cancel" onClick={() => { setShowClose(false); setShowMenu(false) }}>Cancel</button>
              </div>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div className="qbc-body">

          {/* Current job reference — show life fuels instead of define CTA */}
          {quest.is_current_job && quest.life_fuel_baseline && (
            <div className="qbc-fuel-summary">
              {CHANNEL_IDS.map(id => {
                const ch = LIFE_FUEL_CHANNELS[id]
                const has = quest.life_fuel_baseline[id]
                return (
                  <div key={id} className={`qbc-fuel-row ${has ? 'has' : 'missing'}`}>
                    <span>{ch.emoji}</span>
                    <span className="qbc-fuel-name">{ch.name}</span>
                    <span className="qbc-fuel-status">{has ? '✓' : 'missing'}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Define path CTA — shows when quest has no current_dimensions (not for current job reference) */}
          {(!quest.current_dimensions || Object.keys(quest.current_dimensions).length === 0) && !(quest.is_current_job && quest.status === 'reference') && (
            <button className="qbc-define-cta" onClick={() => navigate(`/path-definition/${quest.id}`)}>
              Define this path →
            </button>
          )}

          {/* Experience sections (collapsible) */}
          {hasExperiences && activeExperiences.map(exp => {
            const expTasks = incomplete.filter(t => t.experience_id === exp.id)
            const isCollapsed = collapsedExps.has(exp.id)
            const isReRating = reRatingExpId === exp.id
            return (
              <div key={exp.id} className="qbc-exp">
                <div className="qbc-exp-header" onClick={() => toggleExp(exp.id)}>
                  <span className="qbc-exp-icon">›</span>
                  {renaming === exp.id ? (
                    <input ref={renameRef} className="qbc-rename-input qbc-rename-exp" value={renameText}
                      onChange={e => setRenameText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setRenaming(null) }}
                      onBlur={saveRename}
                      onClick={e => e.stopPropagation()} />
                  ) : (
                    <span className="qbc-exp-name" onDoubleClick={(e) => { e.stopPropagation(); startRename(exp.id, exp.label) }}>{exp.label}</span>
                  )}
                  {isReRating ? (
                    <div className="qbc-exp-rerate" onClick={e => e.stopPropagation()}>
                      {['vibe_rise', 'fun', 'pressure', 'uninterested'].map(s => (
                        <button key={s}
                          className={`qbc-rerate-btn qbc-rerate-btn--${s} ${exp.capacity_state === s ? 'current' : ''}`}
                          onClick={() => reRateExperience(exp.id, s)}>
                          {STATE_EMOJI[s]}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      className={`qbc-exp-state qbc-exp-state--${exp.capacity_state || 'none'}`}
                      onClick={(e) => { e.stopPropagation(); setReRatingExpId(exp.id) }}
                      title="Tap to update">
                      {STATE_LABELS[exp.capacity_state] || 'Rate'}
                    </button>
                  )}
                  <span className="qbc-exp-chevron">{isCollapsed ? '▸' : '▾'}</span>
                </div>
                {!isCollapsed && (
                  <div className="qbc-exp-tasks">
                    {expTasks.length > 0
                      ? expTasks.map(renderTaskRow)
                      : <div className="qbc-exp-empty">All tasks done</div>
                    }
                  </div>
                )}
              </div>
            )
          })}

          {/* Unassigned tasks */}
          {(() => {
            const ungrouped = incomplete.filter(t => !t.experience_id)
            if (ungrouped.length === 0) return null
            return (
              <div className="qbc-ungrouped">
                {hasExperiences && <div className="qbc-ungrouped-label">Other tasks</div>}
                {ungrouped.map(renderTaskRow)}
              </div>
            )
          })()}

          {/* Completed tasks */}
          {completed.length > 0 && (
            <button className="qbc-completed-toggle" onClick={() => setShowAllTasks(!showAllTasks)}>
              {showAllTasks ? 'Hide completed' : `${completed.length} completed`}
            </button>
          )}
          {showAllTasks && (
            <div className="qbc-completed-list">
              {completed.map(renderCompletedRow)}
            </div>
          )}

          {/* Outcome prompt */}
          {outcomeTaskId && (
            <div className="qbc-outcome-prompt">
              <div className="qbc-outcome-text">Did the positive outcome happen?</div>
              <div className="qbc-outcome-actions">
                <button className="qbc-outcome-btn qbc-outcome-yes" onClick={() => handleOutcome(outcomeTaskId, 'yes')}>Yes</button>
                <button className="qbc-outcome-btn qbc-outcome-no" onClick={() => handleOutcome(outcomeTaskId, 'no')}>No</button>
                <button className="qbc-outcome-btn qbc-outcome-better" onClick={() => handleOutcome(outcomeTaskId, 'something_better')}>Something better</button>
              </div>
            </div>
          )}

          {/* Add project inline input */}
          {addingProject && (
            <div className="qbc-add-project">
              <input
                ref={addProjectRef}
                className="qbc-input"
                type="text"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addProject(); if (e.key === 'Escape') { setAddingProject(false); setNewProjectName('') } }}
                placeholder="Project name..."
              />
              <div className="qbc-add-project-actions">
                <button className="qbc-add-project-save" onClick={addProject} disabled={!newProjectName.trim()}>Add</button>
                <button className="qbc-add-project-cancel" onClick={() => { setAddingProject(false); setNewProjectName('') }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Add buttons */}
          <div className="qbc-add-actions">
            <button className="qbc-add-courage-btn" onClick={() => {
              setWahooCreatorText('')
              setShowWahooCreator(true)
            }}>
              ⚡ Add courage challenge
            </button>
            <button className="qbc-add-task-btn" onClick={() => { setShowTaskInput(true); setTimeout(() => inputRef.current?.focus(), 50) }}>
              + Add task
            </button>
          </div>
          {incomplete.some(t => t.is_courage_challenge) && (
            <button className="qbc-stuck-hint" onClick={() => {
              const firstCourage = incomplete.find(t => t.is_courage_challenge)
              if (firstCourage) {
                setHealingTaskId(firstCourage.id)
                setHealingTaskText(firstCourage.text || '')
                setHealingExistingData(healingIntentions[firstCourage.id] || null)
              }
            }}>
              Feeling stuck with a challenge?
            </button>
          )}

          {/* Inline task input */}
          {showTaskInput && (
            <div className="qbc-add-row">
              <input
                ref={inputRef}
                className="qbc-input"
                type="text"
                value={taskInput}
                onChange={e => setTaskInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTask(); if (e.key === 'Escape') { setShowTaskInput(false); setTaskInput('') } }}
                placeholder="What needs doing?"
              />
              <button className="qbc-add-btn" onClick={addTask} disabled={!taskInput.trim() || saving}>
                Add
              </button>
            </div>
          )}

        </div>
      )}

      {/* Healing Flow Modal */}
      {healingTaskId && (
        <HealingFlowModal
          taskText={healingTaskText}
          userId={userId}
          questTaskId={healingTaskId}
          existingData={healingExistingData}
          onComplete={() => { setHealingTaskId(null); setHealingTaskText(''); setHealingExistingData(null); onUpdate?.() }}
          onClose={() => { setHealingTaskId(null); setHealingTaskText(''); setHealingExistingData(null) }}
        />
      )}

      {/* Courage Completion Modal */}
      {groanModalChallenge && (
        <GroanCompletionModal
          challenge={groanModalChallenge}
          userId={userId}
          onComplete={() => { setGroanModalChallenge(null); onUpdate?.() }}
          onClose={() => setGroanModalChallenge(null)}
        />
      )}

      {/* WahooCreator popup */}
      {showWahooCreator && (
        <div className="wc-modal-overlay" onClick={() => setShowWahooCreator(false)}>
          <div className="wc-modal" onClick={e => e.stopPropagation()}>
            <button className="wc-modal-close" onClick={() => setShowWahooCreator(false)}>&times;</button>
            <WahooCreator
              userId={userId}
              initialText={wahooCreatorText}
              initialQuestId={quest.id}
              initialSourceLabel={quest.label}
              onWahooAccepted={() => {
                setShowWahooCreator(false)
                setTaskInput('')
                onUpdate?.()
              }}
              onClose={() => { setShowWahooCreator(false); setTaskInput('') }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
