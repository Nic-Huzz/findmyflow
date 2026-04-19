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
    <svg viewBox="0 0 400 440" style={{ width, borderRadius: 16, display: 'block' }}>
      {/* Purple background */}
      <rect width="400" height="440" rx="16" fill="#5e17eb" />

      {/* Title */}
      <text x="200" y="50" textAnchor="middle" fill="white" fontSize="24" fontWeight="800" fontStyle="italic">
        {title}
      </text>

      {/* Axes (white, thick) */}
      <line x1="80" y1="350" x2="80" y2="80" stroke="white" strokeWidth="5" />
      <line x1="80" y1="350" x2="350" y2="350" stroke="white" strokeWidth="5" />

      {/* Diagonal (gold, thick) */}
      <line x1="110" y1="320" x2="320" y2="110" stroke="#E9A23B" strokeWidth="5" />

      {/* Y axis label */}
      <text
        x="35"
        y="215"
        textAnchor="middle"
        fill="white"
        fontSize="16"
        fontWeight="800"
        transform="rotate(-90, 35, 215)"
      >
        {yAxis}
      </text>

      {/* X axis label */}
      <text x="215" y="400" textAnchor="middle" fill="white" fontSize="16" fontWeight="800">
        {xAxis}
      </text>

      {/* Top left zone */}
      <text x="155" y="140" fill="white" fontSize="16" fontWeight="800" textAnchor="middle">
        {zones.topLeft.name.toUpperCase()}
      </text>
      {zones.topLeft.description && (
        <text x="155" y="160" fill="rgba(255,255,255,0.65)" fontSize="11" textAnchor="middle">
          {zones.topLeft.description}
        </text>
      )}

      {/* Diagonal zone label (offset below the line for readability) */}
      <text
        x="245"
        y="230"
        fill="white"
        fontSize="13"
        fontWeight="800"
        textAnchor="middle"
        transform="rotate(-45, 245, 230)"
      >
        {zones.diagonal.name.toUpperCase()}
      </text>

      {/* Bottom right zone */}
      <text x="255" y="310" fill="white" fontSize="16" fontWeight="800" textAnchor="middle">
        {zones.bottomRight.name.toUpperCase()}
      </text>
      {zones.bottomRight.description && (
        <text x="255" y="330" fill="rgba(255,255,255,0.65)" fontSize="11" textAnchor="middle">
          {zones.bottomRight.description}
        </text>
      )}
    </svg>
  )
}
