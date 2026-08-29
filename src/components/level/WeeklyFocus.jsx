/**
 * WeeklyFocus.jsx — "One courage challenge a week" prompt
 *
 * Flow C:
 *   - No focus set: shows all quests with their courage challenges, user picks one
 *   - Focus active: shows the selected challenge prominently with "I did it!" CTA
 *   - "Change" button reopens the picker
 *
 * "I did it!" triggers the full GroanCompletionModal (NS check-in, reflection, XP).
 * "Feeling stuck?" opens HealingFlowModal for the focused task.
 * "+ Add new" opens WahooCreator to create a courage challenge on a quest.
 *
 * Stored in localStorage as weekly_focus_challenge (resets each Monday).
 */

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { getWeekStartLocal } from '../../lib/dateUtils'
import { hapticLight, hapticSuccess } from '../../lib/haptics'
import GroanCompletionModal from '../GroanCompletionModal'
import HealingFlowModal from '../HealingFlowModal'
import WahooCreator from '../WahooCreator'

const WEEK_KEY_PREFIX = 'weekly_focus_challenge_'

function getWeekKey() {
  return WEEK_KEY_PREFIX + getWeekStartLocal()
}

export default function WeeklyFocus({ quests, questTasks, userId, courageCount = 0, onCompleteCourage, onAddChallenge }) {
  const [focusId, setFocusId] = useState(null) // task ID of the focused challenge
  const [picking, setPicking] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [groanChallenge, setGroanChallenge] = useState(null) // for GroanCompletionModal
  const [healingOpen, setHealingOpen] = useState(false) // for HealingFlowModal
  const [wahooQuestId, setWahooQuestId] = useState(null) // quest ID for WahooCreator
  const [wahooQuestLabel, setWahooQuestLabel] = useState('')
  const [completing, setCompleting] = useState(false) // prevent double-tap

  // Load focus from localStorage
  useEffect(() => {
    const key = getWeekKey()
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setFocusId(parsed.taskId)
        setCompleted(!!parsed.completed)
      } catch { /* ignore */ }
    }
  }, [])

  // All courage challenges across quests, grouped by quest
  const challengesByQuest = useMemo(() => {
    const activeQuests = quests.filter(q => q.status === 'active' && q.label !== 'Healing Work')
    return activeQuests.map(q => {
      const tasks = (questTasks[q.id] || []).filter(t => t.is_courage_challenge && !t.done)
      return { quest: q, challenges: tasks }
    }).filter(g => g.challenges.length > 0)
  }, [quests, questTasks])

  // Active quests (for "Add new" even when quest has no challenges yet)
  const activeQuests = useMemo(() =>
    quests.filter(q => q.status === 'active' && q.label !== 'Healing Work'),
  [quests])

  // Quests with no courage challenges (show "Add new" for these too)
  const questsWithoutChallenges = useMemo(() =>
    activeQuests.filter(q => {
      const tasks = (questTasks[q.id] || []).filter(t => t.is_courage_challenge && !t.done)
      return tasks.length === 0
    }),
  [activeQuests, questTasks])

  // Find the focused challenge + its quest
  const focusedChallenge = useMemo(() => {
    if (!focusId) return null
    for (const group of challengesByQuest) {
      const task = group.challenges.find(t => t.id === focusId)
      if (task) return { task, quest: group.quest }
    }
    // Also check completed tasks in case it was done via QuestBoardCard
    for (const q of quests) {
      const task = (questTasks[q.id] || []).find(t => t.id === focusId)
      if (task) return { task, quest: q }
    }
    return null
  }, [focusId, challengesByQuest, quests, questTasks])

  // Sync: if focused task was completed via QuestBoardCard, update localStorage
  useEffect(() => {
    if (focusedChallenge?.task?.done && !completed) {
      const key = getWeekKey()
      localStorage.setItem(key, JSON.stringify({ taskId: focusId, completed: true }))
      setCompleted(true)
    }
  }, [focusedChallenge?.task?.done, completed, focusId])

  const totalChallenges = challengesByQuest.reduce((sum, g) => sum + g.challenges.length, 0)

  // No quests at all — don't render
  if (activeQuests.length === 0) return null

  const saveFocus = (taskId) => {
    const key = getWeekKey()
    localStorage.setItem(key, JSON.stringify({ taskId, completed: false }))
    setFocusId(taskId)
    setCompleted(false)
    setPicking(false)
    hapticLight()
  }

  // "I did it!" — fetch the groan_challenge and open the full completion modal
  const handleDidIt = async () => {
    if (!focusedChallenge || completing) return
    setCompleting(true)
    const task = focusedChallenge.task

    // Fallback: if no groan_challenge linked, mark task done directly
    if (!task.groan_challenge_id) {
      await supabase.from('quest_tasks')
        .update({ done: true, completed_at: new Date().toISOString() })
        .eq('id', task.id)
      handleCompletionDone()
      return
    }

    try {
      const { data: gc } = await supabase
        .from('groan_challenges').select('*')
        .eq('id', task.groan_challenge_id).single()
      if (gc && gc.status !== 'completed') {
        setGroanChallenge(gc)
      }
    } catch (e) {
      console.warn('WeeklyFocus: error fetching groan challenge:', e)
    }
  }

  // After GroanCompletionModal finishes
  const handleCompletionDone = () => {
    setGroanChallenge(null)
    setCompleting(false)
    const key = getWeekKey()
    localStorage.setItem(key, JSON.stringify({ taskId: focusId, completed: true }))
    setCompleted(true)
    hapticSuccess()
    onCompleteCourage?.(focusedChallenge?.task, focusedChallenge?.quest)
  }

  // STATE: Focus is set and not picking
  if (focusId && focusedChallenge && !picking) {
    return (
      <div className="wf-card">
        <div className="wf-header">
          <span className="wf-label">This week</span>
          <button className="wf-change" onClick={() => setPicking(true)}>Change</button>
        </div>
        <div className={`wf-focus ${completed ? 'wf-completed' : ''}`}>
          <div className="wf-focus-text">{focusedChallenge.task.text}</div>
          <div className="wf-focus-quest">{focusedChallenge.quest.label}</div>
        </div>
        {!completed ? (
          <>
            <button className="wf-action" onClick={handleDidIt}>
              I did it!
            </button>
            <button className="wf-healing-link" onClick={() => setHealingOpen(true)}>
              Feeling stuck? Explore what's blocking you
            </button>
          </>
        ) : (
          <>
            <div className="wf-done-msg">Done! Pick another?</div>
            <button className="wf-action wf-action-secondary" onClick={() => setPicking(true)}>
              Pick another
            </button>
          </>
        )}

        {courageCount > 0 && (
          <div className="wf-counter-inline">
            <span className="wf-counter-num">{courageCount}</span> completed
          </div>
        )}

        {/* Full courage completion flow */}
        {groanChallenge && (
          <GroanCompletionModal
            challenge={groanChallenge}
            userId={userId}
            onComplete={handleCompletionDone}
            onClose={() => { setGroanChallenge(null); setCompleting(false) }}
          />
        )}

        {/* Healing flow for when they're stuck */}
        {healingOpen && (
          <HealingFlowModal
            taskText={focusedChallenge.task.text}
            userId={userId}
            questTaskId={focusedChallenge.task.id}
            existingData={null}
            onComplete={() => setHealingOpen(false)}
            onClose={() => setHealingOpen(false)}
          />
        )}
      </div>
    )
  }

  // STATE: No focus set OR picking mode
  return (
    <div className="wf-card">
      <div className="wf-header">
        <span className="wf-label">Pick your brave action for this week</span>
      </div>
      {totalChallenges === 0 && (
        <div className="wf-empty">
          {courageCount > 0
            ? "All done! Add a new courage challenge to keep going."
            : "No courage challenges yet. Add one to get started."
          }
        </div>
      )}
      <div className="wf-picker">
        {challengesByQuest.map(({ quest, challenges }) => (
          <div key={quest.id} className="wf-quest-group">
            <div className="wf-quest-label">{quest.label}</div>
            {challenges.map(task => (
              <button
                key={task.id}
                className={`wf-pick ${focusId === task.id ? 'wf-pick-active' : ''}`}
                onClick={() => saveFocus(task.id)}
              >
                <span className="wf-pick-radio">{focusId === task.id ? '●' : '○'}</span>
                <span className="wf-pick-text">{task.text}</span>
              </button>
            ))}
            <button
              className="wf-add-new"
              onClick={() => { setWahooQuestId(quest.id); setWahooQuestLabel(quest.label) }}
            >
              + Add new
            </button>
          </div>
        ))}
        {/* Quests with no active challenges — just show the add button */}
        {questsWithoutChallenges.map(quest => (
          <div key={quest.id} className="wf-quest-group">
            <div className="wf-quest-label">{quest.label}</div>
            <button
              className="wf-add-new"
              onClick={() => { setWahooQuestId(quest.id); setWahooQuestLabel(quest.label) }}
            >
              + Add new
            </button>
          </div>
        ))}
      </div>
      {picking && (
        <button className="wf-cancel" onClick={() => setPicking(false)}>Cancel</button>
      )}

      {courageCount > 0 && (
        <div className="wf-counter-inline">
          <span className="wf-counter-num">{courageCount}</span> completed
        </div>
      )}

      {/* WahooCreator for adding new courage challenges */}
      {wahooQuestId && (
        <div className="wc-modal-overlay" onClick={() => setWahooQuestId(null)}>
          <div className="wc-modal" onClick={e => e.stopPropagation()}>
            <button className="wc-modal-close" onClick={() => setWahooQuestId(null)}>&times;</button>
            <WahooCreator
              userId={userId}
              initialQuestId={wahooQuestId}
              initialSourceLabel={wahooQuestLabel}
              onWahooAccepted={() => {
                setWahooQuestId(null)
                onAddChallenge?.()
              }}
              onClose={() => setWahooQuestId(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
