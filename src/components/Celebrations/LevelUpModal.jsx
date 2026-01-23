// src/components/Celebrations/LevelUpModal.jsx
// Full-screen celebration for leveling up

import { useEffect } from 'react'
import { triggerSideCannons } from './Confetti'
import './Celebrations.css'

export default function LevelUpModal({ level, onClose }) {
  useEffect(() => {
    // Trigger confetti on mount
    triggerSideCannons()

    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose?.()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  if (!level) return null

  return (
    <div className="level-up-overlay" onClick={onClose}>
      <div className="level-up-modal" onClick={e => e.stopPropagation()}>
        <div className="level-badge">⭐</div>
        <h2>Level Up!</h2>
        <div className="level-number">{level}</div>
        <p>Keep executing and you'll reach new heights!</p>
        <button onClick={onClose}>
          Keep Going
        </button>
      </div>
    </div>
  )
}
