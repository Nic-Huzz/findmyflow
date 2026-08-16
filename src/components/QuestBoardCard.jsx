/**
 * QuestBoardCard — Collapsible quest card for the Quests tab.
 * Shows a life path being actively pursued with its tasks.
 * Option C: after courage tag, prompts "Want to explore what makes this scary?"
 */

import { useState, useEffect, useRef } from 'react'
import { STATE_META } from './LifePathMap/lifePaths'
import { supabase } from '../lib/supabaseClient'
import HealingFlowModal from './HealingFlowModal'
import GroanCompletionModal from './GroanCompletionModal'
import WahooCreator from './WahooCreator'
import './QuestBoardCard.css'

const QUEST_COLOURS = [
  { id: '#5e17eb', label: 'Purple' },
  { id: '#10b981', label: 'Emerald' },
  { id: '#E9A23B', label: 'Gold' },
  { id: '#ef4444', label: 'Red' },
  { id: '#3b82f6', label: 'Blue' },
  { id: '#ec4899', label: 'Pink' },
  { id: '#14b8a6', label: 'Teal' },
  { id: '#f97316', label: 'Orange' },
  { id: '#8b5cf6', label: 'Violet' },
  { id: '#06b6d4', label: 'Cyan' },
]

export default function QuestBoardCard({ quest, tasks, experiences = [], userId, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [taskInput, setTaskInput] = useState('')
  const [taskTimeframe, setTaskTimeframe] = useState('week')
  const [isCourage, setIsCourage] = useState(false)
  const [showWahooCreator, setShowWahooCreator] = useState(false)
  const [wahooCreatorText, setWahooCreatorText] = useState('')
  const [saving, setSaving] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [healingTaskId, setHealingTaskId] = useState(null) // which task's healing modal is open
  const [healingTaskText, setHealingTaskText] = useState('')
  const [healingExistingData, setHealingExistingData] = useState(null)
  const [healingIntentions, setHealingIntentions] = useState({}) // { taskId: healingIntention }
  const [outcomeTaskId, setOutcomeTaskId] = useState(null) // show outcome prompt after completion
  const [groanModalChallenge, setGroanModalChallenge] = useState(null) // courage completion modal
  const [signalTaskId, setSignalTaskId] = useState(null) // which task is showing "lit me up" prompt
  // Experience state
  const [showAddExperience, setShowAddExperience] = useState(false)
  const [experienceInput, setExperienceInput] = useState('')
  const [experienceState, setExperienceState] = useState(null)
  const [experienceSaving, setExperienceSaving] = useState(false)
  const [taskExperienceId, setTaskExperienceId] = useState(null) // which experience a new to-do is for
  const [reRatingExpId, setReRatingExpId] = useState(null) // which experience is being re-rated
  const [showAssignTasks, setShowAssignTasks] = useState(false) // bulk assign ungrouped tasks to experiences
  const [showMapCompleted, setShowMapCompleted] = useState(false) // popup to map completed challenges
  const [showColorPicker, setShowColorPicker] = useState(false)
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

  const addTask = async () => {
    if (!taskInput.trim() || saving) return

    // Courage challenge → open WahooCreator for depth + visibility capture
    if (isCourage) {
      setWahooCreatorText(taskInput.trim())
      setShowWahooCreator(true)
      return
    }

    // Regular task → save inline
    setSaving(true)
    try {
      const { error } = await supabase.from('quest_tasks').insert({
        quest_id: quest.id,
        user_id: userId,
        text: taskInput.trim(),
        is_courage_challenge: false,
        sort_order: totalCount,
        timeframe: taskTimeframe,
        experience_id: taskExperienceId || null,
      }).select('id').single()

      if (error) console.error('Add task error:', error)
      else {
        setTaskInput('')
        setTaskExperienceId(null)

        // Award 2 RP for adding a quest task
        await supabase.from('quest_completions').insert({
          user_id: userId,
          quest_id: `quest_created_${Date.now()}`,
          quest_category: 'Quests',
          quest_type: 'Practice',
          points_earned: 2,
          challenge_day: 0,
          project_id: null,
        }).then(() => {}).catch(() => {})

        onUpdate?.()
      }
    } catch (e) { console.error('Add task error:', e) }
    setSaving(false)
  }

  const toggleTask = async (task) => {
    const newDone = !task.done

    // Intercept: courage challenge completion → open GroanCompletionModal
    if (newDone && task.is_courage_challenge) {
      if (!task.groan_challenge_id) return // cannot complete courage task without groan challenge link
      if (groanModalChallenge) return // already handling a completion
      try {
        const { data: gc } = await supabase
          .from('groan_challenges').select('*')
          .eq('id', task.groan_challenge_id).single()
        if (gc && gc.status !== 'completed') {
          setGroanModalChallenge(gc)
          return // modal handles all DB updates (done, safety_status, RP, etc.)
        }
      } catch (e) {
        console.warn('Error fetching groan challenge:', e)
        return // don't silently complete without classification
      }
    }

    const { error } = await supabase.from('quest_tasks')
      .update({
        done: newDone,
        completed_at: newDone ? new Date().toISOString() : null,
        // Clear safety_status when un-completing a courage task
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
      supabase.from('quest_completions').insert({
        user_id: userId,
        quest_id: `quest_task_${task.id}`,
        quest_category: 'Quests',
        quest_type: 'Practice',
        points_earned: 3,
        challenge_day: 0,
        project_id: null,
      }).then(() => {}).catch(() => {})
    }
    if (!newDone && !task.is_courage_challenge) {
      supabase.from('quest_completions').delete()
        .eq('user_id', userId)
        .eq('quest_id', `quest_task_${task.id}`)
        .catch(() => {})
    }

    // Show outcome prompt if task has healing intention with expectation
    const hi = healingIntentions[task.id]
    if (newDone && hi?.expectation_text && !hi?.outcome) {
      setOutcomeTaskId(task.id)
    }

    // Show "lit me up" signal for non-courage tasks (only if not already signalled)
    if (newDone && !task.is_courage_challenge && !task.task_signal) {
      setSignalTaskId(task.id)
      return // defer onUpdate until signal is answered
    }

    onUpdate?.()
  }

  const handleOutcome = async (taskId, outcome) => {
    await supabase.from('healing_intentions')
      .update({ outcome, updated_at: new Date().toISOString() })
      .eq('quest_task_id', taskId)
    // Bonus 2 RP for completing outcome check
    supabase.from('quest_completions').insert({
      user_id: userId,
      quest_id: `healing_outcome_${taskId}`,
      quest_category: 'Healing',
      quest_type: 'Practice',
      points_earned: 2,
      challenge_day: 0,
      project_id: null,
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
        supabase.from('quest_completions').insert({
          user_id: userId,
          quest_id: `quest_achieved_${quest.id}`,
          quest_category: 'Quests',
          quest_type: 'Practice',
          points_earned: 10,
          challenge_day: 0,
          project_id: null,
        }).then(() => {}).catch(() => {})

        // Mystery box: first quest achieved
        supabase.from('quests')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('close_reason', 'achieved')
          .then(({ count }) => {
            if (count === 1) import('../lib/mysteryBoxes').then(m => m.earnMysteryBox(userId, 'first_quest_achieved', 'silver'))
          }).then(() => {}).catch(() => {})
      }
      setShowClose(false); onUpdate?.()
    }
  }

  const activeExperiences = experiences.filter(e => e.status === 'active')
  const hasExperiences = activeExperiences.length > 0

  const addExperience = async () => {
    if (!experienceInput.trim() || !experienceState || experienceSaving) return
    setExperienceSaving(true)
    try {
      const { error } = await supabase.from('quest_experiences').insert({
        quest_id: quest.id,
        user_id: userId,
        label: experienceInput.trim(),
        capacity_state: experienceState,
        sort_order: experiences.length,
      })
      if (error) console.error('Add experience error:', error)
      else {
        setExperienceInput('')
        setExperienceState(null)
        setShowAddExperience(false)
        onUpdate?.()
      }
    } catch (e) { console.error('Add experience error:', e) }
    setExperienceSaving(false)
  }

  const reRateExperience = async (expId, newState) => {
    const { error } = await supabase.from('quest_experiences')
      .update({ capacity_state: newState, updated_at: new Date().toISOString() })
      .eq('id', expId)
    if (error) console.error('Re-rate experience error:', error)
    setReRatingExpId(null)
    onUpdate?.()
  }

  const assignTaskToExperience = async (taskId, expId) => {
    const { error } = await supabase.from('quest_tasks')
      .update({ experience_id: expId })
      .eq('id', taskId)
    if (error) console.error('Assign task error:', error)
    else onUpdate?.()
  }

  const setQuestColor = async (color) => {
    if (!quest.id) return
    const { error } = await supabase.from('quests')
      .update({ color })
      .eq('id', quest.id)
    if (error) console.error('Set quest color error:', error)
    setShowColorPicker(false)
    onUpdate?.()
  }

  return (
    <div className={`qbc ${expanded ? 'qbc-expanded' : ''}`}>
      {/* Collapsed header */}
      <div className="qbc-header" onClick={() => { setExpanded(!expanded); setShowColorPicker(false) }}>
        <div className="qbc-color-dot"
          style={{ background: quest.color || stateMeta?.color || '#6b7280' }}
          onClick={(e) => { e.stopPropagation(); if (expanded) setShowColorPicker(!showColorPicker) }}
          title="Change color"
        />
        <div className="qbc-info">
          <div className="qbc-label">{quest.label}</div>
          <div className="qbc-meta">
            <span className="qbc-state-name" style={{ color: stateMeta?.color }}>{stateMeta?.label || 'Unknown'}</span>
            {courageCount > 0 && <span className="qbc-progress"> · ⚡ {courageDoneCount}/{courageCount} courage</span>}
          </div>
        </div>
        <div className="qbc-chevron">{expanded ? '▴' : '▾'}</div>
      </div>
      {/* Color picker */}
      {showColorPicker && (
        <div className="qbc-color-picker">
          {QUEST_COLOURS.map(c => (
            <button key={c.id} className={`qbc-color-swatch ${quest.color === c.id ? 'active' : ''}`}
              style={{ background: c.id }}
              onClick={() => setQuestColor(c.id)}
              title={c.label}
            />
          ))}
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="qbc-body">
          {/* Add experience — always at top (hierarchy: life path → experiences → tasks) */}
          {!showAddExperience && (
            <button className="qbc-add-experience-btn" onClick={() => setShowAddExperience(true)}>
              + Add experience
            </button>
          )}
          {showAddExperience && (
            <div className="qbc-add-experience">
              <div className="qbc-add-exp-title">What experience are you building toward?</div>
              <input
                className="qbc-input"
                type="text"
                value={experienceInput}
                onChange={e => setExperienceInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && experienceState && addExperience()}
                placeholder="e.g. Lead a public class, run a retreat..."
                autoFocus
              />
              <div className="qbc-add-exp-label">How does imagining this feel right now?</div>
              <div className="qbc-exp-state-picker">
                {[
                  { id: 'vibe_rise', emoji: '🔥', label: 'Vibe Rise' },
                  { id: 'fun', emoji: '😊', label: 'Fun' },
                  { id: 'pressure', emoji: '😰', label: 'Pressure' },
                  { id: 'uninterested', emoji: '😐', label: 'Not for me' },
                ].map(s => (
                  <button key={s.id}
                    className={`qbc-exp-pick-btn qbc-exp-pick-btn--${s.id} ${experienceState === s.id ? 'active' : ''}`}
                    onClick={() => setExperienceState(s.id)}>
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
              <div className="qbc-add-exp-actions">
                <button className="qbc-add-btn" onClick={addExperience}
                  disabled={!experienceInput.trim() || !experienceState || experienceSaving}>
                  Save
                </button>
                <button className="qbc-close-cancel" onClick={() => { setShowAddExperience(false); setExperienceInput(''); setExperienceState(null) }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Task list */}
          {tasks.length > 0 && (
            <div className="qbc-tasks">
              {(() => {
                const incomplete = tasks.filter(t => !t.done)
                const completed = tasks.filter(t => t.done)

                const renderTask = (task) => (
                  <div key={task.id}>
                    <div className="qbc-task">
                      <button className="qbc-check" onClick={() => toggleTask(task)} />
                      <span className="qbc-task-text">{task.text}</span>
                      {task.is_courage_challenge && <span className="qbc-courage-badge">⚡</span>}
                      {healingIntentions[task.id] && <span className="qbc-healing-badge" title="Healing flow">💚</span>}
                    </div>
                    {signalTaskId === task.id && (
                      <div className="qbc-signal-row">
                        <button className="qbc-signal-btn" onClick={() => handleTaskSignal(task.id, 'lit_me_up')}>🔥 Lit me up</button>
                        <button className="qbc-signal-btn" onClick={() => handleTaskSignal(task.id, 'was_okay')}>😐 Was okay</button>
                        <button className="qbc-signal-btn" onClick={() => handleTaskSignal(task.id, 'bored')}>😴 Bored</button>
                      </div>
                    )}
                  </div>
                )

                // If experiences exist: group to-dos under experiences, courage challenges separate
                if (hasExperiences) {
                  const STATE_EMOJI = { vibe_rise: '🔥', fun: '😊', pressure: '😰', uninterested: '😐' }
                  const STATE_LABEL = { vibe_rise: 'Vibe Rise', fun: 'Fun', pressure: 'Pressure', uninterested: 'Not for me' }

                  return (
                    <>
                      {/* Experience sections with their to-dos */}
                      {activeExperiences.map(exp => {
                        const expTasks = incomplete.filter(t => t.experience_id === exp.id)
                        const expCompleted = completed.filter(t => t.experience_id === exp.id)
                        const isReRating = reRatingExpId === exp.id
                        return (
                          <div key={exp.id} className="qbc-experience-section">
                            <div className="qbc-exp-header">
                              <span className="qbc-exp-icon">🎯</span>
                              <span className="qbc-exp-label">{exp.label}</span>
                              {isReRating ? (
                                <div className="qbc-exp-rerate">
                                  {['vibe_rise', 'fun', 'pressure', 'uninterested'].map(s => (
                                    <button key={s} className={`qbc-exp-state-btn qbc-exp-state-btn--${s} ${exp.capacity_state === s ? 'current' : ''}`}
                                      onClick={() => reRateExperience(exp.id, s)}>
                                      {STATE_EMOJI[s]}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <button className="qbc-exp-state-badge"
                                  onClick={(e) => { e.stopPropagation(); setReRatingExpId(exp.id) }}
                                  title={`${STATE_LABEL[exp.capacity_state] || 'Not rated'}, tap to update`}>
                                  {STATE_EMOJI[exp.capacity_state] || '?'} {STATE_LABEL[exp.capacity_state] || 'Rate'}
                                </button>
                              )}
                            </div>
                            {expTasks.map(renderTask)}
                            {expCompleted.length > 0 && expTasks.length === 0 && (
                              <div className="qbc-exp-all-done">All tasks done</div>
                            )}
                          </div>
                        )
                      })}

                      {/* Unassigned tasks + courage challenges */}
                      {(() => {
                        const unassigned = incomplete.filter(t => !t.experience_id)
                        if (unassigned.length === 0) return null
                        return (
                          <div className="qbc-experience-section">
                            <div className="qbc-exp-header">
                              <span className="qbc-exp-icon">☑️</span>
                              <span className="qbc-exp-label qbc-exp-label-muted">Unassigned</span>
                              {!showAssignTasks ? (
                                <button className="qbc-assign-btn" onClick={() => setShowAssignTasks(true)}>
                                  Assign
                                </button>
                              ) : (
                                <button className="qbc-assign-btn" onClick={() => setShowAssignTasks(false)}>
                                  Done
                                </button>
                              )}
                            </div>
                            {unassigned.map(task => (
                              <div key={`assign-${task.id}`}>
                                <div className="qbc-task">
                                  <button className="qbc-check" onClick={() => toggleTask(task)} />
                                  <span className="qbc-task-text">{task.text}</span>
                                  {task.is_courage_challenge && <span className="qbc-courage-badge">⚡</span>}
                                  {healingIntentions[task.id] && <span className="qbc-healing-badge" title="Healing flow">💚</span>}
                                </div>
                                {signalTaskId === task.id && (
                                  <div className="qbc-signal-row">
                                    <button className="qbc-signal-btn" onClick={() => handleTaskSignal(task.id, 'lit_me_up')}>🔥 Lit me up</button>
                                    <button className="qbc-signal-btn" onClick={() => handleTaskSignal(task.id, 'was_okay')}>😐 Was okay</button>
                                    <button className="qbc-signal-btn" onClick={() => handleTaskSignal(task.id, 'bored')}>😴 Bored</button>
                                  </div>
                                )}
                                {showAssignTasks && (
                                  <div className="qbc-assign-pills">
                                    {activeExperiences.map(exp => (
                                      <button key={exp.id} className="qbc-exp-pill"
                                        onClick={() => assignTaskToExperience(task.id, exp.id)}>
                                        🎯 {exp.label.length > 18 ? exp.label.slice(0, 18) + '...' : exp.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )
                      })()}

                      {/* Completed + map unmapped */}
                      {(() => {
                        const unmappedCompleted = completed.filter(t => !t.experience_id)
                        return (
                          <>
                            {completed.length > 0 && (
                              <div className="qbc-completed-row">
                                <button className="qbc-show-more" onClick={(e) => { e.stopPropagation(); setShowAllTasks(!showAllTasks) }}>
                                  {showAllTasks ? 'Hide completed' : `Show ${completed.length} completed`}
                                </button>
                                {unmappedCompleted.length > 0 && (
                                  <button className="qbc-map-btn" onClick={() => setShowMapCompleted(true)}>
                                    Map {unmappedCompleted.length} unmapped
                                  </button>
                                )}
                              </div>
                            )}
                            {showAllTasks && completed.map(task => (
                              <div key={task.id} className="qbc-task done">
                                <button className="qbc-check checked" onClick={() => toggleTask(task)}>✓</button>
                                <span className="qbc-task-text">{task.text}</span>
                                {task.is_courage_challenge && <span className="qbc-courage-badge">⚡</span>}
                                {healingIntentions[task.id] && <span className="qbc-healing-badge" title="Healing flow">💚</span>}
                              </div>
                            ))}
                          </>
                        )
                      })()}
                    </>
                  )
                }

                // No experiences: existing timeframe grouping
                const TIMEFRAME_ORDER = { week: 0, month: 1, quarter: 2 }
                const TIMEFRAME_LABELS = { week: 'This week', month: 'This month', quarter: 'This quarter' }
                const grouped = { week: [], month: [], quarter: [] }
                incomplete.forEach(t => {
                  const tf = t.timeframe || 'week'
                  if (grouped[tf]) grouped[tf].push(t)
                  else grouped.week.push(t)
                })
                const hasMultipleTimeframes = Object.values(grouped).filter(g => g.length > 0).length > 1

                return (
                  <>
                    {hasMultipleTimeframes
                      ? Object.entries(grouped)
                          .sort(([a], [b]) => TIMEFRAME_ORDER[a] - TIMEFRAME_ORDER[b])
                          .filter(([, items]) => items.length > 0)
                          .map(([tf, items]) => (
                            <div key={tf} className="qbc-timeframe-group">
                              <div className="qbc-timeframe-label">{TIMEFRAME_LABELS[tf]}</div>
                              {items.map(renderTask)}
                            </div>
                          ))
                      : incomplete.map(renderTask)
                    }
                    {completed.length > 0 && (
                      <button className="qbc-show-more" onClick={(e) => { e.stopPropagation(); setShowAllTasks(!showAllTasks) }}>
                        {showAllTasks ? 'Hide completed' : `Show ${completed.length} completed`}
                      </button>
                    )}
                    {showAllTasks && completed.map(task => (
                      <div key={task.id} className="qbc-task done">
                        <button className="qbc-check checked" onClick={() => toggleTask(task)}>✓</button>
                        <span className="qbc-task-text">{task.text}</span>
                        {task.is_courage_challenge && <span className="qbc-courage-badge">⚡</span>}
                        {healingIntentions[task.id] && <span className="qbc-healing-badge" title="Healing flow">💚</span>}
                      </div>
                    ))}
                  </>
                )
              })()}
            </div>
          )}

          {/* Healing prompt removed — healing flow opens directly as bottom sheet */}

          {/* Outcome prompt — appears after completing a task with healing expectation */}
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

          {/* Add task input */}
          <div className="qbc-add-row">
            <input
              ref={inputRef}
              className="qbc-input"
              type="text"
              value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="Add a task..."
            />
            <button className="qbc-add-btn" onClick={addTask} disabled={!taskInput.trim() || saving}>
              Add
            </button>
          </div>
          {/* Task options — only show when typing */}
          {taskInput.trim() && (
            <div className="qbc-task-options-stack">
              {/* Experience assignment */}
              {hasExperiences && (
                <div className="qbc-option-row">
                  <span className="qbc-option-label">What experience?</span>
                  <div className="qbc-exp-pills">
                    <button className={`qbc-exp-pill ${!taskExperienceId ? 'active' : ''}`}
                      onClick={() => setTaskExperienceId(null)}>General</button>
                    {activeExperiences.map(exp => (
                      <button key={exp.id} className={`qbc-exp-pill ${taskExperienceId === exp.id ? 'active' : ''}`}
                        onClick={() => setTaskExperienceId(exp.id)}>
                        {exp.label.length > 20 ? exp.label.slice(0, 20) + '...' : exp.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Courage toggle */}
              <div className="qbc-option-row">
                <span className="qbc-option-label">Is this a courage challenge?</span>
                <label className="qbc-courage-toggle">
                  <input type="checkbox" checked={isCourage} onChange={e => setIsCourage(e.target.checked)} />
                  <span>⚡ Yes</span>
                </label>
              </div>
              {/* Timeframe */}
              <div className="qbc-option-row">
                <span className="qbc-option-label">When will you do it?</span>
                <div className="qbc-timeframe-picker">
                  {['week', 'month', 'quarter'].map(tf => (
                    <button
                      key={tf}
                      className={`qbc-tf-btn ${taskTimeframe === tf ? 'active' : ''}`}
                      onClick={() => setTaskTimeframe(tf)}
                      type="button"
                    >
                      {tf === 'week' ? 'This week' : tf === 'month' ? 'This month' : 'This quarter'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Close quest */}
          {!showClose ? (
            <button className="qbc-close-trigger" onClick={() => setShowClose(true)}>
              Close quest ›
            </button>
          ) : (
            <div className="qbc-close-options">
              <div className="qbc-close-title">Close "{quest.label}"?</div>
              <button className="qbc-close-btn achieved" onClick={() => closeQuest('achieved')}>🎉 I achieved it!</button>
              <button className="qbc-close-btn lost" onClick={() => closeQuest('lost_interest')}>🤔 Lost interest</button>
              <button className="qbc-close-btn paused" onClick={() => closeQuest('not_right_time')}>⏳ Not the right time</button>
              <button className="qbc-close-cancel" onClick={() => setShowClose(false)}>Cancel</button>
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

      {/* WahooCreator popup for courage challenges */}
      {showWahooCreator && (
        <div className="wc-modal-overlay" onClick={() => setShowWahooCreator(false)}>
          <div className="wc-modal" onClick={e => e.stopPropagation()}>
            <button className="wc-modal-close" onClick={() => setShowWahooCreator(false)}>&times;</button>
            <WahooCreator
              userId={userId}
              initialText={wahooCreatorText}
              initialQuestId={quest.id}
              initialSourceLabel={quest.label}
              onWahooAccepted={(healingTask, voiceId) => {
                setShowWahooCreator(false)
                setTaskInput('')
                setIsCourage(false)
                onUpdate?.()
                // If user chose "dive in now", open HealingFlowModal with voice pre-filled
                if (healingTask?.id) {
                  setHealingTaskId(healingTask.id)
                  setHealingTaskText(healingTask.text || '')
                  setHealingExistingData(voiceId ? { pattern: voiceId } : null)
                }
              }}
              onClose={() => { setShowWahooCreator(false); setTaskInput(''); setIsCourage(false) }}
            />
          </div>
        </div>
      )}

      {/* Map completed challenges to experiences */}
      {showMapCompleted && (
        <div className="wc-modal-overlay" onClick={() => setShowMapCompleted(false)}>
          <div className="qbc-map-modal" onClick={e => e.stopPropagation()}>
            <button className="wc-modal-close" onClick={() => setShowMapCompleted(false)}>&times;</button>
            <div className="qbc-map-modal-title">Map completed challenges</div>
            <div className="qbc-map-modal-sub">Assign past challenges to the experiences they built toward</div>
            <div className="qbc-map-modal-list">
              {tasks.filter(t => t.done && !t.experience_id).map(task => (
                <div key={task.id} className="qbc-map-item">
                  <div className="qbc-map-item-text">
                    {task.is_courage_challenge && <span className="qbc-courage-badge">⚡</span>}
                    {task.text}
                  </div>
                  <div className="qbc-assign-pills">
                    {activeExperiences.map(exp => (
                      <button key={exp.id} className="qbc-exp-pill"
                        onClick={() => assignTaskToExperience(task.id, exp.id)}>
                        🎯 {exp.label.length > 18 ? exp.label.slice(0, 18) + '...' : exp.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.done && !t.experience_id).length === 0 && (
                <div className="qbc-map-modal-empty">All challenges mapped</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
