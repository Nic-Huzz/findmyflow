/**
 * QuestBoardCard — Collapsible quest card for the Quests tab.
 * Shows a life path being actively pursued with its tasks.
 */

import { useState, useRef } from 'react'
import { STATE_META } from './LifePathMap/lifePaths'
import { supabase } from '../lib/supabaseClient'
import { createGroanChallenge, acceptGroanChallenge } from '../lib/crm/groanChallengeService'
import { getWeekStartLocal } from '../lib/dateUtils'
import './QuestBoardCard.css'

export default function QuestBoardCard({ quest, tasks, userId, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [taskInput, setTaskInput] = useState('')
  const [isCourage, setIsCourage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const inputRef = useRef(null)

  const stateMeta = STATE_META[quest.predicted_state]
  const completedCount = tasks.filter(t => t.done).length
  const totalCount = tasks.length

  const addTask = async () => {
    if (!taskInput.trim() || saving) return
    setSaving(true)
    try {
      let groanId = null
      // If tagged as courage challenge, create groan_challenges entry
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

      const { error } = await supabase.from('quest_tasks').insert({
        quest_id: quest.id,
        user_id: userId,
        text: taskInput.trim(),
        is_courage_challenge: isCourage,
        groan_challenge_id: groanId,
        sort_order: totalCount,
      })
      if (error) console.error('Add task error:', error)
      else {
        setTaskInput('')
        setIsCourage(false)
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
    else onUpdate?.()
  }

  const closeQuest = async (reason) => {
    const status = reason === 'achieved' ? 'completed' : 'closed'
    const { error } = await supabase.from('quests')
      .update({ status, close_reason: reason, updated_at: new Date().toISOString() })
      .eq('id', quest.id)
    if (error) console.error('Close quest error:', error)
    else { setShowClose(false); onUpdate?.() }
  }

  return (
    <div className={`qbc ${expanded ? 'qbc-expanded' : ''}`}>
      {/* Collapsed header — always visible */}
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
                </div>
              ))}
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
    </div>
  )
}
