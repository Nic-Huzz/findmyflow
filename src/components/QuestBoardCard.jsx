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

export default function QuestBoardCard({ quest, tasks, userId, onUpdate }) {
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
  const [courageTrend, setCourageTrend] = useState([]) // last N wahoo classifications
  const [topIdentity, setTopIdentity] = useState(null) // { text, count }
  const inputRef = useRef(null)

  const stateMeta = STATE_META[quest.predicted_state]
  const completedCount = tasks.filter(t => t.done).length
  const totalCount = tasks.length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const taskIdKey = tasks.map(t => t.id).join(',')

  // Load courage trend + top identity when expanded
  useEffect(() => {
    if (!expanded || !quest.id) return
    // Courage trend: last 8 wahoo classifications for this quest's challenges
    const groanIds = tasks.filter(t => t.groan_challenge_id).map(t => t.groan_challenge_id)
    if (groanIds.length > 0) {
      supabase.from('quest_completions')
        .select('reflection_text')
        .eq('user_id', userId)
        .eq('quest_category', 'Groans')
        .not('reflection_text', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200)
        .then(({ data }) => {
          if (!data) return
          const trend = []
          const stmtCounts = {}
          data.forEach(row => {
            try {
              const parsed = JSON.parse(row.reflection_text)
              if (parsed.challenge_id && groanIds.includes(parsed.challenge_id)) {
                if (parsed.wahoo_classification) trend.push(parsed.wahoo_classification)
                if (parsed.identity_statement) {
                  const s = parsed.identity_statement.trim().toLowerCase()
                  if (s) stmtCounts[s] = (stmtCounts[s] || 0) + 1
                }
              }
            } catch {}
          })
          setCourageTrend(trend.slice(0, 8).reverse())
          const top = Object.entries(stmtCounts).sort((a, b) => b[1] - a[1])[0]
          if (top) setTopIdentity({ text: top[0], count: top[1] })
        })
    }
  }, [expanded, quest.id, taskIdKey]) // eslint-disable-line react-hooks/exhaustive-deps

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
      }).select('id').single()

      if (error) console.error('Add task error:', error)
      else {
        setTaskInput('')

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

  return (
    <div className={`qbc ${expanded ? 'qbc-expanded' : ''}`}>
      {/* Collapsed header */}
      <div className="qbc-header" onClick={() => setExpanded(!expanded)}>
        <div className="qbc-state-dot" style={{ background: stateMeta?.color || '#6b7280' }} />
        <div className="qbc-info">
          <div className="qbc-label">{quest.label}</div>
          <div className="qbc-meta">
            <span className="qbc-state-name" style={{ color: stateMeta?.color }}>{stateMeta?.label || 'Unknown'}</span>
            {totalCount > 0 && <span className="qbc-progress"> · {completedCount}/{totalCount} tasks</span>}
          </div>
          {totalCount > 0 && (
            <div className="qbc-progress-bar">
              <div className="qbc-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          )}
        </div>
        <div className="qbc-chevron">{expanded ? '▴' : '▾'}</div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="qbc-body">
          {/* Courage trend + identity + zone warning */}
          {courageTrend.length > 0 && (
            <div className="qbc-insights">
              <div className="qbc-trend">
                {courageTrend.map((c, i) => (
                  <span key={i} className="qbc-trend-dot" title={c}>
                    {c === 'vibe' || c === 'wahoo' ? '🔥' : c === 'peace' ? '😌' : c === 'anxious' ? '😰' : '😶'}
                  </span>
                ))}
              </div>
              {topIdentity && (
                <div className="qbc-top-identity">
                  "I am someone who {topIdentity.text}" <span className="qbc-identity-count">{'\u00D7'}{topIdentity.count}</span>
                </div>
              )}
              {courageTrend.length >= 3 && courageTrend.slice(-3).every(c => c === 'anxious') && (
                <div className="qbc-zone-warning">
                  You're skilled here but it doesn't light you up. This might be your Zone of Excellence.
                </div>
              )}
            </div>
          )}

          {/* Task list */}
          {tasks.length > 0 && (
            <div className="qbc-tasks">
              {(() => {
                const incomplete = tasks.filter(t => !t.done)
                const completed = tasks.filter(t => t.done)
                const TIMEFRAME_ORDER = { week: 0, month: 1, quarter: 2 }
                const TIMEFRAME_LABELS = { week: 'This week', month: 'This month', quarter: 'This quarter' }
                const grouped = { week: [], month: [], quarter: [] }
                incomplete.forEach(t => {
                  const tf = t.timeframe || 'week'
                  if (grouped[tf]) grouped[tf].push(t)
                  else grouped.week.push(t)
                })
                const hasMultipleTimeframes = Object.values(grouped).filter(g => g.length > 0).length > 1

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
          <div className="qbc-task-options">
            <label className="qbc-courage-toggle">
              <input type="checkbox" checked={isCourage} onChange={e => setIsCourage(e.target.checked)} />
              <span>⚡ Courage challenge</span>
            </label>
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
    </div>
  )
}
