/**
 * SweetSpotGraph.jsx
 *
 * Reusable SVG graph showing a 2D sweet-spot matrix.
 * Brand purple (#5e17eb) background, gold (#E9A23B) diagonal,
 * white axes and labels.
 *
 * Props: title, yAxis, xAxis, zones (topLeft/diagonal/bottomRight)
 *
 * Created: 2026-03-27
 */

export default function SweetSpotGraph({ title, yAxis, xAxis, zones, width = '100%' }) {
  return (
    <svg viewBox="0 0 400 420" style={{ width, borderRadius: 16, display: 'block' }}>
      {/* Purple background */}
      <rect width="400" height="420" rx="16" fill="#5e17eb" />

      {/* Title */}
      <text x="200" y="45" textAnchor="middle" fill="white" fontSize="22" fontWeight="800">
        {title}
      </text>

      {/* Axes */}
      <line x1="80" y1="340" x2="80" y2="80" stroke="white" strokeWidth="4" />
      <line x1="80" y1="340" x2="340" y2="340" stroke="white" strokeWidth="4" />

      {/* Arrowheads */}
      <polygon points="80,75 74,90 86,90" fill="white" />
      <polygon points="345,340 330,334 330,346" fill="white" />

      {/* Diagonal (gold) */}
      <line x1="110" y1="310" x2="310" y2="110" stroke="#E9A23B" strokeWidth="4" />

      {/* Y axis label */}
      <text
        x="30"
        y="210"
        textAnchor="middle"
        fill="white"
        fontSize="14"
        fontWeight="700"
        transform="rotate(-90, 30, 210)"
      >
        {yAxis}
      </text>

      {/* X axis label */}
      <text x="210" y="390" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">
        {xAxis}
      </text>

      {/* Top left zone */}
      <text x="150" y="130" fill="white" fontSize="13" fontWeight="800" textAnchor="middle">
        {zones.topLeft.name.toUpperCase()}
      </text>
      {zones.topLeft.description && (
        <text x="150" y="150" fill="rgba(255,255,255,0.7)" fontSize="10" textAnchor="middle">
          {zones.topLeft.description}
        </text>
      )}

      {/* Diagonal zone (gold) */}
      <text
        x="220"
        y="200"
        fill="#E9A23B"
        fontSize="14"
        fontWeight="800"
        textAnchor="middle"
        transform="rotate(-45, 220, 200)"
      >
        {zones.diagonal.name.toUpperCase()}
      </text>

      {/* Bottom right zone */}
      <text x="270" y="300" fill="white" fontSize="13" fontWeight="800" textAnchor="middle">
        {zones.bottomRight.name.toUpperCase()}
      </text>
      {zones.bottomRight.description && (
        <text x="270" y="320" fill="rgba(255,255,255,0.7)" fontSize="10" textAnchor="middle">
          {zones.bottomRight.description}
        </text>
      )}
    </svg>
  )
}
