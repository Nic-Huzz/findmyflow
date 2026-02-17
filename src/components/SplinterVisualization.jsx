/**
 * SplinterVisualization — Pure-presentation SVG component
 *
 * Renders an emotional "splinter" with configurable shape, size, color, texture,
 * movement, and optional body silhouette positioning.
 *
 * Props:
 *   location  — body zone key (head, throat, chest, stomach, hips, left_arm, right_arm, thighs)
 *   shape     — spike, knot, weight, wall, void, cloud, flame, ball
 *   size      — tiny, small, medium, large, massive
 *   color     — CSS color string (e.g. '#ef4444', 'red')
 *   texture   — rough, smooth, burning, cold, sharp, heavy, tight
 *   movement  — still, pulsing, spinning, expanding, contracting, vibrating
 *   showBody  — if true, shows body silhouette with splinter positioned on it
 *   animate   — if true, enables movement animations (default true)
 *   morphFrom — previous splinter props; triggers CSS morph transition
 *   compact   — smaller rendering for check-in timeline (default false)
 */

import './SplinterVisualization.css'

// Body zone → SVG coordinates (within 300×440 viewBox)
const BODY_LOCATIONS = {
  head:      { x: 150, y: 45 },
  throat:    { x: 150, y: 90 },
  chest:     { x: 150, y: 135 },
  stomach:   { x: 150, y: 180 },
  hips:      { x: 150, y: 240 },
  left_arm:  { x: 75, y: 170 },
  right_arm: { x: 225, y: 170 },
  thighs:    { x: 150, y: 300 },
}

// Size → scale factor
const SIZE_SCALES = {
  tiny: 0.5,
  small: 0.7,
  medium: 1.0,
  large: 1.3,
  massive: 1.7,
}

// Movement → CSS animation class
const MOVEMENT_CLASSES = {
  still: '',
  pulsing: 'splinter-anim-pulse',
  spinning: 'splinter-anim-spin',
  expanding: 'splinter-anim-expand',
  contracting: 'splinter-anim-contract',
  vibrating: 'splinter-anim-vibrate',
}

// Texture → CSS filter on the WRAPPER div (not on SVG elements)
const TEXTURE_CSS = {
  rough:   'drop-shadow(0 0 4px var(--splinter-color))',
  smooth:  'drop-shadow(0 0 8px var(--splinter-color))',
  burning: 'drop-shadow(0 0 10px #ff6600) drop-shadow(0 0 4px #ff6600)',
  cold:    'drop-shadow(0 0 10px #60a5fa) drop-shadow(0 0 4px #93c5fd)',
  sharp:   'none',
  heavy:   'drop-shadow(0 4px 8px rgba(0,0,0,0.6))',
  tight:   'drop-shadow(0 0 3px var(--splinter-color))',
}

function renderShape(shape, fillColor) {
  switch (shape) {
    case 'spike':
      return <polygon points="0,-28 10,22 -10,22" fill={fillColor} />
    case 'knot':
      return (
        <path
          d="M0,-20 C15,-10 10,10 0,20 C-10,10 -15,-10 0,-20 Z"
          fill={fillColor}
        />
      )
    case 'weight':
      return <rect x="-16" y="-12" width="32" height="24" rx="4" fill={fillColor} />
    case 'wall':
      return <rect x="-22" y="-8" width="44" height="16" rx="2" fill={fillColor} />
    case 'void':
      return (
        <>
          <circle cx="0" cy="0" r="18" fill={fillColor} />
          <circle cx="0" cy="0" r="10" fill="rgba(0,0,0,0.5)" />
        </>
      )
    case 'cloud':
      return (
        <>
          <ellipse cx="-8" cy="0" rx="12" ry="10" fill={fillColor} />
          <ellipse cx="8" cy="-4" rx="10" ry="8" fill={fillColor} opacity="0.9" />
          <ellipse cx="4" cy="6" rx="11" ry="9" fill={fillColor} opacity="0.85" />
        </>
      )
    case 'flame':
      return (
        <path
          d="M0,-24 C8,-12 16,0 10,14 C6,22 -6,22 -10,14 C-16,0 -8,-12 0,-24 Z"
          fill={fillColor}
        />
      )
    case 'ball':
    default:
      return <circle cx="0" cy="0" r="18" fill={fillColor} />
  }
}

function SplinterVisualization({
  location = 'chest',
  shape = 'spike',
  size = 'medium',
  color = '#ef4444',
  texture = 'rough',
  movement = 'pulsing',
  showBody = false,
  animate = true,
  morphFrom = null,
  compact = false,
}) {
  const scale = SIZE_SCALES[size] || 1.0
  const movementClass = animate ? (MOVEMENT_CLASSES[movement] || '') : ''
  const textureCss = TEXTURE_CSS[texture] || 'none'
  const isMorphing = !!morphFrom

  // In body mode, position the splinter on the silhouette
  const pos = BODY_LOCATIONS[location] || BODY_LOCATIONS.chest

  if (showBody) {
    return (
      <div
        className={`splinter-vis ${compact ? 'splinter-vis--compact' : ''}`}
        style={{ '--splinter-color': color, filter: textureCss }}
      >
        <svg
          viewBox="0 0 300 440"
          className="splinter-vis__svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Body silhouette */}
          <g className="splinter-vis__body" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.2">
            <ellipse cx="150" cy="45" rx="28" ry="34" />
            <line x1="140" y1="78" x2="140" y2="100" />
            <line x1="160" y1="78" x2="160" y2="100" />
            <path d="M140,100 Q120,100 90,120" />
            <path d="M160,100 Q180,100 210,120" />
            <path d="M90,120 L85,200 Q85,215 100,220" />
            <path d="M210,120 L215,200 Q215,215 200,220" />
            <path d="M100,220 Q100,240 110,260" />
            <path d="M200,220 Q200,240 190,260" />
            <path d="M90,120 Q70,160 65,200 Q62,215 60,230" />
            <path d="M210,120 Q230,160 235,200 Q238,215 240,230" />
            <path d="M110,260 Q115,320 120,380 Q122,400 118,420" />
            <path d="M190,260 Q185,320 180,380 Q178,400 182,420" />
            <path d="M118,420 Q110,430 105,430" />
            <path d="M182,420 Q190,430 195,430" />
          </g>

          {/* Splinter: outer g = position (baseplate), inner g = animation */}
          <g transform={`translate(${pos.x}, ${pos.y}) scale(${scale})`}>
            <g className={`splinter-vis__shape ${movementClass} ${isMorphing ? 'splinter-vis__morphing' : ''}`}>
              {renderShape(shape, color)}
            </g>
          </g>
        </svg>
      </div>
    )
  }

  // Abstract standalone mode
  const svgSize = compact ? 100 : 200
  return (
    <div
      className={`splinter-vis splinter-vis--standalone ${compact ? 'splinter-vis--compact' : ''}`}
      style={{ '--splinter-color': color, filter: textureCss }}
    >
      <svg
        viewBox="0 0 200 200"
        width={svgSize}
        height={svgSize}
        className="splinter-vis__svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Splinter: outer g = position (baseplate), inner g = animation */}
        <g transform={`translate(100, 100) scale(${scale})`}>
          <g className={`splinter-vis__shape ${movementClass} ${isMorphing ? 'splinter-vis__morphing' : ''}`}>
            {renderShape(shape, color)}
          </g>
        </g>
      </svg>
    </div>
  )
}

// Export constants for use by parent components (body scan step, check-in)
export { BODY_LOCATIONS, SIZE_SCALES, MOVEMENT_CLASSES, TEXTURE_CSS as TEXTURE_FILTERS }

export default SplinterVisualization
