import { useState, useCallback, useRef } from 'react'
import { ZONE_CAL_DIMENSIONS } from '../data/zoneCalDimensions'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './ZoneCalCheckin.css'

/**
 * ZoneCalCheckin — Inline 8-question self-report check-in.
 *
 * Props:
 *  - previousScores  — { identity: 3, ... } or null (first check-in)
 *  - onComplete      — (scores: { identity: 3, ... }) => void
 *  - onClose         — () => void (cancel/dismiss)
 */
export default function ZoneCalCheckin({ previousScores, onComplete, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const advanceTimer = useRef(null)

  const dim = ZONE_CAL_DIMENSIONS[currentIndex]
  const isRepairPhase = currentIndex <= 3
  const prevLevel = previousScores?.[dim?.id]
  const prevTier = prevLevel
    ? dim.levels.find(l => l.level === prevLevel)
    : null

  const goBack = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  const handleTierSelect = useCallback((level) => {
    hapticLight()
    const dimId = ZONE_CAL_DIMENSIONS[currentIndex].id
    const newAnswers = { ...answers, [dimId]: level }
    setAnswers(newAnswers)

    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceTimer.current = setTimeout(() => {
      if (currentIndex < ZONE_CAL_DIMENSIONS.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // All 8 answered
        hapticSuccess()
        onComplete(newAnswers)
      }
      advanceTimer.current = null
    }, 300)
  }, [currentIndex, answers, onComplete])

  if (!dim) return null

  return (
    <div className="zcc-overlay">
      <div className="zcc-inner">
        {/* Close button */}
        <button className="zcc-close" onClick={onClose}>✕</button>

        {/* Progress dots */}
        <div className="zcc-progress">
          {ZONE_CAL_DIMENSIONS.map((d, i) => (
            <div
              key={d.id}
              className={`zcc-dot ${i <= currentIndex ? 'active' : ''} ${i === currentIndex ? 'current' : ''}`}
            />
          ))}
        </div>

        {/* Phase label */}
        <div className="zcc-phase">
          {isRepairPhase ? 'Inner work' : 'Outer work'} · {currentIndex + 1} of 8
        </div>

        {/* Back button */}
        {currentIndex > 0 && (
          <button className="zcc-back" onClick={goBack}>Back</button>
        )}

        {/* Question */}
        <div className="zcc-emoji">{dim.emoji}</div>
        <h2 className="zcc-title">{dim.name}</h2>
        <p className="zcc-question">{dim.question}</p>

        {/* Previous answer context (not pre-selected) */}
        {prevTier && (
          <div className="zcc-prev-label">
            Last time: Level {prevLevel} — {prevTier.label}
          </div>
        )}

        {/* Tier cards */}
        <div className="zcc-tiers">
          {dim.levels.map(tier => (
            <div
              key={tier.level}
              className={`zcc-tier ${answers[dim.id] === tier.level ? 'selected' : ''}`}
              onClick={() => handleTierSelect(tier.level)}
            >
              <div className="zcc-tier-level">{tier.level}</div>
              <div className="zcc-tier-content">
                <div className="zcc-tier-label">{tier.label}</div>
                <div className="zcc-tier-desc">{tier.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
