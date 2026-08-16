/**
 * CreatorRadarChart — 5-6 axis spider/radar chart for creator business metrics.
 *
 * Axes: Impact (attendees), Consistency (events), Retention (repeat %),
 * Brand (Scale Score), Price (ticket). Optional 6th: Reach (views, Instagram).
 *
 * Purple fill, gold border at current tier edge. 6 concentric rings.
 * Lives on Growth tab in CreatorHomeV2.
 */
import { getAxisTier, SPIDER_AXES } from '../../lib/creatorGamification'
import './CreatorRadarChart.css'

const SIZE = 280
const CENTER = SIZE / 2
const MAX_TIER = 6
const LABEL_OFFSET = 22

function polarToXY(angle, radius) {
  const rad = (angle - 90) * (Math.PI / 180)
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  }
}

function formatPrice(rawValue, currency) {
  if (rawValue == null) return null
  if (currency === 'IDR') {
    return rawValue >= 1000000 ? `Rp${(rawValue / 1000000).toFixed(1)}M` : rawValue >= 1000 ? `Rp${Math.round(rawValue / 1000)}K` : `Rp${rawValue}`
  }
  return `$${rawValue}`
}

export default function CreatorRadarChart({ data = {} }) {
  // Build axes from data — skip reach if not available
  const axisKeys = ['impact', 'consistency', 'retention', 'brand', 'price']
  if (data.reach != null && data.reach > 0) axisKeys.push('reach')

  const axisCount = axisKeys.length
  const angleStep = 360 / axisCount
  const maxRadius = (SIZE / 2) - LABEL_OFFSET - 10

  // Compute tiers per axis
  const tiers = axisKeys.map(key => getAxisTier(key, data[key]))
  const hasAnyData = tiers.some(t => t > 0)

  // Generate ring polygons (concentric)
  const rings = Array.from({ length: MAX_TIER }, (_, ringIdx) => {
    const ringRadius = maxRadius * ((ringIdx + 1) / MAX_TIER)
    const points = axisKeys.map((_, i) => {
      const angle = i * angleStep
      return polarToXY(angle, ringRadius)
    })
    return points.map(p => `${p.x},${p.y}`).join(' ')
  })

  // Generate data polygon
  const dataPoints = axisKeys.map((_, i) => {
    const tier = tiers[i]
    const radius = maxRadius * (tier / MAX_TIER)
    const angle = i * angleStep
    return polarToXY(angle, Math.max(radius, 4))
  })
  const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  // Generate axis lines
  const axisLines = axisKeys.map((_, i) => {
    const angle = i * angleStep
    const end = polarToXY(angle, maxRadius)
    return { x1: CENTER, y1: CENTER, x2: end.x, y2: end.y }
  })

  // Generate labels
  const labels = axisKeys.map((key, i) => {
    const angle = i * angleStep
    const pos = polarToXY(angle, maxRadius + LABEL_OFFSET)
    const axis = SPIDER_AXES[key]
    const tier = tiers[i]
    const value = data[key]
    return {
      ...pos,
      label: axis.label,
      tier,
      value: value != null ? (axis.unit === '%' ? `${Math.round(value)}%` : axis.unit === '/15' ? `${value}/15` : axis.unit === 'usd' ? formatPrice(data.priceRaw ?? value, data.priceCurrency) : String(Math.round(value))) : null,
    }
  })

  return (
    <div className="cr-radar">
      <div className="cr-radar-header">
        <span className="cr-radar-label">YOUR SHAPE</span>
      </div>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="cr-radar-svg">
        {/* Background rings */}
        {rings.map((points, i) => (
          <polygon
            key={`ring-${i}`}
            points={points}
            className={`cr-ring ${i === MAX_TIER - 1 ? 'cr-ring-outer' : ''}`}
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((line, i) => (
          <line key={`axis-${i}`} {...line} className="cr-axis-line" />
        ))}

        {/* Data fill */}
        {hasAnyData && (
          <polygon points={dataPolygon} className="cr-data-fill" />
        )}

        {/* Data points */}
        {dataPoints.map((p, i) => (
          tiers[i] > 0 && (
            <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={4} className="cr-data-dot" />
          )
        ))}

        {/* Labels */}
        {labels.map((l, i) => (
          <g key={`label-${i}`}>
            <text
              x={l.x}
              y={l.y - 6}
              className="cr-label-name"
              textAnchor="middle"
              dominantBaseline="auto"
            >
              {l.label}
            </text>
            {l.value != null && (
              <text
                x={l.x}
                y={l.y + 8}
                className={`cr-label-value ${l.tier > 0 ? 'cr-label-active' : ''}`}
                textAnchor="middle"
                dominantBaseline="auto"
              >
                {l.value}
              </text>
            )}
          </g>
        ))}
      </svg>

      {!hasAnyData && (
        <div className="cr-radar-empty">
          Run your first experience to see your shape grow.
        </div>
      )}
    </div>
  )
}
