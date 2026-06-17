/**
 * RootReachCard.jsx — Creator Momentum (Roots × Reach)
 *
 * Two scores side by side + one prescribed next action.
 * Roots (0-5): infrastructure built (permanent). Reach (0-10): weekly action (rolling).
 * Dark theme, premium feel, anti-hustle framing.
 */

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import useRootScore from '../../hooks/useRootScore'
import useReachScore from '../../hooks/useReachScore'
import { hapticLight } from '../../lib/haptics'
import './RootReachCard.css'

export default function RootReachCard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { root, breakdown: rootBreakdown, lowestGap, loading: rootLoading } = useRootScore(user?.id)
  const { reach, breakdown: reachBreakdown, loading: reachLoading } = useReachScore(user?.id)

  if (rootLoading || reachLoading) return null
  if (root === null && reach === null) return null

  const allBuilt = root === 5
  const sweetSpot = root === 5 && reach >= 8

  return (
    <div className="rr-card">
      {/* Header */}
      <div className="rr-header">
        <span className="rr-title">Your Momentum</span>
      </div>

      {/* Two scores */}
      <div className="rr-scores">
        <div className="rr-score-col">
          <div className="rr-score-label roots">Roots</div>
          <div className="rr-score-num roots">
            {root ?? '—'}<span className="rr-score-max">/5</span>
          </div>
          <div className="rr-score-sub">foundation</div>
          <div className="rr-bar">
            <div className="rr-bar-fill roots" style={{ width: `${(root / 5) * 100}%` }} />
          </div>
        </div>

        <div className="rr-divider" />

        <div className="rr-score-col">
          <div className="rr-score-label reach">Reach</div>
          <div className="rr-score-num reach">
            {reach ?? '—'}<span className="rr-score-max">/10</span>
          </div>
          <div className="rr-score-sub">this week</div>
          <div className="rr-bar">
            <div className="rr-bar-fill reach" style={{ width: `${(reach / 10) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="rr-breakdown">
        <div className="rr-breakdown-col">
          {rootBreakdown?.map(item => (
            <div key={item.key} className={`rr-breakdown-item ${item.built ? 'done' : 'pending'}`}>
              <span className={`rr-dot roots ${item.built ? 'done' : 'pending'}`} />
              <span>{item.label}</span>
              {item.built && <span className="rr-check">✓</span>}
            </div>
          ))}
        </div>
        <div className="rr-breakdown-col">
          {reachBreakdown?.slice(0, 5).map(item => (
            <div key={item.key} className={`rr-breakdown-item ${item.active ? 'done' : 'pending'}`}>
              <span className={`rr-dot reach ${item.active ? 'done' : 'pending'}`} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prescription */}
      {sweetSpot ? (
        <div className="rr-prescription sweet-spot">
          <div className="rr-rx-eyebrow sweet-spot">Sweet spot</div>
          <div className="rr-rx-text">
            Strong foundation, consistent action. Keep this rhythm going.
          </div>
        </div>
      ) : allBuilt ? (
        <div className="rr-prescription solid">
          <div className="rr-rx-eyebrow" style={{ color: 'rgba(94,23,235,0.5)' }}>Foundation solid</div>
          <div className="rr-rx-text">
            Keep showing up this week. Pick one reach action and do it today.
          </div>
        </div>
      ) : lowestGap ? (
        <div className="rr-prescription action">
          <div className="rr-rx-eyebrow action">Your next move</div>
          <div className="rr-rx-text">
            {lowestGap.prescription}
          </div>
          <button
            className="rr-rx-btn"
            onClick={() => {
              hapticLight()
              const route = lowestGap.action.route
              navigate(`${route}${route.includes('?') ? '&' : '?'}returnTo=/create`)
            }}
          >
            {lowestGap.action.label} <span style={{ opacity: 0.5 }}>→</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
