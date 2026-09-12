import './GenericRadar.css'

/**
 * GenericRadar — Flexible SVG radar chart for any number of dimensions.
 *
 * Props:
 *  - dimensions   — [{ id, name, emoji }]
 *  - scores       — { dimId: number } (primary fill, purple)
 *  - scores2      — optional { dimId: number } (secondary fill, gold/amber, rendered underneath)
 *  - maxLevel     — number (default 5)
 *  - size         — number (default 300)
 *  - showLabels   — boolean (default true)
 *  - scoreLabel   — optional string to show below radar (e.g. "72% alive")
 *  - mini         — boolean for compact mode
 *  - animate      — boolean (default true) — CSS animation on the polygon
 */

function polarToXY(cx, cy, angle, radius) {
  const rad = (angle - 90) * (Math.PI / 180)
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
}

export default function GenericRadar({
  dimensions,
  scores,
  scores2,
  maxLevel = 5,
  size = 300,
  showLabels = true,
  scoreLabel,
  mini = false,
  animate = true,
}) {
  const effectiveSize = mini ? Math.min(size, 200) : size
  const cx = effectiveSize / 2
  const cy = effectiveSize / 2
  const labelPad = showLabels ? (mini ? 36 : 50) : 20
  const maxRadius = (effectiveSize / 2) - labelPad
  const dimCount = dimensions.length
  const angleStep = 360 / dimCount
  const ringCount = maxLevel

  // Concentric reference rings
  const rings = Array.from({ length: ringCount }, (_, i) => {
    const r = maxRadius * ((i + 1) / ringCount)
    return dimensions
      .map((_, j) => polarToXY(cx, cy, j * angleStep, r))
      .map(p => `${p.x},${p.y}`)
      .join(' ')
  })

  // Spoke lines from center to each vertex
  const spokes = dimensions.map((_, i) => {
    const end = polarToXY(cx, cy, i * angleStep, maxRadius)
    return { x1: cx, y1: cy, x2: end.x, y2: end.y }
  })

  // Secondary data polygon (scores2 — rendered underneath)
  const polygon2 = scores2
    ? dimensions
        .map((dim, i) => {
          const val = scores2[dim.id] || 0
          const ratio = Math.max(val / maxLevel, 0.05)
          return polarToXY(cx, cy, i * angleStep, ratio * maxRadius)
        })
        .map(p => `${p.x},${p.y}`)
        .join(' ')
    : null

  // Primary data polygon (scores)
  const polygon = dimensions
    .map((dim, i) => {
      const val = scores[dim.id] || 0
      const ratio = Math.max(val / maxLevel, 0.05)
      return polarToXY(cx, cy, i * angleStep, ratio * maxRadius)
    })
    .map(p => `${p.x},${p.y}`)
    .join(' ')

  // Labels positioned outside the radar
  const labels = showLabels
    ? dimensions.map((dim, i) => {
        const pos = polarToXY(cx, cy, i * angleStep, maxRadius + (mini ? 20 : 28))
        return { ...dim, x: pos.x, y: pos.y }
      })
    : []

  return (
    <div className={`gr-radar-wrap ${mini ? 'gr-mini' : ''}`}>
      <svg
        width={effectiveSize}
        height={effectiveSize}
        viewBox={`0 0 ${effectiveSize} ${effectiveSize}`}
      >
        {/* Reference rings */}
        {rings.map((pts, i) => (
          <polygon
            key={`ring-${i}`}
            points={pts}
            fill="none"
            stroke="#e0ddd8"
            strokeWidth={1}
            opacity={0.5}
          />
        ))}

        {/* Spoke lines */}
        {spokes.map((s, i) => (
          <line
            key={`spoke-${i}`}
            {...s}
            stroke="#e0ddd8"
            strokeWidth={1}
            opacity={0.4}
          />
        ))}

        {/* Secondary polygon (scores2) — underneath */}
        {polygon2 && (
          <>
            <polygon
              points={polygon2}
              fill="rgba(245, 166, 35, 0.12)"
              stroke="#f5a623"
              strokeWidth={2}
              strokeDasharray="4 4"
              className={animate ? 'gr-polygon-animate' : ''}
            />
            {dimensions.map((dim, i) => {
              const val = scores2[dim.id] || 0
              const ratio = Math.max(val / maxLevel, 0.05)
              const pos = polarToXY(cx, cy, i * angleStep, ratio * maxRadius)
              return (
                <circle
                  key={`v2-${dim.id}`}
                  cx={pos.x}
                  cy={pos.y}
                  r={3}
                  fill="#f5a623"
                  opacity={0.7}
                />
              )
            })}
          </>
        )}

        {/* Primary polygon (scores) */}
        <polygon
          points={polygon}
          fill="rgba(94, 23, 235, 0.15)"
          stroke="#5e17eb"
          strokeWidth={2.5}
          className={animate ? 'gr-polygon-animate' : ''}
        />

        {/* Vertex circles at each primary data point */}
        {dimensions.map((dim, i) => {
          const val = scores[dim.id] || 0
          const ratio = Math.max(val / maxLevel, 0.05)
          const pos = polarToXY(cx, cy, i * angleStep, ratio * maxRadius)
          return (
            <circle
              key={`v1-${dim.id}`}
              cx={pos.x}
              cy={pos.y}
              r={4}
              fill="#5e17eb"
            />
          )
        })}

        {/* Labels: emoji + name */}
        {labels.map(l => (
          <text
            key={`label-${l.id}`}
            x={l.x}
            y={l.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={mini ? 9 : 11}
            fontWeight={600}
            fill="#444"
          >
            <tspan>{l.emoji} </tspan>
            <tspan>{l.name}</tspan>
          </text>
        ))}
      </svg>

      {scoreLabel && (
        <div className="gr-score-label">{scoreLabel}</div>
      )}
    </div>
  )
}
