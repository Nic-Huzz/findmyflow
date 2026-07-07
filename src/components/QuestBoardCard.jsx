/**
 * QuestBoardCard — Collapsible quest card for the Quests tab.
 * Shows a life path being actively pursued with its tasks.
 * Option C: after courage tag, prompts "Want to explore what makes this scary?"
 */

import { useState, useEffect, useRef } from 'react'
import { STATE_META } from './LifePathMap/lifePaths'
import { supabase } from '../lib/supabaseClient'
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
import { getWeekStartLocal } from '../lib/dateUtils'
import HealingFlowModal from './HealingFlowModal'
import './QuestBoardCard.css'

export default function QuestBoardCard({ quest, tasks, userId, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [taskInput, setTaskInput] = useState('')
  const [isCourage, setIsCourage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [healingTaskId, setHealingTaskId] = useState(null) // which task's healing modal is open
  const [healingTaskText, setHealingTaskText] = useState('')
  const [healingPromptTaskId, setHealingPromptTaskId] = useState(null) // show "explore fear?" prompt
  const [healingPromptStep, setHealingPromptStep] = useState('ask') // 'ask' | 'when'
  const [healingIntentions, setHealingIntentions] = useState({}) // { taskId: healingIntention }
  const [outcomeTaskId, setOutcomeTaskId] = useState(null) // show outcome prompt after completion
  const inputRef = useRef(null)

  const stateMeta = STATE_META[quest.predicted_state]
  const completedCount = tasks.filter(t => t.done).length
  const totalCount = tasks.length

  // Load healing intentions for all tasks
  // Stable dependency: join task IDs into a string so it only re-fetches when tasks actually change
  const taskIdKey = tasks.map(t => t.id).join(',')
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
    setSaving(true)
    try {
      let groanId = null
      if (isCourage) {
        const { data: dbRecord } = await createGroanChallenge({
          userId,
          title: taskInput.trim(),
          description: `Life path: ${quest.label}`,
          visibilityLayer: 'screen',
          sourceType: 'life_path',
          sourceLabel: quest.label,
          scaryScore: 5,
          wahooScore: 5,
          wahooCategory: null,
        })
        if (dbRecord) {
          await acceptGroanChallenge(dbRecord.id)
          await supabase.from('priority_weekly_picks').upsert({
            user_id: userId,
            week_start_date: getWeekStartLocal(),
            pick_type: 'groan',
            reference_id: dbRecord.id,
            display_name: taskInput.trim(),
          }, { onConflict: 'user_id,week_start_date,pick_type,reference_id', ignoreDuplicates: true })
          groanId = dbRecord.id
        }
      }

      const { data: insertedTask, error } = await supabase.from('quest_tasks').insert({
        quest_id: quest.id,
        user_id: userId,
        text: taskInput.trim(),
        is_courage_challenge: isCourage,
        groan_challenge_id: groanId,
        sort_order: totalCount,
      }).select('id').single()

      if (error) console.error('Add task error:', error)
      else {
        const savedText = taskInput.trim()
        setTaskInput('')
        setIsCourage(false)

        // Option C: if courage tagged, show healing prompt
        if (isCourage && insertedTask?.id) {
          setHealingPromptTaskId(insertedTask.id)
          setHealingTaskText(savedText)
        }

        // Award 2 RP for adding a quest task
        await supabase.from('quest_completions').insert({
          user_id: userId,
          quest_id: `quest_created_${Date.now()}`,
          quest_category: 'Quests',
          quest_type: 'Practice',
          points_earned: 2,
          challenge_day: 0,
          project_id: null,
        })

        onUpdate?.()
      }
    } catch (e) { console.error('Add task error:', e) }
    setSaving(false)
  }

  const toggleTask = async (task) => {
    const newDone = !task.done
    const { error } = await supabase.from('quest_tasks')
      .update({ done: newDone, completed_at: newDone ? new Date().toISOString() : null })
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
      }).catch(() => {})
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
        }).catch(() => {})
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
        </div>
        <div className="qbc-chevron">{expanded ? '▴' : '▾'}</div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="qbc-body">
          {/* Task list */}
          {tasks.length > 0 && (
            <div className="qbc-tasks">
              {tasks.map(task => (
                <div key={task.id} className={`qbc-task ${task.done ? 'done' : ''}`}>
                  <button className={`qbc-check ${task.done ? 'checked' : ''}`} onClick={() => toggleTask(task)}>
                    {task.done ? '✓' : ''}
                  </button>
                  <span className="qbc-task-text">{task.text}</span>
                  {task.is_courage_challenge && <span className="qbc-courage-badge">⚡</span>}
                  {healingIntentions[task.id] && (
                    <span className="qbc-healing-badge" title="Healing flow completed">💚</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Healing prompt (Option C) — appears after adding a courage task */}
          {healingPromptTaskId && healingPromptStep === 'ask' && (
            <div className="qbc-healing-prompt">
              <div className="qbc-healing-prompt-text">Want to explore what makes this scary?</div>
              <div className="qbc-healing-prompt-actions">
                <button className="qbc-healing-prompt-yes"
                  onClick={() => setHealingPromptStep('when')}>
                  Yes, dig in 💚
                </button>
                <button className="qbc-healing-prompt-no"
                  onClick={() => { setHealingPromptTaskId(null); setHealingPromptStep('ask') }}>
                  No, just do it ⚡
                </button>
              </div>
            </div>
          )}

          {healingPromptTaskId && healingPromptStep === 'when' && (
            <div className="qbc-healing-prompt">
              <div className="qbc-healing-prompt-text">Deep dive now?</div>
              <div className="qbc-healing-prompt-actions">
                <button className="qbc-healing-prompt-yes"
                  onClick={() => { setHealingTaskId(healingPromptTaskId); setHealingPromptTaskId(null); setHealingPromptStep('ask') }}>
                  Now 💚
                </button>
                <button className="qbc-healing-prompt-later"
                  onClick={async () => {
                    try {
                      await supabase.from('healing_intentions').upsert({
                        quest_task_id: healingPromptTaskId,
                        user_id: userId,
                        healing_stage: 'in_progress',
                        updated_at: new Date().toISOString(),
                      }, { onConflict: 'quest_task_id' })
                    } catch (e) { /* non-blocking */ }
                    setHealingPromptTaskId(null)
                    setHealingPromptStep('ask')
                  }}>
                  Later
                </button>
              </div>
              <div className="qbc-healing-prompt-hint">You can always continue from the Healing tab</div>
            </div>
          )}

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
          <label className="qbc-courage-toggle">
            <input type="checkbox" checked={isCourage} onChange={e => setIsCourage(e.target.checked)} />
            <span>⚡ Tag as courage challenge</span>
          </label>

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
          onComplete={() => { setHealingTaskId(null); setHealingTaskText(''); onUpdate?.() }}
          onClose={() => { setHealingTaskId(null); setHealingTaskText('') }}
        />
      )}
    </div>
  )
}
