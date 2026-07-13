import { useState } from 'react'
import { openMysteryBox } from '../../lib/mysteryBoxes'
import { hapticSuccess } from '../../lib/haptics'
import confetti from 'canvas-confetti'
import './MysteryBox.css'

const TIER_CONFIG = {
  bronze: { label: 'Bronze', color: '#cd7f32', confettiColors: ['#cd7f32', '#daa520', '#b8860b'] },
  silver: { label: 'Silver', color: '#c0c0c0', confettiColors: ['#c0c0c0', '#e0e0e0', '#a8a8a8'] },
  gold: { label: 'Gold', color: '#E9A23B', confettiColors: ['#E9A23B', '#f5c55a', '#fbbf24'] },
  legendary: { label: 'Legendary', color: '#5e17eb', confettiColors: ['#5e17eb', '#8b5cf6', '#E9A23B'] },
}

const CONTENT_LABELS = {
  pattern_mirror: 'Pattern Mirror',
  shadow_reveal: 'Shadow Reveal',
  capacity_equation: 'Capacity Insight',
}

/**
 * MysteryBoxModal — full-screen box opening animation.
 * Phase 1: Sealed box (tap to open)
 * Phase 2: Loading (generating insight)
 * Phase 3: Insight revealed
 */
export default function MysteryBoxModal({ box, onClose }) {
  const [phase, setPhase] = useState('sealed') // sealed | loading | revealed
  const [insight, setInsight] = useState(null)
  const [error, setError] = useState(null)

  const tier = TIER_CONFIG[box.box_tier] || TIER_CONFIG.bronze

  const handleOpen = async () => {
    setPhase('loading')
    try {
      const result = await openMysteryBox(box.id)
      setInsight(result)
      setPhase('revealed')
      hapticSuccess?.()

      // Tier-appropriate confetti
      if (box.box_tier === 'legendary') {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: tier.confettiColors })
        setTimeout(() => confetti({ particleCount: 100, spread: 120, origin: { y: 0.4 }, colors: tier.confettiColors }), 300)
      } else if (box.box_tier === 'gold') {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: tier.confettiColors })
      } else {
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 }, colors: tier.confettiColors })
      }
    } catch (err) {
      setError('Could not generate your insight right now. Try again later.')
      setPhase('sealed')
    }
  }

  return (
    <div className="mb-overlay" onClick={() => phase === 'revealed' && onClose(insight)}>
      <div className="mb-card" onClick={e => e.stopPropagation()}>

        {/* Sealed */}
        {phase === 'sealed' && (
          <div className="mb-sealed">
            <div className="mb-box-container" style={{ '--tier-color': tier.color }}>
              <span className="mb-box-emoji">🎁</span>
            </div>
            <p className="mb-tier-label" style={{ color: tier.color }}>{tier.label} AI Mirror</p>
            <p className="mb-trigger-text">
              {box.trigger_type === 'first_wahoo' && 'Earned for completing your first wahoo'}
              {box.trigger_type === 'streak_7' && 'Earned for a 7-day streak'}
              {box.trigger_type === '30_day_streak' && 'Earned for a 30-day streak'}
              {box.trigger_type?.startsWith('new_category_') && 'Earned for trying a new wahoo category'}
              {box.trigger_type?.startsWith('zone_') && 'Earned for reaching a new capacity zone'}
            </p>
            <button className="mb-open-btn" onClick={handleOpen}>
              Open
            </button>
            {error && <p className="mb-error">{error}</p>}
          </div>
        )}

        {/* Loading */}
        {phase === 'loading' && (
          <div className="mb-loading">
            <div className="mb-box-container mb-box-shaking" style={{ '--tier-color': tier.color }}>
              <span className="mb-box-emoji">🎁</span>
            </div>
            <p className="mb-loading-text">Your AI is reading your patterns...</p>
          </div>
        )}

        {/* Revealed */}
        {phase === 'revealed' && insight && (
          <div className="mb-revealed">
            <p className="mb-content-label" style={{ color: tier.color }}>
              {CONTENT_LABELS[insight.content_type] || 'AI Mirror'}
            </p>
            <p className="mb-insight">{insight.content}</p>
            <button className="mb-close-btn" onClick={() => onClose(insight)}>
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
