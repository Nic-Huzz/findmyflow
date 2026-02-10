import './ProtectiveArchetypeIcon.css'

const icons = {
  'People Pleaser': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className="protective-icon">
      <g className="prot-pleaser-hand-left" opacity="0.4">
        <path d="M10 55 Q5 50 10 45 L22 48 Q18 52 22 55Z" fill="#5e17eb" opacity="0.5"/>
        <circle cx="10" cy="50" r="4" fill="#5e17eb" opacity="0.3"/>
      </g>
      <g className="prot-pleaser-hand-right" opacity="0.4">
        <path d="M90 45 Q95 50 90 55 L78 52 Q82 48 78 45Z" fill="#5e17eb" opacity="0.5"/>
        <circle cx="90" cy="50" r="4" fill="#5e17eb" opacity="0.3"/>
      </g>
      <g className="prot-pleaser-heart">
        <path d="M50 75 L30 52 Q25 40 35 35 Q45 30 50 42 Q55 30 65 35 Q75 40 70 52Z"
              fill="url(#prot-pleaser-grad)" stroke="#5e17eb" strokeWidth="2"/>
        <path d="M50 65 L38 52 Q35 45 42 42 Q48 39 50 48 Q52 39 58 42 Q65 45 62 52Z"
              fill="white" opacity="0.3"/>
      </g>
      <line x1="30" y1="50" x2="22" y2="48" stroke="#5e17eb" strokeWidth="1.5" opacity="0.3" strokeLinecap="round"/>
      <line x1="70" y1="50" x2="78" y2="48" stroke="#5e17eb" strokeWidth="1.5" opacity="0.3" strokeLinecap="round"/>
      <defs>
        <linearGradient id="prot-pleaser-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6"/>
          <stop offset="100%" stopColor="#5e17eb"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  'Performer': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className="protective-icon">
      <g className="prot-performer-spotlight">
        <path d="M50 15 L30 85 L70 85Z" fill="url(#prot-spotlight-grad)" opacity="0.15"/>
      </g>
      <line x1="20" y1="85" x2="80" y2="85" stroke="#5e17eb" strokeWidth="2" opacity="0.3" strokeLinecap="round"/>
      <g className="prot-performer-star">
        <polygon points="50,25 54,40 70,40 57,50 62,65 50,55 38,65 43,50 30,40 46,40"
                 fill="url(#prot-star-grad)" stroke="#E9A23B" strokeWidth="1.5"/>
        <polygon points="50,32 53,42 62,42 55,48 58,58 50,52 42,58 45,48 38,42 47,42"
                 fill="white" opacity="0.3"/>
      </g>
      <circle className="prot-performer-sparkle-1" cx="25" cy="30" r="2.5" fill="#E9A23B"/>
      <circle className="prot-performer-sparkle-2" cx="78" cy="35" r="2" fill="#E9A23B"/>
      <circle className="prot-performer-sparkle-3" cx="35" cy="70" r="1.5" fill="#8b5cf6"/>
      <defs>
        <linearGradient id="prot-spotlight-grad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#E9A23B"/>
          <stop offset="100%" stopColor="#E9A23B" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="prot-star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E9A23B"/>
          <stop offset="100%" stopColor="#d4891f"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  'Controller': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className="protective-icon">
      <g className="prot-controller-grid" opacity="0.2">
        <line x1="20" y1="20" x2="20" y2="80" stroke="#5e17eb" strokeWidth="1"/>
        <line x1="40" y1="20" x2="40" y2="80" stroke="#5e17eb" strokeWidth="1"/>
        <line x1="60" y1="20" x2="60" y2="80" stroke="#5e17eb" strokeWidth="1"/>
        <line x1="80" y1="20" x2="80" y2="80" stroke="#5e17eb" strokeWidth="1"/>
        <line x1="20" y1="20" x2="80" y2="20" stroke="#5e17eb" strokeWidth="1"/>
        <line x1="20" y1="40" x2="80" y2="40" stroke="#5e17eb" strokeWidth="1"/>
        <line x1="20" y1="60" x2="80" y2="60" stroke="#5e17eb" strokeWidth="1"/>
        <line x1="20" y1="80" x2="80" y2="80" stroke="#5e17eb" strokeWidth="1"/>
      </g>
      <g className="prot-controller-lock">
        <rect x="36" y="48" width="28" height="22" rx="4" fill="url(#prot-lock-grad)" stroke="#5e17eb" strokeWidth="2"/>
        <path d="M40 48 L40 38 Q40 28 50 28 Q60 28 60 38 L60 48" fill="none" stroke="#5e17eb" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="50" cy="57" r="3" fill="white" opacity="0.6"/>
        <rect x="49" y="57" width="2" height="6" rx="1" fill="white" opacity="0.6"/>
      </g>
      <g className="prot-controller-bolt">
        <circle cx="20" cy="20" r="3" fill="#5e17eb" opacity="0.4"/>
        <circle cx="80" cy="20" r="3" fill="#5e17eb" opacity="0.4"/>
        <circle cx="20" cy="80" r="3" fill="#5e17eb" opacity="0.4"/>
        <circle cx="80" cy="80" r="3" fill="#5e17eb" opacity="0.4"/>
      </g>
      <defs>
        <linearGradient id="prot-lock-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed"/>
          <stop offset="100%" stopColor="#5e17eb"/>
        </linearGradient>
      </defs>
    </svg>
  ),

  'Perfectionist': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className="protective-icon prot-perfectionist-svg">
      <circle className="prot-perfectionist-circle"
              cx="50" cy="50" r="18"
              fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round"
              transform="rotate(-90 50 50)"/>
      <text x="50" y="47" textAnchor="middle" fontSize="14" fontWeight="700" fill="#5e17eb">99</text>
      <text x="50" y="60" textAnchor="middle" fontSize="9" fill="#8b5cf6" opacity="0.7">%</text>
      <g opacity="0.4">
        <line className="prot-perfectionist-tick" x1="50" y1="26" x2="50" y2="30" stroke="#5e17eb" strokeWidth="2" strokeLinecap="round"/>
        <line className="prot-perfectionist-tick" x1="74" y1="50" x2="70" y2="50" stroke="#5e17eb" strokeWidth="2" strokeLinecap="round"/>
        <line className="prot-perfectionist-tick" x1="50" y1="74" x2="50" y2="70" stroke="#5e17eb" strokeWidth="2" strokeLinecap="round"/>
        <line className="prot-perfectionist-tick" x1="26" y1="50" x2="30" y2="50" stroke="#5e17eb" strokeWidth="2" strokeLinecap="round"/>
        <line className="prot-perfectionist-tick" x1="67" y1="33" x2="64" y2="36" stroke="#5e17eb" strokeWidth="1.5" strokeLinecap="round"/>
        <line className="prot-perfectionist-tick" x1="67" y1="67" x2="64" y2="64" stroke="#5e17eb" strokeWidth="1.5" strokeLinecap="round"/>
        <line className="prot-perfectionist-tick" x1="33" y1="67" x2="36" y2="64" stroke="#5e17eb" strokeWidth="1.5" strokeLinecap="round"/>
        <line className="prot-perfectionist-tick" x1="33" y1="33" x2="36" y2="36" stroke="#5e17eb" strokeWidth="1.5" strokeLinecap="round"/>
      </g>
      <g className="prot-perfectionist-eraser">
        <rect x="62" y="34" width="8" height="5" rx="2" fill="#E9A23B" opacity="0.6" transform="rotate(15 66 37)"/>
      </g>
    </svg>
  ),

  'Ghost': ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" className="protective-icon">
      <circle className="prot-ghost-wisp-1" cx="42" cy="35" r="3" fill="#8b5cf6" opacity="0"/>
      <circle className="prot-ghost-wisp-2" cx="55" cy="30" r="2.5" fill="#a78bfa" opacity="0"/>
      <circle className="prot-ghost-wisp-3" cx="48" cy="40" r="2" fill="#c4b5fd" opacity="0"/>
      <g className="prot-ghost-figure">
        <path d="M35 80 L35 45 Q35 25 50 25 Q65 25 65 45 L65 80 L58 73 L50 80 L42 73Z"
              fill="url(#prot-ghost-grad)" stroke="none"/>
        <circle cx="43" cy="45" r="2.5" fill="white" opacity="0.4"/>
        <circle cx="57" cy="45" r="2.5" fill="white" opacity="0.4"/>
        <path d="M40 80 L40 47 Q40 30 50 30 Q58 30 60 42"
              fill="none" stroke="white" strokeWidth="2" opacity="0.15" strokeLinecap="round"/>
      </g>
      <ellipse cx="50" cy="84" rx="18" ry="3" fill="#5e17eb" opacity="0.08"/>
      <defs>
        <linearGradient id="prot-ghost-grad" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#5e17eb" stopOpacity="0.2"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function ProtectiveArchetypeIcon({ archetype, size = 80 }) {
  const IconComponent = icons[archetype]
  if (!IconComponent) return null
  return (
    <div className="protective-archetype-icon" style={{ width: size, height: size }}>
      <IconComponent size={size} />
    </div>
  )
}
