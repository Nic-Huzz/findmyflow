// src/components/Celebrations/LevelUpModal.jsx
// Full-screen celebration for leveling up — shows level name, emoji, and description

import { useEffect } from 'react'
import { triggerSideCannons } from './Confetti'
import { getLevel, LEVELS } from '../../lib/crm/statsService'
import './Celebrations.css'

export default function LevelUpModal({ level, onClose }) {
  useEffect(() => {
    triggerSideCannons()
    // Second burst after a beat
    const burst2 = setTimeout(() => triggerSideCannons(), 600)
    const timer = setTimeout(() => onClose?.(), 8000)
    return () => { clearTimeout(timer); clearTimeout(burst2) }
  }, [onClose])

  if (!level) return null

  // level can be a number (legacy) or a level object
  const levelInfo = typeof level === 'number'
    ? LEVELS[level - 1] || LEVELS[0]
    : level

  return (
    <div className="level-up-overlay" onClick={onClose}>
      <div className="level-up-modal" onClick={e => e.stopPropagation()}>
        <div className="level-badge">{levelInfo.emoji || '⭐'}</div>
        <h2>Level Up!</h2>
        <div className="level-up-name">{levelInfo.name}</div>
        {levelInfo.description && (
          <p className="level-up-desc">{levelInfo.description}</p>
        )}
        <button onClick={onClose}>
          Keep Rising
        </button>
      </div>
    </div>
  )
}
