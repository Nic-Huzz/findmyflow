/**
 * HealingIntentionsList — Shows active healing intentions from quests
 * Renders at top of Healing tab, above legacy exercises.
 * CSS prefix: hil-
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
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

  useEffect(() => {
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
  }, [userId])

  if (loading || intentions.length === 0) return null

  const active = intentions.filter(i => !i.outcome)
  const completed = intentions.filter(i => i.outcome)

  return (
    <div className="hil-container">
      <div className="hil-section">
        <div className="hil-section-header">
          <span className="hil-section-icon">💚</span>
          <span className="hil-section-title">Your Healing Work</span>
        </div>
        <p className="hil-section-sub">Fears you're actively working through, anchored to your quests.</p>

        {active.length === 0 && (
          <div className="hil-empty">
            No active healing work. Tag a courage challenge in your quests and explore the fear to start.
          </div>
        )}

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
      </div>

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
    </div>
  )
}
