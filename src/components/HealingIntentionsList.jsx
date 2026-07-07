/**
 * HealingIntentionsList — Full Healing tab content
 * Shows active healing intentions from quests.
 * Empty state: lets users identify a fear directly.
 * CSS prefix: hil-
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import HealingFlowModal from './HealingFlowModal'
import './HealingIntentionsList.css'

const PATTERN_META = {
  ghost: { name: 'Ghost', icon: '👻' },
  controller: { name: 'Controller', icon: '🧱' },
  auto_pilot: { name: 'Auto-Pilot', icon: '🤖' },
  perfectionist: { name: 'Perfectionist', icon: '🎯' },
}

export default function HealingIntentionsList({ userId }) {
  const [intentions, setIntentions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showStandaloneFlow, setShowStandaloneFlow] = useState(false)
  const [standaloneText, setStandaloneText] = useState('')
  const [standaloneTaskId, setStandaloneTaskId] = useState(null)

  const loadIntentions = () => {
    if (!userId) return
    supabase
      .from('healing_intentions')
      .select('*, quest_tasks(text, done, quests(label))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setIntentions(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadIntentions() }, [userId])

  const handleStartStandalone = async () => {
    if (!standaloneText.trim()) return
    // Find or create a "Healing Work" quest to anchor the task
    let healingQuestId = null
    const { data: existing } = await supabase.from('quests')
      .select('id').eq('user_id', userId).eq('label', 'Healing Work').eq('status', 'active').limit(1)
    if (existing?.length > 0) {
      healingQuestId = existing[0].id
    } else {
      const { data: newQuest } = await supabase.from('quests').insert({
        user_id: userId,
        label: 'Healing Work',
        predicted_state: 'anxious',
        status: 'active',
      }).select('id').single()
      healingQuestId = newQuest?.id
    }
    if (!healingQuestId) return
    const { data: task } = await supabase.from('quest_tasks').insert({
      quest_id: healingQuestId,
      user_id: userId,
      text: standaloneText.trim(),
      is_courage_challenge: true,
      sort_order: 0,
    }).select('id').single()
    if (task) {
      setStandaloneTaskId(task.id)
      setShowStandaloneFlow(true)
    }
  }

  if (loading) return null

  const active = intentions.filter(i => !i.outcome && i.healing_stage !== 'in_progress')
  const inProgress = intentions.filter(i => i.healing_stage === 'in_progress')
  const completed = intentions.filter(i => i.outcome)

  return (
    <div className="hil-container">
      {/* Header */}
      <div className="hil-section">
        <div className="hil-section-header">
          <span className="hil-section-icon">💚</span>
          <span className="hil-section-title">Healing</span>
        </div>
        <p className="hil-section-sub">Removing what blocks your path. Each fear you name and work through expands what feels possible.</p>

        {/* In-progress intentions (partial) */}
        {inProgress.map(intention => {
          const pm = PATTERN_META[intention.pattern]
          const taskText = intention.quest_tasks?.text || 'Unknown task'
          const questLabel = intention.quest_tasks?.quests?.label || ''
          return (
            <div key={intention.id} className="hil-card">
              <div className="hil-card-header">
                <span className="hil-pattern-icon">{pm?.icon || '💚'}</span>
                <div className="hil-card-info">
                  <div className="hil-card-task">{taskText}</div>
                  {questLabel && <div className="hil-card-quest">{questLabel}</div>}
                </div>
                <span className="hil-stage-badge hil-stage-progress">In progress</span>
              </div>
              {intention.fear_text && (
                <div className="hil-card-body">
                  <div className="hil-field">
                    <span className="hil-field-label">Fear:</span>
                    <span className="hil-field-value">{intention.fear_text}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Active intentions (recognised) */}
        {active.map(intention => {
          const pm = PATTERN_META[intention.pattern]
          const taskText = intention.quest_tasks?.text || 'Unknown task'
          const questLabel = intention.quest_tasks?.quests?.label || ''
          return (
            <div key={intention.id} className="hil-card">
              <div className="hil-card-header">
                <span className="hil-pattern-icon">{pm?.icon || '💚'}</span>
                <div className="hil-card-info">
                  <div className="hil-card-task">{taskText}</div>
                  {questLabel && <div className="hil-card-quest">{questLabel}</div>}
                </div>
                <span className="hil-stage-badge">Recognised</span>
              </div>
              <div className="hil-card-body">
                <div className="hil-field">
                  <span className="hil-field-label">Fear:</span>
                  <span className="hil-field-value">{intention.fear_text}</span>
                </div>
                <div className="hil-field">
                  <span className="hil-field-label">Pattern:</span>
                  <span className="hil-field-value">{pm?.name || intention.pattern}</span>
                </div>
                {intention.rewire_text && (
                  <div className="hil-field">
                    <span className="hil-field-label">Rewire:</span>
                    <span className="hil-field-value">{intention.rewire_text}</span>
                  </div>
                )}
                {intention.expectation_text && (
                  <div className="hil-field">
                    <span className="hil-field-label">Expecting:</span>
                    <span className="hil-field-value">{intention.expectation_text}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Add new — always visible */}
        <div className="hil-add-section">
          <div className="hil-add-label">What's blocking you?</div>
          <div className="hil-add-row">
            <input
              className="hil-add-input"
              type="text"
              value={standaloneText}
              onChange={e => setStandaloneText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStartStandalone()}
              placeholder="e.g. I'm scared of charging money..."
            />
            <button className="hil-add-btn" onClick={handleStartStandalone} disabled={!standaloneText.trim()}>
              Explore
            </button>
          </div>
          <div className="hil-add-hint">Or tag a courage challenge in your quests to start</div>
        </div>
      </div>

      {/* Resolved */}
      {completed.length > 0 && (
        <div className="hil-section hil-completed">
          <div className="hil-section-header">
            <span className="hil-section-icon">✅</span>
            <span className="hil-section-title">Resolved</span>
          </div>
          {completed.map(intention => {
            const pm = PATTERN_META[intention.pattern]
            const taskText = intention.quest_tasks?.text || 'Unknown task'
            const outcomeLabel = intention.outcome === 'yes' ? 'Yes' : intention.outcome === 'something_better' ? 'Something better' : 'No'
            const outcomeColor = intention.outcome === 'no' ? '#6b7280' : '#10b981'
            return (
              <div key={intention.id} className="hil-card hil-card-done">
                <div className="hil-card-header">
                  <span className="hil-pattern-icon">{pm?.icon || '💚'}</span>
                  <div className="hil-card-info">
                    <div className="hil-card-task">{taskText}</div>
                  </div>
                  <span className="hil-outcome-badge" style={{ color: outcomeColor }}>{outcomeLabel}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Standalone healing flow modal */}
      {showStandaloneFlow && standaloneTaskId && (
        <HealingFlowModal
          taskText={standaloneText}
          userId={userId}
          questTaskId={standaloneTaskId}
          onComplete={() => { setShowStandaloneFlow(false); setStandaloneText(''); setStandaloneTaskId(null); loadIntentions() }}
          onClose={() => { setShowStandaloneFlow(false); setStandaloneText(''); setStandaloneTaskId(null) }}
        />
      )}
    </div>
  )
}
