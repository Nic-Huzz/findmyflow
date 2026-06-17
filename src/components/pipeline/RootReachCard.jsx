/**
 * RootReachCard.jsx — Creator Momentum card (Root × Reach)
 *
 * Shows two scores side by side + one prescribed action.
 * Root (0-5): infrastructure built. Reach (0-10): weekly action.
 * Dark theme, matches Creator Home styling.
 */

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import useRootScore from '../../hooks/useRootScore'
import useReachScore from '../../hooks/useReachScore'
import { hapticLight } from '../../lib/haptics'

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
    <div className="ch2-card" style={{ border: '1px solid rgba(94, 23, 235, 0.15)' }}>
      {/* Header */}
      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 12, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        Your Momentum
      </div>

      {/* Two scores side by side */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <ScoreColumn
          label="Root"
          score={root}
          max={5}
          color="#5e17eb"
          subtitle="foundation"
        />
        <ScoreColumn
          label="Reach"
          score={reach}
          max={10}
          color="#E9A23B"
          subtitle="this week"
        />
      </div>

      {/* Breakdown dots */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          {rootBreakdown?.map(item => (
            <div key={item.key} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10,
              color: item.built ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
              marginBottom: 3,
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: item.built ? '#5e17eb' : 'rgba(255,255,255,0.08)',
                flexShrink: 0,
              }} />
              <span>{item.label}</span>
              {item.built && <span style={{ color: 'rgba(94,23,235,0.5)', fontSize: 8 }}>✓</span>}
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          {reachBreakdown?.slice(0, 5).map(item => (
            <div key={item.key} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10,
              color: item.active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
              marginBottom: 3,
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: item.active ? '#E9A23B' : 'rgba(255,255,255,0.08)',
                flexShrink: 0,
              }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prescription */}
      {sweetSpot ? (
        <div style={{
          padding: '10px 12px',
          borderRadius: 8,
          background: 'rgba(94, 23, 235, 0.08)',
          borderLeft: '3px solid #E9A23B',
        }}>
          <div style={{ fontSize: 12, color: '#E9A23B', fontWeight: 600 }}>
            You're in the sweet spot.
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            Strong foundation, consistent action. Keep this rhythm going.
          </div>
        </div>
      ) : allBuilt ? (
        <div style={{
          padding: '10px 12px',
          borderRadius: 8,
          background: 'rgba(94, 23, 235, 0.08)',
          borderLeft: '3px solid #5e17eb',
        }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
            Your foundation is solid.
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            Keep showing up this week. Pick one reach action and do it today.
          </div>
        </div>
      ) : lowestGap ? (
        <div style={{
          padding: '10px 12px',
          borderRadius: 8,
          background: 'rgba(94, 23, 235, 0.05)',
          borderLeft: '3px solid rgba(94, 23, 235, 0.3)',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
            Your next move
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
            {lowestGap.prescription}
          </div>
          <button
            className="ch2-btn-outline"
            style={{ marginTop: 8, fontSize: 11 }}
            onClick={() => {
              hapticLight()
              const route = lowestGap.action.route
              navigate(`${route}${route.includes('?') ? '&' : '?'}returnTo=/create`)
            }}
          >
            {lowestGap.action.label} →
          </button>
        </div>
      ) : null}
    </div>
  )
}

function ScoreColumn({ label, score, max, color, subtitle }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>
        {score ?? '—'}
        <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.2)' }}>/{max}</span>
      </div>
      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', gap: 3 }}>
        {[...Array(max)].map((_, i) => (
          <span key={i} style={{
            display: 'inline-block',
            width: max > 6 ? 6 : 8,
            height: max > 6 ? 6 : 8,
            borderRadius: '50%',
            background: i < score ? color : 'rgba(255,255,255,0.08)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
        {subtitle}
      </div>
    </div>
  )
}
