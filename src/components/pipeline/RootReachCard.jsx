/**
 * RootReachCard.jsx — Reach (weekly action score)
 *
 * One score (0-10) from rolling 7-day binary checks: "are you running the machine?"
 * Roots was removed: the identity tab's Blow Up Your Brand card now covers foundation.
 * Light theme, matches the ch2 portal styling.
 */

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import useReachScore from '../../hooks/useReachScore'
import { hapticLight } from '../../lib/haptics'
import './RootReachCard.css'

export default function RootReachCard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { reach, breakdown: reachBreakdown, loading: reachLoading } = useReachScore(user?.id)

  if (reachLoading) return null
  if (reach === null) return null

  const strong = reach >= 8
  const quiet = reach < 4

  return (
    <div className="rr-card">
      {/* Header */}
      <div className="rr-header">
        <span className="rr-title">Reach · This Week</span>
      </div>

      {/* Score */}
      <div className="rr-reach-hero">
        <div className="rr-score-num reach">
          {reach}<span className="rr-score-max">/10</span>
        </div>
        <div className="rr-score-sub">actions in the last 7 days</div>
        <div className="rr-bar">
          <div className="rr-bar-fill reach" style={{ width: `${(reach / 10) * 100}%` }} />
        </div>
      </div>

      {/* Breakdown: all 10 checks as pills. Done first so wins lead. */}
      <div className="rr-pills">
        {[...(reachBreakdown || [])].sort((a, b) => (b.active ? 1 : 0) - (a.active ? 1 : 0)).map(item => (
          <button
            key={item.key}
            type="button"
            className={`rr-pill ${item.active ? 'done' : 'pending'}`}
            onClick={() => {
              if (!item.active && item.route) {
                hapticLight()
                navigate(item.route)
              }
            }}
            style={{ cursor: item.active ? 'default' : item.route ? 'pointer' : 'default' }}
          >
            {item.active && <span className="rr-pill-check">✓</span>}
            {item.label}
            {!item.active && item.route && <span className="rr-pill-arrow">→</span>}
          </button>
        ))}
      </div>

      {/* Prescription */}
      {strong ? (
        <div className="rr-prescription sweet-spot">
          <div className="rr-rx-eyebrow sweet-spot">On fire</div>
          <div className="rr-rx-text">
            You are running the machine. Keep this rhythm going.
          </div>
        </div>
      ) : quiet ? (
        <div className="rr-prescription action">
          <div className="rr-rx-eyebrow action">Your next move</div>
          <div className="rr-rx-text">
            Quiet week so far. Pick one action from the list above and do it today. Small moves count.
          </div>
        </div>
      ) : (
        <div className="rr-prescription solid">
          <div className="rr-rx-eyebrow" style={{ color: 'rgba(94,23,235,0.5)' }}>Good pace</div>
          <div className="rr-rx-text">
            Solid week. Pick one more action from the list to keep momentum building.
          </div>
        </div>
      )}
    </div>
  )
}
