/**
 * ScopeMap.jsx
 *
 * 2x2 SVG graph for the River System (Find My Flow).
 * Shows four stages: Stream, Lake, Waterfall, River.
 * Brand purple (#5e17eb) background, gold (#E9A23B) accents, white labels.
 *
 * Props:
 *   stage - 'stream' | 'lake' | 'waterfall' | 'river' | null
 *   animated - boolean (animate dot entrance)
 *   width - CSS width string
 */

import { useState, useEffect } from 'react'

const STAGES = {
  stream:    { label: 'The Stream',    x: 145, y: 295, desc: "Someone else's channel" },
  lake:      { label: 'The Lake',      x: 145, y: 145, desc: 'Full but still' },
  waterfall: { label: 'The Waterfall', x: 295, y: 295, desc: 'Your edge found' },
  river:     { label: 'The River',     x: 295, y: 145, desc: 'Earned breadth' },
}

// Journey arrows: stream → lake → waterfall → river
const JOURNEY_PATH = 'M 145,280 L 145,160 Q 145,140 165,140 L 280,140 Q 295,140 295,160 L 295,280'

export default function ScopeMap({ stage = null, animated = false, width = '100%' }) {
  const [showDot, setShowDot] = useState(!animated)

  useEffect(() => {
    if (animated && stage) {
      const timer = setTimeout(() => setShowDot(true), 600)
      return () => clearTimeout(timer)
    }
  }, [animated, stage])

  const activeStage = stage ? STAGES[stage] : null

  return (
    <svg viewBox="0 0 440 440" style={{ width, borderRadius: 16, display: 'block' }}>
      {/* Purple background */}
      <rect width="440" height="440" rx="16" fill="#5e17eb" />

      {/* Title */}
      <text x="220" y="46" textAnchor="middle" fill="white" fontSize="22" fontWeight="800" fontStyle="italic">
        Find My Flow
      </text>

      {/* Quadrant backgrounds (subtle) */}
      <rect x="80" y="70" width="160" height="160" rx="8" fill="rgba(255,255,255,0.04)" />
      <rect x="240" y="70" width="160" height="160" rx="8" fill="rgba(255,255,255,0.04)" />
      <rect x="80" y="230" width="160" height="160" rx="8" fill="rgba(255,255,255,0.04)" />
      <rect x="240" y="230" width="160" height="160" rx="8" fill="rgba(255,255,255,0.04)" />

      {/* Divider lines */}
      <line x1="240" y1="70" x2="240" y2="390" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <line x1="80" y1="230" x2="400" y2="230" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

      {/* Axes */}
      <line x1="80" y1="390" x2="80" y2="70" stroke="white" strokeWidth="3" />
      <line x1="80" y1="390" x2="400" y2="390" stroke="white" strokeWidth="3" />

      {/* Axis arrows */}
      <polygon points="80,70 75,82 85,82" fill="white" />
      <polygon points="400,390 388,385 388,395" fill="white" />

      {/* Y axis label */}
      <text
        x="32"
        y="230"
        textAnchor="middle"
        fill="rgba(255,255,255,0.7)"
        fontSize="13"
        fontWeight="700"
        transform="rotate(-90, 32, 230)"
      >
        Problem Scope
      </text>
      <text
        x="55"
        y="85"
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize="10"
      >
        Broad
      </text>
      <text
        x="55"
        y="385"
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize="10"
      >
        Specific
      </text>

      {/* X axis label */}
      <text x="240" y="425" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="13" fontWeight="700">
        Self-Knowledge
      </text>
      <text x="95" y="410" textAnchor="start" fill="rgba(255,255,255,0.5)" fontSize="10">
        Low
      </text>
      <text x="385" y="410" textAnchor="end" fill="rgba(255,255,255,0.5)" fontSize="10">
        High
      </text>

      {/* Journey path (gold, dashed when no stage selected, solid when stage shown) */}
      <path
        d={JOURNEY_PATH}
        fill="none"
        stroke="#E9A23B"
        strokeWidth="2.5"
        strokeDasharray={stage ? '0' : '8 4'}
        opacity={stage ? 0.6 : 0.3}
      />

      {/* Journey arrow tips */}
      <polygon points="145,162 140,172 150,172" fill="#E9A23B" opacity={stage ? 0.6 : 0.3} />
      <polygon points="293,280 288,270 298,270" fill="#E9A23B" opacity={stage ? 0.6 : 0.3} />

      {/* Quadrant labels */}
      {Object.entries(STAGES).map(([key, s]) => {
        const isActive = stage === key
        const opacity = stage ? (isActive ? 1 : 0.35) : 0.8
        return (
          <g key={key} opacity={opacity}>
            <text
              x={s.x}
              y={s.y - 8}
              textAnchor="middle"
              fill="white"
              fontSize="15"
              fontWeight="800"
            >
              {s.label}
            </text>
            <text
              x={s.x}
              y={s.y + 10}
              textAnchor="middle"
              fill="rgba(255,255,255,0.6)"
              fontSize="11"
            >
              {s.desc}
            </text>
          </g>
        )
      })}

      {/* Active stage dot */}
      {activeStage && showDot && (
        <g>
          {/* Glow */}
          <circle
            cx={activeStage.x}
            cy={activeStage.y + 28}
            r="18"
            fill="#E9A23B"
            opacity="0.2"
          >
            <animate
              attributeName="r"
              values="18;24;18"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.2;0.1;0.2"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Dot */}
          <circle
            cx={activeStage.x}
            cy={activeStage.y + 28}
            r="8"
            fill="#E9A23B"
            stroke="white"
            strokeWidth="2.5"
          >
            {animated && (
              <animate
                attributeName="r"
                from="0"
                to="8"
                dur="0.4s"
                fill="freeze"
              />
            )}
          </circle>
        </g>
      )}
    </svg>
  )
}
