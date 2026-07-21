/**
 * FillNextEvent.jsx — "Fill this event" block at the top of the Experiences tab.
 * Shows the nearest upcoming experience: spots bar (red under 50% filled),
 * days-out badge, and the first incomplete pipeline step as the next action.
 * Tickets sold + step readiness come from useExperiencePipeline (canonical source).
 */

import { useNavigate } from 'react-router-dom'
import useExperiencePipeline from '../../hooks/useExperiencePipeline'
import { daysUntil } from '../../hooks/useExperienceData'
import { hapticLight } from '../../lib/haptics'

const NEXT_STEP_COPY = {
  attract: { strong: 'post your attract content', rest: 'Get the word out so people know it is happening.' },
  capture: { strong: 'set up your capture step', rest: 'Give interested people a place to leave their details.' },
  convert: { strong: 'turn interest into tickets', rest: 'Follow up with everyone who showed interest.' },
  deliver: { strong: 'get ready to deliver', rest: 'Tick off your run sheet so the day runs smooth.' },
  grow: { strong: 'plan your grow step', rest: 'Set up how people bring their friends next time.' },
}

export default function FillNextEvent({ experience, onOpen, isStale }) {
  const navigate = useNavigate()
  const { nodes, loading } = useExperiencePipeline(experience?.id)

  if (!experience || loading) return null

  const days = daysUntil(experience.experience_date)
  const daysBadge = days === null ? null
    : days === 0 ? 'TODAY'
    : days === 1 ? 'TOMORROW'
    : days > 1 ? `${days} DAYS OUT`
    : null

  // Tickets sold: canonical value from the convert node
  const convertNode = nodes.find(n => n.key === 'convert')
  const tickets = convertNode?.attendeeCount ?? 0
  const capacity = experience.capacity

  const hasCapacity = capacity != null && capacity > 0
  const fillPct = hasCapacity ? Math.min(100, Math.round(tickets / capacity * 100)) : null
  const isLow = hasCapacity && fillPct < 50

  // First incomplete pipeline step (attract → grow order)
  const firstIncomplete = nodes.find(n => n.readinessPercent < 100)
  const stepCopy = firstIncomplete ? NEXT_STEP_COPY[firstIncomplete.key] : null

  return (
    <div className="ch2-fill-next">
      <div className="ch2-fill-next-top">
        <div className="ch2-fill-next-event">{experience.name}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            style={{ fontSize: 10, fontWeight: 700, color: '#adb5bd', cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); hapticLight(); navigate(`/create/experience/${experience.id}`) }}
          >Edit</span>
          {daysBadge && <span className="ch2-card-badge ch2-badge-next">{daysBadge}</span>}
        </div>
      </div>

      {hasCapacity && (
        <div className="ch2-exp-spots" style={{ marginTop: 0, marginBottom: 10 }}>
          <div className="ch2-exp-spots-bar">
            <div className={`ch2-exp-spots-fill${isLow ? ' low' : ''}`} style={{ width: `${fillPct}%` }} />
          </div>
          <span className={`ch2-exp-spots-label${isLow ? ' low' : ''}`}>{tickets} / {capacity} spots</span>
        </div>
      )}

      {/* Staleness nudge — inline when no marketing started */}
      {isStale && days > 1 && (
        <div className="ch2-fill-next-stale">
          This event is in {days} days and your audience doesn't know about it yet.
        </div>
      )}

      <div className="ch2-fill-next-action">
        {stepCopy ? (
          <>Next step: <strong>{stepCopy.strong}</strong>. {stepCopy.rest}</>
        ) : (
          <>Every step is ready. Nice work. Keep an eye on ticket sales.</>
        )}
      </div>

      <button className="ch2-btn-gold" style={{ width: '100%', marginTop: 12 }} onClick={() => onOpen(experience.id)}>
        Fill this event →
      </button>
    </div>
  )
}
