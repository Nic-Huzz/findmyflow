/**
 * Success - Offer Builder completion celebration
 */

import { useNavigate } from 'react-router-dom'

function Success({ offerName, score }) {
  const navigate = useNavigate()

  return (
    <div className="success-step">
      <div className="success-icon">🎉</div>
      <h2>Grand Slam Offer Complete!</h2>

      <div className="success-summary">
        <p className="offer-name">"{offerName}"</p>
        <div className="final-score">
          <span className="score-label">Final Score:</span>
          <span className="score-value" style={{ color: score?.grade?.color }}>
            {score?.total} ({score?.grade?.letter})
          </span>
        </div>
      </div>

      <p className="success-message">
        Your offer is saved and ready to use. Now it's time to build your funnel
        and start attracting customers.
      </p>

      <div className="success-actions">
        <button
          className="primary-button"
          onClick={() => navigate('/lead-magnet-selection')}
        >
          Create Lead Magnet →
        </button>
        <button
          className="secondary-button"
          onClick={() => navigate('/funnel-builder')}
        >
          Build Funnel
        </button>
        <button
          className="secondary-button"
          onClick={() => navigate('/me')}
        >
          Back to Dashboard
        </button>
      </div>

      <div className="celebration-confetti">
        <span>🎊</span>
        <span>✨</span>
        <span>🌟</span>
        <span>💫</span>
        <span>🎊</span>
      </div>
    </div>
  )
}

export default Success
