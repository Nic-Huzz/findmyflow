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
  tiny: 0.3,
  small: 0.5,
  medium: 0.75,
  large: 1.0,
  massive: 1.4,
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

// Texture → SVG filter ID
const TEXTURE_FILTERS = {
  rough: 'splinter-filter-rough',
  smooth: 'splinter-filter-smooth',
  burning: 'splinter-filter-burning',
  cold: 'splinter-filter-cold',
  sharp: 'splinter-filter-sharp',
  heavy: 'splinter-filter-heavy',
  tight: 'splinter-filter-tight',
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
          <circle cx="0" cy="0" r="18" fill={fillColor} opacity="0.7" />
          <circle cx="0" cy="0" r="10" fill="rgba(0,0,0,0.5)" />
        </>
      )
    case 'cloud':
      return (
        <>
          <ellipse cx="-8" cy="0" rx="12" ry="10" fill={fillColor} opacity="0.8" />
          <ellipse cx="8" cy="-4" rx="10" ry="8" fill={fillColor} opacity="0.7" />
          <ellipse cx="4" cy="6" rx="11" ry="9" fill={fillColor} opacity="0.6" />
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
  const scale = SIZE_SCALES[size] || 0.75
  const movementClass = animate ? (MOVEMENT_CLASSES[movement] || '') : ''
  const filterId = TEXTURE_FILTERS[texture] || 'splinter-filter-rough'
  const isMorphing = !!morphFrom

  // In body mode, position the splinter on the silhouette
  const pos = BODY_LOCATIONS[location] || BODY_LOCATIONS.chest

  if (showBody) {
    return (
      <div className={`splinter-vis ${compact ? 'splinter-vis--compact' : ''}`}>
        <svg
          viewBox="0 0 300 440"
          className="splinter-vis__svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>{renderFilters(color)}</defs>

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

          {/* Splinter */}
          <g
            className={`splinter-vis__shape ${movementClass} ${isMorphing ? 'splinter-vis__morphing' : ''}`}
            transform={`translate(${pos.x}, ${pos.y}) scale(${scale})`}
            filter={`url(#${filterId})`}
            style={{ willChange: 'transform' }}
          >
            {renderShape(shape, color)}
          </g>
        </svg>
      </div>
    )
  }

  // Abstract standalone mode
  const svgSize = compact ? 100 : 200
  return (
    <div className={`splinter-vis splinter-vis--standalone ${compact ? 'splinter-vis--compact' : ''}`}>
      {/* Ambient rings */}
      {!compact && (
        <div className="splinter-vis__rings">
          <div className="splinter-vis__ring" style={{ borderColor: `${color}20` }} />
          <div className="splinter-vis__ring splinter-vis__ring--outer" style={{ borderColor: `${color}10` }} />
        </div>
      )}

      <svg
        viewBox="0 0 200 200"
        width={svgSize}
        height={svgSize}
        className="splinter-vis__svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>{renderFilters(color)}</defs>

        {/* Inner glow */}
        <radialGradient id="splinter-inner-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        {!compact && <circle cx="100" cy="100" r="60" fill="url(#splinter-inner-glow)" />}

        <g
          className={`splinter-vis__shape ${movementClass} ${isMorphing ? 'splinter-vis__morphing' : ''}`}
          transform={`translate(100, 100) scale(${scale})`}
          filter={`url(#${filterId})`}
          style={{ willChange: 'transform' }}
        >
          {renderShape(shape, color)}
        </g>
      </svg>
    </div>
  )
}

// SVG filter definitions for each texture
function renderFilters(color) {
  return (
    <>
      {/* Rough — feTurbulence displacement */}
      <filter id="splinter-filter-rough" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
        <feGaussianBlur stdDeviation="0.5" />
      </filter>

      {/* Smooth — soft blur */}
      <filter id="splinter-filter-smooth" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
      </filter>

      {/* Burning — turbulence + warm flood */}
      <filter id="splinter-filter-burning" x="-30%" y="-30%" width="160%" height="160%">
        <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" result="displaced" />
        <feGaussianBlur in="displaced" stdDeviation="1.5" result="blur" />
        <feFlood floodColor="#ff6600" floodOpacity="0.3" result="warm" />
        <feComposite in="warm" in2="blur" operator="in" result="warmGlow" />
        <feMerge>
          <feMergeNode in="warmGlow" />
          <feMergeNode in="displaced" />
        </feMerge>
      </filter>

      {/* Cold — blur + blue tint */}
      <filter id="splinter-filter-cold" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
        <feFlood floodColor="#60a5fa" floodOpacity="0.2" result="blue" />
        <feComposite in="blue" in2="blur" operator="in" result="blueGlow" />
        <feMerge>
          <feMergeNode in="blueGlow" />
          <feMergeNode in="blur" />
        </feMerge>
      </filter>

      {/* Sharp — morphology erode for crisp edges */}
      <filter id="splinter-filter-sharp" x="-10%" y="-10%" width="120%" height="120%">
        <feMorphology operator="erode" radius="0.5" in="SourceGraphic" result="sharp" />
        <feGaussianBlur in="sharp" stdDeviation="0.3" />
      </filter>

      {/* Heavy — drop shadow for weight */}
      <filter id="splinter-filter-heavy" x="-20%" y="-20%" width="140%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="shadow" />
        <feOffset in="shadow" dx="0" dy="4" result="offsetShadow" />
        <feFlood floodColor="rgba(0,0,0,0.4)" result="shadowColor" />
        <feComposite in="shadowColor" in2="offsetShadow" operator="in" result="darkShadow" />
        <feMerge>
          <feMergeNode in="darkShadow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Tight — morphology dilate for constricted feel */}
      <filter id="splinter-filter-tight" x="-10%" y="-10%" width="120%" height="120%">
        <feMorphology operator="dilate" radius="0.5" in="SourceGraphic" result="dilated" />
        <feGaussianBlur in="dilated" stdDeviation="0.5" />
      </filter>

      {/* Glow filter (used by shapes internally) */}
      <filter id="splinter-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feFlood floodColor={color} floodOpacity="0.4" result="glowColor" />
        <feComposite in="glowColor" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </>
  )
}

// Export constants for use by parent components (body scan step, check-in)
export { BODY_LOCATIONS, SIZE_SCALES, MOVEMENT_CLASSES, TEXTURE_FILTERS }

export default SplinterVisualization
