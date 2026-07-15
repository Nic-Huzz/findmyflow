// src/components/Celebrations/LevelUpModal.jsx
// Full-screen celebration for leveling up — shows level name, emoji, and description

import { useEffect } from 'react'
import { triggerSideCannons } from './Confetti'
import { getLevel, LEVELS } from '../../lib/crm/statsService'
import './Celebrations.css'

export default function LevelUpModal({ level, onClose }) {
  const isGraduation = level?.isGraduation
  const dismissTime = isGraduation ? 10000 : 8000

  useEffect(() => {
    if (!isGraduation) {
      triggerSideCannons()
      // Second burst after a beat
      const burst2 = setTimeout(() => triggerSideCannons(), 600)
      const timer = setTimeout(() => onClose?.(), dismissTime)
      return () => { clearTimeout(timer); clearTimeout(burst2) }
    }
    // Graduation confetti is handled by celebrateStageGraduation
    const timer = setTimeout(() => onClose?.(), dismissTime)
    return () => clearTimeout(timer)
  }, [onClose, isGraduation, dismissTime])

  if (!level) return null

  // level can be a number (legacy) or a level object
  const levelInfo = typeof level === 'number'
    ? (LEVELS[level - 1] || LEVELS[LEVELS.length - 1])
    : level

  return (
    <div className="level-up-overlay" onClick={onClose}>
      <div className={`level-up-modal${isGraduation ? ' graduation' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="level-badge">{levelInfo.emoji || '\u2B50'}</div>
        {!isGraduation && <h2>Level Up!</h2>}
        <div className={`level-up-name${isGraduation ? ' graduation-message' : ''}`}>{levelInfo.name}</div>
        {levelInfo.description && (
          <p className="level-up-desc">{levelInfo.description}</p>
        )}
        <button onClick={onClose}>
          {isGraduation ? 'Continue' : 'Keep Rising'}
        </button>
      </div>
    </div>
  )
}
