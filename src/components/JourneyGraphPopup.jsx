import { useEffect } from 'react'
import './JourneyGraphPopup.css'

export default function JourneyGraphPopup({ isOpen, onClose, currentLevel = 1 }) {
  // Close on escape
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="journey-graph-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="journey-graph-popup">
        <button className="journey-graph-close" onClick={onClose}>&times;</button>
        <h3 className="journey-graph-title">Your Journey</h3>
        <p className="journey-graph-subtitle">Sprouter Sweet Spot: Self-Knowledge x Action</p>

        <div className="journey-graph-container">
          <svg viewBox="0 0 300 300" className="journey-graph-svg">
            {/* Background */}
            <rect x="40" y="10" width="250" height="250" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />

            {/* Grid */}
            <line x1="40" y1="135" x2="290" y2="135" stroke="rgba(255,255,255,0.05)" />
            <line x1="165" y1="10" x2="165" y2="260" stroke="rgba(255,255,255,0.05)" />

            {/* Diagonal */}
            <line x1="40" y1="260" x2="290" y2="10" stroke="rgba(233,162,59,0.2)" strokeWidth="20" strokeLinecap="round" />
            <line x1="40" y1="260" x2="290" y2="10" stroke="rgba(233,162,59,0.15)" strokeWidth="2" strokeDasharray="6 4" />

            {/* Zone labels */}
            <text x="80" y="60" fill="rgba(239,68,68,0.4)" fontSize="10" fontWeight="600">Misguided Zone</text>
            <text x="75" y="75" fill="rgba(239,68,68,0.25)" fontSize="8">All action, no self-knowledge</text>
            <text x="180" y="230" fill="rgba(94,23,235,0.4)" fontSize="10" fontWeight="600">Paralysis Zone</text>
            <text x="175" y="245" fill="rgba(94,23,235,0.25)" fontSize="8">Self-knowledge, no action</text>

            {/* Diagonal label */}
            <text x="160" y="120" fill="rgba(233,162,59,0.6)" fontSize="9" fontWeight="700" transform="rotate(-45, 160, 120)">Self-Actualisation</text>

            {/* Current position (pulsing) */}
            <circle cx="230" cy="220" r="8" fill="rgba(233,162,59,0.2)">
              <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="230" cy="220" r="5" fill="#E9A23B" />
            <text x="238" y="218" fill="#E9A23B" fontSize="8" fontWeight="700">You</text>
            <text x="238" y="228" fill="rgba(233,162,59,0.6)" fontSize="7">Level 1</text>

            {/* Axes */}
            <line x1="40" y1="260" x2="290" y2="260" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <line x1="40" y1="260" x2="40" y2="10" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <text x="150" y="280" fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle" fontWeight="600">Self-Knowledge</text>
            <text x="15" y="140" fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle" fontWeight="600" transform="rotate(-90, 15, 140)">Action</text>
          </svg>
        </div>

        <p className="journey-graph-caption">
          You started in the Paralysis Zone. You're moving toward the diagonal.
          <br />
          <span className="journey-graph-highlight">Keep building self-knowledge. Action follows.</span>
        </p>
      </div>
    </div>
  )
}
