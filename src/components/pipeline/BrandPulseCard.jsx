/**
 * BrandPulseCard.jsx — Composite brand growth metric for Growth tab
 * Shows score (0-10), label, and 3 signal breakdowns
 */

import useBrandPulse from '../../hooks/useBrandPulse'

const ARROWS = { up: '↑', down: '↓', steady: '→' }
const ARROW_COLORS = { up: '#10b981', down: '#ef4444', steady: '#E9A23B' }

export default function BrandPulseCard() {
  const { score, label, color, signals, hasEnoughData, isConnected, lastSynced, loading, refresh } = useBrandPulse()

  if (loading) return null
  if (!isConnected) return null

  // Building baseline state
  if (!hasEnoughData) {
    return (
      <div className="ch2-card" style={{ border: `1px solid rgba(94, 23, 235, 0.2)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="ch2-label" style={{ margin: 0 }}>Brand Pulse</div>
          <div style={{ fontSize: 10, color: '#adb5bd' }}>Building baseline...</div>
        </div>
        <div style={{ fontSize: 11, color: '#6c757d', lineHeight: 1.5 }}>
          Collecting data for your first Brand Pulse score. Check back in a few days.
        </div>
        <div style={{ marginTop: 8 }}>
          {[...Array(10)].map((_, i) => (
            <span key={i} style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#e9ecef',
              marginRight: 4,
            }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="ch2-card" style={{ border: `1px solid ${color}22` }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="ch2-label" style={{ margin: 0 }}>Brand Pulse</div>
        <button
          onClick={refresh}
          style={{
            background: 'none',
            border: 'none',
            color: '#adb5bd',
            fontSize: 10,
            cursor: 'pointer',
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Score + Label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, color }}>
            {ARROWS[signals?.reach?.direction] || '→'}
          </span>
          <span style={{ fontSize: 16, fontWeight: 700, color }}>{label}</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#6c757d' }}>{score}/10</span>
      </div>

      {/* Dot bar */}
      <div style={{ marginBottom: 12 }}>
        {[...Array(10)].map((_, i) => (
          <span key={i} style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: i < score ? color : '#e9ecef',
            marginRight: 4,
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {/* Signals */}
      {signals && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SignalRow icon="📊" label="Reach" value={signals.reach.value?.toLocaleString()} trend={signals.reach.trend} direction={signals.reach.direction} />
          <SignalRow icon="💬" label="Engage" value={signals.engagement.value} trend={signals.engagement.trend} direction={signals.engagement.direction} />
          <SignalRow icon="👥" label="Follow" value={signals.followers.value?.toLocaleString()} trend={signals.followers.trend} direction={signals.followers.direction} />
        </div>
      )}

      {/* Last synced */}
      {lastSynced && (
        <div style={{ fontSize: 9, color: '#adb5bd', marginTop: 8, textAlign: 'right' }}>
          Last updated: {formatTimeAgo(new Date(lastSynced))}
        </div>
      )}
    </div>
  )
}

function SignalRow({ icon, label, value, trend, direction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
      <span style={{ width: 18 }}>{icon}</span>
      <span style={{ color: '#adb5bd', width: 50 }}>{label}</span>
      <span style={{ color: '#6c757d', flex: 1 }}>{value}</span>
      <span style={{ color: ARROW_COLORS[direction], fontWeight: 600 }}>
        {trend} {ARROWS[direction]}
      </span>
    </div>
  )
}

function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
