import { useState } from 'react'

const RATING_CONFIGS = [
  {
    key: 'resistance',
    question: 'How much pushback did you feel?',
    emojis: ['😌', '😐', '😬', '😰', '🤯'],
    labels: ['None', '', '', '', 'Intense'],
  },
  {
    key: 'engagement',
    question: 'How much did this light you up?',
    emojis: ['😐', '🙂', '😊', '😄', '🔥'],
    labels: ['Meh', '', '', '', 'On fire'],
  },
  {
    key: 'shift',
    question: 'Did anything actually change?',
    emojis: ['🔄', '💭', '💡', '✨', '🚀'],
    labels: ['Nothing', '', '', '', 'Breakthrough'],
  },
]

export default function ChallengeRating({ founderName, challengeAction, onRate }) {
  const [ratings, setRatings] = useState({
    resistance: null,
    engagement: null,
    shift: null,
  })

  const allRated = ratings.resistance !== null && ratings.engagement !== null && ratings.shift !== null

  function handleSelect(key, value) {
    setRatings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div style={{ paddingTop: 16, paddingBottom: 40 }}>
      <div className="pp-fade-in-up" style={{ textAlign: 'center', marginBottom: 8 }}>
        <h2>How did it go?</h2>
        <p className="pp-subtitle">Rate your experience with {founderName}&apos;s challenge</p>
      </div>

      {/* Show the challenge they completed */}
      {challengeAction && (
        <div className="pp-glass-card pp-fade-in-up pp-stagger-2" style={{ padding: 14, marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: '#6c757d', lineHeight: 1.5 }}>
            {challengeAction.length > 150 ? challengeAction.slice(0, 150) + '...' : challengeAction}
          </div>
        </div>
      )}

      {/* Rating scales */}
      {RATING_CONFIGS.map((config, i) => (
        <div key={config.key} className={`pp-rating-section pp-fade-in-up pp-stagger-${i + 3}`}>
          <div className="pp-rating-question">{config.question}</div>
          <div className="pp-rating-scale">
            {config.emojis.map((emoji, idx) => {
              const value = idx + 1
              return (
                <div
                  key={value}
                  className={`pp-rating-option ${ratings[config.key] === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(config.key, value)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleSelect(config.key, value))}
                >
                  <span className="pp-rating-emoji">{emoji}</span>
                  <span className="pp-rating-number">
                    {config.labels[idx] || value}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Submit */}
      <div className="pp-fade-in-up pp-stagger-6" style={{ marginTop: 8 }}>
        <button
          className="pp-btn-gold"
          disabled={!allRated}
          onClick={() => onRate(ratings)}
        >
          Save Rating
        </button>
      </div>
    </div>
  )
}
