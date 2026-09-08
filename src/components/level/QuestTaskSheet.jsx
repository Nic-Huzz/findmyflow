/**
 * QuestTaskSheet — Bottom sheet showing courage challenge / healing details.
 * Slides up when a ⚡ or 💚 icon is tapped on the life path map.
 * CSS prefix: qts-
 */

import { useEffect } from 'react'
import { STATE_META } from '../LifePathMap/lifePaths'
import './QuestTaskSheet.css'

const WAHOO_LABELS = {
  vibe: { emoji: '🔥', label: 'Vibe Rise', color: '#c084fc' },
  peace: { emoji: '😌', label: 'Fun', color: '#10b981' },
  anxious: { emoji: '😰', label: 'Stressful', color: '#f59e0b' },
  shutdown: { emoji: '😶', label: 'Bored', color: '#ef4444' },
}

const EXPECT_LABELS = {
  better: { emoji: '✨', label: 'Better than expected' },
  expected: { emoji: '👌', label: 'As expected' },
  worse: { emoji: '😬', label: 'Worse than expected' },
}

const HEALING_STAGES = {
  in_progress: { label: 'In progress', step: 1 },
  recognised: { label: 'Recognised', step: 2 },
  released: { label: 'Released', step: 3 },
}

export default function QuestTaskSheet({ task, quest, completionData, healingIntention, crossPollination = [], onClose, onHealingFlow }) {
  // Lock body scroll while open
  useEffect(() => {
    document.body.classList.add('modal-active')
    return () => document.body.classList.remove('modal-active')
  }, [])

  if (!task) return null

  const isCourage = task.is_courage_challenge && task.done
  const isHealing = healingIntention && !healingIntention.outcome
  const isHealed = healingIntention?.outcome
  const cd = completionData || {}

  return (
    <div className="qts-overlay" onClick={onClose}>
      <div className="qts-sheet" onClick={e => e.stopPropagation()}>
        {/* Drag handle */}
        <div className="qts-handle" />

        {/* Brand accent */}
        <div className="qts-accent" />

        {/* Header */}
        <div className="qts-header">
          <span className="qts-icon">{isCourage ? '⚡' : '💚'}</span>
          <div className="qts-header-text">
            <h3 className="qts-title">{task.text}</h3>
            {quest && <span className="qts-quest-label">{quest.label}</span>}
            {task.completed_at && (
              <span className="qts-date">{new Date(task.completed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            )}
          </div>
        </div>

        {/* Courage challenge details */}
        {isCourage && (
          <div className="qts-section">
            {/* How did it feel? */}
            {cd.wahoo_classification && (
              <div className="qts-row">
                <span className="qts-row-label">How did it feel?</span>
                <span className="qts-pill" style={{
                  background: `${WAHOO_LABELS[cd.wahoo_classification]?.color}15`,
                  color: WAHOO_LABELS[cd.wahoo_classification]?.color,
                  borderColor: `${WAHOO_LABELS[cd.wahoo_classification]?.color}30`,
                }}>
                  {WAHOO_LABELS[cd.wahoo_classification]?.emoji} {WAHOO_LABELS[cd.wahoo_classification]?.label}
                </span>
              </div>
            )}

            {/* Did it go? */}
            {cd.expectation_result && (
              <div className="qts-row">
                <span className="qts-row-label">Did it go...</span>
                <span className="qts-pill qts-pill-neutral">
                  {EXPECT_LABELS[cd.expectation_result]?.emoji} {EXPECT_LABELS[cd.expectation_result]?.label}
                </span>
              </div>
            )}
            {!cd.expectation_result && cd.wahoo_classification && (
              <div className="qts-row">
                <span className="qts-row-label">Did it go...</span>
                <span className="qts-pill qts-pill-neutral" style={{ opacity: 0.4 }}>Not recorded</span>
              </div>
            )}

            {/* Identity statement */}
            {cd.identity_statement && (
              <div className="qts-identity">
                "Now that I {task.text?.toLowerCase()}, I've proven I'm someone who {cd.identity_statement}"
              </div>
            )}

            {/* Cross-pollination */}
            {crossPollination.length > 0 && (
              <div className="qts-row">
                <span className="qts-row-label">Also fed</span>
                <div className="qts-cross-tags">
                  {crossPollination.map((cp, i) => (
                    <span key={i} className="qts-cross-tag">{cp.questLabel || 'Another path'}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Healing details */}
        {(isHealing || isHealed) && (
          <div className="qts-section">
            {/* Pattern */}
            {healingIntention.pattern && (
              <div className="qts-row">
                <span className="qts-row-label">What's scary</span>
                <span className="qts-row-value">{healingIntention.pattern}</span>
              </div>
            )}

            {/* Fear */}
            {healingIntention.fear_text && (
              <div className="qts-row">
                <span className="qts-row-label">The fear</span>
                <span className="qts-row-value">{healingIntention.fear_text}</span>
              </div>
            )}

            {/* Healing stage */}
            <div className="qts-row">
              <span className="qts-row-label">Healing stage</span>
              <div className="qts-stage-dots">
                {['in_progress', 'recognised', 'released'].map(stage => {
                  const current = HEALING_STAGES[healingIntention.healing_stage]?.step || 0
                  const thisStep = HEALING_STAGES[stage]?.step || 0
                  return (
                    <div key={stage} className={`qts-stage-dot ${thisStep <= current ? 'active' : ''}`}>
                      <div className="qts-stage-dot-inner" />
                      <span className="qts-stage-label">{HEALING_STAGES[stage]?.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Outcome */}
            {isHealed && (
              <div className="qts-row">
                <span className="qts-row-label">Outcome</span>
                <span className="qts-pill qts-pill-healed">
                  {healingIntention.outcome === 'yes' ? '✅ Yes, it happened' :
                   healingIntention.outcome === 'something_better' ? '✨ Something better' :
                   '❌ No'}
                </span>
              </div>
            )}

            {/* CTA */}
            {isHealing && onHealingFlow && (
              <button className="qts-cta" onClick={onHealingFlow}>
                Continue healing flow 💚
              </button>
            )}
          </div>
        )}

        {/* Empty state for tasks without data */}
        {!isCourage && !isHealing && !isHealed && (
          <div className="qts-empty">
            {task.done ? 'Completed' : 'Not yet completed'}
          </div>
        )}
      </div>
    </div>
  )
}
