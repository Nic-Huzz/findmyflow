// src/components/Celebrations/LevelUpModal.jsx
// Full-screen celebration for leveling up or stage graduation

import { useState, useEffect } from 'react'
import { triggerSideCannons } from './Confetti'
import { getLevel, LEVELS } from '../../lib/crm/statsService'
import './Celebrations.css'

export default function LevelUpModal({ level, onClose }) {
  const isGraduation = level?.isGraduation
  const dismissTime = isGraduation ? 12000 : 8000
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!isGraduation) {
      triggerSideCannons()
      const burst2 = setTimeout(() => triggerSideCannons(), 600)
      const timer = setTimeout(() => onClose?.(), dismissTime)
      return () => { clearTimeout(timer); clearTimeout(burst2) }
    }
    // Staggered reveal for graduation
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => onClose?.(), dismissTime),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onClose, isGraduation, dismissTime])

  if (!level) return null

  const levelInfo = typeof level === 'number'
    ? (LEVELS[level - 1] || LEVELS[LEVELS.length - 1])
    : level

  // Extract stage number from title (e.g. "Stage 5: Finding Your Way")
  const stageMatch = levelInfo.name?.match(/Stage (\d+)/)
  const stageNum = stageMatch ? parseInt(stageMatch[1]) : null

  if (isGraduation) {
    return (
      <div className="level-up-overlay graduation-overlay" onClick={onClose}>
        <div className="graduation-modal" onClick={e => e.stopPropagation()}>
          {/* Decorative rings */}
          <div className="grad-ring grad-ring-1" />
          <div className="grad-ring grad-ring-2" />

          {/* Avatar or emoji */}
          <div className={`grad-badge ${phase >= 0 ? 'visible' : ''}`}>
            {levelInfo.avatarUrl ? (
              <img src={levelInfo.avatarUrl} alt="" className="grad-avatar" />
            ) : (
              <span className="grad-emoji">{levelInfo.emoji || '⭐'}</span>
            )}
          </div>

          {/* Stage progress dots */}
          {stageNum && (
            <div className={`grad-progress ${phase >= 1 ? 'visible' : ''}`}>
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className={`grad-dot ${i < stageNum ? 'filled' : ''} ${i === stageNum - 1 ? 'current' : ''}`} />
              ))}
            </div>
          )}

          {/* Stage name */}
          <div className={`grad-title ${phase >= 1 ? 'visible' : ''}`}>
            {levelInfo.name}
          </div>

          {/* Message */}
          {levelInfo.description && (
            <p className={`grad-message ${phase >= 2 ? 'visible' : ''}`}>
              {levelInfo.description}
            </p>
          )}

          {/* CTA */}
          <button className={`grad-cta ${phase >= 3 ? 'visible' : ''}`} onClick={onClose}>
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Non-graduation level-up (unchanged)
  return (
    <div className="level-up-overlay" onClick={onClose}>
      <div className="level-up-modal" onClick={e => e.stopPropagation()}>
        <div className="level-badge">{levelInfo.emoji || '⭐'}</div>
        <h2>Level Up!</h2>
        <div className="level-up-name">{levelInfo.name}</div>
        {levelInfo.description && (
          <p className="level-up-desc">{levelInfo.description}</p>
        )}
        <button onClick={onClose}>Keep Rising</button>
      </div>
    </div>
  )
}
