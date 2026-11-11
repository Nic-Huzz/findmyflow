/**
 * WeeklyFocus.jsx — Display-only component for the chosen weekly courage challenge
 *
 * Two states:
 *   - No focus: shows "Choose a courage challenge below" prompt
 *   - Focus set: shows the challenge + "I did it!" CTA + completion modals
 *
 * Picking happens in QuestBoardCard via radio buttons (not here).
 * LevelTab owns the focus state and passes it down.
 */

import { useState, useMemo } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { hapticSuccess } from '../../lib/haptics'
import GroanCompletionModal from '../GroanCompletionModal'
import DomeGrowthOverlay from '../DomeGrowthOverlay'
import HealingFlowModal from '../HealingFlowModal'

export default function WeeklyFocus({
  focusId,
  completed,
  quests,
  questTasks,
  userId,
  courageCount = 0,
  onCompleteCourage,
  onClearFocus,
}) {
  const [groanChallenge, setGroanChallenge] = useState(null)
  const [domeGrowthData, setDomeGrowthData] = useState(null)
  const [healingOpen, setHealingOpen] = useState(false)
  const [completing, setCompleting] = useState(false)

  // Find the focused challenge + its quest
  const focusedChallenge = useMemo(() => {
    if (!focusId) return null
    for (const q of quests) {
      const task = (questTasks[q.id] || []).find(t => t.id === focusId)
      if (task) return { task, quest: q }
    }
    return null
  }, [focusId, quests, questTasks])

  // No focus set — show prompt
  if (!focusId || !focusedChallenge) {
    return (
      <div className="wf-card wf-card-prompt">
        <div className="wf-prompt-text">Choose a courage challenge below</div>
        {courageCount > 0 && (
          <div className="wf-counter-inline">
            <span className="wf-counter-num">{courageCount}</span> completed
          </div>
        )}
      </div>
    )
  }

  // "I did it!" — fetch the groan_challenge and open the full completion modal
  const handleDidIt = async () => {
    if (!focusedChallenge || completing) return
    setCompleting(true)
    const task = focusedChallenge.task

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
      } else {
        setCompleting(false)
      }
    } catch (e) {
      console.warn('WeeklyFocus: error fetching groan challenge:', e)
      setCompleting(false)
    }
  }

  const handleCompletionDone = (data) => {
    setGroanChallenge(null)
    setCompleting(false)
    setDomeGrowthData(data || null)
    hapticSuccess()
    onCompleteCourage?.(focusedChallenge?.task, focusedChallenge?.quest)
  }

  // Focus is set — show chosen challenge + "I did it!"
  return (
    <div className="wf-card">
      <div className="wf-header">
        <span className="wf-label">This week</span>
        <button className="wf-change" onClick={onClearFocus}>Change</button>
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
          <div className="wf-done-msg">Done! Pick another below</div>
        </>
      )}

      {courageCount > 0 && (
        <div className="wf-counter-inline">
          <span className="wf-counter-num">{courageCount}</span> completed
        </div>
      )}

      {groanChallenge && (
        <GroanCompletionModal
          challenge={groanChallenge}
          userId={userId}
          onComplete={handleCompletionDone}
          onClose={() => { setGroanChallenge(null); setCompleting(false) }}
        />
      )}
      {domeGrowthData && (
        <DomeGrowthOverlay {...domeGrowthData} onDismiss={() => setDomeGrowthData(null)} />
      )}
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
